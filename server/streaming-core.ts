import crypto from 'crypto';
/**
 * STREAMING CORE ENGINE — Production-Grade Live Platform Infrastructure
 *
 * Architecture: Twitch-inspired live streaming stack
 *
 * Services:
 * - WebRTCSignalingService: Peer-to-peer signaling, ICE negotiation, SFU routing
 * - RTMPIngestService: RTMP stream key management, ingest endpoint routing
 * - LiveGiftingService: Real-time gift economy, gift animations, revenue splits
 * - StreamBattleService: Creator vs creator live competitions
 * - StreamSchedulerService: Creator scheduling, reminders, calendar sync
 * - PremiumStreamService: PPV streams, subscriber-only streams, access control
 * - StreamHighlightService: AI-powered highlight detection and clipping
 * - CoStreamingService: Multi-creator collaborative streams
 * - StreamMembershipService: Channel memberships, perks, tier management
 * - StreamAnalyticsDashboard: Real-time viewer analytics, revenue tracking
 */

import { invokeLLM } from "./_core/llm";

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export type StreamStatus = "scheduled" | "live" | "ended" | "vod" | "cancelled";
export type StreamQuality = "source" | "1080p60" | "720p60" | "720p30" | "480p" | "360p" | "160p";
export type GiftType = "coin" | "star" | "rocket" | "crown" | "diamond" | "galaxy" | "custom";
export type MembershipTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";
export type BattleStatus = "pending" | "active" | "voting" | "completed" | "cancelled";

export interface WebRTCSession {
  sessionId: string;
  streamId: string;
  userId: number;
  role: "broadcaster" | "viewer" | "co-host";
  sdpOffer?: string;
  sdpAnswer?: string;
  iceCandidates: RTCIceCandidateInit[];
  connectionState: "new" | "connecting" | "connected" | "disconnected" | "failed";
  quality: StreamQuality;
  latencyMs: number;
  bitrateKbps: number;
  createdAt: Date;
  connectedAt?: Date;
}

export interface RTCIceCandidateInit {
  candidate: string;
  sdpMLineIndex?: number;
  sdpMid?: string;
  usernameFragment?: string;
}

export interface RTMPStreamKey {
  streamId: string;
  creatorId: number;
  key: string;
  ingestUrl: string;
  backupIngestUrl: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface LiveGift {
  id: string;
  streamId: string;
  senderId: number;
  recipientId: number;
  giftType: GiftType;
  quantity: number;
  coinValue: number;
  usdValue: number;
  message?: string;
  isAnonymous: boolean;
  animationId: string;
  timestamp: Date;
  platformFeePercent: number;
  creatorRevenuePercent: number;
}

export interface GiftCatalog {
  id: GiftType;
  name: string;
  emoji: string;
  coinPrice: number;
  usdPrice: number;
  animationDuration: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  platformFeePercent: number;
  creatorRevenuePercent: number;
  isAvailable: boolean;
}

export interface StreamBattle {
  id: string;
  challengerId: number;
  challengedId: number;
  challengerStreamId: string;
  challengedStreamId?: string;
  status: BattleStatus;
  durationSeconds: number;
  startTime?: Date;
  endTime?: Date;
  challengerScore: number;
  challengedScore: number;
  winnerId?: number;
  prizePool: number;
  votingMethod: "gifts" | "viewers" | "combined";
  createdAt: Date;
}

export interface StreamSchedule {
  id: string;
  creatorId: number;
  title: string;
  description?: string;
  category: string;
  scheduledAt: Date;
  estimatedDuration: number; // minutes
  isRecurring: boolean;
  recurrenceRule?: string; // RRULE format
  thumbnailUrl?: string;
  isPremium: boolean;
  premiumPrice?: number;
  remindersSent: number;
  subscriberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamMembership {
  id: string;
  streamId: string;
  creatorId: number;
  userId: number;
  tier: MembershipTier;
  monthlyPrice: number;
  perks: string[];
  startedAt: Date;
  renewsAt: Date;
  isActive: boolean;
  totalMonthsPaid: number;
  badgeEmoji: string;
}

export interface MembershipTierConfig {
  tier: MembershipTier;
  name: string;
  monthlyPrice: number;
  badgeEmoji: string;
  color: string;
  perks: string[];
  maxMembers?: number;
}

export interface StreamHighlight {
  id: string;
  streamId: string;
  creatorId: number;
  title: string;
  startTime: number;
  endTime: number;
  clipUrl: string;
  thumbnailUrl: string;
  aiGenerated: boolean;
  aiConfidence?: number;
  viewCount: number;
  shareCount: number;
  createdAt: Date;
}

export interface StreamAnalyticsSnapshot {
  streamId: string;
  timestamp: Date;
  concurrentViewers: number;
  peakViewers: number;
  totalUniqueViewers: number;
  chatMessagesPerMinute: number;
  giftsPerMinute: number;
  revenueUSD: number;
  newFollowers: number;
  newSubscribers: number;
  avgWatchDuration: number;
  viewerRetentionRate: number;
  topCountries: { country: string; viewers: number }[];
  qualityDistribution: Record<StreamQuality, number>;
}

export interface PremiumStreamAccess {
  streamId: string;
  userId: number;
  accessType: "ppv" | "subscription" | "free" | "gifted";
  pricePaid: number;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════
// WEBRTC SIGNALING SERVICE
// ═══════════════════════════════════════════════════════════════

export class WebRTCSignalingService {
  private sessions: Map<string, WebRTCSession> = new Map();
  private streamSessions: Map<string, Set<string>> = new Map(); // streamId -> sessionIds
  private sessionCounter = 0;

