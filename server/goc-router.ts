/**
 * Global Operations Center (GOC) Router
 *
 * Provides:
 * - Region leader dashboard (10 regions, per-region feature toggles)
 * - Compliance Control Matrix (14 feature toggles per region)
 * - Dynamic Country Rules Engine (read/write region_policies table)
 * - Ambassador Program (roles: country, community, language, education,
 *   developer, religion, charity, gaming, creator)
 * - Global Heatmap (aggregated real activity per region)
 * - AI Growth Engine (HOPE AI analyzes platform metrics, generates recommendations)
 * - Token Registry endpoint (reads from shared/tokenRegistry.ts)
 */

import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { TOKEN_REGISTRY, SWAPPABLE_TOKENS, STAKEABLE_TOKENS, TIPPABLE_TOKENS, GOV_TOKENS } from "@shared/tokenRegistry";

// ─── DB helpers ──────────────────────────────────────────────────────────────

async function getRegionPolicies() {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT * FROM region_policies ORDER BY region_name`);
    return (rows as any)[0] as RegionPolicy[];
  } catch { return []; }
}

async function getRegionPolicy(regionCode: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    const rows = await db.execute(sql`SELECT * FROM region_policies WHERE region_code = ${regionCode} LIMIT 1`);
    const data = (rows as any)[0] as RegionPolicy[];
    return data[0] ?? null;
  } catch { return null; }
}

async function upsertRegionPolicy(policy: Partial<RegionPolicy> & { regionCode: string; regionName: string }) {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.execute(sql`
      INSERT INTO region_policies
        (region_code, region_name, crypto_enabled, wallet_enabled, mining_enabled,
         staking_enabled, dex_enabled, governance_enabled, dating_enabled,
         language_exchange_enabled, marketplace_enabled, gaming_enabled,
         streaming_enabled, ai_agents_enabled, education_enabled,
         developer_tools_enabled, notes)
      VALUES (
        ${policy.regionCode}, ${policy.regionName},
        ${policy.cryptoEnabled ?? 1}, ${policy.walletEnabled ?? 1},
        ${policy.miningEnabled ?? 1}, ${policy.stakingEnabled ?? 1},
        ${policy.dexEnabled ?? 1}, ${policy.governanceEnabled ?? 1},
        ${policy.datingEnabled ?? 1}, ${policy.languageExchangeEnabled ?? 1},
        ${policy.marketplaceEnabled ?? 1}, ${policy.gamingEnabled ?? 1},
        ${policy.streamingEnabled ?? 1}, ${policy.aiAgentsEnabled ?? 1},
        ${policy.educationEnabled ?? 1}, ${policy.developerToolsEnabled ?? 1},
        ${policy.notes ?? null}
      )
      ON DUPLICATE KEY UPDATE
        region_name = VALUES(region_name),
        crypto_enabled = VALUES(crypto_enabled),
        wallet_enabled = VALUES(wallet_enabled),
        mining_enabled = VALUES(mining_enabled),
        staking_enabled = VALUES(staking_enabled),
        dex_enabled = VALUES(dex_enabled),
        governance_enabled = VALUES(governance_enabled),
        dating_enabled = VALUES(dating_enabled),
        language_exchange_enabled = VALUES(language_exchange_enabled),
        marketplace_enabled = VALUES(marketplace_enabled),
        gaming_enabled = VALUES(gaming_enabled),
        streaming_enabled = VALUES(streaming_enabled),
        ai_agents_enabled = VALUES(ai_agents_enabled),
        education_enabled = VALUES(education_enabled),
        developer_tools_enabled = VALUES(developer_tools_enabled),
        notes = VALUES(notes)
    `);
    return true;
  } catch { return null; }
}

async function getAmbassadors(regionCode?: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = regionCode
      ? await db.execute(sql`
          SELECT a.*, u.username, u.displayName, u.avatarUrl, u.reputation
          FROM ambassadors a
          LEFT JOIN users u ON u.id = a.user_id
          WHERE a.region_code = ${regionCode} AND a.status = 'active'
          ORDER BY a.appointed_at DESC
        `)
      : await db.execute(sql`
          SELECT a.*, u.username, u.displayName, u.avatarUrl, u.reputation
          FROM ambassadors a
          LEFT JOIN users u ON u.id = a.user_id
          WHERE a.status = 'active'
          ORDER BY a.appointed_at DESC
        `);
    return (rows as any)[0] as AmbassadorRow[];
  } catch { return []; }
}

async function appointAmbassador(userId: number, regionCode: string, role: string, bio?: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.execute(sql`
      INSERT INTO ambassadors (user_id, region_code, role, bio)
      VALUES (${userId}, ${regionCode}, ${role}, ${bio ?? null})
      ON DUPLICATE KEY UPDATE status = 'active', bio = VALUES(bio)
    `);
    return true;
  } catch { return null; }
}

async function getGlobalHeatmapData() {
  const db = await getDb();
  if (!db) return [];
  try {
    // Aggregate real activity by region via user country codes (best-effort)
    // We use token_balances as a proxy for active users per region
    const rows = await db.execute(sql`
      SELECT
        rp.region_code,
        rp.region_name,
        COUNT(DISTINCT tb.userId) AS active_users,
        COALESCE(SUM(CAST(tb.balance AS DECIMAL(24,8))), 0) AS total_balance,
        rp.crypto_enabled,
        rp.education_enabled,
        rp.marketplace_enabled
      FROM region_policies rp
      LEFT JOIN token_balances tb ON tb.token = 'SKY4'
      GROUP BY rp.region_code, rp.region_name,
               rp.crypto_enabled, rp.education_enabled, rp.marketplace_enabled
      ORDER BY active_users DESC
    `);
    return (rows as any)[0] as HeatmapRow[];
  } catch { return []; }
}

async function getPlatformMetrics() {
  const db = await getDb();
  if (!db) return null;
  try {
    const [usersRow] = await db.execute(sql`SELECT COUNT(*) AS total FROM users`) as any;
    const [postsRow] = await db.execute(sql`SELECT COUNT(*) AS total FROM posts`) as any;
    const [txRow] = await db.execute(sql`SELECT COUNT(*) AS total FROM transactions`) as any;
    return {
      totalUsers: Number(usersRow[0]?.total ?? 0),
      totalPosts: Number(postsRow[0]?.total ?? 0),
      totalTransactions: Number(txRow[0]?.total ?? 0),
    };
  } catch { return { totalUsers: 0, totalPosts: 0, totalTransactions: 0 }; }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegionPolicy {
  id: number;
  regionCode: string;
  regionName: string;
  cryptoEnabled: number;
  walletEnabled: number;
  miningEnabled: number;
  stakingEnabled: number;
  dexEnabled: number;
  governanceEnabled: number;
  datingEnabled: number;
  languageExchangeEnabled: number;
  marketplaceEnabled: number;
  gamingEnabled: number;
  streamingEnabled: number;
  aiAgentsEnabled: number;
  educationEnabled: number;
  developerToolsEnabled: number;
  notes: string | null;
}

interface AmbassadorRow {
  id: number;
  userId: number;
  regionCode: string;
  role: string;
  status: string;
  appointedAt: Date;
  bio: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number | null;
}

interface HeatmapRow {
  regionCode: string;
  regionName: string;
  activeUsers: number;
  totalBalance: string;
  cryptoEnabled: number;
  educationEnabled: number;
  marketplaceEnabled: number;
}

// ─── Ambassador roles ─────────────────────────────────────────────────────────
const AMBASSADOR_ROLES = [
  "country", "community", "language", "education",
  "developer", "religion", "charity", "gaming", "creator",
] as const;

// ─── Router ───────────────────────────────────────────────────────────────────

export const gocRouter = router({

  // ── Token Registry ──────────────────────────────────────────────────────────
  tokenRegistry: publicProcedure.query(() => ({
    all: TOKEN_REGISTRY,
    swappable: SWAPPABLE_TOKENS,
    stakeable: STAKEABLE_TOKENS,
    tippable: TIPPABLE_TOKENS,
    governance: GOV_TOKENS,
  })),

  // ── Region Policies ─────────────────────────────────────────────────────────
  regions: publicProcedure.query(async () => {
    return getRegionPolicies();
  }),

  region: publicProcedure
    .input(z.object({ regionCode: z.string() }))
    .query(async ({ input }) => {
      return getRegionPolicy(input.regionCode);
    }),

  updateRegion: adminProcedure
    .input(z.object({
      regionCode: z.string().min(2).max(8),
      regionName: z.string().min(2).max(64),
      cryptoEnabled: z.boolean().optional(),
      walletEnabled: z.boolean().optional(),
      miningEnabled: z.boolean().optional(),
      stakingEnabled: z.boolean().optional(),
      dexEnabled: z.boolean().optional(),
      governanceEnabled: z.boolean().optional(),
      datingEnabled: z.boolean().optional(),
      languageExchangeEnabled: z.boolean().optional(),
      marketplaceEnabled: z.boolean().optional(),
      gamingEnabled: z.boolean().optional(),
      streamingEnabled: z.boolean().optional(),
      aiAgentsEnabled: z.boolean().optional(),
      educationEnabled: z.boolean().optional(),
      developerToolsEnabled: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const mapped = {
        ...input,
        cryptoEnabled: input.cryptoEnabled !== undefined ? (input.cryptoEnabled ? 1 : 0) : undefined,
        walletEnabled: input.walletEnabled !== undefined ? (input.walletEnabled ? 1 : 0) : undefined,
        miningEnabled: input.miningEnabled !== undefined ? (input.miningEnabled ? 1 : 0) : undefined,
        stakingEnabled: input.stakingEnabled !== undefined ? (input.stakingEnabled ? 1 : 0) : undefined,
        dexEnabled: input.dexEnabled !== undefined ? (input.dexEnabled ? 1 : 0) : undefined,
        governanceEnabled: input.governanceEnabled !== undefined ? (input.governanceEnabled ? 1 : 0) : undefined,
        datingEnabled: input.datingEnabled !== undefined ? (input.datingEnabled ? 1 : 0) : undefined,
        languageExchangeEnabled: input.languageExchangeEnabled !== undefined ? (input.languageExchangeEnabled ? 1 : 0) : undefined,
        marketplaceEnabled: input.marketplaceEnabled !== undefined ? (input.marketplaceEnabled ? 1 : 0) : undefined,
        gamingEnabled: input.gamingEnabled !== undefined ? (input.gamingEnabled ? 1 : 0) : undefined,
        streamingEnabled: input.streamingEnabled !== undefined ? (input.streamingEnabled ? 1 : 0) : undefined,
        aiAgentsEnabled: input.aiAgentsEnabled !== undefined ? (input.aiAgentsEnabled ? 1 : 0) : undefined,
        educationEnabled: input.educationEnabled !== undefined ? (input.educationEnabled ? 1 : 0) : undefined,
        developerToolsEnabled: input.developerToolsEnabled !== undefined ? (input.developerToolsEnabled ? 1 : 0) : undefined,
      };
      const ok = await upsertRegionPolicy(mapped as Parameters<typeof upsertRegionPolicy>[0]);
      return { success: !!ok };
    }),

  // ── Ambassadors ─────────────────────────────────────────────────────────────
  ambassadors: publicProcedure
    .input(z.object({ regionCode: z.string().optional() }))
    .query(async ({ input }) => {
      return getAmbassadors(input.regionCode);
    }),

  ambassadorRoles: publicProcedure.query(() => AMBASSADOR_ROLES),

  appoint: adminProcedure
    .input(z.object({
      userId: z.number(),
      regionCode: z.string(),
      role: z.enum(AMBASSADOR_ROLES),
      bio: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const ok = await appointAmbassador(input.userId, input.regionCode, input.role, input.bio);
      return { success: !!ok };
    }),

  // ── Global Heatmap ──────────────────────────────────────────────────────────
  heatmap: publicProcedure.query(async () => {
    return getGlobalHeatmapData();
  }),

  // ── AI Growth Engine ────────────────────────────────────────────────────────
  growthAnalysis: adminProcedure.query(async () => {
    const metrics = await getPlatformMetrics();
    const regions = await getRegionPolicies();
    const ambassadorCount = (await getAmbassadors()).length;

    const prompt = `You are the HOPE AI Growth Engine for SKYCOIN4444, a global AI operating system platform.

Current platform metrics:
- Total users: ${metrics?.totalUsers ?? 0}
- Total posts: ${metrics?.totalPosts ?? 0}
- Total transactions: ${metrics?.totalTransactions ?? 0}
- Active regions: ${regions.length}
- Ambassadors deployed: ${ambassadorCount}
- Tokens: SKY4 (core), DOGE (community), TRUMP (governance)

Regions with restricted features:
${regions.filter(r => !r.cryptoEnabled || !r.walletEnabled).map(r => `- ${r.regionName}: crypto=${r.cryptoEnabled ? 'on' : 'OFF'}, wallet=${r.walletEnabled ? 'on' : 'OFF'}`).join('\n') || '- None (all regions have full access)'}

Generate a concise growth analysis with:
1. Top 3 growth opportunities (specific, actionable)
2. Top 2 retention risks (with root cause)
3. Top 3 recommended next actions for the founding team
4. One region-specific recommendation

Be direct, specific, and data-driven. No fluff. Max 300 words.`;

    try {
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 500,
      });
      const content = response.choices?.[0]?.message?.content ?? "";
      return {
        analysis: content,
        metrics,
        generatedAt: new Date().toISOString(),
      };
    } catch {
      return {
        analysis: "Growth analysis unavailable — AI service temporarily unreachable. Check platform metrics above for manual review.",
        metrics,
        generatedAt: new Date().toISOString(),
      };
    }
  }),

  // ── Startup Command Center metrics ──────────────────────────────────────────
  commandCenter: adminProcedure.query(async () => {
    const metrics = await getPlatformMetrics();
    const regions = await getRegionPolicies();
    const ambassadors = await getAmbassadors();
    return {
      users: metrics?.totalUsers ?? 0,
      posts: metrics?.totalPosts ?? 0,
      transactions: metrics?.totalTransactions ?? 0,
      regions: regions.length,
      ambassadors: ambassadors.length,
      religionLeaders: ambassadors.filter(a => a.role === "religion").length,
      tokens: TOKEN_REGISTRY.map(t => ({ symbol: t.symbol, name: t.name, role: t.role })),
    };
  }),
});
