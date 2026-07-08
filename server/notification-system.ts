import crypto from 'crypto';
/**
 * Push Notification System for SKYCOIN4444
 * 
 * Real-time notifications for all 10 strategic engines
 * - Feedback alerts
 * - Roadmap updates
 * - Agent consensus changes
 * - Competitive intelligence
 * - Behavioral insights
 * - Experiment results
 * - Narrative generation
 * - Connector status
 * - Product brain updates
 * - Simulation progress
 */

import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';

// Notification types
export const NotificationType = z.enum([
  'feedback_alert',
  'roadmap_update',
  'agent_consensus',
  'competitor_alert',
  'behavioral_insight',
  'experiment_result',
  'narrative_ready',
  'connector_status',
  'playbook_update',
  'simulation_complete',
]);

export const NotificationPriority = z.enum(['low', 'medium', 'high', 'critical']);

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationType,
  title: z.string(),
  message: z.string(),
  priority: NotificationPriority,
  engine: z.string(),
  data: z.record(z.string(), z.any()).optional(),
  read: z.boolean().default(false),
  createdAt: z.date(),
  actionUrl: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// Notification preferences
export const NotificationPreferencesSchema = z.object({
  userId: z.string(),
  feedbackAlerts: z.boolean().default(true),
  roadmapUpdates: z.boolean().default(true),
  agentConsensus: z.boolean().default(true),
  competitorAlerts: z.boolean().default(true),
  behavioralInsights: z.boolean().default(true),
  experimentResults: z.boolean().default(true),
  narrativeReady: z.boolean().default(true),
  connectorStatus: z.boolean().default(true),
  playbookUpdates: z.boolean().default(true),
  simulationComplete: z.boolean().default(true),
  pushEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),
}).strict()

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

// In-memory notification store (would be database in production)
const notifications: Map<string, Notification[]> = new Map();
const preferences: Map<string, NotificationPreferences> = new Map();

export const notificationRouter = router({
  /**
   * Get user notifications
   */
  getNotifications: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
      unreadOnly: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const userNotifications = notifications.get(userId) || [];
      
      let filtered = userNotifications;
      if (input.unreadOnly) {
        filtered = filtered.filter(n => !n.read);
      }
      
      const paginated = filtered
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(input.offset, input.offset + input.limit);
      
      return {
        notifications: paginated,
        total: filtered.length,
        unreadCount: filtered.filter(n => !n.read).length,
      };
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const userNotifications = notifications.get(userId) || [];
      
      const notification = userNotifications.find(n => n.id === input.notificationId);
      if (notification) {
        notification.read = true;
      }
      
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = String(ctx.user.id);
      const userNotifications = notifications.get(userId) || [];
      
      userNotifications.forEach(n => {
        n.read = true;
      });
      
      return { success: true };
    }),

  /**
   * Delete notification
   */
  deleteNotification: protectedProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const userNotifications = notifications.get(userId) || [];
      
      const index = userNotifications.findIndex(n => n.id === input.notificationId);
      if (index !== -1) {
        userNotifications.splice(index, 1);
      }
      
      return { success: true };
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = String(ctx.user.id);
      return preferences.get(userId) || {
        userId,
        feedbackAlerts: true,
        roadmapUpdates: true,
        agentConsensus: true,
        competitorAlerts: true,
        behavioralInsights: true,
        experimentResults: true,
        narrativeReady: true,
        connectorStatus: true,
        playbookUpdates: true,
        simulationComplete: true,
        pushEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
      };
    }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(NotificationPreferencesSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const currentPrefs = preferences.get(userId) || {
        userId,
        feedbackAlerts: true,
        roadmapUpdates: true,
        agentConsensus: true,
        competitorAlerts: true,
        behavioralInsights: true,
        experimentResults: true,
        narrativeReady: true,
        connectorStatus: true,
        playbookUpdates: true,
        simulationComplete: true,
        pushEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
      };
      
      const updated = { ...currentPrefs, ...input, userId };
      preferences.set(userId, updated);
      
      return updated;
    }),

  /**
   * Get notification statistics
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = String(ctx.user.id);
      const userNotifications = notifications.get(userId) || [];
      
      const byType = userNotifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const byPriority = userNotifications.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        total: userNotifications.length,
        unread: userNotifications.filter(n => !n.read).length,
        byType,
        byPriority,
        lastNotification: userNotifications[0]?.createdAt || null,
      };
    }),
});

/**
 * Send notification to user
 * Called by other engines when events occur
 */
