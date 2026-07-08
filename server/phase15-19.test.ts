/**
 * PHASE 15–19 TEST SUITE
 * Revenue Maximization, User Growth, Mobile Infrastructure,
 * Data Intelligence, Market Domination
 */
import { describe, it, expect, beforeEach } from "vitest";

// Phase 15
import {
  creatorRevenueEngine,
  platformRevenueEngine,
  treasuryIntelligence,
} from "./phase15-revenue-maximization";

// Phase 16
import {
  referralEngine,
  viralGrowthEngine,
  networkExpansionEngine,
} from "./phase16-user-growth";

// Phase 17
import {
  pushNotificationEngine,
  offlineCacheEngine,
  mediaCompressionEngine,
  mobileStreamingEngine,
  mobileAnalyticsEngine,
} from "./phase17-mobile-infrastructure";

// Phase 18
import {
  intelligenceLayer,
  predictionLayer,
} from "./phase18-data-intelligence";

// Phase 19
import {
  publicAPIManager,
  sdkRegistry,
  externalIntegrationEngine,
} from "./phase19-market-domination";

// ─── PHASE 15A: CREATOR REVENUE ENGINE ──────────────────────────────────────

describe("Phase 15A: Ad Revenue Splits", () => {
  it("calculates 70/30 split correctly", () => {
    const split = creatorRevenueEngine.calculateAdRevenueSplit(1, "2024-01", 1000, 50000, 1500);
    expect(split.creatorShare).toBe(700);
    expect(split.platformCut).toBe(300);
    expect(split.cpm).toBeGreaterThan(0);
    expect(split.ctr).toBeGreaterThan(0);
    expect(split.paidOut).toBe(false);
  });

  it("marks ad revenue as paid", () => {
    creatorRevenueEngine.calculateAdRevenueSplit(2, "2024-01", 500, 20000, 400);
    const paid = creatorRevenueEngine.markAdRevenuePaid(2, "2024-01");
    expect(paid).not.toBeNull();
    expect(paid!.paidOut).toBe(true);
    expect(paid!.settledAt).toBeInstanceOf(Date);
  });
});

describe("Phase 15A: Subscription Tiers", () => {
  it("creates a subscription tier", () => {
    const tier = creatorRevenueEngine.createSubscriptionTier({
      creatorId: 10,
      name: "Gold",
      price: 9.99,
      currency: "USD",
      interval: "monthly",
      perks: ["exclusive posts", "early access"],
      isActive: true,
    });
    expect(tier.id).toBeDefined();
    expect(tier.subscriberCount).toBe(0);
    expect(tier.mrr).toBe(0);
  });

  it("updates subscriber count and MRR", () => {
    const tier = creatorRevenueEngine.createSubscriptionTier({
      creatorId: 11,
      name: "Silver",
      price: 4.99,
      currency: "USD",
      interval: "monthly",
      perks: ["badge"],
      isActive: true,
    });
    const updated = creatorRevenueEngine.updateSubscriberCount(tier.id, 10);
    expect(updated!.subscriberCount).toBe(10);
    expect(updated!.mrr).toBeCloseTo(49.9);
  });
});

describe("Phase 15A: Premium Vaults", () => {
  it("creates and purchases a vault", () => {
    const vault = creatorRevenueEngine.createPremiumVault({
      creatorId: 20,
      title: "Pro Course",
      description: "Advanced trading",
      price: 49.99,
      currency: "USD",
      contentType: "course",
      contentUrl: "https://cdn.sky/course1",
      thumbnailUrl: "https://cdn.sky/thumb1",
      isActive: true,
    });
    const purchased = creatorRevenueEngine.purchaseVault(vault.id);
    expect(purchased!.purchaseCount).toBe(1);
    expect(purchased!.totalRevenue).toBeCloseTo(49.99);
  });
});

describe("Phase 15A: PPV Streams", () => {
  it("creates and purchases PPV access", () => {
    const ppv = creatorRevenueEngine.createPPVStream({
      creatorId: 30,
      streamId: "stream_123",
      title: "Championship Match",
      price: 19.99,
      currency: "USD",
      scheduledFor: new Date(Date.now() + 86400000),
      status: "scheduled",
    });
    const access = creatorRevenueEngine.purchasePPVAccess(ppv.id);
    expect(access!.purchaseCount).toBe(1);
    expect(access!.totalRevenue).toBeCloseTo(19.99);
  });

  it("updates PPV status to live", () => {
    const ppv = creatorRevenueEngine.createPPVStream({
      creatorId: 31,
      streamId: "stream_456",
      title: "Concert",
      price: 9.99,
      currency: "USD",
      scheduledFor: new Date(),
      status: "scheduled",
    });
    const updated = creatorRevenueEngine.updatePPVStatus(ppv.id, "live");
    expect(updated!.status).toBe("live");
  });
});

describe("Phase 15A: Digital Products", () => {
  it("creates and purchases a digital product", () => {
    const product = creatorRevenueEngine.createDigitalProduct({
      creatorId: 40,
      title: "Lightroom Presets",
      description: "50 pro presets",
      price: 29.99,
      currency: "USD",
      productType: "preset",
      downloadUrl: "https://cdn.sky/presets.zip",
      thumbnailUrl: "https://cdn.sky/presets_thumb.jpg",
      isActive: true,
    });
    const purchased = creatorRevenueEngine.purchaseDigitalProduct(product.id);
    expect(purchased!.salesCount).toBe(1);
    expect(purchased!.totalRevenue).toBeCloseTo(29.99);
  });

  it("rates a digital product", () => {
    const product = creatorRevenueEngine.createDigitalProduct({
      creatorId: 41,
      title: "Trading Template",
      description: "Excel template",
      price: 14.99,
      currency: "USD",
      productType: "template",
      downloadUrl: "https://cdn.sky/template.xlsx",
      thumbnailUrl: "https://cdn.sky/template_thumb.jpg",
      isActive: true,
    });
    const rated = creatorRevenueEngine.rateDigitalProduct(product.id, 5);
    expect(rated!.rating).toBe(5);
    expect(rated!.reviewCount).toBe(1);
  });
});

