import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════
// CRYPTO UTILS TESTS
// ═══════════════════════════════════════════════════════════════

import {
  calculateBondingCurvePrice,
  calculatePurchaseReturn,
  calculateSaleReturn,
  calculateMarketCap,
  calculateFDV,
  calculateStakingRewards,
  calculateEarlyWithdrawalPenalty,
  calculateVestedAmount,
  calculateFee,
  calculateSwapOutput,
  calculateLpTokensForDeposit,
  calculateImpermanentLoss,
  calculateCirculatingSupply,
  calculateBurnImpact,
  SKY444_CONFIG,
  SKY444_DISTRIBUTION,
} from "../shared/crypto-utils";

describe("Token Economics", () => {
  it("calculates bonding curve price correctly", () => {
    const price = calculateBondingCurvePrice(1000000, 500000, 0.5);
    expect(price).toBe(1); // 500000 / (1000000 * 0.5)
  });

  it("returns 0 for invalid inputs", () => {
    expect(calculateBondingCurvePrice(0, 500000, 0.5)).toBe(0);
    expect(calculateBondingCurvePrice(1000, 500, 0)).toBe(0);
  });

  it("calculates purchase return", () => {
    const tokens = calculatePurchaseReturn(1000000, 500000, 0.5, 10000);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(1000000); // Can't get more than total supply
  });

  it("calculates sale return", () => {
    const value = calculateSaleReturn(1000000, 500000, 0.5, 100000);
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(500000); // Can't get more than reserve
  });

  it("calculates market cap", () => {
    expect(calculateMarketCap(0.01, 2222222222)).toBe(22222222.22);
  });

  it("calculates FDV", () => {
    expect(calculateFDV(0.01, 4444444444)).toBe(44444444.44);
  });
});

describe("Staking Calculations", () => {
  it("calculates daily compounding rewards", () => {
    const result = calculateStakingRewards(10000, 12.5, 365, "daily");
    expect(result.rewards).toBeGreaterThan(1200); // Should be > simple interest
    expect(result.totalValue).toBeGreaterThan(11200);
    expect(result.effectiveApy).toBeGreaterThan(12.5); // Compound > nominal
  });

  it("calculates monthly compounding rewards", () => {
    const result = calculateStakingRewards(10000, 12.5, 365, "monthly");
    expect(result.rewards).toBeGreaterThan(1200);
    expect(result.effectiveApy).toBeGreaterThan(12.5);
  });

  it("returns 0 rewards for 0 days", () => {
    const result = calculateStakingRewards(10000, 12.5, 0);
    expect(result.rewards).toBeCloseTo(0, 5);
  });

  it("calculates early withdrawal penalty", () => {
    const result = calculateEarlyWithdrawalPenalty(10000, 15, 30, 10);
    expect(result.penalty).toBeGreaterThan(0);
    expect(result.netAmount).toBeLessThan(10000);
    expect(result.percentageComplete).toBe(0.5);
  });

  it("no penalty after lock period", () => {
    const result = calculateEarlyWithdrawalPenalty(10000, 30, 30, 10);
    expect(result.penalty).toBe(0);
    expect(result.netAmount).toBe(10000);
    expect(result.percentageComplete).toBe(1);
  });

  it("penalty decreases linearly", () => {
    const early = calculateEarlyWithdrawalPenalty(10000, 5, 30, 10);
    const mid = calculateEarlyWithdrawalPenalty(10000, 15, 30, 10);
    expect(early.penalty).toBeGreaterThan(mid.penalty);
  });
});

describe("Vesting Schedules", () => {
  it("returns 0 vested before cliff", () => {
    const schedule = {
      id: "1",
      beneficiary: "user1",
      totalAmount: 1000000,
      startDate: new Date(),
      cliffDays: 365,
      vestingDays: 730,
      releasedAmount: 0,
      schedule: "linear" as const,
    };
    const result = calculateVestedAmount(schedule);
    expect(result.vestedAmount).toBe(0);
    expect(result.percentVested).toBe(0);
    expect(result.nextVestingDate).not.toBeNull();
  });

  it("returns full amount after vesting period", () => {
    const schedule = {
      id: "1",
      beneficiary: "user1",
      totalAmount: 1000000,
      startDate: new Date(Date.now() - 800 * 86400000),
      cliffDays: 30,
      vestingDays: 365,
      releasedAmount: 500000,
      schedule: "linear" as const,
    };
    const result = calculateVestedAmount(schedule);
    expect(result.vestedAmount).toBe(1000000);
    expect(result.claimableAmount).toBe(500000);
    expect(result.percentVested).toBe(100);
  });

  it("calculates monthly vesting correctly", () => {
    const schedule = {
      id: "1",
      beneficiary: "user1",
      totalAmount: 120000,
      startDate: new Date(Date.now() - 120 * 86400000), // 120 days ago
      cliffDays: 30,
      vestingDays: 360,
      releasedAmount: 0,
      schedule: "monthly" as const,
    };
    const result = calculateVestedAmount(schedule);
    expect(result.vestedAmount).toBeGreaterThan(0);
    expect(result.vestedAmount).toBeLessThan(120000);
  });
});

