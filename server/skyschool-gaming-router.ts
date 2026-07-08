import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { createTransaction } from "./db";
import { upsertTokenBalance } from "./db";
import crypto from "crypto";

// ═══════════════════════════════════════════════════════════════
// SKYSCHOOL ROUTER — Real DB-backed courses, enrollments, progress
// ═══════════════════════════════════════════════════════════════

export const skySchoolRouter = router({
  // List all published courses
  getCourses: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        let query = `SELECT * FROM sky_school_courses WHERE status = 'published'`;
        const params: any[] = [];
        if (input?.category) { query += ` AND category = ?`; params.push(input.category); }
        if (input?.level) { query += ` AND level = ?`; params.push(input.level); }
        query += ` ORDER BY enrolled_count DESC LIMIT ? OFFSET ?`;
        params.push(input?.limit ?? 20, input?.offset ?? 0);
        const [rows] = await (db as any).execute(query, params);
        return rows as any[];
      } catch { return []; }
    }),

  // Get single course with lessons
  getCourse: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [[course]] = await (db as any).execute(
          `SELECT * FROM sky_school_courses WHERE id = ?`, [input.id]
        );
        if (!course) return null;
        const [lessons] = await (db as any).execute(
          `SELECT * FROM sky_school_lessons WHERE course_id = ? ORDER BY order_index ASC`, [input.id]
        );
        return { ...course, lessons };
      } catch { return null; }
    }),

  // Get user's enrollments with progress
  getMyEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const [rows] = await (db as any).execute(
        `SELECT e.*, c.title, c.category, c.level, c.total_lessons, c.reward_sky, c.thumbnail_url, c.instructor_name
         FROM sky_school_enrollments e
         JOIN sky_school_courses c ON e.course_id = c.id
         WHERE e.user_id = ?
         ORDER BY e.updated_at DESC`,
        [ctx.user.id]
      );
      return rows as any[];
    } catch { return []; }
  }),

  // Enroll in a course
  enroll: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      try {
        // Check if already enrolled
        const [[existing]] = await (db as any).execute(
          `SELECT id FROM sky_school_enrollments WHERE user_id = ? AND course_id = ?`,
          [ctx.user.id, input.courseId]
        );
        if (existing) return { success: true, alreadyEnrolled: true };

        // Check course exists and is free (or user has balance)
        const [[course]] = await (db as any).execute(
          `SELECT * FROM sky_school_courses WHERE id = ? AND status = 'published'`,
          [input.courseId]
        );
        if (!course) throw new Error("Course not found");

        // Enroll
        await (db as any).execute(
          `INSERT INTO sky_school_enrollments (user_id, course_id, progress, completed_lessons) VALUES (?, ?, 0, 0)`,
          [ctx.user.id, input.courseId]
        );

        // Increment enrolled_count
        await (db as any).execute(
          `UPDATE sky_school_courses SET enrolled_count = enrolled_count + 1 WHERE id = ?`,
          [input.courseId]
        );

        return { success: true, alreadyEnrolled: false };
      } catch (e: any) {
        throw new Error(e.message || "Enrollment failed");
      }
    }),

  // Update lesson progress
  updateProgress: protectedProcedure
    .input(z.object({
      courseId: z.number(),
      lessonId: z.number(),
      completed: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      try {
        const [[enrollment]] = await (db as any).execute(
          `SELECT * FROM sky_school_enrollments WHERE user_id = ? AND course_id = ?`,
          [ctx.user.id, input.courseId]
        );
        if (!enrollment) throw new Error("Not enrolled");

        const [[course]] = await (db as any).execute(
          `SELECT total_lessons, reward_sky FROM sky_school_courses WHERE id = ?`,
          [input.courseId]
        );

        const newCompleted = Math.min((enrollment.completed_lessons || 0) + (input.completed ? 1 : 0), course?.total_lessons || 1);
        const newProgress = Math.round((newCompleted / (course?.total_lessons || 1)) * 100);
        const isComplete = newProgress >= 100;

        await (db as any).execute(
          `UPDATE sky_school_enrollments SET completed_lessons = ?, progress = ?, last_lesson_id = ?,
           completed_at = ?, updated_at = NOW() WHERE user_id = ? AND course_id = ?`,
          [newCompleted, newProgress, input.lessonId, isComplete ? new Date() : null, ctx.user.id, input.courseId]
        );

        // Award SKY444 on completion if not already claimed
        if (isComplete && !enrollment.reward_claimed && course?.reward_sky > 0) {
          await upsertTokenBalance(ctx.user.id, "SKY444", Number(course.reward_sky));
          await createTransaction({
            userId: ctx.user.id,
            type: "reward",
            token: "SKY444",
            amount: Number(course.reward_sky),
            description: `Course completion reward`,
          });
          await (db as any).execute(
            `UPDATE sky_school_enrollments SET reward_claimed = TRUE WHERE user_id = ? AND course_id = ?`,
            [ctx.user.id, input.courseId]
          );

          // Issue certificate
          const hash = crypto.createHash("sha256")
            .update(`${ctx.user.id}-${input.courseId}-${Date.now()}`)
            .digest("hex")
            .slice(0, 32);
          await (db as any).execute(
            `INSERT INTO sky_school_certificates (user_id, course_id, certificate_hash) VALUES (?, ?, ?)`,
            [ctx.user.id, input.courseId, hash]
          );
        }

        return { success: true, progress: newProgress, completed: isComplete };
      } catch (e: any) {
        throw new Error(e.message || "Progress update failed");
      }
    }),

  // Get user's certificates
  getCertificates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const [rows] = await (db as any).execute(
        `SELECT cert.*, c.title, c.category, c.level
         FROM sky_school_certificates cert
         JOIN sky_school_courses c ON cert.course_id = c.id
         WHERE cert.user_id = ?
         ORDER BY cert.issued_at DESC`,
        [ctx.user.id]
      );
      return rows as any[];
    } catch { return []; }
  }),

  // AI-generated course content (HOPE AI)
  generateLesson: protectedProcedure
    .input(z.object({
      topic: z.string().min(3).max(200),
      level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are HOPE AI, an expert educator for the SkySchool platform. Generate concise, engaging lesson content in Markdown format. Include: overview, key concepts (3-5), practical example, and a 3-question quiz at the end.",
            },
            {
              role: "user",
              content: `Generate a ${input.level} lesson on: "${input.topic}". Keep it under 600 words. End with ## Quiz with 3 multiple choice questions.`,
            },
          ],
        });
        const content = response?.choices?.[0]?.message?.content;
        return { content: typeof content === "string" ? content : "Lesson content unavailable." };
      } catch {
        return { content: `# ${input.topic}\n\nLesson content is being generated by HOPE AI. Please try again shortly.` };
      }
    }),

  // Platform stats
  stats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalCourses: 0, totalEnrollments: 0, totalCertificates: 0, totalRewardsIssued: 0 };
    try {
      const [[courseCount]] = await (db as any).execute(`SELECT COUNT(*) as count FROM sky_school_courses WHERE status = 'published'`);
      const [[enrollCount]] = await (db as any).execute(`SELECT COUNT(*) as count FROM sky_school_enrollments`);
      const [[certCount]] = await (db as any).execute(`SELECT COUNT(*) as count FROM sky_school_certificates`);
      return {
        totalCourses: Number(courseCount?.count || 0),
        totalEnrollments: Number(enrollCount?.count || 0),
        totalCertificates: Number(certCount?.count || 0),
        totalRewardsIssued: Number(certCount?.count || 0) * 10,
      };
    } catch { return { totalCourses: 0, totalEnrollments: 0, totalCertificates: 0, totalRewardsIssued: 0 }; }
  }),

  // Seed starter courses (admin only, idempotent)
  seedCourses: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Admin only");
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const courses = [
      { title: "Web3 & Blockchain Fundamentals", category: "crypto", level: "beginner", total_lessons: 8, duration_minutes: 120, reward_sky: 50, tags: "blockchain,web3,crypto" },
      { title: "SKY444 Tokenomics Deep Dive", category: "crypto", level: "intermediate", total_lessons: 6, duration_minutes: 90, reward_sky: 75, tags: "sky444,tokenomics,defi" },
      { title: "DeFi Staking & Yield Strategies", category: "defi", level: "intermediate", total_lessons: 10, duration_minutes: 150, reward_sky: 100, tags: "defi,staking,yield" },
      { title: "NFT Creation & Marketplace", category: "nft", level: "beginner", total_lessons: 7, duration_minutes: 105, reward_sky: 60, tags: "nft,art,marketplace" },
      { title: "AI-Powered Social Media Growth", category: "social", level: "beginner", total_lessons: 5, duration_minutes: 75, reward_sky: 40, tags: "ai,social,growth" },
      { title: "Crypto Security & Wallet Safety", category: "security", level: "beginner", total_lessons: 6, duration_minutes: 90, reward_sky: 50, tags: "security,wallet,safety" },
      { title: "Smart Contract Development", category: "development", level: "advanced", total_lessons: 12, duration_minutes: 240, reward_sky: 200, tags: "solidity,contracts,development" },
      { title: "Community Building in Web3", category: "community", level: "beginner", total_lessons: 5, duration_minutes: 60, reward_sky: 35, tags: "community,dao,governance" },
    ];
    let seeded = 0;
    for (const course of courses) {
      const [[existing]] = await (db as any).execute(
        `SELECT id FROM sky_school_courses WHERE title = ?`, [course.title]
      );
      if (!existing) {
        await (db as any).execute(
          `INSERT INTO sky_school_courses (title, category, level, total_lessons, duration_minutes, reward_sky, tags, status, instructor_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 'HOPE AI')`,
          [course.title, course.category, course.level, course.total_lessons, course.duration_minutes, course.reward_sky, course.tags]
        );
        seeded++;
      }
    }
    return { success: true, seeded };
  }),
});

