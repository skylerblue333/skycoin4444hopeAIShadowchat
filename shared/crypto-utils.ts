/**
 * CRYPTO & TOKEN ECONOMICS UTILITIES
 * Token pricing, vesting schedules, staking calculations,
 * fee structures, and DeFi math utilities.
 */

// ═══════════════════════════════════════════════════════════════
// TOKEN ECONOMICS
// ═══════════════════════════════════════════════════════════════

export interface TokenConfig {
  symbol: string;
  name: string;
  totalSupply: number;
  circulatingSupply: number;
  decimals: number;
  burnRate: number; // percentage per transaction
  stakingRewardRate: number; // APY percentage
  inflationRate: number; // annual inflation percentage
  maxSupply: number;
}

export const SKY444_CONFIG: TokenConfig = {
  symbol: "SKY444",
  name: "SKYCOIN4444",
  totalSupply: 4_444_444_444,
  circulatingSupply: 2_222_222_222,
  decimals: 8,
  burnRate: 0.5,
  stakingRewardRate: 12.5,
  inflationRate: 3.0,
  maxSupply: 10_000_000_000,
};

/**
 * Calculate token price based on bonding curve
 */
export function calculateBondingCurvePrice(
  supply: number,
  reserveBalance: number,
  reserveRatio: number
): number {
  // Bancor formula: Price = ReserveBalance / (Supply * ReserveRatio)
  if (supply <= 0 || reserveRatio <= 0) return 0;
  return reserveBalance / (supply * reserveRatio);
}

/**
 * Calculate tokens received for a given purchase amount
 */
export function calculatePurchaseReturn(
  supply: number,
  reserveBalance: number,
  reserveRatio: number,
  depositAmount: number
): number {
  // Bancor formula for continuous token purchase
  if (reserveBalance <= 0 || reserveRatio <= 0) return 0;
  const base = 1 + depositAmount / reserveBalance;
  const exponent = reserveRatio;
  return supply * (Math.pow(base, exponent) - 1);
}

/**
 * Calculate sale return (tokens to reserve currency)
 */
export function calculateSaleReturn(
  supply: number,
  reserveBalance: number,
  reserveRatio: number,
  sellAmount: number
): number {
  if (supply <= 0 || reserveRatio <= 0) return 0;
  const base = 1 - sellAmount / supply;
  const exponent = 1 / reserveRatio;
  return reserveBalance * (1 - Math.pow(base, exponent));
}

/**
 * Calculate market cap
 */
export function calculateMarketCap(price: number, circulatingSupply: number): number {
  return price * circulatingSupply;
}

/**
 * Calculate fully diluted valuation
 */
export function calculateFDV(price: number, totalSupply: number): number {
  return price * totalSupply;
}

// ═══════════════════════════════════════════════════════════════
// STAKING CALCULATIONS
// ═══════════════════════════════════════════════════════════════

export interface StakingPool {
  id: string;
  name: string;
  totalStaked: number;
  rewardRate: number; // APY
  lockPeriodDays: number;
  minStake: number;
  maxStake: number;
  earlyWithdrawalPenalty: number; // percentage
  compoundingFrequency: "daily" | "weekly" | "monthly";
}

/**
 * Calculate staking rewards for a given period
 */
export function calculateStakingRewards(
  principal: number,
  apy: number,
  daysStaked: number,
  compoundingFrequency: "daily" | "weekly" | "monthly" = "daily"
): {
  rewards: number;
  totalValue: number;
  effectiveApy: number;
} {
  const periodsPerYear = compoundingFrequency === "daily" ? 365
    : compoundingFrequency === "weekly" ? 52
    : 12;

  const ratePerPeriod = apy / 100 / periodsPerYear;
  const periods = (daysStaked / 365) * periodsPerYear;

  const totalValue = principal * Math.pow(1 + ratePerPeriod, periods);
  const rewards = totalValue - principal;
  const effectiveApy = (Math.pow(1 + ratePerPeriod, periodsPerYear) - 1) * 100;

  return { rewards, totalValue, effectiveApy };
}

/**
 * Calculate early withdrawal penalty
 */
export function calculateEarlyWithdrawalPenalty(
  amount: number,
  daysStaked: number,
  lockPeriodDays: number,
  penaltyRate: number
): {
  penalty: number;
  netAmount: number;
  percentageComplete: number;
} {
  const percentageComplete = Math.min(daysStaked / lockPeriodDays, 1);

  if (percentageComplete >= 1) {
    return { penalty: 0, netAmount: amount, percentageComplete: 1 };
  }

  // Penalty decreases linearly as lock period progresses
  const adjustedPenalty = penaltyRate * (1 - percentageComplete);
  const penalty = amount * (adjustedPenalty / 100);
  const netAmount = amount - penalty;

  return { penalty, netAmount, percentageComplete };
}

