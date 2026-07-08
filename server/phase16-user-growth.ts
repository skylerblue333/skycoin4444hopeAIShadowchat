import crypto from 'crypto';
/**
 * PHASE 16 — USER GROWTH DOMINATION
 * Referral Engine, Viral Growth Systems, Network Expansion
 * Force exponential growth loops.
 */

// ─── REFERRAL ENGINE ─────────────────────────────────────────────────────────

export interface ReferralCode {
  id: string;
  code: string;
  referrerId: number;
  referrerType: "user" | "creator" | "community" | "nft_holder";
  referralType: "standard" | "creator" | "affiliate" | "community" | "nft_bonus";
  commissionRate: number;
  bonusAmount: number;
  bonusCurrency: "USD" | "SKY444";
  uses: number;
  maxUses?: number;
  totalEarned: number;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface ReferralConversion {
  id: string;
  referralCodeId: string;
  referrerId: number;
  refereeId: number;
  conversionType: "signup" | "first_purchase" | "subscription" | "nft_mint" | "creator_join";
  rewardAmount: number;
  rewardCurrency: "USD" | "SKY444";
  level: number;
  parentReferralId?: string;
  status: "pending" | "confirmed" | "paid" | "rejected";
  createdAt: Date;
  confirmedAt?: Date;
}

export interface ReferralTree {
  userId: number;
  directReferrals: number;
  level2Referrals: number;
  level3Referrals: number;
  totalNetwork: number;
  totalEarned: number;
  rank: number;
}

// ─── VIRAL GROWTH SYSTEMS ────────────────────────────────────────────────────

export interface InviteReward {
  id: string;
  userId: number;
  rewardType: "invite" | "share" | "streak" | "quest" | "milestone";
  rewardAmount: number;
  rewardCurrency: "USD" | "SKY444" | "XP";
  description: string;
  claimed: boolean;
  claimedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface StreakRecord {
  userId: number;
  streakType: "daily_login" | "daily_post" | "daily_stream" | "daily_purchase" | "daily_referral";
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Date;
  streakBonus: number;
  totalBonusEarned: number;
  milestones: Array<{ days: number; reward: number; claimed: boolean }>;
}

export interface EngagementQuest {
  id: string;
  title: string;
  description: string;
  questType: "daily" | "weekly" | "monthly" | "one_time" | "seasonal";
  category: "social" | "creator" | "trading" | "gaming" | "charity" | "community";
  requirements: Array<{ action: string; target: number; current: number }>;
  rewardAmount: number;
  rewardCurrency: "USD" | "SKY444" | "XP" | "NFT";
  rewardNftId?: string;
  isActive: boolean;
  expiresAt?: Date;
  completions: number;
  createdAt: Date;
}

export interface UserQuestProgress {
  userId: number;
  questId: string;
  progress: Array<{ action: string; current: number; target: number }>;
  completed: boolean;
  completedAt?: Date;
  rewardClaimed: boolean;
  startedAt: Date;
}

export interface CreatorMilestone {
  id: string;
  creatorId: number;
  milestoneType: "followers" | "subscribers" | "revenue" | "streams" | "posts" | "nft_sales";
  target: number;
  current: number;
  rewardAmount: number;
  rewardCurrency: "USD" | "SKY444";
  boostDurationDays: number;
  boostMultiplier: number;
  achieved: boolean;
  achievedAt?: Date;
  boostActiveUntil?: Date;
}

export interface RetentionLoop {
  id: string;
  userId: number;
  loopType: "notification_hook" | "social_obligation" | "economic_lock" | "content_addiction" | "community_bond";
  strength: number;
  lastTriggeredAt: Date;
  triggerCount: number;
  retentionScore: number;
}

// ─── NETWORK EXPANSION SYSTEMS ───────────────────────────────────────────────

export interface CrossCommunityDiscovery {
  userId: number;
  recommendedCommunities: Array<{
    communityId: string;
    name: string;
    matchScore: number;
    sharedInterests: string[];
    mutualMembers: number;
    growthRate: number;
  }>;
  generatedAt: Date;
}

export interface CreatorCollaboration {
  id: string;
  initiatorId: number;
  partnerId: number;
  collaborationType: "co_stream" | "co_post" | "joint_nft" | "cross_promote" | "joint_course";
  status: "proposed" | "accepted" | "active" | "completed" | "declined";
  revenueShare: number;
  projectedReach: number;
  actualReach: number;
  revenueGenerated: number;
  createdAt: Date;
}

export interface GrowthHeatmap {
  region: string;
  country: string;
  city?: string;
  newUsers: number;
  activeUsers: number;
  creators: number;
  revenue: number;
  growthRate: number;
  timestamp: Date;
}

export interface TrendingGrowthMap {
  period: string;
  topGrowingCategories: Array<{ category: string; growthRate: number; newCreators: number }>;
  topGrowingRegions: Array<{ region: string; growthRate: number; newUsers: number }>;
  viralContent: Array<{ contentId: string; shareVelocity: number; reachMultiplier: number }>;
  emergingCreators: Array<{ creatorId: number; followerGrowthRate: number; engagementRate: number }>;
  generatedAt: Date;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _referralCodes = new Map<string, ReferralCode>();
const _referralCodesByCode = new Map<string, ReferralCode>();
const _referralConversions = new Map<string, ReferralConversion>();
const _inviteRewards = new Map<string, InviteReward>();
const _streakRecords = new Map<string, StreakRecord>();
const _engagementQuests = new Map<string, EngagementQuest>();
const _userQuestProgress = new Map<string, UserQuestProgress>();
const _creatorMilestones = new Map<string, CreatorMilestone>();
const _retentionLoops = new Map<string, RetentionLoop>();
const _collaborations = new Map<string, CreatorCollaboration>();
const _growthHeatmaps: GrowthHeatmap[] = [];

// ─── REFERRAL ENGINE IMPLEMENTATION ─────────────────────────────────────────

export const referralEngine = {
  createReferralCode(params: Omit<ReferralCode, "id" | "uses" | "totalEarned" | "createdAt">): ReferralCode {
    const id = `ref_${params.referrerId}_${Date.now()}`;
    const code: ReferralCode = {
      ...params, id,
      uses: 0,
      totalEarned: 0,
      createdAt: new Date(),
    };
    _referralCodes.set(id, code);
    _referralCodesByCode.set(code.code, code);
    return code;
  },

  getReferralCode(code: string): ReferralCode | null {
    return _referralCodesByCode.get(code) ?? null;
  },

  getUserReferralCodes(userId: number): ReferralCode[] {
    return Array.from(_referralCodes.values()).filter(r => r.referrerId === userId);
  },

  recordConversion(params: {
    code: string;
    refereeId: number;
    conversionType: ReferralConversion["conversionType"];
    level?: number;
    parentReferralId?: string;
  }): ReferralConversion | null {
    const refCode = _referralCodesByCode.get(params.code);
    if (!refCode || !refCode.isActive) return null;
    if (refCode.maxUses && refCode.uses >= refCode.maxUses) return null;

    const id = `conv_${params.refereeId}_${Date.now()}`;
    const level = params.level ?? 1;
    const levelMultipliers: Record<number, number> = { 1: 1.0, 2: 0.5, 3: 0.25 };
    const rewardAmount = refCode.bonusAmount * (levelMultipliers[level] ?? 0.1);

    const conversion: ReferralConversion = {
      id,
      referralCodeId: refCode.id,
      referrerId: refCode.referrerId,
      refereeId: params.refereeId,
      conversionType: params.conversionType,
      rewardAmount,
      rewardCurrency: refCode.bonusCurrency,
      level,
      parentReferralId: params.parentReferralId,
      status: "pending",
      createdAt: new Date(),
    };
    _referralConversions.set(id, conversion);
    refCode.uses++;
    refCode.totalEarned += rewardAmount;
    return conversion;
  },

  confirmConversion(conversionId: string): ReferralConversion | null {
    const conv = _referralConversions.get(conversionId);
    if (!conv) return null;
    conv.status = "confirmed";
    conv.confirmedAt = new Date();
    return conv;
  },

  getReferralTree(userId: number): ReferralTree {
    const direct = Array.from(_referralConversions.values()).filter(c => c.referrerId === userId && c.level === 1);
    const level2 = Array.from(_referralConversions.values()).filter(c => c.referrerId === userId && c.level === 2);
    const level3 = Array.from(_referralConversions.values()).filter(c => c.referrerId === userId && c.level === 3);
    const totalEarned = Array.from(_referralConversions.values())
      .filter(c => c.referrerId === userId && c.status !== "rejected")
      .reduce((s, c) => s + c.rewardAmount, 0);
    return {
      userId,
      directReferrals: direct.length,
      level2Referrals: level2.length,
      level3Referrals: level3.length,
      totalNetwork: direct.length + level2.length + level3.length,
      totalEarned,
      rank: 0,
    };
  },

  getTopReferrers(limit = 20): ReferralTree[] {
    const userIds = new Set(Array.from(_referralConversions.values()).map(c => c.referrerId));
    return Array.from(userIds)
      .map(uid => this.getReferralTree(uid))
      .sort((a, b) => b.totalNetwork - a.totalNetwork)
      .slice(0, limit);
  },
};

// ─── VIRAL GROWTH ENGINE IMPLEMENTATION ─────────────────────────────────────

export const viralGrowthEngine = {
  // Invite Rewards
  issueInviteReward(userId: number, rewardType: InviteReward["rewardType"], amount: number, currency: InviteReward["rewardCurrency"], description: string): InviteReward {
    const id = `reward_${userId}_${Date.now()}`;
    const reward: InviteReward = {
      id, userId, rewardType, rewardAmount: amount, rewardCurrency: currency,
      description, claimed: false,
      expiresAt: new Date(Date.now() + 30 * 86400000),
      createdAt: new Date(),
    };
    _inviteRewards.set(id, reward);
    return reward;
  },

  claimReward(rewardId: string): InviteReward | null {
    const reward = _inviteRewards.get(rewardId);
    if (!reward || reward.claimed) return null;
    if (reward.expiresAt && reward.expiresAt < new Date()) return null;
    reward.claimed = true;
    reward.claimedAt = new Date();
    return reward;
  },

  getUserRewards(userId: number): InviteReward[] {
    return Array.from(_inviteRewards.values()).filter(r => r.userId === userId);
  },

  // Streak System
  recordActivity(userId: number, streakType: StreakRecord["streakType"]): StreakRecord {
    const key = `streak_${userId}_${streakType}`;
    const existing = _streakRecords.get(key);
    const now = new Date();
    const today = now.toDateString();

    if (!existing) {
      const milestones = [3, 7, 14, 30, 60, 90, 180, 365].map(days => ({
        days, reward: days * 10, claimed: false,
      }));
      const record: StreakRecord = {
        userId, streakType,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityAt: now,
        streakBonus: 1,
        totalBonusEarned: 0,
        milestones,
      };
      _streakRecords.set(key, record);
      return record;
    }

    const lastDay = existing.lastActivityAt.toDateString();
    const yesterday = new Date(now.getTime() - 86400000).toDateString();

    if (lastDay === today) return existing;
    if (lastDay === yesterday) {
      existing.currentStreak++;
      if (existing.currentStreak > existing.longestStreak) {
        existing.longestStreak = existing.currentStreak;
      }
    } else {
      existing.currentStreak = 1;
    }
    existing.lastActivityAt = now;
    existing.streakBonus = Math.min(5, 1 + existing.currentStreak * 0.1);
    existing.totalBonusEarned += existing.streakBonus;

    // Check milestones
    for (const milestone of existing.milestones) {
      if (!milestone.claimed && existing.currentStreak >= milestone.days) {
        milestone.claimed = true;
        existing.totalBonusEarned += milestone.reward;
      }
    }
    return existing;
  },

  getStreak(userId: number, streakType: StreakRecord["streakType"]): StreakRecord | null {
    return _streakRecords.get(`streak_${userId}_${streakType}`) ?? null;
  },

  getUserStreaks(userId: number): StreakRecord[] {
    return Array.from(_streakRecords.values()).filter(s => s.userId === userId);
  },

  // Engagement Quests
  createQuest(params: Omit<EngagementQuest, "id" | "completions" | "createdAt">): EngagementQuest {
    const id = `quest_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 7)}`;
    const quest: EngagementQuest = {
      ...params, id,
      completions: 0,
      createdAt: new Date(),
    };
    _engagementQuests.set(id, quest);
    return quest;
  },

  startQuest(userId: number, questId: string): UserQuestProgress | null {
    const quest = _engagementQuests.get(questId);
    if (!quest || !quest.isActive) return null;
    const key = `qp_${userId}_${questId}`;
    if (_userQuestProgress.has(key)) return _userQuestProgress.get(key)!;
    const progress: UserQuestProgress = {
      userId, questId,
      progress: quest.requirements.map(r => ({ action: r.action, current: 0, target: r.target })),
      completed: false,
      rewardClaimed: false,
      startedAt: new Date(),
    };
    _userQuestProgress.set(key, progress);
    return progress;
  },

  updateQuestProgress(userId: number, questId: string, action: string, increment = 1): UserQuestProgress | null {
    const key = `qp_${userId}_${questId}`;
    const progress = _userQuestProgress.get(key);
    if (!progress || progress.completed) return null;
    const step = progress.progress.find(p => p.action === action);
    if (!step) return null;
    step.current = Math.min(step.target, step.current + increment);
    if (progress.progress.every(p => p.current >= p.target)) {
      progress.completed = true;
      progress.completedAt = new Date();
      const quest = _engagementQuests.get(questId);
      if (quest) quest.completions++;
    }
    return progress;
  },

  claimQuestReward(userId: number, questId: string): UserQuestProgress | null {
    const progress = _userQuestProgress.get(`qp_${userId}_${questId}`);
    if (!progress || !progress.completed || progress.rewardClaimed) return null;
    progress.rewardClaimed = true;
    return progress;
  },

  getActiveQuests(): EngagementQuest[] {
    const now = new Date();
    return Array.from(_engagementQuests.values())
      .filter(q => q.isActive && (!q.expiresAt || q.expiresAt > now));
  },

  getUserQuestProgress(userId: number): UserQuestProgress[] {
    return Array.from(_userQuestProgress.values()).filter(p => p.userId === userId);
  },

  // Creator Milestones
  createMilestone(params: Omit<CreatorMilestone, "id" | "achieved" | "achievedAt" | "boostActiveUntil">): CreatorMilestone {
    const id = `ms_${params.creatorId}_${params.milestoneType}_${params.target}`;
    const milestone: CreatorMilestone = {
      ...params, id,
      achieved: false,
    };
    _creatorMilestones.set(id, milestone);
    return milestone;
  },

  updateMilestoneProgress(creatorId: number, milestoneType: CreatorMilestone["milestoneType"], current: number): CreatorMilestone[] {
    const milestones = Array.from(_creatorMilestones.values())
      .filter(m => m.creatorId === creatorId && m.milestoneType === milestoneType && !m.achieved);
    const triggered: CreatorMilestone[] = [];
    for (const m of milestones) {
      m.current = current;
      if (current >= m.target) {
        m.achieved = true;
        m.achievedAt = new Date();
        m.boostActiveUntil = new Date(Date.now() + m.boostDurationDays * 86400000);
        triggered.push(m);
      }
    }
    return triggered;
  },

  getCreatorMilestones(creatorId: number): CreatorMilestone[] {
    return Array.from(_creatorMilestones.values()).filter(m => m.creatorId === creatorId);
  },

  getActiveBoosts(creatorId: number): CreatorMilestone[] {
    const now = new Date();
    return Array.from(_creatorMilestones.values())
      .filter(m => m.creatorId === creatorId && m.achieved && m.boostActiveUntil && m.boostActiveUntil > now);
  },

  // Retention Loops
  recordRetentionEvent(userId: number, loopType: RetentionLoop["loopType"]): RetentionLoop {
    const key = `ret_${userId}_${loopType}`;
    const existing = _retentionLoops.get(key);
    if (existing) {
      existing.triggerCount++;
      existing.lastTriggeredAt = new Date();
      existing.strength = Math.min(1, existing.strength + 0.05);
      existing.retentionScore = existing.strength * existing.triggerCount;
      return existing;
    }
    const loop: RetentionLoop = {
      id: key,
      userId, loopType,
      strength: 0.1,
      lastTriggeredAt: new Date(),
      triggerCount: 1,
      retentionScore: 0.1,
    };
    _retentionLoops.set(key, loop);
    return loop;
  },

  getUserRetentionScore(userId: number): number {
    const loops = Array.from(_retentionLoops.values()).filter(l => l.userId === userId);
    if (loops.length === 0) return 0;
    return loops.reduce((s, l) => s + l.retentionScore, 0) / loops.length;
  },
};

// ─── NETWORK EXPANSION ENGINE IMPLEMENTATION ─────────────────────────────────

export const networkExpansionEngine = {
  // Cross-Community Discovery
  generateCommunityRecommendations(userId: number, userInterests: string[], currentCommunityIds: string[]): CrossCommunityDiscovery {
    // Simulate intelligent matching based on interests
    const allInterests = ["crypto", "gaming", "art", "music", "tech", "fitness", "finance", "streaming"];
    const recommendations = allInterests
      .filter(i => !userInterests.includes(i))
      .slice(0, 5)
      .map((interest, idx) => ({
        communityId: `comm_${interest}_${idx}`,
        name: `${interest.charAt(0).toUpperCase() + interest.slice(1)} Community`,
        matchScore: Math.max(0.3, 0.9 - idx * 0.1),
        sharedInterests: userInterests.filter(() => (crypto.getRandomValues(new Uint8Array(1))[0] / 256) > 0.5),
        mutualMembers: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 50),
        growthRate: (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.3,
      }));
    return {
      userId,
      recommendedCommunities: recommendations,
      generatedAt: new Date(),
    };
  },

  // Creator Collaborations
  proposeCollaboration(params: Omit<CreatorCollaboration, "id" | "actualReach" | "revenueGenerated" | "createdAt">): CreatorCollaboration {
    const id = `collab_${params.initiatorId}_${params.partnerId}_${Date.now()}`;
    const collab: CreatorCollaboration = {
      ...params, id,
      actualReach: 0,
      revenueGenerated: 0,
      createdAt: new Date(),
    };
    _collaborations.set(id, collab);
    return collab;
  },

  respondToCollaboration(collabId: string, accept: boolean): CreatorCollaboration | null {
    const collab = _collaborations.get(collabId);
    if (!collab) return null;
    collab.status = accept ? "accepted" : "declined";
    return collab;
  },

  completeCollaboration(collabId: string, actualReach: number, revenueGenerated: number): CreatorCollaboration | null {
    const collab = _collaborations.get(collabId);
    if (!collab) return null;
    collab.status = "completed";
    collab.actualReach = actualReach;
    collab.revenueGenerated = revenueGenerated;
    return collab;
  },

  getCreatorCollaborations(creatorId: number): CreatorCollaboration[] {
    return Array.from(_collaborations.values())
      .filter(c => c.initiatorId === creatorId || c.partnerId === creatorId);
  },

  // Growth Heatmaps
  recordGrowthData(data: Omit<GrowthHeatmap, "timestamp">): GrowthHeatmap {
    const entry: GrowthHeatmap = { ...data, timestamp: new Date() };
    _growthHeatmaps.push(entry);
    return entry;
  },

  getGrowthHeatmap(limit = 100): GrowthHeatmap[] {
    return _growthHeatmaps.slice(-limit);
  },

  getTopGrowthRegions(limit = 10): GrowthHeatmap[] {
    const latest = new Map<string, GrowthHeatmap>();
    for (const entry of _growthHeatmaps) {
      const key = `${entry.country}_${entry.city ?? ""}`;
      if (!latest.has(key) || latest.get(key)!.timestamp < entry.timestamp) {
        latest.set(key, entry);
      }
    }
    return Array.from(latest.values())
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, limit);
  },

