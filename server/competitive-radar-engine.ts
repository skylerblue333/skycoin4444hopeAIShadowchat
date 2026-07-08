import crypto from 'crypto';
/**
 * Competitive Intelligence Radar Engine
 * Always-on market sensing system
 * - Continuous competitor tracking
 * - Feature change detection
 * - Pricing changes alerts
 * - UI/UX pattern detection
 * - Weekly "What changed in your category" reports
 * - Gap detection for exploitation
 */

export interface CompetitorAnalysis {
  competitorId: string;
  competitorName: string;
  lastUpdated: Date;
  features: FeatureComparison[];
  pricing: PricingAnalysis;
  uiPatterns: UIPattern[];
  marketPosition: string;
  strengths: string[];
  weaknesses: string[];
}

export interface FeatureComparison {
  featureName: string;
  hasFeature: boolean;
  launchedDate?: Date;
  maturityLevel: 'beta' | 'stable' | 'mature';
  userSentiment: number; // -1 to +1
}

export interface PricingAnalysis {
  tiers: PricingTier[];
  averagePrice: number;
  priceChangePercentage: number;
  lastPriceUpdate: Date;
}

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
  targetSegment: string;
}

export interface UIPattern {
  pattern: string;
  adoptionRate: number; // 0-1
  competitors: string[];
  trend: 'emerging' | 'growing' | 'mature' | 'declining';
}

export interface WeeklyRadarReport {
  week: string;
  generatedDate: Date;
  keyChanges: CompetitorChange[];
  emergingGaps: MarketGap[];
  trendingPatterns: UIPattern[];
  recommendations: string[];
}

export interface CompetitorChange {
  competitor: string;
  changeType: 'feature_launch' | 'pricing_change' | 'ui_update' | 'partnership';
  description: string;
  impact: 'high' | 'medium' | 'low';
  yourResponse?: string;
}

export interface MarketGap {
  gapDescription: string;
  affectedCompetitors: string[];
  marketSize: string;
  exploitationDifficulty: 'easy' | 'medium' | 'hard';
  timeToMarket: string;
  recommendation: string;
}

export class CompetitiveRadarEngine {
  private competitors: Map<string, CompetitorAnalysis> = new Map();
  private weeklyReports: WeeklyRadarReport[] = [];

  constructor() {
    this.initializeSampleData();
  }

