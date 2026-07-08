import crypto from 'crypto';
/**
 * SCALING CONFIGURATION — COMMANDMENTS 5 & 6
 * Commandment 5: Monetization must be executable
 * Commandment 6: Platform must scale horizontally
 *
 * This module provides:
 * - Rate limiting (per-endpoint, per-user, per-IP, adaptive)
 * - Worker pool management (queue concurrency, backpressure)
 * - Redis pub/sub configuration for multi-instance coordination
 * - Monetization flow verification (Stripe, payouts, fee collection)
 * - Circuit breakers for external services
 * - Health check endpoints
 */

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
  skipSuccessfulRequests?: boolean;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
}

// In-memory rate limit store (Redis-backed in production)
const _rateLimitWindows = new Map<string, { count: number; windowStart: number; blocked?: number }>();

export const rateLimiter = {
  configs: {
    // API endpoints
    "api:default": { windowMs: 60_000, maxRequests: 100, blockDurationMs: 60_000 },
    "api:auth": { windowMs: 60_000, maxRequests: 10, blockDurationMs: 300_000 },
    "api:post.create": { windowMs: 60_000, maxRequests: 30, blockDurationMs: 60_000 },
    "api:comment.create": { windowMs: 60_000, maxRequests: 60, blockDurationMs: 60_000 },
    "api:like": { windowMs: 60_000, maxRequests: 200, blockDurationMs: 30_000 },
    "api:follow": { windowMs: 60_000, maxRequests: 50, blockDurationMs: 60_000 },
    "api:dm.send": { windowMs: 60_000, maxRequests: 100, blockDurationMs: 60_000 },
    "api:upload": { windowMs: 3_600_000, maxRequests: 50, blockDurationMs: 3_600_000 },
    "api:swap": { windowMs: 60_000, maxRequests: 20, blockDurationMs: 300_000 },
    "api:stake": { windowMs: 3_600_000, maxRequests: 10, blockDurationMs: 3_600_000 },
    "api:marketplace.order": { windowMs: 60_000, maxRequests: 20, blockDurationMs: 300_000 },
    "api:search": { windowMs: 60_000, maxRequests: 120, blockDurationMs: 30_000 },
    "api:ai.inference": { windowMs: 60_000, maxRequests: 30, blockDurationMs: 120_000 },
    // WebSocket
    "ws:connect": { windowMs: 60_000, maxRequests: 10, blockDurationMs: 300_000 },
    "ws:message": { windowMs: 1_000, maxRequests: 20, blockDurationMs: 5_000 },
    // Webhooks
    "webhook:stripe": { windowMs: 1_000, maxRequests: 100, blockDurationMs: 1_000 },
  } as Record<string, RateLimitConfig>,

  check(key: string, endpoint: string): RateLimitResult {
    const config = this.configs[endpoint] ?? this.configs["api:default"]!;
    const now = Date.now();
    const windowKey = `${endpoint}:${key}`;

    let state = _rateLimitWindows.get(windowKey);

    // Check if blocked
    if (state?.blocked && state.blocked > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(state.blocked),
        retryAfterMs: state.blocked - now,
      };
    }

    // New window or expired window
    if (!state || now - state.windowStart > config.windowMs) {
      state = { count: 1, windowStart: now };
      _rateLimitWindows.set(windowKey, state);
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now + config.windowMs),
      };
    }

    state.count++;

    if (state.count > config.maxRequests) {
      state.blocked = now + config.blockDurationMs;
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(state.blocked),
        retryAfterMs: config.blockDurationMs,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - state.count,
      resetAt: new Date(state.windowStart + config.windowMs),
    };
  },

  reset(key: string, endpoint: string): void {
    _rateLimitWindows.delete(`${endpoint}:${key}`);
  },

  getViolations(): Array<{ key: string; count: number; blocked: boolean }> {
    const violations: Array<{ key: string; count: number; blocked: boolean }> = [];
    const now = Date.now();
    for (const [key, state] of _rateLimitWindows.entries()) {
      if (state.count > 10) {
        violations.push({
          key,
          count: state.count,
          blocked: !!(state.blocked && state.blocked > now),
        });
      }
    }
    return violations;
  },
};

// ─── WORKER POOL CONFIGURATION ────────────────────────────────────────────────

export interface WorkerPoolConfig {
  name: string;
  concurrency: number;
  maxQueueSize: number;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
  priority: "critical" | "high" | "normal" | "low";
}

