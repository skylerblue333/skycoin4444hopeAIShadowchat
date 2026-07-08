import { db } from './db';
import { games, gameScores, achievements, leaderboards } from '../drizzle/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

/**
 * Game Configuration - 3-5 engaging games
 */
export const GAME_CONFIG = {
  CRYPTO_ARCADE: {
    id: 'crypto-arcade',
    name: 'Crypto Arcade',
    description: 'Fast-paced crypto trading game',
    baseReward: 100,
    maxLevel: 50,
    dailyChallenge: true,
  },
  STRATEGY_GAME: {
    id: 'strategy-game',
    name: 'Sky Strategy',
    description: 'Build your crypto empire',
    baseReward: 150,
    maxLevel: 100,
    dailyChallenge: true,
  },
  PUZZLE_GAME: {
    id: 'puzzle-game',
    name: 'Blockchain Puzzle',
    description: 'Solve crypto puzzles',
    baseReward: 75,
    maxLevel: 30,
    dailyChallenge: true,
  },
  MINING_GAME: {
    id: 'mining-game',
    name: 'Idle Miner',
    description: 'Tap to mine crypto',
    baseReward: 50,
    maxLevel: 25,
    dailyChallenge: true,
  },
  TRADING_GAME: {
    id: 'trading-game',
    name: 'Trading Tycoon',
    description: 'Master the markets',
    baseReward: 200,
    maxLevel: 75,
    dailyChallenge: true,
  },
};

/**
 * Achievement Definitions
 */
export const ACHIEVEMENTS = {
  FIRST_GAME: {
    id: 'first-game',
    name: 'Game Starter',
    description: 'Play your first game',
    reward: 10,
    icon: '🎮',
  },
  LEVEL_10: {
    id: 'level-10',
    name: 'Rising Star',
    description: 'Reach level 10',
    reward: 50,
    icon: '⭐',
  },
  LEVEL_50: {
    id: 'level-50',
    name: 'Master Player',
    description: 'Reach level 50',
    reward: 200,
    icon: '👑',
  },
  STREAK_7: {
    id: 'streak-7',
    name: 'Dedicated Player',
    description: '7-day game streak',
    reward: 100,
    icon: '🔥',
  },
  LEADERBOARD_TOP_10: {
    id: 'leaderboard-top-10',
    name: 'Top 10 Player',
    description: 'Reach top 10 leaderboard',
    reward: 500,
    icon: '🏆',
  },
  CHARITY_DONOR: {
    id: 'charity-donor',
    name: 'Philanthropist',
    description: 'Donate $100 to charity',
    reward: 250,
    icon: '❤️',
  },
};

/**
 * Play a game and record score
 */
export async function playGame(
  userId: string,
  gameId: string,
  score: number,
  level: number
) {
  try {
    // Record game score
    const result = await db.insert(gameScores).values({
      userId,
      gameId,
      score,
      level,
      playedAt: new Date(),
      earnedRewards: Math.floor(score / 10), // 1 reward per 10 points
    });

    // Update leaderboard
    await updateLeaderboard(userId, gameId, score);

    // Check for achievements
    await checkAchievements(userId, gameId, score, level);

    return {
      success: true,
      earnedRewards: Math.floor(score / 10),
      message: 'Game recorded successfully',
    };
  } catch (error) {
        return { success: false, error: 'Failed to record game' };
  }
}

/**
 * Update leaderboard
 */
async function updateLeaderboard(
  userId: string,
  gameId: string,
  score: number
) {
  try {
    const existing = await db
      .select()
      .from(leaderboards)
      .where(
        and(
          eq(leaderboards.userId, userId),
          eq(leaderboards.gameId, gameId)
        )
      );

    if (existing.length > 0 && existing[0].highScore >= score) {
      return; // Don't update if lower score
    }

    await db
      .insert(leaderboards)
      .values({
        userId,
        gameId,
        highScore: score,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [leaderboards.userId, leaderboards.gameId],
        set: {
          highScore: score,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
      }
}

/**
 * Get leaderboard for a game
 */
export async function getLeaderboard(gameId: string, limit = 100) {
  try {
    return await db
      .select()
      .from(leaderboards)
      .where(eq(leaderboards.gameId, gameId))
      .orderBy(desc(leaderboards.highScore))
      .limit(limit);
  } catch (error) {
        return [];
  }
}

/**
 * Check and award achievements
 */
async function checkAchievements(
  userId: string,
  gameId: string,
  score: number,
  level: number
) {
  try {
    const achievementsToCheck = [];

    // First game achievement
    const gameCount = await db
      .select()
      .from(gameScores)
      .where(eq(gameScores.userId, userId));

    if (gameCount.length === 1) {
      achievementsToCheck.push(ACHIEVEMENTS.FIRST_GAME.id);
    }

    // Level achievements
    if (level >= 10) achievementsToCheck.push(ACHIEVEMENTS.LEVEL_10.id);
    if (level >= 50) achievementsToCheck.push(ACHIEVEMENTS.LEVEL_50.id);

    // Award achievements
    for (const achievementId of achievementsToCheck) {
      await awardAchievement(userId, achievementId);
    }
  } catch (error) {
      }
}

/**
 * Award achievement to user
 */
export async function awardAchievement(userId: string, achievementId: string) {
  try {
    const achievement = Object.values(ACHIEVEMENTS).find(
      (a) => a.id === achievementId
    );
    if (!achievement) return;

    await db
      .insert(achievements)
      .values({
        userId,
        achievementId,
        unlockedAt: new Date(),
        reward: achievement.reward,
      })
      .onConflictDoNothing();
  } catch (error) {
      }
}

/**
 * Get user game statistics
 */
export async function getUserGameStats(userId: string) {
  try {
    const scores = await db
      .select()
      .from(gameScores)
      .where(eq(gameScores.userId, userId));

    const achievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId));

    const totalRewards = scores.reduce((sum, s) => sum + s.earnedRewards, 0);
    const totalGamesPlayed = scores.length;
    const highestScore = Math.max(...scores.map((s) => s.score), 0);

    return {
      totalGamesPlayed,
      totalRewards,
      highestScore,
      achievementsUnlocked: achievements.length,
      achievements: achievements.map((a) => a.achievementId),
    };
  } catch (error) {
        return {
      totalGamesPlayed: 0,
      totalRewards: 0,
      highestScore: 0,
      achievementsUnlocked: 0,
      achievements: [],
    };
  }
}

/**
 * Get daily challenge for user
 */
export async function getDailyChallenge(userId: string, gameId: string) {
  const today = new Date().toDateString();
  const challenge = {
    gameId,
    objective: `Reach level 5 in ${gameId}`,
    reward: 50,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    completed: false,
  };

  return challenge;
}

/**
 * Calculate in-game currency rewards
 */
export function calculateRewards(
  baseReward: number,
  multiplier = 1,
  bonusPercentage = 0
) {
  const base = baseReward * multiplier;
  const bonus = base * (bonusPercentage / 100);
  return Math.floor(base + bonus);
}

/**
 * Process in-game purchase
 */
export async function processPurchase(
  userId: string,
  itemId: string,
  cost: number
) {
  return {
    success: true,
    itemId,
    cost,
    message: 'Purchase successful',
  };
}

/**
 * Process charity donation
 */
export async function processDonation(
  userId: string,
  amount: number,
  charity: string
) {
  // 50% goes to charity, 50% back to user as rewards
  const charityAmount = amount / 2;
  const userRewards = amount / 2;

  return {
    success: true,
    charityAmount,
    userRewards,
    charity,
    message: 'Thank you for your donation!',
  };
}