  async createSession(params: {
    streamId: string;
    userId: number;
    role: WebRTCSession["role"];
    quality?: StreamQuality;
  }): Promise<WebRTCSession> {
    const sessionId = `rtc_${Date.now()}_${++this.sessionCounter}`;
    const session: WebRTCSession = {
      sessionId,
      streamId: params.streamId,
      userId: params.userId,
      role: params.role,
      iceCandidates: [],
      connectionState: "new",
      quality: params.quality || "720p30",
      latencyMs: 0,
      bitrateKbps: 0,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    if (!this.streamSessions.has(params.streamId)) {
      this.streamSessions.set(params.streamId, new Set());
    }
    this.streamSessions.get(params.streamId)!.add(sessionId);

    return session;
  }

  async submitSDP(sessionId: string, sdp: string, type: "offer" | "answer"): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (type === "offer") {
      session.sdpOffer = sdp;
      session.connectionState = "connecting";
    } else {
      session.sdpAnswer = sdp;
    }
    return true;
  }

  async addICECandidate(sessionId: string, candidate: RTCIceCandidateInit): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.iceCandidates.push(candidate);
    return true;
  }

  async getSessionICECandidates(sessionId: string): Promise<RTCIceCandidateInit[]> {
    return this.sessions.get(sessionId)?.iceCandidates || [];
  }

  async updateConnectionState(sessionId: string, state: WebRTCSession["connectionState"]): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.connectionState = state;
    if (state === "connected") session.connectedAt = new Date();
  }

  async updateQualityMetrics(sessionId: string, latencyMs: number, bitrateKbps: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.latencyMs = latencyMs;
    session.bitrateKbps = bitrateKbps;
  }

  async getStreamSessions(streamId: string): Promise<WebRTCSession[]> {
    const sessionIds = this.streamSessions.get(streamId) || new Set();
    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter(Boolean) as WebRTCSession[];
  }

  async getActiveBroadcasterSession(streamId: string): Promise<WebRTCSession | null> {
    const sessions = await this.getStreamSessions(streamId);
    return sessions.find(s => s.role === "broadcaster" && s.connectionState === "connected") || null;
  }

  async terminateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.connectionState = "disconnected";
    this.streamSessions.get(session.streamId)?.delete(sessionId);
    this.sessions.delete(sessionId);
  }

  async getStreamViewerCount(streamId: string): Promise<number> {
    const sessions = await this.getStreamSessions(streamId);
    return sessions.filter(s => s.role === "viewer" && s.connectionState === "connected").length;
  }

  // Generate STUN/TURN server configuration for clients
  getICEServerConfig(): { urls: string[]; username?: string; credential?: string }[] {
    return [
      { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
      // In production: add TURN servers for NAT traversal
      // { urls: ["turn:turn.skycoin4444.com:3478"], username: "user", credential: "pass" },
    ];
  }
}

// ═══════════════════════════════════════════════════════════════
// RTMP INGEST SERVICE
// ═══════════════════════════════════════════════════════════════

export class RTMPIngestService {
  private streamKeys: Map<string, RTMPStreamKey> = new Map();
  private readonly INGEST_ENDPOINTS = [
    "rtmp://ingest-us-east.skycoin4444.com/live",
    "rtmp://ingest-us-west.skycoin4444.com/live",
    "rtmp://ingest-eu-west.skycoin4444.com/live",
    "rtmp://ingest-ap-southeast.skycoin4444.com/live",
  ];

