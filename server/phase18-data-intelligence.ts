import crypto from 'crypto';
/**
 * PHASE 18 — DATA DOMINATION
 * Intelligence Layer, Prediction Layer
 * Platform sees everything.
 */

// ─── INTELLIGENCE LAYER ──────────────────────────────────────────────────────

export interface UserAnalyticsProfile {
  userId: number;
  joinedAt: Date;
  lastActiveAt: Date;
  totalSessions: number;
  avgSessionDurationSeconds: number;
  totalTimeSpentSeconds: number;
  postsCreated: number;
  commentsCreated: number;
  likesGiven: number;
  likesReceived: number;
  followersCount: number;
  followingCount: number;
  totalSpentUSD: number;
  totalEarnedUSD: number;
  ltv: number;
  npsScore?: number;
  riskScore: number;
  engagementScore: number;
  monetizationScore: number;
  retentionProbability: number;
  churnRisk: "low" | "medium" | "high" | "critical";
  segment: "whale" | "power_user" | "casual" | "lurker" | "at_risk" | "churned";
  topCategories: string[];
  preferredContentTypes: string[];
  peakActivityHours: number[];
  updatedAt: Date;
}

export interface CreatorAnalyticsProfile {
  creatorId: number;
  totalFollowers: number;
  followerGrowthRate: number;
  avgEngagementRate: number;
  totalPosts: number;
  totalStreams: number;
  totalStreamHours: number;
  avgConcurrentViewers: number;
  peakConcurrentViewers: number;
  totalRevenue: number;
  revenueGrowthRate: number;
  subscriptionRevenue: number;
  adRevenue: number;
  tipRevenue: number;
  sponsorshipRevenue: number;
  digitalProductRevenue: number;
  topContentCategories: string[];
  bestPostingTimes: number[];
  audienceDemographics: {
    ageGroups: Record<string, number>;
    genders: Record<string, number>;
    regions: Record<string, number>;
  };
  contentPerformanceScore: number;
  monetizationEfficiency: number;
  brandSafetyScore: number;
  updatedAt: Date;
}

export interface CommunityAnalyticsProfile {
  communityId: string;
  memberCount: number;
  memberGrowthRate: number;
  dailyActiveMembers: number;
  weeklyActiveMembers: number;
  avgPostsPerDay: number;
  avgCommentsPerPost: number;
  engagementRate: number;
  topContributors: Array<{ userId: number; contributionScore: number }>;
  contentCategories: Record<string, number>;
  healthScore: number;
  toxicityRate: number;
  retentionRate: number;
  revenueGenerated: number;
  updatedAt: Date;
}

export interface TokenAnalyticsSnapshot {
  timestamp: Date;
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  burnedSupply: number;
  stakingRatio: number;
  holdersCount: number;
  transactionsCount24h: number;
  liquidityUSD: number;
  fearGreedIndex: number;
  rsi: number;
  macd: number;
  bollingerBands: { upper: number; middle: number; lower: number };
}

export interface NFTAnalyticsSnapshot {
  collectionId: string;
  floorPrice: number;
  ceilingPrice: number;
  avgPrice: number;
  volume24h: number;
  volume7d: number;
  sales24h: number;
  uniqueOwners: number;
  totalSupply: number;
  listedCount: number;
  listingRate: number;
  royaltyRevenue: number;
  priceChange24h: number;
  priceChange7d: number;
  timestamp: Date;
}

export interface RetentionCohort {
  cohortDate: string;
  cohortSize: number;
  retentionByDay: Record<number, number>;
  retentionByWeek: Record<number, number>;
  avgLTV: number;
  avgRevenue: number;
}

export interface ChurnAnalysis {
  period: string;
  totalUsers: number;
  churnedUsers: number;
  churnRate: number;
  reactivatedUsers: number;
  netChurn: number;
  revenueChurned: number;
  topChurnReasons: Array<{ reason: string; percentage: number }>;
  churnBySegment: Record<string, number>;
  churnByRegion: Record<string, number>;
}

export interface LTVAnalysis {
  segment: string;
  avgLTV: number;
  medianLTV: number;
  p90LTV: number;
  avgPaybackPeriodDays: number;
  ltvByCohort: Record<string, number>;
  ltvByAcquisitionChannel: Record<string, number>;
}

// ─── PREDICTION LAYER ────────────────────────────────────────────────────────