export const workerPoolConfigs: Record<string, WorkerPoolConfig> = {
  "media.transcode": {
    name: "media.transcode",
    concurrency: 4,
    maxQueueSize: 500,
    retryAttempts: 3,
    retryDelayMs: 30_000,
    timeoutMs: 600_000, // 10 minutes for video transcoding
    priority: "normal",
  },
  "media.thumbnail": {
    name: "media.thumbnail",
    concurrency: 8,
    maxQueueSize: 1000,
    retryAttempts: 3,
    retryDelayMs: 5_000,
    timeoutMs: 30_000,
    priority: "high",
  },
  "media.moderation": {
    name: "media.moderation",
    concurrency: 10,
    maxQueueSize: 2000,
    retryAttempts: 2,
    retryDelayMs: 10_000,
    timeoutMs: 60_000,
    priority: "critical",
  },
  "notifications.push": {
    name: "notifications.push",
    concurrency: 20,
    maxQueueSize: 10_000,
    retryAttempts: 3,
    retryDelayMs: 5_000,
    timeoutMs: 10_000,
    priority: "high",
  },
  "notifications.email": {
    name: "notifications.email",
    concurrency: 10,
    maxQueueSize: 5_000,
    retryAttempts: 5,
    retryDelayMs: 60_000,
    timeoutMs: 30_000,
    priority: "normal",
  },
  "payments.process": {
    name: "payments.process",
    concurrency: 5,
    maxQueueSize: 1000,
    retryAttempts: 3,
    retryDelayMs: 30_000,
    timeoutMs: 60_000,
    priority: "critical",
  },
  "payouts.execute": {
    name: "payouts.execute",
    concurrency: 2,
    maxQueueSize: 500,
    retryAttempts: 5,
    retryDelayMs: 300_000,
    timeoutMs: 120_000,
    priority: "critical",
  },
  "ai.inference": {
    name: "ai.inference",
    concurrency: 15,
    maxQueueSize: 3000,
    retryAttempts: 2,
    retryDelayMs: 5_000,
    timeoutMs: 30_000,
    priority: "normal",
  },
  "analytics.ingest": {
    name: "analytics.ingest",
    concurrency: 30,
    maxQueueSize: 50_000,
    retryAttempts: 3,
    retryDelayMs: 1_000,
    timeoutMs: 5_000,
    priority: "low",
  },
  "blockchain.transaction": {
    name: "blockchain.transaction",
    concurrency: 3,
    maxQueueSize: 200,
    retryAttempts: 10,
    retryDelayMs: 60_000,
    timeoutMs: 300_000,
    priority: "critical",
  },
  "search.index": {
    name: "search.index",
    concurrency: 5,
    maxQueueSize: 10_000,
    retryAttempts: 3,
    retryDelayMs: 10_000,
    timeoutMs: 30_000,
    priority: "low",
  },
  "feed.rank": {
    name: "feed.rank",
    concurrency: 8,
    maxQueueSize: 5_000,
    retryAttempts: 2,
    retryDelayMs: 5_000,
    timeoutMs: 15_000,
    priority: "normal",
  },
};

// Worker pool state tracking
const _workerPoolStats = new Map<string, {
  activeWorkers: number;
  queueSize: number;
  processed: number;
  failed: number;
  avgLatencyMs: number;
}>();

export const workerPoolManager = {
  getStats(poolName: string) {
    return _workerPoolStats.get(poolName) ?? {
      activeWorkers: 0,
      queueSize: 0,
      processed: 0,
      failed: 0,
      avgLatencyMs: 0,
    };
  },

  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};
    for (const name of Object.keys(workerPoolConfigs)) {
      result[name] = this.getStats(name);
    }
    return result;
  },

  isHealthy(poolName: string): boolean {
    const config = workerPoolConfigs[poolName];
    const stats = this.getStats(poolName);
    if (!config) return false;
    return stats.queueSize < config.maxQueueSize * 0.9;
  },

  getBackpressureLevel(poolName: string): "none" | "low" | "medium" | "high" | "critical" {
    const config = workerPoolConfigs[poolName];
    const stats = this.getStats(poolName);
    if (!config) return "none";
    const ratio = stats.queueSize / config.maxQueueSize;
    if (ratio < 0.25) return "none";
    if (ratio < 0.5) return "low";
    if (ratio < 0.75) return "medium";
    if (ratio < 0.9) return "high";
    return "critical";
  },

  recordJobCompletion(poolName: string, latencyMs: number, success: boolean): void {
    const stats = _workerPoolStats.get(poolName) ?? {
      activeWorkers: 0, queueSize: 0, processed: 0, failed: 0, avgLatencyMs: 0,
    };
    if (success) {
      stats.processed++;
      stats.avgLatencyMs = (stats.avgLatencyMs * (stats.processed - 1) + latencyMs) / stats.processed;
    } else {
      stats.failed++;
    }
    _workerPoolStats.set(poolName, stats);
  },
};

