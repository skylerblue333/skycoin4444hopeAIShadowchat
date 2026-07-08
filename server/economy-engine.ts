/**
 * SKYCOIN4444 Economy Engine
 *
 * Manages token flow, emission cap enforcement, sink mechanics,
 * and price curve updates. Reads from tokenRegistry for canonical
 * token config — never hard-codes token names.
 *
 * Architecture:
 *   EconomyEngine (service) ← called by enterprise-router.ts
 *   Uses: token_emission_caps, token_market_state, token_balances, transactions
 *   Emits: TOKEN_MINTED, TOKEN_BURNED, EMISSION_CAP_HIT, SINK_PRESSURE_APPLIED,
 *          PRICE_UPDATED, INFLATION_WARNING, LOW_LIQUIDITY_DETECTED
 */

import { eq, sql, and, gte, lte } from "drizzle-orm";
import { getDb } from "./db.js";
import { eventBus } from "./event-bus.js";
import {
  tokenEmissionCaps,
  tokenMarketState,
  tokenBalances,
  transactions,
} from "../drizzle/schema.js";
import { TOKEN_REGISTRY, ALL_TOKEN_SYMBOLS } from "../shared/tokenRegistry.js";

export type TokenSymbol = (typeof ALL_TOKEN_SYMBOLS)[number];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TokenEconomySnapshot {
  token: TokenSymbol;
  circulatingSupply: number;
  maxSupply: number;
  emissionUsedPct: number;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  liquidityScore: number;
  inflationRate: number;
  sinkPressure: number;
}

export interface EconomyHealthReport {
  overallHealth: "HEALTHY" | "WARNING" | "CRITICAL";
  tokens: TokenEconomySnapshot[];
  alerts: string[];
  recommendations: string[];
  timestamp: number;
}

export interface MintResult {
  success: boolean;
  token: TokenSymbol;
  amount: number;
  newCirculatingSupply: number;
  capHit: boolean;
  reason: string;
}

// ─── Economy Engine ───────────────────────────────────────────────────────────

export class EconomyEngine {
  /**
   * Attempt to mint tokens for a user.
   * Enforces emission caps and updates market state.
   */
  async mint(
    token: TokenSymbol,
    userId: number,
    amount: number,
    reason: string
  ): Promise<MintResult> {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const [cap] = await db
      .select()
      .from(tokenEmissionCaps)
      .where(eq(tokenEmissionCaps.token, token))
      .limit(1);

    if (!cap) {
      return { success: false, token, amount, newCirculatingSupply: 0, capHit: false, reason: "No emission cap found" };
    }

    const currentSupply = Number(cap.totalSupply);
    const maxSupply = Number(cap.supplyCap ?? "999999999999");
    const emittedToday = Number(cap.emittedToday);
    const dailyCap = Number(cap.dailyCap);

    if (emittedToday + amount > dailyCap) {
      eventBus.publish("EMISSION_CAP_HIT", { token, attempted: amount, available: dailyCap - emittedToday }, userId);
      return {
        success: false, token, amount,
        newCirculatingSupply: currentSupply,
        capHit: true,
        reason: `Daily emission cap hit: ${emittedToday}/${dailyCap}`,
      };
    }
    if (maxSupply > 0 && currentSupply + amount > maxSupply) {
      eventBus.publish("EMISSION_CAP_HIT", { token, attempted: amount, available: maxSupply - currentSupply }, userId);
      return {
        success: false, token, amount,
        newCirculatingSupply: currentSupply,
        capHit: true,
        reason: `Supply cap hit: ${currentSupply}/${maxSupply}`,
      };
    }

    // Update emission cap supply
    await db
      .update(tokenEmissionCaps)
      .set({
        totalSupply: String(currentSupply + amount),
        emittedToday: String(emittedToday + amount),
        updatedAt: new Date()
      })
      .where(eq(tokenEmissionCaps.token, token));

    // Credit user balance
    const [existing] = await db
      .select()
      .from(tokenBalances)
      .where(and(eq(tokenBalances.userId, userId), eq(tokenBalances.token, token)))
      .limit(1);

    if (existing) {
      await db
        .update(tokenBalances)
        .set({ balance: String(Number(existing.balance) + amount) })
        .where(and(eq(tokenBalances.userId, userId), eq(tokenBalances.token, token)));
    } else {
      await db.insert(tokenBalances).values({ userId, token, balance: String(amount) });
    }

    // Record transaction
      await db.insert(transactions).values({
      userId,
      type: "reward",
      token,
      amount: String(amount),
      metadata: { reason, operation: "mint" },
      status: "confirmed",
      createdAt: new Date(),
    });

    // Update market state
    await this.updateMarketState(token, amount, "mint");

    eventBus.publish("TOKEN_MINTED", { token, amount, userId, reason }, userId);

    // Check inflation warning
    const emissionPct = maxSupply > 0 ? ((currentSupply + amount) / maxSupply) * 100 : 0;
    if (emissionPct > 80) {
      eventBus.publish("INFLATION_WARNING", { token, emissionPct, currentSupply: currentSupply + amount, maxSupply });
    }

    return {
      success: true, token, amount,
      newCirculatingSupply: currentSupply + amount,
      capHit: false,
      reason: `Minted ${amount} ${token} for user ${userId}: ${reason}`,
    };
  }

