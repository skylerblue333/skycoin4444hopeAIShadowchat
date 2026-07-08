import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
// Redis client will be initialized at runtime

// ============================================
// PRODUCTION HARDENING MODULE
// ============================================

// 1. RATE LIMITING
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health", // Skip health checks
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: "Too many login attempts, please try again later",
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000, // 1000 requests per minute
  keyGenerator: (req) => (req as any).user?.id || req.ip,
});

// 2. SECURITY HEADERS
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

// 3. COMPRESSION
export const compressionMiddleware = compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
});

// 4. ERROR HANDLING
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Log unexpected errors
  
  res.status(500).json({
    status: "error",
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// 5. REQUEST LOGGING
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: (req as any).user?.id,
    }));
  });

  next();
};

// 6. INPUT VALIDATION
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      (req as any).body = validated;
      next();
    } catch (error) {
      throw new AppError("Invalid input", 400);
    }
  };
};

// 7. REDIS CACHING
// Redis client initialization
let redisClient: any = null;
try {
  // Initialize Redis client if available
  // const redis = require('redis');
  // redisClient = redis.createClient();
} catch (error) {
  }

export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();

    const key = `cache:${req.path}:${JSON.stringify(req.query)}`;

    if (redisClient) {
      try {
        const cached = await redisClient.get(key);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (error) {
              }

      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        try {
          redisClient.setEx(key, ttl, JSON.stringify(data)).catch(console.error);
        } catch (error) {
                  }
        return originalJson(data);
      };
    }

    next();
  };
};

// 8. CIRCUIT BREAKER
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new AppError("Service temporarily unavailable", 503);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
    }
  }
}

// 9. RETRY LOGIC
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

// 10. MONITORING
export interface Metrics {
  apiLatency: number[];
  errorRate: number;
  uptime: number;
  activeUsers: number;
  totalRequests: number;
  failedRequests: number;
}

export class MetricsCollector {
  private metrics: Metrics = {
    apiLatency: [],
    errorRate: 0,
    uptime: Date.now(),
    activeUsers: 0,
    totalRequests: 0,
    failedRequests: 0,
  };

  recordRequest(latency: number, success: boolean) {
    this.metrics.apiLatency.push(latency);
    this.metrics.totalRequests++;
    if (!success) this.metrics.failedRequests++;

    // Keep only last 1000 measurements
    if (this.metrics.apiLatency.length > 1000) {
      this.metrics.apiLatency.shift();
    }

    this.updateErrorRate();
  }

  private updateErrorRate() {
    this.metrics.errorRate =
      (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
  }

  getMetrics() {
    const avgLatency =
      this.metrics.apiLatency.reduce((a, b) => a + b, 0) /
      this.metrics.apiLatency.length;
    const p95Latency = this.getPercentile(95);
    const p99Latency = this.getPercentile(99);

    return {
      ...this.metrics,
      avgLatency,
      p95Latency,
      p99Latency,
      uptime: `${Math.floor((Date.now() - this.metrics.uptime) / 1000)}s`,
    };
  }

  private getPercentile(percentile: number) {
    const sorted = [...this.metrics.apiLatency].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

// 11. BACKUP & RECOVERY
export async function backupDatabase() {
  const timestamp = new Date().toISOString();
  
  try {
    // Implement actual backup logic
    // This is a placeholder for the backup implementation
      } catch (error) {
        throw new AppError("Backup failed", 500);
  }
}

// 12. HEALTH CHECK
export const healthCheck = (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
};

// Export all middleware for easy integration
export const productionMiddleware = [
  securityHeaders,
  compressionMiddleware,
  globalLimiter,
  requestLogger,
  cacheMiddleware(300),
];

export default {
  globalLimiter,
  strictLimiter,
  apiLimiter,
  securityHeaders,
  compressionMiddleware,
  errorHandler,
  requestLogger,
  validateInput,
  redisClient,
  cacheMiddleware,
  CircuitBreaker,
  retryWithBackoff,
  MetricsCollector,
  backupDatabase,
  healthCheck,
  AppError,
};
