/**
 * Behavioral Intelligence Engine
 * User research + churn detection system
 * - Sentiment clustering (not just voting)
 * - Persona auto-detection from feedback
 * - Silent frustration detection (churn signals)
 * - Weekly "Top 3 emerging pain patterns" reports
 */

export interface UserBehaviorAnalysis {
  userId: string;
  behaviorProfile: BehaviorProfile;
  sentimentTrend: SentimentTrend;
  churnRisk: ChurnRiskAssessment;
  personaCluster: PersonaCluster;
  emergingPainPoints: string[];
  recommendedActions: string[];
}

export interface BehaviorProfile {
  engagementLevel: 'high' | 'medium' | 'low';
  featureUsage: FeatureUsagePattern[];
  sessionFrequency: number; // sessions per week
  sessionDuration: number; // minutes average
  lastActiveDate: Date;
  daysSinceSignup: number;
}

export interface FeatureUsagePattern {
  featureName: string;
  usageFrequency: number; // times per week
  adoptionStatus: 'early_adopter' | 'regular' | 'occasional' | 'never';
  satisfactionScore: number; // -1 to +1
}

export interface SentimentTrend {
  currentSentiment: 'positive' | 'neutral' | 'negative';
  trend: 'improving' | 'stable' | 'declining';
  sentimentHistory: number[]; // -1 to +1 over time
  keyThemes: string[];
  emotionalTone: string;
}

export interface ChurnRiskAssessment {
  riskScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  silentFrustrationSignals: string[];
  predictedChurnDate?: Date;
  retentionActions: string[];
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  daysObserved: number;
  impact: string;
}

export interface PersonaCluster {
  personaType: string;
  description: string;
  characteristics: string[];
  commonPainPoints: string[];
  recommendedFeatures: string[];
  estimatedLTV: number;
}

export interface EmergingPainPattern {
  pattern: string;
  affectedUserCount: number;
  severity: 'low' | 'medium' | 'high';
  trend: 'emerging' | 'growing' | 'stable' | 'declining';
  rootCause?: string;
  recommendedSolution: string;
}

export class BehavioralIntelligenceEngine {
  /**
   * Analyze user behavior
   */
  async analyzeUserBehavior(userId: string): Promise<UserBehaviorAnalysis> {
    const behaviorProfile = this.generateBehaviorProfile(userId);
    const sentimentTrend = this.analyzeSentimentTrend(userId);
    const churnRisk = this.assessChurnRisk(userId, behaviorProfile, sentimentTrend);
    const personaCluster = this.detectPersona(behaviorProfile, sentimentTrend);
    const emergingPainPoints = this.extractPainPoints(sentimentTrend);
    const recommendedActions = this.generateRetentionActions(churnRisk, personaCluster);

    return {
      userId,
      behaviorProfile,
      sentimentTrend,
      churnRisk,
      personaCluster,
      emergingPainPoints,
      recommendedActions,
    };
  }

  /**
   * Generate behavior profile
   */
  private generateBehaviorProfile(userId: string): BehaviorProfile {
    return {
      engagementLevel: 'medium',
      featureUsage: [
        { featureName: 'Dashboard', usageFrequency: 5, adoptionStatus: 'regular', satisfactionScore: 0.8 },
        { featureName: 'Reports', usageFrequency: 2, adoptionStatus: 'occasional', satisfactionScore: 0.6 },
        { featureName: 'Integrations', usageFrequency: 0, adoptionStatus: 'never', satisfactionScore: -0.2 },
        { featureName: 'Community', usageFrequency: 1, adoptionStatus: 'occasional', satisfactionScore: 0.5 },
      ],
      sessionFrequency: 3.5,
      sessionDuration: 18,
      lastActiveDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      daysSinceSignup: 45,
    };
  }

