/**
 * Notification Service — Real notification delivery for platform events.
 * 
 * Uses the built-in notifyOwner() for owner alerts, and stores user notifications
 * in the database for in-app notification center.
 */

import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { notifications } from "../drizzle";
import { eq, desc, and } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// USER NOTIFICATION HELPERS
// ═══════════════════════════════════════════════════════════════

export interface CreateNotificationParams {
  userId: number;
  type: "follow" | "like" | "comment" | "mention" | "repost" | "donation" | "achievement" | "stream_live" | "tournament" | "system";
  title: string;
  message: string;
  actorId?: number;
  targetType?: string;
  targetId?: number;
}

/**
 * Create an in-app notification for a user.
 */
export async function createUserNotification(params: CreateNotificationParams) {
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      actorId: params.actorId || null,
      targetType: params.targetType || null,
      targetId: params.targetId || null,
      isRead: false,
      createdAt: new Date(),
    });
    return result;
  } catch (err) {
        return null;
  }
}

/**
 * Get user's notifications (most recent first).
 */
export async function getUserNotifications(userId: number, limit = 50) {
  try {
    const db = await getDb();
    if (!db) return [];
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  } catch (err) {
        return [];
  }
}

/**
 * Mark a notification as read.
 */
export async function markNotificationReadInDB(notificationId: number, userId: number) {
  try {
    const db = await getDb();
    if (!db) return false;
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    return true;
  } catch (err) {
        return false;
  }
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  } catch (err) {
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// EVENT-TRIGGERED NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Notify when a user receives a tip/donation.
 */
export async function notifyTipReceived(recipientId: number, senderId: number, amount: number) {
  await createUserNotification({
    userId: recipientId,
    type: "donation",
    title: "Tip Received!",
    message: `You received ${amount} SKY444`,
    actorId: senderId,
  });
}

/**
 * Notify when a user gets a new follower.
 */
export async function notifyNewFollower(userId: number, followerId: number, followerName: string) {
  await createUserNotification({
    userId,
    type: "follow",
    title: "New Follower",
    message: `${followerName} started following you`,
    actorId: followerId,
  });
}

/**
 * Notify when content is liked.
 */
export async function notifyLike(userId: number, actorId: number, actorName: string, postId: number) {
  await createUserNotification({
    userId,
    type: "like",
    title: "New Like",
    message: `${actorName} liked your post`,
    actorId,
    targetType: "post",
    targetId: postId,
  });
}

/**
 * Notify when an achievement is unlocked.
 */
export async function notifyAchievementUnlocked(userId: number, achievementName: string) {
  await createUserNotification({
    userId,
    type: "achievement",
    title: "Achievement Unlocked!",
    message: `You earned: ${achievementName}`,
  });
}

/**
 * Notify when a stream goes live.
 */
export async function notifyStreamLive(userId: number, streamerName: string, streamId: number) {
  await createUserNotification({
    userId,
    type: "stream_live",
    title: "Stream Live!",
    message: `${streamerName} is now live`,
    targetType: "stream",
    targetId: streamId,
  });
}

/**
 * Send critical platform alerts to the owner.
 */
export async function alertOwner(title: string, content: string) {
  return notifyOwner({ title, content });
}

export async function notifyComment(userId: number, actorId: number, postId: number) {
  return createUserNotification({
    userId,
    type: "comment" as any,
    title: "New comment on your post",
    message: `Someone commented on your post`,
    actorId,
    targetType: "post",
    targetId: postId,
  });
}

export async function notifyNewSubscriber(creatorId: number, subscriberId: number, tier: string) {
  return createUserNotification({
    userId: creatorId,
    type: "donation" as any,
    title: "New subscriber!",
    message: `You have a new ${tier} subscriber`,
    actorId: subscriberId,
  });
}

export async function notifyStreamDonation(streamerId: number, donorId: number, amount: number) {
  return createUserNotification({
    userId: streamerId,
    type: "donation",
    title: "Stream donation received",
    message: `You received a ${amount} SKY444 donation`,
    actorId: donorId,
    targetType: "stream",
  });
}
