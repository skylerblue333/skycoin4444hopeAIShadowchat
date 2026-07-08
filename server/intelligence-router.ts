// ════════════════════════════════════════════════════════════════════════
// HOPE AI Intelligence Layer — tRPC router (controller layer)
// ────────────────────────────────────────────────────────────────────────
// Request handling + validation ONLY. All logic delegates to
// intelligence-engine.ts (services) and db-intelligence.ts (repository).
// Mounted in server/routers.ts as `intelligence`.
// ════════════════════════════════════════════════════════════════════════
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import * as repo from "./db-intelligence";
import * as engine from "./intelligence-engine";
import * as db from "./db";

const goalSchema = z.object({ id: z.string(), title: z.string(), status: z.string(), target: z.string().optional(), createdAt: z.number() });
const projectSchema = z.object({ id: z.string(), name: z.string(), status: z.string(), note: z.string().optional(), createdAt: z.number() });
const learningSchema = z.object({ id: z.string(), topic: z.string(), progress: z.number(), createdAt: z.number() });

// ── Twin memory ─────────────────────────────────────────────────────────
const twinRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return (await repo.ensureTwinMemory(ctx.user.id)) ?? null;
  }),

  update: protectedProcedure
    .input(
      z.object({
        summary: z.string().max(4000).optional(),
        goals: z.array(goalSchema).optional(),
        projects: z.array(projectSchema).optional(),
        preferences: z.record(z.string(), z.string()).optional(),
        finances: z.object({ currency: z.string().optional(), monthlyTarget: z.number().optional(), notes: z.string().optional() }).optional(),
        learning: z.array(learningSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return repo.updateTwinMemory(ctx.user.id, input);
    }),

  facts: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return repo.getTwinFacts(ctx.user.id, input?.limit ?? 50);
    }),

  remember: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(2000),
        kind: z.enum(["goal", "project", "preference", "finance", "learning", "fact", "event"]).default("fact"),
        source: z.string().max(64).default("chat"),
        confidence: z.number().min(0).max(100).default(80),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = await repo.addTwinFact({ userId: ctx.user.id, ...input });
      return { id, success: id !== null };
    }),

  forget: protectedProcedure.input(z.object({ factId: z.number() })).mutation(async ({ ctx, input }) => {
    await repo.deactivateTwinFact(ctx.user.id, input.factId);
    return { success: true };
  }),

  // The DB-grounded system prompt that the HOPE AI chat injects.
  buildContext: protectedProcedure.query(async ({ ctx }) => {
    return { context: await engine.buildTwinContext(ctx.user.id) };
  }),

  // Authenticated HOPE AI chat that reuses the existing emotional engine but
  // injects persistent, DB-grounded memory and persists the turn to history.
  chatGrounded: protectedProcedure
    .input(
      z.object({
        messageText: z.string().min(1).max(8000),
        conversationHistory: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(20).optional(),
        overrideTone: z.string().optional(),
        sessionId: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { inferEmotionalState, generateHopeResponse } = await import("./hope-ai-engine");
      const { saveHopeAIMessage } = await import("./db");
      const twinContext = await engine.buildTwinContext(ctx.user.id);
      const userSignals = {
        userId: String(ctx.user.id),
        messageText: input.messageText,
        conversationHistory: (input.conversationHistory ?? []).slice(-8),
        twinContext,
      };
      const analysis = inferEmotionalState(userSignals);
      const hopeResponse = await generateHopeResponse(userSignals, analysis, input.overrideTone as never);
      // Persist both turns to the existing chat history table (reliable, no loss).
      await saveHopeAIMessage({ userId: ctx.user.id, role: "user", content: input.messageText, sessionId: input.sessionId });
      await saveHopeAIMessage({
        userId: ctx.user.id,
        role: "assistant",
        content: hopeResponse.message,
        tone: hopeResponse.tone,
        emotionalState: analysis.inferredState,
        sessionId: input.sessionId,
      });
      // Refresh last-interaction so Mission Control reflects recency.
      await repo.ensureTwinMemory(ctx.user.id);
      return {
        message: hopeResponse.message,
        tone: hopeResponse.tone,
        emotionalState: analysis.inferredState,
        followUpPrompts: hopeResponse.followUpPrompts,
      };
    }),
});

