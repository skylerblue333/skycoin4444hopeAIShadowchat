import { router } from '../_core/trpc';
import { publicProcedure } from '../_core/trpc';
import { cryptoAIModule } from '../crypto-ai-module';
import { z } from 'zod';

export const cryptoAIRouter = router({
  trading: router({
    analyze: publicProcedure
      .input(z.object({
        symbol: z.string(),
        priceHistory: z.array(z.number()),
        marketData: z.record(z.any())
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'trading',
          data: input
        });
      }),

    optimizePortfolio: publicProcedure
      .input(z.object({
        assets: z.array(z.string()),
        balances: z.record(z.number())
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'trading',
          data: { ...input, action: 'optimize' }
        });
      }),

    predictMovement: publicProcedure
      .input(z.object({
        symbol: z.string(),
        timeframe: z.string()
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'trading',
          data: { ...input, action: 'predict' }
        });
      })
  }),

  mining: router({
    selectPool: publicProcedure
      .input(z.object({
        pools: z.array(z.object({
          name: z.string(),
          hashrate: z.number(),
          difficulty: z.number(),
          reward: z.number()
        })),
        minerHashrate: z.number()
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'mining',
          data: input
        });
      }),

    predictDifficulty: publicProcedure
      .input(z.object({
        historicalDifficulty: z.array(z.number())
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'mining',
          data: { ...input, action: 'predict' }
        });
      }),

    optimizeHardware: publicProcedure
      .input(z.object({
        gpus: z.array(z.string()),
        cpus: z.array(z.string())
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'mining',
          data: { ...input, action: 'optimize' }
        });
      })
  }),

  defi: router({
    assessRisk: publicProcedure
      .input(z.object({
        protocol: z.object({
          name: z.string(),
          tvl: z.number(),
          apy: z.number(),
          riskScore: z.number()
        })
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'defi',
          data: input
        });
      }),

    optimizeYield: publicProcedure
      .input(z.object({
        protocols: z.array(z.object({
          name: z.string(),
          tvl: z.number(),
          apy: z.number(),
          riskScore: z.number()
        })),
        capital: z.number()
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'defi',
          data: { ...input, action: 'optimize' }
        });
      }),

    detectAnomalies: publicProcedure
      .input(z.object({
        protocolMetrics: z.record(z.any())
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'defi',
          data: { ...input, action: 'anomalies' }
        });
      })
  }),

  audit: router({
    smartContract: publicProcedure
      .input(z.object({
        contractCode: z.string(),
        contractName: z.string()
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'audit',
          data: input
        });
      }),

    detectVulnerabilities: publicProcedure
      .input(z.object({
        contractCode: z.string()
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'audit',
          data: { ...input, action: 'vulnerabilities' }
        });
      }),

    optimizeGas: publicProcedure
      .input(z.object({
        contractCode: z.string()
      }))
      .query(async ({ input }) => {
        return await cryptoAIModule.process({
          type: 'audit',
          data: { ...input, action: 'gas' }
        });
      })
  }),

  comprehensive: publicProcedure
    .input(z.object({
      symbol: z.string(),
      priceHistory: z.array(z.number()),
      marketData: z.record(z.any()),
      pools: z.array(z.any()),
      minerHashrate: z.number(),
      protocol: z.any(),
      contractCode: z.string()
    }))
    .query(async ({ input }) => {
      return await cryptoAIModule.process({
        type: 'comprehensive',
        data: input
      });
    })
});