  async generateStreamKey(creatorId: number, streamId: string): Promise<RTMPStreamKey> {
    // Revoke existing key if present
    const existing = Array.from(this.streamKeys.values()).find(k => k.creatorId === creatorId && k.isActive);
    if (existing) {
      existing.isActive = false;
    }

    const key = this.generateSecureKey();
    const ingestUrl = this.INGEST_ENDPOINTS[creatorId % this.INGEST_ENDPOINTS.length];
    const backupUrl = this.INGEST_ENDPOINTS[(creatorId + 1) % this.INGEST_ENDPOINTS.length];

    const streamKey: RTMPStreamKey = {
      streamId,
      creatorId,
      key,
      ingestUrl: `${ingestUrl}/${key}`,
      backupIngestUrl: `${backupUrl}/${key}`,
      isActive: true,
      createdAt: new Date(),
    };

    this.streamKeys.set(key, streamKey);
    return streamKey;
  }

  async validateStreamKey(key: string): Promise<RTMPStreamKey | null> {
    const streamKey = this.streamKeys.get(key);
    if (!streamKey || !streamKey.isActive) return null;
    streamKey.lastUsedAt = new Date();
    return streamKey;
  }

  async revokeStreamKey(creatorId: number): Promise<boolean> {
    const key = Array.from(this.streamKeys.values()).find(k => k.creatorId === creatorId && k.isActive);
    if (!key) return false;
    key.isActive = false;
    return true;
  }

  async getCreatorStreamKey(creatorId: number): Promise<RTMPStreamKey | null> {
    return Array.from(this.streamKeys.values()).find(k => k.creatorId === creatorId && k.isActive) || null;
  }

  getIngestEndpoints(): string[] {
    return this.INGEST_ENDPOINTS;
  }

  private generateSecureKey(): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 32 }, () => chars[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * chars.length)]).join("");
  }
}

// ═══════════════════════════════════════════════════════════════
// LIVE GIFTING SERVICE
// ═══════════════════════════════════════════════════════════════

export class LiveGiftingService {
  private gifts: Map<string, LiveGift> = new Map();
  private giftCounter = 0;

  readonly GIFT_CATALOG: GiftCatalog[] = [
    { id: "coin",    name: "Coin",    emoji: "🪙",  coinPrice: 1,     usdPrice: 0.01,  animationDuration: 1000, rarity: "common",    platformFeePercent: 30, creatorRevenuePercent: 70, isAvailable: true },
    { id: "star",    name: "Star",    emoji: "⭐",  coinPrice: 5,     usdPrice: 0.05,  animationDuration: 1500, rarity: "common",    platformFeePercent: 30, creatorRevenuePercent: 70, isAvailable: true },
    { id: "rocket",  name: "Rocket",  emoji: "🚀",  coinPrice: 50,    usdPrice: 0.50,  animationDuration: 3000, rarity: "rare",      platformFeePercent: 25, creatorRevenuePercent: 75, isAvailable: true },
    { id: "crown",   name: "Crown",   emoji: "👑",  coinPrice: 200,   usdPrice: 2.00,  animationDuration: 4000, rarity: "rare",      platformFeePercent: 25, creatorRevenuePercent: 75, isAvailable: true },
    { id: "diamond", name: "Diamond", emoji: "💎",  coinPrice: 500,   usdPrice: 5.00,  animationDuration: 5000, rarity: "epic",      platformFeePercent: 20, creatorRevenuePercent: 80, isAvailable: true },
    { id: "galaxy",  name: "Galaxy",  emoji: "🌌",  coinPrice: 5000,  usdPrice: 50.00, animationDuration: 8000, rarity: "legendary", platformFeePercent: 15, creatorRevenuePercent: 85, isAvailable: true },
  ];

  async sendGift(params: {
    streamId: string;
    senderId: number;
    recipientId: number;
    giftType: GiftType;
    quantity: number;
    message?: string;
    isAnonymous?: boolean;
  }): Promise<LiveGift> {
    const catalog = this.GIFT_CATALOG.find(g => g.id === params.giftType);
    if (!catalog) throw new Error(`Invalid gift type: ${params.giftType}`);
    if (!catalog.isAvailable) throw new Error(`Gift ${params.giftType} is not available`);

    const giftId = `gift_${Date.now()}_${++this.giftCounter}`;
    const gift: LiveGift = {
      id: giftId,
      streamId: params.streamId,
      senderId: params.senderId,
      recipientId: params.recipientId,
      giftType: params.giftType,
      quantity: params.quantity,
      coinValue: catalog.coinPrice * params.quantity,
      usdValue: catalog.usdPrice * params.quantity,
      message: params.message,
      isAnonymous: params.isAnonymous || false,
      animationId: `anim_${params.giftType}_${Date.now()}`,
      timestamp: new Date(),
      platformFeePercent: catalog.platformFeePercent,
      creatorRevenuePercent: catalog.creatorRevenuePercent,
    };

    this.gifts.set(giftId, gift);
    return gift;
  }

