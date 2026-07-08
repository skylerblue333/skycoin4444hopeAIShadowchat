import { protectedProcedure, router } from "../_core/trpc";
import { generateMfaSecret, verifyMfaToken } from "../auth/mfa/setup";
import { z } from "zod";
import { db } from "../db";
import { users, mfaRecoveryCodes } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

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

  generateRecoveryCodes: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const codes = Array.from({ length: 10 }, () => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      return code;
    });

    for (const code of codes) {
      const hashedCode = await bcrypt.hash(code, 10);
      await db.insert(mfaRecoveryCodes).values({
        id: uuidv4(),
        userId,
        code: hashedCode,
      });
    }

    return { codes };
  }),

  useRecoveryCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      // Get all unused recovery codes for this user
      const recoveryCodes = await db.query.mfaRecoveryCodes.findMany({
        where: (codes) => and(eq(codes.userId, userId), eq(codes.used, false)),
      });

      if (recoveryCodes.length === 0) {
        throw new Error("No valid recovery codes available");
      }

      // Check each code until we find a match
      let matchedCode = null;
      for (const recoveryCode of recoveryCodes) {
        const isValid = await bcrypt.compare(input.code, recoveryCode.code);
        if (isValid) {
          matchedCode = recoveryCode;
          break;
        }
      }

      if (!matchedCode) {
        throw new Error("Invalid recovery code");
      }

      // Mark the matched code as used
      await db.update(mfaRecoveryCodes)
        .set({ used: true, usedAt: new Date() })
        .where(eq(mfaRecoveryCodes.id, matchedCode.id));

      return { success: true };
    }),
});
