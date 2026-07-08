/**
 * Economic Layer Router
 * Transaction fees, wallet ledger, action value system, SKY444 economy
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

// ─── Action Fee Table ─────────────────────────────────────────────────────────
const ACTION_FEES: Record<string, number> = {
  post: 0.5,
  comment: 0.1,
  like: 0.01,
  share: 0.05,
  tip: 0, // fee-free, tip goes direct
  swap: 0.3, // % of swap amount
  stake: 0, // fee-free staking
  nft_mint: 5.0,
  nft_buy: 0, // % taken from sale
  stream_start: 1.0,
  subscribe: 0, // % taken from subscription
  marketplace_list: 0.5,
  marketplace_buy: 0, // % taken from sale
  governance_vote: 0.25,
  quest_claim: 0,
  referral_reward: 0,
};

const PERCENTAGE_FEES: Record<string, number> = {
  swap: 0.003, // 0.3%
  nft_buy: 0.025, // 2.5%
  subscribe: 0.05, // 5%
  marketplace_buy: 0.025, // 2.5%
};

// ─── DB Helpers ───────────────────────────────────────────────────────────────
async function ensureEconomicTables() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sky_wallet_ledger (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      action_type VARCHAR(64) NOT NULL,
      amount DECIMAL(18,6) NOT NULL,
      fee DECIMAL(18,6) NOT NULL DEFAULT 0,
      net_amount DECIMAL(18,6) NOT NULL,
      direction ENUM('credit','debit') NOT NULL,
      reference_id VARCHAR(128),
      reference_type VARCHAR(64),
      description TEXT,
      balance_after DECIMAL(18,6) NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_action_type (action_type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sky_balances (
      user_id INT PRIMARY KEY,
      balance DECIMAL(18,6) NOT NULL DEFAULT 0,
      total_earned DECIMAL(18,6) NOT NULL DEFAULT 0,
      total_spent DECIMAL(18,6) NOT NULL DEFAULT 0,
      total_fees_paid DECIMAL(18,6) NOT NULL DEFAULT 0,
      updated_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sky_treasury (
      id INT AUTO_INCREMENT PRIMARY KEY,
      source_action VARCHAR(64) NOT NULL,
      amount DECIMAL(18,6) NOT NULL,
      from_user_id INT,
      created_at BIGINT NOT NULL,
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function getUserBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rows = await db.execute(
    sql`SELECT balance FROM sky_balances WHERE user_id = ${userId}`
  );
  const r = (rows as any).rows ?? rows;
  if (r.length === 0) return 0;
  return parseFloat(r[0].balance ?? "0");
}

async function ensureBalance(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.execute(sql`
    INSERT INTO sky_balances (user_id, balance, total_earned, total_spent, total_fees_paid, updated_at)
    VALUES (${userId}, 100, 0, 0, 0, ${Date.now()})
    ON DUPLICATE KEY UPDATE user_id = user_id
  `);
}

async function recordTransaction(opts: {
  userId: number;
  actionType: string;
  amount: number;
  fee: number;
  direction: "credit" | "debit";
  referenceId?: string;
  referenceType?: string;
  description?: string;
}): Promise<{ success: boolean; newBalance: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await ensureBalance(opts.userId);

  const currentBalance = await getUserBalance(opts.userId);
  const netAmount = opts.amount - opts.fee;
  const newBalance =
    opts.direction === "credit"
      ? currentBalance + netAmount
      : currentBalance - opts.amount - opts.fee;

  if (newBalance < 0) {
    return { success: false, newBalance: currentBalance };
  }

  const now = Date.now();
  await db.execute(sql`
    INSERT INTO sky_wallet_ledger
      (user_id, action_type, amount, fee, net_amount, direction, reference_id, reference_type, description, balance_after, created_at)
    VALUES
      (${opts.userId}, ${opts.actionType}, ${opts.amount}, ${opts.fee}, ${netAmount},
       ${opts.direction}, ${opts.referenceId ?? null}, ${opts.referenceType ?? null},
       ${opts.description ?? null}, ${newBalance}, ${now})
  `);

  if (opts.direction === "credit") {
    await db.execute(sql`
      UPDATE sky_balances
      SET balance = ${newBalance},
          total_earned = total_earned + ${netAmount},
          updated_at = ${now}
      WHERE user_id = ${opts.userId}
    `);
  } else {
    await db.execute(sql`
      UPDATE sky_balances
      SET balance = ${newBalance},
          total_spent = total_spent + ${opts.amount},
          total_fees_paid = total_fees_paid + ${opts.fee},
          updated_at = ${now}
      WHERE user_id = ${opts.userId}
    `);
  }

  // Route fee to treasury
  if (opts.fee > 0) {
    await db.execute(sql`
      INSERT INTO sky_treasury (source_action, amount, from_user_id, created_at)
      VALUES (${opts.actionType}, ${opts.fee}, ${opts.userId}, ${now})
    `);
  }

  return { success: true, newBalance };
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const economicRouter = router({
  // Get current user's wallet balance + stats
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    await ensureEconomicTables();
    await ensureBalance(ctx.user.id);
    const db = await getDb();
  if (!db) throw new Error("DB unavailable");
    const rows = await db.execute(
      sql`SELECT * FROM sky_balances WHERE user_id = ${ctx.user.id}`
    );
    const r = (rows as any).rows ?? rows;
    if (r.length === 0) {
      return { balance: 100, totalEarned: 0, totalSpent: 0, totalFeesPaid: 0 };
    }
    const row = r[0];
    return {
      balance: parseFloat(row.balance ?? "0"),
      totalEarned: parseFloat(row.total_earned ?? "0"),
      totalSpent: parseFloat(row.total_spent ?? "0"),
      totalFeesPaid: parseFloat(row.total_fees_paid ?? "0"),
    };
  }),

  // Get transaction history for current user
  getLedger: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        actionType: z.string().optional(),
        direction: z.enum(["credit", "debit"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await ensureEconomicTables();
      const db = await getDb();
  if (!db) throw new Error("DB unavailable");
      const rows = await db.execute(sql`
        SELECT * FROM sky_wallet_ledger
        WHERE user_id = ${ctx.user.id}
          ${input.actionType ? sql`AND action_type = ${input.actionType}` : sql``}
          ${input.direction ? sql`AND direction = ${input.direction}` : sql``}
        ORDER BY created_at DESC
        LIMIT ${input.limit} OFFSET ${input.offset}
      `);
      const r = (rows as any).rows ?? rows;
      return {
        transactions: r.map((row: any) => ({
          id: row.id,
          actionType: row.action_type,
          amount: parseFloat(row.amount ?? "0"),
          fee: parseFloat(row.fee ?? "0"),
          netAmount: parseFloat(row.net_amount ?? "0"),
          direction: row.direction,
          referenceId: row.reference_id,
          referenceType: row.reference_type,
          description: row.description,
          balanceAfter: parseFloat(row.balance_after ?? "0"),
          createdAt: Number(row.created_at),
        })),
      };
    }),

  // Charge an action fee (called by other routers)
  chargeActionFee: protectedProcedure
    .input(
      z.object({
        actionType: z.string(),
        amount: z.number().optional(), // for % fees
        referenceId: z.string().optional(),
        referenceType: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureEconomicTables();
      const flatFee = ACTION_FEES[input.actionType] ?? 0;
      const pctFee = PERCENTAGE_FEES[input.actionType] ?? 0;
      const fee = flatFee + (input.amount ?? 0) * pctFee;

      if (fee === 0) {
        return { success: true, fee: 0, newBalance: await getUserBalance(ctx.user.id) };
      }

      const result = await recordTransaction({
        userId: ctx.user.id,
        actionType: input.actionType,
        amount: fee,
        fee: 0,
        direction: "debit",
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        description: input.description ?? `Fee for ${input.actionType}`,
      });

      return { success: result.success, fee, newBalance: result.newBalance };
    }),

  // Credit SKY444 to user (rewards, airdrops, etc.)
  creditReward: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        actionType: z.string(),
        referenceId: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureEconomicTables();
      const result = await recordTransaction({
        userId: ctx.user.id,
        actionType: input.actionType,
        amount: input.amount,
        fee: 0,
        direction: "credit",
        referenceId: input.referenceId,
        description: input.description ?? `Reward: ${input.actionType}`,
      });
      return result;
    }),

  // Get action fee schedule (public)
  getFeeSchedule: publicProcedure.query(() => {
    return {
      flatFees: ACTION_FEES,
      percentageFees: PERCENTAGE_FEES,
      description: "SKY444 fee schedule. Flat fees in SKY444 tokens. Percentage fees applied to transaction value.",
    };
  }),

  // Get treasury stats (public)
  getTreasuryStats: publicProcedure.query(async () => {
    await ensureEconomicTables();
    const db = await getDb();
  if (!db) throw new Error("DB unavailable");
    const rows = await db.execute(sql`
      SELECT
        SUM(amount) as total_collected,
        COUNT(*) as total_transactions,
        source_action,
        SUM(amount) as action_total
      FROM sky_treasury
      GROUP BY source_action
      ORDER BY action_total DESC
    `);
    const r = (rows as any).rows ?? rows;

    const totalRows = await db.execute(sql`
      SELECT SUM(amount) as grand_total, COUNT(*) as tx_count FROM sky_treasury
    `);
    const tr = (totalRows as any).rows ?? totalRows;

    return {
      grandTotal: parseFloat(tr[0]?.grand_total ?? "0"),
      totalTransactions: parseInt(tr[0]?.tx_count ?? "0"),
      byAction: r.map((row: any) => ({
        action: row.source_action,
        total: parseFloat(row.action_total ?? "0"),
      })),
    };
  }),

  // Get platform-wide economic stats
  getEconomicStats: publicProcedure.query(async () => {
    await ensureEconomicTables();
    const db = await getDb();
  if (!db) throw new Error("DB unavailable");

    const balanceRows = await db.execute(sql`
      SELECT
        COUNT(*) as active_wallets,
        SUM(balance) as total_circulating,
        AVG(balance) as avg_balance,
        MAX(balance) as top_balance,
        SUM(total_earned) as total_earned_all,
        SUM(total_fees_paid) as total_fees_all
      FROM sky_balances
    `);
    const br = (balanceRows as any).rows ?? balanceRows;

    const txRows = await db.execute(sql`
      SELECT COUNT(*) as tx_count, SUM(amount) as tx_volume
      FROM sky_wallet_ledger
      WHERE created_at > ${Date.now() - 24 * 60 * 60 * 1000}
    `);
    const txr = (txRows as any).rows ?? txRows;

    return {
      activeWallets: parseInt(br[0]?.active_wallets ?? "0"),
      totalCirculating: parseFloat(br[0]?.total_circulating ?? "0"),
      avgBalance: parseFloat(br[0]?.avg_balance ?? "0"),
      topBalance: parseFloat(br[0]?.top_balance ?? "0"),
      totalEarnedAll: parseFloat(br[0]?.total_earned_all ?? "0"),
      totalFeesAll: parseFloat(br[0]?.total_fees_all ?? "0"),
      dailyTxCount: parseInt(txr[0]?.tx_count ?? "0"),
      dailyTxVolume: parseFloat(txr[0]?.tx_volume ?? "0"),
    };
  }),

  // Airdrop initial balance to new user (called on first login)
  claimWelcomeBonus: protectedProcedure.mutation(async ({ ctx }) => {
    await ensureEconomicTables();
    const db = await getDb();
  if (!db) throw new Error("DB unavailable");

    // Check if already claimed
    const existing = await db.execute(sql`
      SELECT id FROM sky_wallet_ledger
      WHERE user_id = ${ctx.user.id} AND action_type = 'welcome_bonus'
      LIMIT 1
    `);
    const ex = (existing as any).rows ?? existing;
    if (ex.length > 0) {
      return { success: false, message: "Welcome bonus already claimed" };
    }

    const result = await recordTransaction({
      userId: ctx.user.id,
      actionType: "welcome_bonus",
      amount: 100,
      fee: 0,
      direction: "credit",
      description: "Welcome to SKYCOIN4444! Here are 100 SKY444 tokens to get started.",
    });

    return { ...result, message: "Welcome bonus of 100 SKY444 claimed!" };
  }),

  // Get richest wallets leaderboard
  getRichList: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      await ensureEconomicTables();
      const db = await getDb();
  if (!db) throw new Error("DB unavailable");
      const rows = await db.execute(sql`
        SELECT sb.user_id, sb.balance, sb.total_earned, u.name, u.username
        FROM sky_balances sb
        LEFT JOIN users u ON u.id = sb.user_id
        ORDER BY sb.balance DESC
        LIMIT ${input.limit}
      `);
      const r = (rows as any).rows ?? rows;
      return {
        richList: r.map((row: any, i: number) => ({
          rank: i + 1,
          userId: row.user_id,
          name: row.name ?? `User #${row.user_id}`,
          username: row.username ?? `user${row.user_id}`,
          balance: parseFloat(row.balance ?? "0"),
          totalEarned: parseFloat(row.total_earned ?? "0"),
        })),
      };
    }),
});
