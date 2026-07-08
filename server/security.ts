/**
 * Security Module — Rate Limiting, Input Sanitization, Trust Scoring
 * 
 * This module provides production-grade security middleware:
 * - In-memory rate limiter (per-IP and per-user)
 * - Input sanitization (XSS prevention, SQL injection prevention)
 * - Trust scoring (user reputation based on activity)
 * - Request validation helpers
 */

import type { Request, Response, NextFunction } from "express";

// ═══════════════════════════════════════════════════════════════
// RATE LIMITER (In-memory, per-IP)
// ═══════════════════════════════════════════════════════════════

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyPrefix?: string;  // Prefix for the rate limit key
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix = "rl" } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      // New window
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
      return next();
    }

    if (entry.count >= maxRequests) {
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    entry.count++;
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - entry.count);
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
    return next();
  };
}

// ═══════════════════════════════════════════════════════════════
// INPUT SANITIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Strip HTML tags and dangerous characters from input strings.
 * Prevents XSS attacks when user input is rendered.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Remove potential SQL injection patterns from strings.
 * Note: This is a defense-in-depth measure — parameterized queries (Drizzle ORM) are the primary defense.
 */
export function sanitizeSqlInput(input: string): string {
  // Remove common SQL injection patterns
  return input
    .replace(/(['";])/g, "")
    .replace(/(--)|(\/\*)|(\*\/)/g, "")
    .replace(/(union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+.*\s+set)/gi, "");
}

/**
 * Validate and sanitize a username/display name.
 */
export function sanitizeDisplayName(name: string): string {
  return name
    .replace(/[<>'"&;]/g, "")
    .trim()
    .substring(0, 50);
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize content for posts/messages (allow some formatting but prevent XSS).
 */
export function sanitizeContent(content: string, maxLength = 10000): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .substring(0, maxLength);
}

// ═══════════════════════════════════════════════════════════════
// TRUST SCORING
// ═══════════════════════════════════════════════════════════════

interface TrustFactors {
  accountAgeDays: number;
  totalPosts: number;
  totalLikes: number;
  reportCount: number;
  verifiedEmail: boolean;
  hasAvatar: boolean;
  communityMemberships: number;
}

/**
 * Calculate a trust score (0-100) based on user activity and reputation.
 * Used for content visibility, rate limit tiers, and moderation priority.
 */
export function calculateTrustScore(factors: TrustFactors): number {
  let score = 0;

  // Account age (max 25 points)
  score += Math.min(25, factors.accountAgeDays * 0.5);

  // Content creation (max 20 points)
  score += Math.min(20, factors.totalPosts * 0.2);

  // Engagement received (max 15 points)
  score += Math.min(15, factors.totalLikes * 0.1);

  // Verified email (10 points)
  if (factors.verifiedEmail) score += 10;

  // Has avatar (5 points)
  if (factors.hasAvatar) score += 5;

  // Community participation (max 15 points)
  score += Math.min(15, factors.communityMemberships * 3);

  // Penalty for reports (max -30 points)
  score -= Math.min(30, factors.reportCount * 10);

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get rate limit tier based on trust score.
 * Higher trust = more generous limits.
 */
export function getRateLimitTier(trustScore: number): { windowMs: number; maxRequests: number } {
  if (trustScore >= 80) return { windowMs: 60000, maxRequests: 120 };  // Trusted
  if (trustScore >= 50) return { windowMs: 60000, maxRequests: 60 };   // Normal
  if (trustScore >= 20) return { windowMs: 60000, maxRequests: 30 };   // New
  return { windowMs: 60000, maxRequests: 15 };                          // Untrusted
}

// ═══════════════════════════════════════════════════════════════
// SECURITY HEADERS MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    // Prevent MIME sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // XSS protection (legacy browsers)
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Referrer policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions policy
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  };
}

// ═══════════════════════════════════════════════════════════════
// REQUEST VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Validate that request body doesn't exceed size limits.
 */
export function validatePayloadSize(maxBytes: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: "Payload Too Large",
        message: `Request body exceeds maximum size of ${Math.round(maxBytes / 1024)}KB`,
      });
    }
    next();
  };
}

/**
 * Log suspicious activity for monitoring.
 */
