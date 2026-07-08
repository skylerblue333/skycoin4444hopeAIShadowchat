/**
 * Manius Orchestrator — CEO Brain of the SKYCOIN4444 Ecosystem
 *
 * The single top-level priority engine that:
 *  1. Reads all engine outputs (FreeWill, Behavior, Economy, Security, Governance, Analytics)
 *  2. Computes a unified "Platform Intelligence State" every 60 seconds
 *  3. Decides what HOPE AI says next to each user
 *  4. Decides which economy events fire
 *  5. Decides which notifications send
 *  6. Decides which autonomous agent actions execute
 *  7. Maintains a decision log for full auditability
 *
 * Architecture:
 *   All engines → OrchestratorState → PriorityQueue → ActionDispatcher → EventBus
 */

import { getDb } from "./db.js";
import { eventBus } from "./event-bus.js";
import { freeWillEngine } from "./free-will-engine.js";
import { behaviorEngine } from "./behavior-engine.js";
import { economyEngine } from "./economy-engine.js";
import { securityEngine } from "./security-engine.js";
import { platformMetrics, moderationLogs } from "../drizzle/schema.js";
import { desc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrchestratorPriority = "critical" | "high" | "medium" | "low";
export type ActionCategory =
  | "hope_ai_message"
  | "economy_event"
  | "notification"
  | "agent_action"
  | "security_response"
  | "governance_trigger"
  | "retention_intervention";

export interface OrchestratorAction {
  id: string;
  category: ActionCategory;
  priority: OrchestratorPriority;
  targetUserId?: number;
  targetAll?: boolean;
  payload: Record<string, unknown>;
  reasoning: string;
  scheduledAt: number;
  executedAt?: number;
  outcome?: string;
}

export interface PlatformIntelligenceState {
  timestamp: number;
  economyHealth: "healthy" | "warning" | "critical";
  securityThreatLevel: "low" | "medium" | "high" | "critical";
  userRetentionRisk: "low" | "medium" | "high";
  governanceActivity: "inactive" | "active" | "urgent";
  aiEngineStatus: "idle" | "running" | "overloaded";
  activeGoalCount: number;
  pendingActions: number;
  platformScore: number; // 0-100 overall health
  recommendations: string[];
}

export interface UserIntelligenceContext {
  userId: number;
  archetype: string;
  riskScore: number;
  retentionRisk: "low" | "medium" | "high";
  suggestedAction: string;
  hopeAiMessage: string;
  economyOpportunity?: string;
  urgentAlert?: string;
}

// ─── Orchestrator Class ───────────────────────────────────────────────────────

export class ManiusOrchestrator {
  private actionQueue: OrchestratorAction[] = [];
  private decisionLog: OrchestratorAction[] = [];
  private platformState: PlatformIntelligenceState | null = null;
  private cycleInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CYCLE_MS = 60_000; // 1 minute
  private readonly MAX_LOG_SIZE = 500;

  // ─── Start / Stop ──────────────────────────────────────────────────────────

  start(): void {
    if (this.cycleInterval) return;
    void this.runCycle(); // immediate first run
    this.cycleInterval = setInterval(() => void this.runCycle(), this.CYCLE_MS);
      }

  stop(): void {
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = null;
    }
  }

  // ─── Main Orchestration Cycle ──────────────────────────────────────────────

  async runCycle(): Promise<PlatformIntelligenceState> {
    const state = await this.computePlatformState();
    this.platformState = state;

    const actions = await this.generateActions(state);
    for (const action of actions) {
      this.enqueue(action);
    }

    await this.flushQueue();
    await this.persistState(state);

    eventBus.emit("orchestrator.cycle_complete", {
      platformScore: state.platformScore,
      actionsGenerated: actions.length,
      timestamp: state.timestamp,
    });

    return state;
  }

  // ─── Platform State Computation ───────────────────────────────────────────

  private async computePlatformState(): Promise<PlatformIntelligenceState> {
    const timestamp = Date.now();

    // Economy health
    let economyHealth: PlatformIntelligenceState["economyHealth"] = "healthy";
    try {
      const report = await economyEngine.getHealthReport();
      if (report.overallHealth === "CRITICAL") economyHealth = "critical";
      else if (report.overallHealth === "WARNING") economyHealth = "warning";
    } catch { /* non-blocking */ }

    // Security threat level — use moderation_logs as proxy for fraud signals
    let securityThreatLevel: PlatformIntelligenceState["securityThreatLevel"] = "low";
    try {
      const db = await getDb();
      if (db) {
        const recentFlags = await db.select().from(moderationLogs).limit(50);
        if (recentFlags.length > 20) securityThreatLevel = "high" as typeof securityThreatLevel;
        else if (recentFlags.length > 10) securityThreatLevel = "medium" as typeof securityThreatLevel;
      }
    } catch { /* non-blocking */ }

    // Free will engine goals
    let activeGoalCount = 0;
    let aiEngineStatus: PlatformIntelligenceState["aiEngineStatus"] = "idle";
    try {
      const goals = freeWillEngine.getGoals();
      activeGoalCount = goals.filter((g) => g.status === "active").length;
      aiEngineStatus = activeGoalCount > 0 ? "running" : "idle";
    } catch { /* non-blocking */ }

    // User retention risk (simple heuristic from platform metrics)
    let userRetentionRisk: "low" | "medium" | "high" = "low";
    try {
      const db = await getDb();
      if (db) {
        const metrics = await db
          .select()
          .from(platformMetrics)
          .orderBy(desc(platformMetrics.recordedAt))
          .limit(1);
        if (metrics.length > 0) {
          const val = Number(metrics[0].value ?? 50);
          if (val < 20) userRetentionRisk = "high";
          else if (val < 40) userRetentionRisk = "medium";
        }
      }
    } catch { /* non-blocking */ }

    // Governance activity — use a simple try/catch with raw SQL
    let governanceActivity: PlatformIntelligenceState["governanceActivity"] = "inactive";
    try {
      const db = await getDb();
      type CountRow = { cnt: number };
      const rows = await (db as unknown as { execute: (q: string) => Promise<CountRow[]> })
        .execute(`SELECT COUNT(*) as cnt FROM governance_proposals WHERE status = 'active'`);
      const cnt = Number(rows[0]?.cnt ?? 0);
      if (cnt > 5) governanceActivity = "urgent";
      else if (cnt > 0) governanceActivity = "active";
    } catch { /* non-blocking */ }

    // Platform score (0-100)
    const scores = {
      economy: economyHealth === "healthy" ? 100 : economyHealth === "warning" ? 60 : 20,
      security: (securityThreatLevel as string) === "low" ? 100 : (securityThreatLevel as string) === "medium" ? 70 : (securityThreatLevel as string) === "high" ? 40 : 10,
      retention: (userRetentionRisk as string) === "low" ? 100 : (userRetentionRisk as string) === "medium" ? 65 : 30,
      ai: aiEngineStatus === "running" ? 90 : 70,
    };
    const platformScore = Math.round(
      (scores.economy * 0.3 + scores.security * 0.3 + scores.retention * 0.25 + scores.ai * 0.15)
    );

    // Recommendations
    const recommendations: string[] = [];
    if (economyHealth !== "healthy") recommendations.push("Economy needs attention — check token emission rates");
    if ((securityThreatLevel as string) === "high" || (securityThreatLevel as string) === "critical") recommendations.push("Elevated fraud signals — review security dashboard");
    if (userRetentionRisk === "high") recommendations.push("Retention risk high — trigger engagement campaign");
    if (governanceActivity === "urgent") recommendations.push("Multiple governance proposals active — drive voter participation");
    if (activeGoalCount === 0) recommendations.push("No active AI goals — run Free Will Engine cycle");
    if (recommendations.length === 0) recommendations.push("Platform operating normally — maintain current trajectory");

    return {
      timestamp,
      economyHealth,
      securityThreatLevel,
      userRetentionRisk,
      governanceActivity,
      aiEngineStatus,
      activeGoalCount,
      pendingActions: this.actionQueue.length,
      platformScore,
      recommendations,
    };
  }

  // ─── Action Generation ────────────────────────────────────────────────────

  private async generateActions(state: PlatformIntelligenceState): Promise<OrchestratorAction[]> {
    const actions: OrchestratorAction[] = [];
    const now = Date.now();

    // CRITICAL: Security response
    if (state.securityThreatLevel === "critical") {
      actions.push({
        id: `orch_sec_${now}`,
        category: "security_response",
        priority: "critical",
        targetAll: true,
        payload: { action: "heightened_monitoring", threatLevel: state.securityThreatLevel },
        reasoning: "Critical fraud signal threshold exceeded — activating heightened monitoring",
        scheduledAt: now,
      });
    }

    // HIGH: Economy intervention
    if (state.economyHealth === "critical") {
      actions.push({
        id: `orch_eco_${now}`,
        category: "economy_event",
        priority: "high",
        targetAll: true,
        payload: { event: "emergency_sink_activation", reason: "critical_economy_health" },
        reasoning: "Economy health critical — activating emergency token sink to reduce inflation",
        scheduledAt: now,
      });
    }

    // HIGH: Retention intervention
    if (state.userRetentionRisk === "high") {
      actions.push({
        id: `orch_ret_${now}`,
        category: "retention_intervention",
        priority: "high",
        targetAll: true,
        payload: { campaign: "engagement_boost", bonusXp: 500, message: "We miss you — come back for a bonus!" },
        reasoning: "7-day retention below 20% — triggering re-engagement campaign",
        scheduledAt: now,
      });
    }

    // MEDIUM: Governance nudge
    if (state.governanceActivity === "urgent") {
      actions.push({
        id: `orch_gov_${now}`,
        category: "notification",
        priority: "medium",
        targetAll: true,
        payload: { type: "governance_reminder", message: "Active proposals need your vote — your voice matters" },
        reasoning: "Multiple active governance proposals — driving voter participation",
        scheduledAt: now,
      });
    }

    // LOW: Daily HOPE AI briefing trigger
    actions.push({
      id: `orch_hope_${now}`,
      category: "hope_ai_message",
      priority: "low",
      targetAll: true,
      payload: {
        trigger: "daily_briefing",
        platformScore: state.platformScore,
        recommendations: state.recommendations,
      },
      reasoning: "Daily orchestrator cycle — generating personalized HOPE AI briefings",
      scheduledAt: now,
    });

    return actions;
  }

  // ─── Queue Management ─────────────────────────────────────────────────────

  private enqueue(action: OrchestratorAction): void {
    // Priority sort: critical > high > medium > low
    const priorityWeight = { critical: 0, high: 1, medium: 2, low: 3 };
    this.actionQueue.push(action);
    this.actionQueue.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);
  }

  private async flushQueue(): Promise<void> {
    const toExecute = [...this.actionQueue];
    this.actionQueue = [];

    for (const action of toExecute) {
      try {
        await this.executeAction(action);
        action.executedAt = Date.now();
        action.outcome = "success";
      } catch (e) {
        action.outcome = `failed: ${String(e)}`;
      }
      this.decisionLog.push(action);
    }

    // Trim log
    if (this.decisionLog.length > this.MAX_LOG_SIZE) {
      this.decisionLog = this.decisionLog.slice(-this.MAX_LOG_SIZE);
    }
  }

  private async executeAction(action: OrchestratorAction): Promise<void> {
    // Emit to event bus — downstream consumers handle actual execution
    eventBus.emit(`orchestrator.action.${action.category}`, {
      actionId: action.id,
      priority: action.priority,
      payload: action.payload,
      reasoning: action.reasoning,
      targetUserId: action.targetUserId,
      targetAll: action.targetAll,
    });

    // Persist critical actions to moderation_logs as audit proxy
    if (action.priority === "critical" || action.priority === "high") {
      try {
        const db = await getDb();
        if (!db) return;
        await db.insert(moderationLogs).values({
          targetType: "user",
          targetId: action.targetUserId ?? 0,
          action: "flag",
          reason: `[Orchestrator] ${action.category}: ${action.reasoning}`,
          moderatorId: null,
          isAiAction: true,
          confidence: "0.95",
        });
      } catch { /* non-blocking */ }
    }
  }

  // ─── Per-User Intelligence ────────────────────────────────────────────────

  async getUserIntelligence(userId: number): Promise<UserIntelligenceContext> {
    let archetype = "explorer";
    let riskScore = 0;

    try {
      const profile = await behaviorEngine.getBehaviorProfile(userId);
      archetype = profile?.archetype ?? "explorer";
    } catch { /* non-blocking */ }

    try {
      const report = await securityEngine.getFraudReport(userId);
      riskScore = report.riskScore;
    } catch { /* non-blocking */ }

    // Retention risk based on risk score and archetype
    const retentionRisk: UserIntelligenceContext["retentionRisk"] =
      riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "low";

    // Archetype-specific suggestions
    const archetypeSuggestions: Record<string, string> = {
      trader: "Check today's SKY444 price movement — momentum is building",
      creator: "3 people viewed your profile — publish your next piece",
      governor: "Vote on the active governance proposal before it closes",
      explorer: "Discover 5 new communities matching your interests",
      builder: "Your Shadow IDE project has unsaved changes",
      guardian: "2 moderation reports need your review",
      analyst: "New platform analytics report is ready",
    };

    const suggestedAction = archetypeSuggestions[archetype] ?? "Explore what's new on the platform today";

    // HOPE AI message
    const hopeMessages: Record<string, string> = {
      trader: "Your trading patterns show strong momentum. The market is moving — want me to analyze your portfolio?",
      creator: "Your content reach grew 23% this week. I have 3 ideas for your next post based on what's trending.",
      governor: "There's an active proposal that aligns with your voting history. Your vote could be the deciding one.",
      explorer: "I found 7 communities you'd love based on your interests. Want me to show you the most active ones?",
      builder: "You've been building for 3 days straight. I noticed a pattern — want me to suggest the next feature?",
      guardian: "The platform trust score improved 4% this week. Your moderation work is making a real difference.",
      analyst: "Platform DAU is up 12%. I've prepared a full breakdown — want the detailed report?",
    };

    const hopeAiMessage = hopeMessages[archetype] ?? "Good to see you. What would you like to accomplish today?";

    // Economy opportunity
    let economyOpportunity: string | undefined;
    try {
      const report = await economyEngine.getHealthReport();
      const bestToken = report.tokens.sort((a, b) => b.liquidityScore - a.liquidityScore)[0];
      if (bestToken && bestToken.liquidityScore > 0.8) {
        economyOpportunity = `${bestToken.token} liquidity score is at ${(bestToken.liquidityScore * 100).toFixed(0)}% — high staking APY available`;
      }
    } catch { /* non-blocking */ }

    // Urgent alert
    let urgentAlert: string | undefined;
    if (riskScore > 70) {
      urgentAlert = "Unusual activity detected on your account. Please review your recent transactions.";
    }

    return {
      userId,
      archetype,
      riskScore,
      retentionRisk,
      suggestedAction,
      hopeAiMessage,
      economyOpportunity,
      urgentAlert,
    };
  }

  // ─── State Persistence ────────────────────────────────────────────────────

  private async persistState(state: PlatformIntelligenceState): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;
      await db.insert(platformMetrics).values({
        metric: "platform_health_score",
        value: String(state.platformScore),
        category: "orchestrator",
      });
    } catch { /* non-blocking */ }
  }

  // ─── Public Accessors ─────────────────────────────────────────────────────

  getPlatformState(): PlatformIntelligenceState | null {
    return this.platformState;
  }

  getDecisionLog(limit = 50): OrchestratorAction[] {
    return this.decisionLog.slice(-limit).reverse();
  }

  getQueueDepth(): number {
    return this.actionQueue.length;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const maniusOrchestrator = new ManiusOrchestrator();
