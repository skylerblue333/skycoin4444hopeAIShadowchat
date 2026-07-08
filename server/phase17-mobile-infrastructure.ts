import crypto from 'crypto';
/**
 * PHASE 17 — MOBILE DOMINATION
 * Push Notifications, Offline Caching, Media Compression,
 * Mobile Streaming Optimization, Mobile Analytics
 */

// ─── PUSH NOTIFICATION SYSTEM ────────────────────────────────────────────────

export interface PushDevice {
  id: string;
  userId: number;
  platform: "ios" | "android" | "web";
  pushToken: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  isActive: boolean;
  lastSeenAt: Date;
  registeredAt: Date;
}

export interface PushNotification {
  id: string;
  userId: number;
  deviceId?: string;
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  data?: Record<string, string>;
  category: "social" | "creator" | "transaction" | "stream" | "community" | "system" | "marketing" | "gaming";
  priority: "low" | "normal" | "high" | "critical";
  status: "queued" | "sent" | "delivered" | "failed" | "clicked";
  sentAt?: Date;
  deliveredAt?: Date;
  clickedAt?: Date;
  createdAt: Date;
}

export interface PushCampaign {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  targetSegment: "all" | "active_creators" | "inactive_7d" | "high_value" | "new_users" | "custom";
  customFilter?: Record<string, unknown>;
  scheduledFor?: Date;
  sentCount: number;
  deliveredCount: number;
  clickedCount: number;
  status: "draft" | "scheduled" | "sending" | "completed" | "cancelled";
  createdAt: Date;
}

export interface NotificationPreferences {
  userId: number;
  social: boolean;
  creator: boolean;
  transaction: boolean;
  stream: boolean;
  community: boolean;
  marketing: boolean;
  gaming: boolean;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  timezone: string;
  updatedAt: Date;
}

// ─── OFFLINE CACHING SYSTEM ──────────────────────────────────────────────────

export interface CachePolicy {
  contentType: "feed" | "profile" | "community" | "stream_metadata" | "nft" | "marketplace" | "wallet";
  ttlSeconds: number;
  maxSizeKB: number;
  syncOnConnect: boolean;
  compressionEnabled: boolean;
  priority: "critical" | "high" | "normal" | "low";
}

export interface OfflineCacheEntry {
  id: string;
  userId: number;
  contentType: CachePolicy["contentType"];
  contentId: string;
  data: string;
  sizeKB: number;
  cachedAt: Date;
  expiresAt: Date;
  syncStatus: "synced" | "pending_sync" | "conflict";
  version: number;
}

export interface SyncQueueEntry {
  id: string;
  userId: number;
  action: "create" | "update" | "delete" | "like" | "comment" | "tip";
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  processedAt?: Date;
}

// ─── MEDIA COMPRESSION SYSTEM ────────────────────────────────────────────────

