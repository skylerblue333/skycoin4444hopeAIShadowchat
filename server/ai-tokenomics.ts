import crypto from 'crypto';
import { db } from './db';
import { users, tokenTransactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * AI Tokenomics Configuration
 * SKY444 token costs for different AI interactions
 */
export const AI_TOKEN_COSTS = {
  // LLM Interactions
  TEXT_GENERATION: 1, // Per 100 tokens generated
  CODE_GENERATION: 5, // Per code snippet
  IMAGE_GENERATION: 10, // Per image
  VOICE_SYNTHESIS: 3, // Per minute
  TRANSCRIPTION: 2, // Per minute of audio

  // AI Features
  RECOMMENDATION_ENGINE: 0.5, // Per recommendation
  SENTIMENT_ANALYSIS: 0.5, // Per analysis
  CONTENT_MODERATION: 0.2, // Per content check
  SPAM_DETECTION: 0.1, // Per check
  ANOMALY_DETECTION: 1, // Per analysis

  // Premium AI
  FINE_TUNING: 50, // Per fine-tuning session
  CUSTOM_MODEL: 100, // Per custom model
  PRIORITY_QUEUE: 5, // Per priority request
  EXTENDED_CONTEXT: 2, // Per extended context window

  // Game AI
  GAME_AI_OPPONENT: 2, // Per game
  GAME_HINT: 0.5, // Per hint
  GAME_STRATEGY_ANALYSIS: 1, // Per analysis

  // Analytics AI
  PREDICTIVE_ANALYTICS: 5, // Per prediction
  TREND_ANALYSIS: 2, // Per trend analysis
  DATA_INSIGHTS: 3, // Per insight
};

/**
 * User Token Balance
 */
export interface TokenBalance {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastUpdated: Date;
}

/**
 * Get user's SKY444 token balance
 */
export async function getUserTokenBalance(userId: string): Promise<TokenBalance> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return {
        userId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        lastUpdated: new Date(),
      };
    }

    // Get transaction history
    const transactions = await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.userId, userId));

    const totalEarned = transactions
      .filter((t) => t.type === 'earn')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalSpent = transactions
      .filter((t) => t.type === 'spend')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      userId,
      balance: totalEarned - totalSpent,
      totalEarned,
      totalSpent,
      lastUpdated: new Date(),
    };
  } catch (error) {
        return {
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Deduct tokens for AI interaction
 */
export async function deductTokens(
  userId: string,
  interactionType: keyof typeof AI_TOKEN_COSTS,
  quantity = 1,
  description?: string
): Promise<{
  success: boolean;
  newBalance?: number;
  error?: string;
}> {
  try {
    const balance = await getUserTokenBalance(userId);
    const cost = (AI_TOKEN_COSTS[interactionType] || 0) * quantity;

    if (balance.balance < cost) {
      return {
        success: false,
        error: `Insufficient tokens. Need ${cost}, have ${balance.balance}`,
      };
    }

    // Record transaction
    await db.insert(tokenTransactions).values({
      id: crypto.randomUUID(),
      userId,
      tokenSymbol: 'SKY444',
      type: 'spend',
      amount: cost.toString(),
      interactionType,
      description: description || `${interactionType} x${quantity}`,
      timestamp: new Date(),
    });

    const newBalance = balance.balance - cost;

    return {
      success: true,
      newBalance,
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to process token deduction',
    };
  }
}

/**
 * Award tokens for user actions
 */
export async function awardTokens(
  userId: string,
  amount: number,
  reason: string
): Promise<{
  success: boolean;
  newBalance?: number;
}> {
  try {
    await db.insert(tokenTransactions).values({
      id: crypto.randomUUID(),
      userId,
      tokenSymbol: 'SKY444',
      type: 'earn',
      amount: amount.toString(),
      interactionType: 'reward',
      description: reason,
      timestamp: new Date(),
    });

    const balance = await getUserTokenBalance(userId);

    return {
      success: true,
      newBalance: balance.balance,
    };
  } catch (error) {
        return {
      success: false,
    };
  }
}

/**
 * Daily token rewards
 */
export async function processDailyRewards(userId: string) {
  const rewards = {
    loginBonus: 10,
    gameBonus: 5,
    referralBonus: 20,
    achievementBonus: 15,
  };

  const totalReward = Object.values(rewards).reduce((a, b) => a + b, 0);

  return await awardTokens(userId, totalReward, 'Daily reward bonus');
}

/**
 * Get token transaction history
 */
export async function getTokenHistory(userId: string, limit = 50) {
  try {
    return await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.userId, userId))
      .limit(limit);
  } catch (error) {
        return [];
  }
}

/**
 * Calculate token cost for AI operation
 */
export function calculateTokenCost(
  operationType: keyof typeof AI_TOKEN_COSTS,
  quantity = 1,
  premiumMultiplier = 1
): number {
  const baseCost = AI_TOKEN_COSTS[operationType] || 0;
  return Math.ceil(baseCost * quantity * premiumMultiplier);
}

/**
 * Token pricing tiers
 */
export const TOKEN_PRICING = {
  STARTER: {
    tokens: 100,
    price: 9.99,
    bonus: 0,
  },
  PROFESSIONAL: {
    tokens: 500,
    price: 39.99,
    bonus: 50, // 10% bonus
  },
  ENTERPRISE: {
    tokens: 2000,
    price: 129.99,
    bonus: 300, // 15% bonus
  },
  UNLIMITED: {
    tokens: Infinity,
    price: 299.99,
    bonus: Infinity,
  },
};

/**
 * Get token package recommendations
 */
export function getTokenRecommendation(
  currentBalance: number,
  monthlyUsage: number
) {
  const recommendedMonthly = monthlyUsage * 1.2; // 20% buffer

  if (recommendedMonthly < 100) return 'STARTER';
  if (recommendedMonthly < 500) return 'PROFESSIONAL';
  if (recommendedMonthly < 2000) return 'ENTERPRISE';
  return 'UNLIMITED';
}

/**
 * Referral token rewards
 */
export async function processReferralReward(
  referrerId: string,
  newUserId: string
) {
  const referralBonus = 50; // 50 tokens per referral
  return await awardTokens(referrerId, referralBonus, `Referral bonus for ${newUserId}`);
}

/**
 * Staking rewards (earn tokens by staking)
 */
export async function calculateStakingRewards(
  userId: string,
  stakedAmount: number,
  stakingDays: number
) {
  const dailyRate = 0.001; // 0.1% daily
  const rewards = stakedAmount * dailyRate * stakingDays;
  return Math.floor(rewards);
}
