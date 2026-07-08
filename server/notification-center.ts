import crypto from 'crypto';
/**
 * NOTIFICATION CENTER ENGINE
 * Multi-channel notification delivery, templates, preferences,
 * batching, digest generation, and delivery tracking.
 */

import { getDb } from "./db";
import * as schema from "../drizzle";
import { eq, desc, and, sql } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type NotificationChannel = "in_app" | "push" | "email" | "sms";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type NotificationCategory =
  | "social" | "financial" | "security" | "system"
  | "marketing" | "community" | "gaming" | "streaming";

export interface NotificationPayload {
  userId: number;
  type: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  imageUrl?: string;
  groupKey?: string;
  expiresAt?: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: NotificationCategory;
  titleTemplate: string;
  bodyTemplate: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
}

export interface UserNotificationPreferences {
  userId: number;
  enabled: boolean;
  channels: Record<NotificationChannel, boolean>;
  categories: Record<NotificationCategory, boolean>;
  quietHoursStart?: number; // Hour in UTC (0-23)
  quietHoursEnd?: number;
  digestFrequency: "realtime" | "hourly" | "daily" | "weekly";
  maxPerHour: number;
}

export interface DeliveryResult {
  notificationId: string;
  channel: NotificationChannel;
  status: "delivered" | "failed" | "queued" | "suppressed";
  deliveredAt?: Date;
  failureReason?: string;
}

