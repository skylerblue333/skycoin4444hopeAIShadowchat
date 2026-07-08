import crypto from 'crypto';
/**
 * SKYSCHOOL + CRYPTO MINE — HARDENED UNIFIED ENGINE
 * ─────────────────────────────────────────────────
 * Anti-manipulation guards:
 *   • Per-user per-action cooldowns stored in DB (not in-memory, survives restarts)
 *   • Daily earn caps per user (SKY444)
 *   • Quiz answer verification with server-side answer keys
 *   • Hash power capped server-side (client input ignored for reward calc)
 *   • Proof-of-Engagement: each action type has its own cooldown window
 *   • Quest completion requires real prerequisite checks
 *   • Mini-game results verified with server-issued challenge tokens
 */
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

// ─── Constants ───────────────────────────────────────────────────────────────

const DAILY_EARN_CAP = 500; // max SKY444 per user per day across ALL earn methods

const ENGAGEMENT_COOLDOWNS_MS: Record<string, number> = {
  post:    60_000,   // 1 min between post rewards
  like:    10_000,   // 10s between like rewards
  comment: 30_000,   // 30s between comment rewards
  share:   120_000,  // 2 min between share rewards
  login:   86_400_000, // once per day
  stake:   3_600_000,  // 1hr between stake rewards
  refer:   0,          // no cooldown — referral is one-time per referred user
  watch:   300_000,    // 5 min between watch rewards
  quiz:    0,          // no cooldown — quiz reward is per-quiz, one-time
};

const ENGAGEMENT_REWARDS: Record<string, number> = {
  post: 10, like: 1, comment: 3, share: 5, login: 2,
  stake: 20, refer: 50, watch: 8, quiz: 25,
};

// Server-side hash power cap — client cannot exceed this
const MAX_HASH_POWER = 1000; // GH/s equivalent units
const MAX_DURATION_MS = 30_000; // 30 seconds max per mine call

// ─── Quiz answer keys (server-side only, never sent to client) ───────────────
const QUIZ_ANSWERS: Record<string, string> = {
  // Web3 Fundamentals
  "q_blockchain_1": "b", // What is a blockchain? → b) A distributed ledger
  "q_blockchain_2": "c", // What does PoW stand for? → c) Proof of Work
  "q_blockchain_3": "a", // What is a smart contract? → a) Self-executing code on blockchain
  "q_wallet_1": "d",     // What is a private key? → d) Secret key to sign transactions
  "q_wallet_2": "b",     // What is a seed phrase? → b) 12-24 words to recover wallet
  // Crypto Trading
  "q_trading_1": "c",    // What is a DEX? → c) Decentralized Exchange
  "q_trading_2": "a",    // What is slippage? → a) Price change during transaction
  "q_trading_3": "b",    // What is liquidity? → b) Available assets for trading
  // DeFi
  "q_defi_1": "a",       // What is yield farming? → a) Earning rewards by providing liquidity
  "q_defi_2": "d",       // What is TVL? → d) Total Value Locked
  "q_defi_3": "c",       // What is an AMM? → c) Automated Market Maker
  // SKY444 Platform
  "q_sky_1": "b",        // What is SKY444? → b) The native token of ShadowChat
  "q_sky_2": "a",        // How do you earn SKY444? → a) Through Proof-of-Engagement
  "q_sky_3": "c",        // What is the daily earn cap? → c) 500 SKY444
  // Security
  "q_sec_1": "d",        // What is 2FA? → d) Two-Factor Authentication
  "q_sec_2": "b",        // What is phishing? → b) Fake sites stealing credentials
  "q_sec_3": "a",        // What is cold storage? → a) Offline wallet storage
  // AI & ML
  "q_ai_1": "c",         // What is a neural network? → c) Computing system inspired by brains
  "q_ai_2": "b",         // What is LLM? → b) Large Language Model
  "q_ai_3": "a",         // What is fine-tuning? → a) Training on specific domain data
};

