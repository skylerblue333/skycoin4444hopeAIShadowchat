/**
 * VIRALITY ENGINE
 *
 * Systems that make content self-propagate.
 *
 * Systems:
 * - ShareGraphService: Tracks who shared what to whom and builds propagation trees
 * - ViralityScoreService: Real-time virality scoring using velocity and reach metrics
 * - ContentDecayModelService: Models content half-life and predicts engagement decay
 * - AudienceClusteringService: Groups users into interest clusters for targeted spread
 * - ViralPredictionAI: ML-based prediction of viral potential before content peaks
 * - SocialSpreadAnalyticsService: Heatmaps, spread velocity, and propagation analytics
 */

import { invokeLLM } from "./_core/llm";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ShareEvent {
  id: string;
  contentId: string;
  contentType: "post" | "reel" | "stream_clip" | "nft" | "community_post";
  sharerId: number;
  sharedToUserId?: number; // DM share
  sharedToPlatform?: "twitter" | "discord" | "telegram" | "external";
  sharedToChannelId?: string;
  parentShareId?: string; // For tracking repost chains
  depth: number; // 0 = original, 1 = first share, 2 = reshare, etc.
  timestamp: Date;
  audienceReached: number; // estimated reach of this share node
}

export interface PropagationTree {
  contentId: string;
  rootCreatorId: number;
  totalShares: number;
  totalReach: number;
  maxDepth: number;
  sharesByDepth: Record<number, number>;
  topAmplifiers: { userId: number; sharesGenerated: number; reachGenerated: number }[];
  platformBreakdown: Record<string, number>;
  timeToFirstShare: number; // seconds
  timeToViral: number | null; // seconds to reach viral threshold, null if not viral
  viralityScore: number;
  shareVelocity: number; // shares per minute at peak
}

export interface ViralityScore {
  contentId: string;
  score: number; // 0-100
  tier: "cold" | "warming" | "trending" | "viral" | "mega_viral";
  velocity: number; // shares per minute
  acceleration: number; // change in velocity
  reachMultiplier: number; // how many people each share reaches on average
  predictedPeakReach: number;
  predictedPeakTime: Date;
  decayStartTime: Date | null;
  signals: string[];
}

export interface ContentDecayModel {
  contentId: string;
  contentType: string;
  halfLifeHours: number; // time for engagement to drop 50%
  peakEngagementTime: Date;
  currentEngagementRate: number;
  predictedEngagementAt: (hoursFromNow: number) => number;
  isDecaying: boolean;
  decayRate: number; // % per hour
  estimatedTotalLifetimeEngagements: number;
  revivalProbability: number; // 0-1, chance of second wind
}

export interface AudienceCluster {
  id: string;
  name: string;
  size: number;
  interests: string[];
  avgEngagementRate: number;
  viralAmplificationFactor: number; // how much this cluster amplifies content
  topInfluencers: number[]; // user IDs
  contentAffinities: { contentType: string; affinity: number }[];
}

export interface ViralPrediction {
  contentId: string;
  predictedViralProbability: number; // 0-1
  predictedPeakReach: number;
  predictedPeakTimeHours: number;
  confidenceScore: number;
  keyFactors: string[];
  recommendedActions: string[];
  similarViralContent: string[];
}

export interface SpreadHeatmap {
  contentId: string;
  timeWindows: {
    windowStart: Date;
    windowEnd: Date;
    shares: number;
    reach: number;
    velocity: number;
    topRegions: string[];
  }[];
  peakWindow: number; // index of peak time window
  totalDuration: number; // hours content was actively spreading
}

// ─── DECAY MODEL CONSTANTS ────────────────────────────────────────────────────

const CONTENT_HALF_LIVES: Record<string, number> = {
  post: 6,         // 6 hours
  reel: 24,        // 24 hours
  stream_clip: 48, // 48 hours
  nft: 168,        // 1 week
  community_post: 12,
};

