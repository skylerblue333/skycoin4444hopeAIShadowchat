import { logDatabaseOperation } from "./logging";

/**
 * Database Query Optimization Utilities
 * Provides caching, batching, and query optimization strategies
 */

export interface QueryCache<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface BatchQueryOptions {
  batchSize?: number;
  timeout?: number;
}

export interface QueryMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  slowQueries: number;
}

/**
 * Simple in-memory query cache
 */
class QueryCacheManager {
  private cache: Map<string, QueryCache<any>> = new Map();
  private metrics: QueryMetrics = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    slowQueries: 0,
  };

  /**
   * Generate cache key from query and parameters
   */
  private generateCacheKey(query: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params) : "";
    return `${query}:${paramStr}`;
  }

  /**
   * Get cached result
   */
  get<T>(query: string, params?: Record<string, any>): T | null {
    const key = this.generateCacheKey(query, params);
    const cached = this.cache.get(key);

    if (!cached) {
      this.metrics.cacheMisses++;
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      this.metrics.cacheMisses++;
      return null;
    }

    this.metrics.cacheHits++;
    return cached.data as T;
  }

  /**
   * Set cache entry
   */
  set<T>(query: string, data: T, ttl: number = 60000, params?: Record<string, any>): void {
    const key = this.generateCacheKey(query, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(query: string, params?: Record<string, any>): void {
    const key = this.generateCacheKey(query, params);
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache metrics
   */
  getMetrics(): QueryMetrics {
    return { ...this.metrics };
  }

  /**
   * Record query execution
   */
  recordQuery(responseTime: number, isSlow: boolean = false): void {
    this.metrics.totalQueries++;
    if (isSlow) {
      this.metrics.slowQueries++;
    }

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalQueries - 1);
    this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.totalQueries;
  }
}

export const queryCache = new QueryCacheManager();

/**
 * Batch query executor
 */
export class BatchQueryExecutor<T> {
  private queue: Array<() => Promise<T>> = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchSize: number;
  private timeoutMs: number;
  private resolvers: Array<(value: T) => void> = [];
  private rejecters: Array<(reason?: any) => void> = [];

  constructor(options: BatchQueryOptions = {}) {
    this.batchSize = options.batchSize || 100;
    this.timeoutMs = options.timeout || 100;
  }

  /**
   * Add query to batch
   */
  add(query: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(query);
      this.resolvers.push(resolve);
      this.rejecters.push(reject);

      if (this.queue.length >= this.batchSize) {
        this.execute();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.execute(), this.timeoutMs);
      }
    });
  }

  /**
   * Execute batch
   */
  private async execute(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const batch = this.queue.splice(0, this.batchSize);
    const resolvers = this.resolvers.splice(0, this.batchSize);
    const rejecters = this.rejecters.splice(0, this.batchSize);

    try {
      const results = await Promise.all(batch.map((query) => query()));
      results.forEach((result, index) => resolvers[index](result));
    } catch (error) {
      rejecters.forEach((reject) => reject(error));
    }
  }
}

/**
 * Query optimization strategies
 */
export const QueryOptimization = {
  /**
   * Optimize SELECT queries with proper indexing
   */
  optimizeSelect: (table: string, columns: string[], whereClause?: string): string => {
    let query = `SELECT ${columns.join(", ")} FROM ${table}`;
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }
    return query;
  },

  /**
   * Optimize JOIN queries
   */
  optimizeJoin: (
    table1: string,
    table2: string,
    joinCondition: string,
    columns: string[]
  ): string => {
    return `SELECT ${columns.join(", ")} FROM ${table1} INNER JOIN ${table2} ON ${joinCondition}`;
  },

  /**
   * Add pagination to queries
   */
  addPagination: (query: string, page: number, pageSize: number): string => {
    const offset = (page - 1) * pageSize;
    return `${query} LIMIT ${pageSize} OFFSET ${offset}`;
  },

  /**
   * Add sorting to queries
   */
  addSorting: (query: string, orderBy: string, direction: "ASC" | "DESC" = "ASC"): string => {
    return `${query} ORDER BY ${orderBy} ${direction}`;
  },

  /**
   * Aggregate query optimization
   */
  optimizeAggregate: (
    table: string,
    aggregation: string,
    groupBy?: string
  ): string => {
    let query = `SELECT ${aggregation} FROM ${table}`;
    if (groupBy) {
      query += ` GROUP BY ${groupBy}`;
    }
    return query;
  },
};

