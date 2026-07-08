import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { rewardSystem } from './reward-system';

export const gamificationRouter = router({
  achievements: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return [
        { id: 'ach_1', name: 'First Steps', description: 'Complete your first trade', icon: '🚀', progress: 100, isUnlocked: true, rarity: 'common' },
        { id: 'ach_2', name: 'Trader', description: 'Complete 10 trades', icon: '💰', progress: 30, isUnlocked: false, rarity: 'rare' },
      ];
    }),
  }),

  leaderboard: router({
    global: protectedProcedure.input(z.object({ period: z.enum(['daily', 'weekly', 'monthly', 'allTime']), limit: z.number().default(50) })).query(async ({ input }) => {
      return [
        { rank: 1, userId: 'user_1', username: 'SkyMaster', xp: 15000, tokens: 1500 },
        { rank: 2, userId: 'user_2', username: 'TradeKing', xp: 14200, tokens: 1420 },
      ];
    }),
  }),

  missions: router({
    daily: protectedProcedure.query(async ({ ctx }) => rewardSystem.getDailyMissions(String(ctx.user.id))),
    weekly: protectedProcedure.query(async ({ ctx }) => rewardSystem.getWeeklyChallenges(String(ctx.user.id))),
    complete: protectedProcedure.input(z.object({ missionId: z.string() })).mutation(async ({ ctx, input }) => {
      const reward = await rewardSystem.completeMission(String(ctx.user.id), input.missionId);
      return { success: true, reward };
    }),
  }),

  shop: router({
    items: protectedProcedure.query(async () => rewardSystem.getRewardShopItems()),
    purchase: protectedProcedure.input(z.object({ itemId: z.string(), costType: z.enum(['xp', 'tokens']) })).mutation(async ({ ctx, input }) => {
      const success = await rewardSystem.purchaseRewardItem(String(ctx.user.id), input.itemId);
      return { success };
    }),
  }),

  streaks: router({
    current: protectedProcedure.query(async ({ ctx }) => ({
      dailyLoginStreak: 15,
      missionStreak: 8,
      votingStreak: 5,
      tradingStreak: 12,
    })),
  }),

  summary: protectedProcedure.query(async ({ ctx }) => rewardSystem.getUserRewardsSummary(String(ctx.user.id))),

  stats: router({
    overview: protectedProcedure.query(async ({ ctx }) => ({
      totalXp: 25000,
      level: 12,
      nextLevelXp: 30000,
      totalTokens: 2500,
      achievements: 8,
      streakDays: 15,
    })),
  }),

  getState: protectedProcedure.query(async ({ ctx }) => ({
    userId: ctx.user.id,
    level: 12,
    xp: 25000,
    tokens: 2500,
    achievements: 8,
    streakDays: 15,
  })),

  recordLogin: protectedProcedure.mutation(async ({ ctx }) => ({
    success: true,
    streakDays: 15,
    bonusXp: 100,
  })),

  getBattlePass: protectedProcedure.query(async ({ ctx }) => ({
    season: 5,
    level: 12,
    progress: 45,
    tiers: 100,
    rewards: [],
  })),

  claimTier: protectedProcedure.input(z.object({ tier: z.number() })).mutation(async ({ ctx, input }) => ({
    success: true,
    reward: { type: 'tokens', amount: 500 },
  })),

  getSpinPrizes: protectedProcedure.query(async ({ ctx }) => ([
    { id: 'prize_1', name: '100 Tokens', probability: 0.4, rarity: 'common' },
    { id: 'prize_2', name: '500 Tokens', probability: 0.3, rarity: 'rare' },
    { id: 'prize_3', name: '1000 Tokens', probability: 0.2, rarity: 'epic' },
    { id: 'prize_4', name: 'NFT', probability: 0.1, rarity: 'legendary' },
  ])),

  spin: protectedProcedure.mutation(async ({ ctx }) => ({
    success: true,
    prizeId: 'prize_1',
    reward: { type: 'tokens', amount: 100 },
  })),
});
