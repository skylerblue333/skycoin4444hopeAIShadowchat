import crypto from 'crypto';
/**
 * SKYCOIN4444 — ICO ULTIMATE ECONOMICS ENGINE
 * ─────────────────────────────────────────────
 * Full tokenomics infrastructure:
 *   • Token supply model (1 billion SKY444)
 *   • ICO tier system with Stripe checkout
 *   • Vesting schedules (cliff + linear)
 *   • Treasury management
 *   • Burn mechanics (deflationary)
 *   • Distribution tracking
 *   • Referral commission system
 *   • Investor dashboard data
 */
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import Stripe from "stripe";

// ─── Token Supply Model ───────────────────────────────────────────────────────

export const TOKENOMICS = {
  name: "SKYCOIN4444",
  symbol: "SKY444",
  totalSupply: 1_000_000_000,       // 1 billion tokens
  decimals: 8,
  network: "Multi-chain (ETH + SOL + BSC)",
  contractType: "ERC-20 / SPL",

  // Distribution allocations (% of total supply)
  distribution: {
    publicSale:       { pct: 30, tokens: 300_000_000, label: "Public ICO Sale",          color: "#6366f1", vesting: "6mo cliff, 18mo linear" },
    ecosystem:        { pct: 20, tokens: 200_000_000, label: "Ecosystem & Rewards",       color: "#8b5cf6", vesting: "No cliff, 36mo linear" },
    team:             { pct: 15, tokens: 150_000_000, label: "Team & Advisors",           color: "#a78bfa", vesting: "12mo cliff, 24mo linear" },
    treasury:         { pct: 15, tokens: 150_000_000, label: "Treasury Reserve",          color: "#c4b5fd", vesting: "6mo cliff, 48mo linear" },
    liquidity:        { pct: 10, tokens: 100_000_000, label: "Liquidity & Market Making", color: "#7c3aed", vesting: "No cliff, 12mo linear" },
    marketing:        { pct: 5,  tokens:  50_000_000, label: "Marketing & Partnerships",  color: "#5b21b6", vesting: "3mo cliff, 12mo linear" },
    community:        { pct: 3,  tokens:  30_000_000, label: "Community Airdrops",        color: "#4c1d95", vesting: "No cliff, 6mo linear" },
    legal:            { pct: 2,  tokens:  20_000_000, label: "Legal & Compliance",        color: "#2e1065", vesting: "No cliff, 24mo linear" },
  },

  // ICO Sale Tiers
  tiers: [
    { id: "seed",    name: "Seed Round",    price: 0.001,  hardCap: 500_000,   minBuy: 500,   maxBuy: 50_000,  bonus: 40, tokens: 50_000_000,  vesting: "12mo cliff, 24mo linear", badge: "🌱", status: "closed" },
    { id: "private", name: "Private Sale",  price: 0.003,  hardCap: 1_500_000, minBuy: 250,   maxBuy: 25_000,  bonus: 25, tokens: 75_000_000,  vesting: "9mo cliff, 18mo linear",  badge: "🔒", status: "closed" },
    { id: "pre",     name: "Pre-Sale",      price: 0.005,  hardCap: 2_500_000, minBuy: 100,   maxBuy: 10_000,  bonus: 15, tokens: 75_000_000,  vesting: "6mo cliff, 12mo linear",  badge: "⚡", status: "active" },
    { id: "public",  name: "Public Sale",   price: 0.01,   hardCap: 5_000_000, minBuy: 50,    maxBuy: 5_000,   bonus: 5,  tokens: 100_000_000, vesting: "3mo cliff, 6mo linear",   badge: "🌐", status: "upcoming" },
    { id: "listing", name: "DEX Listing",   price: 0.015,  hardCap: 0,         minBuy: 0,     maxBuy: 0,       bonus: 0,  tokens: 0,           vesting: "Fully liquid at listing", badge: "🚀", status: "upcoming" },
  ],

  // Burn mechanics
  burn: {
    platformFeesBurnPct: 10,   // 10% of all platform fees burned
    transactionBurnPct: 0.5,   // 0.5% of every SKY444 transaction burned
    quarterlyBuyback: true,    // 5% of quarterly revenue used for buyback+burn
    maxBurnPct: 30,            // Max 30% of total supply can be burned
  },

  // Utility
  utility: [
    "Platform fee discounts (up to 80% off with SKY444)",
    "Premium content access and creator subscriptions",
    "Governance voting rights (1 SKY444 = 1 vote)",
    "Staking rewards (8–20% APY)",
    "Proof-of-Engagement mining rewards",
    "NFT marketplace fee currency",
    "Charity campaign donations",
    "SkySchool course purchases",
    "Gaming tournament entry fees",
    "Creator tipping and gifting",
  ],
};

