import crypto from 'crypto';
/**
 * PHASE 29 — CULTURE ENGINE
 * Meme Markets, Trend Rituals, Event Layer, Cultural Moments,
 * Hashtag Economy, Community Rituals, Cultural Reputation,
 * Seasonal Events, Platform Lore, Collective Memory
 * Goal: Culture = retention. Culture = identity. Culture = moat.
 */

import { invokeLLM } from "./_core/llm";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type MemeStatus = "rising" | "peak" | "declining" | "dead" | "classic";
export type EventStatus = "upcoming" | "active" | "ended" | "cancelled";
export type RitualStatus = "active" | "paused" | "retired";
export type HashtagStatus = "trending" | "stable" | "declining" | "banned";
export type CulturalMomentType = "meme_peak" | "viral_event" | "community_milestone" | "creator_milestone" | "platform_record" | "cultural_shift";

export interface MemeAsset {
  id: string;
  title: string;
  description: string;
  creatorId: number;
  imageUrl?: string;
  videoUrl?: string;
  templateUrl?: string;
  status: MemeStatus;
  marketCap: number; // virtual currency
  price: number; // current price per "share"
  priceHistory: Array<{ price: number; timestamp: Date }>;
  holders: Map<number, number>; // userId -> shares
  totalShares: number;
  circulatingShares: number;
  usageCount: number; // times used as template
  reactionCount: number;
  shareCount: number;
  tags: string[];
  isNFT: boolean;
  nftContractAddress?: string;
  culturalScore: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface MemeMarketTrade {
  id: string;
  memeId: string;
  traderId: number;
  tradeType: "buy" | "sell";
  shares: number;
  pricePerShare: number;
  totalValue: number;
  currency: string;
  timestamp: Date;
}

export interface PlatformEvent {
  id: string;
  title: string;
  description: string;
  eventType: "seasonal" | "community" | "creator" | "gaming" | "charity" | "cultural" | "launch";
  organizerId?: number;
  status: EventStatus;
  startsAt: Date;
  endsAt: Date;
  participantCount: number;
  participantIds: number[];
  maxParticipants?: number;
  rewards: Array<{
    rewardType: "badge" | "title" | "nft" | "currency" | "cosmetic";
    rewardId: string;
    rewardName: string;
    condition: string;
    winnersCount?: number;
  }>;
  milestones: Array<{
    target: number;
    metric: string;
    reward: string;
    achieved: boolean;
    achievedAt?: Date;
  }>;
  hashtag?: string;
  bannerUrl?: string;
  streamId?: string;
  isSponsored: boolean;
  sponsorId?: number;
  totalEngagement: number;
  createdAt: Date;
}

export interface CommunityRitual {
  id: string;
  name: string;
  description: string;
  communityId?: string;
  creatorId?: number;
  ritualType: "daily" | "weekly" | "monthly" | "annual" | "triggered";
  trigger?: string; // e.g., "every Monday 9am", "when post hits 1000 likes"
  status: RitualStatus;
  participantCount: number;
  streakRecord: number;
  currentStreak: number;
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
  actions: Array<{
    actionType: "post" | "react" | "share" | "vote" | "gift" | "challenge";
    description: string;
    rewardPoints: number;
  }>;
  totalParticipations: number;
  createdAt: Date;
}

export interface HashtagEconomy {
  id: string;
  hashtag: string;
  status: HashtagStatus;
  postCount: number;
  uniqueUsers: number;
  peakPostCount: number;
  peakDate?: Date;
  trendScore: number; // 0-100
  velocity: number; // posts per hour
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  relatedHashtags: string[];
  topCreatorIds: number[];
  monetizationEnabled: boolean;
  sponsorId?: number;
  sponsorBid?: number;
  culturalWeight: number; // how much this hashtag defines platform culture
  firstUsedAt: Date;
  lastUsedAt: Date;
}

export interface CulturalMoment {
  id: string;
  title: string;
  description: string;
  momentType: CulturalMomentType;
  triggeredBy: string; // postId, userId, eventId
  reach: number;
  engagementRate: number;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  relatedPostIds: string[];
  relatedCreatorIds: number[];
  relatedHashtags: string[];
  isArchived: boolean;
  archiveUrl?: string;
  culturalScore: number;
  occurredAt: Date;
  createdAt: Date;
}

export interface PlatformLore {
  id: string;
  title: string;
  content: string;
  loreType: "origin_story" | "platform_legend" | "creator_myth" | "community_tale" | "meme_history" | "record_breaking";
  relatedEntityId?: string;
  relatedEntityType?: string;
  verifiedBy?: number;
  isOfficial: boolean;
  viewCount: number;
  endorsements: number;
  createdAt: Date;
}

export interface CollectiveMemory {
  id: string;
  title: string;
  description: string;
  memoryType: "milestone" | "viral_moment" | "community_event" | "creator_achievement" | "platform_first";
  date: Date;
  participantCount: number;
  evidenceUrls: string[];
  tags: string[];
  isPublic: boolean;
  culturalScore: number;
  createdAt: Date;
}

export interface CulturalReputation {
  userId: number;
  cultureScore: number; // 0-1000
  memeInfluence: number;
  trendSetterScore: number;
  communityRitualStreak: number;
  eventsParticipated: number;
  culturalMomentsCreated: number;
  hashtagsLaunched: number;
  loreContributions: number;
  rank: "lurker" | "participant" | "contributor" | "influencer" | "trendsetter" | "culture_icon" | "legend";
  badges: string[];
  updatedAt: Date;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  theme: string;
  season: "spring" | "summer" | "fall" | "winter" | "custom";
  year: number;
  status: EventStatus;
  startsAt: Date;
  endsAt: Date;
  exclusiveItems: string[];
  challenges: Array<{
    id: string;
    title: string;
    description: string;
    reward: string;
    completedBy: number[];
    expiresAt: Date;
  }>;
  totalParticipants: number;
  createdAt: Date;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _memes = new Map<string, MemeAsset>();
const _memeTrades = new Map<string, MemeMarketTrade>();
const _events = new Map<string, PlatformEvent>();
const _rituals = new Map<string, CommunityRitual>();
const _hashtags = new Map<string, HashtagEconomy>();
const _culturalMoments = new Map<string, CulturalMoment>();
const _platformLore = new Map<string, PlatformLore>();
const _collectiveMemory = new Map<string, CollectiveMemory>();
const _culturalReputations = new Map<number, CulturalReputation>();
const _seasonalEvents = new Map<string, SeasonalEvent>();

// ─── MEME MARKET ENGINE ───────────────────────────────────────────────────────

export const memeMarketEngine = {
  createMeme(params: Omit<MemeAsset, "id" | "status" | "marketCap" | "price" | "priceHistory" | "holders" | "totalShares" | "circulatingShares" | "usageCount" | "reactionCount" | "shareCount" | "culturalScore" | "createdAt" | "updatedAt">): MemeAsset {
    const id = `meme_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const initialPrice = 1.0;
    const meme: MemeAsset = {
      ...params,
      id,
      status: "rising",
      marketCap: 0,
      price: initialPrice,
      priceHistory: [{ price: initialPrice, timestamp: new Date() }],
      holders: new Map(),
      totalShares: 1000000,
      circulatingShares: 0,
      usageCount: 0,
      reactionCount: 0,
      shareCount: 0,
      culturalScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _memes.set(id, meme);
    return meme;
  },

  tradeMeme(memeId: string, traderId: number, tradeType: "buy" | "sell", shares: number): {
    success: boolean;
    trade?: MemeMarketTrade;
    newPrice?: number;
    reason?: string;
  } {
    const meme = _memes.get(memeId);
    if (!meme) return { success: false, reason: "Meme not found" };
    if (meme.status === "dead") return { success: false, reason: "Meme is dead" };

    if (tradeType === "sell") {
      const held = meme.holders.get(traderId) ?? 0;
      if (held < shares) return { success: false, reason: "Insufficient shares" };
    }
    if (tradeType === "buy" && meme.circulatingShares + shares > meme.totalShares) {
      return { success: false, reason: "Insufficient supply" };
    }

    // Bonding curve pricing: price = k * (circulatingShares / totalShares)^2 + base
    const base = 1.0;
    const k = 100;
    const ratio = (meme.circulatingShares + (tradeType === "buy" ? shares : -shares)) / meme.totalShares;
    const newPrice = base + k * ratio * ratio;
    const totalValue = shares * ((meme.price + newPrice) / 2); // avg price

    if (tradeType === "buy") {
      meme.circulatingShares += shares;
      meme.holders.set(traderId, (meme.holders.get(traderId) ?? 0) + shares);
    } else {
      meme.circulatingShares -= shares;
      meme.holders.set(traderId, (meme.holders.get(traderId) ?? 0) - shares);
    }

    meme.price = newPrice;
    meme.marketCap = meme.price * meme.circulatingShares;
    meme.priceHistory.push({ price: newPrice, timestamp: new Date() });
    meme.updatedAt = new Date();

    // Update status based on market cap
    if (meme.marketCap > 100000) meme.status = "peak";
    else if (meme.marketCap > 10000) meme.status = "rising";
    else if (meme.marketCap < 100 && meme.circulatingShares > 0) meme.status = "declining";

    const tradeId = `trade_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const trade: MemeMarketTrade = {
      id: tradeId,
      memeId,
      traderId,
      tradeType,
      shares,
      pricePerShare: meme.price,
      totalValue,
      currency: "SKYCOIN",
      timestamp: new Date(),
    };
    _memeTrades.set(tradeId, trade);

    // Update cultural reputation
    this._updateCultureScore(traderId, tradeType === "buy" ? 5 : 2);

    return { success: true, trade, newPrice };
  },

  _updateCultureScore(userId: number, delta: number): void {
    const rep = this._getOrCreateReputation(userId);
    rep.cultureScore = Math.min(1000, rep.cultureScore + delta);
    rep.memeInfluence += delta;
    rep.updatedAt = new Date();
  },

  _getOrCreateReputation(userId: number): CulturalReputation {
    if (!_culturalReputations.has(userId)) {
      _culturalReputations.set(userId, {
        userId,
        cultureScore: 0,
        memeInfluence: 0,
        trendSetterScore: 0,
        communityRitualStreak: 0,
        eventsParticipated: 0,
        culturalMomentsCreated: 0,
        hashtagsLaunched: 0,
        loreContributions: 0,
        rank: "lurker",
        badges: [],
        updatedAt: new Date(),
      });
    }
    return _culturalReputations.get(userId)!;
  },

  getMeme(id: string): MemeAsset | null {
    return _memes.get(id) ?? null;
  },

  getTrendingMemes(limit = 20): MemeAsset[] {
    return Array.from(_memes.values())
      .filter(m => m.status !== "dead")
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, limit);
  },

