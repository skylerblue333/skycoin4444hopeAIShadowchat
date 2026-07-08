/**
 * Competitor Tracker
 * Tracks competitors and market positioning
 */

export interface Competitor {
  id: string;
  name: string;
  website: string;
  features: string[];
  pricing: number;
  marketShare: number;
  lastUpdated: Date;
  strengths: string[];
  weaknesses: string[];
}

export interface MarketGap {
  id: string;
  title: string;
  description: string;
  opportunity: string;
  estimatedMarketSize: number;
  competitors: string[];
}

export class CompetitorTracker {
  private competitors: Map<string, Competitor> = new Map();
  private marketGaps: MarketGap[] = [];

  async addCompetitor(competitor: Omit<Competitor, 'lastUpdated'>): Promise<Competitor> {
    const full: Competitor = {
      ...competitor,
      lastUpdated: new Date(),
    };
    this.competitors.set(competitor.id, full);
    return full;
  }

  async getAllCompetitors(): Promise<Competitor[]> {
    return Array.from(this.competitors.values());
  }

  async getCompetitor(id: string): Promise<Competitor | undefined> {
    return this.competitors.get(id);
  }

  async getWeeklyRadarReport(): Promise<any> {
    const competitors = Array.from(this.competitors.values());
    return {
      timestamp: new Date(),
      totalCompetitors: competitors.length,
      averageMarketShare: competitors.length > 0 
        ? competitors.reduce((sum, c) => sum + c.marketShare, 0) / competitors.length 
        : 0,
      topCompetitors: competitors
        .sort((a, b) => b.marketShare - a.marketShare)
        .slice(0, 5),
      marketGaps: this.marketGaps,
      trends: this.analyzeTrends(competitors),
    };
  }

  async getMarketGaps(): Promise<MarketGap[]> {
    return this.marketGaps;
  }

  async addMarketGap(gap: MarketGap): Promise<MarketGap> {
    this.marketGaps.push(gap);
    return gap;
  }

  async getPricingComparison(): Promise<any> {
    const competitors = Array.from(this.competitors.values());
    return {
      competitors: competitors.map(c => ({
        name: c.name,
        pricing: c.pricing,
        features: c.features.length,
      })),
      averagePrice: competitors.length > 0
        ? competitors.reduce((sum, c) => sum + c.pricing, 0) / competitors.length
        : 0,
      priceRange: {
        min: Math.min(...competitors.map(c => c.pricing)),
        max: Math.max(...competitors.map(c => c.pricing)),
      },
    };
  }

  async identifyOpportunities(): Promise<any> {
    const competitors = Array.from(this.competitors.values());
    const allFeatures = new Set<string>();
    competitors.forEach(c => c.features.forEach(f => allFeatures.add(f)));

    const opportunities = Array.from(allFeatures).map(feature => ({
      feature,
      adoptionRate: (competitors.filter(c => c.features.includes(feature)).length / competitors.length) * 100,
      potentialDifferentiator: (competitors.filter(c => c.features.includes(feature)).length / competitors.length) < 0.5,
    }));

    return opportunities.filter(o => o.potentialDifferentiator);
  }

  private analyzeTrends(competitors: Competitor[]): any {
    return {
      marketConcentration: competitors.length > 0 ? Math.max(...competitors.map(c => c.marketShare)) : 0,
      averageFeatureCount: competitors.length > 0
        ? competitors.reduce((sum, c) => sum + c.features.length, 0) / competitors.length
        : 0,
      pricePointTrend: 'stable',
      emergingTrends: ['AI integration', 'Real-time analytics', 'Mobile-first'],
    };
  }
}

export const competitorTracker = new CompetitorTracker();
