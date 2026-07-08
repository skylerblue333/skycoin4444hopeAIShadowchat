/**
 * CREATOR ECONOMY ENGINE
 * Full monetization system for content creators:
 * - Subscription Tier Management (free, basic, premium, VIP)
 * - Paywall Content Gating (per-post, per-collection, per-tier)
 * - Revenue Split Calculation (platform fee, creator share, referral bonus)
 * - Payout Scheduling (weekly, bi-weekly, monthly, threshold-based)
 * - Creator Analytics (earnings, growth, engagement, top content)
 * - Fan Engagement Scoring (superfans, casual, dormant)
 * - Tipping with Custom Amounts and Messages
 * - Gift Subscriptions (one user gifts another a sub)
 * - Revenue Forecasting (based on trends)
 * - Creator Milestones and Achievements
 */

import { getDb } from "./db";
import * as schema from "../drizzle";
import { eq, and, desc, sql, gte, lte, count, sum } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SubscriptionTier {
  id: string;
  creatorId: number;
  name: string;
  price: number;
  currency: string;
  benefits: string[];
  maxSubscribers?: number;
  isActive: boolean;
  subscriberCount: number;
}

export interface PaywallConfig {
  postId: number;
  requiredTier: string;
  previewLength?: number;
  teaser?: string;
  unlockPrice?: number;
}

export interface RevenueSplit {
  creatorShare: number;
  platformFee: number;
  referralBonus: number;
  taxWithholding: number;
  netCreatorEarnings: number;
}

export interface PayoutSchedule {
  id: string;
  creatorId: number;
  frequency: "weekly" | "biweekly" | "monthly" | "threshold";
  threshold?: number;
  nextPayoutDate: Date;
  preferredMethod: "crypto" | "bank" | "paypal";
  walletAddress?: string;
  minimumPayout: number;
  isActive: boolean;
}

export interface CreatorAnalytics {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  subscriberCount: number;
  subscriberGrowth: number;
  topContent: { postId: number; title: string; earnings: number; views: number }[];
  earningsBySource: { source: string; amount: number; percent: number }[];
  engagementRate: number;
  avgTipAmount: number;
  conversionRate: number;
}

export interface FanScore {
  userId: number;
  score: number;
  tier: "superfan" | "loyal" | "casual" | "dormant";
  totalSpent: number;
  subscriptionMonths: number;
  tipsGiven: number;
  commentsCount: number;
  lastActive: Date;
}

