import crypto from 'crypto';
/**
 * PHASE 25 — SEARCH DOMINANCE ENGINE
 * Universal Search, Semantic Search, AI Intent Search, Trending, Predictive
 * Goal: Search becomes platform intelligence.
 */

import { invokeLLM } from "./_core/llm";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SearchEntityType =
  | "creator" | "post" | "stream" | "community" | "nft" | "product"
  | "charity_campaign" | "governance_proposal" | "job" | "event";

export type SearchSortBy = "relevance" | "recency" | "popularity" | "trending" | "price_asc" | "price_desc";

export interface SearchDocument {
  id: string;
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  description: string;
  tags: string[];
  authorId?: number;
  authorName?: string;
  communityId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Scoring signals
  viewCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  purchaseCount: number;
  trendingScore: number;
  qualityScore: number;
  // Metadata
  metadata: Record<string, unknown>;
  // Vector embedding (simulated as float array)
  embedding: number[];
  isActive: boolean;
  isIndexed: boolean;
}

export interface SearchQuery {
  id: string;
  userId?: number;
  rawQuery: string;
  normalizedQuery: string;
  intent?: string;
  intentConfidence?: number;
  entityTypeFilter?: SearchEntityType[];
  sortBy: SearchSortBy;
  page: number;
  pageSize: number;
  executedAt: Date;
  resultCount: number;
  executionTimeMs: number;
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  matchType: "exact" | "fuzzy" | "semantic" | "ai_intent";
  highlights: string[];
  rank: number;
}

export interface SearchResponse {
  queryId: string;
  results: SearchResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  suggestions: string[];
  relatedSearches: string[];
  trendingInContext: string[];
  executionTimeMs: number;
}

export interface TrendingSearch {
  id: string;
  query: string;
  searchCount: number;
  velocityScore: number;
  entityType?: SearchEntityType;
  peakAt?: Date;
  region?: string;
  isActive: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface SearchSuggestion {
  id: string;
  prefix: string;
  suggestion: string;
  suggestionType: "completion" | "correction" | "related" | "trending" | "personalized";
  score: number;
  entityType?: SearchEntityType;
  metadata?: Record<string, unknown>;
}

export interface SearchAnalytics {
  userId?: number;
  query: string;
  clickedResultId?: string;
  clickedResultRank?: number;
  clickedAt?: Date;
  sessionId?: string;
  noResultsQuery: boolean;
  refinedQuery?: string;
  recordedAt: Date;
}

export interface VectorIndex {
  entityType: SearchEntityType;
  entityId: string;
  embedding: number[];
  indexedAt: Date;
}

export interface SearchPersonalization {
  userId: number;
  recentSearches: string[];
  preferredEntityTypes: SearchEntityType[];
  topCreatorIds: number[];
  topCommunityIds: string[];
  topTags: string[];
  searchHistory: Array<{ query: string; at: Date }>;
  updatedAt: Date;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _searchIndex = new Map<string, SearchDocument>();
const _searchQueries = new Map<string, SearchQuery>();
const _trendingSearches = new Map<string, TrendingSearch>();
const _searchSuggestions = new Map<string, SearchSuggestion>();
const _searchAnalytics: SearchAnalytics[] = [];
const _vectorIndex = new Map<string, VectorIndex>();
const _searchPersonalization = new Map<number, SearchPersonalization>();

// ─── SEARCH INDEX ENGINE ──────────────────────────────────────────────────────

export const searchIndexEngine = {
  indexDocument(doc: Omit<SearchDocument, "embedding" | "isIndexed">): SearchDocument {
    // Generate a simple deterministic embedding from title+description
    const text = `${doc.title} ${doc.description} ${doc.tags.join(" ")}`;
    const embedding = this._generateEmbedding(text);
    const fullDoc: SearchDocument = {
      ...doc,
      embedding,
      isIndexed: true,
    };
    _searchIndex.set(doc.id, fullDoc);
    // Also index in vector store
    _vectorIndex.set(doc.id, {
      entityType: doc.entityType,
      entityId: doc.entityId,
      embedding,
      indexedAt: new Date(),
    });
    return fullDoc;
  },

  _generateEmbedding(text: string): number[] {
    // Deterministic pseudo-embedding based on character codes
    const dim = 64;
    const embedding = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      embedding[i % dim] += text.charCodeAt(i) / 1000;
    }
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0)) || 1;
    return embedding.map(v => v / magnitude);
  },

  _cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
  },

  updateDocument(id: string, updates: Partial<SearchDocument>): SearchDocument | null {
    const doc = _searchIndex.get(id);
    if (!doc) return null;
    Object.assign(doc, updates, { updatedAt: new Date() });
    if (updates.title || updates.description || updates.tags) {
      const text = `${doc.title} ${doc.description} ${doc.tags.join(" ")}`;
      doc.embedding = this._generateEmbedding(text);
    }
    return doc;
  },

  removeDocument(id: string): boolean {
    _vectorIndex.delete(id);
    return _searchIndex.delete(id);
  },

  getDocument(id: string): SearchDocument | null {
    return _searchIndex.get(id) ?? null;
  },

  getIndexStats(): { total: number; byType: Record<string, number> } {
    const docs = Array.from(_searchIndex.values());
    const byType: Record<string, number> = {};
    for (const doc of docs) {
      byType[doc.entityType] = (byType[doc.entityType] ?? 0) + 1;
    }
    return { total: docs.length, byType };
  },

  bulkIndex(docs: Array<Omit<SearchDocument, "embedding" | "isIndexed">>): number {
    let count = 0;
    for (const doc of docs) {
      this.indexDocument(doc);
      count++;
    }
    return count;
  },
};

