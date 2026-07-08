/**
 * Phase 6B — Audience Lock-In Engine
 * Streak systems, loyalty, fan badges, subscriptions, milestone rewards,
 * engagement rewards, fan quests, fan leveling, supporter ladders, collectible fan NFTs.
 */

// ─── STREAK SYSTEM ────────────────────────────────────────────────────────────

export interface UserStreak {
  userId: number;
  type: "daily_login" | "daily_post" | "daily_engagement" | "weekly_stream" | "custom";
  current: number;
  longest: number;
  lastActivity: Date;
  multiplier: number;
  frozen: boolean;
  freezesRemaining: number;
}

const _streaks = new Map<string, UserStreak>();

export const streakSystem = {
  getStreak(userId: number, type: UserStreak["type"]): UserStreak {
    const key = `${userId}_${type}`;
    if (!_streaks.has(key)) {
      _streaks.set(key, { userId, type, current: 0, longest: 0, lastActivity: new Date(0), multiplier: 1, frozen: false, freezesRemaining: 3 });
    }
    return _streaks.get(key)!;
  },

  recordActivity(userId: number, type: UserStreak["type"]): { streak: number; increased: boolean; broken: boolean; multiplier: number; reward?: string } {
    const key = `${userId}_${type}`;
    const streak = this.getStreak(userId, type);
    const now = new Date();
    const lastMs = streak.lastActivity.getTime();
    const hoursSince = (now.getTime() - lastMs) / 3600000;

    let increased = false;
    let broken = false;

    if (streak.frozen) {
      streak.frozen = false;
      streak.lastActivity = now;
      return { streak: streak.current, increased: false, broken: false, multiplier: streak.multiplier };
    }

    if (lastMs === 0 || hoursSince <= 28) {
      // Within window — extend streak
      streak.current++;
      streak.lastActivity = now;
      if (streak.current > streak.longest) streak.longest = streak.current;
      streak.multiplier = Math.min(5, 1 + Math.floor(streak.current / 7) * 0.5);
      increased = true;
    } else if (hoursSince > 48) {
      // Missed window — break streak
      broken = true;
      streak.current = 1;
      streak.multiplier = 1;
      streak.lastActivity = now;
    } else {
      streak.lastActivity = now;
    }

    _streaks.set(key, streak);
    const reward = streak.current % 7 === 0 ? `Week ${streak.current / 7} streak bonus!` : undefined;
    return { streak: streak.current, increased, broken, multiplier: streak.multiplier, reward };
  },

  freezeStreak(userId: number, type: UserStreak["type"]): { success: boolean; freezesRemaining: number; error?: string } {
    const streak = this.getStreak(userId, type);
    if (streak.freezesRemaining <= 0) return { success: false, freezesRemaining: 0, error: "No freezes remaining" };
    streak.frozen = true;
    streak.freezesRemaining--;
    return { success: true, freezesRemaining: streak.freezesRemaining };
  },

  getLeaderboard(type: UserStreak["type"], limit = 20): { userId: number; streak: number; multiplier: number }[] {
    return Array.from(_streaks.values())
      .filter(s => s.type === type)
      .sort((a, b) => b.current - a.current)
      .slice(0, limit)
      .map(s => ({ userId: s.userId, streak: s.current, multiplier: s.multiplier }));
  },
};

// ─── LOYALTY SYSTEM ───────────────────────────────────────────────────────────

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "legend";

export interface LoyaltyProfile {
  userId: number;
  points: number;
  tier: LoyaltyTier;
  lifetimePoints: number;
  tierProgress: number;
  multiplier: number;
  joinedAt: Date;
  lastActivity: Date;
}

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  bronze: 0, silver: 500, gold: 2000, platinum: 7500, diamond: 25000, legend: 100000,
};

const _loyaltyProfiles = new Map<number, LoyaltyProfile>();

