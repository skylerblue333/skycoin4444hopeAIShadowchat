import jwt from 'jose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { users } from '../drizzle/schema';
import * as db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';
const REFRESH_TOKEN_EXPIRATION = '7d';

interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  iat?: number;
  exp?: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JWTAuthService {
  private secret: Uint8Array;

  constructor() {
    this.secret = new TextEncoder().encode(JWT_SECRET);
  }

  async generateTokenPair(userId: string, email: string, role: 'admin' | 'user' | 'moderator' = 'user'): Promise<TokenPair> {
    const payload: JWTPayload = {
      userId,
      email,
      role,
    };

    const accessToken = await new jwt.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION)
      .sign(this.secret);

    const refreshToken = await new jwt.SignJWT({ userId, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRATION)
      .sign(this.secret);

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const verified = await jwt.jwtVerify(token, this.secret);
      return verified.payload as JWTPayload;
    } catch (error) {
            return null;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
    try {
      const verified = await jwt.jwtVerify(refreshToken, this.secret);
      const payload = verified.payload as any;

      if (payload.type !== 'refresh') {
        return null;
      }

      const user = await db.getUserById(payload.userId);
      if (!user) return null;

      return this.generateTokenPair(user.id, user.email, user.role as any);
    } catch (error) {
            return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  generatePasswordResetToken(): { token: string; hashedToken: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    return { token, hashedToken, expiresAt };
  }

  generateEmailVerificationToken(): { token: string; hashedToken: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return { token, hashedToken, expiresAt };
  }

  generate2FASecret(): { secret: string; qrCode: string } {
    const secret = crypto.randomBytes(32).toString('base64');
    // In production, use speakeasy or similar library to generate proper TOTP secrets
    const qrCode = `otpauth://totp/SKYCOIN4444?secret=${secret}`;

    return { secret, qrCode };
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const jwtAuthService = new JWTAuthService();
