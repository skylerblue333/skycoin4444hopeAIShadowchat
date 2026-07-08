import crypto from 'crypto';
/**
 * PHASE 19 — MARKET DOMINATION
 * Public APIs, SDKs, External Integrations
 * Become infrastructure for others.
 */

// ─── PUBLIC API REGISTRY ─────────────────────────────────────────────────────

export interface PublicAPIKey {
  id: string;
  key: string;
  secret: string;
  ownerId: number;
  ownerType: "creator" | "developer" | "enterprise" | "partner";
  name: string;
  description: string;
  scopes: APIScope[];
  rateLimit: number;
  rateLimitWindow: "minute" | "hour" | "day";
  requestCount: number;
  lastUsedAt?: Date;
  isActive: boolean;
  expiresAt?: Date;
  webhookUrl?: string;
  createdAt: Date;
}

export type APIScope =
  | "creator:read" | "creator:write"
  | "marketplace:read" | "marketplace:write"
  | "wallet:read" | "wallet:write"
  | "analytics:read"
  | "ai:invoke"
  | "community:read" | "community:write"
  | "stream:read" | "stream:write"
  | "social:read" | "social:write"
  | "nft:read" | "nft:write"
  | "governance:read" | "governance:write";

export interface APIRequest {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  statusCode: number;
  responseTimeMs: number;
  requestSizeBytes: number;
  responseSizeBytes: number;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface APIWebhookEvent {
  id: string;
  apiKeyId: string;
  eventType: string;
  payload: Record<string, unknown>;
  deliveryAttempts: number;
  lastDeliveryStatus: "pending" | "delivered" | "failed";
  lastDeliveryAt?: Date;
  createdAt: Date;
}

export interface APIUsageStats {
  apiKeyId: string;
  period: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTimeMs: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  errorBreakdown: Record<number, number>;
  bandwidthMB: number;
}

// ─── SDK REGISTRY ────────────────────────────────────────────────────────────

export interface SDKRelease {
  id: string;
  sdkType: "typescript" | "python" | "mobile" | "creator";
  version: string;
  changelog: string;
  downloadUrl: string;
  npmPackage?: string;
  pypiPackage?: string;
  checksumSha256: string;
  isLatest: boolean;
  isDeprecated: boolean;
  releaseNotes: string;
  publishedAt: Date;
}

export interface SDKInstallation {
  id: string;
  sdkType: SDKRelease["sdkType"];
  version: string;
  apiKeyId: string;
  platform: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  requestCount: number;
}

// ─── EXTERNAL INTEGRATIONS ───────────────────────────────────────────────────

export interface ExternalIntegration {
  id: string;
  userId: number;
  platform: "youtube" | "twitch" | "discord" | "twitter_x" | "coinbase" | "opensea" | "instagram" | "tiktok";
  platformUserId: string;
  platformUsername: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
  syncEnabled: boolean;
  lastSyncAt?: Date;
  syncStatus: "idle" | "syncing" | "error" | "disabled";
  syncError?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface YouTubeSyncJob {
  id: string;
  userId: number;
  integrationId: string;
  jobType: "import_videos" | "sync_subscribers" | "cross_post" | "import_analytics";
  status: "queued" | "running" | "completed" | "failed";
  itemsProcessed: number;
  itemsTotal: number;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface TwitchSyncJob {
  id: string;
  userId: number;
  integrationId: string;
  jobType: "import_vods" | "sync_followers" | "import_clips" | "sync_emotes";
  status: "queued" | "running" | "completed" | "failed";
  itemsProcessed: number;
  itemsTotal: number;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface DiscordSyncJob {
  id: string;
  userId: number;
  integrationId: string;
  guildId: string;
  jobType: "sync_members" | "post_announcement" | "sync_roles" | "stream_notification";
  status: "queued" | "running" | "completed" | "failed";
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
}

export interface CoinbaseSyncJob {
  id: string;
  userId: number;
  integrationId: string;
  jobType: "sync_balances" | "import_transactions" | "verify_payment";
  status: "queued" | "running" | "completed" | "failed";
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
}

export interface OpenSeaSyncJob {
  id: string;
  userId: number;
  integrationId: string;
  jobType: "import_nfts" | "sync_listings" | "import_sales" | "sync_collection";
  status: "queued" | "running" | "completed" | "failed";
  itemsProcessed: number;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
}

export interface CrossPlatformPost {
  id: string;
  userId: number;
  originalPostId: string;
  platforms: Array<{
    platform: ExternalIntegration["platform"];
    platformPostId?: string;
    status: "pending" | "posted" | "failed";
    postedAt?: Date;
    error?: string;
  }>;
  content: string;
  mediaUrls: string[];
  scheduledFor?: Date;
  createdAt: Date;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _apiKeys = new Map<string, PublicAPIKey>();
const _apiKeysByKey = new Map<string, PublicAPIKey>();
const _apiRequests: APIRequest[] = [];
const _webhookEvents = new Map<string, APIWebhookEvent>();
const _sdkReleases = new Map<string, SDKRelease>();
const _sdkInstallations = new Map<string, SDKInstallation>();
const _integrations = new Map<string, ExternalIntegration>();
const _integrationsByUser = new Map<number, Set<string>>();
const _youtubeSyncJobs = new Map<string, YouTubeSyncJob>();
const _twitchSyncJobs = new Map<string, TwitchSyncJob>();
const _discordSyncJobs = new Map<string, DiscordSyncJob>();
const _coinbaseSyncJobs = new Map<string, CoinbaseSyncJob>();
const _openSeaSyncJobs = new Map<string, OpenSeaSyncJob>();
const _crossPlatformPosts = new Map<string, CrossPlatformPost>();

// ─── PUBLIC API MANAGEMENT ───────────────────────────────────────────────────

export const publicAPIManager = {
  createAPIKey(params: Omit<PublicAPIKey, "id" | "key" | "secret" | "requestCount" | "isActive" | "createdAt">): PublicAPIKey {
    const id = `apik_${params.ownerId}_${Date.now()}`;
    const key = `sky_${Buffer.from(`${id}_${Date.now()}`).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)}`;
    const secret = `sks_${Buffer.from(`${id}_secret_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256)}`).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 48)}`;
    const apiKey: PublicAPIKey = {
      ...params, id, key, secret,
      requestCount: 0,
      isActive: true,
      createdAt: new Date(),
    };
    _apiKeys.set(id, apiKey);
    _apiKeysByKey.set(key, apiKey);
    return apiKey;
  },

  validateAPIKey(key: string, requiredScope?: APIScope): { valid: boolean; apiKey?: PublicAPIKey; error?: string } {
    const apiKey = _apiKeysByKey.get(key);
    if (!apiKey) return { valid: false, error: "Invalid API key" };
    if (!apiKey.isActive) return { valid: false, error: "API key is inactive" };
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return { valid: false, error: "API key expired" };
    if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
      return { valid: false, error: `Missing required scope: ${requiredScope}` };
    }
    return { valid: true, apiKey };
  },

  recordRequest(apiKeyId: string, endpoint: string, method: APIRequest["method"], statusCode: number, responseTimeMs: number): APIRequest {
    const apiKey = _apiKeys.get(apiKeyId);
    if (apiKey) {
      apiKey.requestCount++;
      apiKey.lastUsedAt = new Date();
    }
    const request: APIRequest = {
      id: `req_${apiKeyId}_${Date.now()}`,
      apiKeyId, endpoint, method, statusCode, responseTimeMs,
      requestSizeBytes: 256,
      responseSizeBytes: 1024,
      ipAddress: "0.0.0.0",
      userAgent: "SkySDK/1.0",
      timestamp: new Date(),
    };
    _apiRequests.push(request);
    return request;
  },

  checkRateLimit(apiKeyId: string): { allowed: boolean; remaining: number; resetAt: Date } {
    const apiKey = _apiKeys.get(apiKeyId);
    if (!apiKey) return { allowed: false, remaining: 0, resetAt: new Date() };
    const windowMs = apiKey.rateLimitWindow === "minute" ? 60000 :
                     apiKey.rateLimitWindow === "hour" ? 3600000 : 86400000;
    const windowStart = new Date(Date.now() - windowMs);
    const recentRequests = _apiRequests.filter(r =>
      r.apiKeyId === apiKeyId && r.timestamp >= windowStart
    ).length;
    const remaining = Math.max(0, apiKey.rateLimit - recentRequests);
    return {
      allowed: remaining > 0,
      remaining,
      resetAt: new Date(Date.now() + windowMs),
    };
  },

  revokeAPIKey(apiKeyId: string): boolean {
    const apiKey = _apiKeys.get(apiKeyId);
    if (!apiKey) return false;
    apiKey.isActive = false;
    return true;
  },

  getOwnerAPIKeys(ownerId: number): PublicAPIKey[] {
    return Array.from(_apiKeys.values()).filter(k => k.ownerId === ownerId);
  },

  getAPIUsageStats(apiKeyId: string, period: string): APIUsageStats {
    const requests = _apiRequests.filter(r => r.apiKeyId === apiKeyId);
    const successful = requests.filter(r => r.statusCode < 400).length;
    const failed = requests.filter(r => r.statusCode >= 400).length;
    const avgResponseTime = requests.length > 0
      ? requests.reduce((s, r) => s + r.responseTimeMs, 0) / requests.length
      : 0;
    const endpointCounts = new Map<string, number>();
    for (const r of requests) {
      endpointCounts.set(r.endpoint, (endpointCounts.get(r.endpoint) ?? 0) + 1);
    }
    const errorBreakdown: Record<number, number> = {};
    for (const r of requests.filter(r => r.statusCode >= 400)) {
      errorBreakdown[r.statusCode] = (errorBreakdown[r.statusCode] ?? 0) + 1;
    }
    return {
      apiKeyId, period,
      totalRequests: requests.length,
      successfulRequests: successful,
      failedRequests: failed,
      avgResponseTimeMs: Math.round(avgResponseTime),
      topEndpoints: Array.from(endpointCounts.entries())
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      errorBreakdown,
      bandwidthMB: requests.reduce((s, r) => s + r.responseSizeBytes, 0) / (1024 * 1024),
    };
  },

  // Webhooks
  registerWebhook(apiKeyId: string, webhookUrl: string): boolean {
    const apiKey = _apiKeys.get(apiKeyId);
    if (!apiKey) return false;
    apiKey.webhookUrl = webhookUrl;
    return true;
  },

  dispatchWebhookEvent(apiKeyId: string, eventType: string, payload: Record<string, unknown>): APIWebhookEvent {
    const id = `wh_${apiKeyId}_${Date.now()}`;
    const event: APIWebhookEvent = {
      id, apiKeyId, eventType, payload,
      deliveryAttempts: 0,
      lastDeliveryStatus: "pending",
      createdAt: new Date(),
    };
    _webhookEvents.set(id, event);
    // Simulate delivery
    event.deliveryAttempts = 1;
    event.lastDeliveryStatus = "delivered";
    event.lastDeliveryAt = new Date();
    return event;
  },

  getPlatformAPIStats(): { totalKeys: number; activeKeys: number; totalRequests: number; avgResponseTimeMs: number } {
    const activeKeys = Array.from(_apiKeys.values()).filter(k => k.isActive).length;
    const avgResponseTime = _apiRequests.length > 0
      ? _apiRequests.reduce((s, r) => s + r.responseTimeMs, 0) / _apiRequests.length
      : 0;
    return {
      totalKeys: _apiKeys.size,
      activeKeys,
      totalRequests: _apiRequests.length,
      avgResponseTimeMs: Math.round(avgResponseTime),
    };
  },
};

// ─── SDK REGISTRY IMPLEMENTATION ─────────────────────────────────────────────

export const sdkRegistry = {
  publishRelease(params: Omit<SDKRelease, "id" | "publishedAt">): SDKRelease {
    const id = `sdk_${params.sdkType}_${params.version}`;
    // Mark previous versions as non-latest
    if (params.isLatest) {
      for (const release of _sdkReleases.values()) {
        if (release.sdkType === params.sdkType) {
          release.isLatest = false;
        }
      }
    }
    const release: SDKRelease = {
      ...params, id,
      publishedAt: new Date(),
    };
    _sdkReleases.set(id, release);
    return release;
  },

  getLatestRelease(sdkType: SDKRelease["sdkType"]): SDKRelease | null {
    return Array.from(_sdkReleases.values())
      .find(r => r.sdkType === sdkType && r.isLatest) ?? null;
  },

  getAllReleases(sdkType?: SDKRelease["sdkType"]): SDKRelease[] {
    return Array.from(_sdkReleases.values())
      .filter(r => !sdkType || r.sdkType === sdkType)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  },

  recordInstallation(apiKeyId: string, sdkType: SDKRelease["sdkType"], version: string, platform: string): SDKInstallation {
    const key = `inst_${apiKeyId}_${sdkType}`;
    const existing = _sdkInstallations.get(key);
    if (existing) {
      existing.lastSeenAt = new Date();
      existing.requestCount++;
      existing.version = version;
      return existing;
    }
    const installation: SDKInstallation = {
      id: key, sdkType, version, apiKeyId, platform,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      requestCount: 1,
    };
    _sdkInstallations.set(key, installation);
    return installation;
  },

  getSDKAdoptionStats(): Record<SDKRelease["sdkType"], { installations: number; latestVersion: string }> {
    const stats: Record<string, { installations: number; latestVersion: string }> = {};
    for (const inst of _sdkInstallations.values()) {
      if (!stats[inst.sdkType]) stats[inst.sdkType] = { installations: 0, latestVersion: inst.version };
      stats[inst.sdkType].installations++;
    }
    return stats as Record<SDKRelease["sdkType"], { installations: number; latestVersion: string }>;
  },
};

// ─── EXTERNAL INTEGRATION ENGINE ─────────────────────────────────────────────

export const externalIntegrationEngine = {
  connectIntegration(params: Omit<ExternalIntegration, "id" | "syncStatus" | "createdAt">): ExternalIntegration {
    const id = `int_${params.userId}_${params.platform}_${Date.now()}`;
    const integration: ExternalIntegration = {
      ...params, id,
      syncStatus: "idle",
      createdAt: new Date(),
    };
    _integrations.set(id, integration);
    if (!_integrationsByUser.has(params.userId)) {
      _integrationsByUser.set(params.userId, new Set());
    }
    _integrationsByUser.get(params.userId)!.add(id);
    return integration;
  },

  disconnectIntegration(integrationId: string): boolean {
    const integration = _integrations.get(integrationId);
    if (!integration) return false;
    integration.syncEnabled = false;
    integration.syncStatus = "disabled";
    return true;
  },

  getUserIntegrations(userId: number): ExternalIntegration[] {
    const ids = _integrationsByUser.get(userId) ?? new Set();
    return Array.from(ids).map(id => _integrations.get(id)!).filter(Boolean);
  },

  getIntegrationByPlatform(userId: number, platform: ExternalIntegration["platform"]): ExternalIntegration | null {
    const integrations = this.getUserIntegrations(userId);
    return integrations.find(i => i.platform === platform && i.syncEnabled) ?? null;
  },

  // YouTube Sync
  queueYouTubeSync(userId: number, integrationId: string, jobType: YouTubeSyncJob["jobType"]): YouTubeSyncJob {
    const id = `yt_${userId}_${Date.now()}`;
    const job: YouTubeSyncJob = {
      id, userId, integrationId, jobType,
      status: "queued",
      itemsProcessed: 0,
      itemsTotal: 0,
      createdAt: new Date(),
    };
    _youtubeSyncJobs.set(id, job);
    return job;
  },

  processYouTubeSync(jobId: string): YouTubeSyncJob | null {
    const job = _youtubeSyncJobs.get(jobId);
    if (!job) return null;
    job.status = "running";
    job.startedAt = new Date();
    job.itemsTotal = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 50) + 10;
    job.itemsProcessed = job.itemsTotal;
    job.status = "completed";
    job.completedAt = new Date();
    job.result = { syncedItems: job.itemsProcessed, platform: "youtube" };
    return job;
  },

