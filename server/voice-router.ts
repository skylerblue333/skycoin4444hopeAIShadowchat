import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { transcribeAudio } from "./_core/voiceTranscription";
import { TRPCError } from "@trpc/server";
// import { db } from "./db"; // Uncomment if you need to save transcriptions to DB
// import { transcriptions } from "../drizzle/schema"; // Uncomment if you need to save transcriptions to DB

export const voiceRouter = router({
  transcribe: protectedProcedure
    .input(z.object({
      audioUrl: z.string(),
      language: z.string().optional(),
      prompt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await transcribeAudio(input);
      if ('error' in result) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error,
          cause: result,
        });
      }
      return result;
    }),
  getStats: protectedProcedure.query(async () => ({
    totalTranscriptions: 0,
    totalDuration: 0,
    averageConfidence: 0.95,
    totalCommands: 0,
  })),
  getAllCommands: publicProcedure.query(async () => []),
  getCategories: publicProcedure.query(async () => []),
  getCommandsByCategory: publicProcedure.input(z.object({ category: z.string() })).query(async () => []),
  executeCommand: protectedProcedure.input(z.object({ 
    command: z.string().optional(), 
    input: z.string().optional(),
    params: z.record(z.any()).optional() 
  }))
    .mutation(async () => ({ success: true })),
});
