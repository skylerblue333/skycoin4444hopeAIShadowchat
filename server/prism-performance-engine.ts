import crypto from 'crypto';
/**
 * PRISM Performance Engine v1.0
 * Caching, CDN simulation, load balancing, metrics, profiling for SKYCOIN4444
 */

import { invokeLLM } from "./_core/llm";

// ============================================================
// TYPES
// ============================================================

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  hits: number;
  size: number;
}

export interface CacheStats {
  totalKeys: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsedBytes: number;
  evictions: number;
}

export interface MetricPoint {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

export interface PerformanceProfile {
  operationName: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  memoryBefore: number;
  memoryAfter: number;
  metadata: Record<string, unknown>;
}

export interface LoadBalancerNode {
  id: string;
  host: string;
  port: number;
  weight: number;
  activeConnections: number;
  totalRequests: number;
  errorRate: number;
  avgResponseMs: number;
  healthy: boolean;
  lastHealthCheck: number;
}

export interface CircuitBreakerState {
  name: string;
  state: "closed" | "open" | "half-open";
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  nextRetryTime: number;
  threshold: number;
}

export interface RateLimitRule {
  key: string;
  limit: number;
  windowMs: number;
  current: number;
  resetAt: number;
}

export interface CDNConfig {
  origins: string[];
  cacheRules: Array<{ pattern: string; ttl: number; compress: boolean }>;
  edgeLocations: string[];
  purgeEndpoint: string;
}

export interface QueryPlan {
  sql: string;
  estimatedCost: number;
  indexesUsed: string[];
  warnings: string[];
  optimizedSql?: string;
}

// ============================================================
// LRU CACHE ENGINE
// ============================================================

export class LRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttlMs = 300000): void {
    if (this.cache.has(key)) this.cache.delete(key);
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) { this.cache.delete(firstKey); this.evictions++; }
    }
    this.cache.set(key, {
      key, value, ttl: ttlMs,
      createdAt: Date.now(), hits: 0,
      size: JSON.stringify(value).length,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) { this.misses++; return null; }
    if (Date.now() - entry.createdAt > entry.ttl) {
      this.cache.delete(key); this.misses++; return null;
    }
    entry.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;
    return entry.value;
  }

  delete(key: string): boolean { return this.cache.delete(key); }

  clear(): void { this.cache.clear(); }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() - entry.createdAt > entry.ttl) { this.cache.delete(key); return false; }
    return true;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const memoryUsedBytes = Array.from(this.cache.values()).reduce((sum, e) => sum + e.size, 0);
    return {
      totalKeys: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
      totalHits: this.hits,
      totalMisses: this.misses,
      memoryUsedBytes,
      evictions: this.evictions,
    };
  }

  keys(): string[] { return Array.from(this.cache.keys()); }
  size(): number { return this.cache.size; }

  evictExpired(): number {
    let count = 0;
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > entry.ttl) { this.cache.delete(key); count++; }
    }
    return count;
  }
}

// ============================================================
// METRICS ENGINE
// ============================================================

export class MetricsEngine {
  private metrics: MetricPoint[] = [];
  private readonly maxPoints = 100000;
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  record(name: string, value: number, tags: Record<string, string> = {}): void {
    this.metrics.push({ name, value, timestamp: Date.now(), tags });
    if (this.metrics.length > this.maxPoints) this.metrics.shift();
  }

  increment(name: string, by = 1): void {
    this.counters.set(name, (this.counters.get(name) || 0) + by);
    this.record(name, this.counters.get(name)!, { type: "counter" });
  }

  gauge(name: string, value: number): void {
    this.gauges.set(name, value);
    this.record(name, value, { type: "gauge" });
  }

  histogram(name: string, value: number): void {
    const existing = this.histograms.get(name) || [];
    existing.push(value);
    if (existing.length > 1000) existing.shift();
    this.histograms.set(name, existing);
    this.record(name, value, { type: "histogram" });
  }

  getMetrics(name?: string, since?: number): MetricPoint[] {
    let result = this.metrics;
    if (name) result = result.filter(m => m.name === name);
    if (since) result = result.filter(m => m.timestamp >= since);
    return result;
  }

  getHistogramStats(name: string): { p50: number; p95: number; p99: number; mean: number; min: number; max: number } {
    const values = (this.histograms.get(name) || []).sort((a, b) => a - b);
    if (values.length === 0) return { p50: 0, p95: 0, p99: 0, mean: 0, min: 0, max: 0 };
    const p = (pct: number) => values[Math.floor(values.length * pct / 100)] || 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return { p50: p(50), p95: p(95), p99: p(99), mean, min: values[0], max: values[values.length - 1] };
  }

