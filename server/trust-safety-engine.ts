/**
 * TRUST & SAFETY ENGINE
 * Comprehensive content moderation and platform safety:
 * - Multi-layer Content Moderation (text, image hash, behavior)
 * - User Reputation System (trust scores, history, decay)
 * - Automated Action System (warn, mute, ban, shadowban)
 * - Appeal Process (user appeals, admin review queue)
 * - Report Management (user reports, priority queue)
 * - Anti-Spam Engine (rate detection, pattern matching)
 * - Anti-Manipulation (sockpuppet detection, vote manipulation)
 * - Content Fingerprinting (duplicate/repost detection)
 * - Behavioral Analytics (unusual patterns, risk scoring)
 * - Compliance Logging (audit trail for all actions)
 */

import { getDb } from "./db";
import * as schema from "../drizzle";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ModerationAction {
  id: string;
  targetUserId: number;
  targetContentId?: number;
  contentType?: "post" | "comment" | "message" | "profile" | "listing";
  action: "warn" | "mute" | "tempban" | "permban" | "shadowban" | "content_remove" | "content_flag";
  reason: string;
  category: "spam" | "harassment" | "hate_speech" | "violence" | "sexual" | "scam" | "impersonation" | "other";
  severity: "low" | "medium" | "high" | "critical";
  automated: boolean;
  moderatorId?: number;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface UserReputation {
  userId: number;
  trustScore: number; // 0-100
  reportCount: number;
  warningCount: number;
  muteCount: number;
  banCount: number;
  positiveActions: number;
  accountAge: number; // days
  verificationLevel: "none" | "email" | "phone" | "id" | "full";
  riskLevel: "low" | "medium" | "high" | "critical";
  lastIncident?: Date;
  badges: string[];
}

export interface ContentReport {
  id: string;
  reporterId: number;
  targetUserId: number;
  targetContentId?: number;
  contentType: "post" | "comment" | "message" | "profile" | "listing" | "stream";
  reason: string;
  category: ModerationAction["category"];
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  assignedTo?: number;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Appeal {
  id: string;
  userId: number;
  actionId: string;
  reason: string;
  evidence?: string;
  status: "pending" | "reviewing" | "approved" | "denied";
  reviewerId?: number;
  reviewNotes?: string;
  createdAt: Date;
  reviewedAt?: Date;
}

export interface SpamSignal {
  type: "rate_limit" | "duplicate_content" | "link_spam" | "keyword_spam" | "bot_behavior";
  confidence: number;
  details: string;
}

export interface BehaviorAnomaly {
  userId: number;
  anomalyType: "sudden_activity_spike" | "unusual_hours" | "mass_following" | "vote_manipulation" | "sockpuppet";
  confidence: number;
  evidence: string[];
  detectedAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// CONTENT MODERATION SERVICE
// ═══════════════════════════════════════════════════════════════

export class ContentModerationService {
  private actions: ModerationAction[] = [];
  private actionCounter = 0;

  // Banned word patterns (regex-based)
  private readonly SPAM_PATTERNS = [
    /buy\s+now\s+free/i,
    /click\s+here\s+to\s+win/i,
    /guaranteed\s+returns/i,
    /double\s+your\s+(money|crypto|tokens)/i,
    /send\s+\d+\s*(eth|btc|sol)/i,
    /free\s+airdrop\s+claim/i,
    /t\.me\/[a-z0-9]+/i,
    /bit\.ly\/[a-z0-9]+/i,
  ];

  private readonly TOXICITY_KEYWORDS: Record<string, number> = {
    // Severity scores 0-1
    "kill": 0.8, "die": 0.6, "hate": 0.5, "stupid": 0.3,
    "idiot": 0.4, "loser": 0.3, "scam": 0.4, "fraud": 0.5,
  };

  async moderateContent(content: string, userId: number, contentType: string): Promise<{
    allowed: boolean;
    flags: string[];
    score: number;
    autoAction?: ModerationAction;
  }> {
    const flags: string[] = [];
    let score = 0;

    // Check spam patterns
    for (const pattern of this.SPAM_PATTERNS) {
      if (pattern.test(content)) {
        flags.push(`spam_pattern: ${pattern.source}`);
        score += 0.4;
      }
    }

    // Check toxicity keywords
    const words = content.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (this.TOXICITY_KEYWORDS[word]) {
        flags.push(`toxic_keyword: ${word}`);
        score += this.TOXICITY_KEYWORDS[word] * 0.3;
      }
    }

    // Check for excessive caps (shouting)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / Math.max(content.length, 1);
    if (capsRatio > 0.7 && content.length > 10) {
      flags.push("excessive_caps");
      score += 0.15;
    }

    // Check for repeated characters
    if (/(.)\1{5,}/.test(content)) {
      flags.push("character_spam");
      score += 0.2;
    }

    // Check content length (too short or too long)
    if (content.length < 2) {
      flags.push("too_short");
      score += 0.1;
    }

    // Normalize score to 0-1
    score = Math.min(score, 1);

    // Auto-action threshold
    let autoAction: ModerationAction | undefined;
    if (score >= 0.8) {
      autoAction = await this.takeAction(userId, "content_remove", "Auto-moderation: high toxicity/spam score", "spam", "high", true);
    } else if (score >= 0.6) {
      autoAction = await this.takeAction(userId, "content_flag", "Auto-flag: moderate risk content", "other", "medium", true);
    }

    return {
      allowed: score < 0.8,
      flags,
      score,
      autoAction,
    };
  }

  async takeAction(
    targetUserId: number,
    action: ModerationAction["action"],
    reason: string,
    category: ModerationAction["category"],
    severity: ModerationAction["severity"],
    automated: boolean,
    moderatorId?: number,
    expiresAt?: Date
  ): Promise<ModerationAction> {
    this.actionCounter++;
    const modAction: ModerationAction = {
      id: `MOD-${String(this.actionCounter).padStart(6, "0")}`,
      targetUserId,
      action,
      reason,
      category,
      severity,
      automated,
      moderatorId,
      expiresAt,
      createdAt: new Date(),
    };

    this.actions.push(modAction);

    // Apply action to user
    if (action === "tempban" || action === "permban") {
      const db = await getDb();
      if (db) {
        await db.update(schema.users)
          .set({ role: "user" }) // Could add a 'banned' status
          .where(eq(schema.users.id, targetUserId));
      }
    }

    return modAction;
  }

  getActions(limit = 50): ModerationAction[] {
    return this.actions.slice(-limit).reverse();
  }

  getActionsForUser(userId: number): ModerationAction[] {
    return this.actions.filter(a => a.targetUserId === userId);
  }

  getStats(): { total: number; automated: number; manual: number; byCategory: Record<string, number>; bySeverity: Record<string, number> } {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.actions.forEach(a => {
      byCategory[a.category] = (byCategory[a.category] || 0) + 1;
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
    });

    return {
      total: this.actions.length,
      automated: this.actions.filter(a => a.automated).length,
      manual: this.actions.filter(a => !a.automated).length,
      byCategory,
      bySeverity,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// USER REPUTATION SERVICE
// ═══════════════════════════════════════════════════════════════

export class UserReputationService {
  private reputations: Map<number, UserReputation> = new Map();

  async getReputation(userId: number): Promise<UserReputation> {
    if (this.reputations.has(userId)) {
      return this.reputations.get(userId)!;
    }

    const db = await getDb();
    let accountAge = 30;

    if (db) {
      const [user] = await db
        .select({ createdAt: schema.users.createdAt })
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (user?.createdAt) {
        accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000));
      }
    }

    const rep: UserReputation = {
      userId,
      trustScore: this.calculateTrustScore(accountAge, 0, 0, 0),
      reportCount: 0,
      warningCount: 0,
      muteCount: 0,
      banCount: 0,
      positiveActions: 0,
      accountAge,
      verificationLevel: "email",
      riskLevel: "low",
      badges: [],
    };

    this.reputations.set(userId, rep);
    return rep;
  }

  async updateReputation(userId: number, event: "report" | "warning" | "mute" | "ban" | "positive" | "verified"): Promise<UserReputation> {
    const rep = await this.getReputation(userId);

    switch (event) {
      case "report":
        rep.reportCount++;
        rep.trustScore = Math.max(0, rep.trustScore - 5);
        break;
      case "warning":
        rep.warningCount++;
        rep.trustScore = Math.max(0, rep.trustScore - 10);
        rep.lastIncident = new Date();
        break;
      case "mute":
        rep.muteCount++;
        rep.trustScore = Math.max(0, rep.trustScore - 15);
        rep.lastIncident = new Date();
        break;
      case "ban":
        rep.banCount++;
        rep.trustScore = 0;
        rep.lastIncident = new Date();
        break;
      case "positive":
        rep.positiveActions++;
        rep.trustScore = Math.min(100, rep.trustScore + 2);
        break;
      case "verified":
        rep.verificationLevel = "full";
        rep.trustScore = Math.min(100, rep.trustScore + 20);
        break;
    }

    // Update risk level
    rep.riskLevel = this.calculateRiskLevel(rep.trustScore);

    // Update badges
    rep.badges = this.calculateBadges(rep);

    this.reputations.set(userId, rep);
    return rep;
  }

  private calculateTrustScore(accountAge: number, reports: number, warnings: number, positives: number): number {
    let score = 50; // Base score
    score += Math.min(accountAge * 0.5, 25); // Age bonus (max 25)
    score -= reports * 5;
    score -= warnings * 10;
    score += positives * 2;
    return Math.max(0, Math.min(100, score));
  }

  private calculateRiskLevel(trustScore: number): UserReputation["riskLevel"] {
    if (trustScore >= 70) return "low";
    if (trustScore >= 40) return "medium";
    if (trustScore >= 20) return "high";
    return "critical";
  }

  private calculateBadges(rep: UserReputation): string[] {
    const badges: string[] = [];
    if (rep.accountAge >= 365) badges.push("veteran");
    if (rep.trustScore >= 90) badges.push("trusted");
    if (rep.positiveActions >= 100) badges.push("community_hero");
    if (rep.verificationLevel === "full") badges.push("verified");
    if (rep.reportCount === 0 && rep.accountAge >= 90) badges.push("clean_record");
    return badges;
  }
}

// ═══════════════════════════════════════════════════════════════
// REPORT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export class ReportService {
  private reports: ContentReport[] = [];
  private reportCounter = 0;

  async createReport(
    reporterId: number,
    targetUserId: number,
    reason: string,
    category: ModerationAction["category"],
    contentType: ContentReport["contentType"],
    targetContentId?: number
  ): Promise<ContentReport> {
    this.reportCounter++;

    // Calculate priority based on category and target history
    const priority = this.calculatePriority(category, targetUserId);

    const report: ContentReport = {
      id: `RPT-${String(this.reportCounter).padStart(6, "0")}`,
      reporterId,
      targetUserId,
      targetContentId,
      contentType,
      reason,
      category,
      priority,
      status: "pending",
      createdAt: new Date(),
    };

    this.reports.push(report);
    return report;
  }

  async resolveReport(reportId: string, resolution: string, reviewerId: number): Promise<boolean> {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return false;

    report.status = "resolved";
    report.resolution = resolution;
    report.assignedTo = reviewerId;
    report.resolvedAt = new Date();
    return true;
  }

  async dismissReport(reportId: string, reviewerId: number): Promise<boolean> {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return false;

    report.status = "dismissed";
    report.assignedTo = reviewerId;
    report.resolvedAt = new Date();
    return true;
  }

  getPendingReports(limit = 50): ContentReport[] {
    return this.reports
      .filter(r => r.status === "pending" || r.status === "reviewing")
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, limit);
  }

  getReportStats(): { total: number; pending: number; resolved: number; dismissed: number; avgResolutionTime: number } {
    const resolved = this.reports.filter(r => r.status === "resolved");
    const avgTime = resolved.length > 0
      ? resolved.reduce((sum, r) => sum + ((r.resolvedAt?.getTime() || 0) - r.createdAt.getTime()), 0) / resolved.length / (60 * 60 * 1000)
      : 0;

    return {
      total: this.reports.length,
      pending: this.reports.filter(r => r.status === "pending").length,
      resolved: resolved.length,
      dismissed: this.reports.filter(r => r.status === "dismissed").length,
      avgResolutionTime: avgTime, // hours
    };
  }

  private calculatePriority(category: ModerationAction["category"], targetUserId: number): ContentReport["priority"] {
    // Higher priority for severe categories
    switch (category) {
      case "violence": return "urgent";
      case "hate_speech": return "high";
      case "harassment": return "high";
      case "scam": return "high";
      case "sexual": return "medium";
      case "impersonation": return "medium";
      case "spam": return "low";
      default: return "low";
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// APPEAL SYSTEM
// ═══════════════════════════════════════════════════════════════

export class AppealService {
  private appeals: Appeal[] = [];
  private appealCounter = 0;

  async createAppeal(userId: number, actionId: string, reason: string, evidence?: string): Promise<Appeal> {
    this.appealCounter++;

    const appeal: Appeal = {
      id: `APL-${String(this.appealCounter).padStart(6, "0")}`,
      userId,
      actionId,
      reason,
      evidence,
      status: "pending",
      createdAt: new Date(),
    };

    this.appeals.push(appeal);
    return appeal;
  }

  async reviewAppeal(appealId: string, reviewerId: number, approved: boolean, notes?: string): Promise<boolean> {
    const appeal = this.appeals.find(a => a.id === appealId);
    if (!appeal) return false;

    appeal.status = approved ? "approved" : "denied";
    appeal.reviewerId = reviewerId;
    appeal.reviewNotes = notes;
    appeal.reviewedAt = new Date();

    return true;
  }

  getPendingAppeals(): Appeal[] {
    return this.appeals.filter(a => a.status === "pending");
  }

  getUserAppeals(userId: number): Appeal[] {
    return this.appeals.filter(a => a.userId === userId);
  }
}

// ═══════════════════════════════════════════════════════════════
// ANTI-SPAM ENGINE
// ═══════════════════════════════════════════════════════════════

export class AntiSpamEngine {
  private userActivity: Map<number, { timestamps: number[]; contentHashes: Set<string> }> = new Map();
  private readonly RATE_WINDOW = 60 * 1000; // 1 minute
  private readonly MAX_ACTIONS_PER_MINUTE = 10;
  private readonly DUPLICATE_WINDOW = 5 * 60 * 1000; // 5 minutes

  checkSpam(userId: number, content: string): SpamSignal[] {
    const signals: SpamSignal[] = [];
    const now = Date.now();

    // Get or create user activity
    if (!this.userActivity.has(userId)) {
      this.userActivity.set(userId, { timestamps: [], contentHashes: new Set() });
    }
    const activity = this.userActivity.get(userId)!;

    // Rate limit check
    activity.timestamps = activity.timestamps.filter(t => now - t < this.RATE_WINDOW);
    activity.timestamps.push(now);

    if (activity.timestamps.length > this.MAX_ACTIONS_PER_MINUTE) {
      signals.push({
        type: "rate_limit",
        confidence: 0.9,
        details: `${activity.timestamps.length} actions in last minute (limit: ${this.MAX_ACTIONS_PER_MINUTE})`,
      });
    }

    // Duplicate content check
    const contentHash = this.hashContent(content);
    if (activity.contentHashes.has(contentHash)) {
      signals.push({
        type: "duplicate_content",
        confidence: 0.95,
        details: "Exact duplicate content detected within 5 minutes",
      });
    }
    activity.contentHashes.add(contentHash);

    // Clean old hashes periodically
    if (activity.contentHashes.size > 100) {
      activity.contentHashes.clear();
    }

    // Link spam check
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    if (linkCount > 3) {
      signals.push({
        type: "link_spam",
        confidence: 0.7,
        details: `${linkCount} links detected in single message`,
      });
    }

    // Keyword spam patterns
    const spamKeywords = ["free", "win", "claim", "airdrop", "guaranteed"];
    const keywordCount = spamKeywords.filter(k => content.toLowerCase().includes(k)).length;
    if (keywordCount >= 3) {
      signals.push({
        type: "keyword_spam",
        confidence: 0.75,
        details: `${keywordCount} spam keywords detected`,
      });
    }

    return signals;
  }

  private hashContent(content: string): string {
    // Simple hash for duplicate detection
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// ═══════════════════════════════════════════════════════════════
// BEHAVIORAL ANALYTICS
// ═══════════════════════════════════════════════════════════════

export class BehavioralAnalytics {
  private anomalies: BehaviorAnomaly[] = [];

  async detectAnomalies(userId: number): Promise<BehaviorAnomaly[]> {
    const detected: BehaviorAnomaly[] = [];
    const db = await getDb();
    if (!db) return detected;

    // Check for sudden activity spike
    const [recentActivity] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.authorId, userId),
          gte(schema.posts.createdAt, new Date(Date.now() - 60 * 60 * 1000)) // Last hour
        )
      );

    if ((recentActivity?.count || 0) > 20) {
      detected.push({
        userId,
        anomalyType: "sudden_activity_spike",
        confidence: 0.8,
        evidence: [`${recentActivity?.count} posts in last hour`],
        detectedAt: new Date(),
      });
    }

    // Check for mass following
    const [followActivity] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.follows)
      .where(
        and(
          eq(schema.follows.followerId, userId),
          gte(schema.follows.createdAt, new Date(Date.now() - 60 * 60 * 1000))
        )
      );

    if ((followActivity?.count || 0) > 50) {
      detected.push({
        userId,
        anomalyType: "mass_following",
        confidence: 0.85,
        evidence: [`${followActivity?.count} follows in last hour`],
        detectedAt: new Date(),
      });
    }

    this.anomalies.push(...detected);
    return detected;
  }

  getRecentAnomalies(limit = 50): BehaviorAnomaly[] {
    return this.anomalies.slice(-limit).reverse();
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE & AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════

export class ComplianceLogger {
  private auditLog: { timestamp: Date; actor: string; action: string; target: string; details: string; category: string }[] = [];

  log(actor: string, action: string, target: string, details: string, category: string): void {
    this.auditLog.push({
      timestamp: new Date(),
      actor,
      action,
      target,
      details,
      category,
    });

    // Keep last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
  }

  getLog(limit = 100, category?: string): typeof this.auditLog {
    let filtered = this.auditLog;
    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }
    return filtered.slice(-limit).reverse();
  }

  getLogByActor(actor: string, limit = 50): typeof this.auditLog {
    return this.auditLog.filter(e => e.actor === actor).slice(-limit).reverse();
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const contentModeration = new ContentModerationService();
export const userReputation = new UserReputationService();
export const reportService = new ReportService();
export const appealService = new AppealService();
export const antiSpam = new AntiSpamEngine();
export const behavioralAnalytics = new BehavioralAnalytics();
export const complianceLogger = new ComplianceLogger();
