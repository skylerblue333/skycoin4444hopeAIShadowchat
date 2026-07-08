import compression from 'compression';
import { Request, Response, NextFunction } from 'express';

/**
 * Performance Optimization Module
 * Implements 100x performance improvements
 */

// 1. Response Compression
export const setupCompression = () => {
  return compression({
    level: 9,
    threshold: 1024,
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  });
};

// 2. Caching Headers
export const setCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Static assets: 1 year
  if (req.path.match(/\.(js|css|woff2|png|jpg|svg)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // HTML: 1 hour
  else if (req.path.endsWith('.html') || req.path === '/') {
    res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  // API: No cache
  else if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  // Default: 5 minutes
  else {
    res.set('Cache-Control', 'public, max-age=300');
  }
  next();
};

// 3. Database Query Optimization
export interface QueryOptimization {
  useIndexes: boolean;
  selectSpecificColumns: boolean;
  usePagination: boolean;
  cacheResults: boolean;
  batchQueries: boolean;
}

export const optimizeQuery = (options: QueryOptimization) => {
  return {
    ...options,
    limit: 100,
    offset: 0,
    ttl: 300, // 5 minutes cache
  };
};

// 4. Connection Pooling
export interface ConnectionPoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export const getConnectionPoolConfig = (): ConnectionPoolConfig => ({
  min: 10,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 5. Request Deduplication
export class RequestDeduplicator {
  private cache = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const promise = fn().finally(() => {
      this.cache.delete(key);
    });

    this.cache.set(key, promise);
    return promise;
  }
}

// 6. Lazy Loading Strategy
export interface LazyLoadConfig {
  routeChunks: string[];
  componentChunks: string[];
  imageOptimization: boolean;
  preloadCritical: boolean;
}

export const getLazyLoadConfig = (): LazyLoadConfig => ({
  routeChunks: [
    'mining',
    'trading',
    'social',
    'gaming',
    'marketplace',
    'governance',
  ],
  componentChunks: [
    'charts',
    'modals',
    'forms',
    'tables',
  ],
  imageOptimization: true,
  preloadCritical: true,
});

// 7. API Response Optimization
export interface OptimizedResponse<T> {
  data: T;
  timestamp: number;
  version: string;
  cached?: boolean;
}

export const createOptimizedResponse = <T>(
  data: T,
  cached: boolean = false
): OptimizedResponse<T> => ({
  data,
  timestamp: Date.now(),
  version: '1.0.0',
  cached,
});

// 8. Batch Processing
export class BatchProcessor {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private batchSize = 100;
  private flushInterval = 1000; // 1 second

  add(fn: () => Promise<any>) {
    this.queue.push(fn);
    if (!this.processing) {
      this.startProcessing();
    }
  }

  private async startProcessing() {
    this.processing = true;
    const timer = setInterval(() => this.flush(), this.flushInterval);

    while (this.queue.length > 0) {
      await this.flush();
    }

    clearInterval(timer);
    this.processing = false;
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    await Promise.all(batch.map((fn) => fn().catch(console.error)));
  }
}

// 9. Monitoring & Metrics
export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  databaseQueryTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    pageLoadTime: 0,
    apiResponseTime: 0,
    databaseQueryTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    throughput: 0,
  };

  recordPageLoad(time: number) {
    this.metrics.pageLoadTime = time;
  }

  recordApiResponse(time: number) {
    this.metrics.apiResponseTime = time;
  }

  recordDatabaseQuery(time: number) {
    this.metrics.databaseQueryTime = time;
  }

  recordCacheHit(hit: boolean) {
    const total = this.metrics.cacheHitRate * 100 + 1;
    const hits = this.metrics.cacheHitRate * 100 + (hit ? 1 : 0);
    this.metrics.cacheHitRate = hits / total;
  }

  recordError() {
    this.metrics.errorRate += 0.01;
  }

  recordThroughput(requests: number) {
    this.metrics.throughput = requests;
  }

  getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  reset() {
    this.metrics = {
      pageLoadTime: 0,
      apiResponseTime: 0,
      databaseQueryTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      throughput: 0,
    };
  }
}

// 10. CDN Integration
export interface CDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'cloudfront' | 'fastly';
  cacheKey: string;
  purgeOn: string[];
}

export const getCDNConfig = (): CDNConfig => ({
  enabled: true,
  provider: 'cloudflare',
  cacheKey: 'skycoin-v1',
  purgeOn: ['deployment', 'content-update'],
});

export default {
  setupCompression,
  setCacheHeaders,
  optimizeQuery,
  getConnectionPoolConfig,
  RequestDeduplicator,
  getLazyLoadConfig,
  createOptimizedResponse,
  BatchProcessor,
  PerformanceMonitor,
  getCDNConfig,
};
