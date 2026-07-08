import { protectedProcedure, router } from "../_core/trpc";
import { generateMfaSecret, verifyMfaToken } from "../auth/mfa/setup";
import { z } from "zod";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const mfaRouter = router({
  generateMfaSecret: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const { secret, otpauthUrl, qrCodeImage } = await generateMfaSecret(userId);
    return { secret, otpauthUrl, qrCodeImage };
  }),

  verifyMfa: protectedProcedure
    .input(z.object({ token: z.string(), secret: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const isValid = await verifyMfaToken(userId, input.token);

      if (isValid) {
        await db.update(users).set({ mfaEnabled: true }).where(eq(users.id, userId));
      }
      return { success: isValid };
    }),

  disableMfa: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    await db.update(users).set({ mfaSecret: null, mfaEnabled: false }).where(eq(users.id, userId));
    return { success: true };
  }),
});
