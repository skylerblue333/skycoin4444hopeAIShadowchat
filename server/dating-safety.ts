import { db } from './db';
import { datingBlocks, datingReports, datingProfiles } from '../drizzle/schema';
import { eq, and, or } from 'drizzle-orm';

export type ReportReason = 
  | 'inappropriate_photos'
  | 'fake_profile'
  | 'harassment'
  | 'spam'
  | 'underage'
  | 'other';

export interface BlockUser {
  userId: string;
  blockedUserId: string;
}

export interface ReportUser {
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
}

/**
 * Block a user - prevents them from seeing your profile and messaging
 */
export async function blockUser(data: BlockUser) {
  try {
    // Check if already blocked
    const existing = await db
      .select()
      .from(datingBlocks)
      .where(
        and(
          eq(datingBlocks.userId, data.userId),
          eq(datingBlocks.blockedUserId, data.blockedUserId)
        )
      );

    if (existing.length > 0) {
      throw new Error('User already blocked');
    }

    await db
      .insert(datingBlocks)
      .values({
        id: crypto.randomUUID(),
        ...data
      });

    return { success: true };
  } catch (error) {
        throw error;
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string, blockedUserId: string) {
  try {
    const result = await db
      .delete(datingBlocks)
      .where(
        and(
          eq(datingBlocks.userId, userId),
          eq(datingBlocks.blockedUserId, blockedUserId)
        )
      );

        return result;
  } catch (error) {
        throw error;
  }
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(userId: string, targetUserId: string): Promise<boolean> {
  try {
    const blocked = await db
      .select()
      .from(datingBlocks)
      .where(
        and(
          eq(datingBlocks.userId, userId),
          eq(datingBlocks.blockedUserId, targetUserId)
        )
      );

    return blocked.length > 0;
  } catch (error) {
        return false;
  }
}

/**
 * Get list of blocked users
 */
export async function getBlockedUsers(userId: string) {
  try {
    const blocks = await db
      .select()
      .from(datingBlocks)
      .where(eq(datingBlocks.userId, userId));

    return blocks;
  } catch (error) {
        throw error;
  }
}

/**
 * Report a user for inappropriate behavior
 */
export async function reportUser(data: ReportUser) {
  try {
    // Check if already reported by this user
    const existing = await db
      .select()
      .from(datingReports)
      .where(
        and(
          eq(datingReports.reporterId, data.reporterId),
          eq(datingReports.reportedUserId, data.reportedUserId)
        )
      );

    if (existing.length > 0) {
      throw new Error('User already reported');
    }

    await db
      .insert(datingReports)
      .values({
        id: crypto.randomUUID(),
        ...data,
        status: 'pending',
      });

    // Auto-block the reported user
    await blockUser({
      userId: data.reporterId,
      blockedUserId: data.reportedUserId,
    }).catch(() => {
      // Already blocked, ignore
    });

    return { success: true };
  } catch (error) {
        throw error;
  }
}

/**
 * Get pending reports for moderation
 */
export async function getPendingReports(limit = 50) {
  try {
    const reports = await db
      .select()
      .from(datingReports)
      .where(eq(datingReports.status, 'pending'))
      .limit(limit);

    return reports;
  } catch (error) {
        throw error;
  }
}

/**
 * Get reports for a specific user
 */
export async function getUserReports(userId: string) {
  try {
    const reports = await db
      .select()
      .from(datingReports)
      .where(eq(datingReports.reportedUserId, userId));

    return reports;
  } catch (error) {
        throw error;
  }
}

/**
 * Resolve a report (approve or dismiss)
 */
export async function resolveReport(
  reportId: string,
  action: 'approved' | 'dismissed',
  moderatorNotes?: string
) {
  try {
    const result = await db
      .update(datingReports)
      .set({
        status: action === 'approved' ? 'resolved' : 'dismissed',
        moderatorNotes,
        resolvedAt: new Date(),
      })
      .where(eq(datingReports.id, reportId));

    if (action === 'approved') {
      // Suspend the user's profile
      await db
        .update(datingProfiles)
        .set({ isActive: false })
        .where(eq(datingProfiles.id, reportId));

          }

    return { id: reportId, status: action === 'approved' ? 'resolved' : 'dismissed' };
  } catch (error) {
        throw error;
  }
}

/**
 * Suspend a user profile
 */
export async function suspendProfile(userId: string, reason: string) {
  try {
    await db
      .update(datingProfiles)
      .set({
        suspended: true,
      })
      .where(eq(datingProfiles.userId, userId));

    return { success: true };
  } catch (error) {
        throw error;
  }
}

/**
 * Unsuspend a user profile
 */
export async function unsuspendProfile(userId: string) {
  try {
    await db
      .update(datingProfiles)
      .set({
        suspended: false,
      })
      .where(eq(datingProfiles.userId, userId));

    return { success: true };
  } catch (error) {
        throw error;
  }
}

/**
 * Check if profile is suspended
 */
export async function isProfileSuspended(userId: string): Promise<boolean> {
  try {
    const profile = await db
      .select()
      .from(datingProfiles)
      .where(eq(datingProfiles.userId, userId));

    return profile.length > 0 && profile[0].suspended === true;
  } catch (error) {
        return false;
  }
}

/**
 * Get moderation statistics
 */
export async function getModerationStats() {
  try {
    const pendingReports = await db
      .select()
      .from(datingReports)
      .where(eq(datingReports.status, 'pending'));

    const approvedReports = await db
      .select()
      .from(datingReports)
      .where(eq(datingReports.status, 'approved'));

    const dismissedReports = await db
      .select()
      .from(datingReports)
      .where(eq(datingReports.status, 'dismissed'));

    // Note: suspended field doesn't exist in schema, using isActive instead
    const suspendedProfiles = await db
      .select()
      .from(datingProfiles)
      .where(eq(datingProfiles.isActive, false));

    return {
      pendingReports: pendingReports.length,
      approvedReports: approvedReports.length,
      dismissedReports: dismissedReports.length,
      suspendedProfiles: suspendedProfiles.length,
    };
  } catch (error) {
        throw error;
  }
}

// Verification features can be added when verified field is added to schema