export async function sendNotification(
  userId: string,
  type: z.infer<typeof NotificationType>,
  title: string,
  message: string,
  priority: z.infer<typeof NotificationPriority> = 'medium',
  engine: string = 'system',
  data?: Record<string, any>,
  actionUrl?: string
) {
  const notification: Notification = {
    id: `notif_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    message,
    priority,
    engine,
    data,
    read: false,
    createdAt: new Date(),
    actionUrl,
  };
  
  if (!notifications.has(userId)) {
    notifications.set(userId, []);
  }
  
  notifications.get(userId)!.push(notification);
  
  // Keep only last 100 notifications per user
  const userNotifications = notifications.get(userId)!;
  if (userNotifications.length > 100) {
    userNotifications.shift();
  }
  
  return notification;
}

/**
 * Notification triggers for each engine
 */
export const notificationTriggers = {
  // Feedback Engine
  async feedbackAlert(userId: string, feedbackCount: number, actionableCount: number) {
    return sendNotification(
      userId,
      'feedback_alert',
      'New Feedback Received',
      `${feedbackCount} new feedback items, ${actionableCount} are actionable`,
      'high',
      'feedback',
      { feedbackCount, actionableCount },
      '/feedback-hub'
    );
  },

  // Roadmap Engine
  async roadmapUpdate(userId: string, itemTitle: string, newPriority: number) {
    return sendNotification(
      userId,
      'roadmap_update',
      'Roadmap Updated',
      `"${itemTitle}" priority changed to ${newPriority}`,
      'medium',
      'roadmap',
      { itemTitle, newPriority },
      '/adaptive-roadmap'
    );
  },

  // Agent Engine
  async agentConsensus(userId: string, consensusScore: number, decision: string) {
    return sendNotification(
      userId,
      'agent_consensus',
      'Agent Consensus Reached',
      `Agents agreed (${(consensusScore * 100).toFixed(0)}%): ${decision}`,
      consensusScore > 0.9 ? 'high' : 'medium',
      'agents',
      { consensusScore, decision },
      '/agent-debate'
    );
  },

  // Competitive Engine
  async competitorAlert(userId: string, competitorName: string, change: string) {
    return sendNotification(
      userId,
      'competitor_alert',
      'Competitive Alert',
      `${competitorName} ${change}`,
      'high',
      'competitors',
      { competitorName, change },
      '/competitive-radar'
    );
  },

  // Behavioral Engine
  async behavioralInsight(userId: string, insight: string, affectedUsers: number) {
    return sendNotification(
      userId,
      'behavioral_insight',
      'Behavioral Insight',
      `${insight} (affects ${affectedUsers} users)`,
      'medium',
      'behavioral',
      { insight, affectedUsers },
      '/behavioral-intelligence'
    );
  },

  // Experiment Engine
  async experimentResult(userId: string, experimentName: string, lift: number, significant: boolean) {
    return sendNotification(
      userId,
      'experiment_result',
      'Experiment Complete',
      `${experimentName}: ${(lift * 100).toFixed(1)}% lift ${significant ? '(significant)' : '(not significant)'}`,
      significant ? 'high' : 'medium',
      'experiments',
      { experimentName, lift, significant },
      '/experiment-factory'
    );
  },

  // Narrative Engine
  async narrativeReady(userId: string, audience: string, variantCount: number) {
    return sendNotification(
      userId,
      'narrative_ready',
      'Narrative Generated',
      `${variantCount} narrative variants ready for ${audience}`,
      'medium',
      'narratives',
      { audience, variantCount },
      '/narrative-engine'
    );
  },

  // Connector Engine
  async connectorStatus(userId: string, connectorName: string, status: string, uptime: number) {
    return sendNotification(
      userId,
      'connector_status',
      `${connectorName} Status`,
      `${status} (${(uptime * 100).toFixed(2)}% uptime)`,
      status === 'error' ? 'critical' : 'low',
      'connectors',
      { connectorName, status, uptime },
      '/connector-intelligence'
    );
  },

  // Product Brain Engine
  async playbookUpdate(userId: string, playbookName: string, version: number, effectiveness: number) {
    return sendNotification(
      userId,
      'playbook_update',
      'Playbook Updated',
      `${playbookName} v${version} now ${(effectiveness * 100).toFixed(0)}% effective`,
      'medium',
      'productbrain',
      { playbookName, version, effectiveness },
      '/product-brain'
    );
  },

  // Simulator Engine
  async simulationComplete(userId: string, scenario: string, projectedGrowth: number) {
    return sendNotification(
      userId,
      'simulation_complete',
      'Simulation Complete',
      `${scenario} scenario: ${(projectedGrowth * 100).toFixed(0)}% projected growth`,
      'high',
      'simulator',
      { scenario, projectedGrowth },
      '/company-simulator'
    );
  },
};