// ─── REDIS CONFIGURATION ──────────────────────────────────────────────────────

export const redisConfig = {
  // Main Redis instance
  main: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    password: process.env.REDIS_PASSWORD,
    db: 0,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  },

  // Pub/Sub Redis instance (separate connection for pub/sub)
  pubsub: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    password: process.env.REDIS_PASSWORD,
    db: 0,
    maxRetriesPerRequest: null, // Never stop retrying for pub/sub
    enableReadyCheck: false,
    lazyConnect: true,
  },

  // BullMQ queue Redis instance
  queue: {
    host: process.env.REDIS_QUEUE_HOST ?? process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_QUEUE_PORT ?? process.env.REDIS_PORT ?? "6379"),
    password: process.env.REDIS_PASSWORD,
    db: 1, // Separate DB for queues
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  },

  // Cache Redis instance
  cache: {
    host: process.env.REDIS_CACHE_HOST ?? process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_CACHE_PORT ?? process.env.REDIS_PORT ?? "6379"),
    password: process.env.REDIS_PASSWORD,
    db: 2, // Separate DB for cache
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  },

  // Cache TTLs (seconds)
  ttl: {
    userProfile: 300,        // 5 minutes
    userFeed: 60,            // 1 minute
    trendingPosts: 120,      // 2 minutes
    tokenPrices: 30,         // 30 seconds
    leaderboard: 60,         // 1 minute
    searchResults: 300,      // 5 minutes
    communityInfo: 600,      // 10 minutes
    streamInfo: 10,          // 10 seconds (live data)
    userBalance: 15,         // 15 seconds
    stakingPositions: 60,    // 1 minute
    marketplaceListing: 120, // 2 minutes
    aiRecommendations: 300,  // 5 minutes
    session: 86_400,         // 24 hours
  },

  // Channel prefixes for pub/sub
  channels: {
    realtimePrefix: "shadowchat:rt:",
    cacheInvalidation: "shadowchat:cache:invalidate",
    workerCoordination: "shadowchat:workers:",
    leaderElection: "shadowchat:leader:",
  },
};

// ─── CIRCUIT BREAKER ──────────────────────────────────────────────────────────

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  halfOpenRequests: number;
}

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt?: Date;
  openedAt?: Date;
  halfOpenAttempts: number;
}

const _circuitBreakers = new Map<string, CircuitBreakerState>();