describe("Phase 15A: Affiliate System", () => {
  it("creates affiliate link and tracks conversions", () => {
    const link = creatorRevenueEngine.createAffiliateLink({
      creatorId: 50,
      targetType: "product",
      targetId: "prod_123",
      code: "CREATOR50",
      commissionRate: 0.15,
      isActive: true,
    });
    creatorRevenueEngine.trackAffiliateClick(link.id);
    const converted = creatorRevenueEngine.recordAffiliateConversion(link.id, 100);
    expect(link.clicks).toBe(1);
    expect(converted!.conversions).toBe(1);
    expect(converted!.totalEarned).toBeCloseTo(15);
  });
});

describe("Phase 15A: Sponsorship Contracts", () => {
  it("creates a sponsorship contract with platform fee", () => {
    const contract = creatorRevenueEngine.createSponsorshipContract({
      creatorId: 60,
      sponsorId: 1001,
      sponsorName: "CryptoExchange",
      dealValue: 5000,
      currency: "USD",
      deliverables: ["3 posts", "1 stream mention"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000),
      status: "active",
    });
    expect(contract.platformFee).toBeCloseTo(500);
    expect(contract.creatorNet).toBeCloseTo(4500);
  });
});

describe("Phase 15A: Premium DMs", () => {
  it("sends and pays for a premium DM", () => {
    const dm = creatorRevenueEngine.sendPremiumDM({
      senderId: 100,
      recipientId: 200,
      price: 5,
      currency: "USD",
      message: "Hey, love your content!",
    });
    expect(dm.paid).toBe(false);
    const paid = creatorRevenueEngine.payForDM(dm.id);
    expect(paid!.paid).toBe(true);
  });
});

describe("Phase 15A: Tipping Upgrades", () => {
  it("assigns correct tier based on amount", () => {
    const standard = creatorRevenueEngine.sendTip({ senderId: 1, recipientId: 2, amount: 5, currency: "USD" });
    const superTip = creatorRevenueEngine.sendTip({ senderId: 1, recipientId: 2, amount: 50, currency: "USD" });
    const mega = creatorRevenueEngine.sendTip({ senderId: 1, recipientId: 2, amount: 500, currency: "USD" });
    const legendary = creatorRevenueEngine.sendTip({ senderId: 1, recipientId: 2, amount: 5000, currency: "USD" });
    expect(standard.tier).toBe("standard");
    expect(superTip.tier).toBe("super");
    expect(mega.tier).toBe("mega");
    expect(legendary.tier).toBe("legendary");
  });

  it("deducts platform fee from tip", () => {
    const tip = creatorRevenueEngine.sendTip({ senderId: 1, recipientId: 3, amount: 100, currency: "USD" });
    expect(tip.platformFee).toBeCloseTo(5);
    expect(tip.creatorNet).toBeCloseTo(95);
  });
});

// ─── PHASE 15B: PLATFORM REVENUE ENGINE ─────────────────────────────────────

describe("Phase 15B: Platform Fees", () => {
  it("records fees with correct rates", () => {
    const subFee = platformRevenueEngine.recordFee("subscription", "tx_001", 100, "USD");
    const nftFee = platformRevenueEngine.recordFee("nft_sale", "tx_002", 1000, "ETH");
    const swapFee = platformRevenueEngine.recordFee("swap", "tx_003", 10000, "SKY444");
    expect(subFee.feeAmount).toBeCloseTo(5);
    expect(nftFee.feeAmount).toBeCloseTo(25);
    expect(swapFee.feeAmount).toBeCloseTo(30);
  });

  it("sums total fees", () => {
    const before = platformRevenueEngine.getTotalFees();
    platformRevenueEngine.recordFee("tip", "tx_tip_1", 200, "USD");
    const after = platformRevenueEngine.getTotalFees();
    expect(after).toBeGreaterThan(before);
  });
});

describe("Phase 15B: Ad Campaigns", () => {
  it("creates and activates an ad campaign", () => {
    const campaign = platformRevenueEngine.createAdCampaign({
      advertiserId: 999,
      title: "SKY444 Token Launch",
      budget: 10000,
      targetAudience: { interests: ["crypto", "defi"] },
      adType: "sponsored_post",
      cpm: 5,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 86400000),
    });
    expect(campaign.id).toBeDefined();
    expect(campaign.impressions).toBe(0);
    expect(campaign.spent).toBe(0);
  });

  it("records impressions and clicks", () => {
    const campaign = platformRevenueEngine.createAdCampaign({
      advertiserId: 998,
      title: "Test Campaign",
      budget: 1000,
      targetAudience: {},
      adType: "banner",
      cpm: 2,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
    });
    platformRevenueEngine.recordAdImpression(campaign.id);
    platformRevenueEngine.recordAdImpression(campaign.id);
    platformRevenueEngine.recordAdClick(campaign.id);
    const updated = platformRevenueEngine.getActiveCampaigns().find(c => c.id === campaign.id);
    expect(updated!.impressions).toBe(2);
    expect(updated!.clicks).toBe(1);
    expect(updated!.ctr).toBeCloseTo(0.5);
  });
});

describe("Phase 15B: Promoted Content", () => {
  it("promotes content and records impressions", () => {
    const promo = platformRevenueEngine.promoteContent({
      contentType: "stream",
      contentId: "stream_789",
      promoterId: 500,
      budget: 200,
      boostMultiplier: 3,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
    });
    platformRevenueEngine.recordPromoImpression(promo.id);
    expect(promo.impressions).toBe(1);
    expect(platformRevenueEngine.getBoostMultiplier("stream_789")).toBe(3);
  });
});

