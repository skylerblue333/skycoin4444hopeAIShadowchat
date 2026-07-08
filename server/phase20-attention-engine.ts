import crypto from 'crypto';
/**
 * PHASE 20 — ATTENTION ENGINE
 * Feed Intelligence V2, Addiction Loops, Retention AI
 * Goal: Maximize DAU, session length, and return rate.
 */

// ─── FEED INTELLIGENCE V2 ────────────────────────────────────────────────────

export interface FeedPost {
  postId: string;
  authorId: number;
  contentType: "text" | "image" | "video" | "reel" | "stream" | "nft" | "poll";
  createdAt: Date;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  watchTimeSeconds: number;
  communityIds: string[];
  topicTags: string[];
  isPremium: boolean;
  isSponsored: boolean;
}

export interface FeedRankingV2 {
  postId: string;
  userId: number;
  watchTimeScore: number;
  affinityScore: number;
  interestClusterScore: number;
  communityOverlapScore: number;
  sessionChainBonus: number;
  freshnessScore: number;
  diversityBonus: number;
  sponsorBoost: number;
  finalScore: number;
  rankPosition: number;
  explanation: string[];
}

export interface CreatorAffinityProfile {
  userId: number;
  creatorId: number;
  totalViews: number;
  totalWatchTimeSeconds: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalPurchases: number;
  affinityScore: number;
  lastInteractionAt: Date;
  updatedAt: Date;
}