describe("Fee Structures", () => {
  it("calculates transfer fee", () => {
    const result = calculateFee("transfer", 1000, 0);
    expect(result.fee).toBeGreaterThan(0);
    expect(result.netAmount).toBeLessThan(1000);
    expect(result.tier).toBe("standard");
  });

  it("applies volume discount", () => {
    const noDiscount = calculateFee("transfer", 1000, 0);
    const withDiscount = calculateFee("transfer", 1000, 100000);
    expect(withDiscount.fee).toBeLessThan(noDiscount.fee);
    expect(withDiscount.discount).toBe(25);
  });

  it("applies highest qualifying tier", () => {
    const result = calculateFee("transfer", 1000, 1000000);
    expect(result.discount).toBe(50);
  });

  it("respects min fee", () => {
    const result = calculateFee("transfer", 0.001, 0);
    expect(result.fee).toBeGreaterThanOrEqual(0.001);
  });

  it("respects max fee", () => {
    const result = calculateFee("transfer", 10000000, 0);
    expect(result.fee).toBeLessThanOrEqual(100);
  });

  it("calculates swap fee", () => {
    const result = calculateFee("swap", 10000, 0);
    expect(result.feePercentage).toBeCloseTo(0.3, 1);
  });

  it("calculates marketplace fee", () => {
    const result = calculateFee("marketplace", 1000, 0);
    expect(result.feePercentage).toBeCloseTo(2.5, 1);
  });

  it("returns 0 for unknown type", () => {
    const result = calculateFee("unknown" as any, 1000, 0);
    expect(result.fee).toBe(0);
  });
});

describe("Liquidity Pool Math", () => {
  it("calculates swap output with constant product", () => {
    const result = calculateSwapOutput(100, 10000, 10000, 0.3);
    expect(result.outputAmount).toBeGreaterThan(0);
    expect(result.outputAmount).toBeLessThan(100); // Slippage
    expect(result.priceImpact).toBeGreaterThan(0);
    expect(result.fee).toBeCloseTo(0.3, 1);
  });

  it("larger trades have more price impact", () => {
    const small = calculateSwapOutput(10, 10000, 10000, 0.3);
    const large = calculateSwapOutput(1000, 10000, 10000, 0.3);
    expect(large.priceImpact).toBeGreaterThan(small.priceImpact);
  });

  it("calculates LP tokens for first deposit", () => {
    const result = calculateLpTokensForDeposit(1000, 1000, 0, 0, 0);
    expect(result.lpTokens).toBe(1000); // sqrt(1000 * 1000)
    expect(result.shareOfPool).toBe(100);
  });

  it("calculates LP tokens for subsequent deposit", () => {
    const result = calculateLpTokensForDeposit(100, 100, 1000, 1000, 1000);
    expect(result.lpTokens).toBe(100); // min(100/1000, 100/1000) * 1000
    expect(result.shareOfPool).toBeCloseTo(9.09, 1);
  });

  it("calculates impermanent loss", () => {
    // 2x price change
    const result = calculateImpermanentLoss(2);
    expect(result.lossPercentage).toBeGreaterThan(5);
    expect(result.lossPercentage).toBeLessThan(6);
  });

  it("no impermanent loss at same price", () => {
    const result = calculateImpermanentLoss(1);
    expect(result.lossPercentage).toBeCloseTo(0, 5);
  });
});

describe("Token Distribution & Supply", () => {
  it("calculates circulating supply at launch", () => {
    const result = calculateCirculatingSupply(SKY444_DISTRIBUTION, 0);
    // Only liquidity (no cliff) should be circulating
    expect(result.circulating).toBe(444444444); // 10% liquidity
    expect(result.locked).toBeGreaterThan(0);
  });

  it("calculates circulating supply after 24 months", () => {
    const result = calculateCirculatingSupply(SKY444_DISTRIBUTION, 24);
    expect(result.circulating).toBeGreaterThan(444444444);
    expect(result.percentCirculating).toBeGreaterThan(10);
  });

  it("all tokens circulating after full vesting", () => {
    const result = calculateCirculatingSupply(SKY444_DISTRIBUTION, 120); // 10 years
    const totalAmount = SKY444_DISTRIBUTION.reduce((sum, d) => sum + d.amount, 0);
    expect(result.circulating).toBeCloseTo(totalAmount, -2);
    expect(result.percentCirculating).toBeCloseTo(100, 0);
  });

  it("calculates burn impact", () => {
    const result = calculateBurnImpact(4444444444, 44444444, 0.01);
    expect(result.newSupply).toBe(4400000000);
    expect(result.supplyReduction).toBeCloseTo(1, 0);
    expect(result.theoreticalPriceIncrease).toBeGreaterThan(0);
    expect(result.newTheoreticalPrice).toBeGreaterThan(0.01);
  });
});

