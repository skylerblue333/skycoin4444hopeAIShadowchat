/**
 * SKYCOIN4444 Behavior Engine — HOPE AI v2
 *
 * User archetype classification, behavior signal recording,
 * confidence scoring, explainability layer, and adaptive recommendations.
 *
 * Uses: user_behavior_signals, user_archetypes tables
 * Emits: BEHAVIOR_SIGNAL_RECORDED, ARCHETYPE_COMPUTED, USER_ARCHETYPE_CHANGED,
 *        AI_RECOMMENDATION_GENERATED, RETENTION_DROPPING
 *
 * Free Will Feature: Each user gets a "Behavior Profile Memory" that evolves
 * over time, creating personalized reality versions of the platform.
 */

import { eq, gte, desc, count, sql } from "drizzle-orm";
import { getDb } from "./db.js";
import { eventBus } from "./event-bus.js";
import { userBehaviorSignals, userArchetypes } from "../drizzle/schema.js";
import { invokeLLM } from "./_core/llm.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ArchetypeLabel =
  | "investor"
  | "creator"
  | "gamer"
  | "builder"
  | "speculator"
  | "learner"
  | "ambassador";

export interface BehaviorProfile {
  userId: number;
  archetype: ArchetypeLabel;
  secondaryArchetype: string | null;
  scores: Record<ArchetypeLabel, number>;
  confidence: number;
  recentSignals: string[];
  personalityTraits: string[];
  riskTolerance: "low" | "medium" | "high";
  engagementStyle: "passive" | "active" | "power";
  computedAt: Date;
}

export interface AdaptiveRecommendation {
  userId: number;
  archetype: ArchetypeLabel;
  recommendations: Array<{
    action: string;
    reason: string;
    priority: "low" | "medium" | "high";
    tokenIncentive?: string;
  }>;
  explanation: string;
}

// ─── Behavior Engine ──────────────────────────────────────────────────────────

export class BehaviorEngine {
  private readonly SIGNAL_WEIGHTS: Record<string, Record<ArchetypeLabel, number>> = {
    token_swap: { investor: 3, creator: 0, gamer: 1, builder: 0, speculator: 4, learner: 1, ambassador: 0 },
    stake_tokens: { investor: 4, creator: 0, gamer: 0, builder: 2, speculator: 1, learner: 1, ambassador: 1 },
    create_content: { investor: 0, creator: 5, gamer: 0, builder: 2, speculator: 0, learner: 2, ambassador: 2 },
    play_game: { investor: 0, creator: 0, gamer: 5, builder: 1, speculator: 2, learner: 1, ambassador: 0 },
    vote_governance: { investor: 2, creator: 1, gamer: 0, builder: 3, speculator: 0, learner: 2, ambassador: 4 },
    complete_quest: { investor: 1, creator: 1, gamer: 4, builder: 2, speculator: 1, learner: 3, ambassador: 1 },
    refer_user: { investor: 1, creator: 2, gamer: 1, builder: 1, speculator: 1, learner: 1, ambassador: 5 },
    use_ai_twin: { investor: 2, creator: 2, gamer: 1, builder: 3, speculator: 1, learner: 4, ambassador: 2 },
    send_message: { investor: 0, creator: 2, gamer: 2, builder: 1, speculator: 0, learner: 1, ambassador: 3 },
    view_analytics: { investor: 3, creator: 1, gamer: 1, builder: 4, speculator: 2, learner: 3, ambassador: 1 },
  };

  /**
   * Record a behavior signal for a user.
   * Triggers archetype recomputation if enough signals accumulate.
   */
  async recordSignal(
    userId: number,
    signalType: string,
    value = 1.0
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.insert(userBehaviorSignals).values({
      userId,
      signalType,
      value: String(value),
      recordedAt: new Date(),
    });

    eventBus.publish("BEHAVIOR_SIGNAL_RECORDED", { userId, signalType, value }, userId);

    // Recompute archetype every 10 signals
    const [{ total }] = await db
      .select({ total: count() })
      .from(userBehaviorSignals)
      .where(eq(userBehaviorSignals.userId, userId));

    if (total % 10 === 0) {
      await this.computeArchetype(userId);
    }
  }

