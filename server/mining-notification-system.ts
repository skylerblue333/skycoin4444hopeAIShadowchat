import { notifyOwner } from './_core/notification';

interface NotificationPreferences {
  userId: string;
  email: string;
  phone?: string;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  enablePushAlerts: boolean;
  alertThresholds: {
    temperatureWarning: number; // Celsius
    temperatureCritical: number;
    hashrateDrop: number; // Percentage
    rejectionRate: number; // Percentage
    profitabilityDrop: number; // Percentage
    poolDisconnect: boolean;
    workerOffline: boolean;
  };
}

interface Alert {
  id: string;
  userId: string;
  type: 'temperature' | 'hashrate' | 'rejection' | 'profitability' | 'pool' | 'worker' | 'earnings';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data: Record<string, any>;
  timestamp: number;
  read: boolean;
  actionTaken?: string;
}

/**
 * Mining Notification System
 * Sends alerts via email, SMS, and push notifications
 */
export class MiningNotificationSystem {
  private preferences: Map<string, NotificationPreferences> = new Map();
  private alerts: Map<string, Alert[]> = new Map();
  constructor() {
    // Initialize notification system
  }

  /**
   * Set notification preferences
   */
  setPreferences(prefs: NotificationPreferences): void {
    this.preferences.set(prefs.userId, prefs);
    this.alerts.set(prefs.userId, []);
      }

  /**
   * Get notification preferences
   */
  getPreferences(userId: string): NotificationPreferences | null {
    return this.preferences.get(userId) || null;
  }

  /**
   * Send temperature alert
   */
  async sendTemperatureAlert(
    userId: string,
    workerName: string,
    temperature: number,
    threshold: number
  ): Promise<void> {
    const prefs = this.preferences.get(userId);
    if (!prefs) return;

    const severity = temperature > prefs.alertThresholds.temperatureCritical ? 'critical' : 'warning';

    const alert: Alert = {
      id: `alert-${Date.now()}`,
      userId,
      type: 'temperature',
      severity,
      title: `Temperature Alert: ${workerName}`,
      message: `${workerName} temperature: ${temperature}°C (threshold: ${threshold}°C)`,
      data: { workerName, temperature, threshold },
      timestamp: Date.now(),
      read: false,
    };

    this.storeAlert(userId, alert);

    if (prefs.enableEmailAlerts) {
      await this.sendEmailAlert(prefs.email, alert);
    }

    if (prefs.enableSMSAlerts && prefs.phone) {
      await this.sendSMSAlert(prefs.phone, alert);
    }

      }

  /**
   * Send hashrate drop alert
   */
  async sendHashrateAlert(
    userId: string,
    poolName: string,
    currentHashrate: number,
    previousHashrate: number
  ): Promise<void> {
    const prefs = this.preferences.get(userId);
    if (!prefs) return;

    const dropPercentage = ((previousHashrate - currentHashrate) / previousHashrate) * 100;

    if (dropPercentage < prefs.alertThresholds.hashrateDrop) return;

    const alert: Alert = {
      id: `alert-${Date.now()}`,
      userId,
      type: 'hashrate',
      severity: dropPercentage > 20 ? 'critical' : 'warning',
      title: `Hashrate Drop: ${poolName}`,
      message: `${poolName} hashrate dropped ${dropPercentage.toFixed(1)}% (${previousHashrate} → ${currentHashrate} TH/s)`,
      data: { poolName, currentHashrate, previousHashrate, dropPercentage },
      timestamp: Date.now(),
      read: false,
    };

    this.storeAlert(userId, alert);

    if (prefs.enableEmailAlerts) {
      await this.sendEmailAlert(prefs.email, alert);
    }

      }

  /**
   * Send rejection rate alert
   */
  async sendRejectionAlert(
    userId: string,
    poolName: string,
    rejectionRate: number
  ): Promise<void> {
    const prefs = this.preferences.get(userId);
    if (!prefs || rejectionRate < prefs.alertThresholds.rejectionRate) return;

    const alert: Alert = {
      id: `alert-${Date.now()}`,
      userId,
      type: 'rejection',
      severity: rejectionRate > 10 ? 'critical' : 'warning',
      title: `High Rejection Rate: ${poolName}`,
      message: `${poolName} rejection rate: ${rejectionRate.toFixed(1)}% (threshold: ${prefs.alertThresholds.rejectionRate}%)`,
      data: { poolName, rejectionRate },
      timestamp: Date.now(),
      read: false,
    };

    this.storeAlert(userId, alert);

    if (prefs.enableEmailAlerts) {
      await this.sendEmailAlert(prefs.email, alert);
    }

      }

