import crypto from 'crypto';
/**
 * SKYCOIN4444 Event Bus — Enterprise Backbone
 *
 * All platform actions become typed events.
 * Events are:
 *   1. Emitted synchronously in-process (fast, no queue needed for current scale)
 *   2. Persisted to the audit_ledger table (immutable, replayable)
 *   3. Available for subscription by any engine
 *
 * Design rule: "No direct state change without event logging"
 */

import { EventEmitter } from "events";
import { getDb } from "./db.js";
import { auditLedger } from "../drizzle/schema.js";

// ─── Event Type Registry ────────────────────────────────────────────────────

export type PlatformEventType =
  | "USER_REGISTERED" | "USER_PROFILE_UPDATED" | "USER_ARCHETYPE_CHANGED"
  | "TOKEN_MINTED" | "TOKEN_BURNED" | "TOKEN_TRANSFERRED" | "TOKEN_REWARDED"
  | "TOKEN_STAKED" | "TOKEN_UNSTAKED" | "TOKEN_SWAPPED"
  | "EMISSION_CAP_HIT" | "SINK_PRESSURE_APPLIED"
  | "SWAP_EXECUTED" | "PRICE_UPDATED" | "LIQUIDITY_CHANGED"
  | "PROPOSAL_CREATED" | "PROPOSAL_STAGE_CHANGED" | "VOTE_CAST"
  | "PROPOSAL_EVALUATED" | "SIMULATION_RUN" | "OUTCOME_APPROVED"
  | "EXECUTION_TRIGGERED" | "CONSTITUTION_AMENDED"
  | "AI_RECOMMENDATION_GENERATED" | "TWIN_MEMORY_UPDATED"
  | "BEHAVIOR_SIGNAL_RECORDED" | "ARCHETYPE_COMPUTED"
  | "FRAUD_SIGNAL_DETECTED" | "RATE_LIMIT_HIT"
  | "SUSPICIOUS_PATTERN_FLAGGED" | "ACCOUNT_QUARANTINED"
  | "CONTENT_FLAGGED" | "MODERATION_ESCALATED" | "CONTENT_RESOLVED"
  | "QUEST_COMPLETED" | "XP_EARNED" | "CREATOR_CONTENT_PUBLISHED"
  | "TOURNAMENT_ENDED" | "FEATURE_USED" | "SESSION_STARTED" | "SESSION_ENDED"
  | "AI_GOAL_ACTIVATED" | "AI_GOAL_ACHIEVED" | "AI_GOAL_ADJUSTED"
  | "AI_ACTION_INITIATED" | "SELF_OPTIMIZE_TRIGGERED" | "RULE_ADJUSTED"
  | "LOW_LIQUIDITY_DETECTED" | "RETENTION_DROPPING"
  | "FRAUD_SPIKE_DETECTED" | "INFLATION_WARNING"
  | "EMERGENT_SINK_CREATED" | "DIGITAL_NATION_EVENT"
  | "WALLET_CREATED" | "TRANSACTION_SIGNED" | "TRANSACTION_BROADCAST"
  | "TRANSACTION_CONFIRMED" | "TRANSACTION_FAILED";

export interface PlatformEvent<T = Record<string, unknown>> {
  type: PlatformEventType;
  userId?: string;
  payload: T;
  timestamp: number;
  traceId: string;
}

// ─── Event Bus Singleton ────────────────────────────────────────────────────

class PlatformEventBus extends EventEmitter {
  private persistQueue: PlatformEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this.setMaxListeners(200);
    this.flushTimer = setInterval(() => void this.flushToLedger(), 5000);
  }

  /**
   * Publish a typed platform event.
   * Emits to in-process subscribers AND queues for DB persistence.
   */
  publish<T = Record<string, unknown>>(
    type: PlatformEventType,
    payload: T,
    userId?: string
  ): void {
    const event: PlatformEvent<T> = {
      type,
      userId,
      payload,
      timestamp: Date.now(),
      traceId: `${type}-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    };
    super.emit(type, event);
    super.emit("*", event);
    this.persistQueue.push(event as PlatformEvent);
  }

  /**
   * Subscribe to a specific event type.
   */
  subscribe<T = Record<string, unknown>>(
    type: PlatformEventType | "*",
    listener: (event: PlatformEvent<T>) => void
  ): this {
    return super.on(type, listener as (event: unknown) => void);
  }

  /**
   * Unsubscribe from an event type.
   */
  unsubscribe<T = Record<string, unknown>>(
    type: PlatformEventType | "*",
    listener: (event: PlatformEvent<T>) => void
  ): this {
    return super.off(type, listener as (event: unknown) => void);
  }

  /**
   * Flush queued events to the audit ledger (batched, best-effort).
   */
  private async flushToLedger(): Promise<void> {
    if (this.persistQueue.length === 0) return;
    const batch = this.persistQueue.splice(0, 100);
    try {
      const db = await getDb();
      if (!db) return;
      await db.insert(auditLedger).values(
        batch.map((e) => ({
          eventType: e.type,
          userId: e.userId ? String(e.userId) : null,
          payload: e.payload as Record<string, unknown>,
          traceId: e.traceId,
          occurredAt: new Date(e.timestamp),
        }))
      );
    } catch {
      // Re-queue on failure (best-effort persistence)
      this.persistQueue.unshift(...batch);
    }
  }

  destroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.removeAllListeners();
  }
}

export const eventBus = new PlatformEventBus();