// ─── PHASE 15C: TREASURY INTELLIGENCE ───────────────────────────────────────

describe("Phase 15C: Treasury Intelligence", () => {
  it("captures and retrieves a snapshot", () => {
    const snap = treasuryIntelligence.captureSnapshot({
      mrr: 50000,
      arr: 600000,
      totalRevenue: 1200000,
      totalPayouts: 840000,
      netRevenue: 360000,
      burnRate: 30000,
      runway: 12,
      cashPosition: 360000,
      tokenTreasuryUSD: 2000000,
      creatorPayoutRatio: 0.70,
      adConversionRevenue: 15000,
      subscriptionRevenue: 30000,
      transactionFeeRevenue: 5000,
      nftRoyaltyRevenue: 3000,
      sponsorshipRevenue: 7000,
      growthRate: 0.12,
    });
    expect(snap.id).toBeDefined();
    const latest = treasuryIntelligence.getLatestSnapshot();
    expect(latest!.mrr).toBe(50000);
  });

  it("computes live MRR from subscription tiers", () => {
    const mrr = treasuryIntelligence.computeLiveMRR();
    expect(typeof mrr).toBe("number");
    expect(mrr).toBeGreaterThanOrEqual(0);
  });

  it("schedules and processes creator payout", () => {
    const payout = treasuryIntelligence.scheduleCreatorPayout({
      creatorId: 77,
      period: "2024-01",
      subscriptionRevenue: 1000,
      adRevenue: 200,
      tipRevenue: 50,
      ppvRevenue: 300,
      digitalProductRevenue: 150,
      sponsorshipRevenue: 500,
      affiliateRevenue: 75,
      platformFees: 100,
      netPayout: 2175,
    });
    expect(payout.status).toBe("pending");
    const processed = treasuryIntelligence.processCreatorPayout(77, "2024-01");
    expect(processed!.status).toBe("paid");
    expect(processed!.payoutDate).toBeInstanceOf(Date);
  });

  it("returns dashboard metrics", () => {
    const metrics = treasuryIntelligence.getDashboardMetrics();
    expect(metrics).toHaveProperty("liveMRR");
    expect(metrics).toHaveProperty("liveARR");
    expect(metrics).toHaveProperty("burnRate");
    expect(metrics).toHaveProperty("runway");
    expect(metrics).toHaveProperty("totalPlatformFees");
  });
});

// ─── PHASE 16A: REFERRAL ENGINE ──────────────────────────────────────────────

describe("Phase 16A: Referral Engine", () => {
  it("creates a referral code and records conversion", () => {
    const code = referralEngine.createReferralCode({
      referrerId: 1,
      referrerType: "creator",
      referralType: "creator",
      code: "CREATOR_REF_001",
      commissionRate: 0.10,
      bonusAmount: 20,
      bonusCurrency: "USD",
      isActive: true,
    });
    expect(code.code).toBe("CREATOR_REF_001");
    const conv = referralEngine.recordConversion({
      code: "CREATOR_REF_001",
      refereeId: 999,
      conversionType: "signup",
      level: 1,
    });
    expect(conv).not.toBeNull();
    expect(conv!.rewardAmount).toBe(20);
    expect(code.uses).toBe(1);
  });

  it("applies level multipliers for multi-level referrals", () => {
    referralEngine.createReferralCode({
      referrerId: 2,
      referrerType: "user",
      referralType: "standard",
      code: "MULTI_LEVEL_001",
      commissionRate: 0.05,
      bonusAmount: 10,
      bonusCurrency: "SKY444",
      isActive: true,
    });
    const level2 = referralEngine.recordConversion({
      code: "MULTI_LEVEL_001",
      refereeId: 888,
      conversionType: "first_purchase",
      level: 2,
    });
    expect(level2!.rewardAmount).toBeCloseTo(5);
    expect(level2!.level).toBe(2);
  });

  it("builds referral tree correctly", () => {
    referralEngine.createReferralCode({
      referrerId: 3,
      referrerType: "user",
      referralType: "standard",
      code: "TREE_TEST_001",
      commissionRate: 0.05,
      bonusAmount: 15,
      bonusCurrency: "USD",
      isActive: true,
    });
    referralEngine.recordConversion({ code: "TREE_TEST_001", refereeId: 101, conversionType: "signup", level: 1 });
    referralEngine.recordConversion({ code: "TREE_TEST_001", refereeId: 102, conversionType: "signup", level: 1 });
    const tree = referralEngine.getReferralTree(3);
    expect(tree.directReferrals).toBeGreaterThanOrEqual(2);
    expect(tree.totalEarned).toBeGreaterThan(0);
  });
});

// ─── PHASE 16B: VIRAL GROWTH ENGINE ─────────────────────────────────────────

describe("Phase 16B: Streak System", () => {
  it("starts a streak on first activity", () => {
    const streak = viralGrowthEngine.recordActivity(1001, "daily_login");
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(1);
  });

  it("issues and claims invite rewards", () => {
    const reward = viralGrowthEngine.issueInviteReward(1001, "invite", 10, "SKY444", "Invite bonus");
    expect(reward.claimed).toBe(false);
    const claimed = viralGrowthEngine.claimReward(reward.id);
    expect(claimed!.claimed).toBe(true);
    expect(claimed!.claimedAt).toBeInstanceOf(Date);
  });

  it("prevents double-claiming rewards", () => {
    const reward = viralGrowthEngine.issueInviteReward(1002, "share", 5, "USD", "Share bonus");
    viralGrowthEngine.claimReward(reward.id);
    const secondClaim = viralGrowthEngine.claimReward(reward.id);
    expect(secondClaim).toBeNull();
  });
});

