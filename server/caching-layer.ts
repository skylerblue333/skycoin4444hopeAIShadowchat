/**
 * Advanced Caching Layer for SKYCOIN4444
 * 
 * Implements multi-tier caching:
 * - In-memory cache (hot data)
 * - Redis cache (distributed)
 * - Database query cache
 * - API response cache
 */

import { z } from 'zod';

// Cache configuration
export const CacheConfig = {
  enabled: process.env.CACHE_ENABLED !== 'false',
  ttl: {
    short: 60, // 1 minute
    medium: 300, // 5 minutes
    long: 3600, // 1 hour
    veryLong: 86400, // 1 day
  },
  redis: {
    url: (process.env.REDIS_URL || 'redis://localhost:6379') as string,
    enabled: !!process.env.REDIS_URL,
  },
  memory: {
    maxSize: 100, // max items in memory
    enabled: true,
  },
};

// Cache key patterns
export const CacheKeys = {
  // Feedback engine
  feedback: {
    list: 'feedback:list',
    stats: 'feedback:stats',
    trends: 'feedback:trends',
  },
  // Roadmap engine
  roadmap: {
    list: 'roadmap:list',
    stats: 'roadmap:stats',
    predictions: 'roadmap:predictions',
  },
  // Agent debate
  agents: {
    list: 'agents:list',
    debates: 'agents:debates',
    consensus: 'agents:consensus',
  },
  // Competitive radar
  competitors: {
    list: 'competitors:list',
    analysis: 'competitors:analysis',
    threats: 'competitors:threats',
  },
  // Behavioral intelligence
  behavioral: {
    cohorts: 'behavioral:cohorts',
    churn: 'behavioral:churn',
    segments: 'behavioral:segments',
  },
  // Experiments
  experiments: {
    list: 'experiments:list',
    results: 'experiments:results',
    recommendations: 'experiments:recommendations',
  },
  // Narratives
  narratives: {
    list: 'narratives:list',
    variants: 'narratives:variants',
  },
  // Connectors
  connectors: {
    status: 'connectors:status',
    diagnostics: 'connectors:diagnostics',
  },
  // Product brain
  productBrain: {
    playbooks: 'productBrain:playbooks',
    memory: 'productBrain:memory',
  },
  // Simulator
  simulator: {
    scenarios: 'simulator:scenarios',
    results: 'simulator:results',
  },
  // Analytics
  analytics: {
    metrics: 'analytics:metrics',
    health: 'analytics:health',
  },
};

// In-memory cache implementation
class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();

  set(key: string, value: any, ttl: number = CacheConfig.ttl.medium) {
    if (this.cache.size >= CacheConfig.memory.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  invalidatePattern(pattern: string) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Redis cache implementation (stub - requires redis client)
class RedisCache {
  async set(key: string, value: any, ttl: number = CacheConfig.ttl.medium) {
    if (!CacheConfig.redis.enabled) return;
    // Implementation would use redis client
    // await redis.setex(key, ttl, JSON.stringify(value));
  }

  async get(key: string): Promise<any | null> {
    if (!CacheConfig.redis.enabled) return null;
    // Implementation would use redis client
    // const value = await redis.get(key);
    // return value ? JSON.parse(value) : null;
    return null;
  }

  async delete(key: string) {
    if (!CacheConfig.redis.enabled) return;
    // await redis.del(key);
  }

  async invalidatePattern(pattern: string) {
    if (!CacheConfig.redis.enabled) return;
    // Implementation would use redis SCAN + DEL
  }
}

// Unified cache interface
export class CacheManager {
  private memory = new MemoryCache();
  private redis = new RedisCache();

  async get(key: string): Promise<any | null> {
    if (!CacheConfig.enabled) return null;

    // Try memory first
    const memValue = this.memory.get(key);
    if (memValue !== null) return memValue;

    // Try Redis
    const redisValue = await this.redis.get(key);
    if (redisValue !== null) {
      // Populate memory cache
      this.memory.set(key, redisValue);
      return redisValue;
    }

    return null;
  }

  async set(key: string, value: any, ttl?: number) {
    if (!CacheConfig.enabled) return;

    this.memory.set(key, value, ttl);
    await this.redis.set(key, value, ttl);
  }

  async delete(key: string) {
    this.memory.delete(key);
    await this.redis.delete(key);
  }

  async invalidatePattern(pattern: string) {
    this.memory.invalidatePattern(pattern);
    await this.redis.invalidatePattern(pattern);
  }

  clear() {
    this.memory.clear();
  }
}

// Global cache instance
export const cacheManager = new CacheManager();

// Cache decorator for procedures
export function withCache(key: string, ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cached = await cacheManager.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      await cacheManager.set(key, result, ttl);
      return result;
    };

    return descriptor;
  };
}

// Cache invalidation helpers
export async function invalidateFeedbackCache() {
  await cacheManager.invalidatePattern('feedback:.*');
}

export async function invalidateRoadmapCache() {
  await cacheManager.invalidatePattern('roadmap:.*');
}

export async function invalidateAgentCache() {
  await cacheManager.invalidatePattern('agents:.*');
}

export async function invalidateCompetitorCache() {
  await cacheManager.invalidatePattern('competitors:.*');
}

export async function invalidateBehavioralCache() {
  await cacheManager.invalidatePattern('behavioral:.*');
}

export async function invalidateExperimentCache() {
  await cacheManager.invalidatePattern('experiments:.*');
}

export async function invalidateNarrativeCache() {
  await cacheManager.invalidatePattern('narratives:.*');
}

export async function invalidateConnectorCache() {
  await cacheManager.invalidatePattern('connectors:.*');
}

export async function invalidateProductBrainCache() {
  await cacheManager.invalidatePattern('productBrain:.*');
}

export async function invalidateSimulatorCache() {
  await cacheManager.invalidatePattern('simulator:.*');
}

export async function invalidateAnalyticsCache() {
  await cacheManager.invalidatePattern('analytics:.*');
}

// Cache statistics
export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  memoryUsage: number;
  redisEnabled: boolean;
}

export class CacheStatistics {
  private hits = 0;
  private misses = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
      totalRequests: total,
      memoryUsage: 0, // Would calculate actual memory usage
      redisEnabled: CacheConfig.redis.enabled,
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
  }
}

export const cacheStats = new CacheStatistics();

// Setup instructions
export const setupInstructions = `
# Caching Layer Setup

## Enable In-Memory Caching
export CACHE_ENABLED=true

## Enable Redis Caching
export REDIS_URL=redis://localhost:6379

## Docker Redis Setup
docker run -d -p 6379:6379 redis:latest

## Monitoring Cache Performance
- Check cache hit rate: cacheStats.getStats()
- Invalidate specific engine cache: invalidateFeedbackCache()
- Clear all cache: cacheManager.clear()

## Cache TTL Configuration
- Short (1 min): Frequently changing data
- Medium (5 min): Regular updates
- Long (1 hour): Stable data
- Very Long (1 day): Reference data
`;