  /**
   * Burn tokens (sink mechanic).
   * Reduces circulating supply and applies deflationary pressure.
   */
  async burn(
    token: TokenSymbol,
    userId: number,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; newBalance: number }> {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const [bal] = await db
      .select()
      .from(tokenBalances)
      .where(and(eq(tokenBalances.userId, userId), eq(tokenBalances.token, token)))
      .limit(1);

    if (!bal || Number(bal.balance) < amount) {
      return { success: false, newBalance: Number(bal?.balance ?? 0) };
    }

    const newBalance = Number(bal.balance) - amount;
    await db
      .update(tokenBalances)
      .set({ balance: String(newBalance) })
      .where(and(eq(tokenBalances.userId, userId), eq(tokenBalances.token, token)));

    // Reduce circulating supply
    await db
      .update(tokenEmissionCaps)
      .set({ totalSupply: sql`GREATEST(0, ${tokenEmissionCaps.totalSupply} - ${amount})`, updatedAt: new Date() })
      .where(eq(tokenEmissionCaps.token, token));

    await db.insert(transactions).values({
      userId, type: "transfer", token, amount: String(amount),
      metadata: { reason, operation: "burn" },
      status: "confirmed",
      createdAt: new Date(),
    });

    await this.updateMarketState(token, amount, "burn");

    eventBus.publish("TOKEN_BURNED", { token, amount, userId, reason }, userId);
    eventBus.publish("SINK_PRESSURE_APPLIED", { token, amount, reason });

    return { success: true, newBalance };
  }

  /**
   * Get full economy health report across all tokens.
   */
  async getHealthReport(): Promise<EconomyHealthReport> {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const caps = await db.select().from(tokenEmissionCaps);
    const markets = await db.select().from(tokenMarketState);

    const marketMap = new Map(markets.map((m) => [m.token, m]));
    const alerts: string[] = [];
    const recommendations: string[] = [];
    const snapshots: TokenEconomySnapshot[] = [];

    for (const cap of caps) {
      const market = marketMap.get(cap.token);
      const currentSupply = Number(cap.totalSupply);
      const maxSupply = Number(cap.supplyCap ?? 0);
      const emissionUsedPct = maxSupply > 0 ? (currentSupply / maxSupply) * 100 : 0;
      const currentPrice = Number(market?.currentPrice ?? 0);
      const priceChange24h = Number(market?.volatilityScore ?? 0) * 10;
      const volume24h = Number(market?.volume24h ?? 0);
      const liquidityScore = Number(market?.stabilityFactor ?? 0.5) * 100;
      const inflationRate = Number(market?.volatilityScore ?? 0) * 100;
      const sinkPressure = Number(market?.demandIndex ?? 1) < 0.8 ? 50 : 0;

      if (emissionUsedPct > 90) {
        alerts.push(`${cap.token}: emission at ${emissionUsedPct.toFixed(1)}% — near cap`);
        recommendations.push(`Activate sink mechanics for ${cap.token} to reduce circulating supply`);
      }
      if (liquidityScore < 30) {
        alerts.push(`${cap.token}: low liquidity score (${liquidityScore})`);
        eventBus.publish("LOW_LIQUIDITY_DETECTED", { token: cap.token, liquidityScore });
      }
      if (inflationRate > 15) {
        alerts.push(`${cap.token}: high inflation rate (${inflationRate.toFixed(1)}%)`);
        eventBus.publish("INFLATION_WARNING", { token: cap.token, inflationRate });
      }

      snapshots.push({
        token: cap.token as TokenSymbol,
        circulatingSupply: currentSupply,
        maxSupply,
        emissionUsedPct,
        currentPrice,
        priceChange24h,
        volume24h,
        liquidityScore: Math.round(liquidityScore),
        inflationRate: Math.round(inflationRate * 10) / 10,
        sinkPressure: Math.round(sinkPressure),
      });
    }

    const criticalCount = alerts.filter((a) => a.includes("near cap") || a.includes("high inflation")).length;
    const overallHealth: EconomyHealthReport["overallHealth"] =
      criticalCount >= 2 ? "CRITICAL" : alerts.length > 0 ? "WARNING" : "HEALTHY";

    return { overallHealth, tokens: snapshots, alerts, recommendations, timestamp: Date.now() };
  }

  /**
   * Apply automatic sink pressure when inflation is detected.
   * Called by Free Will Engine when INFLATION_WARNING fires.
   */
  async applySinkPressure(token: TokenSymbol, pressureMultiplier: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    // Apply sink pressure by reducing demand index
    await db
      .update(tokenMarketState)
      .set({
        demandIndex: sql`GREATEST(0.1, ${tokenMarketState.demandIndex} - ${pressureMultiplier * 0.05})`,
        updatedAt: new Date(),
      })
      .where(eq(tokenMarketState.token, token));

    eventBus.publish("SINK_PRESSURE_APPLIED", { token, pressureMultiplier });
  }

  /**
   * Update market state after mint/burn/swap.
   */
  private async updateMarketState(
    token: TokenSymbol,
    amount: number,
    operation: "mint" | "burn" | "swap"
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const priceImpact = operation === "mint" ? -0.001 * amount : 0.001 * amount;

    await db
      .update(tokenMarketState)
      .set({
        volume24h: sql`${tokenMarketState.volume24h} + ${amount}`,
        currentPrice: sql`GREATEST(0.000001, ${tokenMarketState.currentPrice} + ${priceImpact})`,
        updatedAt: new Date(),
      })
      .where(eq(tokenMarketState.token, token));

    eventBus.publish("PRICE_UPDATED", { token, operation, amount });
  }

  /**
   * Get token market state for all tokens.
   */
  async getMarketStates(): Promise<typeof tokenMarketState.$inferSelect[]> {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(tokenMarketState);
  }

  /**
   * Get emission caps for all tokens.
   */
  async getEmissionCaps(): Promise<typeof tokenEmissionCaps.$inferSelect[]> {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(tokenEmissionCaps);
  }
}

export const economyEngine = new EconomyEngine();
