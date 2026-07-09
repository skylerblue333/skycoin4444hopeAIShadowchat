import crypto from "crypto";
import jwt from "jsonwebtoken";

/**
 * Session Management Utilities
 * Handles token rotation, session validation, and refresh token logic
 */

export interface SessionToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface DecodedToken {
  userId: string;
  sessionId: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
const SESSION_ROTATION_INTERVAL = 60 * 60; // 1 hour

/**
 * Generate a new session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create access token (short-lived)
 */
export function createAccessToken(userId: string, sessionId: string): string {
  return jwt.sign(
    {
      userId,
      sessionId,
      type: "access",
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: "HS256",
    }
  );
}

/**
 * Create refresh token (long-lived)
 */
export function createRefreshToken(userId: string, sessionId: string): string {
  return jwt.sign(
    {
      userId,
      sessionId,
      type: "refresh",
    },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: "HS256",
    }
  );
}

/**
 * Create both tokens for a new session
 */
export function createSessionTokens(userId: string, sessionId?: string): SessionToken {
  const newSessionId = sessionId || generateSessionId();

  return {
    accessToken: createAccessToken(userId, newSessionId),
    refreshToken: createRefreshToken(userId, newSessionId),
    expiresIn: ACCESS_TOKEN_EXPIRY,
    tokenType: "Bearer",
  };
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as any;

    if (decoded.type !== "access") {
      return null;
    }

    return {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as any;

    if (decoded.type !== "refresh") {
      return null;
    }

    return {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: DecodedToken): boolean {
  return Math.floor(Date.now() / 1000) > token.exp;
}

/**
 * Check if token should be rotated
 */
export function shouldRotateToken(token: DecodedToken): boolean {
  const now = Math.floor(Date.now() / 1000);
  const tokenAge = now - token.iat;
  return tokenAge > SESSION_ROTATION_INTERVAL;
}

/**
 * Rotate session tokens
 */
export function rotateSessionTokens(
  refreshToken: string,
  currentSessionId: string
): SessionToken | null {
  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded || decoded.sessionId !== currentSessionId) {
    return null;
  }

  // Generate new session ID for token rotation
  const newSessionId = generateSessionId();

  return createSessionTokens(decoded.userId, newSessionId);
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Validate session token format
 */
export function isValidTokenFormat(token: string): boolean {
  // JWT format: header.payload.signature
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  valid: boolean;
  userId?: string;
  sessionId?: string;
  shouldRotate?: boolean;
  error?: string;
}

/**
 * Comprehensive session validation
 */
export function validateSession(token: string): SessionValidationResult {
  // Check format
  if (!isValidTokenFormat(token)) {
    return {
      valid: false,
      error: "Invalid token format",
    };
  }

  // Verify token
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return {
      valid: false,
      error: "Invalid or expired token",
    };
  }

  // Check expiration
  if (isTokenExpired(decoded)) {
    return {
      valid: false,
      error: "Token expired",
    };
  }

  // Check if rotation needed
  const shouldRotate = shouldRotateToken(decoded);

  return {
    valid: true,
    userId: decoded.userId,
    sessionId: decoded.sessionId,
    shouldRotate,
  };
}

/**
 * Session timeout configuration
 */
export const SESSION_CONFIG = {
  accessTokenExpiry: ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiry: REFRESH_TOKEN_EXPIRY,
  rotationInterval: SESSION_ROTATION_INTERVAL,
  maxConcurrentSessions: 5, // Max active sessions per user
  inactivityTimeout: 30 * 60, // 30 minutes
};

export default {
  generateSessionId,
  createAccessToken,
  createRefreshToken,
  createSessionTokens,
  verifyAccessToken,
  verifyRefreshToken,
  isTokenExpired,
  shouldRotateToken,
  rotateSessionTokens,
  extractTokenFromHeader,
  isValidTokenFormat,
  validateSession,
  SESSION_CONFIG,
};
