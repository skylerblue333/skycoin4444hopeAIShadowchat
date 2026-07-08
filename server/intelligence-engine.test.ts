/**
 * HOPE AI INTELLIGENCE LAYER — engine test suite
 *
 * Tests the service-layer logic (reputation math, LLM JSON parsing/fallbacks,
 * twin-context formatting) in isolation. The LLM and the DB-intelligence repo
 * are mocked so the suite is deterministic and never hits the network or DB.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Mock the Forge LLM. Individual tests override the resolved value. ───────
const invokeLLMMock = vi.fn();
vi.mock("./_core/llm", () => ({
  invokeLLM: (...args: unknown[]) => invokeLLMMock(...args),
}));

// ─── Mock the repository so no real DB is required. ──────────────────────────
const repoState: {
  signals: Record<string, unknown> | null;
  twin: Record<string, unknown> | null;
  facts: Array<Record<string, unknown>>;
  upserted: Record<string, unknown> | null;
} = { signals: null, twin: null, facts: [], upserted: null };

vi.mock("./db-intelligence", () => ({
  getUserActivitySignals: vi.fn(async () => repoState.signals),
  upsertReputation: vi.fn(async (data: Record<string, unknown>) => {
    repoState.upserted = data;
    return { ...data, id: 1, computedAt: new Date() };
  }),
  ensureTwinMemory: vi.fn(async () => repoState.twin),
  getTwinFacts: vi.fn(async () => repoState.facts),
  listOpportunities: vi.fn(async () => []),
  getExistingMatch: vi.fn(async () => null),
  upsertMatch: vi.fn(async () => undefined),
}));

// Helper to produce an InvokeResult-shaped object.
function llmReturns(content: string) {
  invokeLLMMock.mockResolvedValue({
    id: "test",
    created: 0,
    model: "test",
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
  });
}

let engine: typeof import("./intelligence-engine");

beforeEach(async () => {
  vi.clearAllMocks();
  repoState.signals = null;
  repoState.twin = null;
  repoState.facts = [];
  repoState.upserted = null;
  engine = await import("./intelligence-engine");
});

describe("computeReputation", () => {
  it("returns null when no activity signals exist", async () => {
    repoState.signals = null;
    const result = await engine.computeReputation(42);
    expect(result).toBeNull();
  });

  it("produces bounded 0-100 sub-scores from real signals", async () => {
    repoState.signals = {
      xp: 5000,
      level: 10,
      reputation: 2000,
      followerCount: 1000,
      postCount: 300,
      contributionScore: 200,
      reliabilityScore: 90,
      behaviorScore: 90,
      toxicityScore: 0,
      isCreator: true,
      verified: true,
      missionsTotal: 10,
      missionsCompleted: 8,
      blueprints: 5,
      listings: 6,
      listingSales: 40,
    };
    const result = await engine.computeReputation(42);
    expect(result).not.toBeNull();
    const r = repoState.upserted as Record<string, number>;
    for (const key of ["learningScore", "builderScore", "teachingScore", "communityScore", "trustScore", "overall"]) {
      expect(r[key]).toBeGreaterThanOrEqual(0);
      expect(r[key]).toBeLessThanOrEqual(100);
    }
    // High-activity user should land a strong overall score.
    expect(r.overall).toBeGreaterThan(50);
  });

  it("penalizes toxicity in the trust score", async () => {
    const base = {
      xp: 0, level: 1, reputation: 0, followerCount: 0, postCount: 0,
      contributionScore: 0, isCreator: false, verified: false,
      missionsTotal: 0, missionsCompleted: 0, blueprints: 0, listings: 0, listingSales: 0,
      reliabilityScore: 80, behaviorScore: 80,
    };
    repoState.signals = { ...base, toxicityScore: 0 };
    await engine.computeReputation(1);
    const clean = (repoState.upserted as Record<string, number>).trustScore;
    repoState.signals = { ...base, toxicityScore: 60 };
    await engine.computeReputation(1);
    const toxic = (repoState.upserted as Record<string, number>).trustScore;
    expect(toxic).toBeLessThan(clean);
  });
});

describe("buildTwinContext", () => {
  it("returns empty string when no twin exists", async () => {
    repoState.twin = null;
    const ctx = await engine.buildTwinContext(1);
    expect(ctx).toBe("");
  });

  it("formats goals, projects and facts into a system prompt", async () => {
    repoState.twin = {
      userId: 1,
      summary: "A solo founder learning full-stack dev.",
      goals: [{ id: "g1", title: "Launch SaaS", status: "active", target: "Q3", createdAt: 0 }],
      projects: [{ id: "p1", name: "SkyApp", status: "building", createdAt: 0 }],
      preferences: { tone: "direct" },
      finances: { currency: "$", monthlyTarget: 5000, notes: "bootstrapping" },
      learning: [{ id: "l1", topic: "TypeScript", progress: 60, createdAt: 0 }],
    };
    repoState.facts = [{ id: 1, kind: "goal", content: "Wants to hire a co-founder", source: "chat", confidence: 90, active: true, createdAt: new Date() }];
    const ctx = await engine.buildTwinContext(1);
    expect(ctx).toContain("Launch SaaS");
    expect(ctx).toContain("SkyApp");
    expect(ctx).toContain("TypeScript");
    expect(ctx).toContain("co-founder");
    expect(ctx).toContain("HOPE AI");
  });
});

describe("scoreOpportunity", () => {
  beforeEach(() => {
    repoState.twin = { userId: 1, summary: "Dev", goals: [], projects: [], preferences: {}, finances: {}, learning: [] };
  });

  it("parses LLM JSON and clamps the score", async () => {
    llmReturns('{"score": 87, "reasoning": "Strong skill overlap."}');
    const result = await engine.scoreOpportunity(1, {
      id: 1, postedBy: null, type: "job", title: "Senior Engineer", description: "Build things",
      skills: ["TypeScript"], tags: [], location: null, remote: true, compensation: null, status: "open", createdAt: new Date(),
    } as never);
    expect(result.score).toBe(87);
    expect(result.reasoning).toContain("skill");
  });

  it("falls back gracefully on non-JSON output", async () => {
    llmReturns("the model rambled without json");
    const result = await engine.scoreOpportunity(1, {
      id: 2, postedBy: null, type: "gig", title: "Logo design", description: null,
      skills: [], tags: [], location: null, remote: true, compensation: null, status: "open", createdAt: new Date(),
    } as never);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(typeof result.reasoning).toBe("string");
  });

  it("clamps out-of-range LLM scores", async () => {
    llmReturns('{"score": 250, "reasoning": "overconfident"}');
    const result = await engine.scoreOpportunity(1, {
      id: 3, postedBy: null, type: "mentor", title: "Mentor", description: null,
      skills: [], tags: [], location: null, remote: true, compensation: null, status: "open", createdAt: new Date(),
    } as never);
    expect(result.score).toBe(100);
  });
});

describe("generateMissionSteps", () => {
  it("parses a JSON array of steps and caps at 8", async () => {
    const steps = Array.from({ length: 12 }, (_, i) => ({ title: `Step ${i}`, detail: `Detail ${i}` }));
    llmReturns("```json\n" + JSON.stringify(steps) + "\n```");
    const result = await engine.generateMissionSteps("Learn Mandarin", "language");
    expect(result.length).toBe(8);
    expect(result[0].title).toBe("Step 0");
  });

  it("returns an empty array when the model output is unusable", async () => {
    llmReturns("no steps here");
    const result = await engine.generateMissionSteps("X", "skill");
    expect(result).toEqual([]);
  });
});

describe("generateDailySuggestions", () => {
  it("parses a JSON array of up to 3 suggestions", async () => {
    repoState.twin = { userId: 1, summary: "Founder", goals: [], projects: [], preferences: {}, finances: {}, learning: [] };
    llmReturns('["Ship the MVP landing page", "Reply to 2 unread DMs", "Block 1h for TypeScript practice", "extra ignored"]');
    const result = await engine.generateDailySuggestions(1, { activeMissions: 1, unreadMessages: 2, openGoals: 1, topOpportunity: "Senior Engineer" });
    expect(result.length).toBe(3);
    expect(result[0]).toContain("MVP");
  });

  it("returns an empty array on unusable model output", async () => {
    repoState.twin = { userId: 1, summary: "", goals: [], projects: [], preferences: {}, finances: {}, learning: [] };
    llmReturns("sorry no json");
    const result = await engine.generateDailySuggestions(1, { activeMissions: 0, unreadMessages: 0, openGoals: 0 });
    expect(result).toEqual([]);
  });
});

describe("generateStartup", () => {
  it("parses a full blueprint from JSON", async () => {
    const blueprint = {
      name: "SkyForge",
      tagline: "Build faster",
      businessPlan: { problem: "p", solution: "s", targetMarket: "m", businessModel: "b", revenueStreams: ["x"], competitors: [], moat: "" },
      branding: { vibe: "bold", colorPalette: ["#000"], voice: "v", logoConcept: "l" },
      marketing: { positioning: "p", channels: ["x"], launchTactics: [], firstWeekPlan: [] },
      mvpRoadmap: [{ phase: "P1", items: ["a", "b"] }],
      teamPlan: [{ role: "Founder", focus: "all" }],
    };
    llmReturns(JSON.stringify(blueprint));
    const result = await engine.generateStartup("An app that does X for Y");
    expect(result.name).toBe("SkyForge");
    expect(result.mvpRoadmap[0].phase).toBe("P1");
    expect(result.teamPlan[0].role).toBe("Founder");
  });

  it("returns a safe fallback when the model output is broken", async () => {
    llmReturns("not json at all");
    const result = await engine.generateStartup("A great idea about robots");
    expect(result.name).toBeTruthy();
    expect(Array.isArray(result.mvpRoadmap)).toBe(true);
    expect(result.mvpRoadmap.length).toBeGreaterThan(0);
  });
});