describe("Phase 16B: Engagement Quests", () => {
  it("creates, starts, and completes a quest", () => {
    const quest = viralGrowthEngine.createQuest({
      title: "Social Butterfly",
      description: "Make 5 posts",
      questType: "daily",
      category: "social",
      requirements: [{ action: "post", target: 5, current: 0 }],
      rewardAmount: 50,
      rewardCurrency: "SKY444",
      isActive: true,
    });
    const progress = viralGrowthEngine.startQuest(2001, quest.id);
    expect(progress).not.toBeNull();
    for (let i = 0; i < 5; i++) {
      viralGrowthEngine.updateQuestProgress(2001, quest.id, "post", 1);
    }
    const final = viralGrowthEngine.getUserQuestProgress(2001).find(p => p.questId === quest.id);
    expect(final!.completed).toBe(true);
    const claimed = viralGrowthEngine.claimQuestReward(2001, quest.id);
    expect(claimed!.rewardClaimed).toBe(true);
  });
});

describe("Phase 16B: Creator Milestones", () => {
  it("triggers milestone and activates boost", () => {
    viralGrowthEngine.createMilestone({
      creatorId: 3001,
      milestoneType: "followers",
      target: 1000,
      current: 0,
      rewardAmount: 100,
      rewardCurrency: "SKY444",
      boostDurationDays: 7,
      boostMultiplier: 2,
    });
    const triggered = viralGrowthEngine.updateMilestoneProgress(3001, "followers", 1000);
    expect(triggered.length).toBe(1);
    expect(triggered[0].achieved).toBe(true);
    expect(triggered[0].boostActiveUntil).toBeInstanceOf(Date);
    const boosts = viralGrowthEngine.getActiveBoosts(3001);
    expect(boosts.length).toBeGreaterThan(0);
  });
});

// ─── PHASE 16C: NETWORK EXPANSION ───────────────────────────────────────────

describe("Phase 16C: Network Expansion", () => {
  it("generates community recommendations", () => {
    const recs = networkExpansionEngine.generateCommunityRecommendations(
      4001, ["crypto", "gaming"], ["comm_existing"]
    );
    expect(recs.recommendedCommunities.length).toBeGreaterThan(0);
    expect(recs.recommendedCommunities[0].matchScore).toBeGreaterThan(0);
  });

  it("manages creator collaborations", () => {
    const collab = networkExpansionEngine.proposeCollaboration({
      initiatorId: 5001,
      partnerId: 5002,
      collaborationType: "co_stream",
      status: "proposed",
      revenueShare: 0.5,
      projectedReach: 10000,
    });
    const accepted = networkExpansionEngine.respondToCollaboration(collab.id, true);
    expect(accepted!.status).toBe("accepted");
    const completed = networkExpansionEngine.completeCollaboration(collab.id, 12000, 500);
    expect(completed!.status).toBe("completed");
    expect(completed!.actualReach).toBe(12000);
  });

  it("generates trending growth map", () => {
    const map = networkExpansionEngine.generateTrendingGrowthMap("2024-Q1");
    expect(map.topGrowingCategories.length).toBeGreaterThan(0);
    expect(map.topGrowingRegions.length).toBeGreaterThan(0);
    expect(map.period).toBe("2024-Q1");
  });
});

// ─── PHASE 17A: PUSH NOTIFICATIONS ──────────────────────────────────────────

describe("Phase 17A: Push Notification Engine", () => {
  it("registers a device", () => {
    const device = pushNotificationEngine.registerDevice({
      userId: 6001,
      platform: "ios",
      pushToken: "token_abc123",
      deviceModel: "iPhone 15 Pro",
      osVersion: "17.0",
      appVersion: "2.0.0",
    });
    expect(device.id).toBeDefined();
    expect(device.isActive).toBe(true);
    const devices = pushNotificationEngine.getUserDevices(6001);
    expect(devices.length).toBeGreaterThan(0);
  });

  it("sends and delivers a notification", () => {
    pushNotificationEngine.registerDevice({
      userId: 6002,
      platform: "android",
      pushToken: "token_xyz789",
      deviceModel: "Pixel 8",
      osVersion: "14",
      appVersion: "2.0.0",
    });
    const notification = pushNotificationEngine.sendNotification({
      userId: 6002,
      title: "New follower!",
      body: "Someone followed you",
      category: "social",
      priority: "normal",
    });
    expect(notification.status).toBe("delivered");
    expect(notification.deliveredAt).toBeInstanceOf(Date);
  });

  it("sets notification preferences and respects them", () => {
    const prefs = pushNotificationEngine.setNotificationPreferences(6003, {
      marketing: false,
      social: true,
    });
    expect(prefs.marketing).toBe(false);
    expect(prefs.social).toBe(true);
  });

  it("returns delivery stats", () => {
    const stats = pushNotificationEngine.getDeliveryStats();
    expect(stats).toHaveProperty("sent");
    expect(stats).toHaveProperty("delivered");
    expect(stats).toHaveProperty("clicked");
    expect(stats).toHaveProperty("ctr");
  });
});

// ─── PHASE 17B: OFFLINE CACHE ────────────────────────────────────────────────

