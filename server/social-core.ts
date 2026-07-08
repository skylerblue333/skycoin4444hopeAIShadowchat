import crypto from 'crypto';
/**
 * SOCIAL CORE ENGINE — Retention-First Social Loops
 *
 * Architecture: Reddit + X + TikTok hybrid
 *
 * Services:
 * - TrendEngineService: Real-time trending topics, hashtags, viral detection
 * - AIFeedRankingService: ML-powered personalized feed scoring
 * - ReelsEngineService: Short-form video feed, discovery, engagement
 * - QuotePostService: Quote posts, repost trees, attribution chains
 * - FriendGraphService: Social graph, mutual connections, suggestions
 * - ReputationEngineService: Trust scores, badges, verification tiers
 * - VoiceNoteService: Audio message recording, transcription, playback
 * - VerificationService: Identity verification, creator verification
 * - SocialSearchService: Full-text search across posts, users, communities
 * - ContentRecommendationService: Cross-platform content discovery
 */

import { invokeLLM } from "./_core/llm";

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export type TrendCategory = "global" | "crypto" | "gaming" | "creator" | "community" | "charity" | "defi" | "nft";
export type BadgeType = "verified" | "creator" | "whale" | "og" | "donor" | "champion" | "moderator" | "partner" | "developer";
export type VerificationLevel = "none" | "email" | "phone" | "id" | "creator" | "enterprise";
export type ReputationTier = "new" | "member" | "trusted" | "veteran" | "legend" | "icon";
export type FeedAlgorithm = "chronological" | "ranked" | "discovery" | "following" | "trending";

export interface TrendingTopic {
  id: string;
  topic: string;
  hashtag?: string;
  category: TrendCategory;
  postCount: number;
  postCountDelta: number; // change in last hour
  engagementScore: number;
  velocityScore: number; // rate of growth
  peakTime?: Date;
  isBreaking: boolean;
  relatedTopics: string[];
  topPosts: string[]; // post IDs
  startedAt: Date;
  lastUpdated: Date;
}

export interface FeedPost {
  id: string;
  authorId: number;
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  mentions: number[];
  quotedPostId?: string;
  repostOfId?: string;
  communityId?: string;
  channelId?: string;
  isPremium: boolean;
  premiumPrice?: number;
  likeCount: number;
  repostCount: number;
  quoteCount: number;
  commentCount: number;
  viewCount: number;
  bookmarkCount: number;
  shareCount: number;
  createdAt: Date;
  editedAt?: Date;
}

export interface FeedScore {
  postId: string;
  userId: number;
  baseScore: number;
  personalizedScore: number;
  factors: {
    recency: number;
    engagement: number;
    authorAffinity: number;
    topicAffinity: number;
    viralityBoost: number;
    premiumBoost: number;
    diversityPenalty: number;
  };
  algorithm: FeedAlgorithm;
  computedAt: Date;
}

export interface Reel {
  id: string;
  creatorId: number;
  videoUrl: string;
  hlsUrl: string;
  thumbnailUrl: string;
  duration: number; // seconds, max 90
  caption: string;
  hashtags: string[];
  audioTrack?: { name: string; artist: string; url: string };
  effects: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  completionRate: number; // % of viewers who watch to end
  isOriginalAudio: boolean;
  isPremium: boolean;
  createdAt: Date;
}

export interface QuotePost {
  id: string;
  authorId: number;
  originalPostId: string;
  originalAuthorId: number;
  commentary: string;
  mediaUrls: string[];
  likeCount: number;
  repostCount: number;
  commentCount: number;
  createdAt: Date;
}

export interface RepostTree {
  originalPostId: string;
  depth: number;
  totalReposts: number;
  totalQuotes: number;
  viralScore: number;
  tree: {
    postId: string;
    authorId: number;
    type: "repost" | "quote";
    commentary?: string;
    timestamp: Date;
    children: string[]; // post IDs
  }[];
}

export interface SocialConnection {
  userId: number;
  targetId: number;
  type: "follow" | "friend" | "block" | "mute" | "close_friend";
  mutualFollowers: number;
  interactionScore: number; // how often they interact
  createdAt: Date;
}

export interface FriendSuggestion {
  userId: number;
  suggestedUserId: number;
  reason: "mutual_follows" | "similar_interests" | "same_community" | "trending_creator" | "contact_import";
  mutualCount: number;
  sharedInterests: string[];
  confidenceScore: number;
}

export interface UserReputation {
  userId: number;
  tier: ReputationTier;
  score: number; // 0-10000
  badges: BadgeType[];
  verificationLevel: VerificationLevel;
  trustScore: number; // 0-100
  contentQualityScore: number;
  communityStandingScore: number;
  activityScore: number;
  penaltyPoints: number;
  lastCalculated: Date;
  history: { date: Date; score: number; change: number; reason: string }[];
}

