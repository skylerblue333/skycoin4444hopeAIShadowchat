import { ForbiddenError } from "@shared/_core/errors";
import * as cookieModule from "cookie";
const parseCookieHeader = (cookieModule as any).parse;
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
};

const JWT_SECRET = new TextEncoder().encode(ENV.jwtSecret || "your-secret-key");
const COOKIE_NAME = "session";

class AuthService {
  /**
   * Create a JWT session token
   */
  async createSessionToken(userOrId: User | string, options?: { name?: string, email?: string, expiresInMs?: number }): Promise<string> {
    let payload: SessionPayload;
    
    if (typeof userOrId === 'string') {
      payload = {
        userId: userOrId,
        email: options?.email || "",
        name: options?.name || "User",
      };
    } else {
      payload = {
        userId: userOrId.id,
        email: userOrId.email || "",
        name: userOrId.name || "User",
      };
    }

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(options?.expiresInMs ? `${Math.floor(options.expiresInMs / 1000)}s` : "7d")
      .sign(JWT_SECRET);

    return token;
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string): Promise<SessionPayload> {
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      return verified.payload as SessionPayload;
    } catch (error) {
      throw ForbiddenError("Invalid or expired token");
    }
  }

  /**
   * Extract and verify session from request cookies
   */
  async authenticateRequest(req: Request): Promise<User | null> {
    const cookieHeader = req.headers.cookie;
    if (!isNonEmptyString(cookieHeader)) {
      return null;
    }

    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies[COOKIE_NAME];

    if (!isNonEmptyString(token)) {
      return null;
    }

    try {
      const payload = await this.verifyToken(token);
      const user = await db.getUserById(payload.userId);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  async exchangeCodeForToken(code: string, state: string) {
    return { accessToken: "mock-token" };
  }

  async getUserInfo(accessToken: string) {
    return {
      openId: "mock-id",
      name: "Mock User",
      email: "mock@example.com",
      loginMethod: "mock",
      platform: "mock",
    };
  }
}

export const sdk = new AuthService();