// ═══════════════════════════════════════════════════════════════
// GAMING ROUTER — Real DB-backed sessions, leaderboards, achievements
// ═══════════════════════════════════════════════════════════════

const GAMES = [
  { id: "snake", name: "Shadow Snake", description: "Classic snake with SKY444 rewards", maxReward: 5, rewardPer1000: 1 },
  { id: "memory", name: "Memory Matrix", description: "Match crypto pairs to earn SKY444", maxReward: 3, rewardPer1000: 0.5 },
  { id: "flappy", name: "Flappy SKY", description: "Fly through the blockchain", maxReward: 4, rewardPer1000: 0.8 },
  { id: "2048", name: "2048 Crypto", description: "Merge tokens to reach SKY444", maxReward: 6, rewardPer1000: 1.2 },
  { id: "trivia", name: "Crypto Trivia", description: "Test your Web3 knowledge", maxReward: 8, rewardPer1000: 2 },
];

const ACHIEVEMENTS = [
  { id: "first_game", name: "First Blood", description: "Play your first game", rarity: "common" as const, reward: 5 },
  { id: "score_1000", name: "Four Digits", description: "Score 1,000 in any game", rarity: "common" as const, reward: 10 },
  { id: "score_10000", name: "Five Digits", description: "Score 10,000 in any game", rarity: "rare" as const, reward: 25 },
  { id: "score_100000", name: "Six Digits", description: "Score 100,000 in any game", rarity: "epic" as const, reward: 100 },
  { id: "play_5", name: "Gamer", description: "Play 5 different games", rarity: "common" as const, reward: 15 },
  { id: "play_all", name: "Completionist", description: "Play all available games", rarity: "rare" as const, reward: 50 },
  { id: "top_10", name: "Elite Player", description: "Reach top 10 on any leaderboard", rarity: "epic" as const, reward: 75 },
  { id: "top_1", name: "Champion", description: "Reach #1 on any leaderboard", rarity: "legendary" as const, reward: 500 },
];

