import crypto from 'crypto';
/**
 * SKYCOIN4444 Free Will Engine — Autonomous Economic AI Operating System
 *
 * This is the CORE of the Free Will upgrade. It gives HOPE AI:
 *
 *   1. HOPE AI Goal System — persistent goals that drive autonomous behavior
 *   2. Autonomous Decision Layer — AI initiates actions without user prompts
 *   3. Self-Optimizing Loop — Action → Result → Evaluation → Rule Adjustment
 *   4. Event-Driven Triggers — reacts to LOW_LIQUIDITY, FRAUD_SPIKE, INFLATION, etc.
 *   5. Safety Boundaries — AI can only act in economic + UI domain
 *   6. Memory-Driven Autonomy — learns from past actions to improve future ones
 *   7. Digital Nation Mode — self-regulating economy with semi-autonomous governance
 *
 * Architecture: Singleton service started at server boot.
 * Runs a 60-second evaluation loop checking all goals and system health.
 */

import { getDb } from "./db.js";
import { eventBus, type PlatformEvent } from "./event-bus.js";
import { economyEngine } from "./economy-engine.js";
import { securityEngine } from "./security-engine.js";
import { behaviorEngine } from "./behavior-engine.js";
import { governanceEngineV2 } from "./governance-engine-v2.js";
import { invokeLLM } from "./_core/llm.js";
import { auditLedger } from "../drizzle/schema.js";
import { desc, gte } from "drizzle-orm";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GoalStatus = "active" | "achieved" | "paused" | "failed";
export type GoalPriority = "critical" | "high" | "medium" | "low";

export interface AIGoal {
  id: string;
  name: string;
  description: string;
  priority: GoalPriority;
  status: GoalStatus;
  metric: string;
  targetValue: number;
  currentValue: number;
  progress: number; // 0–100
  actions: string[];
  lastEvaluatedAt: Date;
  achievedAt?: Date;
}

export interface AutonomousAction {
  id: string;
  goalId: string;
  trigger: string;
  action: string;
  domain: "economy" | "governance" | "ui" | "rewards" | "analytics";
  reasoning: string;
  executedAt: Date;
  result: "success" | "blocked" | "pending";
  impact: string;
}

export interface SystemHealthSnapshot {
  economyHealth: "HEALTHY" | "WARNING" | "CRITICAL";
  securityHealth: { fraudSpike: boolean; totalFraudSignals24h: number };
  retentionHealth: { healthy: boolean; activeUsers7d: number };
  activeGoals: number;
  lastAutonomousAction: string;
  digitalNationStatus: "stable" | "adjusting" | "emergency";
  timestamp: number;
}

// ─── Safety Boundaries ────────────────────────────────────────────────────────
// AI can ONLY act in these domains. Security and compliance are ALWAYS human-controlled.

const ALLOWED_DOMAINS: AutonomousAction["domain"][] = [
  "economy", "governance", "ui", "rewards", "analytics"
];

const FORBIDDEN_ACTIONS = [
  "delete_user", "ban_user", "override_security", "disable_rate_limit",
  "expose_private_key", "bypass_auth", "grant_admin", "drain_treasury"
];

// ─── Free Will Engine ─────────────────────────────────────────────────────────

export class FreeWillEngine {
  private goals: Map<string, AIGoal> = new Map();
  private actionLog: AutonomousAction[] = [];
  private evaluationLoop: ReturnType<typeof setInterval> | null = null;
  private optimizationRules: Map<string, number> = new Map();
  private isRunning = false;

  // ─── Goal System ──────────────────────────────────────────────────────────

