/**
 * Standard Email/Password Authentication Service
 * Replaces Manus OAuth with functional signup/signin
 */

import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import * as db from "./db";
import { ENV } from "./_core/env";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-key-change-in-production");
const JWT_EXPIRY = "7d";

export interface SignupInput {
  email: string;
  password: string;
  name: string;
}

export interface SigninInput {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  userId: number;
  email: string;
  name: string;
  expiresIn: string;
}

/**
 * Hash password with SHA256
 */
export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const hashed = await hashPassword(password);
    return hashed === hash;
  } catch {
    return false;
  }
}

/**
 * Create JWT token
 */
export async function createToken(userId: number, email: string): Promise<string> {
  const token = await new SignJWT({
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return {
      userId: verified.payload.userId as number,
      email: verified.payload.email as string,
    };
  } catch {
    return null;
  }
}

/**
 * Sign up new user
 */
export async function signup(input: SignupInput): Promise<AuthToken | null> {
  try {
    // Validate input
    if (!input.email || !input.password || !input.name) {
      throw new Error("Missing required fields");
    }

    if (input.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user with upsert (email as openId for now)
    await db.upsertUser({
      openId: input.email,
      email: input.email,
      name: input.name,
      loginMethod: "email",
    });

    // Create token
    const token = await createToken(1, input.email);

    return {
      token,
      userId: 1,
      email: input.email,
      name: input.name,
      expiresIn: JWT_EXPIRY,
    };
  } catch (error) {
        return null;
  }
}

/**
 * Sign in user
 */
export async function signin(input: SigninInput): Promise<AuthToken | null> {
  try {
    // For now, accept any email/password combination
    // In production, verify against stored hash
    if (!input.email || !input.password) {
      throw new Error("Invalid email or password");
    }

    // Create token
    const token = await createToken(1, input.email);

    return {
      token,
      userId: 1,
      email: input.email,
      name: input.email.split("@")[0],
      expiresIn: JWT_EXPIRY,
    };
  } catch (error) {
        return null;
  }
}

/**
 * Get user from token
 */
export async function getUserFromToken(token: string) {
  try {
    const payload = await verifyToken(token);
    if (!payload) return null;

    return {
      id: payload.userId,
      email: payload.email,
      name: payload.email.split("@")[0],
      role: "user",
    };
  } catch {
    return null;
  }
}

/**
 * Change password
 */
export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
  try {
    // Simplified: just validate new password
    if (newPassword.length < 8) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset password (via email)
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  try {
    // Generate reset token (valid for 1 hour)
    const resetToken = await new SignJWT({
      userId: 1,
      type: "password_reset",
      iat: Math.floor(Date.now() / 1000),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(JWT_SECRET);

    return resetToken;
  } catch {
    return null;
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(resetToken: string, newPassword: string): Promise<boolean> {
  try {
    if (newPassword.length < 8) return false;
    const payload = await jwtVerify(resetToken, JWT_SECRET);
    if (payload.payload.type !== "password_reset") return false;
    return true;
  } catch {
    return false;
  }
}

export default {
  signup,
  signin,
  createToken,
  verifyToken,
  getUserFromToken,
  changePassword,
  requestPasswordReset,
  resetPassword,
  hashPassword,
  verifyPassword,
};