describe("Phase 17B: Offline Cache Engine", () => {
  it("caches and retrieves content", () => {
    const data = { posts: [{ id: 1, title: "Hello" }] };
    offlineCacheEngine.cacheContent(7001, "feed", "feed_main", data);
    const retrieved = offlineCacheEngine.getCachedContent(7001, "feed", "feed_main");
    expect(retrieved).not.toBeNull();
    expect((retrieved as typeof data).posts[0].title).toBe("Hello");
  });

  it("queues and processes sync actions", () => {
    const entry = offlineCacheEngine.queueSyncAction({
      userId: 7002,
      action: "create",
      entityType: "post",
      entityId: "post_offline_1",
      payload: { content: "Offline post" },
      maxAttempts: 3,
    });
    expect(entry.status).toBe("pending");
    const processed = offlineCacheEngine.processSyncQueue(7002);
    expect(processed.length).toBeGreaterThan(0);
    expect(processed[0].status).toBe("completed");
  });

  it("invalidates cache by content type", () => {
    offlineCacheEngine.cacheContent(7003, "profile", "profile_1", { name: "Alice" });
    offlineCacheEngine.cacheContent(7003, "feed", "feed_1", { posts: [] });
    const removed = offlineCacheEngine.invalidateCache(7003, "profile");
    expect(removed).toBe(1);
    expect(offlineCacheEngine.getCachedContent(7003, "profile", "profile_1")).toBeNull();
    expect(offlineCacheEngine.getCachedContent(7003, "feed", "feed_1")).not.toBeNull();
  });
});

// ─── PHASE 17C: MEDIA COMPRESSION ───────────────────────────────────────────

describe("Phase 17C: Media Compression Engine", () => {
  it("compresses an image and returns ratio", () => {
    const job = mediaCompressionEngine.submitJob({
      userId: 8001,
      inputUrl: "https://cdn.sky/photo.jpg",
      mediaType: "image",
      inputSizeKB: 2048,
      targetQuality: "medium",
      targetPlatform: "mobile",
    });
    const processed = mediaCompressionEngine.processJob(job.id);
    expect(processed!.status).toBe("completed");
    expect(processed!.outputSizeKB).toBeLessThan(2048);
    expect(processed!.compressionRatio).toBeGreaterThan(0);
  });

  it("applies correct compression ratios by quality", () => {
    const lowJob = mediaCompressionEngine.submitJob({ userId: 8002, inputUrl: "a.jpg", mediaType: "image", inputSizeKB: 1000, targetQuality: "low", targetPlatform: "thumbnail" });
    const highJob = mediaCompressionEngine.submitJob({ userId: 8002, inputUrl: "b.jpg", mediaType: "image", inputSizeKB: 1000, targetQuality: "high", targetPlatform: "desktop" });
    const low = mediaCompressionEngine.processJob(lowJob.id);
    const high = mediaCompressionEngine.processJob(highJob.id);
    expect(low!.outputSizeKB!).toBeLessThan(high!.outputSizeKB!);
  });
});

// ─── PHASE 17D: MOBILE STREAMING ────────────────────────────────────────────

describe("Phase 17D: Mobile Streaming Engine", () => {
  it("creates ABR profile with 5 quality levels", () => {
    const profile = mobileStreamingEngine.createABRProfile("stream_mobile_1");
    expect(profile.profiles.length).toBe(5);
    expect(profile.currentProfile).toBe("720p");
  });

  it("adapts quality based on bandwidth", () => {
    mobileStreamingEngine.createABRProfile("stream_mobile_2");
    const adapted = mobileStreamingEngine.adaptQuality("stream_mobile_2", 500);
    expect(adapted!.networkCondition).toBe("poor");
    expect(adapted!.currentProfile).not.toBe("1080p");
  });

  it("tracks mobile stream session metrics", () => {
    const session = mobileStreamingEngine.startMobileSession({
      userId: 9001,
      streamId: "stream_mobile_3",
      deviceType: "ios",
      networkType: "4g",
      signalStrength: 0.8,
      currentBitrate: 2500,
      targetBitrate: 2500,
      bufferSize: 5,
      latencyMs: 200,
    });
    mobileStreamingEngine.updateSessionMetrics(session.id, 150, 8, 2);
    const metrics = mobileStreamingEngine.getSessionMetrics(session.id);
    expect(metrics!.avgLatency).toBe(150);
    expect(metrics!.qualityScore).toBeGreaterThan(0);
  });
});

// ─── PHASE 17E: MOBILE ANALYTICS ────────────────────────────────────────────

describe("Phase 17E: Mobile Analytics Engine", () => {
  it("tracks events and sessions", () => {
    const session = mobileAnalyticsEngine.startSession({
      sessionId: "sess_001",
      userId: 10001,
      platform: "ios",
      appVersion: "2.0.0",
      deviceModel: "iPhone 15",
      osVersion: "17.0",
      startedAt: new Date(),
    });
    mobileAnalyticsEngine.recordScreenView("sess_001", "FeedScreen");
    mobileAnalyticsEngine.recordScreenView("sess_001", "ProfileScreen");
    const ended = mobileAnalyticsEngine.endSession("sess_001");
    expect(ended!.endedAt).toBeInstanceOf(Date);
  });

  it("generates performance report", () => {
    const report = mobileAnalyticsEngine.getPerformanceReport("2024-01", "ios");
    expect(report).toHaveProperty("avgSessionDuration");
    expect(report).toHaveProperty("crashRate");
    expect(report).toHaveProperty("retentionD1");
    expect(report).toHaveProperty("retentionD7");
    expect(report).toHaveProperty("retentionD30");
  });
});

// ─── PHASE 18A: INTELLIGENCE LAYER ──────────────────────────────────────────

describe("Phase 18A: User Analytics", () => {
  it("upserts and retrieves user analytics profile", () => {
    const profile = intelligenceLayer.upsertUserProfile(11001, {
      engagementScore: 0.85,
      totalSpentUSD: 250,
      totalSessions: 45,
      churnRisk: "low",
      segment: "power_user",
    });
    expect(profile.engagementScore).toBe(0.85);
    const retrieved = intelligenceLayer.getUserProfile(11001);
    expect(retrieved!.segment).toBe("power_user");
  });

  it("computes user segment correctly", () => {
    intelligenceLayer.upsertUserProfile(11002, { totalSpentUSD: 2000 });
    expect(intelligenceLayer.computeUserSegment(11002)).toBe("whale");
    intelligenceLayer.upsertUserProfile(11003, { engagementScore: 0.05, totalSessions: 1 });
    expect(intelligenceLayer.computeUserSegment(11003)).toBe("lurker");
  });
});

