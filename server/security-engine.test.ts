import crypto from 'crypto';
/**
 * Security Engine Test Suite
 * Tests: rate limiting, CSRF protection, fraud detection, input validation
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  check(key: string, nowMs = Date.now()): { allowed: boolean; remaining: number; resetAt: number } {
    const entry = this.store.get(key);

    if (!entry || nowMs - entry.windowStart >= this.windowMs) {
      this.store.set(key, { count: 1, windowStart: nowMs });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: nowMs + this.windowMs };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.windowStart + this.windowMs };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.windowStart + this.windowMs,
    };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  getCount(key: string): number {
    return this.store.get(key)?.count ?? 0;
  }
}

// ─── CSRF Token Engine ────────────────────────────────────────────────────────

const csrfTokens = new Map<string, { token: string; createdAt: number; used: boolean }>();

function generateCsrfToken(sessionId: string, nowMs = Date.now()): string {
  const token = `csrf_${sessionId}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2)}_${nowMs}`;
  csrfTokens.set(sessionId, { token, createdAt: nowMs, used: false });
  return token;
}

function validateCsrfToken(
  sessionId: string,
  token: string,
  nowMs = Date.now(),
  maxAgeMs = 60 * 60 * 1000
): { valid: boolean; reason?: string } {
  const entry = csrfTokens.get(sessionId);
  if (!entry) return { valid: false, reason: "No token found for session" };
  if (entry.used) return { valid: false, reason: "Token already used" };
  if (entry.token !== token) return { valid: false, reason: "Token mismatch" };
  if (nowMs - entry.createdAt > maxAgeMs) return { valid: false, reason: "Token expired" };
  entry.used = true;
  return { valid: true };
}

// ─── Fraud Detection Engine ───────────────────────────────────────────────────

interface UserActivity {
  userId: number;
  actions: { type: string; timestamp: number; amount?: number }[];
}

interface FraudSignal {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  description: string;
}

function detectFraud(activity: UserActivity, nowMs = Date.now()): FraudSignal[] {
  const signals: FraudSignal[] = [];
  const oneHour = 60 * 60 * 1000;
  const recentActions = activity.actions.filter((a) => nowMs - a.timestamp < oneHour);

  // Velocity check: too many actions in short time
  if (recentActions.length > 100) {
    signals.push({
      type: "high_velocity",
      severity: "high",
      score: Math.min(100, recentActions.length),
      description: `${recentActions.length} actions in last hour`,
    });
  }

  // Large transaction check
  const largeTxs = recentActions.filter((a) => a.type === "transfer" && (a.amount ?? 0) > 10000);
  if (largeTxs.length > 0) {
    signals.push({
      type: "large_transaction",
      severity: largeTxs.length > 3 ? "critical" : "medium",
      score: largeTxs.length * 25,
      description: `${largeTxs.length} large transactions detected`,
    });
  }

  // Rapid withdrawal pattern
  const withdrawals = recentActions.filter((a) => a.type === "withdrawal");
  if (withdrawals.length > 5) {
    signals.push({
      type: "rapid_withdrawals",
      severity: "high",
      score: withdrawals.length * 10,
      description: `${withdrawals.length} withdrawals in last hour`,
    });
  }

  // Tip farming: sending many small tips
  const tips = recentActions.filter((a) => a.type === "tip" && (a.amount ?? 0) < 1);
  if (tips.length > 20) {
    signals.push({
      type: "tip_farming",
      severity: "medium",
      score: tips.length * 3,
      description: `${tips.length} micro-tips detected (possible farming)`,
    });
  }

  return signals;
}

function calculateFraudScore(signals: FraudSignal[]): number {
  const severityWeights = { low: 1, medium: 2, high: 3, critical: 5 };
  return Math.min(
    100,
    signals.reduce((sum, s) => sum + s.score * severityWeights[s.severity], 0)
  );
}

// ─── Input Validation ─────────────────────────────────────────────────────────

function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (password.length < 8) issues.push("Too short (min 8 chars)");
  if (!/[A-Z]/.test(password)) issues.push("Missing uppercase letter");
  if (!/[0-9]/.test(password)) issues.push("Missing number");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("Missing special character");
  return { valid: issues.length === 0, issues };
}

function validateAmount(amount: unknown): { valid: boolean; value?: number; error?: string } {
  if (typeof amount !== "number") return { valid: false, error: "Amount must be a number" };
  if (isNaN(amount)) return { valid: false, error: "Amount is NaN" };
  if (!isFinite(amount)) return { valid: false, error: "Amount is not finite" };
  if (amount <= 0) return { valid: false, error: "Amount must be positive" };
  if (amount > 1_000_000) return { valid: false, error: "Amount exceeds maximum" };
  return { valid: true, value: amount };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Security Engine — Rate Limiter", () => {
  let limiter: RateLimiter;
  const NOW = Date.now();

  beforeEach(() => {
    limiter = new RateLimiter(5, 60 * 1000); // 5 req/min
  });

  it("allows requests within limit", () => {
    for (let i = 0; i < 5; i++) {
      const result = limiter.check("user:1", NOW + i);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests over limit", () => {
    for (let i = 0; i < 5; i++) limiter.check("user:1", NOW);
    const result = limiter.check("user:1", NOW + 1);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    for (let i = 0; i < 5; i++) limiter.check("user:1", NOW);
    const result = limiter.check("user:1", NOW + 61 * 1000); // after window
    expect(result.allowed).toBe(true);
  });

  it("tracks remaining requests correctly", () => {
    limiter.check("user:1", NOW);
    limiter.check("user:1", NOW + 1);
    const result = limiter.check("user:1", NOW + 2);
    expect(result.remaining).toBe(2);
  });

  it("different keys have independent limits", () => {
    for (let i = 0; i < 5; i++) limiter.check("user:1", NOW);
    const result = limiter.check("user:2", NOW);
    expect(result.allowed).toBe(true);
  });

  it("manual reset clears the limit", () => {
    for (let i = 0; i < 5; i++) limiter.check("user:1", NOW);
    limiter.reset("user:1");
    const result = limiter.check("user:1", NOW);
    expect(result.allowed).toBe(true);
  });

  it("provides correct resetAt timestamp", () => {
    const result = limiter.check("user:1", NOW);
    expect(result.resetAt).toBe(NOW + 60 * 1000);
  });
});

describe("Security Engine — CSRF Protection", () => {
  beforeEach(() => {
    csrfTokens.clear();
  });

  it("generates a CSRF token for a session", () => {
    const token = generateCsrfToken("session-abc");
    expect(token).toContain("csrf_session-abc");
  });

  it("validates a valid CSRF token", () => {
    const NOW = Date.now();
    const token = generateCsrfToken("session-1", NOW);
    const result = validateCsrfToken("session-1", token, NOW + 1000);
    expect(result.valid).toBe(true);
  });

  it("rejects wrong token", () => {
    generateCsrfToken("session-1");
    const result = validateCsrfToken("session-1", "wrong-token");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Token mismatch");
  });

  it("rejects expired token", () => {
    const NOW = Date.now();
    const token = generateCsrfToken("session-1", NOW);
    const result = validateCsrfToken("session-1", token, NOW + 2 * 60 * 60 * 1000); // 2h later
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Token expired");
  });

  it("rejects already-used token (replay attack)", () => {
    const NOW = Date.now();
    const token = generateCsrfToken("session-1", NOW);
    validateCsrfToken("session-1", token, NOW + 1000); // first use
    const result = validateCsrfToken("session-1", token, NOW + 2000); // replay
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Token already used");
  });

  it("rejects token for unknown session", () => {
    const result = validateCsrfToken("unknown-session", "any-token");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("No token found for session");
  });
});

describe("Security Engine — Fraud Detection", () => {
  const NOW = Date.now();

  it("detects high velocity actions", () => {
    const activity: UserActivity = {
      userId: 1,
      actions: Array.from({ length: 150 }, (_, i) => ({
        type: "view",
        timestamp: NOW - i * 1000,
      })),
    };
    const signals = detectFraud(activity, NOW);
    expect(signals.some((s) => s.type === "high_velocity")).toBe(true);
  });

  it("detects large transactions", () => {
    const activity: UserActivity = {
      userId: 1,
      actions: [
        { type: "transfer", timestamp: NOW - 1000, amount: 50000 },
        { type: "transfer", timestamp: NOW - 2000, amount: 75000 },
      ],
    };
    const signals = detectFraud(activity, NOW);
    expect(signals.some((s) => s.type === "large_transaction")).toBe(true);
  });

  it("marks multiple large transactions as critical", () => {
    const activity: UserActivity = {
      userId: 1,
      actions: Array.from({ length: 5 }, (_, i) => ({
        type: "transfer",
        timestamp: NOW - i * 1000,
        amount: 20000,
      })),
    };
    const signals = detectFraud(activity, NOW);
    const largeTxSignal = signals.find((s) => s.type === "large_transaction");
    expect(largeTxSignal?.severity).toBe("critical");
  });

  it("detects rapid withdrawal pattern", () => {
    const activity: UserActivity = {
      userId: 1,
      actions: Array.from({ length: 8 }, (_, i) => ({
        type: "withdrawal",
        timestamp: NOW - i * 60 * 1000,
        amount: 100,
      })),
    };
    const signals = detectFraud(activity, NOW);
    expect(signals.some((s) => s.type === "rapid_withdrawals")).toBe(true);
  });

  it("detects tip farming", () => {
    const activity: UserActivity = {
      userId: 1,
      actions: Array.from({ length: 25 }, (_, i) => ({
        type: "tip",
        timestamp: NOW - i * 1000,
        amount: 0.01,
      })),
    };
    const signals = detectFraud(activity, NOW);
    expect(signals.some((s) => s.type === "tip_farming")).toBe(true);
  });

  it("returns no signals for clean activity", () => {
    const activity: UserActivity = {
      userId: 1,
      actions: [
        { type: "view", timestamp: NOW - 1000 },
        { type: "like", timestamp: NOW - 2000 },
        { type: "tip", timestamp: NOW - 3000, amount: 5 },
      ],
    };
    const signals = detectFraud(activity, NOW);
    expect(signals).toHaveLength(0);
  });

  it("calculates fraud score from signals", () => {
    const signals: FraudSignal[] = [
      { type: "high_velocity", severity: "high", score: 50, description: "" },
      { type: "large_transaction", severity: "critical", score: 25, description: "" },
    ];
    const score = calculateFraudScore(signals);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("fraud score is capped at 100", () => {
    const signals: FraudSignal[] = Array.from({ length: 20 }, () => ({
      type: "test",
      severity: "critical" as const,
      score: 100,
      description: "",
    }));
    const score = calculateFraudScore(signals);
    expect(score).toBe(100);
  });
});

describe("Security Engine — Input Validation", () => {
  it("sanitizes XSS script tags", () => {
    const input = '<script>alert("xss")</script>Hello';
    expect(sanitizeInput(input)).toBe("Hello");
  });

  it("removes javascript: protocol", () => {
    const input = "javascript:alert(1)";
    expect(sanitizeInput(input)).not.toContain("javascript:");
  });

  it("removes inline event handlers", () => {
    const input = '<img onload=alert(1) src="x">';
    expect(sanitizeInput(input)).not.toMatch(/on\w+\s*=/i);
  });

  it("validates correct email addresses", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("test.user+tag@domain.co.uk")).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    expect(validateEmail("notanemail")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });

  it("validates strong passwords", () => {
    const result = validatePassword("Str0ng!Pass");
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects weak passwords with specific issues", () => {
    const result = validatePassword("weak");
    expect(result.valid).toBe(false);
    expect(result.issues).toContain("Too short (min 8 chars)");
    expect(result.issues).toContain("Missing uppercase letter");
    expect(result.issues).toContain("Missing number");
    expect(result.issues).toContain("Missing special character");
  });

  it("validates positive numeric amounts", () => {
    expect(validateAmount(10).valid).toBe(true);
    expect(validateAmount(0.001).valid).toBe(true);
  });

  it("rejects invalid amounts", () => {
    expect(validateAmount(0).valid).toBe(false);
    expect(validateAmount(-5).valid).toBe(false);
    expect(validateAmount(NaN).valid).toBe(false);
    expect(validateAmount(Infinity).valid).toBe(false);
    expect(validateAmount("10").valid).toBe(false);
    expect(validateAmount(2_000_000).valid).toBe(false);
  });

  it("trims whitespace from sanitized input", () => {
    expect(sanitizeInput("  hello world  ")).toBe("hello world");
  });
});