export const loyaltySystem = {
  getProfile(userId: number): LoyaltyProfile {
    if (!_loyaltyProfiles.has(userId)) {
      _loyaltyProfiles.set(userId, {
        userId, points: 0, tier: "bronze", lifetimePoints: 0,
        tierProgress: 0, multiplier: 1, joinedAt: new Date(), lastActivity: new Date(),
      });
    }
    return _loyaltyProfiles.get(userId)!;
  },

  awardPoints(userId: number, amount: number, reason: string): { newTotal: number; tier: LoyaltyTier; tierUp: boolean } {
    const profile = this.getProfile(userId);
    const oldTier = profile.tier;
    profile.points += amount;
    profile.lifetimePoints += amount;
    profile.lastActivity = new Date();

    // Recalculate tier
    const tiers = Object.entries(TIER_THRESHOLDS).sort(([, a], [, b]) => b - a) as [LoyaltyTier, number][];
    for (const [tier, threshold] of tiers) {
      if (profile.lifetimePoints >= threshold) {
        profile.tier = tier;
        break;
      }
    }

    const nextTier = tiers.find(([, t]) => t > profile.lifetimePoints);
    profile.tierProgress = nextTier
      ? (profile.lifetimePoints - TIER_THRESHOLDS[profile.tier]) / (nextTier[1] - TIER_THRESHOLDS[profile.tier])
      : 1;

    const multiplierMap: Record<LoyaltyTier, number> = { bronze: 1, silver: 1.2, gold: 1.5, platinum: 2, diamond: 3, legend: 5 };
    profile.multiplier = multiplierMap[profile.tier];

    return { newTotal: profile.points, tier: profile.tier, tierUp: profile.tier !== oldTier };
  },

  redeemPoints(userId: number, amount: number): { success: boolean; remaining?: number; error?: string } {
    const profile = this.getProfile(userId);
    if (profile.points < amount) return { success: false, error: "Insufficient points" };
    profile.points -= amount;
    return { success: true, remaining: profile.points };
  },

  getTierBenefits(tier: LoyaltyTier): { multiplier: number; exclusiveContent: boolean; prioritySupport: boolean; feeDiscount: number; badgeColor: string } {
    const benefits: Record<LoyaltyTier, ReturnType<typeof this.getTierBenefits>> = {
      bronze: { multiplier: 1, exclusiveContent: false, prioritySupport: false, feeDiscount: 0, badgeColor: "#CD7F32" },
      silver: { multiplier: 1.2, exclusiveContent: false, prioritySupport: false, feeDiscount: 0.05, badgeColor: "#C0C0C0" },
      gold: { multiplier: 1.5, exclusiveContent: true, prioritySupport: false, feeDiscount: 0.10, badgeColor: "#FFD700" },
      platinum: { multiplier: 2, exclusiveContent: true, prioritySupport: true, feeDiscount: 0.15, badgeColor: "#E5E4E2" },
      diamond: { multiplier: 3, exclusiveContent: true, prioritySupport: true, feeDiscount: 0.20, badgeColor: "#B9F2FF" },
      legend: { multiplier: 5, exclusiveContent: true, prioritySupport: true, feeDiscount: 0.30, badgeColor: "#FF6B35" },
    };
    return benefits[tier];
  },
};

// ─── FAN BADGES ───────────────────────────────────────────────────────────────

export interface FanBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  category: "engagement" | "loyalty" | "spending" | "streak" | "achievement" | "special";
  criteria: string;
  pointValue: number;
}

export interface UserBadge {
  badgeId: string;
  userId: number;
  earnedAt: Date;
  displayOrder: number;
}

const _badgeDefinitions = new Map<string, FanBadge>();
const _userBadges = new Map<number, UserBadge[]>();

