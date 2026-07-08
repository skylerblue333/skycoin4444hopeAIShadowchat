/**
 * SKYCOIN4444 Security Engine
 *
 * Fraud detection, rate limiting, anomaly detection, and wallet protection.
 * Uses: fraud_signals, rate_limit_buckets tables
 * Emits: FRAUD_SIGNAL_DETECTED, RATE_LIMIT_HIT, SUSPICIOUS_PATTERN_FLAGGED,
 *        ACCOUNT_QUARANTINED, FRAUD_SPIKE_DETECTED
 *
 * Safety rule: Security engine has VETO power — it can block any action
 * regardless of what other engines request.
 */

import { eq, and, gte, count, sql } from "drizzle-orm";
import { getDb } from "./db.js";
import { eventBus } from "./event-bus.js";
import { fraudSignals, rateLimitBuckets } from "../drizzle/schema.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FraudSeverity = "low" | "medium" | "high" | "critical";

export interface SecurityCheckResult {
  allowed: boolean;
  reason: string;
  riskScore: number;
  flags: string[];
}

export interface FraudReport {
  userId: number;
  totalSignals: number;
  highSeverityCount: number;
  riskScore: number;
  quarantineRecommended: boolean;
  signals: Array<{ signalType: string; severity: FraudSeverity; detectedAt: Date }>;
}

// ─── Security Engine ──────────────────────────────────────────────────────────

export class SecurityEngine {
  private readonly RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
  private readonly QUARANTINE_THRESHOLD = 75; // risk score 0–100

  /**
   * Check if an action is allowed for a user.
   * Runs rate limit + fraud risk checks.
   */
  async checkAction(
    userId: number,
    action: string,
    maxPerMinute = 30
  ): Promise<SecurityCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    // 1. Rate limit check
    const rateLimitOk = await this.checkRateLimit(userId, action, maxPerMinute);
    if (!rateLimitOk) {
      flags.push(`Rate limit exceeded for ${action}`);
      riskScore += 20;
      eventBus.publish("RATE_LIMIT_HIT", { userId, action, maxPerMinute }, userId);
    }

    // 2. Fraud risk check
    const fraudRisk = await this.getUserRiskScore(userId);
    riskScore += fraudRisk;

    if (riskScore >= this.QUARANTINE_THRESHOLD) {
      flags.push("High fraud risk score — action blocked");
      eventBus.publish("SUSPICIOUS_PATTERN_FLAGGED", { userId, riskScore, action }, userId);
      return { allowed: false, reason: "Security block: high risk score", riskScore, flags };
    }

    if (flags.length > 0) {
      return { allowed: false, reason: flags[0], riskScore, flags };
    }

