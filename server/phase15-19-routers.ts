/**
 * PHASE 15–19 TRPC ROUTERS
 * Revenue Maximization, User Growth, Mobile Infrastructure,
 * Data Intelligence, Market Domination
 */
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";

// ── Phase 15: Revenue Maximization ────────────────────────────────────────────
import {
  creatorRevenueEngine,
  platformRevenueEngine,
  treasuryIntelligence,
} from "./phase15-revenue-maximization";

// ── Phase 16: User Growth ─────────────────────────────────────────────────────
import {
  referralEngine,
  viralGrowthEngine,
  networkExpansionEngine,
} from "./phase16-user-growth";

// ── Phase 17: Mobile Infrastructure ──────────────────────────────────────────
import {
  pushNotificationEngine,
  offlineCacheEngine,
  mediaCompressionEngine,
  mobileStreamingEngine,
  mobileAnalyticsEngine,
} from "./phase17-mobile-infrastructure";

// ── Phase 18: Data Intelligence ───────────────────────────────────────────────
import {
  intelligenceLayer,
  predictionLayer,
} from "./phase18-data-intelligence";

// ── Phase 19: Market Domination ───────────────────────────────────────────────
import {
  publicAPIManager,
  sdkRegistry,
  externalIntegrationEngine,
} from "./phase19-market-domination";

// ─── PHASE 15 ROUTERS ────────────────────────────────────────────────────────

export const creatorRevenueRouter = router({
  calculateAdSplit: protectedProcedure
    .input(z.object({ period: z.string(), totalAdRevenue: z.number(), impressions: z.number(), clicks: z.number() }))
    .mutation(({ input, ctx }) =>
      creatorRevenueEngine.calculateAdRevenueSplit(ctx.user.id, input.period, input.totalAdRevenue, input.impressions, input.clicks)
    ),

  createSubscriptionTier: protectedProcedure
    .input(z.object({
      name: z.string(),
      price: z.number(),
      currency: z.enum(["USD", "SKY444", "ETH"]),
      interval: z.enum(["monthly", "quarterly", "annual"]),
      perks: z.array(z.string()),
      maxSubscribers: z.number().optional(),
    }))
    .mutation(({ input, ctx }) =>
      creatorRevenueEngine.createSubscriptionTier({ ...input, creatorId: ctx.user.id, isActive: true })
    ),

  getSubscriptionTiers: protectedProcedure
    .query(({ ctx }) => creatorRevenueEngine.getSubscriptionTiers(ctx.user.id)),

  createPremiumVault: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      price: z.number(),
      currency: z.enum(["USD", "SKY444", "ETH"]),
      contentType: z.enum(["video", "audio", "document", "bundle", "course"]),
      contentUrl: z.string(),
      thumbnailUrl: z.string(),
    }))
    .mutation(({ input, ctx }) =>
      creatorRevenueEngine.createPremiumVault({ ...input, creatorId: ctx.user.id, isActive: true })
    ),

  purchaseVault: protectedProcedure
    .input(z.object({ vaultId: z.string() }))
    .mutation(({ input }) => creatorRevenueEngine.purchaseVault(input.vaultId)),

  createPPVStream: protectedProcedure
    .input(z.object({
      streamId: z.string(),
      title: z.string(),
      price: z.number(),
      currency: z.enum(["USD", "SKY444", "ETH"]),
      scheduledFor: z.date(),
    }))
    .mutation(({ input, ctx }) =>
      creatorRevenueEngine.createPPVStream({ ...input, creatorId: ctx.user.id, status: "scheduled" })
    ),

  createDigitalProduct: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      price: z.number(),
      currency: z.enum(["USD", "SKY444", "ETH"]),
      productType: z.enum(["ebook", "template", "preset", "plugin", "course", "nft_pack", "other"]),
      downloadUrl: z.string(),
      thumbnailUrl: z.string(),
    }))
    .mutation(({ input, ctx }) =>
      creatorRevenueEngine.createDigitalProduct({ ...input, creatorId: ctx.user.id, isActive: true })
    ),

  purchaseDigitalProduct: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(({ input }) => creatorRevenueEngine.purchaseDigitalProduct(input.productId)),

  createAffiliateLink: protectedProcedure
    .input(z.object({
      targetType: z.enum(["product", "community", "subscription", "stream", "nft"]),
      targetId: z.string(),
      code: z.string(),
      commissionRate: z.number(),
    }))
    .mutation(({ input, ctx }) =>
      creatorRevenueEngine.createAffiliateLink({ ...input, creatorId: ctx.user.id, isActive: true })
    ),

  sendTip: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      amount: z.number(),
      currency: z.enum(["USD", "SKY444", "ETH"]),
      message: z.string().optional(),
    }))
    .mutation(({ input, ctx }) =>
      creatorRevenueEngine.sendTip({ senderId: ctx.user.id, ...input })
    ),

  getCreatorTips: protectedProcedure
    .query(({ ctx }) => creatorRevenueEngine.getCreatorTips(ctx.user.id)),

  getTopTippers: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(({ input, ctx }) => creatorRevenueEngine.getTopTippers(ctx.user.id, input.limit)),
});