export interface MediaCompressionJob {
  id: string;
  userId: number;
  inputUrl: string;
  outputUrl?: string;
  mediaType: "image" | "video" | "audio";
  inputSizeKB: number;
  outputSizeKB?: number;
  compressionRatio?: number;
  targetQuality: "low" | "medium" | "high" | "adaptive";
  targetPlatform: "mobile" | "desktop" | "thumbnail" | "preview";
  status: "queued" | "processing" | "completed" | "failed";
  processingTimeMs?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface AdaptiveBitrateProfile {
  id: string;
  streamId: string;
  profiles: Array<{
    resolution: string;
    bitrate: number;
    fps: number;
    codec: "h264" | "h265" | "vp9" | "av1";
    url: string;
  }>;
  currentProfile: string;
  networkCondition: "excellent" | "good" | "fair" | "poor";
  bufferHealth: number;
  droppedFrames: number;
  updatedAt: Date;
}

// ─── MOBILE STREAMING OPTIMIZATION ──────────────────────────────────────────

export interface MobileStreamSession {
  id: string;
  userId: number;
  streamId: string;
  deviceType: "ios" | "android";
  networkType: "wifi" | "5g" | "4g" | "3g" | "2g";
  signalStrength: number;
  currentBitrate: number;
  targetBitrate: number;
  bufferSize: number;
  latencyMs: number;
  qualityScore: number;
  adaptations: Array<{ timestamp: Date; fromBitrate: number; toBitrate: number; reason: string }>;
  startedAt: Date;
  updatedAt: Date;
}

export interface MobileStreamMetrics {
  sessionId: string;
  avgBitrate: number;
  peakBitrate: number;
  minBitrate: number;
  avgLatency: number;
  bufferEvents: number;
  qualityChanges: number;
  totalDataMB: number;
  watchTimeSeconds: number;
  qualityScore: number;
}

// ─── MOBILE ANALYTICS ────────────────────────────────────────────────────────

export interface MobileAppEvent {
  id: string;
  userId: number;
  sessionId: string;
  eventType: string;
  eventCategory: "navigation" | "interaction" | "performance" | "error" | "conversion";
  properties: Record<string, unknown>;
  platform: "ios" | "android";
  appVersion: string;
  screenName: string;
  timestamp: Date;
}

export interface MobileSessionMetrics {
  sessionId: string;
  userId: number;
  platform: "ios" | "android";
  appVersion: string;
  deviceModel: string;
  osVersion: string;
  sessionDurationSeconds: number;
  screenViews: number;
  interactions: number;
  crashes: number;
  networkRequests: number;
  avgResponseTimeMs: number;
  startedAt: Date;
  endedAt?: Date;
}

export interface MobilePerformanceReport {
  period: string;
  platform: "ios" | "android" | "both";
  avgSessionDuration: number;
  crashRate: number;
  avgLoadTimeMs: number;
  avgApiResponseMs: number;
  screenFlowCompletion: Record<string, number>;
  topCrashReasons: Array<{ reason: string; count: number; affectedUsers: number }>;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _pushDevices = new Map<string, PushDevice>();
const _pushDevicesByUser = new Map<number, Set<string>>();
const _pushNotifications = new Map<string, PushNotification>();
const _pushCampaigns = new Map<string, PushCampaign>();
const _notificationPrefs = new Map<number, NotificationPreferences>();
const _cachePolicies = new Map<string, CachePolicy>();
const _offlineCache = new Map<string, OfflineCacheEntry>();
const _syncQueue = new Map<string, SyncQueueEntry>();
const _compressionJobs = new Map<string, MediaCompressionJob>();
const _abrProfiles = new Map<string, AdaptiveBitrateProfile>();
const _mobileStreamSessions = new Map<string, MobileStreamSession>();
const _mobileEvents: MobileAppEvent[] = [];
const _mobileSessions = new Map<string, MobileSessionMetrics>();

// ─── PUSH NOTIFICATION ENGINE ────────────────────────────────────────────────

export const pushNotificationEngine = {
  registerDevice(params: Omit<PushDevice, "id" | "isActive" | "lastSeenAt" | "registeredAt">): PushDevice {
    const id = `dev_${params.userId}_${params.platform}_${Date.now()}`;
    const device: PushDevice = {
      ...params, id,
      isActive: true,
      lastSeenAt: new Date(),
      registeredAt: new Date(),
    };
    _pushDevices.set(id, device);
    if (!_pushDevicesByUser.has(params.userId)) {
      _pushDevicesByUser.set(params.userId, new Set());
    }
    _pushDevicesByUser.get(params.userId)!.add(id);
    return device;
  },

  deregisterDevice(deviceId: string): boolean {
    const device = _pushDevices.get(deviceId);
    if (!device) return false;
    device.isActive = false;
    return true;
  },

  getUserDevices(userId: number): PushDevice[] {
    const ids = _pushDevicesByUser.get(userId) ?? new Set();
    return Array.from(ids)
      .map(id => _pushDevices.get(id)!)
      .filter(Boolean)
      .filter(d => d.isActive);
  },

  sendNotification(params: Omit<PushNotification, "id" | "status" | "createdAt">): PushNotification {
    const id = `push_${params.userId}_${Date.now()}`;
    const prefs = _notificationPrefs.get(params.userId);
    if (prefs && !prefs[params.category as keyof NotificationPreferences]) {
      const notification: PushNotification = {
        ...params, id,
        status: "failed",
        createdAt: new Date(),
      };
      _pushNotifications.set(id, notification);
      return notification;
    }
    const notification: PushNotification = {
      ...params, id,
      status: "queued",
      createdAt: new Date(),
    };
    _pushNotifications.set(id, notification);
    // Simulate delivery
    notification.status = "sent";
    notification.sentAt = new Date();
    notification.status = "delivered";
    notification.deliveredAt = new Date();
    return notification;
  },

  sendBulkNotification(userIds: number[], params: Omit<PushNotification, "id" | "userId" | "status" | "createdAt">): { sent: number; failed: number } {
    let sent = 0, failed = 0;
    for (const userId of userIds) {
      const result = this.sendNotification({ ...params, userId });
      if (result.status === "delivered") sent++;
      else failed++;
    }
    return { sent, failed };
  },

  createCampaign(params: Omit<PushCampaign, "id" | "sentCount" | "deliveredCount" | "clickedCount" | "createdAt">): PushCampaign {
    const id = `camp_${Date.now()}`;
    const campaign: PushCampaign = {
      ...params, id,
      sentCount: 0,
      deliveredCount: 0,
      clickedCount: 0,
      createdAt: new Date(),
    };
    _pushCampaigns.set(id, campaign);
    return campaign;
  },

  recordNotificationClick(notificationId: string): PushNotification | null {
    const n = _pushNotifications.get(notificationId);
    if (!n) return null;
    n.status = "clicked";
    n.clickedAt = new Date();
    return n;
  },

  setNotificationPreferences(userId: number, prefs: Partial<Omit<NotificationPreferences, "userId" | "updatedAt">>): NotificationPreferences {
    const existing = _notificationPrefs.get(userId) ?? {
      userId,
      social: true, creator: true, transaction: true, stream: true,
      community: true, marketing: false, gaming: true,
      timezone: "UTC",
      updatedAt: new Date(),
    };
    const updated = { ...existing, ...prefs, userId, updatedAt: new Date() };
    _notificationPrefs.set(userId, updated);
    return updated;
  },

  getNotificationPreferences(userId: number): NotificationPreferences {
    return _notificationPrefs.get(userId) ?? {
      userId,
      social: true, creator: true, transaction: true, stream: true,
      community: true, marketing: false, gaming: true,
      timezone: "UTC",
      updatedAt: new Date(),
    };
  },

  getDeliveryStats(since?: Date): { sent: number; delivered: number; clicked: number; ctr: number } {
    const notifications = Array.from(_pushNotifications.values())
      .filter(n => !since || n.createdAt >= since);
    const sent = notifications.filter(n => n.status !== "queued").length;
    const delivered = notifications.filter(n => n.status === "delivered" || n.status === "clicked").length;
    const clicked = notifications.filter(n => n.status === "clicked").length;
    return { sent, delivered, clicked, ctr: delivered > 0 ? clicked / delivered : 0 };
  },
};

// ─── OFFLINE CACHE ENGINE ────────────────────────────────────────────────────

export const offlineCacheEngine = {
  setCachePolicy(contentType: CachePolicy["contentType"], policy: Omit<CachePolicy, "contentType">): CachePolicy {
    const full: CachePolicy = { contentType, ...policy };
    _cachePolicies.set(contentType, full);
    return full;
  },

  getCachePolicy(contentType: CachePolicy["contentType"]): CachePolicy {
    return _cachePolicies.get(contentType) ?? {
      contentType,
      ttlSeconds: 300,
      maxSizeKB: 512,
      syncOnConnect: true,
      compressionEnabled: true,
      priority: "normal",
    };
  },

  cacheContent(userId: number, contentType: OfflineCacheEntry["contentType"], contentId: string, data: unknown): OfflineCacheEntry {
    const policy = this.getCachePolicy(contentType);
    const serialized = JSON.stringify(data);
    const sizeKB = serialized.length / 1024;
    const id = `cache_${userId}_${contentType}_${contentId}`;
    const entry: OfflineCacheEntry = {
      id, userId, contentType, contentId,
      data: serialized,
      sizeKB: Math.round(sizeKB * 100) / 100,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + policy.ttlSeconds * 1000),
      syncStatus: "synced",
      version: 1,
    };
    _offlineCache.set(id, entry);
    return entry;
  },

