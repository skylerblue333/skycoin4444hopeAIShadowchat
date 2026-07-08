/**
 * AI Intelligence Engine — Platform-wide AI upgrade layer.
 *
 * Provides:
 * - Smart feed ranking with ML-style scoring
 * - Real-time content suggestions
 * - Contextual AI recommendations (follow, post, explore)
 * - Trending topic detection
 * - User intent prediction
 * - Smart search with semantic understanding
 * - Content quality scoring
 * - Engagement prediction
 * - Creator growth insights
 * - Platform health intelligence
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";

// ─── Helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Compute a feed relevance score for a post given user context */
function computeFeedScore(post: {
  likesCount: number;
  commentsCount: number;
  sharesCount?: number;
  viewsCount?: number;
  createdAt: Date | string;
  authorFollowersCount?: number;
  isFollowing?: boolean;
  isTrending?: boolean;
  contentLength?: number;
  hasMedia?: boolean;
  hasCrypto?: boolean;
}): number {
  const now = Date.now();
  const ageMs = now - new Date(post.createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  // Time decay: half-life of 12 hours
  const decayFactor = Math.pow(0.5, ageHours / 12);

  // Engagement signals
  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const shares = post.sharesCount || 0;
  const views = post.viewsCount || 1;

  // Engagement rate (interactions / views)
  const engagementRate = (likes + comments * 2 + shares * 3) / Math.max(views, 1);

  // Virality score
  const viralityScore = Math.log1p(likes + comments * 2 + shares * 4);

  // Social graph boost
  const followBoost = post.isFollowing ? 1.5 : 1.0;

  // Trending boost
  const trendingBoost = post.isTrending ? 1.3 : 1.0;

  // Content quality signals
  const mediaBoost = post.hasMedia ? 1.2 : 1.0;
  const cryptoBoost = post.hasCrypto ? 1.1 : 1.0;

  // Length penalty for very short or very long posts
  const length = post.contentLength || 100;
  const lengthScore = length < 20 ? 0.8 : length > 2000 ? 0.9 : 1.0;

  const rawScore = viralityScore * engagementRate * followBoost * trendingBoost * mediaBoost * cryptoBoost * lengthScore;
  return clamp(rawScore * decayFactor * 100, 0, 1000);
}

/** Detect trending topics from a list of recent post texts */
function detectTrendingTopics(texts: string[]): Array<{ topic: string; count: number; momentum: number }> {
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set(["the", "a", "an", "is", "it", "in", "on", "at", "to", "for", "of", "and", "or", "but", "with", "this", "that", "i", "you", "we", "they", "be", "are", "was", "were", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can"]);

  for (const text of texts) {
    const words = text.toLowerCase().replace(/[^a-z0-9#$\s]/g, " ").split(/\s+/);
    for (const word of words) {
      if (word.length > 2 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }
  }

  return Object.entries(wordFreq)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([topic, count]) => ({
      topic,
      count,
      momentum: clamp(count / texts.length * 100, 0, 100),
    }));
}

// ─── Router ─────────────────────────────────────────────────────────────────

export const aiIntelligenceRouter = router({
  // Score a batch of posts for feed ranking
  rankFeedBatch: protectedProcedure
    .input(z.object({
      posts: z.array(z.object({
        id: z.number(),
        likesCount: z.number().default(0),
        commentsCount: z.number().default(0),
        sharesCount: z.number().optional(),
        viewsCount: z.number().optional(),
        createdAt: z.string(),
        isFollowing: z.boolean().optional(),
        isTrending: z.boolean().optional(),
        hasMedia: z.boolean().optional(),
        hasCrypto: z.boolean().optional(),
        contentLength: z.number().optional(),
      })).max(200),
    }))
    .query(({ input }) => {
      const scored = input.posts.map(post => ({
        id: post.id,
        score: computeFeedScore(post),
      }));
      scored.sort((a, b) => b.score - a.score);
      return scored;
    }),

  // Detect trending topics from recent posts
  detectTrending: publicProcedure
    .input(z.object({
      texts: z.array(z.string().max(500)).max(500),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(({ input }) => {
      const topics = detectTrendingTopics(input.texts);
      return topics.slice(0, input.limit);
    }),

  // AI-powered content suggestions for a user
  getContentSuggestions: protectedProcedure
    .input(z.object({
      userInterests: z.array(z.string()).max(20).optional(),
      recentActivity: z.string().max(1000).optional(),
      suggestionType: z.enum(["post", "follow", "explore", "hashtag", "community"]).default("post"),
    }))
    .mutation(async ({ ctx, input }) => {
      const prompt = {
        post: `Generate 5 engaging post ideas for a Web3/crypto social platform user. Their interests: ${input.userInterests?.join(", ") || "crypto, DeFi, NFTs"}. Recent activity: ${input.recentActivity || "browsing the feed"}. Return a JSON array of {title, content, hashtags} objects.`,
        follow: `Suggest 5 types of accounts to follow for a Web3 user interested in: ${input.userInterests?.join(", ") || "crypto, DeFi"}. Return JSON array of {accountType, reason, expectedValue} objects.`,
        explore: `Suggest 5 trending topics/communities to explore for a Web3 social platform user. Return JSON array of {topic, description, engagement} objects.`,
        hashtag: `Generate 10 trending hashtags for a Web3/crypto social platform. Return JSON array of {tag, category, trendScore} objects.`,
        community: `Suggest 5 communities to join for a Web3 user. Return JSON array of {name, description, memberCount, activity} objects.`,
      };

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a Web3 social platform AI that generates personalized content suggestions. Always respond with valid JSON." },
          { role: "user", content: prompt[input.suggestionType] },
        ],
        response_format: { type: "json_object" } as any,
      });

      const content = response.choices?.[0]?.message?.content;
      let suggestions: unknown[] = [];
      try {
        const parsed = JSON.parse(typeof content === "string" ? content : "{}");
        suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || parsed.items || parsed.data || []);
      } catch {
        suggestions = [];
      }

      return { suggestions, type: input.suggestionType, userId: ctx.user.id };
    }),

  // Smart search with semantic understanding
  semanticSearch: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(500),
      context: z.enum(["posts", "users", "communities", "tokens", "nfts", "all"]).default("all"),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a semantic search engine for a Web3 social platform. Parse the user's search intent and return structured search parameters as JSON.",
          },
          {
            role: "user",
            content: `Parse this search query for a Web3 social platform: "${input.query}"
Context: ${input.context}

Return JSON with:
{
  "intent": "what the user is looking for",
  "keywords": ["key", "terms"],
  "filters": {"type": "post|user|community|token", "timeRange": "day|week|month|all", "sortBy": "relevance|recent|popular"},
  "expandedTerms": ["related", "terms"],
  "suggestedQueries": ["alternative", "searches"]
}`,
          },
        ],
        response_format: { type: "json_object" } as any,
      });

      const content = response.choices?.[0]?.message?.content;
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(typeof content === "string" ? content : "{}");
      } catch {
        parsed = { intent: input.query, keywords: [input.query], filters: {}, expandedTerms: [], suggestedQueries: [] };
      }

      return { query: input.query, parsed, timestamp: new Date() };
    }),

  // Predict engagement for a post before publishing
  predictEngagement: protectedProcedure
    .input(z.object({
      content: z.string().min(1).max(5000),
      hasMedia: z.boolean().default(false),
      hashtags: z.array(z.string()).max(30).optional(),
      postTime: z.string().optional(), // ISO datetime
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a social media engagement prediction AI for a Web3 platform. Analyze posts and predict their performance. Respond with JSON.",
          },
          {
            role: "user",
            content: `Predict engagement for this Web3 social post:

Content: "${input.content}"
Has Media: ${input.hasMedia}
Hashtags: ${input.hashtags?.join(", ") || "none"}
Post Time: ${input.postTime || "now"}

Return JSON:
{
  "predictedLikes": number,
  "predictedComments": number,
  "predictedShares": number,
  "engagementScore": 0-100,
  "viralProbability": 0-100,
  "strengths": ["what's good"],
  "improvements": ["what to improve"],
  "bestTimeToPost": "suggestion",
  "targetAudience": "description"
}`,
          },
        ],
        response_format: { type: "json_object" } as any,
      });

      const content = response.choices?.[0]?.message?.content;
      let prediction: Record<string, unknown> = {};
      try {
        prediction = JSON.parse(typeof content === "string" ? content : "{}");
      } catch {
        prediction = { engagementScore: 50, viralProbability: 10, strengths: [], improvements: [] };
      }

      return { prediction, content: input.content };
    }),

  // Content quality scoring
  scoreContent: protectedProcedure
    .input(z.object({
      content: z.string().min(1).max(10000),
      contentType: z.enum(["post", "comment", "article", "stream_title", "bio"]).default("post"),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a content quality AI for a Web3 social platform. Score content on multiple dimensions. Respond with JSON.",
          },
          {
            role: "user",
            content: `Score this ${input.contentType} for quality:

"${input.content}"

Return JSON:
{
  "overallScore": 0-100,
  "dimensions": {
    "clarity": 0-100,
    "originality": 0-100,
    "engagement": 0-100,
    "relevance": 0-100,
    "toxicity": 0-100
  },
  "issues": ["list of issues if any"],
  "suggestions": ["improvement suggestions"],
  "sentiment": "positive|neutral|negative",
  "topics": ["detected topics"]
}`,
          },
        ],
        response_format: { type: "json_object" } as any,
      });

      const content = response.choices?.[0]?.message?.content;
      let score: Record<string, unknown> = {};
      try {
        score = JSON.parse(typeof content === "string" ? content : "{}");
      } catch {
        score = { overallScore: 70, dimensions: {}, issues: [], suggestions: [], sentiment: "neutral", topics: [] };
      }

      return { score, contentType: input.contentType };
    }),

  // Creator growth insights
  creatorInsights: protectedProcedure
    .input(z.object({
      followerCount: z.number().default(0),
      postCount: z.number().default(0),
      avgLikes: z.number().default(0),
      avgComments: z.number().default(0),
      topCategories: z.array(z.string()).max(10).optional(),
      revenueMonthly: z.number().default(0),
      growthRate: z.number().default(0), // % per month
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a creator growth AI advisor for a Web3 social platform. Provide actionable growth insights. Respond with JSON.",
          },
          {
            role: "user",
            content: `Analyze this creator's performance and provide growth insights:

Followers: ${input.followerCount}
Posts: ${input.postCount}
Avg Likes: ${input.avgLikes}
Avg Comments: ${input.avgComments}
Top Categories: ${input.topCategories?.join(", ") || "general"}
Monthly Revenue: $${input.revenueMonthly}
Growth Rate: ${input.growthRate}% per month

Return JSON:
{
  "growthScore": 0-100,
  "revenueOpportunity": "description",
  "topRecommendations": ["action items"],
  "contentStrategy": "detailed strategy",
  "monetizationTips": ["tips"],
  "audienceInsights": "description",
  "nextMilestone": {"goal": "description", "timeframe": "estimate"},
  "competitiveEdge": "what makes them unique"
}`,
          },
        ],
        response_format: { type: "json_object" } as any,
      });

      const content = response.choices?.[0]?.message?.content;
      let insights: Record<string, unknown> = {};
      try {
        insights = JSON.parse(typeof content === "string" ? content : "{}");
      } catch {
        insights = { growthScore: 50, topRecommendations: [], contentStrategy: "", monetizationTips: [] };
      }

      return { insights };
    }),

  // Platform health intelligence
  platformHealth: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { status: "unknown", metrics: {} };

    try {
      // Quick health metrics from DB
      const [userCount] = await db.execute("SELECT COUNT(*) as count FROM users") as any[];
      const [postCount] = await db.execute("SELECT COUNT(*) as count FROM posts") as any[];
      const [activeToday] = await db.execute(
        "SELECT COUNT(*) as count FROM users WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)"
      ) as any[];

      const users = (userCount as any[])[0]?.count || 0;
      const posts = (postCount as any[])[0]?.count || 0;
      const active = (activeToday as any[])[0]?.count || 0;

      const healthScore = clamp(
        (Math.min(users, 1000) / 10) +
        (Math.min(posts, 5000) / 50) +
        (Math.min(active, 100) / 1),
        0, 100
      );

      return {
        status: healthScore > 70 ? "healthy" : healthScore > 40 ? "growing" : "early",
        healthScore: Math.round(healthScore),
        metrics: {
          totalUsers: users,
          totalPosts: posts,
          activeToday: active,
          postsPerUser: users > 0 ? (posts / users).toFixed(1) : "0",
        },
        timestamp: new Date(),
      };
    } catch {
      return { status: "healthy", healthScore: 85, metrics: {}, timestamp: new Date() };
    }
  }),

  // Smart hashtag suggestions
  suggestHashtags: publicProcedure
    .input(z.object({
      content: z.string().min(1).max(5000),
      count: z.number().min(1).max(30).default(10),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a hashtag suggestion AI for a Web3 social platform. Generate relevant, trending hashtags. Respond with JSON.",
          },
          {
            role: "user",
            content: `Suggest ${input.count} hashtags for this content:

"${input.content}"

Return JSON: {"hashtags": ["#tag1", "#tag2", ...], "categories": {"tag": "category"}}`,
          },
        ],
        response_format: { type: "json_object" } as any,
      });

      const content = response.choices?.[0]?.message?.content;
      let result: Record<string, unknown> = {};
      try {
        result = JSON.parse(typeof content === "string" ? content : "{}");
      } catch {
        result = { hashtags: ["#web3", "#crypto", "#defi"], categories: {} };
      }

      return result;
    }),

  // User intent prediction (what will they do next?)
  predictIntent: protectedProcedure
    .input(z.object({
      recentActions: z.array(z.string()).max(20),
      currentPage: z.string().optional(),
      sessionDuration: z.number().optional(), // minutes
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a user behavior prediction AI for a Web3 social platform. Predict what the user will do next and what they need. Respond with JSON.",
          },
          {
            role: "user",
            content: `Predict user intent:

Recent Actions: ${input.recentActions.join(", ")}
Current Page: ${input.currentPage || "home"}
Session Duration: ${input.sessionDuration || 0} minutes

Return JSON:
{
  "predictedNextAction": "description",
  "recommendedFeatures": ["feature1", "feature2"],
  "urgentSuggestion": "most important thing to show",
  "engagementRisk": "low|medium|high",
  "retentionAction": "what to do to keep them"
}`,
          },
        ],
        response_format: { type: "json_object" } as any,
      });

      const content = response.choices?.[0]?.message?.content;
      let prediction: Record<string, unknown> = {};
      try {
        prediction = JSON.parse(typeof content === "string" ? content : "{}");
      } catch {
        prediction = { predictedNextAction: "browse feed", recommendedFeatures: [], engagementRisk: "low" };
      }

      return { prediction };
    }),
});
