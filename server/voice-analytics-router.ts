/**
 * VOICE ANALYTICS ROUTER - tRPC ENDPOINTS
 * Complete analytics and reporting system
 */

import { publicProcedure, protectedProcedure, adminProcedure, router } from './_core/trpc';
import { z } from 'zod';
import { voiceAnalyticsSystem } from './voice-analytics';

export const voiceAnalyticsRouter = router({
  /**
   * Track voice command event
   */
  trackEvent: publicProcedure
    .input(
      z.object({
        commandId: z.string(),
        commandName: z.string(),
        success: z.boolean(),
        responseTime: z.number(),
        confidence: z.number(),
        device: z.string().default('web'),
        language: z.string().default('en'),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      voiceAnalyticsSystem.trackEvent({
        timestamp: Date.now(),
        userId: String(ctx.user?.id || 'anonymous'),
        commandId: input.commandId,
        commandName: input.commandName,
        success: input.success,
        responseTime: input.responseTime,
        confidence: input.confidence,
        device: input.device,
        language: input.language,
        error: input.error,
      });

      return { success: true };
    }),

  /**
   * Get system-wide statistics
   */
  getSystemStats: publicProcedure.query(async () => {
    return voiceAnalyticsSystem.getSystemStats();
  }),

  /**
   * Get command statistics
   */
  getCommandStats: publicProcedure
    .input(z.object({ commandId: z.string() }))
    .query(async ({ input }) => {
      return voiceAnalyticsSystem.getCommandStats(input.commandId);
    }),

  /**
   * Get user statistics
   */
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    return voiceAnalyticsSystem.getUserStats(String(ctx.user!.id));
  }),

  /**
   * Get top commands
   */
  getTopCommands: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      return voiceAnalyticsSystem.getTopCommands(input.limit);
    }),

  /**
   * Get most failed commands
   */
  getMostFailedCommands: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      return voiceAnalyticsSystem.getMostFailedCommands(input.limit);
    }),

  /**
   * Get slowest commands
   */
  getSlowCommands: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      return voiceAnalyticsSystem.getSlowCommands(input.limit);
    }),

  /**
   * Get top users
   */
  getTopUsers: adminProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      return voiceAnalyticsSystem.getTopUsers(input.limit);
    }),

  /**
   * Get command success rate
   */
  getCommandSuccessRate: publicProcedure
    .input(z.object({ commandId: z.string() }))
    .query(async ({ input }) => {
      return {
        commandId: input.commandId,
        successRate: voiceAnalyticsSystem.getCommandSuccessRate(input.commandId),
      };
    }),

  /**
   * Get user success rate
   */
  getUserSuccessRate: protectedProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.user!.id,
      successRate: voiceAnalyticsSystem.getUserSuccessRate(String(ctx.user!.id)),
    };
  }),

  /**
   * Get average response time
   */
  getAverageResponseTime: publicProcedure
    .input(z.object({ commandId: z.string().optional() }))
    .query(async ({ input }) => {
      return {
        commandId: input.commandId,
        averageResponseTime: voiceAnalyticsSystem.getAverageResponseTime(input.commandId),
      };
    }),

  /**
   * Get time series data
   */
  getTimeSeriesData: publicProcedure
    .input(z.object({ commandId: z.string().optional(), timeWindow: z.number().default(3600000) }))
    .query(async ({ input }) => {
      return voiceAnalyticsSystem.getTimeSeriesData(input.commandId, input.timeWindow);
    }),

  /**
   * Get device statistics
   */
  getDeviceStats: publicProcedure.query(async () => {
    return voiceAnalyticsSystem.getDeviceStats();
  }),

  /**
   * Get language statistics
   */
  getLanguageStats: publicProcedure.query(async () => {
    return voiceAnalyticsSystem.getLanguageStats();
  }),

  /**
   * Clear old events (admin only)
   */
  clearOldEvents: adminProcedure
    .input(z.object({ ageMs: z.number().default(86400000) }))
    .mutation(async ({ input }) => {
      const cleared = voiceAnalyticsSystem.clearOldEvents(input.ageMs);
      return { cleared };
    }),
});