    return { allowed: true, reason: "OK", riskScore, flags };
  }

  /**
   * Record a fraud signal for a user.
   */
  async recordFraudSignal(
    userId: number,
    signalType: string,
    severity: FraudSeverity,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.insert(fraudSignals).values({
      userId,
      signalType,
      severity,
      details,
      detectedAt: new Date(),
    });

    eventBus.publish("FRAUD_SIGNAL_DETECTED", { userId, signalType, severity, details }, userId);

    // Check if this triggers a spike
    await this.checkFraudSpike();

    // Auto-quarantine on critical signal
    if (severity === "critical") {
      eventBus.publish("ACCOUNT_QUARANTINED", { userId, reason: signalType }, userId);
    }
  }

  /**
   * Get fraud report for a user.
   */
  async getFraudReport(userId: number): Promise<FraudReport> {
    const db = await getDb();
    if (!db) {
      return { userId, totalSignals: 0, highSeverityCount: 0, riskScore: 0, quarantineRecommended: false, signals: [] };
    }

    const signals = await db
      .select()
      .from(fraudSignals)
      .where(eq(fraudSignals.userId, userId))
      .orderBy(sql`${fraudSignals.detectedAt} DESC`)
      .limit(50);

    const highSeverityCount = signals.filter(
      (s) => s.severity === "high" || s.severity === "critical"
    ).length;

    const riskScore = this.computeRiskScore(signals);
    const quarantineRecommended = riskScore >= this.QUARANTINE_THRESHOLD;

    return {
      userId,
      totalSignals: signals.length,
      highSeverityCount,
      riskScore,
      quarantineRecommended,
      signals: signals.map((s) => ({
        signalType: s.signalType,
        severity: s.severity as FraudSeverity,
        detectedAt: s.detectedAt,
      })),
    };
  }

  /**
   * Get platform-wide security health.
   */
  async getSecurityHealth(): Promise<{
    totalFraudSignals24h: number;
    highRiskUsers: number;
    fraudSpike: boolean;
    recentSignals: Array<{ signalType: string; severity: string; count: number }>;
  }> {
    const db = await getDb();
    if (!db) return { totalFraudSignals24h: 0, highRiskUsers: 0, fraudSpike: false, recentSignals: [] };

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [{ total }] = await db
      .select({ total: count() })
      .from(fraudSignals)
      .where(gte(fraudSignals.detectedAt, since));

    const fraudSpike = total > 50;
    if (fraudSpike) {
      eventBus.publish("FRAUD_SPIKE_DETECTED", { count: total, window: "24h" });
    }

    return {
      totalFraudSignals24h: total,
      highRiskUsers: 0, // computed separately if needed
      fraudSpike,
      recentSignals: [],
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async checkRateLimit(
    userId: number,
    action: string,
    maxPerMinute: number
  ): Promise<boolean> {
    const db = await getDb();
    if (!db) return true; // fail open if DB unavailable

    const windowStart = new Date(Date.now() - this.RATE_LIMIT_WINDOW_MS);

    const [existing] = await db
      .select()
      .from(rateLimitBuckets)
      .where(
        and(
          eq(rateLimitBuckets.userId, userId),
          eq(rateLimitBuckets.action, action)
        )
      )
      .limit(1);

    if (!existing) {
      await db.insert(rateLimitBuckets).values({
        userId,
        action,
        count: 1,
        windowStart: new Date(),
        updatedAt: new Date(),
      });
      return true;
    }

    // Reset window if expired
    if (existing.windowStart < windowStart) {
      await db
        .update(rateLimitBuckets)
        .set({ count: 1, windowStart: new Date(), updatedAt: new Date() })
        .where(and(eq(rateLimitBuckets.userId, userId), eq(rateLimitBuckets.action, action)));
      return true;
    }

    if (existing.count >= maxPerMinute) {
      return false;
    }

    await db
      .update(rateLimitBuckets)
      .set({ count: existing.count + 1, updatedAt: new Date() })
      .where(and(eq(rateLimitBuckets.userId, userId), eq(rateLimitBuckets.action, action)));

    return true;
  }

  private async getUserRiskScore(userId: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const recent = await db
      .select()
      .from(fraudSignals)
      .where(
        and(
          eq(fraudSignals.userId, userId),
          gte(fraudSignals.detectedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        )
      )
      .limit(20);

    return this.computeRiskScore(recent);
  }

  private computeRiskScore(
    signals: Array<{ severity: string }>
  ): number {
    const weights: Record<string, number> = { low: 5, medium: 15, high: 30, critical: 50 };
    return Math.min(100, signals.reduce((acc, s) => acc + (weights[s.severity] ?? 0), 0));
  }

  private async checkFraudSpike(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const since = new Date(Date.now() - 60 * 60 * 1000); // last hour
    const [{ total }] = await db
      .select({ total: count() })
      .from(fraudSignals)
      .where(gte(fraudSignals.detectedAt, since));

    if (total > 20) {
      eventBus.publish("FRAUD_SPIKE_DETECTED", { count: total, window: "1h" });
    }
  }
}

export const securityEngine = new SecurityEngine();
