import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from './_core/trpc';

export const authRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => ({
    user: ctx.user,
  })),
  logout: protectedProcedure.mutation(async ({ ctx }) => ({
    success: true,
  })),
  login: publicProcedure.input(z.object({ email: z.string(), password: z.string() })).mutation(async ({ input }) => ({
    success: true,
  })),
});