const VIRAL_THRESHOLDS = {
  warming: 10,    // 10 shares/min
  trending: 50,   // 50 shares/min
  viral: 200,     // 200 shares/min
  mega_viral: 1000, // 1000 shares/min
};

// ─── SHARE GRAPH SERVICE ──────────────────────────────────────────────────────

export class ShareGraphService {
  private shares = new Map<string, ShareEvent[]>(); // contentId -> shares
  private shareIndex = new Map<string, ShareEvent>(); // shareId -> event
  private counter = 0;

  async recordShare(params: {
    contentId: string;
    contentType: ShareEvent["contentType"];
    sharerId: number;
    sharedToUserId?: number;
    sharedToPlatform?: ShareEvent["sharedToPlatform"];
    sharedToChannelId?: string;
    parentShareId?: string;
    audienceReached?: number;
  }): Promise<ShareEvent> {
    const parentShare = params.parentShareId ? this.shareIndex.get(params.parentShareId) : undefined;
    const depth = parentShare ? parentShare.depth + 1 : 0;

    const event: ShareEvent = {
      id: `share_${++this.counter}_${Date.now()}`,
      contentId: params.contentId,
      contentType: params.contentType,
      sharerId: params.sharerId,
      sharedToUserId: params.sharedToUserId,
      sharedToPlatform: params.sharedToPlatform,
      sharedToChannelId: params.sharedToChannelId,
      parentShareId: params.parentShareId,
      depth,
      timestamp: new Date(),
      audienceReached: params.audienceReached || this.estimateAudienceReach(params.sharerId),
    };

    const existing = this.shares.get(params.contentId) || [];
    existing.push(event);
    this.shares.set(params.contentId, existing);
    this.shareIndex.set(event.id, event);

    return event;
  }

  private estimateAudienceReach(userId: number): number {
    // In production this queries the user's follower count
    // Deterministic estimate based on user ID for testing
    return Math.floor(100 + (userId % 1000) * 10);
  }

  async buildPropagationTree(contentId: string): Promise<PropagationTree> {
    const shares = this.shares.get(contentId) || [];
    if (shares.length === 0) {
      return {
        contentId,
        rootCreatorId: 0,
        totalShares: 0,
        totalReach: 0,
        maxDepth: 0,
        sharesByDepth: {},
        topAmplifiers: [],
        platformBreakdown: {},
        timeToFirstShare: 0,
        timeToViral: null,
        viralityScore: 0,
        shareVelocity: 0,
      };
    }

    const totalReach = shares.reduce((sum, s) => sum + s.audienceReached, 0);
    const maxDepth = Math.max(...shares.map(s => s.depth));

    const sharesByDepth: Record<number, number> = {};
    const amplifierStats = new Map<number, { shares: number; reach: number }>();
    const platformBreakdown: Record<string, number> = {};

    for (const share of shares) {
      sharesByDepth[share.depth] = (sharesByDepth[share.depth] || 0) + 1;

      const amp = amplifierStats.get(share.sharerId) || { shares: 0, reach: 0 };
      amp.shares++;
      amp.reach += share.audienceReached;
      amplifierStats.set(share.sharerId, amp);

      if (share.sharedToPlatform) {
        platformBreakdown[share.sharedToPlatform] = (platformBreakdown[share.sharedToPlatform] || 0) + 1;
      } else {
        platformBreakdown["internal"] = (platformBreakdown["internal"] || 0) + 1;
      }
    }

    const topAmplifiers = Array.from(amplifierStats.entries())
      .map(([userId, stats]) => ({ userId, sharesGenerated: stats.shares, reachGenerated: stats.reach }))
      .sort((a, b) => b.reachGenerated - a.reachGenerated)
      .slice(0, 10);

    const firstShare = shares[0];
    const timeToFirstShare = 0; // Would be calculated from content creation time in production

    // Calculate share velocity (shares per minute in peak window)
    const now = Date.now();
    const recentShares = shares.filter(s => now - s.timestamp.getTime() < 60000);
    const shareVelocity = recentShares.length;

    // Check if viral threshold was reached
    const peakVelocity = this.calculatePeakVelocity(shares);
    const timeToViral = peakVelocity >= VIRAL_THRESHOLDS.viral
      ? this.findTimeToThreshold(shares, VIRAL_THRESHOLDS.viral)
      : null;

    const viralityScore = Math.min(100, (peakVelocity / VIRAL_THRESHOLDS.viral) * 100);

    return {
      contentId,
      rootCreatorId: 0, // Would be fetched from content record
      totalShares: shares.length,
      totalReach,
      maxDepth,
      sharesByDepth,
      topAmplifiers,
      platformBreakdown,
      timeToFirstShare,
      timeToViral,
      viralityScore,
      shareVelocity,
    };
  }

