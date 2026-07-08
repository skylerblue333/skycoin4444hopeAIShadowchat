/**
 * SKYCOIN4444 Enterprise tRPC Router
 *
 * Exposes all Free Will Engine systems via tRPC procedures:
 *   - Economy Engine (token health, mint, burn, market state)
 *   - Security Engine (fraud reports, security health)
 *   - Behavior Engine (user archetypes, recommendations)
 *   - Governance Engine v2 (proposals, simulation, voting)
 *   - Free Will Engine (goals, action log, system snapshot)
 *   - Memory Graph Engine (graph snapshot, predictions)
 *   - Emergent Economy Engine (digital nation, sinks, patterns)
 *
 * All procedures use protectedProcedure (requires auth).
 * Admin-only procedures use adminProcedure.
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc.js";
import { economyEngine } from "./economy-engine.js";
import { securityEngine } from "./security-engine.js";
import { behaviorEngine } from "./behavior-engine.js";
import { governanceEngineV2 } from "./governance-engine-v2.js";
import { freeWillEngine } from "./free-will-engine.js";
import { memoryGraphEngine } from "./memory-graph-engine.js";
import { emergentEconomyEngine } from "./emergent-economy-engine.js";
import { ALL_TOKEN_SYMBOLS } from "../shared/tokenRegistry.js";
import type { TokenSymbol } from "./economy-engine.js";

// ─── Economy Sub-Router ───────────────────────────────────────────────────────

const economyRouter = router({
  healthReport: protectedProcedure.query(async () => {
    return economyEngine.getHealthReport();
  }),

  marketStates: protectedProcedure.query(async () => {
    return economyEngine.getMarketStates();
  }),

  emissionCaps: protectedProcedure.query(async () => {
    return economyEngine.getEmissionCaps();
  }),

  mint: adminProcedure
    .input(
      z.object({
        token: z.string(),
        userId: z.number().int().positive(),
        amount: z.number().positive().max(1_000_000),
        reason: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ input }) => {
      return economyEngine.mint(input.token as TokenSymbol, input.userId, input.amount, input.reason);
    }),

  burn: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        amount: z.number().positive().max(100_000),
        reason: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return economyEngine.burn(input.token as TokenSymbol, ctx.user.id, input.amount, input.reason);
    }),

  applySinkPressure: adminProcedure
    .input(z.object({ token: z.string(), multiplier: z.number().min(0.1).max(5) }))
    .mutation(async ({ input }) => {
      await economyEngine.applySinkPressure(input.token as TokenSymbol, input.multiplier);
      return { success: true };
    }),
});

// ─── Security Sub-Router ──────────────────────────────────────────────────────

const securityRouter = router({
  health: adminProcedure.query(async () => {
    return securityEngine.getSecurityHealth();
  }),

  fraudReport: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return securityEngine.getFraudReport(input.userId);
    }),

  myRiskScore: protectedProcedure.query(async ({ ctx }) => {
    const report = await securityEngine.getFraudReport(ctx.user.id);
    return { riskScore: report.riskScore, quarantineRecommended: report.quarantineRecommended };
  }),

  checkAction: protectedProcedure
    .input(z.object({ action: z.string(), maxPerMinute: z.number().int().min(1).max(1000).optional() }))
    .query(async ({ ctx, input }) => {
      return securityEngine.checkAction(ctx.user.id, input.action, input.maxPerMinute);
    }),
});

// ─── Behavior Sub-Router ──────────────────────────────────────────────────────

const behaviorRouter = router({
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    return behaviorEngine.getBehaviorProfile(ctx.user.id);
  }),

  myRecommendations: protectedProcedure.query(async ({ ctx }) => {
    return behaviorEngine.getAdaptiveRecommendations(ctx.user.id);
  }),

  recordSignal: protectedProcedure
    .input(z.object({ signalType: z.string().min(1).max(60), value: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      await behaviorEngine.recordSignal(ctx.user.id, input.signalType, input.value);
      return { success: true };
    }),

  computeArchetype: protectedProcedure.mutation(async ({ ctx }) => {
    return behaviorEngine.computeArchetype(ctx.user.id);
  }),

  retentionHealth: adminProcedure.query(async () => {
    return behaviorEngine.checkRetentionHealth();
  }),
});

// ─── Governance v2 Sub-Router ─────────────────────────────────────────────────

const governanceV2Router = router({
  proposals: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).optional() }))
    .query(async ({ input }) => {
      return governanceEngineV2.getProposals(input.limit ?? 20);
    }),

  simulate: protectedProcedure
    .input(z.object({ proposalId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      return governanceEngineV2.simulateProposal(input.proposalId);
    }),

  vote: protectedProcedure
    .input(
      z.object({
        proposalId: z.number().int().positive(),
        vote: z.enum(["for", "against"]),
        votingPower: z.number().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return governanceEngineV2.castVote(input.proposalId, ctx.user.id, input.vote, input.votingPower ?? 1);
    }),

  proposeAutonomously: adminProcedure
    .input(
      z.object({
        trigger: z.string().min(1),
        context: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await governanceEngineV2.proposeAutonomously(
        input.trigger,
        input.context,
        ctx.user.id
      );
      return { proposalId: id ?? null };
    }),

  health: protectedProcedure.query(async () => {
    return governanceEngineV2.getGovernanceHealth();
  }),
});

// ─── Free Will Sub-Router ─────────────────────────────────────────────────────

const freeWillRouter = router({
  goals: protectedProcedure.query(() => {
    return freeWillEngine.getGoals();
  }),

  actionLog: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).optional() }))
    .query(({ input }) => {
      return freeWillEngine.getActionLog(input.limit ?? 50);
    }),

  systemSnapshot: protectedProcedure.query(() => {
    return freeWillEngine.getSystemSnapshot();
  }),

  addGoal: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100),
        description: z.string().min(1).max(500),
        priority: z.enum(["critical", "high", "medium", "low"]),
        metric: z.string().min(1),
        targetValue: z.number(),
        actions: z.array(z.string()),
      })
    )
    .mutation(({ input }) => {
      freeWillEngine.addGoal({
        ...input,
        status: "active",
        currentValue: 0,
        progress: 0,
      });
      return { success: true };
    }),
});

// ─── Memory Graph Sub-Router ──────────────────────────────────────────────────

const memoryGraphRouter = router({
  snapshot: protectedProcedure.query(() => {
    return memoryGraphEngine.getSnapshot();
  }),

  predictions: protectedProcedure.query(async () => {
    return memoryGraphEngine.predictSystemState();
  }),

  loadHistory: adminProcedure
    .input(z.object({ windowHours: z.number().int().min(1).max(168).optional() }))
    .mutation(async ({ input }) => {
      await memoryGraphEngine.loadHistoricalMemory(input.windowHours ?? 24);
      return { success: true };
    }),
});

// ─── Emergent Economy Sub-Router ──────────────────────────────────────────────

const emergentRouter = router({
  digitalNationStatus: protectedProcedure.query(() => {
    return emergentEconomyEngine.getDigitalNationStatus();
  }),

  activeSinks: protectedProcedure.query(() => {
    return emergentEconomyEngine.getActiveSinks();
  }),

  detectedPatterns: protectedProcedure.query(() => {
    return emergentEconomyEngine.getDetectedPatterns();
  }),

  generatePolicy: adminProcedure.mutation(async () => {
    return emergentEconomyEngine.generateEconomicPolicy();
  }),

  createSink: adminProcedure
    .input(
      z.object({
        token: z.string(),
        trigger: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return emergentEconomyEngine.createEmergentSink(input.token as TokenSymbol, input.trigger);
    }),

  enactLaw: adminProcedure
    .input(z.object({ law: z.string().min(5).max(500) }))
    .mutation(({ input }) => {
      emergentEconomyEngine.enactLaw(input.law);
      return { success: true };
    }),
});

// ─── Root Enterprise Router ───────────────────────────────────────────────────

export const enterpriseRouter = router({
  economy: economyRouter,
  security: securityRouter,
  behavior: behaviorRouter,
  governanceV2: governanceV2Router,
  freeWill: freeWillRouter,
  memoryGraph: memoryGraphRouter,
  emergent: emergentRouter,
});
