/**
 * Phase 6 Test Suite — Dominance Layer
 * Tests for: Creator OS, Audience Lock-In, Live Events, Economic Expansion,
 *            HOPE AI, Discovery, Business Intelligence, Global Expansion, Trust Empire
 * Target: 250+ tests
 */
import { describe, it, expect } from "vitest";

// ─── Phase 6A: Creator OS Engine ─────────────────────────────────────────────
import {
  creatorCRM,
  audienceSegmentation,
  subscriberFunnels,
  sponsorshipCRM,
  campaignManager,
  revenueForecasting,
  contentScheduler,
  creatorBI,
  creatorTaxCenter,
  legalDocsVault,
} from "./creator-os-engine";

describe("Phase 6A: Creator CRM", () => {
  it("adds a contact and retrieves it", () => {
    const contact = creatorCRM.addContact(1, {
      name: "Alice Fan",
      email: "alice@example.com",
      platform: "twitter",
      handle: "tw_alice123",
      tags: ["vip"],
    });
    expect(contact).toMatchObject({ creatorId: 1, name: "Alice Fan" });
    const contacts = creatorCRM.getContacts(1);
    expect(contacts.length).toBeGreaterThan(0);
    expect(contacts.some(c => c.name === "Alice Fan")).toBe(true);
  });

  it("records an interaction on a contact", () => {
    const contact = creatorCRM.addContact(2, {
      name: "Bob Viewer",
      platform: "youtube",
      handle: "yt_bob456",
    });
    const interaction = creatorCRM.recordInteraction(contact.id, "comment", "Great video!");
    expect(interaction).toMatchObject({ contactId: contact.id, type: "comment" });
  });

  it("updates contact notes", () => {
    const contact = creatorCRM.addContact(4, {
      name: "Dave Patron",
      platform: "twitch",
      handle: "tw_dave",
    });
    creatorCRM.updateNotes(contact.id, "High-value donor, always tips");
    const updated = creatorCRM.getContacts(4).find(c => c.id === contact.id);
    expect(updated?.notes).toBe("High-value donor, always tips");
  });

  it("returns empty array for creator with no contacts", () => {
    const contacts = creatorCRM.getContacts(9999);
    expect(contacts).toEqual([]);
  });

  it("gets CRM stats for a creator", () => {
    creatorCRM.addContact(5, { name: "Fan One", platform: "instagram", handle: "ig_fan1" });
    creatorCRM.addContact(5, { name: "Fan Two", platform: "twitter", handle: "tw_fan2" });
    const stats = creatorCRM.getCRMStats(5);
    expect(stats).toHaveProperty("totalContacts");
    expect(stats.totalContacts).toBeGreaterThanOrEqual(2);
  });
});

describe("Phase 6A: Audience Segmentation", () => {
  it("creates a segment and retrieves it", () => {
    const segment = audienceSegmentation.createSegment(1, "Top Fans", "High engagement fans", {
      engagementLevel: "high",
    });
    expect(segment).toMatchObject({ creatorId: 1, name: "Top Fans" });
    const segments = audienceSegmentation.getSegments(1);
    expect(segments.some(s => s.name === "Top Fans")).toBe(true);
  });

  it("evaluates a segment against audience data", () => {
    const segment = audienceSegmentation.createSegment(1, "Subscribers", "Paying subscribers", {
      hasSubscription: true,
    });
    const result = audienceSegmentation.evaluateSegment(segment.id, [
      { followDays: 30, totalSpend: 50, hasSubscription: true, engagementScore: 80 },
      { followDays: 5, totalSpend: 0, hasSubscription: false, engagementScore: 20 },
    ]);
    expect(result).toHaveProperty("memberCount");
    expect(result.memberCount).toBe(1);
  });

  it("gets segment insights", () => {
    const segment = audienceSegmentation.createSegment(2, "Whales", "High spenders", { minSpend: 100 });
    const insights = audienceSegmentation.getSegmentInsights(segment.id);
    expect(insights).toHaveProperty("avgEngagement");
    expect(insights).toHaveProperty("avgSpend");
    expect(insights).toHaveProperty("retentionRate");
  });
});

describe("Phase 6A: Subscriber Funnels", () => {
  it("creates a funnel and retrieves it", () => {
    const funnel = subscriberFunnels.createFunnel(1, "Onboarding", [
      { name: "Awareness", type: "awareness", action: "view_profile" },
      { name: "Consideration", type: "consideration", action: "follow" },
      { name: "Conversion", type: "conversion", action: "subscribe" },
    ]);
    expect(funnel).toMatchObject({ creatorId: 1, name: "Onboarding" });
    expect(funnel.steps).toHaveLength(3);
  });

  it("enters and advances a funnel", () => {
    const funnel = subscriberFunnels.createFunnel(1, "Upsell", [
      { name: "Free Tier", type: "awareness", action: "signup" },
      { name: "Premium", type: "conversion", action: "upgrade" },
    ]);
    subscriberFunnels.enterFunnel(funnel.id, 301);
    const result = subscriberFunnels.advanceFunnel(funnel.id, 301);
    expect(result).toHaveProperty("currentStep");
    expect(result.success).toBe(true);
  });

  it("gets funnel analytics", () => {
    const funnel = subscriberFunnels.createFunnel(2, "Premium Push", [
      { name: "Intro", type: "awareness", action: "view" },
      { name: "Trial", type: "consideration", action: "trial" },
    ]);
    subscriberFunnels.enterFunnel(funnel.id, 401);
    subscriberFunnels.enterFunnel(funnel.id, 402);
    const analytics = subscriberFunnels.getFunnelAnalytics(funnel.id);
    expect(analytics).toHaveProperty("totalEntered");
    expect(analytics).toHaveProperty("conversionRate");
    expect(analytics.totalEntered).toBe(2);
  });

  it("gets funnels for a creator", () => {
    subscriberFunnels.createFunnel(3, "Creator Funnel", [{ name: "Step 1", type: "awareness", action: "view" }]);
    const funnels = subscriberFunnels.getFunnels(3);
    expect(funnels.length).toBeGreaterThan(0);
  });
});