describe("Phase 18A: Creator Analytics", () => {
  it("upserts and retrieves creator analytics profile", () => {
    const profile = intelligenceLayer.upsertCreatorProfile(12001, {
      totalFollowers: 50000,
      avgEngagementRate: 0.065,
      totalRevenue: 25000,
      revenueGrowthRate: 0.18,
    });
    expect(profile.totalFollowers).toBe(50000);
    const top = intelligenceLayer.getTopCreatorsByRevenue(5);
    expect(top.length).toBeGreaterThan(0);
    expect(top[0].totalRevenue).toBeGreaterThanOrEqual(top[top.length - 1].totalRevenue);
  });
});

describe("Phase 18A: Token Analytics", () => {
  it("records and retrieves token snapshots", () => {
    intelligenceLayer.recordTokenSnapshot({
      price: 0.045,
      priceChange24h: 0.05,
      priceChange7d: 0.12,
      marketCap: 45000000,
      volume24h: 2500000,
      circulatingSupply: 1000000000,
      totalSupply: 2000000000,
      burnedSupply: 50000000,
      stakingRatio: 0.35,
      holdersCount: 125000,
      transactionsCount24h: 8500,
      liquidityUSD: 3000000,
      fearGreedIndex: 65,
      rsi: 58,
      macd: 0.002,
      bollingerBands: { upper: 0.052, middle: 0.045, lower: 0.038 },
    });
    const latest = intelligenceLayer.getLatestTokenSnapshot();
    expect(latest!.price).toBe(0.045);
    expect(latest!.bollingerBands.middle).toBe(0.045);
  });
});

describe("Phase 18A: Retention Cohorts", () => {
  it("records and retrieves retention cohorts", () => {
    intelligenceLayer.recordRetentionCohort({
      cohortDate: "2024-01",
      cohortSize: 1000,
      retentionByDay: { 1: 0.62, 7: 0.38, 30: 0.22 },
      retentionByWeek: { 1: 0.62, 4: 0.35, 12: 0.20 },
      avgLTV: 85,
      avgRevenue: 12,
    });
    const cohort = intelligenceLayer.getRetentionCohort("2024-01");
    expect(cohort!.cohortSize).toBe(1000);
    expect(cohort!.retentionByDay[7]).toBe(0.38);
  });
});

// ─── PHASE 18B: PREDICTION LAYER ────────────────────────────────────────────

describe("Phase 18B: Churn Prediction", () => {
  it("predicts churn with risk levels", () => {
    intelligenceLayer.upsertUserProfile(13001, {
      lastActiveAt: new Date(Date.now() - 20 * 86400000),
      engagementScore: 0.1,
      totalSpentUSD: 0,
    });
    const prediction = predictionLayer.predictChurn(13001);
    expect(prediction.churnProbability).toBeGreaterThan(0);
    expect(prediction.churnProbability).toBeLessThanOrEqual(1);
    expect(["low", "medium", "high", "critical"]).toContain(prediction.churnRisk);
    expect(prediction.recommendedInterventions.length).toBeGreaterThan(0);
  });

  it("identifies high-risk users", () => {
    intelligenceLayer.upsertUserProfile(13002, {
      lastActiveAt: new Date(Date.now() - 25 * 86400000),
      engagementScore: 0.05,
      totalSpentUSD: 0,
    });
    predictionLayer.predictChurn(13002);
    const highRisk = predictionLayer.getHighRiskUsers(50);
    expect(Array.isArray(highRisk)).toBe(true);
  });
});

describe("Phase 18B: Viral Prediction", () => {
  it("predicts content virality", () => {
    const prediction = predictionLayer.predictVirality("post_viral_1", "video", 500, 100000);
    expect(prediction.viralProbability).toBeGreaterThan(0);
    expect(prediction.predictedReach).toBeGreaterThan(0);
    expect(prediction.peakTime).toBeInstanceOf(Date);
  });
});

describe("Phase 18B: Creator Success Prediction", () => {
  it("predicts creator success trajectory", () => {
    intelligenceLayer.upsertCreatorProfile(14001, {
      totalFollowers: 5000,
      avgEngagementRate: 0.08,
      totalRevenue: 3000,
      revenueGrowthRate: 0.25,
    });
    const prediction = predictionLayer.predictCreatorSuccess(14001);
    expect(prediction.successProbability).toBeGreaterThan(0);
    expect(prediction.predictedFollowersIn30d).toBeGreaterThan(5000);
    expect(["explosive", "steady", "plateau", "declining"]).toContain(prediction.growthTrajectory);
  });
});

describe("Phase 18B: Fraud Prediction", () => {
  it("flags high-risk entities", () => {
    const prediction = predictionLayer.predictFraud("user_suspicious_1", "user", [
      { signal: "rapid_follower_gain", severity: "high", value: 5000 },
      { signal: "bot_like_pattern", severity: "high", value: true },
      { signal: "vpn_usage", severity: "medium", value: true },
    ]);
    expect(prediction.fraudProbability).toBeGreaterThan(0.5);
    expect(prediction.recommendedAction).not.toBe("allow");
  });

  it("allows low-risk entities", () => {
    const prediction = predictionLayer.predictFraud("user_clean_1", "user", []);
    expect(prediction.recommendedAction).toBe("allow");
  });
});