  getMemePortfolio(userId: number): Array<{ meme: MemeAsset; shares: number; value: number }> {
    const portfolio: Array<{ meme: MemeAsset; shares: number; value: number }> = [];
    for (const meme of _memes.values()) {
      const shares = meme.holders.get(userId) ?? 0;
      if (shares > 0) portfolio.push({ meme, shares, value: shares * meme.price });
    }
    return portfolio.sort((a, b) => b.value - a.value);
  },

  getMemeMarketStats(): {
    totalMemes: number;
    totalMarketCap: number;
    risingMemes: number;
    peakMemes: number;
    topMemeByMarketCap: MemeAsset | null;
  } {
    const memes = Array.from(_memes.values());
    return {
      totalMemes: memes.length,
      totalMarketCap: memes.reduce((s, m) => s + m.marketCap, 0),
      risingMemes: memes.filter(m => m.status === "rising").length,
      peakMemes: memes.filter(m => m.status === "peak").length,
      topMemeByMarketCap: memes.sort((a, b) => b.marketCap - a.marketCap)[0] ?? null,
    };
  },
};

// ─── EVENT ENGINE ─────────────────────────────────────────────────────────────

export const eventEngine = {
  createEvent(params: Omit<PlatformEvent, "id" | "participantCount" | "participantIds" | "totalEngagement" | "createdAt">): PlatformEvent {
    const id = `event_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const event: PlatformEvent = {
      ...params,
      id,
      participantCount: 0,
      participantIds: [],
      totalEngagement: 0,
      createdAt: new Date(),
    };
    _events.set(id, event);
    return event;
  },

  joinEvent(eventId: string, userId: number): { success: boolean; reason?: string } {
    const event = _events.get(eventId);
    if (!event) return { success: false, reason: "Event not found" };
    if (event.status !== "active") return { success: false, reason: "Event not active" };
    if (event.maxParticipants && event.participantCount >= event.maxParticipants) {
      return { success: false, reason: "Event is full" };
    }
    if (event.participantIds.includes(userId)) return { success: false, reason: "Already joined" };
    event.participantIds.push(userId);
    event.participantCount++;

    // Update cultural reputation
    const rep = memeMarketEngine._getOrCreateReputation(userId);
    rep.eventsParticipated++;
    rep.cultureScore = Math.min(1000, rep.cultureScore + 10);
    rep.updatedAt = new Date();

    return { success: true };
  },

  checkMilestone(eventId: string, metric: string, currentValue: number): PlatformEvent | null {
    const event = _events.get(eventId);
    if (!event) return null;
    for (const milestone of event.milestones) {
      if (milestone.metric === metric && !milestone.achieved && currentValue >= milestone.target) {
        milestone.achieved = true;
        milestone.achievedAt = new Date();
      }
    }
    return event;
  },

  getActiveEvents(eventType?: PlatformEvent["eventType"]): PlatformEvent[] {
    const now = new Date();
    return Array.from(_events.values())
      .filter(e => e.status === "active" && e.startsAt <= now && e.endsAt > now && (!eventType || e.eventType === eventType))
      .sort((a, b) => b.participantCount - a.participantCount);
  },

  getEvent(id: string): PlatformEvent | null {
    return _events.get(id) ?? null;
  },

  createSeasonalEvent(params: Omit<SeasonalEvent, "id" | "totalParticipants" | "createdAt">): SeasonalEvent {
    const id = `season_event_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const event: SeasonalEvent = { ...params, id, totalParticipants: 0, createdAt: new Date() };
    _seasonalEvents.set(id, event);
    return event;
  },

  completeChallenge(eventId: string, challengeId: string, userId: number): { success: boolean; reward?: string } {
    const event = _seasonalEvents.get(eventId);
    if (!event) return { success: false };
    const challenge = event.challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.completedBy.includes(userId)) return { success: false };
    if (new Date() > challenge.expiresAt) return { success: false };
    challenge.completedBy.push(userId);
    return { success: true, reward: challenge.reward };
  },
};