export interface ChurnPrediction {
  userId: number;
  churnProbability: number;
  churnRisk: "low" | "medium" | "high" | "critical";
  predictedChurnDate?: Date;
  topRiskFactors: Array<{ factor: string; weight: number }>;
  recommendedInterventions: string[];
  confidenceScore: number;
  generatedAt: Date;
}

export interface ViralPrediction {
  contentId: string;
  contentType: string;
  viralProbability: number;
  predictedReach: number;
  predictedEngagement: number;
  peakTime: Date;
  spreadVelocity: number;
  topAmplifiers: Array<{ userId: number; influenceScore: number }>;
  confidenceScore: number;
  generatedAt: Date;
}

export interface CreatorSuccessPrediction {
  creatorId: number;
  successProbability: number;
  predictedFollowersIn30d: number;
  predictedRevenueIn30d: number;
  growthTrajectory: "explosive" | "steady" | "plateau" | "declining";
  keySuccessFactors: Array<{ factor: string; score: number }>;
  recommendedActions: string[];
  confidenceScore: number;
  generatedAt: Date;
}

export interface FraudPrediction {
  entityId: string;
  entityType: "user" | "transaction" | "nft" | "campaign";
  fraudProbability: number;
  fraudType: "wash_trading" | "fake_engagement" | "bot_activity" | "payment_fraud" | "identity_fraud" | "market_manipulation";
  riskScore: number;
  signals: Array<{ signal: string; severity: "low" | "medium" | "high"; value: unknown }>;
  recommendedAction: "allow" | "review" | "flag" | "block";
  confidenceScore: number;
  generatedAt: Date;
}

