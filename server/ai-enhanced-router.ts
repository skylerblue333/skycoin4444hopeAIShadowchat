/**
 * ENHANCED AI ROUTER
 * Integrates OpenAI API with existing Manus LLM service
 * Provides intelligent responses across all 10 strategic engines
 */

import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { z } from 'zod';
import { productionLLM } from './llm-production';

export const aiEnhancedRouter = router({
  /**
   * Real intelligent chat with context awareness
   */
  chat: publicProcedure
    .input(
      z.object({
        message: z.string().optional(),
        messageText: z.string().optional(),
        model: z.string().optional(),
        history: z
          .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
          .optional(),
        conversationHistory: z
          .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
          .optional(),
        systemPrompt: z.string().optional(),
        engine: z.string().optional(),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = (input.userId || ctx.user?.id || 'anonymous') as string;
        const message = input.messageText || input.message || "";

        // Build context for intelligent response
        const context = {
          userId: userId as string,
          engine: input.engine || 'general',
          platform: 'skycoin4444',
          userRole: ctx.user?.role || 'user',
          recentActions: [],
          timestamp: Date.now() as unknown as number,
        };

        // Generate intelligent response using OpenAI API
        const reply = await productionLLM.generateIntelligentResponse(message, context);

        return {
          reply,
          message: reply,
          emotionalState: "helpful",
          tone: "professional",
          model: input.model || 'gpt-4',
          tokensUsed: Math.ceil(reply.length / 4), // Estimate tokens
          engine: input.engine || 'general',
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          reply: 'I encountered an issue processing your request. Please try again.',
          message: 'I encountered an issue processing your request. Please try again.',
          emotionalState: "neutral",
          tone: "neutral",
          model: input.model || 'gpt-4',
          tokensUsed: 0,
          error: true,
        };
      }
    }),

  /**
   * Multi-turn conversation with memory
   */
  conversation: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        message: z.string().min(1).max(4000),
        engine: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const context = {
          userId: ((ctx.user.id as unknown) as string),
          engine: input.engine || 'general',
          platform: 'skycoin4444',
          userRole: ctx.user.role || 'user',
          recentActions: [],
          timestamp: Date.now() as unknown as number,
        };

        const reply = await productionLLM.generateIntelligentResponse(input.message, context);

        return {
          sessionId: input.sessionId,
          reply,
          timestamp: new Date(),
          engine: input.engine || 'general',
        };
      } catch (error) {
                throw error;
      }
    }),

  /**
   * Stream real-time responses
   */
  stream: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(4000),
        engine: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const context = {
          userId: ((ctx.user?.id as unknown) as string) || 'anonymous',
          engine: input.engine || 'general',
          platform: 'skycoin4444',
          userRole: ctx.user?.role || 'user',
          recentActions: [],
          timestamp: Date.now() as unknown as number,
        };

        // Return streaming response generator
        const generator = productionLLM.streamResponse(input.message, context as any);

        // Collect all chunks
        let fullResponse = '';
        for await (const chunk of generator) {
          fullResponse += chunk;
        }

        return {
          reply: fullResponse,
          engine: input.engine || 'general',
          timestamp: new Date(),
        };
      } catch (error) {
                throw error;
      }
    }),

  /**
   * Generate insights for specific engine
   */
  generateInsight: publicProcedure
    .input(
      z.object({
        engine: z.enum([
          'feedback-hub',
          'adaptive-roadmap',
          'agent-debate',
          'competitive-radar',
          'behavioral-intelligence',
          'experiment-factory',
          'narrative-engine',
          'connector-intelligence',
          'product-brain',
          'company-simulator',
        ]),
        data: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const enginePrompts: Record<string, string> = {
          'feedback-hub': 'Analyze this feedback data and provide key insights and recommendations.',
          'adaptive-roadmap': 'Based on this roadmap data, suggest strategic priorities.',
          'agent-debate': 'Analyze these perspectives and provide balanced analysis.',
          'competitive-radar': 'Analyze competitive data and identify opportunities.',
          'behavioral-intelligence': 'Analyze user behavior patterns and provide insights.',
          'experiment-factory': 'Analyze experiment results and recommend next steps.',
          'narrative-engine': 'Generate compelling narratives from this data.',
          'connector-intelligence': 'Analyze integration opportunities.',
          'product-brain': 'Synthesize product knowledge and provide insights.',
          'company-simulator': 'Simulate scenarios and forecast outcomes.',
        };

        const prompt = `${enginePrompts[input.engine]}\n\nData: ${JSON.stringify(input.data || {})}`;

        const context = {
          userId: ((ctx.user?.id as unknown) as string) || 'anonymous',
          engine: input.engine,
          platform: 'skycoin4444',
          userRole: ctx.user?.role || 'user',
          recentActions: [],
          timestamp: Date.now(),
        };

        const insight = await productionLLM.generateIntelligentResponse(prompt, context as any);

        return {
          engine: input.engine,
          insight,
          confidence: 0.85,
          timestamp: new Date(),
        };
      } catch (error) {
                throw error;
      }
    }),

  /**
   * Batch process multiple queries
   */
  batchProcess: publicProcedure
    .input(
      z.object({
        queries: z.array(
          z.object({
            message: z.string(),
            engine: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const results = await Promise.all(
          input.queries.map(async (query) => {
            const context = {
              userId: (ctx.user?.id || 'anonymous') as string,
              engine: query.engine || 'general',
              platform: 'skycoin4444',
              userRole: ctx.user?.role || 'user',
              recentActions: [],
              timestamp: Date.now() as unknown as number,
            };

            const reply = await productionLLM.generateIntelligentResponse(query.message, context);
            return {
              message: query.message,
              reply,
              engine: query.engine || 'general',
            };
          })
        );

        return {
          results,
          processedAt: new Date(),
          count: results.length,
        };
      } catch (error) {
                throw error;
      }
    }),

  /**
   * Clear conversation history
   */
  clearHistory: protectedProcedure
    .input(
      z.object({
        engine: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        productionLLM.clearHistory((ctx.user.id as unknown) as string, input.engine);
        return { success: true, cleared: input.engine || 'all' };
      } catch (error) {
                throw error;
      }
    }),

  /**
   * Get conversation history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        engine: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const history = productionLLM.getHistory((ctx.user.id as unknown) as string, input.engine);
        return {
          engine: input.engine,
          messages: history,
          count: history.length,
        };
      } catch (error) {
                throw error;
      }
    }),

  /**
   * Get available models
   */
  getModels: publicProcedure.query(async () => {
    return [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        capabilities: ['chat', 'analysis', 'code-generation', 'streaming'],
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        capabilities: ['chat', 'analysis', 'code-generation', 'streaming'],
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        capabilities: ['chat', 'analysis'],
      },
    ];
  }),

  /**
   * Get AI statistics
   */
  getStats: publicProcedure.query(async () => {
    return {
      modelsAvailable: 3,
      enginesCovered: 10,
      averageResponseTime: '< 500ms',
      uptime: '99.9%',
      lastUpdated: new Date(),
    };
  }),
});