  getDashboard(): Record<string, unknown> {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histogramNames: Array.from(this.histograms.keys()),
      totalPoints: this.metrics.length,
    };
  }

  reset(): void {
    this.metrics = [];
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

// ============================================================
// PROFILER ENGINE
// ============================================================

export class ProfilerEngine {
  private profiles: PerformanceProfile[] = [];
  private activeProfiles = new Map<string, { startTime: number; memoryBefore: number; metadata: Record<string, unknown> }>();

  startProfile(operationName: string, metadata: Record<string, unknown> = {}): string {
    const id = `${operationName}_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`;
    this.activeProfiles.set(id, {
      startTime: Date.now(),
      memoryBefore: process.memoryUsage?.()?.heapUsed || 0,
      metadata,
    });
    return id;
  }

  endProfile(id: string): PerformanceProfile | null {
    const active = this.activeProfiles.get(id);
    if (!active) return null;
    this.activeProfiles.delete(id);
    const endTime = Date.now();
    const profile: PerformanceProfile = {
      operationName: id.split("_")[0],
      startTime: active.startTime,
      endTime,
      durationMs: endTime - active.startTime,
      memoryBefore: active.memoryBefore,
      memoryAfter: process.memoryUsage?.()?.heapUsed || 0,
      metadata: active.metadata,
    };
    this.profiles.push(profile);
    if (this.profiles.length > 10000) this.profiles.shift();
    return profile;
  }

  async profile<T>(operationName: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<{ result: T; profile: PerformanceProfile }> {
    const id = this.startProfile(operationName, metadata);
    const result = await fn();
    const profile = this.endProfile(id)!;
    return { result, profile };
  }

  getSlowOperations(thresholdMs = 1000): PerformanceProfile[] {
    return this.profiles.filter(p => p.durationMs >= thresholdMs).sort((a, b) => b.durationMs - a.durationMs);
  }

  getAverageDuration(operationName: string): number {
    const ops = this.profiles.filter(p => p.operationName === operationName);
    if (ops.length === 0) return 0;
    return ops.reduce((sum, p) => sum + p.durationMs, 0) / ops.length;
  }

  getSummary(): Array<{ operation: string; count: number; avgMs: number; maxMs: number; p95Ms: number }> {
    const grouped = new Map<string, number[]>();
    for (const p of this.profiles) {
      const arr = grouped.get(p.operationName) || [];
      arr.push(p.durationMs);
      grouped.set(p.operationName, arr);
    }
    return Array.from(grouped.entries()).map(([operation, durations]) => {
      const sorted = durations.sort((a, b) => a - b);
      return {
        operation,
        count: durations.length,
        avgMs: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxMs: sorted[sorted.length - 1],
        p95Ms: sorted[Math.floor(sorted.length * 0.95)] || 0,
      };
    });
  }
}

// ============================================================
// LOAD BALANCER ENGINE
// ============================================================

export class LoadBalancerEngine {
  private nodes: LoadBalancerNode[] = [
    { id: "node-1", host: "10.0.0.1", port: 3000, weight: 1, activeConnections: 0, totalRequests: 0, errorRate: 0.001, avgResponseMs: 45, healthy: true, lastHealthCheck: Date.now() },
    { id: "node-2", host: "10.0.0.2", port: 3000, weight: 1, activeConnections: 0, totalRequests: 0, errorRate: 0.002, avgResponseMs: 52, healthy: true, lastHealthCheck: Date.now() },
    { id: "node-3", host: "10.0.0.3", port: 3000, weight: 2, activeConnections: 0, totalRequests: 0, errorRate: 0.0005, avgResponseMs: 38, healthy: true, lastHealthCheck: Date.now() },
  ];
  private algorithm: "round-robin" | "least-connections" | "weighted" | "ip-hash" = "least-connections";
  private rrIndex = 0;

  getNextNode(clientIp?: string): LoadBalancerNode | null {
    const healthy = this.nodes.filter(n => n.healthy);
    if (healthy.length === 0) return null;

    switch (this.algorithm) {
      case "round-robin":
        return healthy[this.rrIndex++ % healthy.length];
      case "least-connections":
        return healthy.reduce((min, n) => n.activeConnections < min.activeConnections ? n : min, healthy[0]);
      case "weighted": {
        const totalWeight = healthy.reduce((sum, n) => sum + n.weight, 0);
        let rand = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * totalWeight;
        for (const node of healthy) { rand -= node.weight; if (rand <= 0) return node; }
        return healthy[0];
      }
      case "ip-hash": {
        if (!clientIp) return healthy[0];
        const hash = clientIp.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return healthy[hash % healthy.length];
      }
      default:
        return healthy[0];
    }
  }

  recordRequest(nodeId: string, success: boolean, responseMs: number): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    node.totalRequests++;
    node.avgResponseMs = (node.avgResponseMs * 0.9) + (responseMs * 0.1);
    if (!success) node.errorRate = Math.min(1, node.errorRate + 0.001);
    else node.errorRate = Math.max(0, node.errorRate - 0.0001);
  }

  healthCheck(): void {
    for (const node of this.nodes) {
      node.healthy = node.errorRate < 0.1;
      node.lastHealthCheck = Date.now();
    }
  }

  getNodes(): LoadBalancerNode[] { return this.nodes; }

  addNode(node: Omit<LoadBalancerNode, "totalRequests" | "lastHealthCheck">): void {
    this.nodes.push({ ...node, totalRequests: 0, lastHealthCheck: Date.now() });
  }

  removeNode(nodeId: string): void {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
  }

  setAlgorithm(algo: typeof this.algorithm): void { this.algorithm = algo; }

  getStats(): { totalNodes: number; healthyNodes: number; totalRequests: number; avgResponseMs: number } {
    const healthy = this.nodes.filter(n => n.healthy);
    const totalRequests = this.nodes.reduce((sum, n) => sum + n.totalRequests, 0);
    const avgResponseMs = this.nodes.length > 0
      ? this.nodes.reduce((sum, n) => sum + n.avgResponseMs, 0) / this.nodes.length
      : 0;
    return { totalNodes: this.nodes.length, healthyNodes: healthy.length, totalRequests, avgResponseMs };
  }
}

// ============================================================
// CIRCUIT BREAKER ENGINE
// ============================================================

export class CircuitBreakerEngine {
  private breakers = new Map<string, CircuitBreakerState>();

  private getBreaker(name: string, threshold = 5): CircuitBreakerState {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, {
        name, state: "closed", failureCount: 0, successCount: 0,
        lastFailureTime: 0, nextRetryTime: 0, threshold,
      });
    }
    return this.breakers.get(name)!;
  }

  canExecute(name: string): boolean {
    const breaker = this.getBreaker(name);
    if (breaker.state === "closed") return true;
    if (breaker.state === "open") {
      if (Date.now() >= breaker.nextRetryTime) {
        breaker.state = "half-open";
        return true;
      }
      return false;
    }
    return true; // half-open: allow one request
  }

  recordSuccess(name: string): void {
    const breaker = this.getBreaker(name);
    breaker.successCount++;
    if (breaker.state === "half-open") {
      breaker.state = "closed";
      breaker.failureCount = 0;
    }
  }

  recordFailure(name: string): void {
    const breaker = this.getBreaker(name);
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();
    if (breaker.state === "half-open" || breaker.failureCount >= breaker.threshold) {
      breaker.state = "open";
      breaker.nextRetryTime = Date.now() + 30000;
    }
  }

  async execute<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute(name)) throw new Error(`Circuit breaker OPEN for: ${name}`);
    try {
      const result = await fn();
      this.recordSuccess(name);
      return result;
    } catch (err) {
      this.recordFailure(name);
      throw err;
    }
  }

  getState(name: string): CircuitBreakerState { return this.getBreaker(name); }
  getAllStates(): CircuitBreakerState[] { return Array.from(this.breakers.values()); }
  reset(name: string): void { this.breakers.delete(name); }
}