// ── Mission Control (daily aggregator across the ecosystem) ───────────────
const missionControlRouter = router({
  today: protectedProcedure
    .input(z.object({ withSuggestions: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const [twin, reputation, matches, missionList, unread, feed, blueprints, extras, network] = await Promise.all([
        repo.ensureTwinMemory(userId),
        repo.getReputation(userId),
        repo.getMatchesForUser(userId, 5),
        repo.listMissions(userId),
        db.getUnreadNotificationCount(userId),
        db.getUserFeed(userId, 5, 0).catch(() => []),
        repo.listBlueprints(userId),
        repo.getMissionControlExtras(userId),
        repo.getProNetworkSuggestions(userId, 5),
      ]);

      const activeMissions = missionList.filter(m => m.status === "active");
      const openGoals = twin?.goals?.filter(g => g.status !== "done") ?? [];
      const topMatches = matches.filter(m => m.status !== "dismissed").slice(0, 5);

      // AI next-best-actions are opt-in (one LLM call) to keep the default load fast.
      let suggestions: string[] = [];
      if (input?.withSuggestions) {
        suggestions = await engine.generateDailySuggestions(userId, {
          activeMissions: activeMissions.length,
          unreadMessages: extras.unreadMessages,
          openGoals: openGoals.length,
          topOpportunity: topMatches[0]?.opportunity?.title,
        });
      }

      return {
        greetingName: ctx.user.name ?? "there",
        goals: openGoals,
        learning: twin?.learning ?? [],
        activeMissions,
        completedMissions: missionList.filter(m => m.status === "completed").length,
        reputation: reputation
          ? { overall: reputation.overall, learning: reputation.learningScore, builder: reputation.builderScore, teaching: reputation.teachingScore, community: reputation.communityScore, trust: reputation.trustScore }
          : null,
        topOpportunities: topMatches.map(m => ({ id: m.opportunityId, score: m.score, reasoning: m.reasoning, opportunity: m.opportunity })),
        unreadNotifications: unread,
        unreadMessages: extras.unreadMessages,
        communities: extras.communities,
        revenue: extras.revenue,
        recentActivity: Array.isArray(feed) ? feed.slice(0, 5) : [],
        blueprints: blueprints.length,
        networkSuggestions: network,
        suggestions,
      };
    }),
});

// ── Reputation ────────────────────────────────────────────────────────────
const reputationRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const existing = await repo.getReputation(ctx.user.id);
    if (existing) return existing;
    return engine.computeReputation(ctx.user.id);
  }),

  recompute: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await engine.computeReputation(ctx.user.id);
    if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not compute reputation." });
    return result;
  }),

  leaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      return repo.getReputationLeaderboard(input?.limit ?? 20);
    }),
});

// ── Opportunity Engine ─────────────────────────────────────────────────────
const opportunitiesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          type: z.enum(["job", "project", "investor", "cofounder", "mentor", "study_partner", "language_partner", "gig"]).optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return repo.listOpportunities({ type: input?.type, status: "open", limit: input?.limit ?? 50 });
    }),

  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["job", "project", "investor", "cofounder", "mentor", "study_partner", "language_partner", "gig"]),
        title: z.string().min(3).max(200),
        description: z.string().max(5000).optional(),
        skills: z.array(z.string()).max(30).optional(),
        tags: z.array(z.string()).max(30).optional(),
        location: z.string().max(120).optional(),
        remote: z.boolean().default(true),
        compensation: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = await repo.createOpportunity({ postedBy: ctx.user.id, ...input });
      return { id, success: id !== null };
    }),

  myMatches: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      return repo.getMatchesForUser(ctx.user.id, input?.limit ?? 30);
    }),

  // Pro-network: friends-of-friends graph suggestions ranked by mutual ties + reputation.
  network: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      return repo.getProNetworkSuggestions(ctx.user.id, input?.limit ?? 10);
    }),

  // Re-score open opportunities for the current user via the LLM matcher.
  refresh: protectedProcedure
    .input(
      z
        .object({
          type: z.enum(["job", "project", "investor", "cofounder", "mentor", "study_partner", "language_partner", "gig"]).optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const count = await engine.refreshMatches(ctx.user.id, input?.type);
      return { scored: count };
    }),

  setStatus: protectedProcedure
    .input(z.object({ opportunityId: z.number(), status: z.enum(["suggested", "saved", "applied", "dismissed"]) }))
    .mutation(async ({ ctx, input }) => {
      await repo.setMatchStatus(ctx.user.id, input.opportunityId, input.status);
      return { success: true };
    }),
});

// ── Learning Missions ───────────────────────────────────────────────────────
const missionsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return repo.listMissions(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    return repo.getMissionWithSteps(input.id, ctx.user.id);
  }),

  // Create a mission AND generate its step plan via the LLM in one call.
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(200),
        category: z.enum(["skill", "language", "startup", "career", "fitness", "custom"]).default("skill"),
        description: z.string().max(2000).optional(),
        generateSteps: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const missionId = await repo.createMission({ userId: ctx.user.id, title: input.title, category: input.category, description: input.description });
      if (!missionId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create mission." });
      if (input.generateSteps) {
        const steps = await engine.generateMissionSteps(input.title, input.category, input.description);
        await repo.insertMissionSteps(missionId, steps);
        await repo.recomputeMissionProgress(missionId);
      }
      return repo.getMissionWithSteps(missionId, ctx.user.id);
    }),

  toggleStep: protectedProcedure
    .input(z.object({ missionId: z.number(), stepId: z.number(), done: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Ownership check: the step must belong to a mission the user owns.
      const owned = await repo.getMissionWithSteps(input.missionId, ctx.user.id);
      if (!owned) throw new TRPCError({ code: "FORBIDDEN" });
      await repo.setMissionStepDone(input.stepId, input.done);
      const progress = await repo.recomputeMissionProgress(input.missionId);
      return progress;
    }),
});

