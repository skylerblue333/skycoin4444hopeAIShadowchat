import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import * as datingIntegration from './dating-integration-hub';
import * as datingPhotos from './dating-photos';
import * as datingVideochat from './dating-videochat';
import { TRPCError } from '@trpc/server';

export const datingIntegratedRouter = router({
  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION & PAYMENT
  // ═══════════════════════════════════════════════════════════════

  subscribeToPremium: protectedProcedure
    .input(z.object({ tier: z.enum(['premium', 'vip', 'elite']) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const tierPrices: Record<string, number> = {
          premium: 999, // $9.99
          vip: 2499, // $24.99
          elite: 4999, // $49.99
        };

        const result = await datingIntegration.processDatingSubscriptionPayment(
          ctx.user.id,
          input.tier
        );

        if (result.success) {
          await datingIntegration.trackDatingMetrics({
            userId: ctx.user.id,
            action: 'subscribe',
            metadata: { tier: input.tier },
          });
        }

        return result;
      } catch (error) {
                throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process subscription',
        });
      }
    }),

  // ═══════════════════════════════════════════════════════════════
  // MATCHING & AI
  // ═══════════════════════════════════════════════════════════════

  getMatchInsights: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const insights = await datingIntegration.generateAIMatchingInsights(
          ctx.user.id,
          input.matchId
        );

        return { insights };
      } catch (error) {
                throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match not found',
        });
      }
    }),

  getConversationStarters: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const starters = await datingIntegration.generateConversationStarters(
          ctx.user.id,
          input.matchId
        );

        return { starters };
      } catch (error) {
                throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate conversation starters',
        });
      }
    }),

  // ═══════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════

  notifyMatch: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await datingIntegration.notifyDatingEvent(
          input.matchId,
          'match',
          ctx.user.id
        );

        return { success: true };
      } catch (error) {
                throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send notification',
        });
      }
    }),

  // ═══════════════════════════════════════════════════════════════
  // SOCIAL INTEGRATION
  // ═══════════════════════════════════════════════════════════════

  shareProfile: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const post = await datingIntegration.shareDatingProfile(
          ctx.user.id,
          input.matchId
        );

        await datingIntegration.trackDatingMetrics({
          userId: ctx.user.id,
          action: 'profile_update',
          metadata: { postId: post.id },
        });

        return { post };
      } catch (error) {
                throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to share profile',
        });
      }
    }),

  publishStory: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const story = await datingIntegration.publishDatingStory(
          ctx.user.id,
          input.content
        );

        return { story };
      } catch (error) {
                throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to publish story',
        });
      }
    }),

  // ═══════════════════════════════════════════════════════════════
  // STREAMING & VIDEO
  // ═══════════════════════════════════════════════════════════════

  startVideoDate: protectedProcedure
    .input(z.object({ matchId: z.string(), title: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const stream = await datingIntegration.initiateDatingVideoStream(
          ctx.user.id,
          input.matchId,
          input.title
        );

        await datingIntegration.trackDatingMetrics({
          userId: ctx.user.id,
          matchId: input.matchId,
          action: 'stream',
          metadata: { streamId: stream.id },
        });

        return { stream };
      } catch (error) {
                throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start video date',
        });
      }
    }),

  initiateVideoCall: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await datingVideochat.initiateVideoCall(
          input.matchId,
          ctx.user.id,
          input.matchId
        );

        await datingIntegration.trackDatingMetrics({
          userId: ctx.user.id,
          matchId: input.matchId,
          action: 'stream',
          metadata: { callId: session.id },
        });

        return { session };
      } catch (error) {
                throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to initiate video call',
        });
      }
    }),

  // ═══════════════════════════════════════════════════════════════
  // SECURITY & VERIFICATION
  // ═══════════════════════════════════════════════════════════════

  verifyProfile: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const verification = await datingIntegration.verifyDatingProfile(
        ctx.user.id
      );

      await datingIntegration.trackDatingMetrics({
        userId: ctx.user.id,
        action: 'profile_update',
        metadata: { verified: verification.success },
      });

      return verification;
    } catch (error) {
            throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify profile',
      });
    }
  }),

  reportSuspiciousActivity: protectedProcedure
    .input(z.object({ reportedUserId: z.string(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const report = await datingIntegration.flagSuspiciousActivity(
          ctx.user.id,
          input.reportedUserId,
          input.reason
        );

        return { report };
      } catch (error) {
                throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to report activity',
        });
      }
    }),

  // ═══════════════════════════════════════════════════════════════
  // ORCHESTRATION
  // ═══════════════════════════════════════════════════════════════

  orchestrateMatch: protectedProcedure
    .input(z.object({ userId2: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const orchestration = await datingIntegration.orchestrateDatingMatch(
          ctx.user.id,
          input.userId2
        );

        return { orchestration };
      } catch (error) {
                throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to orchestrate match',
        });
      }
    }),

  orchestrateMessage: protectedProcedure
    .input(z.object({ recipientId: z.string(), content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const orchestration = await datingIntegration.orchestrateDatingMessage(
          ctx.user.id,
          input.recipientId,
          input.content
        );

        return { orchestration };
      } catch (error) {
                throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process message',
        });
      }
    }),

  // ═══════════════════════════════════════════════════════════════
  // HEALTH & METRICS
  // ═══════════════════════════════════════════════════════════════

  checkIntegrationHealth: protectedProcedure.query(async () => {
    try {
        const health = await datingIntegration.getDatingIntegrationHealth();
      return health;
    } catch (error) {
            throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check health',
      });
    }
  }),
});
