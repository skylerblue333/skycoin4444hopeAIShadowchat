import crypto from 'crypto';
/**
 * CREATOR GROWTH ENGINE
 *
 * Network effect systems that make creators recruit creators.
 *
 * Systems:
 * - ReferralTreeService: Multi-level referral tracking with commission cascades
 * - CollabToolsService: Creator collaboration matching, joint content, revenue splits
 * - SponsorshipMatchmakingService: AI-powered brand-creator pairing
 * - CreatorMilestoneService: Achievement system with unlockable rewards
 * - AudienceOverlapService: Cross-creator audience analytics
 * - CreatorLeaderboardService: Real-time ranked creator standings
 * - AIGrowthAdvisorService: Personalized AI growth recommendations
 */

import { invokeLLM } from "./_core/llm";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ReferralNode {
  referrerId: number;
  referredId: number;
  referralCode: string;
  tier: number; // 1 = direct, 2 = indirect, 3 = tertiary
  status: "pending" | "active" | "converted" | "churned";
  joinedAt: Date;
  firstPostAt?: Date;
  firstStreamAt?: Date;
  totalEarningsGenerated: number; // coins earned by referred user
  commissionPaid: number; // coins paid to referrer
  conversionEvents: ConversionEvent[];
}

export interface ConversionEvent {
  type: "signup" | "first_post" | "first_stream" | "first_sale" | "subscription_start" | "milestone_reached";
  timestamp: Date;
  bonusCoins: number;
}

export interface ReferralTree {
  rootCreatorId: number;
  totalReferrals: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  totalEarningsFromTree: number;
  topReferrals: { userId: number; earnings: number; referralCount: number }[];
  treeDepth: number;
  conversionRate: number;
}

export interface CollabRequest {
  id: string;
  initiatorId: number;
  targetId: number;
  collabType: "joint_stream" | "co_post" | "guest_appearance" | "series" | "challenge" | "bundle";
  title: string;
  description: string;
  revenueSplit: { initiator: number; target: number }; // percentages
  scheduledFor?: Date;
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
  terms: string;
  createdAt: Date;
  respondedAt?: Date;
}

export interface CollabAnalytics {
  collabId: string;
  combinedAudienceReach: number;
  newFollowersGained: number;
  revenueGenerated: number;
  engagementLift: number; // percentage increase vs solo content
  audienceOverlapPercent: number;
}

export interface SponsorshipOpportunity {
  id: string;
  brandName: string;
  brandLogo?: string;
  category: string;
  budget: { min: number; max: number; currency: "USD" | "COINS" };
  requirements: {
    minFollowers: number;
    minEngagementRate: number;
    contentTypes: string[];
    niches: string[];
    audienceDemographics?: { ageRange?: string; regions?: string[] };
  };
  deliverables: string[];
  deadline: Date;
  applicationDeadline: Date;
  status: "open" | "closed" | "filled";
  applicants: number;
  createdAt: Date;
}

export interface SponsorshipApplication {
  id: string;
  opportunityId: string;
  creatorId: number;
  pitch: string;
  proposedRate: number;
  portfolioLinks: string[];
  status: "submitted" | "under_review" | "accepted" | "rejected";
  submittedAt: Date;
  aiMatchScore: number; // 0-100
}

export interface CreatorMilestone {
  id: string;
  name: string;
  description: string;
  category: "followers" | "content" | "revenue" | "engagement" | "community" | "crypto" | "charity";
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond" | "legendary";
  requirement: { metric: string; threshold: number };
  reward: { coins: number; badge?: string; featureUnlock?: string; titleUnlock?: string };
  isSecret: boolean;
}

export interface CreatorAchievement {
  milestoneId: string;
  creatorId: number;
  unlockedAt: Date;
  currentValue: number;
  rewardClaimed: boolean;
  claimedAt?: Date;
}

export interface AudienceOverlapReport {
  creator1Id: number;
  creator2Id: number;
  overlapPercent: number;
  sharedFollowers: number;
  uniqueToCreator1: number;
  uniqueToCreator2: number;
  crossPromotionPotential: "low" | "medium" | "high" | "excellent";
  recommendedCollabTypes: string[];
  estimatedReachGain: number;
}

export interface CreatorRanking {
  rank: number;
  creatorId: number;
  score: number;
  category: string;
  change: number; // rank change from last period
  metrics: {
    followers: number;
    engagementRate: number;
    monthlyRevenue: number;
    contentVolume: number;
    communitySize: number;
  };
}

export interface GrowthSuggestion {
  type: "content" | "collab" | "schedule" | "monetization" | "community" | "crypto" | "charity";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  estimatedImpact: string;
  actionSteps: string[];
  aiConfidence: number;
}

// ─── COMMISSION TIERS ─────────────────────────────────────────────────────────

const REFERRAL_COMMISSION_RATES = {
  tier1: 0.05,  // 5% of referred user's earnings
  tier2: 0.02,  // 2% of tier-2 earnings
  tier3: 0.005, // 0.5% of tier-3 earnings
};

