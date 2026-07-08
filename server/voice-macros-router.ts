/**
 * VOICE MACROS ROUTER - tRPC ENDPOINTS
 * Complete macro management system
 */

import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { z } from 'zod';
import { voiceMacroSystem } from './voice-macros';

export const voiceMacrosRouter = router({
  /**
   * Create new macro
   */
  createMacro: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500),
        commands: z.array(z.string()).min(1).max(20),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const macro = voiceMacroSystem.createUserMacro(
        input.name,
        input.description,
        input.commands,
        String(ctx.user!.id)
      );

      return {
        success: true,
        macro: {
          id: macro.id,
          name: macro.name,
          description: macro.description,
          commandCount: macro.commands.length,
        },
      };
    }),

  /**
   * Execute macro
   */
  executeMacro: protectedProcedure
    .input(z.object({ macroId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await voiceMacroSystem.executeMacro(input.macroId, String(ctx.user!.id));
      return result;
    }),

  /**
   * Get user's macros
   */
  getUserMacros: protectedProcedure.query(async ({ ctx }) => {
    const macros = voiceMacroSystem.getUserMacros(String(ctx.user!.id));
    return {
      count: macros.length,
      macros: macros.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        commandCount: m.commands.length,
        executions: m.executions,
        isPublic: m.isPublic,
      })),
    };
  }),

  /**
   * Get public macros
   */
  getPublicMacros: publicProcedure.query(async () => {
    const macros = voiceMacroSystem.getPublicMacros();
    return {
      count: macros.length,
      macros: macros.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        commandCount: m.commands.length,
        executions: m.executions,
        createdBy: m.createdBy,
      })),
    };
  }),

  /**
   * Delete macro
   */
  deleteMacro: protectedProcedure
    .input(z.object({ macroId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const success = voiceMacroSystem.deleteMacro(input.macroId, String(ctx.user!.id));
      return { success };
    }),

  /**
   * Update macro
   */
  updateMacro: protectedProcedure
    .input(
      z.object({
        macroId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        commands: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { macroId, ...updates } = input;
      const success = voiceMacroSystem.updateMacro(macroId, updates, String(ctx.user!.id));
      return { success };
    }),

  /**
   * Get macro stats
   */
  getStats: publicProcedure.query(async () => {
    return voiceMacroSystem.getMacroStats();
  }),
});
