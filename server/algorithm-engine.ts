/**
 * ShadowChat Algorithm Engine
 * Recommendation, Trending, Fraud Detection, A/B Testing
 * Production-grade rule-based + ML-ready architecture
 */

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface UserSignals {
  userId: string;
  sessionDuration: number; // seconds
  scrollDepth: number; // 0-1
  clickRate: number; // clicks per minute
  contentTypes: string[]; // ["video","post","nft","stream"]
  followedCreators: string[];
  likedCategories: string[];
  purchaseHistory: string[];
  stakingAmount: number;
  reputationScore: number;
  lastActiveAt: Date;
  deviceType: "mobile" | "desktop" | "tablet";
  region: string;
}

export interface ContentItem {
  id: string;
  type: "post" | "video" | "reel" | "nft" | "stream" | "article";
  creatorId: string;
  categories: string[];
  tags: string[];
  engagementScore: number; // 0-100
  recencyScore: number; // 0-100
  qualityScore: number; // 0-100
  createdAt: Date;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime?: number; // seconds, for video
}

export interface RecommendationResult {
  items: Array<{ item: ContentItem; score: number; reason: string }>;
  algorithm: string;
  computedAt: Date;
}

export interface TrendingResult {
  items: Array<{
    id: string;
    type: string;
    title: string;
    score: number;
    velocity: number; // rate of score increase per hour
    rank: number;
    category: string;
  }>;
  window: "1h" | "6h" | "24h" | "7d";
  computedAt: Date;
}

export interface FraudSignal {
  userId: string;
  signalType: "bot_activity" | "wash_trading" | "fake_engagement" | "account_takeover" | "payment_fraud" | "spam";
  confidence: number; // 0-1
  evidence: string[];
  action: "allow" | "flag" | "throttle" | "block";
  computedAt: Date;
}

export interface ABVariant {
  variantId: string;
  name: string;
  weight: number; // 0-1, must sum to 1 across variants
  config: Record<string, unknown>;
}

export interface ABTest {
  testId: string;
  name: string;
  description: string;
  variants: ABVariant[];
  startDate: Date;
  endDate?: Date;
  targetAudience: "all" | "new_users" | "power_users" | "creators" | "stakers";
  metric: string; // primary metric to optimize
  status: "draft" | "running" | "paused" | "concluded";
}

// ─────────────────────────────────────────────
// RECOMMENDATION ENGINE
// ─────────────────────────────────────────────

export class RecommendationEngine {
  private readonly WEIGHTS = {
    engagement: 0.30,
    recency: 0.20,
    quality: 0.20,
    personalization: 0.20,
    diversity: 0.10,
  };

  /**
   * Score a content item for a given user
   */
  scoreItem(item: ContentItem, user: UserSignals): number {
    const engagementScore = this.computeEngagementScore(item);
    const recencyScore = this.computeRecencyScore(item.createdAt);
    const qualityScore = item.qualityScore / 100;
    const personalizationScore = this.computePersonalizationScore(item, user);
    const diversityBonus = this.computeDiversityBonus(item, user);

    return (
      engagementScore * this.WEIGHTS.engagement +
      recencyScore * this.WEIGHTS.recency +
      qualityScore * this.WEIGHTS.quality +
      personalizationScore * this.WEIGHTS.personalization +
      diversityBonus * this.WEIGHTS.diversity
    );
  }

  private computeEngagementScore(item: ContentItem): number {
    const totalInteractions = item.likes + item.comments * 2 + item.shares * 3;
    const viewRatio = item.views > 0 ? totalInteractions / item.views : 0;
    // Normalize to 0-1 with diminishing returns
    return Math.min(1, viewRatio * 10);
  }

  private computeRecencyScore(createdAt: Date): number {
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    // Half-life of 24 hours
    return Math.exp(-ageHours / 24);
  }

  private computePersonalizationScore(item: ContentItem, user: UserSignals): number {
    let score = 0;
    let factors = 0;

    // Category match
    const categoryOverlap = item.categories.filter(c => user.likedCategories.includes(c)).length;
    if (item.categories.length > 0) {
      score += categoryOverlap / item.categories.length;
      factors++;
    }

    // Creator follow match
    if (user.followedCreators.includes(item.creatorId)) {
      score += 1;
      factors++;
    }

    // Content type preference
    if (user.contentTypes.includes(item.type)) {
      score += 0.5;
      factors++;
    }

    return factors > 0 ? score / factors : 0.3; // Default 0.3 for cold start
  }

