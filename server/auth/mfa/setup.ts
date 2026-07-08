import { TRPCError } from "@trpc/server";
import { authenticator } from "@otplib/preset-default";
import qrcode from "qrcode";
import { db } from "@server/db";
import { users } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

export const generateMfaSecret = async (userId: string) => {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(userId, "SKYCOIN4444", secret);
  const qrCodeImage = await qrcode.toDataURL(otpauthUrl);

  // Store the secret in the user's record (hashed or encrypted in a real app)
  await db.update(users).set({ mfaSecret: secret }).where(eq(users.id, userId));

  return { secret, otpauthUrl, qrCodeImage };
};

export const verifyMfaToken = async (userId: string, token: string) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

  if (!user || !user.mfaSecret) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "MFA not set up for this user." });
  }

  const isValid = authenticator.check(token, user.mfaSecret);
  return isValid;
};