// ─── RITUAL ENGINE ────────────────────────────────────────────────────────────

export const ritualEngine = {
  createRitual(params: Omit<CommunityRitual, "id" | "participantCount" | "streakRecord" | "currentStreak" | "totalParticipations" | "createdAt">): CommunityRitual {
    const id = `ritual_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const ritual: CommunityRitual = {
      ...params,
      id,
      participantCount: 0,
      streakRecord: 0,
      currentStreak: 0,
      totalParticipations: 0,
      createdAt: new Date(),
    };
    _rituals.set(id, ritual);
    return ritual;
  },

  participateInRitual(ritualId: string, userId: number): { success: boolean; points?: number; reason?: string } {
    const ritual = _rituals.get(ritualId);
    if (!ritual || ritual.status !== "active") return { success: false, reason: "Ritual not active" };

    ritual.participantCount++;
    ritual.totalParticipations++;
    ritual.currentStreak++;
    if (ritual.currentStreak > ritual.streakRecord) ritual.streakRecord = ritual.currentStreak;
    ritual.lastExecutedAt = new Date();

    const totalPoints = ritual.actions.reduce((s, a) => s + a.rewardPoints, 0);
    const rep = memeMarketEngine._getOrCreateReputation(userId);
    rep.communityRitualStreak++;
    rep.cultureScore = Math.min(1000, rep.cultureScore + Math.floor(totalPoints / 10));
    rep.updatedAt = new Date();

    return { success: true, points: totalPoints };
  },

  getRitual(id: string): CommunityRitual | null {
    return _rituals.get(id) ?? null;
  },

  getActiveRituals(communityId?: string): CommunityRitual[] {
    return Array.from(_rituals.values())
      .filter(r => r.status === "active" && (!communityId || r.communityId === communityId))
      .sort((a, b) => b.participantCount - a.participantCount);
  },
};

// ─── HASHTAG ECONOMY ENGINE ───────────────────────────────────────────────────

export const hashtagEconomyEngine = {
  trackHashtag(hashtag: string, userId: number): HashtagEconomy {
    const normalized = hashtag.toLowerCase().replace(/^#/, "");
    const existing = _hashtags.get(normalized);
    if (existing) {
      existing.postCount++;
      if (!existing.topCreatorIds.includes(userId)) existing.topCreatorIds.push(userId);
      existing.uniqueUsers = existing.topCreatorIds.length;
      existing.lastUsedAt = new Date();
      existing.velocity = existing.postCount / Math.max(1, (Date.now() - existing.firstUsedAt.getTime()) / 3600000);
      existing.trendScore = Math.min(100, existing.velocity * 2);
      if (existing.postCount > existing.peakPostCount) {
        existing.peakPostCount = existing.postCount;
        existing.peakDate = new Date();
      }
      return existing;
    }

    const tag: HashtagEconomy = {
      id: `tag_${normalized}`,
      hashtag: normalized,
      status: "stable",
      postCount: 1,
      uniqueUsers: 1,
      peakPostCount: 1,
      trendScore: 0,
      velocity: 0,
      sentiment: "neutral",
      relatedHashtags: [],
      topCreatorIds: [userId],
      monetizationEnabled: false,
      culturalWeight: 0,
      firstUsedAt: new Date(),
      lastUsedAt: new Date(),
    };
    _hashtags.set(normalized, tag);

    const rep = memeMarketEngine._getOrCreateReputation(userId);
    rep.hashtagsLaunched++;
    rep.trendSetterScore++;
    rep.updatedAt = new Date();

    return tag;
  },

  getTrendingHashtags(limit = 20): HashtagEconomy[] {
    return Array.from(_hashtags.values())
      .filter(h => h.status !== "banned")
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);
  },

  sponsorHashtag(hashtag: string, sponsorId: number, bid: number): HashtagEconomy | null {
    const tag = _hashtags.get(hashtag.toLowerCase().replace(/^#/, ""));
    if (!tag) return null;
    tag.monetizationEnabled = true;
    tag.sponsorId = sponsorId;
    tag.sponsorBid = bid;
    return tag;
  },

  getHashtag(hashtag: string): HashtagEconomy | null {
    return _hashtags.get(hashtag.toLowerCase().replace(/^#/, "")) ?? null;
  },
};

// ─── CULTURAL MOMENT ENGINE ───────────────────────────────────────────────────

export const culturalMomentEngine = {
  recordMoment(params: Omit<CulturalMoment, "id" | "isArchived" | "createdAt">): CulturalMoment {
    const id = `moment_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const moment: CulturalMoment = { ...params, id, isArchived: false, createdAt: new Date() };
    _culturalMoments.set(id, moment);

    // Update cultural reputation for related creators
    for (const creatorId of params.relatedCreatorIds) {
      const rep = memeMarketEngine._getOrCreateReputation(creatorId);
      rep.culturalMomentsCreated++;
      rep.cultureScore = Math.min(1000, rep.cultureScore + 20);
      rep.updatedAt = new Date();
    }

    return moment;
  },

  archiveMoment(momentId: string, archiveUrl: string): CulturalMoment | null {
    const moment = _culturalMoments.get(momentId);
    if (!moment) return null;
    moment.isArchived = true;
    moment.archiveUrl = archiveUrl;
    return moment;
  },

  getTopMoments(momentType?: CulturalMomentType, limit = 10): CulturalMoment[] {
    return Array.from(_culturalMoments.values())
      .filter(m => !momentType || m.momentType === momentType)
      .sort((a, b) => b.culturalScore - a.culturalScore)
      .slice(0, limit);
  },

  getMoment(id: string): CulturalMoment | null {
    return _culturalMoments.get(id) ?? null;
  },
};