  getCachedContent(userId: number, contentType: OfflineCacheEntry["contentType"], contentId: string): unknown | null {
    const entry = _offlineCache.get(`cache_${userId}_${contentType}_${contentId}`);
    if (!entry || entry.expiresAt < new Date()) return null;
    try {
      return JSON.parse(entry.data);
    } catch {
      return null;
    }
  },

  invalidateCache(userId: number, contentType?: OfflineCacheEntry["contentType"]): number {
    let count = 0;
    for (const [key, entry] of _offlineCache.entries()) {
      if (entry.userId === userId && (!contentType || entry.contentType === contentType)) {
        _offlineCache.delete(key);
        count++;
      }
    }
    return count;
  },

  queueSyncAction(params: Omit<SyncQueueEntry, "id" | "attempts" | "status" | "createdAt">): SyncQueueEntry {
    const id = `sync_${params.userId}_${Date.now()}`;
    const entry: SyncQueueEntry = {
      ...params, id,
      attempts: 0,
      status: "pending",
      createdAt: new Date(),
    };
    _syncQueue.set(id, entry);
    return entry;
  },

  processSyncQueue(userId: number): SyncQueueEntry[] {
    const pending = Array.from(_syncQueue.values())
      .filter(e => e.userId === userId && e.status === "pending");
    const processed: SyncQueueEntry[] = [];
    for (const entry of pending) {
      entry.attempts++;
      entry.status = "completed";
      entry.processedAt = new Date();
      processed.push(entry);
    }
    return processed;
  },