export interface InterestCluster {
  clusterId: string;
  userId: number;
  topics: string[];
  weight: number;
  recentEngagements: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionChain {
  sessionId: string;
  userId: number;
  startedAt: Date;
  lastActivityAt: Date;
  postsViewed: string[];
  totalWatchTimeSeconds: number;
  chainBonus: number;
  isActive: boolean;
}

// ─── ADDICTION LOOPS ─────────────────────────────────────────────────────────

export interface DailyDrop {
  id: string;
  dropType: "token" | "nft" | "badge" | "boost" | "premium_content";
  title: string;
  description: string;
  rewardAmount?: number;
  rewardCurrency?: string;
  nftId?: string;
  badgeId?: string;
  boostMultiplier?: number;
  availableFrom: Date;
  availableUntil: Date;
  maxClaims: number;
  claimedCount: number;
  isActive: boolean;
}

export interface DailyDropClaim {
  id: string;
  dropId: string;
  userId: number;
  claimedAt: Date;
  rewardDelivered: boolean;
}

export interface EngagementLadder {
  id: string;
  userId: number;
  currentTier: "bronze" | "silver" | "gold" | "platinum" | "diamond" | "legend";
  currentPoints: number;
  tierThresholds: Record<string, number>;
  pointsToNextTier: number;
  totalPointsEarned: number;
  perks: string[];
  updatedAt: Date;
}

export interface ReturnBonus {
  id: string;
  userId: number;
  bonusType: "day_1" | "day_3" | "day_7" | "day_14" | "day_30" | "comeback";
  rewardAmount: number;
  rewardCurrency: string;
  triggeredAt: Date;
  claimedAt?: Date;
  claimed: boolean;
  expiresAt: Date;
}

export interface CreatorLoyaltyReward {
  id: string;
  userId: number;
  creatorId: number;
  loyaltyTier: "fan" | "superfan" | "champion" | "legend";
  totalSpent: number;
  totalWatchHours: number;
  rewardAmount: number;
  rewardCurrency: string;
  issuedAt: Date;
  claimedAt?: Date;
  claimed: boolean;
}

// ─── RETENTION AI ─────────────────────────────────────────────────────────────

export interface ChurnTrigger {
  id: string;
  userId: number;
  triggerType: "inactivity_3d" | "inactivity_7d" | "inactivity_14d" | "subscription_lapse" | "engagement_drop" | "creator_left";
  severity: "low" | "medium" | "high" | "critical";
  triggeredAt: Date;
  interventionSent: boolean;
  interventionType?: "push" | "email" | "in_app" | "creator_dm";
  interventionSentAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface CreatorComebackPrompt {
  id: string;
  creatorId: number;
  promptType: "milestone_near" | "trending_topic" | "audience_waiting" | "revenue_opportunity" | "community_activity";
  message: string;
  sentAt: Date;
  opened: boolean;
  actedOn: boolean;
}

export interface FriendReEngagementPrompt {
  id: string;
  userId: number;
  targetFriendId: number;
  promptType: "friend_posted" | "friend_streaming" | "friend_milestone" | "mutual_community_active";
  message: string;
  sentAt: Date;
  clicked: boolean;
}

export interface CommunityRevivalPrompt {
  id: string;
  communityId: string;
  promptType: "new_post" | "trending_topic" | "event_upcoming" | "member_milestone" | "creator_joined";
  targetUserIds: number[];
  message: string;
  sentAt: Date;
  clickCount: number;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _feedCache = new Map<string, FeedRankingV2[]>();
const _affinityProfiles = new Map<string, CreatorAffinityProfile>();
const _interestClusters = new Map<number, InterestCluster[]>();
const _sessionChains = new Map<string, SessionChain>();
const _dailyDrops = new Map<string, DailyDrop>();
const _dailyDropClaims = new Map<string, DailyDropClaim>();
const _engagementLadders = new Map<number, EngagementLadder>();
const _returnBonuses = new Map<string, ReturnBonus>();
const _creatorLoyaltyRewards = new Map<string, CreatorLoyaltyReward>();
const _churnTriggers = new Map<string, ChurnTrigger>();
const _creatorComebackPrompts = new Map<string, CreatorComebackPrompt>();
const _friendReEngagementPrompts = new Map<string, FriendReEngagementPrompt>();
const _communityRevivalPrompts = new Map<string, CommunityRevivalPrompt>();

// ─── FEED INTELLIGENCE V2 ENGINE ─────────────────────────────────────────────

export const feedIntelligenceV2 = {
  rankFeed(userId: number, posts: FeedPost[], sessionId?: string): FeedRankingV2[] {
    const affinityMap = new Map<number, number>();
    for (const [key, profile] of _affinityProfiles.entries()) {
      if (profile.userId === userId) {
        affinityMap.set(profile.creatorId, profile.affinityScore);
      }
    }
    const userClusters = _interestClusters.get(userId) ?? [];
    const session = sessionId ? _sessionChains.get(sessionId) : null;
    const now = Date.now();

    const ranked: FeedRankingV2[] = posts.map((post, idx) => {
      // Watch-time optimization: reward content with high avg watch time
      const watchTimeScore = post.views > 0
        ? Math.min(1, post.watchTimeSeconds / (post.views * 60)) // normalize to 1-min avg
        : 0.1;

      // Creator affinity
      const affinityScore = Math.min(1, (affinityMap.get(post.authorId) ?? 0) / 100);

      // Interest cluster matching
      const postTopicSet = new Set(post.topicTags);
      let clusterScore = 0;
      for (const cluster of userClusters) {
        const overlap = cluster.topics.filter(t => postTopicSet.has(t)).length;
        if (overlap > 0) {
          clusterScore += (overlap / cluster.topics.length) * cluster.weight;
        }
      }
      const interestClusterScore = Math.min(1, clusterScore);

      // Community overlap
      const communityOverlapScore = post.communityIds.length > 0 ? 0.3 : 0;

      // Session chaining: boost content similar to what user already watched this session
      let sessionChainBonus = 0;
      if (session && session.isActive) {
        sessionChainBonus = Math.min(0.2, session.postsViewed.length * 0.02);
      }

      // Freshness decay (half-life = 6 hours)
      const ageHours = (now - post.createdAt.getTime()) / 3600000;
      const freshnessScore = Math.exp(-0.115 * ageHours); // ln(2)/6 ≈ 0.115

      // Diversity bonus: inject variety every 5 posts
      const diversityBonus = idx % 5 === 4 ? 0.15 : 0;

      // Sponsor boost
      const sponsorBoost = post.isSponsored ? 0.1 : 0;

      const finalScore =
        watchTimeScore * 0.25 +
        affinityScore * 0.20 +
        interestClusterScore * 0.20 +
        communityOverlapScore * 0.10 +
        sessionChainBonus * 0.10 +
        freshnessScore * 0.10 +
        diversityBonus * 0.05 +
        sponsorBoost;

      const explanation: string[] = [];
      if (affinityScore > 0.5) explanation.push("High creator affinity");
      if (interestClusterScore > 0.3) explanation.push("Matches your interests");
      if(watchTimeScore > 0.5) explanation.push("High watch-time content");
      if (freshnessScore > 0.8) explanation.push("Recent post");
      if (diversityBonus > 0) explanation.push("Diversity injection");

      return {
        postId: post.postId,
        userId,
        watchTimeScore,
        affinityScore,
        interestClusterScore,
        communityOverlapScore,
        sessionChainBonus,
        freshnessScore,
        diversityBonus,
        sponsorBoost,
        finalScore,
        rankPosition: 0, // set after sort
        explanation,
      };
    });

    ranked.sort((a, b) => b.finalScore - a.finalScore);
    ranked.forEach((r, i) => { r.rankPosition = i + 1; });

    const cacheKey = `feed_${userId}`;
    _feedCache.set(cacheKey, ranked);
    return ranked;
  },

  recordWatchTime(userId: number, postId: string, authorId: number, watchTimeSeconds: number): void {
    const key = `aff_${userId}_${authorId}`;
    const existing = _affinityProfiles.get(key);
    if (existing) {
      existing.totalWatchTimeSeconds += watchTimeSeconds;
      existing.totalViews++;
      existing.affinityScore = Math.min(100,
        existing.totalWatchTimeSeconds / 60 * 0.5 +
        existing.totalLikes * 2 +
        existing.totalComments * 5 +
        existing.totalShares * 10 +
        existing.totalPurchases * 20
      );
      existing.lastInteractionAt = new Date();
      existing.updatedAt = new Date();
    } else {
      _affinityProfiles.set(key, {
        userId, creatorId: authorId,
        totalViews: 1,
        totalWatchTimeSeconds: watchTimeSeconds,
        totalLikes: 0, totalComments: 0, totalShares: 0, totalPurchases: 0,
        affinityScore: Math.min(100, watchTimeSeconds / 60 * 0.5),
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      });
    }
  },

  recordInteraction(userId: number, authorId: number, interactionType: "like" | "comment" | "share" | "purchase"): void {
    const key = `aff_${userId}_${authorId}`;
    const existing = _affinityProfiles.get(key) ?? {
      userId, creatorId: authorId,
      totalViews: 0, totalWatchTimeSeconds: 0,
      totalLikes: 0, totalComments: 0, totalShares: 0, totalPurchases: 0,
      affinityScore: 0,
      lastInteractionAt: new Date(),
      updatedAt: new Date(),
    };
    if (interactionType === "like") existing.totalLikes++;
    if (interactionType === "comment") existing.totalComments++;
    if (interactionType === "share") existing.totalShares++;
    if (interactionType === "purchase") existing.totalPurchases++;
    existing.affinityScore = Math.min(100,
      existing.totalWatchTimeSeconds / 60 * 0.5 +
      existing.totalLikes * 2 +
      existing.totalComments * 5 +
      existing.totalShares * 10 +
      existing.totalPurchases * 20
    );
    existing.lastInteractionAt = new Date();
    existing.updatedAt = new Date();
    _affinityProfiles.set(key, existing);
  },

  getCreatorAffinity(userId: number, creatorId: number): CreatorAffinityProfile | null {
    return _affinityProfiles.get(`aff_${userId}_${creatorId}`) ?? null;
  },

  getTopCreatorsByAffinity(userId: number, limit = 10): CreatorAffinityProfile[] {
    return Array.from(_affinityProfiles.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => b.affinityScore - a.affinityScore)
      .slice(0, limit);
  },

  upsertInterestCluster(userId: number, topics: string[], weight: number): InterestCluster {
    const clusterId = `cluster_${userId}_${topics.sort().join("_").slice(0, 30)}`;
    const existing = (_interestClusters.get(userId) ?? []).find(c => c.clusterId === clusterId);
    if (existing) {
      existing.weight = weight;
      existing.recentEngagements++;
      existing.updatedAt = new Date();
      return existing;
    }
    const cluster: InterestCluster = {
      clusterId, userId, topics, weight,
      recentEngagements: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const userClusters = _interestClusters.get(userId) ?? [];
    userClusters.push(cluster);
    _interestClusters.set(userId, userClusters);
    return cluster;
  },

  getUserInterestClusters(userId: number): InterestCluster[] {
    return _interestClusters.get(userId) ?? [];
  },

  startSession(userId: number): SessionChain {
    const sessionId = `sess_${userId}_${Date.now()}`;
    const session: SessionChain = {
      sessionId, userId,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      postsViewed: [],
      totalWatchTimeSeconds: 0,
      chainBonus: 0,
      isActive: true,
    };
    _sessionChains.set(sessionId, session);
    return session;
  },

  recordSessionView(sessionId: string, postId: string, watchTimeSeconds: number): SessionChain | null {
    const session = _sessionChains.get(sessionId);
    if (!session || !session.isActive) return null;
    session.postsViewed.push(postId);
    session.totalWatchTimeSeconds += watchTimeSeconds;
    session.lastActivityAt = new Date();
    session.chainBonus = Math.min(0.5, session.postsViewed.length * 0.02);
    return session;
  },

  endSession(sessionId: string): SessionChain | null {
    const session = _sessionChains.get(sessionId);
    if (!session) return null;
    session.isActive = false;
    return session;
  },

  getSessionMetrics(userId: number): { avgSessionLength: number; avgPostsPerSession: number; totalSessions: number } {
    const sessions = Array.from(_sessionChains.values()).filter(s => s.userId === userId && !s.isActive);
    if (sessions.length === 0) return { avgSessionLength: 0, avgPostsPerSession: 0, totalSessions: 0 };
    return {
      avgSessionLength: sessions.reduce((s, sess) => s + sess.totalWatchTimeSeconds, 0) / sessions.length,
      avgPostsPerSession: sessions.reduce((s, sess) => s + sess.postsViewed.length, 0) / sessions.length,
      totalSessions: sessions.length,
    };
  },
};

// ─── ADDICTION LOOPS ENGINE ───────────────────────────────────────────────────

export const addictionLoopsEngine = {
  // Daily Drops
  createDailyDrop(params: Omit<DailyDrop, "id" | "claimedCount">): DailyDrop {
    const id = `drop_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const drop: DailyDrop = { ...params, id, claimedCount: 0 };
    _dailyDrops.set(id, drop);
    return drop;
  },

  claimDailyDrop(userId: number, dropId: string): DailyDropClaim | null {
    const drop = _dailyDrops.get(dropId);
    if (!drop || !drop.isActive) return null;
    const now = new Date();
    if (now < drop.availableFrom || now > drop.availableUntil) return null;
    if (drop.claimedCount >= drop.maxClaims) return null;
    // Check if user already claimed
    const alreadyClaimed = Array.from(_dailyDropClaims.values())
      .some(c => c.dropId === dropId && c.userId === userId);
    if (alreadyClaimed) return null;
    drop.claimedCount++;
    const claim: DailyDropClaim = {
      id: `claim_${userId}_${dropId}`,
      dropId, userId,
      claimedAt: new Date(),
      rewardDelivered: true,
    };
    _dailyDropClaims.set(claim.id, claim);
    return claim;
  },

  getActiveDailyDrops(): DailyDrop[] {
    const now = new Date();
    return Array.from(_dailyDrops.values()).filter(d =>
      d.isActive && now >= d.availableFrom && now <= d.availableUntil && d.claimedCount < d.maxClaims
    );
  },

  getUserDropClaims(userId: number): DailyDropClaim[] {
    return Array.from(_dailyDropClaims.values()).filter(c => c.userId === userId);
  },

  // Engagement Ladder
  getOrCreateLadder(userId: number): EngagementLadder {
    const existing = _engagementLadders.get(userId);
    if (existing) return existing;
    const thresholds = { bronze: 0, silver: 500, gold: 2000, platinum: 5000, diamond: 15000, legend: 50000 };
    const ladder: EngagementLadder = {
      id: `ladder_${userId}`,
      userId,
      currentTier: "bronze",
      currentPoints: 0,
      tierThresholds: thresholds,
      pointsToNextTier: 500,
      totalPointsEarned: 0,
      perks: ["Basic badge"],
      updatedAt: new Date(),
    };
    _engagementLadders.set(userId, ladder);
    return ladder;
  },

  awardPoints(userId: number, points: number, reason: string): EngagementLadder {
    const ladder = this.getOrCreateLadder(userId);
    ladder.currentPoints += points;
    ladder.totalPointsEarned += points;
    // Determine tier
    const tiers: Array<[string, number]> = [
      ["legend", 50000], ["diamond", 15000], ["platinum", 5000], ["gold", 2000], ["silver", 500], ["bronze", 0]
    ];
    for (const [tier, threshold] of tiers) {
      if (ladder.currentPoints >= threshold) {
        ladder.currentTier = tier as EngagementLadder["currentTier"];
        const nextTier = tiers[tiers.findIndex(t => t[0] === tier) - 1];
        ladder.pointsToNextTier = nextTier ? nextTier[1] - ladder.currentPoints : 0;
        break;
      }
    }
    ladder.perks = this._getTierPerks(ladder.currentTier);
    ladder.updatedAt = new Date();
    return ladder;
  },

  _getTierPerks(tier: EngagementLadder["currentTier"]): string[] {
    const perks: Record<string, string[]> = {
      bronze: ["Basic badge"],
      silver: ["Silver badge", "5% tip bonus"],
      gold: ["Gold badge", "10% tip bonus", "Priority support"],
      platinum: ["Platinum badge", "15% tip bonus", "Early access", "Creator DM access"],
      diamond: ["Diamond badge", "20% tip bonus", "Beta features", "Revenue share boost"],
      legend: ["Legend badge", "25% tip bonus", "All features", "Platform governance vote"],
    };
    return perks[tier] ?? [];
  },

  getLadder(userId: number): EngagementLadder | null {
    return _engagementLadders.get(userId) ?? null;
  },

  getLeaderboard(limit = 50): EngagementLadder[] {
    return Array.from(_engagementLadders.values())
      .sort((a, b) => b.totalPointsEarned - a.totalPointsEarned)
      .slice(0, limit);
  },

  // Return Bonuses
  issueReturnBonus(userId: number, daysSinceLastVisit: number): ReturnBonus | null {
    let bonusType: ReturnBonus["bonusType"] | null = null;
    let rewardAmount = 0;
    if (daysSinceLastVisit >= 30) { bonusType = "day_30"; rewardAmount = 100; }
    else if (daysSinceLastVisit >= 14) { bonusType = "day_14"; rewardAmount = 50; }
    else if (daysSinceLastVisit >= 7) { bonusType = "day_7"; rewardAmount = 25; }
    else if (daysSinceLastVisit >= 3) { bonusType = "day_3"; rewardAmount = 10; }
    else if (daysSinceLastVisit >= 1) { bonusType = "day_1"; rewardAmount = 5; }
    if (!bonusType) return null;
    const id = `rb_${userId}_${Date.now()}`;
    const bonus: ReturnBonus = {
      id, userId, bonusType, rewardAmount,
      rewardCurrency: "SKY444",
      triggeredAt: new Date(),
      claimed: false,
      expiresAt: new Date(Date.now() + 48 * 3600000),
    };
    _returnBonuses.set(id, bonus);
    return bonus;
  },

  claimReturnBonus(bonusId: string): ReturnBonus | null {
    const bonus = _returnBonuses.get(bonusId);
    if (!bonus || bonus.claimed || bonus.expiresAt < new Date()) return null;
    bonus.claimed = true;
    bonus.claimedAt = new Date();
    return bonus;
  },

  getUserReturnBonuses(userId: number): ReturnBonus[] {
    return Array.from(_returnBonuses.values()).filter(b => b.userId === userId);
  },

  // Creator Loyalty Rewards
  issueCreatorLoyaltyReward(userId: number, creatorId: number, totalSpent: number, totalWatchHours: number): CreatorLoyaltyReward {
    let loyaltyTier: CreatorLoyaltyReward["loyaltyTier"] = "fan";
    let rewardAmount = 0;
    if (totalSpent >= 1000 || totalWatchHours >= 500) { loyaltyTier = "legend"; rewardAmount = 200; }
    else if (totalSpent >= 500 || totalWatchHours >= 200) { loyaltyTier = "champion"; rewardAmount = 75; }
    else if (totalSpent >= 100 || totalWatchHours >= 50) { loyaltyTier = "superfan"; rewardAmount = 25; }
    else { loyaltyTier = "fan"; rewardAmount = 5; }
    const id = `loyalty_${userId}_${creatorId}_${Date.now()}`;
    const reward: CreatorLoyaltyReward = {
      id, userId, creatorId, loyaltyTier, totalSpent, totalWatchHours,
      rewardAmount, rewardCurrency: "SKY444",
      issuedAt: new Date(),
      claimed: false,
    };
    _creatorLoyaltyRewards.set(id, reward);
    return reward;
  },

  claimLoyaltyReward(rewardId: string): CreatorLoyaltyReward | null {
    const reward = _creatorLoyaltyRewards.get(rewardId);
    if (!reward || reward.claimed) return null;
    reward.claimed = true;
    reward.claimedAt = new Date();
    return reward;
  },

  getUserLoyaltyRewards(userId: number): CreatorLoyaltyReward[] {
    return Array.from(_creatorLoyaltyRewards.values()).filter(r => r.userId === userId);
  },
};

// ─── RETENTION AI ENGINE ──────────────────────────────────────────────────────

export const retentionAI = {
  // Churn Prevention
  detectChurnTrigger(userId: number, daysSinceLastActivity: number, recentEngagementDrop: boolean, subscriptionLapsed: boolean): ChurnTrigger | null {
    let triggerType: ChurnTrigger["triggerType"] | null = null;
    let severity: ChurnTrigger["severity"] = "low";
    if (subscriptionLapsed) { triggerType = "subscription_lapse"; severity = "critical"; }
    else if (daysSinceLastActivity >= 14) { triggerType = "inactivity_14d"; severity = "high"; }
    else if (daysSinceLastActivity >= 7) { triggerType = "inactivity_7d"; severity = "medium"; }
    else if (daysSinceLastActivity >= 3) { triggerType = "inactivity_3d"; severity = "low"; }
    else if (recentEngagementDrop) { triggerType = "engagement_drop"; severity = "medium"; }
    if (!triggerType) return null;
    const id = `churn_${userId}_${Date.now()}`;
    const trigger: ChurnTrigger = {
      id, userId, triggerType, severity,
      triggeredAt: new Date(),
      interventionSent: false,
      resolved: false,
    };
    _churnTriggers.set(id, trigger);
    return trigger;
  },

  sendIntervention(triggerId: string, interventionType: ChurnTrigger["interventionType"]): ChurnTrigger | null {
    const trigger = _churnTriggers.get(triggerId);
    if (!trigger || trigger.interventionSent) return null;
    trigger.interventionSent = true;
    trigger.interventionType = interventionType;
    trigger.interventionSentAt = new Date();
    return trigger;
  },

  resolveChurnTrigger(triggerId: string): ChurnTrigger | null {
    const trigger = _churnTriggers.get(triggerId);
    if (!trigger) return null;
    trigger.resolved = true;
    trigger.resolvedAt = new Date();
    return trigger;
  },

  getActiveChurnTriggers(severity?: ChurnTrigger["severity"]): ChurnTrigger[] {
    return Array.from(_churnTriggers.values()).filter(t =>
      !t.resolved && (!severity || t.severity === severity)
    );
  },

  getUserChurnTriggers(userId: number): ChurnTrigger[] {
    return Array.from(_churnTriggers.values()).filter(t => t.userId === userId);
  },

  // Creator Comeback Prompts
  sendCreatorComebackPrompt(creatorId: number, promptType: CreatorComebackPrompt["promptType"], message: string): CreatorComebackPrompt {
    const id = `comeback_${creatorId}_${Date.now()}`;
    const prompt: CreatorComebackPrompt = {
      id, creatorId, promptType, message,
      sentAt: new Date(),
      opened: false,
      actedOn: false,
    };
    _creatorComebackPrompts.set(id, prompt);
    return prompt;
  },

  recordComebackPromptOpen(promptId: string): CreatorComebackPrompt | null {
    const prompt = _creatorComebackPrompts.get(promptId);
    if (!prompt) return null;
    prompt.opened = true;
    return prompt;
  },

  recordComebackPromptAction(promptId: string): CreatorComebackPrompt | null {
    const prompt = _creatorComebackPrompts.get(promptId);
    if (!prompt) return null;
    prompt.actedOn = true;
    return prompt;
  },

  getCreatorComebackPrompts(creatorId: number): CreatorComebackPrompt[] {
    return Array.from(_creatorComebackPrompts.values()).filter(p => p.creatorId === creatorId);
  },

  // Friend Re-Engagement
  sendFriendReEngagementPrompt(userId: number, targetFriendId: number, promptType: FriendReEngagementPrompt["promptType"], message: string): FriendReEngagementPrompt {
    const id = `friend_re_${userId}_${targetFriendId}_${Date.now()}`;
    const prompt: FriendReEngagementPrompt = {
      id, userId, targetFriendId, promptType, message,
      sentAt: new Date(),
      clicked: false,
    };
    _friendReEngagementPrompts.set(id, prompt);
    return prompt;
  },

  recordFriendPromptClick(promptId: string): FriendReEngagementPrompt | null {
    const prompt = _friendReEngagementPrompts.get(promptId);
    if (!prompt) return null;
    prompt.clicked = true;
    return prompt;
  },

  // Community Revival
  sendCommunityRevivalPrompt(communityId: string, promptType: CommunityRevivalPrompt["promptType"], targetUserIds: number[], message: string): CommunityRevivalPrompt {
    const id = `revival_${communityId}_${Date.now()}`;
    const prompt: CommunityRevivalPrompt = {
      id, communityId, promptType, targetUserIds, message,
      sentAt: new Date(),
      clickCount: 0,
    };
    _communityRevivalPrompts.set(id, prompt);
    return prompt;
  },

  recordRevivalClick(promptId: string): CommunityRevivalPrompt | null {
    const prompt = _communityRevivalPrompts.get(promptId);
    if (!prompt) return null;
    prompt.clickCount++;
    return prompt;
  },

  // Retention Dashboard
  getRetentionDashboard(): {
    activeChurnTriggers: number;
    criticalChurnTriggers: number;
    interventionsSent: number;
    interventionResolvedRate: number;
    avgReturnBonusClaims: number;
    topEngagementTier: string;
  } {
    const triggers = Array.from(_churnTriggers.values());
    const resolved = triggers.filter(t => t.resolved).length;
    const interventionsSent = triggers.filter(t => t.interventionSent).length;
    const ladders = Array.from(_engagementLadders.values());
    const topTier = ladders.length > 0
      ? ladders.sort((a, b) => b.totalPointsEarned - a.totalPointsEarned)[0].currentTier
      : "bronze";
    const returnBonuses = Array.from(_returnBonuses.values());
    const claimed = returnBonuses.filter(b => b.claimed).length;
    return {
      activeChurnTriggers: triggers.filter(t => !t.resolved).length,
      criticalChurnTriggers: triggers.filter(t => !t.resolved && t.severity === "critical").length,
      interventionsSent,
      interventionResolvedRate: interventionsSent > 0 ? resolved / interventionsSent : 0,
      avgReturnBonusClaims: returnBonuses.length > 0 ? claimed / returnBonuses.length : 0,
      topEngagementTier: topTier,
    };
  },
};
