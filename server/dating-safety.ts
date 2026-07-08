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
  blockerId: number;
  blockedUserId: number;
}

export interface ReportUser {
  reporterId: number;
  reportedUserId: number;
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
          eq(datingBlocks.blockerId, data.blockerId),
          eq(datingBlocks.blockedUserId, data.blockedUserId)
        )
      );

    if (existing.length > 0) {
      throw new Error('User already blocked');
    }

    const result = await db
      .insert(datingBlocks)
      .values(data)
      .returning();

        return result[0];
  } catch (error) {
        throw error;
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(blockerId: number, blockedUserId: number) {
  try {
    const result = await db
      .delete(datingBlocks)
      .where(
        and(
          eq(datingBlocks.blockerId, blockerId),
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
export async function isUserBlocked(blockerId: number, userId: number): Promise<boolean> {
  try {
    const blocked = await db
      .select()
      .from(datingBlocks)
      .where(
        and(
          eq(datingBlocks.blockerId, blockerId),
          eq(datingBlocks.blockedUserId, userId)
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
export async function getBlockedUsers(userId: number) {
  try {
    const blocks = await db
      .select()
      .from(datingBlocks)
      .where(eq(datingBlocks.blockerId, userId));

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

    const result = await db
      .insert(datingReports)
      .values({
        ...data,
        status: 'pending',
      })
      .returning();

    
    // Auto-block the reported user
    await blockUser({
      blockerId: data.reporterId,
      blockedUserId: data.reportedUserId,
    }).catch(() => {
      // Already blocked, ignore
    });

    return result[0];
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
export async function getUserReports(userId: number) {
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
  reportId: number,
  action: 'approved' | 'dismissed',
  moderatorNotes?: string
) {
  try {
    const result = await db
      .update(datingReports)
      .set({
        status: (action === 'approved' ? 'resolved' : 'dismissed') as const,
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
export async function suspendProfile(userId: number, reason: string) {
  try {
    const result = await db
      .update(datingProfiles)
      .set({
        suspended: true,
      })
      .where(eq(datingProfiles.userId, userId))
      .returning();

        return result[0];
  } catch (error) {
        throw error;
  }
}

/**
 * Unsuspend a user profile
 */
export async function unsuspendProfile(userId: number) {
  try {
    const result = await db
      .update(datingProfiles)
      .set({
        suspended: false,
      })
      .where(eq(datingProfiles.userId, userId))
      .returning();

        return result[0];
  } catch (error) {
        throw error;
  }
}

/**
 * Check if profile is suspended
 */
export async function isProfileSuspended(userId: number): Promise<boolean> {
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