// ─── Stripe helper ────────────────────────────────────────────────────────────

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function ensureICOTables(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS ico_purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      tier_id VARCHAR(20) NOT NULL,
      usd_amount DECIMAL(12,2) NOT NULL,
      token_amount DECIMAL(18,8) NOT NULL,
      bonus_tokens DECIMAL(18,8) DEFAULT 0,
      stripe_session_id VARCHAR(200),
      stripe_payment_intent VARCHAR(200),
      status ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
      vesting_start BIGINT DEFAULT 0,
      vesting_end BIGINT DEFAULT 0,
      tokens_released DECIMAL(18,8) DEFAULT 0,
      referral_code VARCHAR(50),
      created_at BIGINT DEFAULT 0,
      updated_at BIGINT DEFAULT 0,
      INDEX idx_user (user_id),
      INDEX idx_session (stripe_session_id)
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS ico_referrals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      referrer_id INT NOT NULL,
      referred_user_id INT NOT NULL,
      referral_code VARCHAR(50) NOT NULL,
      commission_pct DECIMAL(5,2) DEFAULT 5.00,
      commission_earned DECIMAL(18,8) DEFAULT 0,
      status ENUM('active','paid','expired') DEFAULT 'active',
      created_at BIGINT DEFAULT 0,
      UNIQUE KEY uq_referred (referred_user_id),
      INDEX idx_referrer (referrer_id)
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS ico_vesting_releases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      purchase_id INT NOT NULL,
      amount DECIMAL(18,8) NOT NULL,
      released_at BIGINT NOT NULL,
      tx_hash VARCHAR(200),
      created_at BIGINT DEFAULT 0
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS ico_whitelist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      tier_id VARCHAR(20) NOT NULL,
      whitelisted_at BIGINT DEFAULT 0,
      max_allocation DECIMAL(12,2) DEFAULT 5000,
      UNIQUE KEY uq_user_tier (user_id, tier_id)
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS ico_burn_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      amount DECIMAL(18,8) NOT NULL,
      reason VARCHAR(200) NOT NULL,
      tx_hash VARCHAR(200),
      burned_at BIGINT DEFAULT 0
    )`);
  } catch { /* tables may already exist */ }
}

async function getICOStats(): Promise<{
  totalRaised: number; totalInvestors: number; tokensSold: number;
  currentTier: string; progress: number; burnedTokens: number;
}> {
  const db = await getDb();
  if (!db) return { totalRaised: 0, totalInvestors: 0, tokensSold: 0, currentTier: "pre", progress: 0, burnedTokens: 0 };
  try {
    const [raised, burned] = await Promise.all([
      db.execute(`SELECT COALESCE(SUM(usd_amount),0) as total, COUNT(DISTINCT user_id) as investors, COALESCE(SUM(token_amount + bonus_tokens),0) as tokens FROM ico_purchases WHERE status = 'completed'`),
      db.execute(`SELECT COALESCE(SUM(amount),0) as total FROM ico_burn_log`),
    ]);
    const r = (raised as any).rows?.[0];
    const b = (burned as any).rows?.[0];
    const totalRaised = Number(r?.total ?? 0);
    const tokensSold = Number(r?.tokens ?? 0);
    const currentTier = TOKENOMICS.tiers.find(t => t.status === "active")?.id ?? "pre";
    const activeTier = TOKENOMICS.tiers.find(t => t.id === currentTier);
    const progress = activeTier ? Math.min(100, (totalRaised / activeTier.hardCap) * 100) : 0;
    return {
      totalRaised,
      totalInvestors: Number(r?.investors ?? 0),
      tokensSold,
      currentTier,
      progress,
      burnedTokens: Number(b?.total ?? 0),
    };
  } catch { return { totalRaised: 0, totalInvestors: 0, tokensSold: 0, currentTier: "pre", progress: 0, burnedTokens: 0 }; }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const icoEconomicsRouter = router({

  // ── Public endpoints ────────────────────────────────────────────────────────

  /** Full tokenomics data */
  tokenomics: publicProcedure.query(() => TOKENOMICS),

  /** Live ICO stats */
  stats: publicProcedure.query(async () => {
    await ensureICOTables();
    return getICOStats();
  }),

  /** All ICO tiers with live progress */
  tiers: publicProcedure.query(async () => {
    await ensureICOTables();
    const db = await getDb();
    if (!db) return TOKENOMICS.tiers;
    try {
      const rows = await db.execute(
        `SELECT tier_id, COALESCE(SUM(usd_amount),0) as raised, COUNT(DISTINCT user_id) as investors FROM ico_purchases WHERE status = 'completed' GROUP BY tier_id`
      );
      const tierMap = new Map<string, { raised: number; investors: number }>();
      for (const row of ((rows as any).rows || [])) {
        tierMap.set(row.tier_id, { raised: Number(row.raised), investors: Number(row.investors) });
      }
      return TOKENOMICS.tiers.map(t => ({
        ...t,
        raised: tierMap.get(t.id)?.raised ?? 0,
        investors: tierMap.get(t.id)?.investors ?? 0,
        progress: t.hardCap > 0 ? Math.min(100, ((tierMap.get(t.id)?.raised ?? 0) / t.hardCap) * 100) : 0,
      }));
    } catch { return TOKENOMICS.tiers; }
  }),

  /** Burn log */
  burnLog: publicProcedure.query(async () => {
    await ensureICOTables();
    const db = await getDb();
    if (!db) return [];
    try {
      const rows = await db.execute(`SELECT * FROM ico_burn_log ORDER BY burned_at DESC LIMIT 50`);
      return (rows as any).rows || [];
    } catch { return []; }
  }),

  /** Rich list — top ICO investors */
  richList: publicProcedure.query(async () => {
    await ensureICOTables();
    const db = await getDb();
    if (!db) return [];
    try {
      const rows = await db.execute(
        `SELECT u.username, u.display_name, ip.user_id,
          SUM(ip.token_amount + ip.bonus_tokens) as total_tokens,
          SUM(ip.usd_amount) as total_invested,
          COUNT(*) as purchase_count,
          MIN(ip.created_at) as first_purchase
         FROM ico_purchases ip
         JOIN users u ON u.id = ip.user_id
         WHERE ip.status = 'completed'
         GROUP BY ip.user_id, u.username, u.display_name
         ORDER BY total_invested DESC LIMIT 20`
      );
      return ((rows as any).rows || []).map((r: any, i: number) => ({
        rank: i + 1,
        username: r.username || r.display_name || `Investor${r.user_id}`,
        totalTokens: Number(r.total_tokens ?? 0),
        totalInvested: Number(r.total_invested ?? 0),
        purchaseCount: Number(r.purchase_count ?? 0),
        firstPurchase: Number(r.first_purchase ?? 0),
      }));
    } catch { return []; }
  }),

  // ── Protected endpoints ─────────────────────────────────────────────────────

  /** User's ICO portfolio */
  myPortfolio: protectedProcedure.query(async ({ ctx }) => {
    await ensureICOTables();
    const db = await getDb();
    if (!db) return { purchases: [], totalInvested: 0, totalTokens: 0, vestedTokens: 0, pendingVest: 0, referralEarnings: 0 };
    try {
      const [purchases, referrals] = await Promise.all([
        db.execute(`SELECT * FROM ico_purchases WHERE user_id = ${ctx.user.id} ORDER BY created_at DESC`),
        db.execute(`SELECT COALESCE(SUM(commission_earned),0) as total FROM ico_referrals WHERE referrer_id = ${ctx.user.id}`),
      ]);
      const rows = (purchases as any).rows || [];
      const now = Date.now();
      let totalInvested = 0, totalTokens = 0, vestedTokens = 0, pendingVest = 0;
      const enriched = rows.map((r: any) => {
        const usd = Number(r.usd_amount ?? 0);
        const tokens = Number(r.token_amount ?? 0) + Number(r.bonus_tokens ?? 0);
        totalInvested += usd;
        totalTokens += tokens;
        // Calculate vested amount
        const vestStart = Number(r.vesting_start ?? 0);
        const vestEnd = Number(r.vesting_end ?? 0);
        let vested = 0;
        if (vestEnd > 0 && now >= vestStart) {
          const elapsed = Math.min(now - vestStart, vestEnd - vestStart);
          const duration = vestEnd - vestStart;
          vested = duration > 0 ? (tokens * elapsed) / duration : tokens;
        } else if (vestEnd === 0) {
          vested = tokens; // no vesting
        }
        const released = Number(r.tokens_released ?? 0);
        const claimable = Math.max(0, vested - released);
        vestedTokens += vested;
        pendingVest += claimable;
        return { ...r, totalTokens: tokens, vestedTokens: vested, claimableTokens: claimable };
      });
      return {
        purchases: enriched,
        totalInvested,
        totalTokens,
        vestedTokens,
        pendingVest,
        referralEarnings: Number((referrals as any).rows?.[0]?.total ?? 0),
      };
    } catch { return { purchases: [], totalInvested: 0, totalTokens: 0, vestedTokens: 0, pendingVest: 0, referralEarnings: 0 }; }
  }),

  /** Create Stripe checkout session for ICO purchase */
  createCheckout: protectedProcedure
    .input(z.object({
      tierId: z.enum(["seed", "private", "pre", "public"]),
      usdAmount: z.number().min(50).max(50000),
      referralCode: z.string().max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureICOTables();
      const stripe = getStripe();
      if (!stripe) return { success: false, error: "Payment system unavailable" };

      const tier = TOKENOMICS.tiers.find(t => t.id === input.tierId);
      if (!tier) return { success: false, error: "Invalid tier" };
      if (tier.status === "closed") return { success: false, error: "This tier is closed" };
      if (tier.status === "upcoming") return { success: false, error: "This tier has not opened yet" };
      if (input.usdAmount < tier.minBuy) return { success: false, error: `Minimum purchase is $${tier.minBuy}` };
      if (input.usdAmount > tier.maxBuy) return { success: false, error: `Maximum purchase is $${tier.maxBuy}` };

      const tokenAmount = input.usdAmount / tier.price;
      const bonusTokens = tokenAmount * (tier.bonus / 100);
      const totalTokens = tokenAmount + bonusTokens;

      const origin = process.env.VITE_OAUTH_PORTAL_URL?.replace("/oauth", "") || "https://shadowchat-3jxahdvz.manus.space";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: ctx.user.email || undefined,
        allow_promotion_codes: true,
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: `SKY444 Token — ${tier.name}`,
              description: `${totalTokens.toLocaleString()} SKY444 tokens (${tokenAmount.toLocaleString()} + ${bonusTokens.toLocaleString()} bonus) at $${tier.price}/token`,
              images: [],
            },
            unit_amount: Math.round(input.usdAmount * 100),
          },
          quantity: 1,
        }],
        client_reference_id: String(ctx.user.id),
        metadata: {
          user_id: String(ctx.user.id),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          tier_id: input.tierId,
          usd_amount: String(input.usdAmount),
          token_amount: String(tokenAmount),
          bonus_tokens: String(bonusTokens),
          referral_code: input.referralCode || "",
        },
        success_url: `${origin}/ico?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/ico?purchase=cancelled`,
      });

      // Create pending purchase record
      const db = await getDb();
      if (db) {
        await db.execute(
          `INSERT INTO ico_purchases (user_id, tier_id, usd_amount, token_amount, bonus_tokens, stripe_session_id, status, referral_code, created_at, updated_at) VALUES (${ctx.user.id}, '${input.tierId}', ${input.usdAmount}, ${tokenAmount}, ${bonusTokens}, '${session.id}', 'pending', '${input.referralCode || ""}', ${Date.now()}, ${Date.now()})`
        );
      }

      return { success: true, url: session.url, sessionId: session.id };
    }),

  /** Verify and complete a purchase after Stripe redirect */
  verifyPurchase: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ensureICOTables();
      const stripe = getStripe();
      if (!stripe) return { success: false, error: "Payment system unavailable" };

      const db = await getDb();
      if (!db) return { success: false, error: "DB unavailable" };

      // Check if already processed
      const existing = await db.execute(
        `SELECT * FROM ico_purchases WHERE stripe_session_id = '${input.sessionId}' AND user_id = ${ctx.user.id} LIMIT 1`
      );
      const purchase = (existing as any).rows?.[0];
      if (!purchase) return { success: false, error: "Purchase not found" };
      if (purchase.status === "completed") return { success: true, alreadyProcessed: true };

      // Verify with Stripe
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      if (session.payment_status !== "paid") return { success: false, error: "Payment not completed" };

      const tier = TOKENOMICS.tiers.find(t => t.id === purchase.tier_id);
      const vestingMonths = tier?.id === "pre" ? 18 : tier?.id === "public" ? 9 : 36;
      const vestStart = Date.now() + (3 * 30 * 24 * 60 * 60 * 1000); // 3mo cliff
      const vestEnd = vestStart + (vestingMonths * 30 * 24 * 60 * 60 * 1000);

      await db.execute(
        `UPDATE ico_purchases SET status = 'completed', stripe_payment_intent = '${session.payment_intent || ""}', vesting_start = ${vestStart}, vesting_end = ${vestEnd}, updated_at = ${Date.now()} WHERE stripe_session_id = '${input.sessionId}'`
      );

      // Credit tokens to wallet (locked — will be released via vesting)
      const dbInst = await import('./db');
      const totalTokens = Number(purchase.token_amount) + Number(purchase.bonus_tokens);
      await dbInst.upsertTokenBalance(ctx.user.id, "SKY444", totalTokens);
      await dbInst.createTransaction({ userId: ctx.user.id, type: "ico_purchase", token: "SKY444", amount: totalTokens, description: `ICO Purchase: ${tier?.name} — $${purchase.usd_amount} USD` });

      // Handle referral commission
      if (purchase.referral_code) {
        const referrer = await db.execute(
          `SELECT referrer_id FROM ico_referrals WHERE referral_code = '${purchase.referral_code}' LIMIT 1`
        );
        const ref = (referrer as any).rows?.[0];
        if (ref) {
          const commission = totalTokens * 0.05; // 5% referral commission in tokens
          await db.execute(
            `UPDATE ico_referrals SET commission_earned = commission_earned + ${commission} WHERE referral_code = '${purchase.referral_code}'`
          );
          await dbInst.upsertTokenBalance(Number(ref.referrer_id), "SKY444", commission);
          await dbInst.createTransaction({ userId: Number(ref.referrer_id), type: "referral", token: "SKY444", amount: commission, description: `Referral commission from ICO purchase` });
        }
      }

      return { success: true, totalTokens, vestStart, vestEnd };
    }),

  /** Claim vested tokens */
  claimVested: protectedProcedure
    .input(z.object({ purchaseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ensureICOTables();
      const db = await getDb();
      if (!db) return { success: false, error: "DB unavailable" };

      const rows = await db.execute(
        `SELECT * FROM ico_purchases WHERE id = ${input.purchaseId} AND user_id = ${ctx.user.id} AND status = 'completed' LIMIT 1`
      );
      const purchase = (rows as any).rows?.[0];
      if (!purchase) return { success: false, error: "Purchase not found" };

      const now = Date.now();
      const vestStart = Number(purchase.vesting_start ?? 0);
      const vestEnd = Number(purchase.vesting_end ?? 0);
      const totalTokens = Number(purchase.token_amount) + Number(purchase.bonus_tokens);
      const released = Number(purchase.tokens_released ?? 0);

      let vested = 0;
      if (vestEnd > 0 && now >= vestStart) {
        const elapsed = Math.min(now - vestStart, vestEnd - vestStart);
        vested = (totalTokens * elapsed) / (vestEnd - vestStart);
      } else if (vestEnd === 0) {
        vested = totalTokens;
      }

      const claimable = Math.max(0, vested - released);
      if (claimable < 0.001) return { success: false, error: "No tokens available to claim yet" };

      await db.execute(
        `UPDATE ico_purchases SET tokens_released = tokens_released + ${claimable}, updated_at = ${Date.now()} WHERE id = ${input.purchaseId}`
      );
      await db.execute(
        `INSERT INTO ico_vesting_releases (user_id, purchase_id, amount, released_at, created_at) VALUES (${ctx.user.id}, ${input.purchaseId}, ${claimable}, ${now}, ${now})`
      );

      return { success: true, claimed: claimable };
    }),

  /** Generate user's referral code */
  getReferralCode: protectedProcedure.mutation(async ({ ctx }) => {
    await ensureICOTables();
    const db = await getDb();
    if (!db) return { code: "" };
    const code = `SKY${ctx.user.id}${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6).toUpperCase()}`;
    await db.execute(
      `INSERT IGNORE INTO ico_referrals (referrer_id, referred_user_id, referral_code, created_at) VALUES (${ctx.user.id}, 0, '${code}', ${Date.now()})`
    );
    return { code };
  }),

  /** Trigger a token burn (admin/platform action) */
  burnTokens: protectedProcedure
    .input(z.object({ amount: z.number().positive(), reason: z.string().max(200) }))
    .mutation(async ({ ctx, input }) => {
      await ensureICOTables();
      const db = await getDb();
      if (!db) return { success: false };
      const dbInst = await import('./db');
      const result = await dbInst.upsertTokenBalance(ctx.user.id, "SKY444", -input.amount);
      if (!result.success) return { success: false, error: "Insufficient balance" };
      await db.execute(
        `INSERT INTO ico_burn_log (amount, reason, burned_at) VALUES (${input.amount}, '${input.reason.replace(/'/g, "''")}', ${Date.now()})`
      );
      await dbInst.createTransaction({ userId: ctx.user.id, type: "burn", token: "SKY444", amount: input.amount, description: `Burn: ${input.reason}` });
      return { success: true, burned: input.amount };
    }),

  /** Treasury stats */
  treasury: publicProcedure.query(async () => {
    await ensureICOTables();
    const db = await getDb();
    if (!db) return { totalRaised: 0, burnedTokens: 0, circulatingSupply: 0, marketCap: 0 };
    try {
      const [raised, burned] = await Promise.all([
        db.execute(`SELECT COALESCE(SUM(usd_amount),0) as total FROM ico_purchases WHERE status = 'completed'`),
        db.execute(`SELECT COALESCE(SUM(amount),0) as total FROM ico_burn_log`),
      ]);
      const totalRaised = Number((raised as any).rows?.[0]?.total ?? 0);
      const burnedTokens = Number((burned as any).rows?.[0]?.total ?? 0);
      const currentPrice = TOKENOMICS.tiers.find(t => t.status === "active")?.price ?? 0.005;
      const circulatingSupply = TOKENOMICS.totalSupply - burnedTokens - TOKENOMICS.distribution.team.tokens - TOKENOMICS.distribution.treasury.tokens;
      const marketCap = circulatingSupply * currentPrice;
      return {
        totalRaised,
        burnedTokens,
        circulatingSupply,
        marketCap,
        currentPrice,
        fullyDilutedValuation: TOKENOMICS.totalSupply * currentPrice,
        treasuryReserve: TOKENOMICS.distribution.treasury.tokens * currentPrice,
      };
    } catch { return { totalRaised: 0, burnedTokens: 0, circulatingSupply: 0, marketCap: 0 }; }
  }),
});