  // Twitch Sync
  queueTwitchSync(userId: number, integrationId: string, jobType: TwitchSyncJob["jobType"]): TwitchSyncJob {
    const id = `tw_${userId}_${Date.now()}`;
    const job: TwitchSyncJob = {
      id, userId, integrationId, jobType,
      status: "queued",
      itemsProcessed: 0,
      itemsTotal: 0,
      createdAt: new Date(),
    };
    _twitchSyncJobs.set(id, job);
    return job;
  },

  processTwitchSync(jobId: string): TwitchSyncJob | null {
    const job = _twitchSyncJobs.get(jobId);
    if (!job) return null;
    job.status = "running";
    job.startedAt = new Date();
    job.itemsTotal = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 30) + 5;
    job.itemsProcessed = job.itemsTotal;
    job.status = "completed";
    job.completedAt = new Date();
    job.result = { syncedItems: job.itemsProcessed, platform: "twitch" };
    return job;
  },

  // Discord Sync
  queueDiscordSync(userId: number, integrationId: string, guildId: string, jobType: DiscordSyncJob["jobType"]): DiscordSyncJob {
    const id = `dc_${userId}_${Date.now()}`;
    const job: DiscordSyncJob = {
      id, userId, integrationId, guildId, jobType,
      status: "queued",
      createdAt: new Date(),
    };
    _discordSyncJobs.set(id, job);
    return job;
  },

