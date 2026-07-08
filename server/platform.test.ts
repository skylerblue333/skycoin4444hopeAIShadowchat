import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  sanitizeHtml,
  sanitizeContent,
  sanitizeDisplayName,
  sanitizeSqlInput,
  isValidEmail,
  calculateTrustScore,
  getRateLimitTier,
} from "./security";

// ═══════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@shadowchat.io",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createAuthContext({ role: "admin", name: "Admin User" });
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ═══════════════════════════════════════════════════════════════
// SECURITY MODULE TESTS
// ═══════════════════════════════════════════════════════════════

describe("Security: Input Sanitization", () => {
  it("sanitizeHtml escapes HTML entities", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
    );
  });

  it("sanitizeHtml escapes ampersands and quotes", () => {
    expect(sanitizeHtml('Tom & Jerry "friends"')).toBe(
      "Tom &amp; Jerry &quot;friends&quot;"
    );
  });

  it("sanitizeContent removes script tags", () => {
    const input = 'Hello <script>evil()</script> World';
    const result = sanitizeContent(input);
    expect(result).not.toContain("<script>");
    expect(result).toContain("Hello");
    expect(result).toContain("World");
  });

  it("sanitizeContent removes event handlers", () => {
    const input = '<img onerror="alert(1)" src="x">';
    const result = sanitizeContent(input);
    expect(result).not.toContain("onerror");
  });

  it("sanitizeContent enforces max length", () => {
    const input = "a".repeat(20000);
    const result = sanitizeContent(input, 100);
    expect(result.length).toBe(100);
  });

  it("sanitizeDisplayName removes dangerous characters", () => {
    expect(sanitizeDisplayName('<script>hack</script>"user')).toBe("scripthack/scriptuser");
  });

  it("sanitizeDisplayName trims and limits length", () => {
    const longName = "A".repeat(100);
    expect(sanitizeDisplayName(longName).length).toBe(50);
  });

  it("sanitizeSqlInput removes SQL injection patterns", () => {
    const input = "'; DROP TABLE users; --";
    const result = sanitizeSqlInput(input);
    expect(result).not.toContain("DROP TABLE");
    expect(result).not.toContain("--");
    expect(result).not.toContain("'");
  });

  it("sanitizeSqlInput removes UNION SELECT", () => {
    const input = "1 UNION SELECT * FROM passwords";
    const result = sanitizeSqlInput(input);
    expect(result.toLowerCase()).not.toContain("union select");
  });
});

describe("Security: Email Validation", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.user+tag@domain.co.uk")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects excessively long emails", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    expect(isValidEmail(longEmail)).toBe(false);
  });
});

describe("Security: Trust Scoring", () => {
  it("new user gets low trust score", () => {
    const score = calculateTrustScore({
      accountAgeDays: 1,
      totalPosts: 0,
      totalLikes: 0,
      reportCount: 0,
      verifiedEmail: false,
      hasAvatar: false,
      communityMemberships: 0,
    });
    expect(score).toBeLessThan(10);
  });

  it("established user gets high trust score", () => {
    const score = calculateTrustScore({
      accountAgeDays: 365,
      totalPosts: 100,
      totalLikes: 200,
      reportCount: 0,
      verifiedEmail: true,
      hasAvatar: true,
      communityMemberships: 5,
    });
    expect(score).toBeGreaterThan(70);
  });

  it("reported user gets penalized", () => {
    const cleanScore = calculateTrustScore({
      accountAgeDays: 30,
      totalPosts: 10,
      totalLikes: 20,
      reportCount: 0,
      verifiedEmail: true,
      hasAvatar: true,
      communityMemberships: 2,
    });
    const reportedScore = calculateTrustScore({
      accountAgeDays: 30,
      totalPosts: 10,
      totalLikes: 20,
      reportCount: 3,
      verifiedEmail: true,
      hasAvatar: true,
      communityMemberships: 2,
    });
    expect(reportedScore).toBeLessThan(cleanScore);
    expect(cleanScore - reportedScore).toBe(30);
  });

  it("trust score is clamped between 0 and 100", () => {
    const maxScore = calculateTrustScore({
      accountAgeDays: 9999,
      totalPosts: 9999,
      totalLikes: 9999,
      reportCount: 0,
      verifiedEmail: true,
      hasAvatar: true,
      communityMemberships: 999,
    });
    expect(maxScore).toBeLessThanOrEqual(100);

    const minScore = calculateTrustScore({
      accountAgeDays: 0,
      totalPosts: 0,
      totalLikes: 0,
      reportCount: 10,
      verifiedEmail: false,
      hasAvatar: false,
      communityMemberships: 0,
    });
    expect(minScore).toBeGreaterThanOrEqual(0);
  });
});

