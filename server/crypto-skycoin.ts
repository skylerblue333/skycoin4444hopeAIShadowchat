import crypto from 'crypto';
import { getDb, placeTrade, updateWalletBalance, getWallet } from "./db";
import { trades } from "../drizzle";
import { eq } from "drizzle-orm";

// ─── MARKET DATA (FICTIONAL) ────────────────────────────────────────────
export interface MarketPrice {
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}

// Simulated market data - in production, integrate with real API
const marketData: Record<string, MarketPrice> = {
  "BTC/USD": {
    pair: "BTC/USD",
    price: 67500,
    change24h: 2.5,
    high24h: 68200,
    low24h: 66800,
    volume24h: 28500000000,
    timestamp: Date.now(),
  },
  "ETH/USD": {
    pair: "ETH/USD",
    price: 3500,
    change24h: 1.8,
    high24h: 3550,
    low24h: 3420,
    volume24h: 15200000000,
    timestamp: Date.now(),
  },
  "SOL/USD": {
    pair: "SOL/USD",
    price: 185,
    change24h: 3.2,
    high24h: 190,
    low24h: 178,
    volume24h: 2100000000,
    timestamp: Date.now(),
  },
  "SKY444/USD": {
    pair: "SKY444/USD",
    price: 0.45,
    change24h: 5.7,
    high24h: 0.48,
    low24h: 0.42,
    volume24h: 125000000,
    timestamp: Date.now(),
  },
};

// ─── PRICE FEEDS ────────────────────────────────────────────────────────
export function getMarketPrice(pair: string): MarketPrice | null {
  return marketData[pair] || null;
}

export function getAllMarketPrices(): MarketPrice[] {
  return Object.values(marketData);
}

export function updateMarketPrice(pair: string, priceUpdate: Partial<MarketPrice>) {
  if (marketData[pair]) {
    marketData[pair] = {
      ...marketData[pair],
      ...priceUpdate,
      timestamp: Date.now(),
    };
  }
}

// Simulate price updates every 5 seconds
export function startPriceSimulation() {
  setInterval(() => {
    Object.keys(marketData).forEach((pair) => {
      const data = marketData[pair];
      const volatility = ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.5) * 0.02; // ±1% volatility
      const newPrice = data.price * (1 + volatility);
      const change24h = data.change24h + ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.5) * 0.5;

      updateMarketPrice(pair, {
        price: parseFloat(newPrice.toFixed(2)),
        change24h: parseFloat(change24h.toFixed(2)),
        high24h: Math.max(data.high24h, newPrice),
        low24h: Math.min(data.low24h, newPrice),
      });
    });
  }, 5000);
}

// ─── ORDER EXECUTION ────────────────────────────────────────────────────
export async function executeMarketOrder(
  userId: string,
  pair: string,
  side: "buy" | "sell",
  amount: number
): Promise<{ success: boolean; message: string; tradeId?: number }> {
  try {
    const marketPrice = getMarketPrice(pair);
    if (!marketPrice) {
      return { success: false, message: "Trading pair not found" };
    }

    const wallet = await getWallet(userId);
    if (!wallet) {
      return { success: false, message: "Wallet not found" };
    }

    const balances = wallet.balances as Record<string, number>;
    const totalCost = amount * marketPrice.price;
    const fee = totalCost * 0.001; // 0.1% fee
    const totalWithFee = totalCost + fee;

    // Validate sufficient balance
    if (side === "buy" && balances["USD"] < totalWithFee) {
      return { success: false, message: "Insufficient USD balance" };
    }

    const [baseCurrency] = pair.split("/");
    if (side === "sell" && (balances[baseCurrency] || 0) < amount) {
      return { success: false, message: `Insufficient ${baseCurrency} balance` };
    }

    // Execute trade
    if (side === "buy") {
      await updateWalletBalance(userId, "USD", totalWithFee, "subtract");
      await updateWalletBalance(userId, baseCurrency, amount, "add");
    } else {
      await updateWalletBalance(userId, baseCurrency, amount, "subtract");
      await updateWalletBalance(userId, "USD", totalCost - fee, "add");
    }

    // Record trade
    const result = await placeTrade(
      userId,
      pair,
      side,
      "market",
      amount,
      marketPrice.price
    );

    // Mark trade as filled (trade recorded via placeTrade function)
    // Trade status is set to pending initially, can be updated separately

    return {
      success: true,
      message: `${side === "buy" ? "Bought" : "Sold"} ${amount} ${baseCurrency} at $${marketPrice.price}`,
    };
  } catch (error) {
        return { success: false, message: "Order execution failed" };
  }
}