  private computeDiversityBonus(item: ContentItem, user: UserSignals): number {
    // Reward content types the user hasn't seen much
    const isUnexplored = !user.contentTypes.includes(item.type);
    return isUnexplored ? 0.8 : 0.2;
  }

  /**
   * Generate recommendations for a user
   */
  recommend(
    user: UserSignals,
    candidates: ContentItem[],
    limit = 20
  ): RecommendationResult {
    const scored = candidates.map(item => ({
      item,
      score: this.scoreItem(item, user),
      reason: this.explainScore(item, user),
    }));

    // Sort by score descending, apply diversity injection
    const sorted = scored.sort((a, b) => b.score - a.score);
    const diversified = this.applyDiversityInjection(sorted, limit);

    return {
      items: diversified.slice(0, limit),
      algorithm: "hybrid-collaborative-content-v2",
      computedAt: new Date(),
    };
  }

  private explainScore(item: ContentItem, user: UserSignals): string {
    if (user.followedCreators.includes(item.creatorId)) return "From a creator you follow";
    const overlap = item.categories.filter(c => user.likedCategories.includes(c));
    if (overlap.length > 0) return `Based on your interest in ${overlap[0]}`;
    if (item.engagementScore > 80) return "Trending in your region";
    return "Recommended for you";
  }

  private applyDiversityInjection(
    sorted: Array<{ item: ContentItem; score: number; reason: string }>,
    limit: number
  ) {
    const result: typeof sorted = [];
    const seenTypes = new Set<string>();
    const seenCreators = new Set<string>();

    // First pass: take top items with diversity constraint
    for (const entry of sorted) {
      if (result.length >= limit) break;
      const typeCount = [...seenTypes].filter(t => t === entry.item.type).length;
      const creatorCount = [...seenCreators].filter(c => c === entry.item.creatorId).length;
      // Allow max 3 of same type and max 2 from same creator
      if (typeCount < 3 && creatorCount < 2) {
        result.push(entry);
        seenTypes.add(entry.item.type);
        seenCreators.add(entry.item.creatorId);
      }
    }

    // Fill remaining slots without diversity constraint
    if (result.length < limit) {
      for (const entry of sorted) {
        if (result.length >= limit) break;
        if (!result.includes(entry)) result.push(entry);
      }
    }

    return result;
  }
}

// ─────────────────────────────────────────────
// TRENDING ENGINE
// ─────────────────────────────────────────────

export class TrendingEngine {
  /**
   * Compute trending score using Wilson score + velocity
   */
  computeTrendingScore(
    item: ContentItem,
    window: "1h" | "6h" | "24h" | "7d"
  ): number {
    const windowHours = { "1h": 1, "6h": 6, "24h": 24, "7d": 168 }[window];
    const ageHours = (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60);

    if (ageHours > windowHours) return 0;

    const totalVotes = item.likes + item.comments + item.shares;
    const positiveVotes = item.likes + item.shares;

    // Wilson score confidence interval
    const wilsonScore = this.wilsonScore(positiveVotes, totalVotes);

    // Velocity: interactions per hour
    const velocity = ageHours > 0 ? totalVotes / ageHours : totalVotes;

    // Time decay: exponential with window-relative half-life
    const halfLife = windowHours / 4;
    const timeDecay = Math.exp(-ageHours / halfLife);

    // Engagement quality multiplier
    const qualityMultiplier = 1 + (item.qualityScore / 100) * 0.5;

    return wilsonScore * velocity * timeDecay * qualityMultiplier;
  }

  private wilsonScore(positive: number, total: number): number {
    if (total === 0) return 0;
    const z = 1.96; // 95% confidence
    const phat = positive / total;
    const denominator = 1 + (z * z) / total;
    const numerator =
      phat +
      (z * z) / (2 * total) -
      z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total);
    return numerator / denominator;
  }

  /**
   * Compute trending velocity (score increase per hour)
   */
  computeVelocity(currentScore: number, previousScore: number, intervalHours: number): number {
    return intervalHours > 0 ? (currentScore - previousScore) / intervalHours : 0;
  }

  /**
   * Get trending items from a pool
   */
  getTrending(
    items: ContentItem[],
    window: "1h" | "6h" | "24h" | "7d",
    limit = 50
  ): TrendingResult {
    const scored = items
      .map((item, idx) => ({
        id: item.id,
        type: item.type,
        title: `${item.type} by ${item.creatorId}`,
        score: this.computeTrendingScore(item, window),
        velocity: this.computeVelocity(item.engagementScore, item.engagementScore * 0.8, 1),
        rank: 0,
        category: item.categories[0] || "general",
      }))
      .filter(i => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    return {
      items: scored,
      window,
      computedAt: new Date(),
    };
  }
}

