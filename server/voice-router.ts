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
      
      // Check if it's an error
      if ('error' in result) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error,
          cause: result,
        });
      }
      
      // Optionally save transcription to database
      // await db.insert(transcriptions).values({
      //   userId: ctx.user.id,
      //   text: result.text,
      //   duration: result.duration,
      //   language: result.language,
      //   audioUrl: input.audioUrl,
      //   createdAt: new Date(),
      // });
      
      return result;
    }),
});