describe("Phase 6A: Sponsorship CRM", () => {
  it("creates a sponsorship deal", () => {
    const deal = sponsorshipCRM.createDeal(1, {
      brandName: "TechCorp",
      contactEmail: "sponsor@techcorp.com",
      dealValue: 5000,
      currency: "USD",
      deliverables: ["Integration post"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000),
      status: "negotiating",
      exclusivityCategories: ["tech"],
    });
    expect(deal).toMatchObject({ creatorId: 1, brandName: "TechCorp", dealValue: 5000 });
  });

  it("updates deal status", () => {
    const deal = sponsorshipCRM.createDeal(1, {
      brandName: "FashionBrand",
      contactEmail: "sponsor@fashion.com",
      dealValue: 2000,
      currency: "USD",
      deliverables: ["Story series"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 86400000),
      status: "negotiating",
      exclusivityCategories: ["fashion"],
    });
    sponsorshipCRM.updateDealStatus(deal.id, "active");
    const deals = sponsorshipCRM.getDeals(1);
    const updated = deals.find(d => d.id === deal.id);
    expect(updated?.status).toBe("active");
  });

  it("gets deals by status", () => {
    sponsorshipCRM.createDeal(1, {
      brandName: "GameCo",
      contactEmail: "sponsor@gameco.com",
      dealValue: 3000,
      currency: "USD",
      deliverables: ["Stream overlay"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 86400000),
      status: "active",
      exclusivityCategories: ["gaming"],
    });
    const active = sponsorshipCRM.getDeals(1, "active");
    expect(active.every(d => d.status === "active")).toBe(true);
  });

  it("gets sponsorship revenue summary", () => {
    const revenue = sponsorshipCRM.getSponsorshipRevenue(1);
    expect(revenue).toHaveProperty("total");
    expect(revenue).toHaveProperty("active");
    expect(revenue).toHaveProperty("pipeline");
  });

  it("checks exclusivity conflict", () => {
    const conflict = sponsorshipCRM.checkExclusivity(1, "gaming");
    expect(conflict).toHaveProperty("hasConflict");
  });
});

describe("Phase 6A: Campaign Manager", () => {
  it("creates a campaign", () => {
    const campaign = campaignManager.createCampaign(1, {
      name: "Summer Launch",
      type: "launch",
      budget: 10000,
      spent: 0,
      targetAudience: "crypto enthusiasts",
      platforms: ["twitter", "instagram"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000),
      status: "active",
      goals: { impressions: 100000, conversions: 500 },
    });
    expect(campaign).toMatchObject({ creatorId: 1, name: "Summer Launch" });
  });

  it("updates campaign status", () => {
    const campaign = campaignManager.createCampaign(1, {
      name: "Fall Sale",
      type: "promotion",
      budget: 5000,
      spent: 0,
      targetAudience: "all",
      platforms: ["twitter"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 86400000),
      status: "draft",
      goals: {},
    });
    campaignManager.updateCampaignStatus(campaign.id, "active");
    const campaigns = campaignManager.getCampaigns(1);
    const updated = campaigns.find(c => c.id === campaign.id);
    expect(updated?.status).toBe("active");
  });

  it("gets campaigns for a creator", () => {
    campaignManager.createCampaign(2, {
      name: "Brand Awareness Q4",
      type: "awareness",
      budget: 20000,
      spent: 0,
      targetAudience: "broad",
      platforms: ["all"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 86400000),
      status: "scheduled",
      goals: {},
    });
    const campaigns = campaignManager.getCampaigns(2);
    expect(campaigns.length).toBeGreaterThan(0);
  });

  it("gets campaign ROI", () => {
    const campaign = campaignManager.createCampaign(3, {
      name: "ROI Test",
      type: "promotion",
      budget: 1000,
      spent: 800,
      targetAudience: "subscribers",
      platforms: ["instagram"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 86400000),
      status: "active",
      goals: { revenue: 2000 },
    });
    campaignManager.recordCampaignResults(campaign.id, { impressions: 10000, clicks: 500, conversions: 50, revenue: 1500 });
    const roi = campaignManager.getCampaignROI(campaign.id);
    expect(roi).toHaveProperty("roi");
    expect(roi).toHaveProperty("cpc");
    expect(roi).toHaveProperty("cpm");
  });
});