  processDiscordSync(jobId: string): DiscordSyncJob | null {
    const job = _discordSyncJobs.get(jobId);
    if (!job) return null;
    job.status = "completed";
    job.result = { platform: "discord", guildId: job.guildId };
    return job;
  },

  // Coinbase Sync
  queueCoinbaseSync(userId: number, integrationId: string, jobType: CoinbaseSyncJob["jobType"]): CoinbaseSyncJob {
    const id = `cb_${userId}_${Date.now()}`;
    const job: CoinbaseSyncJob = {
      id, userId, integrationId, jobType,
      status: "queued",
      createdAt: new Date(),
    };
    _coinbaseSyncJobs.set(id, job);
    return job;
  },

  processCoinbaseSync(jobId: string): CoinbaseSyncJob | null {
    const job = _coinbaseSyncJobs.get(jobId);
    if (!job) return null;
    job.status = "completed";
    job.result = { platform: "coinbase", balancesSynced: true };
    return job;
  },

  // OpenSea Sync
  queueOpenSeaSync(userId: number, integrationId: string, jobType: OpenSeaSyncJob["jobType"]): OpenSeaSyncJob {
    const id = `os_${userId}_${Date.now()}`;
    const job: OpenSeaSyncJob = {
      id, userId, integrationId, jobType,
      status: "queued",
      itemsProcessed: 0,
      createdAt: new Date(),
    };
    _openSeaSyncJobs.set(id, job);
    return job;
  },

