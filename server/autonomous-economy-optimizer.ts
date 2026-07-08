import crypto from 'crypto';
import { getDb } from './db';

/**
 * Autonomous Economy Optimization Engine
 * 
 * Capabilities:
 * - Self-adjusting token sinks and sources
 * - Dynamic fee rebalancing
 * - Incentive optimization
 * - Supply/demand balancing
 * - Automated economic policy
 * - Price stability mechanisms
 */

interface EconomicPolicy {
  id: string;
  emissionRate: number;
  sinkRate: number;
  transactionFee: number;
  stakingReward: number;
  governanceFee: number;
  creatorReward: number;
  timestamp: number;
}

interface EconomicMetrics {
  tokenPrice: number;
  priceVolatility: number;
  supplyGrowth: number;
  demandGrowth: number;
  transactionVolume: number;
  activeUsers: number;
  marketHealth: number;
}

interface OptimizationAction {
  id: string;
  type: 'adjust_emission' | 'adjust_sink' | 'adjust_fee' | 'adjust_reward' | 'emergency_brake';
  parameter: string;
  oldValue: number;
  newValue: number;
  reason: string;
  impact: number;
  timestamp: number;
}

export class AutonomousEconomyOptimizer {
  private currentPolicy: EconomicPolicy;
  private policyHistory: EconomicPolicy[] = [];
  private optimizationActions: OptimizationAction[] = [];
  private metricsHistory: EconomicMetrics[] = [];

  constructor() {
    this.currentPolicy = this.getDefaultPolicy();
  }

  /**
   * Get default economic policy
   */
  private getDefaultPolicy(): EconomicPolicy {
    return {
      id: crypto.randomUUID(),
      emissionRate: 0.001, // 0.1% daily
      sinkRate: 0.0008, // 0.08% daily
      transactionFee: 0.001, // 0.1%
      stakingReward: 0.05, // 5% APY
      governanceFee: 0.0005, // 0.05%
      creatorReward: 0.02, // 2%
      timestamp: Date.now(),
    };
  }

  /**
   * Optimize economy based on current metrics
   */
  async optimizeEconomy(metrics: EconomicMetrics): Promise<OptimizationAction[]> {
    const actions: OptimizationAction[] = [];
    this.metricsHistory.push(metrics);

    // Check price stability
    if (metrics.priceVolatility > 0.2) {
      actions.push(await this.adjustEmissionForStability(metrics));
    }

    // Check supply/demand balance
    if (metrics.supplyGrowth > metrics.demandGrowth * 1.5) {
      actions.push(await this.increaseSinkRate(metrics));
    } else if (metrics.demandGrowth > metrics.supplyGrowth * 1.5) {
      actions.push(await this.increaseEmissionRate(metrics));
    }

    // Check transaction volume
    if (metrics.transactionVolume > 1000000) {
      actions.push(await this.adjustTransactionFee(metrics));
    }

    // Check user engagement
    if (metrics.activeUsers < 5000) {
      actions.push(await this.increaseStakingReward(metrics));
    }

    // Check market health
    if (metrics.marketHealth < 0.5) {
      actions.push(await this.triggerEmergencyBrake(metrics));
    }

    // Apply actions
    for (const action of actions) {
      await this.applyAction(action);
      this.optimizationActions.push(action);
    }

    return actions;
  }

  /**
   * Adjust emission for price stability
   */
  private async adjustEmissionForStability(metrics: EconomicMetrics): Promise<OptimizationAction> {
    const oldEmission = this.currentPolicy.emissionRate;
    let newEmission = oldEmission;

    if (metrics.tokenPrice > 5.0) {
      // Price too high, reduce emission
      newEmission = Math.max(0.0005, oldEmission * 0.9);
    } else if (metrics.tokenPrice < 3.0) {
      // Price too low, increase emission
      newEmission = Math.min(0.002, oldEmission * 1.1);
    }

    return {
      id: crypto.randomUUID(),
      type: 'adjust_emission',
      parameter: 'emissionRate',
      oldValue: oldEmission,
      newValue: newEmission,
      reason: `Price volatility ${(metrics.priceVolatility * 100).toFixed(1)}% - stabilizing supply`,
      impact: Math.abs(newEmission - oldEmission),
      timestamp: Date.now(),
    };
  }

  /**
   * Increase sink rate
   */
  private async increaseSinkRate(metrics: EconomicMetrics): Promise<OptimizationAction> {
    const oldSink = this.currentPolicy.sinkRate;
    const newSink = Math.min(0.002, oldSink * 1.15);

    return {
      id: crypto.randomUUID(),
      type: 'adjust_sink',
      parameter: 'sinkRate',
      oldValue: oldSink,
      newValue: newSink,
      reason: `Supply growth ${(metrics.supplyGrowth * 100).toFixed(1)}% exceeds demand - increasing sinks`,
      impact: newSink - oldSink,
      timestamp: Date.now(),
    };
  }

