import crypto from 'crypto';
/**
 * INTELLIGENCE ENGINES
 *
 * The two systems that maximize retention and monetization.
 *
 * Systems:
 * - RecommendationEngine: Collaborative filtering, content-based, hybrid recommendations
 * - PersonalizationEngine: User preference modeling, interest graph, behavioral adaptation
 * - EconomicIntelligenceEngine: Revenue optimization, pricing intelligence, monetization analytics
 * - MarketIntelligenceEngine: Token price prediction, whale tracking, market sentiment
 * - RetentionIntelligenceEngine: Churn prediction, re-engagement triggers, lifecycle management
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface UserInterestProfile {
  userId: number;
  interests: Record<string, number>; // topic -> affinity score (0-1)
  contentPreferences: {
    formats: Record<string, number>; // video, image, text, stream -> preference
    lengths: Record<string, number>; // short, medium, long -> preference
    topics: Record<string, number>;
  };
  socialGraph: {
    followedCreators: number[];
    engagedCommunities: string[];
    interactedUsers: number[];
  };
  behaviorSignals: {
    avgSessionLength: number;
    peakActivityHours: number[];
    deviceType: "mobile" | "desktop" | "tablet";
    notificationResponseRate: number;
  };
  lastUpdatedAt: Date;
}

export interface ContentRecommendation {
  contentId: string;
  contentType: "post" | "reel" | "stream" | "community" | "creator" | "nft" | "product";
  score: number; // 0-1
  reason: string;
  algorithm: "collaborative" | "content_based" | "trending" | "social" | "hybrid";
  metadata?: Record<string, unknown>;
}

export interface CreatorRecommendation {
  creatorId: number;
  score: number;
  reason: string;
  sharedInterests: string[];
  mutualFollowers: number;
  contentMatch: number;
}

export interface FeedRankingSignal {
  contentId: string;
  userId: number;
  signals: {
    recency: number;
    engagement: number;
    creatorAffinity: number;
    topicMatch: number;
    viralityScore: number;
    qualityScore: number;
    diversityBoost: number;
  };
  finalScore: number;
  computedAt: Date;
}

export interface RevenueOpportunity {
  type: "subscription_upsell" | "premium_content" | "nft_purchase" | "token_purchase" | "service_purchase" | "donation" | "tip";
  userId: number;
  targetId: string;
  estimatedRevenue: number;
  confidence: number;
  triggerContext: string;
  expiresAt: Date;
}

export interface PricingRecommendation {
  creatorId: number;
  contentType: string;
  currentPrice?: number;
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  reasoning: string;
  expectedConversionRate: number;
  expectedRevenue: number;
}

export interface ChurnRisk {
  userId: number;
  riskScore: number; // 0-1
  riskLevel: "low" | "medium" | "high" | "critical";
  signals: { signal: string; weight: number; value: number }[];
  predictedChurnDate?: Date;
  recommendedActions: string[];
  lastActiveAt: Date;
}

export interface ReEngagementTrigger {
  userId: number;
  triggerType: "missed_content" | "friend_activity" | "trending_topic" | "price_drop" | "event_reminder" | "achievement_close" | "streak_risk";
  message: string;
  contentId?: string;
  urgency: "low" | "medium" | "high";
  scheduledAt: Date;
  sent: boolean;
}

export interface MarketSentiment {
  tokenSymbol: string;
  sentiment: "very_bearish" | "bearish" | "neutral" | "bullish" | "very_bullish";
  score: number; // -1 to 1
  signals: { source: string; signal: string; weight: number }[];
  predictedPriceChange: number; // percentage
  confidence: number;
  computedAt: Date;
}

// ─── RECOMMENDATION ENGINE ────────────────────────────────────────────────────

export class RecommendationEngine {
  private userProfiles = new Map<number, UserInterestProfile>();
  private contentVectors = new Map<string, Record<string, number>>(); // contentId -> topic vectors
  private userItemMatrix = new Map<number, Map<string, number>>(); // userId -> contentId -> engagement score
  private feedCache = new Map<string, { recommendations: ContentRecommendation[]; cachedAt: Date }>();

  async updateUserProfile(userId: number, event: {
    type: "view" | "like" | "share" | "comment" | "follow" | "purchase" | "skip";
    contentId: string;
    contentType: string;
    topics: string[];
    duration?: number;
  }): Promise<void> {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        interests: {},
        contentPreferences: { formats: {}, lengths: {}, topics: {} },
        socialGraph: { followedCreators: [], engagedCommunities: [], interactedUsers: [] },
        behaviorSignals: { avgSessionLength: 0, peakActivityHours: [], deviceType: "desktop", notificationResponseRate: 0 },
        lastUpdatedAt: new Date(),
      };
    }

    // Event weights
    const weights: Record<string, number> = {
      view: 0.1, like: 0.3, share: 0.5, comment: 0.4, follow: 0.8, purchase: 1.0, skip: -0.2
    };

    const weight = weights[event.type] || 0;

    // Update topic interests
    for (const topic of event.topics) {
      profile.interests[topic] = Math.max(-1, Math.min(1,
        (profile.interests[topic] || 0) * 0.9 + weight * 0.1
      ));
    }

    // Update content format preferences
    profile.contentPreferences.formats[event.contentType] =
      (profile.contentPreferences.formats[event.contentType] || 0) * 0.9 + weight * 0.1;

    // Update user-item matrix
    let userMatrix = this.userItemMatrix.get(userId);
    if (!userMatrix) {
      userMatrix = new Map();
      this.userItemMatrix.set(userId, userMatrix);
    }
    const existing = userMatrix.get(event.contentId) || 0;
    userMatrix.set(event.contentId, Math.max(0, Math.min(1, existing + weight * 0.1)));

    profile.lastUpdatedAt = new Date();
    this.userProfiles.set(userId, profile);

    // Invalidate feed cache
    this.feedCache.delete(`feed_${userId}`);
  }

  async getPersonalizedFeed(userId: number, limit = 20, offset = 0): Promise<ContentRecommendation[]> {
    const cacheKey = `feed_${userId}_${offset}`;
    const cached = this.feedCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt.getTime() < 60000) {
      return cached.recommendations;
    }

    const profile = this.userProfiles.get(userId);
    const recommendations: ContentRecommendation[] = [];

    // Content-based filtering from interest profile
    if (profile) {
      const topInterests = Object.entries(profile.interests)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic);

      for (const [contentId, vector] of this.contentVectors) {
        let score = 0;
        for (const interest of topInterests) {
          score += (vector[interest] || 0) * (profile.interests[interest] || 0);
        }

        if (score > 0.1) {
          recommendations.push({
            contentId,
            contentType: "post",
            score: Math.min(1, score),
            reason: `Matches your interest in ${topInterests[0]}`,
            algorithm: "content_based",
          });
        }
      }
    }

    // Sort by score and paginate
    const sorted = recommendations.sort((a, b) => b.score - a.score).slice(offset, offset + limit);

    this.feedCache.set(cacheKey, { recommendations: sorted, cachedAt: new Date() });
    return sorted;
  }

  async getSimilarCreators(creatorId: number, userId: number, limit = 10): Promise<CreatorRecommendation[]> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return [];

    // Find creators with similar content vectors
    const recommendations: CreatorRecommendation[] = [];
    const userInterests = Object.keys(userProfile.interests);

    // Simulate finding similar creators (in production: query creator profiles)
    for (let i = 0; i < Math.min(limit, 5); i++) {
      const sharedInterests = userInterests.slice(0, Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 3) + 1);
      recommendations.push({
        creatorId: creatorId + i + 1,
        score: 0.5 + (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.5,
        reason: `Creates content about ${sharedInterests.join(", ")}`,
        sharedInterests,
        mutualFollowers: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100),
        contentMatch: 0.5 + (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.5,
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  async rankFeedItems(userId: number, contentIds: string[], signals: Record<string, Record<string, number>>): Promise<FeedRankingSignal[]> {
    const profile = this.userProfiles.get(userId);
    const ranked: FeedRankingSignal[] = [];

    for (const contentId of contentIds) {
      const s = signals[contentId] || {};
      const topicMatch = profile
        ? Object.entries(profile.interests)
            .reduce((sum, [topic, affinity]) => sum + (s[`topic_${topic}`] || 0) * affinity, 0)
        : 0;

      const finalScore =
        (s.recency || 0) * 0.15 +
        (s.engagement || 0) * 0.25 +
        (s.creatorAffinity || 0) * 0.20 +
        topicMatch * 0.20 +
        (s.viralityScore || 0) * 0.10 +
        (s.qualityScore || 0) * 0.05 +
        (s.diversityBoost || 0) * 0.05;

      ranked.push({
        contentId,
        userId,
        signals: {
          recency: s.recency || 0,
          engagement: s.engagement || 0,
          creatorAffinity: s.creatorAffinity || 0,
          topicMatch,
          viralityScore: s.viralityScore || 0,
          qualityScore: s.qualityScore || 0,
          diversityBoost: s.diversityBoost || 0,
        },
        finalScore,
        computedAt: new Date(),
      });
    }

    return ranked.sort((a, b) => b.finalScore - a.finalScore);
  }

  getUserProfile(userId: number): UserInterestProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  indexContent(contentId: string, topicVector: Record<string, number>): void {
    this.contentVectors.set(contentId, topicVector);
  }
}

// ─── ECONOMIC INTELLIGENCE ENGINE ────────────────────────────────────────────

export class EconomicIntelligenceEngine {
  private revenueOpportunities = new Map<string, RevenueOpportunity[]>(); // userId -> opportunities
  private pricingHistory = new Map<string, number[]>(); // creatorId:contentType -> price history
  private conversionRates = new Map<string, number>(); // contentType -> conversion rate

  async identifyRevenueOpportunities(userId: number, context: {
    recentActivity: string[];
    walletBalance: number;
    subscriptions: string[];
    purchaseHistory: string[];
    engagementScore: number;
  }): Promise<RevenueOpportunity[]> {
    const opportunities: RevenueOpportunity[] = [];
    const now = new Date();

    // Subscription upsell opportunity
    if (context.engagementScore > 0.7 && context.subscriptions.length === 0) {
      opportunities.push({
        type: "subscription_upsell",
        userId,
        targetId: "premium_subscription",
        estimatedRevenue: 9.99,
        confidence: 0.75,
        triggerContext: "High engagement user without subscription",
        expiresAt: new Date(now.getTime() + 7 * 86400000),
      });
    }

    // Token purchase opportunity
    if (context.walletBalance < 10 && context.recentActivity.includes("nft_view")) {
      opportunities.push({
        type: "token_purchase",
        userId,
        targetId: "skycoin_bundle",
        estimatedRevenue: 25,
        confidence: 0.60,
        triggerContext: "Low balance user viewing NFTs",
        expiresAt: new Date(now.getTime() + 3 * 86400000),
      });
    }

    // Tip opportunity
    if (context.recentActivity.includes("stream_watch") && context.walletBalance > 50) {
      opportunities.push({
        type: "tip",
        userId,
        targetId: "active_stream",
        estimatedRevenue: 5,
        confidence: 0.45,
        triggerContext: "Active stream viewer with sufficient balance",
        expiresAt: new Date(now.getTime() + 1 * 86400000),
      });
    }

    this.revenueOpportunities.set(`${userId}`, opportunities);
    return opportunities;
  }

  async getPricingRecommendation(creatorId: number, contentType: string, audienceSize: number, engagementRate: number): Promise<PricingRecommendation> {
    const key = `${creatorId}:${contentType}`;
    const history = this.pricingHistory.get(key) || [];

    // Base pricing model
    let basePrice = 0;
    switch (contentType) {
      case "subscription_monthly": basePrice = Math.max(4.99, Math.min(29.99, audienceSize * 0.001)); break;
      case "premium_post": basePrice = Math.max(0.99, Math.min(9.99, audienceSize * 0.0001)); break;
      case "live_stream_ticket": basePrice = Math.max(2.99, Math.min(49.99, audienceSize * 0.005)); break;
      case "nft": basePrice = Math.max(10, Math.min(1000, audienceSize * 0.01)); break;
      default: basePrice = 4.99;
    }

    // Engagement rate multiplier
    const engagementMultiplier = 1 + (engagementRate - 0.03) * 10;
    const recommendedPrice = Math.round(basePrice * Math.max(0.5, Math.min(2, engagementMultiplier)) * 100) / 100;

    const conversionRate = this.conversionRates.get(contentType) || 0.05;
    const expectedRevenue = recommendedPrice * audienceSize * conversionRate;

    return {
      creatorId,
      contentType,
      currentPrice: history[history.length - 1],
      recommendedPrice,
      priceRange: { min: recommendedPrice * 0.7, max: recommendedPrice * 1.5 },
      reasoning: `Based on ${audienceSize} audience size and ${(engagementRate * 100).toFixed(1)}% engagement rate`,
      expectedConversionRate: conversionRate,
      expectedRevenue,
    };
  }

  async getRevenueBreakdown(creatorId: number): Promise<{
    subscriptions: number;
    tips: number;
    premiumContent: number;
    nftRoyalties: number;
    affiliates: number;
    total: number;
    monthOverMonthGrowth: number;
  }> {
    // In production: query actual revenue records
    const subscriptions = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 500) + 100;
    const tips = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 200) + 50;
    const premiumContent = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 300) + 75;
    const nftRoyalties = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 150) + 25;
    const affiliates = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100) + 10;
    const total = subscriptions + tips + premiumContent + nftRoyalties + affiliates;

    return {
      subscriptions,
      tips,
      premiumContent,
      nftRoyalties,
      affiliates,
      total,
      monthOverMonthGrowth: ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.3 - 0.05),
    };
  }

  getOpportunities(userId: number): RevenueOpportunity[] {
    return (this.revenueOpportunities.get(`${userId}`) || [])
      .filter(o => o.expiresAt > new Date())
      .sort((a, b) => b.estimatedRevenue * b.confidence - a.estimatedRevenue * a.confidence);
  }
}

// ─── RETENTION INTELLIGENCE ENGINE ───────────────────────────────────────────

export class RetentionIntelligenceEngine {
  private churnRisks = new Map<number, ChurnRisk>();
  private triggers = new Map<number, ReEngagementTrigger[]>();
  private triggerCounter = 0;

  async assessChurnRisk(userId: number, signals: {
    daysSinceLastLogin: number;
    weeklySessionCount: number;
    engagementTrend: number; // -1 to 1
    subscriptionStatus: "active" | "cancelled" | "none";
    notificationOptOut: boolean;
    supportTickets: number;
    streakBroken: boolean;
  }): Promise<ChurnRisk> {
    const riskSignals: ChurnRisk["signals"] = [];
    let riskScore = 0;

    // Days since last login
    if (signals.daysSinceLastLogin > 30) { riskScore += 0.4; riskSignals.push({ signal: "Long inactivity", weight: 0.4, value: signals.daysSinceLastLogin }); }
    else if (signals.daysSinceLastLogin > 14) { riskScore += 0.2; riskSignals.push({ signal: "Moderate inactivity", weight: 0.2, value: signals.daysSinceLastLogin }); }
    else if (signals.daysSinceLastLogin > 7) { riskScore += 0.1; riskSignals.push({ signal: "Slight inactivity", weight: 0.1, value: signals.daysSinceLastLogin }); }

    // Session count
    if (signals.weeklySessionCount < 1) { riskScore += 0.2; riskSignals.push({ signal: "No weekly sessions", weight: 0.2, value: signals.weeklySessionCount }); }
    else if (signals.weeklySessionCount < 3) { riskScore += 0.1; riskSignals.push({ signal: "Low session count", weight: 0.1, value: signals.weeklySessionCount }); }

    // Engagement trend
    if (signals.engagementTrend < -0.5) { riskScore += 0.2; riskSignals.push({ signal: "Declining engagement", weight: 0.2, value: signals.engagementTrend }); }

    // Subscription cancelled
    if (signals.subscriptionStatus === "cancelled") { riskScore += 0.15; riskSignals.push({ signal: "Cancelled subscription", weight: 0.15, value: 1 }); }

    // Notification opt-out
    if (signals.notificationOptOut) { riskScore += 0.05; riskSignals.push({ signal: "Notifications disabled", weight: 0.05, value: 1 }); }

    // Streak broken
    if (signals.streakBroken) { riskScore += 0.05; riskSignals.push({ signal: "Streak broken", weight: 0.05, value: 1 }); }

    riskScore = Math.min(1, riskScore);
    const riskLevel: ChurnRisk["riskLevel"] = riskScore >= 0.8 ? "critical" : riskScore >= 0.6 ? "high" : riskScore >= 0.3 ? "medium" : "low";

    const recommendedActions: string[] = [];
    if (riskScore > 0.6) recommendedActions.push("Send personalized re-engagement email");
    if (riskScore > 0.4) recommendedActions.push("Show trending content notification");
    if (signals.streakBroken) recommendedActions.push("Offer streak restore reward");
    if (signals.subscriptionStatus === "cancelled") recommendedActions.push("Offer discount to resubscribe");

    const risk: ChurnRisk = {
      userId,
      riskScore,
      riskLevel,
      signals: riskSignals,
      predictedChurnDate: riskScore > 0.7
        ? new Date(Date.now() + (1 - riskScore) * 30 * 86400000)
        : undefined,
      recommendedActions,
      lastActiveAt: new Date(Date.now() - signals.daysSinceLastLogin * 86400000),
    };

    this.churnRisks.set(userId, risk);
    return risk;
  }

  async createReEngagementTrigger(params: Omit<ReEngagementTrigger, "sent">): Promise<ReEngagementTrigger> {
    const trigger: ReEngagementTrigger = { ...params, sent: false };
    const userTriggers = this.triggers.get(params.userId) || [];
    userTriggers.push(trigger);
    this.triggers.set(params.userId, userTriggers);
    return trigger;
  }

  async markTriggerSent(userId: number, triggerType: string): Promise<void> {
    const userTriggers = this.triggers.get(userId) || [];
    const trigger = userTriggers.find(t => t.triggerType === triggerType && !t.sent);
    if (trigger) trigger.sent = true;
  }

  getHighRiskUsers(limit = 50): ChurnRisk[] {
    return Array.from(this.churnRisks.values())
      .filter(r => r.riskLevel === "high" || r.riskLevel === "critical")
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);
  }

  getPendingTriggers(userId: number): ReEngagementTrigger[] {
    return (this.triggers.get(userId) || [])
      .filter(t => !t.sent && t.scheduledAt <= new Date());
  }

  getRetentionStats(): { totalAtRisk: number; criticalCount: number; highCount: number; avgRiskScore: number } {
    const all = Array.from(this.churnRisks.values());
    const critical = all.filter(r => r.riskLevel === "critical").length;
    const high = all.filter(r => r.riskLevel === "high").length;
    const avgRiskScore = all.length > 0 ? all.reduce((sum, r) => sum + r.riskScore, 0) / all.length : 0;

    return {
      totalAtRisk: critical + high,
      criticalCount: critical,
      highCount: high,
      avgRiskScore,
    };
  }
}

// ─── MARKET INTELLIGENCE ENGINE ───────────────────────────────────────────────

export class MarketIntelligenceEngine {
  private sentiments = new Map<string, MarketSentiment>();
  private priceHistory = new Map<string, { price: number; timestamp: Date }[]>();

  async analyzeSentiment(tokenSymbol: string, dataPoints: {
    socialMentions: number;
    positiveRatio: number;
    tradingVolume: number;
    priceChange24h: number;
    whaleActivity: "buying" | "selling" | "neutral";
    newsScore: number; // -1 to 1
  }): Promise<MarketSentiment> {
    const signals: MarketSentiment["signals"] = [];
    let score = 0;

    // Social sentiment
    const socialScore = (dataPoints.positiveRatio - 0.5) * 2;
    score += socialScore * 0.3;
    signals.push({ source: "social", signal: `${(dataPoints.positiveRatio * 100).toFixed(0)}% positive mentions`, weight: 0.3 });

    // Price momentum
    const priceScore = Math.max(-1, Math.min(1, dataPoints.priceChange24h / 10));
    score += priceScore * 0.25;
    signals.push({ source: "price", signal: `${dataPoints.priceChange24h > 0 ? "+" : ""}${dataPoints.priceChange24h.toFixed(1)}% 24h change`, weight: 0.25 });

    // Whale activity
    const whaleScore = dataPoints.whaleActivity === "buying" ? 0.5 : dataPoints.whaleActivity === "selling" ? -0.5 : 0;
    score += whaleScore * 0.25;
    signals.push({ source: "whale", signal: `Whales are ${dataPoints.whaleActivity}`, weight: 0.25 });

    // News sentiment
    score += dataPoints.newsScore * 0.2;
    signals.push({ source: "news", signal: `News sentiment: ${dataPoints.newsScore > 0 ? "positive" : "negative"}`, weight: 0.2 });

    score = Math.max(-1, Math.min(1, score));

    const sentiment: MarketSentiment["sentiment"] = score >= 0.6 ? "very_bullish"
      : score >= 0.2 ? "bullish"
      : score <= -0.6 ? "very_bearish"
      : score <= -0.2 ? "bearish"
      : "neutral";

    const marketSentiment: MarketSentiment = {
      tokenSymbol,
      sentiment,
      score,
      signals,
      predictedPriceChange: score * 15, // rough prediction
      confidence: 0.4 + Math.abs(score) * 0.3,
      computedAt: new Date(),
    };

    this.sentiments.set(tokenSymbol, marketSentiment);
    return marketSentiment;
  }

  async recordPrice(tokenSymbol: string, price: number): Promise<void> {
    const history = this.priceHistory.get(tokenSymbol) || [];
    history.push({ price, timestamp: new Date() });
    if (history.length > 1000) history.shift();
    this.priceHistory.set(tokenSymbol, history);
  }

  getPriceHistory(tokenSymbol: string, hours = 24): { price: number; timestamp: Date }[] {
    const cutoff = new Date(Date.now() - hours * 3600000);
    return (this.priceHistory.get(tokenSymbol) || [])
      .filter(p => p.timestamp >= cutoff);
  }

  getSentiment(tokenSymbol: string): MarketSentiment | null {
    return this.sentiments.get(tokenSymbol) || null;
  }

  getAllSentiments(): MarketSentiment[] {
    return Array.from(this.sentiments.values())
      .sort((a, b) => b.computedAt.getTime() - a.computedAt.getTime());
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const recommendationEngine = new RecommendationEngine();
export const economicIntelligenceEngine = new EconomicIntelligenceEngine();
export const retentionIntelligenceEngine = new RetentionIntelligenceEngine();
export const marketIntelligenceEngine = new MarketIntelligenceEngine();