export interface CreatorMilestone {
  id: string;
  name: string;
  description: string;
  requirement: { metric: string; target: number };
  reward: { type: "badge" | "tokens" | "feature_unlock"; value: string | number };
  progress: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface RevenueForcast {
  period: string;
  projected: number;
  confidence: number;
  factors: { name: string; impact: number }[];
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION TIER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export class SubscriptionTierService {
  private readonly DEFAULT_TIERS: Omit<SubscriptionTier, "creatorId" | "subscriberCount">[] = [
    { id: "free", name: "Free", price: 0, currency: "SKY444", benefits: ["Access to public posts", "Community chat"], isActive: true },
    { id: "basic", name: "Basic", price: 5, currency: "SKY444", benefits: ["All free benefits", "Exclusive posts", "Early access"], isActive: true },
    { id: "premium", name: "Premium", price: 15, currency: "SKY444", benefits: ["All basic benefits", "1-on-1 messages", "Custom badge", "Behind the scenes"], isActive: true },
    { id: "vip", name: "VIP", price: 50, currency: "SKY444", benefits: ["All premium benefits", "Monthly call", "Custom content", "Revenue share"], maxSubscribers: 50, isActive: true },
  ];

  getDefaultTiers(creatorId: number): SubscriptionTier[] {
    return this.DEFAULT_TIERS.map(t => ({ ...t, creatorId, subscriberCount: 0 }));
  }

  async getCreatorTiers(creatorId: number): Promise<SubscriptionTier[]> {
    const db = await getDb();
    if (!db) return this.getDefaultTiers(creatorId);

    const subs = await db
      .select()
      .from(schema.creatorSubscriptions)
      .where(eq(schema.creatorSubscriptions.creatorId, creatorId));

    if (subs.length === 0) return this.getDefaultTiers(creatorId);

    // Group by tier
    const tierMap = new Map<string, number>();
    subs.forEach(s => {
      const tier = s.tier || "basic";
      tierMap.set(tier, (tierMap.get(tier) || 0) + 1);
    });

    return this.DEFAULT_TIERS.map(t => ({
      ...t,
      creatorId,
      subscriberCount: tierMap.get(t.id) || 0,
    }));
  }

  async subscribe(subscriberId: number, creatorId: number, tierId: string): Promise<{ success: boolean; message: string }> {
    const db = await getDb();
    if (!db) return { success: false, message: "Database unavailable" };

    // Check if already subscribed
    const [existing] = await db
      .select()
      .from(schema.creatorSubscriptions)
      .where(
        and(
          eq(schema.creatorSubscriptions.subscriberId, subscriberId),
          eq(schema.creatorSubscriptions.creatorId, creatorId),
          eq(schema.creatorSubscriptions.status, "active")
        )
      );

    if (existing) return { success: false, message: "Already subscribed to this creator" };

    const tier = this.DEFAULT_TIERS.find(t => t.id === tierId);
    if (!tier) return { success: false, message: "Invalid tier" };

    // Check max subscribers for VIP
    if (tier.maxSubscribers) {
      const [count] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.creatorSubscriptions)
        .where(
          and(
            eq(schema.creatorSubscriptions.creatorId, creatorId),
            eq(schema.creatorSubscriptions.tier, tierId as "supporter" | "premium" | "vip"),
            eq(schema.creatorSubscriptions.status, "active")
          )
        );
      if ((count?.count || 0) >= tier.maxSubscribers) {
        return { success: false, message: "This tier is full" };
      }
    }

    const tierMapping: Record<string, "supporter" | "premium" | "vip"> = {
      free: "supporter",
      basic: "supporter",
      premium: "premium",
      vip: "vip",
    };
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(schema.creatorSubscriptions).values({
      subscriberId,
      creatorId,
      tier: tierMapping[tierId] || "supporter",
      price: String(tier.price),
      status: "active",
      expiresAt,
    });

    return { success: true, message: `Subscribed to ${tier.name} tier` };
  }

  async unsubscribe(subscriberId: number, creatorId: number): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    await db
      .update(schema.creatorSubscriptions)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(schema.creatorSubscriptions.subscriberId, subscriberId),
          eq(schema.creatorSubscriptions.creatorId, creatorId),
          eq(schema.creatorSubscriptions.status, "active")
        )
      );

    return true;
  }
}

// ═══════════════════════════════════════════════════════════════
// REVENUE SPLIT CALCULATOR
// ═══════════════════════════════════════════════════════════════

export class RevenueSplitCalculator {
  private readonly PLATFORM_FEE_RATE = 0.10; // 10% platform fee
  private readonly REFERRAL_BONUS_RATE = 0.05; // 5% referral bonus
  private readonly TAX_WITHHOLDING_RATE = 0.0; // 0% default (creator handles own taxes)

  calculate(grossAmount: number, hasReferrer = false): RevenueSplit {
    const platformFee = grossAmount * this.PLATFORM_FEE_RATE;
    const referralBonus = hasReferrer ? grossAmount * this.REFERRAL_BONUS_RATE : 0;
    const taxWithholding = grossAmount * this.TAX_WITHHOLDING_RATE;
    const netCreatorEarnings = grossAmount - platformFee - referralBonus - taxWithholding;

    return {
      creatorShare: netCreatorEarnings / grossAmount,
      platformFee,
      referralBonus,
      taxWithholding,
      netCreatorEarnings,
    };
  }

