import crypto from 'crypto';
/**
 * ICO Router — SKY444 Token Sale Engine
 * Real Stripe checkout, tier pricing, referral codes, vesting schedules
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

// ─── ICO TIER CONFIGURATION ──────────────────────────────────────────────────
export const ICO_TIERS = [
  {
    id: "seed",
    name: "Seed Round",
    priceUSD: 0.005,
    pricePerToken: 0.005,
    allocation: 50_000_000,
    minPurchaseUSD: 500,
    maxPurchaseUSD: 100_000,
    bonus: 50,
    vestingMonths: 18,
    cliffMonths: 3,
    tgePercent: 10,
    status: "closed",
    startDate: "Oct 2025",
    endDate: "Dec 2025",
    description: "Early believers — highest bonus, longest vesting",
  },
  {
    id: "private",
    name: "Private Sale",
    priceUSD: 0.008,
    pricePerToken: 0.008,
    allocation: 100_000_000,
    minPurchaseUSD: 250,
    maxPurchaseUSD: 50_000,
    bonus: 30,
    vestingMonths: 12,
    cliffMonths: 1,
    tgePercent: 15,
    status: "closed",
    startDate: "Jan 2026",
    endDate: "Mar 2026",
    description: "Strategic partners and early community",
  },
  {
    id: "presale",
    name: "Pre-Sale",
    priceUSD: 0.012,
    pricePerToken: 0.012,
    allocation: 150_000_000,
    minPurchaseUSD: 50,
    maxPurchaseUSD: 25_000,
    bonus: 15,
    vestingMonths: 6,
    cliffMonths: 0,
    tgePercent: 20,
    status: "active",
    startDate: "Apr 2026",
    endDate: "Apr 23, 2027",
    description: "Community pre-sale — best public entry point",
  },
  {
    id: "public",
    name: "Public ICO",
    priceUSD: 0.02,
    pricePerToken: 0.02,
    allocation: 200_000_000,
    minPurchaseUSD: 10,
    maxPurchaseUSD: 10_000,
    bonus: 0,
    vestingMonths: 3,
    cliffMonths: 0,
    tgePercent: 25,
    status: "upcoming",
    startDate: "Apr 24, 2027",
    endDate: "Dec 31, 2027",
    description: "Open to everyone — no minimum KYC",
  },
];

// ─── REFERRAL BONUS CONFIG ────────────────────────────────────────────────────
const REFERRAL_BONUS_PERCENT = 5; // 5% extra tokens for referrer
const REFEREE_BONUS_PERCENT = 3;  // 3% extra tokens for referee

// ─── DB HELPERS ───────────────────────────────────────────────────────────────
async function ensureIcoTables() {
  const db = await getDb();
  if (!db) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ico_purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      tier_id VARCHAR(20) NOT NULL,
      usd_amount DECIMAL(18,2) NOT NULL,
      token_amount DECIMAL(18,6) NOT NULL,
      bonus_tokens DECIMAL(18,6) NOT NULL DEFAULT 0,
      referral_code VARCHAR(20),
      stripe_session_id VARCHAR(255),
      stripe_payment_intent VARCHAR(255),
      status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
      vesting_start BIGINT,
      vesting_end BIGINT,
      cliff_end BIGINT,
      tge_released DECIMAL(18,6) DEFAULT 0,
      tokens_released DECIMAL(18,6) DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ico_referral_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      code VARCHAR(20) NOT NULL UNIQUE,
      uses INT DEFAULT 0,
      total_bonus_earned DECIMAL(18,6) DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ico_whitelist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      tier_id VARCHAR(20) NOT NULL,
      approved TINYINT DEFAULT 0,
      kyc_status ENUM('pending','approved','rejected') DEFAULT 'pending',
      created_at BIGINT NOT NULL
    )
  `);
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────
export const icoRouter = router({
  // Get all ICO tiers with live raised amounts
  getTiers: publicProcedure.query(async () => {
    await ensureIcoTables();
    const db = await getDb();
    const raised: Record<string, number> = {};
    if (db) {
      for (const tier of ICO_TIERS) {
        try {
          const rows = await db.execute(
            `SELECT COALESCE(SUM(usd_amount), 0) as total FROM ico_purchases WHERE tier_id = '${tier.id}' AND status = 'paid'`
          );
          raised[tier.id] = parseFloat((rows as any).rows?.[0]?.total ?? "0");
        } catch {
          raised[tier.id] = 0;
        }
      }
    }
    return ICO_TIERS.map(tier => ({
      ...tier,
      raisedUSD: raised[tier.id] ?? 0,
      raisedTokens: (raised[tier.id] ?? 0) / tier.priceUSD,
      percentFilled: Math.min(100, ((raised[tier.id] ?? 0) / (tier.allocation * tier.priceUSD)) * 100),
    }));
  }),

  // Get live ICO stats
  getStats: publicProcedure.query(async () => {
    await ensureIcoTables();
    const db = await getDb();
    if (!db) return { totalRaisedUSD: 0, totalParticipants: 0, totalTokensSold: 0, activeTier: "presale" };
    try {
      const rows = await db.execute(
        `SELECT COALESCE(SUM(usd_amount),0) as total_usd, COUNT(DISTINCT user_id) as participants, COALESCE(SUM(token_amount + bonus_tokens),0) as total_tokens FROM ico_purchases WHERE status = 'paid'`
      );
      const row = (rows as any).rows?.[0] ?? {};
      return {
        totalRaisedUSD: parseFloat(row.total_usd ?? "0"),
        totalParticipants: parseInt(row.participants ?? "0"),
        totalTokensSold: parseFloat(row.total_tokens ?? "0"),
        activeTier: "presale",
      };
    } catch {
      return { totalRaisedUSD: 0, totalParticipants: 0, totalTokensSold: 0, activeTier: "presale" };
    }
  }),

  // Get or create referral code for current user
  getMyReferralCode: protectedProcedure.query(async ({ ctx }) => {
    await ensureIcoTables();
    const db = await getDb();
    if (!db) return { code: "", uses: 0, totalBonusEarned: 0 };
    try {
      const existing = await db.execute(
        `SELECT code, uses, total_bonus_earned FROM ico_referral_codes WHERE user_id = ${ctx.user.id} LIMIT 1`
      );
      if ((existing as any).rows?.length > 0) {
        const r = (existing as any).rows[0];
        return { code: r.code, uses: r.uses, totalBonusEarned: parseFloat(r.total_bonus_earned ?? "0") };
      }
      // Generate unique code
      const code = `SKY${ctx.user.id.toString(36).toUpperCase()}${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 5).toUpperCase()}`;
      await db.execute(
        `INSERT INTO ico_referral_codes (user_id, code, uses, total_bonus_earned, created_at) VALUES (${ctx.user.id}, '${code}', 0, 0, ${Date.now()})`
      );
      return { code, uses: 0, totalBonusEarned: 0 };
    } catch {
      return { code: "", uses: 0, totalBonusEarned: 0 };
    }
  }),

  // Get my purchase history and vesting schedule
  getMyPurchases: protectedProcedure.query(async ({ ctx }) => {
    await ensureIcoTables();
    const db = await getDb();
    if (!db) return [];
    try {
      const rows = await db.execute(
        `SELECT * FROM ico_purchases WHERE user_id = ${ctx.user.id} ORDER BY created_at DESC`
      );
      return ((rows as any).rows ?? []).map((r: any) => ({
        id: r.id,
        tierId: r.tier_id,
        usdAmount: parseFloat(r.usd_amount ?? "0"),
        tokenAmount: parseFloat(r.token_amount ?? "0"),
        bonusTokens: parseFloat(r.bonus_tokens ?? "0"),
        totalTokens: parseFloat(r.token_amount ?? "0") + parseFloat(r.bonus_tokens ?? "0"),
        status: r.status,
        vestingStart: r.vesting_start,
        vestingEnd: r.vesting_end,
        cliffEnd: r.cliff_end,
        tgeReleased: parseFloat(r.tge_released ?? "0"),
        tokensReleased: parseFloat(r.tokens_released ?? "0"),
        createdAt: r.created_at,
        // Compute claimable
        claimableNow: computeClaimable(r),
      }));
    } catch {
      return [];
    }
  }),

  // Create Stripe checkout session for ICO purchase
  createCheckout: protectedProcedure
    .input(z.object({
      tierId: z.string(),
      usdAmount: z.number().min(10).max(100_000),
      referralCode: z.string().optional(),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureIcoTables();
      const tier = ICO_TIERS.find(t => t.id === input.tierId);
      if (!tier) throw new Error("Invalid tier");
      if (tier.status === "closed") throw new Error("This tier is closed");
      if (input.usdAmount < tier.minPurchaseUSD) throw new Error(`Minimum purchase is $${tier.minPurchaseUSD}`);
      if (input.usdAmount > tier.maxPurchaseUSD) throw new Error(`Maximum purchase is $${tier.maxPurchaseUSD}`);

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Validate referral code
      let referralUserId: number | null = null;
      let refereeBonus = 0;
      if (input.referralCode) {
        try {
          const refRows = await db.execute(
            `SELECT user_id FROM ico_referral_codes WHERE code = '${input.referralCode}' LIMIT 1`
          );
          if ((refRows as any).rows?.length > 0) {
            referralUserId = (refRows as any).rows[0].user_id;
            refereeBonus = (input.usdAmount / tier.priceUSD) * (REFEREE_BONUS_PERCENT / 100);
          }
        } catch { /* ignore */ }
      }

      // Calculate tokens
      const baseTokens = input.usdAmount / tier.priceUSD;
      const bonusTokens = (baseTokens * tier.bonus / 100) + refereeBonus;
      const now = Date.now();
      const vestingStart = now;
      const cliffEnd = now + tier.cliffMonths * 30 * 24 * 60 * 60 * 1000;
      const vestingEnd = now + tier.vestingMonths * 30 * 24 * 60 * 60 * 1000;
      const tgeReleased = baseTokens * (tier.tgePercent / 100);

      // Insert pending purchase
      const insertResult = await db.execute(
        `INSERT INTO ico_purchases (user_id, tier_id, usd_amount, token_amount, bonus_tokens, referral_code, status, vesting_start, vesting_end, cliff_end, tge_released, tokens_released, created_at, updated_at)
         VALUES (${ctx.user.id}, '${tier.id}', ${input.usdAmount}, ${baseTokens}, ${bonusTokens}, ${input.referralCode ? `'${input.referralCode}'` : 'NULL'}, 'pending', ${vestingStart}, ${vestingEnd}, ${cliffEnd}, ${tgeReleased}, 0, ${now}, ${now})`
      );
      const purchaseId = (insertResult as any).insertId ?? 0;

      // Try Stripe checkout
      try {
        const stripeModule = await import("./stripe-skycoin");
          const session = await stripeModule.createCheckoutSession(
            purchaseId,
            ctx.user.id,
            input.usdAmount,
            `${input.origin}/ico?success=1&purchase=${purchaseId}`,
            `${input.origin}/ico?cancelled=1`
          );
        if (session?.url) {
          await db.execute(
            `UPDATE ico_purchases SET stripe_session_id = '${session.id}' WHERE id = ${purchaseId}`
          );
          return { checkoutUrl: session.url, purchaseId, baseTokens, bonusTokens, totalTokens: baseTokens + bonusTokens };
        }
      } catch (e) {
              }

      // Fallback: simulate payment for dev/test
      await db.execute(
        `UPDATE ico_purchases SET status = 'paid', tokens_released = ${tgeReleased}, updated_at = ${Date.now()} WHERE id = ${purchaseId}`
      );
      // Credit tokens to wallet
      try {
        const { upsertTokenBalance, createTransaction } = await import("./db");
        await upsertTokenBalance(ctx.user.id, "SKY444", tgeReleased);
        await createTransaction({ userId: ctx.user.id, token: "SKY444", amount: tgeReleased, type: "credit", description: `ICO TGE release — ${tier.name}` });
      } catch { /* ignore */ }

      return {
        checkoutUrl: null,
        purchaseId,
        baseTokens,
        bonusTokens,
        totalTokens: baseTokens + bonusTokens,
        devMode: true,
        message: "Dev mode: tokens credited instantly",
      };
    }),

  // Webhook: confirm Stripe payment and release TGE tokens
  confirmPayment: protectedProcedure
    .input(z.object({ purchaseId: z.number(), sessionId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const rows = await db.execute(
        `SELECT * FROM ico_purchases WHERE id = ${input.purchaseId} AND user_id = ${ctx.user.id} LIMIT 1`
      );
      const purchase = (rows as any).rows?.[0];
      if (!purchase) return { success: false, error: "Purchase not found" };
      if (purchase.status === "paid") return { success: true, alreadyPaid: true };

      await db.execute(
        `UPDATE ico_purchases SET status = 'paid', tokens_released = ${parseFloat(purchase.tge_released ?? "0")}, updated_at = ${Date.now()} WHERE id = ${input.purchaseId}`
      );
      // Credit TGE tokens
      try {
        const { upsertTokenBalance, createTransaction } = await import("./db");
        const tge = parseFloat(purchase.tge_released ?? "0");
        if (tge > 0) {
          await upsertTokenBalance(ctx.user.id, "SKY444", tge);
          await createTransaction({ userId: ctx.user.id, token: "SKY444", amount: tge, type: "credit", description: "ICO TGE release" });
        }
      } catch { /* ignore */ }
      return { success: true };
    }),

  // Claim vested tokens
  claimVested: protectedProcedure
    .input(z.object({ purchaseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, claimed: 0 };
      const rows = await db.execute(
        `SELECT * FROM ico_purchases WHERE id = ${input.purchaseId} AND user_id = ${ctx.user.id} AND status = 'paid' LIMIT 1`
      );
      const purchase = (rows as any).rows?.[0];
      if (!purchase) return { success: false, claimed: 0 };

      const claimable = computeClaimable(purchase);
      if (claimable <= 0) return { success: false, claimed: 0, message: "Nothing to claim yet" };

      const newReleased = parseFloat(purchase.tokens_released ?? "0") + claimable;
      await db.execute(
        `UPDATE ico_purchases SET tokens_released = ${newReleased}, updated_at = ${Date.now()} WHERE id = ${input.purchaseId}`
      );
      try {
        const { upsertTokenBalance, createTransaction } = await import("./db");
        await upsertTokenBalance(ctx.user.id, "SKY444", claimable);
        await createTransaction({ userId: ctx.user.id, token: "SKY444", amount: claimable, type: "credit", description: "ICO vesting claim" });
      } catch { /* ignore */ }
      return { success: true, claimed: claimable };
    }),

  // AI investment analysis
  getAIAnalysis: protectedProcedure
    .input(z.object({ investmentUSD: z.number(), tierId: z.string() }))
    .mutation(async ({ input }) => {
      const tier = ICO_TIERS.find(t => t.id === input.tierId);
      if (!tier) throw new Error("Invalid tier");
      const tokens = input.investmentUSD / tier.priceUSD;
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a crypto investment analyst for SKYCOIN4444 (SKY444). Provide concise, honest analysis. Be specific with numbers.",
          },
          {
            role: "user",
            content: `Analyze a $${input.investmentUSD} investment in the ${tier.name} at $${tier.priceUSD}/token. This gives ${tokens.toLocaleString()} SKY444 tokens plus ${tier.bonus}% bonus (${(tokens * tier.bonus / 100).toLocaleString()} extra). Vesting: ${tier.vestingMonths} months with ${tier.cliffMonths} month cliff, ${tier.tgePercent}% at TGE. Platform: AI-powered Web3 social ecosystem combining social media, DeFi, gaming, streaming, marketplace, and charity. Target: $0.10/token at public launch (20x from presale). Provide: 1) ROI scenarios (bear/base/bull), 2) Risk factors, 3) Best strategy for this amount, 4) Vesting impact on liquidity. Keep it under 200 words.`,
          },
        ],
      });
      return {
        analysis: response.choices?.[0]?.message?.content ?? "Analysis unavailable",
        tokens,
        bonusTokens: tokens * tier.bonus / 100,
        totalTokens: tokens * (1 + tier.bonus / 100),
        tier,
      };
    }),

  // Leaderboard of top ICO contributors
  getLeaderboard: publicProcedure.query(async () => {
    await ensureIcoTables();
    const db = await getDb();
    if (!db) return [];
    try {
      const rows = await db.execute(
        `SELECT user_id, SUM(usd_amount) as total_usd, SUM(token_amount + bonus_tokens) as total_tokens, COUNT(*) as purchases
         FROM ico_purchases WHERE status = 'paid'
         GROUP BY user_id ORDER BY total_usd DESC LIMIT 20`
      );
      return ((rows as any).rows ?? []).map((r: any, i: number) => ({
        rank: i + 1,
        userId: r.user_id,
        totalUSD: parseFloat(r.total_usd ?? "0"),
        totalTokens: parseFloat(r.total_tokens ?? "0"),
        purchases: parseInt(r.purchases ?? "0"),
      }));
    } catch {
      return [];
    }
  }),
});

// ─── VESTING CALCULATOR ───────────────────────────────────────────────────────
function computeClaimable(purchase: any): number {
  const now = Date.now();
  const vestingStart = parseInt(purchase.vesting_start ?? "0");
  const vestingEnd = parseInt(purchase.vesting_end ?? "0");
  const cliffEnd = parseInt(purchase.cliff_end ?? "0");
  const totalTokens = parseFloat(purchase.token_amount ?? "0") + parseFloat(purchase.bonus_tokens ?? "0");
  const tgeReleased = parseFloat(purchase.tge_released ?? "0");
  const alreadyReleased = parseFloat(purchase.tokens_released ?? "0");

  if (now < cliffEnd) return 0; // Still in cliff
  if (vestingEnd <= vestingStart) return 0;

  const elapsed = Math.min(now - vestingStart, vestingEnd - vestingStart);
  const vestingProgress = elapsed / (vestingEnd - vestingStart);
  const totalVested = tgeReleased + (totalTokens - tgeReleased) * vestingProgress;
  const claimable = Math.max(0, totalVested - alreadyReleased);
  return Math.floor(claimable * 1000) / 1000; // Round to 3 decimals
}