describe("Phase 18B: Treasury Prediction", () => {
  it("generates treasury forecast with scenarios", () => {
    const prediction = predictionLayer.predictTreasury(50000, 0.12, 30000, 360000);
    expect(prediction.revenueScenarios.bull).toBeGreaterThan(prediction.revenueScenarios.base);
    expect(prediction.revenueScenarios.base).toBeGreaterThan(prediction.revenueScenarios.bear);
    expect(prediction.predictedRunway).toBeGreaterThan(0);
    expect(prediction.topGrowthDrivers.length).toBeGreaterThan(0);
  });
});

// ─── PHASE 19A: PUBLIC API MANAGEMENT ───────────────────────────────────────

describe("Phase 19A: Public API Manager", () => {
  it("creates and validates an API key", () => {
    const apiKey = publicAPIManager.createAPIKey({
      ownerId: 15001,
      ownerType: "developer",
      name: "My App",
      description: "Test integration",
      scopes: ["creator:read", "marketplace:read"],
      rateLimit: 1000,
      rateLimitWindow: "hour",
    });
    expect(apiKey.key).toMatch(/^sky_/);
    expect(apiKey.secret).toMatch(/^sks_/);
    const validation = publicAPIManager.validateAPIKey(apiKey.key);
    expect(validation.valid).toBe(true);
    expect(validation.apiKey!.ownerId).toBe(15001);
  });

  it("rejects invalid API keys", () => {
    const result = publicAPIManager.validateAPIKey("sky_invalid_key_xyz");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("checks scope requirements", () => {
    const apiKey = publicAPIManager.createAPIKey({
      ownerId: 15002,
      ownerType: "creator",
      name: "Creator App",
      description: "Creator tools",
      scopes: ["creator:read"],
      rateLimit: 500,
      rateLimitWindow: "hour",
    });
    const withScope = publicAPIManager.validateAPIKey(apiKey.key, "creator:read");
    expect(withScope.valid).toBe(true);
    const withoutScope = publicAPIManager.validateAPIKey(apiKey.key, "wallet:write");
    expect(withoutScope.valid).toBe(false);
  });

  it("records requests and returns usage stats", () => {
    const apiKey = publicAPIManager.createAPIKey({
      ownerId: 15003,
      ownerType: "enterprise",
      name: "Enterprise App",
      description: "Full access",
      scopes: ["creator:read", "analytics:read"],
      rateLimit: 10000,
      rateLimitWindow: "day",
    });
    publicAPIManager.recordRequest(apiKey.id, "/api/v1/creators", "GET", 200, 45);
    publicAPIManager.recordRequest(apiKey.id, "/api/v1/analytics", "GET", 200, 120);
    publicAPIManager.recordRequest(apiKey.id, "/api/v1/creators", "POST", 400, 30);
    const stats = publicAPIManager.getAPIUsageStats(apiKey.id, "2024-01");
    expect(stats.totalRequests).toBe(3);
    expect(stats.successfulRequests).toBe(2);
    expect(stats.failedRequests).toBe(1);
    expect(stats.topEndpoints.length).toBeGreaterThan(0);
  });

  it("revokes an API key", () => {
    const apiKey = publicAPIManager.createAPIKey({
      ownerId: 15004,
      ownerType: "developer",
      name: "Temp App",
      description: "Temporary",
      scopes: ["social:read"],
      rateLimit: 100,
      rateLimitWindow: "minute",
    });
    publicAPIManager.revokeAPIKey(apiKey.id);
    const result = publicAPIManager.validateAPIKey(apiKey.key);
    expect(result.valid).toBe(false);
  });

  it("dispatches webhook events", () => {
    const apiKey = publicAPIManager.createAPIKey({
      ownerId: 15005,
      ownerType: "partner",
      name: "Webhook App",
      description: "Webhook test",
      scopes: ["creator:read"],
      rateLimit: 1000,
      rateLimitWindow: "hour",
      webhookUrl: "https://partner.example.com/webhook",
    });
    const event = publicAPIManager.dispatchWebhookEvent(apiKey.id, "creator.followed", { creatorId: 1, followerId: 2 });
    expect(event.lastDeliveryStatus).toBe("delivered");
    expect(event.deliveryAttempts).toBe(1);
  });
});

// ─── PHASE 19B: SDK REGISTRY ─────────────────────────────────────────────────

describe("Phase 19B: SDK Registry", () => {
  it("publishes SDK releases and marks latest", () => {
    sdkRegistry.publishRelease({
      sdkType: "typescript",
      version: "1.0.0",
      changelog: "Initial release",
      downloadUrl: "https://cdn.sky/sdk/ts/1.0.0.tgz",
      npmPackage: "@skycoin/sdk",
      checksumSha256: "abc123",
      isLatest: false,
      isDeprecated: false,
      releaseNotes: "First stable release",
    });
    sdkRegistry.publishRelease({
      sdkType: "typescript",
      version: "2.0.0",
      changelog: "Major update",
      downloadUrl: "https://cdn.sky/sdk/ts/2.0.0.tgz",
      npmPackage: "@skycoin/sdk",
      checksumSha256: "def456",
      isLatest: true,
      isDeprecated: false,
      releaseNotes: "New features",
    });
    const latest = sdkRegistry.getLatestRelease("typescript");
    expect(latest!.version).toBe("2.0.0");
    expect(latest!.isLatest).toBe(true);
  });

  it("records SDK installations", () => {
    const apiKey = publicAPIManager.createAPIKey({
      ownerId: 16001,
      ownerType: "developer",
      name: "SDK User",
      description: "SDK test",
      scopes: ["creator:read"],
      rateLimit: 1000,
      rateLimitWindow: "hour",
    });
    sdkRegistry.recordInstallation(apiKey.id, "typescript", "2.0.0", "node");
    sdkRegistry.recordInstallation(apiKey.id, "python", "1.5.0", "python3.11");
    const stats = sdkRegistry.getSDKAdoptionStats();
    expect(stats["typescript"]).toBeDefined();
    expect(stats["typescript"].installations).toBeGreaterThan(0);
  });
});

// ─── PHASE 19C: EXTERNAL INTEGRATIONS ───────────────────────────────────────

describe("Phase 19C: External Integrations", () => {
  it("connects and retrieves integrations", () => {
    const integration = externalIntegrationEngine.connectIntegration({
      userId: 17001,
      platform: "youtube",
      platformUserId: "UCxyz123",
      platformUsername: "CreatorChannel",
      accessToken: "ya29.access_token",
      refreshToken: "1//refresh_token",
      scopes: ["youtube.readonly"],
      syncEnabled: true,
      metadata: { subscriberCount: 50000 },
    });
    expect(integration.id).toBeDefined();
    const integrations = externalIntegrationEngine.getUserIntegrations(17001);
    expect(integrations.length).toBeGreaterThan(0);
    expect(integrations[0].platform).toBe("youtube");
  });

  it("queues and processes YouTube sync", () => {
    const integration = externalIntegrationEngine.connectIntegration({
      userId: 17002,
      platform: "youtube",
      platformUserId: "UCabc456",
      platformUsername: "Channel2",
      accessToken: "ya29.token2",
      scopes: ["youtube.readonly"],
      syncEnabled: true,
      metadata: {},
    });
    const job = externalIntegrationEngine.queueYouTubeSync(17002, integration.id, "import_videos");
    const processed = externalIntegrationEngine.processYouTubeSync(job.id);
    expect(processed!.status).toBe("completed");
    expect(processed!.itemsProcessed).toBeGreaterThan(0);
  });

  it("queues and processes Twitch sync", () => {
    const integration = externalIntegrationEngine.connectIntegration({
      userId: 17003,
      platform: "twitch",
      platformUserId: "twitch_user_1",
      platformUsername: "StreamerX",
      accessToken: "twitch_token",
      scopes: ["channel:read:subscriptions"],
      syncEnabled: true,
      metadata: {},
    });
    const job = externalIntegrationEngine.queueTwitchSync(17003, integration.id, "import_vods");
    const processed = externalIntegrationEngine.processTwitchSync(job.id);
    expect(processed!.status).toBe("completed");
  });

  it("queues and processes Discord sync", () => {
    const integration = externalIntegrationEngine.connectIntegration({
      userId: 17004,
      platform: "discord",
      platformUserId: "discord_user_1",
      platformUsername: "DiscordUser#1234",
      accessToken: "discord_token",
      scopes: ["guilds"],
      syncEnabled: true,
      metadata: {},
    });
    const job = externalIntegrationEngine.queueDiscordSync(17004, integration.id, "guild_123", "sync_members");
    const processed = externalIntegrationEngine.processDiscordSync(job.id);
    expect(processed!.status).toBe("completed");
  });

  it("queues and processes Coinbase sync", () => {
    const integration = externalIntegrationEngine.connectIntegration({
      userId: 17005,
      platform: "coinbase",
      platformUserId: "cb_user_1",
      platformUsername: "CoinbaseUser",
      accessToken: "cb_token",
      scopes: ["wallet:accounts:read"],
      syncEnabled: true,
      metadata: {},
    });
    const job = externalIntegrationEngine.queueCoinbaseSync(17005, integration.id, "sync_balances");
    const processed = externalIntegrationEngine.processCoinbaseSync(job.id);
    expect(processed!.status).toBe("completed");
  });

  it("queues and processes OpenSea sync", () => {
    const integration = externalIntegrationEngine.connectIntegration({
      userId: 17006,
      platform: "opensea",
      platformUserId: "os_user_1",
      platformUsername: "NFTCollector",
      accessToken: "os_api_key",
      scopes: ["read"],
      syncEnabled: true,
      metadata: {},
    });
    const job = externalIntegrationEngine.queueOpenSeaSync(17006, integration.id, "import_nfts");
    const processed = externalIntegrationEngine.processOpenSeaSync(job.id);
    expect(processed!.status).toBe("completed");
    expect(processed!.itemsProcessed).toBeGreaterThan(0);
  });

  it("schedules and publishes cross-platform posts", () => {
    const post = externalIntegrationEngine.scheduleCrossPlatformPost({
      userId: 17007,
      originalPostId: "post_original_1",
      platforms: [
        { platform: "twitter_x", status: "pending" },
        { platform: "discord", status: "pending" },
      ],
      content: "Check out my new stream!",
      mediaUrls: ["https://cdn.sky/thumb.jpg"],
    });
    const published = externalIntegrationEngine.publishCrossPlatformPost(post.id);
    expect(published!.platforms.every(p => p.status === "posted")).toBe(true);
  });

  it("disconnects an integration", () => {
    const integration = externalIntegrationEngine.connectIntegration({
      userId: 17008,
      platform: "instagram",
      platformUserId: "ig_user_1",
      platformUsername: "@creator",
      accessToken: "ig_token",
      scopes: ["basic"],
      syncEnabled: true,
      metadata: {},
    });
    const disconnected = externalIntegrationEngine.disconnectIntegration(integration.id);
    expect(disconnected).toBe(true);
    const byPlatform = externalIntegrationEngine.getIntegrationByPlatform(17008, "instagram");
    expect(byPlatform).toBeNull();
  });

  it("returns integration health stats", () => {
    const health = externalIntegrationEngine.getIntegrationHealth();
    expect(health).toHaveProperty("totalIntegrations");
    expect(health).toHaveProperty("activeIntegrations");
    expect(health).toHaveProperty("byPlatform");
    expect(health.totalIntegrations).toBeGreaterThan(0);
  });
});