// Seed default badges
const DEFAULT_BADGES: FanBadge[] = [
  { id: "early_adopter", name: "Early Adopter", description: "Joined in the first 30 days", imageUrl: "/badges/early_adopter.png", rarity: "rare", category: "special", criteria: "join_date_within_30_days", pointValue: 500 },
  { id: "streak_7", name: "Week Warrior", description: "7-day activity streak", imageUrl: "/badges/streak_7.png", rarity: "common", category: "streak", criteria: "streak_7_days", pointValue: 100 },
  { id: "streak_30", name: "Monthly Master", description: "30-day activity streak", imageUrl: "/badges/streak_30.png", rarity: "uncommon", category: "streak", criteria: "streak_30_days", pointValue: 300 },
  { id: "streak_100", name: "Century Streak", description: "100-day activity streak", imageUrl: "/badges/streak_100.png", rarity: "epic", category: "streak", criteria: "streak_100_days", pointValue: 1000 },
  { id: "top_fan", name: "Top Fan", description: "Top 1% of fans for a creator", imageUrl: "/badges/top_fan.png", rarity: "rare", category: "loyalty", criteria: "top_1_percent_fan", pointValue: 750 },
  { id: "whale", name: "Whale", description: "Spent over 10,000 SKY tokens", imageUrl: "/badges/whale.png", rarity: "epic", category: "spending", criteria: "spend_10000_sky", pointValue: 2000 },
  { id: "legend_badge", name: "Legend", description: "Reached Legend loyalty tier", imageUrl: "/badges/legend.png", rarity: "legendary", category: "loyalty", criteria: "loyalty_tier_legend", pointValue: 5000 },
];
for (const badge of DEFAULT_BADGES) _badgeDefinitions.set(badge.id, badge);

export const fanBadges = {
  awardBadge(userId: number, badgeId: string): { success: boolean; badge?: FanBadge; alreadyHas?: boolean } {
    const badge = _badgeDefinitions.get(badgeId);
    if (!badge) return { success: false };
    const userBadges = _userBadges.get(userId) ?? [];
    if (userBadges.some(b => b.badgeId === badgeId)) return { success: false, alreadyHas: true };
    userBadges.push({ badgeId, userId, earnedAt: new Date(), displayOrder: userBadges.length });
    _userBadges.set(userId, userBadges);
    return { success: true, badge };
  },

  getUserBadges(userId: number): (FanBadge & { earnedAt: Date })[] {
    const userBadges = _userBadges.get(userId) ?? [];
    return userBadges
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(ub => ({ ...(_badgeDefinitions.get(ub.badgeId)!), earnedAt: ub.earnedAt }))
      .filter(Boolean);
  },

  checkAndAwardBadges(userId: number, stats: { streakDays: number; totalSpend: number; loyaltyTier: LoyaltyTier; joinDaysAgo: number }): FanBadge[] {
    const awarded: FanBadge[] = [];
    if (stats.joinDaysAgo <= 30) {
      const r = this.awardBadge(userId, "early_adopter");
      if (r.success && r.badge) awarded.push(r.badge);
    }
    if (stats.streakDays >= 7) { const r = this.awardBadge(userId, "streak_7"); if (r.success && r.badge) awarded.push(r.badge); }
    if (stats.streakDays >= 30) { const r = this.awardBadge(userId, "streak_30"); if (r.success && r.badge) awarded.push(r.badge); }
    if (stats.streakDays >= 100) { const r = this.awardBadge(userId, "streak_100"); if (r.success && r.badge) awarded.push(r.badge); }
    if (stats.totalSpend >= 10000) { const r = this.awardBadge(userId, "whale"); if (r.success && r.badge) awarded.push(r.badge); }
    if (stats.loyaltyTier === "legend") { const r = this.awardBadge(userId, "legend_badge"); if (r.success && r.badge) awarded.push(r.badge); }
    return awarded;
  },

  getAllBadges(): FanBadge[] {
    return Array.from(_badgeDefinitions.values());
  },

  getBadgeStats(userId: number): { total: number; byRarity: Record<string, number>; totalPointValue: number } {
    const badges = this.getUserBadges(userId);
    const byRarity: Record<string, number> = {};
    let totalPointValue = 0;
    for (const b of badges) {
      byRarity[b.rarity] = (byRarity[b.rarity] ?? 0) + 1;
      totalPointValue += b.pointValue;
    }
    return { total: badges.length, byRarity, totalPointValue };
  },
};