export const platformRevenueRouter = router({
  createAdCampaign: protectedProcedure
    .input(z.object({
      title: z.string(),
      budget: z.number(),
      adType: z.enum(["banner", "video", "sponsored_post", "promoted_stream", "promoted_community", "featured_nft", "creator_boost"]),
      cpm: z.number(),
      startDate: z.date(),
      endDate: z.date(),
      targetAudience: z.object({
        ageMin: z.number().optional(),
        ageMax: z.number().optional(),
        interests: z.array(z.string()).optional(),
        regions: z.array(z.string()).optional(),
      }).default({}),
    }))
    .mutation(({ input, ctx }) =>
      platformRevenueEngine.createAdCampaign({ ...input, advertiserId: ctx.user.id, status: "pending_review" })
    ),

  getActiveCampaigns: adminProcedure
    .query(() => platformRevenueEngine.getActiveCampaigns()),

  promoteContent: protectedProcedure
    .input(z.object({
      contentType: z.enum(["post", "stream", "community", "marketplace_listing", "nft", "creator"]),
      contentId: z.string(),
      budget: z.number(),
      boostMultiplier: z.number(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .mutation(({ input, ctx }) =>
      platformRevenueEngine.promoteContent({ ...input, promoterId: ctx.user.id, status: "active" })
    ),

  getTotalFees: adminProcedure
    .query(() => platformRevenueEngine.getTotalFees()),
});

export const treasuryRouter = router({
  captureSnapshot: adminProcedure
    .input(z.object({
      mrr: z.number(),
      arr: z.number(),
      totalRevenue: z.number(),
      totalPayouts: z.number(),
      netRevenue: z.number(),
      burnRate: z.number(),
      runway: z.number(),
      cashPosition: z.number(),
      tokenTreasuryUSD: z.number(),
      creatorPayoutRatio: z.number(),
      adConversionRevenue: z.number(),
      subscriptionRevenue: z.number(),
      transactionFeeRevenue: z.number(),
      nftRoyaltyRevenue: z.number(),
      sponsorshipRevenue: z.number(),
      growthRate: z.number(),
    }))
    .mutation(({ input }) => treasuryIntelligence.captureSnapshot(input)),

  getLatestSnapshot: adminProcedure
    .query(() => treasuryIntelligence.getLatestSnapshot()),

  getDashboardMetrics: adminProcedure
    .query(() => treasuryIntelligence.getDashboardMetrics()),

  scheduleCreatorPayout: adminProcedure
    .input(z.object({
      creatorId: z.number(),
      period: z.string(),
      subscriptionRevenue: z.number(),
      adRevenue: z.number(),
      tipRevenue: z.number(),
      ppvRevenue: z.number(),
      digitalProductRevenue: z.number(),
      sponsorshipRevenue: z.number(),
      affiliateRevenue: z.number(),
      platformFees: z.number(),
      netPayout: z.number(),
    }))
    .mutation(({ input }) => treasuryIntelligence.scheduleCreatorPayout(input)),

  processCreatorPayout: adminProcedure
    .input(z.object({ creatorId: z.number(), period: z.string() }))
    .mutation(({ input }) => treasuryIntelligence.processCreatorPayout(input.creatorId, input.period)),

  getPendingPayouts: adminProcedure
    .query(() => treasuryIntelligence.getPendingPayouts()),
});

// ─── PHASE 16 ROUTERS ────────────────────────────────────────────────────────

export const referralRouter = router({
  createCode: protectedProcedure
    .input(z.object({
      referrerType: z.enum(["user", "creator", "community", "nft_holder"]),
      referralType: z.enum(["standard", "creator", "affiliate", "community", "nft_bonus"]),
      code: z.string(),
      commissionRate: z.number(),
      bonusAmount: z.number(),
      bonusCurrency: z.enum(["USD", "SKY444"]),
      maxUses: z.number().optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(({ input, ctx }) =>
      referralEngine.createReferralCode({ ...input, referrerId: ctx.user.id, isActive: true })
    ),

  getMyReferralCodes: protectedProcedure
    .query(({ ctx }) => referralEngine.getUserReferralCodes(ctx.user.id)),

  recordConversion: publicProcedure
    .input(z.object({
      code: z.string(),
      refereeId: z.number(),
      conversionType: z.enum(["signup", "first_purchase", "subscription", "nft_mint", "creator_join"]),
      level: z.number().default(1),
    }))
    .mutation(({ input }) => referralEngine.recordConversion(input)),

  getMyReferralTree: protectedProcedure
    .query(({ ctx }) => referralEngine.getReferralTree(ctx.user.id)),

  getTopReferrers: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(({ input }) => referralEngine.getTopReferrers(input.limit)),
});

export const viralGrowthRouter = router({
  recordActivity: protectedProcedure
    .input(z.object({
      streakType: z.enum(["daily_login", "daily_post", "daily_stream", "daily_purchase", "daily_referral"]),
    }))
    .mutation(({ input, ctx }) => viralGrowthEngine.recordActivity(ctx.user.id, input.streakType)),

  getMyStreaks: protectedProcedure
    .query(({ ctx }) => viralGrowthEngine.getUserStreaks(ctx.user.id)),

  getActiveQuests: publicProcedure
    .query(() => viralGrowthEngine.getActiveQuests()),

  startQuest: protectedProcedure
    .input(z.object({ questId: z.string() }))
    .mutation(({ input, ctx }) => viralGrowthEngine.startQuest(ctx.user.id, input.questId)),

  updateQuestProgress: protectedProcedure
    .input(z.object({ questId: z.string(), action: z.string(), increment: z.number().default(1) }))
    .mutation(({ input, ctx }) =>
      viralGrowthEngine.updateQuestProgress(ctx.user.id, input.questId, input.action, input.increment)
    ),

  claimQuestReward: protectedProcedure
    .input(z.object({ questId: z.string() }))
    .mutation(({ input, ctx }) => viralGrowthEngine.claimQuestReward(ctx.user.id, input.questId)),

  getMyRewards: protectedProcedure
    .query(({ ctx }) => viralGrowthEngine.getUserRewards(ctx.user.id)),

  claimReward: protectedProcedure
    .input(z.object({ rewardId: z.string() }))
    .mutation(({ input }) => viralGrowthEngine.claimReward(input.rewardId)),

  getMyMilestones: protectedProcedure
    .query(({ ctx }) => viralGrowthEngine.getCreatorMilestones(ctx.user.id)),

  getActiveBoosts: protectedProcedure
    .query(({ ctx }) => viralGrowthEngine.getActiveBoosts(ctx.user.id)),

  getGrowthMetrics: adminProcedure
    .query(() => networkExpansionEngine.getGrowthMetrics()),

  getCommunityRecommendations: protectedProcedure
    .input(z.object({ interests: z.array(z.string()), currentCommunityIds: z.array(z.string()) }))
    .query(({ input, ctx }) =>
      networkExpansionEngine.generateCommunityRecommendations(ctx.user.id, input.interests, input.currentCommunityIds)
    ),

  getTrendingGrowthMap: publicProcedure
    .input(z.object({ period: z.string() }))
    .query(({ input }) => networkExpansionEngine.generateTrendingGrowthMap(input.period)),
});

// ─── PHASE 17 ROUTERS ────────────────────────────────────────────────────────

export const pushNotificationRouter = router({
  registerDevice: protectedProcedure
    .input(z.object({
      platform: z.enum(["ios", "android", "web"]),
      pushToken: z.string(),
      deviceModel: z.string(),
      osVersion: z.string(),
      appVersion: z.string(),
    }))
    .mutation(({ input, ctx }) =>
      pushNotificationEngine.registerDevice({ ...input, userId: ctx.user.id })
    ),

  deregisterDevice: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .mutation(({ input }) => pushNotificationEngine.deregisterDevice(input.deviceId)),

  setPreferences: protectedProcedure
    .input(z.object({
      social: z.boolean().optional(),
      creator: z.boolean().optional(),
      transaction: z.boolean().optional(),
      stream: z.boolean().optional(),
      community: z.boolean().optional(),
      marketing: z.boolean().optional(),
      gaming: z.boolean().optional(),
      quietHoursStart: z.number().optional(),
      quietHoursEnd: z.number().optional(),
      timezone: z.string().optional(),
    }))
    .mutation(({ input, ctx }) =>
      pushNotificationEngine.setNotificationPreferences(ctx.user.id, input)
    ),

  getPreferences: protectedProcedure
    .query(({ ctx }) => pushNotificationEngine.getNotificationPreferences(ctx.user.id)),

  getDeliveryStats: adminProcedure
    .query(() => pushNotificationEngine.getDeliveryStats()),

  createCampaign: adminProcedure
    .input(z.object({
      title: z.string(),
      body: z.string(),
      imageUrl: z.string().optional(),
      deepLink: z.string().optional(),
      targetSegment: z.enum(["all", "active_creators", "inactive_7d", "high_value", "new_users", "custom"]),
      scheduledFor: z.date().optional(),
    }))
    .mutation(({ input }) =>
      pushNotificationEngine.createCampaign({ ...input, status: "draft" })
    ),
});

export const mobileInfraRouter = router({
  cacheContent: protectedProcedure
    .input(z.object({
      contentType: z.enum(["feed", "profile", "community", "stream_metadata", "nft", "marketplace", "wallet"]),
      contentId: z.string(),
      data: z.unknown(),
    }))
    .mutation(({ input, ctx }) =>
      offlineCacheEngine.cacheContent(ctx.user.id, input.contentType, input.contentId, input.data)
    ),

  getCachedContent: protectedProcedure
    .input(z.object({
      contentType: z.enum(["feed", "profile", "community", "stream_metadata", "nft", "marketplace", "wallet"]),
      contentId: z.string(),
    }))
    .query(({ input, ctx }) =>
      offlineCacheEngine.getCachedContent(ctx.user.id, input.contentType, input.contentId)
    ),

  processSyncQueue: protectedProcedure
    .mutation(({ ctx }) => offlineCacheEngine.processSyncQueue(ctx.user.id)),

  submitCompressionJob: protectedProcedure
    .input(z.object({
      inputUrl: z.string(),
      mediaType: z.enum(["image", "video", "audio"]),
      inputSizeKB: z.number(),
      targetQuality: z.enum(["low", "medium", "high", "adaptive"]),
      targetPlatform: z.enum(["mobile", "desktop", "thumbnail", "preview"]),
    }))
    .mutation(({ input, ctx }) =>
      mediaCompressionEngine.submitJob({ ...input, userId: ctx.user.id })
    ),

  getCompressionStats: adminProcedure
    .query(() => mediaCompressionEngine.getCompressionStats()),

  createABRProfile: adminProcedure
    .input(z.object({ streamId: z.string() }))
    .mutation(({ input }) => mobileStreamingEngine.createABRProfile(input.streamId)),

  adaptStreamQuality: protectedProcedure
    .input(z.object({ streamId: z.string(), networkBandwidthKbps: z.number() }))
    .mutation(({ input }) =>
      mobileStreamingEngine.adaptQuality(input.streamId, input.networkBandwidthKbps)
    ),

  trackMobileEvent: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      eventType: z.string(),
      eventCategory: z.enum(["navigation", "interaction", "performance", "error", "conversion"]),
      properties: z.record(z.string(), z.unknown()),
      platform: z.enum(["ios", "android"]),
      appVersion: z.string(),
      screenName: z.string(),
    }))
    .mutation(({ input, ctx }) =>
      mobileAnalyticsEngine.trackEvent({ ...input, userId: ctx.user.id })
    ),

  getMobilePerformanceReport: adminProcedure
    .input(z.object({
      period: z.string(),
      platform: z.enum(["ios", "android", "both"]),
    }))
    .query(({ input }) =>
      mobileAnalyticsEngine.getPerformanceReport(input.period, input.platform)
    ),
});

// ─── PHASE 18 ROUTERS ────────────────────────────────────────────────────────

export const intelligenceRouter = router({
  getUserProfile: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => intelligenceLayer.getUserProfile(input.userId)),

  getMyAnalyticsProfile: protectedProcedure
    .query(({ ctx }) => intelligenceLayer.getUserProfile(ctx.user.id)),

  getCreatorProfile: protectedProcedure
    .input(z.object({ creatorId: z.number() }))
    .query(({ input }) => intelligenceLayer.getCreatorProfile(input.creatorId)),

  getTopCreators: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(({ input }) => intelligenceLayer.getTopCreatorsByRevenue(input.limit)),

  getTokenHistory: publicProcedure
    .input(z.object({ limit: z.number().default(30) }))
    .query(({ input }) => intelligenceLayer.getTokenHistory(input.limit)),

  getLatestTokenSnapshot: publicProcedure
    .query(() => intelligenceLayer.getLatestTokenSnapshot()),

  getRetentionCohorts: adminProcedure
    .input(z.object({ limit: z.number().default(12) }))
    .query(({ input }) => intelligenceLayer.getRetentionCohorts(input.limit)),

  getDashboard: adminProcedure
    .query(() => intelligenceLayer.getIntelligenceDashboard()),
});

export const predictionRouter = router({
  predictMyChurn: protectedProcedure
    .query(({ ctx }) => predictionLayer.predictChurn(ctx.user.id)),

  predictUserChurn: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => predictionLayer.predictChurn(input.userId)),

  getHighRiskUsers: adminProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(({ input }) => predictionLayer.getHighRiskUsers(input.limit)),

  predictVirality: protectedProcedure
    .input(z.object({
      contentId: z.string(),
      contentType: z.string(),
      initialEngagement: z.number(),
      creatorFollowers: z.number(),
    }))
    .query(({ input }) =>
      predictionLayer.predictVirality(input.contentId, input.contentType, input.initialEngagement, input.creatorFollowers)
    ),

  predictMySuccess: protectedProcedure
    .query(({ ctx }) => predictionLayer.predictCreatorSuccess(ctx.user.id)),

  predictFraud: adminProcedure
    .input(z.object({
      entityId: z.string(),
      entityType: z.enum(["user", "transaction", "nft", "campaign"]),
      signals: z.array(z.object({
        signal: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        value: z.unknown(),
      })),
    }))
    .mutation(({ input }) =>
      predictionLayer.predictFraud(input.entityId, input.entityType, input.signals as Parameters<typeof predictionLayer.predictFraud>[2])
    ),

  getFlaggedEntities: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(({ input }) => predictionLayer.getFlaggedEntities(input.limit)),

  predictTreasury: adminProcedure
    .input(z.object({
      currentMRR: z.number(),
      growthRate: z.number(),
      burnRate: z.number(),
      cashPosition: z.number(),
    }))
    .mutation(({ input }) =>
      predictionLayer.predictTreasury(input.currentMRR, input.growthRate, input.burnRate, input.cashPosition)
    ),

  getPredictionSummary: adminProcedure
    .query(() => predictionLayer.getPredictionSummary()),
});

// ─── PHASE 19 ROUTERS ────────────────────────────────────────────────────────

export const publicAPIRouter = router({
  createAPIKey: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string(),
      scopes: z.array(z.string()),
      rateLimit: z.number().default(1000),
      rateLimitWindow: z.enum(["minute", "hour", "day"]).default("hour"),
      webhookUrl: z.string().optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(({ input, ctx }) =>
      publicAPIManager.createAPIKey({
        ...input,
        ownerId: ctx.user.id,
        ownerType: "developer",
        scopes: input.scopes as Parameters<typeof publicAPIManager.createAPIKey>[0]["scopes"],
      })
    ),

  getMyAPIKeys: protectedProcedure
    .query(({ ctx }) => publicAPIManager.getOwnerAPIKeys(ctx.user.id)),

  revokeAPIKey: protectedProcedure
    .input(z.object({ apiKeyId: z.string() }))
    .mutation(({ input }) => publicAPIManager.revokeAPIKey(input.apiKeyId)),

  getUsageStats: protectedProcedure
    .input(z.object({ apiKeyId: z.string(), period: z.string() }))
    .query(({ input }) => publicAPIManager.getAPIUsageStats(input.apiKeyId, input.period)),

  getPlatformStats: adminProcedure
    .query(() => publicAPIManager.getPlatformAPIStats()),

  registerWebhook: protectedProcedure
    .input(z.object({ apiKeyId: z.string(), webhookUrl: z.string() }))
    .mutation(({ input }) => publicAPIManager.registerWebhook(input.apiKeyId, input.webhookUrl)),
});

export const sdkRouter = router({
  getLatestRelease: publicProcedure
    .input(z.object({ sdkType: z.enum(["typescript", "python", "mobile", "creator"]) }))
    .query(({ input }) => sdkRegistry.getLatestRelease(input.sdkType)),

  getAllReleases: publicProcedure
    .input(z.object({ sdkType: z.enum(["typescript", "python", "mobile", "creator"]).optional() }))
    .query(({ input }) => sdkRegistry.getAllReleases(input.sdkType)),

  getAdoptionStats: adminProcedure
    .query(() => sdkRegistry.getSDKAdoptionStats()),

  publishRelease: adminProcedure
    .input(z.object({
      sdkType: z.enum(["typescript", "python", "mobile", "creator"]),
      version: z.string(),
      changelog: z.string(),
      downloadUrl: z.string(),
      npmPackage: z.string().optional(),
      pypiPackage: z.string().optional(),
      checksumSha256: z.string(),
      isLatest: z.boolean(),
      isDeprecated: z.boolean(),
      releaseNotes: z.string(),
    }))
    .mutation(({ input }) => sdkRegistry.publishRelease(input)),
});

export const integrationsRouter = router({
  connect: protectedProcedure
    .input(z.object({
      platform: z.enum(["youtube", "twitch", "discord", "twitter_x", "coinbase", "opensea", "instagram", "tiktok"]),
      platformUserId: z.string(),
      platformUsername: z.string(),
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      tokenExpiresAt: z.date().optional(),
      scopes: z.array(z.string()),
      metadata: z.record(z.string(), z.unknown()).default({}),
    }))
    .mutation(({ input, ctx }) =>
      externalIntegrationEngine.connectIntegration({ ...input, syncEnabled: true, userId: ctx.user.id })
    ),

  disconnect: protectedProcedure
    .input(z.object({ integrationId: z.string() }))
    .mutation(({ input }) => externalIntegrationEngine.disconnectIntegration(input.integrationId)),

  getMyIntegrations: protectedProcedure
    .query(({ ctx }) => externalIntegrationEngine.getUserIntegrations(ctx.user.id)),

  syncYouTube: protectedProcedure
    .input(z.object({
      integrationId: z.string(),
      jobType: z.enum(["import_videos", "sync_subscribers", "cross_post", "import_analytics"]),
    }))
    .mutation(({ input, ctx }) => {
      const job = externalIntegrationEngine.queueYouTubeSync(ctx.user.id, input.integrationId, input.jobType);
      return externalIntegrationEngine.processYouTubeSync(job.id);
    }),

  syncTwitch: protectedProcedure
    .input(z.object({
      integrationId: z.string(),
      jobType: z.enum(["import_vods", "sync_followers", "import_clips", "sync_emotes"]),
    }))
    .mutation(({ input, ctx }) => {
      const job = externalIntegrationEngine.queueTwitchSync(ctx.user.id, input.integrationId, input.jobType);
      return externalIntegrationEngine.processTwitchSync(job.id);
    }),

  syncDiscord: protectedProcedure
    .input(z.object({
      integrationId: z.string(),
      guildId: z.string(),
      jobType: z.enum(["sync_members", "post_announcement", "sync_roles", "stream_notification"]),
    }))
    .mutation(({ input, ctx }) => {
      const job = externalIntegrationEngine.queueDiscordSync(ctx.user.id, input.integrationId, input.guildId, input.jobType);
      return externalIntegrationEngine.processDiscordSync(job.id);
    }),

  syncCoinbase: protectedProcedure
    .input(z.object({
      integrationId: z.string(),
      jobType: z.enum(["sync_balances", "import_transactions", "verify_payment"]),
    }))
    .mutation(({ input, ctx }) => {
      const job = externalIntegrationEngine.queueCoinbaseSync(ctx.user.id, input.integrationId, input.jobType);
      return externalIntegrationEngine.processCoinbaseSync(job.id);
    }),

  syncOpenSea: protectedProcedure
    .input(z.object({
      integrationId: z.string(),
      jobType: z.enum(["import_nfts", "sync_listings", "import_sales", "sync_collection"]),
    }))
    .mutation(({ input, ctx }) => {
      const job = externalIntegrationEngine.queueOpenSeaSync(ctx.user.id, input.integrationId, input.jobType);
      return externalIntegrationEngine.processOpenSeaSync(job.id);
    }),

  scheduleCrossPost: protectedProcedure
    .input(z.object({
      originalPostId: z.string(),
      platforms: z.array(z.object({
        platform: z.enum(["youtube", "twitch", "discord", "twitter_x", "coinbase", "opensea", "instagram", "tiktok"]),
        status: z.literal("pending"),
      })),
      content: z.string(),
      mediaUrls: z.array(z.string()),
      scheduledFor: z.date().optional(),
    }))
    .mutation(({ input, ctx }) =>
      externalIntegrationEngine.scheduleCrossPlatformPost({ ...input, userId: ctx.user.id })
    ),

  publishCrossPost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(({ input }) => externalIntegrationEngine.publishCrossPlatformPost(input.postId)),

  getIntegrationHealth: adminProcedure
    .query(() => externalIntegrationEngine.getIntegrationHealth()),
});