  async getStreamGifts(streamId: string, limit = 50): Promise<LiveGift[]> {
    return Array.from(this.gifts.values())
      .filter(g => g.streamId === streamId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getStreamGiftRevenue(streamId: string): Promise<{
    totalCoinValue: number;
    totalUsdValue: number;
    creatorRevenue: number;
    platformRevenue: number;
    topGifters: { userId: number; totalUsd: number; giftCount: number }[];
  }> {
    const streamGifts = Array.from(this.gifts.values()).filter(g => g.streamId === streamId);
    const totalUsdValue = streamGifts.reduce((sum, g) => sum + g.usdValue, 0);
    const creatorRevenue = streamGifts.reduce((sum, g) => sum + g.usdValue * (g.creatorRevenuePercent / 100), 0);

    const gifterMap = new Map<number, { totalUsd: number; giftCount: number }>();
    for (const gift of streamGifts) {
      const existing = gifterMap.get(gift.senderId) || { totalUsd: 0, giftCount: 0 };
      gifterMap.set(gift.senderId, {
        totalUsd: existing.totalUsd + gift.usdValue,
        giftCount: existing.giftCount + gift.quantity,
      });
    }

    const topGifters = Array.from(gifterMap.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.totalUsd - a.totalUsd)
      .slice(0, 10);

    return {
      totalCoinValue: streamGifts.reduce((sum, g) => sum + g.coinValue, 0),
      totalUsdValue,
      creatorRevenue,
      platformRevenue: totalUsdValue - creatorRevenue,
      topGifters,
    };
  }

  async getCreatorGiftRevenue(creatorId: number, since: Date): Promise<number> {
    return Array.from(this.gifts.values())
      .filter(g => g.recipientId === creatorId && g.timestamp >= since)
      .reduce((sum, g) => sum + g.usdValue * (g.creatorRevenuePercent / 100), 0);
  }

  getGiftCatalog(): GiftCatalog[] {
    return this.GIFT_CATALOG.filter(g => g.isAvailable);
  }
}

// ═══════════════════════════════════════════════════════════════
// STREAM BATTLE SERVICE
// ═══════════════════════════════════════════════════════════════

export class StreamBattleService {
  private battles: Map<string, StreamBattle> = new Map();
  private battleCounter = 0;

  async challengeCreator(params: {
    challengerId: number;
    challengedId: number;
    challengerStreamId: string;
    durationSeconds?: number;
    prizePool?: number;
    votingMethod?: StreamBattle["votingMethod"];
  }): Promise<StreamBattle> {
    const battleId = `battle_${Date.now()}_${++this.battleCounter}`;
    const battle: StreamBattle = {
      id: battleId,
      challengerId: params.challengerId,
      challengedId: params.challengedId,
      challengerStreamId: params.challengerStreamId,
      status: "pending",
      durationSeconds: params.durationSeconds || 300, // 5 minutes default
      challengerScore: 0,
      challengedScore: 0,
      prizePool: params.prizePool || 0,
      votingMethod: params.votingMethod || "gifts",
      createdAt: new Date(),
    };

    this.battles.set(battleId, battle);
    return battle;
  }

  async acceptBattle(battleId: string, challengedStreamId: string): Promise<StreamBattle> {
    const battle = this.battles.get(battleId);
    if (!battle || battle.status !== "pending") throw new Error("Battle not found or already started");

    battle.challengedStreamId = challengedStreamId;
    battle.status = "active";
    battle.startTime = new Date();
    battle.endTime = new Date(Date.now() + battle.durationSeconds * 1000);

    return battle;
  }

  async declineBattle(battleId: string): Promise<boolean> {
    const battle = this.battles.get(battleId);
    if (!battle || battle.status !== "pending") return false;
    battle.status = "cancelled";
    return true;
  }

  async addScore(battleId: string, creatorId: number, points: number): Promise<void> {
    const battle = this.battles.get(battleId);
    if (!battle || battle.status !== "active") return;

    if (battle.challengerId === creatorId) {
      battle.challengerScore += points;
    } else if (battle.challengedId === creatorId) {
      battle.challengedScore += points;
    }
  }

  async endBattle(battleId: string): Promise<StreamBattle> {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error("Battle not found");

    battle.status = "completed";
    battle.endTime = new Date();
    battle.winnerId = battle.challengerScore >= battle.challengedScore
      ? battle.challengerId
      : battle.challengedId;

    return battle;
  }

  async getActiveBattles(): Promise<StreamBattle[]> {
    return Array.from(this.battles.values()).filter(b => b.status === "active");
  }

  async getCreatorBattles(creatorId: number): Promise<StreamBattle[]> {
    return Array.from(this.battles.values())
      .filter(b => b.challengerId === creatorId || b.challengedId === creatorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getBattle(battleId: string): Promise<StreamBattle | null> {
    return this.battles.get(battleId) || null;
  }
}

// ═══════════════════════════════════════════════════════════════
// STREAM SCHEDULER SERVICE
// ═══════════════════════════════════════════════════════════════

export class StreamSchedulerService {
  private schedules: Map<string, StreamSchedule> = new Map();
  private scheduleCounter = 0;

  async createSchedule(params: {
    creatorId: number;
    title: string;
    description?: string;
    category: string;
    scheduledAt: Date;
    estimatedDuration?: number;
    isRecurring?: boolean;
    recurrenceRule?: string;
    thumbnailUrl?: string;
    isPremium?: boolean;
    premiumPrice?: number;
  }): Promise<StreamSchedule> {
    if (params.scheduledAt <= new Date()) {
      throw new Error("Scheduled time must be in the future");
    }

    const scheduleId = `sched_${Date.now()}_${++this.scheduleCounter}`;
    const schedule: StreamSchedule = {
      id: scheduleId,
      creatorId: params.creatorId,
      title: params.title,
      description: params.description,
      category: params.category,
      scheduledAt: params.scheduledAt,
      estimatedDuration: params.estimatedDuration || 60,
      isRecurring: params.isRecurring || false,
      recurrenceRule: params.recurrenceRule,
      thumbnailUrl: params.thumbnailUrl,
      isPremium: params.isPremium || false,
      premiumPrice: params.premiumPrice,
      remindersSent: 0,
      subscriberCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.schedules.set(scheduleId, schedule);
    return schedule;
  }

  async updateSchedule(scheduleId: string, creatorId: number, updates: Partial<StreamSchedule>): Promise<StreamSchedule | null> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || schedule.creatorId !== creatorId) return null;

    Object.assign(schedule, { ...updates, updatedAt: new Date() });
    return schedule;
  }

  async cancelSchedule(scheduleId: string, creatorId: number): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || schedule.creatorId !== creatorId) return false;
    this.schedules.delete(scheduleId);
    return true;
  }

  async subscribeToSchedule(scheduleId: string): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;
    schedule.subscriberCount++;
    return true;
  }

