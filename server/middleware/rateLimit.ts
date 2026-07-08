/**
 * In-memory rate limiter for production use
 * For distributed systems, use Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // Increment count
    entry.count++;

    if (entry.count > this.maxRequests) {
      return false;
    }

    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key: string): number {
    const entry = this.store.get(key);
    if (!entry) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Reset a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }
}

// Pre-configured rate limiters
export const authRateLimiter = new RateLimiter(
  15 * 60 * 1000, // 15 minutes
  5 // 5 attempts
);

export const apiRateLimiter = new RateLimiter(
  60 * 1000, // 1 minute
  100 // 100 requests
);

export const passwordResetRateLimiter = new RateLimiter(
  60 * 60 * 1000, // 1 hour
  3 // 3 attempts
);

export const emailVerificationRateLimiter = new RateLimiter(
  60 * 60 * 1000, // 1 hour
  5 // 5 attempts
);

/**
 * Create a rate limit error response
 */
export function createRateLimitError(resetTime: number) {
  const secondsUntilReset = Math.ceil((resetTime - Date.now()) / 1000);
  return {
    code: "RATE_LIMITED",
    message: `Too many requests. Please try again in ${secondsUntilReset} seconds.`,
    retryAfter: secondsUntilReset,
  };
}

/**
 * Rate limit middleware for tRPC
 */
export function rateLimitMiddleware(limiter: RateLimiter, maxRequests?: number) {
  return ({ ctx, next }: any) => {
    const key = ctx.user?.id || ctx.ip || "anonymous";

    if (!limiter.isAllowed(key)) {
      const resetTime = limiter.getResetTime(key);
      const error = createRateLimitError(resetTime);
      throw new Error(error.message);
    }

    return next({ ctx });
  };
}

export default RateLimiter;