// ─── PLATFORM LORE ENGINE ─────────────────────────────────────────────────────

export const platformLoreEngine = {
  createLore(params: Omit<PlatformLore, "id" | "viewCount" | "endorsements" | "createdAt">): PlatformLore {
    const id = `lore_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const lore: PlatformLore = { ...params, id, viewCount: 0, endorsements: 0, createdAt: new Date() };
    _platformLore.set(id, lore);

    if (params.relatedEntityType === "user" && params.relatedEntityId) {
      const userId = parseInt(params.relatedEntityId);
      const rep = memeMarketEngine._getOrCreateReputation(userId);
      rep.loreContributions++;
      rep.cultureScore = Math.min(1000, rep.cultureScore + 15);
      rep.updatedAt = new Date();
    }

    return lore;
  },

  endorseLore(loreId: string): PlatformLore | null {
    const lore = _platformLore.get(loreId);
    if (!lore) return null;
    lore.endorsements++;
    return lore;
  },

  getLore(id: string): PlatformLore | null {
    return _platformLore.get(id) ?? null;
  },

  getTopLore(loreType?: PlatformLore["loreType"], limit = 10): PlatformLore[] {
    return Array.from(_platformLore.values())
      .filter(l => !loreType || l.loreType === loreType)
      .sort((a, b) => b.endorsements - a.endorsements)
      .slice(0, limit);
  },
};

// ─── COLLECTIVE MEMORY ENGINE ─────────────────────────────────────────────────

export const collectiveMemoryEngine = {
  recordMemory(params: Omit<CollectiveMemory, "id" | "createdAt">): CollectiveMemory {
    const id = `memory_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const memory: CollectiveMemory = { ...params, id, createdAt: new Date() };
    _collectiveMemory.set(id, memory);
    return memory;
  },

  getMemory(id: string): CollectiveMemory | null {
    return _collectiveMemory.get(id) ?? null;
  },

  getTopMemories(memoryType?: CollectiveMemory["memoryType"], limit = 20): CollectiveMemory[] {
    return Array.from(_collectiveMemory.values())
      .filter(m => m.isPublic && (!memoryType || m.memoryType === memoryType))
      .sort((a, b) => b.culturalScore - a.culturalScore)
      .slice(0, limit);
  },

  getTimeline(startDate: Date, endDate: Date): CollectiveMemory[] {
    return Array.from(_collectiveMemory.values())
      .filter(m => m.date >= startDate && m.date <= endDate && m.isPublic)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  },
};