// ─── FUZZY SEARCH ENGINE ──────────────────────────────────────────────────────

export const fuzzySearchEngine = {
  _levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  },

  _fuzzyScore(query: string, text: string): number {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t.includes(q)) return 1.0;
    const words = t.split(/\s+/);
    let maxScore = 0;
    for (const word of words) {
      const dist = this._levenshtein(q, word);
      const maxLen = Math.max(q.length, word.length);
      const score = 1 - dist / maxLen;
      if (score > maxScore) maxScore = score;
    }
    return maxScore;
  },

  search(query: string, entityTypes?: SearchEntityType[], limit = 20): SearchResult[] {
    const docs = Array.from(_searchIndex.values()).filter(d =>
      d.isActive && (!entityTypes || entityTypes.includes(d.entityType))
    );
    const results: SearchResult[] = [];
    for (const doc of docs) {
      const titleScore = this._fuzzyScore(query, doc.title) * 2;
      const descScore = this._fuzzyScore(query, doc.description);
      const tagScore = doc.tags.some(t => this._fuzzyScore(query, t) > 0.8) ? 0.5 : 0;
      const score = (titleScore + descScore + tagScore) / 3.5;
      if (score > 0.3) {
        results.push({
          document: doc,
          score,
          matchType: score > 0.9 ? "exact" : "fuzzy",
          highlights: this._generateHighlights(query, doc),
          rank: 0,
        });
      }
    }
    results.sort((a, b) => b.score - a.score);
    results.forEach((r, i) => r.rank = i + 1);
    return results.slice(0, limit);
  },

  _generateHighlights(query: string, doc: SearchDocument): string[] {
    const highlights: string[] = [];
    const q = query.toLowerCase();
    if (doc.title.toLowerCase().includes(q)) {
      highlights.push(`...${doc.title}...`);
    }
    const descWords = doc.description.split(" ");
    const idx = descWords.findIndex(w => w.toLowerCase().includes(q));
    if (idx >= 0) {
      const start = Math.max(0, idx - 3);
      const end = Math.min(descWords.length, idx + 4);
      highlights.push(`...${descWords.slice(start, end).join(" ")}...`);
    }
    return highlights;
  },
};

// ─── SEMANTIC SEARCH ENGINE ───────────────────────────────────────────────────