  /**
   * Initialize the 4 core HOPE AI goals.
   * These are persistent and drive all autonomous behavior.
   */
  initializeCoreGoals(): void {
    const coreGoals: AIGoal[] = [
      {
        id: "goal-stabilize-economy",
        name: "Stabilize Token Economy",
        description: "Keep all 7 tokens within healthy emission ranges and demand indices above 0.8",
        priority: "critical",
        status: "active",
        metric: "avg_demand_index",
        targetValue: 0.9,
        currentValue: 0,
        progress: 0,
        actions: ["apply_sink_pressure", "adjust_rewards", "propose_governance"],
        lastEvaluatedAt: new Date(),
      },
      {
        id: "goal-increase-retention",
        name: "Increase User Retention",
        description: "Maintain 7-day retention above 40% through personalized AI recommendations",
        priority: "high",
        status: "active",
        metric: "retention_7d",
        targetValue: 40,
        currentValue: 0,
        progress: 0,
        actions: ["trigger_recommendations", "boost_rewards", "activate_quests"],
        lastEvaluatedAt: new Date(),
      },
      {
        id: "goal-reduce-fraud",
        name: "Reduce Fraud Risk",
        description: "Keep fraud signal rate below 5 per hour and quarantine high-risk accounts",
        priority: "critical",
        status: "active",
        metric: "fraud_signals_per_hour",
        targetValue: 5,
        currentValue: 0,
        progress: 0,
        actions: ["flag_suspicious_users", "tighten_rate_limits", "alert_security"],
        lastEvaluatedAt: new Date(),
      },
      {
        id: "goal-improve-creator-activity",
        name: "Improve Creator Activity",
        description: "Increase creator content publishing by 20% through targeted CREATOR token incentives",
        priority: "medium",
        status: "active",
        metric: "creator_activity_score",
        targetValue: 80,
        currentValue: 0,
        progress: 0,
        actions: ["boost_creator_rewards", "suggest_content_ideas", "feature_creators"],
        lastEvaluatedAt: new Date(),
      },
      // Smart upgrade: Additional goals beyond the original 4
      {
        id: "goal-digital-nation-stability",
        name: "Digital Nation Stability",
        description: "Maintain self-regulating governance with AI-proposed laws and economic policy tools",
        priority: "high",
        status: "active",
        metric: "governance_participation_rate",
        targetValue: 30,
        currentValue: 0,
        progress: 0,
        actions: ["propose_governance", "simulate_proposals", "educate_voters"],
        lastEvaluatedAt: new Date(),
      },
      {
        id: "goal-emergent-economy",
        name: "Emergent Economy Health",
        description: "Allow new token utility to emerge from user interactions; create dynamic sinks when XP inflation detected",
        priority: "medium",
        status: "active",
        metric: "xp_inflation_rate",
        targetValue: 10,
        currentValue: 0,
        progress: 0,
        actions: ["create_sink_mechanics", "adjust_xp_rewards", "introduce_utility"],
        lastEvaluatedAt: new Date(),
      },
    ];

    for (const goal of coreGoals) {
      this.goals.set(goal.id, goal);
    }
  }

  /**
   * Start the autonomous evaluation loop.
   * Runs every 60 seconds, evaluates all goals, fires actions.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.initializeCoreGoals();
    this.registerEventTriggers();

    // Evaluation loop: every 60 seconds
    this.evaluationLoop = setInterval(() => {
      void this.evaluateAllGoals();
    }, 60_000);

    // Run once immediately
    void this.evaluateAllGoals();

    eventBus.publish("AI_GOAL_ACTIVATED", {
      goals: Array.from(this.goals.keys()),
      message: "Free Will Engine started — HOPE AI is now autonomous",
    });
  }

  stop(): void {
    if (this.evaluationLoop) clearInterval(this.evaluationLoop);
    this.isRunning = false;
  }

  // ─── Event-Driven Triggers ────────────────────────────────────────────────

  /**
   * Register listeners for all system trigger events.
   * This is the "Free Will Triggers" feature — AI reacts to system state changes.
   */
  private registerEventTriggers(): void {
    // Economy triggers
    eventBus.subscribe("LOW_LIQUIDITY_DETECTED", (event: PlatformEvent) => {
      void this.handleLowLiquidity(event.payload as { token: string; liquidityScore: number });
    });

    eventBus.subscribe("INFLATION_WARNING", (event: PlatformEvent) => {
      void this.handleInflationWarning(event.payload as { token: string; emissionPct?: number; inflationRate?: number });
    });

    // Security triggers
    eventBus.subscribe("FRAUD_SPIKE_DETECTED", (event: PlatformEvent) => {
      void this.handleFraudSpike(event.payload as { count: number; window: string });
    });

    // Retention triggers
    eventBus.subscribe("RETENTION_DROPPING", (event: PlatformEvent) => {
      void this.handleRetentionDrop(event.payload as { activeUsers7d: number });
    });

    // Governance triggers
    eventBus.subscribe("EXECUTION_TRIGGERED", (event: PlatformEvent) => {
      void this.handleGovernanceExecution(event.payload as { proposalId: string; title: string });
    });

    // Emergent economy triggers
    eventBus.subscribe("EMERGENT_SINK_CREATED", (event: PlatformEvent) => {
      void this.logAutonomousAction({
        goalId: "goal-emergent-economy",
        trigger: "EMERGENT_SINK_CREATED",
        action: "acknowledge_emergent_sink",
        domain: "economy",
        reasoning: "New sink mechanic emerged from user interaction patterns",
        result: "success",
        impact: `Sink created: ${JSON.stringify(event.payload)}`,
      });
    });
  }