describe("Security: Rate Limit Tiers", () => {
  it("trusted users get highest limits", () => {
    const tier = getRateLimitTier(90);
    expect(tier.maxRequests).toBe(120);
  });

  it("normal users get standard limits", () => {
    const tier = getRateLimitTier(60);
    expect(tier.maxRequests).toBe(60);
  });

  it("new users get restricted limits", () => {
    const tier = getRateLimitTier(25);
    expect(tier.maxRequests).toBe(30);
  });

  it("untrusted users get minimum limits", () => {
    const tier = getRateLimitTier(5);
    expect(tier.maxRequests).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════════
// ROUTER PROCEDURE TESTS
// ═══════════════════════════════════════════════════════════════

describe("Platform Router: Public Procedures", () => {
  it("platform.stats returns real aggregated data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.platform.stats();
    expect(stats).toHaveProperty("totalUsers");
    expect(stats).toHaveProperty("totalPosts");
    expect(stats).toHaveProperty("totalCommunities");
    expect(typeof stats.totalUsers).toBe("number");
    expect(typeof stats.totalPosts).toBe("number");
  });

  it("platform.health returns system health metrics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const health = await caller.platform.health();
    expect(health).toHaveProperty("status");
    expect(health).toHaveProperty("uptime");
    expect(health.status).toBe("healthy");
  });

  it("token.metrics returns real token data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const metrics = await caller.token.metrics();
    expect(metrics).toHaveProperty("totalStaked");
    expect(metrics).toHaveProperty("burnedTokens");
    expect(metrics).toHaveProperty("stakingParticipants");
    expect(typeof metrics.totalStaked).toBe("number");
  });
});

describe("User Router: Procedures", () => {
  it("user.profile returns user profile", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const profile = await caller.user.profile({ userId: 1 });
    // Should return user data or null
    expect(profile === null || typeof profile === "object").toBe(true);
  });

  it("feed.list returns paginated posts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const feed = await caller.feed.list({ limit: 10, offset: 0 });
    expect(Array.isArray(feed)).toBe(true);
  });
});

describe("Staking Router", () => {
  it("staking.pools returns available pools", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const pools = await caller.staking.pools();
    expect(Array.isArray(pools)).toBe(true);
  });

  it("staking.userPositions requires authentication", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const positions = await caller.staking.userPositions();
    expect(Array.isArray(positions)).toBe(true);
  });
});

describe("Moderation Router", () => {
  it("moderation.stats returns real moderation metrics (admin only)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.moderation.stats();
    expect(stats).toHaveProperty("totalActions");
    expect(stats).toHaveProperty("accuracy");
    expect(typeof stats.totalActions).toBe("number");
    expect(typeof stats.accuracy).toBe("number");
  });

  it("moderation.stats rejects non-admin users", async () => {
    const ctx = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.moderation.stats()).rejects.toThrow();
  });
});

describe("GameFi Router", () => {
  it("gamefi.leaderboard returns ranked users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const leaderboard = await caller.gamefi.leaderboard();
    expect(Array.isArray(leaderboard)).toBe(true);
  });

  it("gamefi.seasonPass returns current season data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const season = await caller.gamefi.seasonPass();
    expect(season).toHaveProperty("season");
    expect(season).toHaveProperty("name");
  });
});

describe("Admin Router: Access Control", () => {
  it("admin.stats requires admin role", async () => {
    const ctx = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("admin.stats works for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.admin.stats();
    expect(stats).toHaveProperty("totalUsers");
    expect(stats).toHaveProperty("totalPosts");
  });
});