const CONVERSION_BONUSES: Record<ConversionEvent["type"], number> = {
  signup: 50,
  first_post: 100,
  first_stream: 200,
  first_sale: 300,
  subscription_start: 500,
  milestone_reached: 150,
};

// ─── REFERRAL TREE SERVICE ────────────────────────────────────────────────────

export class ReferralTreeService {
  private referrals = new Map<string, ReferralNode>(); // `${referrerId}:${referredId}` -> node
  private codeToReferrer = new Map<string, number>(); // code -> referrerId
  private referrerToReferreds = new Map<number, Set<number>>(); // referrerId -> Set<referredId>
  private referredByMap = new Map<number, number>(); // referredId -> referrerId

  generateReferralCode(creatorId: number): string {
    const code = `REF_${creatorId}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8).toUpperCase()}`;
    this.codeToReferrer.set(code, creatorId);
    return code;
  }

  async registerReferral(referralCode: string, newUserId: number): Promise<ReferralNode | null> {
    const referrerId = this.codeToReferrer.get(referralCode);
    if (!referrerId || referrerId === newUserId) return null;

    // Prevent circular referrals
    if (this.referredByMap.get(referrerId) === newUserId) return null;

    const key = `${referrerId}:${newUserId}`;
    if (this.referrals.has(key)) return this.referrals.get(key)!;

    const node: ReferralNode = {
      referrerId,
      referredId: newUserId,
      referralCode,
      tier: 1,
      status: "active",
      joinedAt: new Date(),
      totalEarningsGenerated: 0,
      commissionPaid: 0,
      conversionEvents: [{
        type: "signup",
        timestamp: new Date(),
        bonusCoins: CONVERSION_BONUSES.signup,
      }],
    };

    this.referrals.set(key, node);
    this.referredByMap.set(newUserId, referrerId);

    const referreds = this.referrerToReferreds.get(referrerId) || new Set();
    referreds.add(newUserId);
    this.referrerToReferreds.set(referrerId, referreds);

    // Propagate tier-2 and tier-3 relationships
    const tier2Referrer = this.referredByMap.get(referrerId);
    if (tier2Referrer) {
      const tier2Key = `${tier2Referrer}:${newUserId}`;
      if (!this.referrals.has(tier2Key)) {
        this.referrals.set(tier2Key, {
          ...node,
          referrerId: tier2Referrer,
          tier: 2,
          commissionPaid: 0,
          conversionEvents: [],
        });
      }

      const tier3Referrer = this.referredByMap.get(tier2Referrer);
      if (tier3Referrer) {
        const tier3Key = `${tier3Referrer}:${newUserId}`;
        if (!this.referrals.has(tier3Key)) {
          this.referrals.set(tier3Key, {
            ...node,
            referrerId: tier3Referrer,
            tier: 3,
            commissionPaid: 0,
            conversionEvents: [],
          });
        }
      }
    }

    return node;
  }

  async recordConversionEvent(userId: number, eventType: ConversionEvent["type"]): Promise<{ commissionsTriggered: { referrerId: number; coins: number; tier: number }[] }> {
    const commissionsTriggered: { referrerId: number; coins: number; tier: number }[] = [];
    const bonus = CONVERSION_BONUSES[eventType];

    // Find all referrers across tiers
    for (const [key, node] of this.referrals) {
      if (node.referredId === userId) {
        const rate = REFERRAL_COMMISSION_RATES[`tier${node.tier}` as keyof typeof REFERRAL_COMMISSION_RATES];
        const commission = Math.floor(bonus * rate);

        node.conversionEvents.push({ type: eventType, timestamp: new Date(), bonusCoins: bonus });
        node.commissionPaid += commission;

        if (commission > 0) {
          commissionsTriggered.push({ referrerId: node.referrerId, coins: commission, tier: node.tier });
        }
      }
    }

    return { commissionsTriggered };
  }

  async recordEarnings(userId: number, coinsEarned: number): Promise<{ commissionsTriggered: { referrerId: number; coins: number; tier: number }[] }> {
    const commissionsTriggered: { referrerId: number; coins: number; tier: number }[] = [];

    for (const [key, node] of this.referrals) {
      if (node.referredId === userId) {
        const rate = REFERRAL_COMMISSION_RATES[`tier${node.tier}` as keyof typeof REFERRAL_COMMISSION_RATES];
        const commission = Math.floor(coinsEarned * rate);

        node.totalEarningsGenerated += coinsEarned;
        node.commissionPaid += commission;

        if (commission > 0) {
          commissionsTriggered.push({ referrerId: node.referrerId, coins: commission, tier: node.tier });
        }
      }
    }

    return { commissionsTriggered };
  }