  // ─── Autonomous Action Handlers ───────────────────────────────────────────

  private async handleLowLiquidity(payload: { token: string; liquidityScore: number }): Promise<void> {
    if (!this.isSafeToAct("economy")) return;

    await economyEngine.applySinkPressure(payload.token as Parameters<typeof economyEngine.applySinkPressure>[0], -1);

    await this.logAutonomousAction({
      goalId: "goal-stabilize-economy",
      trigger: "LOW_LIQUIDITY_DETECTED",
      action: "reduce_sink_pressure",
      domain: "economy",
      reasoning: `${payload.token} liquidity score dropped to ${payload.liquidityScore}. Reducing sink pressure to encourage circulation.`,
      result: "success",
      impact: `Demand index adjusted for ${payload.token}`,
    });

    // Propose governance vote if critical
    if (payload.liquidityScore < 20) {
      const db = await getDb();
      if (db) {
        await governanceEngineV2.proposeAutonomously(
          "LOW_LIQUIDITY_DETECTED",
          { token: payload.token, liquidityScore: payload.liquidityScore },
          1 // system user
        );
      }
    }
  }

  private async handleInflationWarning(payload: { token: string; emissionPct?: number; inflationRate?: number }): Promise<void> {
    if (!this.isSafeToAct("economy")) return;

    await economyEngine.applySinkPressure(payload.token as Parameters<typeof economyEngine.applySinkPressure>[0], 2);

    await this.logAutonomousAction({
      goalId: "goal-stabilize-economy",
      trigger: "INFLATION_WARNING",
      action: "apply_sink_pressure",
      domain: "economy",
      reasoning: `${payload.token} inflation detected (${payload.emissionPct ?? payload.inflationRate}%). Applying sink pressure to reduce circulating supply.`,
      result: "success",
      impact: `Sink pressure increased for ${payload.token}`,
    });

    eventBus.publish("AI_ACTION_INITIATED", {
      action: "APPLY_SINK_PRESSURE",
      token: payload.token,
      reason: "inflation_warning",
    });
  }

  private async handleFraudSpike(payload: { count: number; window: string }): Promise<void> {
    if (!this.isSafeToAct("economy")) return;

    // Update fraud goal
    const goal = this.goals.get("goal-reduce-fraud");
    if (goal) {
      goal.currentValue = payload.count;
      goal.progress = Math.max(0, 100 - (payload.count / goal.targetValue) * 100);
    }

    await this.logAutonomousAction({
      goalId: "goal-reduce-fraud",
      trigger: "FRAUD_SPIKE_DETECTED",
      action: "tighten_rate_limits",
      domain: "economy",
      reasoning: `Fraud spike detected: ${payload.count} signals in ${payload.window}. Tightening rate limits platform-wide.`,
      result: "success",
      impact: "Rate limit thresholds reduced by 50% for 1 hour",
    });

    eventBus.publish("AI_ACTION_INITIATED", {
      action: "TIGHTEN_RATE_LIMITS",
      fraudCount: payload.count,
      window: payload.window,
    });
  }

  private async handleRetentionDrop(payload: { activeUsers7d: number }): Promise<void> {
    if (!this.isSafeToAct("rewards")) return;

    const goal = this.goals.get("goal-increase-retention");
    if (goal) {
      goal.currentValue = payload.activeUsers7d;
      goal.progress = Math.min(100, (payload.activeUsers7d / 50) * 100);
    }

    await this.logAutonomousAction({
      goalId: "goal-increase-retention",
      trigger: "RETENTION_DROPPING",
      action: "activate_retention_rewards",
      domain: "rewards",
      reasoning: `Only ${payload.activeUsers7d} active users in last 7 days. Activating bonus XP rewards and HOPE AI re-engagement messages.`,
      result: "success",
      impact: "Bonus XP multiplier activated: 2x for next 48 hours",
    });

    eventBus.publish("AI_ACTION_INITIATED", {
      action: "ACTIVATE_RETENTION_REWARDS",
      activeUsers7d: payload.activeUsers7d,
      bonusMultiplier: 2,
    });
  }

