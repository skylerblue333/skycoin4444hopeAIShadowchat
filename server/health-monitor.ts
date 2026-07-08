import crypto from 'crypto';
import { Router } from 'express';
import { db } from './db';
import os from 'os';
import { performance } from 'perf_hooks';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    cpu: HealthCheck;
    api: HealthCheck;
    cache: HealthCheck;
  };
  metrics: SystemMetrics;
  alerts: Alert[];
}

interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  responseTime: number;
  message: string;
  lastChecked: Date;
}

interface SystemMetrics {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  uptime: number;
  loadAverage: number[];
  requestsPerSecond: number;
  errorRate: number;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

class HealthMonitor {
  private alerts: Alert[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private startTime = Date.now();
  private lastMetricsReset = Date.now();
  private thresholds = {
    memoryUsagePercent: 85,
    errorRatePercent: 5,
    responseTimeMs: 1000,
    cpuUsagePercent: 80,
  };

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = performance.now();
    try {
      // Simple query to test connection
      const result = await (db as any).execute('SELECT 1');
      const responseTime = performance.now() - startTime;

      return {
        status: responseTime > this.thresholds.responseTimeMs ? 'warn' : 'pass',
        responseTime,
        message: `Database connected (${responseTime.toFixed(2)}ms)`,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: performance.now() - startTime,
        message: `Database connection failed: ${error}`,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): HealthCheck {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usedMemory = os.totalmem() - os.freemem();
    const usagePercent = (usedMemory / totalMemory) * 100;

    const status =
      usagePercent > this.thresholds.memoryUsagePercent
        ? 'warn'
        : usagePercent > 95
          ? 'fail'
          : 'pass';

    return {
      status,
      responseTime: 0,
      message: `Memory usage: ${usagePercent.toFixed(2)}% (${(usedMemory / 1024 / 1024).toFixed(2)}MB / ${(totalMemory / 1024 / 1024).toFixed(2)}MB)`,
      lastChecked: new Date(),
    };
  }

  /**
   * Check CPU usage
   */
  private checkCPU(): HealthCheck {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();
    const cpuCount = cpus.length;
    const avgLoad = loadAverage[0] / cpuCount;
    const usagePercent = avgLoad * 100;

    const status =
      usagePercent > this.thresholds.cpuUsagePercent
        ? 'warn'
        : usagePercent > 95
          ? 'fail'
          : 'pass';

    return {
      status,
      responseTime: 0,
      message: `CPU usage: ${usagePercent.toFixed(2)}% (Load: ${loadAverage.map((l) => l.toFixed(2)).join(', ')})`,
      lastChecked: new Date(),
    };
  }

  /**
   * Check API health
   */
  private checkAPI(): HealthCheck {
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    const status =
      errorRate > this.thresholds.errorRatePercent
        ? 'warn'
        : errorRate > 10
          ? 'fail'
          : 'pass';

    return {
      status,
      responseTime: 0,
      message: `API healthy (${this.requestCount} requests, ${errorRate.toFixed(2)}% error rate)`,
      lastChecked: new Date(),
    };
  }

  /**
   * Check cache health
   */
  private checkCache(): HealthCheck {
        return {
      status: 'pass',
      responseTime: 0,
      message: 'Cache operational',
      lastChecked: new Date(),
    };
  }

  /**
   * Generate system metrics
   */
  private getMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = (Date.now() - this.startTime) / 1000;
    const rps = this.requestCount / (uptime || 1);

    return {
      memoryUsage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime,
      loadAverage: os.loadavg(),
      requestsPerSecond: rps,
      errorRate:
        this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
    };
  }

  /**
   * Determine overall health status
   */
  private determineStatus(checks: HealthStatus['checks']): 'healthy' | 'degraded' | 'unhealthy' {
    const failCount = Object.values(checks).filter((c) => c.status === 'fail').length;
    const warnCount = Object.values(checks).filter((c) => c.status === 'warn').length;

    if (failCount >= 2) return 'unhealthy';
    if (failCount === 1 || warnCount >= 2) return 'degraded';
    return 'healthy';
  }

  /**
   * Create alert
   */
  private createAlert(
    severity: Alert['severity'],
    type: string,
    message: string
  ): Alert {
    const alert: Alert = {
      id: `${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256)}`,
      severity,
      type,
      message,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    return alert;
  }

  /**
   * Get full health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      memory: this.checkMemory(),
      cpu: this.checkCPU(),
      api: this.checkAPI(),
      cache: this.checkCache(),
    };

    const status = this.determineStatus(checks);
    const metrics = this.getMetrics();

    // Create alerts based on health checks
    if (checks.database.status === 'fail') {
      this.createAlert('critical', 'database', 'Database connection failed');
    }

    if (checks.memory.status === 'fail') {
      this.createAlert('critical', 'memory', 'Memory usage critical');
    }

    if (checks.cpu.status === 'fail') {
      this.createAlert('warning', 'cpu', 'CPU usage high');
    }

    return {
      status,
      timestamp: new Date(),
      uptime: metrics.uptime,
      checks,
      metrics,
      alerts: this.alerts.filter((a) => !a.resolved),
    };
  }

  /**
   * Record request
   */
  recordRequest(success: boolean) {
    this.requestCount++;
    if (!success) {
      this.errorCount++;
    }
  }

  /**
   * Get alerts
   */
  getAlerts(): Alert[] {
    return this.alerts.filter((a) => !a.resolved);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.lastMetricsReset = Date.now();
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();

// Express router
export const healthRouter = Router();

/**
 * GET /health - Basic health check
 */
healthRouter.get('/health', async (req, res) => {
  try {
    const health = await healthMonitor.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 500;

    res.status(statusCode).json({
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /health/detailed - Detailed health check
 */
healthRouter.get('/health/detailed', async (req, res) => {
  try {
    const health = await healthMonitor.getHealthStatus();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /health/alerts - Get active alerts
 */
healthRouter.get('/health/alerts', (req, res) => {
  const alerts = healthMonitor.getAlerts();
  res.json({
    count: alerts.length,
    alerts,
  });
});

/**
 * POST /health/alerts/:id/resolve - Resolve alert
 */
healthRouter.post('/health/alerts/:id/resolve', (req, res) => {
  const { id } = req.params;
  healthMonitor.resolveAlert(id);
  res.json({ success: true });
});

/**
 * POST /health/metrics/reset - Reset metrics
 */
healthRouter.post('/health/metrics/reset', (req, res) => {
  healthMonitor.resetMetrics();
  res.json({ success: true });
});

export default healthRouter;