  async getReferralTree(creatorId: number): Promise<ReferralTree> {
    const tier1 = Array.from(this.referrals.values()).filter(n => n.referrerId === creatorId && n.tier === 1);
    const tier2 = Array.from(this.referrals.values()).filter(n => n.referrerId === creatorId && n.tier === 2);
    const tier3 = Array.from(this.referrals.values()).filter(n => n.referrerId === creatorId && n.tier === 3);

    const allReferrals = [...tier1, ...tier2, ...tier3];
    const totalEarnings = allReferrals.reduce((sum, n) => sum + n.commissionPaid, 0);

    // Build top referrals (tier-1 who themselves have referrals)
    const topReferrals = tier1
      .map(n => ({
        userId: n.referredId,
        earnings: n.commissionPaid,
        referralCount: (this.referrerToReferreds.get(n.referredId) || new Set()).size,
      }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10);

    const converted = tier1.filter(n => n.conversionEvents.some(e => e.type !== "signup"));

    return {
      rootCreatorId: creatorId,
      totalReferrals: allReferrals.length,
      tier1Count: tier1.length,
      tier2Count: tier2.length,
      tier3Count: tier3.length,
      totalEarningsFromTree: totalEarnings,
      topReferrals,
      treeDepth: tier3.length > 0 ? 3 : tier2.length > 0 ? 2 : tier1.length > 0 ? 1 : 0,
      conversionRate: tier1.length > 0 ? converted.length / tier1.length : 0,
    };
  }

  async getTopReferrers(limit = 20): Promise<{ creatorId: number; referralCount: number; totalCommissions: number }[]> {
    const stats = new Map<number, { referralCount: number; totalCommissions: number }>();

    for (const node of this.referrals.values()) {
      if (node.tier === 1) {
        const existing = stats.get(node.referrerId) || { referralCount: 0, totalCommissions: 0 };
        existing.referralCount++;
        existing.totalCommissions += node.commissionPaid;
        stats.set(node.referrerId, existing);
      }
    }

    return Array.from(stats.entries())
      .map(([creatorId, s]) => ({ creatorId, ...s }))
      .sort((a, b) => b.totalCommissions - a.totalCommissions)
      .slice(0, limit);
  }
}

// ─── COLLAB TOOLS SERVICE ─────────────────────────────────────────────────────

export class CollabToolsService {
  private requests = new Map<string, CollabRequest>();
  private analytics = new Map<string, CollabAnalytics>();
  private counter = 0;

  async sendCollabRequest(params: {
    initiatorId: number;
    targetId: number;
    collabType: CollabRequest["collabType"];
    title: string;
    description: string;
    revenueSplit?: { initiator: number; target: number };
    scheduledFor?: Date;
    terms?: string;
  }): Promise<CollabRequest> {
    const id = `collab_${++this.counter}_${Date.now()}`;
    const split = params.revenueSplit || { initiator: 50, target: 50 };

    const request: CollabRequest = {
      id,
      initiatorId: params.initiatorId,
      targetId: params.targetId,
      collabType: params.collabType,
      title: params.title,
      description: params.description,
      revenueSplit: split,
      scheduledFor: params.scheduledFor,
      status: "pending",
      terms: params.terms || `Standard collaboration terms. Revenue split: ${split.initiator}% / ${split.target}%.`,
      createdAt: new Date(),
    };

    this.requests.set(id, request);
    return request;
  }

  async respondToCollab(collabId: string, targetId: number, accept: boolean, counterSplit?: { initiator: number; target: number }): Promise<CollabRequest | null> {
    const request = this.requests.get(collabId);
    if (!request || request.targetId !== targetId) return null;
    if (request.status !== "pending") return null;

    if (accept) {
      request.status = "accepted";
      if (counterSplit) {
        request.revenueSplit = counterSplit;
      }
    } else {
      request.status = "declined";
    }
    request.respondedAt = new Date();
    return request;
  }

  async completeCollab(collabId: string, analytics: Omit<CollabAnalytics, "collabId">): Promise<CollabRequest | null> {
    const request = this.requests.get(collabId);
    if (!request || request.status !== "accepted") return null;

    request.status = "completed";
    this.analytics.set(collabId, { collabId, ...analytics });
    return request;
  }

  async getCollabAnalytics(collabId: string): Promise<CollabAnalytics | null> {
    return this.analytics.get(collabId) || null;
  }