// ============================================================
// RATE LIMITER ENGINE
// ============================================================

export class RateLimiterEngine {
  private rules = new Map<string, RateLimitRule>();

  check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let rule = this.rules.get(key);

    if (!rule || now >= rule.resetAt) {
      rule = { key, limit, windowMs, current: 0, resetAt: now + windowMs };
      this.rules.set(key, rule);
    }

    if (rule.current >= rule.limit) {
      return { allowed: false, remaining: 0, resetAt: rule.resetAt };
    }

    rule.current++;
    return { allowed: true, remaining: rule.limit - rule.current, resetAt: rule.resetAt };
  }

  reset(key: string): void { this.rules.delete(key); }
  getRules(): RateLimitRule[] { return Array.from(this.rules.values()); }
}

// ============================================================
// CDN SIMULATION ENGINE
// ============================================================

export class CDNEngine {
  private cache: LRUCache<string>;
  private config: CDNConfig = {
    origins: ["https://api.skycoin4444.com"],
    cacheRules: [
      { pattern: "/static/*", ttl: 86400000, compress: true },
      { pattern: "/api/prices/*", ttl: 30000, compress: false },
      { pattern: "/api/user/*", ttl: 0, compress: false },
    ],
    edgeLocations: ["us-east-1", "eu-west-1", "ap-southeast-1", "ap-northeast-1"],
    purgeEndpoint: "/cdn/purge",
  };