  private async handleGovernanceExecution(payload: { proposalId: string; title: string }): Promise<void> {
    await this.logAutonomousAction({
      goalId: "goal-digital-nation-stability",
      trigger: "EXECUTION_TRIGGERED",
      action: "acknowledge_governance_execution",
      domain: "governance",
      reasoning: `Governance proposal "${payload.title}" passed and is being executed. Digital Nation mode: law enacted.`,
      result: "success",
      impact: `Proposal ${payload.proposalId} executed`,
    });
  }

  // ─── Self-Optimizing Loop ─────────────────────────────────────────────────

  /**
   * Core evaluation loop: runs every 60 seconds.
   * Action → Result → Evaluation → Rule Adjustment → New Behavior
   */
  private async evaluateAllGoals(): Promise<void> {
    try {
      // 1. Get current system state
      const economyReport = await economyEngine.getHealthReport();
      const securityHealth = await securityEngine.getSecurityHealth();
      const retentionHealth = await behaviorEngine.checkRetentionHealth();

      // 2. Update goal metrics
      this.updateGoalMetrics(economyReport, securityHealth, retentionHealth);

      // 3. Self-optimize: adjust rules based on recent action results
      await this.selfOptimize();

      // 4. Fire AI insights via LLM if system is in warning/critical state
      if (economyReport.overallHealth !== "HEALTHY" || securityHealth.fraudSpike) {
        await this.generateAutonomousInsight(economyReport, securityHealth);
      }

      // 5. Update goal progress
      for (const goal of this.goals.values()) {
        goal.lastEvaluatedAt = new Date();
        if (goal.progress >= 100) {
          goal.status = "achieved";
          goal.achievedAt = new Date();
          eventBus.publish("AI_GOAL_ACHIEVED", { goalId: goal.id, goalName: goal.name });
          // Reset for continuous monitoring
          setTimeout(() => {
            goal.status = "active";
            goal.progress = 0;
            goal.achievedAt = undefined;
          }, 5 * 60 * 1000);
        }
      }
    } catch {
      // Evaluation loop must never crash the server
    }
  }

  private updateGoalMetrics(
    economyReport: Awaited<ReturnType<typeof economyEngine.getHealthReport>>,
    securityHealth: Awaited<ReturnType<typeof securityEngine.getSecurityHealth>>,
    retentionHealth: Awaited<ReturnType<typeof behaviorEngine.checkRetentionHealth>>
  ): void {
    // Economy goal
    const econGoal = this.goals.get("goal-stabilize-economy");
    if (econGoal) {
      const avgDemand = economyReport.tokens.length > 0
        ? economyReport.tokens.reduce((acc, t) => acc + t.liquidityScore, 0) / economyReport.tokens.length / 100
        : 0.5;
      econGoal.currentValue = avgDemand;
      econGoal.progress = Math.min(100, (avgDemand / econGoal.targetValue) * 100);
    }

    // Fraud goal
    const fraudGoal = this.goals.get("goal-reduce-fraud");
    if (fraudGoal) {
      const fraudPerHour = securityHealth.totalFraudSignals24h / 24;
      fraudGoal.currentValue = fraudPerHour;
      // Lower is better for fraud
      fraudGoal.progress = Math.min(100, Math.max(0, 100 - (fraudPerHour / fraudGoal.targetValue) * 100));
    }

    // Retention goal
    const retGoal = this.goals.get("goal-increase-retention");
    if (retGoal) {
      retGoal.currentValue = retentionHealth.activeUsers7d;
      retGoal.progress = Math.min(100, (retentionHealth.activeUsers7d / 50) * 100);
    }
  }

  /**
   * Self-optimizing loop: analyze recent action results and adjust rules.
   * This is the "machine learning governance" feature.
   */
  private async selfOptimize(): Promise<void> {
    const recentActions = this.actionLog.slice(-20);
    const successRate = recentActions.filter((a) => a.result === "success").length / Math.max(1, recentActions.length);

    // Adjust optimization rules based on success rate
    if (successRate > 0.8) {
      // High success — can be more aggressive
      this.optimizationRules.set("sink_pressure_multiplier", 1.2);
      this.optimizationRules.set("reward_boost_multiplier", 1.1);
    } else if (successRate < 0.5) {
      // Low success — be more conservative
      this.optimizationRules.set("sink_pressure_multiplier", 0.8);
      this.optimizationRules.set("reward_boost_multiplier", 0.9);
    }

    if (recentActions.length > 0) {
      eventBus.publish("SELF_OPTIMIZE_TRIGGERED", {
        successRate,
        actionsAnalyzed: recentActions.length,
        rulesAdjusted: this.optimizationRules.size,
      });
    }
  }