export const semanticSearchEngine = {
  search(query: string, entityTypes?: SearchEntityType[], limit = 20): SearchResult[] {
    const queryEmbedding = searchIndexEngine._generateEmbedding(query);
    const docs = Array.from(_searchIndex.values()).filter(d =>
      d.isActive && (!entityTypes || entityTypes.includes(d.entityType))
    );
    const results: SearchResult[] = [];
    for (const doc of docs) {
      const similarity = searchIndexEngine._cosineSimilarity(queryEmbedding, doc.embedding);
      if (similarity > 0.5) {
        results.push({
          document: doc,
          score: similarity,
          matchType: "semantic",
          highlights: [`Semantically related to "${query}"`],
          rank: 0,
        });
      }
    }
    results.sort((a, b) => b.score - a.score);
    results.forEach((r, i) => r.rank = i + 1);
    return results.slice(0, limit);
  },

  findSimilarDocuments(documentId: string, limit = 10): SearchResult[] {
    const doc = _searchIndex.get(documentId);
    if (!doc) return [];
    const docs = Array.from(_searchIndex.values()).filter(d => d.id !== documentId && d.isActive);
    const results: SearchResult[] = [];
    for (const d of docs) {
      const similarity = searchIndexEngine._cosineSimilarity(doc.embedding, d.embedding);
      if (similarity > 0.6) {
        results.push({
          document: d,
          score: similarity,
          matchType: "semantic",
          highlights: ["Similar content"],
          rank: 0,
        });
      }
    }
    results.sort((a, b) => b.score - a.score);
    results.forEach((r, i) => r.rank = i + 1);
    return results.slice(0, limit);
  },
};

// ─── AI INTENT SEARCH ENGINE ──────────────────────────────────────────────────

export const aiIntentSearchEngine = {
  async detectIntent(query: string): Promise<{ intent: string; entityType?: SearchEntityType; confidence: number; refinedQuery: string }> {
    let intent = "general_search";
    let entityType: SearchEntityType | undefined;
    let confidence = 0.7;
    let refinedQuery = query;

    // Rule-based intent detection (fast path)
    const q = query.toLowerCase();
    if (q.includes("stream") || q.includes("live") || q.includes("watch")) {
      intent = "find_stream"; entityType = "stream"; confidence = 0.9;
    } else if (q.includes("buy") || q.includes("purchase") || q.includes("shop")) {
      intent = "purchase"; entityType = "product"; confidence = 0.9;
    } else if (q.includes("nft") || q.includes("mint") || q.includes("collect")) {
      intent = "find_nft"; entityType = "nft"; confidence = 0.9;
    } else if (q.includes("donate") || q.includes("charity") || q.includes("cause")) {
      intent = "donate"; entityType = "charity_campaign"; confidence = 0.9;
    } else if (q.includes("job") || q.includes("hire") || q.includes("work")) {
      intent = "find_job"; entityType = "job"; confidence = 0.9;
    } else if (q.includes("vote") || q.includes("proposal") || q.includes("governance")) {
      intent = "governance"; entityType = "governance_proposal"; confidence = 0.9;
    } else if (q.includes("creator") || q.includes("follow") || q.includes("subscribe")) {
      intent = "find_creator"; entityType = "creator"; confidence = 0.85;
    } else if (q.includes("community") || q.includes("group") || q.includes("server")) {
      intent = "find_community"; entityType = "community"; confidence = 0.85;
    } else {
      // Try LLM for ambiguous queries
      try {
        const response = await invokeLLM({
          model: "gpt-4o-mini",
          messages: [{
            role: "user",
            content: `Classify the search intent for: "${query}"\nRespond with JSON only: {"intent": "string", "entityType": "creator|post|stream|community|nft|product|charity_campaign|governance_proposal|job|event|null", "confidence": 0.0-1.0, "refinedQuery": "string"}`,
          }],
          maxTokens: 100,
        });
        const content = (response.choices[0]?.message?.content as string) ?? "";
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          intent = parsed.intent ?? intent;
          entityType = parsed.entityType !== "null" ? parsed.entityType : undefined;
          confidence = parsed.confidence ?? confidence;
          refinedQuery = parsed.refinedQuery ?? refinedQuery;
        }
      } catch { /* use rule-based result */ }
    }

    return { intent, entityType, confidence, refinedQuery };
  },

  async search(query: string, userId?: number, limit = 20): Promise<SearchResult[]> {
    const { intent, entityType, refinedQuery } = await this.detectIntent(query);
    const entityTypes = entityType ? [entityType] : undefined;

    // Combine fuzzy + semantic results
    const fuzzyResults = fuzzySearchEngine.search(refinedQuery, entityTypes, limit);
    const semanticResults = semanticSearchEngine.search(refinedQuery, entityTypes, limit);

    // Merge and deduplicate
    const seen = new Set<string>();
    const merged: SearchResult[] = [];
    for (const r of [...fuzzyResults, ...semanticResults]) {
      if (!seen.has(r.document.id)) {
        seen.add(r.document.id);
        merged.push({ ...r, matchType: "ai_intent" });
      }
    }

    // Apply personalization boost
    if (userId) {
      const personalization = _searchPersonalization.get(userId);
      if (personalization) {
        for (const r of merged) {
          if (personalization.preferredEntityTypes.includes(r.document.entityType)) {
            r.score *= 1.2;
          }
          if (r.document.authorId && personalization.topCreatorIds.includes(r.document.authorId)) {
            r.score *= 1.3;
          }
        }
      }
    }

    merged.sort((a, b) => b.score - a.score);
    merged.forEach((r, i) => r.rank = i + 1);
    return merged.slice(0, limit);
  },
};