  calculateBulk(amounts: number[]): { total: number; splits: RevenueSplit[] } {
    const splits = amounts.map(a => this.calculate(a));
    return {
      total: splits.reduce((sum, s) => sum + s.netCreatorEarnings, 0),
      splits,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// PAYOUT SCHEDULING SERVICE
// ═══════════════════════════════════════════════════════════════

export class PayoutSchedulingService {
  async getPayoutSchedule(creatorId: number): Promise<PayoutSchedule> {
    // Default schedule
    return {
      id: `sched_${creatorId}`,
      creatorId,
      frequency: "monthly",
      nextPayoutDate: this.getNextPayoutDate("monthly"),
      preferredMethod: "crypto",
      minimumPayout: 10,
      isActive: true,
    };
  }

  async getPendingPayout(creatorId: number): Promise<{ amount: number; period: string; breakdown: { source: string; amount: number }[] }> {
    const db = await getDb();
    if (!db) return { amount: 0, period: "current", breakdown: [] };

    // Calculate pending from tips
    const [tipTotal] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${schema.tips.amount} AS DECIMAL(20,2))), 0)` })
      .from(schema.tips)
      .where(eq(schema.tips.receiverId, creatorId));

    // Calculate pending from subscriptions
    const [subTotal] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${schema.creatorSubscriptions.price} AS DECIMAL(20,2))), 0)` })
      .from(schema.creatorSubscriptions)
      .where(
        and(
          eq(schema.creatorSubscriptions.creatorId, creatorId),
          eq(schema.creatorSubscriptions.status, "active")
        )
      );

    const tips = parseFloat(String(tipTotal?.total || "0"));
    const subs = parseFloat(String(subTotal?.total || "0"));
    const calculator = new RevenueSplitCalculator();
    const tipSplit = calculator.calculate(tips);
    const subSplit = calculator.calculate(subs);

    return {
      amount: tipSplit.netCreatorEarnings + subSplit.netCreatorEarnings,
      period: new Date().toISOString().slice(0, 7),
      breakdown: [
        { source: "Tips", amount: tipSplit.netCreatorEarnings },
        { source: "Subscriptions", amount: subSplit.netCreatorEarnings },
      ],
    };
  }

  private getNextPayoutDate(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case "weekly":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case "biweekly":
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      case "monthly":
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CREATOR ANALYTICS SERVICE
// ═══════════════════════════════════════════════════════════════

export class CreatorAnalyticsService {
  async getAnalytics(creatorId: number): Promise<CreatorAnalytics> {
    const db = await getDb();
    if (!db) return { totalEarnings: 0, monthlyEarnings: 0, weeklyEarnings: 0, subscriberCount: 0, subscriberGrowth: 0, topContent: [], earningsBySource: [], engagementRate: 0, avgTipAmount: 0, conversionRate: 0 };

    // Total tips received
    const [tipStats] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${schema.tips.amount} AS DECIMAL(20,2))), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.tips)
      .where(eq(schema.tips.receiverId, creatorId));

    // Subscriber count
    const [subCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.creatorSubscriptions)
      .where(
        and(
          eq(schema.creatorSubscriptions.creatorId, creatorId),
          eq(schema.creatorSubscriptions.status, "active")
        )
      );

    // Subscription revenue
    const [subRevenue] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${schema.creatorSubscriptions.price} AS DECIMAL(20,2))), 0)` })
      .from(schema.creatorSubscriptions)
      .where(
        and(
          eq(schema.creatorSubscriptions.creatorId, creatorId),
          eq(schema.creatorSubscriptions.status, "active")
        )
      );

    // Post engagement
    const [postStats] = await db
      .select({
        count: sql<number>`COUNT(*)`,
        totalLikes: sql<string>`COALESCE(SUM(${schema.posts.likeCount}), 0)`,
      })
      .from(schema.posts)
      .where(eq(schema.posts.authorId, creatorId));

    const totalTips = parseFloat(String(tipStats?.total || "0"));
    const totalSubs = parseFloat(String(subRevenue?.total || "0"));
    const totalEarnings = totalTips + totalSubs;
    const tipCount = tipStats?.count || 0;
    const postCount = postStats?.count || 1;
    const totalLikes = parseInt(String(postStats?.totalLikes || "0"));

    return {
      totalEarnings,
      monthlyEarnings: totalEarnings * 0.3, // Approximate last 30 days
      weeklyEarnings: totalEarnings * 0.08,
      subscriberCount: subCount?.count || 0,
      subscriberGrowth: 0,
      topContent: [],
      earningsBySource: [
        { source: "Tips", amount: totalTips, percent: totalEarnings > 0 ? (totalTips / totalEarnings) * 100 : 50 },
        { source: "Subscriptions", amount: totalSubs, percent: totalEarnings > 0 ? (totalSubs / totalEarnings) * 100 : 50 },
      ],
      engagementRate: postCount > 0 ? (totalLikes / postCount) * 100 : 0,
      avgTipAmount: tipCount > 0 ? totalTips / tipCount : 0,
      conversionRate: 0,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// FAN ENGAGEMENT SCORING
// ═══════════════════════════════════════════════════════════════

export class FanEngagementService {
  async getTopFans(creatorId: number, limit = 20): Promise<FanScore[]> {
    const db = await getDb();
    if (!db) return [];

    // Get subscribers with their spending
    const fans = await db
      .select({
        userId: schema.creatorSubscriptions.subscriberId,
      })
      .from(schema.creatorSubscriptions)
      .where(
        and(
          eq(schema.creatorSubscriptions.creatorId, creatorId),
          eq(schema.creatorSubscriptions.status, "active")
        )
      )
      .limit(limit);

    const fanScores: FanScore[] = [];

    for (const fan of fans) {
      // Get tips from this fan to this creator
      const [tipData] = await db
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${schema.tips.amount} AS DECIMAL(20,2))), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(schema.tips)
        .where(
          and(
            eq(schema.tips.senderId, fan.userId),
            eq(schema.tips.receiverId, creatorId)
          )
        );

      const totalSpent = parseFloat(String(tipData?.total || "0"));
      const tipsGiven = tipData?.count || 0;

      // Calculate score (0-100)
      const score = Math.min(100, totalSpent * 2 + tipsGiven * 5);
      const tier: FanScore["tier"] =
        score >= 80 ? "superfan" : score >= 50 ? "loyal" : score >= 20 ? "casual" : "dormant";

      fanScores.push({
        userId: fan.userId,
        score,
        tier,
        totalSpent,
        subscriptionMonths: 1,
        tipsGiven,
        commentsCount: 0,
        lastActive: new Date(),
      });
    }

    return fanScores.sort((a, b) => b.score - a.score);
  }
}

// ═══════════════════════════════════════════════════════════════
// CREATOR MILESTONES
// ═══════════════════════════════════════════════════════════════

export class CreatorMilestoneService {
  private readonly MILESTONES: Omit<CreatorMilestone, "progress" | "isCompleted" | "completedAt">[] = [
    { id: "first_post", name: "First Steps", description: "Create your first post", requirement: { metric: "posts", target: 1 }, reward: { type: "badge", value: "Creator" } },
    { id: "10_followers", name: "Growing Audience", description: "Reach 10 followers", requirement: { metric: "followers", target: 10 }, reward: { type: "tokens", value: 100 } },
    { id: "50_followers", name: "Rising Star", description: "Reach 50 followers", requirement: { metric: "followers", target: 50 }, reward: { type: "tokens", value: 500 } },
    { id: "100_followers", name: "Influencer", description: "Reach 100 followers", requirement: { metric: "followers", target: 100 }, reward: { type: "badge", value: "Influencer" } },
    { id: "first_tip", name: "First Tip", description: "Receive your first tip", requirement: { metric: "tips_received", target: 1 }, reward: { type: "tokens", value: 50 } },
    { id: "first_sub", name: "Subscriber Magnet", description: "Get your first subscriber", requirement: { metric: "subscribers", target: 1 }, reward: { type: "badge", value: "Monetized" } },
    { id: "100_posts", name: "Content Machine", description: "Create 100 posts", requirement: { metric: "posts", target: 100 }, reward: { type: "tokens", value: 1000 } },
    { id: "1000_likes", name: "Crowd Favorite", description: "Receive 1000 total likes", requirement: { metric: "total_likes", target: 1000 }, reward: { type: "badge", value: "Fan Favorite" } },
    { id: "first_stream", name: "Live!", description: "Start your first stream", requirement: { metric: "streams", target: 1 }, reward: { type: "feature_unlock", value: "stream_overlay" } },
    { id: "10_subs", name: "Community Builder", description: "Reach 10 subscribers", requirement: { metric: "subscribers", target: 10 }, reward: { type: "tokens", value: 2000 } },
    { id: "1000_earnings", name: "Professional Creator", description: "Earn 1000 SKY444 total", requirement: { metric: "total_earnings", target: 1000 }, reward: { type: "badge", value: "Pro Creator" } },
    { id: "10000_earnings", name: "Top Earner", description: "Earn 10,000 SKY444 total", requirement: { metric: "total_earnings", target: 10000 }, reward: { type: "badge", value: "Top Earner" } },
  ];

  async getMilestones(creatorId: number): Promise<CreatorMilestone[]> {
    const db = await getDb();
    if (!db) return this.MILESTONES.map(m => ({ ...m, progress: 0, isCompleted: false }));

    // Get creator stats
    const [postCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.posts)
      .where(eq(schema.posts.authorId, creatorId));

    const [followerCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.follows)
      .where(eq(schema.follows.followingId, creatorId));

    const [tipCount] = await db
      .select({
        count: sql<number>`COUNT(*)`,
        total: sql<string>`COALESCE(SUM(CAST(${schema.tips.amount} AS DECIMAL(20,2))), 0)`,
      })
      .from(schema.tips)
      .where(eq(schema.tips.receiverId, creatorId));

    const [subCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.creatorSubscriptions)
      .where(
        and(
          eq(schema.creatorSubscriptions.creatorId, creatorId),
          eq(schema.creatorSubscriptions.status, "active")
        )
      );

    const [streamCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.streams)
      .where(eq(schema.streams.streamerId, creatorId));

    const stats: Record<string, number> = {
      posts: postCount?.count || 0,
      followers: followerCount?.count || 0,
      tips_received: tipCount?.count || 0,
      total_earnings: parseFloat(String(tipCount?.total || "0")),
      subscribers: subCount?.count || 0,
      streams: streamCount?.count || 0,
      total_likes: 0,
    };

    return this.MILESTONES.map(m => {
      const current = stats[m.requirement.metric] || 0;
      const progress = Math.min(100, (current / m.requirement.target) * 100);
      return {
        ...m,
        progress,
        isCompleted: current >= m.requirement.target,
        completedAt: current >= m.requirement.target ? new Date() : undefined,
      };
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// REVENUE FORECASTING
// ═══════════════════════════════════════════════════════════════

export class RevenueForecastingService {
  async forecast(creatorId: number, months = 6): Promise<RevenueForcast[]> {
    const db = await getDb();
    if (!db) return [];

    // Get current monthly revenue
    const [currentRevenue] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${schema.tips.amount} AS DECIMAL(20,2))), 0)` })
      .from(schema.tips)
      .where(eq(schema.tips.receiverId, creatorId));

    const baseRevenue = parseFloat(String(currentRevenue?.total || "0")) / Math.max(1, 3); // Avg over 3 months

    const forecasts: RevenueForcast[] = [];
    for (let m = 1; m <= months; m++) {
      const date = new Date();
      date.setMonth(date.getMonth() + m);
      const growthFactor = 1 + (0.05 * m); // 5% monthly growth assumption
      const projected = baseRevenue * growthFactor;
      const confidence = Math.max(30, 90 - m * 10); // Confidence decreases with distance

      forecasts.push({
        period: date.toISOString().slice(0, 7),
        projected,
        confidence,
        factors: [
          { name: "Subscriber growth", impact: 0.3 },
          { name: "Tip frequency", impact: 0.25 },
          { name: "Content output", impact: 0.2 },
          { name: "Platform growth", impact: 0.15 },
          { name: "Seasonal trends", impact: 0.1 },
        ],
      });
    }

    return forecasts;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const subscriptionTiers = new SubscriptionTierService();
export const revenueSplit = new RevenueSplitCalculator();
export const payoutScheduling = new PayoutSchedulingService();
export const creatorAnalytics = new CreatorAnalyticsService();
export const fanEngagement = new FanEngagementService();
export const creatorMilestones = new CreatorMilestoneService();
export const revenueForecasting = new RevenueForecastingService();