export async function executeLimitOrder(
  userId: string,
  pair: string,
  side: "buy" | "sell",
  amount: number,
  limitPrice: number
): Promise<{ success: boolean; message: string; tradeId?: number }> {
  try {
    const marketPrice = getMarketPrice(pair);
    if (!marketPrice) {
      return { success: false, message: "Trading pair not found" };
    }

    // Check if limit price is reached
    const shouldExecute =
      (side === "buy" && marketPrice.price <= limitPrice) ||
      (side === "sell" && marketPrice.price >= limitPrice);

    if (!shouldExecute) {
      // Place pending limit order
      await placeTrade(userId, pair, side, "limit", amount, limitPrice);
      return {
        success: true,
        message: `Limit order placed: ${side} ${amount} ${pair.split("/")[0]} at $${limitPrice}`,
      };
    }

    // Execute immediately if limit is reached
    return executeMarketOrder(userId, pair, side, amount);
  } catch (error) {
        return { success: false, message: "Limit order failed" };
  }
}

export async function executeStopOrder(
  userId: string,
  pair: string,
  side: "buy" | "sell",
  amount: number,
  stopPrice: number
): Promise<{ success: boolean; message: string; tradeId?: number }> {
  try {
    const marketPrice = getMarketPrice(pair);
    if (!marketPrice) {
      return { success: false, message: "Trading pair not found" };
    }

    // Check if stop price is reached
    const shouldExecute =
      (side === "sell" && marketPrice.price <= stopPrice) ||
      (side === "buy" && marketPrice.price >= stopPrice);

    if (!shouldExecute) {
      // Place pending stop order
      await placeTrade(userId, pair, side, "stop", amount, stopPrice);
      return {
        success: true,
        message: `Stop order placed: ${side} ${amount} ${pair.split("/")[0]} at $${stopPrice}`,
      };
    }

    // Execute immediately if stop is reached
    return executeMarketOrder(userId, pair, side, amount);
  } catch (error) {
        return { success: false, message: "Stop order failed" };
  }
}

// ─── PORTFOLIO CALCULATION ──────────────────────────────────────────────
export function calculatePortfolioValue(balances: Record<string, number>): number {
  let totalUSD = balances["USD"] || 0;

  Object.entries(balances).forEach(([currency, amount]) => {
    if (currency === "USD") return;
    const pair = `${currency}/USD`;
    const price = getMarketPrice(pair);
    if (price) {
      totalUSD += amount * price.price;
    }
  });

  return totalUSD;
}

// ─── RISK MANAGEMENT ────────────────────────────────────────────────────
export interface RiskMetrics {
  totalValue: number;
  allocation: Record<string, { amount: number; percentage: number; value: number }>;
  largestPosition: { currency: string; percentage: number };
  diversification: number; // 0-1 score
}

export function calculateRiskMetrics(balances: Record<string, number>): RiskMetrics {
  const totalValue = calculatePortfolioValue(balances);
  const allocation: Record<string, { amount: number; percentage: number; value: number }> = {};
  let largestPercentage = 0;
  let largestCurrency = "USD";

  Object.entries(balances).forEach(([currency, amount]) => {
    let value = amount;
    if (currency !== "USD") {
      const pair = `${currency}/USD`;
      const price = getMarketPrice(pair);
      value = price ? amount * price.price : 0;
    }
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
    allocation[currency] = { amount, percentage, value };

    if (percentage > largestPercentage) {
      largestPercentage = percentage;
      largestCurrency = currency;
    }
  });

  // Diversification score: 1 = perfectly diversified, 0 = concentrated
  const numAssets = Object.keys(balances).length;
  const herfindahl = Object.values(allocation).reduce((sum, a) => sum + (a.percentage / 100) ** 2, 0);
  const diversification = 1 - Math.min(herfindahl, 1);

  return {
    totalValue,
    allocation,
    largestPosition: { currency: largestCurrency, percentage: largestPercentage },
    diversification,
  };
}
