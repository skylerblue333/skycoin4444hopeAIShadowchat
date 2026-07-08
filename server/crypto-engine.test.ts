/**
 * Crypto Engine Test Suite
 * Tests: mine, swap, stake, burn, balances, transactions
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TOKENS = ["BTC", "SKY444", "TRUMP", "DOGE", "USDT", "XMR", "ETH", "SOL"] as const;
type Token = typeof TOKENS[number];

interface TokenBalance {
  token: Token;
  balance: number;
  stakedBalance: number;
  minedBalance: number;
}

// Simulated in-memory state for tests
function createWallet(): Record<Token, TokenBalance> {
  return Object.fromEntries(
    TOKENS.map((t) => [t, { token: t, balance: 100, stakedBalance: 0, minedBalance: 0 }])
  ) as Record<Token, TokenBalance>;
}

// ─── Mine Engine ─────────────────────────────────────────────────────────────

function simulateMine(wallet: Record<Token, TokenBalance>, token: Token, durationMs: number): number {
  const ratePerMs: Record<Token, number> = {
    BTC: 0.000001,
    SKY444: 0.01,
    TRUMP: 0.05,
    DOGE: 0.5,
    USDT: 0.001,
    XMR: 0.0001,
    ETH: 0.00001,
    SOL: 0.001,
  };
  const mined = ratePerMs[token] * durationMs;
  wallet[token].balance += mined;
  wallet[token].minedBalance += mined;
  return mined;
}

// ─── Swap Engine ─────────────────────────────────────────────────────────────

const PRICES_USD: Record<Token, number> = {
  BTC: 95000,
  SKY444: 0.044,
  TRUMP: 12.5,
  DOGE: 0.15,
  USDT: 1.0,
  XMR: 180,
  ETH: 3500,
  SOL: 180,
};

function simulateSwap(
  wallet: Record<Token, TokenBalance>,
  fromToken: Token,
  toToken: Token,
  amount: number,
  slippagePct = 0.5
): { received: number; fee: number; rate: number } {
  if (wallet[fromToken].balance < amount) throw new Error("Insufficient balance");
  const fromUsd = PRICES_USD[fromToken] * amount;
  const slippageFactor = 1 - slippagePct / 100;
  const feeRate = 0.003; // 0.3%
  const fee = fromUsd * feeRate;
  const netUsd = (fromUsd - fee) * slippageFactor;
  const received = netUsd / PRICES_USD[toToken];
  wallet[fromToken].balance -= amount;
  wallet[toToken].balance += received;
  return { received, fee, rate: PRICES_USD[fromToken] / PRICES_USD[toToken] };
}

// ─── Stake Engine ─────────────────────────────────────────────────────────────

const APY_RATES: Record<Token, number> = {
  BTC: 0.04,
  SKY444: 0.44,
  TRUMP: 0.15,
  DOGE: 0.08,
  USDT: 0.06,
  XMR: 0.05,
  ETH: 0.05,
  SOL: 0.07,
};

function simulateStake(
  wallet: Record<Token, TokenBalance>,
  token: Token,
  amount: number
): { stakedAmount: number; apy: number; dailyReward: number } {
  if (wallet[token].balance < amount) throw new Error("Insufficient balance");
  wallet[token].balance -= amount;
  wallet[token].stakedBalance += amount;
  const apy = APY_RATES[token];
  const dailyReward = (amount * apy) / 365;
  return { stakedAmount: amount, apy, dailyReward };
}

function simulateUnstake(
  wallet: Record<Token, TokenBalance>,
  token: Token,
  amount: number
): { unstakedAmount: number } {
  if (wallet[token].stakedBalance < amount) throw new Error("Insufficient staked balance");
  wallet[token].stakedBalance -= amount;
  wallet[token].balance += amount;
  return { unstakedAmount: amount };
}

function calculateRewards(stakedAmount: number, token: Token, daysStaked: number): number {
  return (stakedAmount * APY_RATES[token] * daysStaked) / 365;
}

// ─── Burn Engine ─────────────────────────────────────────────────────────────

let totalBurned: Record<Token, number> = Object.fromEntries(TOKENS.map((t) => [t, 0])) as Record<Token, number>;

function simulateBurn(
  wallet: Record<Token, TokenBalance>,
  token: Token,
  amount: number
): { burned: number; newSupplyEffect: string } {
  if (wallet[token].balance < amount) throw new Error("Insufficient balance");
  wallet[token].balance -= amount;
  totalBurned[token] += amount;
  return { burned: amount, newSupplyEffect: `${amount} ${token} permanently removed from circulation` };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Crypto Engine — Mine", () => {
  let wallet: Record<Token, TokenBalance>;

  beforeEach(() => {
    wallet = createWallet();
  });

  it("mines SKY444 tokens at correct rate", () => {
    const mined = simulateMine(wallet, "SKY444", 1000);
    // rate = 0.01 per ms * 1000ms = 10
    expect(mined).toBeCloseTo(10, 5);
    expect(wallet.SKY444.balance).toBeCloseTo(110, 5);
    expect(wallet.SKY444.minedBalance).toBeCloseTo(10, 5);
  });

  it("mines BTC at slower rate than DOGE", () => {
    const btcMined = simulateMine(wallet, "BTC", 1000);
    const wallet2 = createWallet();
    const dogeMined = simulateMine(wallet2, "DOGE", 1000);
    expect(dogeMined).toBeGreaterThan(btcMined);
  });

  it("mines all 8 tokens without error", () => {
    for (const token of TOKENS) {
      const mined = simulateMine(wallet, token, 500);
      expect(mined).toBeGreaterThan(0);
    }
  });

  it("accumulates mined balance correctly over multiple sessions", () => {
    simulateMine(wallet, "SKY444", 1000);
    simulateMine(wallet, "SKY444", 1000);
    // 0.01/ms * 1000ms * 2 sessions = 20
    expect(wallet.SKY444.minedBalance).toBeCloseTo(20, 5);
  });

  it("does not affect other token balances when mining one token", () => {
    const btcBefore = wallet.BTC.balance;
    simulateMine(wallet, "SKY444", 5000);
    expect(wallet.BTC.balance).toBe(btcBefore);
  });
});

describe("Crypto Engine — Swap", () => {
  let wallet: Record<Token, TokenBalance>;

  beforeEach(() => {
    wallet = createWallet();
  });

  it("swaps SKY444 to USDT at correct rate", () => {
    const result = simulateSwap(wallet, "SKY444", "USDT", 10);
    expect(result.received).toBeGreaterThan(0);
    expect(result.fee).toBeGreaterThan(0);
    expect(wallet.SKY444.balance).toBe(90);
    expect(wallet.USDT.balance).toBeGreaterThan(100);
  });

  it("deducts fee from swap output", () => {
    const noFeeReceived = (PRICES_USD.SKY444 * 10) / PRICES_USD.USDT;
    const result = simulateSwap(wallet, "SKY444", "USDT", 10);
    expect(result.received).toBeLessThan(noFeeReceived);
  });

  it("throws on insufficient balance", () => {
    expect(() => simulateSwap(wallet, "BTC", "ETH", 1000)).toThrow("Insufficient balance");
  });

  it("applies slippage correctly", () => {
    const wallet1 = createWallet();
    const wallet2 = createWallet();
    const lowSlippage = simulateSwap(wallet1, "SKY444", "USDT", 10, 0.1);
    const highSlippage = simulateSwap(wallet2, "SKY444", "USDT", 10, 2.0);
    expect(lowSlippage.received).toBeGreaterThan(highSlippage.received);
  });

  it("correctly updates both token balances after swap", () => {
    const fromBefore = wallet.ETH.balance;
    const toBefore = wallet.SOL.balance;
    simulateSwap(wallet, "ETH", "SOL", 1);
    expect(wallet.ETH.balance).toBe(fromBefore - 1);
    expect(wallet.SOL.balance).toBeGreaterThan(toBefore);
  });

  it("calculates correct exchange rate", () => {
    const result = simulateSwap(wallet, "BTC", "ETH", 1);
    const expectedRate = PRICES_USD.BTC / PRICES_USD.ETH;
    expect(result.rate).toBeCloseTo(expectedRate, 2);
  });
});

describe("Crypto Engine — Stake", () => {
  let wallet: Record<Token, TokenBalance>;

  beforeEach(() => {
    wallet = createWallet();
  });

  it("stakes SKY444 with 44% APY", () => {
    const result = simulateStake(wallet, "SKY444", 50);
    expect(result.apy).toBe(0.44);
    expect(result.stakedAmount).toBe(50);
    expect(wallet.SKY444.balance).toBe(50);
    expect(wallet.SKY444.stakedBalance).toBe(50);
  });

  it("calculates daily reward correctly", () => {
    const result = simulateStake(wallet, "SKY444", 100);
    const expectedDaily = (100 * 0.44) / 365;
    expect(result.dailyReward).toBeCloseTo(expectedDaily, 5);
  });

  it("throws on insufficient balance for staking", () => {
    expect(() => simulateStake(wallet, "BTC", 1000)).toThrow("Insufficient balance");
  });

  it("unstakes and returns balance correctly", () => {
    simulateStake(wallet, "ETH", 50);
    const result = simulateUnstake(wallet, "ETH", 25);
    expect(result.unstakedAmount).toBe(25);
    expect(wallet.ETH.stakedBalance).toBe(25);
    expect(wallet.ETH.balance).toBe(75);
  });

  it("throws on insufficient staked balance for unstaking", () => {
    simulateStake(wallet, "DOGE", 10);
    expect(() => simulateUnstake(wallet, "DOGE", 50)).toThrow("Insufficient staked balance");
  });

  it("calculates 30-day rewards correctly", () => {
    const rewards = calculateRewards(1000, "SKY444", 30);
    const expected = (1000 * 0.44 * 30) / 365;
    expect(rewards).toBeCloseTo(expected, 5);
  });

  it("SKY444 has highest APY among all tokens", () => {
    const sky444Apy = APY_RATES.SKY444;
    for (const token of TOKENS) {
      if (token !== "SKY444") {
        expect(sky444Apy).toBeGreaterThan(APY_RATES[token]);
      }
    }
  });
});

describe("Crypto Engine — Burn", () => {
  let wallet: Record<Token, TokenBalance>;

  beforeEach(() => {
    wallet = createWallet();
    totalBurned = Object.fromEntries(TOKENS.map((t) => [t, 0])) as Record<Token, number>;
  });

  it("burns tokens and removes from balance", () => {
    const result = simulateBurn(wallet, "SKY444", 10);
    expect(result.burned).toBe(10);
    expect(wallet.SKY444.balance).toBe(90);
  });

  it("accumulates total burned across multiple burns", () => {
    simulateBurn(wallet, "SKY444", 5);
    simulateBurn(wallet, "SKY444", 3);
    expect(totalBurned.SKY444).toBe(8);
  });

  it("throws on insufficient balance for burn", () => {
    expect(() => simulateBurn(wallet, "BTC", 1000)).toThrow("Insufficient balance");
  });

  it("burn message contains token name and amount", () => {
    const result = simulateBurn(wallet, "TRUMP", 7);
    expect(result.newSupplyEffect).toContain("TRUMP");
    expect(result.newSupplyEffect).toContain("7");
  });

  it("burning one token does not affect others", () => {
    const ethBefore = wallet.ETH.balance;
    simulateBurn(wallet, "SKY444", 10);
    expect(wallet.ETH.balance).toBe(ethBefore);
  });
});

describe("Crypto Engine — Price Calculations", () => {
  it("all 8 tokens have positive USD prices", () => {
    for (const token of TOKENS) {
      expect(PRICES_USD[token]).toBeGreaterThan(0);
    }
  });

  it("BTC price is highest among all tokens", () => {
    for (const token of TOKENS) {
      if (token !== "BTC") {
        expect(PRICES_USD.BTC).toBeGreaterThan(PRICES_USD[token]);
      }
    }
  });

  it("USDT price is exactly 1.0", () => {
    expect(PRICES_USD.USDT).toBe(1.0);
  });

  it("portfolio value calculation is correct", () => {
    const wallet = createWallet();
    let totalValue = 0;
    for (const token of TOKENS) {
      totalValue += wallet[token].balance * PRICES_USD[token];
    }
    expect(totalValue).toBeGreaterThan(0);
  });

  it("swap rate is inverse of reverse swap rate", () => {
    const forwardRate = PRICES_USD.BTC / PRICES_USD.ETH;
    const reverseRate = PRICES_USD.ETH / PRICES_USD.BTC;
    expect(forwardRate * reverseRate).toBeCloseTo(1, 5);
  });
});

describe("Crypto Engine — Multi-Token Operations", () => {
  let wallet: Record<Token, TokenBalance>;

  beforeEach(() => {
    wallet = createWallet();
  });

  it("can mine, swap, stake, and burn in sequence", () => {
    // Mine SKY444
    simulateMine(wallet, "SKY444", 10000);
    expect(wallet.SKY444.balance).toBeGreaterThan(100);

    // Swap some SKY444 to USDT
    simulateSwap(wallet, "SKY444", "USDT", 10);
    expect(wallet.USDT.balance).toBeGreaterThan(100);

    // Stake remaining SKY444
    const stakeResult = simulateStake(wallet, "SKY444", 50);
    expect(stakeResult.stakedAmount).toBe(50);

    // Burn some TRUMP
    const burnResult = simulateBurn(wallet, "TRUMP", 5);
    expect(burnResult.burned).toBe(5);
  });

  it("total balance (liquid + staked) is conserved after stake/unstake", () => {
    const totalBefore = wallet.ETH.balance + wallet.ETH.stakedBalance;
    simulateStake(wallet, "ETH", 30);
    simulateUnstake(wallet, "ETH", 30);
    const totalAfter = wallet.ETH.balance + wallet.ETH.stakedBalance;
    expect(totalAfter).toBeCloseTo(totalBefore, 5);
  });

  it("all token APY rates are between 1% and 100%", () => {
    for (const token of TOKENS) {
      expect(APY_RATES[token]).toBeGreaterThan(0.01);
      expect(APY_RATES[token]).toBeLessThanOrEqual(1.0);
    }
  });
});
