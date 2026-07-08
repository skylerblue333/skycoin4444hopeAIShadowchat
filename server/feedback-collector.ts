import crypto from 'crypto';
/**
 * Feedback Collector
 * Collects feedback from all sources and feeds into Living Loop Engine
 */

export interface FeedbackEntry {
  id: string;
  featureId: string;
  userId: string;
  rating: number;
  comment: string;
  category: 'feature_quality' | 'user_experience' | 'performance' | 'other';
  timestamp: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export class FeedbackCollector {
  private feedbackStore: Map<string, FeedbackEntry[]> = new Map();

  async collectFeedback(entry: Omit<FeedbackEntry, 'id' | 'timestamp'>): Promise<FeedbackEntry> {
    const feedback: FeedbackEntry = {
      ...entry,
      id: `feedback_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sentiment: await this.analyzeSentiment(entry.comment),
    };

    const key = entry.featureId;
    if (!this.feedbackStore.has(key)) {
      this.feedbackStore.set(key, []);
    }
    this.feedbackStore.get(key)!.push(feedback);

    return feedback;
  }

  async getFeedbackForFeature(featureId: string, periodDays: number = 30): Promise<FeedbackEntry[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    return (this.feedbackStore.get(featureId) || []).filter(
      (f) => f.timestamp >= cutoffDate
    );
  }

  async analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    const positiveWords = ['great', 'excellent', 'love', 'amazing', 'perfect', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'broken', 'useless'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  async getAverageSentiment(featureId: string): Promise<number> {
    const feedback = this.feedbackStore.get(featureId) || [];
    if (feedback.length === 0) return 0;

    const sum = feedback.reduce((acc, f) => {
      if (f.sentiment === 'positive') return acc + 1;
      if (f.sentiment === 'negative') return acc - 1;
      return acc;
    }, 0);

    return sum / feedback.length;
  }

  async getTrends(featureId: string, periodDays: number = 30): Promise<any> {
    const feedback = await this.getFeedbackForFeature(featureId, periodDays);
    
    return {
      totalFeedback: feedback.length,
      averageRating: feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
        : 0,
      sentimentBreakdown: {
        positive: feedback.filter(f => f.sentiment === 'positive').length,
        neutral: feedback.filter(f => f.sentiment === 'neutral').length,
        negative: feedback.filter(f => f.sentiment === 'negative').length,
      },
      topCategories: this.getTopCategories(feedback),
    };
  }

  private getTopCategories(feedback: FeedbackEntry[]): Record<string, number> {
    const counts: Record<string, number> = {};
    feedback.forEach(f => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return counts;
  }
}

export const feedbackCollector = new FeedbackCollector();
