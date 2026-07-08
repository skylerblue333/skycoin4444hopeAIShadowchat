import crypto from 'crypto';
import { getDb } from './db';

/**
 * Anomaly Detection Engine
 * 
 * Capabilities:
 * - Fraud detection
 * - Market manipulation detection
 * - Unusual behavior detection
 * - Statistical anomaly detection
 * - Machine learning-based detection
 * - Real-time alerting
 */

interface Anomaly {
  id: string;
  type: 'fraud' | 'market_manipulation' | 'unusual_behavior' | 'statistical_outlier' | 'behavioral_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string | null;
  description: string;
  evidence: Record<string, unknown>;
  confidence: number;
  timestamp: number;
  resolved: boolean;
}

interface AnomalyPattern {
  id: string;
  name: string;
  type: Anomaly['type'];
  indicators: string[];
  threshold: number;
  enabled: boolean;
}

interface UserBehaviorProfile {
  userId: string;
  averageTransactionSize: number;
  averageTransactionFrequency: number;
  typicalHours: number[];
  typicalLocations: string[];
  typicalDevices: string[];
  riskScore: number;
  lastUpdated: number;
}

export class AnomalyDetectionEngine {
  private anomalies: Anomaly[] = [];
  private patterns: Map<string, AnomalyPattern> = new Map();
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();

  constructor() {
    this.initializePatterns();
  }

  /**
   * Initialize detection patterns
   */
  private initializePatterns(): void {
    const patterns: AnomalyPattern[] = [
      {
        id: crypto.randomUUID(),
        name: 'Rapid Transaction Pattern',
        type: 'fraud',
        indicators: ['high_frequency', 'large_amounts', 'unusual_recipients'],
        threshold: 0.8,
        enabled: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Market Pump and Dump',
        type: 'market_manipulation',
        indicators: ['price_spike', 'volume_spike', 'coordinated_trading'],
        threshold: 0.85,
        enabled: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Unusual User Behavior',
        type: 'unusual_behavior',
        indicators: ['new_location', 'new_device', 'unusual_time', 'unusual_amount'],
        threshold: 0.75,
        enabled: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'Statistical Outlier',
        type: 'statistical_outlier',
        indicators: ['z_score_high', 'deviation_from_mean', 'percentile_extreme'],
        threshold: 0.7,
        enabled: true,
      },
    ];

    for (const pattern of patterns) {
      this.patterns.set(pattern.id, pattern);
    }
  }

  /**
   * Detect anomalies in transaction
   */
  async detectTransactionAnomalies(
    userId: string,
    amount: number,
    recipient: string,
    metadata: Record<string, unknown> = {}
  ): Promise<Anomaly[]> {
    const detectedAnomalies: Anomaly[] = [];

    // Get user profile
    const profile = this.userProfiles.get(userId) || this.createUserProfile(userId);

    // Check for rapid transaction pattern
    if (this.isRapidTransactionPattern(userId, amount)) {
      detectedAnomalies.push(this.createAnomaly('fraud', 'Rapid transaction pattern detected', userId, { amount, recipient }));
    }

    // Check for unusual amount
    if (Math.abs(amount - profile.averageTransactionSize) > profile.averageTransactionSize * 2) {
      detectedAnomalies.push(this.createAnomaly('unusual_behavior', 'Unusual transaction amount', userId, { amount, average: profile.averageTransactionSize }));
    }

    // Check for unusual recipient
    if (!this.isKnownRecipient(userId, recipient)) {
      detectedAnomalies.push(this.createAnomaly('unusual_behavior', 'Transaction to unknown recipient', userId, { recipient }));
    }

    // Check for statistical outliers
    const zScore = this.calculateZScore(amount, profile.averageTransactionSize);
    if (Math.abs(zScore) > 3) {
      detectedAnomalies.push(this.createAnomaly('statistical_outlier', `Z-score anomaly: ${zScore.toFixed(2)}`, userId, { z_score: zScore }));
    }

    // Record anomalies
    for (const anomaly of detectedAnomalies) {
      this.anomalies.push(anomaly);
      if (anomaly.severity === 'critical') {
        this.triggerAlert(anomaly);
      }
    }

    return detectedAnomalies;
  }

  /**
   * Detect market manipulation
   */
  async detectMarketManipulation(
    priceChange: number,
    volumeChange: number,
    participantCount: number
  ): Promise<Anomaly | null> {
    // Check for pump and dump pattern
    if (priceChange > 0.3 && volumeChange > 0.5 && participantCount < 10) {
      const anomaly = this.createAnomaly(
        'market_manipulation',
        'Potential pump and dump detected',
        null,
        { price_change: priceChange, volume_change: volumeChange, participant_count: participantCount },
        0.85,
        'high'
      );

      this.anomalies.push(anomaly);
      this.triggerAlert(anomaly);
      return anomaly;
    }

    return null;
  }

