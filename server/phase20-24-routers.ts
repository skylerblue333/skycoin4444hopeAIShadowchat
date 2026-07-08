/**
 * PHASE 20–24 tRPC ROUTERS
 * Attention Engine, Creator Empire, Economic Moat, AI Autonomy, Ecosystem Lock-In
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import {
  feedIntelligenceV2, addictionLoopsEngine, retentionAI,
} from "./phase20-attention-engine";
import {
  creatorCRM, hiringMarketplace, creatorExpansionEngine,
} from "./phase21-creator-empire";
import {
  tokenUtilityEngine, liquidityEngine, nftUtilityEngine,
} from "./phase22-economic-moat";
import {
  platformAgentRegistry, selfHealingEngine, aiDecisionLayer,
} from "./phase23-ai-autonomy";
import {
  unifiedIdentityEngine, crossSystemPersistence, migrationResistanceEngine,
} from "./phase24-ecosystem-lockin";

// ─── PHASE 20: ATTENTION ENGINE ROUTER ───────────────────────────────────────

export const attentionRouter = router({
  // Feed Intelligence V2
  rankFeed: protectedProcedure
    .input(z.object({ posts: z.array(z.any()) }))
    .query(({ ctx, input }) => feedIntelligenceV2.rankFeed(ctx.user.id, input.posts)),

  recordWatchTime: protectedProcedure
    .input(z.object({ postId: z.string(), creatorId: z.number(), seconds: z.number() }))
    .mutation(({ ctx, input }) => feedIntelligenceV2.recordWatchTime(ctx.user.id, input.postId, input.creatorId, input.seconds)),

  recordInteraction: protectedProcedure
    .input(z.object({ creatorId: z.number(), type: z.enum(["like", "comment", "share", "purchase", "subscribe", "tip"]) }))
    .mutation(({ ctx, input }) => feedIntelligenceV2.recordInteraction(ctx.user.id, input.creatorId, input.type as any)),

  getTopCreatorsByAffinity: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(({ ctx, input }) => feedIntelligenceV2.getTopCreatorsByAffinity(ctx.user.id, input.limit)),

  startSession: protectedProcedure
    .mutation(({ ctx }) => feedIntelligenceV2.startSession(ctx.user.id)),

  recordSessionView: protectedProcedure
    .input(z.object({ sessionId: z.string(), postId: z.string(), watchSeconds: z.number() }))
    .mutation(({ input }) => feedIntelligenceV2.recordSessionView(input.sessionId, input.postId, input.watchSeconds)),

  endSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => feedIntelligenceV2.endSession(input.sessionId)),

  getSessionMetrics: protectedProcedure
    .query(({ ctx }) => feedIntelligenceV2.getSessionMetrics(ctx.user.id)),

  // Addiction Loops
  getActiveDailyDrops: publicProcedure
    .query(() => addictionLoopsEngine.getActiveDailyDrops()),

  claimDailyDrop: protectedProcedure
    .input(z.object({ dropId: z.string() }))
    .mutation(({ ctx, input }) => addictionLoopsEngine.claimDailyDrop(ctx.user.id, input.dropId)),

  getEngagementLadder: protectedProcedure
    .query(({ ctx }) => addictionLoopsEngine.getOrCreateLadder(ctx.user.id)),

  getLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(({ input }) => addictionLoopsEngine.getLeaderboard(input.limit)),

  // Retention AI
  getRetentionDashboard: protectedProcedure
    .query(() => retentionAI.getRetentionDashboard()),
});

// ─── PHASE 21: CREATOR EMPIRE ROUTER ─────────────────────────────────────────

export const creatorEmpireRouter = router({
  // Creator CRM
  getFanProfile: protectedProcedure
    .input(z.object({ fanUserId: z.number() }))
    .query(({ ctx, input }) => creatorCRM.getFanProfile(ctx.user.id, input.fanUserId)),

  getCreatorFans: protectedProcedure
    .input(z.object({ segment: z.string().optional() }))
    .query(({ ctx, input }) => creatorCRM.getCreatorFans(ctx.user.id, input.segment)),

  createSubscriberSegment: protectedProcedure
    .input(z.object({
      name: z.string(), description: z.string(),
      segmentType: z.enum(["tier", "spend", "engagement", "location", "custom"]),
      criteria: z.record(z.string(), z.any()),
    }))
    .mutation(({ ctx, input }) => creatorCRM.createSubscriberSegment({ creatorId: ctx.user.id, ...input } as any)),

  createMonetizationFunnel: protectedProcedure
    .input(z.object({ funnelName: z.string(), stages: z.array(z.any()), isActive: z.boolean() }))
    .mutation(({ ctx, input }) => creatorCRM.createMonetizationFunnel({ creatorId: ctx.user.id, ...input })),

  generatePayoutForecast: protectedProcedure
    .input(z.object({ month: z.string(), historicalRevenue: z.record(z.string(), z.number()) }))
    .mutation(({ ctx, input }) => creatorCRM.generatePayoutForecast(ctx.user.id, input.month, input.historicalRevenue as Record<string, number>)),

  getPayoutForecast: protectedProcedure
    .input(z.object({ month: z.string() }))
    .query(({ ctx, input }) => creatorCRM.getPayoutForecast(ctx.user.id, input.month)),

  createCampaignPlanner: protectedProcedure
    .input(z.object({
      campaignName: z.string(), campaignType: z.string(),
      startDate: z.string(), endDate: z.string(),
      budget: z.number(), targetReach: z.number(), targetRevenue: z.number(),
      tasks: z.array(z.any()), platforms: z.array(z.string()),
    }))
    .mutation(({ ctx, input }) => creatorCRM.createCampaignPlanner({
      creatorId: ctx.user.id,
      campaignName: input.campaignName,
      campaignType: input.campaignType as any,
      status: "active",
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      budget: input.budget,
      targetReach: input.targetReach,
      targetRevenue: input.targetRevenue,
      tasks: input.tasks,
      platforms: input.platforms,
    })),

  // Hiring Marketplace
  postJob: protectedProcedure
    .input(z.object({
      title: z.string(), description: z.string(), jobType: z.string(),
      budget: z.number(), budgetType: z.string(), currency: z.string(),
      skills: z.array(z.string()), experienceLevel: z.string(), duration: z.string(),
      expiresAt: z.string(),
    }))
    .mutation(({ ctx, input }) => hiringMarketplace.postJob({
      creatorId: ctx.user.id,
      title: input.title, description: input.description, jobType: input.jobType as any,
      budget: input.budget, budgetType: input.budgetType as any, currency: input.currency as any,
      skills: input.skills, experienceLevel: input.experienceLevel as any, duration: input.duration as any,
      status: "open", expiresAt: new Date(input.expiresAt),
    })),

  getOpenJobs: publicProcedure
    .input(z.object({ jobType: z.string().optional() }))
    .query(({ input }) => hiringMarketplace.getOpenJobs(input.jobType as any)),

  applyToJob: protectedProcedure
    .input(z.object({ jobId: z.string(), coverLetter: z.string(), proposedRate: z.number() }))
    .mutation(({ ctx, input }) => hiringMarketplace.applyToJob({ jobId: input.jobId, applicantId: ctx.user.id, coverLetter: input.coverLetter, proposedRate: input.proposedRate })),

  getCreatorTeam: protectedProcedure
    .query(({ ctx }) => hiringMarketplace.getCreatorTeam(ctx.user.id)),

  // Creator Expansion
  queueSyndication: protectedProcedure
    .input(z.object({ contentId: z.string(), contentType: z.string(), targetPlatforms: z.array(z.string()) }))
    .mutation(({ ctx, input }) => creatorExpansionEngine.queueSyndication({
      creatorId: ctx.user.id, contentId: input.contentId, contentType: input.contentType as any,
      targetPlatforms: input.targetPlatforms as any,
    })),

  queueAutoClip: protectedProcedure
    .input(z.object({ streamId: z.string(), streamDurationSeconds: z.number() }))
    .mutation(({ ctx, input }) => creatorExpansionEngine.queueAutoClip(ctx.user.id, input.streamId, input.streamDurationSeconds)),

  queueAutoTranslation: protectedProcedure
    .input(z.object({ contentId: z.string(), contentType: z.string(), sourceLang: z.string(), targetLangs: z.array(z.string()), sourceText: z.string() }))
    .mutation(({ ctx, input }) => creatorExpansionEngine.queueAutoTranslation(ctx.user.id, input.contentId, input.contentType as any, input.sourceLang, input.targetLangs, input.sourceText)),
});

// ─── PHASE 22: ECONOMIC MOAT ROUTER ──────────────────────────────────────────

export const economicMoatRouter = router({
  // Token Utility
  recordTokenAction: protectedProcedure
    .input(z.object({ actionType: z.string(), amount: z.number(), currency: z.string(), targetId: z.string().optional(), targetType: z.string().optional() }))
    .mutation(({ ctx, input }) => tokenUtilityEngine.recordAction({
      actionType: input.actionType as any, userId: ctx.user.id as any,
      amount: input.amount, currency: input.currency as any,
      targetId: input.targetId, targetType: input.targetType as any,
    })),

  getTokenVelocity: publicProcedure
    .input(z.object({ currency: z.string() }))
    .query(({ input }) => tokenUtilityEngine.getTokenVelocity(input.currency)),

  getGovernanceToken: protectedProcedure
    .query(({ ctx }) => tokenUtilityEngine.getGovernanceToken(ctx.user.id)),

  getActiveProposals: publicProcedure
    .query(() => tokenUtilityEngine.getActiveProposals()),

  castVote: protectedProcedure
    .input(z.object({ proposalId: z.string(), vote: z.enum(["for", "against", "abstain"]), comment: z.string().optional() }))
    .mutation(({ ctx, input }) => tokenUtilityEngine.castVote(input.proposalId, ctx.user.id, input.vote, input.comment)),

  // Liquidity Engine
  getLiquidityPools: publicProcedure
    .query(() => liquidityEngine.getAllPools()),

  addLiquidity: protectedProcedure
    .input(z.object({ poolId: z.string(), amountA: z.number(), amountB: z.number() }))
    .mutation(({ ctx, input }) => liquidityEngine.addLiquidity(input.poolId, ctx.user.id, input.amountA, input.amountB)),

  removeLiquidity: protectedProcedure
    .input(z.object({ poolId: z.string(), lpTokens: z.number() }))
    .mutation(({ ctx, input }) => liquidityEngine.removeLiquidity(input.poolId, ctx.user.id, input.lpTokens)),

  stakeTokens: protectedProcedure
    .input(z.object({ poolId: z.string(), amount: z.number(), lockDays: z.number() }))
    .mutation(({ ctx, input }) => liquidityEngine.stakeTokens(input.poolId, ctx.user.id, input.amount, input.lockDays)),

  claimStakingRewards: protectedProcedure
    .input(z.object({ poolId: z.string() }))
    .mutation(({ ctx, input }) => liquidityEngine.claimRewards(input.poolId, ctx.user.id)),

  // NFT Utility
  checkNFTAccess: protectedProcedure
    .input(z.object({ accessType: z.enum(["content", "event", "game"]), resourceId: z.string() }))
    .query(({ ctx, input }) => nftUtilityEngine.checkAccess(ctx.user.id, input.accessType, input.resourceId)),

  getUserNFTPasses: protectedProcedure
    .query(({ ctx }) => nftUtilityEngine.getHolderPasses(ctx.user.id)),

  getCreatorMemberships: protectedProcedure
    .query(({ ctx }) => nftUtilityEngine.getCreatorMemberships(ctx.user.id)),

  getEconomicMoatMetrics: publicProcedure
    .query(() => nftUtilityEngine.getEconomicMoatMetrics()),
});

// ─── PHASE 23: AI AUTONOMY ROUTER ────────────────────────────────────────────

export const aiAutonomyRouter = router({
  // Platform Agent Registry
  getAgentDashboard: protectedProcedure
    .query(() => platformAgentRegistry.getAgentDashboard()),

  getAllAgents: protectedProcedure
    .query(() => platformAgentRegistry.getAllAgents()),

  getAgentsByType: protectedProcedure
    .input(z.object({ agentType: z.string() }))
    .query(({ input }) => platformAgentRegistry.getAgentsByType(input.agentType as any)),

  pauseAgent: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .mutation(({ input }) => platformAgentRegistry.pauseAgent(input.agentId)),

  resumeAgent: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .mutation(({ input }) => platformAgentRegistry.resumeAgent(input.agentId)),

  // Self-Healing Engine
  getActiveAnomalies: protectedProcedure
    .input(z.object({ severity: z.string().optional() }))
    .query(({ input }) => selfHealingEngine.getActiveAnomalies(input.severity as any)),

  getRollbackHistory: protectedProcedure
    .input(z.object({ service: z.string().optional() }))
    .query(({ input }) => selfHealingEngine.getRollbackHistory(input.service)),

  getActiveContainments: protectedProcedure
    .input(z.object({ targetType: z.string().optional() }))
    .query(({ input }) => selfHealingEngine.getActiveContainments(input.targetType as any)),

  getCostOptimizationSummary: protectedProcedure
    .query(() => selfHealingEngine.getCostOptimizationSummary()),

  // AI Decision Layer
  makeDecision: protectedProcedure
    .input(z.object({
      category: z.enum(["content_surfacing", "creator_recommendation", "economic_action", "fraud_escalation", "payout_optimization", "community_action"]),
      context: z.record(z.string(), z.any()),
      options: z.array(z.string()).optional(),
    }))
    .mutation(({ input }) => aiDecisionLayer.makeDecision({ category: input.category, context: input.context as Record<string, unknown>, options: input.options })),

  getDecisionAccuracy: protectedProcedure
    .query(() => aiDecisionLayer.getDecisionAccuracy()),
});

// ─── PHASE 24: ECOSYSTEM LOCK-IN ROUTER ──────────────────────────────────────

export const ecosystemLockInRouter = router({
  // Unified Identity
  getMyIdentity: protectedProcedure
    .query(({ ctx }) => unifiedIdentityEngine.getIdentity(ctx.user.id)),

  updateIdentity: protectedProcedure
    .input(z.object({
      displayName: z.string().optional(),
      bio: z.string().optional(),
      socialLinks: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(({ ctx, input }) => unifiedIdentityEngine.upsertIdentity({ userId: ctx.user.id, ...input } as any)),

  linkWallet: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .mutation(({ ctx, input }) => unifiedIdentityEngine.linkWallet(ctx.user.id, input.walletAddress)),

  searchIdentities: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(20) }))
    .query(({ input }) => unifiedIdentityEngine.searchIdentities(input.query, input.limit)),

  getVerifications: protectedProcedure
    .query(({ ctx }) => unifiedIdentityEngine.getVerifications(ctx.user.id)),

  // Cross-System Persistence
  getActivityGraph: protectedProcedure
    .query(({ ctx }) => crossSystemPersistence.getActivityGraph(ctx.user.id)),

  getEntityLinks: protectedProcedure
    .input(z.object({ system: z.string().optional() }))
    .query(({ ctx, input }) => crossSystemPersistence.getEntityLinks(ctx.user.id, input.system)),

  getPlatformValueScore: protectedProcedure
    .query(({ ctx }) => crossSystemPersistence.calculatePlatformValueScore(ctx.user.id)),

  getTopValueUsers: publicProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(({ input }) => crossSystemPersistence.getTopValueUsers(input.limit)),

  // Migration Resistance
  requestVaultExport: protectedProcedure
    .input(z.object({ exportType: z.enum(["full", "content", "audience", "monetization", "trust"]) }))
    .mutation(({ ctx, input }) => migrationResistanceEngine.requestVaultExport(ctx.user.id, input.exportType)),

  getMyExports: protectedProcedure
    .query(({ ctx }) => migrationResistanceEngine.getCreatorExports(ctx.user.id)),

  getAudienceGraph: protectedProcedure
    .query(({ ctx }) => {
      const existing = migrationResistanceEngine.getAudienceGraph(ctx.user.id);
      return existing ?? migrationResistanceEngine.generateAudienceGraph(ctx.user.id);
    }),

  getMonetizationHistory: protectedProcedure
    .query(({ ctx }) => migrationResistanceEngine.getMonetizationHistory(ctx.user.id)),

  getContentOwnershipProofs: protectedProcedure
    .query(({ ctx }) => migrationResistanceEngine.getCreatorContentProofs(ctx.user.id)),

  getTrustHistory: protectedProcedure
    .query(({ ctx }) => {
      const existing = migrationResistanceEngine.getTrustHistory(ctx.user.id);
      return existing ?? migrationResistanceEngine.buildTrustHistory(ctx.user.id);
    }),

  getEcosystemLockInMetrics: publicProcedure
    .query(() => migrationResistanceEngine.getEcosystemLockInMetrics()),
});