// ─── TRENDING SEARCH ENGINE ───────────────────────────────────────────────────

export const trendingSearchEngine = {
  recordSearch(query: string, entityType?: SearchEntityType, region?: string): TrendingSearch {
    const key = `${query.toLowerCase()}_${entityType ?? "all"}_${region ?? "global"}`;
    const existing = _trendingSearches.get(key);
    if (existing) {
      existing.searchCount++;
      existing.velocityScore = existing.searchCount / Math.max(1, (Date.now() - existing.firstSeenAt.getTime()) / 3600000);
      existing.lastSeenAt = new Date();
      return existing;
    }
    const trending: TrendingSearch = {
      id: key,
      query: query.toLowerCase(),
      searchCount: 1,
      velocityScore: 1,
      entityType,
      region,
      isActive: true,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    };
    _trendingSearches.set(key, trending);
    return trending;
  },

  getTrending(entityType?: SearchEntityType, region?: string, limit = 10): TrendingSearch[] {
    return Array.from(_trendingSearches.values())
      .filter(t => t.isActive && (!entityType || t.entityType === entityType) && (!region || t.region === region || !t.region))
      .sort((a, b) => b.velocityScore - a.velocityScore)
      .slice(0, limit);
  },

  getTopSearches(limit = 20): TrendingSearch[] {
    return Array.from(_trendingSearches.values())
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, limit);
  },

  getTrendingByRegion(): Record<string, TrendingSearch[]> {
    const byRegion: Record<string, TrendingSearch[]> = {};
    for (const t of _trendingSearches.values()) {
      const region = t.region ?? "global";
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(t);
    }
    for (const region of Object.keys(byRegion)) {
      byRegion[region].sort((a, b) => b.velocityScore - a.velocityScore);
      byRegion[region] = byRegion[region].slice(0, 10);
    }
    return byRegion;
  },
};

// ─── PREDICTIVE SEARCH ENGINE ─────────────────────────────────────────────────

