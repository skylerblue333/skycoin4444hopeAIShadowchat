/**
 * Caching Strategies
 * Implements various caching patterns for performance optimization
 */

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  avgEntrySize: number;
}

/**
 * LRU (Least Recently Used) Cache
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private maxSize: number;
  private ttl: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 1000, ttl: number = 60000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get value from cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Update access info
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.hits++;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: K, value: V, ttl?: number): void {
    // Remove if already exists
    this.cache.delete(key);

    // Add new entry
    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl || this.ttl),
      hits: 0,
      lastAccessed: Date.now(),
    });

    // Evict least recently used if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Check if key exists
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete key
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalAccess = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: totalAccess > 0 ? this.hits / totalAccess : 0,
      avgEntrySize: this.cache.size > 0 ? this.cache.size / this.maxSize : 0,
    };
  }
}

/**
 * Time-based Cache with TTL
 */
export class TTLCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private ttl: number;

  constructor(ttl: number = 60000, cleanupIntervalMs: number = 60000) {
    this.ttl = ttl;

    // Cleanup expired entries periodically
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  /**
   * Get value from cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access info
    entry.hits++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: K, value: V, ttl?: number): void {
    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl || this.ttl),
      hits: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Delete key
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Multi-level Cache (L1: Memory, L2: Disk/Redis)
 */
export class MultiLevelCache<K, V> {
  private l1Cache: LRUCache<K, V>;
  private l2Cache: Map<K, V> = new Map(); // Placeholder for Redis/Disk
  private l1Size: number;
  private l2Size: number;

  constructor(l1Size: number = 1000, l2Size: number = 10000) {
    this.l1Cache = new LRUCache(l1Size);
    this.l1Size = l1Size;
    this.l2Size = l2Size;
  }

  /**
   * Get value from cache
   */
  get(key: K): V | undefined {
    // Try L1 first
    let value = this.l1Cache.get(key);
    if (value !== undefined) {
      return value;
    }

    // Try L2
    value = this.l2Cache.get(key);
    if (value !== undefined) {
      // Promote to L1
      this.l1Cache.set(key, value);
      return value;
    }

    return undefined;
  }

  /**
   * Set value in cache
   */
  set(key: K, value: V): void {
    // Always set in L1
    this.l1Cache.set(key, value);

    // Optionally set in L2 for persistence
    if (this.l2Cache.size < this.l2Size) {
      this.l2Cache.set(key, value);
    }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
  }

  /**
   * Get L1 statistics
   */
  getL1Stats(): CacheStats {
    return this.l1Cache.getStats();
  }

  /**
   * Get L2 size
   */
  getL2Size(): number {
    return this.l2Cache.size;
  }
}

/**
 * Cache invalidation strategies
 */
export class CacheInvalidationManager {
  private dependencies: Map<string, Set<string>> = new Map();

  /**
   * Register cache dependency
   */
  registerDependency(cacheKey: string, dependsOn: string): void {
    if (!this.dependencies.has(dependsOn)) {
      this.dependencies.set(dependsOn, new Set());
    }
    this.dependencies.get(dependsOn)!.add(cacheKey);
  }

  /**
   * Get dependent cache keys
   */
  getDependents(cacheKey: string): Set<string> {
    return this.dependencies.get(cacheKey) || new Set();
  }

  /**
   * Invalidate cache and dependents
   */
  invalidate(cacheKey: string): Set<string> {
    const toInvalidate = new Set<string>();
    const queue = [cacheKey];

    while (queue.length > 0) {
      const key = queue.shift()!;
      if (toInvalidate.has(key)) continue;

      toInvalidate.add(key);

      const dependents = this.getDependents(key);
      dependents.forEach((dep) => queue.push(dep));
    }

    return toInvalidate;
  }

  /**
   * Clear all dependencies
   */
  clear(): void {
    this.dependencies.clear();
  }
}

/**
 * Cache warming strategy
 */
export class CacheWarmer<K, V> {
  private cache: LRUCache<K, V> | TTLCache<K, V>;
  private loaders: Map<K, () => Promise<V>> = new Map();

  constructor(cache: LRUCache<K, V> | TTLCache<K, V>) {
    this.cache = cache;
  }

  /**
   * Register data loader
   */
  registerLoader(key: K, loader: () => Promise<V>): void {
    this.loaders.set(key, loader);
  }

  /**
   * Warm cache with all registered loaders
   */
  async warmCache(): Promise<void> {
    const promises = Array.from(this.loaders.entries()).map(async ([key, loader]) => {
      try {
        const value = await loader();
        this.cache.set(key, value);
      } catch (error) {
        console.error(`Failed to warm cache for key:`, key, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Warm specific cache key
   */
  async warmKey(key: K): Promise<void> {
    const loader = this.loaders.get(key);
    if (!loader) {
      throw new Error(`No loader registered for key: ${String(key)}`);
    }

    const value = await loader();
    this.cache.set(key, value);
  }
}

/**
 * Cache key builder
 */
export class CacheKeyBuilder {
  /**
   * Build cache key from components
   */
  static build(...components: (string | number | boolean)[]): string {
    return components.map((c) => String(c)).join(":");
  }

  /**
   * Build user-specific cache key
   */
  static userKey(userId: string, resource: string, ...params: any[]): string {
    return this.build("user", userId, resource, ...params);
  }

  /**
   * Build resource cache key
   */
  static resourceKey(resource: string, id: string, ...params: any[]): string {
    return this.build("resource", resource, id, ...params);
  }

  /**
   * Build query cache key
   */
  static queryKey(query: string, ...params: any[]): string {
    return this.build("query", query, ...params);
  }
}

export default {
  LRUCache,
  TTLCache,
  MultiLevelCache,
  CacheInvalidationManager,
  CacheWarmer,
  CacheKeyBuilder,
};
