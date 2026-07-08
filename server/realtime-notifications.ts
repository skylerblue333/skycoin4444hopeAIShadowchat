import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * Real-Time Notifications System
 * WebSocket-based notifications for achievements, VPN status, and security alerts
 */

export type NotificationType = 
  | 'achievement'
  | 'vpn_status'
  | 'security_alert'
  | 'game_event'
  | 'system_alert'
  | 'transaction'
  | 'social';

export interface RealtimeNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  achievements: boolean;
  vpnStatus: boolean;
  securityAlerts: boolean;
  gameEvents: boolean;
  transactions: boolean;
  social: boolean;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

/**
 * Real-Time Notification Manager
 */
export class RealtimeNotificationManager extends EventEmitter {
  private notifications: Map<string, RealtimeNotification[]> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private subscribers: Map<string, Set<(notification: RealtimeNotification) => void>> = new Map();

  /**
   * Create notification
   */
  createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      icon?: string;
      actionUrl?: string;
      severity?: 'info' | 'warning' | 'error' | 'success';
      data?: Record<string, any>;
    }
  ): RealtimeNotification {
    const notification: RealtimeNotification = {
      id: crypto.randomBytes(16).toString('hex'),
      userId,
      type,
      title,
      message,
      icon: options?.icon,
      actionUrl: options?.actionUrl,
      severity: options?.severity || 'info',
      timestamp: new Date(),
      read: false,
      data: options?.data,
    };

    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(notification);

    // Broadcast to subscribers
    this.broadcastToUser(userId, notification);

    // Emit event
    this.emit('notification', notification);

    return notification;
  }

  /**
   * Subscribe to user notifications
   */
  subscribe(userId: string, callback: (notification: RealtimeNotification) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(userId)?.delete(callback);
    };
  }

  /**
   * Broadcast notification to user
   */
  private broadcastToUser(userId: string, notification: RealtimeNotification): void {
    const callbacks = this.subscribers.get(userId);
    if (callbacks) {
      callbacks.forEach((callback) => callback(notification));
    }
  }

  /**
   * Get user notifications
   */
  getUserNotifications(userId: string, limit: number = 50): RealtimeNotification[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.slice(-limit);
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;

    const notification = userNotifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }

    return false;
  }

  /**
   * Mark all as read
   */
  markAllAsRead(userId: string): void {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      userNotifications.forEach((n) => (n.read = true));
    }
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): number {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter((n) => !n.read).length;
  }

  /**
   * Set notification preferences
   */
  setPreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.preferences.get(userId) || {
      userId,
      achievements: true,
      vpnStatus: true,
      securityAlerts: true,
      gameEvents: true,
      transactions: true,
      social: true,
      email: true,
      push: true,
      inApp: true,
    };

    this.preferences.set(userId, { ...current, ...preferences });
  }

  /**
   * Get notification preferences
   */
  getPreferences(userId: string): NotificationPreferences {
    return (
      this.preferences.get(userId) || {
        userId,
        achievements: true,
        vpnStatus: true,
        securityAlerts: true,
        gameEvents: true,
        transactions: true,
        social: true,
        email: true,
        push: true,
        inApp: true,
      }
    );
  }
}

/**
 * Achievement Notifier
 */
export class AchievementNotifier {
  private manager: RealtimeNotificationManager;

  constructor(manager: RealtimeNotificationManager) {
    this.manager = manager;
  }

  /**
   * Notify achievement unlocked
   */
  notifyAchievementUnlocked(
    userId: string,
    achievementName: string,
    reward: number,
    icon: string = '🏆'
  ): void {
    this.manager.createNotification(
      userId,
      'achievement',
      `🎉 Achievement Unlocked!`,
      `You've unlocked "${achievementName}" and earned ${reward} SKY444!`,
      {
        icon,
        severity: 'success',
        data: { achievementName, reward },
      }
    );
  }

  /**
   * Notify milestone reached
   */
  notifyMilestoneReached(userId: string, milestone: string, level: number): void {
    this.manager.createNotification(
      userId,
      'achievement',
      `🚀 Milestone Reached!`,
      `You've reached ${milestone} Level ${level}!`,
      {
        icon: '🚀',
        severity: 'success',
        data: { milestone, level },
      }
    );
  }

  /**
   * Notify leaderboard ranking
   */
  notifyLeaderboardRanking(
    userId: string,
    game: string,
    rank: number,
    totalPlayers: number
  ): void {
    this.manager.createNotification(
      userId,
      'achievement',
      `📊 Leaderboard Update`,
      `You're now ranked #${rank} out of ${totalPlayers} players in ${game}!`,
      {
        icon: '📊',
        severity: 'info',
        data: { game, rank, totalPlayers },
      }
    );
  }
}

/**
 * VPN Status Notifier
 */
export class VPNStatusNotifier {
  private manager: RealtimeNotificationManager;

  constructor(manager: RealtimeNotificationManager) {
    this.manager = manager;
  }