// ─────────────────────────────────────────────
// FRAUD DETECTION ENGINE
// ─────────────────────────────────────────────

export class FraudDetectionEngine {
  private readonly THRESHOLDS = {
    botActivity: { clickRate: 60, sessionDuration: 5, engagementRate: 0.95 },
    washTrading: { selfTradeRatio: 0.3, circularTxCount: 3 },
    fakeEngagement: { likeVelocity: 1000, commentVelocity: 200 },
    accountTakeover: { locationChange: true, deviceChange: true, rapidActions: 50 },
    paymentFraud: { chargebackRate: 0.05, velocityChecks: 10 },
    spam: { messageRate: 20, duplicateRatio: 0.8 },
  };

  /**
   * Analyze a user's signals for fraud indicators
   */
  analyze(user: UserSignals, recentActions?: {
    messageCount?: number;
    duplicateMessageRatio?: number;
    transactionCount?: number;
    chargebackCount?: number;
    likeCount?: number;
    commentCount?: number;
  }): FraudSignal {
    const evidence: string[] = [];
    let riskScore = 0;
    let signalType: FraudSignal["signalType"] = "bot_activity";

    // Bot activity detection
    if (user.clickRate > this.THRESHOLDS.botActivity.clickRate) {
      evidence.push(`Abnormal click rate: ${user.clickRate.toFixed(1)}/min (threshold: ${this.THRESHOLDS.botActivity.clickRate})`);
      riskScore += 0.4;
      signalType = "bot_activity";
    }

    if (user.sessionDuration < this.THRESHOLDS.botActivity.sessionDuration && user.clickRate > 10) {
      evidence.push(`Suspiciously short session with high activity: ${user.sessionDuration}s`);
      riskScore += 0.2;
    }

    // Fake engagement detection
    if (recentActions?.likeCount && recentActions.likeCount > this.THRESHOLDS.fakeEngagement.likeVelocity) {
      evidence.push(`Like velocity too high: ${recentActions.likeCount} likes in window`);
      riskScore += 0.35;
      signalType = "fake_engagement";
    }

    // Spam detection
    if (recentActions?.messageCount && recentActions.messageCount > this.THRESHOLDS.spam.messageRate) {
      evidence.push(`High message rate: ${recentActions.messageCount} messages/min`);
      riskScore += 0.3;
      signalType = "spam";
    }

    if (recentActions?.duplicateMessageRatio && recentActions.duplicateMessageRatio > this.THRESHOLDS.spam.duplicateRatio) {
      evidence.push(`High duplicate message ratio: ${(recentActions.duplicateMessageRatio * 100).toFixed(0)}%`);
      riskScore += 0.25;
      signalType = "spam";
    }

    // Payment fraud detection
    if (recentActions?.transactionCount && recentActions.transactionCount > this.THRESHOLDS.paymentFraud.velocityChecks) {
      evidence.push(`High transaction velocity: ${recentActions.transactionCount} transactions`);
      riskScore += 0.4;
      signalType = "payment_fraud";
    }

    if (recentActions?.chargebackCount && recentActions.transactionCount) {
      const chargebackRate = recentActions.chargebackCount / recentActions.transactionCount;
      if (chargebackRate > this.THRESHOLDS.paymentFraud.chargebackRate) {
        evidence.push(`High chargeback rate: ${(chargebackRate * 100).toFixed(1)}%`);
        riskScore += 0.5;
        signalType = "payment_fraud";
      }
    }

    // Reputation modifier
    if (user.reputationScore < 20) {
      riskScore = Math.min(1, riskScore * 1.3);
      evidence.push(`Low reputation score: ${user.reputationScore}`);
    } else if (user.reputationScore > 80) {
      riskScore = Math.max(0, riskScore * 0.7);
    }

    // Determine action
    let action: FraudSignal["action"] = "allow";
    if (riskScore >= 0.8) action = "block";
    else if (riskScore >= 0.5) action = "flag";
    else if (riskScore >= 0.3) action = "throttle";

    return {
      userId: user.userId,
      signalType,
      confidence: Math.min(1, riskScore),
      evidence,
      action,
      computedAt: new Date(),
    };
  }

