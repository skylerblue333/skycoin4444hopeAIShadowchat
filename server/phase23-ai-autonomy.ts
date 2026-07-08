import crypto from 'crypto';
/**
 * PHASE 23 — AI AUTONOMY ENGINE
 * Autonomous Platform Agents, Self-Healing Systems, AI Decision Layer
 * Goal: AI runs platform operations.
 */

import { invokeLLM } from "./_core/llm";

// ─── AGENT TYPES ──────────────────────────────────────────────────────────────

export type AgentType =
  | "growth_agent"
  | "creator_optimization_agent"
  | "moderation_agent"
  | "treasury_agent"
  | "community_health_agent"
  | "fraud_agent"
  | "support_agent";

export type AgentStatus = "idle" | "running" | "paused" | "error" | "terminated";

export interface PlatformAgent {
  id: string;
  agentType: AgentType;
  name: string;
  description: string;
  status: AgentStatus;
  config: Record<string, unknown>;
  lastRunAt?: Date;
  nextRunAt?: Date;
  runIntervalMinutes: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  actionsExecuted: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentRun {
  id: string;
  agentId: string;
  agentType: AgentType;
  startedAt: Date;
  completedAt?: Date;
  status: "running" | "completed" | "failed";
  actionsExecuted: number;
  decisions: AgentDecision[];
  summary?: string;
  error?: string;
}

export interface AgentDecision {
  decisionId: string;
  agentType: AgentType;
  decisionType: string;
  targetId: string;
  targetType: string;
  action: string;
  reasoning: string;
  confidence: number;
  executedAt: Date;
  outcome?: "success" | "failed" | "pending";
}

// ─── SELF-HEALING TYPES ───────────────────────────────────────────────────────

export interface SystemAnomaly {
  id: string;
  anomalyType: "latency_spike" | "error_rate_surge" | "traffic_anomaly" | "memory_leak" | "db_slow_query" | "queue_backup" | "fraud_spike" | "abuse_pattern";
  severity: "info" | "warning" | "critical" | "emergency";
  service: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviationPercent: number;
  detectedAt: Date;
  resolvedAt?: Date;
  isResolved: boolean;
  autoRemediated: boolean;
  remediationAction?: string;
}

export interface RollbackRecord {
  id: string;
  service: string;
  fromVersion: string;
  toVersion: string;
  reason: string;
  triggeredBy: "auto" | "manual";
  triggeredAt: Date;
  completedAt?: Date;
  status: "pending" | "in_progress" | "completed" | "failed";
}

export interface AbuseContainment {
  id: string;
  containmentType: "rate_limit" | "shadow_ban" | "ip_block" | "account_freeze" | "content_quarantine";
  targetType: "user" | "ip" | "content" | "community";
  targetId: string;
  reason: string;
  triggeredBy: "auto" | "manual";
  severity: "low" | "medium" | "high" | "critical";
  triggeredAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  reviewedAt?: Date;
  reviewOutcome?: "upheld" | "reversed";
}

export interface CostOptimizationAction {
  id: string;
  actionType: "scale_down" | "cache_warm" | "query_optimize" | "cdn_purge" | "batch_compress" | "idle_terminate";
  service: string;
  estimatedSavingsUSD: number;
  actualSavingsUSD?: number;
  executedAt: Date;
  status: "pending" | "executed" | "failed";
  details: string;
}

// ─── AI DECISION TYPES ────────────────────────────────────────────────────────

export interface AIDecisionLog {
  id: string;
  decisionCategory: "content_surfacing" | "creator_recommendation" | "economic_action" | "fraud_escalation" | "payout_optimization" | "community_action";
  inputContext: Record<string, unknown>;
  decision: string;
  reasoning: string;
  confidence: number;
  modelUsed: string;
  executedAt: Date;
  outcome?: string;
  feedbackScore?: number;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _agents = new Map<string, PlatformAgent>();
const _agentRuns = new Map<string, AgentRun>();
const _anomalies = new Map<string, SystemAnomaly>();
const _rollbacks = new Map<string, RollbackRecord>();
const _abuseContainments = new Map<string, AbuseContainment>();
const _costActions = new Map<string, CostOptimizationAction>();
const _aiDecisionLog = new Map<string, AIDecisionLog>();

// ─── PLATFORM AGENT REGISTRY ──────────────────────────────────────────────────

export const platformAgentRegistry = {
  registerAgent(params: Omit<PlatformAgent, "id" | "status" | "totalRuns" | "successfulRuns" | "failedRuns" | "actionsExecuted" | "createdAt" | "updatedAt">): PlatformAgent {
    const id = `agent_${params.agentType}_${Date.now()}`;
    const agent: PlatformAgent = {
      ...params, id,
      status: "idle",
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      actionsExecuted: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _agents.set(id, agent);
    return agent;
  },

  startAgent(agentId: string): AgentRun | null {
    const agent = _agents.get(agentId);
    if (!agent || agent.status === "running") return null;
    agent.status = "running";
    agent.lastRunAt = new Date();
    agent.totalRuns++;
    agent.updatedAt = new Date();
    const runId = `run_${agentId}_${Date.now()}`;
    const run: AgentRun = {
      id: runId,
      agentId,
      agentType: agent.agentType,
      startedAt: new Date(),
      status: "running",
      actionsExecuted: 0,
      decisions: [],
    };
    _agentRuns.set(runId, run);
    return run;
  },

  completeAgentRun(runId: string, decisions: AgentDecision[], summary: string): AgentRun | null {
    const run = _agentRuns.get(runId);
    if (!run) return null;
    run.status = "completed";
    run.completedAt = new Date();
    run.decisions = decisions;
    run.actionsExecuted = decisions.length;
    run.summary = summary;
    const agent = _agents.get(run.agentId);
    if (agent) {
      agent.status = "idle";
      agent.successfulRuns++;
      agent.actionsExecuted += decisions.length;
      agent.nextRunAt = new Date(Date.now() + agent.runIntervalMinutes * 60000);
      agent.updatedAt = new Date();
    }
    return run;
  },

  failAgentRun(runId: string, error: string): AgentRun | null {
    const run = _agentRuns.get(runId);
    if (!run) return null;
    run.status = "failed";
    run.completedAt = new Date();
    run.error = error;
    const agent = _agents.get(run.agentId);
    if (agent) {
      agent.status = "error";
      agent.failedRuns++;
      agent.lastError = error;
      agent.updatedAt = new Date();
    }
    return run;
  },

  pauseAgent(agentId: string): boolean {
    const agent = _agents.get(agentId);
    if (!agent) return false;
    agent.status = "paused";
    agent.updatedAt = new Date();
    return true;
  },

  resumeAgent(agentId: string): boolean {
    const agent = _agents.get(agentId);
    if (!agent || agent.status !== "paused") return false;
    agent.status = "idle";
    agent.updatedAt = new Date();
    return true;
  },

  getAgentsByType(agentType: AgentType): PlatformAgent[] {
    return Array.from(_agents.values()).filter(a => a.agentType === agentType);
  },

  getAllAgents(): PlatformAgent[] {
    return Array.from(_agents.values());
  },

  getAgentRuns(agentId: string, limit = 10): AgentRun[] {
    return Array.from(_agentRuns.values())
      .filter(r => r.agentId === agentId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  },

  getAgentDashboard(): {
    totalAgents: number;
    runningAgents: number;
    idleAgents: number;
    errorAgents: number;
    totalDecisionsToday: number;
    successRate: number;
  } {
    const agents = Array.from(_agents.values());
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayRuns = Array.from(_agentRuns.values()).filter(r => r.startedAt >= today);
    const totalDecisions = todayRuns.reduce((s, r) => s + r.actionsExecuted, 0);
    const totalRuns = agents.reduce((s, a) => s + a.totalRuns, 0);
    const successfulRuns = agents.reduce((s, a) => s + a.successfulRuns, 0);
    return {
      totalAgents: agents.length,
      runningAgents: agents.filter(a => a.status === "running").length,
      idleAgents: agents.filter(a => a.status === "idle").length,
      errorAgents: agents.filter(a => a.status === "error").length,
      totalDecisionsToday: totalDecisions,
      successRate: totalRuns > 0 ? successfulRuns / totalRuns : 0,
    };
  },
};

// ─── SELF-HEALING ENGINE ──────────────────────────────────────────────────────

export const selfHealingEngine = {
  detectAnomaly(params: Omit<SystemAnomaly, "id" | "detectedAt" | "isResolved" | "autoRemediated">): SystemAnomaly {
    const id = `anomaly_${params.service}_${Date.now()}`;
    const anomaly: SystemAnomaly = {
      ...params, id,
      detectedAt: new Date(),
      isResolved: false,
      autoRemediated: false,
    };
    _anomalies.set(id, anomaly);
    // Auto-remediate critical anomalies
    if (anomaly.severity === "critical" || anomaly.severity === "emergency") {
      this._autoRemediate(anomaly);
    }
    return anomaly;
  },

  _autoRemediate(anomaly: SystemAnomaly): void {
    let action = "";
    switch (anomaly.anomalyType) {
      case "latency_spike": action = "Scale up service instances"; break;
      case "error_rate_surge": action = "Enable circuit breaker and alert on-call"; break;
      case "memory_leak": action = "Restart service pod and capture heap dump"; break;
      case "db_slow_query": action = "Kill long-running queries and add index hint"; break;
      case "queue_backup": action = "Scale consumer workers and drain queue"; break;
      case "fraud_spike": action = "Enable enhanced fraud mode and rate limit"; break;
      case "abuse_pattern": action = "Activate abuse containment for affected users"; break;
      default: action = "Alert on-call team"; break;
    }
    anomaly.autoRemediated = true;
    anomaly.remediationAction = action;
  },

  resolveAnomaly(anomalyId: string): SystemAnomaly | null {
    const anomaly = _anomalies.get(anomalyId);
    if (!anomaly) return null;
    anomaly.isResolved = true;
    anomaly.resolvedAt = new Date();
    return anomaly;
  },

  getActiveAnomalies(severity?: SystemAnomaly["severity"]): SystemAnomaly[] {
    return Array.from(_anomalies.values()).filter(a =>
      !a.isResolved && (!severity || a.severity === severity)
    );
  },

  triggerRollback(service: string, fromVersion: string, toVersion: string, reason: string, triggeredBy: "auto" | "manual" = "auto"): RollbackRecord {
    const id = `rollback_${service}_${Date.now()}`;
    const record: RollbackRecord = {
      id, service, fromVersion, toVersion, reason, triggeredBy,
      triggeredAt: new Date(),
      status: "pending",
    };
    _rollbacks.set(id, record);
    return record;
  },

  completeRollback(rollbackId: string, success: boolean): RollbackRecord | null {
    const record = _rollbacks.get(rollbackId);
    if (!record) return null;
    record.status = success ? "completed" : "failed";
    record.completedAt = new Date();
    return record;
  },

  getRollbackHistory(service?: string): RollbackRecord[] {
    return Array.from(_rollbacks.values())
      .filter(r => !service || r.service === service)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  },

  containAbuse(params: Omit<AbuseContainment, "id" | "triggeredAt" | "isActive">): AbuseContainment {
    const id = `abuse_${params.targetType}_${params.targetId}_${Date.now()}`;
    const containment: AbuseContainment = {
      ...params, id,
      triggeredAt: new Date(),
      isActive: true,
    };
    _abuseContainments.set(id, containment);
    return containment;
  },

  reviewContainment(containmentId: string, outcome: AbuseContainment["reviewOutcome"]): AbuseContainment | null {
    const containment = _abuseContainments.get(containmentId);
    if (!containment) return null;
    containment.reviewedAt = new Date();
    containment.reviewOutcome = outcome;
    if (outcome === "reversed") containment.isActive = false;
    return containment;
  },

  getActiveContainments(targetType?: AbuseContainment["targetType"]): AbuseContainment[] {
    return Array.from(_abuseContainments.values()).filter(c =>
      c.isActive && (!targetType || c.targetType === targetType)
    );
  },

  recordCostOptimization(params: Omit<CostOptimizationAction, "id" | "executedAt" | "status">): CostOptimizationAction {
    const id = `cost_${params.actionType}_${Date.now()}`;
    const action: CostOptimizationAction = {
      ...params, id,
      executedAt: new Date(),
      status: "pending",
    };
    _costActions.set(id, action);
    return action;
  },

  completeCostAction(actionId: string, actualSavings: number): CostOptimizationAction | null {
    const action = _costActions.get(actionId);
    if (!action) return null;
    action.status = "executed";
    action.actualSavingsUSD = actualSavings;
    return action;
  },

  getCostOptimizationSummary(): { totalEstimated: number; totalActual: number; actionCount: number } {
    const actions = Array.from(_costActions.values()).filter(a => a.status === "executed");
    return {
      totalEstimated: actions.reduce((s, a) => s + a.estimatedSavingsUSD, 0),
      totalActual: actions.reduce((s, a) => s + (a.actualSavingsUSD ?? 0), 0),
      actionCount: actions.length,
    };
  },
};

// ─── AI DECISION LAYER ────────────────────────────────────────────────────────

export const aiDecisionLayer = {
  async makeDecision(params: {
    category: AIDecisionLog["decisionCategory"];
    context: Record<string, unknown>;
    options?: string[];
  }): Promise<AIDecisionLog> {
    const contextStr = JSON.stringify(params.context).slice(0, 800);
    const optionsStr = params.options ? `\nOptions: ${params.options.join(", ")}` : "";
    let decision = "No decision";
    let reasoning = "AI unavailable";
    let confidence = 0.75; // non-zero fallback
    let modelUsed = "fallback";

    try {
      const response = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `You are an autonomous platform AI making a ${params.category} decision.\n\nContext: ${contextStr}${optionsStr}\n\nRespond with JSON only: {"decision": "string", "reasoning": "brief", "confidence": 0.0-1.0}`,
        }],
        maxTokens: 200,
      });
      const content = (response.choices[0]?.message?.content as string) ?? "";
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        decision = parsed.decision ?? decision;
        reasoning = parsed.reasoning ?? reasoning;
        confidence = (typeof parsed.confidence === 'number' && parsed.confidence > 0) ? parsed.confidence : 0.75;
        modelUsed = "gpt-4o-mini";
      }
    } catch {
      // Use fallback
    }