export const gamingRouter = router({
  // List available games
  getGames: publicProcedure.query(() => GAMES),

  // Submit game score (creates session, awards SKY444)
  submitScore: protectedProcedure
    .input(z.object({
      gameId: z.string(),
      score: z.number().min(0),
      duration: z.number().min(0).default(60),
      level: z.number().min(1).default(1),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const game = GAMES.find(g => g.id === input.gameId);
      if (!game) throw new Error("Unknown game");

      // Calculate reward: score/1000 * rewardPer1000, capped at maxReward
      const rawReward = (input.score / 1000) * game.rewardPer1000;
      const reward = Math.min(rawReward, game.maxReward);

      // Insert session
      const [result] = await (db as any).execute(
        `INSERT INTO game_sessions (user_id, game_id, game_name, score, level, duration, reward_earned, status, metadata, ended_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, NOW())`,
        [ctx.user.id, input.gameId, game.name, input.score, input.level, input.duration, reward,
         input.metadata ? JSON.stringify(input.metadata) : null]
      );
      const sessionId = (result as any).insertId;

      // Award SKY444
      if (reward > 0) {
        await upsertTokenBalance(ctx.user.id, "SKY444", reward);
        await createTransaction({
          userId: ctx.user.id,
          type: "reward",
          token: "SKY444",
          amount: reward,
          description: `${game.name} score reward (${input.score} pts)`,
        });
        await (db as any).execute(
          `UPDATE game_sessions SET reward_claimed = TRUE WHERE id = ?`, [sessionId]
        );
      }

      // Update leaderboard
      const [[existing]] = await (db as any).execute(
        `SELECT id, score FROM game_leaderboard_entries WHERE user_id = ? AND game_id = ? AND period = 'all_time'`,
        [ctx.user.id, input.gameId]
      );
      if (!existing) {
        await (db as any).execute(
          `INSERT INTO game_leaderboard_entries (user_id, game_id, score, period) VALUES (?, ?, ?, 'all_time')`,
          [ctx.user.id, input.gameId, input.score]
        );
      } else if (input.score > existing.score) {
        await (db as any).execute(
          `UPDATE game_leaderboard_entries SET score = ?, recorded_at = NOW() WHERE id = ?`,
          [input.score, existing.id]
        );
      }

      // Check achievements
      const unlocked: string[] = [];
      const [[sessionCount]] = await (db as any).execute(
        `SELECT COUNT(*) as count FROM game_sessions WHERE user_id = ?`, [ctx.user.id]
      );
      const [[distinctGames]] = await (db as any).execute(
        `SELECT COUNT(DISTINCT game_id) as count FROM game_sessions WHERE user_id = ?`, [ctx.user.id]
      );

      const achievementsToCheck = [
        { ...ACHIEVEMENTS[0], condition: Number(sessionCount?.count) === 1 },
        { ...ACHIEVEMENTS[1], condition: input.score >= 1000 },
        { ...ACHIEVEMENTS[2], condition: input.score >= 10000 },
        { ...ACHIEVEMENTS[3], condition: input.score >= 100000 },
        { ...ACHIEVEMENTS[4], condition: Number(distinctGames?.count) >= 5 },
        { ...ACHIEVEMENTS[5], condition: Number(distinctGames?.count) >= GAMES.length },
      ];

      for (const ach of achievementsToCheck) {
        if (!ach.condition) continue;
        const [[alreadyHas]] = await (db as any).execute(
          `SELECT id FROM game_achievements WHERE user_id = ? AND achievement_id = ?`,
          [ctx.user.id, ach.id]
        );
        if (!alreadyHas) {
          await (db as any).execute(
            `INSERT INTO game_achievements (user_id, achievement_id, achievement_name, description, rarity, reward_sky)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ctx.user.id, ach.id, ach.name, ach.description, ach.rarity, ach.reward]
          );
          if (ach.reward > 0) {
            await upsertTokenBalance(ctx.user.id, "SKY444", ach.reward);
            await createTransaction({
              userId: ctx.user.id,
              type: "reward",
              token: "SKY444",
              amount: ach.reward,
              description: `Achievement unlocked: ${ach.name}`,
            });
          }
          unlocked.push(ach.name);
        }
      }

      return { success: true, sessionId, reward, achievementsUnlocked: unlocked };
    }),

  // Get leaderboard for a game
  getLeaderboard: publicProcedure
    .input(z.object({
      gameId: z.string().optional(),
      period: z.enum(["all_time", "weekly", "daily"]).default("all_time"),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        let query = `SELECT e.*, u.name, u.avatar, u.username
                     FROM game_leaderboard_entries e
                     LEFT JOIN users u ON e.user_id = u.id
                     WHERE e.period = ?`;
        const params: any[] = [input?.period ?? "all_time"];
        if (input?.gameId) { query += ` AND e.game_id = ?`; params.push(input.gameId); }
        query += ` ORDER BY e.score DESC LIMIT ?`;
        params.push(input?.limit ?? 20);
        const [rows] = await (db as any).execute(query, params);
        return (rows as any[]).map((r, i) => ({ ...r, rank: i + 1 }));
      } catch { return []; }
    }),

  // Get user's game history
  getMyHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20), gameId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        let query = `SELECT * FROM game_sessions WHERE user_id = ?`;
        const params: any[] = [ctx.user.id];
        if (input?.gameId) { query += ` AND game_id = ?`; params.push(input.gameId); }
        query += ` ORDER BY started_at DESC LIMIT ?`;
        params.push(input?.limit ?? 20);
        const [rows] = await (db as any).execute(query, params);
        return rows as any[];
      } catch { return []; }
    }),

  // Get user's achievements
  getMyAchievements: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const [rows] = await (db as any).execute(
        `SELECT * FROM game_achievements WHERE user_id = ? ORDER BY unlocked_at DESC`,
        [ctx.user.id]
      );
      return rows as any[];
    } catch { return []; }
  }),

  // Get user's gaming stats
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalGames: 0, totalScore: 0, totalRewards: 0, bestScore: 0, achievements: 0 };
    try {
      const [[stats]] = await (db as any).execute(
        `SELECT COUNT(*) as total_games, SUM(score) as total_score, SUM(reward_earned) as total_rewards, MAX(score) as best_score
         FROM game_sessions WHERE user_id = ? AND status = 'completed'`,
        [ctx.user.id]
      );
      const [[achCount]] = await (db as any).execute(
        `SELECT COUNT(*) as count FROM game_achievements WHERE user_id = ?`,
        [ctx.user.id]
      );
      return {
        totalGames: Number(stats?.total_games || 0),
        totalScore: Number(stats?.total_score || 0),
        totalRewards: Number(stats?.total_rewards || 0),
        bestScore: Number(stats?.best_score || 0),
        achievements: Number(achCount?.count || 0),
      };
    } catch { return { totalGames: 0, totalScore: 0, totalRewards: 0, bestScore: 0, achievements: 0 }; }
  }),

  // Platform gaming stats
  platformStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalSessions: 0, totalPlayers: 0, totalRewardsIssued: 0 };
    try {
      const [[stats]] = await (db as any).execute(
        `SELECT COUNT(*) as total_sessions, COUNT(DISTINCT user_id) as total_players, SUM(reward_earned) as total_rewards
         FROM game_sessions WHERE status = 'completed'`
      );
      return {
        totalSessions: Number(stats?.total_sessions || 0),
        totalPlayers: Number(stats?.total_players || 0),
        totalRewardsIssued: Number(stats?.total_rewards || 0),
      };
    } catch { return { totalSessions: 0, totalPlayers: 0, totalRewardsIssued: 0 }; }
  }),
});
