import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import crypto from 'crypto';

interface SecurityContext {
  requestId: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  suspiciousFlags: string[];
}

class SecurityMonitor {
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  recordFailedAttempt(ip: string): void {
    const attempt = this.failedAttempts.get(ip) || { count: 0, lastAttempt: new Date() };
    attempt.count++;
    attempt.lastAttempt = new Date();
    this.failedAttempts.set(ip, attempt);

    if (attempt.count >= this.MAX_FAILED_ATTEMPTS) {
      this.suspiciousIPs.add(ip);
      console.warn(`[SecurityMonitor] IP ${ip} has exceeded failed attempt threshold. Blocking temporarily.`);
    }
  }

  recordSuccessfulAttempt(ip: string): void {
    this.failedAttempts.delete(ip);
  }

  isIPBlocked(ip: string): boolean {
    if (!this.suspiciousIPs.has(ip)) return false;

    const attempt = this.failedAttempts.get(ip);
    if (!attempt) return false;

    const timeSinceLast = Date.now() - attempt.lastAttempt.getTime();
    if (timeSinceLast > this.LOCKOUT_DURATION) {
      this.suspiciousIPs.delete(ip);
      this.failedAttempts.delete(ip);
      return false;
    }

    return true;
  }

  getSecurityStats() {
    return {
      suspiciousIPs: this.suspiciousIPs.size,
      failedAttempts: this.failedAttempts.size,
      blockedIPs: Array.from(this.suspiciousIPs),
    };
  }
}

export const securityMonitor = new SecurityMonitor();

export const createSecurityMiddleware = () => {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' },
    skip: (req) => req.path === '/api/health',
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // 30 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again later.' },
    handler: (req, res) => {
      const ip = req.ip || 'unknown';
      securityMonitor.recordFailedAttempt(ip);
      res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' });
    },
  });

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'API rate limit exceeded.' },
  });

  const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'Upload rate limit exceeded.' },
  });

  const helmetConfig = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
        fontSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });

  const securityHeadersMiddleware = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  };

  const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  };

  const ipBlockingMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    if (securityMonitor.isIPBlocked(ip)) {
            res.status(403).json({ error: 'Access denied. Your IP has been temporarily blocked due to suspicious activity.' });
      return;
    }
    next();
  };

  const inputSanitizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        return value
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
      if (typeof value === 'object' && value !== null) {
        const sanitized: any = Array.isArray(value) ? [] : {};
        for (const key in value) {
          sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
      }
      return value;
    };

    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    if (req.query) {
      req.query = sanitizeValue(req.query);
    }
    next();
  };

  return {
    globalLimiter,
    authLimiter,
    apiLimiter,
    uploadLimiter,
    helmetConfig,
    securityHeadersMiddleware,
    requestIdMiddleware,
    ipBlockingMiddleware,
    inputSanitizationMiddleware,
  };
};

export const applySecurityMiddleware = (app: any) => {
  const middleware = createSecurityMiddleware();

  app.use(middleware.helmetConfig);
  app.use(middleware.requestIdMiddleware);
  app.use(middleware.ipBlockingMiddleware);
  app.use(middleware.securityHeadersMiddleware);
  app.use(middleware.globalLimiter);
  app.use(middleware.inputSanitizationMiddleware);

  return middleware;
};