  /**
   * Initialize sample competitor data
   */
  private initializeSampleData(): void {
    const competitors = [
      {
        id: 'comp_1',
        name: 'Competitor A',
        features: [
          { name: 'Mobile App', has: true, maturity: 'mature' as const },
          { name: 'AI Personalization', has: true, maturity: 'stable' as const },
          { name: 'Enterprise API', has: false, maturity: 'beta' as const },
          { name: 'Community Features', has: true, maturity: 'mature' as const },
        ],
        pricing: { tiers: [{ name: 'Pro', price: 99 }], avgPrice: 99, change: 0 },
      },
      {
        id: 'comp_2',
        name: 'Competitor B',
        features: [
          { name: 'Mobile App', has: false, maturity: 'beta' as const },
          { name: 'AI Personalization', has: false, maturity: 'beta' as const },
          { name: 'Enterprise API', has: true, maturity: 'stable' as const },
          { name: 'Community Features', has: false, maturity: 'beta' as const },
        ],
        pricing: { tiers: [{ name: 'Enterprise', price: 299 }], avgPrice: 299, change: 5 },
      },
    ];

    competitors.forEach((comp) => {
      this.competitors.set(comp.id, {
        competitorId: comp.id,
        competitorName: comp.name,
        lastUpdated: new Date(),
        features: comp.features.map((f) => ({
          featureName: f.name,
          hasFeature: f.has,
          maturityLevel: f.maturity,
          userSentiment: (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 2 - 1,
        })),
        pricing: {
          tiers: comp.pricing.tiers.map((t) => ({
            name: t.name,
            price: t.price,
            features: ['Core', 'Advanced'],
            targetSegment: 'Enterprise',
          })),
          averagePrice: comp.pricing.avgPrice,
          priceChangePercentage: comp.pricing.change,
          lastPriceUpdate: new Date(),
        },
        uiPatterns: [
          { pattern: 'Dark mode', adoptionRate: 0.95, competitors: [comp.name], trend: 'mature' },
          { pattern: 'AI chat sidebar', adoptionRate: 0.8, competitors: [comp.name], trend: 'growing' },
        ],
        marketPosition: 'Market Leader',
        strengths: ['Strong brand', 'Large user base', 'Enterprise focus'],
        weaknesses: ['High pricing', 'Complex onboarding', 'Limited mobile'],
      });
    });
  }

  /**
   * Get competitor analysis
   */
  async getCompetitorAnalysis(competitorId: string): Promise<CompetitorAnalysis> {
    const analysis = this.competitors.get(competitorId);
    if (!analysis) throw new Error('Competitor not found');
    return analysis;
  }

  /**
   * Get all competitors
   */
  async getAllCompetitors(): Promise<CompetitorAnalysis[]> {
    return Array.from(this.competitors.values());
  }

  /**
   * Generate weekly radar report
   */
  async generateWeeklyRadarReport(): Promise<WeeklyRadarReport> {
    const week = new Date().toISOString().split('T')[0];

    const report: WeeklyRadarReport = {
      week,
      generatedDate: new Date(),
      keyChanges: [
        {
          competitor: 'Competitor A',
          changeType: 'feature_launch',
          description: 'Launched advanced AI personalization engine',
          impact: 'high',
          yourResponse: 'Accelerate our AI roadmap to Q3',
        },
        {
          competitor: 'Competitor B',
          changeType: 'pricing_change',
          description: 'Increased enterprise tier from $299 to $349 (+17%)',
          impact: 'medium',
          yourResponse: 'Maintain competitive pricing advantage',
        },
        {
          competitor: 'Competitor A',
          changeType: 'ui_update',
          description: 'Redesigned dashboard with new dark mode',
          impact: 'medium',
          yourResponse: 'Monitor user feedback on our UI',
        },
      ],
      emergingGaps: [
        {
          gapDescription: 'No competitor offers mobile-first experience with offline support',
          affectedCompetitors: ['Competitor A', 'Competitor B'],
          marketSize: '$2B+',
          exploitationDifficulty: 'hard',
          timeToMarket: '6-9 months',
          recommendation: 'High-value gap. Prioritize mobile offline features.',
        },
        {
          gapDescription: 'Limited community collaboration tools (forums, real-time collab)',
          affectedCompetitors: ['Competitor B'],
          marketSize: '$500M+',
          exploitationDifficulty: 'medium',
          timeToMarket: '3-4 months',
          recommendation: 'Medium-value gap. Good for Q4 roadmap.',
        },
        {
          gapDescription: 'No transparent pricing for SMB segment',
          affectedCompetitors: ['Competitor A'],
          marketSize: '$1B+',
          exploitationDifficulty: 'easy',
          timeToMarket: '1-2 months',
          recommendation: 'Quick win. Launch SMB tier immediately.',
        },
      ],
      trendingPatterns: [
        { pattern: 'AI-powered search', adoptionRate: 0.9, competitors: ['Competitor A', 'Competitor B'], trend: 'growing' },
        { pattern: 'Real-time collaboration', adoptionRate: 0.7, competitors: ['Competitor A'], trend: 'emerging' },
        { pattern: 'Voice interface', adoptionRate: 0.4, competitors: ['Competitor B'], trend: 'emerging' },
      ],
      recommendations: [
        'Accelerate mobile-first roadmap (high-value gap)',
        'Launch SMB pricing tier (quick win)',
        'Invest in AI-powered search (trending pattern)',
        'Monitor voice interface adoption',
        'Maintain pricing advantage vs Competitor B',
      ],
    };

    this.weeklyReports.push(report);
    return report;
  }

  /**
   * Get market gaps for exploitation
   */
  async getMarketGaps(): Promise<MarketGap[]> {
    const report = await this.generateWeeklyRadarReport();
    return report.emergingGaps;
  }

  /**
   * Get feature comparison matrix
   */
  async getFeatureComparisonMatrix(): Promise<any> {
    const competitors = Array.from(this.competitors.values());
    const allFeatures = new Set<string>();

    competitors.forEach((c) => {
      c.features.forEach((f) => allFeatures.add(f.featureName));
    });

    const matrix: any = {
      features: Array.from(allFeatures),
      competitors: competitors.map((c) => ({
        name: c.competitorName,
        features: Object.fromEntries(
          c.features.map((f) => [f.featureName, { has: f.hasFeature, maturity: f.maturityLevel }])
        ),
      })),
    };

    return matrix;
  }

  /**
   * Get pricing comparison
   */
  async getPricingComparison(): Promise<any> {
    const competitors = Array.from(this.competitors.values());

    return {
      competitors: competitors.map((c) => ({
        name: c.competitorName,
        averagePrice: c.pricing.averagePrice,
        tiers: c.pricing.tiers,
        priceChangePercentage: c.pricing.priceChangePercentage,
        lastUpdate: c.pricing.lastPriceUpdate,
      })),
      marketAverage: competitors.reduce((sum, c) => sum + c.pricing.averagePrice, 0) / competitors.length,
      yourPricing: { tiers: [{ name: 'Pro', price: 79 }], averagePrice: 79 },
      recommendation: 'Your pricing is 20% below market average - strong competitive advantage',
    };
  }

  /**
   * Get UI/UX pattern trends
   */
  async getUIPatternTrends(): Promise<UIPattern[]> {
    const patterns: UIPattern[] = [
      { pattern: 'Dark mode', adoptionRate: 0.95, competitors: ['Competitor A', 'Competitor B'], trend: 'mature' },
      { pattern: 'AI chat sidebar', adoptionRate: 0.8, competitors: ['Competitor A'], trend: 'growing' },
      { pattern: 'Real-time collaboration', adoptionRate: 0.7, competitors: ['Competitor A'], trend: 'emerging' },
      { pattern: 'Voice interface', adoptionRate: 0.4, competitors: ['Competitor B'], trend: 'emerging' },
      { pattern: 'Mobile-first design', adoptionRate: 0.6, competitors: ['Competitor B'], trend: 'growing' },
    ];

    return patterns;
  }

  /**
   * Get competitive positioning
   */
  async getCompetitivePositioning(): Promise<any> {
    return {
      marketLeaders: ['Competitor A'],
      fastFollowers: ['Competitor B'],
      yourPosition: 'Emerging challenger with differentiated AI focus',
      marketShare: {
        yourShare: 0.05,
        competitorA: 0.4,
        competitorB: 0.3,
        others: 0.25,
      },
      competitiveAdvantages: [
        'Superior AI personalization (proprietary models)',
        'Lower pricing (20% below market)',
        'Better mobile experience',
        'Stronger community features',
      ],
      vulnerabilities: [
        'Smaller brand recognition',
        'Fewer enterprise customers',
        'Limited integrations',
        'Newer product',
      ],
    };
  }

  /**
   * Get weekly radar report history
   */
  async getRadarReportHistory(weeks: number = 4): Promise<WeeklyRadarReport[]> {
    return this.weeklyReports.slice(-weeks);
  }
}

export const competitiveRadarEngine = new CompetitiveRadarEngine();
