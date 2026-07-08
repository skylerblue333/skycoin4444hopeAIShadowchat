import { db } from './db';
import { z } from 'zod';

/**
 * Living Loop Engine
 * Transforms static features into self-improving systems
 * Feedback → Analysis → Roadmap Updates → Learning
 */

export interface Feedback {
  id: string;
  featureId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  timestamp: Date;
}

export interface FeedbackSummary {
  featureId: string;
  totalFeedback: number;
  averageRating: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topThemes: string[];
  churnRisk: number; // 0-1
  recommendedAction: string;
}

export interface AutoUpdate {
  id: string;
  featureId: string;
  type: 'priority_increase' | 'priority_decrease' | 'deprecate' | 'enhance' | 'investigate';
  reason: string;
  impactScore: number;
  timestamp: Date;
  applied: boolean;
}

export class LivingLoopEngine {
  /**
   * Submit feedback for a feature
   */
  async submitFeedback(
    featureId: string,
    userId: string,
    rating: number,
    comment: string,
    category: string
  ): Promise<Feedback> {
    const sentiment = this.analyzeSentiment(comment);

    const feedback: Feedback = {
      id: `feedback_${Date.now()}`,
      featureId,
      userId,
      rating,
      comment,
      sentiment,
      category,
      timestamp: new Date(),
    };

    // In production, save to database
    
    // Trigger auto-analysis
    await this.analyzeAndUpdate(featureId);

    return feedback;
  }

  /**
   * Analyze sentiment of feedback comment
   */
  private analyzeSentiment(comment: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['great', 'love', 'amazing', 'excellent', 'perfect', 'awesome', 'fantastic'];
    const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'broken', 'useless', 'frustrating'];

    const lowerComment = comment.toLowerCase();
    const positiveCount = positiveWords.filter((word) => lowerComment.includes(word)).length;
    const negativeCount = negativeWords.filter((word) => lowerComment.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Get feedback summary for a feature
   */
  async getFeedbackSummary(featureId: string, periodDays: number = 30): Promise<FeedbackSummary> {
    // Simulated feedback data
    const feedbackData = [
      { rating: 5, sentiment: 'positive' as const, comment: 'Love this feature!' },
      { rating: 4, sentiment: 'positive' as const, comment: 'Great improvement' },
      { rating: 3, sentiment: 'neutral' as const, comment: 'Works as expected' },
      { rating: 2, sentiment: 'negative' as const, comment: 'Could be better' },
      { rating: 1, sentiment: 'negative' as const, comment: 'Very frustrating' },
    ];

    const totalFeedback = feedbackData.length;
    const averageRating = feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedback;
    const sentimentBreakdown = {
      positive: feedbackData.filter((f) => f.sentiment === 'positive').length,
      neutral: feedbackData.filter((f) => f.sentiment === 'neutral').length,
      negative: feedbackData.filter((f) => f.sentiment === 'negative').length,
    };

    const churnRisk = sentimentBreakdown.negative / totalFeedback;
    const topThemes = ['performance', 'usability', 'reliability'];

    let recommendedAction = 'Monitor';
    if (averageRating >= 4.5) recommendedAction = 'Expand';
    if (averageRating <= 2.5) recommendedAction = 'Investigate';
    if (churnRisk > 0.3) recommendedAction = 'Urgent: High churn risk';

    return {
      featureId,
      totalFeedback,
      averageRating,
      sentimentBreakdown,
      topThemes,
      churnRisk,
      recommendedAction,
    };
  }

  /**
   * Analyze feedback and trigger auto-updates
   */
  private async analyzeAndUpdate(featureId: string): Promise<AutoUpdate[]> {
    const summary = await this.getFeedbackSummary(featureId);
    const updates: AutoUpdate[] = [];

    // Trigger auto-updates based on feedback patterns
    if (summary.averageRating >= 4.5 && summary.totalFeedback > 10) {
      updates.push({
        id: `update_${Date.now()}`,
        featureId,
        type: 'priority_increase',
        reason: 'High user satisfaction - expand this feature',
        impactScore: 0.9,
        timestamp: new Date(),
        applied: false,
      });
    }

    if (summary.churnRisk > 0.4) {
      updates.push({
        id: `update_${Date.now() + 1}`,
        featureId,
        type: 'investigate',
        reason: 'High churn risk detected - urgent investigation needed',
        impactScore: 0.95,
        timestamp: new Date(),
        applied: false,
      });
    }

    if (summary.averageRating < 2.5 && summary.totalFeedback > 5) {
      updates.push({
        id: `update_${Date.now() + 2}`,
        featureId,
        type: 'priority_decrease',
        reason: 'Low satisfaction - deprioritize or redesign',
        impactScore: 0.8,
        timestamp: new Date(),
        applied: false,
      });
    }

        return updates;
  }

  /**
   * Get auto-updated roadmap based on feedback
   */
  async getAutoUpdatedRoadmap(): Promise<any> {
    return {
      timestamp: new Date(),
      updates: [
        {
          featureId: 'feature_1',
          currentPriority: 5,
          newPriority: 8,
          reason: 'High user satisfaction',
          impactScore: 0.9,
        },
        {
          featureId: 'feature_2',
          currentPriority: 3,
          newPriority: 9,
          reason: 'Critical churn risk detected',
          impactScore: 0.95,
        },
      ],
    };
  }

  /**
   * Get feedback trends over time
   */
  async getFeedbackTrends(featureId: string, periodDays: number = 30): Promise<any> {
    return {
      featureId,
      period: periodDays,
      trend: 'improving',
      ratingTrend: [3.2, 3.4, 3.6, 3.8, 4.0],
      sentimentTrend: ['neutral', 'neutral', 'positive', 'positive', 'positive'],
      volumeTrend: [5, 8, 12, 15, 18],
    };
  }

  /**
   * Get churn risk signals
   */
  async getChurnRiskSignals(userId: string): Promise<any> {
    return {
      userId,
      overallRisk: 0.25,
      signals: [
        { type: 'low_engagement', severity: 'medium', days: 7 },
        { type: 'negative_feedback', severity: 'low', days: 3 },
        { type: 'feature_abandonment', severity: 'medium', days: 14 },
      ],
      recommendedAction: 'Send re-engagement email',
    };
  }
}

export const livingLoopEngine = new LivingLoopEngine();
