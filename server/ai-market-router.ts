/**
 * AI Market Engine Router
 * tRPC procedures for the 5 AI agents, market signals, ICO stats, and
 * the live investor dashboard.
 */

import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  runAgentCycle,
  runAllAgents,
  getIcoStats,
  getRecentSignals,
  getAgentActivity,
  getAllAgents,
  getRarityHistory,
} from "./aiMarketEngine";
import { db } from "./db";
import { icoInvestorStats, marketSignals, aiMarketAgents } from "../drizzle";
import { eq, desc, sql } from "drizzle-orm";

export const aiMarketRouter = router({
  // ── ICO Stats (public — shown in banner and investor portal) ──────────────
  getIcoStats: publicProcedure.query(async () => {
    const stats = await getIcoStats();
    if (!stats) return null;
    return {
      totalRaisedUsd: parseFloat(stats.totalRaisedUsd),
      totalInvestors: stats.totalInvestors,
      tokenPriceUsd: parseFloat(stats.tokenPriceUsd),
      tokensSold: parseFloat(stats.tokensSold),
      tokensRemaining: parseFloat(stats.tokensRemaining),
      hardCapUsd: parseFloat(stats.hardCapUsd),
      softCapUsd: parseFloat(stats.softCapUsd),
      softCapReached: stats.softCapReached,
      currentRound: stats.currentRound,
      roundBonus: stats.roundBonus,
      rarityStatus: stats.rarityStatus,
      rarityLabel: stats.rarityLabel,
      rarityScore: stats.rarityScore,
      momentumScore: stats.momentumScore,
      sentimentScore: stats.sentimentScore,
      trendDirection: stats.trendDirection,
      priceChange24h: parseFloat(stats.priceChange24h),
      volumeUsd24h: parseFloat(stats.volumeUsd24h),
      rewardPoolSky: parseFloat(stats.rewardPoolSky),
      rewardDistributed: parseFloat(stats.rewardDistributed),
      rewardApy: parseFloat(stats.rewardApy),
      lastAgentCycleAt: stats.lastAgentCycleAt,
      lastRarityUpdateAt: stats.lastRarityUpdateAt,
      percentRaised: (parseFloat(stats.totalRaisedUsd) / parseFloat(stats.hardCapUsd)) * 100,
    };
  }),

  // ── All Agents (public) ───────────────────────────────────────────────────
  getAgents: publicProcedure.query(async () => {
    return getAllAgents();
  }),

  // ── Recent Market Signals (public) ───────────────────────────────────────
  getSignals: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      return getRecentSignals(input?.limit ?? 20);
    }),

  // ── Agent Activity Log (public) ───────────────────────────────────────────
  getActivity: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(30) }).optional())
    .query(async ({ input }) => {
      return getAgentActivity(input?.limit ?? 30);
    }),

  // ── Daily Rarity History (public) ─────────────────────────────────────────
  getRarityHistory: publicProcedure
    .input(z.object({ days: z.number().min(1).max(30).default(7) }).optional())
    .query(async ({ input }) => {
      return getRarityHistory(input?.days ?? 7);
    }),

  // ── Trigger Agent Cycle (protected — any logged-in user can trigger) ──────
  triggerCycle: protectedProcedure
    .input(z.object({ agentId: z.string().optional() }).optional())
    .mutation(async ({ input }) => {
      const result = await runAgentCycle(input?.agentId);
      return result;
    }),

  // ── Run All Agents (admin only) ───────────────────────────────────────────
  runAllAgents: adminProcedure.mutation(async () => {
    await runAllAgents();
    return { success: true, agentsRun: 5 };
  }),

  // ── Get signals by agent ──────────────────────────────────────────────────
  getSignalsByAgent: publicProcedure
    .input(z.object({ agentId: z.string(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(marketSignals)
        .where(eq(marketSignals.agentId, input.agentId))
        .orderBy(desc(marketSignals.createdAt))
        .limit(input.limit);
    }),

  // ── Update ICO stats (admin — for manual adjustments) ────────────────────
  updateIcoStats: adminProcedure
    .input(z.object({
      totalRaisedUsd: z.number().optional(),
      totalInvestors: z.number().optional(),
      tokenPriceUsd: z.number().optional(),
      currentRound: z.string().optional(),
      roundBonus: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const updates: Record<string, unknown> = {};
      if (input.totalRaisedUsd !== undefined) updates.total_raised_usd = input.totalRaisedUsd.toFixed(2);
      if (input.totalInvestors !== undefined) updates.total_investors = input.totalInvestors;
      if (input.tokenPriceUsd !== undefined) updates.token_price_usd = input.tokenPriceUsd.toFixed(6);
      if (input.currentRound !== undefined) updates.current_round = input.currentRound;
      if (input.roundBonus !== undefined) updates.round_bonus = input.roundBonus;

      if (Object.keys(updates).length > 0) {
        await db.execute(
          sql`UPDATE ico_investor_stats SET ${sql.raw(
            Object.entries(updates).map(([k, v]) => `\`${k}\` = ${JSON.stringify(v)}`).join(", ")
          )} WHERE id = 1`
        );
      }
      return { success: true };
    }),
});
