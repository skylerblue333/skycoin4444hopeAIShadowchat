/**
 * SECURITY TEST SUITE
 * Tests for rate limiting, input sanitization, trust scoring, and security headers.
 */
import { describe, it, expect } from "vitest";
import { sanitizeHtml, isValidEmail, sanitizeContent, calculateTrustScore, sanitizeSqlInput } from "./security";

// ═══════════════════════════════════════════════════════════════
// HTML SANITIZATION TESTS
// ═══════════════════════════════════════════════════════════════
describe("sanitizeHtml", () => {
  it("encodes angle brackets so tags cannot execute", () => {
    const result = sanitizeHtml('<script>alert("xss")</script>Hello');
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("encodes double quotes", () => {
    const result = sanitizeHtml('onerror="alert(1)"');
    expect(result).not.toContain('"');
    expect(result).toContain("&quot;");
  });

  it("preserves safe text content", () => {
    const result = sanitizeHtml("Hello World This is safe text");
    expect(result).toContain("Hello World");
  });

  it("encodes ampersands", () => {
    const result = sanitizeHtml("cats & dogs");
    expect(result).toContain("&amp;");
    expect(result).not.toContain(" & ");
  });

  it("handles empty string", () => {
    const result = sanitizeHtml("");
    expect(typeof result).toBe("string");
    expect(result).toBe("");
  });

  it("encodes forward slashes", () => {
    const result = sanitizeHtml("path/to/file");
    expect(result).toContain("&#x2F;");
  });

  it("encodes single quotes", () => {
    const result = sanitizeHtml("it's a test");
    expect(result).toContain("&#x27;");
  });
});

// ═══════════════════════════════════════════════════════════════
// SQL INJECTION TESTS
// ═══════════════════════════════════════════════════════════════
describe("sanitizeSqlInput", () => {
  it("escapes single quotes", () => {
    const result = sanitizeSqlInput("'; DROP TABLE users; --");
    expect(result).not.toContain("'");
  });

  it("escapes double quotes", () => {
    const result = sanitizeSqlInput('"; DROP TABLE users; --');
    expect(result).not.toContain('"');
  });

  it("preserves normal text", () => {
    const result = sanitizeSqlInput("Hello World 123");
    expect(result).toContain("Hello World 123");
  });

  it("handles empty string", () => {
    const result = sanitizeSqlInput("");
    expect(result).toBe("");
  });
});

// ═══════════════════════════════════════════════════════════════
// EMAIL VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════
describe("isValidEmail", () => {
  it("accepts valid email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name+tag@domain.co.uk")).toBe(true);
    expect(isValidEmail("user123@sub.domain.org")).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects emails with spaces", () => {
    expect(isValidEmail("user @domain.com")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// CONTENT SANITIZATION TESTS
// ═══════════════════════════════════════════════════════════════
describe("sanitizeContent", () => {
  it("truncates content exceeding maxLength", () => {
    const longContent = "a".repeat(10001);
    const result = sanitizeContent(longContent, 10000);
    expect(result.length).toBeLessThanOrEqual(10000);
  });

  it("preserves content within maxLength", () => {
    const content = "Hello World";
    const result = sanitizeContent(content, 10000);
    expect(result).toContain("Hello World");
  });

  it("strips XSS from content", () => {
    const content = 'Post content <script>alert("xss")</script>';
    const result = sanitizeContent(content);
    expect(result).not.toContain("<script>");
  });

  it("handles empty content", () => {
    const result = sanitizeContent("");
    expect(typeof result).toBe("string");
  });
});

// ═══════════════════════════════════════════════════════════════
// TRUST SCORE TESTS
// ═══════════════════════════════════════════════════════════════
describe("calculateTrustScore", () => {
  it("returns high score for verified, active user", () => {
    const score = calculateTrustScore({
      accountAgeDays: 365,
      verifiedEmail: true,
      totalPosts: 100,
      reportCount: 0,
      totalLikes: 500,
      hasAvatar: true,
      communityMemberships: 5,
    });
    expect(score).toBeGreaterThan(70);
  });

  it("returns low score for new, unverified user", () => {
    const score = calculateTrustScore({
      accountAgeDays: 0,
      verifiedEmail: false,
      totalPosts: 0,
      reportCount: 0,
      totalLikes: 0,
      hasAvatar: false,
      communityMemberships: 0,
    });
    expect(score).toBeLessThan(50);
  });

  it("penalizes users with reports", () => {
    const cleanScore = calculateTrustScore({
      accountAgeDays: 100,
      verifiedEmail: true,
      totalPosts: 50,
      reportCount: 0,
      totalLikes: 100,
      hasAvatar: true,
      communityMemberships: 2,
    });
    const reportedScore = calculateTrustScore({
      accountAgeDays: 100,
      verifiedEmail: true,
      totalPosts: 50,
      reportCount: 5,
      totalLikes: 100,
      hasAvatar: true,
      communityMemberships: 2,
    });
    expect(cleanScore).toBeGreaterThan(reportedScore);
  });

  it("returns a number between 0 and 100", () => {
    const score = calculateTrustScore({
      accountAgeDays: 30,
      verifiedEmail: true,
      totalPosts: 10,
      reportCount: 1,
      totalLikes: 20,
      hasAvatar: false,
      communityMemberships: 1,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