// ─── CULTURAL REPUTATION ENGINE ───────────────────────────────────────────────

export const culturalReputationEngine = {
  _computeRank(score: number): CulturalReputation["rank"] {
    if (score >= 900) return "legend";
    if (score >= 700) return "culture_icon";
    if (score >= 500) return "trendsetter";
    if (score >= 300) return "influencer";
    if (score >= 150) return "contributor";
    if (score >= 50) return "participant";
    return "lurker";
  },

  getReputation(userId: number): CulturalReputation {
    return memeMarketEngine._getOrCreateReputation(userId);
  },

  updateReputation(userId: number, updates: Partial<CulturalReputation>): CulturalReputation {
    const rep = memeMarketEngine._getOrCreateReputation(userId);
    Object.assign(rep, updates);
    rep.rank = this._computeRank(rep.cultureScore);
    rep.updatedAt = new Date();
    return rep;
  },

  awardBadge(userId: number, badge: string): CulturalReputation {
    const rep = memeMarketEngine._getOrCreateReputation(userId);
    if (!rep.badges.includes(badge)) rep.badges.push(badge);
    rep.updatedAt = new Date();
    return rep;
  },

  getLeaderboard(limit = 50): CulturalReputation[] {
    return Array.from(_culturalReputations.values())
      .sort((a, b) => b.cultureScore - a.cultureScore)
      .slice(0, limit);
  },
};