/**
 * Index recommendations based on query patterns
 */
export const IndexRecommendations = {
  /**
   * Recommend indexes for frequently used columns
   */
  recommendIndexes: (table: string, frequentColumns: string[]): string[] => {
    return frequentColumns.map((col) => `CREATE INDEX idx_${table}_${col} ON ${table}(${col});`);
  },

  /**
   * Recommend composite indexes
   */
  recommendCompositeIndexes: (table: string, columnGroups: string[][]): string[] => {
    return columnGroups.map((cols) => {
      const colStr = cols.join(", ");
      const indexName = `idx_${table}_${cols.join("_")}`;
      return `CREATE INDEX ${indexName} ON ${table}(${colStr});`;
    });
  },

  /**
   * Recommend indexes for foreign keys
   */
  recommendForeignKeyIndexes: (table: string, foreignKeys: string[]): string[] => {
    return foreignKeys.map((fk) => `CREATE INDEX idx_${table}_${fk} ON ${table}(${fk});`);
  },
};

/**
 * Query performance analyzer
 */
export class QueryPerformanceAnalyzer {
  private queries: Array<{
    query: string;
    executionTime: number;
    timestamp: number;
  }> = [];

  /**
   * Record query execution
   */
  recordExecution(query: string, executionTime: number): void {
    this.queries.push({
      query,
      executionTime,
      timestamp: Date.now(),
    });

    // Keep only last 1000 queries
    if (this.queries.length > 1000) {
      this.queries.shift();
    }
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold: number = 1000): Array<{
    query: string;
    executionTime: number;
    count: number;
  }> {
    const slowQueries = this.queries.filter((q) => q.executionTime > threshold);

    // Group by query
    const grouped = new Map<string, number[]>();
    for (const q of slowQueries) {
      if (!grouped.has(q.query)) {
        grouped.set(q.query, []);
      }
      grouped.get(q.query)!.push(q.executionTime);
    }

    // Calculate statistics
    return Array.from(grouped.entries()).map(([query, times]) => ({
      query,
      executionTime: times.reduce((a, b) => a + b, 0) / times.length,
      count: times.length,
    }));
  }

  /**
   * Get query statistics
   */
  getStatistics(): {
    totalQueries: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
  } {
    if (this.queries.length === 0) {
      return {
        totalQueries: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: 0,
      };
    }

    const times = this.queries.map((q) => q.executionTime);
    return {
      totalQueries: this.queries.length,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxTime: Math.max(...times),
      minTime: Math.min(...times),
    };
  }

  /**
   * Clear statistics
   */
  clear(): void {
    this.queries = [];
  }
}

export const queryAnalyzer = new QueryPerformanceAnalyzer();

/**
 * Connection pooling configuration
 */
export const ConnectionPoolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

/**
 * Query execution wrapper with caching and metrics
 */
export async function executeOptimizedQuery<T>(
  query: string,
  executor: () => Promise<T>,
  options: {
    cache?: boolean;
    cacheTTL?: number;
    params?: Record<string, any>;
    slowQueryThreshold?: number;
  } = {}
): Promise<T> {
  const startTime = Date.now();

  // Check cache
  if (options.cache) {
    const cached = queryCache.get<T>(query, options.params);
    if (cached) {
      return cached;
    }
  }

  try {
    // Execute query
    const result = await executor();
    const executionTime = Date.now() - startTime;

    // Record metrics
    queryCache.recordQuery(executionTime, executionTime > (options.slowQueryThreshold || 1000));
    queryAnalyzer.recordExecution(query, executionTime);

    // Cache result
    if (options.cache) {
      queryCache.set(query, result, options.cacheTTL || 60000, options.params);
    }

    return result;
  } catch (error) {
    logDatabaseOperation("query", "unknown", "FAILURE", Date.now() - startTime, undefined, {
      error: String(error),
    });
    throw error;
  }
}

export default {
  queryCache,
  BatchQueryExecutor,
  QueryOptimization,
  IndexRecommendations,
  QueryPerformanceAnalyzer,
  queryAnalyzer,
  ConnectionPoolConfig,
  executeOptimizedQuery,
};
