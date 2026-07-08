// @ts-nocheck
import Stripe from "stripe";
import { getDb } from "./db";
import { orders } from "../drizzle";
// Note: subscriptions table not yet defined in schema
import { eq } from "drizzle-orm";

// Initialize Stripe only if API key is provided
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

export const STRIPE_PLANS = {
  pro: { priceId: process.env.STRIPE_PRO_PRICE_ID || "", name: "Pro", price: 999 },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
    name: "Enterprise",
    price: 2999,
  },
};

// ─── CHECKOUT SESSIONS ──────────────────────────────────────────────────
export async function createCheckoutSession(
  orderId: number,
  userId: number,
  totalAmount: number,
  successUrl: string,
  cancelUrl: string
) {
  try {
    if (!stripe) throw new Error("Stripe not configured");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `SkyCoin4444 Order #${orderId}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: `order_${orderId}_user_${userId}`,
      metadata: {
        orderId: orderId.toString(),
        userId: userId.toString(),
      },
    });

    const db = await getDb();
    if (db) {
      await db
        .update(orders)
        .set({ stripeSessionId: session.id })
        .where(eq(orders.id, orderId));
    }

    return session;
  } catch (error) {
        throw error;
  }
}

// ─── SUBSCRIPTION MANAGEMENT ────────────────────────────────────────────
export async function createOrUpdateSubscription(
  userId: number,
  stripeCustomerId: string,
  plan: "pro" | "enterprise"
) {
  try {
    if (!stripe) throw new Error("Stripe not configured");
    const planConfig = STRIPE_PLANS[plan];
    if (!planConfig.priceId) {
      throw new Error(`Stripe price ID not configured for plan: ${plan}`);
    }

    const sub = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: planConfig.priceId }],
      metadata: {
        userId: userId.toString(),
        plan,
      },
    });

    const db = await getDb();
    if (db) {
      const subscription = sub as any;
      await db
        .update(subscriptions)
        .set({
          stripeSubscriptionId: subscription.id,
          plan: plan as any,
          status: "active",
          currentPeriodStart: new Date((subscription.current_period_start || 0) * 1000),
          currentPeriodEnd: new Date((subscription.current_period_end || 0) * 1000),
        })
        .where(eq(subscriptions.userId, userId));
    }

    return sub as any;
  } catch (error) {
        throw error;
  }
}

export async function cancelSubscription(userId: number) {
  try {
    if (!stripe) throw new Error("Stripe not configured");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (sub.length === 0 || !sub[0].stripeSubscriptionId) {
      throw new Error("Subscription not found");
    }

    await stripe.subscriptions.cancel(sub[0].stripeSubscriptionId);

    await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));
  } catch (error) {
        throw error;
  }
}

// ─── CUSTOMER MANAGEMENT ────────────────────────────────────────────────
export async function getOrCreateCustomer(userId: number, email: string, name?: string) {
  try {
    if (!stripe) throw new Error("Stripe not configured");
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    const customer = await stripe!.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString(),
      },
    });

    return customer;
  } catch (error) {
        throw error;
  }
}

// ─── WEBHOOK HANDLERS ───────────────────────────────────────────────────
export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    if (!stripe) return;
    const orderId = parseInt(session.metadata?.orderId || "0");
    const userId = parseInt(session.metadata?.userId || "0");

    if (!orderId || !userId) {
      throw new Error("Missing order or user ID in session metadata");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(orders)
      .set({ status: "paid" })
      .where(eq(orders.id, orderId));

      } catch (error) {
        throw error;
  }
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    if (!stripe) return;
    const customerId = invoice.customer as string;
    const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;

    if (!customer.metadata?.userId) {
      throw new Error("User ID not found in customer metadata");
    }

    const userId = parseInt(customer.metadata.userId);
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(subscriptions)
      .set({ status: "active" })
      .where(eq(subscriptions.userId, userId));

      } catch (error) {
        throw error;
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    if (!stripe) return;
    const customerId = subscription.customer as string;
    const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;

    if (!customer.metadata?.userId) {
      throw new Error("User ID not found in customer metadata");
    }

    const userId = parseInt(customer.metadata.userId);
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const status = subscription.status === "active" ? "active" : "past_due";
    const sub = subscription as any;

    await db
      .update(subscriptions)
      .set({
        status: status as any,
        currentPeriodStart: new Date((sub.current_period_start || 0) * 1000),
        currentPeriodEnd: new Date((sub.current_period_end || 0) * 1000),
      })
      .where(eq(subscriptions.userId, userId));

      } catch (error) {
        throw error;
  }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    if (!stripe) return;
    const customerId = subscription.customer as string;
    const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;

    if (!customer.metadata?.userId) {
      throw new Error("User ID not found in customer metadata");
    }

    const userId = parseInt(customer.metadata.userId);
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));

      } catch (error) {
        throw error;
  }
}

// ─── WEBHOOK SIGNATURE VERIFICATION ─────────────────────────────────────
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event | null {
  try {
    if (!stripe) return null;
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
        return null;
  }
}