  getUserCacheSize(userId: number): number {
    return Array.from(_offlineCache.values())
      .filter(e => e.userId === userId)
      .reduce((s, e) => s + e.sizeKB, 0);
  },
};

// ─── MEDIA COMPRESSION ENGINE ────────────────────────────────────────────────

export const mediaCompressionEngine = {
  submitJob(params: Omit<MediaCompressionJob, "id" | "outputUrl" | "outputSizeKB" | "compressionRatio" | "status" | "processingTimeMs" | "createdAt" | "completedAt">): MediaCompressionJob {
    const id = `comp_${params.userId}_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 7)}`;
    const job: MediaCompressionJob = {
      ...params, id,
      status: "queued",
      createdAt: new Date(),
    };
    _compressionJobs.set(id, job);
    return job;
  },

  processJob(jobId: string): MediaCompressionJob | null {
    const job = _compressionJobs.get(jobId);
    if (!job || job.status !== "queued") return null;
    job.status = "processing";
    const start = Date.now();
    // Simulate compression ratios by quality target
    const ratios: Record<MediaCompressionJob["targetQuality"], number> = {
      low: 0.25, medium: 0.50, high: 0.75, adaptive: 0.60,
    };
    const ratio = ratios[job.targetQuality];
    job.outputSizeKB = Math.round(job.inputSizeKB * ratio);
    job.compressionRatio = Math.round((1 - ratio) * 100);
    job.outputUrl = job.inputUrl.replace(/(\.[^.]+)$/, `_${job.targetQuality}$1`);
    job.processingTimeMs = Date.now() - start + Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100);
    job.status = "completed";
    job.completedAt = new Date();
    return job;
  },

  getJobStatus(jobId: string): MediaCompressionJob | null {
    return _compressionJobs.get(jobId) ?? null;
  },

  getUserJobs(userId: number): MediaCompressionJob[] {
    return Array.from(_compressionJobs.values()).filter(j => j.userId === userId);
  },

  getCompressionStats(): { totalJobs: number; avgCompressionRatio: number; totalSavedKB: number } {
    const completed = Array.from(_compressionJobs.values()).filter(j => j.status === "completed");
    const totalSavedKB = completed.reduce((s, j) => s + (j.inputSizeKB - (j.outputSizeKB ?? j.inputSizeKB)), 0);
    const avgRatio = completed.length > 0
      ? completed.reduce((s, j) => s + (j.compressionRatio ?? 0), 0) / completed.length
      : 0;
    return { totalJobs: completed.length, avgCompressionRatio: avgRatio, totalSavedKB };
  },
};

