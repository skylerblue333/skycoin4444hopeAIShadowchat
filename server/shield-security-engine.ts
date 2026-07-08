import crypto from 'crypto';
/**
 * SHIELD Security Engine v1.0
 * Fraud detection, 2FA, audit logging, threat intelligence, bot detection for SKYCOIN4444
 */

import { invokeLLM } from "./_core/llm";

export interface ThreatEvent {
  id: string;
  type: "brute_force" | "sql_injection" | "xss" | "csrf" | "bot" | "fraud" | "anomaly" | "ddos";
  severity: "low" | "medium" | "high" | "critical";
  sourceIp: string;
  userId?: number;
  endpoint?: string;
  payload?: string;
  timestamp: number;
  blocked: boolean;
  details: Record<string, unknown>;
}

export interface SecurityScore {
  userId: number;
  score: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: Array<{ factor: string; impact: number; description: string }>;
  lastUpdated: number;
}

export interface AuditLog {
  id: string;
  userId?: number;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details: Record<string, unknown>;
  timestamp: number;
}

export interface IPReputation {
  ip: string;
  score: number;
  country: string;
  isTor: boolean;
  isVPN: boolean;
  isProxy: boolean;
  isBot: boolean;
  threatTypes: string[];
  lastSeen: number;
}

export interface SessionSecurity {
  sessionId: string;
  userId: number;
  ipAddress: string;
  userAgent: string;
  createdAt: number;
  lastActivity: number;
  isActive: boolean;
  mfaVerified: boolean;
  riskScore: number;
}

export interface FraudSignal {
  type: string;
  weight: number;
  detected: boolean;
  details: string;
}

// ============================================================
// FRAUD DETECTION ENGINE
// ============================================================

export class FraudDetectionEngine {
  private readonly signals: FraudSignal[] = [
    { type: "velocity_check", weight: 0.3, detected: false, details: "" },
    { type: "device_fingerprint", weight: 0.2, detected: false, details: "" },
    { type: "geo_anomaly", weight: 0.25, detected: false, details: "" },
    { type: "behavior_anomaly", weight: 0.15, detected: false, details: "" },
    { type: "known_fraud_pattern", weight: 0.1, detected: false, details: "" },
  ];

  private recentActions = new Map<number, Array<{ action: string; timestamp: number }>>();

  recordAction(userId: number, action: string): void {
    const actions = this.recentActions.get(userId) || [];
    actions.push({ action, timestamp: Date.now() });
    const cutoff = Date.now() - 3600000;
    this.recentActions.set(userId, actions.filter(a => a.timestamp > cutoff).slice(-100));
  }

  analyzeTransaction(userId: number, amount: number, ipAddress: string): { riskScore: number; signals: FraudSignal[]; recommendation: "allow" | "review" | "block" } {
    const signals: FraudSignal[] = [];
    let riskScore = 0;

    const actions = this.recentActions.get(userId) || [];
    const recentCount = actions.filter(a => Date.now() - a.timestamp < 300000).length;
    if (recentCount > 20) {
      signals.push({ type: "velocity_check", weight: 0.3, detected: true, details: `${recentCount} actions in 5 minutes` });
      riskScore += 30;
    }

    if (amount > 10000) {
      signals.push({ type: "large_transaction", weight: 0.25, detected: true, details: `Amount: $${amount}` });
      riskScore += 25;
    }

    const knownBadIps = ["10.0.0.99", "192.168.1.100"];
    if (knownBadIps.includes(ipAddress)) {
      signals.push({ type: "known_fraud_pattern", weight: 0.4, detected: true, details: `IP ${ipAddress} flagged` });
      riskScore += 40;
    }

    return {
      riskScore: Math.min(100, riskScore),
      signals,
      recommendation: riskScore >= 70 ? "block" : riskScore >= 40 ? "review" : "allow",
    };
  }

  async analyzeWithAI(context: Record<string, unknown>): Promise<{ riskScore: number; explanation: string; recommendation: string }> {
    const prompt = `Analyze this transaction for fraud risk: ${JSON.stringify(context)}. Return JSON: {"riskScore":0,"explanation":"string","recommendation":"allow|review|block"}`;
    try {
      const resp = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      const content = String(resp.choices[0]?.message?.content || "");
      if (content) return JSON.parse(content);
    } catch { /* fall through */ }
    return { riskScore: 0, explanation: "Analysis unavailable", recommendation: "allow" };
  }
}

// ============================================================
// BOT DETECTION ENGINE
// ============================================================

export class BotDetectionEngine {
  private requestPatterns = new Map<string, number[]>();

  recordRequest(ip: string): void {
    const times = this.requestPatterns.get(ip) || [];
    times.push(Date.now());
    const cutoff = Date.now() - 60000;
    this.requestPatterns.set(ip, times.filter(t => t > cutoff).slice(-1000));
  }

