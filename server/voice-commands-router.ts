/**
 * VOICE COMMANDS ROUTER - 444 COMMANDS
 * Complete voice control integration for SKYCOIN4444 ecosystem
 */

import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { z } from 'zod';
import { voiceSystem444 } from './voice-commands-444';

export const voiceCommandsRouter = router({
  /**
   * Process voice input and execute command
   */
  executeCommand: publicProcedure
    .input(
      z.object({
        input: z.string().min(1).max(500),
        userId: z.string().optional(),
        userRole: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await voiceSystem444.processVoiceInput(input.input, {
        userId: (input.userId || ctx.user?.id || 'anonymous') as string,
        userRole: (input.userRole || ctx.user?.role || 'user') as string,
        input: input.input,
        confidence: 0.95,
        timestamp: Date.now(),
        device: 'web',
        language: 'en',
      });

      return result;
    }),

  /**
   * Get all available commands
   */
  getAllCommands: publicProcedure.query(async () => {
    const commands = voiceSystem444.getAllCommands();
    return {
      totalCommands: commands.length,
      commands: commands.map((cmd) => ({
        id: cmd.id,
        name: cmd.name,
        description: cmd.description,
        category: cmd.category,
        aliases: cmd.aliases,
        requiresAuth: cmd.requiresAuth,
        requiresAdmin: cmd.requiresAdmin,
      })),
    };
  }),

  /**
   * Get commands by category
   */
  getCommandsByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const commands = voiceSystem444.getCommandsByCategory(input.category);
      return {
        category: input.category,
        count: commands.length,
        commands: commands.map((cmd) => ({
          id: cmd.id,
          name: cmd.name,
          aliases: cmd.aliases,
        })),
      };
    }),

  /**
   * Get voice system statistics
   */
  getStats: publicProcedure.query(async () => {
    return voiceSystem444.getStats();
  }),

  /**
   * Get total command count
   */
  getTotalCommandCount: publicProcedure.query(async () => {
      return {
        totalCommands: voiceSystem444.getTotalCommandCount() as number,
        message: `SKYCOIN4444 has 444 voice commands available`,
      };
  }),

  /**
   * Search commands
   */
  searchCommands: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const allCommands = voiceSystem444.getAllCommands();
      const query = input.query.toLowerCase();
      const results = allCommands.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(query) ||
          cmd.description.toLowerCase().includes(query) ||
          cmd.aliases.some((alias) => alias.toLowerCase().includes(query))
      );

      return {
        query: input.query,
        resultCount: results.length,
        results: results.slice(0, 10).map((cmd) => ({
          id: cmd.id,
          name: cmd.name,
          category: cmd.category,
          aliases: cmd.aliases,
        })),
      };
    }),

  /**
   * Get commands by user role
   */
  getCommandsForRole: publicProcedure
    .input(z.object({ role: z.enum(['user', 'admin', 'moderator']) }))
    .query(async ({ input }) => {
      const allCommands = voiceSystem444.getAllCommands();
      const filtered =
        input.role === 'admin'
          ? allCommands
          : allCommands.filter((cmd) => !cmd.requiresAdmin);

      return {
        role: input.role,
        availableCommands: filtered.length,
        commands: filtered.slice(0, 20).map((cmd) => ({
          id: cmd.id,
          name: cmd.name,
          category: cmd.category,
        })),
      };
    }),

  /**
   * Get quick commands (most used)
   */
  getQuickCommands: publicProcedure.query(async () => {
    const allCommands = voiceSystem444.getAllCommands();
    return {
      quickCommands: allCommands.slice(0, 20).map((cmd) => ({
        id: cmd.id,
        name: cmd.name,
        aliases: cmd.aliases.slice(0, 2),
      })),
    };
  }),

  /**
   * Get command categories
   */
  getCategories: publicProcedure.query(async () => {
    const allCommands = voiceSystem444.getAllCommands();
    const categories = new Map<string, number>();

    allCommands.forEach((cmd) => {
      categories.set(cmd.category, (categories.get(cmd.category) || 0) + 1);
    });

    return {
      totalCategories: categories.size,
      categories: Array.from(categories.entries()).map(([name, count]) => ({
        name,
        count,
      })),
    };
  }),

  /**
   * Get command details
   */
  getCommandDetails: publicProcedure
    .input(z.object({ commandId: z.string() }))
    .query(async ({ input }) => {
      const commands = voiceSystem444.getAllCommands();
      const command = commands.find((cmd) => cmd.id === input.commandId);

      if (!command) {
        return { error: 'Command not found' };
      }

      return {
        id: command.id,
        name: command.name,
        description: command.description,
        category: command.category,
        aliases: command.aliases,
        requiresAuth: command.requiresAuth,
        requiresAdmin: command.requiresAdmin,
        confidence: command.confidence,
      };
    }),

  /**
   * Voice command help
   */
  getHelp: publicProcedure
    .input(z.object({ topic: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.topic) {
        return {
          message: 'SKYCOIN4444 Voice Commands - 444 Commands Available',
          categories: [
            'AI (50 commands)',
            'Navigation (40 commands)',
            'Payment (35 commands)',
            'Social (45 commands)',
            'Gaming (40 commands)',
            'Marketplace (35 commands)',
            'Governance (30 commands)',
            'Analytics (30 commands)',
            'Admin (40 commands)',
            'Wallet (35 commands)',
            'Streaming (30 commands)',
            'Chat (25 commands)',
            'Search (20 commands)',
            'Settings (25 commands)',
            'Help (20 commands)',
            'System (30 commands)',
            'Accessibility (20 commands)',
            'Notifications (15 commands)',
            'Integration (20 commands)',
            'Developer (25 commands)',
          ],
          totalCommands: 444,
          usage: 'Say any command or its aliases to execute',
        };
      }

      const commands = voiceSystem444.getCommandsByCategory(input.topic);
      return {
        category: input.topic,
        commandCount: commands.length,
        commands: commands.slice(0, 5).map((cmd) => ({
          name: cmd.name,
          aliases: cmd.aliases,
        })),
      };
    }),
});