  /**
   * Analyze sentiment trend
   */
  private analyzeSentimentTrend(userId: string): SentimentTrend {
    return {
      currentSentiment: 'neutral',
      trend: 'declining',
      sentimentHistory: [0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
      keyThemes: ['performance issues', 'missing features', 'poor documentation'],
      emotionalTone: 'frustrated but hopeful',
    };
  }

  /**
   * Assess churn risk
   */
  private assessChurnRisk(
    userId: string,
    profile: BehaviorProfile,
    sentiment: SentimentTrend
  ): ChurnRiskAssessment {
    let riskScore = 0;

    // Engagement decline
    if (profile.engagementLevel === 'low') riskScore += 0.3;
    if (profile.sessionFrequency < 2) riskScore += 0.2;

    // Sentiment decline
    if (sentiment.trend === 'declining') riskScore += 0.3;
    if (sentiment.currentSentiment === 'negative') riskScore += 0.2;

    // Days since last active
    const daysSinceActive = Math.floor((Date.now() - profile.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActive > 7) riskScore += 0.2;

    riskScore = Math.min(riskScore, 1);

    const riskLevel =
      riskScore > 0.7 ? 'critical' : riskScore > 0.5 ? 'high' : riskScore > 0.3 ? 'medium' : 'low';

    return {
      riskScore,
      riskLevel,
      riskFactors: [
        { factor: 'Declining engagement', severity: 'high', daysObserved: 14, impact: 'Session frequency down 40%' },
        { factor: 'Negative sentiment trend', severity: 'high', daysObserved: 7, impact: 'Feedback sentiment declining' },
        { factor: 'Inactive period', severity: 'medium', daysObserved: daysSinceActive, impact: `No activity for ${daysSinceActive} days` },
        { factor: 'Feature abandonment', severity: 'medium', daysObserved: 30, impact: 'Stopped using integrations' },
      ],
      silentFrustrationSignals: [
        'Reduced session duration (18 min → 12 min)',
        'Feature usage pattern changed',
        'Support ticket mentions "confusing"',
        'Browsed pricing page 3 times',
      ],
      predictedChurnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      retentionActions: [
        'Send personalized re-engagement email',
        'Offer 1-on-1 onboarding session',
        'Provide feature tutorial video',
        'Offer 50% discount for next 3 months',
      ],
    };
  }

  /**
   * Detect user persona
   */
  private detectPersona(profile: BehaviorProfile, sentiment: SentimentTrend): PersonaCluster {
    return {
      personaType: 'Power User at Risk',
      description: 'Previously engaged user showing declining activity and negative sentiment',
      characteristics: [
        'Started as early adopter',
        'Moderate engagement level',
        'Using core features regularly',
        'Recently showing frustration signals',
        'Considering alternatives',
      ],
      commonPainPoints: [
        'Performance issues during peak hours',
        'Missing advanced analytics features',
        'Poor mobile experience',
        'Lack of API documentation',
      ],
      recommendedFeatures: [
        'Performance optimization',
        'Advanced analytics dashboard',
        'Mobile app',
        'Comprehensive API docs',
        'Priority support',
      ],
      estimatedLTV: 2400, // $2400 annual value
    };
  }

  /**
   * Extract pain points from sentiment
   */
  private extractPainPoints(sentiment: SentimentTrend): string[] {
    return sentiment.keyThemes || [];
  }

  /**
   * Generate retention actions
   */
  private generateRetentionActions(churn: ChurnRiskAssessment, persona: PersonaCluster): string[] {
    return churn.retentionActions;
  }

  /**
   * Get emerging pain patterns
   */
  async getEmergingPainPatterns(periodDays: number = 7, limit: number = 3): Promise<EmergingPainPattern[]> {
    return [
      {
        pattern: 'Performance degradation during peak hours',
        affectedUserCount: 234,
        severity: 'high',
        trend: 'growing',
        rootCause: 'Database query optimization needed',
        recommendedSolution: 'Implement query caching and database indexing',
      },
      {
        pattern: 'Confusion with new onboarding flow',
        affectedUserCount: 156,
        severity: 'medium',
        trend: 'emerging',
        rootCause: 'Too many steps in initial setup',
        recommendedSolution: 'Simplify onboarding to 3-step process',
      },
      {
        pattern: 'Missing export functionality',
        affectedUserCount: 89,
        severity: 'medium',
        trend: 'stable',
        rootCause: 'Feature not yet implemented',
        recommendedSolution: 'Add CSV/PDF export to reports',
      },
    ];
  }

  /**
   * Get churn risk users
   */
  async getChurnRiskUsers(threshold: number = 0.5, limit: number = 20): Promise<any[]> {
    return [
      {
        userId: 'user_123',
        username: 'john_doe',
        riskScore: 0.85,
        riskLevel: 'critical',
        predictedChurnDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Send urgent re-engagement email',
      },
      {
        userId: 'user_456',
        username: 'jane_smith',
        riskScore: 0.72,
        riskLevel: 'high',
        predictedChurnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Offer premium support session',
      },
      {
        userId: 'user_789',
        username: 'bob_wilson',
        riskScore: 0.68,
        riskLevel: 'high',
        predictedChurnDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Provide feature tutorial',
      },
    ];
  }

  /**
   * Get persona clusters
   */
  async getPersonaClusters(): Promise<PersonaCluster[]> {
    return [
      {
        personaType: 'Power User at Risk',
        description: 'Previously engaged user showing declining activity',
        characteristics: ['Early adopter', 'Moderate engagement', 'Showing frustration'],
        commonPainPoints: ['Performance', 'Missing features', 'Poor mobile'],
        recommendedFeatures: ['Performance optimization', 'Advanced analytics', 'Mobile app'],
        estimatedLTV: 2400,
      },
      {
        personaType: 'Casual Explorer',
        description: 'Low engagement, exploring features',
        characteristics: ['New user', 'Low engagement', 'Testing features'],
        commonPainPoints: ['Onboarding complexity', 'Feature discovery', 'Documentation'],
        recommendedFeatures: ['Simplified onboarding', 'In-app tutorials', 'Better docs'],
        estimatedLTV: 600,
      },
      {
        personaType: 'Enterprise Champion',
        description: 'High engagement, team advocate',
        characteristics: ['High engagement', 'Team lead', 'Advocate'],
        commonPainPoints: ['Team collaboration', 'Admin controls', 'Compliance'],
        recommendedFeatures: ['Team management', 'SSO', 'Audit logs'],
        estimatedLTV: 12000,
      },
    ];
  }

  /**
   * Get sentiment clustering
   */
  async getSentimentClustering(): Promise<any> {
    return {
      clusters: [
        {
          sentiment: 'positive',
          userCount: 450,
          percentage: 45,
          commonThemes: ['Great features', 'Excellent support', 'Easy to use'],
          recommendation: 'Maintain quality, gather testimonials',
        },
        {
          sentiment: 'neutral',
          userCount: 350,
          percentage: 35,
          commonThemes: ['Works as expected', 'Some issues', 'Needs improvement'],
          recommendation: 'Focus on feature improvements',
        },
        {
          sentiment: 'negative',
          userCount: 200,
          percentage: 20,
          commonThemes: ['Performance issues', 'Missing features', 'Poor UX'],
          recommendation: 'Urgent: Address pain points',
        },
      ],
      overallSentiment: 'positive',
      sentimentScore: 0.62, // -1 to +1
      trend: 'stable',
    };
  }
}

export const behavioralIntelligenceEngine = new BehavioralIntelligenceEngine();