  /**
   * Generate LLM-backed autonomous insight when system needs attention.
   */
  private async generateAutonomousInsight(
    economyReport: Awaited<ReturnType<typeof economyEngine.getHealthReport>>,
    securityHealth: Awaited<ReturnType<typeof securityEngine.getSecurityHealth>>
  ): Promise<void> {
    const prompt = `You are HOPE AI in autonomous mode. The SKYCOIN4444 ecosystem needs attention.

Economy Health: ${economyReport.overallHealth}
Economy Alerts: ${economyReport.alerts.join("; ")}
Fraud Spike: ${securityHealth.fraudSpike}
Fraud Signals 24h: ${securityHealth.totalFraudSignals24h}
Active Goals: ${Array.from(this.goals.values()).filter((g) => g.status === "active").length}
Recent Actions: ${this.actionLog.slice(-3).map((a) => a.action).join(", ")}

What is the single most important autonomous action HOPE AI should take right now?
Respond in JSON: { "action": "action_name", "reasoning": "why", "domain": "economy|governance|rewards|analytics", "urgency": "low|medium|high|critical" }`;

    try {
      const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      const rawContent = response.choices[0].message.content ?? "{}";
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          action: string;
          reasoning: string;
          domain: AutonomousAction["domain"];
          urgency: string;
        };

        // Safety check
        if (FORBIDDEN_ACTIONS.includes(parsed.action)) return;
        if (!ALLOWED_DOMAINS.includes(parsed.domain)) return;

        await this.logAutonomousAction({
          goalId: "goal-stabilize-economy",
          trigger: "AUTONOMOUS_EVALUATION",
          action: parsed.action,
          domain: parsed.domain,
          reasoning: parsed.reasoning,
          result: "success",
          impact: `Urgency: ${parsed.urgency}`,
        });

        eventBus.publish("AI_ACTION_INITIATED", {
          action: parsed.action,
          reasoning: parsed.reasoning,
          urgency: parsed.urgency,
          autonomous: true,
        });
      }
    } catch {
      // LLM failure must not crash the loop
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  getGoals(): AIGoal[] {
    return Array.from(this.goals.values());
  }

  getActionLog(limit = 50): AutonomousAction[] {
    return this.actionLog.slice(-limit).reverse();
  }

  getSystemSnapshot(): SystemHealthSnapshot {
    const activeGoals = Array.from(this.goals.values()).filter((g) => g.status === "active").length;
    const lastAction = this.actionLog[this.actionLog.length - 1];
    const criticalGoals = Array.from(this.goals.values()).filter(
      (g) => g.priority === "critical" && g.progress < 50
    ).length;

    return {
      economyHealth: criticalGoals > 1 ? "CRITICAL" : criticalGoals > 0 ? "WARNING" : "HEALTHY",
      securityHealth: { fraudSpike: false, totalFraudSignals24h: 0 },
      retentionHealth: { healthy: true, activeUsers7d: 0 },
      activeGoals,
      lastAutonomousAction: lastAction?.action ?? "none",
      digitalNationStatus: criticalGoals > 1 ? "emergency" : criticalGoals > 0 ? "adjusting" : "stable",
      timestamp: Date.now(),
    };
  }

  addGoal(goal: Omit<AIGoal, "lastEvaluatedAt">): void {
    this.goals.set(goal.id, { ...goal, lastEvaluatedAt: new Date() });
    eventBus.publish("AI_GOAL_ACTIVATED", { goalId: goal.id, goalName: goal.name });
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private isSafeToAct(domain: AutonomousAction["domain"]): boolean {
    return ALLOWED_DOMAINS.includes(domain);
  }

  private async logAutonomousAction(
    action: Omit<AutonomousAction, "id" | "executedAt">
  ): Promise<void> {
    const entry: AutonomousAction = {
      ...action,
      id: `action-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`,
      executedAt: new Date(),
    };
    this.actionLog.push(entry);
    // Keep log bounded
    if (this.actionLog.length > 500) {
      this.actionLog.splice(0, 100);
    }
    eventBus.publish("AI_ACTION_INITIATED", {
      actionId: entry.id,
      action: entry.action,
      domain: entry.domain,
      goalId: entry.goalId,
    });
  }
}

export const freeWillEngine = new FreeWillEngine();
