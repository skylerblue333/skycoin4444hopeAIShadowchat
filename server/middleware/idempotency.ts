import crypto from 'crypto';
/**
 * SKYCOIN4444 — Idempotent API Middleware
 * =========================================
 * Prevents duplicate delivery completions when drivers lose cell coverage.
 * Uses in-memory cache (production: replace with Redis).
 *
 * Usage: app.use('/api/deliveries', idempotencyMiddleware);
 *
 * Client sends: Idempotency-Key: <uuid-v4>
 * Server processes exactly once, returns cached result on retry.
 */

import type { Request, Response, NextFunction } from "express";

// ── In-memory cache (replace with Redis in production) ───────────────────────
const idempotencyCache = new Map<string, { status: number; body: unknown; timestamp: number }>();

// Clean up expired keys every 5 minutes
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Idempotency middleware — enforces exactly-once processing.
 * Attach to any mutation endpoint that must not be processed twice.
 */
export function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Only apply to state-mutating methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    next();
    return;
  }

  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

  if (!idempotencyKey) {
    // Idempotency key is optional — allow through without caching
    next();
    return;
  }

  // Validate key format (must be UUID v4)
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV4Regex.test(idempotencyKey)) {
    res.status(400).json({
      error: "Invalid Idempotency-Key format. Must be a valid UUID v4.",
      example: "550e8400-e29b-41d4-a716-446655440000",
    });
    return;
  }

  const cacheKey = `idempotency:${req.path}:${idempotencyKey}`;

  // Check if we already processed this request
  const cached = idempotencyCache.get(cacheKey);
  if (cached) {
    res.status(cached.status).json({
      ...((cached.body as object) ?? {}),
      _idempotent: true,
      _cachedAt: new Date(cached.timestamp).toISOString(),
    });
    return;
  }

  // Intercept res.json to cache the successful response
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(cacheKey, {
        status: res.statusCode,
        body,
        timestamp: Date.now(),
      });
    }
    return originalJson(body);
  };

  next();
}

/**
 * Rate limiting middleware — prevents API abuse.
 * Tracks request counts per IP with sliding window.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(
  maxRequests = 100,
  windowMs = 60 * 1000
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const key = `ratelimit:${ip}`;

    const current = rateLimitStore.get(key);

    if (!current || now > current.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      res.setHeader("X-RateLimit-Reset", new Date(now + windowMs).toISOString());
      next();
      return;
    }

    if (current.count >= maxRequests) {
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", new Date(current.resetAt).toISOString());
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again after ${new Date(current.resetAt).toISOString()}`,
        retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
      });
      return;
    }

    current.count++;
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - current.count);
    res.setHeader("X-RateLimit-Reset", new Date(current.resetAt).toISOString());
    next();
  };
}

/**
 * OpenTelemetry-compatible request tracing middleware.
 * Adds trace IDs to all responses for distributed tracing.
 */
export function tracingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const traceId =
    (req.headers["x-trace-id"] as string) ??
    `trace-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 9)}`;
  const spanId = `span-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 9)}`;
  const requestStart = Date.now();

  // Attach trace context to request
  (req as Request & { traceId: string; spanId: string }).traceId = traceId;
  (req as Request & { traceId: string; spanId: string }).spanId = spanId;

  // Set trace headers on response
  res.setHeader("X-Trace-Id", traceId);
  res.setHeader("X-Span-Id", spanId);

  // Log request completion with timing
  res.on("finish", () => {
    const duration = Date.now() - requestStart;
    const logEntry = {
      timestamp: new Date().toISOString(),
      traceId,
      spanId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    // Flag slow requests (> 500ms) for investigation
    if (duration > 500) {
      console.warn(`[Tracing] Slow request detected: ${JSON.stringify(logEntry)}`);
    } else if (res.statusCode >= 500) {
      console.error(`[Tracing] Server error detected: ${JSON.stringify(logEntry)}`);
    } else {
      console.log(`[Tracing] Request completed: ${JSON.stringify(logEntry)}`);
    }
  });

  next();
}

/**
 * Geospatial query builder for PostGIS.
 * Finds drivers within radius using ST_DWithin spatial index.
 */
export function buildGeospatialQuery(
  tableName: string,
  locationColumn: string,
  lat: number,
  lng: number,
  radiusMeters: number
): { sql: string; params: (number | string)[] } {
  return {
    sql: `
      SELECT *, 
        ST_Distance(
          ${locationColumn}::geography,
          ST_SetSRID(ST_MakePoint(?, ?)::geography, 4326)
        ) AS distance_meters
      FROM ${tableName}
      WHERE ST_DWithin(
        ${locationColumn}::geography,
        ST_SetSRID(ST_MakePoint(?, ?)::geography, 4326),
        ?
      )
      ORDER BY distance_meters ASC
    `,
    params: [lng, lat, lng, lat, radiusMeters],
  };
}