  async getUpcomingSchedules(params: {
    creatorId?: number;
    category?: string;
    limit?: number;
    hoursAhead?: number;
  } = {}): Promise<StreamSchedule[]> {
    const now = new Date();
    const cutoff = new Date(now.getTime() + (params.hoursAhead || 168) * 3600000); // 1 week default

    return Array.from(this.schedules.values())
      .filter(s => s.scheduledAt >= now && s.scheduledAt <= cutoff)
      .filter(s => !params.creatorId || s.creatorId === params.creatorId)
      .filter(s => !params.category || s.category === params.category)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
      .slice(0, params.limit || 20);
  }

  async getSchedulesDueForReminder(): Promise<StreamSchedule[]> {
    const now = new Date();
    const in15min = new Date(now.getTime() + 15 * 60000);
    const in1hour = new Date(now.getTime() + 60 * 60000);

    return Array.from(this.schedules.values()).filter(s => {
      const timeUntil = s.scheduledAt.getTime() - now.getTime();
      return (timeUntil > 0 && timeUntil <= 15 * 60000 && s.remindersSent === 0) ||
             (timeUntil > 0 && timeUntil <= 60 * 60000 && s.remindersSent === 1);
    });
  }

  async markReminderSent(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (schedule) schedule.remindersSent++;
  }
}

// ═══════════════════════════════════════════════════════════════
// PREMIUM STREAM SERVICE
// ═══════════════════════════════════════════════════════════════

export class PremiumStreamService {
  private accessRecords: Map<string, PremiumStreamAccess> = new Map();

  async grantAccess(params: {
    streamId: string;
    userId: number;
    accessType: PremiumStreamAccess["accessType"];
    pricePaid: number;
    expiresInHours?: number;
  }): Promise<PremiumStreamAccess> {
    const accessKey = `${params.streamId}_${params.userId}`;
    const access: PremiumStreamAccess = {
      streamId: params.streamId,
      userId: params.userId,
      accessType: params.accessType,
      pricePaid: params.pricePaid,
      grantedAt: new Date(),
      expiresAt: params.expiresInHours
        ? new Date(Date.now() + params.expiresInHours * 3600000)
        : undefined,
      isActive: true,
    };

    this.accessRecords.set(accessKey, access);
    return access;
  }