// ─── AI CULTURE ANALYST ───────────────────────────────────────────────────────

export const aiCultureAnalyst = {
  async analyzeCulturalTrend(hashtag: string): Promise<{
    prediction: string;
    sentiment: string;
    peakETA: string;
    monetizationPotential: string;
    confidence: number;
  }> {
    const tag = hashtagEconomyEngine.getHashtag(hashtag);
    let prediction = "Stable growth expected";
    let confidence = 0.6;

    try {
      const response = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Analyze cultural trend for hashtag #${hashtag} with ${tag?.postCount ?? 0} posts, ${tag?.uniqueUsers ?? 0} unique users, trend score ${tag?.trendScore ?? 0}/100. Return JSON: {"prediction": "string", "sentiment": "positive|neutral|negative", "peakETA": "string", "monetizationPotential": "low|medium|high", "confidence": 0-1}`,
        }],
        maxTokens: 200,
      });
      const content = (response.choices[0]?.message?.content as string) ?? "";
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        prediction = parsed.prediction ?? prediction;
        confidence = parsed.confidence ?? confidence;
        return {
          prediction,
          sentiment: parsed.sentiment ?? "neutral",
          peakETA: parsed.peakETA ?? "Unknown",
          monetizationPotential: parsed.monetizationPotential ?? "medium",
          confidence,
        };
      }
    } catch { /* use defaults */ }

    return {
      prediction,
      sentiment: tag?.sentiment ?? "neutral",
      peakETA: "24-48 hours",
      monetizationPotential: (tag?.trendScore ?? 0) > 70 ? "high" : "medium",
      confidence,
    };
  },

  getCultureDashboard(): {
    trendingMemes: number;
    activeEvents: number;
    activeRituals: number;
    trendingHashtags: number;
    culturalMoments: number;
    platformLoreEntries: number;
    topCultureIcons: CulturalReputation[];
    memeMarketCap: number;
  } {
    const memeStats = memeMarketEngine.getMemeMarketStats();
    return {
      trendingMemes: memeStats.risingMemes + memeStats.peakMemes,
      activeEvents: eventEngine.getActiveEvents().length,
      activeRituals: ritualEngine.getActiveRituals().length,
      trendingHashtags: hashtagEconomyEngine.getTrendingHashtags().length,
      culturalMoments: _culturalMoments.size,
      platformLoreEntries: _platformLore.size,
      topCultureIcons: culturalReputationEngine.getLeaderboard(5),
      memeMarketCap: memeStats.totalMarketCap,
    };
  },
};
