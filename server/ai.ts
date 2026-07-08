/**
 * AI Service Module — Real LLM Integration
 * Uses the built-in Forge LLM API for:
 * - Content moderation (toxicity, spam, harmful content detection)
 * - Feed ranking (relevance scoring)
 * - Content recommendations
 * - Sentiment analysis
 */

import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// ═══════════════════════════════════════════════════════════════
// CONTENT MODERATION — Real AI
// ═══════════════════════════════════════════════════════════════

export interface ModerationResult {
  score: number; // 0-1, higher = more toxic
  flagged: boolean;
  categories: string[];
  reasoning: string;
  action: "approved" | "flagged" | "auto_removed";
}

export async function moderateContent(content: string, contentType: string): Promise<ModerationResult> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a content moderation AI for a social platform. Analyze the following ${contentType} for harmful content.
          
Rate the content on these categories:
- spam: Unsolicited promotional content or repetitive messages
- harassment: Personal attacks, bullying, or targeted abuse
- hate_speech: Content promoting hatred against protected groups
- violence: Threats or glorification of violence
- scam: Fraudulent schemes, phishing, or deceptive content
- nsfw: Sexually explicit or inappropriate content
- misinformation: Deliberately false or misleading claims

Respond in JSON format:
{
  "score": <number 0-1, overall toxicity>,
  "flagged": <boolean>,
  "categories": [<list of violated categories>],
  "reasoning": "<brief explanation>"
}`
        },
        {
          role: "user",
          content: `Moderate this ${contentType}: "${content}"`
        }
      ],
      responseFormat: { type: "json_object" },
      maxTokens: 300,
    });

    const text = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "";
    
    const parsed = JSON.parse(text);
    const score = Math.min(1, Math.max(0, Number(parsed.score) || 0));
    const flagged = score > 0.7 || parsed.flagged === true;
    
    // Log the AI analysis
    await db.logAiAnalytics({
      type: "moderation",
      input: content.substring(0, 200),
      output: text.substring(0, 500),
      confidence: score,
      processingTime: Date.now(),
    });

    return {
      score,
      flagged,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      reasoning: parsed.reasoning || "",
      action: score > 0.85 ? "auto_removed" : flagged ? "flagged" : "approved",
    };
  } catch (error) {
        // Fallback to keyword-based moderation if LLM fails
    return fallbackModeration(content);
  }
}

function fallbackModeration(content: string): ModerationResult {
  const lower = content.toLowerCase();
  const toxicPatterns = [
    { words: ["spam", "buy now", "click here", "free money"], category: "spam" },
    { words: ["scam", "hack", "exploit", "phishing"], category: "scam" },
    { words: ["kill", "murder", "attack"], category: "violence" },
  ];
  
  const flaggedCategories: string[] = [];
  for (const pattern of toxicPatterns) {
    if (pattern.words.some(w => lower.includes(w))) {
      flaggedCategories.push(pattern.category);
    }
  }
  
  const score = Math.min(1, flaggedCategories.length * 0.4);
  return {
    score,
    flagged: score > 0.7,
    categories: flaggedCategories,
    reasoning: "Fallback keyword-based moderation (LLM unavailable)",
    action: score > 0.7 ? "flagged" : "approved",
  };
}

// ═══════════════════════════════════════════════════════════════
// FEED RANKING — Real AI
// ═══════════════════════════════════════════════════════════════

export interface FeedRankingResult {
  postId: number;
  relevanceScore: number;
  engagementPrediction: number;
  reasoning: string;
}

export async function rankFeedPosts(
  posts: Array<{ id: number; content: string | null; likeCount: number; commentCount: number; viewCount: number; createdAt: Date }>,
  userId: number
): Promise<FeedRankingResult[]> {
  if (posts.length === 0) return [];
  
  // For efficiency, batch posts into a single LLM call
  const postSummaries = posts.slice(0, 20).map((p, i) => 
    `[${i}] "${(p.content || "").substring(0, 100)}" (likes:${p.likeCount}, comments:${p.commentCount}, views:${p.viewCount})`
  ).join("\n");

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a feed ranking algorithm. Score each post for relevance and predicted engagement.
Consider: content quality, engagement signals, recency, and diversity.
Return JSON array: [{"index": <number>, "relevance": <0-1>, "engagement_prediction": <0-1>, "reason": "<brief>"}]`
        },
        {
          role: "user",
          content: `Rank these posts for user engagement:\n${postSummaries}`
        }
      ],
      responseFormat: { type: "json_object" },
      maxTokens: 1000,
    });

    const text = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "[]";
    
    let rankings: any[];
    try {
      const parsed = JSON.parse(text);
      rankings = Array.isArray(parsed) ? parsed : (parsed.rankings || parsed.posts || []);
    } catch {
      rankings = [];
    }

    return posts.map((post, i) => {
      const ranking = rankings.find((r: any) => r.index === i);
      return {
        postId: post.id,
        relevanceScore: ranking?.relevance ?? 0.5,
        engagementPrediction: ranking?.engagement_prediction ?? 0.5,
        reasoning: ranking?.reason ?? "Default ranking",
      };
    });
  } catch (error) {
        // Fallback: rank by engagement
    return posts.map(post => ({
      postId: post.id,
      relevanceScore: Math.min(1, (post.likeCount + post.commentCount * 2) / 100),
      engagementPrediction: Math.min(1, post.viewCount / 1000),
      reasoning: "Engagement-based fallback",
    }));
  }
}