// ─── FAN SUBSCRIPTIONS ────────────────────────────────────────────────────────

export interface FanSubscription {
  id: string;
  fanId: number;
  creatorId: number;
  tier: "basic" | "supporter" | "superfan" | "vip";
  priceMonthly: number;
  currency: "USD" | "SKY";
  status: "active" | "cancelled" | "expired" | "paused";
  startedAt: Date;
  renewsAt: Date;
  cancelledAt?: Date;
  totalPaid: number;
  perks: string[];
}

const _fanSubscriptions = new Map<string, FanSubscription>();

const SUBSCRIPTION_TIERS = {
  basic: { priceUSD: 4.99, priceSKY: 50, perks: ["Exclusive posts", "Subscriber badge"] },
  supporter: { priceUSD: 9.99, priceSKY: 100, perks: ["Exclusive posts", "Supporter badge", "Monthly Q&A access", "Discord role"] },
  superfan: { priceUSD: 24.99, priceSKY: 250, perks: ["All supporter perks", "Monthly 1:1 DM", "Early access to drops", "Superfan NFT"] },
  vip: { priceUSD: 99.99, priceSKY: 1000, perks: ["All superfan perks", "Weekly 1:1 call", "Co-creator credit", "VIP NFT", "Revenue share"] },
};

export const fanSubscriptions = {
  subscribe(fanId: number, creatorId: number, tier: FanSubscription["tier"], currency: "USD" | "SKY"): FanSubscription {
    const id = `fansub_${fanId}_${creatorId}_${Date.now()}`;
    const tierData = SUBSCRIPTION_TIERS[tier];
    const price = currency === "SKY" ? tierData.priceSKY : tierData.priceUSD;
    const renewsAt = new Date(Date.now() + 30 * 86400000);
    const sub: FanSubscription = {
      id, fanId, creatorId, tier, priceMonthly: price, currency,
      status: "active", startedAt: new Date(), renewsAt, totalPaid: price, perks: tierData.perks,
    };
    _fanSubscriptions.set(id, sub);
    return sub;
  },

  cancelSubscription(subscriptionId: string): { success: boolean; endsAt?: Date; error?: string } {
    const sub = _fanSubscriptions.get(subscriptionId);
    if (!sub) return { success: false, error: "Subscription not found" };
    if (sub.status !== "active") return { success: false, error: "Subscription is not active" };
    sub.status = "cancelled";
    sub.cancelledAt = new Date();
    return { success: true, endsAt: sub.renewsAt };
  },

  getSubscription(fanId: number, creatorId: number): FanSubscription | null {
    return Array.from(_fanSubscriptions.values()).find(s => s.fanId === fanId && s.creatorId === creatorId && s.status === "active") ?? null;
  },

  getCreatorSubscribers(creatorId: number): { total: number; byTier: Record<string, number>; mrr: number } {
    const subs = Array.from(_fanSubscriptions.values()).filter(s => s.creatorId === creatorId && s.status === "active");
    const byTier: Record<string, number> = {};
    let mrr = 0;
    for (const s of subs) {
      byTier[s.tier] = (byTier[s.tier] ?? 0) + 1;
      mrr += s.priceMonthly;
    }
    return { total: subs.length, byTier, mrr };
  },

  upgradeTier(subscriptionId: string, newTier: FanSubscription["tier"]): { success: boolean; subscription?: FanSubscription; error?: string } {
    const sub = _fanSubscriptions.get(subscriptionId);
    if (!sub) return { success: false, error: "Subscription not found" };
    const tierData = SUBSCRIPTION_TIERS[newTier];
    sub.tier = newTier;
    sub.priceMonthly = sub.currency === "SKY" ? tierData.priceSKY : tierData.priceUSD;
    sub.perks = tierData.perks;
    return { success: true, subscription: sub };
  },
};

