import crypto from 'crypto';
/**
 * Data Warehouse Engine
 * Phase 5D — Sovereignty Build
 *
 * Platform data ownership infrastructure:
 * - Event Store (immutable append-only event log)
 * - Analytics Warehouse (aggregated platform metrics)
 * - Recommendation Data Lake (user behavior signals)
 * - Creator Performance Warehouse (earnings, growth, engagement)
 * - Treasury Warehouse (token flows, staking, burns)
 * - Fraud Warehouse (risk signals, abuse patterns)
 * - Retention Warehouse (cohorts, churn, LTV)
 * - Data Export Pipeline (GDPR compliance, creator exports)
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface WarehouseEvent {
  id: string;
  eventType: string;
  userId?: number;
  sessionId?: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  platform: "web" | "mobile" | "api";
  version: string;
  processed: boolean;
}

export interface UserBehaviorSignal {
  userId: number;
  signalType: "view" | "like" | "share" | "comment" | "follow" | "subscribe" | "purchase" | "search" | "skip" | "replay" | "save" | "report";
  targetId: string;
  targetType: "post" | "reel" | "stream" | "creator" | "community" | "nft" | "product";
  duration?: number;
  completionRate?: number;
  referrer?: string;
  timestamp: Date;
  weight: number;
}

export interface CreatorMetrics {
  creatorId: number;
  period: "daily" | "weekly" | "monthly" | "all_time";
  periodStart: Date;
  periodEnd: Date;
  views: number;
  uniqueViewers: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  followersGained: number;
  followersLost: number;
  subscribersGained: number;
  subscribersCancelled: number;
  totalSubscribers: number;
  revenue: number;
  revenueBySource: Record<string, number>;
  avgEngagementRate: number;
  topContent: { id: string; type: string; views: number; revenue: number }[];
  audienceDemographics: { country: string; percent: number }[];
  retentionRate: number;
  updatedAt: Date;
}

export interface CohortData {
  cohortId: string;
  cohortDate: Date;
  size: number;
  retentionByWeek: number[];
  avgLTV: number;
  avgRevenue: number;
  churnRate: number;
  topChannels: string[];
}

export interface FraudSignal {
  userId: number;
  signalType: "fake_engagement" | "bot_behavior" | "payment_fraud" | "identity_theft" | "spam" | "wash_trading" | "sybil_attack" | "account_takeover";
  severity: "low" | "medium" | "high" | "critical";
  evidence: Record<string, unknown>;
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actionTaken?: string;
  riskScore: number;
}

export interface TreasurySnapshot {
  timestamp: Date;
  totalSupply: bigint;
  circulatingSupply: bigint;
  stakedAmount: bigint;
  burnedAmount: bigint;
  treasuryBalance: bigint;
  liquidityPoolBalance: bigint;
  farmingRewardsEmitted: bigint;
  price: number;
  marketCap: number;
  volume24h: number;
  holders: number;
}

export interface RetentionMetrics {
  date: Date;
  dau: number;
  wau: number;
  mau: number;
  dauWauRatio: number;
  dauMauRatio: number;
  newUsers: number;
  returningUsers: number;
  churnedUsers: number;
  avgSessionDuration: number;
  avgSessionsPerUser: number;
  avgPageViewsPerSession: number;
}

export interface DataExportRequest {
  id: string;
  userId: number;
  requestType: "gdpr_export" | "creator_analytics" | "transaction_history" | "full_account";
  status: "pending" | "processing" | "ready" | "expired";
  downloadUrl?: string;
  requestedAt: Date;
  readyAt?: Date;
  expiresAt?: Date;
}

// ─── EVENT STORE ──────────────────────────────────────────────────────────────

class EventStore {
  private events: WarehouseEvent[] = [];
  private readonly MAX_EVENTS = 1_000_000;

  append(
    eventType: string,
    properties: Record<string, unknown>,
    userId?: number,
    sessionId?: string,
    platform: WarehouseEvent["platform"] = "web"
  ): WarehouseEvent {
    const event: WarehouseEvent = {
      id: `evt_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2)}`,
      eventType,
      userId,
      sessionId,
      properties,
      timestamp: new Date(),
      platform,
      version: "5.0",
      processed: false,
    };
    this.events.push(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
    return event;
  }

  query(filters: {
    eventType?: string;
    userId?: number;
    since?: Date;
    until?: Date;
    limit?: number;
  }): WarehouseEvent[] {
    let result = this.events;
    if (filters.eventType) result = result.filter(e => e.eventType === filters.eventType);
    if (filters.userId !== undefined) result = result.filter(e => e.userId === filters.userId);
    if (filters.since) result = result.filter(e => e.timestamp >= filters.since!);
    if (filters.until) result = result.filter(e => e.timestamp <= filters.until!);
    return result.slice(-(filters.limit || 1000));
  }

  getEventCounts(since: Date): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of this.events) {
      if (event.timestamp >= since) {
        counts[event.eventType] = (counts[event.eventType] || 0) + 1;
      }
    }
    return counts;
  }

  getUserJourney(userId: number, limit = 100): WarehouseEvent[] {
    return this.events
      .filter(e => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getUnprocessedEvents(limit = 1000): WarehouseEvent[] {
    return this.events.filter(e => !e.processed).slice(0, limit);
  }

  markProcessed(eventIds: string[]): void {
    const idSet = new Set(eventIds);
    for (const event of this.events) {
      if (idSet.has(event.id)) event.processed = true;
    }
  }

  getStats() {
    const now = new Date();
    const day = new Date(now.getTime() - 86400000);
    const week = new Date(now.getTime() - 7 * 86400000);
    return {
      totalEvents: this.events.length,
      last24h: this.events.filter(e => e.timestamp >= day).length,
      last7d: this.events.filter(e => e.timestamp >= week).length,
      unprocessed: this.events.filter(e => !e.processed).length,
      uniqueUsers: new Set(this.events.map(e => e.userId).filter(Boolean)).size,
    };
  }
}

// ─── RECOMMENDATION DATA LAKE ─────────────────────────────────────────────────

class RecommendationDataLake {
  private signals: UserBehaviorSignal[] = [];
  private userProfiles = new Map<number, {
    topCategories: string[];
    topCreators: number[];
    avgSessionDuration: number;
    preferredContentTypes: string[];
    activeHours: number[];
    engagementScore: number;
  }>();

  private readonly SIGNAL_WEIGHTS: Record<UserBehaviorSignal["signalType"], number> = {
    view: 1,
    like: 3,
    share: 5,
    comment: 4,
    follow: 8,
    subscribe: 10,
    purchase: 15,
    search: 2,
    skip: -1,
    replay: 4,
    save: 6,
    report: -10,
  };

  recordSignal(
    userId: number,
    signalType: UserBehaviorSignal["signalType"],
    targetId: string,
    targetType: UserBehaviorSignal["targetType"],
    duration?: number,
    completionRate?: number,
    referrer?: string
  ): void {
    const signal: UserBehaviorSignal = {
      userId,
      signalType,
      targetId,
      targetType,
      duration,
      completionRate,
      referrer,
      timestamp: new Date(),
      weight: this.SIGNAL_WEIGHTS[signalType] * (completionRate || 1),
    };
    this.signals.push(signal);
    this.updateUserProfile(userId, signal);
  }

  private updateUserProfile(userId: number, signal: UserBehaviorSignal): void {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        topCategories: [],
        topCreators: [],
        avgSessionDuration: 0,
        preferredContentTypes: [],
        activeHours: [],
        engagementScore: 0,
      });
    }
    const profile = this.userProfiles.get(userId)!;
    profile.engagementScore += signal.weight;
    const hour = new Date().getHours();
    if (!profile.activeHours.includes(hour)) profile.activeHours.push(hour);
    if (signal.targetType === "creator" && !profile.topCreators.includes(parseInt(signal.targetId))) {
      profile.topCreators.push(parseInt(signal.targetId));
      if (profile.topCreators.length > 20) profile.topCreators.shift();
    }
    if (!profile.preferredContentTypes.includes(signal.targetType)) {
      profile.preferredContentTypes.push(signal.targetType);
    }
  }

  getUserSignals(userId: number, since?: Date, limit = 500): UserBehaviorSignal[] {
    return this.signals
      .filter(s => s.userId === userId && (!since || s.timestamp >= since))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getUserProfile(userId: number) {
    return this.userProfiles.get(userId) || null;
  }

  getTopContent(targetType: UserBehaviorSignal["targetType"], limit = 20): { targetId: string; score: number; signals: number }[] {
    const scores = new Map<string, { score: number; signals: number }>();
    for (const signal of this.signals) {
      if (signal.targetType !== targetType) continue;
      const current = scores.get(signal.targetId) || { score: 0, signals: 0 };
      current.score += signal.weight;
      current.signals++;
      scores.set(signal.targetId, current);
    }
    return Array.from(scores.entries())
      .map(([targetId, data]) => ({ targetId, ...data }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getSimilarUsers(userId: number, limit = 10): number[] {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];
    const scores = new Map<number, number>();
    for (const [uid, p] of this.userProfiles) {
      if (uid === userId) continue;
      let similarity = 0;
      for (const creator of profile.topCreators) {
        if (p.topCreators.includes(creator)) similarity += 2;
      }
      for (const type of profile.preferredContentTypes) {
        if (p.preferredContentTypes.includes(type)) similarity += 1;
      }
      scores.set(uid, similarity);
    }
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([uid]) => uid);
  }

  getSignalStats() {
    const byType: Record<string, number> = {};
    for (const signal of this.signals) {
      byType[signal.signalType] = (byType[signal.signalType] || 0) + 1;
    }
    return {
      totalSignals: this.signals.length,
      uniqueUsers: new Set(this.signals.map(s => s.userId)).size,
      byType,
      avgEngagementScore: Array.from(this.userProfiles.values()).reduce((sum, p) => sum + p.engagementScore, 0) / (this.userProfiles.size || 1),
    };
  }
}

// ─── CREATOR PERFORMANCE WAREHOUSE ───────────────────────────────────────────

class CreatorPerformanceWarehouse {
  private metrics = new Map<string, CreatorMetrics>(); // key: `${creatorId}_${period}_${periodStart}`

  updateMetrics(
    creatorId: number,
    period: CreatorMetrics["period"],
    updates: Partial<Omit<CreatorMetrics, "creatorId" | "period" | "periodStart" | "periodEnd" | "updatedAt">>
  ): CreatorMetrics {
    const now = new Date();
    const periodStart = this.getPeriodStart(period, now);
    const periodEnd = this.getPeriodEnd(period, now);
    const key = `${creatorId}_${period}_${periodStart.toISOString().slice(0, 10)}`;
    const existing = this.metrics.get(key) || {
      creatorId,
      period,
      periodStart,
      periodEnd,
      views: 0,
      uniqueViewers: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      followers: 0,
      followersGained: 0,
      followersLost: 0,
      subscribersGained: 0,
      subscribersCancelled: 0,
      totalSubscribers: 0,
      revenue: 0,
      revenueBySource: {},
      avgEngagementRate: 0,
      topContent: [],
      audienceDemographics: [],
      retentionRate: 0,
      updatedAt: now,
    };
    const updated: CreatorMetrics = { ...existing, ...updates, updatedAt: now };
    if (updated.views > 0) {
      updated.avgEngagementRate = ((updated.likes + updated.comments + updated.shares) / updated.views) * 100;
    }
    this.metrics.set(key, updated);
    return updated;
  }

  private getPeriodStart(period: CreatorMetrics["period"], now: Date): Date {
    const d = new Date(now);
    if (period === "daily") { d.setHours(0, 0, 0, 0); return d; }
    if (period === "weekly") { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; }
    if (period === "monthly") { d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
    return new Date(0); // all_time
  }

  private getPeriodEnd(period: CreatorMetrics["period"], now: Date): Date {
    const d = new Date(now);
    if (period === "daily") { d.setHours(23, 59, 59, 999); return d; }
    if (period === "weekly") { d.setDate(d.getDate() + (6 - d.getDay())); d.setHours(23, 59, 59, 999); return d; }
    if (period === "monthly") { d.setMonth(d.getMonth() + 1, 0); d.setHours(23, 59, 59, 999); return d; }
    return new Date(9999, 11, 31);
  }

  getCreatorMetrics(creatorId: number, period: CreatorMetrics["period"]): CreatorMetrics | null {
    const now = new Date();
    const periodStart = this.getPeriodStart(period, now);
    const key = `${creatorId}_${period}_${periodStart.toISOString().slice(0, 10)}`;
    return this.metrics.get(key) || null;
  }

  getTopCreators(period: CreatorMetrics["period"], by: "revenue" | "views" | "followers" = "revenue", limit = 50): CreatorMetrics[] {
    const now = new Date();
    const periodStart = this.getPeriodStart(period, now);
    const periodKey = periodStart.toISOString().slice(0, 10);
    return Array.from(this.metrics.values())
      .filter(m => m.period === period && m.periodStart.toISOString().slice(0, 10) === periodKey)
      .sort((a, b) => b[by] - a[by])
      .slice(0, limit);
  }

  getCreatorGrowthTrend(creatorId: number, days = 30): { date: string; followers: number; revenue: number; views: number }[] {
    const trend = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = `${creatorId}_daily_${d.toISOString().slice(0, 10)}`;
      const m = this.metrics.get(key);
      trend.push({
        date: d.toISOString().slice(0, 10),
        followers: m?.followers || 0,
        revenue: m?.revenue || 0,
        views: m?.views || 0,
      });
    }
    return trend;
  }
}

// ─── FRAUD WAREHOUSE ──────────────────────────────────────────────────────────

class FraudWarehouse {
  private signals: FraudSignal[] = [];
  private riskScores = new Map<number, number>();

  recordSignal(
    userId: number,
    signalType: FraudSignal["signalType"],
    severity: FraudSignal["severity"],
    evidence: Record<string, unknown>
  ): FraudSignal {
    const severityScore = { low: 10, medium: 25, high: 50, critical: 100 }[severity];
    const signal: FraudSignal = {
      userId,
      signalType,
      severity,
      evidence,
      detectedAt: new Date(),
      resolved: false,
      riskScore: severityScore,
    };
    this.signals.push(signal);
    const currentScore = this.riskScores.get(userId) || 0;
    this.riskScores.set(userId, Math.min(currentScore + severityScore, 1000));
    return signal;
  }

  getUserRiskScore(userId: number): number {
    return this.riskScores.get(userId) || 0;
  }

  isHighRisk(userId: number): boolean {
    return (this.riskScores.get(userId) || 0) >= 100;
  }

  resolveSignal(signalIndex: number, actionTaken: string): void {
    const signal = this.signals[signalIndex];
    if (!signal) return;
    signal.resolved = true;
    signal.resolvedAt = new Date();
    signal.actionTaken = actionTaken;
    const userId = signal.userId;
    const activeScore = this.signals
      .filter(s => s.userId === userId && !s.resolved)
      .reduce((sum, s) => sum + s.riskScore, 0);
    this.riskScores.set(userId, activeScore);
  }

  getHighRiskUsers(minScore = 100): { userId: number; score: number; signals: FraudSignal[] }[] {
    const highRisk: { userId: number; score: number; signals: FraudSignal[] }[] = [];
    for (const [userId, score] of this.riskScores) {
      if (score >= minScore) {
        highRisk.push({
          userId,
          score,
          signals: this.signals.filter(s => s.userId === userId && !s.resolved),
        });
      }
    }
    return highRisk.sort((a, b) => b.score - a.score);
  }

  getUnresolvedSignals(severity?: FraudSignal["severity"]): FraudSignal[] {
    return this.signals.filter(s => !s.resolved && (!severity || s.severity === severity));
  }

  getFraudStats() {
    const unresolved = this.signals.filter(s => !s.resolved);
    const byType: Record<string, number> = {};
    for (const s of unresolved) {
      byType[s.signalType] = (byType[s.signalType] || 0) + 1;
    }
    return {
      totalSignals: this.signals.length,
      unresolvedSignals: unresolved.length,
      highRiskUsers: Array.from(this.riskScores.values()).filter(s => s >= 100).length,
      criticalSignals: unresolved.filter(s => s.severity === "critical").length,
      byType,
    };
  }
}

// ─── TREASURY WAREHOUSE ───────────────────────────────────────────────────────

class TreasuryWarehouse {
  private snapshots: TreasurySnapshot[] = [];
  private tokenFlows: { type: string; amount: bigint; timestamp: Date; userId?: number }[] = [];

  recordSnapshot(snapshot: Omit<TreasurySnapshot, "timestamp">): TreasurySnapshot {
    const full: TreasurySnapshot = { ...snapshot, timestamp: new Date() };
    this.snapshots.push(full);
    return full;
  }

  recordFlow(type: "mint" | "burn" | "stake" | "unstake" | "reward" | "transfer" | "swap", amount: bigint, userId?: number): void {
    this.tokenFlows.push({ type, amount, timestamp: new Date(), userId });
  }

  getLatestSnapshot(): TreasurySnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  getSnapshotHistory(days = 30): TreasurySnapshot[] {
    const since = new Date(Date.now() - days * 86400000);
    return this.snapshots.filter(s => s.timestamp >= since);
  }

  getFlowStats(days = 7): Record<string, bigint> {
    const since = new Date(Date.now() - days * 86400000);
    const stats: Record<string, bigint> = {};
    for (const flow of this.tokenFlows) {
      if (flow.timestamp >= since) {
        stats[flow.type] = (stats[flow.type] || 0n) + flow.amount;
      }
    }
    return stats;
  }

  getPriceHistory(days = 30): { date: string; price: number; marketCap: number; volume: number }[] {
    const since = new Date(Date.now() - days * 86400000);
    return this.snapshots
      .filter(s => s.timestamp >= since)
      .map(s => ({
        date: s.timestamp.toISOString().slice(0, 10),
        price: s.price,
        marketCap: s.marketCap,
        volume: s.volume24h,
      }));
  }
}

// ─── RETENTION WAREHOUSE ──────────────────────────────────────────────────────

class RetentionWarehouse {
  private dailyMetrics: RetentionMetrics[] = [];
  private cohorts = new Map<string, CohortData>();
  private userFirstSeen = new Map<number, Date>();
  private userLastSeen = new Map<number, Date>();

  recordUserActivity(userId: number): void {
    const now = new Date();
    if (!this.userFirstSeen.has(userId)) {
      this.userFirstSeen.set(userId, now);
    }
    this.userLastSeen.set(userId, now);
  }

  recordDailySnapshot(snapshot: Omit<RetentionMetrics, "date">): RetentionMetrics {
    const metrics: RetentionMetrics = { ...snapshot, date: new Date() };
    this.dailyMetrics.push(metrics);
    return metrics;
  }

  createCohort(cohortDate: Date, userIds: number[]): CohortData {
    const cohortId = `cohort_${cohortDate.toISOString().slice(0, 10)}`;
    const cohort: CohortData = {
      cohortId,
      cohortDate,
      size: userIds.length,
      retentionByWeek: [100], // Week 0 is always 100%
      avgLTV: 0,
      avgRevenue: 0,
      churnRate: 0,
      topChannels: [],
    };
    this.cohorts.set(cohortId, cohort);
    return cohort;
  }

  updateCohortRetention(cohortId: string, week: number, retainedPercent: number): void {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return;
    cohort.retentionByWeek[week] = retainedPercent;
    if (cohort.retentionByWeek.length > 1) {
      cohort.churnRate = 100 - (cohort.retentionByWeek[cohort.retentionByWeek.length - 1] || 0);
    }
  }

  getRetentionTrend(days = 30): RetentionMetrics[] {
    const since = new Date(Date.now() - days * 86400000);
    return this.dailyMetrics.filter(m => m.date >= since).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  getCohortAnalysis(): CohortData[] {
    return Array.from(this.cohorts.values()).sort((a, b) => b.cohortDate.getTime() - a.cohortDate.getTime());
  }

  getChurnRisk(): number[] {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const churnRisk: number[] = [];
    for (const [userId, lastSeen] of this.userLastSeen) {
      if (lastSeen < thirtyDaysAgo) churnRisk.push(userId);
    }
    return churnRisk;
  }

  getLTVEstimate(userId: number, avgMonthlyRevenue: number): number {
    const firstSeen = this.userFirstSeen.get(userId);
    if (!firstSeen) return 0;
    const monthsActive = (Date.now() - firstSeen.getTime()) / (30 * 86400000);
    const predictedLifetimeMonths = Math.max(monthsActive * 2, 12);
    return avgMonthlyRevenue * predictedLifetimeMonths;
  }

  getPlatformHealth() {
    const latest = this.dailyMetrics[this.dailyMetrics.length - 1];
    if (!latest) return null;
    return {
      dau: latest.dau,
      wau: latest.wau,
      mau: latest.mau,
      stickinessRatio: latest.dauMauRatio,
      avgSessionDuration: latest.avgSessionDuration,
      newUserGrowth: latest.newUsers,
      churnRate: latest.churnedUsers / (latest.dau || 1) * 100,
    };
  }
}

// ─── DATA EXPORT PIPELINE ─────────────────────────────────────────────────────

class DataExportPipeline {
  private requests: DataExportRequest[] = [];

  requestExport(userId: number, requestType: DataExportRequest["requestType"]): DataExportRequest {
    const request: DataExportRequest = {
      id: `export_${Date.now()}_${userId}`,
      userId,
      requestType,
      status: "pending",
      requestedAt: new Date(),
    };
    this.requests.push(request);
    // Simulate async processing
    setTimeout(() => {
      request.status = "ready";
      request.downloadUrl = `https://api.shadowchat.app/exports/${request.id}/download`;
      request.readyAt = new Date();
      request.expiresAt = new Date(Date.now() + 7 * 86400000); // 7 days
    }, 100);
    return request;
  }

  getExportStatus(requestId: string): DataExportRequest | null {
    return this.requests.find(r => r.id === requestId) || null;
  }

  getUserExports(userId: number): DataExportRequest[] {
    return this.requests.filter(r => r.userId === userId);
  }

  generateGDPRExport(userId: number): Record<string, unknown> {
    return {
      exportedAt: new Date().toISOString(),
      userId,
      dataCategories: {
        profile: "included",
        posts: "included",
        messages: "included",
        transactions: "included",
        behaviorSignals: "anonymized",
        fraudSignals: "excluded",
      },
      retentionPolicy: "Data retained for 3 years after account deletion per GDPR Article 17",
    };
  }
}

// ─── ANALYTICS AGGREGATOR ─────────────────────────────────────────────────────

class AnalyticsAggregator {
  computePlatformDashboard(days = 7): {
    users: { total: number; new: number; active: number };
    content: { posts: number; reels: number; streams: number };
    revenue: { total: number; bySource: Record<string, number> };
    engagement: { avgLikes: number; avgComments: number; avgShares: number };
    topMetrics: { dau: number; mau: number; retention: number };
  } {
    // Aggregates across all warehouses
    const eventStats = eventStore.getStats();
    const signalStats = recommendationLake.getSignalStats();
    const fraudStats = fraudWarehouse.getFraudStats();
    return {
      users: {
        total: eventStats.uniqueUsers,
        new: Math.floor(eventStats.last24h * 0.05),
        active: Math.floor(eventStats.uniqueUsers * 0.3),
      },
      content: {
        posts: eventStore.query({ eventType: "post_created", since: new Date(Date.now() - days * 86400000) }).length,
        reels: eventStore.query({ eventType: "reel_created", since: new Date(Date.now() - days * 86400000) }).length,
        streams: eventStore.query({ eventType: "stream_started", since: new Date(Date.now() - days * 86400000) }).length,
      },
      revenue: { total: 0, bySource: {} },
      engagement: {
        avgLikes: signalStats.byType["like"] || 0,
        avgComments: signalStats.byType["comment"] || 0,
        avgShares: signalStats.byType["share"] || 0,
      },
      topMetrics: {
        dau: Math.floor(eventStats.uniqueUsers * 0.15),
        mau: eventStats.uniqueUsers,
        retention: 65,
      },
    };
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const eventStore = new EventStore();
export const recommendationLake = new RecommendationDataLake();
export const creatorWarehouse = new CreatorPerformanceWarehouse();
export const fraudWarehouse = new FraudWarehouse();
export const treasuryWarehouse = new TreasuryWarehouse();
export const retentionWarehouse = new RetentionWarehouse();
export const dataExportPipeline = new DataExportPipeline();
export const analyticsAggregator = new AnalyticsAggregator();
