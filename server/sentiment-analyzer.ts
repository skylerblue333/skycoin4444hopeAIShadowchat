/**
 * Sentiment Analyzer
 * Analyzes user sentiment and emotions from feedback
 */

export interface SentimentScore {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  emotions: string[];
  confidence: number;
}

export class SentimentAnalyzer {
  private positiveWords = [
    'great', 'excellent', 'love', 'amazing', 'perfect', 'awesome', 'wonderful',
    'fantastic', 'brilliant', 'outstanding', 'superb', 'delighted', 'thrilled',
  ];

  private negativeWords = [
    'bad', 'terrible', 'hate', 'awful', 'broken', 'useless', 'horrible',
    'disappointing', 'frustrated', 'angry', 'annoyed', 'disgusted', 'furious',
  ];

  private emotionKeywords: Record<string, string[]> = {
    joy: ['happy', 'joy', 'delighted', 'thrilled', 'excited'],
    frustration: ['frustrated', 'annoyed', 'irritated', 'exasperated'],
    anger: ['angry', 'furious', 'enraged', 'livid'],
    sadness: ['sad', 'depressed', 'unhappy', 'miserable'],
    trust: ['trust', 'reliable', 'dependable', 'confident'],
    fear: ['scared', 'afraid', 'worried', 'anxious'],
  };

  async analyzeSentiment(text: string): Promise<SentimentScore> {
    const lowerText = text.toLowerCase();
    
    const positiveCount = this.positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = this.negativeWords.filter(w => lowerText.includes(w)).length;

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let score = 0;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min(positiveCount / 10, 1);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = -Math.min(negativeCount / 10, 1);
    }

    const emotions = this.detectEmotions(lowerText);
    const confidence = this.calculateConfidence(positiveCount, negativeCount, text.length);

    return {
      text,
      sentiment,
      score,
      emotions,
      confidence,
    };
  }

  private detectEmotions(text: string): string[] {
    const detectedEmotions: string[] = [];

    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        detectedEmotions.push(emotion);
      }
    }

    return detectedEmotions;
  }

  private calculateConfidence(positive: number, negative: number, textLength: number): number {
    const wordCount = textLength / 5; // Rough estimate
    const signalStrength = (positive + negative) / Math.max(wordCount / 10, 1);
    return Math.min(signalStrength / 10, 1);
  }

  async analyzeBatch(texts: string[]): Promise<SentimentScore[]> {
    return Promise.all(texts.map(text => this.analyzeSentiment(text)));
  }

  async getSentimentTrend(texts: string[]): Promise<any> {
    const scores = await this.analyzeBatch(texts);
    const positive = scores.filter(s => s.sentiment === 'positive').length;
    const negative = scores.filter(s => s.sentiment === 'negative').length;
    const neutral = scores.filter(s => s.sentiment === 'neutral').length;

    return {
      totalAnalyzed: scores.length,
      breakdown: {
        positive: (positive / scores.length) * 100,
        neutral: (neutral / scores.length) * 100,
        negative: (negative / scores.length) * 100,
      },
      averageScore: scores.reduce((sum, s) => sum + s.score, 0) / scores.length,
      dominantEmotion: this.getDominantEmotion(scores),
      trend: this.calculateTrend(scores),
    };
  }

  private getDominantEmotion(scores: SentimentScore[]): string {
    const emotionCounts: Record<string, number> = {};
    scores.forEach(s => {
      s.emotions.forEach(e => {
        emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      });
    });

    let dominant = 'neutral';
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        dominant = emotion;
        maxCount = count;
      }
    }
    return dominant;
  }

  private calculateTrend(scores: SentimentScore[]): string {
    if (scores.length < 2) return 'insufficient_data';
    
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    if (avgScore > 0.3) return 'improving';
    if (avgScore < -0.3) return 'declining';
    return 'stable';
  }
}

export const sentimentAnalyzer = new SentimentAnalyzer();