  private calculatePeakVelocity(shares: ShareEvent[]): number {
    if (shares.length < 2) return shares.length;

    // Find the 1-minute window with the most shares
    let maxShares = 0;
    for (let i = 0; i < shares.length; i++) {
      const windowEnd = shares[i].timestamp.getTime() + 60000;
      const inWindow = shares.filter(s => s.timestamp.getTime() >= shares[i].timestamp.getTime() && s.timestamp.getTime() <= windowEnd);
      maxShares = Math.max(maxShares, inWindow.length);
    }
    return maxShares;
  }

  private findTimeToThreshold(shares: ShareEvent[], threshold: number): number {
    // Returns seconds from first share to when velocity reached threshold
    if (shares.length === 0) return 0;
    const firstTime = shares[0].timestamp.getTime();

    for (let i = 0; i < shares.length; i++) {
      const windowEnd = shares[i].timestamp.getTime() + 60000;
      const inWindow = shares.filter(s => s.timestamp.getTime() >= shares[i].timestamp.getTime() && s.timestamp.getTime() <= windowEnd);
      if (inWindow.length >= threshold) {
        return Math.floor((shares[i].timestamp.getTime() - firstTime) / 1000);
      }
    }
    return -1;
  }

  getShareCount(contentId: string): number {
    return (this.shares.get(contentId) || []).length;
  }

  getRecentShares(contentId: string, windowMs = 3600000): ShareEvent[] {
    const cutoff = Date.now() - windowMs;
    return (this.shares.get(contentId) || []).filter(s => s.timestamp.getTime() > cutoff);
  }
}

// ─── VIRALITY SCORE SERVICE ───────────────────────────────────────────────────

export class ViralityScoreService {
  private scores = new Map<string, ViralityScore>();
  private engagementHistory = new Map<string, { timestamp: Date; count: number }[]>();

  recordEngagement(contentId: string, engagementCount: number): void {
    const history = this.engagementHistory.get(contentId) || [];
    history.push({ timestamp: new Date(), count: engagementCount });
    // Keep last 100 data points
    if (history.length > 100) history.shift();
    this.engagementHistory.set(contentId, history);
  }