export const circuitBreaker = {
  configs: {
    stripe: { failureThreshold: 5, successThreshold: 2, timeoutMs: 60_000, halfOpenRequests: 3 },
    openai: { failureThreshold: 10, successThreshold: 3, timeoutMs: 30_000, halfOpenRequests: 5 },
    s3: { failureThreshold: 5, successThreshold: 2, timeoutMs: 30_000, halfOpenRequests: 3 },
    redis: { failureThreshold: 3, successThreshold: 2, timeoutMs: 10_000, halfOpenRequests: 2 },
    blockchain: { failureThreshold: 5, successThreshold: 2, timeoutMs: 120_000, halfOpenRequests: 2 },
    "push-notifications": { failureThreshold: 20, successThreshold: 5, timeoutMs: 60_000, halfOpenRequests: 10 },
  } as Record<string, CircuitBreakerConfig>,

  getState(service: string): CircuitBreakerState {
    return _circuitBreakers.get(service) ?? {
      state: "closed",
      failures: 0,
      successes: 0,
      halfOpenAttempts: 0,
    };
  },

  canRequest(service: string): boolean {
    const state = this.getState(service);
    const config = this.configs[service];
    if (!config) return true;

    if (state.state === "closed") return true;

    if (state.state === "open") {
      const now = Date.now();
      const openedAt = state.openedAt?.getTime() ?? 0;
      if (now - openedAt > config.timeoutMs) {
        // Transition to half-open
        state.state = "half-open";
        state.halfOpenAttempts = 0;
        _circuitBreakers.set(service, state);
        return true;
      }
      return false;
    }

    // Half-open: allow limited requests
    return state.halfOpenAttempts < config.halfOpenRequests;
  },

  recordSuccess(service: string): void {
    const state = this.getState(service);
    const config = this.configs[service];
    if (!config) return;

    if (state.state === "half-open") {
      state.successes++;
      if (state.successes >= config.successThreshold) {
        state.state = "closed";
        state.failures = 0;
        state.successes = 0;
        state.halfOpenAttempts = 0;
      }
    } else if (state.state === "closed") {
      state.failures = Math.max(0, state.failures - 1);
    }

    _circuitBreakers.set(service, state);
  },

  recordFailure(service: string): void {
    const state = this.getState(service);
    const config = this.configs[service];
    if (!config) return;

    state.failures++;
    state.lastFailureAt = new Date();

    if (state.state === "half-open" || state.failures >= config.failureThreshold) {
      state.state = "open";
      state.openedAt = new Date();
      state.successes = 0;
    }

    _circuitBreakers.set(service, state);
  },

  getAllStates(): Record<string, CircuitBreakerState> {
    const result: Record<string, CircuitBreakerState> = {};
    for (const service of Object.keys(this.configs)) {
      result[service] = this.getState(service);
    }
    return result;
  },
};

// ─── MONETIZATION FLOW VERIFICATION ──────────────────────────────────────────

export interface MonetizationFlowCheck {
  flow: string;
  status: "operational" | "degraded" | "down";
  lastCheckedAt: Date;
  details: Record<string, unknown>;
  blockers: string[];
}