  /**
   * Batch analyze multiple users
   */
  batchAnalyze(users: UserSignals[]): FraudSignal[] {
    return users.map(u => this.analyze(u));
  }

  /**
   * Check if a transaction looks suspicious
   */
  checkTransaction(params: {
    userId: string;
    amount: number;
    currency: string;
    ipAddress: string;
    previousIpAddresses: string[];
    transactionCount24h: number;
    accountAgeHours: number;
  }): { suspicious: boolean; reasons: string[]; riskLevel: "low" | "medium" | "high" } {
    const reasons: string[] = [];
    let riskPoints = 0;

    if (params.amount > 10000) {
      reasons.push(`High-value transaction: $${params.amount}`);
      riskPoints += 2;
    }

    if (!params.previousIpAddresses.includes(params.ipAddress)) {
      reasons.push("New IP address not seen before");
      riskPoints += 1;
    }

    if (params.transactionCount24h > 20) {
      reasons.push(`High transaction velocity: ${params.transactionCount24h} in 24h`);
      riskPoints += 2;
    }

    if (params.accountAgeHours < 24) {
      reasons.push(`New account: ${params.accountAgeHours}h old`);
      riskPoints += 2;
    }

    const riskLevel = riskPoints >= 4 ? "high" : riskPoints >= 2 ? "medium" : "low";
    return { suspicious: riskPoints >= 3, reasons, riskLevel };
  }
}

// ─────────────────────────────────────────────
// A/B TESTING ENGINE
// ─────────────────────────────────────────────

export class ABTestingEngine {
  private tests: Map<string, ABTest> = new Map();
  private assignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId

  /**
   * Register a new A/B test
   */
  registerTest(test: ABTest): void {
    // Validate weights sum to 1
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.001) {
      throw new Error(`A/B test ${test.testId} variant weights must sum to 1, got ${totalWeight}`);
    }
    this.tests.set(test.testId, test);
  }

  /**
   * Assign a user to a variant (deterministic via hash)
   */
  assignVariant(userId: string, testId: string): ABVariant | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== "running") return null;

    // Check if user is in target audience
    // (simplified — in production, check user attributes)

    // Check existing assignment
    if (!this.assignments.has(userId)) {
      this.assignments.set(userId, new Map());
    }
    const userAssignments = this.assignments.get(userId)!;
    if (userAssignments.has(testId)) {
      const variantId = userAssignments.get(testId)!;
      return test.variants.find(v => v.variantId === variantId) || null;
    }

    // Deterministic hash assignment
    const hash = this.hashUserId(userId + testId);
    const normalizedHash = hash / 0xffffffff;

    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (normalizedHash <= cumulative) {
        userAssignments.set(testId, variant.variantId);
        return variant;
      }
    }

    // Fallback to last variant
    const lastVariant = test.variants[test.variants.length - 1];
    userAssignments.set(testId, lastVariant.variantId);
    return lastVariant;
  }

  private hashUserId(str: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash;
  }

  /**
   * Get all running tests
   */
  getRunningTests(): ABTest[] {
    return [...this.tests.values()].filter(t => t.status === "running");
  }

  /**
   * Get variant config for a user across all running tests
   */
  getUserConfig(userId: string): Record<string, Record<string, unknown>> {
    const config: Record<string, Record<string, unknown>> = {};
    for (const test of this.getRunningTests()) {
      const variant = this.assignVariant(userId, test.testId);
      if (variant) {
        config[test.testId] = {
          variantId: variant.variantId,
          variantName: variant.name,
          ...variant.config,
        };
      }
    }
    return config;
  }

  /**
   * Record a conversion event for a test
   */
  recordConversion(userId: string, testId: string, metric: string, value: number): void {
    // In production: persist to DB and compute statistical significance
      }
}

// ─────────────────────────────────────────────
// FEED RANKING ENGINE
// ─────────────────────────────────────────────

export class FeedRankingEngine {
  private recommendation = new RecommendationEngine();
  private trending = new TrendingEngine();