/**
 * Calculate optimal staking strategy
 */
export function calculateOptimalStaking(
  availableTokens: number,
  pools: StakingPool[],
  investmentHorizonDays: number
): Array<{
  poolId: string;
  allocation: number;
  expectedReward: number;
  risk: "low" | "medium" | "high";
}> {
  const allocations: Array<{
    poolId: string;
    allocation: number;
    expectedReward: number;
    risk: "low" | "medium" | "high";
  }> = [];

  // Sort pools by risk-adjusted return
  const sortedPools = [...pools].sort((a, b) => {
    const aReturn = a.rewardRate / (a.lockPeriodDays / 30 + 1);
    const bReturn = b.rewardRate / (b.lockPeriodDays / 30 + 1);
    return bReturn - aReturn;
  });

  let remaining = availableTokens;

  for (const pool of sortedPools) {
    if (remaining <= 0) break;
    if (pool.lockPeriodDays > investmentHorizonDays) continue;

    const allocation = Math.min(remaining, pool.maxStake, remaining * 0.4);
    if (allocation < pool.minStake) continue;

    const { rewards } = calculateStakingRewards(
      allocation,
      pool.rewardRate,
      Math.min(investmentHorizonDays, pool.lockPeriodDays)
    );

    const risk: "low" | "medium" | "high" =
      pool.lockPeriodDays <= 30 ? "low" :
      pool.lockPeriodDays <= 90 ? "medium" : "high";

    allocations.push({
      poolId: pool.id,
      allocation,
      expectedReward: rewards,
      risk,
    });

    remaining -= allocation;
  }

  return allocations;
}

// ═══════════════════════════════════════════════════════════════
// VESTING SCHEDULES
// ═══════════════════════════════════════════════════════════════

export interface VestingSchedule {
  id: string;
  beneficiary: string;
  totalAmount: number;
  startDate: Date;
  cliffDays: number;
  vestingDays: number;
  releasedAmount: number;
  schedule: "linear" | "monthly" | "quarterly";
}

/**
 * Calculate vested amount at a given date
 */
export function calculateVestedAmount(
  schedule: VestingSchedule,
  atDate: Date = new Date()
): {
  vestedAmount: number;
  unvestedAmount: number;
  claimableAmount: number;
  nextVestingDate: Date | null;
  percentVested: number;
} {
  const now = atDate.getTime();
  const start = schedule.startDate.getTime();
  const cliffEnd = start + schedule.cliffDays * 86400000;
  const vestingEnd = start + schedule.vestingDays * 86400000;

  // Before cliff
  if (now < cliffEnd) {
    const nextVesting = new Date(cliffEnd);
    return {
      vestedAmount: 0,
      unvestedAmount: schedule.totalAmount,
      claimableAmount: 0,
      nextVestingDate: nextVesting,
      percentVested: 0,
    };
  }

  // After full vesting
  if (now >= vestingEnd) {
    return {
      vestedAmount: schedule.totalAmount,
      unvestedAmount: 0,
      claimableAmount: schedule.totalAmount - schedule.releasedAmount,
      nextVestingDate: null,
      percentVested: 100,
    };
  }

  // During vesting period
  let vestedAmount: number;
  let nextVestingDate: Date | null = null;

  switch (schedule.schedule) {
    case "linear": {
      const elapsed = now - cliffEnd;
      const vestingDuration = vestingEnd - cliffEnd;
      const percentVested = elapsed / vestingDuration;
      vestedAmount = schedule.totalAmount * percentVested;
      // Next second
      nextVestingDate = new Date(now + 1000);
      break;
    }
    case "monthly": {
      const monthsElapsed = Math.floor((now - cliffEnd) / (30 * 86400000));
      const totalMonths = Math.ceil((vestingEnd - cliffEnd) / (30 * 86400000));
      vestedAmount = (schedule.totalAmount / totalMonths) * monthsElapsed;
      nextVestingDate = new Date(cliffEnd + (monthsElapsed + 1) * 30 * 86400000);
      break;
    }
    case "quarterly": {
      const quartersElapsed = Math.floor((now - cliffEnd) / (90 * 86400000));
      const totalQuarters = Math.ceil((vestingEnd - cliffEnd) / (90 * 86400000));
      vestedAmount = (schedule.totalAmount / totalQuarters) * quartersElapsed;
      nextVestingDate = new Date(cliffEnd + (quartersElapsed + 1) * 90 * 86400000);
      break;
    }
  }

  const percentVested = (vestedAmount / schedule.totalAmount) * 100;

  return {
    vestedAmount,
    unvestedAmount: schedule.totalAmount - vestedAmount,
    claimableAmount: vestedAmount - schedule.releasedAmount,
    nextVestingDate,
    percentVested,
  };
}

// ═══════════════════════════════════════════════════════════════
// FEE STRUCTURES
// ═══════════════════════════════════════════════════════════════