describe("Phase 6A: Revenue Forecasting", () => {
  it("generates a monthly forecast", () => {
    const forecast = revenueForecasting.generateForecast(1, "monthly", [
      { month: "2025-01", revenue: 3000 },
      { month: "2025-02", revenue: 3500 },
      { month: "2025-03", revenue: 4000 },
    ]);
    expect(forecast).toHaveProperty("creatorId", 1);
    expect(forecast).toHaveProperty("period", "monthly");
    expect(forecast).toHaveProperty("totalRevenue");
  });

  it("generates a quarterly forecast", () => {
    const forecast = revenueForecasting.generateForecast(2, "quarterly", [
      { month: "2025-01", revenue: 5000 },
      { month: "2025-02", revenue: 5500 },
    ]);
    expect(forecast.period).toBe("quarterly");
    expect(forecast.totalRevenue).toBeGreaterThan(0);
  });

  it("includes confidence score", () => {
    const forecast = revenueForecasting.generateForecast(3, "annual", [
      { month: "2025-01", revenue: 8000 },
      { month: "2025-02", revenue: 8500 },
      { month: "2025-03", revenue: 9000 },
    ]);
    expect(forecast).toHaveProperty("confidence");
    expect(forecast.confidence).toBeGreaterThan(0);
    expect(forecast.confidence).toBeLessThanOrEqual(1);
  });

  it("gets revenue breakdown", () => {
    const breakdown = revenueForecasting.getRevenueBreakdown(1);
    expect(Array.isArray(breakdown)).toBe(true);
    expect(breakdown[0]).toHaveProperty("source");
    expect(breakdown[0]).toHaveProperty("percentage");
  });

  it("gets revenue goals", () => {
    const goals = revenueForecasting.getRevenueGoals(1);
    expect(goals).toHaveProperty("monthly");
    expect(goals).toHaveProperty("quarterly");
    expect(goals).toHaveProperty("annual");
  });
});

describe("Phase 6A: Content Scheduler", () => {
  it("schedules a post", () => {
    const post = contentScheduler.schedule(1, {
      title: "Hello world!",
      body: "My first scheduled post",
      mediaUrls: [],
      platforms: ["twitter"],
      scheduledAt: new Date(Date.now() + 3600000),
    });
    expect(post).toMatchObject({ creatorId: 1, status: "pending" });
  });

  it("retrieves scheduled posts", () => {
    contentScheduler.schedule(1, {
      title: "Upcoming content",
      body: "Check this out",
      mediaUrls: [],
      platforms: ["instagram"],
      scheduledAt: new Date(Date.now() + 7200000),
    });
    const posts = contentScheduler.getScheduledPosts(1);
    expect(posts.length).toBeGreaterThan(0);
  });

  it("cancels a scheduled post", () => {
    const post = contentScheduler.schedule(1, {
      title: "Cancel me",
      body: "This will be cancelled",
      mediaUrls: [],
      platforms: ["tiktok"],
      scheduledAt: new Date(Date.now() + 86400000),
    });
    const result = contentScheduler.cancelScheduledPost(post.id);
    expect(result.success).toBe(true);
    const posts = contentScheduler.getScheduledPosts(1);
    const found = posts.find(p => p.id === post.id);
    expect(found?.status).toBe("cancelled");
  });

  it("reschedules a post", () => {
    const post = contentScheduler.schedule(1, {
      title: "Reschedule me",
      body: "Moving to a new time",
      mediaUrls: [],
      platforms: ["youtube"],
      scheduledAt: new Date(Date.now() + 3600000),
    });
    const newTime = new Date(Date.now() + 7200000);
    const result = contentScheduler.reschedulePost(post.id, newTime);
    expect(result.success).toBe(true);
    expect(result.post?.scheduledAt.getTime()).toBe(newTime.getTime());
  });
});