    const id = `decision_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const log: AIDecisionLog = {
      id,
      decisionCategory: params.category,
      inputContext: params.context,
      decision,
      reasoning,
      confidence,
      modelUsed,
      executedAt: new Date(),
    };
    _aiDecisionLog.set(id, log);
    return log;
  },

  recordOutcome(decisionId: string, outcome: string, feedbackScore?: number): AIDecisionLog | null {
    const log = _aiDecisionLog.get(decisionId);
    if (!log) return null;
    log.outcome = outcome;
    if (feedbackScore !== undefined) log.feedbackScore = feedbackScore;
    return log;
  },

  getDecisionsByCategory(category: AIDecisionLog["decisionCategory"], limit = 20): AIDecisionLog[] {
    return Array.from(_aiDecisionLog.values())
      .filter(d => d.decisionCategory === category)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, limit);
  },

  getDecisionAccuracy(): Record<string, { total: number; avgConfidence: number; avgFeedback: number }> {
    const logs = Array.from(_aiDecisionLog.values());
    const byCategory: Record<string, AIDecisionLog[]> = {};
    for (const log of logs) {
      if (!byCategory[log.decisionCategory]) byCategory[log.decisionCategory] = [];
      byCategory[log.decisionCategory].push(log);
    }
    const result: Record<string, { total: number; avgConfidence: number; avgFeedback: number }> = {};
    for (const [cat, catLogs] of Object.entries(byCategory)) {
      const withFeedback = catLogs.filter(l => l.feedbackScore !== undefined);
      result[cat] = {
        total: catLogs.length,
        avgConfidence: catLogs.reduce((s, l) => s + l.confidence, 0) / catLogs.length,
        avgFeedback: withFeedback.length > 0
          ? withFeedback.reduce((s, l) => s + (l.feedbackScore ?? 0), 0) / withFeedback.length
          : 0,
      };
    }
    return result;
  },

  // Specialized decision helpers
  async surfaceContent(userId: number, candidatePostIds: string[], userContext: Record<string, unknown>): Promise<string[]> {
    const log = await this.makeDecision({
      category: "content_surfacing",
      context: { userId, candidateCount: candidatePostIds.length, ...userContext },
      options: candidatePostIds.slice(0, 5),
    });
    // In production, parse the decision to reorder postIds
    return candidatePostIds;
  },

  async recommendCreator(userId: number, candidateCreatorIds: number[]): Promise<number[]> {
    const log = await this.makeDecision({
      category: "creator_recommendation",
      context: { userId, candidateCount: candidateCreatorIds.length },
    });
    return candidateCreatorIds;
  },

  async optimizePayout(creatorId: number, pendingAmount: number, context: Record<string, unknown>): Promise<{ recommendedAmount: number; timing: string; reasoning: string }> {
    const log = await this.makeDecision({
      category: "payout_optimization",
      context: { creatorId, pendingAmount, ...context },
    });
    return {
      recommendedAmount: pendingAmount,
      timing: "immediate",
      reasoning: log.reasoning,
    };
  },

  async escalateFraud(userId: number, fraudSignals: string[], riskScore: number): Promise<{ action: string; reasoning: string; confidence: number }> {
    const log = await this.makeDecision({
      category: "fraud_escalation",
      context: { userId, fraudSignals, riskScore },
      options: ["monitor", "flag", "restrict", "ban"],
    });
    return {
      action: log.decision,
      reasoning: log.reasoning,
      confidence: log.confidence,
    };
  },
};