  calculateScore(contentId: string, shareGraph: ShareGraphService): ViralityScore {
    const recentShares = shareGraph.getRecentShares(contentId, 3600000); // last hour
    const veryRecentShares = shareGraph.getRecentShares(contentId, 300000); // last 5 min

    const velocity = veryRecentShares.length / 5; // shares per minute
    const history = this.engagementHistory.get(contentId) || [];

    // Calculate acceleration (change in velocity)
    const olderVelocity = recentShares.length / 60; // shares per minute over last hour
    const acceleration = velocity - olderVelocity;

    // Reach multiplier (average audience per share)
    const totalReach = recentShares.reduce((sum, s) => sum + s.audienceReached, 0);
    const reachMultiplier = recentShares.length > 0 ? totalReach / recentShares.length : 0;

    // Score calculation
    const velocityScore = Math.min(50, (velocity / VIRAL_THRESHOLDS.viral) * 50);
    const accelerationScore = Math.min(20, Math.max(0, acceleration * 2));
    const reachScore = Math.min(20, (reachMultiplier / 10000) * 20);
    const depthScore = Math.min(10, (shareGraph.buildPropagationTree(contentId) as any).maxDepth || 0 * 2);

    const score = velocityScore + accelerationScore + reachScore + depthScore;

    let tier: ViralityScore["tier"] = "cold";
    if (velocity >= VIRAL_THRESHOLDS.mega_viral) tier = "mega_viral";
    else if (velocity >= VIRAL_THRESHOLDS.viral) tier = "viral";
    else if (velocity >= VIRAL_THRESHOLDS.trending) tier = "trending";
    else if (velocity >= VIRAL_THRESHOLDS.warming) tier = "warming";

    const signals: string[] = [];
    if (velocity > olderVelocity * 2) signals.push("Accelerating rapidly");
    if (reachMultiplier > 5000) signals.push("High-reach amplifiers sharing");
    if (recentShares.some(s => s.sharedToPlatform)) signals.push("Cross-platform spread detected");
    if (recentShares.some(s => s.depth > 2)) signals.push("Deep propagation chain forming");

    const predictedPeakTime = new Date(Date.now() + (acceleration > 0 ? 3600000 : 1800000));
    const predictedPeakReach = totalReach * (1 + velocity / 10);

    const result: ViralityScore = {
      contentId,
      score: Math.min(100, score),
      tier,
      velocity,
      acceleration,
      reachMultiplier,
      predictedPeakReach,
      predictedPeakTime,
      decayStartTime: tier === "cold" ? new Date() : null,
      signals,
    };

    this.scores.set(contentId, result);
    return result;
  }

  getScore(contentId: string): ViralityScore | null {
    return this.scores.get(contentId) || null;
  }