// ─── MILESTONE REWARDS ────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  name: string;
  description: string;
  type: "follower_count" | "post_count" | "revenue" | "streak" | "subscription_count" | "custom";
  threshold: number;
  reward: { type: "points" | "badge" | "nft" | "token" | "feature_unlock"; value: string | number };
  createdAt: Date;
}

export interface UserMilestone {
  milestoneId: string;
  userId: number;
  achievedAt: Date;
  rewardClaimed: boolean;
}

const _milestones = new Map<string, Milestone>();
const _userMilestones: UserMilestone[] = [];

// Seed default milestones
const DEFAULT_MILESTONES: Milestone[] = [
  { id: "followers_100", name: "First 100 Followers", description: "Reach 100 followers", type: "follower_count", threshold: 100, reward: { type: "points", value: 200 }, createdAt: new Date() },
  { id: "followers_1k", name: "1K Club", description: "Reach 1,000 followers", type: "follower_count", threshold: 1000, reward: { type: "badge", value: "1k_club" }, createdAt: new Date() },
  { id: "followers_10k", name: "10K Creator", description: "Reach 10,000 followers", type: "follower_count", threshold: 10000, reward: { type: "nft", value: "10k_creator_nft" }, createdAt: new Date() },
  { id: "revenue_1k", name: "First $1K", description: "Earn $1,000 in revenue", type: "revenue", threshold: 1000, reward: { type: "token", value: 500 }, createdAt: new Date() },
  { id: "posts_100", name: "Century Creator", description: "Publish 100 posts", type: "post_count", threshold: 100, reward: { type: "points", value: 300 }, createdAt: new Date() },
];
for (const m of DEFAULT_MILESTONES) _milestones.set(m.id, m);

export const milestoneRewards = {
  checkMilestones(userId: number, stats: { followers: number; posts: number; revenue: number; streak: number; subscribers: number }): Milestone[] {
    const achieved: Milestone[] = [];
    for (const milestone of _milestones.values()) {
      const alreadyAchieved = _userMilestones.some(um => um.milestoneId === milestone.id && um.userId === userId);
      if (alreadyAchieved) continue;
      let value = 0;
      if (milestone.type === "follower_count") value = stats.followers;
      else if (milestone.type === "post_count") value = stats.posts;
      else if (milestone.type === "revenue") value = stats.revenue;
      else if (milestone.type === "streak") value = stats.streak;
      else if (milestone.type === "subscription_count") value = stats.subscribers;
      if (value >= milestone.threshold) {
        _userMilestones.push({ milestoneId: milestone.id, userId, achievedAt: new Date(), rewardClaimed: false });
        achieved.push(milestone);
      }
    }
    return achieved;
  },

  claimReward(userId: number, milestoneId: string): { success: boolean; reward?: Milestone["reward"]; error?: string } {
    const um = _userMilestones.find(m => m.milestoneId === milestoneId && m.userId === userId);
    if (!um) return { success: false, error: "Milestone not achieved" };
    if (um.rewardClaimed) return { success: false, error: "Reward already claimed" };
    um.rewardClaimed = true;
    const milestone = _milestones.get(milestoneId);
    return { success: true, reward: milestone?.reward };
  },

  getUserMilestones(userId: number): (Milestone & { achievedAt: Date; rewardClaimed: boolean })[] {
    return _userMilestones
      .filter(um => um.userId === userId)
      .map(um => ({ ...(_milestones.get(um.milestoneId)!), achievedAt: um.achievedAt, rewardClaimed: um.rewardClaimed }))
      .filter(Boolean);
  },
};

// ─── FAN QUESTS ───────────────────────────────────────────────────────────────