  // Trending Growth Map
  generateTrendingGrowthMap(period: string): TrendingGrowthMap {
    const categories = ["gaming", "crypto", "art", "music", "fitness", "tech", "streaming", "education"];
    const regions = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "Africa"];
    return {
      period,
      topGrowingCategories: categories.slice(0, 5).map((cat, i) => ({
        category: cat,
        growthRate: Math.max(0.05, 0.45 - i * 0.07),
        newCreators: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 500) + 100,
      })),
      topGrowingRegions: regions.slice(0, 4).map((reg, i) => ({
        region: reg,
        growthRate: Math.max(0.05, 0.35 - i * 0.06),
        newUsers: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10000) + 1000,
      })),
      viralContent: [],
      emergingCreators: [],
      generatedAt: new Date(),
    };
  },

  // Growth Metrics Summary
  getGrowthMetrics(): {
    totalReferrals: number;
    totalConversions: number;
    activeStreaks: number;
    activeQuests: number;
    collaborationsActive: number;
    retentionScore: number;
  } {
    const activeStreaks = Array.from(_streakRecords.values()).filter(s => {
      const daysSince = (Date.now() - s.lastActivityAt.getTime()) / 86400000;
      return daysSince <= 1;
    }).length;
    return {
      totalReferrals: Array.from(_referralCodes.values()).reduce((s, r) => s + r.uses, 0),
      totalConversions: _referralConversions.size,
      activeStreaks,
      activeQuests: viralGrowthEngine.getActiveQuests().length,
      collaborationsActive: Array.from(_collaborations.values()).filter(c => c.status === "active").length,
      retentionScore: 0,
    };
  },
};