export interface TreasuryPrediction {
  period: string;
  predictedMRR: number;
  predictedARR: number;
  predictedBurnRate: number;
  predictedRunway: number;
  revenueScenarios: {
    bear: number;
    base: number;
    bull: number;
  };
  topGrowthDrivers: Array<{ driver: string; contribution: number }>;
  topRisks: Array<{ risk: string; impact: number; probability: number }>;
  confidenceScore: number;
  generatedAt: Date;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _userProfiles = new Map<number, UserAnalyticsProfile>();
const _creatorProfiles = new Map<number, CreatorAnalyticsProfile>();
const _communityProfiles = new Map<string, CommunityAnalyticsProfile>();
const _tokenSnapshots: TokenAnalyticsSnapshot[] = [];
const _nftSnapshots = new Map<string, NFTAnalyticsSnapshot[]>();
const _retentionCohorts = new Map<string, RetentionCohort>();
const _churnAnalyses = new Map<string, ChurnAnalysis>();
const _ltvAnalyses = new Map<string, LTVAnalysis>();
const _churnPredictions = new Map<number, ChurnPrediction>();
const _viralPredictions = new Map<string, ViralPrediction>();
const _creatorSuccessPredictions = new Map<number, CreatorSuccessPrediction>();
const _fraudPredictions = new Map<string, FraudPrediction>();
const _treasuryPredictions: TreasuryPrediction[] = [];

// ─── INTELLIGENCE LAYER IMPLEMENTATION ──────────────────────────────────────

export const intelligenceLayer = {
  // User Analytics
  upsertUserProfile(userId: number, updates: Partial<UserAnalyticsProfile>): UserAnalyticsProfile {
    const existing = _userProfiles.get(userId);
    const profile: UserAnalyticsProfile = existing
      ? { ...existing, ...updates, updatedAt: new Date() }
      : {
          userId,
          joinedAt: new Date(),
          lastActiveAt: new Date(),
          totalSessions: 0,
          avgSessionDurationSeconds: 0,
          totalTimeSpentSeconds: 0,
          postsCreated: 0,
          commentsCreated: 0,
          likesGiven: 0,
          likesReceived: 0,
          followersCount: 0,
          followingCount: 0,
          totalSpentUSD: 0,
          totalEarnedUSD: 0,
          ltv: 0,
          riskScore: 0,
          engagementScore: 0,
          monetizationScore: 0,
          retentionProbability: 0.5,
          churnRisk: "low",
          segment: "casual",
          topCategories: [],
          preferredContentTypes: [],
          peakActivityHours: [],
          updatedAt: new Date(),
          ...updates,
        };
    _userProfiles.set(userId, profile);
    return profile;
  },

  getUserProfile(userId: number): UserAnalyticsProfile | null {
    return _userProfiles.get(userId) ?? null;
  },

  computeUserSegment(userId: number): UserAnalyticsProfile["segment"] {
    const profile = _userProfiles.get(userId);
    if (!profile) return "casual";
    if (profile.totalSpentUSD > 1000) return "whale";
    if (profile.engagementScore > 0.8) return "power_user";
    if (profile.churnRisk === "critical") return "at_risk";
    if (profile.totalSessions === 0) return "churned";
    if (profile.engagementScore < 0.2) return "lurker";
    return "casual";
  },

  getUsersBySegment(segment: UserAnalyticsProfile["segment"]): UserAnalyticsProfile[] {
    return Array.from(_userProfiles.values()).filter(p => p.segment === segment);
  },

  // Creator Analytics
  upsertCreatorProfile(creatorId: number, updates: Partial<CreatorAnalyticsProfile>): CreatorAnalyticsProfile {
    const existing = _creatorProfiles.get(creatorId);
    const profile: CreatorAnalyticsProfile = existing
      ? { ...existing, ...updates, updatedAt: new Date() }
      : {
          creatorId,
          totalFollowers: 0,
          followerGrowthRate: 0,
          avgEngagementRate: 0,
          totalPosts: 0,
          totalStreams: 0,
          totalStreamHours: 0,
          avgConcurrentViewers: 0,
          peakConcurrentViewers: 0,
          totalRevenue: 0,
          revenueGrowthRate: 0,
          subscriptionRevenue: 0,
          adRevenue: 0,
          tipRevenue: 0,
          sponsorshipRevenue: 0,
          digitalProductRevenue: 0,
          topContentCategories: [],
          bestPostingTimes: [],
          audienceDemographics: { ageGroups: {}, genders: {}, regions: {} },
          contentPerformanceScore: 0,
          monetizationEfficiency: 0,
          brandSafetyScore: 1,
          updatedAt: new Date(),
          ...updates,
        };
    _creatorProfiles.set(creatorId, profile);
    return profile;
  },

  getCreatorProfile(creatorId: number): CreatorAnalyticsProfile | null {
    return _creatorProfiles.get(creatorId) ?? null;
  },

  getTopCreatorsByRevenue(limit = 20): CreatorAnalyticsProfile[] {
    return Array.from(_creatorProfiles.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  },

  // Community Analytics
  upsertCommunityProfile(communityId: string, updates: Partial<CommunityAnalyticsProfile>): CommunityAnalyticsProfile {
    const existing = _communityProfiles.get(communityId);
    const profile: CommunityAnalyticsProfile = existing
      ? { ...existing, ...updates, updatedAt: new Date() }
      : {
          communityId,
          memberCount: 0,
          memberGrowthRate: 0,
          dailyActiveMembers: 0,
          weeklyActiveMembers: 0,
          avgPostsPerDay: 0,
          avgCommentsPerPost: 0,
          engagementRate: 0,
          topContributors: [],
          contentCategories: {},
          healthScore: 0.5,
          toxicityRate: 0,
          retentionRate: 0.5,
          revenueGenerated: 0,
          updatedAt: new Date(),
          ...updates,
        };
    _communityProfiles.set(communityId, profile);
    return profile;
  },

  getCommunityProfile(communityId: string): CommunityAnalyticsProfile | null {
    return _communityProfiles.get(communityId) ?? null;
  },

  // Token Analytics
  recordTokenSnapshot(snapshot: Omit<TokenAnalyticsSnapshot, "timestamp">): TokenAnalyticsSnapshot {
    const full: TokenAnalyticsSnapshot = { ...snapshot, timestamp: new Date() };
    _tokenSnapshots.push(full);
    return full;
  },

  getLatestTokenSnapshot(): TokenAnalyticsSnapshot | null {
    return _tokenSnapshots.length > 0 ? _tokenSnapshots[_tokenSnapshots.length - 1] : null;
  },

  getTokenHistory(limit = 30): TokenAnalyticsSnapshot[] {
    return _tokenSnapshots.slice(-limit);
  },

  // NFT Analytics
  recordNFTSnapshot(collectionId: string, snapshot: Omit<NFTAnalyticsSnapshot, "collectionId" | "timestamp">): NFTAnalyticsSnapshot {
    const full: NFTAnalyticsSnapshot = { ...snapshot, collectionId, timestamp: new Date() };
    if (!_nftSnapshots.has(collectionId)) _nftSnapshots.set(collectionId, []);
    _nftSnapshots.get(collectionId)!.push(full);
    return full;
  },

  getLatestNFTSnapshot(collectionId: string): NFTAnalyticsSnapshot | null {
    const snapshots = _nftSnapshots.get(collectionId);
    return snapshots && snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  },

  // Retention Cohorts
  recordRetentionCohort(cohort: RetentionCohort): RetentionCohort {
    _retentionCohorts.set(cohort.cohortDate, cohort);
    return cohort;
  },

  getRetentionCohort(cohortDate: string): RetentionCohort | null {
    return _retentionCohorts.get(cohortDate) ?? null;
  },

  getRetentionCohorts(limit = 12): RetentionCohort[] {
    return Array.from(_retentionCohorts.values())
      .sort((a, b) => b.cohortDate.localeCompare(a.cohortDate))
      .slice(0, limit);
  },

  // Churn Analysis
  recordChurnAnalysis(analysis: ChurnAnalysis): ChurnAnalysis {
    _churnAnalyses.set(analysis.period, analysis);
    return analysis;
  },

  getChurnAnalysis(period: string): ChurnAnalysis | null {
    return _churnAnalyses.get(period) ?? null;
  },

  // LTV Analysis
  recordLTVAnalysis(analysis: LTVAnalysis): LTVAnalysis {
    _ltvAnalyses.set(analysis.segment, analysis);
    return analysis;
  },

  getLTVAnalysis(segment: string): LTVAnalysis | null {
    return _ltvAnalyses.get(segment) ?? null;
  },

  // Dashboard Summary
  getIntelligenceDashboard(): {
    totalUsers: number;
    activeUsers: number;
    totalCreators: number;
    totalCommunities: number;
    avgEngagementScore: number;
    avgChurnRisk: string;
    topSegments: Record<string, number>;
  } {
    const users = Array.from(_userProfiles.values());
    const segments: Record<string, number> = {};
    let totalEngagement = 0;
    for (const u of users) {
      segments[u.segment] = (segments[u.segment] ?? 0) + 1;
      totalEngagement += u.engagementScore;
    }
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => {
        const daysSince = (Date.now() - u.lastActiveAt.getTime()) / 86400000;
        return daysSince <= 7;
      }).length,
      totalCreators: _creatorProfiles.size,
      totalCommunities: _communityProfiles.size,
      avgEngagementScore: users.length > 0 ? totalEngagement / users.length : 0,
      avgChurnRisk: "medium",
      topSegments: segments,
    };
  },
};

