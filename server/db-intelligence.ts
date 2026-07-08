// ════════════════════════════════════════════════════════════════════════
// HOPE AI Intelligence Layer — DB helpers (repository layer)
// ────────────────────────────────────────────────────────────────────────
// All queries return raw Drizzle rows. No business logic here (services own
// that). TiDB JSON columns are nullable (no SQL DEFAULT); application code
// supplies sane empties so the rest of the platform never sees `null` arrays.
// ════════════════════════════════════════════════════════════════════════
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  twinMemory,
  twinFacts,
  reputationScores,
  opportunities,
  opportunityMatches,
  missions,
  missionSteps,
  startupBlueprints,
  aiMarketListings,
  aiMarketPurchases,
  tokenBalances,
  transactions,
  follows,
  communityMembers,
  directMessages,
  payouts,
  users,
  type TwinMemory,
  type TwinFact,
  type ReputationScore,
  type Opportunity,
  type OpportunityMatch,
  type Mission,
  type MissionStep,
  type StartupBlueprint,
  type AiMarketListing,
} from "../drizzle";

// ── Shared types ──────────────────────────────────────────────────────────
export type TwinGoal = { id: string; title: string; status: string; target?: string; createdAt: number };
export type TwinProject = { id: string; name: string; status: string; note?: string; createdAt: number };
export type TwinLearning = { id: string; topic: string; progress: number; createdAt: number };
export type TwinFinances = { currency?: string; monthlyTarget?: number; notes?: string };

// Normalize a raw twin_memory row so JSON columns are never null.
export type NormalizedTwin = Omit<TwinMemory, "goals" | "projects" | "preferences" | "finances" | "learning"> & {
  goals: TwinGoal[];
  projects: TwinProject[];
  preferences: Record<string, string>;
  finances: TwinFinances;
  learning: TwinLearning[];
};

function normalizeTwin(row: TwinMemory): NormalizedTwin {
  return {
    ...row,
    goals: (row.goals as TwinGoal[] | null) ?? [],
    projects: (row.projects as TwinProject[] | null) ?? [],
    preferences: (row.preferences as Record<string, string> | null) ?? {},
    finances: (row.finances as TwinFinances | null) ?? {},
    learning: (row.learning as TwinLearning[] | null) ?? [],
  };
}

// ════════════════════════════════════════════════════════════════════════
// TWIN MEMORY
// ════════════════════════════════════════════════════════════════════════
export async function getTwinMemory(userId: number): Promise<NormalizedTwin | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(twinMemory).where(eq(twinMemory.userId, userId)).limit(1);
  return row ? normalizeTwin(row) : null;
}

// Ensure a twin row exists for the user; returns the normalized row.
export async function ensureTwinMemory(userId: number): Promise<NormalizedTwin | null> {
  const db = await getDb();
  if (!db) return null;
  const existing = await getTwinMemory(userId);
  if (existing) return existing;
  await db
    .insert(twinMemory)
    .values({ userId, summary: null })
    .onDuplicateKeyUpdate({ set: { lastInteractionAt: new Date() } });
  return getTwinMemory(userId);
}

export async function updateTwinMemory(
  userId: number,
  patch: Partial<{
    summary: string;
    goals: TwinGoal[];
    projects: TwinProject[];
    preferences: Record<string, string>;
    finances: TwinFinances;
    learning: TwinLearning[];
  }>,
): Promise<NormalizedTwin | null> {
  const db = await getDb();
  if (!db) return null;
  await ensureTwinMemory(userId);
  const set: Record<string, unknown> = { lastInteractionAt: new Date() };
  if (patch.summary !== undefined) set.summary = patch.summary;
  if (patch.goals !== undefined) set.goals = patch.goals;
  if (patch.projects !== undefined) set.projects = patch.projects;
  if (patch.preferences !== undefined) set.preferences = patch.preferences;
  if (patch.finances !== undefined) set.finances = patch.finances;
  if (patch.learning !== undefined) set.learning = patch.learning;
  await db.update(twinMemory).set(set as any).where(eq(twinMemory.userId, userId));
  return getTwinMemory(userId);
}

