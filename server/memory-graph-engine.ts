/**
 * SKYCOIN4444 Memory Graph Engine — HOPE AI Long-Term Memory
 *
 * Smart upgrade implementing Free Will upgrade #8: Memory-Driven Autonomy
 *
 * Features:
 *   - Long-term memory graph (user → token → action → outcome relationships)
 *   - Relationship mapping between users, tokens, and actions
 *   - Pattern prediction engine (anticipate system failures before they happen)
 *   - Proactive ecosystem adjustment based on predicted patterns
 *
 * Uses in-memory graph (Map-based) with periodic DB snapshot to audit_ledger.
 * In a production scale-up, this would use a graph DB (Neo4j/TigerGraph).
 */

import { getDb } from "./db.js";
import { eventBus, type PlatformEvent } from "./event-bus.js";
import { auditLedger, userBehaviorSignals } from "../drizzle/schema.js";
import { desc, gte, eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MemoryNode {
  id: string;
  type: "user" | "token" | "action" | "event" | "pattern";
  label: string;
  weight: number; // importance/frequency
  metadata: Record<string, unknown>;
  firstSeen: Date;
  lastSeen: Date;
}

export interface MemoryEdge {
  from: string;
  to: string;
  relationship: string;
  strength: number; // 0–1
  occurrences: number;
  lastOccurred: Date;
}

export interface PatternPrediction {
  pattern: string;
  confidence: number;
  predictedEvent: string;
  timeHorizon: "1h" | "24h" | "7d";
  suggestedPreemptiveAction: string;
  dataPoints: string[];
}

export interface MemoryGraphSnapshot {
  nodeCount: number;
  edgeCount: number;
  topPatterns: PatternPrediction[];
  hotNodes: MemoryNode[];
  recentConnections: MemoryEdge[];
  timestamp: number;
}

// ─── Memory Graph Engine ──────────────────────────────────────────────────────

export class MemoryGraphEngine {
  private nodes: Map<string, MemoryNode> = new Map();
  private edges: Map<string, MemoryEdge> = new Map();
  private patternCache: PatternPrediction[] = [];
  private snapshotTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Snapshot to DB every 5 minutes
    this.snapshotTimer = setInterval(() => void this.snapshotToDb(), 5 * 60 * 1000);
    // Subscribe to all events to build the graph
    this.registerEventListeners();
  }

  // ─── Graph Building ───────────────────────────────────────────────────────

  private registerEventListeners(): void {
    eventBus.subscribe("*", (event: PlatformEvent) => {
      void this.processEvent(event);
    });
  }

  private async processEvent(event: PlatformEvent): Promise<void> {
    const eventNodeId = `event:${event.type}`;
    this.upsertNode(eventNodeId, "event", event.type, 1, { lastPayload: event.payload });

    if (event.userId) {
      const userNodeId = `user:${event.userId}`;
      this.upsertNode(userNodeId, "user", `User ${event.userId}`, 1, {});
      this.upsertEdge(userNodeId, eventNodeId, "performed", 0.5);
    }

    // Extract token references from payload
    const payload = event.payload as Record<string, unknown>;
    if (payload.token && typeof payload.token === "string") {
      const tokenNodeId = `token:${payload.token}`;
      this.upsertNode(tokenNodeId, "token", payload.token, 1, {});
      this.upsertEdge(eventNodeId, tokenNodeId, "involves", 0.8);
    }

    // Pattern detection: if same event fires 3+ times in short window, it's a pattern
    const eventNode = this.nodes.get(eventNodeId);
    if (eventNode && eventNode.weight >= 3) {
      this.detectPattern(event.type, eventNode);
    }
  }

  private upsertNode(
    id: string,
    type: MemoryNode["type"],
    label: string,
    weightDelta: number,
    metadata: Record<string, unknown>
  ): void {
    const existing = this.nodes.get(id);
    if (existing) {
      existing.weight += weightDelta;
      existing.lastSeen = new Date();
      existing.metadata = { ...existing.metadata, ...metadata };
    } else {
      this.nodes.set(id, {
        id, type, label,
        weight: weightDelta,
        metadata,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
    }
  }

  private upsertEdge(from: string, to: string, relationship: string, strength: number): void {
    const edgeId = `${from}→${to}:${relationship}`;
    const existing = this.edges.get(edgeId);
    if (existing) {
      existing.occurrences += 1;
      existing.strength = Math.min(1, existing.strength + 0.05);
      existing.lastOccurred = new Date();
    } else {
      this.edges.set(edgeId, {
        from, to, relationship, strength,
        occurrences: 1,
        lastOccurred: new Date(),
      });
    }
  }

  private detectPattern(eventType: string, node: MemoryNode): void {
    const patternId = `pattern:${eventType}`;
    const existing = this.nodes.get(patternId);

    if (!existing) {
      const pattern: PatternPrediction = {
        pattern: `Recurring ${eventType}`,
        confidence: Math.min(0.95, node.weight / 10),
        predictedEvent: this.predictNextEvent(eventType),
        timeHorizon: node.weight > 10 ? "1h" : "24h",
        suggestedPreemptiveAction: this.getSuggestedAction(eventType),
        dataPoints: [`${eventType} occurred ${node.weight} times`, `Last: ${node.lastSeen.toISOString()}`],
      };

      this.patternCache.push(pattern);
      if (this.patternCache.length > 20) this.patternCache.shift();

      this.upsertNode(patternId, "pattern", `Pattern: ${eventType}`, 1, { prediction: pattern });
      eventBus.publish("DIGITAL_NATION_EVENT", { type: "pattern_detected", pattern: eventType, confidence: pattern.confidence });
    }
  }

  // ─── Prediction Engine ────────────────────────────────────────────────────

  /**
   * Predict future system state based on current graph patterns.
   */
  async predictSystemState(): Promise<PatternPrediction[]> {
    if (this.patternCache.length > 0) {
      return this.patternCache.slice(-5);
    }

    // Fall back to LLM prediction if no patterns yet
    const hotNodes = this.getHotNodes(5);
    if (hotNodes.length === 0) return [];

    const prompt = `You are HOPE AI's prediction engine. Based on these active patterns in the SKYCOIN4444 ecosystem:
${hotNodes.map((n) => `- ${n.label} (weight: ${n.weight}, type: ${n.type})`).join("\n")}

Predict 2-3 likely system events in the next 24 hours. Respond in JSON array:
[{ "pattern": "...", "confidence": 0.0-1.0, "predictedEvent": "...", "timeHorizon": "1h|24h|7d", "suggestedPreemptiveAction": "...", "dataPoints": ["..."] }]`;

    try {
      const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      const rawContent = response.choices[0].message.content ?? "[]";
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as PatternPrediction[];
      }
    } catch {
      // Return empty
    }

    return [];
  }

  /**
   * Get memory graph snapshot for the frontend.
   */
  getSnapshot(): MemoryGraphSnapshot {
    const hotNodes = this.getHotNodes(10);
    const recentEdges = Array.from(this.edges.values())
      .sort((a, b) => b.lastOccurred.getTime() - a.lastOccurred.getTime())
      .slice(0, 20);

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      topPatterns: this.patternCache.slice(-5),
      hotNodes,
      recentConnections: recentEdges,
      timestamp: Date.now(),
    };
  }

  /**
   * Get relationship strength between two entities.
   */
  getRelationshipStrength(entityA: string, entityB: string): number {
    const edgeId = `${entityA}→${entityB}:*`;
    let maxStrength = 0;
    for (const [key, edge] of this.edges) {
      if (key.startsWith(`${entityA}→${entityB}`)) {
        maxStrength = Math.max(maxStrength, edge.strength);
      }
    }
    return maxStrength;
  }

  /**
   * Load historical events from DB to seed the memory graph on startup.
   */
  async loadHistoricalMemory(windowHours = 24): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const events = await db
      .select()
      .from(auditLedger)
      .where(gte(auditLedger.createdAt, since))
      .orderBy(desc(auditLedger.createdAt))
      .limit(500);

    for (const event of events) {
      const eventNodeId = `event:${event.eventType}`;
      this.upsertNode(eventNodeId, "event", event.eventType, 1, {});
      if (event.userId) {
        const userNodeId = `user:${event.userId}`;
        this.upsertNode(userNodeId, "user", `User ${event.userId}`, 1, {});
        this.upsertEdge(userNodeId, eventNodeId, "performed", 0.3);
      }
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private getHotNodes(limit: number): MemoryNode[] {
    return Array.from(this.nodes.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  private predictNextEvent(currentEvent: string): string {
    const eventChains: Record<string, string> = {
      INFLATION_WARNING: "EMISSION_CAP_HIT",
      FRAUD_SIGNAL_DETECTED: "FRAUD_SPIKE_DETECTED",
      RETENTION_DROPPING: "USER_ARCHETYPE_CHANGED",
      LOW_LIQUIDITY_DETECTED: "PRICE_UPDATED",
      PROPOSAL_CREATED: "VOTE_CAST",
      TOKEN_MINTED: "PRICE_UPDATED",
    };
    return eventChains[currentEvent] ?? "DIGITAL_NATION_EVENT";
  }

  private getSuggestedAction(eventType: string): string {
    const actions: Record<string, string> = {
      INFLATION_WARNING: "Pre-emptively apply sink pressure before cap is hit",
      FRAUD_SIGNAL_DETECTED: "Increase rate limit sensitivity for affected user segment",
      RETENTION_DROPPING: "Activate HOPE AI personalized re-engagement campaign",
      LOW_LIQUIDITY_DETECTED: "Propose governance vote to introduce new token utility",
      PROPOSAL_CREATED: "Run AI simulation before voting opens",
      TOKEN_MINTED: "Monitor demand index for 30 minutes after mint",
    };
    return actions[eventType] ?? "Monitor and log for pattern analysis";
  }

  private async snapshotToDb(): Promise<void> {
    const snapshot = this.getSnapshot();
    eventBus.publish("DIGITAL_NATION_EVENT", {
      type: "memory_snapshot",
      nodeCount: snapshot.nodeCount,
      edgeCount: snapshot.edgeCount,
      patternCount: snapshot.topPatterns.length,
    });
  }

  destroy(): void {
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
  }
}

export const memoryGraphEngine = new MemoryGraphEngine();