  /**
   * Increase emission rate
   */
  private async increaseEmissionRate(metrics: EconomicMetrics): Promise<OptimizationAction> {
    const oldEmission = this.currentPolicy.emissionRate;
    const newEmission = Math.min(0.003, oldEmission * 1.1);

    return {
      id: crypto.randomUUID(),
      type: 'adjust_emission',
      parameter: 'emissionRate',
      oldValue: oldEmission,
      newValue: newEmission,
      reason: `Demand growth ${(metrics.demandGrowth * 100).toFixed(1)}% exceeds supply - increasing emission`,
      impact: newEmission - oldEmission,
      timestamp: Date.now(),
    };
  }

  /**
   * Adjust transaction fee
   */
  private async adjustTransactionFee(metrics: EconomicMetrics): Promise<OptimizationAction> {
    const oldFee = this.currentPolicy.transactionFee;
    const newFee = Math.min(0.005, oldFee * 1.05);

    return {
      id: crypto.randomUUID(),
      type: 'adjust_fee',
      parameter: 'transactionFee',
      oldValue: oldFee,
      newValue: newFee,
      reason: `High transaction volume ${metrics.transactionVolume.toLocaleString()} - optimizing fees`,
      impact: newFee - oldFee,
      timestamp: Date.now(),
    };
  }

  /**
   * Increase staking reward
   */
  private async increaseStakingReward(metrics: EconomicMetrics): Promise<OptimizationAction> {
    const oldReward = this.currentPolicy.stakingReward;
    const newReward = Math.min(0.15, oldReward * 1.2);

    return {
      id: crypto.randomUUID(),
      type: 'adjust_reward',
      parameter: 'stakingReward',
      oldValue: oldReward,
      newValue: newReward,
      reason: `Low user engagement ${metrics.activeUsers} - increasing staking incentives`,
      impact: newReward - oldReward,
      timestamp: Date.now(),
    };
  }

  /**
   * Trigger emergency brake
   */
  private async triggerEmergencyBrake(metrics: EconomicMetrics): Promise<OptimizationAction> {
    const oldEmission = this.currentPolicy.emissionRate;
    const newEmission = 0.0001; // Minimal emission

    return {
      id: crypto.randomUUID(),
      type: 'emergency_brake',
      parameter: 'emissionRate',
      oldValue: oldEmission,
      newValue: newEmission,
      reason: `Market health critical ${(metrics.marketHealth * 100).toFixed(1)}% - emergency measures activated`,
      impact: newEmission - oldEmission,
      timestamp: Date.now(),
    };
  }

  /**
   * Apply optimization action
   */
  private async applyAction(action: OptimizationAction): Promise<void> {
    switch (action.parameter) {
      case 'emissionRate':
        this.currentPolicy.emissionRate = action.newValue;
        break;
      case 'sinkRate':
        this.currentPolicy.sinkRate = action.newValue;
        break;
      case 'transactionFee':
        this.currentPolicy.transactionFee = action.newValue;
        break;
      case 'stakingReward':
        this.currentPolicy.stakingReward = action.newValue;
        break;
      case 'governanceFee':
        this.currentPolicy.governanceFee = action.newValue;
        break;
      case 'creatorReward':
        this.currentPolicy.creatorReward = action.newValue;
        break;
    }

    this.currentPolicy.timestamp = Date.now();

    // Persist to database
    const db = await getDb();
    if (db) {
      // Would insert into economic_policies table
    }
  }

  /**
   * Calculate market health score
   */
  calculateMarketHealth(metrics: EconomicMetrics): number {
    const priceStability = Math.max(0, 1 - metrics.priceVolatility);
    const supplyBalance = Math.max(0, 1 - Math.abs(metrics.supplyGrowth - metrics.demandGrowth) / 2);
    const userEngagement = Math.min(1, metrics.activeUsers / 10000);
    const volumeHealth = Math.min(1, metrics.transactionVolume / 5000000);

    return (priceStability * 0.3 + supplyBalance * 0.3 + userEngagement * 0.2 + volumeHealth * 0.2);
  }

  /**
   * Get current policy
   */
  getCurrentPolicy(): EconomicPolicy {
    return this.currentPolicy;
  }

  /**
   * Get policy history
   */
  getPolicyHistory(): EconomicPolicy[] {
    return this.policyHistory;
  }

  /**
   * Get optimization actions
   */
  getOptimizationActions(): OptimizationAction[] {
    return this.optimizationActions;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): EconomicMetrics[] {
    return this.metricsHistory;
  }

  /**
   * Predict next policy adjustment
   */
  predictNextAdjustment(metrics: EconomicMetrics): string {
    if (metrics.priceVolatility > 0.2) {
      return 'Emission rate adjustment expected for price stability';
    }
    if (metrics.supplyGrowth > metrics.demandGrowth * 1.5) {
      return 'Sink rate increase expected to balance supply';
    }
    if (metrics.activeUsers < 5000) {
      return 'Staking reward increase expected to boost engagement';
    }
    return 'Economy is balanced - no major adjustments expected';
  }
}

// Singleton instance
let instance: AutonomousEconomyOptimizer | null = null;

export function getAutonomousEconomyOptimizer(): AutonomousEconomyOptimizer {
  if (!instance) {
    instance = new AutonomousEconomyOptimizer();
  }
  return instance;
}