export interface FeeStructure {
  baseFee: number;
  percentageFee: number;
  minFee: number;
  maxFee: number;
  discountTiers: Array<{
    minVolume: number;
    discount: number; // percentage off
  }>;
}

const FEE_STRUCTURES: Record<string, FeeStructure> = {
  transfer: {
    baseFee: 0.01,
    percentageFee: 0.1,
    minFee: 0.001,
    maxFee: 100,
    discountTiers: [
      { minVolume: 10000, discount: 10 },
      { minVolume: 100000, discount: 25 },
      { minVolume: 1000000, discount: 50 },
    ],
  },
  swap: {
    baseFee: 0,
    percentageFee: 0.3,
    minFee: 0.01,
    maxFee: 500,
    discountTiers: [
      { minVolume: 50000, discount: 15 },
      { minVolume: 500000, discount: 30 },
    ],
  },
  marketplace: {
    baseFee: 0,
    percentageFee: 2.5,
    minFee: 0.1,
    maxFee: 1000,
    discountTiers: [
      { minVolume: 100000, discount: 20 },
      { minVolume: 1000000, discount: 40 },
    ],
  },
  withdrawal: {
    baseFee: 1.0,
    percentageFee: 0.5,
    minFee: 1.0,
    maxFee: 200,
    discountTiers: [
      { minVolume: 50000, discount: 25 },
    ],
  },
  subscription: {
    baseFee: 0,
    percentageFee: 10.0, // Platform takes 10% of subscription revenue
    minFee: 0.5,
    maxFee: 500,
    discountTiers: [
      { minVolume: 10000, discount: 20 },
      { minVolume: 100000, discount: 40 },
    ],
  },
};

/**
 * Calculate fee for a transaction
 */
export function calculateFee(
  type: keyof typeof FEE_STRUCTURES,
  amount: number,
  userVolume30d: number = 0
): {
  fee: number;
  netAmount: number;
  feePercentage: number;
  discount: number;
  tier: string;
} {
  const structure = FEE_STRUCTURES[type];
  if (!structure) {
    return { fee: 0, netAmount: amount, feePercentage: 0, discount: 0, tier: "unknown" };
  }

  // Calculate base fee
  let fee = structure.baseFee + (amount * structure.percentageFee / 100);

  // Apply tier discount
  let discount = 0;
  let tier = "standard";
  for (const t of structure.discountTiers.sort((a, b) => b.minVolume - a.minVolume)) {
    if (userVolume30d >= t.minVolume) {
      discount = t.discount;
      tier = `volume_${t.minVolume}`;
      break;
    }
  }

  fee = fee * (1 - discount / 100);

  // Apply min/max
  fee = Math.max(structure.minFee, Math.min(structure.maxFee, fee));

  return {
    fee,
    netAmount: amount - fee,
    feePercentage: (fee / amount) * 100,
    discount,
    tier,
  };
}

/**
 * Get fee structure for a transaction type
 */
export function getFeeStructure(type: string): FeeStructure | undefined {
  return FEE_STRUCTURES[type];
}

/**
 * Get all fee structures
 */
export function getAllFeeStructures(): Record<string, FeeStructure> {
  return { ...FEE_STRUCTURES };
}

// ═══════════════════════════════════════════════════════════════
// LIQUIDITY POOL MATH
// ═══════════════════════════════════════════════════════════════

export interface LiquidityPool {
  tokenA: { symbol: string; reserve: number };
  tokenB: { symbol: string; reserve: number };
  totalLpTokens: number;
  fee: number; // percentage
}

/**
 * Calculate swap output using constant product formula (x * y = k)
 */
export function calculateSwapOutput(
  inputAmount: number,
  inputReserve: number,
  outputReserve: number,
  feePercent: number = 0.3
): {
  outputAmount: number;
  priceImpact: number;
  fee: number;
  effectivePrice: number;
} {
  const feeAmount = inputAmount * (feePercent / 100);
  const inputAfterFee = inputAmount - feeAmount;

  // Constant product formula: (x + dx) * (y - dy) = x * y
  const outputAmount = (outputReserve * inputAfterFee) / (inputReserve + inputAfterFee);

  // Price impact
  const spotPrice = outputReserve / inputReserve;
  const executionPrice = outputAmount / inputAmount;
  const priceImpact = Math.abs((spotPrice - executionPrice) / spotPrice) * 100;

  return {
    outputAmount,
    priceImpact,
    fee: feeAmount,
    effectivePrice: executionPrice,
  };
}

/**
 * Calculate LP tokens for adding liquidity
 */