// ─── PREDICTION LAYER IMPLEMENTATION ────────────────────────────────────────

export const predictionLayer = {
  // Churn Prediction
  predictChurn(userId: number): ChurnPrediction {
    const profile = _userProfiles.get(userId);
    const daysSinceActive = profile
      ? (Date.now() - profile.lastActiveAt.getTime()) / 86400000
      : 30;
    const engagementScore = profile?.engagementScore ?? 0;
    const spendScore = Math.min(1, (profile?.totalSpentUSD ?? 0) / 100);

    // Simple logistic-style scoring
    const churnProb = Math.min(0.99, Math.max(0.01,
      0.3 * (daysSinceActive / 30) +
      0.4 * (1 - engagementScore) +
      0.3 * (1 - spendScore)
    ));

    const riskFactors: Array<{ factor: string; weight: number }> = [];
    if (daysSinceActive > 7) riskFactors.push({ factor: "inactivity", weight: daysSinceActive / 30 });
    if (engagementScore < 0.3) riskFactors.push({ factor: "low_engagement", weight: 1 - engagementScore });
    if (spendScore < 0.1) riskFactors.push({ factor: "no_monetization", weight: 0.5 });

    const churnRisk: ChurnPrediction["churnRisk"] =
      churnProb > 0.8 ? "critical" :
      churnProb > 0.6 ? "high" :
      churnProb > 0.3 ? "medium" : "low";

    const interventions: string[] = [];
    if (daysSinceActive > 7) interventions.push("Send re-engagement push notification");
    if (engagementScore < 0.3) interventions.push("Surface personalized content recommendations");
    if (spendScore < 0.1) interventions.push("Offer first-purchase discount");

    const prediction: ChurnPrediction = {
      userId,
      churnProbability: Math.round(churnProb * 10000) / 10000,
      churnRisk,
      predictedChurnDate: churnProb > 0.6
        ? new Date(Date.now() + (1 - churnProb) * 30 * 86400000)
        : undefined,
      topRiskFactors: riskFactors.sort((a, b) => b.weight - a.weight).slice(0, 3),
      recommendedInterventions: interventions,
      confidenceScore: 0.78,
      generatedAt: new Date(),
    };
    _churnPredictions.set(userId, prediction);
    return prediction;
  },

  getChurnPrediction(userId: number): ChurnPrediction | null {
    return _churnPredictions.get(userId) ?? null;
  },

  getHighRiskUsers(limit = 100): ChurnPrediction[] {
    return Array.from(_churnPredictions.values())
      .filter(p => p.churnRisk === "high" || p.churnRisk === "critical")
      .sort((a, b) => b.churnProbability - a.churnProbability)
      .slice(0, limit);
  },

  // Viral Prediction
  predictVirality(contentId: string, contentType: string, initialEngagement: number, creatorFollowers: number): ViralPrediction {
    const viralProb = Math.min(0.99, Math.max(0.01,
      0.4 * Math.min(1, initialEngagement / 1000) +
      0.3 * Math.min(1, creatorFollowers / 100000) +
      0.3 * (crypto.getRandomValues(new Uint8Array(1))[0] / 256)
    ));
    const prediction: ViralPrediction = {
      contentId,
      contentType,
      viralProbability: Math.round(viralProb * 10000) / 10000,
      predictedReach: Math.floor(creatorFollowers * viralProb * 10),
      predictedEngagement: Math.floor(initialEngagement * viralProb * 5),
      peakTime: new Date(Date.now() + Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 48) * 3600000),
      spreadVelocity: viralProb * 100,
      topAmplifiers: [],
      confidenceScore: 0.72,
      generatedAt: new Date(),
    };
    _viralPredictions.set(contentId, prediction);
    return prediction;
  },

  getViralPrediction(contentId: string): ViralPrediction | null {
    return _viralPredictions.get(contentId) ?? null;
  },

  // Creator Success Prediction
  predictCreatorSuccess(creatorId: number): CreatorSuccessPrediction {
    const profile = _creatorProfiles.get(creatorId);
    const followers = profile?.totalFollowers ?? 0;
    const engagementRate = profile?.avgEngagementRate ?? 0;
    const revenueGrowth = profile?.revenueGrowthRate ?? 0;

    const successProb = Math.min(0.99, Math.max(0.01,
      0.3 * Math.min(1, followers / 10000) +
      0.4 * Math.min(1, engagementRate / 0.1) +
      0.3 * Math.min(1, revenueGrowth / 0.5)
    ));

    const trajectory: CreatorSuccessPrediction["growthTrajectory"] =
      revenueGrowth > 0.3 ? "explosive" :
      revenueGrowth > 0.1 ? "steady" :
      revenueGrowth > 0 ? "plateau" : "declining";

    const prediction: CreatorSuccessPrediction = {
      creatorId,
      successProbability: Math.round(successProb * 10000) / 10000,
      predictedFollowersIn30d: Math.floor(followers * (1 + successProb * 0.3)),
      predictedRevenueIn30d: Math.floor((profile?.totalRevenue ?? 0) * (1 + successProb * 0.2)),
      growthTrajectory: trajectory,
      keySuccessFactors: [
        { factor: "engagement_rate", score: engagementRate },
        { factor: "follower_count", score: Math.min(1, followers / 10000) },
        { factor: "revenue_growth", score: Math.min(1, revenueGrowth) },
      ],
      recommendedActions: [
        "Post consistently at peak audience hours",
        "Engage with top fans via premium DMs",
        "Launch a subscription tier",
      ],
      confidenceScore: 0.75,
      generatedAt: new Date(),
    };
    _creatorSuccessPredictions.set(creatorId, prediction);
    return prediction;
  },

  getCreatorSuccessPrediction(creatorId: number): CreatorSuccessPrediction | null {
    return _creatorSuccessPredictions.get(creatorId) ?? null;
  },

  // Fraud Prediction
  predictFraud(entityId: string, entityType: FraudPrediction["entityType"], signals: FraudPrediction["signals"]): FraudPrediction {
    const highSignals = signals.filter(s => s.severity === "high").length;
    const medSignals = signals.filter(s => s.severity === "medium").length;
    const fraudProb = Math.min(0.99, (highSignals * 0.3 + medSignals * 0.1));
    const riskScore = Math.round(fraudProb * 100);
    const action: FraudPrediction["recommendedAction"] =
      fraudProb > 0.8 ? "block" :
      fraudProb > 0.5 ? "flag" :
      fraudProb > 0.2 ? "review" : "allow";
    const fraudTypes: FraudPrediction["fraudType"][] = [
      "wash_trading", "fake_engagement", "bot_activity", "payment_fraud", "identity_fraud", "market_manipulation"
    ];
    const prediction: FraudPrediction = {
      entityId, entityType,
      fraudProbability: Math.round(fraudProb * 10000) / 10000,
      fraudType: fraudTypes[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * fraudTypes.length)],
      riskScore,
      signals,
      recommendedAction: action,
      confidenceScore: 0.82,
      generatedAt: new Date(),
    };
    _fraudPredictions.set(entityId, prediction);
    return prediction;
  },

  getFraudPrediction(entityId: string): FraudPrediction | null {
    return _fraudPredictions.get(entityId) ?? null;
  },

  getFlaggedEntities(limit = 50): FraudPrediction[] {
    return Array.from(_fraudPredictions.values())
      .filter(p => p.recommendedAction === "flag" || p.recommendedAction === "block")
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);
  },

  // Treasury Prediction
  predictTreasury(currentMRR: number, growthRate: number, burnRate: number, cashPosition: number): TreasuryPrediction {
    const bearGrowth = growthRate * 0.3;
    const baseGrowth = growthRate;
    const bullGrowth = growthRate * 2.0;
    const prediction: TreasuryPrediction = {
      period: "next_30d",
      predictedMRR: Math.round(currentMRR * (1 + baseGrowth)),
      predictedARR: Math.round(currentMRR * (1 + baseGrowth) * 12),
      predictedBurnRate: burnRate,
      predictedRunway: burnRate > 0 ? Math.round(cashPosition / burnRate) : 999,
      revenueScenarios: {
        bear: Math.round(currentMRR * (1 + bearGrowth)),
        base: Math.round(currentMRR * (1 + baseGrowth)),
        bull: Math.round(currentMRR * (1 + bullGrowth)),
      },
      topGrowthDrivers: [
        { driver: "subscription_growth", contribution: 0.45 },
        { driver: "creator_monetization", contribution: 0.30 },
        { driver: "ad_revenue", contribution: 0.15 },
        { driver: "nft_royalties", contribution: 0.10 },
      ],
      topRisks: [
        { risk: "creator_churn", impact: 0.3, probability: 0.2 },
        { risk: "market_downturn", impact: 0.5, probability: 0.15 },
        { risk: "regulatory_change", impact: 0.4, probability: 0.1 },
      ],
      confidenceScore: 0.71,
      generatedAt: new Date(),
    };
    _treasuryPredictions.push(prediction);
    return prediction;
  },

  getLatestTreasuryPrediction(): TreasuryPrediction | null {
    return _treasuryPredictions.length > 0
      ? _treasuryPredictions[_treasuryPredictions.length - 1]
      : null;
  },

  // Prediction Dashboard
  getPredictionSummary(): {
    highChurnUsers: number;
    viralContentCount: number;
    fraudFlaggedCount: number;
    avgCreatorSuccessProb: number;
    treasuryOutlook: string;
  } {
    const highChurn = Array.from(_churnPredictions.values())
      .filter(p => p.churnRisk === "high" || p.churnRisk === "critical").length;
    const viral = Array.from(_viralPredictions.values())
      .filter(p => p.viralProbability > 0.7).length;
    const fraudFlagged = Array.from(_fraudPredictions.values())
      .filter(p => p.recommendedAction !== "allow").length;
    const creatorPreds = Array.from(_creatorSuccessPredictions.values());
    const avgSuccess = creatorPreds.length > 0
      ? creatorPreds.reduce((s, p) => s + p.successProbability, 0) / creatorPreds.length
      : 0;
    const treasury = this.getLatestTreasuryPrediction();
    const outlook = treasury
      ? treasury.revenueScenarios.base > treasury.predictedMRR * 0.9 ? "positive" : "neutral"
      : "unknown";
    return {
      highChurnUsers: highChurn,
      viralContentCount: viral,
      fraudFlaggedCount: fraudFlagged,
      avgCreatorSuccessProb: Math.round(avgSuccess * 10000) / 10000,
      treasuryOutlook: outlook,
    };
  },
};
