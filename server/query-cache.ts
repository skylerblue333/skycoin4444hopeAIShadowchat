/**
 * Query Cache & Slow Query Logger
 * In-memory LRU-style cache for expensive DB queries.
 * Logs any query exceeding SLOW_QUERY_THRESHOLD_MS.
 */

const SLOW_QUERY_THRESHOLD_MS = 200;
const DEFAULT_TTL_MS = 30_000; // 30 seconds
const MAX_CACHE_SIZE = 500;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

interface QueryStats {
  key: string;
  durationMs: number;
  cached: boolean;
  timestamp: string;
}

// ── In-memory LRU Cache ────────────────────────────────────────────────────
const cache = new Map<string, CacheEntry<unknown>>();
const slowQueryLog: QueryStats[] = [];

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) cache.delete(key);
  }
}

function evictOldest() {
  const oldest = cache.keys().next().value;
  if (oldest) cache.delete(oldest);
}

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  entry.hits++;
  return entry.value;
}

export function cacheSet<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    evictExpired();
    if (cache.size >= MAX_CACHE_SIZE) evictOldest();
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs, hits: 0 });
}

export function cacheInvalidate(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function cacheClear(): void {
  cache.clear();
}

export function cacheStats() {
  evictExpired();
  let totalHits = 0;
  for (const entry of cache.values()) totalHits += entry.hits;
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    totalHits,
    keys: Array.from(cache.keys()).slice(0, 20),
  };
}

// ── Cached Query Wrapper ───────────────────────────────────────────────────
export async function cachedQuery<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;

  const start = Date.now();
  const result = await fn();
  const durationMs = Date.now() - start;

  cacheSet(key, result, ttlMs);
  logQuery(key, durationMs, false);

  return result;
}

// ── Slow Query Logger ──────────────────────────────────────────────────────
function logQuery(key: string, durationMs: number, cached: boolean) {
  if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
    const entry: QueryStats = {
      key,
      durationMs,
      cached,
      timestamp: new Date().toISOString(),
    };
    slowQueryLog.push(entry);
    if (slowQueryLog.length > 100) slowQueryLog.shift();
      }
}

export function getSlowQueryLog(): QueryStats[] {
  return [...slowQueryLog];
}

// ── Timed Query Wrapper (no cache, just timing) ────────────────────────────
export async function timedQuery<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  logQuery(key, Date.now() - start, false);
  return result;
}

// ── Cache Key Builders ─────────────────────────────────────────────────────
export const CacheKeys = {
  feed: (userId: string, page: number) => `feed:${userId}:${page}`,
  trending: () => `trending:global`,
  userProfile: (userId: string) => `profile:${userId}`,
  userFollowers: (userId: string) => `followers:${userId}`,
  userFollowing: (userId: string) => `following:${userId}`,
  postLikes: (postId: string) => `likes:post:${postId}`,
  communityList: () => `communities:list`,
  communityPosts: (communityId: string, page: number) => `community:${communityId}:posts:${page}`,
  leaderboard: (type: string) => `leaderboard:${type}`,
  tokenPrices: () => `prices:tokens`,
  stakingPools: () => `staking:pools`,
  nftList: (userId: string) => `nfts:${userId}`,
  charityList: () => `charity:campaigns`,
  marketplaceProducts: (category: string, page: number) => `marketplace:${category}:${page}`,
  dhgateProducts: (category: string) => `dhgate:${category}`,
  platformStats: () => `platform:stats`,
  aiRecommendations: (userId: string) => `ai:recs:${userId}`,
};

// ── Cache Invalidation Groups ──────────────────────────────────────────────
export const CacheInvalidators = {
  onNewPost: (userId: string) => {
    cacheInvalidate(`feed:`);
    cacheInvalidate(`trending:`);
    cacheInvalidate(`profile:${userId}`);
  },
  onFollowChange: (userId: string) => {
    cacheInvalidate(`followers:${userId}`);
    cacheInvalidate(`following:${userId}`);
    cacheInvalidate(`feed:${userId}`);
  },
  onLike: (postId: string) => {
    cacheInvalidate(`likes:post:${postId}`);
  },
  onStakeChange: () => {
    cacheInvalidate(`staking:`);
  },
  onMarketplaceChange: () => {
    cacheInvalidate(`marketplace:`);
    cacheInvalidate(`dhgate:`);
  },
  onCharityChange: () => {
    cacheInvalidate(`charity:`);
  },
};
