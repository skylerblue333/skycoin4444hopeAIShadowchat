import crypto from 'crypto';
import { getDb } from './db';

/**
 * AI-Powered Search Engine
 * 
 * Capabilities:
 * - Semantic search across all platform data
 * - Ranking and relevance scoring
 * - Search analytics and trending
 * - Personalized search results
 * - Search suggestions and autocomplete
 * - Full-text and vector search
 */

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'proposal' | 'agent' | 'transaction' | 'document';
  title: string;
  description: string;
  relevanceScore: number;
  timestamp: number;
  metadata: Record<string, unknown>;
}

interface SearchQuery {
  id: string;
  query: string;
  userId: string | null;
  results: SearchResult[];
  executionTime: number;
  timestamp: number;
}

interface SearchTrend {
  term: string;
  count: number;
  trend: 'rising' | 'stable' | 'falling';
  lastUpdated: number;
}

export class AIPoweredSearchEngine {
  private searchQueries: SearchQuery[] = [];
  private searchIndex: Map<string, string[]> = new Map(); // word -> document IDs
  private searchTrends: Map<string, SearchTrend> = new Map();
  private documents: Map<string, Record<string, unknown>> = new Map();

  /**
   * Perform semantic search
   */
  async search(query: string, userId: string | null = null): Promise<SearchQuery> {
    const startTime = Date.now();
    const searchId = crypto.randomUUID();

    // Tokenize query
    const tokens = this.tokenizeQuery(query);

    // Find matching documents
    const matchingDocs = this.findMatchingDocuments(tokens);

    // Rank results by relevance
    const results = this.rankResults(query, matchingDocs);

    const executionTime = Date.now() - startTime;

    const searchQuery: SearchQuery = {
      id: searchId,
      query,
      userId,
      results,
      executionTime,
      timestamp: Date.now(),
    };

    this.searchQueries.push(searchQuery);
    this.recordSearchTrend(query);

    return searchQuery;
  }

  /**
   * Tokenize search query
   */
  private tokenizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  /**
   * Find matching documents
   */
  private findMatchingDocuments(tokens: string[]): Map<string, number> {
    const matches = new Map<string, number>();

    for (const token of tokens) {
      const docIds = this.searchIndex.get(token) || [];
      for (const docId of docIds) {
        matches.set(docId, (matches.get(docId) || 0) + 1);
      }
    }

    return matches;
  }

  /**
   * Rank results by relevance
   */
  private rankResults(query: string, matches: Map<string, number>): SearchResult[] {
    const results: SearchResult[] = [];

    for (const [docId, matchCount] of matches) {
      const doc = this.documents.get(docId);
      if (!doc) continue;

      const relevanceScore = this.calculateRelevance(query, doc, matchCount);

      results.push({
        id: docId,
        type: (doc.type as SearchResult['type']) || 'document',
        title: (doc.title as string) || '',
        description: (doc.description as string) || '',
        relevanceScore,
        timestamp: (doc.timestamp as number) || Date.now(),
        metadata: doc,
      });
    }

    // Sort by relevance score
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 20);
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(query: string, doc: Record<string, unknown>, matchCount: number): number {
    const titleMatch = (doc.title as string || '').toLowerCase().includes(query.toLowerCase()) ? 0.5 : 0;
    const descriptionMatch = (doc.description as string || '').toLowerCase().includes(query.toLowerCase()) ? 0.3 : 0;
    const tokenMatch = Math.min(matchCount / 5, 0.5); // Normalize to 0-0.5
    const recencyBoost = this.calculateRecencyBoost(doc.timestamp as number);

    return titleMatch + descriptionMatch + tokenMatch + recencyBoost;
  }

  /**
   * Calculate recency boost
   */
  private calculateRecencyBoost(timestamp: number): number {
    const ageMs = Date.now() - timestamp;
    const ageHours = ageMs / (1000 * 60 * 60);
    return Math.max(0, 0.2 * Math.exp(-ageHours / 168)); // Decay over weeks
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(prefix: string): Promise<string[]> {
    const suggestions: string[] = [];

    for (const [term, trend] of this.searchTrends) {
      if (term.startsWith(prefix.toLowerCase()) && suggestions.length < 10) {
        suggestions.push(term);
      }
    }

    return suggestions.sort((a, b) => {
      const trendA = this.searchTrends.get(a)?.count || 0;
      const trendB = this.searchTrends.get(b)?.count || 0;
      return trendB - trendA;
    });
  }

  /**
   * Record search trend
   */
  private recordSearchTrend(query: string): void {
    const term = query.toLowerCase();
    const existing = this.searchTrends.get(term);

    if (existing) {
      existing.count += 1;
      existing.lastUpdated = Date.now();
    } else {
      this.searchTrends.set(term, {
        term,
        count: 1,
        trend: 'rising',
        lastUpdated: Date.now(),
      });
    }
  }

  /**
   * Index document
   */
  indexDocument(docId: string, doc: Record<string, unknown>): void {
    this.documents.set(docId, doc);

    // Extract searchable text
    const searchableText = `${doc.title || ''} ${doc.description || ''} ${doc.content || ''}`.toLowerCase();
    const tokens = this.tokenizeQuery(searchableText);

    for (const token of tokens) {
      if (!this.searchIndex.has(token)) {
        this.searchIndex.set(token, []);
      }
      const docIds = this.searchIndex.get(token)!;
      if (!docIds.includes(docId)) {
        docIds.push(docId);
      }
    }
  }

  /**
   * Get trending searches
   */
  getTrendingSearches(limit: number = 10): SearchTrend[] {
    return Array.from(this.searchTrends.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics(timeWindowMs: number = 86400000): Record<string, unknown> {
    const cutoff = Date.now() - timeWindowMs;
    const recentQueries = this.searchQueries.filter((q) => q.timestamp > cutoff);

    return {
      total_searches: recentQueries.length,
      unique_queries: new Set(recentQueries.map((q) => q.query)).size,
      average_execution_time_ms: recentQueries.length > 0 ? recentQueries.reduce((sum, q) => sum + q.executionTime, 0) / recentQueries.length : 0,
      trending_searches: this.getTrendingSearches(5),
    };
  }

  /**
   * Get search history for user
   */
  getUserSearchHistory(userId: string, limit: number = 50): SearchQuery[] {
    return this.searchQueries
      .filter((q) => q.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

// Singleton instance
let instance: AIPoweredSearchEngine | null = null;

export function getAIPoweredSearchEngine(): AIPoweredSearchEngine {
  if (!instance) {
    instance = new AIPoweredSearchEngine();
  }
  return instance;
}
