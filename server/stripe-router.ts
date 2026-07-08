import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import Stripe from "stripe";
import {
  createTeacherBooking,
  updateTeacherBooking,
  getTeacherBookings,
  getTeacherProfile,
} from "./db-language-exchange";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia" as any,
    });
  }
  return _stripe;
}

export const stripeRouter = router({
  // Create checkout session for teacher booking
  createTeacherBookingCheckout: protectedProcedure
    .input(
      z.object({
        teacherId: z.number(),
        startTime: z.date(),
        duration: z.number(), // minutes
        topic: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const teacher = await getTeacherProfile(input.teacherId);
      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Calculate amount in cents
      const hourlyRateInCents = teacher.hourlyRate;
      const durationInHours = input.duration / 60;
      const amountInCents = Math.round(hourlyRateInCents * durationInHours);

      // Create booking record
      const booking = await createTeacherBooking({
        studentId: ctx.user.id,
        teacherId: input.teacherId,
        startTime: input.startTime,
        duration: input.duration,
        topic: input.topic,
        notes: input.notes,
        amount: amountInCents,
      });

      // Create Stripe checkout session
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Language Lesson with ${teacher.language}`,
                description: `${input.duration} minutes with teacher`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${ctx.req.headers.origin || "http://localhost:3000"}/teacher-booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ctx.req.headers.origin || "http://localhost:3000"}/teacher-booking/cancel`,
        customer_email: ctx.user.email || undefined,
        metadata: {
          bookingId: (booking as any).insertId?.toString() || "unknown",
          studentId: ctx.user.id.toString(),
          teacherId: input.teacherId.toString(),
          startTime: input.startTime.toISOString(),
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  // Confirm payment and update booking
  confirmTeacherBookingPayment: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const session = await getStripe().checkout.sessions.retrieve(input.sessionId);

      if (session.payment_status !== "paid") {
        throw new Error("Payment not completed");
      }

      const bookingId = parseInt(session.metadata?.bookingId || "0");
      if (!bookingId) {
        throw new Error("Invalid booking ID");
      }

      // Update booking with payment info
      await updateTeacherBooking(bookingId, {
        paymentStatus: "paid",
        stripePaymentIntentId: (session.payment_intent as string) || "",
        status: "confirmed",
      });

      return {
        success: true,
        bookingId,
      };
    }),

  // Get teacher's earnings
  getTeacherEarnings: protectedProcedure.query(async ({ ctx }) => {
    const teacher = await getTeacherProfile(ctx.user.id);
    if (!teacher) {
      return {
        totalEarnings: 0,
        totalSessions: 0,
        averageRating: 0,
      };
    }

    return {
      totalEarnings: teacher.totalEarnings || 0,
      totalSessions: teacher.totalStudents || 0,
      averageRating: teacher.rating || 0,
    };
  }),

  // Get teacher's bookings
  getTeacherBookingHistory: protectedProcedure.query(async ({ ctx }) => {
    const bookings = await getTeacherBookings(ctx.user.id, "teacher");
    return bookings;
  }),

  // Get student's bookings
  getStudentBookingHistory: protectedProcedure.query(async ({ ctx }) => {
    const bookings = await getTeacherBookings(ctx.user.id, "student");
    return bookings;
  }),

  // Webhook handler for Stripe events
  handleWebhook: publicProcedure
    .input(
      z.object({
        event: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const event = input.event;

      switch (event.type) {
        case "payment_intent.succeeded":
          // Payment succeeded - update booking
          const paymentIntent = event.data.object;
                    break;

        case "payment_intent.payment_failed":
          // Payment failed
                    break;

        case "charge.refunded":
          // Refund processed
                    break;

        default:
                }

      return { received: true };
    }),

  // Create Stripe Connect account for teacher
  createTeacherStripeAccount: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        country: z.string().default("US"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const account = await getStripe().accounts.create({
          type: "express",
          email: input.email,
          country: input.country,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        // Update teacher profile with Stripe account ID
        
        return {
          accountId: account.id,
          onboardingUrl: await getStripe().accountLinks.create({
            account: account.id,
            type: "account_onboarding",
            refresh_url: `${ctx.req.headers.origin || "http://localhost:3000"}/teacher/stripe/refresh`,
            return_url: `${ctx.req.headers.origin || "http://localhost:3000"}/teacher/stripe/return`,
          }),
        };
      } catch (error) {
                throw error;
      }
    }),

  // Get payment methods
  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    try {
      const paymentMethods = await getStripe().paymentMethods.list({
        type: "card",
      });

      return paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      }));
    } catch (error) {
            return [];
    }
  }),

  // Create refund
  createRefund: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        reason: z.enum(["requested_by_customer", "duplicate", "fraudulent"]),
      })
    )
    .mutation(async ({ input }) => {
      const bookings = await getTeacherBookings(input.bookingId, "student");
      const booking = Array.isArray(bookings) ? bookings[0] : bookings;
      if (!booking || !booking.stripePaymentIntentId) {
        throw new Error("Booking or payment not found");
      }

      try {
        const refund = await getStripe().refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          reason: input.reason,
        });

        // Update booking status
        const bookingId = booking.id;
        await updateTeacherBooking(bookingId, {
          paymentStatus: "refunded",
          status: "cancelled",
        });

        return {
          refundId: refund.id,
          amount: refund.amount,
          status: refund.status,
        };
      } catch (error) {
                throw error;
      }
    }),
});
