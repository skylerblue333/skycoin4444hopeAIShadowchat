import { z } from 'zod';

/**
 * Adaptive Roadmap Engine
 * Dynamic prioritization based on:
 * - User feedback volume
 * - Revenue potential
 * - Technical cost
 * - Strategic alignment
 * - Outcome simulation
 */

export interface RoadmapItem {
  id: string;
  name: string;
  description: string;
  currentPriority: number; // 1-10
  dynamicPriority: number; // 1-10 (updated based on signals)
  feedbackScore: number; // 0-1
  revenueScore: number; // 0-1
  technicalCostScore: number; // 0-1 (lower is better)
  strategicAlignmentScore: number; // 0-1
  estimatedImpact: string; // 'high', 'medium', 'low'
  outcomePrediction?: {
    retentionImpact: number; // -1 to +1
    revenueImpact: number; // -1 to +1
    engagementImpact: number; // -1 to +1
  };
}

export interface RoadmapMetrics {
  totalItems: number;
  highPriorityCount: number;
  averageFeedbackScore: number;
  averageRevenueScore: number;
  averageTechnicalCost: number;
  averageStrategicAlignment: number;
  lastUpdated: Date;
}

export class AdaptiveRoadmapEngine {
  private roadmapItems: RoadmapItem[] = [];

  constructor() {
    this.initializeSampleRoadmap();
  }

  /**
   * Initialize sample roadmap
   */
  private initializeSampleRoadmap(): void {
    this.roadmapItems = [
      {
        id: 'item_1',
        name: 'Mobile App',
        description: 'Native iOS and Android apps',
        currentPriority: 7,
        dynamicPriority: 9,
        feedbackScore: 0.85,
        revenueScore: 0.9,
        technicalCostScore: 0.7,
        strategicAlignmentScore: 0.95,
        estimatedImpact: 'high',
        outcomePrediction: {
          retentionImpact: 0.3,
          revenueImpact: 0.4,
          engagementImpact: 0.35,
        },
      },
      {
        id: 'item_2',
        name: 'AI Personalization',
        description: 'Personalized recommendations for each user',
        currentPriority: 5,
        dynamicPriority: 8,
        feedbackScore: 0.75,
        revenueScore: 0.8,
        technicalCostScore: 0.6,
        strategicAlignmentScore: 0.85,
        estimatedImpact: 'high',
        outcomePrediction: {
          retentionImpact: 0.25,
          revenueImpact: 0.3,
          engagementImpact: 0.4,
        },
      },
      {
        id: 'item_3',
        name: 'Enterprise API',
        description: 'REST API for enterprise customers',
        currentPriority: 4,
        dynamicPriority: 6,
        feedbackScore: 0.6,
        revenueScore: 0.85,
        technicalCostScore: 0.5,
        strategicAlignmentScore: 0.7,
        estimatedImpact: 'medium',
        outcomePrediction: {
          retentionImpact: 0.1,
          revenueImpact: 0.5,
          engagementImpact: 0.05,
        },
      },
      {
        id: 'item_4',
        name: 'Community Features',
        description: 'User forums, discussions, and collaboration',
        currentPriority: 3,
        dynamicPriority: 7,
        feedbackScore: 0.9,
        revenueScore: 0.5,
        technicalCostScore: 0.4,
        strategicAlignmentScore: 0.8,
        estimatedImpact: 'medium',
        outcomePrediction: {
          retentionImpact: 0.4,
          revenueImpact: 0.15,
          engagementImpact: 0.5,
        },
      },
    ];
  }

  /**
   * Get prioritized roadmap (sorted by dynamic priority)
   */
  async getPrioritizedRoadmap(): Promise<RoadmapItem[]> {
    // Update dynamic priorities based on current signals
    this.updateDynamicPriorities();

    // Sort by dynamic priority (descending)
    return [...this.roadmapItems].sort((a, b) => b.dynamicPriority - a.dynamicPriority);
  }

  /**
   * Update dynamic priorities based on feedback and signals
   */
  private updateDynamicPriorities(): void {
    this.roadmapItems.forEach((item) => {
      // Calculate weighted score
      const weights = {
        feedback: 0.3,
        revenue: 0.25,
        technical: 0.2,
        strategic: 0.25,
      };

      // Technical cost is inverted (lower cost = higher priority)
      const technicalScore = 1 - item.technicalCostScore;

      const weightedScore =
        item.feedbackScore * weights.feedback +
        item.revenueScore * weights.revenue +
        technicalScore * weights.technical +
        item.strategicAlignmentScore * weights.strategic;

      // Convert to 1-10 scale
      item.dynamicPriority = Math.round(weightedScore * 10);
    });
  }