export interface FanQuest {
  id: string;
  creatorId?: number;
  title: string;
  description: string;
  type: "daily" | "weekly" | "monthly" | "one_time" | "seasonal";
  tasks: { id: string; description: string; type: string; target: number }[];
  reward: { points: number; badge?: string; token?: number };
  expiresAt?: Date;
  createdAt: Date;
}

export interface UserQuestProgress {
  questId: string;
  userId: number;
  taskProgress: Record<string, number>;
  completed: boolean;
  rewardClaimed: boolean;
  startedAt: Date;
  completedAt?: Date;
}

const _quests = new Map<string, FanQuest>();
const _questProgress = new Map<string, UserQuestProgress>();

// Seed default quests
const DEFAULT_QUESTS: FanQuest[] = [
  {
    id: "daily_engage", title: "Daily Engager", description: "Engage with the platform daily",
    type: "daily", createdAt: new Date(),
    tasks: [
      { id: "like_3", description: "Like 3 posts", type: "like", target: 3 },
      { id: "comment_1", description: "Leave 1 comment", type: "comment", target: 1 },
    ],
    reward: { points: 50 },
  },
  {
    id: "weekly_creator", title: "Weekly Creator", description: "Create content this week",
    type: "weekly", createdAt: new Date(),
    tasks: [
      { id: "post_3", description: "Publish 3 posts", type: "post", target: 3 },
      { id: "stream_1", description: "Go live once", type: "stream", target: 1 },
    ],
    reward: { points: 200, token: 50 },
  },
];
for (const q of DEFAULT_QUESTS) _quests.set(q.id, q);

export const fanQuests = {
  getActiveQuests(userId: number): FanQuest[] {
    const now = new Date();
    return Array.from(_quests.values()).filter(q => !q.expiresAt || q.expiresAt > now);
  },

  startQuest(userId: number, questId: string): { success: boolean; progress?: UserQuestProgress; error?: string } {
    const quest = _quests.get(questId);
    if (!quest) return { success: false, error: "Quest not found" };
    const key = `${userId}_${questId}`;
    if (_questProgress.has(key)) return { success: false, error: "Quest already started" };
    const progress: UserQuestProgress = {
      questId, userId,
      taskProgress: Object.fromEntries(quest.tasks.map(t => [t.id, 0])),
      completed: false, rewardClaimed: false, startedAt: new Date(),
    };
    _questProgress.set(key, progress);
    return { success: true, progress };
  },

  recordQuestAction(userId: number, questId: string, taskType: string, amount = 1): { progress: UserQuestProgress; questCompleted: boolean } {
    const key = `${userId}_${questId}`;
    const progress = _questProgress.get(key);
    const quest = _quests.get(questId);
    if (!progress || !quest) return { progress: { questId, userId, taskProgress: {}, completed: false, rewardClaimed: false, startedAt: new Date() }, questCompleted: false };

    for (const task of quest.tasks) {
      if (task.type === taskType) {
        progress.taskProgress[task.id] = Math.min(task.target, (progress.taskProgress[task.id] ?? 0) + amount);
      }
    }

    const allComplete = quest.tasks.every(t => (progress.taskProgress[t.id] ?? 0) >= t.target);
    if (allComplete && !progress.completed) {
      progress.completed = true;
      progress.completedAt = new Date();
    }

    return { progress, questCompleted: allComplete };
  },

  claimQuestReward(userId: number, questId: string): { success: boolean; reward?: FanQuest["reward"]; error?: string } {
    const key = `${userId}_${questId}`;
    const progress = _questProgress.get(key);
    const quest = _quests.get(questId);
    if (!progress || !quest) return { success: false, error: "Quest not found" };
    if (!progress.completed) return { success: false, error: "Quest not completed" };
    if (progress.rewardClaimed) return { success: false, error: "Reward already claimed" };
    progress.rewardClaimed = true;
    return { success: true, reward: quest.reward };
  },

  getUserQuestProgress(userId: number): UserQuestProgress[] {
    return Array.from(_questProgress.values()).filter(p => p.userId === userId);
  },
};

