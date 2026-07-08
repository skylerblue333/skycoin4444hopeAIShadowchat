/**
 * VOICE ANALYTICS - PRODUCTION TRACKING
 * Track voice command usage, performance, and patterns
 */

export interface VoiceAnalyticsEvent {
  timestamp: number;
  userId: string;
  commandId: string;
  commandName: string;
  success: boolean;
  responseTime: number;
  confidence: number;
  device: string;
  language: string;
  error?: string;
}

export class VoiceAnalyticsSystem {
  private events: VoiceAnalyticsEvent[];
  private commandStats: Map<string, any>;
  private userStats: Map<string, any>;

  constructor() {
    this.events = [];
    this.commandStats = new Map();
    this.userStats = new Map();
  }

  trackEvent(event: VoiceAnalyticsEvent): void {
    this.events.push(event);

    // Update command stats
    if (!this.commandStats.has(event.commandId)) {
      this.commandStats.set(event.commandId, {
        name: event.commandName,
        executions: 0,
        successes: 0,
        failures: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        averageConfidence: 0,
        lastExecuted: 0,
      });
    }

    const cmdStats = this.commandStats.get(event.commandId)!;
    cmdStats.executions++;
    if (event.success) {
      cmdStats.successes++;
    } else {
      cmdStats.failures++;
    }
    cmdStats.totalResponseTime += event.responseTime;
    cmdStats.averageResponseTime = cmdStats.totalResponseTime / cmdStats.executions;
    cmdStats.lastExecuted = event.timestamp;

    // Update user stats
    if (!this.userStats.has(event.userId)) {
      this.userStats.set(event.userId, {
        commandsExecuted: 0,
        successRate: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        favoriteCommands: [],
        lastActive: 0,
      });
    }

    const userStats = this.userStats.get(event.userId)!;
    userStats.commandsExecuted++;
    userStats.totalResponseTime += event.responseTime;
    userStats.averageResponseTime = userStats.totalResponseTime / userStats.commandsExecuted;
    userStats.successRate = (this.getSuccessfulCommands(event.userId) / userStats.commandsExecuted) * 100;
    userStats.lastActive = event.timestamp;

    // Keep only last 10000 events for memory efficiency
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }
  }

  private getSuccessfulCommands(userId: string): number {
    return this.events.filter((e) => e.userId === userId && e.success).length;
  }

  getCommandStats(commandId: string): any {
    return this.commandStats.get(commandId) || null;
  }

  getUserStats(userId: string): any {
    return this.userStats.get(userId) || null;
  }

  getTopCommands(limit: number = 10): any[] {
    return Array.from(this.commandStats.values())
      .sort((a, b) => b.executions - a.executions)
      .slice(0, limit);
  }

  getMostFailedCommands(limit: number = 10): any[] {
    return Array.from(this.commandStats.values())
      .sort((a, b) => b.failures - a.failures)
      .slice(0, limit);
  }

  getSlowCommands(limit: number = 10): any[] {
    return Array.from(this.commandStats.values())
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, limit);
  }

  getTopUsers(limit: number = 10): any[] {
    return Array.from(this.userStats.values())
      .sort((a, b) => b.commandsExecuted - a.commandsExecuted)
      .slice(0, limit);
  }

  getCommandSuccessRate(commandId: string): number {
    const stats = this.commandStats.get(commandId);
    if (!stats || stats.executions === 0) return 0;
    return (stats.successes / stats.executions) * 100;
  }

  getUserSuccessRate(userId: string): number {
    const stats = this.userStats.get(userId);
    return stats?.successRate || 0;
  }

  getAverageResponseTime(commandId?: string): number {
    if (commandId) {
      const stats = this.commandStats.get(commandId);
      return stats?.averageResponseTime || 0;
    }

    const allStats = Array.from(this.commandStats.values());
    if (allStats.length === 0) return 0;
    const totalTime = allStats.reduce((sum, s) => sum + s.totalResponseTime, 0);
    const totalExecutions = allStats.reduce((sum, s) => sum + s.executions, 0);
    return totalTime / totalExecutions;
  }

  getSystemStats(): any {
    const allStats = Array.from(this.commandStats.values());
    const totalExecutions = allStats.reduce((sum, s) => sum + s.executions, 0);
    const totalSuccesses = allStats.reduce((sum, s) => sum + s.successes, 0);
    const totalFailures = allStats.reduce((sum, s) => sum + s.failures, 0);

    return {
      totalEvents: this.events.length,
      totalCommands: this.commandStats.size,
      totalUsers: this.userStats.size,
      totalExecutions,
      totalSuccesses,
      totalFailures,
      successRate: totalExecutions > 0 ? (totalSuccesses / totalExecutions) * 100 : 0,
      averageResponseTime: this.getAverageResponseTime(),
      topCommands: this.getTopCommands(5),
      mostFailedCommands: this.getMostFailedCommands(5),
      slowCommands: this.getSlowCommands(5),
      topUsers: this.getTopUsers(5),
    };
  }

  getTimeSeriesData(commandId?: string, timeWindow: number = 3600000): any[] {
    const now = Date.now();
    const filtered = this.events.filter((e) => {
      const inTimeWindow = e.timestamp >= now - timeWindow;
      const matchesCommand = !commandId || e.commandId === commandId;
      return inTimeWindow && matchesCommand;
    });

    const buckets = new Map<number, any>();
    filtered.forEach((event) => {
      const bucketTime = Math.floor(event.timestamp / 60000) * 60000; // 1-minute buckets
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, {
          timestamp: bucketTime,
          executions: 0,
          successes: 0,
          failures: 0,
        });
      }

      const bucket = buckets.get(bucketTime)!;
      bucket.executions++;
      if (event.success) {
        bucket.successes++;
      } else {
        bucket.failures++;
      }
    });

    return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  getDeviceStats(): any {
    const devices = new Map<string, number>();
    this.events.forEach((e) => {
      devices.set(e.device, (devices.get(e.device) || 0) + 1);
    });

    return Array.from(devices.entries()).map(([device, count]) => ({
      device,
      executions: count,
      percentage: (count / this.events.length) * 100,
    }));
  }

  getLanguageStats(): any {
    const languages = new Map<string, number>();
    this.events.forEach((e) => {
      languages.set(e.language, (languages.get(e.language) || 0) + 1);
    });

    return Array.from(languages.entries()).map(([language, count]) => ({
      language,
      executions: count,
      percentage: (count / this.events.length) * 100,
    }));
  }

  clearOldEvents(ageMs: number = 86400000): number {
    const now = Date.now();
    const before = this.events.length;
    this.events = this.events.filter((e) => now - e.timestamp < ageMs);
    return before - this.events.length;
  }
}

export const voiceAnalyticsSystem = new VoiceAnalyticsSystem();
