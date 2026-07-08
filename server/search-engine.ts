/**
 * SEARCH ENGINE
 * Full-text search, indexing, autocomplete, faceted search, and search analytics.
 * Provides unified search across posts, users, communities, marketplace, streams.
 */

import { getDb } from "./db";
import * as schema from "../drizzle";
import { like, or, desc, sql, eq, and, gt } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SearchResult {
  id: string;
  type: "post" | "user" | "community" | "listing" | "stream" | "channel";
  title: string;
  description: string;
  url: string;
  score: number;
  highlights: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface SearchQuery {
  query: string;
  types?: SearchResult["type"][];
  limit?: number;
  offset?: number;
  sortBy?: "relevance" | "recent" | "popular";
  filters?: SearchFilter[];
  userId?: number;
}

export interface SearchFilter {
  field: string;
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "in" | "contains";
  value: string | number | string[];
}

export interface SearchSuggestion {
  text: string;
  type: "query" | "user" | "hashtag" | "community";
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchAnalytics {
  query: string;
  resultCount: number;
  clickedResults: string[];
  userId?: number;
  timestamp: Date;
  duration: number;
}

export interface FacetResult {
  field: string;
  values: Array<{ value: string; count: number }>;
}

export interface IndexEntry {
  id: string;
  type: SearchResult["type"];
  content: string;
  tokens: string[];
  metadata: Record<string, unknown>;
  boost: number;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// SEARCH INDEX (In-Memory with DB Persistence)
// ═══════════════════════════════════════════════════════════════

export class SearchIndex {
  private index: Map<string, IndexEntry> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();
  private popularQueries: Map<string, number> = new Map();
  private recentSearches: Map<number, string[]> = new Map();

  constructor() {
    this.typeIndex.set("post", new Set());
    this.typeIndex.set("user", new Set());
    this.typeIndex.set("community", new Set());
    this.typeIndex.set("listing", new Set());
    this.typeIndex.set("stream", new Set());
    this.typeIndex.set("channel", new Set());
  }

  /**
   * Tokenize content into searchable terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s#@]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 1)
      .map(t => t.trim());
  }

  /**
   * Calculate TF-IDF score for a term in a document
   */
  private calculateTfIdf(term: string, tokens: string[], totalDocs: number): number {
    const tf = tokens.filter(t => t === term).length / tokens.length;
    const docsWithTerm = this.invertedIndex.get(term)?.size || 1;
    const idf = Math.log(totalDocs / docsWithTerm);
    return tf * idf;
  }

  /**
   * Add or update a document in the index
   */
  addDocument(entry: Omit<IndexEntry, "tokens">): void {
    const tokens = this.tokenize(entry.content);
    const fullEntry: IndexEntry = { ...entry, tokens };

    // Remove old entry if exists
    this.removeDocument(entry.id);

    // Add to main index
    this.index.set(entry.id, fullEntry);

    // Add to inverted index
    const uniqueTokens = Array.from(new Set(tokens));
    for (const token of uniqueTokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(entry.id);
    }

    // Add to type index
    this.typeIndex.get(entry.type)?.add(entry.id);
  }

  /**
   * Remove a document from the index
   */
  removeDocument(id: string): void {
    const entry = this.index.get(id);
    if (!entry) return;

    // Remove from inverted index
    for (const token of entry.tokens) {
      this.invertedIndex.get(token)?.delete(id);
    }

    // Remove from type index
    this.typeIndex.get(entry.type)?.delete(id);

    // Remove from main index
    this.index.delete(id);
  }

  /**
   * Search the index with scoring and ranking
   */
  search(query: SearchQuery): { results: SearchResult[]; total: number; facets: FacetResult[] } {
    const startTime = Date.now();
    const tokens = this.tokenize(query.query);
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    // Find candidate documents
    const candidateScores = new Map<string, number>();

    for (const token of tokens) {
      const matchingDocs = this.invertedIndex.get(token);
      if (!matchingDocs) continue;

      for (const docId of Array.from(matchingDocs)) {
        const entry = this.index.get(docId);
        if (!entry) continue;

        // Filter by type if specified
        if (query.types && query.types.length > 0 && !query.types.includes(entry.type)) {
          continue;
        }

        // Calculate relevance score
        const tfIdf = this.calculateTfIdf(token, entry.tokens, this.index.size);
        const boost = entry.boost || 1;
        const currentScore = candidateScores.get(docId) || 0;
        candidateScores.set(docId, currentScore + tfIdf * boost);
      }
    }

    // Also do prefix matching for partial queries
    if (tokens.length > 0) {
      const lastToken = tokens[tokens.length - 1];
      for (const [indexToken, docIds] of Array.from(this.invertedIndex.entries())) {
        if (indexToken.startsWith(lastToken) && indexToken !== lastToken) {
          for (const docId of Array.from(docIds)) {
            const entry = this.index.get(docId);
            if (!entry) continue;
            if (query.types && query.types.length > 0 && !query.types.includes(entry.type)) continue;
            const currentScore = candidateScores.get(docId) || 0;
            candidateScores.set(docId, currentScore + 0.3); // Partial match bonus
          }
        }
      }
    }

    // Sort by score
    let sorted = Array.from(candidateScores.entries())
      .sort((a, b) => b[1] - a[1]);

    // Apply sorting preference
    if (query.sortBy === "recent") {
      sorted = sorted.sort((a, b) => {
        const entryA = this.index.get(a[0]);
        const entryB = this.index.get(b[0]);
        if (!entryA || !entryB) return 0;
        return entryB.updatedAt.getTime() - entryA.updatedAt.getTime();
      });
    }

    const total = sorted.length;

    // Paginate
    const paginatedResults = sorted.slice(offset, offset + limit);

    // Build results
    const results: SearchResult[] = paginatedResults.map(([docId, score]) => {
      const entry = this.index.get(docId)!;
      return {
        id: entry.id,
        type: entry.type,
        title: this.extractTitle(entry),
        description: this.extractDescription(entry, tokens),
        url: this.buildUrl(entry),
        score,
        highlights: this.generateHighlights(entry.content, tokens),
        metadata: entry.metadata,
        createdAt: entry.updatedAt,
      };
    });

    // Build facets
    const facets = this.buildFacets(candidateScores, query);

    // Track analytics
    const duration = Date.now() - startTime;
    this.trackSearch(query.query, total, query.userId, duration);

    return { results, total, facets };
  }

  /**
   * Get autocomplete suggestions
   */
  getSuggestions(prefix: string, limit: number = 10): SearchSuggestion[] {
    const normalizedPrefix = prefix.toLowerCase().trim();
    const suggestions: SearchSuggestion[] = [];

    // Popular query suggestions
    for (const [query, count] of Array.from(this.popularQueries.entries())) {
      if (query.startsWith(normalizedPrefix)) {
        suggestions.push({
          text: query,
          type: "query",
          score: count,
        });
      }
    }

    // Hashtag suggestions
    for (const token of Array.from(this.invertedIndex.keys())) {
      if (token.startsWith(`#${normalizedPrefix}`) || token.startsWith(normalizedPrefix)) {
        if (token.startsWith("#")) {
          suggestions.push({
            text: token,
            type: "hashtag",
            score: this.invertedIndex.get(token)?.size || 0,
          });
        }
      }
    }

    // User suggestions (search by name tokens)
    const userIds = this.typeIndex.get("user") || new Set();
    for (const userId of Array.from(userIds)) {
      const entry = this.index.get(userId);
      if (!entry) continue;
      if (entry.content.toLowerCase().includes(normalizedPrefix)) {
        suggestions.push({
          text: this.extractTitle(entry),
          type: "user",
          score: entry.boost,
          metadata: entry.metadata,
        });
      }
    }

    // Community suggestions
    const communityIds = this.typeIndex.get("community") || new Set();
    for (const communityId of Array.from(communityIds)) {
      const entry = this.index.get(communityId);
      if (!entry) continue;
      if (entry.content.toLowerCase().includes(normalizedPrefix)) {
        suggestions.push({
          text: this.extractTitle(entry),
          type: "community",
          score: entry.boost,
          metadata: entry.metadata,
        });
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get trending searches
   */
  getTrendingSearches(limit: number = 10): Array<{ query: string; count: number }> {
    return Array.from(this.popularQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }

  /**
   * Get user's recent searches
   */
  getRecentSearches(userId: number): string[] {
    return this.recentSearches.get(userId) || [];
  }

  /**
   * Clear user's search history
   */
  clearSearchHistory(userId: number): void {
    this.recentSearches.delete(userId);
  }

  /**
   * Get index statistics
   */
  getStats(): {
    totalDocuments: number;
    totalTokens: number;
    documentsByType: Record<string, number>;
    indexSizeEstimate: number;
  } {
    const documentsByType: Record<string, number> = {};
    for (const [type, ids] of Array.from(this.typeIndex.entries())) {
      documentsByType[type] = ids.size;
    }

    return {
      totalDocuments: this.index.size,
      totalTokens: this.invertedIndex.size,
      documentsByType,
      indexSizeEstimate: this.estimateMemoryUsage(),
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────

  private extractTitle(entry: IndexEntry): string {
    if (entry.metadata.title) return String(entry.metadata.title);
    if (entry.metadata.name) return String(entry.metadata.name);
    if (entry.metadata.displayName) return String(entry.metadata.displayName);
    return entry.content.slice(0, 60);
  }

  private extractDescription(entry: IndexEntry, queryTokens: string[]): string {
    const content = entry.content;
    // Find the first occurrence of any query token and extract surrounding context
    for (const token of queryTokens) {
      const idx = content.toLowerCase().indexOf(token);
      if (idx >= 0) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(content.length, idx + token.length + 80);
        return (start > 0 ? "..." : "") + content.slice(start, end) + (end < content.length ? "..." : "");
      }
    }
    return content.slice(0, 150);
  }

  private buildUrl(entry: IndexEntry): string {
    switch (entry.type) {
      case "post": return `/social?post=${entry.id}`;
      case "user": return `/profile/${entry.id}`;
      case "community": return `/community/${entry.id}`;
      case "listing": return `/marketplace?listing=${entry.id}`;
      case "stream": return `/live?stream=${entry.id}`;
      case "channel": return `/community?channel=${entry.id}`;
      default: return `/search?id=${entry.id}`;
    }
  }

  private generateHighlights(content: string, tokens: string[]): string[] {
    const highlights: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const token of tokens) {
      const idx = lowerContent.indexOf(token);
      if (idx >= 0) {
        const start = Math.max(0, idx - 20);
        const end = Math.min(content.length, idx + token.length + 20);
        const highlight = content.slice(start, end);
        highlights.push(highlight);
      }
    }

    return highlights.slice(0, 3);
  }

  private buildFacets(scores: Map<string, number>, query: SearchQuery): FacetResult[] {
    const typeCounts = new Map<string, number>();

    for (const docId of Array.from(scores.keys())) {
      const entry = this.index.get(docId);
      if (!entry) continue;
      typeCounts.set(entry.type, (typeCounts.get(entry.type) || 0) + 1);
    }

    return [{
      field: "type",
      values: Array.from(typeCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
    }];
  }

  private trackSearch(query: string, resultCount: number, userId: number | undefined, duration: number): void {
    const normalized = query.toLowerCase().trim();
    this.popularQueries.set(normalized, (this.popularQueries.get(normalized) || 0) + 1);

    if (userId) {
      const recent = this.recentSearches.get(userId) || [];
      recent.unshift(normalized);
      this.recentSearches.set(userId, recent.slice(0, 50));
    }
  }

  private estimateMemoryUsage(): number {
    let bytes = 0;
    for (const entry of Array.from(this.index.values())) {
      bytes += entry.content.length * 2; // UTF-16
      bytes += entry.tokens.length * 20; // avg token size
      bytes += 200; // metadata overhead
    }
    bytes += this.invertedIndex.size * 100; // inverted index overhead
    return bytes;
  }
}

// ═══════════════════════════════════════════════════════════════
// SEARCH SERVICE (Database-Backed)
// ═══════════════════════════════════════════════════════════════

export class SearchService {
  private index: SearchIndex;

  constructor() {
    this.index = new SearchIndex();
  }

  /**
   * Rebuild the search index from database
   */
  async rebuildIndex(): Promise<{ indexed: number; duration: number }> {
    const startTime = Date.now();
    let indexed = 0;
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Index posts
    const posts = await db.select().from(schema.posts).limit(10000);
    for (const post of posts) {
      this.index.addDocument({
        id: `post_${post.id}`,
        type: "post",
        content: post.content || "",
        metadata: {
          authorId: post.authorId,
          likes: post.likeCount,
          comments: post.commentCount,
          mediaUrl: post.mediaUrl,
        },
        boost: 1 + (post.likeCount || 0) * 0.01,
        updatedAt: new Date(post.createdAt),
      });
      indexed++;
    }

    // Index users
    const users = await db.select().from(schema.users).limit(10000);
    for (const user of users) {
      this.index.addDocument({
        id: `user_${user.id}`,
        type: "user",
        content: `${user.name || ""} ${user.bio || ""} ${user.displayName || ""}`,
        metadata: {
          name: user.name,
          displayName: user.displayName,
          avatarUrl: user.avatar,
          level: user.level,
          xp: user.xp,
        },
        boost: 1 + (user.level || 1) * 0.1,
        updatedAt: new Date(user.createdAt),
      });
      indexed++;
    }

    // Index communities
    const communities = await db.select().from(schema.communities).limit(5000);
    for (const community of communities) {
      this.index.addDocument({
        id: `community_${community.id}`,
        type: "community",
        content: `${community.name} ${community.description || ""}`,
        metadata: {
          name: community.name,
          memberCount: community.memberCount,
          category: community.category,
          iconUrl: community.avatar,
        },
        boost: 1 + (community.memberCount || 0) * 0.001,
        updatedAt: new Date(community.createdAt),
      });
      indexed++;
    }

    // Index marketplace listings
    const listings = await db.select().from(schema.listings).limit(10000);
    for (const listing of listings) {
      this.index.addDocument({
        id: `listing_${listing.id}`,
        type: "listing",
        content: `${listing.title} ${listing.description || ""}`,
        metadata: {
          title: listing.title,
          price: listing.price,
          token: listing.currency,
          sellerId: listing.sellerId,
          imageUrl: listing.imageUrl,
          status: listing.status,
        },
        boost: listing.status === "active" ? 1.5 : 0.5,
        updatedAt: new Date(listing.createdAt),
      });
      indexed++;
    }

    // Index streams
    const streams = await db.select().from(schema.streams).limit(5000);
    for (const stream of streams) {
      this.index.addDocument({
        id: `stream_${stream.id}`,
        type: "stream",
        content: `${stream.title} ${stream.category || ""}`,
        metadata: {
          title: stream.title,
          streamerId: stream.streamerId,
          status: stream.status,
          viewerCount: stream.viewerCount,
          category: stream.category,
        },
        boost: stream.status === "live" ? 3 : 1,
        updatedAt: new Date(stream.createdAt),
      });
      indexed++;
    }

    const duration = Date.now() - startTime;
    return { indexed, duration };
  }

  /**
   * Perform a unified search
   */
  search(query: SearchQuery): { results: SearchResult[]; total: number; facets: FacetResult[] } {
    return this.index.search(query);
  }

  /**
   * Get autocomplete suggestions
   */
  getSuggestions(prefix: string, limit?: number): SearchSuggestion[] {
    return this.index.getSuggestions(prefix, limit);
  }

  /**
   * Get trending searches
   */
  getTrending(limit?: number): Array<{ query: string; count: number }> {
    return this.index.getTrendingSearches(limit);
  }

  /**
   * Get user's recent searches
   */
  getRecentSearches(userId: number): string[] {
    return this.index.getRecentSearches(userId);
  }

  /**
   * Clear user's search history
   */
  clearHistory(userId: number): void {
    this.index.clearSearchHistory(userId);
  }

  /**
   * Get index statistics
   */
  getStats() {
    return this.index.getStats();
  }

  /**
   * Index a single document (for real-time updates)
   */
  indexDocument(entry: Omit<IndexEntry, "tokens">): void {
    this.index.addDocument(entry);
  }

  /**
   * Remove a document from the index
   */
  removeDocument(id: string): void {
    this.index.removeDocument(id);
  }
}

// ═══════════════════════════════════════════════════════════════
// SEARCH ANALYTICS SERVICE
// ═══════════════════════════════════════════════════════════════

export class SearchAnalyticsService {
  private searches: SearchAnalytics[] = [];
  private clickthrough: Map<string, Map<string, number>> = new Map();

  recordSearch(query: string, resultCount: number, userId?: number, duration: number = 0): void {
    this.searches.push({
      query: query.toLowerCase().trim(),
      resultCount,
      clickedResults: [],
      userId,
      timestamp: new Date(),
      duration,
    });

    // Keep last 10000 searches
    if (this.searches.length > 10000) {
      this.searches = this.searches.slice(-10000);
    }
  }

  recordClick(query: string, resultId: string): void {
    const normalized = query.toLowerCase().trim();
    if (!this.clickthrough.has(normalized)) {
      this.clickthrough.set(normalized, new Map());
    }
    const clicks = this.clickthrough.get(normalized)!;
    clicks.set(resultId, (clicks.get(resultId) || 0) + 1);
  }

  getZeroResultQueries(limit: number = 20): Array<{ query: string; count: number }> {
    const zeroCounts = new Map<string, number>();
    for (const search of this.searches) {
      if (search.resultCount === 0) {
        zeroCounts.set(search.query, (zeroCounts.get(search.query) || 0) + 1);
      }
    }
    return Array.from(zeroCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }

  getAverageResponseTime(): number {
    if (this.searches.length === 0) return 0;
    const total = this.searches.reduce((sum, s) => sum + s.duration, 0);
    return total / this.searches.length;
  }

  getSearchVolume(hours: number = 24): number {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.searches.filter(s => s.timestamp > cutoff).length;
  }

  getClickThroughRate(query: string): number {
    const normalized = query.toLowerCase().trim();
    const totalSearches = this.searches.filter(s => s.query === normalized).length;
    const clicks = this.clickthrough.get(normalized);
    if (!clicks || totalSearches === 0) return 0;

    let totalClicks = 0;
    for (const count of Array.from(clicks.values())) {
      totalClicks += count;
    }
    return totalClicks / totalSearches;
  }

  getOverallStats(): {
    totalSearches: number;
    uniqueQueries: number;
    avgResponseTime: number;
    zeroResultRate: number;
    searchesLast24h: number;
  } {
    const uniqueQueries = new Set(this.searches.map(s => s.query)).size;
    const zeroResults = this.searches.filter(s => s.resultCount === 0).length;

    return {
      totalSearches: this.searches.length,
      uniqueQueries,
      avgResponseTime: this.getAverageResponseTime(),
      zeroResultRate: this.searches.length > 0 ? zeroResults / this.searches.length : 0,
      searchesLast24h: this.getSearchVolume(24),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCES
// ═══════════════════════════════════════════════════════════════

let searchServiceInstance: SearchService | null = null;
let searchAnalyticsInstance: SearchAnalyticsService | null = null;

export function getSearchService(): SearchService {
  if (!searchServiceInstance) {
    searchServiceInstance = new SearchService();
  }
  return searchServiceInstance;
}

export function getSearchAnalytics(): SearchAnalyticsService {
  if (!searchAnalyticsInstance) {
    searchAnalyticsInstance = new SearchAnalyticsService();
  }
  return searchAnalyticsInstance;
}