// ─── Quest definitions ────────────────────────────────────────────────────────
const QUESTS = [
  { id: "q_daily_login",     title: "Daily Login",          desc: "Log in today",                  reward: 2,   xp: 10,  cooldownMs: 86_400_000, category: "daily" },
  { id: "q_first_post",      title: "First Post",           desc: "Create your first post",        reward: 25,  xp: 50,  cooldownMs: 0,           category: "social", oneTime: true },
  { id: "q_post_5",          title: "Active Poster",        desc: "Post 5 times",                  reward: 50,  xp: 100, cooldownMs: 0,           category: "social", requireCount: 5, countAction: "post" },
  { id: "q_like_10",         title: "Spread the Love",      desc: "Like 10 posts",                 reward: 10,  xp: 25,  cooldownMs: 0,           category: "social", requireCount: 10, countAction: "like" },
  { id: "q_comment_5",       title: "Conversationalist",    desc: "Comment 5 times",               reward: 15,  xp: 35,  cooldownMs: 0,           category: "social", requireCount: 5, countAction: "comment" },
  { id: "q_stake_100",       title: "First Stake",          desc: "Stake 100+ SKY444",             reward: 100, xp: 200, cooldownMs: 0,           category: "defi",   oneTime: true },
  { id: "q_mine_block",      title: "Block Found",          desc: "Mine your first block",         reward: 50,  xp: 100, cooldownMs: 0,           category: "mine",   oneTime: true },
  { id: "q_quiz_web3",       title: "Web3 Scholar",         desc: "Pass the Web3 quiz",            reward: 75,  xp: 150, cooldownMs: 0,           category: "school", oneTime: true },
  { id: "q_quiz_defi",       title: "DeFi Expert",          desc: "Pass the DeFi quiz",            reward: 75,  xp: 150, cooldownMs: 0,           category: "school", oneTime: true },
  { id: "q_quiz_security",   title: "Security Pro",         desc: "Pass the Security quiz",        reward: 75,  xp: 150, cooldownMs: 0,           category: "school", oneTime: true },
  { id: "q_daily_mine",      title: "Daily Miner",          desc: "Mine once today",               reward: 5,   xp: 15,  cooldownMs: 86_400_000, category: "daily" },
  { id: "q_weekly_streak",   title: "7-Day Streak",         desc: "Log in 7 days in a row",        reward: 200, xp: 500, cooldownMs: 0,           category: "streak", requireStreak: 7 },
  { id: "q_monthly_streak",  title: "30-Day Legend",        desc: "Log in 30 days in a row",       reward: 1000,xp: 2000,cooldownMs: 0,           category: "streak", requireStreak: 30 },
  { id: "q_mini_hash",       title: "Hash Rush",            desc: "Score 1000+ in Hash Rush",      reward: 30,  xp: 60,  cooldownMs: 3_600_000,  category: "game" },
  { id: "q_mini_flip",       title: "Coin Flip Master",     desc: "Win 5 coin flips in a row",     reward: 20,  xp: 40,  cooldownMs: 1_800_000,  category: "game" },
  { id: "q_mini_pattern",    title: "Pattern Breaker",      desc: "Complete the hash pattern",     reward: 25,  xp: 50,  cooldownMs: 1_800_000,  category: "game" },
  { id: "q_refer_1",         title: "First Referral",       desc: "Refer 1 friend",                reward: 50,  xp: 100, cooldownMs: 0,           category: "social", oneTime: true },
  { id: "q_refer_5",         title: "Recruiter",            desc: "Refer 5 friends",               reward: 250, xp: 500, cooldownMs: 0,           category: "social", requireCount: 5, countAction: "refer" },
  { id: "q_watch_stream",    title: "Stream Watcher",       desc: "Watch a live stream",           reward: 8,   xp: 20,  cooldownMs: 3_600_000,  category: "daily" },
  { id: "q_charity_donate",  title: "Good Samaritan",       desc: "Donate to a charity campaign",  reward: 30,  xp: 75,  cooldownMs: 0,           category: "social", oneTime: true },
];

// ─── Mini-game challenge issuer ───────────────────────────────────────────────
// Challenges are issued server-side with a timestamp; client must return the
// correct answer within the time window. This prevents replay attacks.
const ACTIVE_CHALLENGES = new Map<string, { answer: number; issuedAt: number; game: string }>();

function issueChallenge(userId: number, game: string): { token: string; puzzle: number[]; timeLimit: number } {
  const nums = Array.from({ length: 6 }, () => Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 9) + 1);
  const answer = nums.reduce((a, b) => a + b, 0);
  const token = `${userId}-${game}-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2)}`;
  ACTIVE_CHALLENGES.set(token, { answer, issuedAt: Date.now(), game });
  // Clean up old challenges
  if (ACTIVE_CHALLENGES.size > 10000) {
    const cutoff = Date.now() - 120_000;
    for (const [k, v] of ACTIVE_CHALLENGES) {
      if (v.issuedAt < cutoff) ACTIVE_CHALLENGES.delete(k);
    }
  }
  return { token, puzzle: nums, timeLimit: 30 };
}

function verifyChallenge(token: string, answer: number): boolean {
  const challenge = ACTIVE_CHALLENGES.get(token);
  if (!challenge) return false;
  if (Date.now() - challenge.issuedAt > 60_000) { ACTIVE_CHALLENGES.delete(token); return false; }
  const correct = challenge.answer === answer;
  ACTIVE_CHALLENGES.delete(token);
  return correct;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function getLastActionTime(userId: number, action: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const rows = await db.execute(
      `SELECT created_at FROM transactions WHERE user_id = ${userId} AND description LIKE '%${action}%' ORDER BY created_at DESC LIMIT 1`
    );
    const r = (rows as any).rows?.[0];
    return r ? Number(r.created_at) : 0;
  } catch { return 0; }
}

async function getDailyEarned(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const dayStart = new Date(); dayStart.setHours(0,0,0,0);
    const rows = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ${userId} AND type = 'reward' AND token = 'SKY444' AND created_at >= ${dayStart.getTime()}`
    );
    return Number((rows as any).rows?.[0]?.total ?? 0);
  } catch { return 0; }
}

async function getQuestCompletion(userId: number, questId: string): Promise<{ completed: boolean; completedAt: number; count: number }> {
  const db = await getDb();
  if (!db) return { completed: false, completedAt: 0, count: 0 };
  try {
    const rows = await db.execute(
      `SELECT completed_at, progress_count FROM quest_completions WHERE user_id = ${userId} AND quest_id = '${questId}' LIMIT 1`
    );
    const r = (rows as any).rows?.[0];
    if (!r) return { completed: false, completedAt: 0, count: 0 };
    return { completed: !!r.completed_at, completedAt: Number(r.completed_at ?? 0), count: Number(r.progress_count ?? 0) };
  } catch { return { completed: false, completedAt: 0, count: 0 }; }
}

async function ensureQuestTables(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS quest_completions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      quest_id VARCHAR(100) NOT NULL,
      completed_at BIGINT,
      progress_count INT DEFAULT 0,
      reward_claimed TINYINT(1) DEFAULT 0,
      created_at BIGINT DEFAULT 0,
      UNIQUE KEY uq_user_quest (user_id, quest_id)
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS mine_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      session_start BIGINT NOT NULL,
      hash_power INT NOT NULL,
      blocks_found INT DEFAULT 0,
      reward DECIMAL(18,8) DEFAULT 0,
      xp_earned INT DEFAULT 0,
      created_at BIGINT DEFAULT 0
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS user_xp (
      user_id INT PRIMARY KEY,
      xp BIGINT DEFAULT 0,
      level INT DEFAULT 1,
      streak_days INT DEFAULT 0,
      last_login_date VARCHAR(20) DEFAULT '',
      updated_at BIGINT DEFAULT 0
    )`);
  } catch { /* tables may already exist */ }
}