export interface VoiceNote {
  id: string;
  senderId: number;
  recipientId?: number; // null for public posts
  postId?: string;
  audioUrl: string;
  duration: number; // seconds
  transcription?: string;
  waveformData: number[]; // amplitude data for visualization
  isListened: boolean;
  createdAt: Date;
}

export interface SearchResult {
  type: "post" | "user" | "community" | "hashtag" | "reel";
  id: string;
  relevanceScore: number;
  snippet?: string;
  highlightedFields: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// TREND ENGINE SERVICE
// ═══════════════════════════════════════════════════════════════

export class TrendEngineService {
  private trends: Map<string, TrendingTopic> = new Map();
  private hashtagCounts: Map<string, { count: number; lastHour: number; posts: string[] }> = new Map();
  private trendCounter = 0;

  async recordHashtag(hashtag: string, postId: string, category: TrendCategory = "global"): Promise<void> {
    const tag = hashtag.toLowerCase().replace(/^#/, "");
    const existing = this.hashtagCounts.get(tag) || { count: 0, lastHour: 0, posts: [] };
    existing.count++;
    existing.lastHour++;
    existing.posts = [postId, ...existing.posts.slice(0, 99)]; // Keep last 100 posts
    this.hashtagCounts.set(tag, existing);

    // Update or create trend
    await this.updateTrend(tag, category, postId);
  }

  private async updateTrend(hashtag: string, category: TrendCategory, postId: string): Promise<void> {
    const counts = this.hashtagCounts.get(hashtag)!;
    const existing = this.trends.get(hashtag);

    const velocityScore = counts.lastHour * 10; // Posts per hour weighted
    const engagementScore = counts.count * 2 + velocityScore;
    const isBreaking = velocityScore > 100; // 10+ posts/hour = breaking

    if (existing) {
      existing.postCount = counts.count;
      existing.postCountDelta = counts.lastHour;
      existing.velocityScore = velocityScore;
      existing.engagementScore = engagementScore;
      existing.isBreaking = isBreaking;
      existing.lastUpdated = new Date();
      if (!existing.topPosts.includes(postId)) {
        existing.topPosts = [postId, ...existing.topPosts.slice(0, 9)];
      }
    } else {
      const trendId = `trend_${Date.now()}_${++this.trendCounter}`;
      this.trends.set(hashtag, {
        id: trendId,
        topic: hashtag,
        hashtag: `#${hashtag}`,
        category,
        postCount: counts.count,
        postCountDelta: counts.lastHour,
        engagementScore,
        velocityScore,
        isBreaking,
        relatedTopics: [],
        topPosts: [postId],
        startedAt: new Date(),
        lastUpdated: new Date(),
      });
    }
  }

  async getTrending(params: {
    category?: TrendCategory;
    limit?: number;
    includeBreaking?: boolean;
  } = {}): Promise<TrendingTopic[]> {
    let trends = Array.from(this.trends.values());

    if (params.category) {
      trends = trends.filter(t => t.category === params.category || t.category === "global");
    }
    if (params.includeBreaking) {
      trends = trends.filter(t => t.isBreaking);
    }

    return trends
      .sort((a, b) => b.velocityScore - a.velocityScore)
      .slice(0, params.limit || 20);
  }

  async getBreakingTopics(): Promise<TrendingTopic[]> {
    return Array.from(this.trends.values())
      .filter(t => t.isBreaking)
      .sort((a, b) => b.velocityScore - a.velocityScore)
      .slice(0, 5);
  }

  async resetHourlyCounters(): Promise<void> {
    // Called by a cron job every hour
    for (const [tag, data] of this.hashtagCounts.entries()) {
      data.lastHour = 0;
    }
  }

  async getRelatedTopics(hashtag: string): Promise<string[]> {
    const trend = this.trends.get(hashtag.toLowerCase().replace(/^#/, ""));
    return trend?.relatedTopics || [];
  }

  async getTrendStats(): Promise<{
    totalTrends: number;
    breakingTopics: number;
    topCategory: TrendCategory;
    avgVelocity: number;
  }> {
    const trends = Array.from(this.trends.values());
    const breaking = trends.filter(t => t.isBreaking).length;
    const avgVelocity = trends.reduce((sum, t) => sum + t.velocityScore, 0) / Math.max(1, trends.length);

    const categoryCounts = trends.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<TrendCategory, number>);

    const topCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as TrendCategory || "global";

    return { totalTrends: trends.length, breakingTopics: breaking, topCategory, avgVelocity };
  }
}

// ═══════════════════════════════════════════════════════════════
// AI FEED RANKING SERVICE
// ═══════════════════════════════════════════════════════════════

export class AIFeedRankingService {
  private userInterests: Map<number, Record<string, number>> = new Map(); // userId -> topic -> weight
  private userAffinities: Map<string, number> = new Map(); // `${userId}_${authorId}` -> score
  private postScoreCache: Map<string, FeedScore> = new Map();

  async recordInteraction(userId: number, postId: string, action: "view" | "like" | "comment" | "share" | "bookmark" | "skip", topics: string[]): Promise<void> {
    const weights: Record<typeof action, number> = {
      view: 0.1, like: 1.0, comment: 2.0, share: 3.0, bookmark: 1.5, skip: -0.5,
    };
    const weight = weights[action];

    const interests = this.userInterests.get(userId) || {};
    for (const topic of topics) {
      interests[topic] = (interests[topic] || 0) + weight;
    }
    this.userInterests.set(userId, interests);
  }

  async recordAuthorInteraction(userId: number, authorId: number, action: "follow" | "like" | "comment" | "block"): Promise<void> {
    const key = `${userId}_${authorId}`;
    const weights: Record<typeof action, number> = { follow: 5.0, like: 0.5, comment: 1.0, block: -100 };
    const current = this.userAffinities.get(key) || 0;
    this.userAffinities.set(key, Math.max(-100, current + weights[action]));
  }

  async scorePost(post: FeedPost, userId: number, algorithm: FeedAlgorithm = "ranked"): Promise<FeedScore> {
    const cacheKey = `${post.id}_${userId}_${algorithm}`;
    const cached = this.postScoreCache.get(cacheKey);
    if (cached && Date.now() - cached.computedAt.getTime() < 60000) return cached;

    const now = Date.now();
    const ageHours = (now - post.createdAt.getTime()) / 3600000;

    // Recency decay: exponential decay over 48 hours
    const recency = Math.exp(-ageHours / 24) * 100;

    // Engagement score: weighted combination
    const engagement = Math.log1p(
      post.likeCount * 1 +
      post.commentCount * 3 +
      post.repostCount * 5 +
      post.bookmarkCount * 2 +
      post.shareCount * 4
    ) * 10;

    // Author affinity
    const affinityKey = `${userId}_${post.authorId}`;
    const authorAffinity = Math.max(0, this.userAffinities.get(affinityKey) || 0);

    // Topic affinity
    const interests = this.userInterests.get(userId) || {};
    const topicAffinity = post.hashtags.reduce((sum, tag) => sum + (interests[tag] || 0), 0);

    // Virality boost for trending content
    const viralityBoost = post.viewCount > 10000 ? 20 : post.viewCount > 1000 ? 10 : 0;

    // Premium content boost (creator monetization)
    const premiumBoost = post.isPremium ? 5 : 0;

    // Diversity penalty (avoid showing same author repeatedly)
    const diversityPenalty = 0; // Calculated at feed assembly level

    const baseScore = recency + engagement + viralityBoost;
    const personalizedScore = baseScore + authorAffinity * 0.5 + topicAffinity * 0.3 + premiumBoost - diversityPenalty;

    const score: FeedScore = {
      postId: post.id,
      userId,
      baseScore,
      personalizedScore,
      factors: { recency, engagement, authorAffinity, topicAffinity, viralityBoost, premiumBoost, diversityPenalty },
      algorithm,
      computedAt: new Date(),
    };

    this.postScoreCache.set(cacheKey, score);
    return score;
  }

  async rankFeed(posts: FeedPost[], userId: number, algorithm: FeedAlgorithm = "ranked"): Promise<FeedPost[]> {
    if (algorithm === "chronological") {
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const scored = await Promise.all(
      posts.map(async post => ({
        post,
        score: await this.scorePost(post, userId, algorithm),
      }))
    );

    // Apply diversity: max 3 posts from same author in top 20
    const authorCounts: Record<number, number> = {};
    const diversified = scored
      .sort((a, b) => b.score.personalizedScore - a.score.personalizedScore)
      .filter(({ post }) => {
        const count = authorCounts[post.authorId] || 0;
        if (count >= 3) return false;
        authorCounts[post.authorId] = count + 1;
        return true;
      });

    return diversified.map(d => d.post);
  }

  async getUserInterestProfile(userId: number): Promise<{ topic: string; weight: number }[]> {
    const interests = this.userInterests.get(userId) || {};
    return Object.entries(interests)
      .map(([topic, weight]) => ({ topic, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20);
  }

  async getTopicAffinityScore(userId: number, topics: string[]): Promise<number> {
    const interests = this.userInterests.get(userId) || {};
    return topics.reduce((sum, topic) => sum + (interests[topic] || 0), 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// REELS ENGINE SERVICE
// ═══════════════════════════════════════════════════════════════

export class ReelsEngineService {
  private reels: Map<string, Reel> = new Map();
  private reelCounter = 0;
  private userReelHistory: Map<number, Set<string>> = new Map(); // userId -> seen reel IDs

  async createReel(params: {
    creatorId: number;
    videoUrl: string;
    hlsUrl: string;
    thumbnailUrl: string;
    duration: number;
    caption: string;
    hashtags?: string[];
    audioTrack?: Reel["audioTrack"];
    effects?: string[];
    isPremium?: boolean;
  }): Promise<Reel> {
    if (params.duration > 90) throw new Error("Reels cannot exceed 90 seconds");

    const reelId = `reel_${Date.now()}_${++this.reelCounter}`;
    const reel: Reel = {
      id: reelId,
      creatorId: params.creatorId,
      videoUrl: params.videoUrl,
      hlsUrl: params.hlsUrl,
      thumbnailUrl: params.thumbnailUrl,
      duration: params.duration,
      caption: params.caption,
      hashtags: params.hashtags || [],
      audioTrack: params.audioTrack,
      effects: params.effects || [],
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      saveCount: 0,
      completionRate: 0,
      isOriginalAudio: !params.audioTrack,
      isPremium: params.isPremium || false,
      createdAt: new Date(),
    };

    this.reels.set(reelId, reel);
    return reel;
  }

  async getForYouFeed(userId: number, limit = 20): Promise<Reel[]> {
    const seen = this.userReelHistory.get(userId) || new Set();
    const available = Array.from(this.reels.values())
      .filter(r => !seen.has(r.id))
      .sort((a, b) => {
        // Blend of recency, engagement, and completion rate
        const scoreA = b.viewCount * 0.3 + b.completionRate * 50 + b.likeCount * 0.5;
        const scoreB = a.viewCount * 0.3 + a.completionRate * 50 + a.likeCount * 0.5;
        return scoreA - scoreB;
      });

    return available.slice(0, limit);
  }

  async recordView(reelId: string, userId: number, watchedSeconds: number): Promise<void> {
    const reel = this.reels.get(reelId);
    if (!reel) return;

    reel.viewCount++;
    const completionFraction = Math.min(1, watchedSeconds / reel.duration);
    reel.completionRate = (reel.completionRate * (reel.viewCount - 1) + completionFraction) / reel.viewCount;

    // Track seen reels per user
    if (!this.userReelHistory.has(userId)) {
      this.userReelHistory.set(userId, new Set());
    }
    this.userReelHistory.get(userId)!.add(reelId);
  }

  async likeReel(reelId: string): Promise<void> {
    const reel = this.reels.get(reelId);
    if (reel) reel.likeCount++;
  }

  async shareReel(reelId: string): Promise<void> {
    const reel = this.reels.get(reelId);
    if (reel) reel.shareCount++;
  }

  async saveReel(reelId: string): Promise<void> {
    const reel = this.reels.get(reelId);
    if (reel) reel.saveCount++;
  }

  async getCreatorReels(creatorId: number, limit = 20): Promise<Reel[]> {
    return Array.from(this.reels.values())
      .filter(r => r.creatorId === creatorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getTrendingReels(limit = 20): Promise<Reel[]> {
    return Array.from(this.reels.values())
      .sort((a, b) => (b.viewCount * b.completionRate) - (a.viewCount * a.completionRate))
      .slice(0, limit);
  }

  async getReelsByHashtag(hashtag: string, limit = 20): Promise<Reel[]> {
    const tag = hashtag.toLowerCase().replace(/^#/, "");
    return Array.from(this.reels.values())
      .filter(r => r.hashtags.some(h => h.toLowerCase().replace(/^#/, "") === tag))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  async deleteReel(reelId: string, creatorId: number): Promise<boolean> {
    const reel = this.reels.get(reelId);
    if (!reel || reel.creatorId !== creatorId) return false;
    this.reels.delete(reelId);
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════
// QUOTE POST SERVICE
// ═══════════════════════════════════════════════════════════════

export class QuotePostService {
  private quotePosts: Map<string, QuotePost> = new Map();
  private repostTrees: Map<string, RepostTree> = new Map();
  private quoteCounter = 0;

  async createQuotePost(params: {
    authorId: number;
    originalPostId: string;
    originalAuthorId: number;
    commentary: string;
    mediaUrls?: string[];
  }): Promise<QuotePost> {
    const quoteId = `quote_${Date.now()}_${++this.quoteCounter}`;
    const quote: QuotePost = {
      id: quoteId,
      authorId: params.authorId,
      originalPostId: params.originalPostId,
      originalAuthorId: params.originalAuthorId,
      commentary: params.commentary,
      mediaUrls: params.mediaUrls || [],
      likeCount: 0,
      repostCount: 0,
      commentCount: 0,
      createdAt: new Date(),
    };

    this.quotePosts.set(quoteId, quote);

    // Update repost tree
    await this.updateRepostTree(params.originalPostId, quoteId, params.authorId, "quote", params.commentary);

    return quote;
  }

  async getQuotesForPost(postId: string, limit = 20): Promise<QuotePost[]> {
    return Array.from(this.quotePosts.values())
      .filter(q => q.originalPostId === postId)
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit);
  }

  async getRepostTree(postId: string): Promise<RepostTree | null> {
    return this.repostTrees.get(postId) || null;
  }

  async buildRepostTree(originalPostId: string): Promise<RepostTree> {
    const quotes = Array.from(this.quotePosts.values()).filter(q => q.originalPostId === originalPostId);
    const totalQuotes = quotes.length;
    const viralScore = Math.log1p(totalQuotes) * 10;

    const tree: RepostTree = {
      originalPostId,
      depth: 1,
      totalReposts: 0,
      totalQuotes,
      viralScore,
      tree: quotes.map(q => ({
        postId: q.id,
        authorId: q.authorId,
        type: "quote" as const,
        commentary: q.commentary,
        timestamp: q.createdAt,
        children: [],
      })),
    };

    this.repostTrees.set(originalPostId, tree);
    return tree;
  }

  private async updateRepostTree(originalPostId: string, newPostId: string, authorId: number, type: "repost" | "quote", commentary?: string): Promise<void> {
    const existing = this.repostTrees.get(originalPostId);
    if (existing) {
      existing.totalQuotes++;
      existing.viralScore = Math.log1p(existing.totalQuotes) * 10;
      existing.tree.push({
        postId: newPostId,
        authorId,
        type,
        commentary,
        timestamp: new Date(),
        children: [],
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FRIEND GRAPH SERVICE
// ═══════════════════════════════════════════════════════════════

export class FriendGraphService {
  private connections: Map<string, SocialConnection> = new Map();
  private adjacencyList: Map<number, Set<number>> = new Map(); // userId -> Set of following IDs

  async addConnection(userId: number, targetId: number, type: SocialConnection["type"]): Promise<SocialConnection> {
    const key = `${userId}_${targetId}`;
    const connection: SocialConnection = {
      userId,
      targetId,
      type,
      mutualFollowers: await this.getMutualCount(userId, targetId),
      interactionScore: 0,
      createdAt: new Date(),
    };

    this.connections.set(key, connection);

    if (type === "follow" || type === "friend") {
      if (!this.adjacencyList.has(userId)) this.adjacencyList.set(userId, new Set());
      this.adjacencyList.get(userId)!.add(targetId);
    }

    return connection;
  }

  async removeConnection(userId: number, targetId: number): Promise<boolean> {
    const key = `${userId}_${targetId}`;
    const existed = this.connections.has(key);
    this.connections.delete(key);
    this.adjacencyList.get(userId)?.delete(targetId);
    return existed;
  }

  async getFollowing(userId: number): Promise<number[]> {
    return Array.from(this.adjacencyList.get(userId) || []);
  }

  async getFollowers(userId: number): Promise<number[]> {
    const followers: number[] = [];
    for (const [uid, targets] of this.adjacencyList.entries()) {
      if (targets.has(userId)) followers.push(uid);
    }
    return followers;
  }

  async getMutualFollowers(userId1: number, userId2: number): Promise<number[]> {
    const following1 = this.adjacencyList.get(userId1) || new Set();
    const following2 = this.adjacencyList.get(userId2) || new Set();
    return Array.from(following1).filter(id => following2.has(id));
  }

  async getMutualCount(userId1: number, userId2: number): Promise<number> {
    const mutuals = await this.getMutualFollowers(userId1, userId2);
    return mutuals.length;
  }

  async getSuggestions(userId: number, limit = 10): Promise<FriendSuggestion[]> {
    const following = this.adjacencyList.get(userId) || new Set();
    const suggestions: Map<number, FriendSuggestion> = new Map();

    // Friends of friends
    for (const followedId of following) {
      const theirFollowing = this.adjacencyList.get(followedId) || new Set();
      for (const candidate of theirFollowing) {
        if (candidate === userId || following.has(candidate)) continue;

        const existing = suggestions.get(candidate);
        if (existing) {
          existing.mutualCount++;
          existing.confidenceScore = Math.min(1, existing.mutualCount / 10);
        } else {
          suggestions.set(candidate, {
            userId,
            suggestedUserId: candidate,
            reason: "mutual_follows",
            mutualCount: 1,
            sharedInterests: [],
            confidenceScore: 0.1,
          });
        }
      }
    }

    return Array.from(suggestions.values())
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, limit);
  }

  async updateInteractionScore(userId: number, targetId: number, delta: number): Promise<void> {
    const key = `${userId}_${targetId}`;
    const connection = this.connections.get(key);
    if (connection) {
      connection.interactionScore = Math.max(0, connection.interactionScore + delta);
    }
  }

  async getCloseFriends(userId: number): Promise<number[]> {
    return Array.from(this.connections.values())
      .filter(c => c.userId === userId && c.type === "close_friend")
      .map(c => c.targetId);
  }

  async isBlocked(userId: number, targetId: number): Promise<boolean> {
    const key = `${userId}_${targetId}`;
    const connection = this.connections.get(key);
    return connection?.type === "block";
  }

  async getConnectionType(userId: number, targetId: number): Promise<SocialConnection["type"] | null> {
    const key = `${userId}_${targetId}`;
    return this.connections.get(key)?.type || null;
  }
}

// ═══════════════════════════════════════════════════════════════
// REPUTATION ENGINE SERVICE
// ═══════════════════════════════════════════════════════════════

export class ReputationEngineService {
  private reputations: Map<number, UserReputation> = new Map();

  async getReputation(userId: number): Promise<UserReputation> {
    if (!this.reputations.has(userId)) {
      this.reputations.set(userId, this.createDefaultReputation(userId));
    }
    return this.reputations.get(userId)!;
  }

  async updateScore(userId: number, delta: number, reason: string): Promise<UserReputation> {
    const rep = await this.getReputation(userId);
    const oldScore = rep.score;
    rep.score = Math.max(0, Math.min(10000, rep.score + delta));
    rep.tier = this.calculateTier(rep.score);
    rep.lastCalculated = new Date();
    rep.history.push({
      date: new Date(),
      score: rep.score,
      change: delta,
      reason,
    });
    // Keep last 100 history entries
    if (rep.history.length > 100) rep.history.splice(0, rep.history.length - 100);
    return rep;
  }

  async awardBadge(userId: number, badge: BadgeType): Promise<boolean> {
    const rep = await this.getReputation(userId);
    if (rep.badges.includes(badge)) return false;
    rep.badges.push(badge);
    await this.updateScore(userId, 100, `Badge awarded: ${badge}`);
    return true;
  }

  async revokeBadge(userId: number, badge: BadgeType): Promise<boolean> {
    const rep = await this.getReputation(userId);
    const idx = rep.badges.indexOf(badge);
    if (idx === -1) return false;
    rep.badges.splice(idx, 1);
    return true;
  }

  async setVerificationLevel(userId: number, level: VerificationLevel): Promise<void> {
    const rep = await this.getReputation(userId);
    rep.verificationLevel = level;
    const bonuses: Record<VerificationLevel, number> = {
      none: 0, email: 50, phone: 100, id: 200, creator: 500, enterprise: 1000,
    };
    await this.updateScore(userId, bonuses[level], `Verification: ${level}`);
  }

  async applyPenalty(userId: number, points: number, reason: string): Promise<void> {
    const rep = await this.getReputation(userId);
    rep.penaltyPoints += points;
    await this.updateScore(userId, -points * 2, `Penalty: ${reason}`);
  }

  async recalculateTrustScore(userId: number, factors: {
    accountAgeDays: number;
    verificationLevel: VerificationLevel;
    reportCount: number;
    contentQuality: number;
    activityLevel: number;
  }): Promise<number> {
    const rep = await this.getReputation(userId);

    const ageFactor = Math.min(30, factors.accountAgeDays / 10);
    const verificationBonus: Record<VerificationLevel, number> = {
      none: 0, email: 10, phone: 20, id: 30, creator: 40, enterprise: 50,
    };
    const reportPenalty = Math.min(40, factors.reportCount * 5);
    const qualityBonus = factors.contentQuality * 10;
    const activityBonus = Math.min(10, factors.activityLevel * 2);

    rep.trustScore = Math.max(0, Math.min(100,
      ageFactor + verificationBonus[factors.verificationLevel] + qualityBonus + activityBonus - reportPenalty
    ));

    return rep.trustScore;
  }

  async getLeaderboard(limit = 50): Promise<UserReputation[]> {
    return Array.from(this.reputations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private calculateTier(score: number): ReputationTier {
    if (score >= 9000) return "icon";
    if (score >= 7000) return "legend";
    if (score >= 5000) return "veteran";
    if (score >= 2000) return "trusted";
    if (score >= 500) return "member";
    return "new";
  }

  private createDefaultReputation(userId: number): UserReputation {
    return {
      userId,
      tier: "new",
      score: 100,
      badges: [],
      verificationLevel: "none",
      trustScore: 20,
      contentQualityScore: 0,
      communityStandingScore: 0,
      activityScore: 0,
      penaltyPoints: 0,
      lastCalculated: new Date(),
      history: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// VOICE NOTE SERVICE
// ═══════════════════════════════════════════════════════════════

export class VoiceNoteService {
  private voiceNotes: Map<string, VoiceNote> = new Map();
  private noteCounter = 0;

  async createVoiceNote(params: {
    senderId: number;
    recipientId?: number;
    postId?: string;
    audioUrl: string;
    duration: number;
    waveformData?: number[];
  }): Promise<VoiceNote> {
    if (params.duration > 300) throw new Error("Voice notes cannot exceed 5 minutes");

    const noteId = `voice_${Date.now()}_${++this.noteCounter}`;
    const note: VoiceNote = {
      id: noteId,
      senderId: params.senderId,
      recipientId: params.recipientId,
      postId: params.postId,
      audioUrl: params.audioUrl,
      duration: params.duration,
      waveformData: params.waveformData || this.generateWaveform(params.duration),
      isListened: false,
      createdAt: new Date(),
    };

    this.voiceNotes.set(noteId, note);
    return note;
  }

  async transcribeVoiceNote(noteId: string): Promise<string> {
    const note = this.voiceNotes.get(noteId);
    if (!note) throw new Error("Voice note not found");
    if (note.transcription) return note.transcription;

    // In production: use Whisper API or AWS Transcribe
    // For now: use LLM to generate a placeholder transcription
    try {
      const response = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Generate a realistic short voice note transcription for a ${note.duration}-second audio message in a social media context. Keep it natural and conversational. Just return the transcription text, nothing else.`,
        }],
        maxTokens: 200,
      });
      note.transcription = response.choices[0]?.message?.content as string;
    } catch {
      note.transcription = "[Transcription unavailable]";
    }

    return note.transcription!;
  }

  async markListened(noteId: string, userId: number): Promise<void> {
    const note = this.voiceNotes.get(noteId);
    if (note && note.recipientId === userId) {
      note.isListened = true;
    }
  }

  async getUserVoiceNotes(userId: number): Promise<VoiceNote[]> {
    return Array.from(this.voiceNotes.values())
      .filter(n => n.recipientId === userId || n.senderId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteVoiceNote(noteId: string, userId: number): Promise<boolean> {
    const note = this.voiceNotes.get(noteId);
    if (!note || note.senderId !== userId) return false;
    this.voiceNotes.delete(noteId);
    return true;
  }

  private generateWaveform(duration: number): number[] {
    const samples = Math.min(100, Math.floor(duration * 10));
    return Array.from({ length: samples }, () => (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.8 + 0.1);
  }
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL SEARCH SERVICE
// ═══════════════════════════════════════════════════════════════

export class SocialSearchService {
  async search(query: string, params: {
    types?: SearchResult["type"][];
    limit?: number;
    userId?: number;
  } = {}): Promise<SearchResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: SearchResult[] = [];
    const limit = params.limit || 20;
    const types = params.types || ["post", "user", "community", "hashtag", "reel"];

    // Hashtag search
    if (types.includes("hashtag") && q.startsWith("#")) {
      results.push({
        type: "hashtag",
        id: q.replace(/^#/, ""),
        relevanceScore: 1.0,
        snippet: `Posts tagged with ${q}`,
        highlightedFields: { hashtag: q },
      });
    }

    // In production: integrate with Elasticsearch or Typesense for full-text search
    // Return structured results with relevance scoring
    return results.slice(0, limit);
  }

  async autocomplete(query: string, limit = 5): Promise<{ type: string; value: string; displayText: string }[]> {
    const q = query.toLowerCase();
    const suggestions: { type: string; value: string; displayText: string }[] = [];

    if (q.startsWith("#")) {
      suggestions.push({ type: "hashtag", value: q, displayText: q });
    } else if (q.startsWith("@")) {
      suggestions.push({ type: "user", value: q, displayText: q });
    }

    return suggestions.slice(0, limit);
  }
}

// ═══════════════════════════════════════════════════════════════
// CONTENT RECOMMENDATION SERVICE
// ═══════════════════════════════════════════════════════════════

export class ContentRecommendationService {
  async getRecommendations(userId: number, params: {
    type: "posts" | "creators" | "communities" | "reels";
    limit?: number;
    excludeIds?: string[];
  }): Promise<{ id: string; score: number; reason: string }[]> {
    // In production: ML model trained on user behavior
    // Collaborative filtering + content-based filtering hybrid
    return [];
  }

  async getSimilarContent(contentId: string, contentType: "post" | "reel" | "community"): Promise<{ id: string; similarity: number }[]> {
    // In production: embedding-based similarity search
    return [];
  }

  async getPersonalizedHashtags(userId: number, limit = 10): Promise<string[]> {
    // Based on user interaction history
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORTS
// ═══════════════════════════════════════════════════════════════

export const trendEngine = new TrendEngineService();
export const aiFeedRanking = new AIFeedRankingService();
export const reelsEngine = new ReelsEngineService();
export const quotePostService = new QuotePostService();
export const friendGraph = new FriendGraphService();
export const reputationEngine = new ReputationEngineService();
export const voiceNoteService = new VoiceNoteService();
export const socialSearch = new SocialSearchService();
export const contentRecommendation = new ContentRecommendationService();


// ─── ROUTER COMPATIBILITY FACADE ─────────────────────────────────────────────
export const socialCore = {
  getTrendingTopics(limit = 20, category?: string) {
    return trendEngine.getTrending({ limit, category: category as any });
  },
  discoverCreators(limit = 20, _category?: string) {
    return friendGraph.getSuggestions(0, limit);
  },
  getReputationScore(userId: number) {
    return reputationEngine.getReputation(userId);
  },
  updateReputation(userId: number, _action: string, value: number) {
    return reputationEngine.updateScore(userId, value, _action);
  },
  createReel(params: { creatorId: number; videoUrl: string; thumbnailUrl?: string; caption?: string; audioTrack?: string; duration: number; hashtags?: string[] }) {
    return reelsEngine.createReel({ creatorId: params.creatorId, videoUrl: params.videoUrl, hlsUrl: params.videoUrl, thumbnailUrl: params.thumbnailUrl || "", duration: params.duration, caption: params.caption || "", hashtags: params.hashtags, audioTrack: params.audioTrack ? { name: params.audioTrack, artist: "unknown", url: params.audioTrack } : undefined });
  },
  getReelsFeed(limit = 20, _cursor?: number) {
    return reelsEngine.getTrendingReels(limit);
  },
  getFriendSuggestions(userId: number, limit = 10) {
    return friendGraph.getSuggestions(userId, limit);
  },
  sendVoiceNote(senderId: number, recipientId: number, audioUrl: string, duration: number) {
    return voiceNoteService.createVoiceNote({ senderId, recipientId, audioUrl, duration, waveformData: [] });
  },
  recordEngagement(userId: number, contentId: string, contentType: string, action: string, _durationSeconds?: number) {
    return aiFeedRanking.recordInteraction(userId, contentId, action as any, [contentType]);
  },
};

// ─── Seed demo reels on startup ──────────────────────────────────────────────
const DEMO_REELS = [
  { creatorId: 1, caption: "🚀 SKY444 just hit a new ATH! The future of Web3 social is HERE. #SKY444 #Crypto #Web3", hashtags: ["SKY444","Crypto","Web3"], duration: 30, viewCount: 48200, likeCount: 3100 },
  { creatorId: 1, caption: "How I made 10x on my crypto portfolio using on-chain signals 📈 #DeFi #Trading", hashtags: ["DeFi","Trading","Crypto"], duration: 45, viewCount: 32100, likeCount: 2400 },
  { creatorId: 1, caption: "Building the future of AI + Web3 in real time. Watch this space 👀 #AI #Web3 #Build", hashtags: ["AI","Web3","Build"], duration: 28, viewCount: 27800, likeCount: 1900 },
  { creatorId: 1, caption: "The SKYCOIN4444 staking rewards are insane right now. Here's how to get in 💎 #Staking #Passive", hashtags: ["Staking","Passive","SKY444"], duration: 60, viewCount: 21400, likeCount: 1600 },
  { creatorId: 1, caption: "ShadowChat just dropped the most fire update. DMs, Stories, Reels — all in one 🔥 #ShadowChat", hashtags: ["ShadowChat","Social","Web3"], duration: 35, viewCount: 18900, likeCount: 1200 },
  { creatorId: 1, caption: "Plinko + crypto = the most addictive thing I've ever played 🎰 #Gaming #Arcade #SKY444", hashtags: ["Gaming","Arcade","SKY444"], duration: 22, viewCount: 15600, likeCount: 980 },
  { creatorId: 1, caption: "My Hope AI just predicted my emotional state PERFECTLY. This is wild 🤯 #HopeAI #AI #Mental", hashtags: ["HopeAI","AI","Mental"], duration: 40, viewCount: 12300, likeCount: 870 },
  { creatorId: 1, caption: "Charity on-chain: we raised $50K for clean water in 48 hours 💚 #Charity #Web3 #Impact", hashtags: ["Charity","Web3","Impact"], duration: 55, viewCount: 9800, likeCount: 720 },
];

const GRADIENT_THUMBS = [
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=700&fit=crop",
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=700&fit=crop",
  "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&h=700&fit=crop",
  "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=700&fit=crop",
  "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=700&fit=crop",
  "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400&h=700&fit=crop",
  "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=700&fit=crop",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=700&fit=crop",
];

(async () => {
  for (let i = 0; i < DEMO_REELS.length; i++) {
    const d = DEMO_REELS[i];
    const reel = await reelsEngine.createReel({
      creatorId: d.creatorId,
      videoUrl: "",
      hlsUrl: "",
      thumbnailUrl: GRADIENT_THUMBS[i % GRADIENT_THUMBS.length],
      duration: d.duration,
      caption: d.caption,
      hashtags: d.hashtags,
    });
    // Manually inflate engagement for demo
    for (let v = 0; v < Math.min(d.viewCount, 100); v++) (reel as any).viewCount = d.viewCount;
    for (let l = 0; l < Math.min(d.likeCount, 100); l++) (reel as any).likeCount = d.likeCount;
  }
})().catch(() => {});