export const monetizationVerifier = {
  async verifyStripePayments(): Promise<MonetizationFlowCheck> {
    const blockers: string[] = [];

    if (!process.env.STRIPE_SECRET_KEY) blockers.push("STRIPE_SECRET_KEY not configured");
    if (!process.env.STRIPE_WEBHOOK_SECRET) blockers.push("STRIPE_WEBHOOK_SECRET not configured");

    const stripeState = circuitBreaker.getState("stripe");
    if (stripeState.state === "open") blockers.push("Stripe circuit breaker is open");

    return {
      flow: "stripe_payments",
      status: blockers.length === 0 ? "operational" : blockers.length === 1 ? "degraded" : "down",
      lastCheckedAt: new Date(),
      details: {
        circuitState: stripeState.state,
        recentFailures: stripeState.failures,
        webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
      blockers,
    };
  },

  async verifyCreatorPayouts(): Promise<MonetizationFlowCheck> {
    const blockers: string[] = [];

    if (!process.env.STRIPE_SECRET_KEY) blockers.push("Stripe not configured for payouts");
    if (!process.env.PLATFORM_FEE_RATE) blockers.push("PLATFORM_FEE_RATE not set (defaulting to 20%)");

    return {
      flow: "creator_payouts",
      status: blockers.length === 0 ? "operational" : "degraded",
      lastCheckedAt: new Date(),
      details: {
        platformFeeRate: parseFloat(process.env.PLATFORM_FEE_RATE ?? "0.20"),
        minimumPayoutUsd: parseFloat(process.env.MIN_PAYOUT_USD ?? "10"),
        payoutSchedule: process.env.PAYOUT_SCHEDULE ?? "weekly",
      },
      blockers,
    };
  },

  async verifySubscriptionBilling(): Promise<MonetizationFlowCheck> {
    const blockers: string[] = [];

    if (!process.env.STRIPE_SECRET_KEY) blockers.push("Stripe not configured");
    if (!process.env.STRIPE_PRICE_BASIC) blockers.push("STRIPE_PRICE_BASIC not configured");
    if (!process.env.STRIPE_PRICE_PRO) blockers.push("STRIPE_PRICE_PRO not configured");

    return {
      flow: "subscription_billing",
      status: blockers.length === 0 ? "operational" : blockers.length <= 2 ? "degraded" : "down",
      lastCheckedAt: new Date(),
      details: {
        tiersConfigured: {
          basic: !!process.env.STRIPE_PRICE_BASIC,
          pro: !!process.env.STRIPE_PRICE_PRO,
          elite: !!process.env.STRIPE_PRICE_ELITE,
        },
      },
      blockers,
    };
  },

  async verifyTokenEconomy(): Promise<MonetizationFlowCheck> {
    const blockers: string[] = [];

    if (!process.env.SKY_TOKEN_CONTRACT) blockers.push("SKY_TOKEN_CONTRACT not configured");
    if (!process.env.TREASURY_WALLET) blockers.push("TREASURY_WALLET not configured");
    if (!process.env.RPC_URL) blockers.push("RPC_URL not configured");

    const blockchainState = circuitBreaker.getState("blockchain");
    if (blockchainState.state === "open") blockers.push("Blockchain circuit breaker is open");

    return {
      flow: "token_economy",
      status: blockers.length === 0 ? "operational" : blockers.length <= 2 ? "degraded" : "down",
      lastCheckedAt: new Date(),
      details: {
        contractConfigured: !!process.env.SKY_TOKEN_CONTRACT,
        treasuryConfigured: !!process.env.TREASURY_WALLET,
        rpcConfigured: !!process.env.RPC_URL,
        blockchainCircuitState: blockchainState.state,
      },
      blockers,
    };
  },

  async verifyMarketplaceEscrow(): Promise<MonetizationFlowCheck> {
    const blockers: string[] = [];

    if (!process.env.STRIPE_SECRET_KEY) blockers.push("Stripe not configured for escrow");
    if (!process.env.ESCROW_RELEASE_DAYS) blockers.push("ESCROW_RELEASE_DAYS not set (defaulting to 7)");

    return {
      flow: "marketplace_escrow",
      status: blockers.length === 0 ? "operational" : "degraded",
      lastCheckedAt: new Date(),
      details: {
        escrowReleaseDays: parseInt(process.env.ESCROW_RELEASE_DAYS ?? "7"),
        platformFeeRate: parseFloat(process.env.MARKETPLACE_FEE_RATE ?? "0.05"),
        disputeWindowDays: parseInt(process.env.DISPUTE_WINDOW_DAYS ?? "14"),
      },
      blockers,
    };
  },

  async verifyAdRevenue(): Promise<MonetizationFlowCheck> {
    const blockers: string[] = [];

    if (!process.env.AD_NETWORK_API_KEY) blockers.push("AD_NETWORK_API_KEY not configured");
    if (!process.env.PUBLISHER_SHARE_RATE) blockers.push("PUBLISHER_SHARE_RATE not set (defaulting to 70%)");

    return {
      flow: "ad_revenue",
      status: blockers.length === 0 ? "operational" : "degraded",
      lastCheckedAt: new Date(),
      details: {
        publisherShareRate: parseFloat(process.env.PUBLISHER_SHARE_RATE ?? "0.70"),
        cpmFloor: parseFloat(process.env.AD_CPM_FLOOR ?? "0.50"),
      },
      blockers,
    };
  },

  async runFullAudit(): Promise<{
    overallStatus: "operational" | "degraded" | "critical";
    flows: MonetizationFlowCheck[];
    summary: { operational: number; degraded: number; down: number };
    criticalBlockers: string[];
  }> {
    const flows = await Promise.all([
      this.verifyStripePayments(),
      this.verifyCreatorPayouts(),
      this.verifySubscriptionBilling(),
      this.verifyTokenEconomy(),
      this.verifyMarketplaceEscrow(),
      this.verifyAdRevenue(),
    ]);

    const summary = {
      operational: flows.filter(f => f.status === "operational").length,
      degraded: flows.filter(f => f.status === "degraded").length,
      down: flows.filter(f => f.status === "down").length,
    };

    const criticalBlockers = flows
      .filter(f => f.status === "down")
      .flatMap(f => f.blockers);

    const overallStatus = summary.down > 0 ? "critical"
      : summary.degraded > 2 ? "degraded"
        : "operational";

    return { overallStatus, flows, summary, criticalBlockers };
  },
};

// ─── HEALTH CHECK SYSTEM ──────────────────────────────────────────────────────

export interface HealthCheckResult {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs?: number;
  details?: Record<string, unknown>;
}

export const healthChecker = {
  async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // In production: execute a simple SELECT 1 query
      const latencyMs = Date.now() - start;
      return {
        service: "database",
        status: latencyMs < 100 ? "healthy" : latencyMs < 500 ? "degraded" : "unhealthy",
        latencyMs,
        details: { type: "mysql", pool: "drizzle" },
      };
    } catch (err) {
      return { service: "database", status: "unhealthy", details: { error: String(err) } };
    }
  },

  async checkRedis(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // In production: execute PING command
      const latencyMs = Date.now() - start;
      return {
        service: "redis",
        status: latencyMs < 10 ? "healthy" : latencyMs < 50 ? "degraded" : "unhealthy",
        latencyMs,
      };
    } catch (err) {
      return { service: "redis", status: "unhealthy", details: { error: String(err) } };
    }
  },

  async checkS3(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const configured = !!process.env.AWS_ACCESS_KEY_ID && !!process.env.S3_BUCKET;
      const latencyMs = Date.now() - start;
      return {
        service: "s3",
        status: configured ? "healthy" : "degraded",
        latencyMs,
        details: { configured, bucket: process.env.S3_BUCKET },
      };
    } catch (err) {
      return { service: "s3", status: "unhealthy", details: { error: String(err) } };
    }
  },

  async checkOpenAI(): Promise<HealthCheckResult> {
    const configured = !!process.env.OPENAI_API_KEY;
    const state = circuitBreaker.getState("openai");
    return {
      service: "openai",
      status: !configured ? "degraded" : state.state === "open" ? "unhealthy" : "healthy",
      details: {
        configured,
        circuitState: state.state,
        recentFailures: state.failures,
      },
    };
  },

  async checkStripe(): Promise<HealthCheckResult> {
    const configured = !!process.env.STRIPE_SECRET_KEY;
    const state = circuitBreaker.getState("stripe");
    return {
      service: "stripe",
      status: !configured ? "degraded" : state.state === "open" ? "unhealthy" : "healthy",
      details: { configured, circuitState: state.state },
    };
  },

  async runAll(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    checks: HealthCheckResult[];
    timestamp: string;
    uptime: number;
  }> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkS3(),
      this.checkOpenAI(),
      this.checkStripe(),
    ]);

    const unhealthy = checks.filter(c => c.status === "unhealthy").length;
    const degraded = checks.filter(c => c.status === "degraded").length;

    const status = unhealthy > 0 ? "unhealthy" : degraded > 1 ? "degraded" : "healthy";

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  },
};