  /**
   * Compute and persist user archetype from behavior signals.
   */
  async computeArchetype(userId: number): Promise<BehaviorProfile> {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const signals = await db
      .select()
      .from(userBehaviorSignals)
      .where(
        gte(
          userBehaviorSignals.recordedAt,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        )
      )
      .orderBy(desc(userBehaviorSignals.recordedAt))
      .limit(200);

    const userSignals = signals.filter((s) => s.userId === userId);

    // Compute archetype scores
    const scores: Record<ArchetypeLabel, number> = {
      investor: 0, creator: 0, gamer: 0, builder: 0,
      speculator: 0, learner: 0, ambassador: 0,
    };

    for (const signal of userSignals) {
      const weights = this.SIGNAL_WEIGHTS[signal.signalType];
      if (weights) {
        const signalValue = Number(signal.value);
        for (const [archetype, weight] of Object.entries(weights)) {
          scores[archetype as ArchetypeLabel] += weight * signalValue;
        }
      }
    }

    // Normalize scores
    const maxScore = Math.max(...Object.values(scores), 1);
    const normalizedScores = Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, Math.round((v / maxScore) * 100) / 100])
    ) as Record<ArchetypeLabel, number>;

    // Primary archetype = highest score
    const sortedArchetypes = Object.entries(normalizedScores).sort(([, a], [, b]) => b - a);
    const primary = sortedArchetypes[0][0] as ArchetypeLabel;
    const secondary = sortedArchetypes[1][0];
    const confidence = Math.min(
      0.99,
      userSignals.length > 50 ? 0.9 : userSignals.length > 20 ? 0.7 : 0.5
    );

    // Persist archetype
    const [existing] = await db
      .select()
      .from(userArchetypes)
      .where(eq(userArchetypes.userId, userId))
      .limit(1);

    const archetypeData = {
      userId,
      primary,
      secondary,
      scores: normalizedScores,
      confidence: String(confidence),
      computedAt: new Date(),
    };

    if (existing) {
      await db.update(userArchetypes).set(archetypeData).where(eq(userArchetypes.userId, userId));
      if (existing.primary !== primary) {
        eventBus.publish("USER_ARCHETYPE_CHANGED", { userId, from: existing.primary, to: primary }, userId);
      }
    } else {
      await db.insert(userArchetypes).values(archetypeData);
    }

    eventBus.publish("ARCHETYPE_COMPUTED", { userId, archetype: primary, confidence }, userId);

    const recentSignals = userSignals.slice(0, 10).map((s) => s.signalType);
    const riskTolerance = this.computeRiskTolerance(normalizedScores);
    const engagementStyle = this.computeEngagementStyle(userSignals.length);

    return {
      userId,
      archetype: primary,
      secondaryArchetype: secondary,
      scores: normalizedScores,
      confidence,
      recentSignals,
      personalityTraits: this.getPersonalityTraits(primary),
      riskTolerance,
      engagementStyle,
      computedAt: new Date(),
    };
  }

  /**
   * Get behavior profile for a user (from DB or compute fresh).
   */
  async getBehaviorProfile(userId: number): Promise<BehaviorProfile | null> {
    const db = await getDb();
    if (!db) return null;

    const [archetype] = await db
      .select()
      .from(userArchetypes)
      .where(eq(userArchetypes.userId, userId))
      .limit(1);

    if (!archetype) {
      // No profile yet — compute from signals
      const [{ total }] = await db
        .select({ total: count() })
        .from(userBehaviorSignals)
        .where(eq(userBehaviorSignals.userId, userId));

      if (total === 0) return null;
      return this.computeArchetype(userId);
    }

    const recentSignals = await db
      .select({ signalType: userBehaviorSignals.signalType })
      .from(userBehaviorSignals)
      .where(eq(userBehaviorSignals.userId, userId))
      .orderBy(desc(userBehaviorSignals.recordedAt))
      .limit(10);

    const scores = (archetype.scores as Record<ArchetypeLabel, number>) ?? {} as Record<ArchetypeLabel, number>;

    return {
      userId,
      archetype: archetype.primary as ArchetypeLabel,
      secondaryArchetype: archetype.secondary ?? null,
      scores,
      confidence: Number(archetype.confidence),
      recentSignals: recentSignals.map((s) => s.signalType),
      personalityTraits: this.getPersonalityTraits(archetype.primary as ArchetypeLabel),
      riskTolerance: this.computeRiskTolerance(scores),
      engagementStyle: this.computeEngagementStyle(recentSignals.length),
      computedAt: archetype.computedAt,
    };
  }

  /**
   * Generate LLM-backed adaptive recommendations for a user.
   */
  async getAdaptiveRecommendations(userId: number): Promise<AdaptiveRecommendation> {
    const profile = await this.getBehaviorProfile(userId);

    if (!profile) {
      return {
        userId,
        archetype: "learner",
        recommendations: [
          { action: "Complete your profile", reason: "Get personalized recommendations", priority: "high" },
          { action: "Explore HOPE AI Twin", reason: "Discover your AI companion", priority: "high" },
          { action: "Join a quest", reason: "Earn XP and tokens", priority: "medium" },
        ],
        explanation: "New user — start with the basics to unlock personalized features.",
      };
    }

    const prompt = `You are HOPE AI, the intelligence layer of SKYCOIN4444 ecosystem.
User archetype: ${profile.archetype} (confidence: ${(profile.confidence * 100).toFixed(0)}%)
Secondary: ${profile.secondaryArchetype ?? "none"}
Risk tolerance: ${profile.riskTolerance}
Engagement style: ${profile.engagementStyle}
Recent activities: ${profile.recentSignals.join(", ")}

Generate 3 specific, actionable recommendations for this user in JSON format:
{
  "recommendations": [
    { "action": "...", "reason": "...", "priority": "high|medium|low", "tokenIncentive": "optional token reward" }
  ],
  "explanation": "one sentence explaining the personalization logic"
}`;

    try {
      const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      const rawContent = response.choices[0].message.content ?? "{}";
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          recommendations: AdaptiveRecommendation["recommendations"];
          explanation: string;
        };
        const result: AdaptiveRecommendation = {
          userId,
          archetype: profile.archetype,
          recommendations: parsed.recommendations ?? [],
          explanation: parsed.explanation ?? "",
        };
        eventBus.publish("AI_RECOMMENDATION_GENERATED", { userId, archetype: profile.archetype }, userId);
        return result;
      }
    } catch {
      // Fall through to default
    }

    return this.getDefaultRecommendations(userId, profile);
  }

  /**
   * Check platform-wide retention health.
   */
  async checkRetentionHealth(): Promise<{ healthy: boolean; activeUsers7d: number; signal: string }> {
    const db = await getDb();
    if (!db) return { healthy: true, activeUsers7d: 0, signal: "unknown" };

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [{ total }] = await db
      .select({ total: sql<number>`COUNT(DISTINCT ${userBehaviorSignals.userId})` })
      .from(userBehaviorSignals)
      .where(gte(userBehaviorSignals.recordedAt, since));

    const activeUsers7d = Number(total);
    const healthy = activeUsers7d > 10;

    if (!healthy) {
      eventBus.publish("RETENTION_DROPPING", { activeUsers7d, window: "7d" });
    }

    return { healthy, activeUsers7d, signal: healthy ? "stable" : "dropping" };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private computeRiskTolerance(scores: Record<ArchetypeLabel, number>): "low" | "medium" | "high" {
    const highRisk = (scores.speculator ?? 0) + (scores.gamer ?? 0);
    const lowRisk = (scores.learner ?? 0) + (scores.ambassador ?? 0);
    if (highRisk > 1.2) return "high";
    if (lowRisk > 1.2) return "low";
    return "medium";
  }

  private computeEngagementStyle(signalCount: number): "passive" | "active" | "power" {
    if (signalCount > 100) return "power";
    if (signalCount > 20) return "active";
    return "passive";
  }

  private getPersonalityTraits(archetype: ArchetypeLabel): string[] {
    const traits: Record<ArchetypeLabel, string[]> = {
      investor: ["analytical", "patient", "risk-aware", "long-term focused"],
      creator: ["expressive", "collaborative", "community-driven", "innovative"],
      gamer: ["competitive", "achievement-oriented", "reward-seeking", "social"],
      builder: ["technical", "systematic", "detail-oriented", "platform-focused"],
      speculator: ["opportunistic", "fast-moving", "high-risk tolerance", "trend-aware"],
      learner: ["curious", "methodical", "knowledge-seeking", "growth-oriented"],
      ambassador: ["social", "community-first", "influence-driven", "network-builder"],
    };
    return traits[archetype] ?? [];
  }

  private getDefaultRecommendations(userId: number, profile: BehaviorProfile): AdaptiveRecommendation {
    const archetypeRecs: Record<ArchetypeLabel, AdaptiveRecommendation["recommendations"]> = {
      investor: [
        { action: "Stake SKY4444 tokens", reason: "Earn passive yield on your holdings", priority: "high", tokenIncentive: "5% APY in SKY4444" },
        { action: "View token market dashboard", reason: "Track your portfolio performance", priority: "high" },
        { action: "Vote on governance proposals", reason: "Influence platform economics", priority: "medium" },
      ],
      creator: [
        { action: "Publish content in Creator Hub", reason: "Earn CREATOR tokens for quality content", priority: "high", tokenIncentive: "50 CREATOR tokens" },
        { action: "Set up AI Twin for fans", reason: "Scale your creator presence with AI", priority: "high" },
        { action: "Join Creator Guild", reason: "Collaborate and earn bonus rewards", priority: "medium" },
      ],
      gamer: [
        { action: "Complete daily quests", reason: "Earn XP and level up", priority: "high", tokenIncentive: "100 XP + 10 SKY4444" },
        { action: "Join tournament", reason: "Compete for GOLD token prizes", priority: "high", tokenIncentive: "500 GOLD" },
        { action: "Unlock achievement badges", reason: "Boost your reputation score", priority: "medium" },
      ],
      builder: [
        { action: "Explore Developer Portal", reason: "Build on SKYCOIN4444 ecosystem", priority: "high" },
        { action: "Submit governance proposal", reason: "Shape platform architecture", priority: "high" },
        { action: "Join AI Agent Network", reason: "Deploy your own AI agents", priority: "medium" },
      ],
      speculator: [
        { action: "Monitor token price curves", reason: "Identify trading opportunities", priority: "high" },
        { action: "Participate in token swaps", reason: "Capitalize on price movements", priority: "high" },
        { action: "Track emission cap status", reason: "Anticipate supply changes", priority: "medium" },
      ],
      learner: [
        { action: "Complete onboarding tutorial", reason: "Unlock full platform features", priority: "high", tokenIncentive: "50 XP" },
        { action: "Explore HOPE AI Twin", reason: "Get personalized learning path", priority: "high" },
        { action: "Read ecosystem documentation", reason: "Understand token mechanics", priority: "medium" },
      ],
      ambassador: [
        { action: "Refer new users", reason: "Earn referral bonuses in CHARITY tokens", priority: "high", tokenIncentive: "25 CHARITY per referral" },
        { action: "Join Ambassador Program", reason: "Become a regional cultural director", priority: "high" },
        { action: "Share governance votes", reason: "Drive community participation", priority: "medium" },
      ],
    };

    return {
      userId,
      archetype: profile.archetype,
      recommendations: archetypeRecs[profile.archetype] ?? [],
      explanation: `Personalized for ${profile.archetype} archetype with ${(profile.confidence * 100).toFixed(0)}% confidence.`,
    };
  }
}

export const behaviorEngine = new BehaviorEngine();
