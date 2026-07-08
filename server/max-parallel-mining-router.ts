import { router, publicProcedure, protectedProcedure } from './_core/trpc';
import { maxParallelMiningEngine } from './max-parallel-mining';
import { z } from 'zod';

/**
 * Max Parallel Mining Router
 * tRPC procedures for managing parallel mining across collaborators
 */

export const maxParallelMiningRouter = router({
  /**
   * Start max parallel mining
   */
  startMining: protectedProcedure.mutation(async ({ ctx }) => {
    
    try {
      await maxParallelMiningEngine.startMining();

      return {
        success: true,
        message: 'Max parallel mining started',
        stats: maxParallelMiningEngine.getStats(),
      };
    } catch (error) {
      throw new Error(`Failed to start mining: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }),

  /**
   * Stop mining
   */
  stopMining: protectedProcedure.mutation(async ({ ctx }) => {
    
    maxParallelMiningEngine.stopMining();

    return {
      success: true,
      message: 'Mining stopped',
      stats: maxParallelMiningEngine.getStats(),
    };
  }),

  /**
   * Get mining stats
   */
  getStats: publicProcedure.query(async () => {
    const stats = maxParallelMiningEngine.getStats();

    return {
      workers: stats.workers,
      hashrate: stats.hashrate.toLocaleString(),
      collaborators: stats.collaborators,
      totalEarnings: `$${stats.totalEarnings.toFixed(2)}`,
      isRunning: stats.isRunning,
      status: stats.isRunning ? 'MINING' : 'IDLE',
    };
  }),

  /**
   * Get collaborators
   */
  getCollaborators: publicProcedure.query(async () => {
    const collaborators = maxParallelMiningEngine.getCollaborators();

    return collaborators.map((c) => ({
      id: c.id,
      name: c.name,
      wallet: c.wallet,
      share: `${c.share}%`,
    }));
  }),

  /**
   * Add collaborator
   */
  addCollaborator: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        wallet: z.string(),
        share: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      
      maxParallelMiningEngine.addCollaborator({
        id: input.id,
        name: input.name,
        wallet: input.wallet,
        share: input.share,
      });

      return {
        success: true,
        message: `Added collaborator: ${input.name}`,
        collaborators: maxParallelMiningEngine.getCollaborators(),
      };
    }),

  /**
   * Get mining status
   */
  getStatus: publicProcedure.query(async () => {
    const stats = maxParallelMiningEngine.getStats();
    const collaborators = maxParallelMiningEngine.getCollaborators();

    return {
      status: stats.isRunning ? 'ACTIVE' : 'IDLE',
      workers: {
        active: stats.workers,
        totalHashrate: stats.hashrate.toLocaleString(),
      },
      earnings: {
        total: `$${stats.totalEarnings.toFixed(2)}`,
        collaborators: collaborators.length,
      },
      collaborators: collaborators.map((c) => ({
        name: c.name,
        share: `${c.share}%`,
        wallet: c.wallet.substring(0, 10) + '...',
      })),
    };
  }),
});

export default maxParallelMiningRouter;
