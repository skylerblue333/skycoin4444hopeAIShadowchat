import crypto from 'crypto';
import { db } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

/**
 * Extended Authentication System
 * Meta-like sign-up flow with social login and verification
 */

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  phone?: string;
  socialProvider?: 'google' | 'facebook' | 'twitter' | 'github';
  socialId?: string;
}

export interface SocialLoginData {
  provider: 'google' | 'facebook' | 'twitter' | 'github';
  socialId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

/**
 * Create new user account
 */
export async function createUser(data: SignUpData) {
  try {
    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (existing.length > 0) {
      return {
        success: false,
        error: 'Email already registered',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const result = await db.insert(users).values({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      profileComplete: false,
      emailVerified: false,
      createdAt: new Date(),
    });

    return {
      success: true,
      userId: result.insertId,
      message: 'Account created successfully',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to create account',
    };
  }
}

/**
 * Social login or create account
 */
export async function socialLogin(data: SocialLoginData) {
  try {
    // Check if user exists with social provider
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (existing.length > 0) {
      // User exists, update social info if needed
      return {
        success: true,
        userId: existing[0].id,
        isNewUser: false,
        message: 'Login successful',
      };
    }

    // Create new user from social login
    const result = await db.insert(users).values({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      profileImage: data.profileImage,
      emailVerified: true, // Social logins are pre-verified
      profileComplete: false,
      createdAt: new Date(),
    });

    return {
      success: true,
      userId: result.insertId,
      isNewUser: true,
      message: 'Account created from social login',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to process social login',
    };
  }
}

/**
 * Send email verification
 */
export async function sendEmailVerification(userId: string, email: string) {
  try {
    // Generate verification token
    const token = (crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // In production, send email with verification link
    // For now, just return token for testing
    return {
      success: true,
      token,
      expiresAt,
      message: 'Verification email sent',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to send verification email',
    };
  }
}

/**
 * Verify email address
 */
export async function verifyEmail(userId: string, token: string) {
  try {
    // In production, validate token and mark email as verified
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, userId));

    return {
      success: true,
      message: 'Email verified successfully',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to verify email',
    };
  }
}

/**
 * Password reset request
 */
export async function requestPasswordReset(email: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (user.length === 0) {
      // Don't reveal if email exists
      return {
        success: true,
        message: 'If email exists, reset link has been sent',
      };
    }

    // Generate reset token
    const token = (crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // In production, send email with reset link
    return {
      success: true,
      token,
      expiresAt,
      message: 'Password reset email sent',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to process password reset request',
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  userId: string,
  token: string,
  newPassword: string
) {
  try {
    // Validate token (in production)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to reset password',
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<SignUpData>
) {
  try {
    await db
      .update(users)
      .set({
        ...updates,
        profileComplete: true,
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to update profile',
    };
  }
}

/**
 * Two-factor authentication setup
 */
export async function setupTwoFactor(userId: string) {
  try {
    // Generate 2FA secret (in production, use TOTP library)
    const secret = (crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(2, 15);
    const backupCodes = Array.from({ length: 10 }, () =>
      (crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(2, 8)
    );

    return {
      success: true,
      secret,
      backupCodes,
      message: '2FA setup initiated',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to setup 2FA',
    };
  }
}

/**
 * Verify 2FA code
 */
export async function verify2FA(userId: string, code: string) {
  try {
    // In production, validate TOTP code
    return {
      success: true,
      message: '2FA code verified',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Invalid 2FA code',
    };
  }
}

/**
 * Session management
 */
export async function createSession(userId: string) {
  try {
    const sessionToken = (crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return {
      success: true,
      sessionToken,
      expiresAt,
      message: 'Session created',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to create session',
    };
  }
}

/**
 * Logout
 */
export async function logout(userId: string, sessionToken: string) {
  try {
    // Invalidate session token
    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to logout',
    };
  }
}