export interface NotificationDigest {
  userId: number;
  period: string;
  notifications: Array<{
    type: string;
    count: number;
    latestTitle: string;
    latestBody: string;
  }>;
  generatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION TEMPLATES
// ═══════════════════════════════════════════════════════════════

const TEMPLATES: Record<string, NotificationTemplate> = {
  new_follower: {
    id: "new_follower",
    name: "New Follower",
    category: "social",
    titleTemplate: "New follower",
    bodyTemplate: "{{actorName}} started following you",
    channels: ["in_app", "push"],
    priority: "normal",
  },
  new_like: {
    id: "new_like",
    name: "Post Liked",
    category: "social",
    titleTemplate: "Your post was liked",
    bodyTemplate: "{{actorName}} liked your post",
    channels: ["in_app"],
    priority: "low",
  },
  new_comment: {
    id: "new_comment",
    name: "New Comment",
    category: "social",
    titleTemplate: "New comment",
    bodyTemplate: "{{actorName}} commented on your post: \"{{preview}}\"",
    channels: ["in_app", "push"],
    priority: "normal",
  },
  new_mention: {
    id: "new_mention",
    name: "Mentioned",
    category: "social",
    titleTemplate: "You were mentioned",
    bodyTemplate: "{{actorName}} mentioned you in a post",
    channels: ["in_app", "push"],
    priority: "normal",
  },
  tip_received: {
    id: "tip_received",
    name: "Tip Received",
    category: "financial",
    titleTemplate: "Tip received!",
    bodyTemplate: "{{actorName}} tipped you {{amount}} {{currency}}",
    channels: ["in_app", "push"],
    priority: "high",
  },
  subscription_new: {
    id: "subscription_new",
    name: "New Subscriber",
    category: "financial",
    titleTemplate: "New subscriber!",
    bodyTemplate: "{{actorName}} subscribed to your {{tier}} tier",
    channels: ["in_app", "push"],
    priority: "high",
  },
  payout_processed: {
    id: "payout_processed",
    name: "Payout Processed",
    category: "financial",
    titleTemplate: "Payout sent",
    bodyTemplate: "Your payout of {{amount}} {{currency}} has been processed",
    channels: ["in_app", "push", "email"],
    priority: "high",
  },
  security_login: {
    id: "security_login",
    name: "New Login",
    category: "security",
    titleTemplate: "New login detected",
    bodyTemplate: "A new login was detected from {{location}}",
    channels: ["in_app", "push", "email"],
    priority: "urgent",
  },
  security_suspicious: {
    id: "security_suspicious",
    name: "Suspicious Activity",
    category: "security",
    titleTemplate: "Suspicious activity detected",
    bodyTemplate: "Unusual activity was detected on your account: {{details}}",
    channels: ["in_app", "push", "email"],
    priority: "urgent",
  },
  stream_live: {
    id: "stream_live",
    name: "Creator Went Live",
    category: "streaming",
    titleTemplate: "{{actorName}} is live!",
    bodyTemplate: "{{actorName}} started streaming: {{streamTitle}}",
    channels: ["in_app", "push"],
    priority: "normal",
  },
  stream_raid: {
    id: "stream_raid",
    name: "Stream Raid",
    category: "streaming",
    titleTemplate: "Incoming raid!",
    bodyTemplate: "{{actorName}} is raiding your stream with {{viewerCount}} viewers",
    channels: ["in_app", "push"],
    priority: "high",
  },
  tournament_start: {
    id: "tournament_start",
    name: "Tournament Starting",
    category: "gaming",
    titleTemplate: "Tournament starting soon",
    bodyTemplate: "\"{{tournamentName}}\" begins in {{timeUntil}}",
    channels: ["in_app", "push"],
    priority: "high",
  },
  quest_completed: {
    id: "quest_completed",
    name: "Quest Completed",
    category: "gaming",
    titleTemplate: "Quest completed!",
    bodyTemplate: "You earned {{reward}} for completing \"{{questName}}\"",
    channels: ["in_app"],
    priority: "normal",
  },
  guild_invite: {
    id: "guild_invite",
    name: "Guild Invitation",
    category: "gaming",
    titleTemplate: "Guild invitation",
    bodyTemplate: "You've been invited to join {{guildName}}",
    channels: ["in_app", "push"],
    priority: "normal",
  },
  community_event: {
    id: "community_event",
    name: "Community Event",
    category: "community",
    titleTemplate: "Community event",
    bodyTemplate: "{{communityName}}: {{eventTitle}}",
    channels: ["in_app"],
    priority: "normal",
  },
  staking_reward: {
    id: "staking_reward",
    name: "Staking Reward",
    category: "financial",
    titleTemplate: "Staking rewards available",
    bodyTemplate: "You have {{amount}} {{currency}} in unclaimed staking rewards",
    channels: ["in_app"],
    priority: "normal",
  },
  marketplace_sale: {
    id: "marketplace_sale",
    name: "Item Sold",
    category: "financial",
    titleTemplate: "Item sold!",
    bodyTemplate: "Your listing \"{{itemTitle}}\" was purchased for {{price}} {{currency}}",
    channels: ["in_app", "push"],
    priority: "high",
  },
  marketplace_bid: {
    id: "marketplace_bid",
    name: "New Bid",
    category: "financial",
    titleTemplate: "New bid on your item",
    bodyTemplate: "{{actorName}} bid {{amount}} {{currency}} on \"{{itemTitle}}\"",
    channels: ["in_app", "push"],
    priority: "normal",
  },
  system_maintenance: {
    id: "system_maintenance",
    name: "System Maintenance",
    category: "system",
    titleTemplate: "Scheduled maintenance",
    bodyTemplate: "Platform maintenance scheduled for {{dateTime}}. Expected duration: {{duration}}",
    channels: ["in_app", "email"],
    priority: "normal",
  },
  moderation_action: {
    id: "moderation_action",
    name: "Moderation Action",
    category: "system",
    titleTemplate: "Content moderation notice",
    bodyTemplate: "Your {{contentType}} was {{action}} for violating {{rule}}",
    channels: ["in_app", "email"],
    priority: "high",
  },
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CENTER CLASS
// ═══════════════════════════════════════════════════════════════

export class NotificationCenter {
  private preferences: Map<number, UserNotificationPreferences> = new Map();
  private deliveryLog: DeliveryResult[] = [];
  private rateLimitCounters: Map<number, { count: number; resetAt: number }> = new Map();
  private groupedNotifications: Map<string, NotificationPayload[]> = new Map();

  /**
   * Send a notification using a template
   */
  async sendFromTemplate(
    templateId: string,
    userId: number,
    variables: Record<string, string | number>
  ): Promise<DeliveryResult[]> {
    const template = TEMPLATES[templateId];
    if (!template) {
      return [{ notificationId: "", channel: "in_app", status: "failed", failureReason: "Template not found" }];
    }

    const title = this.interpolateTemplate(template.titleTemplate, variables);
    const body = this.interpolateTemplate(template.bodyTemplate, variables);

    return this.send({
      userId,
      type: templateId,
      title,
      body,
      category: template.category,
      priority: template.priority,
      channels: template.channels,
      metadata: variables as Record<string, unknown>,
    });
  }

  /**
   * Send a notification
   */
  async send(payload: NotificationPayload): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];
    const prefs = this.getUserPreferences(payload.userId);

    // Check if notifications are enabled
    if (!prefs.enabled) {
      return [{ notificationId: "", channel: "in_app", status: "suppressed", failureReason: "Notifications disabled" }];
    }

    // Check category preference
    if (!prefs.categories[payload.category]) {
      return [{ notificationId: "", channel: "in_app", status: "suppressed", failureReason: "Category disabled" }];
    }

    // Check quiet hours
    if (this.isQuietHours(prefs)) {
      if (payload.priority !== "urgent") {
        return [{ notificationId: "", channel: "in_app", status: "queued", failureReason: "Quiet hours" }];
      }
    }

    // Check rate limit
    if (!this.checkRateLimit(payload.userId, prefs.maxPerHour)) {
      if (payload.priority !== "urgent") {
        return [{ notificationId: "", channel: "in_app", status: "suppressed", failureReason: "Rate limited" }];
      }
    }

    // Check grouping
    if (payload.groupKey) {
      const grouped = this.groupedNotifications.get(payload.groupKey) || [];
      grouped.push(payload);
      this.groupedNotifications.set(payload.groupKey, grouped);

      // Only deliver if this is the first in the group (batch the rest)
      if (grouped.length > 1) {
        return [{ notificationId: "", channel: "in_app", status: "queued", failureReason: "Grouped" }];
      }
    }

    // Deliver to each enabled channel
    for (const channel of payload.channels) {
      if (!prefs.channels[channel]) continue;

      const result = await this.deliverToChannel(channel, payload);
      results.push(result);
      this.deliveryLog.push(result);
    }

    // Always deliver in-app notification to database
    await this.persistNotification(payload);

    return results;
  }

