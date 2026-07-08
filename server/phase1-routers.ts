import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { livingLoopEngine } from './living-loop-engine';
import { adaptiveRoadmapEngine } from './adaptive-roadmap-engine';
import { multiAgentOrchestrator } from './multi-agent-orchestrator';

/**
 * Phase 1 tRPC Routers
 * Living Loop + Adaptive Roadmap + Multi-Agent Orchestrator
 */

export const phase1Routers = {
  // Living Loop Router
  livingLoop: router({
    submitFeedback: protectedProcedure
      .input(
        z.object({
          featureId: z.string(),
          rating: z.number().min(1).max(5),
          comment: z.string(),
          category: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const feedback = await livingLoopEngine.submitFeedback(
          input.featureId,
          String(ctx.user.id),
          input.rating,
          input.comment,
          input.category as 'feature_quality' | 'user_experience' | 'performance' | 'other'
        );
        return { success: true, feedback };
      }),

    getFeedbackSummary: protectedProcedure
      .input(
        z.object({
          featureId: z.string(),
          periodDays: z.number().default(30),
        })
      )
      .query(async ({ input }) => {
        return livingLoopEngine.getFeedbackSummary(input.featureId, input.periodDays);
      }),

    getAutoUpdatedRoadmap: protectedProcedure.query(async () => {
      return livingLoopEngine.getAutoUpdatedRoadmap();
    }),

    getFeedbackTrends: protectedProcedure
      .input(
        z.object({
          featureId: z.string(),
          periodDays: z.number().default(30),
        })
      )
      .query(async ({ input }) => {
        return livingLoopEngine.getFeedbackTrends(input.featureId, input.periodDays);
      }),

    getChurnRiskSignals: protectedProcedure.query(async ({ ctx }) => {
      return livingLoopEngine.getChurnRiskSignals(String(ctx.user.id));
    }),
  }),

  // Adaptive Roadmap Router
  roadmap: router({
    getPrioritized: protectedProcedure.query(async () => {
      return adaptiveRoadmapEngine.getPrioritizedRoadmap();
    }),

    simulateOutcome: protectedProcedure
      .input(z.object({ itemId: z.string() }))
      .query(async ({ input }) => {
        return adaptiveRoadmapEngine.simulateOutcome(input.itemId);
      }),

    getMetrics: protectedProcedure.query(async () => {
      return adaptiveRoadmapEngine.getRoadmapMetrics();
    }),

    getChanges: protectedProcedure.query(async () => {
      return adaptiveRoadmapEngine.getRoadmapChanges();
    }),

    forecastQuarter: protectedProcedure
      .input(z.object({ quarterWeeks: z.number().default(13) }))
      .query(async ({ input }) => {
        return adaptiveRoadmapEngine.forecastRoadmap(input.quarterWeeks);
      }),

    addFeedbackSignal: protectedProcedure
      .input(
        z.object({
          itemId: z.string(),
          feedbackScore: z.number().min(0).max(1),
        })
      )
      .mutation(async ({ input }) => {
        await adaptiveRoadmapEngine.addFeedbackSignal(input.itemId, input.feedbackScore);
        return { success: true };
      }),
  }),

  // Multi-Agent Orchestrator Router
  agents: router({
    runDebate: protectedProcedure
      .input(z.object({ prompt: z.string() }))
      .query(async ({ input }) => {
        return multiAgentOrchestrator.runAgentDebate(input.prompt);
      }),

    getPerspective: protectedProcedure
      .input(
        z.object({
          agentRole: z.enum([
            'Market Analyst',
            'UX Designer',
            'Backend Architect',
            'Growth Marketer',
            'QA / Risk',
          ]),
          prompt: z.string(),
        })
      )
      .query(async ({ input }) => {
        return multiAgentOrchestrator.getAgentPerspective(input.agentRole, input.prompt);
      }),

    simulateDiscussion: protectedProcedure
      .input(z.object({ prompt: z.string() }))
      .query(async ({ input }) => {
        return multiAgentOrchestrator.simulateTeamDiscussion(input.prompt);
      }),
  }),
};