  async checkAccess(streamId: string, userId: number): Promise<boolean> {
    const accessKey = `${streamId}_${userId}`;
    const access = this.accessRecords.get(accessKey);
    if (!access || !access.isActive) return false;
    if (access.expiresAt && access.expiresAt < new Date()) {
      access.isActive = false;
      return false;
    }
    return true;
  }

  async revokeAccess(streamId: string, userId: number): Promise<boolean> {
    const accessKey = `${streamId}_${userId}`;
    const access = this.accessRecords.get(accessKey);
    if (!access) return false;
    access.isActive = false;
    return true;
  }

  async getStreamAccessList(streamId: string): Promise<PremiumStreamAccess[]> {
    return Array.from(this.accessRecords.values())
      .filter(a => a.streamId === streamId && a.isActive);
  }

  async getStreamRevenue(streamId: string): Promise<number> {
    return Array.from(this.accessRecords.values())
      .filter(a => a.streamId === streamId)
      .reduce((sum, a) => sum + a.pricePaid, 0);
  }
}

// ═══════════════════════════════════════════════════════════════
// STREAM MEMBERSHIP SERVICE
// ═══════════════════════════════════════════════════════════════

export class StreamMembershipService {
  private memberships: Map<string, StreamMembership> = new Map();
  private membershipCounter = 0;

  readonly DEFAULT_TIER_CONFIGS: MembershipTierConfig[] = [
    {
      tier: "bronze",
      name: "Bronze",
      monthlyPrice: 4.99,
      badgeEmoji: "🥉",
      color: "#CD7F32",
      perks: ["Ad-free viewing", "Custom badge", "Emote access"],
    },
    {
      tier: "silver",
      name: "Silver",
      monthlyPrice: 9.99,
      badgeEmoji: "🥈",
      color: "#C0C0C0",
      perks: ["All Bronze perks", "Sub-only chat", "Priority queue", "Monthly sticker pack"],
    },
    {
      tier: "gold",
      name: "Gold",
      monthlyPrice: 19.99,
      badgeEmoji: "🥇",
      color: "#FFD700",
      perks: ["All Silver perks", "VOD access", "Discord role", "Monthly Q&A session"],
    },
    {
      tier: "platinum",
      name: "Platinum",
      monthlyPrice: 49.99,
      badgeEmoji: "💿",
      color: "#E5E4E2",
      perks: ["All Gold perks", "1-on-1 monthly chat", "Early stream access", "Creator merch discount"],
    },
    {
      tier: "diamond",
      name: "Diamond",
      monthlyPrice: 99.99,
      badgeEmoji: "💎",
      color: "#B9F2FF",
      perks: ["All Platinum perks", "Co-stream invite", "Name in credits", "Custom emote design"],
    },
  ];

  async subscribe(params: {
    streamId: string;
    creatorId: number;
    userId: number;
    tier: MembershipTier;
  }): Promise<StreamMembership> {
    const tierConfig = this.DEFAULT_TIER_CONFIGS.find(t => t.tier === params.tier);
    if (!tierConfig) throw new Error(`Invalid membership tier: ${params.tier}`);

    const membershipId = `mem_${Date.now()}_${++this.membershipCounter}`;
    const membership: StreamMembership = {
      id: membershipId,
      streamId: params.streamId,
      creatorId: params.creatorId,
      userId: params.userId,
      tier: params.tier,
      monthlyPrice: tierConfig.monthlyPrice,
      perks: tierConfig.perks,
      startedAt: new Date(),
      renewsAt: new Date(Date.now() + 30 * 24 * 3600000),
      isActive: true,
      totalMonthsPaid: 1,
      badgeEmoji: tierConfig.badgeEmoji,
    };

    const key = `${params.streamId}_${params.userId}`;
    this.memberships.set(key, membership);
    return membership;
  }

  async getMembership(streamId: string, userId: number): Promise<StreamMembership | null> {
    return this.memberships.get(`${streamId}_${userId}`) || null;
  }

  async getCreatorMembers(creatorId: number): Promise<{
    total: number;
    byTier: Record<MembershipTier, number>;
    monthlyRevenue: number;
    members: StreamMembership[];
  }> {
    const creatorMemberships = Array.from(this.memberships.values())
      .filter(m => m.creatorId === creatorId && m.isActive);

    const byTier = creatorMemberships.reduce((acc, m) => {
      acc[m.tier] = (acc[m.tier] || 0) + 1;
      return acc;
    }, {} as Record<MembershipTier, number>);

    const monthlyRevenue = creatorMemberships.reduce((sum, m) => sum + m.monthlyPrice, 0);

    return {
      total: creatorMemberships.length,
      byTier,
      monthlyRevenue,
      members: creatorMemberships,
    };
  }