export function logSuspiciousActivity(userId: string | null, action: string, details: string) {
  const timestamp = new Date().toISOString();
  }

// ═══════════════════════════════════════════════════════════════
// SECURITY ENGINE v2 — ADVANCED MODULES
// ═══════════════════════════════════════════════════════════════

import crypto from "crypto";

// ─── Types ───────────────────────────────────────────────────

export interface SecurityEvent {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  userId?: number;
  ip: string;
  userAgent?: string;
  endpoint?: string;
  timestamp: number;
  resolved: boolean;
  metadata: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  userId?: number;
  ip: string;
  action: string;
  resource: string;
  outcome: "success" | "failure" | "blocked";
  details: Record<string, unknown>;
  hash: string;
  previousHash: string;
}

export interface FraudSignal {
  type: string;
  severity: number;
  description: string;
  evidence: Record<string, unknown>;
  timestamp: number;
}

export interface FraudAssessment {
  userId?: number;
  ip: string;
  riskScore: number;
  signals: FraudSignal[];
  recommendation: "allow" | "challenge" | "block" | "review";
  timestamp: number;
}

export interface IPReputation {
  ip: string;
  score: number;
  isProxy: boolean;
  isVPN: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  blocklisted: boolean;
  blocklistSources: string[];
  lastChecked: number;
  requestCount: number;
  violationCount: number;
}

export interface BehaviorProfile {
  userId?: number;
  ip: string;
  requestCount: number;
  uniqueEndpoints: Set<string>;
  avgTimeBetweenRequests: number;
  suspicionScore: number;
  firstSeen: number;
  lastSeen: number;
  flags: string[];
}

export interface TrustScoreV2 {
  userId: number;
  score: number;
  tier: "untrusted" | "new" | "basic" | "trusted" | "verified" | "elite";
  flags: string[];
  lastUpdated: number;
}

// ─── In-Memory Stores ─────────────────────────────────────────

const _securityEvents: SecurityEvent[] = [];
const _auditLog: AuditEntry[] = [];
const _blockedIPs = new Set<string>();
const _ipRepStore = new Map<string, IPReputation>();
const _honeypotHits = new Map<string, number>();
const _spamFP = new Map<string, number>();
const _fraudByUser = new Map<number, FraudSignal[]>();
const _csrfTokens = new Map<string, { token: string; createdAt: number; used: boolean }>();
const _sessionFP = new Map<string, string>();
const _credStuffing = new Map<string, { attempts: number; lastAttempt: number }>();
const _behaviorProfiles = new Map<string, BehaviorProfile>();
const _trustScoresV2 = new Map<number, TrustScoreV2>();
let _lastAuditHash = "genesis";

// ─── Cleanup ─────────────────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  _behaviorProfiles.forEach((p, k) => { if (now - p.lastSeen > 30 * 60_000) _behaviorProfiles.delete(k); });
  _credStuffing.forEach((d, k) => { if (now - d.lastAttempt > 60 * 60_000) _credStuffing.delete(k); });
  _csrfTokens.forEach((t, k) => { if (now - t.createdAt > 2 * 60 * 60_000) _csrfTokens.delete(k); });
}, 10 * 60_000);

// ─── Honeypot Endpoints ───────────────────────────────────────

const HONEYPOT_ENDPOINTS = new Set([
  "/.env", "/wp-admin", "/phpmyadmin", "/admin.php", "/.git/config",
  "/backup.sql", "/config.json", "/api/admin/debug", "/api/internal/config",
  "/.htaccess", "/server-status", "/actuator", "/actuator/env",
]);

const HONEYPOT_FIELDS = new Set([
  "phone_number_extra", "website_url_hidden", "confirm_email_2", "bot_trap", "zip_code_verify",
]);

// ─── Bot Detection Patterns ───────────────────────────────────

const BOT_UA_PATTERNS = [
  /bot|crawler|spider|scraper|wget|curl|python-requests|go-http|java\//i,
  /headless|phantom|selenium|puppeteer|playwright|cypress/i,
  /scrapy|beautifulsoup|mechanize|httpclient|libwww/i,
];

const LEGIT_BOT_PATTERNS = [
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot/i,
  /facebookexternalhit|twitterbot|linkedinbot|whatsapp/i,
];

// ─── Spam Patterns ────────────────────────────────────────────