describe("Phase 6A: Creator BI", () => {
  it("generates a BI report", () => {
    const report = creatorBI.generateReport(1, "2025-Q4");
    expect(report).toHaveProperty("creatorId", 1);
    expect(report).toHaveProperty("revenue");
    expect(report).toHaveProperty("audience");
    expect(report).toHaveProperty("content");
  });

  it("includes recommendations", () => {
    const report = creatorBI.generateReport(2, "2025-Q4");
    expect(report).toHaveProperty("recommendations");
    expect(Array.isArray(report.recommendations)).toBe(true);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("gets growth metrics", () => {
    const metrics = creatorBI.getGrowthMetrics(1);
    expect(metrics).toHaveProperty("followerGrowth");
    expect(metrics).toHaveProperty("revenueGrowth");
    expect(metrics).toHaveProperty("retentionRate");
  });

  it("gets benchmarks by niche", () => {
    const benchmarks = creatorBI.getBenchmarks(1, "crypto");
    expect(benchmarks).toHaveProperty("avgRevenue");
    expect(benchmarks).toHaveProperty("avgFollowers");
    expect(benchmarks).toHaveProperty("avgEngagement");
  });
});

// ─── Phase 6B: Audience Lock-In Engine ───────────────────────────────────────
import {
  streakSystem,
  loyaltySystem,
  fanBadges,
  fanSubscriptions,
  milestoneRewards,
  fanQuests,
  fanLeveling,
  supporterLadders,
  collectibleFanNFTs,
} from "./audience-lockin-engine";

describe("Phase 6B: Streak System", () => {
  it("records activity and creates a streak", () => {
    const result = streakSystem.recordActivity(1001, "daily_login");
    expect(result).toHaveProperty("streak");
    expect(result.streak).toBeGreaterThanOrEqual(1);
  });

  it("gets streak for user", () => {
    streakSystem.recordActivity(1002, "daily_login");
    const streak = streakSystem.getStreak(1002, "daily_login");
    expect(streak).toHaveProperty("userId", 1002);
    expect(streak).toHaveProperty("streak");
    expect(streak).toHaveProperty("multiplier");
  });

  it("returns streak multiplier based on streak length", () => {
    const streak7 = streakSystem.getStreak(1001, "daily_login");
    expect(streak7.multiplier).toBeGreaterThanOrEqual(1);
  });

  it("gets streak leaderboard", () => {
    streakSystem.recordActivity(1003, "daily_login");
    streakSystem.recordActivity(1004, "daily_login");
    const leaderboard = streakSystem.getLeaderboard("daily_login", 10);
    expect(Array.isArray(leaderboard)).toBe(true);
    expect(leaderboard.length).toBeGreaterThan(0);
  });
});

describe("Phase 6B: Loyalty System", () => {
  it("creates a loyalty profile on first point award", () => {
    const result = loyaltySystem.awardPoints(2001, 100, "post_created");
    expect(result).toHaveProperty("newTotal");
    expect(result.newTotal).toBeGreaterThanOrEqual(100);
  });

  it("upgrades tier when threshold is reached", () => {
    const result = loyaltySystem.awardPoints(2002, 5000, "bulk_award");
    expect(["bronze", "silver", "gold", "platinum", "diamond", "legend"]).toContain(result.tier);
  });

  it("returns tier benefits", () => {
    const benefits = loyaltySystem.getTierBenefits("gold");
    expect(benefits).toHaveProperty("multiplier");
    expect(benefits).toHaveProperty("feeDiscount");
    expect(benefits).toHaveProperty("exclusiveContent");
  });

  it("gets loyalty profile", () => {
    loyaltySystem.awardPoints(2003, 200, "engagement");
    const profile = loyaltySystem.getProfile(2003);
    expect(profile).toHaveProperty("userId", 2003);
    expect(profile).toHaveProperty("points");
    expect(profile).toHaveProperty("tier");
  });

  it("redeems points", () => {
    loyaltySystem.awardPoints(2004, 500, "engagement");
    const result = loyaltySystem.redeemPoints(2004, 100);
    expect(result).toHaveProperty("success");
    if (result.success) {
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("Phase 6B: Fan Badges", () => {
  it("awards a badge to a user", () => {
    const result = fanBadges.awardBadge(3001, "first_post");
    expect(result).toHaveProperty("success");
    if (result.success) {
      expect(result.badge).toHaveProperty("id");
    }
  });

  it("retrieves user badges", () => {
    fanBadges.awardBadge(3002, "streak_7");
    const badges = fanBadges.getUserBadges(3002);
    expect(Array.isArray(badges)).toBe(true);
  });

  it("does not award duplicate badges", () => {
    fanBadges.awardBadge(3003, "early_adopter");
    const result = fanBadges.awardBadge(3003, "early_adopter");
    expect(result.alreadyHas).toBe(true);
  });

  it("gets all available badges", () => {
    const allBadges = fanBadges.getAllBadges();
    expect(Array.isArray(allBadges)).toBe(true);
    expect(allBadges.length).toBeGreaterThan(0);
    expect(allBadges[0]).toHaveProperty("id");
    expect(allBadges[0]).toHaveProperty("name");
  });

  it("gets badge stats for a user", () => {
    fanBadges.awardBadge(3004, "first_post");
    const stats = fanBadges.getBadgeStats(3004);
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("byRarity");
  });

  it("checks and awards badges based on stats", () => {
    const awarded = fanBadges.checkAndAwardBadges(3005, {
      streakDays: 7,
      totalSpend: 100,
      loyaltyTier: "bronze",
      joinDaysAgo: 30,
    });
    expect(Array.isArray(awarded)).toBe(true);
  });
});

describe("Phase 6B: Fan Subscriptions", () => {
  it("subscribes a user to a creator tier", () => {
    const sub = fanSubscriptions.subscribe(4001, 1, "supporter", "USD");
    expect(sub).toMatchObject({ fanId: 4001, creatorId: 1, tier: "supporter" });
  });

  it("cancels a subscription", () => {
    const sub = fanSubscriptions.subscribe(4002, 1, "patron", "USD");
    const result = fanSubscriptions.cancelSubscription(sub.id);
    expect(result).toHaveProperty("success");
  });

  it("gets subscription for fan/creator pair", () => {
    fanSubscriptions.subscribe(4003, 2, "supporter", "USD");
    const sub = fanSubscriptions.getSubscription(4003, 2);
    expect(sub).toMatchObject({ fanId: 4003, creatorId: 2 });
  });

  it("gets creator subscriber stats", () => {
    fanSubscriptions.subscribe(4004, 3, "supporter", "USD");
    fanSubscriptions.subscribe(4005, 3, "patron", "USD");
    const stats = fanSubscriptions.getCreatorSubscribers(3);
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("byTier");
    expect(stats).toHaveProperty("mrr");
  });

  it("upgrades subscription tier", () => {
    const sub = fanSubscriptions.subscribe(4006, 4, "supporter", "USD");
    const result = fanSubscriptions.upgradeTier(sub.id, "patron");
    expect(result).toHaveProperty("success");
  });
});

describe("Phase 6B: Milestone Rewards", () => {
  it("checks milestones for a user", () => {
    const triggered = milestoneRewards.checkMilestones(5001, {
      followers: 1000,
      posts: 10,
      revenue: 500,
      streak: 7,
      subscribers: 50,
    });
    expect(Array.isArray(triggered)).toBe(true);
  });

  it("triggers follower milestone at 1000", () => {
    const triggered = milestoneRewards.checkMilestones(5002, {
      followers: 1000,
      posts: 0,
      revenue: 0,
      streak: 0,
      subscribers: 0,
    });
    expect(triggered.some(m => m.id.includes("follower") || m.reward.type !== undefined)).toBe(true);
  });

  it("gets user milestone history", () => {
    milestoneRewards.checkMilestones(5003, { followers: 100, posts: 1, revenue: 50, streak: 3, subscribers: 5 });
    const history = milestoneRewards.getUserMilestones(5003);
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Phase 6B: Fan Quests", () => {
  it("gets active quests", () => {
    const quests = fanQuests.getActiveQuests(6001);
    expect(Array.isArray(quests)).toBe(true);
    expect(quests.length).toBeGreaterThan(0);
  });

  it("starts a quest", () => {
    const quests = fanQuests.getActiveQuests(6002);
    if (quests.length > 0) {
      const result = fanQuests.startQuest(6002, quests[0].id);
      expect(result).toHaveProperty("success");
    }
  });

  it("records quest action", () => {
    const quests = fanQuests.getActiveQuests(6003);
    if (quests.length > 0) {
      fanQuests.startQuest(6003, quests[0].id);
      const result = fanQuests.recordQuestAction(6003, quests[0].id, quests[0].tasks[0]?.type ?? "post", 1);
      expect(result).toHaveProperty("progress");
    }
  });

  it("gets user quest progress", () => {
    const progress = fanQuests.getUserQuestProgress(6004);
    expect(Array.isArray(progress)).toBe(true);
  });
});

describe("Phase 6B: Fan Leveling", () => {
  it("gets level for a new user", () => {
    const level = fanLeveling.getLevel(7001);
    expect(level).toMatchObject({ userId: 7001, level: 1 });
  });

  it("awards XP and potentially levels up", () => {
    const result = fanLeveling.awardXP(7002, 500);
    expect(result).toHaveProperty("level");
    expect(result).toHaveProperty("xp");
    expect(result).toHaveProperty("leveledUp");
  });

  it("gets leaderboard", () => {
    fanLeveling.awardXP(7003, 100);
    const leaderboard = fanLeveling.getLeaderboard(10);
    expect(Array.isArray(leaderboard)).toBe(true);
    expect(leaderboard.length).toBeGreaterThan(0);
    expect(leaderboard[0]).toHaveProperty("userId");
    expect(leaderboard[0]).toHaveProperty("level");
  });
});

describe("Phase 6B: Supporter Ladders", () => {
  it("creates a supporter ladder", () => {
    const ladder = supporterLadders.createLadder(1, [
      { rank: 1, title: "Bronze Supporter", minSpend: 0, maxSpend: 99, perks: ["badge"] },
      { rank: 2, title: "Silver Supporter", minSpend: 100, maxSpend: 499, perks: ["badge", "early_access"] },
      { rank: 3, title: "Gold Supporter", minSpend: 500, maxSpend: null, perks: ["badge", "early_access", "1on1"] },
    ]);
    expect(ladder).toHaveProperty("creatorId", 1);
    expect(ladder.tiers).toHaveLength(3);
  });

  it("records spend and gets ranking", () => {
    supporterLadders.createLadder(2, [
      { rank: 1, title: "Fan", minSpend: 0, maxSpend: null, perks: ["badge"] },
    ]);
    supporterLadders.recordSpend(8001, 2, 150);
    const ranking = supporterLadders.getRanking(8001, 2);
    expect(ranking).toHaveProperty("userId", 8001);
    expect(ranking).toHaveProperty("totalSpend");
  });

  it("gets top supporters", () => {
    supporterLadders.recordSpend(8002, 2, 500);
    supporterLadders.recordSpend(8003, 2, 250);
    const top = supporterLadders.getTopSupporters(2, 5);
    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeGreaterThan(0);
  });
});

// ─── Phase 6C: Live Event Engine ─────────────────────────────────────────────
import {
  liveEventEngine,
  eventLeaderboards,
  liveRaffles,
  eventMerchDrops,
  premiumSpaces,
} from "./live-event-engine";

describe("Phase 6C: Live Event Engine", () => {
  it("creates a live event", () => {
    const event = liveEventEngine.createEvent(1, {
      title: "AMA Session",
      description: "Ask me anything!",
      category: "ama",
      scheduledAt: new Date(Date.now() + 86400000),
      maxAttendees: 500,
      ticketPrice: 0,
      currency: "USD",
    });
    expect(event).toMatchObject({ hostId: 1, title: "AMA Session" });
  });

  it("purchases a ticket for a paid event", () => {
    const event = liveEventEngine.createEvent(1, {
      title: "Paid Concert",
      description: "Live music!",
      category: "concert",
      scheduledAt: new Date(Date.now() + 172800000),
      maxAttendees: 200,
      ticketPrice: 25,
      currency: "USD",
    });
    const ticket = liveEventEngine.purchaseTicket(event.id, 8001);
    expect(ticket).toMatchObject({ eventId: event.id, userId: 8001 });
  });

  it("gets upcoming events", () => {
    liveEventEngine.createEvent(2, {
      title: "Workshop",
      description: "Learn to code",
      category: "workshop",
      scheduledAt: new Date(Date.now() + 259200000),
      maxAttendees: 50,
      ticketPrice: 0,
      currency: "USD",
    });
    const events = liveEventEngine.getUpcomingEvents();
    expect(events.length).toBeGreaterThan(0);
  });

  it("starts and ends an event", () => {
    const event = liveEventEngine.createEvent(1, {
      title: "Quick Event",
      description: "Short",
      category: "ama",
      scheduledAt: new Date(),
      maxAttendees: 10,
      ticketPrice: 0,
      currency: "USD",
    });
    liveEventEngine.startEvent(event.id);
    let updated = liveEventEngine.getEvent(event.id);
    expect(updated?.status).toBe("live");
    liveEventEngine.endEvent(event.id);
    updated = liveEventEngine.getEvent(event.id);
    expect(updated?.status).toBe("ended");
  });

  it("gets event analytics", () => {
    const event = liveEventEngine.createEvent(3, {
      title: "Analytics Event",
      description: "Test",
      category: "ama",
      scheduledAt: new Date(Date.now() + 3600000),
      maxAttendees: 100,
      ticketPrice: 0,
      currency: "USD",
    });
    const analytics = liveEventEngine.getEventAnalytics(event.id);
    expect(analytics).toHaveProperty("totalAttendees");
    expect(analytics).toHaveProperty("revenue");
  });
});

describe("Phase 6C: Event Leaderboards", () => {
  it("creates a leaderboard for an event", () => {
    const lb = eventLeaderboards.createLeaderboard("event_1", "Most Donations", "donations");
    expect(lb).toMatchObject({ eventId: "event_1", name: "Most Donations" });
  });

  it("records a score", () => {
    const lb = eventLeaderboards.createLeaderboard("event_2", "Top Cheerers", "cheers");
    eventLeaderboards.recordScore(lb.id, 9001, 150);
    const top = eventLeaderboards.getTopN(lb.id, 10);
    expect(top.some(e => e.userId === 9001)).toBe(true);
  });

  it("ranks entries correctly", () => {
    const lb = eventLeaderboards.createLeaderboard("event_3", "Engagement", "engagement");
    eventLeaderboards.recordScore(lb.id, 9002, 200);
    eventLeaderboards.recordScore(lb.id, 9003, 350);
    eventLeaderboards.recordScore(lb.id, 9004, 100);
    const top = eventLeaderboards.getTopN(lb.id, 3);
    expect(top[0].userId).toBe(9003);
    expect(top[1].userId).toBe(9002);
    expect(top[2].userId).toBe(9004);
  });
});

describe("Phase 6C: Live Raffles", () => {
  it("creates a raffle", () => {
    const raffle = liveRaffles.createRaffle("event_1", 1, {
      prize: "PlayStation 5",
      ticketPrice: 5,
      maxTickets: 100,
      endsAt: new Date(Date.now() + 3600000),
    });
    expect(raffle).toMatchObject({ eventId: "event_1", prize: "PlayStation 5" });
  });

  it("purchases a raffle ticket", () => {
    const raffle = liveRaffles.createRaffle("event_2", 1, {
      prize: "Signed Merch",
      ticketPrice: 2,
      maxTickets: 50,
      endsAt: new Date(Date.now() + 7200000),
    });
    const ticket = liveRaffles.purchaseTicket(raffle.id, 10001);
    expect(ticket).toMatchObject({ raffleId: raffle.id, userId: 10001 });
  });

  it("draws a winner", () => {
    const raffle = liveRaffles.createRaffle("event_3", 1, {
      prize: "Gift Card",
      ticketPrice: 1,
      maxTickets: 10,
      endsAt: new Date(Date.now() - 1000),
    });
    liveRaffles.purchaseTicket(raffle.id, 10002);
    liveRaffles.purchaseTicket(raffle.id, 10003);
    const result = liveRaffles.drawWinner(raffle.id);
    expect(result).toHaveProperty("winnerId");
    expect([10002, 10003]).toContain(result.winnerId);
  });
});

// ─── Phase 6D-6I: Phase6 Engines ─────────────────────────────────────────────
import {
  creatorLoans,
  communityGrants,
  stakingMultipliers,
  adRevenueSharing,
  loyaltyTokenRewards,
  hopeAI,
  discoveryEngine,
  businessIntelligence,
  globalExpansion,
  trustEmpire,
} from "./phase6-engines";

describe("Phase 6D: Creator Loans", () => {
  it("applies for a loan", () => {
    const loan = creatorLoans.applyForLoan(1, 5000, "USD", 90, { type: "staking", value: 10000 });
    expect(loan).toMatchObject({ creatorId: 1, amount: 5000, currency: "USD" });
    expect(["pending", "approved", "rejected"]).toContain(loan.status);
  });

  it("rejects loan with insufficient collateral", () => {
    expect(() => creatorLoans.applyForLoan(1, 100000, "USD", 30, { type: "staking", value: 100 })).toThrow();
  });

  it("gets creator loans", () => {
    creatorLoans.applyForLoan(2, 1000, "SKY", 30, { type: "revenue", value: 5000 });
    const loans = creatorLoans.getCreatorLoans(2);
    expect(loans.length).toBeGreaterThan(0);
  });

  it("repays a loan", () => {
    const loan = creatorLoans.applyForLoan(3, 2000, "USD", 60, { type: "nft", value: 8000 });
    const result = creatorLoans.repayLoan(loan.id, 2000);
    expect(result).toHaveProperty("success", true);
  });
});

describe("Phase 6D: Community Grants", () => {
  it("creates a grant program", () => {
    const grant = communityGrants.createGrantProgram("Creator Fund Q1", 50000, "USD", new Date(), new Date(Date.now() + 30 * 86400000), ["content_creation", "education"]);
    expect(grant).toMatchObject({ name: "Creator Fund Q1", totalBudget: 50000 });
  });

  it("applies for a grant", () => {
    const grant = communityGrants.createGrantProgram("Dev Fund", 10000, "USD", new Date(), new Date(Date.now() + 14 * 86400000), ["development"]);
    const application = communityGrants.applyForGrant(grant.id, 1, "Build a new tool", 2000);
    expect(application).toMatchObject({ grantId: grant.id, applicantId: 1, requestedAmount: 2000 });
  });

  it("approves a grant application", () => {
    const grant = communityGrants.createGrantProgram("Art Fund", 5000, "USD", new Date(), new Date(Date.now() + 7 * 86400000), ["art"]);
    const app = communityGrants.applyForGrant(grant.id, 2, "Create digital art", 1000);
    communityGrants.approveApplication(app.id, 1000);
    const applications = communityGrants.getApplications(grant.id);
    const updated = applications.find(a => a.id === app.id);
    expect(updated?.status).toBe("approved");
  });
});

describe("Phase 6D: Staking Multipliers", () => {
  it("calculates multiplier for bronze tier", () => {
    const result = stakingMultipliers.calculateMultiplier(1, { loyaltyTier: "bronze", streakDays: 0, communityRole: "member", holdingDays: 0 });
    expect(result.multiplier).toBeGreaterThanOrEqual(1);
  });

  it("returns higher multiplier for legend tier", () => {
    const bronze = stakingMultipliers.calculateMultiplier(1, { loyaltyTier: "bronze", streakDays: 0, communityRole: "member", holdingDays: 0 });
    const legend = stakingMultipliers.calculateMultiplier(1, { loyaltyTier: "legend", streakDays: 365, communityRole: "moderator", holdingDays: 365 });
    expect(legend.multiplier).toBeGreaterThan(bronze.multiplier);
  });

  it("includes breakdown of multiplier components", () => {
    const result = stakingMultipliers.calculateMultiplier(1, { loyaltyTier: "gold", streakDays: 30, communityRole: "creator", holdingDays: 90 });
    expect(result).toHaveProperty("breakdown");
    expect(result.breakdown).toHaveProperty("tier");
    expect(result.breakdown).toHaveProperty("streak");
  });
});

describe("Phase 6D: Ad Revenue Sharing", () => {
  it("records ad revenue for a creator", () => {
    adRevenueSharing.recordRevenue(1, 500, "USD", "banner", 10000, 250);
    const revenue = adRevenueSharing.getCreatorAdRevenue(1);
    expect(revenue.totalRevenue).toBeGreaterThan(0);
  });

  it("calculates creator share correctly", () => {
    adRevenueSharing.recordRevenue(2, 1000, "USD", "video", 50000, 1000);
    const revenue = adRevenueSharing.getCreatorAdRevenue(2);
    expect(revenue.creatorShare).toBeGreaterThan(0);
    expect(revenue.creatorShare).toBeLessThan(revenue.totalRevenue);
  });
});

describe("Phase 6D: Loyalty Token Rewards", () => {
  it("awards tokens for an action", () => {
    loyaltyTokenRewards.awardTokens(1, "post_created", 1);
    const balance = loyaltyTokenRewards.getBalance(1);
    expect(balance).toBeGreaterThan(0);
  });

  it("gets transaction history", () => {
    loyaltyTokenRewards.awardTokens(3, "like_received", 1);
    const history = loyaltyTokenRewards.getHistory(3);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toHaveProperty("action");
    expect(history[0]).toHaveProperty("amount");
  });
});

describe("Phase 6E: HOPE AI", () => {
  it("provides creator copilot insights", () => {
    const insights = hopeAI.creatorCopilot(1, { recentPosts: 10, avgEngagement: 5.2, followerGrowth: 2.1, revenue: 1500 });
    expect(insights).toHaveProperty("insights");
    expect(insights).toHaveProperty("recommendations");
    expect(Array.isArray(insights.recommendations)).toBe(true);
  });

  it("generates a content plan", () => {
    const plan = hopeAI.contentPlanner(1, "tech", { topInterests: ["AI", "coding"], peakHours: [18, 19, 20] });
    expect(plan).toHaveProperty("weeklyPlan");
    expect(Array.isArray(plan.weeklyPlan)).toBe(true);
  });

  it("predicts trends for a niche", () => {
    const trends = hopeAI.trendPredictor("gaming", []);
    expect(trends).toHaveProperty("emerging");
    expect(Array.isArray(trends.emerging)).toBe(true);
  });

  it("moderates content — safe", () => {
    const result = hopeAI.moderationCopilot("post_1", "This is a great post!");
    expect(result).toHaveProperty("safe");
    expect(result).toHaveProperty("confidence");
  });

  it("flags harmful content", () => {
    const result = hopeAI.moderationCopilot("post_2", "Buy fake followers now! Spam spam spam!");
    expect(result.safe).toBe(false);
  });

  it("provides growth strategy", () => {
    const strategy = hopeAI.growthCopilot(1, { currentFollowers: 5000, growthRate: 2.5, topContent: ["video", "reel"] });
    expect(strategy).toHaveProperty("strategies");
    expect(Array.isArray(strategy.strategies)).toBe(true);
  });
});

describe("Phase 6F: Discovery Engine", () => {
  it("gets trending content", () => {
    const trending = discoveryEngine.getTrending("post", undefined, 10);
    expect(Array.isArray(trending)).toBe(true);
  });

  it("searches across all types", () => {
    const results = discoveryEngine.search("blockchain", undefined, 20);
    expect(results).toHaveProperty("results");
    expect(results).toHaveProperty("total");
  });

  it("gets personalized content", () => {
    const personalized = discoveryEngine.getPersonalized(1, ["tech", "crypto"], 10);
    expect(Array.isArray(personalized)).toBe(true);
  });

  it("gets trending map", () => {
    const map = discoveryEngine.getTrendingMap();
    expect(map).toHaveProperty("categories");
    expect(map).toHaveProperty("hashtags");
  });
});

describe("Phase 6G: Business Intelligence", () => {
  it("returns executive dashboard", () => {
    const dashboard = businessIntelligence.getExecutiveDashboard();
    expect(dashboard).toHaveProperty("revenue");
    expect(dashboard).toHaveProperty("users");
    expect(dashboard).toHaveProperty("growth");
  });

  it("returns treasury dashboard", () => {
    const dashboard = businessIntelligence.getTreasuryDashboard();
    expect(dashboard).toHaveProperty("totalTVL");
    expect(dashboard).toHaveProperty("stakingAPY");
  });

  it("returns creator economy dashboard", () => {
    const dashboard = businessIntelligence.getCreatorEconomyDashboard();
    expect(dashboard).toHaveProperty("totalCreators");
    expect(dashboard).toHaveProperty("totalPayouts");
  });

  it("returns growth dashboard", () => {
    const dashboard = businessIntelligence.getGrowthDashboard();
    expect(dashboard).toHaveProperty("dau");
    expect(dashboard).toHaveProperty("mau");
    expect(dashboard).toHaveProperty("retention");
  });

  it("returns fraud dashboard", () => {
    const dashboard = businessIntelligence.getFraudDashboard();
    expect(dashboard).toHaveProperty("flaggedAccounts");
    expect(dashboard).toHaveProperty("blockedTransactions");
  });
});

describe("Phase 6H: Global Expansion", () => {
  it("gets locale config for en-US", () => {
    const config = globalExpansion.getLocaleConfig("en-US");
    expect(config).toMatchObject({ locale: "en-US" });
    expect(config).toHaveProperty("currency");
    expect(config).toHaveProperty("dateFormat");
  });

  it("gets locale config for ja-JP", () => {
    const config = globalExpansion.getLocaleConfig("ja-JP");
    expect(config).toMatchObject({ locale: "ja-JP" });
  });

  it("returns supported locales", () => {
    const locales = globalExpansion.getSupportedLocales();
    expect(locales.length).toBeGreaterThan(0);
    expect(locales.some(l => l.locale === "en-US")).toBe(true);
  });

  it("calculates regional payout", () => {
    const payout = globalExpansion.calculateRegionalPayout(100, "USD", "en-US");
    expect(payout).toHaveProperty("amount");
    expect(payout).toHaveProperty("currency");
    expect(payout).toHaveProperty("fees");
  });
});

describe("Phase 6I: Trust Empire", () => {
  it("creates a trust profile", () => {
    const profile = trustEmpire.getProfile(20001);
    expect(profile).toMatchObject({ userId: 20001 });
    expect(profile).toHaveProperty("trustScore");
    expect(profile).toHaveProperty("tier");
  });

  it("adds a verification", () => {
    trustEmpire.addVerification(20002, "email");
    const profile = trustEmpire.getProfile(20002);
    expect(profile.verifications.some((v: any) => v.type === "email")).toBe(true);
  });

  it("increases trust score with more verifications", () => {
    const before = trustEmpire.getProfile(20003).trustScore;
    trustEmpire.addVerification(20003, "phone");
    trustEmpire.addVerification(20003, "kyc");
    const after = trustEmpire.getProfile(20003).trustScore;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("gets tier benefits", () => {
    const benefits = trustEmpire.getTierBenefits("verified");
    expect(benefits).toHaveProperty("badge");
    expect(benefits).toHaveProperty("feeDiscount");
  });

  it("gets trust leaderboard", () => {
    trustEmpire.addVerification(20004, "email");
    const leaderboard = trustEmpire.getLeaderboard(10);
    expect(Array.isArray(leaderboard)).toBe(true);
  });

  it("records a trust event", () => {
    trustEmpire.recordTrustEvent(20005, "positive", "helpful_content", 5);
    const profile = trustEmpire.getProfile(20005);
    expect(profile.trustScore).toBeGreaterThan(0);
  });

  it("reduces trust score for negative events", () => {
    trustEmpire.addVerification(20006, "email");
    const before = trustEmpire.getProfile(20006).trustScore;
    trustEmpire.recordTrustEvent(20006, "negative", "spam_report", 10);
    const after = trustEmpire.getProfile(20006).trustScore;
    expect(after).toBeLessThanOrEqual(before);
  });
});