  /**
   * Rank a feed for a user — blends personalized + trending + fresh content
   */
  rankFeed(
    user: UserSignals,
    candidates: ContentItem[],
    options: {
      personalizedWeight?: number;
      trendingWeight?: number;
      freshWeight?: number;
      limit?: number;
    } = {}
  ): ContentItem[] {
    const {
      personalizedWeight = 0.5,
      trendingWeight = 0.3,
      freshWeight = 0.2,
      limit = 50,
    } = options;

    const personalizedScores = new Map<string, number>();
    const trendingScores = new Map<string, number>();
    const freshScores = new Map<string, number>();

    // Personalized scores
    const recs = this.recommendation.recommend(user, candidates, candidates.length);
    for (const rec of recs.items) {
      personalizedScores.set(rec.item.id, rec.score);
    }

    // Trending scores
    const trending = this.trending.getTrending(candidates, "24h", candidates.length);
    const maxTrending = Math.max(...trending.items.map(i => i.score), 1);
    for (const item of trending.items) {
      trendingScores.set(item.id, item.score / maxTrending);
    }

    // Fresh scores (recency)
    for (const item of candidates) {
      const ageHours = (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60);
      freshScores.set(item.id, Math.exp(-ageHours / 12)); // 12h half-life
    }

    // Blend scores
    const blended = candidates.map(item => {
      const p = personalizedScores.get(item.id) || 0;
      const t = trendingScores.get(item.id) || 0;
      const f = freshScores.get(item.id) || 0;
      const score = p * personalizedWeight + t * trendingWeight + f * freshWeight;
      return { item, score };
    });

    return blended
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(e => e.item);
  }
}

// ─────────────────────────────────────────────
// SINGLETON EXPORTS
// ─────────────────────────────────────────────

export const recommendationEngine = new RecommendationEngine();
export const trendingEngine = new TrendingEngine();
export const fraudDetectionEngine = new FraudDetectionEngine();
export const abTestingEngine = new ABTestingEngine();
export const feedRankingEngine = new FeedRankingEngine();

// Register default A/B tests
abTestingEngine.registerTest({
  testId: "feed_algo_v2",
  name: "Feed Algorithm V2 Test",
  description: "Test personalized vs trending-heavy feed ranking",
  variants: [
    { variantId: "control", name: "Control (50/30/20)", weight: 0.5, config: { personalizedWeight: 0.5, trendingWeight: 0.3, freshWeight: 0.2 } },
    { variantId: "trending_heavy", name: "Trending Heavy (30/50/20)", weight: 0.25, config: { personalizedWeight: 0.3, trendingWeight: 0.5, freshWeight: 0.2 } },
    { variantId: "personalized_heavy", name: "Personalized Heavy (70/20/10)", weight: 0.25, config: { personalizedWeight: 0.7, trendingWeight: 0.2, freshWeight: 0.1 } },
  ],
  startDate: new Date("2026-01-01"),
  targetAudience: "all",
  metric: "session_duration",
  status: "running",
});

abTestingEngine.registerTest({
  testId: "onboarding_flow_v3",
  name: "Onboarding Flow V3",
  description: "Test different onboarding sequences for new users",
  variants: [
    { variantId: "standard", name: "Standard Flow", weight: 0.5, config: { steps: ["profile", "interests", "wallet", "follow"] } },
    { variantId: "crypto_first", name: "Crypto First", weight: 0.25, config: { steps: ["wallet", "staking", "profile", "follow"] } },
    { variantId: "social_first", name: "Social First", weight: 0.25, config: { steps: ["follow", "interests", "profile", "wallet"] } },
  ],
  startDate: new Date("2026-01-01"),
  targetAudience: "new_users",
  metric: "day7_retention",
  status: "running",
});

abTestingEngine.registerTest({
  testId: "tip_cta_placement",
  name: "Tip CTA Placement Test",
  description: "Test different positions for tip button on creator posts",
  variants: [
    { variantId: "bottom_right", name: "Bottom Right", weight: 0.34, config: { position: "bottom-right" } },
    { variantId: "inline", name: "Inline with Likes", weight: 0.33, config: { position: "inline" } },
    { variantId: "floating", name: "Floating Button", weight: 0.33, config: { position: "floating" } },
  ],
  startDate: new Date("2026-01-01"),
  targetAudience: "all",
  metric: "tip_conversion_rate",
  status: "running",
});