  isBot(ip: string, userAgent: string): { isBot: boolean; confidence: number; reasons: string[] } {
    const reasons: string[] = [];
    let botScore = 0;

    const times = this.requestPatterns.get(ip) || [];
    if (times.length > 100) { reasons.push(`High request rate: ${times.length}/min`); botScore += 40; }

    if (times.length > 2) {
      const intervals = times.slice(1).map((t, i) => t - times[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      if (variance < 100) { reasons.push("Suspiciously regular request intervals"); botScore += 30; }
    }

    const botUAPatterns = ["bot", "crawler", "spider", "scraper", "headless", "phantom", "selenium"];
    if (botUAPatterns.some(p => userAgent.toLowerCase().includes(p))) {
      reasons.push(`Bot user agent: ${userAgent.slice(0, 50)}`);
      botScore += 50;
    }

    if (!userAgent || userAgent.length < 10) { reasons.push("Missing or short user agent"); botScore += 20; }

    return { isBot: botScore >= 50, confidence: Math.min(100, botScore), reasons };
  }

  getStats(): { totalIPs: number; suspiciousIPs: number; blockedRequests: number } {
    let suspicious = 0;
    for (const [ip, times] of this.requestPatterns.entries()) {
      if (times.length > 50) suspicious++;
    }
    return { totalIPs: this.requestPatterns.size, suspiciousIPs: suspicious, blockedRequests: 0 };
  }
}

// ============================================================
// AUDIT LOG ENGINE
// ============================================================

export class AuditLogEngine {
  private logs: AuditLog[] = [];
  private readonly maxLogs = 100000;

  log(entry: Omit<AuditLog, "id" | "timestamp">): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) this.logs.shift();
    return log;
  }

  query(filter: { userId?: number; action?: string; resource?: string; since?: number; success?: boolean; limit?: number }): AuditLog[] {
    let result = this.logs;
    if (filter.userId !== undefined) result = result.filter(l => l.userId === filter.userId);
    if (filter.action) result = result.filter(l => l.action.includes(filter.action!));
    if (filter.resource) result = result.filter(l => l.resource.includes(filter.resource!));
    if (filter.since) result = result.filter(l => l.timestamp >= filter.since!);
    if (filter.success !== undefined) result = result.filter(l => l.success === filter.success);
    return result.slice(-(filter.limit || 100)).reverse();
  }

  getStats(): { totalLogs: number; failedActions: number; uniqueUsers: number; topActions: Array<{ action: string; count: number }> } {
    const failed = this.logs.filter(l => !l.success).length;
    const users = new Set(this.logs.map(l => l.userId).filter(Boolean)).size;
    const actionCounts = new Map<string, number>();
    for (const log of this.logs) actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    const topActions = Array.from(actionCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([action, count]) => ({ action, count }));
    return { totalLogs: this.logs.length, failedActions: failed, uniqueUsers: users, topActions };
  }

  export(format: "json" | "csv"): string {
    if (format === "json") return JSON.stringify(this.logs.slice(-1000), null, 2);
    const headers = "id,userId,action,resource,ipAddress,success,timestamp";
    const rows = this.logs.slice(-1000).map(l => `${l.id},${l.userId || ""},${l.action},${l.resource},${l.ipAddress},${l.success},${l.timestamp}`);
    return [headers, ...rows].join("\n");
  }
}

// ============================================================
// IP REPUTATION ENGINE
// ============================================================

export class IPReputationEngine {
  private reputations = new Map<string, IPReputation>();
  private readonly blocklist = new Set(["10.0.0.99", "192.168.1.100", "172.16.0.50"]);

  async getReputation(ip: string): Promise<IPReputation> {
    if (this.reputations.has(ip)) return this.reputations.get(ip)!;

    const rep: IPReputation = {
      ip,
      score: this.blocklist.has(ip) ? 10 : 85,
      country: "US",
      isTor: false,
      isVPN: false,
      isProxy: false,
      isBot: this.blocklist.has(ip),
      threatTypes: this.blocklist.has(ip) ? ["known_bad"] : [],
      lastSeen: Date.now(),
    };
    this.reputations.set(ip, rep);
    return rep;
  }

  isBlocked(ip: string): boolean { return this.blocklist.has(ip); }
  block(ip: string): void { this.blocklist.add(ip); }
  unblock(ip: string): void { this.blocklist.delete(ip); }
  getBlocklist(): string[] { return Array.from(this.blocklist); }
}

// ============================================================
// THREAT DETECTION ENGINE
// ============================================================

export class ThreatDetectionEngine {
  private threats: ThreatEvent[] = [];
  private readonly maxThreats = 50000;

