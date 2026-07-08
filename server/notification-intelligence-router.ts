/**
 * Notification Intelligence Engine
 * Priority scoring, smart batching, behavior-triggered notifications
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifPriority = "critical" | "high" | "medium" | "low" | "ambient";

interface NotifRecord {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  priority: NotifPriority;
  score: number;
  read: boolean | number;
  actor_id: number | null;
  entity_id: number | null;
  entity_type: string | null;
  batch_key: string | null;
  batch_count: number;
  created_at: Date;
  read_at: Date | null;
  action_url: string | null;
  metadata: string | null;
}

// ─── Priority Scoring Engine ──────────────────────────────────────────────────

const PRIORITY_WEIGHTS: Record<string, number> = {
  // Critical — always immediate
  security_alert: 100,
  payment_received: 95,
  withdrawal_complete: 95,
  account_suspended: 100,
  // High — near-immediate
  mention: 80,
  dm_received: 85,
  live_started: 75,
  stream_gift: 90,
  tip_received: 88,
  subscription_new: 85,
  // Medium — batched
  comment: 60,
  reply: 65,
  like_milestone: 55,
  follow: 50,
  community_post: 45,
  // Low — digest
  trending_content: 30,
  weekly_summary: 20,
  recommendation: 25,
  // Ambient — background
  system_update: 10,
  feature_announcement: 15,
};

function computePriorityScore(
  type: string,
  actorReputation: number,
  userEngagementRate: number,
  timeSensitive: boolean,
): { score: number; priority: NotifPriority } {
  const base = PRIORITY_WEIGHTS[type] ?? 40;
  const reputationBonus = actorReputation > 80 ? 10 : actorReputation > 50 ? 5 : 0;
  const engagementMultiplier = 1 + userEngagementRate * 0.2;
  const urgencyBonus = timeSensitive ? 15 : 0;

  const score = Math.min(100, Math.round((base + reputationBonus + urgencyBonus) * engagementMultiplier));

  let priority: NotifPriority;
  if (score >= 90) priority = "critical";
  else if (score >= 70) priority = "high";
  else if (score >= 45) priority = "medium";
  else if (score >= 20) priority = "low";
  else priority = "ambient";

  return { score, priority };
}

// ─── Batch Key Builder ────────────────────────────────────────────────────────

function buildBatchKey(type: string, entityId: number | null): string | null {
  const batchableTypes = ["like", "follow", "comment", "community_post", "recommendation"];
  if (!batchableTypes.includes(type)) return null;
  return entityId ? `${type}:${entityId}` : `${type}:global`;
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

let tableEnsured = false;
async function ensureNotifTable() {
  if (tableEnsured) return;
  const db = await getDb();
  if (!db) return;
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS notification_intelligence (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      priority ENUM('critical','high','medium','low','ambient') NOT NULL DEFAULT 'medium',
      score INT NOT NULL DEFAULT 50,
      \`read\` TINYINT(1) NOT NULL DEFAULT 0,
      actor_id INT,
      entity_id INT,
      entity_type VARCHAR(64),
      batch_key VARCHAR(128),
      batch_count INT NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      action_url VARCHAR(512),
      metadata JSON,
      INDEX idx_user_read (user_id, \`read\`),
      INDEX idx_user_priority (user_id, priority, created_at),
      INDEX idx_batch_key (user_id, batch_key)
    )
  `));
  tableEnsured = true;
}

async function getOrCreateBatch(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  batchKey: string,
  title: string,
  score: number,
): Promise<void> {
  const [existing] = await db.execute(sql.raw(
    `SELECT id, batch_count FROM notification_intelligence WHERE user_id=${userId} AND batch_key='${batchKey.replace(/'/g, "''")}' AND \`read\`=0 ORDER BY created_at DESC LIMIT 1`,
  )) as any[];

  const rows = Array.isArray(existing) ? existing : [existing];
  const row = rows[0];

  if (row && row.id) {
    const newCount = (row.batch_count ?? 1) + 1;
    const batchTitle = title.replace(/^1 /, `${newCount} `);
    await db.execute(sql.raw(
      `UPDATE notification_intelligence SET batch_count=${newCount}, title='${batchTitle.replace(/'/g, "''")}', score=GREATEST(score,${score}), created_at=NOW() WHERE id=${row.id}`,
    ));
  }
}

async function insertNotifRaw(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  type: string,
  title: string,
  body: string,
  priority: NotifPriority,
  score: number,
  actorId: number | null,
  entityId: number | null,
  entityType: string | null,
  actionUrl: string | null,
): Promise<void> {
  const batchKey = buildBatchKey(type, entityId);
  const esc = (s: string | null) => s ? `'${s.replace(/'/g, "''")}'` : "NULL";
  const num = (n: number | null) => n !== null ? String(n) : "NULL";

  if (batchKey) {
    // Try to find existing batch
    const [existing] = await db.execute(sql.raw(
      `SELECT id, batch_count FROM notification_intelligence WHERE user_id=${userId} AND batch_key=${esc(batchKey)} AND \`read\`=0 ORDER BY created_at DESC LIMIT 1`,
    )) as any[];
    const rows = Array.isArray(existing) ? existing : [existing];
    const row = rows[0];

    if (row && row.id) {
      const newCount = (row.batch_count ?? 1) + 1;
      const batchTitle = title.replace(/^1 /, `${newCount} `);
      await db.execute(sql.raw(
        `UPDATE notification_intelligence SET batch_count=${newCount}, title=${esc(batchTitle)}, score=GREATEST(score,${score}), created_at=NOW() WHERE id=${row.id}`,
      ));
      return;
    }
  }

  await db.execute(sql.raw(
    `INSERT INTO notification_intelligence (user_id,type,title,body,priority,score,actor_id,entity_id,entity_type,batch_key,action_url) VALUES (${userId},${esc(type)},${esc(title)},${esc(body)},${esc(priority)},${score},${num(actorId)},${num(entityId)},${esc(entityType)},${esc(batchKey)},${esc(actionUrl)})`,
  ));
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const notificationIntelligenceRouter = router({
  /** Get smart-ranked notifications for the current user */
  getIntelligentFeed: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(30),
      filter: z.enum(["all", "unread", "critical", "high", "medium", "low"]).default("all"),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      await ensureNotifTable();
      const db = await getDb();
      if (!db) return { notifications: [], total: 0, unreadCount: 0 };

      const { limit, filter, offset } = input;
      let whereExtra = "";
      if (filter === "unread") whereExtra = " AND `read` = 0";
      else if (["critical", "high", "medium", "low"].includes(filter)) whereExtra = ` AND priority = '${filter}'`;

      const [rows] = await db.execute(sql.raw(
        `SELECT * FROM notification_intelligence WHERE user_id=${ctx.user.id}${whereExtra} ORDER BY score DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      )) as any[];
      const notifs: NotifRecord[] = Array.isArray(rows) ? rows : [];

      const [countRows] = await db.execute(sql.raw(
        `SELECT COUNT(*) as total, SUM(\`read\`=0) as unread FROM notification_intelligence WHERE user_id=${ctx.user.id}`,
      )) as any[];
      const counts = Array.isArray(countRows) ? countRows[0] : countRows;

      return {
        notifications: notifs.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          priority: n.priority,
          score: n.score,
          read: !!n.read,
          actorId: n.actor_id,
          entityId: n.entity_id,
          entityType: n.entity_type,
          batchCount: n.batch_count ?? 1,
          createdAt: n.created_at,
          readAt: n.read_at,
          actionUrl: n.action_url,
        })),
        total: Number(counts?.total ?? 0),
        unreadCount: Number(counts?.unread ?? 0),
      };
    }),

  /** Mark notification(s) as read */
  markRead: protectedProcedure
    .input(z.object({
      ids: z.array(z.number()).optional(),
      all: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureNotifTable();
      const db = await getDb();
      if (!db) return { success: false };

      if (input.all) {
        await db.execute(sql.raw(
          `UPDATE notification_intelligence SET \`read\`=1, read_at=NOW() WHERE user_id=${ctx.user.id} AND \`read\`=0`,
        ));
      } else if (input.ids && input.ids.length > 0) {
        const idList = input.ids.join(",");
        await db.execute(sql.raw(
          `UPDATE notification_intelligence SET \`read\`=1, read_at=NOW() WHERE id IN (${idList}) AND user_id=${ctx.user.id}`,
        ));
      }
      return { success: true };
    }),

  /** Push a notification with intelligent priority scoring */
  pushNotification: protectedProcedure
    .input(z.object({
      targetUserId: z.number(),
      type: z.string(),
      title: z.string(),
      body: z.string(),
      actorId: z.number().optional(),
      entityId: z.number().optional(),
      entityType: z.string().optional(),
      actionUrl: z.string().optional(),
      timeSensitive: z.boolean().default(false),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      await ensureNotifTable();
      const db = await getDb();
      if (!db) return { success: false, priority: "medium" as NotifPriority, score: 50 };

      const { score, priority } = computePriorityScore(
        input.type,
        50, // default actor reputation
        0.5, // default engagement rate
        input.timeSensitive,
      );

      await insertNotifRaw(
        db,
        input.targetUserId,
        input.type,
        input.title,
        input.body,
        priority,
        score,
        input.actorId ?? null,
        input.entityId ?? null,
        input.entityType ?? null,
        input.actionUrl ?? null,
      );

      return { success: true, priority, score };
    }),

  /** Get notification preferences */
  getPreferences: protectedProcedure.query(async ({ ctx: _ctx }) => {
    return {
      minPriority: "medium" as NotifPriority,
      batchingEnabled: true,
      digestMode: false,
      quietHoursStart: 22,
      quietHoursEnd: 8,
      channels: { inApp: true, push: true, email: false, sms: false },
      typeOverrides: {} as Record<string, NotifPriority>,
    };
  }),

  /** AI-powered notification summary */
  getAISummary: protectedProcedure.query(async ({ ctx }) => {
    await ensureNotifTable();
    const db = await getDb();
    if (!db) return { summary: "You're all caught up!", highlights: [] };

    const [rows] = await db.execute(sql.raw(
      `SELECT type, COUNT(*) as cnt, MAX(score) as max_score FROM notification_intelligence WHERE user_id=${ctx.user.id} AND \`read\`=0 GROUP BY type ORDER BY max_score DESC LIMIT 10`,
    )) as any[];
    const data: any[] = Array.isArray(rows) ? rows : [];

    if (!data || data.length === 0) {
      return { summary: "You're all caught up! No unread notifications.", highlights: [] };
    }

    const summaryInput = data.map((r) => `${r.cnt}x ${r.type}`).join(", ");
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a notification assistant. Summarize unread notifications in 1-2 sentences, friendly and concise." },
        { role: "user", content: `Unread notifications: ${summaryInput}. Give a brief summary.` },
      ],
    });
    const rawSummary = response.choices?.[0]?.message?.content;
    const summary = typeof rawSummary === "string" ? rawSummary : "You have new activity waiting for you.";

    return {
      summary,
      highlights: data.slice(0, 5).map((r) => ({ type: r.type, count: Number(r.cnt) })),
    };
  }),

  /** Get notification analytics */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    await ensureNotifTable();
    const db = await getDb();
    if (!db) return { byPriority: [] };

    const [rows] = await db.execute(sql.raw(
      `SELECT 
        priority,
        COUNT(*) as total,
        SUM(\`read\`=1) as read_count,
        AVG(score) as avg_score,
        AVG(CASE WHEN read_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, created_at, read_at) END) as avg_read_time_secs
      FROM notification_intelligence 
      WHERE user_id=${ctx.user.id} AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY priority`,
    )) as any[];
    const data: any[] = Array.isArray(rows) ? rows : [];

    return {
      byPriority: data.map((r) => ({
        priority: r.priority,
        total: Number(r.total),
        readCount: Number(r.read_count),
        readRate: r.total > 0 ? Math.round((r.read_count / r.total) * 100) : 0,
        avgScore: Math.round(Number(r.avg_score)),
        avgReadTimeSecs: r.avg_read_time_secs ? Math.round(Number(r.avg_read_time_secs)) : null,
      })),
    };
  }),
});