  /**
   * Simulate outcome of shipping a feature
   */
  async simulateOutcome(itemId: string): Promise<any> {
    const item = this.roadmapItems.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');

    const prediction = item.outcomePrediction || {
      retentionImpact: 0,
      revenueImpact: 0,
      engagementImpact: 0,
    };

    return {
      itemId,
      itemName: item.name,
      timelineWeeks: Math.ceil((1 - item.technicalCostScore) * 12),
      prediction: {
        retentionImpact: `${(prediction.retentionImpact * 100).toFixed(0)}% improvement`,
        revenueImpact: `${(prediction.revenueImpact * 100).toFixed(0)}% increase`,
        engagementImpact: `${(prediction.engagementImpact * 100).toFixed(0)}% increase`,
        dau: `+${Math.round(prediction.retentionImpact * 1000)} DAU`,
        mau: `+${Math.round(prediction.engagementImpact * 3000)} MAU`,
      },
      riskFactors: [
        { factor: 'Technical complexity', severity: item.technicalCostScore > 0.7 ? 'high' : 'low' },
        { factor: 'Market demand', severity: item.feedbackScore > 0.8 ? 'low' : 'medium' },
        { factor: 'Resource availability', severity: 'medium' },
      ],
      recommendation: item.dynamicPriority >= 8 ? 'Ship immediately' : 'Schedule for next quarter',
    };
  }

  /**
   * Get roadmap metrics
   */
  async getRoadmapMetrics(): Promise<RoadmapMetrics> {
    const items = this.roadmapItems;

    return {
      totalItems: items.length,
      highPriorityCount: items.filter((i) => i.dynamicPriority >= 8).length,
      averageFeedbackScore: items.reduce((sum, i) => sum + i.feedbackScore, 0) / items.length,
      averageRevenueScore: items.reduce((sum, i) => sum + i.revenueScore, 0) / items.length,
      averageTechnicalCost: items.reduce((sum, i) => sum + i.technicalCostScore, 0) / items.length,
      averageStrategicAlignment:
        items.reduce((sum, i) => sum + i.strategicAlignmentScore, 0) / items.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Add feedback signal to update priorities
   */
  async addFeedbackSignal(itemId: string, feedbackScore: number): Promise<void> {
    const item = this.roadmapItems.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');

    // Update feedback score (weighted average)
    item.feedbackScore = (item.feedbackScore + feedbackScore) / 2;

    // Trigger priority update
    this.updateDynamicPriorities();

      }

  /**
   * Get roadmap changes (what reshuffled)
   */
  async getRoadmapChanges(): Promise<any> {
    return {
      timestamp: new Date(),
      changes: [
        {
          itemId: 'item_4',
          itemName: 'Community Features',
          previousPriority: 3,
          newPriority: 7,
          reason: 'High user feedback volume (0.9 score)',
          changeType: 'priority_increase',
        },
        {
          itemId: 'item_3',
          itemName: 'Enterprise API',
          previousPriority: 4,
          newPriority: 6,
          reason: 'Strong revenue potential (0.85 score)',
          changeType: 'priority_increase',
        },
      ],
    };
  }

  /**
   * Forecast roadmap for next quarter
   */
  async forecastRoadmap(quarterWeeks: number = 13): Promise<any> {
    const prioritized = await this.getPrioritizedRoadmap();
    let remainingWeeks = quarterWeeks;
    const forecast = [];

    for (const item of prioritized) {
      const estimatedWeeks = Math.ceil((1 - item.technicalCostScore) * 12);

      if (remainingWeeks >= estimatedWeeks) {
        forecast.push({
          itemId: item.id,
          itemName: item.name,
          estimatedWeeks,
          priority: item.dynamicPriority,
          status: 'scheduled',
        });
        remainingWeeks -= estimatedWeeks;
      } else {
        forecast.push({
          itemId: item.id,
          itemName: item.name,
          estimatedWeeks,
          priority: item.dynamicPriority,
          status: 'backlog',
        });
      }
    }

    return {
      quarterWeeks,
      utilizationRate: ((quarterWeeks - remainingWeeks) / quarterWeeks) * 100,
      scheduledItems: forecast.filter((f) => f.status === 'scheduled'),
      backlogItems: forecast.filter((f) => f.status === 'backlog'),
    };
  }
}

export const adaptiveRoadmapEngine = new AdaptiveRoadmapEngine();
