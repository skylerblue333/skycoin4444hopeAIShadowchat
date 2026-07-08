// ════════════════════════════════════════════════════════════════════════
// HOPE AI Intelligence Layer — service/engine layer
// ────────────────────────────────────────────────────────────────────────
// Business logic only. Controllers (the tRPC router) call into these pure-ish
// services; persistence lives in db-intelligence.ts. Every AI action is real
// (Forge LLM) and traceable — per the HOPE AI rules, reasoning is returned and
// stored, never hidden.
// ════════════════════════════════════════════════════════════════════════
import { invokeLLM } from "./_core/llm";
import * as repo from "./db-intelligence";
import type { Opportunity } from "../drizzle";

// Extract the assistant text content from an invokeLLM result.
function textOf(result: Awaited<ReturnType<typeof invokeLLM>>): string {
  const c = result.choices?.[0]?.message?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c.map(part => (typeof part === "string" ? part : "text" in part ? part.text : "")).join("");
  }
  return "";
}

// Parse JSON out of an LLM response, tolerating code fences / surrounding prose.
function parseJson<T>(raw: string, fallback: T): T {
  const cleaned = raw.replace(/```json/gi, "```").replace(/```/g, "").trim();
  // Try whole string, then the first {...} or [...] block.
  const candidates = [cleaned];
  const objMatch = cleaned.match(/[[{][\s\S]*[\]}]/);
  if (objMatch) candidates.push(objMatch[0]);
  for (const c of candidates) {
    try {
      return JSON.parse(c) as T;
    } catch {
      /* try next */
    }
  }
  return fallback;
}

// ════════════════════════════════════════════════════════════════════════
// 1. DIGITAL TWIN — persistent, DB-grounded context for the HOPE AI chat
// ════════════════════════════════════════════════════════════════════════

// Build a system-prompt string from the user's persisted twin memory + facts.
// This is what makes HOPE AI feel like it *knows* the user across 298 pages.
export async function buildTwinContext(userId: number): Promise<string> {
  const twin = await repo.ensureTwinMemory(userId);
  const facts = await repo.getTwinFacts(userId, 30);
  if (!twin) return "";

  const lines: string[] = [];
  lines.push("You are HOPE AI, the user's personal digital twin and orchestrator across the SKYCOIN4444 ecosystem.");
  lines.push("You have persistent memory of this user. Use it naturally; do not recite it verbatim.");

  if (twin.summary) lines.push(`\nWho they are: ${twin.summary}`);

  const activeGoals = twin.goals.filter(g => g.status !== "done");
  if (activeGoals.length) {
    lines.push("\nCurrent goals:");
    for (const g of activeGoals.slice(0, 8)) lines.push(`- ${g.title}${g.target ? ` (target: ${g.target})` : ""} [${g.status}]`);
  }

  const activeProjects = twin.projects.filter(p => p.status !== "archived");
  if (activeProjects.length) {
    lines.push("\nActive projects:");
    for (const p of activeProjects.slice(0, 8)) lines.push(`- ${p.name} [${p.status}]${p.note ? ` — ${p.note}` : ""}`);
  }

  if (twin.learning.length) {
    lines.push("\nLearning in progress:");
    for (const l of twin.learning.slice(0, 8)) lines.push(`- ${l.topic} (${l.progress}% complete)`);
  }

  if (Object.keys(twin.preferences).length) {
    lines.push("\nPreferences:");
    for (const [k, v] of Object.entries(twin.preferences).slice(0, 10)) lines.push(`- ${k}: ${v}`);
  }

  if (twin.finances && (twin.finances.monthlyTarget || twin.finances.notes)) {
    const f = twin.finances;
    lines.push(`\nFinancial context: ${f.monthlyTarget ? `monthly target ${f.currency ?? "$"}${f.monthlyTarget}. ` : ""}${f.notes ?? ""}`.trim());
  }

  if (facts.length) {
    lines.push("\nThings you've learned about them (most recent first):");
    for (const f of facts.slice(0, 15)) lines.push(`- (${f.kind}) ${f.content}`);
  }

  lines.push("\nWhen the user shares a new durable fact (a goal, project, preference, milestone), acknowledge it. Be concise, warm, and concrete.");
  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════════════
// 2. REPUTATION — deterministic computation from real activity signals
// ════════════════════════════════════════════════════════════════════════
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

export async function computeReputation(userId: number) {
  const s = await repo.getUserActivitySignals(userId);
  if (!s) return null;

  // Each sub-score blends concrete, non-fabricated signals into a 0-100 band.
  const learningScore = clamp(
    Math.min(60, s.missionsCompleted * 12) + Math.min(40, (s.xp ?? 0) / 100),
  );
  const builderScore = clamp(
    Math.min(50, s.blueprints * 15) + Math.min(30, s.listings * 8) + Math.min(20, (s.contributionScore ?? 0) / 5),
  );
  const teachingScore = clamp(
    Math.min(60, s.listingSales * 6) + Math.min(40, (s.isCreator ? 25 : 0) + (s.reputation ?? 0) / 50),
  );
  const communityScore = clamp(
    Math.min(50, (s.followerCount ?? 0) / 5) + Math.min(30, (s.postCount ?? 0) / 3) + Math.min(20, (s.level ?? 1) * 2),
  );
  // Trust starts from platform reliability/behaviour and is penalised by toxicity.
  const trustScore = clamp(
    (s.reliabilityScore ?? 50) * 0.5 + (s.behaviorScore ?? 50) * 0.5 - (s.toxicityScore ?? 0) + (s.verified ? 10 : 0),
  );

  const breakdown: Record<string, number> = {
    missionsCompleted: s.missionsCompleted,
    blueprints: s.blueprints,
    listings: s.listings,
    listingSales: s.listingSales,
    xp: s.xp ?? 0,
    followers: s.followerCount ?? 0,
    posts: s.postCount ?? 0,
  };

  const overall = clamp(
    learningScore * 0.22 + builderScore * 0.24 + teachingScore * 0.18 + communityScore * 0.16 + trustScore * 0.2,
  );

  return repo.upsertReputation({
    userId,
    learningScore,
    builderScore,
    teachingScore,
    communityScore,
    trustScore,
    overall,
    breakdown,
  });
}

// ════════════════════════════════════════════════════════════════════════
// 3. OPPORTUNITY MATCHING — real LLM scoring grounded in twin context
// ════════════════════════════════════════════════════════════════════════
export async function scoreOpportunity(userId: number, opp: Opportunity): Promise<{ score: number; reasoning: string }> {
  const context = await buildTwinContext(userId);
  const skills = (opp.skills as string[] | null) ?? [];
  const tags = (opp.tags as string[] | null) ?? [];

  const prompt = [
    "You are an opportunity-matching engine. Given a user's profile and an opportunity, score the fit from 0-100 and explain briefly.",
    "Return ONLY JSON: {\"score\": <0-100 integer>, \"reasoning\": \"<one or two sentences>\"}.",
    "",
    "USER CONTEXT:",
    context || "(limited profile — score conservatively)",
    "",
    "OPPORTUNITY:",
    `Type: ${opp.type}`,
    `Title: ${opp.title}`,
    opp.description ? `Description: ${opp.description}` : "",
    skills.length ? `Skills needed: ${skills.join(", ")}` : "",
    tags.length ? `Tags: ${tags.join(", ")}` : "",
    opp.location ? `Location: ${opp.location} (remote: ${opp.remote})` : `Remote: ${opp.remote}`,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await invokeLLM({ messages: [{ role: "user", content: prompt }], maxTokens: 300 });
  const parsed = parseJson<{ score: number; reasoning: string }>(textOf(res), { score: 50, reasoning: "Partial match based on available profile data." });
  return { score: clamp(parsed.score ?? 50), reasoning: parsed.reasoning ?? "Match computed from profile fit." };
}

// Score every open opportunity (optionally of a type) for the user and persist.
export async function refreshMatches(userId: number, type?: Opportunity["type"]): Promise<number> {
  const opps = await repo.listOpportunities({ type, status: "open", limit: 25 });
  let scored = 0;
  for (const opp of opps) {
    const existing = await repo.getExistingMatch(userId, opp.id);
    if (existing && existing.status === "dismissed") continue; // respect user dismissals
    const { score, reasoning } = await scoreOpportunity(userId, opp);
    await repo.upsertMatch({ userId, opportunityId: opp.id, score, reasoning, status: existing?.status });
    scored++;
  }
  return scored;
}

// ════════════════════════════════════════════════════════════════════════
// 4. LEARNING MISSIONS — LLM-generated, outcome-oriented step plans
// ════════════════════════════════════════════════════════════════════════
export async function generateMissionSteps(title: string, category: string, description?: string): Promise<Array<{ title: string; detail: string }>> {
  const prompt = [
    `You are a learning-mission planner. Break the goal below into 5-8 concrete, sequential steps.`,
    `Each step must be actionable and verifiable (something the user can mark done).`,
    `Return ONLY a JSON array: [{"title": "...", "detail": "..."}].`,
    "",
    `GOAL: ${title}`,
    `CATEGORY: ${category}`,
    description ? `CONTEXT: ${description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await invokeLLM({ messages: [{ role: "user", content: prompt }], maxTokens: 900 });
  const parsed = parseJson<Array<{ title: string; detail: string }>>(textOf(res), []);
  return parsed
    .filter(s => s && typeof s.title === "string")
    .slice(0, 8)
    .map(s => ({ title: String(s.title).slice(0, 200), detail: String(s.detail ?? "").slice(0, 1000) }));
}

// ════════════════════════════════════════════════════════════════════════
// 5. AI STARTUP BUILDER — LLM-generated full operating plan
// ════════════════════════════════════════════════════════════════════════
export type StartupOutput = {
  name: string;
  tagline: string;
  businessPlan: Record<string, unknown>;
  branding: Record<string, unknown>;
  marketing: Record<string, unknown>;
  mvpRoadmap: Array<{ phase: string; items: string[] }>;
  teamPlan: Array<{ role: string; focus: string }>;
};

// ════════════════════════════════════════════════════════════════════════
// 6. DAILY SUGGESTIONS — LLM next-best-actions grounded in twin + today snapshot
// ════════════════════════════════════════════════════════════════════════
export async function generateDailySuggestions(
  userId: number,
  snapshot: { activeMissions: number; unreadMessages: number; openGoals: number; topOpportunity?: string },
): Promise<string[]> {
  const context = await buildTwinContext(userId);
  const prompt = [
    "You are HOPE AI, the user's orchestrator. Suggest 3 concrete next actions for today.",
    "Be specific and grounded in their actual context. Each item: one short sentence, action-first.",
    'Return ONLY a JSON array of strings: ["...", "...", "..."].',
    "",
    "USER CONTEXT:",
    context || "(new user — suggest onboarding actions)",
    "",
    "TODAY SNAPSHOT:",
    `Active missions: ${snapshot.activeMissions}`,
    `Open goals: ${snapshot.openGoals}`,
    `Unread messages: ${snapshot.unreadMessages}`,
    snapshot.topOpportunity ? `Top opportunity: ${snapshot.topOpportunity}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  try {
    const res = await invokeLLM({ messages: [{ role: "user", content: prompt }], maxTokens: 350 });
    const parsed = parseJson<string[]>(textOf(res), []);
    return parsed.filter(s => typeof s === "string").slice(0, 3).map(s => s.slice(0, 200));
  } catch {
    return [];
  }
}

export async function generateStartup(idea: string): Promise<StartupOutput> {
  const prompt = [
    "You are an elite startup co-founder. Turn the raw idea below into a complete, realistic launch plan.",
    "Return ONLY JSON with this exact shape:",
    `{
  "name": "string",
  "tagline": "string",
  "businessPlan": { "problem": "string", "solution": "string", "targetMarket": "string", "businessModel": "string", "revenueStreams": ["string"], "competitors": ["string"], "moat": "string" },
  "branding": { "vibe": "string", "colorPalette": ["#hex"], "voice": "string", "logoConcept": "string" },
  "marketing": { "positioning": "string", "channels": ["string"], "launchTactics": ["string"], "firstWeekPlan": ["string"] },
  "mvpRoadmap": [ { "phase": "string", "items": ["string"] } ],
  "teamPlan": [ { "role": "string", "focus": "string" } ]
}`,
    "",
    `IDEA: ${idea}`,
  ].join("\n");

  const res = await invokeLLM({ messages: [{ role: "user", content: prompt }], maxTokens: 2000 });
  const fallback: StartupOutput = {
    name: idea.split(/\s+/).slice(0, 2).join("") || "NewVenture",
    tagline: "Turning an idea into a venture.",
    businessPlan: { problem: idea, solution: "To be refined.", targetMarket: "TBD", businessModel: "TBD", revenueStreams: [], competitors: [], moat: "" },
    branding: { vibe: "modern", colorPalette: ["#000000", "#D4AF37", "#FFFFFF"], voice: "confident", logoConcept: "wordmark" },
    marketing: { positioning: "TBD", channels: [], launchTactics: [], firstWeekPlan: [] },
    mvpRoadmap: [{ phase: "MVP", items: ["Define core flow", "Build prototype", "Get 10 users"] }],
    teamPlan: [{ role: "Founder", focus: "Vision & product" }],
  };
  const parsed = parseJson<StartupOutput>(textOf(res), fallback);
  // Guard against partial AI output.
  return {
    name: parsed.name || fallback.name,
    tagline: parsed.tagline || fallback.tagline,
    businessPlan: parsed.businessPlan ?? fallback.businessPlan,
    branding: parsed.branding ?? fallback.branding,
    marketing: parsed.marketing ?? fallback.marketing,
    mvpRoadmap: Array.isArray(parsed.mvpRoadmap) && parsed.mvpRoadmap.length ? parsed.mvpRoadmap : fallback.mvpRoadmap,
    teamPlan: Array.isArray(parsed.teamPlan) && parsed.teamPlan.length ? parsed.teamPlan : fallback.teamPlan,
  };
}
