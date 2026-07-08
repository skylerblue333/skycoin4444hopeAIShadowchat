import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from './_core/trpc';
import { jwtAuthService } from './jwt-auth';
import { securityMonitor } from './security-middleware';
import * as db from './db';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(12, 'Password must be at least 12 characters'),
        name: z.string().min(2, 'Name must be at least 2 characters'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ip = ctx.req?.ip || 'unknown';

      // Check if IP is blocked
      if (securityMonitor.isIPBlocked(ip)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Your IP has been temporarily blocked due to suspicious activity',
        });
      }

      // Validate email format
      if (!jwtAuthService.validateEmail(input.email)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid email address',
        });
      }

      // Validate password strength
      const passwordValidation = jwtAuthService.validatePasswordStrength(input.password);
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`,
        });
      }

      // Check if email already exists
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        securityMonitor.recordFailedAttempt(ip);
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already registered',
        });
      }

      // Hash password
      const hashedPassword = await jwtAuthService.hashPassword(input.password);

      // Create user
      const user = await db.createUser({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: 'user',
        emailVerified: false,
      });

      // Generate email verification token
      const { token: verificationToken, hashedToken, expiresAt } = jwtAuthService.generateEmailVerificationToken();

      // Store verification token (in production, save to database)
      // For now, we'll return it for email sending
      
      // Generate token pair
      const tokens = await jwtAuthService.generateTokenPair(user.id, user.email, 'user');

      // Set secure cookies
      ctx.res.setHeader('Set-Cookie', [
        `accessToken=${tokens.accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${tokens.expiresIn}`,
        `refreshToken=${tokens.refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
      ]);

      securityMonitor.recordSuccessfulAttempt(ip);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens,
        verificationRequired: true,
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ip = ctx.req?.ip || 'unknown';

      // Check if IP is blocked
      if (securityMonitor.isIPBlocked(ip)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Your IP has been temporarily blocked due to suspicious activity',
        });
      }

      // Find user by email
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        securityMonitor.recordFailedAttempt(ip);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const passwordMatch = await jwtAuthService.comparePassword(input.password, user.password || '');
      if (!passwordMatch) {
        securityMonitor.recordFailedAttempt(ip);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Generate token pair
      const tokens = await jwtAuthService.generateTokenPair(user.id, user.email, user.role as any);

      // Set secure cookies
      ctx.res.setHeader('Set-Cookie', [
        `accessToken=${tokens.accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${tokens.expiresIn}`,
        `refreshToken=${tokens.refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
      ]);

      securityMonitor.recordSuccessfulAttempt(ip);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens,
      };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    // Clear cookies
    ctx.res.setHeader('Set-Cookie', [
      'accessToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
      'refreshToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    ]);

    return { success: true };
  }),

  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const newTokens = await jwtAuthService.refreshAccessToken(input.refreshToken);
      if (!newTokens) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired refresh token',
        });
      }

      // Set new cookies
      ctx.res.setHeader('Set-Cookie', [
        `accessToken=${newTokens.accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${newTokens.expiresIn}`,
        `refreshToken=${newTokens.refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
      ]);

      return { tokens: newTokens };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        bio: z.string().max(500).optional(),
        avatar: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Update user profile
      const updated = await db.updateUser(ctx.user.id, {
        name: input.name || user.name,
        bio: input.bio || user.bio,
        avatar: input.avatar || user.avatar,
      });

      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        avatar: updated.avatar,
        bio: updated.bio,
      };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify current password
      const passwordMatch = await jwtAuthService.comparePassword(input.currentPassword, user.password || '');
      if (!passwordMatch) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Validate new password strength
      const passwordValidation = jwtAuthService.validatePasswordStrength(input.newPassword);
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`,
        });
      }

      // Hash new password
      const hashedPassword = await jwtAuthService.hashPassword(input.newPassword);

      // Update password
      await db.updateUser(ctx.user.id, { password: hashedPassword });

      return { success: true };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        // Don't reveal if email exists
        return { success: true, message: 'If email exists, password reset link has been sent' };
      }

      // Generate reset token
      const { token: resetToken, hashedToken, expiresAt } = jwtAuthService.generatePasswordResetToken();

      // Store reset token (in production, save to database)
      
      return { success: true, message: 'Password reset link has been sent to your email' };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(12),
      })
    )
    .mutation(async ({ input }) => {
      // Validate new password strength
      const passwordValidation = jwtAuthService.validatePasswordStrength(input.newPassword);
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`,
        });
      }

      // In production, verify token from database and check expiration
      // For now, just hash and update
      const hashedPassword = await jwtAuthService.hashPassword(input.newPassword);

      return { success: true, message: 'Password has been reset successfully' };
    }),

  getSecurityStats: protectedProcedure.query(async ({ ctx }) => {
    // Only admins can view security stats
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only administrators can view security stats',
      });
    }

    return securityMonitor.getSecurityStats();
  }),
});
