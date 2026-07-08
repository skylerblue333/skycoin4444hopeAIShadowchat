/**
 * AI Marketplace Coin Economics Engine
 * Dynamic pricing, fee routing, treasury accumulation, profit sharing, yield distribution
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

// ─── FEE SCHEDULE ─────────────────────────────────────────────────────────────
export const FEE_SCHEDULE = {
  marketplace_sale:    { rate: 0.025, label: "Marketplace Sale", treasury: 0.4, creator: 0.4, stakers: 0.2 },
  nft_mint:            { rate: 0.05,  label: "NFT Mint",         treasury: 0.5, creator: 0.3, stakers: 0.2 },
  nft_trade:           { rate: 0.025, label: "NFT Trade",        treasury: 0.4, creator: 0.4, stakers: 0.2 },
  token_swap:          { rate: 0.003, label: "Token Swap",       treasury: 0.5, creator: 0.0, stakers: 0.5 },
  stream_gift:         { rate: 0.1,   label: "Stream Gift",      treasury: 0.1, creator: 0.7, stakers: 0.2 },
  subscription:        { rate: 0.15,  label: "Subscription",     treasury: 0.2, creator: 0.6, stakers: 0.2 },
  premium_post:        { rate: 0.1,   label: "Premium Post",     treasury: 0.2, creator: 0.6, stakers: 0.2 },
  tournament_entry:    { rate: 0.05,  label: "Tournament Entry", treasury: 0.3, creator: 0.0, stakers: 0.3, prize_pool: 0.4 },
  course_purchase:     { rate: 0.15,  label: "Course Purchase",  treasury: 0.2, creator: 0.6, stakers: 0.2 },
  charity_donation:    { rate: 0.02,  label: "Charity Donation", treasury: 0.5, creator: 0.0, stakers: 0.0, charity: 0.5 },
  ai_service:          { rate: 0.05,  label: "AI Service",       treasury: 0.6, creator: 0.0, stakers: 0.4 },
  advertising:         { rate: 0.2,   label: "Advertising",      treasury: 0.3, creator: 0.5, stakers: 0.2 },
};

// ─── DYNAMIC PRICING FACTORS ──────────────────────────────────────────────────
const DEMAND_MULTIPLIERS = {
  low:    0.8,
  normal: 1.0,
  high:   1.2,
  surge:  1.5,
};

async function ensureCoinEconomicsTables() {
  const db = await getDb();
  if (!db) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coin_fee_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      gross_amount DECIMAL(18,6) NOT NULL,
      fee_amount DECIMAL(18,6) NOT NULL,
      treasury_share DECIMAL(18,6) NOT NULL,
      creator_share DECIMAL(18,6) NOT NULL,
      staker_share DECIMAL(18,6) NOT NULL,
      user_id INT,
      creator_id INT,
      reference_id VARCHAR(100),
      token VARCHAR(20) DEFAULT 'SKY444',
      created_at BIGINT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coin_treasury (
      id INT AUTO_INCREMENT PRIMARY KEY,
      balance DECIMAL(18,6) NOT NULL DEFAULT 0,
      total_accumulated DECIMAL(18,6) NOT NULL DEFAULT 0,
      total_distributed DECIMAL(18,6) NOT NULL DEFAULT 0,
      last_distribution BIGINT,
      updated_at BIGINT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coin_profit_distributions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      epoch INT NOT NULL,
      total_distributed DECIMAL(18,6) NOT NULL,
      staker_pool DECIMAL(18,6) NOT NULL,
      creator_pool DECIMAL(18,6) NOT NULL,
      treasury_retained DECIMAL(18,6) NOT NULL,
      participants INT NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coin_price_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token VARCHAR(20) NOT NULL,
      price_usd DECIMAL(18,8) NOT NULL,
      volume_24h DECIMAL(18,2) DEFAULT 0,
      market_cap DECIMAL(18,2) DEFAULT 0,
      demand_level ENUM('low','normal','high','surge') DEFAULT 'normal',
      recorded_at BIGINT NOT NULL
    )
  `);
  // Seed treasury if empty
  const rows = await db.execute(`SELECT COUNT(*) as cnt FROM coin_treasury`);
  if ((rows as any).rows?.[0]?.cnt === 0) {
    await db.execute(`INSERT INTO coin_treasury (balance, total_accumulated, total_distributed, updated_at) VALUES (0, 0, 0, ${Date.now()})`);
  }
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────
export const coinEconomicsRouter = router({
  // Get full fee schedule with current demand multipliers
  getFeeSchedule: publicProcedure.query(async () => {
    const db = await getDb();
    let demandLevel: keyof typeof DEMAND_MULTIPLIERS = "normal";
    if (db) {
      try {
        const rows = await db.execute(
          `SELECT demand_level FROM coin_price_history WHERE token = 'SKY444' ORDER BY recorded_at DESC LIMIT 1`
        );
        demandLevel = ((rows as any).rows?.[0]?.demand_level ?? "normal") as keyof typeof DEMAND_MULTIPLIERS;
      } catch { /* use default */ }
    }
    const multiplier = DEMAND_MULTIPLIERS[demandLevel];
    return {
      demandLevel,
      multiplier,
      fees: Object.entries(FEE_SCHEDULE).map(([key, fee]) => ({
        key,
        label: fee.label,
        baseRate: fee.rate,
        effectiveRate: fee.rate * multiplier,
        effectiveRatePct: (fee.rate * multiplier * 100).toFixed(2) + "%",
        routing: {
          treasury: fee.treasury,
          creator: fee.creator,
          stakers: fee.stakers,
          ...(("prize_pool" in fee) ? { prize_pool: (fee as any).prize_pool } : {}),
          ...(("charity" in fee) ? { charity: (fee as any).charity } : {}),
        },
      })),
    };
  }),

  // Get treasury balance and stats
  getTreasury: publicProcedure.query(async () => {
    await ensureCoinEconomicsTables();
    const db = await getDb();
    if (!db) return { balance: 0, totalAccumulated: 0, totalDistributed: 0, lastDistribution: null };
    try {
      const rows = await db.execute(`SELECT * FROM coin_treasury LIMIT 1`);
      const t = (rows as any).rows?.[0] ?? {};
      // Also get 30-day fee revenue
      const feeRows = await db.execute(
        `SELECT COALESCE(SUM(fee_amount), 0) as total_30d, COALESCE(SUM(treasury_share), 0) as treasury_30d, COUNT(*) as events_30d FROM coin_fee_events WHERE created_at > ${Date.now() - 30 * 24 * 60 * 60 * 1000}`
      );
      const fee30 = (feeRows as any).rows?.[0] ?? {};
      return {
        balance: parseFloat(t.balance ?? "0"),
        totalAccumulated: parseFloat(t.total_accumulated ?? "0"),
        totalDistributed: parseFloat(t.total_distributed ?? "0"),
        lastDistribution: t.last_distribution ? parseInt(t.last_distribution) : null,
        revenue30d: parseFloat(fee30.total_30d ?? "0"),
        treasuryInflow30d: parseFloat(fee30.treasury_30d ?? "0"),
        feeEvents30d: parseInt(fee30.events_30d ?? "0"),
      };
    } catch {
      return { balance: 0, totalAccumulated: 0, totalDistributed: 0, lastDistribution: null };
    }
  }),

  // Record a fee event (called internally by other routers)
  recordFeeEvent: protectedProcedure
    .input(z.object({
      eventType: z.string(),
      grossAmount: z.number(),
      creatorId: z.number().optional(),
      referenceId: z.string().optional(),
      token: z.string().default("SKY444"),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureCoinEconomicsTables();
      const db = await getDb();
      if (!db) return { success: false };

      const feeConfig = FEE_SCHEDULE[input.eventType as keyof typeof FEE_SCHEDULE];
      if (!feeConfig) return { success: false, error: "Unknown event type" };

      const feeAmount = input.grossAmount * feeConfig.rate;
      const treasuryShare = feeAmount * feeConfig.treasury;
      const creatorShare = feeAmount * feeConfig.creator;
      const stakerShare = feeAmount * feeConfig.stakers;

      await db.execute(
        `INSERT INTO coin_fee_events (event_type, gross_amount, fee_amount, treasury_share, creator_share, staker_share, user_id, creator_id, reference_id, token, created_at)
         VALUES ('${input.eventType}', ${input.grossAmount}, ${feeAmount}, ${treasuryShare}, ${creatorShare}, ${stakerShare}, ${ctx.user.id}, ${input.creatorId ?? "NULL"}, ${input.referenceId ? `'${input.referenceId}'` : "NULL"}, '${input.token}', ${Date.now()})`
      );

      // Update treasury
      await db.execute(
        `UPDATE coin_treasury SET balance = balance + ${treasuryShare}, total_accumulated = total_accumulated + ${treasuryShare}, updated_at = ${Date.now()}`
      );

      // Credit creator if applicable
      if (creatorShare > 0 && input.creatorId) {
        try {
          const { upsertTokenBalance, createTransaction } = await import("./db");
          await upsertTokenBalance(input.creatorId, input.token, creatorShare);
          await createTransaction({ userId: input.creatorId, token: input.token, amount: creatorShare, type: "credit", description: `Creator revenue: ${feeConfig.label}` });
        } catch { /* ignore */ }
      }

      return { success: true, feeAmount, treasuryShare, creatorShare, stakerShare };
    }),

  // Get fee revenue analytics
  getRevenueAnalytics: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      await ensureCoinEconomicsTables();
      const db = await getDb();
      if (!db) return { byType: [], dailyRevenue: [], totals: { fees: 0, treasury: 0, creators: 0, stakers: 0 } };
      try {
        const since = Date.now() - input.days * 24 * 60 * 60 * 1000;
        const byType = await db.execute(
          `SELECT event_type, COUNT(*) as count, SUM(fee_amount) as total_fees, SUM(treasury_share) as treasury, SUM(creator_share) as creators, SUM(staker_share) as stakers
           FROM coin_fee_events WHERE created_at > ${since}
           GROUP BY event_type ORDER BY total_fees DESC`
        );
        const totals = await db.execute(
          `SELECT COALESCE(SUM(fee_amount),0) as fees, COALESCE(SUM(treasury_share),0) as treasury, COALESCE(SUM(creator_share),0) as creators, COALESCE(SUM(staker_share),0) as stakers
           FROM coin_fee_events WHERE created_at > ${since}`
        );
        return {
          byType: ((byType as any).rows ?? []).map((r: any) => ({
            eventType: r.event_type,
            count: parseInt(r.count ?? "0"),
            totalFees: parseFloat(r.total_fees ?? "0"),
            treasury: parseFloat(r.treasury ?? "0"),
            creators: parseFloat(r.creators ?? "0"),
            stakers: parseFloat(r.stakers ?? "0"),
          })),
          totals: {
            fees: parseFloat((totals as any).rows?.[0]?.fees ?? "0"),
            treasury: parseFloat((totals as any).rows?.[0]?.treasury ?? "0"),
            creators: parseFloat((totals as any).rows?.[0]?.creators ?? "0"),
            stakers: parseFloat((totals as any).rows?.[0]?.stakers ?? "0"),
          },
          dailyRevenue: [],
        };
      } catch {
        return { byType: [], dailyRevenue: [], totals: { fees: 0, treasury: 0, creators: 0, stakers: 0 } };
      }
    }),

  // Distribute profits to stakers (admin only)
  distributeToStakers: adminProcedure
    .input(z.object({ amount: z.number().min(1), epoch: z.number() }))
    .mutation(async ({ input }) => {
      await ensureCoinEconomicsTables();
      const db = await getDb();
      if (!db) return { success: false };
      try {
        // Get all active stakers and their proportional share
        const stakers = await db.execute(
          `SELECT user_id, amount FROM staking_positions WHERE status = 'active' ORDER BY amount DESC`
        );
        const rows = (stakers as any).rows ?? [];
        if (rows.length === 0) return { success: false, error: "No active stakers" };

        const totalStaked = rows.reduce((sum: number, r: any) => sum + parseFloat(r.amount ?? "0"), 0);
        let distributed = 0;
        for (const staker of rows) {
          const share = (parseFloat(staker.amount ?? "0") / totalStaked) * input.amount;
          if (share < 0.001) continue;
          try {
            const { upsertTokenBalance, createTransaction } = await import("./db");
            await upsertTokenBalance(staker.user_id, "SKY444", share);
            await createTransaction({ userId: staker.user_id, token: "SKY444", amount: share, type: "credit", description: `Staking profit distribution epoch ${input.epoch}` });
            distributed += share;
          } catch { /* ignore individual failures */ }
        }
        // Record distribution
        await db.execute(
          `INSERT INTO coin_profit_distributions (epoch, total_distributed, staker_pool, creator_pool, treasury_retained, participants, created_at)
           VALUES (${input.epoch}, ${distributed}, ${distributed}, 0, ${input.amount - distributed}, ${rows.length}, ${Date.now()})`
        );
        // Deduct from treasury
        await db.execute(
          `UPDATE coin_treasury SET balance = GREATEST(0, balance - ${input.amount}), total_distributed = total_distributed + ${distributed}, last_distribution = ${Date.now()}, updated_at = ${Date.now()}`
        );
        return { success: true, distributed, participants: rows.length };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    }),

  // AI-powered price prediction
  getPricePrediction: publicProcedure
    .input(z.object({ token: z.string().default("SKY444"), horizon: z.enum(["1d", "7d", "30d", "90d"]).default("30d") }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a crypto price analyst. Provide concise, data-driven price analysis. Always include specific price targets.",
          },
          {
            role: "user",
            content: `Analyze ${input.token} price prediction for ${input.horizon} horizon. Current price: $0.012 (presale). Platform: AI-powered Web3 social ecosystem with DeFi, gaming, streaming, marketplace, charity. Token utility: governance, staking (up to 35% APY), fee discounts, premium features. Total supply: 1B tokens. Provide: 1) Bear/Base/Bull price targets, 2) Key catalysts, 3) Risk factors, 4) Confidence score. Keep under 150 words.`,
          },
        ],
      });
      return {
        prediction: response.choices?.[0]?.message?.content ?? "Prediction unavailable",
        token: input.token,
        horizon: input.horizon,
        currentPrice: 0.012,
        generatedAt: Date.now(),
      };
    }),

  // Get distribution history
  getDistributionHistory: publicProcedure.query(async () => {
    await ensureCoinEconomicsTables();
    const db = await getDb();
    if (!db) return [];
    try {
      const rows = await db.execute(
        `SELECT * FROM coin_profit_distributions ORDER BY created_at DESC LIMIT 20`
      );
      return ((rows as any).rows ?? []).map((r: any) => ({
        epoch: r.epoch,
        totalDistributed: parseFloat(r.total_distributed ?? "0"),
        stakerPool: parseFloat(r.staker_pool ?? "0"),
        creatorPool: parseFloat(r.creator_pool ?? "0"),
        treasuryRetained: parseFloat(r.treasury_retained ?? "0"),
        participants: parseInt(r.participants ?? "0"),
        createdAt: parseInt(r.created_at ?? "0"),
      }));
    } catch { return []; }
  }),

  // Get my earnings from platform fees
  getMyEarnings: protectedProcedure.query(async ({ ctx }) => {
    await ensureCoinEconomicsTables();
    const db = await getDb();
    if (!db) return { creatorEarnings: 0, stakerEarnings: 0, totalEarnings: 0, breakdown: [] };
    try {
      const creatorRows = await db.execute(
        `SELECT COALESCE(SUM(creator_share), 0) as total FROM coin_fee_events WHERE creator_id = ${ctx.user.id}`
      );
      const creatorEarnings = parseFloat((creatorRows as any).rows?.[0]?.total ?? "0");
      return {
        creatorEarnings,
        stakerEarnings: 0, // From distribution history
        totalEarnings: creatorEarnings,
        breakdown: [],
      };
    } catch {
      return { creatorEarnings: 0, stakerEarnings: 0, totalEarnings: 0, breakdown: [] };
    }
  }),
});