// ═══════════════════════════════════════════════════════════════
// CONTENT RECOMMENDATIONS — Real AI
// ═══════════════════════════════════════════════════════════════

export interface RecommendationResult {
  type: "community" | "creator" | "content";
  id: number;
  reason: string;
  confidence: number;
}

export async function getRecommendations(
  userId: number,
  userInterests: string[],
  recentActivity: string[]
): Promise<RecommendationResult[]> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a recommendation engine. Based on user interests and activity, suggest content categories and topics they might enjoy. Return JSON: {"recommendations": [{"type": "community"|"creator"|"content", "topic": "<topic>", "reason": "<why>", "confidence": <0-1>}]}`
        },
        {
          role: "user",
          content: `User interests: ${userInterests.join(", ") || "general"}\nRecent activity: ${recentActivity.join(", ") || "browsing"}`
        }
      ],
      responseFormat: { type: "json_object" },
      maxTokens: 500,
    });

    const text = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "{}";
    
    const parsed = JSON.parse(text);
    const recs = parsed.recommendations || [];
    
    return recs.map((r: any, i: number) => ({
      type: r.type || "content",
      id: i + 1,
      reason: r.reason || "Based on your interests",
      confidence: r.confidence || 0.5,
    }));
  } catch (error) {
        return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// SENTIMENT ANALYSIS — Real AI
// ═══════════════════════════════════════════════════════════════

export interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  score: number; // -1 to 1
  confidence: number;
  topics: string[];
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Analyze sentiment of the given text. Return JSON: {"sentiment": "positive"|"negative"|"neutral"|"mixed", "score": <-1 to 1>, "confidence": <0-1>, "topics": [<key topics>]}`
        },
        {
          role: "user",
          content: text.substring(0, 500)
        }
      ],
      responseFormat: { type: "json_object" },
      maxTokens: 200,
    });

    const responseText = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "{}";
    
    const parsed = JSON.parse(responseText);
    return {
      sentiment: parsed.sentiment || "neutral",
      score: Math.min(1, Math.max(-1, Number(parsed.score) || 0)),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  } catch (error) {
        return { sentiment: "neutral", score: 0, confidence: 0, topics: [] };
  }
}

// ═══════════════════════════════════════════════════════════════
// TRADING SIGNAL ANALYSIS — Real AI
// ═══════════════════════════════════════════════════════════════

export interface TradingSignal {
  action: "buy" | "sell" | "hold";
  confidence: number;
  reasoning: string;
  riskLevel: "low" | "medium" | "high";
}

export async function analyzeTradingSignal(
  tokenData: { price: number; volume24h: number; change24h: number; marketCap: number }
): Promise<TradingSignal> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a crypto trading analyst. Analyze the given token metrics and provide a trading signal. Be conservative and always note risks. Return JSON: {"action": "buy"|"sell"|"hold", "confidence": <0-1>, "reasoning": "<analysis>", "risk_level": "low"|"medium"|"high"}`
        },
        {
          role: "user",
          content: `Token metrics: Price: $${tokenData.price}, 24h Volume: $${tokenData.volume24h}, 24h Change: ${tokenData.change24h}%, Market Cap: $${tokenData.marketCap}`
        }
      ],
      responseFormat: { type: "json_object" },
      maxTokens: 300,
    });

    const text = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "{}";
    
    const parsed = JSON.parse(text);
    return {
      action: parsed.action || "hold",
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      reasoning: parsed.reasoning || "Insufficient data for analysis",
      riskLevel: parsed.risk_level || "medium",
    };
  } catch (error) {
        return { action: "hold", confidence: 0, reasoning: "AI analysis unavailable", riskLevel: "high" };
  }
}