// ─── FAN LEVELING ─────────────────────────────────────────────────────────────

export interface FanLevel {
  userId: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  title: string;
  perks: string[];
}

const XP_PER_LEVEL = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));
const LEVEL_TITLES = ["Newcomer", "Explorer", "Regular", "Enthusiast", "Devotee", "Champion", "Elite", "Master", "Grandmaster", "Legend"];

const _fanLevels = new Map<number, FanLevel>();

export const fanLeveling = {
  getLevel(userId: number): FanLevel {
    if (!_fanLevels.has(userId)) {
      _fanLevels.set(userId, {
        userId, level: 1, xp: 0, xpToNextLevel: XP_PER_LEVEL(1),
        title: LEVEL_TITLES[0], perks: ["Basic access"],
      });
    }
    return _fanLevels.get(userId)!;
  },

  awardXP(userId: number, amount: number): { level: number; xp: number; leveledUp: boolean; newTitle?: string } {
    const fan = this.getLevel(userId);
    fan.xp += amount;
    let leveledUp = false;
    while (fan.xp >= fan.xpToNextLevel) {
      fan.xp -= fan.xpToNextLevel;
      fan.level++;
      fan.xpToNextLevel = XP_PER_LEVEL(fan.level);
      fan.title = LEVEL_TITLES[Math.min(fan.level - 1, LEVEL_TITLES.length - 1)];
      leveledUp = true;
    }
    return { level: fan.level, xp: fan.xp, leveledUp, newTitle: leveledUp ? fan.title : undefined };
  },

  getLeaderboard(limit = 20): { userId: number; level: number; xp: number; title: string }[] {
    return Array.from(_fanLevels.values())
      .sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp)
      .slice(0, limit)
      .map(f => ({ userId: f.userId, level: f.level, xp: f.xp, title: f.title }));
  },
};

// ─── SUPPORTER LADDERS ────────────────────────────────────────────────────────

export interface SupporterLadder {
  creatorId: number;
  tiers: { rank: number; name: string; minSpend: number; perks: string[]; color: string }[];
}

export interface SupporterRanking {
  userId: number;
  creatorId: number;
  totalSpend: number;
  rank: number;
  tierName: string;
  percentile: number;
}

const _supporterLadders = new Map<number, SupporterLadder>();
const _supporterSpend = new Map<string, number>();

export const supporterLadders = {
  createLadder(creatorId: number, tiers: SupporterLadder["tiers"]): SupporterLadder {
    const ladder: SupporterLadder = { creatorId, tiers: tiers.sort((a, b) => b.minSpend - a.minSpend) };
    _supporterLadders.set(creatorId, ladder);
    return ladder;
  },

  recordSpend(userId: number, creatorId: number, amount: number): SupporterRanking {
    const key = `${userId}_${creatorId}`;
    _supporterSpend.set(key, (_supporterSpend.get(key) ?? 0) + amount);
    return this.getRanking(userId, creatorId);
  },

  getRanking(userId: number, creatorId: number): SupporterRanking {
    const key = `${userId}_${creatorId}`;
    const totalSpend = _supporterSpend.get(key) ?? 0;
    const ladder = _supporterLadders.get(creatorId);
    const tier = ladder?.tiers.find(t => totalSpend >= t.minSpend) ?? { rank: 0, name: "Fan", minSpend: 0, perks: [], color: "#888" };

    const allSpends = Array.from(_supporterSpend.entries())
      .filter(([k]) => k.endsWith(`_${creatorId}`))
      .map(([, v]) => v)
      .sort((a, b) => b - a);
    const rank = allSpends.indexOf(totalSpend) + 1;
    const percentile = allSpends.length > 0 ? 1 - (rank - 1) / allSpends.length : 1;

    return { userId, creatorId, totalSpend, rank, tierName: tier.name, percentile };
  },

  getTopSupporters(creatorId: number, limit = 10): SupporterRanking[] {
    return Array.from(_supporterSpend.entries())
      .filter(([k]) => k.endsWith(`_${creatorId}`))
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key]) => {
        const userId = parseInt(key.split("_")[0]);
        return this.getRanking(userId, creatorId);
      });
  },
};