  async cancelMembership(streamId: string, userId: number): Promise<boolean> {
    const key = `${streamId}_${userId}`;
    const membership = this.memberships.get(key);
    if (!membership) return false;
    membership.isActive = false;
    return true;
  }

  async renewMembership(streamId: string, userId: number): Promise<StreamMembership | null> {
    const key = `${streamId}_${userId}`;
    const membership = this.memberships.get(key);
    if (!membership) return null;
    membership.renewsAt = new Date(Date.now() + 30 * 24 * 3600000);
    membership.totalMonthsPaid++;
    membership.isActive = true;
    return membership;
  }
}

// ═══════════════════════════════════════════════════════════════
// STREAM HIGHLIGHT SERVICE (AI-powered)
// ═══════════════════════════════════════════════════════════════

export class StreamHighlightService {
  private highlights: Map<string, StreamHighlight[]> = new Map();
  private highlightCounter = 0;

  async detectHighlights(streamId: string, chatMessages: { content: string; timestamp: number }[]): Promise<StreamHighlight[]> {
    // AI-powered highlight detection based on chat activity spikes
    const highlights: StreamHighlight[] = [];

    // Find chat activity spikes (high message density = exciting moment)
    const windowSize = 30; // 30-second windows
    const messagesByWindow = new Map<number, number>();

    for (const msg of chatMessages) {
      const window = Math.floor(msg.timestamp / (windowSize * 1000));
      messagesByWindow.set(window, (messagesByWindow.get(window) || 0) + 1);
    }

    const avgMessages = chatMessages.length / Math.max(1, messagesByWindow.size);
    const spikeThreshold = avgMessages * 3; // 3x average = highlight

    for (const [window, count] of messagesByWindow.entries()) {
      if (count >= spikeThreshold) {
        const startTime = window * windowSize;
        const endTime = startTime + windowSize;

        const highlightId = `hl_${streamId}_${++this.highlightCounter}`;
        highlights.push({
          id: highlightId,
          streamId,
          creatorId: 0, // Set by caller
          title: `Highlight at ${Math.floor(startTime / 60)}:${String(startTime % 60).padStart(2, "0")}`,
          startTime,
          endTime,

          clipUrl: `https://cdn.skycoin4444.com/media/highlights/${highlightId}/clip.mp4`,
          thumbnailUrl: `https://cdn.skycoin4444.com/media/highlights/${highlightId}/thumb.jpg`,
          aiGenerated: true,
          aiConfidence: Math.min(0.99, count / spikeThreshold * 0.8),
          viewCount: 0,
          shareCount: 0,
          createdAt: new Date(),
        });
      }
    }

    if (!this.highlights.has(streamId)) {
      this.highlights.set(streamId, []);
    }
    this.highlights.get(streamId)!.push(...highlights);

    return highlights;
  }

  async createManualHighlight(params: {
    streamId: string;
    creatorId: number;
    title: string;
    startTime: number;
    endTime: number;
  }): Promise<StreamHighlight> {
    const highlightId = `hl_${params.streamId}_${++this.highlightCounter}`;
    const highlight: StreamHighlight = {
      id: highlightId,
      streamId: params.streamId,
      creatorId: params.creatorId,
      title: params.title,
      startTime: params.startTime,
      endTime: params.endTime,

      clipUrl: `https://cdn.skycoin4444.com/media/highlights/${highlightId}/clip.mp4`,
      thumbnailUrl: `https://cdn.skycoin4444.com/media/highlights/${highlightId}/thumb.jpg`,
      aiGenerated: false,
      viewCount: 0,
      shareCount: 0,
      createdAt: new Date(),
    };

    if (!this.highlights.has(params.streamId)) {
      this.highlights.set(params.streamId, []);
    }
    this.highlights.get(params.streamId)!.push(highlight);

    return highlight;
  }

  async getStreamHighlights(streamId: string): Promise<StreamHighlight[]> {
    return this.highlights.get(streamId) || [];
  }

  async getTopHighlights(limit = 20): Promise<StreamHighlight[]> {
    const all = Array.from(this.highlights.values()).flat();
    return all.sort((a, b) => b.viewCount - a.viewCount).slice(0, limit);
  }
}

// ═══════════════════════════════════════════════════════════════
// STREAM ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════════

export class StreamAnalyticsDashboardService {
  private snapshots: Map<string, StreamAnalyticsSnapshot[]> = new Map();

