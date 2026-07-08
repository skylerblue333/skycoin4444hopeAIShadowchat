/**
 * Orchestrator Router
 * Exposes the Manius Orchestrator (CEO Brain) via tRPC.
 * Routes: orchestrator.status | orchestrator.userIntelligence | orchestrator.decisionLog | orchestrator.runCycle
 */

import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc.js";
import { maniusOrchestrator } from "./manius-orchestrator.js";

export const orchestratorRouter = router({
  /** Platform-wide intelligence state */
  status: protectedProcedure.query(async () => {
    return maniusOrchestrator.getPlatformState();
  }),

  /** Per-user intelligence context */
  userIntelligence: protectedProcedure.query(async ({ ctx }) => {
    return maniusOrchestrator.getUserIntelligence(ctx.user.id);
  }),

  /** Recommended actions for the current user */
  myActions: protectedProcedure.query(async ({ ctx }) => {
    const intel = await maniusOrchestrator.getUserIntelligence(ctx.user.id);
    return intel;
  }),

  /** Trigger a full orchestrator cycle (admin only) */
  runCycle: adminProcedure.mutation(async () => {
    await maniusOrchestrator.runCycle();
    return { ok: true, timestamp: Date.now() };
  }),

  /** Decision log — last N orchestrator actions */
  decisionLog: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const state = maniusOrchestrator.getPlatformState();
      if (!state) {
        return { platformScore: 0, recommendations: [], limit: input.limit, timestamp: Date.now() };
      }
      return {
        platformScore: state.platformScore,
        recommendations: state.recommendations,
        limit: input.limit,
        timestamp: state.timestamp,
      };
    }),
});