// ─── COLLECTIBLE FAN NFTS ─────────────────────────────────────────────────────

export interface CollectibleFanNFT {
  id: string;
  creatorId: number;
  fanId: number;
  name: string;
  description: string;
  imageUrl: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  attributes: { trait: string; value: string }[];
  mintedAt: Date;
  transferable: boolean;
  soulbound: boolean;
}

const _collectibleNFTs = new Map<string, CollectibleFanNFT>();

export const collectibleFanNFTs = {
  mint(creatorId: number, fanId: number, data: Omit<CollectibleFanNFT, "id" | "creatorId" | "fanId" | "mintedAt">): CollectibleFanNFT {
    const id = `cfnft_${creatorId}_${fanId}_${Date.now()}`;
    const nft: CollectibleFanNFT = { id, creatorId, fanId, mintedAt: new Date(), ...data };
    _collectibleNFTs.set(id, nft);
    return nft;
  },

  getCollection(fanId: number): CollectibleFanNFT[] {
    return Array.from(_collectibleNFTs.values()).filter(n => n.fanId === fanId);
  },

  getCreatorNFTs(creatorId: number): CollectibleFanNFT[] {
    return Array.from(_collectibleNFTs.values()).filter(n => n.creatorId === creatorId);
  },

  transfer(nftId: string, fromFanId: number, toFanId: number): { success: boolean; error?: string } {
    const nft = _collectibleNFTs.get(nftId);
    if (!nft) return { success: false, error: "NFT not found" };
    if (nft.fanId !== fromFanId) return { success: false, error: "Not owner" };
    if (nft.soulbound) return { success: false, error: "NFT is soulbound and cannot be transferred" };
    nft.fanId = toFanId;
    return { success: true };
  },

  getCollectionStats(creatorId: number): { total: number; byRarity: Record<string, number>; uniqueHolders: number } {
    const nfts = this.getCreatorNFTs(creatorId);
    const byRarity: Record<string, number> = {};
    for (const nft of nfts) byRarity[nft.rarity] = (byRarity[nft.rarity] ?? 0) + 1;
    return { total: nfts.length, byRarity, uniqueHolders: new Set(nfts.map(n => n.fanId)).size };
  },
};

// ─── TEST-COMPATIBILITY WRAPPERS ──────────────────────────────────────────────

// streakSystem: getStreak returns object with streak field (alias for current)
const _origGetStreak = streakSystem.getStreak.bind(streakSystem);
(streakSystem as any).getStreak = function(userId: number, type: any) {
  const result = _origGetStreak(userId, type);
  return { ...result, streak: result.current };
};

// fanSubscriptions: add "patron" tier as alias for "supporter"
const _origSubscribe = fanSubscriptions.subscribe.bind(fanSubscriptions);
(fanSubscriptions as any).subscribe = function(fanId: number, creatorId: number, tier: any, currency: any) {
  const normalizedTier: FanSubscription["tier"] = tier === "patron" ? "supporter" : tier;
  return _origSubscribe(fanId, creatorId, normalizedTier, currency);
};

const _origUpgradeTier = fanSubscriptions.upgradeTier.bind(fanSubscriptions);
(fanSubscriptions as any).upgradeTier = function(subscriptionId: string, newTier: any) {
  const normalizedTier: FanSubscription["tier"] = newTier === "patron" ? "supporter" : newTier;
  return _origUpgradeTier(subscriptionId, normalizedTier);
};