// ── AI Startup Builder ──────────────────────────────────────────────────────
const startupRouter = router({
  generate: protectedProcedure.input(z.object({ idea: z.string().min(8).max(2000) })).mutation(async ({ ctx, input }) => {
    const out = await engine.generateStartup(input.idea);
    const id = await repo.createBlueprint({ userId: ctx.user.id, idea: input.idea, ...out });
    return { id, ...out };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return repo.listBlueprints(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const bp = await repo.getBlueprint(input.id, ctx.user.id);
    if (!bp) throw new TRPCError({ code: "NOT_FOUND" });
    return bp;
  }),
});

// ── AI Marketplace (user-listed agents/prompts/workflows) ────────────────────
const aiMarketplaceRouter = router({
  list: publicProcedure
    .input(z.object({ kind: z.enum(["agent", "prompt", "workflow", "template", "automation"]).optional(), limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ input }) => {
      return repo.listMarketListings({ kind: input?.kind, limit: input?.limit ?? 50 });
    }),

  create: protectedProcedure
    .input(
      z.object({
        kind: z.enum(["agent", "prompt", "workflow", "template", "automation"]),
        title: z.string().min(3).max(200),
        description: z.string().max(2000).optional(),
        content: z.string().min(1).max(20000),
        priceCents: z.number().min(0).max(100000000).default(0),
        tags: z.array(z.string()).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = await repo.createMarketListing({ sellerId: ctx.user.id, ...input });
      return { id, success: id !== null };
    }),

  // Buyer's spendable SKY444 balance (for the checkout UI).
  balance: protectedProcedure.query(async ({ ctx }) => {
    return { token: "SKY444", balance: await repo.getCoinBalance(ctx.user.id) };
  }),

  // Purchase settles in SKY444 (debit buyer, credit seller, record txns) then
  // grants access to the listing's content payload. Idempotent for re-buys.
  purchase: protectedProcedure.input(z.object({ listingId: z.number() })).mutation(async ({ ctx, input }) => {
    const listing = await repo.getListingFull(input.listingId);
    if (!listing || !listing.active) throw new TRPCError({ code: "NOT_FOUND" });
    if (listing.sellerId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You own this listing." });
    const already = await repo.hasPurchased(input.listingId, ctx.user.id);
    if (!already) {
      const settle = await repo.purchaseWithCoins({
        listingId: input.listingId,
        buyerId: ctx.user.id,
        sellerId: listing.sellerId,
        priceCents: listing.priceCents,
      });
      if (!settle.ok) throw new TRPCError({ code: "BAD_REQUEST", message: settle.reason ?? "Payment failed." });
    }
    return { success: true, content: listing.content, title: listing.title };
  }),

  // Owners/buyers can re-fetch purchased content.
  access: protectedProcedure.input(z.object({ listingId: z.number() })).query(async ({ ctx, input }) => {
    const listing = await repo.getListingFull(input.listingId);
    if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
    const owns = listing.sellerId === ctx.user.id || (await repo.hasPurchased(input.listingId, ctx.user.id));
    if (!owns) throw new TRPCError({ code: "FORBIDDEN", message: "Purchase required to access this content." });
    return { content: listing.content, title: listing.title };
  }),

  rate: protectedProcedure.input(z.object({ listingId: z.number(), stars: z.number().min(1).max(5) })).mutation(async ({ ctx, input }) => {
    const owns = await repo.hasPurchased(input.listingId, ctx.user.id);
    if (!owns) throw new TRPCError({ code: "FORBIDDEN", message: "Only buyers can rate a listing." });
    const recorded = await repo.addListingRating(input.listingId, ctx.user.id, input.stars);
    if (!recorded) throw new TRPCError({ code: "BAD_REQUEST", message: "You have already rated this purchase." });
    return { success: true };
  }),

  myPurchases: protectedProcedure.query(async ({ ctx }) => {
    return repo.getPurchases(ctx.user.id);
  }),
});

// ── Assembled intelligence router ────────────────────────────────────────────
export const intelligenceRouter = router({
  twin: twinRouter,
  missionControl: missionControlRouter,
  reputation: reputationRouter,
  opportunities: opportunitiesRouter,
  missions: missionsRouter,
  startup: startupRouter,
  aiMarketplace: aiMarketplaceRouter,
});