// ═══════════════════════════════════════════════════════════════
// VALIDATION UTILS TESTS
// ═══════════════════════════════════════════════════════════════

import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateUrl,
  validateWalletAddress,
  validateAmount,
  sanitizeString,
  generateId,
  hashString,
  formatTokenAmount,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  timeAgo,
  truncateAddress,
} from "../shared/validation";

describe("Validation Utilities", () => {
  describe("Email validation", () => {
    it("accepts valid emails", () => {
      expect(validateEmail("user@example.com").valid).toBe(true);
      expect(validateEmail("user+tag@sub.domain.com").valid).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(validateEmail("notanemail").valid).toBe(false);
      expect(validateEmail("@domain.com").valid).toBe(false);
      expect(validateEmail("user@").valid).toBe(false);
      expect(validateEmail("").valid).toBe(false);
    });
  });

  describe("Username validation", () => {
    it("accepts valid usernames", () => {
      expect(validateUsername("user123").valid).toBe(true);
      expect(validateUsername("cool_user").valid).toBe(true);
    });

    it("rejects invalid usernames", () => {
      expect(validateUsername("ab").valid).toBe(false); // too short
      expect(validateUsername("a".repeat(33)).valid).toBe(false); // too long
      expect(validateUsername("user name").valid).toBe(false); // spaces
      expect(validateUsername("user@name").valid).toBe(false); // special chars
    });
  });

  describe("Password validation", () => {
    it("accepts strong passwords", () => {
      expect(validatePassword("MyP@ssw0rd!").valid).toBe(true);
    });

    it("rejects weak passwords", () => {
      expect(validatePassword("short").valid).toBe(false);
      expect(validatePassword("alllowercase").valid).toBe(false);
    });
  });

  describe("URL validation", () => {
    it("accepts valid URLs", () => {
      expect(validateUrl("https://example.com").valid).toBe(true);
      expect(validateUrl("http://sub.domain.com/path").valid).toBe(true);
    });

    it("rejects invalid URLs", () => {
      expect(validateUrl("not-a-url").valid).toBe(false);
      expect(validateUrl("ftp://invalid.com").valid).toBe(false);
    });
  });

  describe("Wallet address validation", () => {
    it("accepts valid addresses", () => {
      expect(validateWalletAddress("0x" + "a".repeat(40)).valid).toBe(true);
    });

    it("rejects invalid addresses", () => {
      expect(validateWalletAddress("0x123").valid).toBe(false);
      expect(validateWalletAddress("notanaddress").valid).toBe(false);
    });
  });

  describe("Amount validation", () => {
    it("accepts valid amounts", () => {
      expect(validateAmount(100, 0, 10000).valid).toBe(true);
      expect(validateAmount(0.001, 0, 1).valid).toBe(true);
    });

    it("rejects invalid amounts", () => {
      expect(validateAmount(-1, 0, 100).valid).toBe(false);
      expect(validateAmount(200, 0, 100).valid).toBe(false);
      expect(validateAmount(NaN, 0, 100).valid).toBe(false);
    });
  });
});

describe("Formatting Utilities", () => {
  it("formats token amounts", () => {
    expect(formatTokenAmount(1234567.89)).toBe("1,234,567.89");
    expect(formatTokenAmount(0.001)).toBe("<0.01");
  });

  it("formats currency", () => {
    expect(formatCurrency(1234.56)).toContain("1,234.56");
  });

  it("formats percentages", () => {
    expect(formatPercentage(12.345)).toBe("12.35%");
    expect(formatPercentage(-5.1)).toBe("-5.10%");
  });

  it("formats compact numbers", () => {
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(2500000)).toBe("2.5M");
    expect(formatCompactNumber(3700000000)).toBe("3.7B");
    expect(formatCompactNumber(500)).toBe("500");
  });

  it("formats time ago", () => {
    expect(timeAgo(new Date(Date.now() - 30000))).toBe("just now");
    expect(timeAgo(new Date(Date.now() - 120000))).toBe("2m ago");
    expect(timeAgo(new Date(Date.now() - 7200000))).toBe("2h ago");
    expect(timeAgo(new Date(Date.now() - 172800000))).toBe("2d ago");
  });

  it("truncates wallet addresses", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234...5678");
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678", 8, 6)).toBe("0x123456...345678");
  });
});

describe("Utility Functions", () => {
  it("generates unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(10);
  });

  it("hashes strings consistently", () => {
    const hash1 = hashString("hello");
    const hash2 = hashString("hello");
    expect(hash1).toBe(hash2);
    expect(hashString("world")).not.toBe(hash1);
  });

  it("sanitizes strings", () => {
    expect(sanitizeString("<script>alert('xss')</script>")).not.toContain("<script>");
    expect(sanitizeString("normal text")).toBe("normal text");
    expect(sanitizeString("  spaces  ")).toBe("spaces");
  });
});
