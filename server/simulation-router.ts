import crypto from 'crypto';
/**
 * Simulation Layer
 * AI personas that blend with real feed to make platform feel alive.
 * Generates synthetic posts, comments, likes, and activity from AI agents.
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ─── AI Persona Definitions ───────────────────────────────────────────────────

export const AI_PERSONAS = [
  {
    id: "persona_crypto_sage",
    name: "CryptoSage",
    handle: "@cryptosage_ai",
    avatar: "🔮",
    bio: "On-chain analyst. SKY444 bull. Tracking whale movements 24/7.",
    topics: ["crypto", "defi", "trading", "blockchain", "nft"],
    personality: "analytical, bullish, data-driven",
    postFrequency: "high",
  },
  {
    id: "persona_hope_voice",
    name: "HopeVoice",
    handle: "@hopevoice_ai",
    avatar: "💙",
    bio: "Mental wellness advocate. Every day is a new beginning.",
    topics: ["mental_health", "wellness", "motivation", "community"],
    personality: "empathetic, warm, supportive",
    postFrequency: "medium",
  },
  {
    id: "persona_shadow_artist",
    name: "ShadowArtist",
    handle: "@shadowartist_ai",
    avatar: "🎨",
    bio: "Digital art. NFT drops. Anonymous creator.",
    topics: ["art", "nft", "design", "creative", "digital"],
    personality: "creative, mysterious, provocative",
    postFrequency: "medium",
  },
  {
    id: "persona_defi_degen",
    name: "DeFiDegen",
    handle: "@defidegen_ai",
    avatar: "🦍",
    bio: "Aping into everything. WAGMI. Not financial advice.",
    topics: ["defi", "yield", "farming", "meme", "crypto"],
    personality: "degen, enthusiastic, meme-heavy",
    postFrequency: "high",
  },
  {
    id: "persona_sky_builder",
    name: "SkyBuilder",
    handle: "@skybuilder_ai",
    avatar: "🏗️",
    bio: "Building the future of Web3 social. SKYCOIN4444 ecosystem dev.",
    topics: ["web3", "development", "ecosystem", "platform", "tech"],
    personality: "technical, visionary, builder-focused",
    postFrequency: "medium",
  },
  {
    id: "persona_charity_heart",
    name: "CharityHeart",
    handle: "@charityheart_ai",
    avatar: "❤️",
    bio: "Every SKY donated = real world impact. Verified charity campaigns.",
    topics: ["charity", "impact", "community", "giving", "social"],
    personality: "compassionate, mission-driven, transparent",
    postFrequency: "low",
  },
  {
    id: "persona_game_master",
    name: "GameMaster",
    handle: "@gamemaster_ai",
    avatar: "🎮",
    bio: "Tournament organizer. Arcade champion. SKY444 wager king.",
    topics: ["gaming", "tournaments", "arcade", "competition", "esports"],
    personality: "competitive, fun, hype-builder",
    postFrequency: "high",
  },
  {
    id: "persona_stream_queen",
    name: "StreamQueen",
    handle: "@streamqueen_ai",
    avatar: "👑",
    bio: "Live every day. Tips = love. VOD archive always open.",
    topics: ["streaming", "live", "content", "creator", "entertainment"],
    personality: "charismatic, engaging, community-focused",
    postFrequency: "high",
  },
] as const;

type PersonaId = typeof AI_PERSONAS[number]["id"];

// ─── DB Setup ─────────────────────────────────────────────────────────────────

let tableEnsured = false;
async function ensureSimulationTables() {
  if (tableEnsured) return;
  const db = await getDb();
  if (!db) return;

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS simulation_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      persona_id VARCHAR(64) NOT NULL,
      persona_name VARCHAR(128) NOT NULL,
      persona_handle VARCHAR(128) NOT NULL,
      persona_avatar VARCHAR(16) NOT NULL,
      content TEXT NOT NULL,
      topic VARCHAR(64),
      likes INT NOT NULL DEFAULT 0,
      comments INT NOT NULL DEFAULT 0,
      shares INT NOT NULL DEFAULT 0,
      is_pinned TINYINT(1) NOT NULL DEFAULT 0,
      blend_weight FLOAT NOT NULL DEFAULT 1.0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_persona (persona_id),
      INDEX idx_created (created_at),
      INDEX idx_weight (blend_weight)
    )
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS simulation_activity_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      persona_id VARCHAR(64) NOT NULL,
      action_type ENUM('post','comment','like','follow','stream_join','tip') NOT NULL,
      target_id INT,
      target_type VARCHAR(64),
      metadata JSON,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_persona (persona_id),
      INDEX idx_created (created_at)
    )
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS simulation_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_name VARCHAR(128) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `));

  tableEnsured = true;
}

// ─── Content Generator ────────────────────────────────────────────────────────

async function generatePersonaPost(persona: typeof AI_PERSONAS[number], topic?: string): Promise<string> {
  const selectedTopic = topic ?? persona.topics[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * persona.topics.length)];
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are ${persona.name} (${persona.handle}), a social media persona on ShadowChat/SKYCOIN4444 platform. 
Bio: ${persona.bio}
Personality: ${persona.personality}
Write a single authentic social media post about ${selectedTopic}. 
Keep it under 280 characters. No hashtags needed. Sound natural and human.
Include relevant emojis. Reference SKYCOIN4444 or SKY444 token occasionally when relevant.`,
      },
      { role: "user", content: `Write a ${selectedTopic} post.` },
    ],
  });
  const rawContent = response.choices?.[0]?.message?.content;
  return typeof rawContent === "string" ? rawContent.trim() : `${persona.avatar} Exciting things happening in the ${selectedTopic} space! Stay tuned.`;
}

// ─── Simulation Engine ────────────────────────────────────────────────────────

async function runSimulationCycle(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, count: number = 3) {
  const results: { personaId: string; content: string; topic: string }[] = [];

  // Pick random personas weighted by postFrequency
  const weights = { high: 3, medium: 2, low: 1 };
  const weightedPersonas: typeof AI_PERSONAS[number][] = [];
  for (const p of AI_PERSONAS) {
    const w = weights[p.postFrequency];
    for (let i = 0; i < w; i++) weightedPersonas.push(p);
  }

  const selected = [...weightedPersonas].sort(() => (crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.5).slice(0, count);

  for (const persona of selected) {
    const topic = persona.topics[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * persona.topics.length)];
    try {
      const content = await generatePersonaPost(persona, topic);
      const likes = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 50) + 1;
      const comments = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 15);
      const shares = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 8);
      const blendWeight = 0.5 + (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.5;

      await db.execute(sql.raw(
        `INSERT INTO simulation_posts (persona_id, persona_name, persona_handle, persona_avatar, content, topic, likes, comments, shares, blend_weight)
         VALUES ('${persona.id}', '${persona.name.replace(/'/g, "''")}', '${persona.handle}', '${persona.avatar}', '${content.replace(/'/g, "''")}', '${topic}', ${likes}, ${comments}, ${shares}, ${blendWeight})`,
      ));

      await db.execute(sql.raw(
        `INSERT INTO simulation_activity_log (persona_id, action_type, metadata) VALUES ('${persona.id}', 'post', '${JSON.stringify({ topic, contentLength: content.length }).replace(/'/g, "''")}')`,
      ));

      results.push({ personaId: persona.id, content, topic });
    } catch (err) {
          }
  }

  return results;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const simulationRouter = router({
  /** Get blended feed (real posts + AI persona posts) */
  getBlendedFeed: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().default(0),
      topic: z.string().optional(),
    }))
    .query(async ({ input }) => {
      await ensureSimulationTables();
      const db = await getDb();
      if (!db) return { posts: [], total: 0 };

      let whereClause = "";
      if (input.topic) {
        whereClause = `WHERE topic = '${input.topic.replace(/'/g, "''")}'`;
      }

      const [rows] = await db.execute(sql.raw(
        `SELECT * FROM simulation_posts ${whereClause} ORDER BY blend_weight DESC, created_at DESC LIMIT ${input.limit} OFFSET ${input.offset}`,
      )) as any[];
      const posts: any[] = Array.isArray(rows) ? rows : [];

      const [countRows] = await db.execute(sql.raw(
        `SELECT COUNT(*) as total FROM simulation_posts ${whereClause}`,
      )) as any[];
      const countData: any[] = Array.isArray(countRows) ? countRows : [];

      return {
        posts: posts.map((p) => ({
          id: p.id,
          personaId: p.persona_id,
          personaName: p.persona_name,
          personaHandle: p.persona_handle,
          personaAvatar: p.persona_avatar,
          content: p.content,
          topic: p.topic,
          likes: p.likes,
          comments: p.comments,
          shares: p.shares,
          isPinned: !!p.is_pinned,
          blendWeight: p.blend_weight,
          createdAt: p.created_at,
          isAI: true,
        })),
        total: Number(countData[0]?.total ?? 0),
      };
    }),

  /** Get all AI personas */
  getPersonas: publicProcedure.query(async () => {
    await ensureSimulationTables();
    return {
      personas: AI_PERSONAS.map((p) => ({
        id: p.id,
        name: p.name,
        handle: p.handle,
        avatar: p.avatar,
        bio: p.bio,
        topics: [...p.topics],
        personality: p.personality,
        postFrequency: p.postFrequency,
      })),
    };
  }),

  /** Trigger a simulation cycle (admin/system action) */
  runCycle: protectedProcedure
    .input(z.object({
      count: z.number().min(1).max(10).default(3),
      topic: z.string().optional(),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      await ensureSimulationTables();
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const results = await runSimulationCycle(db, input.count);
      return { success: true, generated: results.length, posts: results };
    }),

  /** Get simulation statistics */
  getStats: publicProcedure.query(async () => {
    await ensureSimulationTables();
    const db = await getDb();
    if (!db) return { totalPosts: 0, totalActivity: 0, byPersona: [], topTopics: [] };

    const [postRows] = await db.execute(sql.raw(
      `SELECT persona_id, persona_name, persona_avatar, COUNT(*) as post_count, SUM(likes) as total_likes FROM simulation_posts GROUP BY persona_id, persona_name, persona_avatar ORDER BY post_count DESC`,
    )) as any[];
    const byPersona: any[] = Array.isArray(postRows) ? postRows : [];

    const [topicRows] = await db.execute(sql.raw(
      `SELECT topic, COUNT(*) as cnt FROM simulation_posts GROUP BY topic ORDER BY cnt DESC LIMIT 10`,
    )) as any[];
    const topTopics: any[] = Array.isArray(topicRows) ? topicRows : [];

    const [totalRows] = await db.execute(sql.raw(
      `SELECT COUNT(*) as total FROM simulation_posts`,
    )) as any[];
    const totalData: any[] = Array.isArray(totalRows) ? totalRows : [];

    const [activityRows] = await db.execute(sql.raw(
      `SELECT COUNT(*) as total FROM simulation_activity_log`,
    )) as any[];
    const activityData: any[] = Array.isArray(activityRows) ? activityRows : [];

    return {
      totalPosts: Number(totalData[0]?.total ?? 0),
      totalActivity: Number(activityData[0]?.total ?? 0),
      byPersona: byPersona.map((r) => ({
        personaId: r.persona_id,
        personaName: r.persona_name,
        personaAvatar: r.persona_avatar,
        postCount: Number(r.post_count),
        totalLikes: Number(r.total_likes),
      })),
      topTopics: topTopics.map((r) => ({ topic: r.topic, count: Number(r.cnt) })),
    };
  }),

  /** Seed initial simulation posts if none exist */
  seedIfEmpty: protectedProcedure.mutation(async ({ ctx: _ctx }) => {
    await ensureSimulationTables();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [countRows] = await db.execute(sql.raw(
      `SELECT COUNT(*) as total FROM simulation_posts`,
    )) as any[];
    const countData: any[] = Array.isArray(countRows) ? countRows : [];
    const existing = Number(countData[0]?.total ?? 0);

    if (existing > 0) {
      return { success: true, message: `Already seeded with ${existing} posts`, generated: 0 };
    }

    // Generate 2 posts per persona
    let generated = 0;
    for (const persona of AI_PERSONAS) {
      const topic = persona.topics[0];
      try {
        const content = await generatePersonaPost(persona, topic);
        const likes = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100) + 10;
        const comments = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 20) + 2;
        const shares = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10);
        await db.execute(sql.raw(
          `INSERT INTO simulation_posts (persona_id, persona_name, persona_handle, persona_avatar, content, topic, likes, comments, shares, blend_weight)
           VALUES ('${persona.id}', '${persona.name.replace(/'/g, "''")}', '${persona.handle}', '${persona.avatar}', '${content.replace(/'/g, "''")}', '${topic}', ${likes}, ${comments}, ${shares}, ${0.7 + (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.3})`,
        ));
        generated++;
      } catch (err) {
              }
    }

    return { success: true, message: `Seeded ${generated} posts`, generated };
  }),
});

// ─── Auto-seed on startup ─────────────────────────────────────────────────────

export async function autoSeedSimulation() {
  try {
    await ensureSimulationTables();
    const db = await getDb();
    if (!db) return;

    const [countRows] = await db.execute(sql.raw(
      `SELECT COUNT(*) as total FROM simulation_posts`,
    )) as any[];
    const countData: any[] = Array.isArray(countRows) ? countRows : [];
    const existing = Number(countData[0]?.total ?? 0);

    if (existing < 5) {
            await runSimulationCycle(db, 4);
          }
  } catch (err) {
      }
}