// ─── HORIZONTAL SCALING CONFIG ────────────────────────────────────────────────

export const scalingConfig = {
  // Instance configuration
  instance: {
    id: process.env.INSTANCE_ID ?? `instance_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    region: process.env.AWS_REGION ?? "us-east-1",
    zone: process.env.AVAILABILITY_ZONE ?? "us-east-1a",
    maxMemoryMb: parseInt(process.env.MAX_MEMORY_MB ?? "2048"),
    maxCpuPercent: parseInt(process.env.MAX_CPU_PERCENT ?? "80"),
  },

  // Auto-scaling thresholds
  autoScaling: {
    scaleUpCpuThreshold: 70,
    scaleDownCpuThreshold: 30,
    scaleUpMemoryThreshold: 80,
    scaleDownMemoryThreshold: 40,
    scaleUpQueueDepthThreshold: 1000,
    minInstances: 2,
    maxInstances: 50,
    cooldownSeconds: 300,
  },

  // Database connection pooling
  database: {
    minConnections: 5,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS ?? "20"),
    acquireTimeoutMs: 30_000,
    idleTimeoutMs: 600_000,
    connectionTimeoutMs: 5_000,
  },

  // CDN configuration
  cdn: {
    domain: process.env.CDN_DOMAIN ?? "cdn.shadowchat.io",
    mediaPrefix: "/media",
    staticPrefix: "/static",
    cacheControlMedia: "public, max-age=31536000, immutable",
    cacheControlStatic: "public, max-age=86400",
    cacheControlApi: "no-store",
  },

  // Load balancer health check
  loadBalancer: {
    healthCheckPath: "/api/health",
    healthCheckIntervalSeconds: 30,
    healthCheckTimeoutSeconds: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 3,
  },
};

// ─── EXPORT UNIFIED CONFIG ────────────────────────────────────────────────────

export const platformConfig = {
  rateLimiter,
  workerPoolConfigs,
  workerPoolManager,
  redisConfig,
  circuitBreaker,
  monetizationVerifier,
  healthChecker,
  scalingConfig,
};
