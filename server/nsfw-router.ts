/**
 * NSFW Platform tRPC Router
 * Age verification, content gating, subscriptions, PPV, payouts
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import {
  verifyAge,
  checkContentAccess,
  createSubscription,
  cancelSubscription,
  requestPayout,
  getCreatorEarnings,
  getCreatorContentStats,
  SUBSCRIPTION_TIERS,
  PLATFORM_FEE_PERCENT,
} from "./nsfw-engine";

export const nsfwRouter = router({
  // ─── Age Verification ────────────────────────────────────────────────────
  verifyAge: protectedProcedure
    .input(
      z.object({
        method: z.enum(["dob", "id_upload", "credit_card"]),
        dob: z.string().optional(),
        idUrl: z.string().optional(),
        cardLast4: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return verifyAge(ctx.user!.id, input.method, {
        dob: input.dob,
        idUrl: input.idUrl,
        cardLast4: input.cardLast4,
      });
    }),

  // ─── Content Access Check ────────────────────────────────────────────────
  checkAccess: protectedProcedure
    .input(
      z.object({
        creatorId: z.number(),
        contentType: z.enum(["free", "subscription", "ppv"]),
        ppvPrice: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return checkContentAccess(
        ctx.user!.id,
        input.creatorId,
        input.contentType,
        input.ppvPrice
      );
    }),

  // ─── Subscription Tiers ──────────────────────────────────────────────────
  getDefaultTiers: publicProcedure.query(() => {
    return SUBSCRIPTION_TIERS;
  }),

  subscribe: protectedProcedure
    .input(
      z.object({
        creatorId: z.number(),
        tier: z.enum(["fan", "supporter", "vip", "elite"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createSubscription(ctx.user!.id, input.creatorId, input.tier);
    }),

  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return cancelSubscription(ctx.user!.id, input.subscriptionId);
    }),

  // ─── Creator Earnings ────────────────────────────────────────────────────
  getEarnings: protectedProcedure.query(async ({ ctx }) => {
    return getCreatorEarnings(ctx.user!.id);
  }),

  getContentStats: protectedProcedure.query(async ({ ctx }) => {
    return getCreatorContentStats(ctx.user!.id);
  }),

  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(50),
        method: z.enum(["bank", "crypto", "paypal"]),
        destination: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return requestPayout({
        creatorId: ctx.user!.id,
        amount: input.amount,
        method: input.method,
        address: input.destination,
      });
    }),

  // ─── Platform Info ───────────────────────────────────────────────────────
  platformFee: publicProcedure.query(() => ({
    platformFeePercent: PLATFORM_FEE_PERCENT,
    creatorKeepPercent: 1 - PLATFORM_FEE_PERCENT,
    payoutMinimum: 50,
    payoutCurrency: ["USD", "SKY444", "USDC"],
  })),
});