  async getCreatorCollabs(creatorId: number, status?: CollabRequest["status"]): Promise<CollabRequest[]> {
    return Array.from(this.requests.values())
      .filter(r => (r.initiatorId === creatorId || r.targetId === creatorId) && (!status || r.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findCollabMatches(creatorId: number, collabType?: CollabRequest["collabType"]): Promise<{ creatorId: number; compatibilityScore: number; suggestedCollabType: string }[]> {
    // In production this queries the audience overlap and niche similarity
    // Here we return a deterministic set based on creator ID
    const suggestions = [];
    for (let i = 1; i <= 5; i++) {
      const targetId = (creatorId * 7 + i * 13) % 10000 + 1;
      if (targetId !== creatorId) {
        suggestions.push({
          creatorId: targetId,
          compatibilityScore: Math.max(40, 95 - i * 8),
          suggestedCollabType: collabType || ["joint_stream", "co_post", "challenge"][i % 3],
        });
      }
    }
    return suggestions;
  }
}

// ─── SPONSORSHIP MATCHMAKING SERVICE ─────────────────────────────────────────

export class SponsorshipMatchmakingService {
  private opportunities = new Map<string, SponsorshipOpportunity>();
  private applications = new Map<string, SponsorshipApplication>();
  private oppCounter = 0;
  private appCounter = 0;

  async createOpportunity(params: Omit<SponsorshipOpportunity, "id" | "applicants" | "createdAt" | "status">): Promise<SponsorshipOpportunity> {
    const id = `spon_${++this.oppCounter}_${Date.now()}`;
    const opp: SponsorshipOpportunity = {
      id,
      ...params,
      applicants: 0,
      status: "open",
      createdAt: new Date(),
    };
    this.opportunities.set(id, opp);
    return opp;
  }

  async applyForSponsorship(params: {
    opportunityId: string;
    creatorId: number;
    pitch: string;
    proposedRate: number;
    portfolioLinks: string[];
    creatorMetrics: { followers: number; engagementRate: number; niche: string };
  }): Promise<SponsorshipApplication> {
    const opp = this.opportunities.get(params.opportunityId);
    if (!opp || opp.status !== "open") {
      throw new Error("Opportunity not available");
    }

    // Calculate AI match score
    const meetsMinFollowers = params.creatorMetrics.followers >= opp.requirements.minFollowers;
    const meetsEngagement = params.creatorMetrics.engagementRate >= opp.requirements.minEngagementRate;
    const nicheMatch = opp.requirements.niches.some(n =>
      params.creatorMetrics.niche.toLowerCase().includes(n.toLowerCase())
    );

    let aiMatchScore = 0;
    if (meetsMinFollowers) aiMatchScore += 30;
    if (meetsEngagement) aiMatchScore += 30;
    if (nicheMatch) aiMatchScore += 25;
    if (params.proposedRate >= opp.budget.min && params.proposedRate <= opp.budget.max) aiMatchScore += 15;

    const id = `app_${++this.appCounter}_${Date.now()}`;
    const application: SponsorshipApplication = {
      id,
      opportunityId: params.opportunityId,
      creatorId: params.creatorId,
      pitch: params.pitch,
      proposedRate: params.proposedRate,
      portfolioLinks: params.portfolioLinks,
      status: "submitted",
      submittedAt: new Date(),
      aiMatchScore,
    };

    opp.applicants++;
    this.applications.set(id, application);
    return application;
  }

  async getMatchedOpportunities(creatorMetrics: {
    creatorId: number;
    followers: number;
    engagementRate: number;
    niche: string;
    avgViewsPerPost: number;
  }): Promise<(SponsorshipOpportunity & { matchScore: number })[]> {
    const results = [];

    for (const opp of this.opportunities.values()) {
      if (opp.status !== "open") continue;
      if (new Date() > opp.applicationDeadline) continue;

      let matchScore = 0;
      if (creatorMetrics.followers >= opp.requirements.minFollowers) matchScore += 30;
      if (creatorMetrics.engagementRate >= opp.requirements.minEngagementRate) matchScore += 30;
      if (opp.requirements.niches.some(n => creatorMetrics.niche.toLowerCase().includes(n.toLowerCase()))) matchScore += 25;
      if (matchScore >= 30) {
        results.push({ ...opp, matchScore });
      }
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  async getOpportunities(category?: string, status: SponsorshipOpportunity["status"] = "open"): Promise<SponsorshipOpportunity[]> {
    return Array.from(this.opportunities.values())
      .filter(o => o.status === status && (!category || o.category === category))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async reviewApplication(applicationId: string, decision: "accepted" | "rejected"): Promise<SponsorshipApplication | null> {
    const app = this.applications.get(applicationId);
    if (!app) return null;
    app.status = decision;
    return app;
  }
}

// ─── CREATOR MILESTONE SERVICE ────────────────────────────────────────────────

const PLATFORM_MILESTONES: CreatorMilestone[] = [
  { id: "followers_100", name: "Rising Star", description: "Reach 100 followers", category: "followers", tier: "bronze", requirement: { metric: "followers", threshold: 100 }, reward: { coins: 500, badge: "rising_star" }, isSecret: false },
  { id: "followers_1k", name: "Community Builder", description: "Reach 1,000 followers", category: "followers", tier: "silver", requirement: { metric: "followers", threshold: 1000 }, reward: { coins: 2000, badge: "community_builder", featureUnlock: "custom_channel_banner" }, isSecret: false },
  { id: "followers_10k", name: "Influencer", description: "Reach 10,000 followers", category: "followers", tier: "gold", requirement: { metric: "followers", threshold: 10000 }, reward: { coins: 10000, badge: "influencer", featureUnlock: "verified_badge", titleUnlock: "Influencer" }, isSecret: false },
  { id: "followers_100k", name: "Major Creator", description: "Reach 100,000 followers", category: "followers", tier: "platinum", requirement: { metric: "followers", threshold: 100000 }, reward: { coins: 50000, badge: "major_creator", featureUnlock: "priority_support", titleUnlock: "Major Creator" }, isSecret: false },
  { id: "followers_1m", name: "Platform Legend", description: "Reach 1,000,000 followers", category: "followers", tier: "legendary", requirement: { metric: "followers", threshold: 1000000 }, reward: { coins: 500000, badge: "platform_legend", featureUnlock: "custom_platform_theme", titleUnlock: "Legend" }, isSecret: false },
  { id: "posts_10", name: "Content Creator", description: "Publish 10 posts", category: "content", tier: "bronze", requirement: { metric: "posts", threshold: 10 }, reward: { coins: 200 }, isSecret: false },
  { id: "posts_100", name: "Prolific Creator", description: "Publish 100 posts", category: "content", tier: "silver", requirement: { metric: "posts", threshold: 100 }, reward: { coins: 1000, badge: "prolific_creator" }, isSecret: false },
  { id: "revenue_1k", name: "First Thousand", description: "Earn 1,000 coins in revenue", category: "revenue", tier: "bronze", requirement: { metric: "revenue", threshold: 1000 }, reward: { coins: 500, badge: "earner" }, isSecret: false },
  { id: "revenue_100k", name: "Top Earner", description: "Earn 100,000 coins in revenue", category: "revenue", tier: "gold", requirement: { metric: "revenue", threshold: 100000 }, reward: { coins: 10000, badge: "top_earner", featureUnlock: "revenue_analytics_pro" }, isSecret: false },
  { id: "stream_first", name: "First Broadcast", description: "Complete your first live stream", category: "content", tier: "bronze", requirement: { metric: "streams", threshold: 1 }, reward: { coins: 300, badge: "broadcaster" }, isSecret: false },
  { id: "stream_100", name: "Veteran Streamer", description: "Complete 100 live streams", category: "content", tier: "gold", requirement: { metric: "streams", threshold: 100 }, reward: { coins: 5000, badge: "veteran_streamer", titleUnlock: "Veteran Streamer" }, isSecret: false },
  { id: "referral_10", name: "Growth Hacker", description: "Refer 10 active creators", category: "community", tier: "silver", requirement: { metric: "referrals", threshold: 10 }, reward: { coins: 3000, badge: "growth_hacker" }, isSecret: false },
  { id: "charity_1k", name: "Philanthropist", description: "Raise 1,000 coins for charity", category: "charity", tier: "silver", requirement: { metric: "charity_raised", threshold: 1000 }, reward: { coins: 500, badge: "philanthropist" }, isSecret: false },
  { id: "collab_5", name: "Collaborator", description: "Complete 5 creator collabs", category: "community", tier: "silver", requirement: { metric: "collabs", threshold: 5 }, reward: { coins: 2000, badge: "collaborator" }, isSecret: false },
  { id: "secret_night_owl", name: "Night Owl", description: "Stream after midnight 10 times", category: "content", tier: "bronze", requirement: { metric: "late_night_streams", threshold: 10 }, reward: { coins: 500, badge: "night_owl" }, isSecret: true },
];

export class CreatorMilestoneService {
  private achievements = new Map<string, CreatorAchievement>(); // `${creatorId}:${milestoneId}`
  private creatorMetrics = new Map<number, Record<string, number>>();

  getMilestones(category?: CreatorMilestone["category"]): CreatorMilestone[] {
    return PLATFORM_MILESTONES.filter(m => !m.isSecret && (!category || m.category === category));
  }

  async updateMetric(creatorId: number, metric: string, value: number): Promise<CreatorAchievement[]> {
    const metrics = this.creatorMetrics.get(creatorId) || {};
    metrics[metric] = value;
    this.creatorMetrics.set(creatorId, metrics);

    const newlyUnlocked: CreatorAchievement[] = [];

    for (const milestone of PLATFORM_MILESTONES) {
      if (milestone.requirement.metric !== metric) continue;
      if (value < milestone.requirement.threshold) continue;

      const key = `${creatorId}:${milestone.id}`;
      if (this.achievements.has(key)) continue;

      const achievement: CreatorAchievement = {
        milestoneId: milestone.id,
        creatorId,
        unlockedAt: new Date(),
        currentValue: value,
        rewardClaimed: false,
      };

      this.achievements.set(key, achievement);
      newlyUnlocked.push(achievement);
    }

    return newlyUnlocked;
  }

  async claimReward(creatorId: number, milestoneId: string): Promise<{ success: boolean; reward?: CreatorMilestone["reward"]; reason?: string }> {
    const key = `${creatorId}:${milestoneId}`;
    const achievement = this.achievements.get(key);
    if (!achievement) return { success: false, reason: "Milestone not unlocked" };
    if (achievement.rewardClaimed) return { success: false, reason: "Reward already claimed" };

    const milestone = PLATFORM_MILESTONES.find(m => m.id === milestoneId);
    if (!milestone) return { success: false, reason: "Milestone not found" };

    achievement.rewardClaimed = true;
    achievement.claimedAt = new Date();

    return { success: true, reward: milestone.reward };
  }

  async getCreatorAchievements(creatorId: number): Promise<{ achievement: CreatorAchievement; milestone: CreatorMilestone }[]> {
    const results = [];
    for (const [key, achievement] of this.achievements) {
      if (achievement.creatorId !== creatorId) continue;
      const milestone = PLATFORM_MILESTONES.find(m => m.id === achievement.milestoneId);
      if (milestone) results.push({ achievement, milestone });
    }
    return results.sort((a, b) => b.achievement.unlockedAt.getTime() - a.achievement.unlockedAt.getTime());
  }

  async getProgress(creatorId: number): Promise<{ milestone: CreatorMilestone; currentValue: number; progress: number; unlocked: boolean }[]> {
    const metrics = this.creatorMetrics.get(creatorId) || {};
    return PLATFORM_MILESTONES
      .filter(m => !m.isSecret)
      .map(m => {
        const currentValue = metrics[m.requirement.metric] || 0;
        const key = `${creatorId}:${m.id}`;
        return {
          milestone: m,
          currentValue,
          progress: Math.min(1, currentValue / m.requirement.threshold),
          unlocked: this.achievements.has(key),
        };
      });
  }
}

// ─── AUDIENCE OVERLAP SERVICE ─────────────────────────────────────────────────

export class AudienceOverlapService {
  private followerSets = new Map<number, Set<number>>(); // creatorId -> Set<followerId>

  addFollower(creatorId: number, followerId: number): void {
    const followers = this.followerSets.get(creatorId) || new Set();
    followers.add(followerId);
    this.followerSets.set(creatorId, followers);
  }

  removeFollower(creatorId: number, followerId: number): void {
    this.followerSets.get(creatorId)?.delete(followerId);
  }

  async analyzeOverlap(creator1Id: number, creator2Id: number): Promise<AudienceOverlapReport> {
    const set1 = this.followerSets.get(creator1Id) || new Set<number>();
    const set2 = this.followerSets.get(creator2Id) || new Set<number>();

    const shared = new Set([...set1].filter(id => set2.has(id)));
    const overlapPercent = set1.size > 0 ? (shared.size / Math.min(set1.size, set2.size)) * 100 : 0;

    let crossPromotionPotential: AudienceOverlapReport["crossPromotionPotential"];
    if (overlapPercent < 10) crossPromotionPotential = "excellent"; // Low overlap = high new audience potential
    else if (overlapPercent < 25) crossPromotionPotential = "high";
    else if (overlapPercent < 50) crossPromotionPotential = "medium";
    else crossPromotionPotential = "low";

    const estimatedReachGain = Math.floor((set2.size - shared.size) * 0.15); // 15% conversion estimate

    const recommendedCollabTypes: string[] = [];
    if (crossPromotionPotential === "excellent" || crossPromotionPotential === "high") {
      recommendedCollabTypes.push("joint_stream", "co_post", "challenge");
    } else {
      recommendedCollabTypes.push("guest_appearance", "series");
    }

    return {
      creator1Id,
      creator2Id,
      overlapPercent,
      sharedFollowers: shared.size,
      uniqueToCreator1: set1.size - shared.size,
      uniqueToCreator2: set2.size - shared.size,
      crossPromotionPotential,
      recommendedCollabTypes,
      estimatedReachGain,
    };
  }

  async findBestCollabPartners(creatorId: number, limit = 10): Promise<{ creatorId: number; overlapPercent: number; potential: string; estimatedReachGain: number }[]> {
    const results = [];
    for (const [otherId] of this.followerSets) {
      if (otherId === creatorId) continue;
      const report = await this.analyzeOverlap(creatorId, otherId);
      results.push({
        creatorId: otherId,
        overlapPercent: report.overlapPercent,
        potential: report.crossPromotionPotential,
        estimatedReachGain: report.estimatedReachGain,
      });
    }
    return results
      .sort((a, b) => b.estimatedReachGain - a.estimatedReachGain)
      .slice(0, limit);
  }
}

// ─── CREATOR LEADERBOARD SERVICE ─────────────────────────────────────────────

export class CreatorLeaderboardService {
  private scores = new Map<number, { category: string; metrics: CreatorRanking["metrics"] }>();
  private history = new Map<string, number>(); // `${creatorId}:${category}` -> previous rank

  updateCreatorMetrics(creatorId: number, category: string, metrics: CreatorRanking["metrics"]): void {
    this.scores.set(creatorId, { category, metrics });
  }

  private calculateScore(metrics: CreatorRanking["metrics"]): number {
    return (
      metrics.followers * 0.3 +
      metrics.engagementRate * 1000 * 0.25 +
      metrics.monthlyRevenue * 0.2 +
      metrics.contentVolume * 10 * 0.15 +
      metrics.communitySize * 0.1
    );
  }

  async getLeaderboard(category?: string, limit = 100): Promise<CreatorRanking[]> {
    const filtered = Array.from(this.scores.entries())
      .filter(([, data]) => !category || data.category === category);

    const ranked = filtered
      .map(([creatorId, data]) => ({
        creatorId,
        score: this.calculateScore(data.metrics),
        metrics: data.metrics,
        category: data.category,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return ranked.map((entry, index) => {
      const rank = index + 1;
      const histKey = `${entry.creatorId}:${entry.category}`;
      const prevRank = this.history.get(histKey) || rank;
      this.history.set(histKey, rank);

      return {
        rank,
        creatorId: entry.creatorId,
        score: entry.score,
        category: entry.category,
        change: prevRank - rank, // positive = moved up
        metrics: entry.metrics,
      };
    });
  }

  async getCreatorRank(creatorId: number, category?: string): Promise<CreatorRanking | null> {
    const leaderboard = await this.getLeaderboard(category);
    return leaderboard.find(r => r.creatorId === creatorId) || null;
  }
}

// ─── AI GROWTH ADVISOR SERVICE ────────────────────────────────────────────────

export class AIGrowthAdvisorService {
  private suggestionCache = new Map<string, { suggestions: GrowthSuggestion[]; generatedAt: Date }>();
  private readonly CACHE_TTL_MS = 3600000; // 1 hour

  async generateGrowthPlan(creatorId: number, metrics: {
    followers: number;
    followersGrowthRate: number; // % per week
    avgEngagementRate: number;
    postsPerWeek: number;
    streamsPerWeek: number;
    monthlyRevenue: number;
    topContentTypes: string[];
    audienceRetentionRate: number;
    referralCount: number;
    collabCount: number;
  }): Promise<GrowthSuggestion[]> {
    const cacheKey = `${creatorId}:${JSON.stringify(metrics)}`;
    const cached = this.suggestionCache.get(cacheKey);
    if (cached && Date.now() - cached.generatedAt.getTime() < this.CACHE_TTL_MS) {
      return cached.suggestions;
    }

    const suggestions: GrowthSuggestion[] = [];

    // Rule-based suggestions (fast path)
    if (metrics.postsPerWeek < 3) {
      suggestions.push({
        type: "content",
        priority: "high",
        title: "Increase posting frequency",
        description: `You're posting ${metrics.postsPerWeek}x/week. Creators who post 5-7x/week see 3x faster follower growth.`,
        estimatedImpact: "+40-60% follower growth rate",
        actionSteps: ["Schedule 2 additional posts per week", "Use content batching to create multiple posts in one session", "Repurpose stream highlights as short-form posts"],
        aiConfidence: 0.92,
      });
    }

    if (metrics.avgEngagementRate < 0.03) {
      suggestions.push({
        type: "content",
        priority: "high",
        title: "Boost engagement with interactive content",
        description: "Your engagement rate is below 3%. Polls, Q&As, and challenges typically 3-5x engagement.",
        estimatedImpact: "+150-200% engagement rate",
        actionSteps: ["Add a question or poll to every post", "Run a weekly challenge series", "Respond to every comment in the first hour"],
        aiConfidence: 0.88,
      });
    }

    if (metrics.referralCount < 5) {
      suggestions.push({
        type: "community",
        priority: "medium",
        title: "Activate your referral program",
        description: "You've referred fewer than 5 creators. Top creators earn 20-30% of their income from referral commissions.",
        estimatedImpact: "+15-25% passive income",
        actionSteps: ["Share your referral code in your next stream", "Create a 'join me on Shadowchat' post for other platforms", "Offer a personal onboarding call to your first 10 referrals"],
        aiConfidence: 0.85,
      });
    }

    if (metrics.collabCount < 2) {
      suggestions.push({
        type: "collab",
        priority: "medium",
        title: "Start collaborating with other creators",
        description: "Collabs are the fastest way to grow. Creators who collab 2+ times/month grow 4x faster.",
        estimatedImpact: "+200-400% reach expansion",
        actionSteps: ["Send 3 collab requests to creators in adjacent niches", "Propose a 30-minute joint stream as a low-commitment first collab", "Use the audience overlap tool to find ideal partners"],
        aiConfidence: 0.90,
      });
    }

    if (metrics.monthlyRevenue < 1000) {
      suggestions.push({
        type: "monetization",
        priority: "high",
        title: "Activate subscription tiers",
        description: "You're leaving revenue on the table. Even 50 subscribers at $5/month = $250/month in recurring revenue.",
        estimatedImpact: "+$250-$2,500/month recurring",
        actionSteps: ["Set up 3 subscription tiers (Basic, Pro, VIP)", "Offer exclusive content for subscribers", "Announce your subscription launch in a dedicated post"],
        aiConfidence: 0.87,
      });
    }

    if (metrics.streamsPerWeek === 0) {
      suggestions.push({
        type: "content",
        priority: "critical",
        title: "Start live streaming",
        description: "Streamers earn 5-10x more than non-streamers and grow 3x faster due to real-time engagement.",
        estimatedImpact: "+300-500% revenue potential",
        actionSteps: ["Schedule your first stream this week", "Announce it 48 hours in advance", "Start with a 1-hour Q&A to build comfort"],
        aiConfidence: 0.95,
      });
    }

    // LLM-enhanced suggestions for complex scenarios
    if (suggestions.length < 3 || metrics.followers > 10000) {
      try {
        const prompt = `You are a creator growth advisor for a social platform. Given these creator metrics, provide 2 specific, actionable growth suggestions in JSON format:
Metrics: ${JSON.stringify(metrics)}
Return a JSON array with objects: { type, priority, title, description, estimatedImpact, actionSteps, aiConfidence }
Types: content, collab, schedule, monetization, community, crypto, charity
Priorities: low, medium, high, critical`;

        const response = await invokeLLM({ messages: [{ role: "system" as const, content: "You are an expert creator growth strategist." }, { role: "user" as const, content: prompt }] });
        try {
          const llmSuggestions = JSON.parse(response.choices[0]?.message?.content as string);
          if (Array.isArray(llmSuggestions)) {
            suggestions.push(...llmSuggestions.slice(0, 2));
          }
        } catch {
          // LLM response not parseable, use rule-based only
        }
      } catch {
        // LLM unavailable, use rule-based only
      }
    }

    const result = suggestions.slice(0, 8);
    this.suggestionCache.set(cacheKey, { suggestions: result, generatedAt: new Date() });
    return result;
  }

  async getQuickWins(creatorId: number, metrics: { followers: number; postsPerWeek: number; engagementRate: number }): Promise<GrowthSuggestion[]> {
    const quickWins: GrowthSuggestion[] = [
      {
        type: "community",
        priority: "high",
        title: "Pin your referral code to your profile",
        description: "Creators who pin their referral code get 3x more referrals passively.",
        estimatedImpact: "+3-5 referrals/month",
        actionSteps: ["Go to profile settings", "Add referral code to bio", "Create a pinned post explaining the benefits"],
        aiConfidence: 0.89,
      },
      {
        type: "content",
        priority: "medium",
        title: "Post at peak engagement times",
        description: "Your audience is most active between 7-9pm local time. Posting then increases reach by 40%.",
        estimatedImpact: "+40% post reach",
        actionSteps: ["Schedule your next 5 posts for 7-9pm", "Use the analytics dashboard to confirm your audience's peak times"],
        aiConfidence: 0.82,
      },
    ];
    return quickWins;
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const referralTreeService = new ReferralTreeService();
export const collabToolsService = new CollabToolsService();
export const sponsorshipMatchmaking = new SponsorshipMatchmakingService();
export const creatorMilestoneService = new CreatorMilestoneService();
export const audienceOverlapService = new AudienceOverlapService();
export const creatorLeaderboard = new CreatorLeaderboardService();
export const aiGrowthAdvisor = new AIGrowthAdvisorService();

// ─── ROUTER COMPATIBILITY METHOD ALIASES ─────────────────────────────────────
// ReferralTreeService aliases
(ReferralTreeService.prototype as any).getTree = function(creatorId: number, depth = 3) {
  return this.getReferralTree(creatorId);
};
(ReferralTreeService.prototype as any).trackReferral = function(referrerId: number, referredUserId: number, source?: string) {
  return this.registerReferral(this.generateReferralCode(referrerId), referredUserId);
};
(ReferralTreeService.prototype as any).getStats = function(creatorId: number) {
  return this.getReferralTree(creatorId).then((t: any) => ({ total: t.totalReferrals, earnings: t.totalEarnings }));
};

// CollabToolsService aliases
(CollabToolsService.prototype as any).createRequest = function(initiatorId: number, targetCreatorId: number, type: string, message: string, proposedTerms: any) {
  return this.sendCollabRequest({ initiatorId, targetId: targetCreatorId, collabType: type as any, message, proposedRevenueSplit: proposedTerms });
};
(CollabToolsService.prototype as any).getRequests = function(creatorId: number) {
  return this.getCreatorCollabs(creatorId);
};
(CollabToolsService.prototype as any).respond = function(requestId: string, userId: number, accept: boolean, message?: string) {
  return this.respondToCollab(requestId, userId, accept);
};

// SponsorshipMatchmakingService aliases
(SponsorshipMatchmakingService.prototype as any).findMatches = function(creatorId: number, niche?: string, minBudget?: number) {
  return this.getMatchedOpportunities({ followers: 1000, engagementRate: 0.05, niche: niche || "general", avgViews: 500 });
};

// AIGrowthAdvisorService aliases
(AIGrowthAdvisorService.prototype as any).getAdvice = function(creatorId: number) {
  return this.generateGrowthPlan(creatorId, { followers: 1000, engagementRate: 0.05, postsPerWeek: 3, avgViews: 500, revenue: 0, growthRate: 0.1 });
};