  constructor() {
    this.cache = new LRUCache<string>(50000);
  }

  getCacheTTL(path: string): number {
    for (const rule of this.config.cacheRules) {
      const pattern = rule.pattern.replace("*", ".*");
      if (new RegExp(pattern).test(path)) return rule.ttl;
    }
    return 60000; // default 1 minute
  }

  get(path: string): string | null { return this.cache.get(path); }

  set(path: string, content: string): void {
    const ttl = this.getCacheTTL(path);
    if (ttl > 0) this.cache.set(path, content, ttl);
  }

  purge(pattern: string): number {
    const keys = this.cache.keys().filter(k => new RegExp(pattern.replace("*", ".*")).test(k));
    keys.forEach(k => this.cache.delete(k));
    return keys.length;
  }

  getStats(): CacheStats { return this.cache.getStats(); }
  getEdgeLocations(): string[] { return this.config.edgeLocations; }
}

// ============================================================
// AI PERFORMANCE ADVISOR
// ============================================================

export class PerformanceAdvisor {
  async analyzeBottlenecks(profiles: PerformanceProfile[], metrics: MetricPoint[]): Promise<{ bottlenecks: string[]; recommendations: string[]; estimatedImprovement: string }> {
    const slowOps = profiles.filter(p => p.durationMs > 500).map(p => `${p.operationName}: ${p.durationMs}ms`).slice(0, 5);
    const prompt = `Analyze these performance bottlenecks: ${slowOps.join(", ")}. Provide 3 specific recommendations to improve performance. Return JSON: {"bottlenecks":[],"recommendations":[],"estimatedImprovement":"string"}`;
    try {
      const resp = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      const content = String(resp.choices[0]?.message?.content || "");
      if (content) return JSON.parse(content);
    } catch { /* fall through */ }
    return { bottlenecks: slowOps, recommendations: ["Add database indexes", "Enable query caching", "Use connection pooling"], estimatedImprovement: "30-50% latency reduction" };
  }

  async generateOptimizationReport(stats: Record<string, unknown>): Promise<string> {
    const prompt = `Generate a brief performance optimization report for a Web3 social platform with these stats: ${JSON.stringify(stats)}. Focus on actionable improvements.`;
    try {
      const resp = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      return String(resp.choices[0]?.message?.content || "") || "Report unavailable";
    } catch {
      return "Performance optimization report temporarily unavailable";
    }
  }
}

// ============================================================
// MAIN PRISM ENGINE
// ============================================================

export class PrismPerformanceEngine {
  public readonly cache: LRUCache;
  public readonly metrics: MetricsEngine;
  public readonly profiler: ProfilerEngine;
  public readonly loadBalancer: LoadBalancerEngine;
  public readonly circuitBreaker: CircuitBreakerEngine;
  public readonly rateLimiter: RateLimiterEngine;
  public readonly cdn: CDNEngine;
  public readonly advisor: PerformanceAdvisor;

  constructor() {
    this.cache = new LRUCache(10000);
    this.metrics = new MetricsEngine();
    this.profiler = new ProfilerEngine();
    this.loadBalancer = new LoadBalancerEngine();
    this.circuitBreaker = new CircuitBreakerEngine();
    this.rateLimiter = new RateLimiterEngine();
    this.cdn = new CDNEngine();
    this.advisor = new PerformanceAdvisor();
  }

  getSystemHealth(): { status: "healthy" | "degraded" | "critical"; score: number; details: Record<string, unknown> } {
    const lbStats = this.loadBalancer.getStats();
    const cacheStats = this.cache.getStats();
    const cbStates = this.circuitBreaker.getAllStates();
    const openBreakers = cbStates.filter(s => s.state === "open").length;

    let score = 100;
    if (lbStats.healthyNodes < lbStats.totalNodes) score -= 20;
    if (cacheStats.hitRate < 0.5) score -= 15;
    if (openBreakers > 0) score -= openBreakers * 10;
    if (lbStats.avgResponseMs > 500) score -= 20;

    return {
      status: score >= 80 ? "healthy" : score >= 60 ? "degraded" : "critical",
      score,
      details: { loadBalancer: lbStats, cache: cacheStats, openCircuitBreakers: openBreakers },
    };
  }
}

export const prismEngine = new PrismPerformanceEngine();