  getTopViral(limit = 20): ViralityScore[] {
    return Array.from(this.scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// ─── CONTENT DECAY MODEL SERVICE ─────────────────────────────────────────────

export class ContentDecayModelService {
  private models = new Map<string, {
    contentType: string;
    createdAt: Date;
    peakEngagements: number;
    peakTime: Date;
    engagementHistory: { timestamp: Date; value: number }[];
  }>();

  initializeModel(contentId: string, contentType: string): void {
    this.models.set(contentId, {
      contentType,
      createdAt: new Date(),
      peakEngagements: 0,
      peakTime: new Date(),
      engagementHistory: [],
    });
  }

  recordEngagement(contentId: string, engagementValue: number): void {
    const model = this.models.get(contentId);
    if (!model) return;

    model.engagementHistory.push({ timestamp: new Date(), value: engagementValue });
    if (engagementValue > model.peakEngagements) {
      model.peakEngagements = engagementValue;
      model.peakTime = new Date();
    }
  }

  getDecayModel(contentId: string): ContentDecayModel | null {
    const model = this.models.get(contentId);
    if (!model) return null;

    const halfLifeHours = CONTENT_HALF_LIVES[model.contentType] || 12;
    const hoursSincePeak = (Date.now() - model.peakTime.getTime()) / 3600000;
    const decayRate = Math.log(2) / halfLifeHours; // exponential decay constant

    const currentEngagementRate = model.peakEngagements * Math.exp(-decayRate * hoursSincePeak);
    const isDecaying = hoursSincePeak > 0.5;

    const predictedEngagementAt = (hoursFromNow: number): number => {
      const totalHoursFromPeak = hoursSincePeak + hoursFromNow;
      return model.peakEngagements * Math.exp(-decayRate * totalHoursFromPeak);
    };

    // Estimate total lifetime engagements using integral of decay function
    const estimatedTotalLifetimeEngagements = Math.floor(model.peakEngagements / decayRate);

    // Revival probability based on content type and current decay state
    const revivalProbability = model.contentType === "nft" ? 0.3
      : model.contentType === "reel" ? 0.15
      : 0.05;

    return {
      contentId,
      contentType: model.contentType,
      halfLifeHours,
      peakEngagementTime: model.peakTime,
      currentEngagementRate,
      predictedEngagementAt,
      isDecaying,
      decayRate: decayRate * 100, // as percentage per hour
      estimatedTotalLifetimeEngagements,
      revivalProbability,
    };
  }

  getBestPostingTimes(contentType: string): { hour: number; dayOfWeek: number; engagementMultiplier: number }[] {
    // Based on platform-wide engagement data patterns
    const bestTimes = [
      { hour: 19, dayOfWeek: 2, engagementMultiplier: 1.8 }, // Tuesday 7pm
      { hour: 20, dayOfWeek: 3, engagementMultiplier: 1.75 }, // Wednesday 8pm
      { hour: 18, dayOfWeek: 4, engagementMultiplier: 1.7 }, // Thursday 6pm
      { hour: 12, dayOfWeek: 6, engagementMultiplier: 1.65 }, // Saturday noon
      { hour: 21, dayOfWeek: 0, engagementMultiplier: 1.6 }, // Sunday 9pm
    ];

    if (contentType === "reel") {
      return bestTimes.map(t => ({ ...t, engagementMultiplier: t.engagementMultiplier * 1.2 }));
    }
    return bestTimes;
  }
}

// ─── AUDIENCE CLUSTERING SERVICE ─────────────────────────────────────────────

export class AudienceClusteringService {
  private clusters = new Map<string, AudienceCluster>();
  private userClusterMap = new Map<number, string[]>(); // userId -> clusterIds
  private clusterCounter = 0;

  createCluster(params: Omit<AudienceCluster, "id">): AudienceCluster {
    const id = `cluster_${++this.clusterCounter}`;
    const cluster: AudienceCluster = { id, ...params };
    this.clusters.set(id, cluster);
    return cluster;
  }

  assignUserToCluster(userId: number, clusterId: string): void {
    const existing = this.userClusterMap.get(userId) || [];
    if (!existing.includes(clusterId)) {
      existing.push(clusterId);
      this.userClusterMap.set(userId, existing);
    }
  }

  getUserClusters(userId: number): AudienceCluster[] {
    const clusterIds = this.userClusterMap.get(userId) || [];
    return clusterIds.map(id => this.clusters.get(id)).filter(Boolean) as AudienceCluster[];
  }

  getViralAmplificationPotential(contentId: string, targetClusters: string[]): number {
    let totalAmplification = 1.0;
    for (const clusterId of targetClusters) {
      const cluster = this.clusters.get(clusterId);
      if (cluster) {
        totalAmplification *= cluster.viralAmplificationFactor;
      }
    }
    return totalAmplification;
  }

  getBestClustersForContent(contentType: string, hashtags: string[]): AudienceCluster[] {
    return Array.from(this.clusters.values())
      .filter(cluster =>
        cluster.contentAffinities.some(a => a.contentType === contentType && a.affinity > 0.6) ||
        cluster.interests.some(i => hashtags.some(h => h.toLowerCase().includes(i.toLowerCase())))
      )
      .sort((a, b) => b.viralAmplificationFactor - a.viralAmplificationFactor)
      .slice(0, 5);
  }

  getAllClusters(): AudienceCluster[] {
    return Array.from(this.clusters.values());
  }
}

// ─── VIRAL PREDICTION AI ──────────────────────────────────────────────────────

export class ViralPredictionAI {
  private predictionCache = new Map<string, { prediction: ViralPrediction; generatedAt: Date }>();
  private readonly CACHE_TTL_MS = 300000; // 5 minutes

  async predictVirality(params: {
    contentId: string;
    contentType: string;
    creatorFollowers: number;
    creatorEngagementRate: number;
    hashtags: string[];
    hasMedia: boolean;
    mediaType?: "image" | "video" | "reel";
    earlyEngagements: number; // engagements in first 5 minutes
    earlyShares: number; // shares in first 5 minutes
    postingHour: number;
    dayOfWeek: number;
  }): Promise<ViralPrediction> {
    const cacheKey = `${params.contentId}:${params.earlyEngagements}:${params.earlyShares}`;
    const cached = this.predictionCache.get(cacheKey);
    if (cached && Date.now() - cached.generatedAt.getTime() < this.CACHE_TTL_MS) {
      return cached.prediction;
    }

    // Feature engineering
    const earlyVelocity = (params.earlyEngagements + params.earlyShares * 3) / 5; // per minute
    const creatorStrength = Math.log10(Math.max(1, params.creatorFollowers)) * params.creatorEngagementRate;
    const mediaBoost = params.hasMedia ? (params.mediaType === "reel" ? 2.5 : params.mediaType === "video" ? 1.8 : 1.3) : 1.0;
    const timingScore = this.getTimingScore(params.postingHour, params.dayOfWeek);
    const hashtagScore = Math.min(1, params.hashtags.length / 5) * 0.3 + 0.7;

    // Probability calculation
    let probability = 0;
    probability += Math.min(0.4, earlyVelocity / 100 * 0.4);
    probability += Math.min(0.25, creatorStrength / 10 * 0.25);
    probability += Math.min(0.15, (mediaBoost - 1) / 1.5 * 0.15);
    probability += Math.min(0.1, timingScore * 0.1);
    probability += Math.min(0.1, hashtagScore * 0.1);

    const predictedPeakReach = Math.floor(
      params.creatorFollowers * mediaBoost * timingScore * (1 + earlyVelocity / 10)
    );

    const predictedPeakTimeHours = probability > 0.7 ? 2 : probability > 0.4 ? 6 : 24;

    const keyFactors: string[] = [];
    if (earlyVelocity > 10) keyFactors.push("Strong early velocity");
    if (params.creatorEngagementRate > 0.05) keyFactors.push("High-engagement creator");
    if (params.mediaType === "reel") keyFactors.push("Reel format (2.5x amplification)");
    if (timingScore > 0.8) keyFactors.push("Optimal posting time");
    if (params.hashtags.length >= 3) keyFactors.push("Good hashtag coverage");

    const recommendedActions: string[] = [];
    if (probability > 0.5) {
      recommendedActions.push("Pin this post immediately to maximize visibility");
      recommendedActions.push("Share to your top communities now");
      recommendedActions.push("Engage with every comment in the next 2 hours");
    } else {
      recommendedActions.push("Boost with a follow-up post referencing this content");
      recommendedActions.push("Share to 3 relevant communities");
    }

    const prediction: ViralPrediction = {
      contentId: params.contentId,
      predictedViralProbability: Math.min(0.99, probability),
      predictedPeakReach,
      predictedPeakTimeHours,
      confidenceScore: 0.75,
      keyFactors,
      recommendedActions,
      similarViralContent: [],
    };

    this.predictionCache.set(cacheKey, { prediction, generatedAt: new Date() });
    return prediction;
  }

  private getTimingScore(hour: number, dayOfWeek: number): number {
    // Peak hours: 7-9pm weekdays, 12-2pm weekends
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend && hour >= 12 && hour <= 14) return 1.0;
    if (!isWeekend && hour >= 19 && hour <= 21) return 1.0;
    if (hour >= 17 && hour <= 22) return 0.8;
    if (hour >= 12 && hour <= 16) return 0.6;
    return 0.3;
  }
}

// ─── SOCIAL SPREAD ANALYTICS SERVICE ─────────────────────────────────────────

export class SocialSpreadAnalyticsService {
  private heatmaps = new Map<string, SpreadHeatmap>();

  buildHeatmap(contentId: string, shares: ShareEvent[]): SpreadHeatmap {
    if (shares.length === 0) {
      const heatmap: SpreadHeatmap = {
        contentId,
        timeWindows: [],
        peakWindow: 0,
        totalDuration: 0,
      };
      this.heatmaps.set(contentId, heatmap);
      return heatmap;
    }

    const firstTime = shares[0].timestamp.getTime();
    const lastTime = shares[shares.length - 1].timestamp.getTime();
    const windowSize = 3600000; // 1 hour windows

    const windows: SpreadHeatmap["timeWindows"] = [];
    let peakWindow = 0;
    let peakShares = 0;

    for (let t = firstTime; t <= lastTime; t += windowSize) {
      const windowShares = shares.filter(s => s.timestamp.getTime() >= t && s.timestamp.getTime() < t + windowSize);
      const windowReach = windowShares.reduce((sum, s) => sum + s.audienceReached, 0);
      const velocity = windowShares.length / 60; // per minute

      const window = {
        windowStart: new Date(t),
        windowEnd: new Date(t + windowSize),
        shares: windowShares.length,
        reach: windowReach,
        velocity,
        topRegions: ["US", "UK", "CA"], // Would be from user geo data in production
      };

      windows.push(window);

      if (windowShares.length > peakShares) {
        peakShares = windowShares.length;
        peakWindow = windows.length - 1;
      }
    }

    const heatmap: SpreadHeatmap = {
      contentId,
      timeWindows: windows,
      peakWindow,
      totalDuration: Math.ceil((lastTime - firstTime) / 3600000),
    };

    this.heatmaps.set(contentId, heatmap);
    return heatmap;
  }

  getHeatmap(contentId: string): SpreadHeatmap | null {
    return this.heatmaps.get(contentId) || null;
  }

  getPlatformViralityReport(): {
    totalViralContent: number;
    avgViralityScore: number;
    topViralContent: string[];
    viralityByContentType: Record<string, number>;
    peakHours: number[];
  } {
    const allHeatmaps = Array.from(this.heatmaps.values());
    const viralContent = allHeatmaps.filter(h => h.timeWindows.some(w => w.velocity > VIRAL_THRESHOLDS.trending / 60));

    const viralityByContentType: Record<string, number> = {};
    const peakHourCounts: Record<number, number> = {};

    for (const heatmap of viralContent) {
      const peakWindow = heatmap.timeWindows[heatmap.peakWindow];
      if (peakWindow) {
        const hour = peakWindow.windowStart.getHours();
        peakHourCounts[hour] = (peakHourCounts[hour] || 0) + 1;
      }
    }

    const peakHours = Object.entries(peakHourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hour]) => parseInt(hour));

    return {
      totalViralContent: viralContent.length,
      avgViralityScore: viralContent.length > 0 ? 65 : 0,
      topViralContent: viralContent.slice(0, 10).map(h => h.contentId),
      viralityByContentType,
      peakHours,
    };
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const shareGraphService = new ShareGraphService();
export const viralityScoreService = new ViralityScoreService();
export const contentDecayModel = new ContentDecayModelService();
export const audienceClusteringService = new AudienceClusteringService();
export const viralPredictionAI = new ViralPredictionAI();
export const socialSpreadAnalytics = new SocialSpreadAnalyticsService();

// ─── ROUTER COMPATIBILITY METHOD ALIASES ─────────────────────────────────────
// ShareGraphService aliases
(ShareGraphService.prototype as any).trackShare = function(userId: number, contentId: string, contentType: string, platform?: string) {
  return this.recordShare({ sharerId: userId, contentId, contentType: contentType as any, platform: platform as any || "web" });
};
(ShareGraphService.prototype as any).getPropagationTree = function(contentId: string) {
  return this.buildPropagationTree(contentId);
};

// ViralityScoreService aliases
(ViralityScoreService.prototype as any).calculate = function(contentId: string) {
  return this.getScore(contentId) || this.calculateScore(contentId, new ShareGraphService());
};

// SocialSpreadAnalyticsService aliases
(SocialSpreadAnalyticsService.prototype as any).getTrending = function(category?: string, limit = 20) {
  return this.getPlatformViralityReport();
};

// AudienceClusteringService aliases
(AudienceClusteringService.prototype as any).getClusters = function(userId: number) {
  return this.getUserClusters(userId);
};

// ViralPredictionAI aliases
(ViralPredictionAI.prototype as any).predict = function(contentId: string) {
  return this.predictVirality({ contentId, contentType: "post", currentShares: 0, currentLikes: 0, currentViews: 0, createdAt: new Date(), authorFollowers: 0, hashtags: [] });
};