// ─── MOBILE STREAMING OPTIMIZATION ENGINE ────────────────────────────────────

export const mobileStreamingEngine = {
  createABRProfile(streamId: string): AdaptiveBitrateProfile {
    const id = `abr_${streamId}`;
    const profile: AdaptiveBitrateProfile = {
      id, streamId,
      profiles: [
        { resolution: "1080p", bitrate: 4000, fps: 30, codec: "h264", url: `${streamId}/1080p.m3u8` },
        { resolution: "720p",  bitrate: 2500, fps: 30, codec: "h264", url: `${streamId}/720p.m3u8` },
        { resolution: "480p",  bitrate: 1200, fps: 30, codec: "h264", url: `${streamId}/480p.m3u8` },
        { resolution: "360p",  bitrate: 600,  fps: 24, codec: "h264", url: `${streamId}/360p.m3u8` },
        { resolution: "240p",  bitrate: 300,  fps: 24, codec: "h264", url: `${streamId}/240p.m3u8` },
      ],
      currentProfile: "720p",
      networkCondition: "good",
      bufferHealth: 1.0,
      droppedFrames: 0,
      updatedAt: new Date(),
    };
    _abrProfiles.set(id, profile);
    return profile;
  },

  adaptQuality(streamId: string, networkBandwidthKbps: number): AdaptiveBitrateProfile | null {
    const profile = _abrProfiles.get(`abr_${streamId}`);
    if (!profile) return null;
    const suitable = profile.profiles
      .filter(p => p.bitrate <= networkBandwidthKbps * 0.8)
      .sort((a, b) => b.bitrate - a.bitrate)[0];
    if (suitable) {
      profile.currentProfile = suitable.resolution;
      profile.networkCondition =
        networkBandwidthKbps > 4000 ? "excellent" :
        networkBandwidthKbps > 2000 ? "good" :
        networkBandwidthKbps > 800 ? "fair" : "poor";
    }
    profile.updatedAt = new Date();
    return profile;
  },

  startMobileSession(params: Omit<MobileStreamSession, "id" | "qualityScore" | "adaptations" | "startedAt" | "updatedAt">): MobileStreamSession {
    const id = `ms_${params.userId}_${Date.now()}`;
    const session: MobileStreamSession = {
      ...params, id,
      qualityScore: 0.8,
      adaptations: [],
      startedAt: new Date(),
      updatedAt: new Date(),
    };
    _mobileStreamSessions.set(id, session);
    return session;
  },

  updateSessionMetrics(sessionId: string, latencyMs: number, bufferSize: number, droppedFrames: number): MobileStreamSession | null {
    const session = _mobileStreamSessions.get(sessionId);
    if (!session) return null;
    session.latencyMs = latencyMs;
    session.bufferSize = bufferSize;
    session.qualityScore = Math.max(0, 1 - (latencyMs / 10000) - (droppedFrames / 1000));
    session.updatedAt = new Date();
    return session;
  },

  getSessionMetrics(sessionId: string): MobileStreamMetrics | null {
    const session = _mobileStreamSessions.get(sessionId);
    if (!session) return null;
    return {
      sessionId,
      avgBitrate: session.currentBitrate,
      peakBitrate: session.targetBitrate,
      minBitrate: Math.floor(session.currentBitrate * 0.5),
      avgLatency: session.latencyMs,
      bufferEvents: session.adaptations.length,
      qualityChanges: session.adaptations.length,
      totalDataMB: (session.currentBitrate * (Date.now() - session.startedAt.getTime()) / 1000) / (8 * 1024),
      watchTimeSeconds: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
      qualityScore: session.qualityScore,
    };
  },
};

// ─── MOBILE ANALYTICS ENGINE ─────────────────────────────────────────────────

