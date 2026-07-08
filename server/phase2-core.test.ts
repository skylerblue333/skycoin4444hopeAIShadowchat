/**
 * PHASE 2 CORE ENGINE TEST SUITE
 *
 * Comprehensive tests for all Phase 2 engines:
 * - AI Core (ContentModerationAI, FraudDetectionAI, SentimentAnalysisAI, etc.)
 * - Operations Core (SupportTickets, AuditLog, CreatorPayouts, Compliance, Incidents)
 * - Media Core (Upload pipeline, transcoding, storage)
 * - Streaming Core (Sessions, gifts, battles, scheduling)
 * - Social Core (Reels, reputation, trends, friend graph)
 * - Community Core (Servers, channels, roles, messages)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Mock LLM to avoid real API calls in tests ───────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      action: "allow",
      primaryCategory: "safe",
      confidence: 0.9,
      reasoning: "Test mock",
      requiresHumanReview: false,
      label: "neutral",
      score: 0,
      emotions: [],
      topics: [],
      summary: "Test summary",
      keyPoints: ["Point 1"],
      sentiment: "neutral",
      viralProbability: 0.1,
      predictedReach: 1000,
      peakTimeHours: 6,
      reasoning2: "baseline",
    }),
  }),
}));

// ─── AI CORE TESTS ────────────────────────────────────────────────────────────

describe("ContentModerationAI", () => {
  let ContentModerationAI: any;

  beforeEach(async () => {
    const module = await import("./ai-core");
    ContentModerationAI = module.ContentModerationAI;
  });

  it("should allow safe content", async () => {
    const ai = new ContentModerationAI();
    const result = await ai.moderateContent({
      contentId: "test-1",
      contentType: "post",
      text: "Hello world! Great day today.",
      authorId: 1,
      authorTrustScore: 80,
    });
    expect(result).toBeDefined();
    expect(result.contentId).toBe("test-1");
    expect(result.contentType).toBe("post");
    expect(["allow", "flag", "remove", "shadow_ban", "escalate"]).toContain(result.action);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.processingMs).toBeGreaterThanOrEqual(0);
  });

  it("should detect crypto scam patterns via rule engine", async () => {
    const ai = new ContentModerationAI();
    const result = await ai.moderateContent({
      contentId: "scam-1",
      contentType: "post",
      text: "Send 1 ETH and get double your money back guaranteed returns!",
      authorId: 2,
    });
    expect(result.action).toBe("remove");
    expect(result.primaryCategory).toBe("scam");
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.modelUsed).toBe("rule_engine");
  });

  it("should detect phishing attempts", async () => {
    const ai = new ContentModerationAI();
    const result = await ai.moderateContent({
      contentId: "phish-1",
      contentType: "message",
      text: "Please enter your seed phrase to verify your wallet",
      authorId: 3,
    });
    expect(result.action).toBe("remove");
    expect(result.primaryCategory).toBe("scam");
    expect(result.confidence).toBeGreaterThan(0.95);
  });

  it("should cache results for repeated content", async () => {
    const ai = new ContentModerationAI();
    const params = { contentId: "cache-test", contentType: "post" as const, text: "Test content", authorId: 1 };
    const result1 = await ai.moderateContent(params);
    const result2 = await ai.moderateContent(params);
    expect(result1.contentId).toBe(result2.contentId);
    expect(result1.timestamp).toEqual(result2.timestamp); // Same cached result
  });

  it("should batch moderate multiple items", async () => {
    const ai = new ContentModerationAI();
    const items = [
      { contentId: "batch-1", contentType: "post" as const, text: "Safe content 1", authorId: 1 },
      { contentId: "batch-2", contentType: "comment" as const, text: "Safe content 2", authorId: 2 },
      { contentId: "batch-3", contentType: "message" as const, text: "Safe content 3", authorId: 3 },
    ];
    const results = await ai.batchModerate(items);
    expect(results).toHaveLength(3);
    expect(results[0].contentId).toBe("batch-1");
    expect(results[1].contentId).toBe("batch-2");
    expect(results[2].contentId).toBe("batch-3");
  });

  it("should return moderation stats", async () => {
    const ai = new ContentModerationAI();
    await ai.moderateContent({ contentId: "stat-1", contentType: "post", text: "Test", authorId: 1 });
    const stats = await ai.getModerationStats();
    expect(stats.totalModerated).toBeGreaterThan(0);
    expect(stats.actionBreakdown).toBeDefined();
    expect(stats.categoryBreakdown).toBeDefined();
    expect(stats.avgProcessingMs).toBeGreaterThanOrEqual(0);
  });
});

describe("FraudDetectionAI", () => {
  let FraudDetectionAI: any;

  beforeEach(async () => {
    const module = await import("./ai-core");
    FraudDetectionAI = module.FraudDetectionAI;
  });

  it("should record behavior without errors", async () => {
    const ai = new FraudDetectionAI();
    await expect(ai.recordBehavior(1, "login", { ipAddress: "192.168.1.1" })).resolves.not.toThrow();
    await expect(ai.recordBehavior(1, "post", {})).resolves.not.toThrow();
    await expect(ai.recordBehavior(1, "like", {})).resolves.not.toThrow();
  });

  it("should return null for low-risk users", async () => {
    const ai = new FraudDetectionAI();
    await ai.recordBehavior(100, "login", { ipAddress: "10.0.0.1" });
    await ai.recordBehavior(100, "post", {});
    const result = await ai.analyzeUserFraud(100);
    expect(result).toBeNull(); // Low activity = no fraud signal
  });

  it("should detect bot activity from high action rate", async () => {
    const ai = new FraudDetectionAI();
    const userId = 999;
    // Simulate account created 1 day ago with 600 actions
    const oldDate = new Date(Date.now() - 86400000);
    (ai as any).behaviorProfiles.set(userId, {
      loginCount: 10,
      postCount: 200,
      likeCount: 300,
      followCount: 100,
      reportCount: 0,
      avgTimeBetweenActions: 0,
      ipAddresses: new Set(["1.1.1.1"]),
      deviceFingerprints: new Set(["fp1"]),
      firstSeen: oldDate,
      lastSeen: new Date(),
    });
    const result = await ai.analyzeUserFraud(userId);
    expect(result).not.toBeNull();
    expect(result!.riskScore).toBeGreaterThan(30);
    expect(result!.fraudType).toBe("bot_activity");
  });

  it("should detect mass following on new account", async () => {
    const ai = new FraudDetectionAI();
    const userId = 888;
    const newDate = new Date(Date.now() - 3 * 86400000); // 3 days old
    (ai as any).behaviorProfiles.set(userId, {
      loginCount: 5,
      postCount: 10,
      likeCount: 50,
      followCount: 1500, // Mass following
      reportCount: 0,
      avgTimeBetweenActions: 0,
      ipAddresses: new Set(["2.2.2.2"]),
      deviceFingerprints: new Set(["fp2"]),
      firstSeen: newDate,
      lastSeen: new Date(),
    });
    const result = await ai.analyzeUserFraud(userId);
    expect(result).not.toBeNull();
    expect(result!.signals.some((s: string) => s.includes("following"))).toBe(true);
  });

  it("should detect wash trading patterns", async () => {
    const ai = new FraudDetectionAI();
    const userId = 777;
    const singleCounterparty = 778;
    const trades = Array.from({ length: 8 }, (_, i) => ({
      buyerId: i % 2 === 0 ? userId : singleCounterparty,
      sellerId: i % 2 === 0 ? singleCounterparty : userId,
      amount: 100,
      timestamp: new Date(Date.now() - i * 3600000),
    }));
    const result = await ai.detectWashTrading(userId, trades);
    expect(result.isWashTrading).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.patterns.length).toBeGreaterThan(0);
  });

  it("should return high risk users list", async () => {
    const ai = new FraudDetectionAI();
    const highRiskUsers = await ai.getHighRiskUsers(70);
    expect(Array.isArray(highRiskUsers)).toBe(true);
  });
});

describe("SentimentAnalysisAI", () => {
  let SentimentAnalysisAI: any;

  beforeEach(async () => {
    const module = await import("./ai-core");
    SentimentAnalysisAI = module.SentimentAnalysisAI;
  });

  it("should analyze positive sentiment for short text", async () => {
    const ai = new SentimentAnalysisAI();
    const result = await ai.analyzeSentiment("This is amazing! Love it! 🚀");
    expect(result).toBeDefined();
    expect(result.text).toBe("This is amazing! Love it! 🚀");
    expect(["very_positive", "positive", "neutral", "negative", "very_negative"]).toContain(result.label);
    expect(result.score).toBeGreaterThanOrEqual(-1);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("should analyze negative sentiment for short text", async () => {
    const ai = new SentimentAnalysisAI();
    const result = await ai.analyzeSentiment("This is terrible and broken. Worst experience ever.");
    expect(["negative", "very_negative"]).toContain(result.label);
    expect(result.score).toBeLessThan(0);
  });

  it("should return neutral for empty-ish text", async () => {
    const ai = new SentimentAnalysisAI();
    const result = await ai.analyzeSentiment("ok");
    expect(result.label).toBe("neutral");
  });

  it("should analyze community health", async () => {
    const ai = new SentimentAnalysisAI();
    const messages = [
      "Great community! Love everyone here.",
      "Thanks for the help!",
      "This is awesome content.",
    ];
    const result = await ai.analyzeCommunityHealth(messages);
    expect(result.overallSentiment).toBeDefined();
    expect(result.toxicityRate).toBeGreaterThanOrEqual(0);
    expect(result.positivityRate).toBeGreaterThanOrEqual(0);
    expect(["low", "medium", "high"]).toContain(result.engagementQuality);
    expect(Array.isArray(result.alerts)).toBe(true);
  });

  it("should handle empty messages array", async () => {
    const ai = new SentimentAnalysisAI();
    const result = await ai.analyzeCommunityHealth([]);
    expect(result.overallSentiment).toBe("neutral");
    expect(result.toxicityRate).toBe(0);
  });
});

describe("PredictiveAnalyticsAI", () => {
  let PredictiveAnalyticsAI: any;

  beforeEach(async () => {
    const module = await import("./ai-core");
    PredictiveAnalyticsAI = module.PredictiveAnalyticsAI;
  });

  it("should predict low churn for active users", async () => {
    const ai = new PredictiveAnalyticsAI();
    const result = await ai.predictChurn({
      userId: 1,
      daysSinceLastLogin: 1,
      weeklyPostCount: 5,
      weeklyEngagementCount: 50,
      subscriptionStatus: "active",
      reportCount: 0,
      accountAgeDays: 365,
    });
    expect(result.riskLevel).toBe("low");
    expect(result.churnProbability).toBeLessThan(0.25);
    expect(result.userId).toBe(1);
  });

  it("should predict high churn for inactive users", async () => {
    const ai = new PredictiveAnalyticsAI();
    const result = await ai.predictChurn({
      userId: 2,
      daysSinceLastLogin: 45,
      weeklyPostCount: 0,
      weeklyEngagementCount: 0,
      subscriptionStatus: "expired",
      reportCount: 2,
      accountAgeDays: 30,
    });
    expect(["high", "critical"]).toContain(result.riskLevel);
    expect(result.churnProbability).toBeGreaterThan(0.5);
    expect(result.retentionActions.length).toBeGreaterThan(0);
  });

  it("should generate 12-month revenue forecast", async () => {
    const ai = new PredictiveAnalyticsAI();
    const forecast = await ai.forecastRevenue({
      currentMRR: 10000,
      growthRate: 0.1,
      churnRate: 0.05,
      newUserAcquisitionRate: 0.15,
      avgRevenuePerUser: 9.99,
    });
    expect(forecast).toHaveLength(12);
    expect(forecast[0].month).toBe(1);
    expect(forecast[11].month).toBe(12);
    expect(forecast[0].mrr).toBeGreaterThan(0);
    expect(forecast[0].arr).toBe(forecast[0].mrr * 12);
  });

  it("should show revenue growth over 12 months with positive growth rate", async () => {
    const ai = new PredictiveAnalyticsAI();
    const forecast = await ai.forecastRevenue({
      currentMRR: 5000,
      growthRate: 0.2,
      churnRate: 0.02,
      newUserAcquisitionRate: 0.25,
      avgRevenuePerUser: 15,
    });
    // Revenue should grow over time with positive acquisition > churn
    expect(forecast[11].mrr).toBeGreaterThan(forecast[0].mrr);
  });
});

describe("ContentSummaryAI", () => {
  let ContentSummaryAI: any;

  beforeEach(async () => {
    const module = await import("./ai-core");
    ContentSummaryAI = module.ContentSummaryAI;
  });

  it("should return short text as-is", async () => {
    const ai = new ContentSummaryAI();
    const shortText = "Hello world";
    const result = await ai.summarizePost(shortText);
    expect(result.summary).toBe(shortText);
    expect(result.originalLength).toBe(shortText.length);
  });

  it("should summarize long posts", async () => {
    const ai = new ContentSummaryAI();
    const longText = "This is a very long post. ".repeat(20);
    const result = await ai.summarizePost(longText);
    expect(result.originalLength).toBe(longText.length);
    expect(result.summary).toBeDefined();
    expect(result.readingTimeSeconds).toBeGreaterThan(0);
  });

  it("should summarize thread of messages", async () => {
    const ai = new ContentSummaryAI();
    const messages = [
      { authorId: 1, content: "First message in thread", timestamp: new Date() },
      { authorId: 2, content: "Reply to first message", timestamp: new Date() },
      { authorId: 1, content: "Thanks for the reply!", timestamp: new Date() },
    ];
    const result = await ai.summarizeThread(messages);
    expect(result).toBeDefined();
    expect(result.originalLength).toBeGreaterThan(0);
  });
});

// ─── OPERATIONS CORE TESTS ────────────────────────────────────────────────────

describe("SupportTicketService", () => {
  let SupportTicketService: any;

  beforeEach(async () => {
    const module = await import("./operations-core");
    SupportTicketService = module.SupportTicketService;
  });

  it("should create a support ticket with auto-priority", async () => {
    const svc = new SupportTicketService();
    const ticket = await svc.createTicket({
      userId: 1,
      category: "technical",
      subject: "App crashes on login",
      description: "The app crashes every time I try to log in from mobile",
    });
    expect(ticket.id).toMatch(/^TKT-/);
    expect(ticket.userId).toBe(1);
    expect(ticket.status).toBe("open");
    expect(ticket.priority).toBeDefined();
    expect(ticket.slaDeadline).toBeInstanceOf(Date);
    expect(ticket.messages).toHaveLength(1);
  });

  it("should auto-prioritize safety tickets as high", async () => {
    const svc = new SupportTicketService();
    const ticket = await svc.createTicket({
      userId: 2,
      category: "safety",
      subject: "Harassment report",
      description: "User is harassing me repeatedly",
    });
    expect(ticket.priority).toBe("urgent");
  });

  it("should auto-prioritize legal tickets as critical", async () => {
    const svc = new SupportTicketService();
    const ticket = await svc.createTicket({
      userId: 3,
      category: "legal",
      subject: "Copyright infringement",
      description: "My content is being used without permission",
    });
    expect(ticket.priority).toBe("critical");
  });

  it("should reply to a ticket and update status", async () => {
    const svc = new SupportTicketService();
    const ticket = await svc.createTicket({
      userId: 1,
      category: "billing",
      subject: "Charge issue",
      description: "I was charged twice for my subscription",
    });

    const reply = await svc.replyToTicket(ticket.id, {
      authorId: 100, // Staff agent
      isStaff: true,
      content: "We are looking into this issue right away.",
    });

    expect(reply).not.toBeNull();
    expect(reply!.isStaff).toBe(true);
    expect(reply!.content).toBe("We are looking into this issue right away.");

    const updatedTickets = await svc.getUserTickets(1);
    const updated = updatedTickets.find((t: any) => t.id === ticket.id);
    expect(updated?.status).toBe("in_progress");
    expect(updated?.firstResponseAt).toBeDefined();
  });

  it("should return null when replying to non-existent ticket", async () => {
    const svc = new SupportTicketService();
    const result = await svc.replyToTicket("TKT-NONEXISTENT", {
      authorId: 1,
      isStaff: false,
      content: "Test",
    });
    expect(result).toBeNull();
  });

  it("should update ticket status", async () => {
    const svc = new SupportTicketService();
    const ticket = await svc.createTicket({
      userId: 1,
      category: "account",
      subject: "Account locked",
      description: "Cannot access my account",
    });
    const success = await svc.updateTicketStatus(ticket.id, "resolved", 100);
    expect(success).toBe(true);
    const tickets = await svc.getUserTickets(1);
    const resolved = tickets.find((t: any) => t.id === ticket.id);
    expect(resolved?.status).toBe("resolved");
    expect(resolved?.resolvedAt).toBeDefined();
  });

  it("should assign ticket to agent", async () => {
    const svc = new SupportTicketService();
    const ticket = await svc.createTicket({
      userId: 1,
      category: "other",
      subject: "General question",
      description: "How do I change my username?",
    });
    const success = await svc.assignTicket(ticket.id, 200);
    expect(success).toBe(true);
    const tickets = await svc.getUserTickets(1);
    const assigned = tickets.find((t: any) => t.id === ticket.id);
    expect(assigned?.assignedTo).toBe(200);
  });

  it("should get ticket queue sorted by priority", async () => {
    const svc = new SupportTicketService();
    await svc.createTicket({ userId: 1, category: "other", subject: "Low priority", description: "Not urgent at all" });
    await svc.createTicket({ userId: 2, category: "safety", subject: "Urgent safety", description: "Critical safety issue" });
    const queue = await svc.getTicketQueue({ limit: 10 });
    expect(queue.length).toBeGreaterThan(0);
    // Safety tickets should be higher priority
    const safetyIdx = queue.findIndex((t: any) => t.category === "safety");
    const otherIdx = queue.findIndex((t: any) => t.category === "other");
    if (safetyIdx !== -1 && otherIdx !== -1) {
      expect(safetyIdx).toBeLessThanOrEqual(otherIdx);
    }
  });

  it("should return ticket stats", async () => {
    const svc = new SupportTicketService();
    await svc.createTicket({ userId: 1, category: "technical", subject: "Bug report", description: "Found a bug in the app" });
    const stats = await svc.getTicketStats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.byStatus).toBeDefined();
    expect(stats.byPriority).toBeDefined();
    expect(stats.avgResolutionHours).toBeGreaterThanOrEqual(0);
    expect(stats.slaBreaches).toBeGreaterThanOrEqual(0);
  });

  it("should have correct SLA deadlines per priority", () => {
    const svc = new SupportTicketService();
    expect(svc.SLA_HOURS.urgent).toBe(1);
    expect(svc.SLA_HOURS.critical).toBe(4);
    expect(svc.SLA_HOURS.high).toBe(8);
    expect(svc.SLA_HOURS.medium).toBe(24);
    expect(svc.SLA_HOURS.low).toBe(72);
  });
});

describe("AuditLogService", () => {
  let AuditLogService: any;

  beforeEach(async () => {
    const module = await import("./operations-core");
    AuditLogService = module.AuditLogService;
  });

  it("should log an audit entry", async () => {
    const svc = new AuditLogService();
    const entry = await svc.log({
      action: "user.login",
      actorId: 1,
      actorType: "user",
      ipAddress: "192.168.1.1",
      details: { browser: "Chrome" },
    });
    expect(entry.id).toMatch(/^audit_/);
    expect(entry.action).toBe("user.login");
    expect(entry.actorId).toBe(1);
    expect(entry.isSuccessful).toBe(true);
    expect(entry.timestamp).toBeInstanceOf(Date);
  });

  it("should log failed actions", async () => {
    const svc = new AuditLogService();
    const entry = await svc.log({
      action: "payment.fail",
      actorId: 2,
      isSuccessful: false,
      errorMessage: "Insufficient funds",
      severity: "warning",
    });
    expect(entry.isSuccessful).toBe(false);
    expect(entry.errorMessage).toBe("Insufficient funds");
    expect(entry.severity).toBe("warning");
  });

  it("should query logs by actor", async () => {
    const svc = new AuditLogService();
    await svc.log({ action: "user.login", actorId: 10 });
    await svc.log({ action: "post.create", actorId: 10 });
    await svc.log({ action: "user.login", actorId: 20 });

    const { entries, total } = await svc.query({ actorId: 10 });
    expect(total).toBe(2);
    expect(entries.every((e: any) => e.actorId === 10)).toBe(true);
  });

  it("should query logs by action type", async () => {
    const svc = new AuditLogService();
    await svc.log({ action: "user.login", actorId: 1 });
    await svc.log({ action: "user.login", actorId: 2 });
    await svc.log({ action: "post.create", actorId: 1 });

    const { entries, total } = await svc.query({ action: "user.login" as any });
    expect(total).toBe(2);
    expect(entries.every((e: any) => e.action === "user.login")).toBe(true);
  });

  it("should query logs by severity", async () => {
    const svc = new AuditLogService();
    await svc.log({ action: "admin.action", actorId: 1, severity: "critical" });
    await svc.log({ action: "user.login", actorId: 2, severity: "info" });

    const { entries } = await svc.query({ severity: "critical" });
    expect(entries.every((e: any) => e.severity === "critical")).toBe(true);
  });

  it("should get user activity history", async () => {
    const svc = new AuditLogService();
    await svc.log({ action: "user.login", actorId: 5 });
    await svc.log({ action: "post.create", actorId: 5 });
    await svc.log({ action: "post.create", actorId: 6 }); // Different user

    const activity = await svc.getUserActivity(5, 30);
    expect(activity.every((e: any) => e.actorId === 5)).toBe(true);
  });

  it("should get security events", async () => {
    const svc = new AuditLogService();
    await svc.log({ action: "admin.action", actorId: 1, severity: "critical" });
    await svc.log({ action: "user.login", actorId: 2, severity: "info" });

    const events = await svc.getSecurityEvents(24);
    expect(events.every((e: any) => e.severity === "critical")).toBe(true);
  });

  it("should export logs as CSV", async () => {
    const svc = new AuditLogService();
    await svc.log({ action: "user.login", actorId: 1 });
    const csv = await svc.exportLogs({
      from: new Date(Date.now() - 86400000),
      to: new Date(),
      format: "csv",
    });
    expect(typeof csv).toBe("string");
    expect(csv).toContain("action");
    expect(csv).toContain("actorId");
  });

  it("should export logs as JSON", async () => {
    const svc = new AuditLogService();
    await svc.log({ action: "post.create", actorId: 1 });
    const json = await svc.exportLogs({
      from: new Date(Date.now() - 86400000),
      to: new Date(),
      format: "json",
    });
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it("should respect pagination in queries", async () => {
    const svc = new AuditLogService();
    for (let i = 0; i < 10; i++) {
      await svc.log({ action: "user.login", actorId: i + 1 });
    }
    const { entries } = await svc.query({ limit: 5, offset: 0 });
    expect(entries.length).toBeLessThanOrEqual(5);
  });
});

describe("CreatorPayoutService", () => {
  let CreatorPayoutService: any;

  beforeEach(async () => {
    const module = await import("./operations-core");
    CreatorPayoutService = module.CreatorPayoutService;
  });

  it("should have correct minimum payout threshold", () => {
    const svc = new CreatorPayoutService();
    expect(svc.MINIMUM_PAYOUT_USD).toBe(50);
    expect(svc.PLATFORM_FEE_PERCENT).toBe(20);
  });

  it("should add earnings to creator balance", async () => {
    const svc = new CreatorPayoutService();
    await svc.addEarnings(1, 100, "subscriptions");
    await svc.addEarnings(1, 50, "tips");
    const balance = await svc.getPendingBalance(1);
    expect(balance).toBe(150);
  });

  it("should reject payout below minimum threshold", async () => {
    const svc = new CreatorPayoutService();
    await svc.addEarnings(2, 30, "tips"); // Below $50 minimum
    const payout = await svc.requestPayout({
      creatorId: 2,
      method: "paypal",
      periodStart: new Date(Date.now() - 86400000 * 30),
      periodEnd: new Date(),
      breakdown: { subscriptions: 0, tips: 30, gifts: 0, premiumContent: 0, affiliates: 0, platformFee: 0, taxWithheld: 0, netAmount: 0 },
    });
    expect(payout).toBeNull();
  });

  it("should create payout with platform fee deduction", async () => {
    const svc = new CreatorPayoutService();
    await svc.addEarnings(3, 200, "subscriptions");
    const payout = await svc.requestPayout({
      creatorId: 3,
      method: "bank_transfer",
      periodStart: new Date(Date.now() - 86400000 * 30),
      periodEnd: new Date(),
      breakdown: { subscriptions: 200, tips: 0, gifts: 0, premiumContent: 0, affiliates: 0, platformFee: 0, taxWithheld: 0, netAmount: 0 },
    });
    expect(payout).not.toBeNull();
    expect(payout!.id).toMatch(/^PAY-/);
    expect(payout!.status).toBe("pending");
    expect(payout!.breakdown.platformFee).toBe(40); // 20% of 200
    expect(payout!.breakdown.netAmount).toBe(160); // 200 - 40
  });

  it("should clear balance after payout request", async () => {
    const svc = new CreatorPayoutService();
    await svc.addEarnings(4, 100, "tips");
    await svc.requestPayout({
      creatorId: 4,
      method: "paypal",
      periodStart: new Date(Date.now() - 86400000 * 30),
      periodEnd: new Date(),
      breakdown: { subscriptions: 0, tips: 100, gifts: 0, premiumContent: 0, affiliates: 0, platformFee: 0, taxWithheld: 0, netAmount: 0 },
    });
    const balance = await svc.getPendingBalance(4);
    expect(balance).toBe(0);
  });

  it("should require tax form for earnings over $600", async () => {
    const svc = new CreatorPayoutService();
    await svc.addEarnings(5, 700, "subscriptions");
    const payout = await svc.requestPayout({
      creatorId: 5,
      method: "bank_transfer",
      periodStart: new Date(Date.now() - 86400000 * 30),
      periodEnd: new Date(),
      breakdown: { subscriptions: 700, tips: 0, gifts: 0, premiumContent: 0, affiliates: 0, platformFee: 0, taxWithheld: 0, netAmount: 0 },
    });
    expect(payout!.taxFormRequired).toBe(true);
  });

  it("should process a payout", async () => {
    const svc = new CreatorPayoutService();
    await svc.addEarnings(6, 100, "tips");
    const payout = await svc.requestPayout({
      creatorId: 6,
      method: "paypal",
      periodStart: new Date(Date.now() - 86400000 * 30),
      periodEnd: new Date(),
      breakdown: { subscriptions: 0, tips: 100, gifts: 0, premiumContent: 0, affiliates: 0, platformFee: 0, taxWithheld: 0, netAmount: 0 },
    });
    const success = await svc.processPayout(payout!.id);
    expect(success).toBe(true);
  });

  it("should get creator payout history", async () => {
    const svc = new CreatorPayoutService();
    await svc.addEarnings(7, 100, "tips");
    await svc.requestPayout({
      creatorId: 7,
      method: "paypal",
      periodStart: new Date(Date.now() - 86400000 * 30),
      periodEnd: new Date(),
      breakdown: { subscriptions: 0, tips: 100, gifts: 0, premiumContent: 0, affiliates: 0, platformFee: 0, taxWithheld: 0, netAmount: 0 },
    });
    const history = await svc.getCreatorPayouts(7);
    expect(history.length).toBe(1);
    expect(history[0].creatorId).toBe(7);
  });
});

describe("ComplianceService", () => {
  let ComplianceService: any;

  beforeEach(async () => {
    const module = await import("./operations-core");
    ComplianceService = module.ComplianceService;
  });

  it("should submit GDPR data export request", async () => {
    const svc = new ComplianceService();
    const record = await svc.submitGDPRRequest(1, "data_export");
    expect(record.id).toMatch(/^COMP-/);
    expect(record.userId).toBe(1);
    expect(record.type).toBe("gdpr_request");
    expect(record.status).toBe("pending");
    expect(record.details.requestType).toBe("data_export");
  });

  it("should submit GDPR deletion request with correct article", async () => {
    const svc = new ComplianceService();
    const record = await svc.submitGDPRRequest(2, "data_deletion");
    expect(record.details.gdprArticle).toBe("Article 17");
  });

  it("should submit CCPA opt-out request", async () => {
    const svc = new ComplianceService();
    const record = await svc.submitCCPARequest(3, "opt_out");
    expect(record.type).toBe("ccpa_request");
    expect(record.details.requestType).toBe("opt_out");
  });

  it("should process a compliance request", async () => {
    const svc = new ComplianceService();
    const record = await svc.submitGDPRRequest(4, "data_export");
    const success = await svc.processRequest(record.id, 100, "Data exported and sent via email");
    expect(success).toBe(true);
    const history = await svc.getUserComplianceHistory(4);
    expect(history[0].status).toBe("completed");
    expect(history[0].handledBy).toBe(100);
  });

  it("should return false for non-existent request", async () => {
    const svc = new ComplianceService();
    const success = await svc.processRequest("COMP-NONEXISTENT", 100);
    expect(success).toBe(false);
  });

  it("should get pending requests", async () => {
    const svc = new ComplianceService();
    await svc.submitGDPRRequest(5, "data_deletion");
    await svc.submitCCPARequest(6, "data_access");
    const pending = await svc.getPendingRequests();
    expect(pending.length).toBeGreaterThanOrEqual(2);
    expect(pending.every((r: any) => r.status === "pending")).toBe(true);
  });

  it("should return compliance stats", async () => {
    const svc = new ComplianceService();
    await svc.submitGDPRRequest(7, "data_export");
    await svc.submitCCPARequest(8, "opt_out");
    const stats = await svc.getComplianceStats();
    expect(stats.pendingGDPR).toBeGreaterThanOrEqual(1);
    expect(stats.pendingCCPA).toBeGreaterThanOrEqual(1);
    expect(stats.avgResolutionDays).toBeGreaterThanOrEqual(0);
  });
});

describe("IncidentResponseService", () => {
  let IncidentResponseService: any;

  beforeEach(async () => {
    const module = await import("./operations-core");
    IncidentResponseService = module.IncidentResponseService;
  });

  it("should create an incident", async () => {
    const svc = new IncidentResponseService();
    const incident = await svc.createIncident({
      title: "Database connection issues",
      description: "Users are experiencing slow load times due to DB issues",
      severity: "p1_major",
      affectedSystems: ["database", "api"],
      createdBy: 1,
      affectedUserCount: 5000,
    });
    expect(incident.id).toMatch(/^INC-/);
    expect(incident.status).toBe("investigating");
    expect(incident.severity).toBe("p1_major");
    expect(incident.updates).toHaveLength(1);
    expect(incident.affectedUserCount).toBe(5000);
  });

  it("should update incident status", async () => {
    const svc = new IncidentResponseService();
    const incident = await svc.createIncident({
      title: "API timeout",
      description: "API endpoints timing out",
      severity: "p2_moderate",
      affectedSystems: ["api"],
      createdBy: 1,
    });

    const updated = await svc.updateIncident(incident.id, {
      status: "identified",
      message: "Root cause identified: memory leak in API server",
      authorId: 1,
      rootCause: "Memory leak in stream handler",
    });

    expect(updated!.status).toBe("identified");
    expect(updated!.rootCause).toBe("Memory leak in stream handler");
    expect(updated!.updates).toHaveLength(2);
  });

  it("should set end time and duration when resolved", async () => {
    const svc = new IncidentResponseService();
    const incident = await svc.createIncident({
      title: "CDN outage",
      description: "CDN nodes down",
      severity: "p0_critical",
      affectedSystems: ["cdn"],
      createdBy: 1,
    });

    const resolved = await svc.updateIncident(incident.id, {
      status: "resolved",
      message: "CDN nodes restored",
      authorId: 1,
      resolution: "Restarted CDN edge nodes",
    });

    expect(resolved!.endTime).toBeDefined();
    expect(resolved!.duration).toBeGreaterThanOrEqual(0);
  });

  it("should get active incidents", async () => {
    const svc = new IncidentResponseService();
    await svc.createIncident({ title: "Active 1", description: "Desc", severity: "p2_moderate", affectedSystems: ["api"], createdBy: 1 });
    await svc.createIncident({ title: "Active 2", description: "Desc", severity: "p1_major", affectedSystems: ["db"], createdBy: 1 });
    const active = await svc.getActiveIncidents();
    expect(active.length).toBeGreaterThanOrEqual(2);
    // Should be sorted by severity (p0 first)
    const severityOrder = ["p0_critical", "p1_major", "p2_moderate", "p3_minor"];
    for (let i = 1; i < active.length; i++) {
      expect(severityOrder.indexOf(active[i-1].severity)).toBeLessThanOrEqual(severityOrder.indexOf(active[i].severity));
    }
  });

  it("should calculate MTTR", async () => {
    const svc = new IncidentResponseService();
    const incident = await svc.createIncident({ title: "Test", description: "Test", severity: "p3_minor", affectedSystems: [], createdBy: 1 });
    await svc.updateIncident(incident.id, { status: "resolved", message: "Fixed", authorId: 1 });
    const mttr = await svc.getMTTR();
    expect(mttr).toBeGreaterThanOrEqual(0);
  });

  it("should return null for non-existent incident update", async () => {
    const svc = new IncidentResponseService();
    const result = await svc.updateIncident("INC-NONEXISTENT", { status: "resolved", message: "test", authorId: 1 });
    expect(result).toBeNull();
  });
});

describe("TaxReportingService", () => {
  let TaxReportingService: any;

  beforeEach(async () => {
    const module = await import("./operations-core");
    TaxReportingService = module.TaxReportingService;
  });

  it("should generate 1099-K for high earners", async () => {
    const svc = new TaxReportingService();
    const report = await svc.generateAnnualReport({
      userId: 1,
      taxYear: 2025,
      country: "US",
      totalIncome: 25000,
      platformFees: 5000,
      transactionCount: 250,
    });
    expect(report.reportType).toBe("1099-K");
    expect(report.netIncome).toBe(20000);
    expect(report.taxYear).toBe(2025);
  });

  it("should generate summary for low earners", async () => {
    const svc = new TaxReportingService();
    const report = await svc.generateAnnualReport({
      userId: 2,
      taxYear: 2025,
      country: "US",
      totalIncome: 500,
      platformFees: 100,
      transactionCount: 50,
    });
    expect(report.reportType).toBe("summary");
  });

  it("should calculate EU VAT correctly", async () => {
    const svc = new TaxReportingService();
    const german = await svc.calculateVAT(100, "DE");
    expect(german.vatRate).toBe(0.19);
    expect(german.vatAmount).toBe(19);
    expect(german.totalWithVAT).toBe(119);

    const french = await svc.calculateVAT(100, "FR");
    expect(french.vatRate).toBe(0.20);
    expect(french.vatAmount).toBe(20);
  });

  it("should return 0 VAT for US", async () => {
    const svc = new TaxReportingService();
    const us = await svc.calculateVAT(100, "US");
    expect(us.vatRate).toBe(0);
    expect(us.vatAmount).toBe(0);
    expect(us.totalWithVAT).toBe(100);
  });

  it("should get user tax reports", async () => {
    const svc = new TaxReportingService();
    await svc.generateAnnualReport({ userId: 3, taxYear: 2024, country: "US", totalIncome: 1000, platformFees: 200, transactionCount: 100 });
    await svc.generateAnnualReport({ userId: 3, taxYear: 2025, country: "US", totalIncome: 2000, platformFees: 400, transactionCount: 200 });
    const reports = await svc.getUserTaxReports(3);
    expect(reports.length).toBe(2);
    expect(reports[0].taxYear).toBeGreaterThan(reports[1].taxYear); // Sorted desc
  });
});

describe("PartnerService", () => {
  let PartnerService: any;

  beforeEach(async () => {
    const module = await import("./operations-core");
    PartnerService = module.PartnerService;
  });

  it("should create a partner account", async () => {
    const svc = new PartnerService();
    const partner = await svc.createPartner({
      userId: 1,
      companyName: "Acme Corp",
      partnerType: "affiliate",
      contactEmail: "partner@acme.com",
      revenueSharePercent: 15,
    });
    expect(partner.id).toMatch(/^PARTNER-/);
    expect(partner.status).toBe("pending");
    expect(partner.apiKey).toMatch(/^sk_live_/);
    expect(partner.revenueSharePercent).toBe(15);
    expect(partner.apiCallLimit).toBe(10000);
  });

  it("should approve a partner", async () => {
    const svc = new PartnerService();
    const partner = await svc.createPartner({
      userId: 2,
      companyName: "Beta Inc",
      partnerType: "integration",
      contactEmail: "dev@beta.com",
    });
    const success = await svc.approvePartner(partner.id);
    expect(success).toBe(true);
    const active = await svc.getActivePartners();
    expect(active.some((p: any) => p.id === partner.id)).toBe(true);
  });

  it("should validate API key for active partner", async () => {
    const svc = new PartnerService();
    const partner = await svc.createPartner({
      userId: 3,
      companyName: "Gamma Ltd",
      partnerType: "reseller",
      contactEmail: "api@gamma.com",
    });
    await svc.approvePartner(partner.id);
    const validated = await svc.validateAPIKey(partner.apiKey);
    expect(validated).not.toBeNull();
    expect(validated!.id).toBe(partner.id);
  });

  it("should reject invalid API key", async () => {
    const svc = new PartnerService();
    const result = await svc.validateAPIKey("sk_live_invalid_key_123");
    expect(result).toBeNull();
  });

  it("should reject API key for pending partner", async () => {
    const svc = new PartnerService();
    const partner = await svc.createPartner({
      userId: 4,
      companyName: "Delta Co",
      partnerType: "enterprise",
      contactEmail: "enterprise@delta.com",
    });
    // Not approved yet
    const result = await svc.validateAPIKey(partner.apiKey);
    expect(result).toBeNull();
  });
});

// ─── MEDIA CORE TESTS ─────────────────────────────────────────────────────────

describe("MediaCore", () => {
  it("should generate upload URL", async () => {
    const { mediaCore } = await import("./core-facades");
    const result = await mediaCore.generateUploadUrl({
      userId: 1,
      fileName: "test-video.mp4",
      fileSize: 1024 * 1024 * 50, // 50MB
      mimeType: "video/mp4",
      mediaType: "video",
    });
    expect(result.uploadId).toBeDefined();
    expect(result.uploadUrl).toContain("https://");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it("should reject oversized files", async () => {
    const { mediaCore } = await import("./core-facades");
    await expect(mediaCore.generateUploadUrl({
      userId: 1,
      fileName: "huge-video.mp4",
      fileSize: 1024 * 1024 * 1024 * 10, // 10GB
      mimeType: "video/mp4",
      mediaType: "video",
    })).rejects.toThrow();
  });

  it("should confirm upload and start transcoding for video", async () => {
    const { mediaCore } = await import("./core-facades");
    const upload = await mediaCore.generateUploadUrl({
      userId: 1,
      fileName: "stream.mp4",
      fileSize: 1024 * 1024 * 100,
      mimeType: "video/mp4",
      mediaType: "video",
    });
    const confirmed = await mediaCore.confirmUpload(upload.uploadId, 1, `media/1/${upload.uploadId}/stream.mp4`);
    expect(confirmed.status).toBe("processing");
    expect(confirmed.transcodeJobId).toBeDefined();
  });

  it("should get user media library", async () => {
    const { mediaCore } = await import("./core-facades");
    const library = await mediaCore.getUserLibrary(1, undefined, 20, 0);
    expect(Array.isArray(library)).toBe(true);
  });

  it("should get storage usage", async () => {
    const { mediaCore } = await import("./core-facades");
    const usage = await mediaCore.getStorageUsage(1);
    expect(usage.usedBytes).toBeGreaterThanOrEqual(0);
    expect(usage.limitBytes).toBeGreaterThan(0);
    expect(usage.usedPercent).toBeGreaterThanOrEqual(0);
    expect(usage.usedPercent).toBeLessThanOrEqual(100);
  });

  it("should get transcode status", async () => {
    const { mediaCore } = await import("./core-facades");
    const status = await mediaCore.getTranscodeStatus("nonexistent-job");
    expect(status).toBeNull();
  });

  it("should reject unsupported file types", async () => {
    const { mediaCore } = await import("./core-facades");
    await expect(mediaCore.generateUploadUrl({
      userId: 1,
      fileName: "malware.exe",
      fileSize: 1024,
      mimeType: "application/x-executable",
      mediaType: "document",
    })).rejects.toThrow();
  });
});

// ─── STREAMING CORE TESTS ─────────────────────────────────────────────────────

describe("StreamingCore", () => {
  it("should create a stream session", async () => {
    const { streamingCore } = await import("./core-facades");
    const session = await streamingCore.createStreamSession({
      creatorId: 1,
      title: "Gaming Stream #1",
      description: "Playing the latest games",
      category: "gaming",
      tags: ["gaming", "fps"],
    });
    expect(session.id).toBeDefined();
    expect(session.creatorId).toBe(1);
    expect(session.title).toBe("Gaming Stream #1");
    expect(session.status).toBe("scheduled");
  });

  it("should go live with stream session", async () => {
    const { streamingCore } = await import("./core-facades");
    const session = await streamingCore.createStreamSession({ creatorId: 2, title: "Live Now" });
    const liveSession = await streamingCore.goLive(session.id, 2);
    expect(liveSession!.status).toBe("live");
    expect(liveSession!.startedAt).toBeInstanceOf(Date);
    expect(liveSession!.streamKey).toBeDefined();
  });

  it("should reject going live for wrong creator", async () => {
    const { streamingCore } = await import("./core-facades");
    const session = await streamingCore.createStreamSession({ creatorId: 3, title: "My Stream" });
    const result = await streamingCore.goLive(session.id, 999); // Wrong creator
    expect(result).toBeNull();
  });

  it("should end a stream and calculate duration", async () => {
    const { streamingCore } = await import("./core-facades");
    const session = await streamingCore.createStreamSession({ creatorId: 4, title: "Short Stream" });
    await streamingCore.goLive(session.id, 4);
    const ended = await streamingCore.endStream(session.id, 4);
    expect(ended!.status).toBe("ended");
    expect(ended!.endedAt).toBeInstanceOf(Date);
    expect(ended!.duration).toBeGreaterThanOrEqual(0);
  });

  it("should send a gift during stream", async () => {
    const { streamingCore } = await import("./core-facades");
    const session = await streamingCore.createStreamSession({ creatorId: 5, title: "Gift Stream" });
    await streamingCore.goLive(session.id, 5);
    const gift = await streamingCore.sendGift({
      sessionId: session.id,
      senderId: 100,
      giftType: "star",
      quantity: 5,
      message: "Great stream!",
    });
    expect(gift).not.toBeNull();
    expect(gift!.senderId).toBe(100);
    expect(gift!.giftType).toBe("star");
    expect(gift!.quantity).toBe(5);
    expect(gift!.coinValue).toBeGreaterThan(0);
  });

  it("should not send gift to offline stream", async () => {
    const { streamingCore } = await import("./core-facades");
    const session = await streamingCore.createStreamSession({ creatorId: 6, title: "Offline Stream" });
    // Don't go live
    const gift = await streamingCore.sendGift({
      sessionId: session.id,
      senderId: 100,
      giftType: "star",
      quantity: 1,
    });
    expect(gift).toBeNull();
  });

  it("should schedule a future stream", async () => {
    const { streamingCore } = await import("./core-facades");
    const futureDate = new Date(Date.now() + 86400000); // Tomorrow
    const scheduled = await streamingCore.scheduleStream({
      creatorId: 7,
      title: "Tomorrow's Stream",
      scheduledFor: futureDate,
      category: "music",
    });
    expect(scheduled.scheduledFor).toEqual(futureDate);
    expect(scheduled.status).toBe("scheduled");
  });

  it("should get live streams list", async () => {
    const { streamingCore } = await import("./core-facades");
    const session = await streamingCore.createStreamSession({ creatorId: 8, title: "Live Stream Test" });
    await streamingCore.goLive(session.id, 8);
    const live = await streamingCore.getLiveStreams(undefined, 20);
    expect(Array.isArray(live)).toBe(true);
    expect(live.some((s: any) => s.id === session.id)).toBe(true);
  });

  it("should get stream analytics", async () => {
    const { streamingCore } = await import("./core-facades");
    const session = await streamingCore.createStreamSession({ creatorId: 9, title: "Analytics Test" });
    await streamingCore.goLive(session.id, 9);
    const analytics = await streamingCore.getStreamAnalytics(session.id, 9);
    expect(analytics).not.toBeNull();
    expect(analytics!.sessionId).toBe(session.id);
    expect(analytics!.currentViewers).toBeGreaterThanOrEqual(0);
  });

  it("should get creator stream stats", async () => {
    const { streamingCore } = await import("./core-facades");
    const stats = await streamingCore.getCreatorStreamStats(1);
    expect(stats.totalStreams).toBeGreaterThanOrEqual(0);
    expect(stats.totalViewers).toBeGreaterThanOrEqual(0);
    expect(stats.totalGiftsReceived).toBeGreaterThanOrEqual(0);
  });
});

// ─── SOCIAL CORE TESTS ────────────────────────────────────────────────────────

describe("SocialCore", () => {
  it("should get reputation score for new user", async () => {
    const { socialCore } = await import("./core-facades");
    const score = await socialCore.getReputationScore(9999);
    expect(score.userId).toBe(9999);
    expect(score.totalScore).toBeGreaterThanOrEqual(0);
    expect(score.level).toBeDefined();
    expect(score.badges).toBeDefined();
  });

  it("should update reputation score", async () => {
    const { socialCore } = await import("./core-facades");
    await socialCore.updateReputation(1001, "post_created", 10);
    const score = await socialCore.getReputationScore(1001);
    expect(score.totalScore).toBeGreaterThan(0);
  });

  it("should create a reel", async () => {
    const { socialCore } = await import("./core-facades");
    const reel = await socialCore.createReel({
      creatorId: 1,
      videoUrl: "https://cdn.example.com/reel-1.mp4",
      thumbnailUrl: "https://cdn.example.com/thumb-1.jpg",
      caption: "Check out this awesome reel! #gaming #fun",
      duration: 30,
      hashtags: ["gaming", "fun"],
    });
    expect(reel.id).toBeDefined();
    expect(reel.creatorId).toBe(1);
    expect(reel.duration).toBe(30);
    expect(reel.status).toBe("active");
  });

  it("should get reels feed", async () => {
    const { socialCore } = await import("./core-facades");
    await socialCore.createReel({ creatorId: 1, videoUrl: "https://cdn.example.com/r1.mp4", duration: 15 });
    const feed = await socialCore.getReelsFeed(10);
    expect(Array.isArray(feed)).toBe(true);
  });

  it("should get trending topics", async () => {
    const { socialCore } = await import("./core-facades");
    const topics = await socialCore.getTrendingTopics(10);
    expect(Array.isArray(topics)).toBe(true);
  });

  it("should discover creators", async () => {
    const { socialCore } = await import("./core-facades");
    const creators = await socialCore.discoverCreators(10);
    expect(Array.isArray(creators)).toBe(true);
  });

  it("should get friend suggestions", async () => {
    const { socialCore } = await import("./core-facades");
    const suggestions = await socialCore.getFriendSuggestions(1, 5);
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it("should send a voice note", async () => {
    const { socialCore } = await import("./core-facades");
    const voiceNote = await socialCore.sendVoiceNote(1, 2, "https://cdn.example.com/voice-1.mp3", 15);
    expect(voiceNote.senderId).toBe(1);
    expect(voiceNote.recipientId).toBe(2);
    expect(voiceNote.duration).toBe(15);
    expect(voiceNote.audioUrl).toBeDefined();
  });

  it("should record engagement event", async () => {
    const { socialCore } = await import("./core-facades");
    await expect(socialCore.recordEngagement(1, "post-123", "post", "view", 30)).resolves.not.toThrow();
  });
});

// ─── COMMUNITY CORE TESTS ─────────────────────────────────────────────────────

describe("CommunityCore", () => {
  it("should create a server", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({
      ownerId: 1,
      name: "Gaming Hub",
      description: "A community for gamers",
      category: "gaming",
      isPublic: true,
    });
    expect(server.id).toBeDefined();
    expect(server.ownerId).toBe(1);
    expect(server.name).toBe("Gaming Hub");
    expect(server.memberCount).toBe(1); // Owner is first member
    expect(server.channels.length).toBeGreaterThan(0); // Default channels created
  });

  it("should create token-gated server", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({
      ownerId: 2,
      name: "VIP Club",
      tokenGated: true,
      requiredTokenAddress: "0x1234567890abcdef",
      requiredTokenAmount: 100,
    });
    expect(server.tokenGated).toBe(true);
    expect(server.requiredTokenAddress).toBe("0x1234567890abcdef");
  });

  it("should join a public server", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 3, name: "Open Server" });
    const result = await communityCore.joinServer(server.id, 100);
    expect(result.success).toBe(true);
    const stats = await communityCore.getServerStats(server.id);
    expect(stats!.memberCount).toBe(2); // Owner + new member
  });

  it("should reject joining non-existent server", async () => {
    const { communityCore } = await import("./core-facades");
    const result = await communityCore.joinServer("nonexistent-server-id", 100);
    expect(result.success).toBe(false);
  });

  it("should leave a server", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 4, name: "Leave Test" });
    await communityCore.joinServer(server.id, 200);
    const result = await communityCore.leaveServer(server.id, 200);
    expect(result.success).toBe(true);
  });

  it("should not allow owner to leave their server", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 5, name: "Owner Test" });
    const result = await communityCore.leaveServer(server.id, 5);
    expect(result.success).toBe(false);
  });

  it("should create a text channel", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 6, name: "Channel Test" });
    const channel = await communityCore.createChannel({
      serverId: server.id,
      creatorId: 6,
      name: "announcements",
      type: "announcement",
      description: "Official announcements",
    });
    expect(channel).not.toBeNull();
    expect(channel!.name).toBe("announcements");
    expect(channel!.type).toBe("announcement");
  });

  it("should send a message to a channel", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 7, name: "Message Test" });
    const generalChannel = server.channels.find((c: any) => c.name === "general");
    const msg = await communityCore.sendMessage({
      channelId: generalChannel!.id,
      authorId: 7,
      content: "Hello, community!",
    });
    expect(msg).not.toBeNull();
    expect(msg!.content).toBe("Hello, community!");
    expect(msg!.authorId).toBe(7);
  });

  it("should get channel messages", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 8, name: "Get Messages Test" });
    const generalChannel = server.channels.find((c: any) => c.name === "general");
    await communityCore.sendMessage({ channelId: generalChannel!.id, authorId: 8, content: "Message 1" });
    await communityCore.sendMessage({ channelId: generalChannel!.id, authorId: 8, content: "Message 2" });
    const messages = await communityCore.getMessages(generalChannel!.id, 10);
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });

  it("should create a role", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 9, name: "Role Test" });
    const role = await communityCore.createRole({
      serverId: server.id,
      createdBy: 9,
      name: "Moderator",
      color: "#FF5733",
      permissions: ["manage_messages", "kick_members"],
      isHoisted: true,
    });
    expect(role).not.toBeNull();
    expect(role!.name).toBe("Moderator");
    expect(role!.color).toBe("#FF5733");
  });

  it("should assign a role to a member", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 10, name: "Assign Role Test" });
    await communityCore.joinServer(server.id, 300);
    const role = await communityCore.createRole({ serverId: server.id, createdBy: 10, name: "VIP" });
    const result = await communityCore.assignRole(server.id, 300, role!.id, 10);
    expect(result.success).toBe(true);
  });

  it("should generate invite code", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 11, name: "Invite Test" });
    const invite = await communityCore.generateInviteCode(server.id, 11, 10, 24);
    expect(invite.code).toBeDefined();
    expect(invite.code.length).toBeGreaterThan(5);
    expect(invite.maxUses).toBe(10);
    expect(invite.expiresAt).toBeDefined();
  });

  it("should join server via invite code", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 12, name: "Invite Join Test" });
    const invite = await communityCore.generateInviteCode(server.id, 12);
    const result = await communityCore.joinServer(server.id, 400, invite.code);
    expect(result.success).toBe(true);
  });

  it("should get server stats", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 13, name: "Stats Test" });
    const stats = await communityCore.getServerStats(server.id);
    expect(stats).not.toBeNull();
    expect(stats!.memberCount).toBeGreaterThan(0);
    expect(stats!.channelCount).toBeGreaterThan(0);
    expect(stats!.totalMessages).toBeGreaterThanOrEqual(0);
  });

  it("should discover public servers", async () => {
    const { communityCore } = await import("./core-facades");
    await communityCore.createServer({ ownerId: 14, name: "Discoverable Server", isPublic: true, category: "gaming" });
    const servers = await communityCore.discoverServers(undefined, 20);
    expect(Array.isArray(servers)).toBe(true);
    expect(servers.every((s: any) => s.isPublic)).toBe(true);
  });

  it("should moderate a message (delete)", async () => {
    const { communityCore } = await import("./core-facades");
    const server = await communityCore.createServer({ ownerId: 15, name: "Moderation Test" });
    const generalChannel = server.channels.find((c: any) => c.name === "general");
    const msg = await communityCore.sendMessage({ channelId: generalChannel!.id, authorId: 100, content: "Spam message" });
    const result = await communityCore.moderateMessage(server.id, msg!.id, "delete", 15);
    expect(result.success).toBe(true);
  });
});