export const predictiveSearchEngine = {
  indexSuggestion(params: Omit<SearchSuggestion, "id">): SearchSuggestion {
    const id = `sug_${params.prefix}_${params.suggestion}`;
    const suggestion: SearchSuggestion = { ...params, id };
    _searchSuggestions.set(id, suggestion);
    return suggestion;
  },

  getSuggestions(prefix: string, userId?: number, limit = 8): SearchSuggestion[] {
    const p = prefix.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Exact prefix matches
    for (const sug of _searchSuggestions.values()) {
      if (sug.suggestion.toLowerCase().startsWith(p)) {
        suggestions.push(sug);
      }
    }

    // Trending searches that match prefix
    const trending = trendingSearchEngine.getTrending(undefined, undefined, 20);
    for (const t of trending) {
      if (t.query.startsWith(p) && !suggestions.find(s => s.suggestion === t.query)) {
        suggestions.push({
          id: `trend_${t.id}`,
          prefix: p,
          suggestion: t.query,
          suggestionType: "trending",
          score: t.velocityScore,
          entityType: t.entityType,
        });
      }
    }

    // Personalized suggestions
    if (userId) {
      const personalization = _searchPersonalization.get(userId);
      if (personalization) {
        for (const recent of personalization.recentSearches) {
          if (recent.toLowerCase().startsWith(p) && !suggestions.find(s => s.suggestion === recent)) {
            suggestions.push({
              id: `personal_${userId}_${recent}`,
              prefix: p,
              suggestion: recent,
              suggestionType: "personalized",
              score: 2.0,
            });
          }
        }
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  getRelatedSearches(query: string, limit = 5): string[] {
    const q = query.toLowerCase();
    const related: string[] = [];
    for (const t of _trendingSearches.values()) {
      if (t.query !== q && (t.query.includes(q.split(" ")[0]) || q.includes(t.query.split(" ")[0]))) {
        related.push(t.query);
      }
    }
    return related.slice(0, limit);
  },

  buildSpellCorrection(query: string): string {
    // Simple spell correction using index terms
    const words = query.toLowerCase().split(" ");
    const corrected = words.map(word => {
      if (word.length < 3) return word;
      let bestMatch = word;
      let bestScore = 0;
      for (const doc of _searchIndex.values()) {
        for (const tag of doc.tags) {
          const dist = fuzzySearchEngine._levenshtein(word, tag.toLowerCase());
          const score = 1 - dist / Math.max(word.length, tag.length);
          if (score > 0.85 && score > bestScore) {
            bestScore = score;
            bestMatch = tag.toLowerCase();
          }
        }
      }
      return bestMatch;
    });
    return corrected.join(" ");
  },
};

// ─── SEARCH PERSONALIZATION ENGINE ───────────────────────────────────────────

export const searchPersonalizationEngine = {
  getOrCreate(userId: number): SearchPersonalization {
    const existing = _searchPersonalization.get(userId);
    if (existing) return existing;
    const personalization: SearchPersonalization = {
      userId,
      recentSearches: [],
      preferredEntityTypes: [],
      topCreatorIds: [],
      topCommunityIds: [],
      topTags: [],
      searchHistory: [],
      updatedAt: new Date(),
    };
    _searchPersonalization.set(userId, personalization);
    return personalization;
  },

  recordSearch(userId: number, query: string): SearchPersonalization {
    const p = this.getOrCreate(userId);
    p.recentSearches = [query, ...p.recentSearches.filter(q => q !== query)].slice(0, 20);
    p.searchHistory.unshift({ query, at: new Date() });
    if (p.searchHistory.length > 100) p.searchHistory = p.searchHistory.slice(0, 100);
    p.updatedAt = new Date();
    return p;
  },

  recordClick(userId: number, entityType: SearchEntityType, authorId?: number, communityId?: string, tags?: string[]): SearchPersonalization {
    const p = this.getOrCreate(userId);
    // Update preferred entity types
    if (!p.preferredEntityTypes.includes(entityType)) {
      p.preferredEntityTypes.unshift(entityType);
      p.preferredEntityTypes = p.preferredEntityTypes.slice(0, 5);
    }
    if (authorId && !p.topCreatorIds.includes(authorId)) {
      p.topCreatorIds.unshift(authorId);
      p.topCreatorIds = p.topCreatorIds.slice(0, 20);
    }
    if (communityId && !p.topCommunityIds.includes(communityId)) {
      p.topCommunityIds.unshift(communityId);
      p.topCommunityIds = p.topCommunityIds.slice(0, 10);
    }
    if (tags) {
      for (const tag of tags) {
        if (!p.topTags.includes(tag)) p.topTags.unshift(tag);
      }
      p.topTags = p.topTags.slice(0, 30);
    }
    p.updatedAt = new Date();
    return p;
  },

  getPersonalization(userId: number): SearchPersonalization | null {
    return _searchPersonalization.get(userId) ?? null;
  },
};

// ─── UNIVERSAL SEARCH ORCHESTRATOR ───────────────────────────────────────────

export const universalSearch = {
  async search(params: {
    query: string;
    userId?: number;
    entityTypes?: SearchEntityType[];
    sortBy?: SearchSortBy;
    page?: number;
    pageSize?: number;
    useAI?: boolean;
  }): Promise<SearchResponse> {
    const start = Date.now();
    const { query, userId, entityTypes, sortBy = "relevance", page = 1, pageSize = 20, useAI = true } = params;

    // Record search for trending and personalization
    trendingSearchEngine.recordSearch(query, entityTypes?.[0]);
    if (userId) searchPersonalizationEngine.recordSearch(userId, query);

    // Execute search
    let results: SearchResult[];
    if (useAI) {
      results = await aiIntentSearchEngine.search(query, userId, pageSize * 3);
    } else {
      const fuzzy = fuzzySearchEngine.search(query, entityTypes, pageSize * 2);
      const semantic = semanticSearchEngine.search(query, entityTypes, pageSize * 2);
      const seen = new Set<string>();
      results = [];
      for (const r of [...fuzzy, ...semantic]) {
        if (!seen.has(r.document.id)) { seen.add(r.document.id); results.push(r); }
      }
    }

    // Apply sort
    if (sortBy === "recency") {
      results.sort((a, b) => b.document.updatedAt.getTime() - a.document.updatedAt.getTime());
    } else if (sortBy === "popularity") {
      results.sort((a, b) => (b.document.viewCount + b.document.likeCount) - (a.document.viewCount + a.document.likeCount));
    } else if (sortBy === "trending") {
      results.sort((a, b) => b.document.trendingScore - a.document.trendingScore);
    }

    // Paginate
    const totalCount = results.length;
    const start_idx = (page - 1) * pageSize;
    const pageResults = results.slice(start_idx, start_idx + pageSize);
    pageResults.forEach((r, i) => r.rank = start_idx + i + 1);

    // Get suggestions and related
    const suggestions = predictiveSearchEngine.getSuggestions(query.slice(0, 3), userId, 5).map(s => s.suggestion);
    const relatedSearches = predictiveSearchEngine.getRelatedSearches(query, 5);
    const trending = trendingSearchEngine.getTrending(entityTypes?.[0], undefined, 5).map(t => t.query);

    // Log query
    const queryId = `q_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const executionTimeMs = Date.now() - start;
    _searchQueries.set(queryId, {
      id: queryId,
      userId,
      rawQuery: query,
      normalizedQuery: query.toLowerCase().trim(),
      entityTypeFilter: entityTypes,
      sortBy,
      page,
      pageSize,
      executedAt: new Date(),
      resultCount: totalCount,
      executionTimeMs,
    });

    return {
      queryId,
      results: pageResults,
      totalCount,
      page,
      pageSize,
      hasMore: start_idx + pageSize < totalCount,
      suggestions,
      relatedSearches,
      trendingInContext: trending,
      executionTimeMs,
    };
  },

  recordAnalytics(analytics: Omit<SearchAnalytics, "recordedAt">): void {
    _searchAnalytics.push({ ...analytics, recordedAt: new Date() });
    if (analytics.clickedResultId && analytics.userId) {
      const doc = searchIndexEngine.getDocument(analytics.clickedResultId);
      if (doc) {
        searchPersonalizationEngine.recordClick(
          analytics.userId, doc.entityType, doc.authorId, doc.communityId, doc.tags
        );
      }
    }
  },

  getSearchAnalytics(limit = 100): SearchAnalytics[] {
    return _searchAnalytics.slice(-limit);
  },

  getSearchDashboard(): {
    totalDocuments: number;
    totalSearches: number;
    avgExecutionTimeMs: number;
    topQueries: Array<{ query: string; count: number }>;
    noResultsRate: number;
    indexByType: Record<string, number>;
  } {
    const queries = Array.from(_searchQueries.values());
    const noResults = _searchAnalytics.filter(a => a.noResultsQuery).length;
    const queryFreq: Record<string, number> = {};
    for (const q of queries) {
      queryFreq[q.normalizedQuery] = (queryFreq[q.normalizedQuery] ?? 0) + 1;
    }
    const topQueries = Object.entries(queryFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
    const stats = searchIndexEngine.getIndexStats();
    return {
      totalDocuments: stats.total,
      totalSearches: queries.length,
      avgExecutionTimeMs: queries.length > 0
        ? queries.reduce((s, q) => s + q.executionTimeMs, 0) / queries.length
        : 0,
      topQueries,
      noResultsRate: _searchAnalytics.length > 0 ? noResults / _searchAnalytics.length : 0,
      indexByType: stats.byType,
    };
  },
};
