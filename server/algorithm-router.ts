import crypto from 'crypto';
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  recommendationEngine,
  trendingEngine,
  fraudDetectionEngine,
  abTestingEngine,
  feedRankingEngine,
  type UserSignals,
  type ContentItem,
} from "./algorithm-engine";

// Helper: build mock user signals from authenticated user
function buildUserSignals(userId: string, overrides: Partial<UserSignals> = {}): UserSignals {
  return {
    userId,
    sessionDuration: 300,
    scrollDepth: 0.6,
    clickRate: 5,
    contentTypes: ["post", "video"],
    followedCreators: [],
    likedCategories: ["crypto", "tech", "art"],
    purchaseHistory: [],
    stakingAmount: 0,
    reputationScore: 50,
    lastActiveAt: new Date(),
    deviceType: "desktop",
    region: "US",
    ...overrides,
  };
}

// Helper: build mock content items for demo
function buildMockContent(count = 20): ContentItem[] {
  const types: ContentItem["type"][] = ["post", "video", "reel", "nft", "stream", "article"];
  const categories = ["crypto", "tech", "art", "music", "gaming", "lifestyle", "finance"];
  return Array.from({ length: count }, (_, i) => ({
    id: `content-${i + 1}`,
    type: types[i % types.length],
    creatorId: `creator-${(i % 5) + 1}`,
    categories: [categories[i % categories.length], categories[(i + 2) % categories.length]],
    tags: [`tag${i}`, `tag${i + 1}`],
    engagementScore: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100),
    recencyScore: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100),
    qualityScore: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100),
    createdAt: new Date(Date.now() - (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 7 * 24 * 60 * 60 * 1000),
    views: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100000),
    likes: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 5000),
    comments: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 500),
    shares: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 200),
    watchTime: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 600),
  }));
}

export const algorithmRouter = router({
  /**
   * Get personalized feed recommendations for the current user
   */
  getRecommendations: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      contentTypes: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userSignals = buildUserSignals(String(ctx.user.id), {
        contentTypes: input.contentTypes || ["post", "video", "reel"],
      });
      const candidates = buildMockContent(100);
      const result = recommendationEngine.recommend(userSignals, candidates, input.limit);
      return {
        items: result.items.map(r => ({
          id: r.item.id,
          type: r.item.type,
          creatorId: r.item.creatorId,
          categories: r.item.categories,
          score: r.score,
          reason: r.reason,
          engagementScore: r.item.engagementScore,
          views: r.item.views,
          likes: r.item.likes,
        })),
        algorithm: result.algorithm,
        computedAt: result.computedAt,
      };
    }),

  /**
   * Get trending content for a time window
   */
  getTrending: publicProcedure
    .input(z.object({
      window: z.enum(["1h", "6h", "24h", "7d"]).default("24h"),
      limit: z.number().min(1).max(100).default(50),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const candidates = buildMockContent(200);
      const filtered = input.category
        ? candidates.filter(c => c.categories.includes(input.category!))
        : candidates;
      const result = trendingEngine.getTrending(filtered, input.window, input.limit);
      return result;
    }),

  /**
   * Get ranked feed for the current user
   */
  getRankedFeed: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      personalizedWeight: z.number().min(0).max(1).default(0.5),
      trendingWeight: z.number().min(0).max(1).default(0.3),
      freshWeight: z.number().min(0).max(1).default(0.2),
    }))
    .query(async ({ ctx, input }) => {
      const userSignals = buildUserSignals(String(ctx.user.id));
      const candidates = buildMockContent(200);
      const ranked = feedRankingEngine.rankFeed(userSignals, candidates, {
        personalizedWeight: input.personalizedWeight,
        trendingWeight: input.trendingWeight,
        freshWeight: input.freshWeight,
        limit: input.limit,
      });
      return {
        items: ranked.map(item => ({
          id: item.id,
          type: item.type,
          creatorId: item.creatorId,
          categories: item.categories,
          engagementScore: item.engagementScore,
          views: item.views,
          likes: item.likes,
          createdAt: item.createdAt,
        })),
        count: ranked.length,
      };
    }),

  /**
   * Analyze a user for fraud signals (admin only)
   */
  analyzeFraud: protectedProcedure
    .input(z.object({
      targetUserId: z.string().optional(),
      clickRate: z.number().optional(),
      messageCount: z.number().optional(),
      transactionCount: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = input.targetUserId || String(ctx.user.id);
      const userSignals = buildUserSignals(userId, {
        clickRate: input.clickRate || 5,
      });
      const signal = fraudDetectionEngine.analyze(userSignals, {
        messageCount: input.messageCount,
        transactionCount: input.transactionCount,
      });
      return signal;
    }),

  /**
   * Get A/B test variant assignment for the current user
   */
  getABVariant: publicProcedure
    .input(z.object({
      testId: z.string(),
      userId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = String(input.userId || (ctx as any).user?.id || "anonymous");
      const variant = abTestingEngine.assignVariant(userId, input.testId);
      return variant;
    }),

  /**
   * Get all A/B test configs for the current user
   */
  getUserABConfig: publicProcedure
    .input(z.object({
      userId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = String(input.userId || (ctx as any).user?.id || "anonymous");
      const config = abTestingEngine.getUserConfig(userId);
      return config;
    }),

  /**
   * Get all running A/B tests (admin)
   */
  getRunningTests: publicProcedure
    .query(async () => {
      return abTestingEngine.getRunningTests();
    }),

  /**
   * Record a conversion event for an A/B test
   */
  recordConversion: protectedProcedure
    .input(z.object({
      testId: z.string(),
      metric: z.string(),
      value: z.number().default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      abTestingEngine.recordConversion(String(ctx.user.id), input.testId, input.metric, input.value);
      return { success: true };
    }),

  /**
   * Check a transaction for fraud
   */
  checkTransaction: protectedProcedure
    .input(z.object({
      amount: z.number(),
      currency: z.string().default("USD"),
      ipAddress: z.string().default("0.0.0.0"),
      transactionCount24h: z.number().default(0),
      accountAgeHours: z.number().default(720),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = fraudDetectionEngine.checkTransaction({
        userId: String(ctx.user.id),
        amount: input.amount,
        currency: input.currency,
        ipAddress: input.ipAddress,
        previousIpAddresses: [],
        transactionCount24h: input.transactionCount24h,
        accountAgeHours: input.accountAgeHours,
      });
      return result;
    }),
});