export function calculateLpTokensForDeposit(
  depositA: number,
  depositB: number,
  reserveA: number,
  reserveB: number,
  totalLpTokens: number
): {
  lpTokens: number;
  shareOfPool: number;
  optimalRatio: number;
} {
  let lpTokens: number;

  if (totalLpTokens === 0) {
    // First deposit: LP tokens = sqrt(depositA * depositB)
    lpTokens = Math.sqrt(depositA * depositB);
  } else {
    // Subsequent deposits: min(depositA/reserveA, depositB/reserveB) * totalLP
    const ratioA = depositA / reserveA;
    const ratioB = depositB / reserveB;
    lpTokens = Math.min(ratioA, ratioB) * totalLpTokens;
  }

  const newTotalLp = totalLpTokens + lpTokens;
  const shareOfPool = (lpTokens / newTotalLp) * 100;
  const optimalRatio = reserveA > 0 ? reserveB / reserveA : 1;

  return { lpTokens, shareOfPool, optimalRatio };
}

/**
 * Calculate impermanent loss
 */
export function calculateImpermanentLoss(priceRatio: number): {
  loss: number;
  lossPercentage: number;
} {
  // IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
  const sqrtRatio = Math.sqrt(priceRatio);
  const ilFactor = (2 * sqrtRatio) / (1 + priceRatio) - 1;
  const lossPercentage = Math.abs(ilFactor) * 100;

  return {
    loss: ilFactor,
    lossPercentage,
  };
}

// ═══════════════════════════════════════════════════════════════
// TOKEN DISTRIBUTION
// ═══════════════════════════════════════════════════════════════

export interface TokenDistribution {
  category: string;
  percentage: number;
  amount: number;
  vestingMonths: number;
  cliffMonths: number;
  description: string;
}

export const SKY444_DISTRIBUTION: TokenDistribution[] = [
  {
    category: "Community Rewards",
    percentage: 30,
    amount: 1_333_333_333,
    vestingMonths: 48,
    cliffMonths: 0,
    description: "Staking rewards, farming incentives, and community airdrops",
  },
  {
    category: "Development Fund",
    percentage: 20,
    amount: 888_888_889,
    vestingMonths: 36,
    cliffMonths: 6,
    description: "Platform development, infrastructure, and engineering",
  },
  {
    category: "Team & Advisors",
    percentage: 15,
    amount: 666_666_667,
    vestingMonths: 48,
    cliffMonths: 12,
    description: "Core team allocation with 12-month cliff",
  },
  {
    category: "Ecosystem Growth",
    percentage: 15,
    amount: 666_666_667,
    vestingMonths: 24,
    cliffMonths: 3,
    description: "Partnerships, integrations, and ecosystem expansion",
  },
  {
    category: "Liquidity",
    percentage: 10,
    amount: 444_444_444,
    vestingMonths: 0,
    cliffMonths: 0,
    description: "DEX liquidity pools and market making",
  },
  {
    category: "Treasury Reserve",
    percentage: 10,
    amount: 444_444_444,
    vestingMonths: 60,
    cliffMonths: 12,
    description: "Long-term treasury for governance-approved spending",
  },
];

/**
 * Calculate current circulating supply based on vesting schedules
 */
export function calculateCirculatingSupply(
  distribution: TokenDistribution[],
  monthsSinceLaunch: number
): {
  circulating: number;
  locked: number;
  percentCirculating: number;
} {
  let circulating = 0;
  let locked = 0;

  for (const alloc of distribution) {
    if (monthsSinceLaunch < alloc.cliffMonths) {
      locked += alloc.amount;
    } else if (alloc.vestingMonths === 0) {
      circulating += alloc.amount;
    } else {
      const monthsVesting = monthsSinceLaunch - alloc.cliffMonths;
      const percentVested = Math.min(monthsVesting / alloc.vestingMonths, 1);
      const vestedAmount = alloc.amount * percentVested;
      circulating += vestedAmount;
      locked += alloc.amount - vestedAmount;
    }
  }

  const total = circulating + locked;
  return {
    circulating,
    locked,
    percentCirculating: total > 0 ? (circulating / total) * 100 : 0,
  };
}

/**
 * Calculate token burn impact
 */
export function calculateBurnImpact(
  currentSupply: number,
  burnAmount: number,
  currentPrice: number
): {
  newSupply: number;
  supplyReduction: number;
  theoreticalPriceIncrease: number;
  newTheoreticalPrice: number;
  deflationRate: number;
} {
  const newSupply = currentSupply - burnAmount;
  const supplyReduction = (burnAmount / currentSupply) * 100;

  // Theoretical price increase (assuming constant market cap)
  const marketCap = currentPrice * currentSupply;
  const newTheoreticalPrice = marketCap / newSupply;
  const theoreticalPriceIncrease = ((newTheoreticalPrice - currentPrice) / currentPrice) * 100;

  return {
    newSupply,
    supplyReduction,
    theoreticalPriceIncrease,
    newTheoreticalPrice,
    deflationRate: supplyReduction,
  };
}