  /**
   * Notify VPN connected
   */
  notifyVPNConnected(userId: string, nodeCount: number, location: string): void {
    this.manager.createNotification(
      userId,
      'vpn_status',
      '🔒 VPN Connected',
      `Connected through ${nodeCount} nodes via ${location}`,
      {
        icon: '🔒',
        severity: 'success',
        data: { nodeCount, location },
      }
    );
  }

  /**
   * Notify VPN disconnected
   */
  notifyVPNDisconnected(userId: string, reason: string): void {
    this.manager.createNotification(
      userId,
      'vpn_status',
      '🔓 VPN Disconnected',
      `VPN disconnected: ${reason}`,
      {
        icon: '🔓',
        severity: 'warning',
        data: { reason },
      }
    );
  }

  /**
   * Notify VPN error
   */
  notifyVPNError(userId: string, error: string): void {
    this.manager.createNotification(
      userId,
      'vpn_status',
      '⚠️ VPN Error',
      `VPN error: ${error}`,
      {
        icon: '⚠️',
        severity: 'error',
        data: { error },
      }
    );
  }

  /**
   * Notify bandwidth usage
   */
  notifyBandwidthUsage(userId: string, usedGB: number, limitGB: number): void {
    const percentage = (usedGB / limitGB) * 100;

    let severity: 'info' | 'warning' | 'error' = 'info';
    if (percentage > 90) severity = 'error';
    else if (percentage > 75) severity = 'warning';

    this.manager.createNotification(
      userId,
      'vpn_status',
      '📊 Bandwidth Usage',
      `You've used ${usedGB.toFixed(2)}GB of ${limitGB}GB (${percentage.toFixed(0)}%)`,
      {
        icon: '📊',
        severity,
        data: { usedGB, limitGB, percentage },
      }
    );
  }
}

/**
 * Security Alert Notifier
 */
export class SecurityAlertNotifier {
  private manager: RealtimeNotificationManager;

  constructor(manager: RealtimeNotificationManager) {
    this.manager = manager;
  }

  /**
   * Notify security vulnerability
   */
  notifyVulnerability(
    userId: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    title: string,
    description: string
  ): void {
    const icons = {
      critical: '🚨',
      high: '⛔',
      medium: '⚠️',
      low: 'ℹ️',
    };

    const notifSeverity = severity === 'critical' ? 'error' : severity === 'high' ? 'warning' : 'info';

    this.manager.createNotification(
      userId,
      'security_alert',
      `${icons[severity]} Security Alert`,
      `${title}: ${description}`,
      {
        icon: icons[severity],
        severity: notifSeverity,
        data: { severity, title, description },
      }
    );
  }

  /**
   * Notify suspicious activity
   */
  notifySuspiciousActivity(userId: string, activity: string, location: string): void {
    this.manager.createNotification(
      userId,
      'security_alert',
      '🔍 Suspicious Activity Detected',
      `${activity} from ${location}. Confirm if this was you.`,
      {
        icon: '🔍',
        severity: 'warning',
        actionUrl: '/security/verify',
        data: { activity, location },
      }
    );
  }

  /**
   * Notify failed login attempt
   */
  notifyFailedLogin(userId: string, attempts: number, location: string): void {
    this.manager.createNotification(
      userId,
      'security_alert',
      '🚫 Failed Login Attempt',
      `${attempts} failed login attempts from ${location}`,
      {
        icon: '🚫',
        severity: attempts > 3 ? 'error' : 'warning',
        actionUrl: '/security/change-password',
        data: { attempts, location },
      }
    );
  }

  /**
   * Notify new device login
   */
  notifyNewDeviceLogin(userId: string, deviceName: string, location: string): void {
    this.manager.createNotification(
      userId,
      'security_alert',
      '📱 New Device Login',
      `Your account was accessed from ${deviceName} in ${location}`,
      {
        icon: '📱',
        severity: 'info',
        actionUrl: '/security/devices',
        data: { deviceName, location },
      }
    );
  }

  /**
   * Notify 2FA disabled
   */
  notify2FADisabled(userId: string): void {
    this.manager.createNotification(
      userId,
      'security_alert',
      '⚠️ Two-Factor Authentication Disabled',
      'Your 2FA has been disabled. Re-enable it for better security.',
      {
        icon: '⚠️',
        severity: 'warning',
        actionUrl: '/security/2fa',
        data: {},
      }
    );
  }

  /**
   * Notify audit finding
   */
  notifyAuditFinding(userId: string, severity: string, title: string, remediation: string): void {
    this.manager.createNotification(
      userId,
      'security_alert',
      `🔐 Security Audit Finding`,
      `${title}: ${remediation}`,
      {
        icon: '🔐',
        severity: severity === 'critical' ? 'error' : 'warning',
        actionUrl: '/security/audit',
        data: { severity, title, remediation },
      }
    );
  }
}

/**
 * Initialize real-time notifications system
 */
export function initializeRealtimeNotifications() {
  const manager = new RealtimeNotificationManager();
  const achievementNotifier = new AchievementNotifier(manager);
  const vpnStatusNotifier = new VPNStatusNotifier(manager);
  const securityAlertNotifier = new SecurityAlertNotifier(manager);

  return {
    manager,
    achievementNotifier,
    vpnStatusNotifier,
    securityAlertNotifier,
  };
}