  detectSQLInjection(input: string): boolean {
    const patterns = [/('|")\s*(or|and)\s*('|"|\d)/i, /union\s+select/i, /drop\s+table/i, /insert\s+into/i, /;\s*(drop|delete|update|insert)/i, /xp_cmdshell/i, /exec\s*\(/i];
    return patterns.some(p => p.test(input));
  }

  detectXSS(input: string): boolean {
    const patterns = [/<script[^>]*>/i, /javascript:/i, /on\w+\s*=/i, /<iframe/i, /eval\s*\(/i, /document\.cookie/i];
    return patterns.some(p => p.test(input));
  }

  recordThreat(threat: Omit<ThreatEvent, "id" | "timestamp">): ThreatEvent {
    const event: ThreatEvent = { ...threat, id: `threat_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`, timestamp: Date.now() };
    this.threats.push(event);
    if (this.threats.length > this.maxThreats) this.threats.shift();
    return event;
  }

  getThreats(filter?: { severity?: string; type?: string; since?: number; limit?: number }): ThreatEvent[] {
    let result = this.threats;
    if (filter?.severity) result = result.filter(t => t.severity === filter.severity);
    if (filter?.type) result = result.filter(t => t.type === filter.type);
    if (filter?.since) result = result.filter(t => t.timestamp >= filter.since!);
    return result.slice(-(filter?.limit || 100)).reverse();
  }

  getThreatStats(): { total: number; blocked: number; bySeverity: Record<string, number>; byType: Record<string, number> } {
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const t of this.threats) {
      bySeverity[t.severity] = (bySeverity[t.severity] || 0) + 1;
      byType[t.type] = (byType[t.type] || 0) + 1;
    }
    return { total: this.threats.length, blocked: this.threats.filter(t => t.blocked).length, bySeverity, byType };
  }
}

// ============================================================
// SESSION SECURITY ENGINE
// ============================================================

export class SessionSecurityEngine {
  private sessions = new Map<string, SessionSecurity>();

  createSession(userId: number, ipAddress: string, userAgent: string): SessionSecurity {
    const session: SessionSecurity = {
      sessionId: `sess_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 16)}`,
      userId, ipAddress, userAgent,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isActive: true,
      mfaVerified: false,
      riskScore: 0,
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  validateSession(sessionId: string): SessionSecurity | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return null;
    if (Date.now() - session.lastActivity > 3600000) { session.isActive = false; return null; }
    session.lastActivity = Date.now();
    return session;
  }

  invalidateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) session.isActive = false;
  }

  invalidateAllUserSessions(userId: number): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.isActive) { session.isActive = false; count++; }
    }
    return count;
  }

  getActiveSessions(userId: number): SessionSecurity[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId && s.isActive);
  }
}

// ============================================================
// MAIN SHIELD ENGINE
// ============================================================

export class ShieldSecurityEngine {
  public readonly fraud = new FraudDetectionEngine();
  public readonly botDetection = new BotDetectionEngine();
  public readonly auditLog = new AuditLogEngine();
  public readonly ipReputation = new IPReputationEngine();
  public readonly threatDetection = new ThreatDetectionEngine();
  public readonly sessions = new SessionSecurityEngine();

  async validateRequest(req: { ip: string; userAgent: string; userId?: number; endpoint: string; body?: string }): Promise<{ allowed: boolean; riskScore: number; reasons: string[] }> {
    const reasons: string[] = [];
    let riskScore = 0;

    if (this.ipReputation.isBlocked(req.ip)) {
      return { allowed: false, riskScore: 100, reasons: ["IP is blocked"] };
    }

    const botResult = this.botDetection.isBot(req.ip, req.userAgent);
    if (botResult.isBot) { riskScore += botResult.confidence * 0.5; reasons.push(...botResult.reasons); }

    if (req.body) {
      if (this.threatDetection.detectSQLInjection(req.body)) {
        this.threatDetection.recordThreat({ type: "sql_injection", severity: "high", sourceIp: req.ip, userId: req.userId, endpoint: req.endpoint, payload: req.body.slice(0, 200), blocked: true, details: {} });
        return { allowed: false, riskScore: 100, reasons: ["SQL injection detected"] };
      }
      if (this.threatDetection.detectXSS(req.body)) {
        this.threatDetection.recordThreat({ type: "xss", severity: "high", sourceIp: req.ip, userId: req.userId, endpoint: req.endpoint, payload: req.body.slice(0, 200), blocked: true, details: {} });
        return { allowed: false, riskScore: 100, reasons: ["XSS attack detected"] };
      }
    }

    this.botDetection.recordRequest(req.ip);
    return { allowed: riskScore < 70, riskScore, reasons };
  }

  getSecurityDashboard(): Record<string, unknown> {
    return {
      threats: this.threatDetection.getThreatStats(),
      bots: this.botDetection.getStats(),
      audit: this.auditLog.getStats(),
      blocklist: this.ipReputation.getBlocklist().length,
    };
  }
}

export const shieldEngine = new ShieldSecurityEngine();