// ── Twin facts (append-only, traceable) ────────────────────────────────────
export async function addTwinFact(data: {
  userId: number;
  kind?: TwinFact["kind"];
  content: string;
  source?: string;
  confidence?: number;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [res] = await db
    .insert(twinFacts)
    .values({
      userId: data.userId,
      kind: data.kind ?? "fact",
      content: data.content,
      source: data.source ?? "chat",
      confidence: data.confidence ?? 80,
      active: true,
    })
    .$returningId();
  return res?.id ?? null;
}

export async function getTwinFacts(userId: number, limit = 50): Promise<TwinFact[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(twinFacts)
    .where(and(eq(twinFacts.userId, userId), eq(twinFacts.active, true)))
    .orderBy(desc(twinFacts.createdAt))
    .limit(limit);
}

export async function deactivateTwinFact(userId: number, factId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(twinFacts)
    .set({ active: false })
    .where(and(eq(twinFacts.id, factId), eq(twinFacts.userId, userId)));
}

// ════════════════════════════════════════════════════════════════════════
// REPUTATION
// ════════════════════════════════════════════════════════════════════════
export async function getReputation(userId: number): Promise<ReputationScore | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(reputationScores).where(eq(reputationScores.userId, userId)).limit(1);
  return row ?? null;
}

export async function upsertReputation(data: {
  userId: number;
  learningScore: number;
  builderScore: number;
  teachingScore: number;
  communityScore: number;
  trustScore: number;
  overall: number;
  breakdown: Record<string, number>;
}): Promise<ReputationScore | null> {
  const db = await getDb();
  if (!db) return null;
  await db
    .insert(reputationScores)
    .values({ ...data, computedAt: new Date() })
    .onDuplicateKeyUpdate({
      set: {
        learningScore: data.learningScore,
        builderScore: data.builderScore,
        teachingScore: data.teachingScore,
        communityScore: data.communityScore,
        trustScore: data.trustScore,
        overall: data.overall,
        breakdown: data.breakdown,
        computedAt: new Date(),
      },
    });
  return getReputation(data.userId);
}

export async function getReputationLeaderboard(limit = 20): Promise<Array<ReputationScore & { name: string | null; username: string | null; avatar: string | null }>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: reputationScores.id,
      userId: reputationScores.userId,
      learningScore: reputationScores.learningScore,
      builderScore: reputationScores.builderScore,
      teachingScore: reputationScores.teachingScore,
      communityScore: reputationScores.communityScore,
      trustScore: reputationScores.trustScore,
      overall: reputationScores.overall,
      breakdown: reputationScores.breakdown,
      computedAt: reputationScores.computedAt,
      name: users.name,
      username: users.username,
      avatar: users.avatar,
    })
    .from(reputationScores)
    .leftJoin(users, eq(users.id, reputationScores.userId))
    .orderBy(desc(reputationScores.overall))
    .limit(limit);
  return rows as any;
}