  /**
   * Send earnings alert
   */
  async sendEarningsAlert(
    userId: string,
    dailyEarnings: number,
    monthlyProjection: number
  ): Promise<void> {
    const prefs = this.preferences.get(userId);
    if (!prefs) return;

    const alert: Alert = {
      id: `alert-${Date.now()}`,
      userId,
      type: 'earnings',
      severity: 'info',
      title: 'Daily Earnings Report',
      message: `Today's earnings: $${dailyEarnings.toFixed(2)} | Monthly projection: $${monthlyProjection.toFixed(2)}`,
      data: { dailyEarnings, monthlyProjection },
      timestamp: Date.now(),
      read: false,
    };

    this.storeAlert(userId, alert);

    if (prefs.enableEmailAlerts) {
      await this.sendEmailAlert(prefs.email, alert);
    }

      }

  /**
   * Send pool disconnection alert
   */
  async sendPoolDisconnectAlert(userId: string, poolName: string): Promise<void> {
    const prefs = this.preferences.get(userId);
    if (!prefs || !prefs.alertThresholds.poolDisconnect) return;

    const alert: Alert = {
      id: `alert-${Date.now()}`,
      userId,
      type: 'pool',
      severity: 'critical',
      title: `Pool Disconnected: ${poolName}`,
      message: `${poolName} disconnected. Attempting to reconnect...`,
      data: { poolName },
      timestamp: Date.now(),
      read: false,
    };

    this.storeAlert(userId, alert);

    if (prefs.enableEmailAlerts) {
      await this.sendEmailAlert(prefs.email, alert);
    }

    if (prefs.enableSMSAlerts && prefs.phone) {
      await this.sendSMSAlert(prefs.phone, alert);
    }

      }

  /**
   * Send worker offline alert
   */
  async sendWorkerOfflineAlert(userId: string, workerName: string): Promise<void> {
    const prefs = this.preferences.get(userId);
    if (!prefs || !prefs.alertThresholds.workerOffline) return;

    const alert: Alert = {
      id: `alert-${Date.now()}`,
      userId,
      type: 'worker',
      severity: 'critical',
      title: `Worker Offline: ${workerName}`,
      message: `${workerName} is offline. Please check the hardware.`,
      data: { workerName },
      timestamp: Date.now(),
      read: false,
    };

    this.storeAlert(userId, alert);

    if (prefs.enableEmailAlerts) {
      await this.sendEmailAlert(prefs.email, alert);
    }

    if (prefs.enableSMSAlerts && prefs.phone) {
      await this.sendSMSAlert(prefs.phone, alert);
    }

      }

  /**
   * Send email alert
   */
  private async sendEmailAlert(email: string, alert: Alert): Promise<void> {
    try {
      await notifyOwner({
        title: alert.title,
        content: `[${alert.severity.toUpperCase()}] ${alert.message}`,
      });
          } catch (error) {
          }
  }

  /**
   * Send SMS alert
   */
  private async sendSMSAlert(phone: string, alert: Alert): Promise<void> {
    try {
      // Integrate with Twilio or similar SMS service
          } catch (error) {
          }
  }

  /**
   * Generate email HTML
   */
  private generateEmailHTML(alert: Alert): string {
    const severityColor = {
      info: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444',
    }[alert.severity];

    return `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
            <div style="border-left: 4px solid ${severityColor}; padding-left: 15px; margin-bottom: 20px;">
              <h2 style="margin: 0; color: ${severityColor};">${alert.title}</h2>
              <p style="margin: 5px 0; color: #666;">Severity: <strong>${alert.severity.toUpperCase()}</strong></p>
            </div>
            
            <p style="color: #333; line-height: 1.6;">${alert.message}</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                Time: ${new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This is an automated alert from Skycoin Mining System. Do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Store alert
   */
  private storeAlert(userId: string, alert: Alert): void {
    const userAlerts = this.alerts.get(userId) || [];
    userAlerts.push(alert);
    this.alerts.set(userId, userAlerts);

    // Keep only last 100 alerts
    if (userAlerts.length > 100) {
      userAlerts.shift();
    }
  }

  /**
   * Get alerts for user
   */
  getAlerts(userId: string, limit: number = 20): Alert[] {
    const userAlerts = this.alerts.get(userId) || [];
    return userAlerts.slice(-limit);
  }

  /**
   * Mark alert as read
   */
  markAlertAsRead(userId: string, alertId: string): boolean {
    const userAlerts = this.alerts.get(userId) || [];
    const alert = userAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
      return true;
    }
    return false;
  }

  /**
   * Get unread alert count
   */
  getUnreadCount(userId: string): number {
    const userAlerts = this.alerts.get(userId) || [];
    return userAlerts.filter(a => !a.read).length;
  }
}

// Export singleton
export const miningNotificationSystem = new MiningNotificationSystem();