const SPAM_CONTENT_PATTERNS = [
  /\b(buy now|click here|free money|make money fast|work from home)\b/i,
  /\b(crypto pump|guaranteed profit|100x returns|moon soon|get rich quick)\b/i,
  /\b(follow for follow|like for like|sub4sub|f4f|l4l)\b/i,
  /(https?:\/\/[^\s]+){3,}/i,
  /(.)\1{8,}/i,
  /\b(viagra|cialis|casino|lottery|prize winner)\b/i,
];

const SPAM_KEYWORDS = new Set([
  "airdrop scam", "rug pull", "send btc", "send eth", "send usdt",
  "double your crypto", "investment opportunity", "guaranteed returns",
  "dm me for profit", "join my group",
]);

// ═══════════════════════════════════════════════════════════════
// SECURITY EVENTS
// ═══════════════════════════════════════════════════════════════

export function recordSecurityEvent(
  e: Omit<SecurityEvent, "id" | "timestamp" | "resolved">
): SecurityEvent {
  const full: SecurityEvent = {
    ...e,
    id: `sec_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    resolved: false,
  };
  _securityEvents.push(full);
  if (_securityEvents.length > 50_000) _securityEvents.splice(0, 5_000);
  if (full.severity === "critical") {
      }
  return full;
}

export function getSecurityEvents(f?: {
  type?: string; severity?: string; userId?: number;
  since?: number; limit?: number; resolved?: boolean;
}): SecurityEvent[] {
  let r = _securityEvents;
  if (f?.type) r = r.filter(e => e.type === f.type);
  if (f?.severity) r = r.filter(e => e.severity === f.severity);
  if (f?.userId !== undefined) r = r.filter(e => e.userId === f.userId);
  if (f?.since) r = r.filter(e => e.timestamp >= f.since!);
  if (f?.resolved !== undefined) r = r.filter(e => e.resolved === f.resolved);
  return r.slice(-(f?.limit || 100));
}

export function resolveSecurityEvent(id: string): boolean {
  const e = _securityEvents.find(x => x.id === id);
  if (!e) return false;
  e.resolved = true;
  return true;
}

export function getSecurityStats() {
  const byType = new Map<string, number>();
  _securityEvents.forEach(e => byType.set(e.type, (byType.get(e.type) || 0) + 1));
  const topThreats = Array.from(byType.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  let totalFraud = 0;
  _fraudByUser.forEach(s => { totalFraud += s.length; });
  return {
    blockedIPs: _blockedIPs.size,
    securityEvents: {
      total: _securityEvents.length,
      critical: _securityEvents.filter(e => e.severity === "critical").length,
      unresolved: _securityEvents.filter(e => !e.resolved).length,
    },
    auditEntries: _auditLog.length,
    topThreats,
    fraudSignals: totalFraud,
  };
}

// ═══════════════════════════════════════════════════════════════
// IMMUTABLE AUDIT LOG
// ═══════════════════════════════════════════════════════════════

export function writeAuditLog(entry: Omit<AuditEntry, "id" | "hash" | "previousHash">): AuditEntry {
  const content = JSON.stringify({ ...entry, previousHash: _lastAuditHash });
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  const full: AuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    hash,
    previousHash: _lastAuditHash,
  };
  _lastAuditHash = hash;
  _auditLog.push(full);
  if (_auditLog.length > 100_000) _auditLog.splice(0, 10_000);
  return full;
}

export function getAuditLog(f?: {
  userId?: number; action?: string; outcome?: string; since?: number; limit?: number;
}): AuditEntry[] {
  let r = _auditLog;
  if (f?.userId !== undefined) r = r.filter(e => e.userId === f.userId);
  if (f?.action) r = r.filter(e => e.action === f.action);
  if (f?.outcome) r = r.filter(e => e.outcome === f.outcome);
  if (f?.since) r = r.filter(e => e.timestamp >= f.since!);
  return r.slice(-(f?.limit || 100));
}

export function verifyAuditChain(): { valid: boolean; brokenAt?: string } {
  let prev = "genesis";
  for (const e of _auditLog) {
    if (e.previousHash !== prev) return { valid: false, brokenAt: e.id };
    prev = e.hash;
  }
  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// IP REPUTATION ENGINE
// ═══════════════════════════════════════════════════════════════

export function getIPReputation(ip: string): IPReputation {
  let r = _ipRepStore.get(ip);
  if (!r) {
    r = { ip, score: 0, isProxy: false, isVPN: false, isTor: false, isDatacenter: false, blocklisted: false, blocklistSources: [], lastChecked: Date.now(), requestCount: 0, violationCount: 0 };
    _ipRepStore.set(ip, r);
  }
  r.requestCount++;
  return r;
}

export function blockIPv2(ip: string, reason: string): void {
  _blockedIPs.add(ip);
  const r = getIPReputation(ip);
  r.blocklisted = true;
  r.score = Math.min(100, r.score + 50);
  recordSecurityEvent({ type: "ip_blocked", severity: "high", ip, metadata: { reason } });
}

export function unblockIPv2(ip: string): void {
  _blockedIPs.delete(ip);
  const r = _ipRepStore.get(ip);
  if (r) { r.blocklisted = false; r.score = Math.max(0, r.score - 50); }
}

export function isIPBlockedV2(ip: string): boolean {
  return _blockedIPs.has(ip);
}

// ═══════════════════════════════════════════════════════════════
// HONEYPOT SYSTEM
// ═══════════════════════════════════════════════════════════════

export function checkHoneypot(req: Request): boolean {
  const ip = getClientIPv2(req);
  if (HONEYPOT_ENDPOINTS.has(req.path)) {
    const hits = (_honeypotHits.get(ip) || 0) + 1;
    _honeypotHits.set(ip, hits);
    if (hits >= 2) {
      _blockedIPs.add(ip);
      recordSecurityEvent({ type: "honeypot_triggered", severity: "critical", ip, endpoint: req.path, metadata: { hits } });
    }
    return true;
  }
  if (req.body) {
    for (const field of HONEYPOT_FIELDS) {
      if (req.body[field] !== undefined && req.body[field] !== "") {
        recordSecurityEvent({ type: "bot_detected", severity: "high", ip, endpoint: req.path, metadata: { honeypotField: field } });
        return true;
      }
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════
// ANTI-SPAM ENGINE
// ═══════════════════════════════════════════════════════════════

export function analyzeSpam(content: string, userId?: number): {
  isSpam: boolean; confidence: number; reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;
  for (const p of SPAM_CONTENT_PATTERNS) {
    if (p.test(content)) { score += 25; reasons.push("Spam pattern matched"); }
  }
  const lower = content.toLowerCase();
  for (const kw of SPAM_KEYWORDS) {
    if (lower.includes(kw)) { score += 20; reasons.push(`Spam keyword: "${kw}"`); }
  }
  const fp = crypto.createHash('sha256').update(content.trim().toLowerCase().replace(/\s+/g, " ")).digest("hex");
  const fpc = (_spamFP.get(fp) || 0) + 1;
  _spamFP.set(fp, fpc);
  if (fpc > 3) { score += 30 * Math.min(fpc - 3, 3); reasons.push(`Duplicate content (${fpc}x)`); }
  const upperRatio = (content.match(/[A-Z]/g) || []).length / Math.max(content.length, 1);
  if (upperRatio > 0.7 && content.length > 20) { score += 15; reasons.push("Excessive caps"); }
  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 20) { score += 10; reasons.push(`Emoji spam (${emojiCount})`); }
  if (userId) {
    const profile = _behaviorProfiles.get(`user:${userId}`);
    if (profile && profile.requestCount > 50) { score += 15; reasons.push("High velocity user"); }
  }
  return { isSpam: score >= 50, confidence: Math.min(score, 100), reasons };
}

// ═══════════════════════════════════════════════════════════════
// ANTI-BOT ENGINE
// ═══════════════════════════════════════════════════════════════

export function detectBotV2(req: Request): {
  isBot: boolean; isMaliciousBot: boolean; confidence: number; signals: string[];
} {
  const ua = req.headers["user-agent"] || "";
  const signals: string[] = [];
  let score = 0;
  if (LEGIT_BOT_PATTERNS.some(p => p.test(ua))) {
    return { isBot: true, isMaliciousBot: false, confidence: 90, signals: ["Legitimate crawler"] };
  }
  if (BOT_UA_PATTERNS.some(p => p.test(ua))) { score += 70; signals.push("Bot-like user agent"); }
  if (!req.headers["accept-language"]) { score += 15; signals.push("No Accept-Language"); }
  if (!req.headers["accept-encoding"]) { score += 10; signals.push("No Accept-Encoding"); }
  if (!req.headers["accept"]) { score += 10; signals.push("No Accept header"); }
  if (!ua) { score += 40; signals.push("Missing User-Agent"); }
  if (ua.length < 10) { score += 20; signals.push("Suspiciously short UA"); }
  const ip = getClientIPv2(req);
  const profile = _behaviorProfiles.get(`ip:${ip}`);
  if (profile) {
    if (profile.avgTimeBetweenRequests < 50) { score += 30; signals.push("Inhuman request speed"); }
    if (profile.uniqueEndpoints.size > 100 && profile.requestCount < 200) { score += 20; signals.push("Endpoint scanning pattern"); }
  }
  return { isBot: score >= 40, isMaliciousBot: score >= 60, confidence: Math.min(score, 100), signals };
}

export function updateBehaviorProfile(req: Request, userId?: number): void {
  const ip = getClientIPv2(req);
  const key = userId ? `user:${userId}` : `ip:${ip}`;
  const now = Date.now();
  let profile = _behaviorProfiles.get(key);
  if (!profile) {
    profile = { userId, ip, requestCount: 0, uniqueEndpoints: new Set(), avgTimeBetweenRequests: 0, suspicionScore: 0, firstSeen: now, lastSeen: now, flags: [] };
    _behaviorProfiles.set(key, profile);
  }
  const timeSince = now - profile.lastSeen;
  profile.avgTimeBetweenRequests = profile.requestCount === 0 ? timeSince : (profile.avgTimeBetweenRequests * 0.9 + timeSince * 0.1);
  profile.requestCount++;
  profile.uniqueEndpoints.add(req.path);
  profile.lastSeen = now;
}

// ═══════════════════════════════════════════════════════════════
// FRAUD PREVENTION ENGINE
// ═══════════════════════════════════════════════════════════════

export function assessFraudRisk(params: {
  userId?: number; ip: string; action: string; amount?: number; metadata?: Record<string, unknown>;
}): FraudAssessment {
  const signals: FraudSignal[] = [];
  let riskScore = 0;
  const ipRep = getIPReputation(params.ip);
  if (ipRep.score > 50) {
    signals.push({ type: "bad_ip", severity: ipRep.score / 100, description: "High-risk IP address", evidence: { ipScore: ipRep.score }, timestamp: Date.now() });
    riskScore += ipRep.score * 0.3;
  }
  if (params.amount !== undefined) {
    if (params.amount > 10_000) {
      signals.push({ type: "large_amount", severity: 0.5, description: "Large transaction amount", evidence: { amount: params.amount }, timestamp: Date.now() });
      riskScore += 15;
    }
    if (params.amount > 100_000) {
      signals.push({ type: "very_large_amount", severity: 0.8, description: "Very large transaction", evidence: { amount: params.amount }, timestamp: Date.now() });
      riskScore += 25;
    }
  }
  if (params.userId) {
    const existing = _fraudByUser.get(params.userId) || [];
    const recentSwaps = existing.filter(s => s.type === "swap" && Date.now() - s.timestamp < 60_000);
    if (params.action === "swap" && recentSwaps.length > 5) {
      signals.push({ type: "wash_trading", severity: 0.9, description: "Wash trading pattern detected", evidence: { recentSwaps: recentSwaps.length }, timestamp: Date.now() });
      riskScore += 40;
      recordSecurityEvent({ type: "wash_trading", severity: "critical", ip: params.ip, userId: params.userId, metadata: {} });
    }
    if (signals.length > 0) _fraudByUser.set(params.userId, [...existing, ...signals].slice(-100));
  }
  const finalScore = Math.min(100, riskScore);
  let recommendation: FraudAssessment["recommendation"] = "allow";
  if (finalScore >= 80) recommendation = "block";
  else if (finalScore >= 60) recommendation = "review";
  else if (finalScore >= 40) recommendation = "challenge";
  return { userId: params.userId, ip: params.ip, riskScore: finalScore, signals, recommendation, timestamp: Date.now() };
}

// ═══════════════════════════════════════════════════════════════
// CREDENTIAL STUFFING DETECTION
// ═══════════════════════════════════════════════════════════════

export function trackLoginAttempt(ip: string, username: string, success: boolean): {
  blocked: boolean; reason?: string;
} {
  const key = `${ip}:${username}`;
  const t = _credStuffing.get(key) || { attempts: 0, lastAttempt: 0 };
  if (!success) {
    t.attempts++;
    t.lastAttempt = Date.now();
    _credStuffing.set(key, t);
    if (t.attempts >= 10) {
      blockIPv2(ip, "Credential stuffing");
      recordSecurityEvent({ type: "credential_stuffing", severity: "critical", ip, metadata: { username, attempts: t.attempts } });
      return { blocked: true, reason: "Too many failed login attempts" };
    }
    if (t.attempts >= 5) {
      recordSecurityEvent({ type: "brute_force", severity: "high", ip, metadata: { username, attempts: t.attempts } });
    }
  } else {
    _credStuffing.delete(key);
  }
  return { blocked: false };
}

// ═══════════════════════════════════════════════════════════════
// CSRF PROTECTION v2
// ═══════════════════════════════════════════════════════════════

export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  _csrfTokens.set(sessionId, { token, createdAt: Date.now(), used: false });
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const s = _csrfTokens.get(sessionId);
  if (!s || s.used) return false;
  if (Date.now() - s.createdAt > 2 * 60 * 60_000) { _csrfTokens.delete(sessionId); return false; }
  const valid = crypto.timingSafeEqual(Buffer.from(s.token), Buffer.from(token));
  if (valid) s.used = true;
  return valid;
}

// ═══════════════════════════════════════════════════════════════
// SESSION FINGERPRINTING
// ═══════════════════════════════════════════════════════════════

export function generateSessionFingerprint(req: Request): string {
  return crypto.createHash("sha256").update([
    req.headers["user-agent"] || "",
    req.headers["accept-language"] || "",
    req.headers["accept-encoding"] || "",
    getClientIPv2(req),
  ].join("|")).digest("hex").slice(0, 16);
}

export function validateSessionFingerprint(sessionId: string, req: Request): boolean {
  const current = generateSessionFingerprint(req);
  const stored = _sessionFP.get(sessionId);
  if (!stored) { _sessionFP.set(sessionId, current); return true; }
  if (stored !== current) {
    recordSecurityEvent({ type: "session_hijack", severity: "critical", ip: getClientIPv2(req), metadata: { sessionId } });
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════
// TRUST SCORING v2
// ═══════════════════════════════════════════════════════════════

export function getTrustScoreV2(userId: number): TrustScoreV2 {
  return _trustScoresV2.get(userId) || { userId, score: 100, tier: "new", flags: [], lastUpdated: Date.now() };
}

export function updateTrustScoreV2(userId: number, delta: number, reason: string): TrustScoreV2 {
  const trust = getTrustScoreV2(userId);
  trust.score = Math.max(0, Math.min(1000, trust.score + delta));
  trust.tier = trustTierFromScore(trust.score);
  trust.lastUpdated = Date.now();
  _trustScoresV2.set(userId, trust);
  return trust;
}

export function addTrustFlag(userId: number, flag: string): void {
  const trust = getTrustScoreV2(userId);
  if (!trust.flags.includes(flag)) trust.flags.push(flag);
  _trustScoresV2.set(userId, trust);
}

function trustTierFromScore(score: number): TrustScoreV2["tier"] {
  if (score >= 800) return "elite";
  if (score >= 600) return "verified";
  if (score >= 400) return "trusted";
  if (score >= 200) return "basic";
  if (score >= 50) return "new";
  return "untrusted";
}

export const TrustSignalWeights = {
  emailVerified: 50, phoneVerified: 75, kycCompleted: 150,
  firstPost: 10, firstFollow: 5, receivedTip: 20, sentTip: 15,
  accountAge30d: 30, accountAge90d: 50, accountAge365d: 100,
  premiumSubscriber: 80, creatorVerified: 100, stakingActive: 40,
  nftHolder: 25, governanceVoter: 20,
  spamReport: -50, fraudFlag: -150, chargebackFiled: -200,
  contentRemoved: -30, accountSuspended: -300,
};

// ═══════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE — Full Stack
// ═══════════════════════════════════════════════════════════════

export function securityMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIPv2(req);
    if (isIPBlockedV2(ip)) { res.status(403).json({ error: "Access denied", code: "IP_BLOCKED" }); return; }
    if (checkHoneypot(req)) { res.status(404).json({ error: "Not found" }); return; }
    const botResult = detectBotV2(req);
    if (botResult.isMaliciousBot) {
      recordSecurityEvent({ type: "bot_detected", severity: "high", ip, endpoint: req.path, userAgent: req.headers["user-agent"] as string, metadata: { signals: botResult.signals } });
      res.status(403).json({ error: "Access denied", code: "BOT_DETECTED" }); return;
    }
    updateBehaviorProfile(req);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════

export function getClientIPv2(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) {
    const ips = (typeof fwd === "string" ? fwd : fwd[0]).split(",");
    return ips[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
}

export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function generateOTP(digits = 6): string {
  return crypto.randomInt(0, Math.pow(10, digits)).toString().padStart(digits, "0");
}

export function maskPII(data: string): string {
  return data
    .replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (_, u, d) => `${u.slice(0, 2)}***@${d}`)
    .replace(/\+?[\d\s\-().]{10,}/g, "***-***-****")
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "****-****-****-****")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "***-**-****");
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_.-]{3,30}$/.test(username);
}

export function isStrongPassword(password: string): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (password.length < 8) reasons.push("At least 8 characters required");
  if (!/[A-Z]/.test(password)) reasons.push("Uppercase letter required");
  if (!/[a-z]/.test(password)) reasons.push("Lowercase letter required");
  if (!/\d/.test(password)) reasons.push("Number required");
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) reasons.push("Special character required");
  return { valid: reasons.length === 0, reasons };
}

export function hashPasswordV2(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString("hex");
  return { hash: crypto.pbkdf2Sync(password, s, 100_000, 64, "sha512").toString("hex"), salt: s };
}

export function verifyPasswordV2(password: string, hash: string, salt: string): boolean {
  const { hash: computed } = hashPasswordV2(password, salt);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

export function sanitizeInput(input: string): { clean: string; threats: string[] } {
  const threats: string[] = [];
  let clean = input;
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /document\.cookie/gi,
  ];
  for (const p of xssPatterns) {
    if (p.test(clean)) { threats.push("XSS attempt"); clean = clean.replace(p, "[REMOVED]"); }
  }
  return { clean, threats };
}

export function validateAndSanitize(input: unknown, maxLength = 10_000): string {
  if (typeof input !== "string") return "";
  const { clean } = sanitizeInput(input.slice(0, maxLength));
  return clean;
}

export function isValidURL(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

// Rate limit check helper (non-middleware version)
export function checkRateLimit(key: string, configName = "default"): {
  allowed: boolean; remaining: number; resetAt: number; retryAfter?: number;
} {
  const configs: Record<string, { windowMs: number; maxRequests: number; blockDurationMs: number }> = {
    default:        { windowMs: 60_000,      maxRequests: 100, blockDurationMs: 60_000 },
    auth:           { windowMs: 15 * 60_000, maxRequests: 10,  blockDurationMs: 30 * 60_000 },
    post_create:    { windowMs: 60_000,      maxRequests: 20,  blockDurationMs: 5 * 60_000 },
    tip:            { windowMs: 60_000,      maxRequests: 30,  blockDurationMs: 5 * 60_000 },
    mining:         { windowMs: 10_000,      maxRequests: 5,   blockDurationMs: 30_000 },
    swap:           { windowMs: 60_000,      maxRequests: 20,  blockDurationMs: 5 * 60_000 },
    dm:             { windowMs: 60_000,      maxRequests: 50,  blockDurationMs: 2 * 60_000 },
    password_reset: { windowMs: 60 * 60_000, maxRequests: 3,   blockDurationMs: 60 * 60_000 },
  };
  const config = configs[configName] || configs.default;
  const now = Date.now();
  const storeKey = `v2:${configName}:${key}`;
  let entry = rateLimitStore.get(storeKey) as { count: number; resetAt: number } | undefined;
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(storeKey, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}