  /**
   * Deliver notification to a specific channel
   */
  private async deliverToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): Promise<DeliveryResult> {
    const notificationId = `NOTIF-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`;

    switch (channel) {
      case "in_app":
        // Already persisted to database
        return { notificationId, channel, status: "delivered", deliveredAt: new Date() };

      case "push":
        // In production, this would call a push notification service (FCM, APNs)
        return { notificationId, channel, status: "delivered", deliveredAt: new Date() };

      case "email":
        // In production, this would call an email service (SendGrid, SES)
        return { notificationId, channel, status: "delivered", deliveredAt: new Date() };

      case "sms":
        // In production, this would call an SMS service (Twilio)
        return { notificationId, channel, status: "delivered", deliveredAt: new Date() };

      default:
        return { notificationId, channel, status: "failed", failureReason: "Unknown channel" };
    }
  }

  /**
   * Persist notification to database
   */
  private async persistNotification(payload: NotificationPayload): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      await db.insert(schema.notifications).values({
        userId: payload.userId,
        type: payload.type as "follow" | "like" | "comment" | "mention" | "repost" | "donation" | "achievement" | "stream_live" | "tournament" | "system",
        title: payload.title,
        message: payload.body,
        isRead: false,
        createdAt: new Date(),
      });
    } catch {
      // Log but don't throw
    }
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: number, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: NotificationCategory;
  }) {
    const db = await getDb();
    if (!db) return [];

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const conditions = [eq(schema.notifications.userId, userId)];
    if (options?.unreadOnly) {
      conditions.push(eq(schema.notifications.isRead, false));
    }

    const results = await db
      .select()
      .from(schema.notifications)
      .where(and(...conditions))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return results;
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId: number, notificationIds?: number[]): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications
      let updated = 0;
      for (const id of notificationIds) {
      const result = await db
        .update(schema.notifications)
        .set({ isRead: true })
        .where(and(
            eq(schema.notifications.id, id),
            eq(schema.notifications.userId, userId)
          ));
        if (result[0] && "affectedRows" in result[0]) {
          updated += (result[0] as { affectedRows: number }).affectedRows;
        }
      }
      return updated;
    } else {
      // Mark all as read
      const result = await db
        .update(schema.notifications)
        .set({ isRead: true })
        .where(eq(schema.notifications.userId, userId));
      return (result[0] as { affectedRows?: number })?.affectedRows || 0;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, false)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Generate notification digest for a user
   */
  async generateDigest(userId: number, hoursBack: number = 24): Promise<NotificationDigest> {
    const db = await getDb();
    const notifications: Array<{ type: string; title: string; message: string }> = [];

    if (db) {
      const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      const results = await db
        .select()
        .from(schema.notifications)
        .where(and(
          eq(schema.notifications.userId, userId),
          sql`${schema.notifications.createdAt} > ${cutoff}`
        ))
        .orderBy(desc(schema.notifications.createdAt));

    for (const r of results) {
      notifications.push({ type: r.type, title: r.title, message: r.message || "" });
    }
    }

    // Group by type
    const grouped: Record<string, { count: number; latestTitle: string; latestBody: string }> = {};
    for (const n of notifications) {
      if (!grouped[n.type]) {
        grouped[n.type] = { count: 0, latestTitle: n.title, latestBody: n.message };
      }
      grouped[n.type].count++;
    }

    return {
      userId,
      period: `Last ${hoursBack} hours`,
      notifications: Object.entries(grouped).map(([type, data]) => ({
        type,
        count: data.count,
        latestTitle: data.latestTitle,
        latestBody: data.latestBody,
      })),
      generatedAt: new Date(),
    };
  }

  /**
   * Get/set user notification preferences
   */
  getUserPreferences(userId: number): UserNotificationPreferences {
    if (!this.preferences.has(userId)) {
      this.preferences.set(userId, {
        userId,
        enabled: true,
        channels: { in_app: true, push: true, email: true, sms: false },
        categories: {
          social: true, financial: true, security: true, system: true,
          marketing: false, community: true, gaming: true, streaming: true,
        },
        digestFrequency: "realtime",
        maxPerHour: 30,
      });
    }
    return this.preferences.get(userId)!;
  }

  /**
   * Update user preferences
   */
  updatePreferences(userId: number, updates: Partial<UserNotificationPreferences>): void {
    const current = this.getUserPreferences(userId);
    this.preferences.set(userId, { ...current, ...updates, userId });
  }

  /**
   * Get delivery stats
   */
  getDeliveryStats(): {
    total: number;
    delivered: number;
    failed: number;
    suppressed: number;
    queued: number;
    deliveryRate: number;
    byChannel: Record<string, number>;
  } {
    const total = this.deliveryLog.length;
    const delivered = this.deliveryLog.filter(d => d.status === "delivered").length;
    const failed = this.deliveryLog.filter(d => d.status === "failed").length;
    const suppressed = this.deliveryLog.filter(d => d.status === "suppressed").length;
    const queued = this.deliveryLog.filter(d => d.status === "queued").length;

    const byChannel: Record<string, number> = {};
    for (const log of this.deliveryLog) {
      byChannel[log.channel] = (byChannel[log.channel] || 0) + 1;
    }

    return {
      total,
      delivered,
      failed,
      suppressed,
      queued,
      deliveryRate: total > 0 ? delivered / total : 0,
      byChannel,
    };
  }

  /**
   * Get available templates
   */
  getTemplates(): NotificationTemplate[] {
    return Object.values(TEMPLATES);
  }

  /**
   * Flush grouped notifications (call periodically)
   */
  async flushGroups(): Promise<number> {
    let flushed = 0;
    for (const [groupKey, notifications] of Array.from(this.groupedNotifications.entries())) {
      if (notifications.length > 1) {
        // Send a summary notification
        const first = notifications[0];
        await this.persistNotification({
          ...first,
          title: `${notifications.length} ${first.type} notifications`,
          body: `You have ${notifications.length} new ${first.type} notifications`,
        });
        flushed += notifications.length;
      }
      this.groupedNotifications.delete(groupKey);
    }
    return flushed;
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private interpolateTemplate(template: string, variables: Record<string, string | number>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }
    return result;
  }

  private isQuietHours(prefs: UserNotificationPreferences): boolean {
    if (prefs.quietHoursStart === undefined || prefs.quietHoursEnd === undefined) return false;
    const currentHour = new Date().getUTCHours();
    if (prefs.quietHoursStart < prefs.quietHoursEnd) {
      return currentHour >= prefs.quietHoursStart && currentHour < prefs.quietHoursEnd;
    }
    // Wraps midnight (e.g., 22:00 - 07:00)
    return currentHour >= prefs.quietHoursStart || currentHour < prefs.quietHoursEnd;
  }

  private checkRateLimit(userId: number, maxPerHour: number): boolean {
    const now = Date.now();
    const counter = this.rateLimitCounters.get(userId);

    if (!counter || counter.resetAt < now) {
      this.rateLimitCounters.set(userId, { count: 1, resetAt: now + 3600000 });
      return true;
    }

    if (counter.count >= maxPerHour) return false;
    counter.count++;
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════

let notificationCenterInstance: NotificationCenter | null = null;

export function getNotificationCenter(): NotificationCenter {
  if (!notificationCenterInstance) {
    notificationCenterInstance = new NotificationCenter();
  }
  return notificationCenterInstance;
}