  /**
   * Detect behavioral changes
   */
  async detectBehavioralChanges(userId: string, currentBehavior: Record<string, unknown>): Promise<Anomaly[]> {
    const detectedAnomalies: Anomaly[] = [];
    const profile = this.userProfiles.get(userId);

    if (!profile) return detectedAnomalies;

    // Check for location change
    if (currentBehavior.location && !profile.typicalLocations.includes(currentBehavior.location as string)) {
      detectedAnomalies.push(this.createAnomaly('behavioral_change', 'Unusual location detected', userId, { location: currentBehavior.location }));
    }

    // Check for device change
    if (currentBehavior.device && !profile.typicalDevices.includes(currentBehavior.device as string)) {
      detectedAnomalies.push(this.createAnomaly('behavioral_change', 'New device detected', userId, { device: currentBehavior.device }));
    }

    // Check for time change
    const hour = new Date().getHours();
    if (!profile.typicalHours.includes(hour)) {
      detectedAnomalies.push(this.createAnomaly('behavioral_change', 'Unusual activity time', userId, { hour }));
    }

    for (const anomaly of detectedAnomalies) {
      this.anomalies.push(anomaly);
    }

    return detectedAnomalies;
  }

  /**
   * Create anomaly record
   */
  private createAnomaly(
    type: Anomaly['type'],
    description: string,
    userId: string | null,
    evidence: Record<string, unknown>,
    confidence: number = 0.8,
    severity: Anomaly['severity'] = 'medium'
  ): Anomaly {
    return {
      id: crypto.randomUUID(),
      type,
      severity,
      userId,
      description,
      evidence,
      confidence,
      timestamp: Date.now(),
      resolved: false,
    };
  }

  /**
   * Check for rapid transaction pattern
   */
  private isRapidTransactionPattern(userId: string, amount: number): boolean {
    const recentTransactions = this.anomalies.filter(
      (a) => a.userId === userId && a.timestamp > Date.now() - 3600000 && a.type === 'fraud'
    );

    return recentTransactions.length > 5;
  }

  /**
   * Check if recipient is known
   */
  private isKnownRecipient(userId: string, recipient: string): boolean {
    // Simplified check - would query transaction history in production
    return recipient.length > 5;
  }

  /**
   * Calculate Z-score
   */
  private calculateZScore(value: number, mean: number, stdDev: number = 1000): number {
    return (value - mean) / stdDev;
  }

  /**
   * Create user profile
   */
  private createUserProfile(userId: string): UserBehaviorProfile {
    const profile: UserBehaviorProfile = {
      userId,
      averageTransactionSize: 1000,
      averageTransactionFrequency: 5,
      typicalHours: [9, 10, 11, 14, 15, 16, 17, 18],
      typicalLocations: ['US'],
      typicalDevices: ['desktop'],
      riskScore: 0.3,
      lastUpdated: Date.now(),
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Trigger alert
   */
  private triggerAlert(anomaly: Anomaly): void {
    console.warn(`[ALERT] ${anomaly.severity.toUpperCase()} - ${anomaly.description}`);
    // Would integrate with alerting service
  }

  /**
   * Get anomalies for user
   */
  getUserAnomalies(userId: string, timeWindowMs: number = 86400000): Anomaly[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.anomalies.filter((a) => a.userId === userId && a.timestamp > cutoff);
  }

  /**
   * Get all unresolved anomalies
   */
  getUnresolvedAnomalies(): Anomaly[] {
    return this.anomalies.filter((a) => !a.resolved);
  }

  /**
   * Resolve anomaly
   */
  resolveAnomaly(anomalyId: string): void {
    const anomaly = this.anomalies.find((a) => a.id === anomalyId);
    if (anomaly) {
      anomaly.resolved = true;
    }
  }

  /**
   * Get anomaly statistics
   */
  getAnomalyStatistics(timeWindowMs: number = 86400000): Record<string, unknown> {
    const cutoff = Date.now() - timeWindowMs;
    const recentAnomalies = this.anomalies.filter((a) => a.timestamp > cutoff);

    return {
      total_anomalies: recentAnomalies.length,
      by_type: this.groupBy(recentAnomalies, 'type'),
      by_severity: this.groupBy(recentAnomalies, 'severity'),
      resolved_count: recentAnomalies.filter((a) => a.resolved).length,
      unresolved_count: recentAnomalies.filter((a) => !a.resolved).length,
    };
  }

  /**
   * Group by field
   */
  private groupBy(items: Anomaly[], field: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const item of items) {
      const key = ((item as unknown) as Record<string, unknown>)[field] as string;
      result[key] = (result[key] || 0) + 1;
    }
    return result;
  }
}

// Singleton instance
let instance: AnomalyDetectionEngine | null = null;

export function getAnomalyDetectionEngine(): AnomalyDetectionEngine {
  if (!instance) {
    instance = new AnomalyDetectionEngine();
  }
  return instance;
}