export const mobileAnalyticsEngine = {
  trackEvent(params: Omit<MobileAppEvent, "id" | "timestamp">): MobileAppEvent {
    const id = `evt_${params.userId}_${Date.now()}`;
    const event: MobileAppEvent = { ...params, id, timestamp: new Date() };
    _mobileEvents.push(event);
    return event;
  },

  startSession(params: Omit<MobileSessionMetrics, "sessionDurationSeconds" | "screenViews" | "interactions" | "crashes" | "networkRequests" | "avgResponseTimeMs" | "endedAt">): MobileSessionMetrics {
    const session: MobileSessionMetrics = {
      ...params,
      sessionDurationSeconds: 0,
      screenViews: 0,
      interactions: 0,
      crashes: 0,
      networkRequests: 0,
      avgResponseTimeMs: 0,
    };
    _mobileSessions.set(params.sessionId, session);
    return session;
  },

  endSession(sessionId: string): MobileSessionMetrics | null {
    const session = _mobileSessions.get(sessionId);
    if (!session) return null;
    session.endedAt = new Date();
    session.sessionDurationSeconds = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
    return session;
  },

  recordScreenView(sessionId: string, screenName: string): void {
    const session = _mobileSessions.get(sessionId);
    if (session) {
      session.screenViews++;
    }
    this.trackEvent({
      userId: session?.userId ?? 0,
      sessionId,
      eventType: "screen_view",
      eventCategory: "navigation",
      properties: { screenName },
      platform: session?.platform ?? "android",
      appVersion: session?.appVersion ?? "1.0.0",
      screenName,
    });
  },

  recordCrash(sessionId: string, reason: string, stackTrace: string): void {
    const session = _mobileSessions.get(sessionId);
    if (session) {
      session.crashes++;
    }
    this.trackEvent({
      userId: session?.userId ?? 0,
      sessionId,
      eventType: "crash",
      eventCategory: "error",
      properties: { reason, stackTrace: stackTrace.slice(0, 500) },
      platform: session?.platform ?? "android",
      appVersion: session?.appVersion ?? "1.0.0",
      screenName: "unknown",
    });
  },

  getPerformanceReport(period: string, platform: MobilePerformanceReport["platform"]): MobilePerformanceReport {
    const sessions = Array.from(_mobileSessions.values())
      .filter(s => platform === "both" || s.platform === platform);
    const avgDuration = sessions.length > 0
      ? sessions.reduce((s, sess) => s + sess.sessionDurationSeconds, 0) / sessions.length
      : 0;
    const totalCrashes = sessions.reduce((s, sess) => s + sess.crashes, 0);
    const crashRate = sessions.length > 0 ? totalCrashes / sessions.length : 0;
    const crashEvents = _mobileEvents.filter(e => e.eventCategory === "error");
    const crashReasons = new Map<string, { count: number; users: Set<number> }>();
    for (const e of crashEvents) {
      const reason = (e.properties.reason as string) ?? "unknown";
      if (!crashReasons.has(reason)) crashReasons.set(reason, { count: 0, users: new Set() });
      const entry = crashReasons.get(reason)!;
      entry.count++;
      entry.users.add(e.userId);
    }
    return {
      period,
      platform,
      avgSessionDuration: Math.round(avgDuration),
      crashRate: Math.round(crashRate * 10000) / 10000,
      avgLoadTimeMs: 850,
      avgApiResponseMs: 120,
      screenFlowCompletion: { onboarding: 0.72, checkout: 0.68, stream_start: 0.91 },
      topCrashReasons: Array.from(crashReasons.entries())
        .map(([reason, data]) => ({ reason, count: data.count, affectedUsers: data.users.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      retentionD1: 0.62,
      retentionD7: 0.38,
      retentionD30: 0.22,
    };
  },

  getEventsByUser(userId: number, since?: Date): MobileAppEvent[] {
    return _mobileEvents.filter(e => e.userId === userId && (!since || e.timestamp >= since));
  },

  getTopScreens(platform?: "ios" | "android", limit = 10): Array<{ screen: string; views: number }> {
    const screenEvents = _mobileEvents.filter(e =>
      e.eventType === "screen_view" && (!platform || e.platform === platform)
    );
    const counts = new Map<string, number>();
    for (const e of screenEvents) {
      const screen = e.screenName;
      counts.set(screen, (counts.get(screen) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([screen, views]) => ({ screen, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  },
};