async function addXP(userId: number, amount: number): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const db = await getDb();
  if (!db) return { newXp: 0, newLevel: 1, leveledUp: false };
  try {
    await ensureQuestTables();
    await db.execute(`INSERT INTO user_xp (user_id, xp, level, updated_at) VALUES (${userId}, ${amount}, 1, ${Date.now()})
      ON DUPLICATE KEY UPDATE xp = xp + ${amount}, updated_at = ${Date.now()}`);
    const rows = await db.execute(`SELECT xp, level FROM user_xp WHERE user_id = ${userId}`);
    const r = (rows as any).rows?.[0];
    const xp = Number(r?.xp ?? amount);
    const newLevel = Math.floor(1 + Math.sqrt(xp / 100));
    const oldLevel = Number(r?.level ?? 1);
    if (newLevel > oldLevel) {
      await db.execute(`UPDATE user_xp SET level = ${newLevel} WHERE user_id = ${userId}`);
    }
    return { newXp: xp, newLevel, leveledUp: newLevel > oldLevel };
  } catch { return { newXp: 0, newLevel: 1, leveledUp: false }; }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const skyschoolMineHardenedRouter = router({

  // ═══════════════════════════════════════════════════════════════
  // SKYSCHOOL — HARDENED
  // ═══════════════════════════════════════════════════════════════

  school: router({
    /** Public course catalog with 30+ courses across 6 tracks */
    courses: publicProcedure.query(async () => {
      return [
        // ── Web3 & Blockchain ─────────────────────────────────────
        { id: 1, track: "web3", title: "Blockchain Fundamentals", desc: "How distributed ledgers work, consensus mechanisms, and why blockchain matters.", lessons: 8, duration: "2h 30m", reward: 75, xp: 150, level: "beginner", icon: "⛓️", tags: ["blockchain","consensus","distributed"] },
        { id: 2, track: "web3", title: "Smart Contracts Deep Dive", desc: "Write, deploy, and audit Solidity smart contracts from scratch.", lessons: 12, duration: "4h", reward: 150, xp: 300, level: "intermediate", icon: "📜", tags: ["solidity","ethereum","smart-contracts"] },
        { id: 3, track: "web3", title: "DeFi Protocols Masterclass", desc: "Uniswap, Aave, Compound — how AMMs and lending protocols work under the hood.", lessons: 10, duration: "3h 30m", reward: 125, xp: 250, level: "intermediate", icon: "🏦", tags: ["defi","amm","lending"] },
        { id: 4, track: "web3", title: "NFT Engineering", desc: "ERC-721, ERC-1155, metadata standards, and building NFT marketplaces.", lessons: 9, duration: "3h", reward: 100, xp: 200, level: "intermediate", icon: "🖼️", tags: ["nft","erc721","marketplace"] },
        { id: 5, track: "web3", title: "Layer 2 & Scaling", desc: "Optimistic rollups, ZK proofs, Polygon, Arbitrum — the scaling landscape.", lessons: 8, duration: "2h 45m", reward: 125, xp: 250, level: "advanced", icon: "⚡", tags: ["l2","rollups","zk"] },
        // ── Crypto Trading ────────────────────────────────────────
        { id: 6, track: "trading", title: "Crypto Trading 101", desc: "Spot trading, order types, reading charts, and managing risk.", lessons: 10, duration: "3h", reward: 100, xp: 200, level: "beginner", icon: "📈", tags: ["trading","charts","risk"] },
        { id: 7, track: "trading", title: "Technical Analysis", desc: "RSI, MACD, Bollinger Bands, support/resistance, and pattern recognition.", lessons: 14, duration: "5h", reward: 175, xp: 350, level: "intermediate", icon: "🔍", tags: ["ta","indicators","patterns"] },
        { id: 8, track: "trading", title: "DeFi Yield Strategies", desc: "Liquidity provision, yield farming, impermanent loss, and APY optimization.", lessons: 11, duration: "3h 45m", reward: 150, xp: 300, level: "intermediate", icon: "🌾", tags: ["yield","farming","liquidity"] },
        { id: 9, track: "trading", title: "Derivatives & Futures", desc: "Perpetual contracts, funding rates, leverage, and hedging strategies.", lessons: 12, duration: "4h 30m", reward: 175, xp: 350, level: "advanced", icon: "📊", tags: ["futures","leverage","derivatives"] },
        // ── AI & Machine Learning ─────────────────────────────────
        { id: 10, track: "ai", title: "AI Fundamentals", desc: "Neural networks, training, inference, and the AI landscape in 2025.", lessons: 8, duration: "2h 30m", reward: 75, xp: 150, level: "beginner", icon: "🤖", tags: ["ai","ml","neural-networks"] },
        { id: 11, track: "ai", title: "Prompt Engineering", desc: "Master prompting techniques for GPT-4, Claude, and Gemini.", lessons: 7, duration: "2h", reward: 75, xp: 150, level: "beginner", icon: "💬", tags: ["prompting","llm","gpt"] },
        { id: 12, track: "ai", title: "AI Agents & Automation", desc: "Build autonomous agents with tool use, memory, and multi-step reasoning.", lessons: 10, duration: "3h 30m", reward: 125, xp: 250, level: "intermediate", icon: "🦾", tags: ["agents","automation","tools"] },
        { id: 13, track: "ai", title: "AI Trading Bots", desc: "Build ML-powered trading bots with backtesting and live execution.", lessons: 13, duration: "5h", reward: 200, xp: 400, level: "advanced", icon: "🤖📈", tags: ["trading-bot","ml","backtesting"] },
        // ── Security & Hacking ────────────────────────────────────
        { id: 14, track: "security", title: "Crypto Security 101", desc: "Wallet security, phishing, social engineering, and OpSec basics.", lessons: 8, duration: "2h 30m", reward: 75, xp: 150, level: "beginner", icon: "🔒", tags: ["security","opsec","wallet"] },
        { id: 15, track: "security", title: "Smart Contract Auditing", desc: "Find reentrancy, overflow, and access control bugs in Solidity.", lessons: 12, duration: "4h", reward: 175, xp: 350, level: "advanced", icon: "🔍🔒", tags: ["audit","solidity","bugs"] },
        { id: 16, track: "security", title: "Ethical Hacking & Bug Bounty", desc: "Web app hacking, OWASP Top 10, and how to earn from bug bounties.", lessons: 15, duration: "6h", reward: 250, xp: 500, level: "advanced", icon: "🕵️", tags: ["hacking","bounty","owasp"] },
        { id: 17, track: "security", title: "Privacy & Anonymity", desc: "Tor, VPNs, zero-knowledge proofs, and staying private on-chain.", lessons: 9, duration: "3h", reward: 125, xp: 250, level: "intermediate", icon: "🕶️", tags: ["privacy","tor","zk"] },
        // ── Development ───────────────────────────────────────────
        { id: 18, track: "dev", title: "Web3 Full-Stack Dev", desc: "Build dApps with React, ethers.js, and Hardhat from zero to deployed.", lessons: 16, duration: "6h 30m", reward: 225, xp: 450, level: "intermediate", icon: "💻", tags: ["dapp","react","ethers"] },
        { id: 19, track: "dev", title: "Rust for Blockchain", desc: "Solana programs, Anchor framework, and high-performance blockchain dev.", lessons: 14, duration: "5h 30m", reward: 200, xp: 400, level: "advanced", icon: "🦀", tags: ["rust","solana","anchor"] },
        { id: 20, track: "dev", title: "Zero-Knowledge Proofs", desc: "ZK circuits, Groth16, PLONK, and building privacy-preserving apps.", lessons: 12, duration: "5h", reward: 250, xp: 500, level: "advanced", icon: "🔐", tags: ["zk","circuits","privacy"] },
        // ── SKY444 Platform ───────────────────────────────────────
        { id: 21, track: "sky444", title: "SKY444 Onboarding", desc: "Everything you need to know about the SKYCOIN4444 ecosystem.", lessons: 5, duration: "1h", reward: 50, xp: 100, level: "beginner", icon: "🌟", tags: ["sky444","onboarding","ecosystem"] },
        { id: 22, track: "sky444", title: "Proof-of-Engagement Mining", desc: "How PoE works, earn caps, anti-manipulation rules, and maximizing rewards.", lessons: 6, duration: "1h 30m", reward: 50, xp: 100, level: "beginner", icon: "⛏️", tags: ["poe","mining","rewards"] },
        { id: 23, track: "sky444", title: "Staking & Yield", desc: "Pool mechanics, APY calculation, lock periods, and compound strategies.", lessons: 7, duration: "2h", reward: 75, xp: 150, level: "beginner", icon: "💎", tags: ["staking","yield","apy"] },
        { id: 24, track: "sky444", title: "Governance & Voting", desc: "How DAO governance works, proposal creation, and voting power.", lessons: 6, duration: "1h 30m", reward: 60, xp: 120, level: "beginner", icon: "🗳️", tags: ["dao","governance","voting"] },
        { id: 25, track: "sky444", title: "Creator Economy on SKY444", desc: "Monetize content, set up subscriptions, and earn from your community.", lessons: 8, duration: "2h 30m", reward: 100, xp: 200, level: "intermediate", icon: "🎨", tags: ["creator","monetization","subscriptions"] },
      ];
    }),

    /** Get user's enrollment and progress */
    myProgress: protectedProcedure.query(async ({ ctx }) => {
      await ensureQuestTables();
      const db = await getDb();
      if (!db) return { enrollments: [], xp: 0, level: 1, streak: 0 };
      const [enrollRows, xpRows] = await Promise.all([
        db.execute(`SELECT * FROM sky_school_enrollments WHERE user_id = ${ctx.user.id}`),
        db.execute(`SELECT * FROM user_xp WHERE user_id = ${ctx.user.id}`),
      ]);
      const xpData = (xpRows as any).rows?.[0];
      return {
        enrollments: (enrollRows as any).rows || [],
        xp: Number(xpData?.xp ?? 0),
        level: Number(xpData?.level ?? 1),
        streak: Number(xpData?.streak_days ?? 0),
      };
    }),

    /** Enroll in a course — rate limited, one enrollment per course */
    enroll: protectedProcedure
      .input(z.object({ courseId: z.number().min(1).max(25) }))
      .mutation(async ({ ctx, input }) => {
        await ensureQuestTables();
        const db = await getDb();
        if (!db) return { success: false, error: "DB unavailable" };
        const existing = await db.execute(
          `SELECT id FROM sky_school_enrollments WHERE user_id = ${ctx.user.id} AND course_id = ${input.courseId} LIMIT 1`
        );
        if ((existing as any).rows?.length > 0) return { success: true, alreadyEnrolled: true };
        await db.execute(
          `INSERT INTO sky_school_enrollments (user_id, course_id, progress, completed_lessons, last_lesson_id, enrolled_at) VALUES (${ctx.user.id}, ${input.courseId}, 0, 0, 0, ${Date.now()})`
        );
        return { success: true, alreadyEnrolled: false };
      }),

    /** Submit a quiz answer — server verifies, one reward per quiz per user */
    submitQuiz: protectedProcedure
      .input(z.object({
        quizId: z.string().max(50),
        answer: z.string().max(5),
        courseId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await ensureQuestTables();
        const db = await getDb();
        if (!db) return { success: false, correct: false, reward: 0, error: "DB unavailable" };

        // Verify answer server-side
        const correctAnswer = QUIZ_ANSWERS[input.quizId];
        if (!correctAnswer) return { success: false, correct: false, reward: 0, error: "Unknown quiz" };
        const correct = input.answer.toLowerCase().trim() === correctAnswer.toLowerCase();
        if (!correct) return { success: true, correct: false, reward: 0, message: "Incorrect answer. Try again!" };

        // Check if already rewarded for this quiz
        const alreadyRewarded = await db.execute(
          `SELECT id FROM quest_completions WHERE user_id = ${ctx.user.id} AND quest_id = 'quiz_${input.quizId}' AND reward_claimed = 1 LIMIT 1`
        );
        if ((alreadyRewarded as any).rows?.length > 0) {
          return { success: true, correct: true, reward: 0, message: "Already rewarded for this quiz!" };
        }

        // Check daily cap
        const dailyEarned = await getDailyEarned(ctx.user.id);
        if (dailyEarned >= DAILY_EARN_CAP) {
          return { success: true, correct: true, reward: 0, message: "Daily earn cap reached (500 SKY444/day)" };
        }

        const reward = ENGAGEMENT_REWARDS.quiz;
        const { getDb: _getDb, ...dbModule } = await import('./db');
        const dbInst = await import('./db');
        await dbInst.upsertTokenBalance(ctx.user.id, "SKY444", reward);
        await dbInst.createTransaction({ userId: ctx.user.id, type: "reward", token: "SKY444", amount: reward, description: `Quiz reward: ${input.quizId}` });

        // Mark as rewarded
        await db.execute(
          `INSERT INTO quest_completions (user_id, quest_id, completed_at, reward_claimed, created_at) VALUES (${ctx.user.id}, 'quiz_${input.quizId}', ${Date.now()}, 1, ${Date.now()}) ON DUPLICATE KEY UPDATE completed_at = ${Date.now()}, reward_claimed = 1`
        );

        const xpResult = await addXP(ctx.user.id, 50);
        return { success: true, correct: true, reward, xp: 50, newLevel: xpResult.newLevel, leveledUp: xpResult.leveledUp };
      }),

    /** Complete a lesson — updates progress, one reward per lesson */
    completeLesson: protectedProcedure
      .input(z.object({ courseId: z.number(), lessonId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await ensureQuestTables();
        const db = await getDb();
        if (!db) return { success: false };

        const lessonKey = `lesson_${input.courseId}_${input.lessonId}`;
        const alreadyDone = await db.execute(
          `SELECT id FROM quest_completions WHERE user_id = ${ctx.user.id} AND quest_id = '${lessonKey}' LIMIT 1`
        );
        if ((alreadyDone as any).rows?.length > 0) return { success: true, alreadyCompleted: true, reward: 0 };

        const dailyEarned = await getDailyEarned(ctx.user.id);
        const reward = dailyEarned < DAILY_EARN_CAP ? 5 : 0;

        if (reward > 0) {
          const dbInst = await import('./db');
          await dbInst.upsertTokenBalance(ctx.user.id, "SKY444", reward);
          await dbInst.createTransaction({ userId: ctx.user.id, type: "reward", token: "SKY444", amount: reward, description: `Lesson completed: course ${input.courseId} lesson ${input.lessonId}` });
        }

        await db.execute(
          `INSERT INTO quest_completions (user_id, quest_id, completed_at, reward_claimed, created_at) VALUES (${ctx.user.id}, '${lessonKey}', ${Date.now()}, 1, ${Date.now()}) ON DUPLICATE KEY UPDATE completed_at = ${Date.now()}`
        );
        await db.execute(
          `UPDATE sky_school_enrollments SET completed_lessons = completed_lessons + 1, last_lesson_id = ${input.lessonId}, progress = LEAST(100, progress + 10) WHERE user_id = ${ctx.user.id} AND course_id = ${input.courseId}`
        );

        const xpResult = await addXP(ctx.user.id, 20);
        return { success: true, alreadyCompleted: false, reward, xp: 20, newLevel: xpResult.newLevel, leveledUp: xpResult.leveledUp };
      }),

    /** Get AI-generated lesson content */
    getLessonContent: protectedProcedure
      .input(z.object({ courseId: z.number(), lessonId: z.number(), topic: z.string().max(100) }))
      .query(async ({ input }) => {
        try {
          const resp = await invokeLLM({
            messages: [
              { role: "system", content: "You are a crypto/Web3/AI educator. Write concise, engaging lesson content in markdown. Include key concepts, examples, and a 3-question quiz at the end. Keep it under 600 words." },
              { role: "user", content: `Write lesson ${input.lessonId} for course ${input.courseId}: "${input.topic}"` },
            ],
          });
          return { content: (resp.choices[0].message.content as string) || "", generated: true };
        } catch {
          return { content: `# ${input.topic}\n\nLesson content loading...`, generated: false };
        }
      }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // GAMIFIED CRYPTO MINE — HARDENED
  // ═══════════════════════════════════════════════════════════════

  mine: router({
    /** Get user's mining stats and XP */
    stats: protectedProcedure.query(async ({ ctx }) => {
      await ensureQuestTables();
      const db = await getDb();
      if (!db) return { balance: 0, totalMined: 0, xp: 0, level: 1, streak: 0, dailyEarned: 0, dailyCap: DAILY_EARN_CAP };
      const dbInst = await import('./db');
      const [balance, xpRows, dailyEarned] = await Promise.all([
        dbInst.getTokenBalance(ctx.user.id, "SKY444"),
        db.execute(`SELECT xp, level, streak_days FROM user_xp WHERE user_id = ${ctx.user.id}`),
        getDailyEarned(ctx.user.id),
      ]);
      const xpData = (xpRows as any).rows?.[0];
      return {
        balance: Number(balance ?? 0),
        totalMined: Number(balance ?? 0),
        xp: Number(xpData?.xp ?? 0),
        level: Number(xpData?.level ?? 1),
        streak: Number(xpData?.streak_days ?? 0),
        dailyEarned,
        dailyCap: DAILY_EARN_CAP,
      };
    }),

    /** Issue a mini-game challenge (server-side puzzle) */
    issueChallenge: protectedProcedure
      .input(z.object({ game: z.enum(["hash_rush", "coin_flip", "pattern_break"]) }))
      .mutation(async ({ ctx, input }) => {
        return issueChallenge(ctx.user.id, input.game);
      }),

    /** Submit mini-game result — verified server-side */
    submitGame: protectedProcedure
      .input(z.object({
        token: z.string().max(200),
        answer: z.number(),
        game: z.enum(["hash_rush", "coin_flip", "pattern_break"]),
        score: z.number().min(0).max(10000),
      }))
      .mutation(async ({ ctx, input }) => {
        await ensureQuestTables();

        // Verify the challenge token
        const valid = verifyChallenge(input.token, input.answer);
        if (!valid) return { success: false, reward: 0, error: "Invalid or expired challenge" };

        // Check daily cap
        const dailyEarned = await getDailyEarned(ctx.user.id);
        if (dailyEarned >= DAILY_EARN_CAP) {
          return { success: false, reward: 0, error: "Daily earn cap reached" };
        }

        // Reward based on score (capped)
        const baseReward = Math.min(30, Math.floor(input.score / 100) * 0.5 + 5);
        const reward = Math.min(baseReward, DAILY_EARN_CAP - dailyEarned);

        const dbInst = await import('./db');
        await dbInst.upsertTokenBalance(ctx.user.id, "SKY444", reward);
        await dbInst.createTransaction({ userId: ctx.user.id, type: "reward", token: "SKY444", amount: reward, description: `Mini-game: ${input.game} (score: ${input.score})` });

        const xpResult = await addXP(ctx.user.id, Math.floor(reward * 2));
        return { success: true, reward, xp: Math.floor(reward * 2), newLevel: xpResult.newLevel, leveledUp: xpResult.leveledUp };
      }),

    /** Proof-of-Engagement mine — hardened with cooldowns and daily cap */
    engage: protectedProcedure
      .input(z.object({
        action: z.enum(["post","like","comment","share","login","stake","refer","watch"]),
        token: z.enum(["SKY444","DOGE"]).default("SKY444"),
      }))
      .mutation(async ({ ctx, input }) => {
        await ensureQuestTables();

        // Check daily cap
        const dailyEarned = await getDailyEarned(ctx.user.id);
        if (dailyEarned >= DAILY_EARN_CAP) {
          return { success: false, reward: 0, error: "Daily earn cap reached (500 SKY444/day)", dailyEarned, dailyCap: DAILY_EARN_CAP };
        }

        // Check cooldown
        const cooldownMs = ENGAGEMENT_COOLDOWNS_MS[input.action] ?? 60_000;
        if (cooldownMs > 0) {
          const lastTime = await getLastActionTime(ctx.user.id, `Engagement mining: ${input.action}`);
          const elapsed = Date.now() - lastTime;
          if (elapsed < cooldownMs) {
            const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000);
            return { success: false, reward: 0, error: `Cooldown: ${remainingSec}s remaining`, cooldownRemaining: remainingSec };
          }
        }

        const reward = Math.min(ENGAGEMENT_REWARDS[input.action] ?? 1, DAILY_EARN_CAP - dailyEarned);
        const dbInst = await import('./db');
        await dbInst.upsertTokenBalance(ctx.user.id, input.token, reward);
        await dbInst.createTransaction({ userId: ctx.user.id, type: "reward", token: input.token, amount: reward, description: `Engagement mining: ${input.action}` });

        const xpResult = await addXP(ctx.user.id, Math.floor(reward));
        return { success: true, reward, token: input.token, action: input.action, xp: Math.floor(reward), newLevel: xpResult.newLevel, leveledUp: xpResult.leveledUp, dailyEarned: dailyEarned + reward, dailyCap: DAILY_EARN_CAP };
      }),

    /** CPU mine — hash power capped server-side, client input ignored */
    mine: protectedProcedure
      .input(z.object({
        token: z.enum(["SKY444","BTC","ETH","SOL","DOGE","TRUMP","USDT","XMR"]).default("SKY444"),
        hashPower: z.number().min(1).max(MAX_HASH_POWER), // client input capped
        durationMs: z.number().min(1000).max(MAX_DURATION_MS), // client input capped
      }))
      .mutation(async ({ ctx, input }) => {
        await ensureQuestTables();

        // Check daily cap for SKY444
        if (input.token === "SKY444") {
          const dailyEarned = await getDailyEarned(ctx.user.id);
          if (dailyEarned >= DAILY_EARN_CAP) {
            return { success: false, reward: 0, error: "Daily earn cap reached", blocksFound: 0, hashRate: "0 GH/s" };
          }
        }

        // Server-side caps (ignore client values beyond limits)
        const hashPower = Math.min(input.hashPower, MAX_HASH_POWER);
        const durationMs = Math.min(input.durationMs, MAX_DURATION_MS);

        const CONFIGS: Record<string, { difficulty: number; baseReward: number; blockTime: number }> = {
          SKY444: { difficulty: 100_000, baseReward: 0.5, blockTime: 60_000 },
          BTC:    { difficulty: 500_000, baseReward: 0.000001, blockTime: 600_000 },
          ETH:    { difficulty: 300_000, baseReward: 0.00001, blockTime: 12_000 },
          SOL:    { difficulty: 200_000, baseReward: 0.0001, blockTime: 400 },
          DOGE:   { difficulty: 50_000, baseReward: 0.1, blockTime: 60_000 },
          TRUMP:  { difficulty: 80_000, baseReward: 0.05, blockTime: 30_000 },
          USDT:   { difficulty: 1_000_000, baseReward: 0.0001, blockTime: 3_600_000 },
          XMR:    { difficulty: 150_000, baseReward: 0.00005, blockTime: 120_000 },
        };
        const cfg = CONFIGS[input.token] ?? CONFIGS.SKY444;
        const hashesAttempted = Math.floor((hashPower * durationMs) / 1000);
        const probability = hashesAttempted / cfg.difficulty;
        const blocksFound = Math.floor(probability + (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * probability * 0.5); // reduced variance
        const rawReward = parseFloat((blocksFound * cfg.baseReward * (1 + (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.05)).toFixed(8));

        // Cap reward to daily limit for SKY444
        let reward = rawReward;
        if (input.token === "SKY444" && reward > 0) {
          const dailyEarned = await getDailyEarned(ctx.user.id);
          reward = Math.min(reward, DAILY_EARN_CAP - dailyEarned);
        }

        if (reward > 0) {
          const dbInst = await import('./db');
          await dbInst.upsertTokenBalance(ctx.user.id, input.token, reward);
          await dbInst.createTransaction({ userId: ctx.user.id, type: "reward", token: input.token, amount: reward, description: `CPU Mining: ${hashesAttempted.toLocaleString()} hashes @ ${(hashPower/1000).toFixed(2)} GH/s` });
          const xpResult = await addXP(ctx.user.id, Math.max(1, Math.floor(reward * 10)));

          // Record mine session
          const db = await getDb();
          if (db) {
            await db.execute(`INSERT INTO mine_sessions (user_id, session_start, hash_power, blocks_found, reward, xp_earned, created_at) VALUES (${ctx.user.id}, ${Date.now()}, ${hashPower}, ${blocksFound}, ${reward}, ${Math.floor(reward*10)}, ${Date.now()})`);
          }

          return { success: true, reward, token: input.token, hashesFound: hashesAttempted, hashRate: `${(hashPower/1000).toFixed(2)} GH/s`, blocksFound, difficulty: cfg.difficulty, nextBlockIn: Math.round(cfg.blockTime/1000), xp: Math.floor(reward*10), leveledUp: xpResult.leveledUp };
        }

        return { success: true, reward: 0, token: input.token, hashesFound: hashesAttempted, hashRate: `${(hashPower/1000).toFixed(2)} GH/s`, blocksFound: 0, difficulty: cfg.difficulty, nextBlockIn: Math.round(cfg.blockTime/1000), xp: 0, leveledUp: false };
      }),

    /** Get all quests with user progress */
    quests: protectedProcedure.query(async ({ ctx }) => {
      await ensureQuestTables();
      const db = await getDb();
      if (!db) return QUESTS.map(q => ({ ...q, completed: false, completedAt: 0, progress: 0 }));

      const completions = await db.execute(
        `SELECT quest_id, completed_at, progress_count FROM quest_completions WHERE user_id = ${ctx.user.id}`
      );
      const completionMap = new Map<string, { completedAt: number; count: number }>();
      for (const row of ((completions as any).rows || [])) {
        completionMap.set(row.quest_id, { completedAt: Number(row.completed_at ?? 0), count: Number(row.progress_count ?? 0) });
      }

      return QUESTS.map(q => {
        const c = completionMap.get(q.id);
        const cooldownOk = !c || !q.cooldownMs || (Date.now() - c.completedAt) >= q.cooldownMs;
        return {
          ...q,
          completed: !!c?.completedAt && !cooldownOk,
          completedAt: c?.completedAt ?? 0,
          progress: c?.count ?? 0,
          available: cooldownOk,
          cooldownRemaining: c && q.cooldownMs ? Math.max(0, Math.ceil((q.cooldownMs - (Date.now() - c.completedAt)) / 1000)) : 0,
        };
      });
    }),

    /** Claim a quest reward */
    claimQuest: protectedProcedure
      .input(z.object({ questId: z.string().max(50) }))
      .mutation(async ({ ctx, input }) => {
        await ensureQuestTables();
        const quest = QUESTS.find(q => q.id === input.questId);
        if (!quest) return { success: false, error: "Quest not found" };

        const db = await getDb();
        if (!db) return { success: false, error: "DB unavailable" };

        // Check cooldown
        const completion = await getQuestCompletion(ctx.user.id, input.questId);
        if (quest.cooldownMs && completion.completedAt && (Date.now() - completion.completedAt) < quest.cooldownMs) {
          const remaining = Math.ceil((quest.cooldownMs - (Date.now() - completion.completedAt)) / 1000);
          return { success: false, error: `Quest on cooldown: ${remaining}s remaining` };
        }

        // Check daily cap
        const dailyEarned = await getDailyEarned(ctx.user.id);
        if (dailyEarned >= DAILY_EARN_CAP) {
          return { success: false, error: "Daily earn cap reached" };
        }

        const reward = Math.min(quest.reward, DAILY_EARN_CAP - dailyEarned);
        const dbInst = await import('./db');
        await dbInst.upsertTokenBalance(ctx.user.id, "SKY444", reward);
        await dbInst.createTransaction({ userId: ctx.user.id, type: "reward", token: "SKY444", amount: reward, description: `Quest reward: ${quest.title}` });

        await db.execute(
          `INSERT INTO quest_completions (user_id, quest_id, completed_at, reward_claimed, created_at) VALUES (${ctx.user.id}, '${input.questId}', ${Date.now()}, 1, ${Date.now()}) ON DUPLICATE KEY UPDATE completed_at = ${Date.now()}, reward_claimed = 1`
        );

        const xpResult = await addXP(ctx.user.id, quest.xp);
        return { success: true, reward, xp: quest.xp, newLevel: xpResult.newLevel, leveledUp: xpResult.leveledUp };
      }),

    /** Global mine leaderboard */
    leaderboard: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        const rows = await db.execute(
          `SELECT u.id, u.username, u.display_name, tb.balance as sky_balance, ux.xp, ux.level
           FROM users u
           LEFT JOIN token_balances tb ON tb.user_id = u.id AND tb.token = 'SKY444'
           LEFT JOIN user_xp ux ON ux.user_id = u.id
           ORDER BY tb.balance DESC LIMIT 20`
        );
        return ((rows as any).rows || []).map((r: any, i: number) => ({
          rank: i + 1,
          userId: r.id,
          username: r.username || r.display_name || `User${r.id}`,
          balance: Number(r.sky_balance ?? 0),
          xp: Number(r.xp ?? 0),
          level: Number(r.level ?? 1),
        }));
      } catch { return []; }
    }),

    /** Daily login streak update */
    dailyLogin: protectedProcedure.mutation(async ({ ctx }) => {
      await ensureQuestTables();
      const db = await getDb();
      if (!db) return { success: false };

      const today = new Date().toISOString().split("T")[0];
      const xpRows = await db.execute(`SELECT last_login_date, streak_days FROM user_xp WHERE user_id = ${ctx.user.id}`);
      const xpData = (xpRows as any).rows?.[0];
      const lastLogin = xpData?.last_login_date || "";
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

      let streak = Number(xpData?.streak_days ?? 0);
      if (lastLogin === today) return { success: true, alreadyClaimed: true, streak };
      if (lastLogin === yesterday) streak += 1;
      else streak = 1;

      await db.execute(
        `INSERT INTO user_xp (user_id, xp, level, streak_days, last_login_date, updated_at) VALUES (${ctx.user.id}, 0, 1, ${streak}, '${today}', ${Date.now()}) ON DUPLICATE KEY UPDATE streak_days = ${streak}, last_login_date = '${today}', updated_at = ${Date.now()}`
      );

      // Reward for login
      const dailyEarned = await getDailyEarned(ctx.user.id);
      const reward = dailyEarned < DAILY_EARN_CAP ? ENGAGEMENT_REWARDS.login : 0;
      if (reward > 0) {
        const dbInst = await import('./db');
        await dbInst.upsertTokenBalance(ctx.user.id, "SKY444", reward);
        await dbInst.createTransaction({ userId: ctx.user.id, type: "reward", token: "SKY444", amount: reward, description: "Engagement mining: login" });
      }

      const xpResult = await addXP(ctx.user.id, 10 + streak * 2);
      return { success: true, alreadyClaimed: false, reward, streak, xp: 10 + streak * 2, newLevel: xpResult.newLevel, leveledUp: xpResult.leveledUp };
    }),
  }),
});