  processOpenSeaSync(jobId: string): OpenSeaSyncJob | null {
    const job = _openSeaSyncJobs.get(jobId);
    if (!job) return null;
    job.status = "completed";
    job.itemsProcessed = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 20) + 1;
    job.result = { platform: "opensea", nftsSynced: job.itemsProcessed };
    return job;
  },

  // Cross-Platform Posting
  scheduleCrossPlatformPost(params: Omit<CrossPlatformPost, "id" | "createdAt">): CrossPlatformPost {
    const id = `xp_${params.userId}_${Date.now()}`;
    const post: CrossPlatformPost = { ...params, id, createdAt: new Date() };
    _crossPlatformPosts.set(id, post);
    return post;
  },

  publishCrossPlatformPost(postId: string): CrossPlatformPost | null {
    const post = _crossPlatformPosts.get(postId);
    if (!post) return null;
    for (const platform of post.platforms) {
      platform.status = "posted";
      platform.platformPostId = `${platform.platform}_${Date.now()}`;
      platform.postedAt = new Date();
    }
    return post;
  },

  getUserCrossPlatformPosts(userId: number): CrossPlatformPost[] {
    return Array.from(_crossPlatformPosts.values()).filter(p => p.userId === userId);
  },

  // Integration Health
  getIntegrationHealth(): {
    totalIntegrations: number;
    activeIntegrations: number;
    byPlatform: Record<string, number>;
    syncErrors: number;
  } {
    const integrations = Array.from(_integrations.values());
    const byPlatform: Record<string, number> = {};
    let syncErrors = 0;
    for (const i of integrations) {
      byPlatform[i.platform] = (byPlatform[i.platform] ?? 0) + 1;
      if (i.syncStatus === "error") syncErrors++;
    }
    return {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter(i => i.syncEnabled).length,
      byPlatform,
      syncErrors,
    };
  },
};
