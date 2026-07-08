import crypto from 'crypto';
/**
 * Security Core Engine
 * Phase 5H — Sovereignty Build
 *
 * Platform defense infrastructure:
 * - Anti-sybil detection (identity clustering, device fingerprinting)
 * - Anti-bot protection (behavioral analysis, CAPTCHA orchestration)
 * - Fraud escalation chains (tiered response system)
 * - Wallet anomaly detection (unusual transaction patterns)
 * - Exploit detection (smart contract attack patterns)
 * - Abuse scoring (composite risk model)
 * - IP reputation and geo-blocking
 * - Session anomaly detection
 * - Credential stuffing protection
 * - DDoS mitigation signals
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";
export type EscalationAction = "log" | "flag" | "rate_limit" | "challenge" | "suspend" | "ban" | "block_wallet" | "freeze_funds" | "alert_admin";
export type ThreatCategory = "sybil" | "bot" | "fraud" | "exploit" | "abuse" | "spam" | "phishing" | "wash_trading" | "pump_dump" | "credential_stuffing" | "ddos";

export interface DeviceFingerprint {
  id: string;
  userId?: number;
  hash: string;
  userAgent: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  plugins?: string[];
  canvas?: string;
  webgl?: string;
  fonts?: string[];
  ipAddress: string;
  country?: string;
  isp?: string;
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  firstSeen: Date;
  lastSeen: Date;
  associatedUserIds: number[];
  riskScore: number;
}

export interface BehaviorProfile {
  userId: number;
  sessionId: string;
  mouseMovements: number;
  keystrokes: number;
  clickPatterns: number[];
  scrollDepth: number;
  timeOnPage: number;
  requestRate: number;
  isBot: boolean;
  botConfidence: number;
  humanConfidence: number;
  lastAnalyzed: Date;
}

export interface FraudSignal {
  id: string;
  userId?: number;
  walletAddress?: string;
  category: ThreatCategory;
  signal: string;
  severity: RiskLevel;
  evidence: Record<string, unknown>;
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: number;
  falsePositive: boolean;
}

export interface EscalationRule {
  id: string;
  category: ThreatCategory;
  minRiskScore: number;
  maxRiskScore: number;
  actions: EscalationAction[];
  cooldownMinutes: number;
  requiresManualReview: boolean;
}

export interface AbuseScore {
  userId: number;
  composite: number;
  components: {
    spamScore: number;
    fraudScore: number;
    botScore: number;
    sybilScore: number;
    walletRiskScore: number;
    behaviorScore: number;
  };
  riskLevel: RiskLevel;
  flags: string[];
  lastUpdated: Date;
}

export interface WalletAnomalyAlert {
  id: string;
  walletAddress: string;
  userId?: number;
  anomalyType: "velocity" | "pattern" | "amount" | "counterparty" | "timing" | "wash_trade" | "layering";
  description: string;
  transactionHash?: string;
  amount?: number;
  riskScore: number;
  detectedAt: Date;
  investigated: boolean;
}

export interface ExploitAttempt {
  id: string;
  userId?: number;
  ipAddress: string;
  attackType: "reentrancy" | "flash_loan" | "price_manipulation" | "front_running" | "sandwich" | "sql_injection" | "xss" | "csrf" | "path_traversal" | "rate_bypass";
  payload?: string;
  endpoint?: string;
  blocked: boolean;
  detectedAt: Date;
}

// ─── ANTI-SYBIL ENGINE ────────────────────────────────────────────────────────

class AntiSybilEngine {
  private fingerprints = new Map<string, DeviceFingerprint>();
  private userFingerprints = new Map<number, string[]>();
  private clusterMap = new Map<string, Set<number>>();

  registerDevice(
    userId: number | undefined,
    hash: string,
    userAgent: string,
    ipAddress: string,
    options: Partial<Pick<DeviceFingerprint, "screenResolution" | "timezone" | "language" | "platform" | "canvas" | "webgl" | "isVPN" | "isProxy" | "isTor" | "isDatacenter" | "country" | "isp">> = {}
  ): DeviceFingerprint {
    const existing = this.fingerprints.get(hash);
    if (existing) {
      existing.lastSeen = new Date();
      if (userId && !existing.associatedUserIds.includes(userId)) {
        existing.associatedUserIds.push(userId);
        this.updateCluster(hash, userId);
      }
      existing.riskScore = this.calculateDeviceRisk(existing);
      return existing;
    }

    const fp: DeviceFingerprint = {
      id: `fp_${Date.now()}_${hash.slice(0, 8)}`,
      userId,
      hash,
      userAgent,
      ipAddress,
      isVPN: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      firstSeen: new Date(),
      lastSeen: new Date(),
      associatedUserIds: userId ? [userId] : [],
      riskScore: 0,
      ...options,
    };
    fp.riskScore = this.calculateDeviceRisk(fp);
    this.fingerprints.set(hash, fp);
    if (userId) {
      const userFps = this.userFingerprints.get(userId) || [];
      userFps.push(hash);
      this.userFingerprints.set(userId, userFps);
      this.updateCluster(hash, userId);
    }
    return fp;
  }

  private updateCluster(fingerprintHash: string, userId: number): void {
    const fp = this.fingerprints.get(fingerprintHash);
    if (!fp) return;
    const clusterKey = `${fp.ipAddress}_${fp.userAgent.slice(0, 20)}`;
    const cluster = this.clusterMap.get(clusterKey) || new Set();
    cluster.add(userId);
    this.clusterMap.set(clusterKey, cluster);
  }

  private calculateDeviceRisk(fp: DeviceFingerprint): number {
    let score = 0;
    if (fp.isVPN) score += 20;
    if (fp.isProxy) score += 30;
    if (fp.isTor) score += 50;
    if (fp.isDatacenter) score += 40;
    if (fp.associatedUserIds.length > 3) score += (fp.associatedUserIds.length - 3) * 15;
    if (fp.associatedUserIds.length > 10) score += 30;
    return Math.min(100, score);
  }

  detectSybilCluster(userId: number): { isSybil: boolean; confidence: number; clusterSize: number; evidence: string[] } {
    const userFps = this.userFingerprints.get(userId) || [];
    const evidence: string[] = [];
    let maxClusterSize = 1;
    let confidence = 0;

    for (const fpHash of userFps) {
      const fp = this.fingerprints.get(fpHash);
      if (!fp) continue;
      const clusterKey = `${fp.ipAddress}_${fp.userAgent.slice(0, 20)}`;
      const cluster = this.clusterMap.get(clusterKey);
      if (cluster && cluster.size > maxClusterSize) {
        maxClusterSize = cluster.size;
        if (cluster.size > 5) { evidence.push(`Shared device with ${cluster.size - 1} other accounts`); confidence += 40; }
        if (cluster.size > 10) { evidence.push(`High-density cluster of ${cluster.size} accounts`); confidence += 30; }
      }
      if (fp.isDatacenter) { evidence.push("Device fingerprint from datacenter IP"); confidence += 25; }
      if (fp.associatedUserIds.length > 5) { evidence.push(`Device shared by ${fp.associatedUserIds.length} accounts`); confidence += 20; }
    }

    return { isSybil: confidence >= 60, confidence: Math.min(100, confidence), clusterSize: maxClusterSize, evidence };
  }

  getUserDeviceRisk(userId: number): number {
    const userFps = this.userFingerprints.get(userId) || [];
    if (userFps.length === 0) return 0;
    const scores = userFps.map(hash => this.fingerprints.get(hash)?.riskScore || 0);
    return Math.max(...scores);
  }
}

// ─── ANTI-BOT ENGINE ──────────────────────────────────────────────────────────

class AntiBotEngine {
  private profiles = new Map<string, BehaviorProfile>();
  private requestCounts = new Map<string, { count: number; window: number; lastReset: number }>();

  analyzeBehavior(
    sessionId: string,
    userId: number,
    metrics: {
      mouseMovements: number;
      keystrokes: number;
      clickPatterns: number[];
      scrollDepth: number;
      timeOnPage: number;
      requestRate: number;
    }
  ): BehaviorProfile {
    const botScore = this.calculateBotScore(metrics);
    const profile: BehaviorProfile = {
      userId,
      sessionId,
      ...metrics,
      isBot: botScore > 70,
      botConfidence: botScore,
      humanConfidence: 100 - botScore,
      lastAnalyzed: new Date(),
    };
    this.profiles.set(sessionId, profile);
    return profile;
  }

  private calculateBotScore(metrics: {
    mouseMovements: number;
    keystrokes: number;
    clickPatterns: number[];
    scrollDepth: number;
    timeOnPage: number;
    requestRate: number;
  }): number {
    let score = 0;
    if (metrics.mouseMovements === 0) score += 30;
    else if (metrics.mouseMovements < 5) score += 15;
    if (metrics.keystrokes === 0 && metrics.timeOnPage > 10) score += 10;
    if (metrics.requestRate > 100) score += 40;
    else if (metrics.requestRate > 50) score += 20;
    if (metrics.scrollDepth === 0 && metrics.timeOnPage > 5) score += 10;
    if (metrics.clickPatterns.length > 0) {
      const variance = this.calculateVariance(metrics.clickPatterns);
      if (variance < 10) score += 20;
    }
    return Math.min(100, score);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  checkRateLimit(identifier: string, maxRequests: number, windowSeconds: number): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const entry = this.requestCounts.get(identifier) || { count: 0, window: windowMs, lastReset: now };

    if (now - entry.lastReset > windowMs) {
      entry.count = 0;
      entry.lastReset = now;
    }

    entry.count++;
    this.requestCounts.set(identifier, entry);
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetAt = entry.lastReset + windowMs;
    return { allowed: entry.count <= maxRequests, remaining, resetAt };
  }

  getProfile(sessionId: string): BehaviorProfile | null {
    return this.profiles.get(sessionId) || null;
  }

  isKnownBotUserAgent(userAgent: string): boolean {
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
      /python-requests/i, /axios/i, /node-fetch/i, /go-http/i,
      /headless/i, /phantom/i, /selenium/i, /puppeteer/i, /playwright/i,
    ];
    return botPatterns.some(pattern => pattern.test(userAgent));
  }
}

// ─── FRAUD ESCALATION ENGINE ──────────────────────────────────────────────────

class FraudEscalationEngine {
  private signals: FraudSignal[] = [];
  private escalationRules: EscalationRule[] = [
    { id: "low_fraud", category: "fraud", minRiskScore: 20, maxRiskScore: 40, actions: ["log", "flag"], cooldownMinutes: 60, requiresManualReview: false },
    { id: "medium_fraud", category: "fraud", minRiskScore: 40, maxRiskScore: 70, actions: ["flag", "rate_limit", "challenge"], cooldownMinutes: 30, requiresManualReview: false },
    { id: "high_fraud", category: "fraud", minRiskScore: 70, maxRiskScore: 90, actions: ["challenge", "suspend", "alert_admin"], cooldownMinutes: 0, requiresManualReview: true },
    { id: "critical_fraud", category: "fraud", minRiskScore: 90, maxRiskScore: 100, actions: ["ban", "block_wallet", "freeze_funds", "alert_admin"], cooldownMinutes: 0, requiresManualReview: true },
    { id: "sybil_medium", category: "sybil", minRiskScore: 50, maxRiskScore: 80, actions: ["flag", "rate_limit", "challenge"], cooldownMinutes: 60, requiresManualReview: false },
    { id: "sybil_high", category: "sybil", minRiskScore: 80, maxRiskScore: 100, actions: ["suspend", "block_wallet", "alert_admin"], cooldownMinutes: 0, requiresManualReview: true },
    { id: "exploit_any", category: "exploit", minRiskScore: 0, maxRiskScore: 100, actions: ["block_wallet", "ban", "alert_admin"], cooldownMinutes: 0, requiresManualReview: true },
    { id: "wash_trading", category: "wash_trading", minRiskScore: 60, maxRiskScore: 100, actions: ["flag", "freeze_funds", "alert_admin"], cooldownMinutes: 0, requiresManualReview: true },
  ];

  reportSignal(
    category: ThreatCategory,
    signal: string,
    severity: RiskLevel,
    evidence: Record<string, unknown>,
    userId?: number,
    walletAddress?: string
  ): { fraudSignal: FraudSignal; actions: EscalationAction[] } {
    const fraudSignal: FraudSignal = {
      id: `sig_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2)}`,
      userId,
      walletAddress,
      category,
      signal,
      severity,
      evidence,
      detectedAt: new Date(),
      resolved: false,
      falsePositive: false,
    };
    this.signals.push(fraudSignal);

    const riskScore = this.severityToScore(severity);
    const actions = this.determineActions(category, riskScore);
    return { fraudSignal, actions };
  }

  private severityToScore(severity: RiskLevel): number {
    const map: Record<RiskLevel, number> = { none: 0, low: 25, medium: 55, high: 80, critical: 95 };
    return map[severity];
  }

  private determineActions(category: ThreatCategory, riskScore: number): EscalationAction[] {
    const applicableRules = this.escalationRules.filter(r =>
      r.category === category && riskScore >= r.minRiskScore && riskScore <= r.maxRiskScore
    );
    if (applicableRules.length === 0) return ["log"];
    const allActions = new Set<EscalationAction>();
    for (const rule of applicableRules) rule.actions.forEach(a => allActions.add(a));
    return Array.from(allActions);
  }

  resolveSignal(signalId: string, resolvedBy: number, isFalsePositive = false): void {
    const signal = this.signals.find(s => s.id === signalId);
    if (signal) {
      signal.resolved = true;
      signal.resolvedAt = new Date();
      signal.resolvedBy = resolvedBy;
      signal.falsePositive = isFalsePositive;
    }
  }

  getActiveSignals(userId?: number): FraudSignal[] {
    return this.signals.filter(s => !s.resolved && (!userId || s.userId === userId));
  }

  getSignalHistory(userId: number, limit = 50): FraudSignal[] {
    return this.signals.filter(s => s.userId === userId).slice(-limit);
  }

  getFraudStats(): { total: number; active: number; byCategory: Record<string, number>; bySeverity: Record<string, number> } {
    const active = this.signals.filter(s => !s.resolved);
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    for (const sig of this.signals) {
      byCategory[sig.category] = (byCategory[sig.category] || 0) + 1;
      bySeverity[sig.severity] = (bySeverity[sig.severity] || 0) + 1;
    }
    return { total: this.signals.length, active: active.length, byCategory, bySeverity };
  }
}

// ─── WALLET ANOMALY DETECTOR ──────────────────────────────────────────────────

class WalletAnomalyDetector {
  private alerts: WalletAnomalyAlert[] = [];
  private transactionHistory = new Map<string, { amount: number; timestamp: Date; counterparty: string }[]>();

  recordTransaction(walletAddress: string, amount: number, counterparty: string, txHash: string): WalletAnomalyAlert[] {
    const history = this.transactionHistory.get(walletAddress) || [];
    history.push({ amount, timestamp: new Date(), counterparty });
    this.transactionHistory.set(walletAddress, history);
    return this.detectAnomalies(walletAddress, amount, counterparty, txHash);
  }

  private detectAnomalies(walletAddress: string, amount: number, counterparty: string, txHash: string): WalletAnomalyAlert[] {
    const alerts: WalletAnomalyAlert[] = [];
    const history = this.transactionHistory.get(walletAddress) || [];
    const recent = history.filter(tx => Date.now() - tx.timestamp.getTime() < 3600000);

    if (recent.length > 20) {
      alerts.push(this.createAlert(walletAddress, "velocity", `${recent.length} transactions in the last hour`, txHash, amount, 75));
    }

    const avgAmount = history.length > 5 ? history.slice(-10).reduce((s, t) => s + t.amount, 0) / Math.min(10, history.length) : 0;
    if (avgAmount > 0 && amount > avgAmount * 10) {
      alerts.push(this.createAlert(walletAddress, "amount", `Transaction amount ${amount} is 10x above average ${avgAmount.toFixed(2)}`, txHash, amount, 70));
    }

    const counterpartyTxs = history.filter(tx => tx.counterparty === counterparty);
    if (counterpartyTxs.length > 5) {
      const backAndForth = counterpartyTxs.filter(tx => {
        const reverse = history.find(h => h.counterparty === walletAddress && Math.abs(h.timestamp.getTime() - tx.timestamp.getTime()) < 600000);
        return !!reverse;
      });
      if (backAndForth.length >= 3) {
        alerts.push(this.createAlert(walletAddress, "wash_trade", `Detected circular trading pattern with ${counterparty}`, txHash, amount, 85));
      }
    }

    this.alerts.push(...alerts);
    return alerts;
  }

  private createAlert(
    walletAddress: string,
    anomalyType: WalletAnomalyAlert["anomalyType"],
    description: string,
    txHash: string,
    amount: number,
    riskScore: number
  ): WalletAnomalyAlert {
    return {
      id: `walert_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2)}`,
      walletAddress,
      anomalyType,
      description,
      transactionHash: txHash,
      amount,
      riskScore,
      detectedAt: new Date(),
      investigated: false,
    };
  }

  getWalletRiskScore(walletAddress: string): number {
    const walletAlerts = this.alerts.filter(a => a.walletAddress === walletAddress && !a.investigated);
    if (walletAlerts.length === 0) return 0;
    return Math.min(100, walletAlerts.reduce((max, a) => Math.max(max, a.riskScore), 0));
  }

  getActiveAlerts(walletAddress?: string): WalletAnomalyAlert[] {
    return this.alerts.filter(a => !a.investigated && (!walletAddress || a.walletAddress === walletAddress));
  }

  investigateAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) alert.investigated = true;
  }
}

// ─── EXPLOIT DETECTOR ─────────────────────────────────────────────────────────

class ExploitDetector {
  private attempts: ExploitAttempt[] = [];

  private readonly SQL_PATTERNS = [/(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b)/i, /('|--|;|\/\*|\*\/|xp_)/];
  private readonly XSS_PATTERNS = [/<script[\s\S]*?>[\s\S]*?<\/script>/i, /javascript:/i, /on\w+\s*=/i, /<iframe/i];
  private readonly PATH_TRAVERSAL_PATTERNS = [/\.\.\//g, /\.\.\\/, /%2e%2e/i, /%252e/i];

  scanRequest(
    endpoint: string,
    payload: string,
    ipAddress: string,
    userId?: number
  ): { safe: boolean; attackType?: ExploitAttempt["attackType"]; blocked: boolean } {
    if (this.SQL_PATTERNS.some(p => p.test(payload))) {
      return this.recordAttempt("sql_injection", endpoint, payload, ipAddress, userId, true);
    }
    if (this.XSS_PATTERNS.some(p => p.test(payload))) {
      return this.recordAttempt("xss", endpoint, payload, ipAddress, userId, true);
    }
    if (this.PATH_TRAVERSAL_PATTERNS.some(p => p.test(payload))) {
      return this.recordAttempt("path_traversal", endpoint, payload, ipAddress, userId, true);
    }
    return { safe: true, blocked: false };
  }

  private recordAttempt(
    attackType: ExploitAttempt["attackType"],
    endpoint: string,
    payload: string,
    ipAddress: string,
    userId: number | undefined,
    blocked: boolean
  ): { safe: boolean; attackType: ExploitAttempt["attackType"]; blocked: boolean } {
    const attempt: ExploitAttempt = {
      id: `exploit_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2)}`,
      userId,
      ipAddress,
      attackType,
      payload: payload.slice(0, 500),
      endpoint,
      blocked,
      detectedAt: new Date(),
    };
    this.attempts.push(attempt);
    return { safe: false, attackType, blocked };
  }

  detectFlashLoanPattern(txSequence: { type: string; amount: number; protocol: string }[]): boolean {
    const hasLargeBorrow = txSequence.some(tx => tx.type === "borrow" && tx.amount > 100000);
    const hasRepay = txSequence.some(tx => tx.type === "repay");
    const hasArbitrage = txSequence.filter(tx => tx.type === "swap").length >= 2;
    return hasLargeBorrow && hasRepay && hasArbitrage && txSequence.length >= 4;
  }

  detectReentrancyPattern(callStack: string[]): boolean {
    const seen = new Set<string>();
    for (const call of callStack) {
      if (seen.has(call)) return true;
      seen.add(call);
    }
    return false;
  }

  getAttemptStats(): { total: number; blocked: number; byType: Record<string, number>; byIp: Record<string, number> } {
    const blocked = this.attempts.filter(a => a.blocked).length;
    const byType: Record<string, number> = {};
    const byIp: Record<string, number> = {};
    for (const attempt of this.attempts) {
      byType[attempt.attackType] = (byType[attempt.attackType] || 0) + 1;
      byIp[attempt.ipAddress] = (byIp[attempt.ipAddress] || 0) + 1;
    }
    return { total: this.attempts.length, blocked, byType, byIp };
  }

  getRecentAttempts(hours = 24): ExploitAttempt[] {
    const since = new Date(Date.now() - hours * 3600000);
    return this.attempts.filter(a => a.detectedAt >= since);
  }
}

// ─── ABUSE SCORER ─────────────────────────────────────────────────────────────

class AbuseScorer {
  private scores = new Map<number, AbuseScore>();

  calculateScore(
    userId: number,
    inputs: {
      spamReports: number;
      fraudSignals: number;
      botConfidence: number;
      sybilConfidence: number;
      walletRiskScore: number;
      reportCount: number;
      accountAgeDays: number;
    }
  ): AbuseScore {
    const spamScore = Math.min(100, inputs.spamReports * 15);
    const fraudScore = Math.min(100, inputs.fraudSignals * 20);
    const botScore = inputs.botConfidence;
    const sybilScore = inputs.sybilConfidence;
    const walletRiskScore = inputs.walletRiskScore;
    const behaviorScore = Math.min(100, inputs.reportCount * 10);

    const ageMultiplier = inputs.accountAgeDays < 7 ? 1.5 : inputs.accountAgeDays < 30 ? 1.2 : 1.0;
    const composite = Math.min(100, Math.round(
      (spamScore * 0.15 + fraudScore * 0.25 + botScore * 0.20 + sybilScore * 0.20 + walletRiskScore * 0.10 + behaviorScore * 0.10) * ageMultiplier
    ));

    const flags: string[] = [];
    if (spamScore > 50) flags.push("high_spam");
    if (fraudScore > 50) flags.push("fraud_signals");
    if (botScore > 70) flags.push("bot_behavior");
    if (sybilScore > 60) flags.push("sybil_suspected");
    if (walletRiskScore > 60) flags.push("wallet_risk");
    if (inputs.accountAgeDays < 7) flags.push("new_account");

    const riskLevel: RiskLevel = composite >= 80 ? "critical" : composite >= 60 ? "high" : composite >= 40 ? "medium" : composite >= 20 ? "low" : "none";

    const score: AbuseScore = {
      userId,
      composite,
      components: { spamScore, fraudScore, botScore, sybilScore, walletRiskScore, behaviorScore },
      riskLevel,
      flags,
      lastUpdated: new Date(),
    };
    this.scores.set(userId, score);
    return score;
  }

  getScore(userId: number): AbuseScore | null {
    return this.scores.get(userId) || null;
  }

  getHighRiskUsers(minScore = 60): AbuseScore[] {
    return Array.from(this.scores.values()).filter(s => s.composite >= minScore).sort((a, b) => b.composite - a.composite);
  }

  getCriticalUsers(): AbuseScore[] {
    return this.getHighRiskUsers(80);
  }
}

// ─── IP REPUTATION SERVICE ────────────────────────────────────────────────────

class IPReputationService {
  private blockedIPs = new Set<string>();
  private blockedCountries = new Set<string>();
  private ipScores = new Map<string, { score: number; reason: string; blockedAt?: Date }>();

  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    this.ipScores.set(ip, { score: 100, reason, blockedAt: new Date() });
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.ipScores.delete(ip);
  }

  blockCountry(countryCode: string): void {
    this.blockedCountries.add(countryCode.toUpperCase());
  }

  isBlocked(ip: string, countryCode?: string): { blocked: boolean; reason?: string } {
    if (this.blockedIPs.has(ip)) {
      return { blocked: true, reason: this.ipScores.get(ip)?.reason || "blocked" };
    }
    if (countryCode && this.blockedCountries.has(countryCode.toUpperCase())) {
      return { blocked: true, reason: `Country ${countryCode} is blocked` };
    }
    return { blocked: false };
  }

  recordSuspiciousActivity(ip: string, activityType: string): number {
    const current = this.ipScores.get(ip) || { score: 0, reason: "" };
    current.score = Math.min(100, current.score + 10);
    current.reason = activityType;
    this.ipScores.set(ip, current);
    if (current.score >= 80) this.blockIP(ip, `Auto-blocked: ${activityType}`);
    return current.score;
  }

  getIPScore(ip: string): number {
    return this.ipScores.get(ip)?.score || 0;
  }

  getBlockedIPCount(): number {
    return this.blockedIPs.size;
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const antiSybilEngine = new AntiSybilEngine();
export const antiBotEngine = new AntiBotEngine();
export const fraudEscalationEngine = new FraudEscalationEngine();
export const walletAnomalyDetector = new WalletAnomalyDetector();
export const exploitDetector = new ExploitDetector();
export const abuseScorer = new AbuseScorer();
export const ipReputationService = new IPReputationService();