// Raw user activity signals used to deterministically compute reputation.
export async function getUserActivitySignals(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [u] = await db
    .select({
      xp: users.xp,
      level: users.level,
      reputation: users.reputation,
      followerCount: users.followerCount,
      postCount: users.postCount,
      contributionScore: users.contributionScore,
      reliabilityScore: users.reliabilityScore,
      behaviorScore: users.behaviorScore,
      toxicityScore: users.toxicityScore,
      isCreator: users.isCreator,
      verified: users.verified,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;
  // Count durable contributions tracked by the intelligence layer itself.
  const [missionAgg] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${missions.status} = 'completed' then 1 else 0 end)`,
    })
    .from(missions)
    .where(eq(missions.userId, userId));
  const [blueprintAgg] = await db
    .select({ total: sql<number>`count(*)` })
    .from(startupBlueprints)
    .where(eq(startupBlueprints.userId, userId));
  const [listingAgg] = await db
    .select({ total: sql<number>`count(*)`, sales: sql<number>`coalesce(sum(${aiMarketListings.sales}),0)` })
    .from(aiMarketListings)
    .where(eq(aiMarketListings.sellerId, userId));
  return {
    ...u,
    missionsTotal: Number(missionAgg?.total ?? 0),
    missionsCompleted: Number(missionAgg?.completed ?? 0),
    blueprints: Number(blueprintAgg?.total ?? 0),
    listings: Number(listingAgg?.total ?? 0),
    listingSales: Number(listingAgg?.sales ?? 0),
  };
}

// ════════════════════════════════════════════════════════════════════════
// OPPORTUNITIES
// ════════════════════════════════════════════════════════════════════════
export async function listOpportunities(filters?: {
  type?: Opportunity["type"];
  status?: Opportunity["status"];
  limit?: number;
}): Promise<Opportunity[]> {
  const db = await getDb();
  if (!db) return [];
  const conds = [] as any[];
  if (filters?.type) conds.push(eq(opportunities.type, filters.type));
  conds.push(eq(opportunities.status, filters?.status ?? "open"));
  return db
    .select()
    .from(opportunities)
    .where(and(...conds))
    .orderBy(desc(opportunities.createdAt))
    .limit(filters?.limit ?? 50);
}

export async function getOpportunity(id: number): Promise<Opportunity | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  return row ?? null;
}

export async function createOpportunity(data: {
  postedBy: number | null;
  type: Opportunity["type"];
  title: string;
  description?: string;
  skills?: string[];
  tags?: string[];
  location?: string;
  remote?: boolean;
  compensation?: string;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [res] = await db
    .insert(opportunities)
    .values({
      postedBy: data.postedBy,
      type: data.type,
      title: data.title,
      description: data.description ?? null,
      skills: data.skills ?? [],
      tags: data.tags ?? [],
      location: data.location ?? null,
      remote: data.remote ?? true,
      compensation: data.compensation ?? null,
      status: "open",
    })
    .$returningId();
  return res?.id ?? null;
}

export async function getMatchesForUser(userId: number, limit = 30): Promise<Array<OpportunityMatch & { opportunity: Opportunity | null }>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(opportunityMatches)
    .leftJoin(opportunities, eq(opportunities.id, opportunityMatches.opportunityId))
    .where(eq(opportunityMatches.userId, userId))
    .orderBy(desc(opportunityMatches.score))
    .limit(limit);
  return rows.map(r => ({ ...(r.opportunity_matches as OpportunityMatch), opportunity: (r.opportunities as Opportunity) ?? null }));
}

export async function getExistingMatch(userId: number, opportunityId: number): Promise<OpportunityMatch | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(opportunityMatches)
    .where(and(eq(opportunityMatches.userId, userId), eq(opportunityMatches.opportunityId, opportunityId)))
    .limit(1);
  return row ?? null;
}

export async function upsertMatch(data: {
  userId: number;
  opportunityId: number;
  score: number;
  reasoning: string;
  status?: OpportunityMatch["status"];
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getExistingMatch(data.userId, data.opportunityId);
  if (existing) {
    await db
      .update(opportunityMatches)
      .set({ score: data.score, reasoning: data.reasoning, ...(data.status ? { status: data.status } : {}) })
      .where(eq(opportunityMatches.id, existing.id));
  } else {
    await db.insert(opportunityMatches).values({
      userId: data.userId,
      opportunityId: data.opportunityId,
      score: data.score,
      reasoning: data.reasoning,
      status: data.status ?? "suggested",
    });
  }
}

export async function setMatchStatus(userId: number, opportunityId: number, status: OpportunityMatch["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(opportunityMatches)
    .set({ status })
    .where(and(eq(opportunityMatches.userId, userId), eq(opportunityMatches.opportunityId, opportunityId)));
}

// ════════════════════════════════════════════════════════════════════════
// MISSION CONTROL EXTRAS (real cross-module signals)
// ════════════════════════════════════════════════════════════════════════
export async function getMissionControlExtras(userId: number): Promise<{
  unreadMessages: number;
  communities: number;
  revenue: number;
}> {
  const db = await getDb();
  if (!db) return { unreadMessages: 0, communities: 0, revenue: 0 };
  const [dm] = await db
    .select({ c: sql<number>`count(*)` })
    .from(directMessages)
    .where(and(eq(directMessages.recipientId, userId), sql`${directMessages.readAt} is null`));
  const [com] = await db
    .select({ c: sql<number>`count(*)` })
    .from(communityMembers)
    .where(eq(communityMembers.userId, userId));
  const [rev] = await db
    .select({ total: sql<number>`coalesce(sum(${payouts.amount}),0)` })
    .from(payouts)
    .where(and(eq(payouts.creatorId, userId), eq(payouts.status, "completed")));
  return {
    unreadMessages: Number(dm?.c ?? 0),
    communities: Number(com?.c ?? 0),
    revenue: Number(rev?.total ?? 0),
  };
}

// ════════════════════════════════════════════════════════════════════════
// PRO-NETWORK GRAPH SUGGESTIONS (friends-of-friends, ranked by mutual ties)
// ════════════════════════════════════════════════════════════════════════
export type NetworkSuggestion = {
  userId: number;
  name: string | null;
  username: string | null;
  avatar: string | null;
  mutualCount: number;
  reputation: number | null;
};

// Second-degree connections: people followed by the users I follow, whom I do
// not already follow. Ranked by how many of my connections vouch for them, then
// by their computed reputation. Pure graph math over real `follows` edges.
export async function getProNetworkSuggestions(userId: number, limit = 10): Promise<NetworkSuggestion[]> {
  const db = await getDb();
  if (!db) return [];
  const f1 = db.select({ id: follows.followingId }).from(follows).where(eq(follows.followerId, userId));
  const rows = await db
    .select({
      userId: follows.followingId,
      mutualCount: sql<number>`count(*)`,
      name: users.name,
      username: users.username,
      avatar: users.avatar,
      reputation: reputationScores.overall,
    })
    .from(follows)
    .leftJoin(users, eq(users.id, follows.followingId))
    .leftJoin(reputationScores, eq(reputationScores.userId, follows.followingId))
    .where(
      and(
        sql`${follows.followerId} in (${f1})`,
        sql`${follows.followingId} <> ${userId}`,
        sql`${follows.followingId} not in (${f1})`,
      ),
    )
    .groupBy(follows.followingId, users.name, users.username, users.avatar, reputationScores.overall)
    .orderBy(sql`count(*) desc, ${reputationScores.overall} desc`)
    .limit(limit);
  return rows.map(r => ({
    userId: r.userId,
    name: r.name ?? null,
    username: r.username ?? null,
    avatar: r.avatar ?? null,
    mutualCount: Number(r.mutualCount ?? 0),
    reputation: r.reputation ?? null,
  }));
}

// ════════════════════════════════════════════════════════════════════════
// MISSIONS
// ════════════════════════════════════════════════════════════════════════
export async function listMissions(userId: number): Promise<Mission[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(missions).where(eq(missions.userId, userId)).orderBy(desc(missions.createdAt));
}

export async function getMissionWithSteps(missionId: number, userId: number): Promise<{ mission: Mission; steps: MissionStep[] } | null> {
  const db = await getDb();
  if (!db) return null;
  const [mission] = await db
    .select()
    .from(missions)
    .where(and(eq(missions.id, missionId), eq(missions.userId, userId)))
    .limit(1);
  if (!mission) return null;
  const steps = await db
    .select()
    .from(missionSteps)
    .where(eq(missionSteps.missionId, missionId))
    .orderBy(missionSteps.ordinal);
  return { mission, steps };
}

export async function createMission(data: {
  userId: number;
  title: string;
  category: Mission["category"];
  description?: string;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [res] = await db
    .insert(missions)
    .values({
      userId: data.userId,
      title: data.title,
      category: data.category,
      description: data.description ?? null,
      status: "active",
      progress: 0,
    })
    .$returningId();
  return res?.id ?? null;
}

export async function insertMissionSteps(missionId: number, steps: Array<{ title: string; detail?: string }>): Promise<void> {
  const db = await getDb();
  if (!db || steps.length === 0) return;
  await db.insert(missionSteps).values(
    steps.map((s, i) => ({ missionId, ordinal: i, title: s.title, detail: s.detail ?? null, done: false })),
  );
}

export async function setMissionStepDone(stepId: number, done: boolean): Promise<MissionStep | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(missionSteps).set({ done }).where(eq(missionSteps.id, stepId));
  const [row] = await db.select().from(missionSteps).where(eq(missionSteps.id, stepId)).limit(1);
  return row ?? null;
}

// Recompute a mission's progress from its steps and persist it.
export async function recomputeMissionProgress(missionId: number): Promise<{ progress: number; status: Mission["status"] }> {
  const db = await getDb();
  if (!db) return { progress: 0, status: "active" };
  const steps = await db.select().from(missionSteps).where(eq(missionSteps.missionId, missionId));
  const total = steps.length;
  const done = steps.filter(s => s.done).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const status: Mission["status"] = progress >= 100 ? "completed" : "active";
  await db.update(missions).set({ progress, status }).where(eq(missions.id, missionId));
  return { progress, status };
}

// ════════════════════════════════════════════════════════════════════════
// STARTUP BLUEPRINTS
// ════════════════════════════════════════════════════════════════════════
export async function createBlueprint(data: {
  userId: number;
  idea: string;
  name?: string;
  tagline?: string;
  businessPlan: Record<string, unknown>;
  branding: Record<string, unknown>;
  marketing: Record<string, unknown>;
  mvpRoadmap: Array<{ phase: string; items: string[] }>;
  teamPlan: Array<{ role: string; focus: string }>;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [res] = await db
    .insert(startupBlueprints)
    .values({
      userId: data.userId,
      idea: data.idea,
      name: data.name ?? null,
      tagline: data.tagline ?? null,
      businessPlan: data.businessPlan,
      branding: data.branding,
      marketing: data.marketing,
      mvpRoadmap: data.mvpRoadmap,
      teamPlan: data.teamPlan,
      status: "generated",
    })
    .$returningId();
  return res?.id ?? null;
}

export async function listBlueprints(userId: number): Promise<StartupBlueprint[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(startupBlueprints).where(eq(startupBlueprints.userId, userId)).orderBy(desc(startupBlueprints.createdAt));
}

export async function getBlueprint(id: number, userId: number): Promise<StartupBlueprint | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(startupBlueprints)
    .where(and(eq(startupBlueprints.id, id), eq(startupBlueprints.userId, userId)))
    .limit(1);
  return row ?? null;
}

// ════════════════════════════════════════════════════════════════════════
// AI MARKETPLACE
// ════════════════════════════════════════════════════════════════════════
export async function listMarketListings(filters?: { kind?: AiMarketListing["kind"]; limit?: number }): Promise<Array<Omit<AiMarketListing, "content">>> {
  const db = await getDb();
  if (!db) return [];
  const conds = [eq(aiMarketListings.active, true)] as any[];
  if (filters?.kind) conds.push(eq(aiMarketListings.kind, filters.kind));
  // Never expose `content` in listing views — it is the paid payload.
  return db
    .select({
      id: aiMarketListings.id,
      sellerId: aiMarketListings.sellerId,
      kind: aiMarketListings.kind,
      title: aiMarketListings.title,
      description: aiMarketListings.description,
      priceCents: aiMarketListings.priceCents,
      tags: aiMarketListings.tags,
      sales: aiMarketListings.sales,
      ratingSum: aiMarketListings.ratingSum,
      ratingCount: aiMarketListings.ratingCount,
      active: aiMarketListings.active,
      createdAt: aiMarketListings.createdAt,
    })
    .from(aiMarketListings)
    .where(and(...conds))
    .orderBy(desc(aiMarketListings.sales))
    .limit(filters?.limit ?? 50) as any;
}

export async function getListingFull(id: number): Promise<AiMarketListing | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(aiMarketListings).where(eq(aiMarketListings.id, id)).limit(1);
  return row ?? null;
}

export async function createMarketListing(data: {
  sellerId: number;
  kind: AiMarketListing["kind"];
  title: string;
  description?: string;
  content: string;
  priceCents: number;
  tags?: string[];
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [res] = await db
    .insert(aiMarketListings)
    .values({
      sellerId: data.sellerId,
      kind: data.kind,
      title: data.title,
      description: data.description ?? null,
      content: data.content,
      priceCents: data.priceCents,
      tags: data.tags ?? [],
      active: true,
    })
    .$returningId();
  return res?.id ?? null;
}

export async function hasPurchased(listingId: number, buyerId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select({ id: aiMarketPurchases.id })
    .from(aiMarketPurchases)
    .where(and(eq(aiMarketPurchases.listingId, listingId), eq(aiMarketPurchases.buyerId, buyerId)))
    .limit(1);
  return !!row;
}

// SKY444 coin price = priceCents / 100 (1 SKY444 == 100 "cents" unit on listings).
const SETTLEMENT_TOKEN = "SKY444";
function centsToCoin(cents: number): number {
  return cents / 100;
}

// Read a user's SKY444 spendable balance as a number.
export async function getCoinBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ balance: tokenBalances.balance })
    .from(tokenBalances)
    .where(and(eq(tokenBalances.userId, userId), eq(tokenBalances.token, SETTLEMENT_TOKEN)))
    .limit(1);
  return row ? Number(row.balance) : 0;
}

// Ensure a SKY444 balance row exists for a user (idempotent).
async function ensureCoinRow(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(tokenBalances)
    .values({ userId, token: SETTLEMENT_TOKEN, balance: "0" })
    .onDuplicateKeyUpdate({ set: { updatedAt: new Date() } })
    .catch(() => undefined);
}

// Real settlement: debit buyer, credit seller, record both transactions, and
// write the purchase entitlement. Returns false when the buyer cannot afford it.
// Free (priceCents === 0) listings skip the transfer but still record entitlement.
export async function purchaseWithCoins(data: {
  listingId: number;
  buyerId: number;
  sellerId: number;
  priceCents: number;
}): Promise<{ ok: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) return { ok: false, reason: "Database unavailable." };
  const coinPrice = centsToCoin(data.priceCents);

  if (coinPrice > 0) {
    await ensureCoinRow(data.buyerId);
    await ensureCoinRow(data.sellerId);
    const balance = await getCoinBalance(data.buyerId);
    if (balance < coinPrice) {
      return { ok: false, reason: `Insufficient SKY444 balance. Need ${coinPrice}, have ${balance}.` };
    }
    // Debit buyer (guarded so concurrent spends cannot overdraw).
    const debit = await db
      .update(tokenBalances)
      .set({ balance: sql`${tokenBalances.balance} - ${coinPrice}`, updatedAt: new Date() })
      .where(
        and(
          eq(tokenBalances.userId, data.buyerId),
          eq(tokenBalances.token, SETTLEMENT_TOKEN),
          sql`${tokenBalances.balance} >= ${coinPrice}`,
        ),
      );
    // drizzle returns a result set; verify a row was actually updated.
    const affected = (debit as unknown as { rowsAffected?: number; affectedRows?: number })?.rowsAffected
      ?? (debit as unknown as [{ affectedRows?: number }])?.[0]?.affectedRows
      ?? 0;
    if (!affected) {
      return { ok: false, reason: "Insufficient SKY444 balance." };
    }
    // Credit seller.
    await db
      .update(tokenBalances)
      .set({ balance: sql`${tokenBalances.balance} + ${coinPrice}`, updatedAt: new Date() })
      .where(and(eq(tokenBalances.userId, data.sellerId), eq(tokenBalances.token, SETTLEMENT_TOKEN)));
    // Record an auditable transaction for both sides.
    await db.insert(transactions).values([
      { userId: data.buyerId, type: "transfer" as any, token: SETTLEMENT_TOKEN, amount: String(-coinPrice) as any, status: "confirmed", metadata: { kind: "ai_market_purchase", listingId: data.listingId } as any },
      { userId: data.sellerId, type: "transfer" as any, token: SETTLEMENT_TOKEN, amount: String(coinPrice) as any, status: "confirmed", metadata: { kind: "ai_market_sale", listingId: data.listingId } as any },
    ]).catch(() => undefined);
  }

  await db.insert(aiMarketPurchases).values({ listingId: data.listingId, buyerId: data.buyerId, pricePaidCents: data.priceCents });
  await db
    .update(aiMarketListings)
    .set({ sales: sql`${aiMarketListings.sales} + 1` })
    .where(eq(aiMarketListings.id, data.listingId));
  return { ok: true };
}

// True only if this buyer has a purchase that has NOT yet been rated.
export async function canRate(listingId: number, buyerId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select({ id: aiMarketPurchases.id, rated: aiMarketPurchases.rated })
    .from(aiMarketPurchases)
    .where(and(eq(aiMarketPurchases.listingId, listingId), eq(aiMarketPurchases.buyerId, buyerId)))
    .limit(1);
  return !!row && !row.rated;
}

// Record a star rating (1-5) from a verified buyer, exactly once per purchase.
// Aggregates are stored as sum/count so the average can be derived without
// storing fabricated per-row review text. Returns false if already rated.
export async function addListingRating(listingId: number, buyerId: number, stars: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Atomically claim the rating slot so a buyer cannot rate twice.
  const claim = await db
    .update(aiMarketPurchases)
    .set({ rated: true })
    .where(and(eq(aiMarketPurchases.listingId, listingId), eq(aiMarketPurchases.buyerId, buyerId), eq(aiMarketPurchases.rated, false)));
  const affected = (claim as unknown as { rowsAffected?: number; affectedRows?: number })?.rowsAffected
    ?? (claim as unknown as [{ affectedRows?: number }])?.[0]?.affectedRows
    ?? 0;
  if (!affected) return false;
  await db
    .update(aiMarketListings)
    .set({ ratingSum: sql`${aiMarketListings.ratingSum} + ${stars}`, ratingCount: sql`${aiMarketListings.ratingCount} + 1` })
    .where(eq(aiMarketListings.id, listingId));
  return true;
}

export async function getPurchases(buyerId: number): Promise<Array<{ listing: Omit<AiMarketListing, "content">; pricePaidCents: number; createdAt: Date }>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(aiMarketPurchases)
    .leftJoin(aiMarketListings, eq(aiMarketListings.id, aiMarketPurchases.listingId))
    .where(eq(aiMarketPurchases.buyerId, buyerId))
    .orderBy(desc(aiMarketPurchases.createdAt));
  return rows.map(r => {
    const l = r.ai_market_listings as AiMarketListing | null;
    const { content: _c, ...rest } = (l ?? {}) as AiMarketListing;
    return {
      listing: rest as Omit<AiMarketListing, "content">,
      pricePaidCents: (r.ai_market_purchases as any).pricePaidCents,
      createdAt: (r.ai_market_purchases as any).createdAt,
    };
  });
}