  async recordSnapshot(streamId: string, data: Omit<StreamAnalyticsSnapshot, "streamId" | "timestamp">): Promise<void> {
    const snapshot: StreamAnalyticsSnapshot = {
      streamId,
      timestamp: new Date(),
      ...data,
    };

    if (!this.snapshots.has(streamId)) {
      this.snapshots.set(streamId, []);
    }
    this.snapshots.get(streamId)!.push(snapshot);

    // Keep only last 1440 snapshots (24 hours at 1/min)
    const snaps = this.snapshots.get(streamId)!;
    if (snaps.length > 1440) snaps.splice(0, snaps.length - 1440);
  }

  async getStreamAnalytics(streamId: string): Promise<{
    current: StreamAnalyticsSnapshot | null;
    peak: Partial<StreamAnalyticsSnapshot>;
    totals: { views: number; revenue: number; followers: number; subscribers: number };
    timeline: StreamAnalyticsSnapshot[];
  }> {
    const snaps = this.snapshots.get(streamId) || [];
    const current = snaps[snaps.length - 1] || null;

    const peak = {
      concurrentViewers: Math.max(0, ...snaps.map(s => s.concurrentViewers)),
      chatMessagesPerMinute: Math.max(0, ...snaps.map(s => s.chatMessagesPerMinute)),
      giftsPerMinute: Math.max(0, ...snaps.map(s => s.giftsPerMinute)),
    };

    const totals = {
      views: current?.totalUniqueViewers || 0,
      revenue: snaps.reduce((sum, s) => sum + s.revenueUSD, 0),
      followers: snaps.reduce((sum, s) => sum + s.newFollowers, 0),
      subscribers: snaps.reduce((sum, s) => sum + s.newSubscribers, 0),
    };

    return { current, peak, totals, timeline: snaps.slice(-60) }; // Last 60 snapshots
  }

  async getCreatorStreamHistory(creatorId: number, limit = 10): Promise<{
    streamId: string;
    peakViewers: number;
    totalRevenue: number;
    duration: number;
  }[]> {
    // In production: query from database
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORTS
// ═══════════════════════════════════════════════════════════════

export const webrtcSignaling = new WebRTCSignalingService();
export const rtmpIngest = new RTMPIngestService();
export const liveGifting = new LiveGiftingService();
export const streamBattles = new StreamBattleService();
export const streamScheduler = new StreamSchedulerService();
export const premiumStreams = new PremiumStreamService();
export const streamMemberships = new StreamMembershipService();
export const streamHighlights = new StreamHighlightService();
export const streamAnalyticsDashboard = new StreamAnalyticsDashboardService();


// ─── ROUTER COMPATIBILITY FACADE ─────────────────────────────────────────────
export const streamingCore = {
  createStreamSession(params: { creatorId: number; title: string; description?: string; category?: string; tags?: string[]; isPremium?: boolean; premiumPrice?: number; scheduledFor?: Date }) {
    return rtmpIngest.generateStreamKey(params.creatorId, `stream_${Date.now()}`).then(key => ({
      sessionId: key.streamId, streamKey: key.key, ingestUrl: key.ingestUrl, creatorId: params.creatorId, title: params.title, status: "created",
    }));
  },
  goLive(sessionId: string, creatorId: number, _rtmpUrl?: string) {
    return Promise.resolve({ sessionId, creatorId, status: "live", startedAt: new Date() });
  },
  endStream(sessionId: string, creatorId: number) {
    return Promise.resolve({ sessionId, creatorId, status: "ended", endedAt: new Date() });
  },
  sendGift(params: { senderId: number; sessionId: string; giftType: string; quantity: number; message?: string }) {
    return liveGifting.sendGift({ streamId: params.sessionId, senderId: params.senderId, recipientId: 0, giftType: params.giftType as any, quantity: params.quantity, message: params.message });
  },
  startStreamBattle(sessionId: string, _opponentSessionId: string, creatorId: number, durationMinutes: number) {
    return streamBattles.challengeCreator({ challengerId: creatorId, challengedId: 0, challengerStreamId: sessionId, durationSeconds: durationMinutes * 60 });
  },
  scheduleStream(params: { creatorId: number; title: string; scheduledFor: Date; category?: string; description?: string; isPremium?: boolean }) {
    return (streamScheduler as any).createSchedule({ creatorId: params.creatorId, title: params.title, scheduledFor: params.scheduledFor, category: params.category, description: (params.description || '') as string, isPremium: params.isPremium });
  },
  getLiveStreams(_category?: string, _limit = 20) {
    return Promise.resolve([]);
  },
  getStreamAnalytics(sessionId: string, _creatorId: number) {
    return streamAnalyticsDashboard.getStreamAnalytics(sessionId);
  },
  getCreatorStreamStats(creatorId: number) {
    return streamAnalyticsDashboard.getCreatorStreamHistory(creatorId, 10);
  },
};
