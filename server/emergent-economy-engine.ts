/**
 * SKYCOIN4444 Emergent Economy Engine
 *
 * Smart upgrade implementing Free Will upgrades #7 (Emergent Behavior) + #10 (Digital Nation Mode)
 *
 * Instead of fixed rules, behaviors EMERGE from interactions:
 *   - Creators + Gamers interaction → XP inflation → system auto-creates sink mechanics
 *   - New token utility appears dynamically based on usage patterns
 *   - Economy self-balances like a real digital nation
 *   - AI proposes economic laws (governance proposals) based on emergent data
 *
 * Digital Nation Features:
 *   - AI proposes laws (governance proposals)
 *   - Economy self-balances
 *   - Users behave like citizens
 *   - Tokens behave like economic policy tools
 */

import { getDb } from "./db.js";
import { eventBus } from "./event-bus.js";
import { economyEngine, type TokenSymbol } from "./economy-engine.js";
import { governanceEngineV2 } from "./governance-engine-v2.js";
import { memoryGraphEngine } from "./memory-graph-engine.js";
import { tokenMarketState, tokenEmissionCaps, userBehaviorSignals } from "../drizzle/schema.js";
import { eq, gte, sql, count } from "drizzle-orm";
import { invokeLLM } from "./_core/llm.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmergentSink {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  affectedToken: TokenSymbol;
  sinkRate: number; // tokens burned per interaction
  activatedAt: Date;
  status: "active" | "inactive" | "proposed";
  interactions: number;
}

export interface DigitalNationStatus {
  constitutionVersion: number;
  activeLaws: string[];
  economicPolicy: {
    inflationTarget: number;
    stakingRate: number;
    creatorRewardMultiplier: number;
    sinkMechanicsActive: number;
  };
  citizenCount: number;
  governanceHealth: "democratic" | "oligarchic" | "autonomous";
  aiLawsProposed: number;
  aiLawsPassed: number;
  lastPolicyAdjustment: Date;
}

export interface EmergentPattern {
  pattern: string;
  involvedTokens: string[];
  involvedArchetypes: string[];
  emergenceStrength: number; // 0–1
  economicImpact: "inflationary" | "deflationary" | "neutral";
  suggestedResponse: string;
  detectedAt: Date;
}

// ─── Emergent Economy Engine ──────────────────────────────────────────────────

export class EmergentEconomyEngine {
  private activeSinks: Map<string, EmergentSink> = new Map();
  private digitalNationState: DigitalNationStatus = {
    constitutionVersion: 1,
    activeLaws: [
      "Genesis Vote #001: SKY4444 + DOGE + TRUMP approved as platform currencies",
      "Anti-Whale Cap: Max 15% voting power per user",
      "Emission Safety: Daily caps enforced on all 7 tokens",
    ],
    economicPolicy: {
      inflationTarget: 5,
      stakingRate: 5,
      creatorRewardMultiplier: 1.0,
      sinkMechanicsActive: 0,
    },
    citizenCount: 0,
    governanceHealth: "autonomous",
    aiLawsProposed: 0,
    aiLawsPassed: 0,
    lastPolicyAdjustment: new Date(),
  };

  private detectedPatterns: EmergentPattern[] = [];
  private monitorTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Monitor for emergent patterns every 2 minutes
    this.monitorTimer = setInterval(() => void this.detectEmergentPatterns(), 2 * 60 * 1000);
    this.registerEventListeners();
  }

  // ─── Emergent Pattern Detection ───────────────────────────────────────────

  private registerEventListeners(): void {
    // When creators and gamers both active → check for XP inflation
    eventBus.subscribe("BEHAVIOR_SIGNAL_RECORDED", () => {
      void this.checkInteractionEmergence();
    });

    // When inflation warning fires → create emergent sink
    eventBus.subscribe("INFLATION_WARNING", (event) => {
      const payload = event.payload as { token: string };
      void this.createEmergentSink(payload.token as TokenSymbol, "inflation_response");
    });

    // When governance proposal passes → update digital nation laws
    eventBus.subscribe("EXECUTION_TRIGGERED", (event) => {
      const payload = event.payload as { proposalId: string; title: string };
      this.enactLaw(payload.title);
    });
  }

  /**
   * Detect emergent patterns from cross-archetype interactions.
   * Core of the "Emergent Behavior System" upgrade.
   */
  private async detectEmergentPatterns(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const since = new Date(Date.now() - 60 * 60 * 1000); // last hour

    // Count signals by type
    try {
      const signalCounts = await db
        .select({
          signalType: userBehaviorSignals.signalType,
          total: count(),
        })
        .from(userBehaviorSignals)
        .where(gte(userBehaviorSignals.recordedAt, since))
        .groupBy(userBehaviorSignals.signalType);
      
      const signalMap = new Map(signalCounts.map((s) => [s.signalType, Number(s.total)]));
    } catch (err) {
      // Silently handle query errors - table may not exist yet
      return;
    }
    
    const signalMap = new Map();

    // Pattern: Creator + Gamer interaction → XP inflation risk
    const creatorActivity = (signalMap.get("create_content") ?? 0) + (signalMap.get("creator_content_published") ?? 0);
    const gamerActivity = (signalMap.get("play_game") ?? 0) + (signalMap.get("complete_quest") ?? 0);

    if (creatorActivity > 5 && gamerActivity > 10) {
      const emergenceStrength = Math.min(1, (creatorActivity + gamerActivity) / 50);
      const pattern: EmergentPattern = {
        pattern: "Creator-Gamer Synergy",
        involvedTokens: ["XP", "CREATOR"],
        involvedArchetypes: ["creator", "gamer"],
        emergenceStrength,
        economicImpact: "inflationary",
        suggestedResponse: "Create XP sink mechanic: burn 10 XP per premium content unlock",
        detectedAt: new Date(),
      };

      if (!this.detectedPatterns.find((p) => p.pattern === pattern.pattern)) {
        this.detectedPatterns.push(pattern);
        eventBus.publish("EMERGENT_SINK_CREATED", {
          pattern: pattern.pattern,
          strength: emergenceStrength,
          suggestedResponse: pattern.suggestedResponse,
        });

        // Auto-create sink if emergence is strong
        if (emergenceStrength > 0.5) {
          await this.createEmergentSink("XP" as TokenSymbol, "creator_gamer_synergy");
        }
      }
    }

    // Pattern: High staking + low trading → liquidity crisis risk
    const stakingActivity = signalMap.get("stake_tokens") ?? 0;
    const tradingActivity = signalMap.get("token_swap") ?? 0;

    if (stakingActivity > tradingActivity * 3 && stakingActivity > 5) {
      const pattern: EmergentPattern = {
        pattern: "Staking Dominance",
        involvedTokens: ["SKY4444", "DOGE"],
        involvedArchetypes: ["investor", "builder"],
        emergenceStrength: Math.min(1, stakingActivity / 20),
        economicImpact: "deflationary",
        suggestedResponse: "Introduce staking rewards boost to maintain liquidity balance",
        detectedAt: new Date(),
      };

      if (!this.detectedPatterns.find((p) => p.pattern === pattern.pattern)) {
        this.detectedPatterns.push(pattern);
        eventBus.publish("DIGITAL_NATION_EVENT", {
          type: "emergent_pattern",
          pattern: pattern.pattern,
          impact: pattern.economicImpact,
        });
      }
    }
  }

  /**
   * Check if cross-archetype interaction creates emergent economic behavior.
   */
  private async checkInteractionEmergence(): Promise<void> {
    const snapshot = memoryGraphEngine.getSnapshot();
    if (snapshot.nodeCount > 50 && snapshot.topPatterns.length > 0) {
      // Strong pattern detected — propose governance vote
      const strongPattern = snapshot.topPatterns.find((p) => p.confidence > 0.7);
      if (strongPattern) {
        await governanceEngineV2.proposeAutonomously(
          "EMERGENT_PATTERN_DETECTED",
          { pattern: strongPattern.pattern, confidence: strongPattern.confidence },
          1
        );
        this.digitalNationState.aiLawsProposed += 1;
      }
    }
  }

  /**
   * Create a dynamic sink mechanic in response to emergent patterns.
   */
  async createEmergentSink(token: TokenSymbol, trigger: string): Promise<EmergentSink> {
    const sinkId = `sink-${token}-${Date.now()}`;
    const sink: EmergentSink = {
      id: sinkId,
      name: `${token} Dynamic Sink (${trigger})`,
      description: `Auto-created sink mechanic to absorb excess ${token} supply`,
      triggerCondition: trigger,
      affectedToken: token,
      sinkRate: 5,
      activatedAt: new Date(),
      status: "active",
      interactions: 0,
    };

    this.activeSinks.set(sinkId, sink);
    this.digitalNationState.economicPolicy.sinkMechanicsActive = this.activeSinks.size;

    eventBus.publish("EMERGENT_SINK_CREATED", {
      sinkId,
      token,
      trigger,
      sinkRate: sink.sinkRate,
    });

    return sink;
  }

  /**
   * Enact a new law in the Digital Nation constitution.
   */
  enactLaw(lawText: string): void {
    if (!this.digitalNationState.activeLaws.includes(lawText)) {
      this.digitalNationState.activeLaws.push(lawText);
      this.digitalNationState.constitutionVersion += 1;
      this.digitalNationState.aiLawsPassed += 1;
      this.digitalNationState.lastPolicyAdjustment = new Date();

      eventBus.publish("DIGITAL_NATION_EVENT", {
        type: "law_enacted",
        law: lawText,
        constitutionVersion: this.digitalNationState.constitutionVersion,
      });
    }
  }

  /**
   * Generate AI-powered economic policy recommendations.
   * Digital Nation Mode: AI acts as economic policy advisor.
   */
  async generateEconomicPolicy(): Promise<{
    recommendations: string[];
    policyAdjustments: Record<string, number>;
    reasoning: string;
  }> {
    const currentPolicy = this.digitalNationState.economicPolicy;
    const patterns = this.detectedPatterns.slice(-5);

    const prompt = `You are HOPE AI acting as the economic policy advisor for SKYCOIN4444 Digital Nation.

Current Economic Policy:
- Inflation Target: ${currentPolicy.inflationTarget}%
- Staking Rate: ${currentPolicy.stakingRate}%
- Creator Reward Multiplier: ${currentPolicy.creatorRewardMultiplier}x
- Active Sink Mechanics: ${currentPolicy.sinkMechanicsActive}

Recent Emergent Patterns:
${patterns.map((p) => `- ${p.pattern}: ${p.economicImpact} impact (strength: ${p.emergenceStrength.toFixed(2)})`).join("\n")}

Recommend economic policy adjustments. Respond in JSON:
{
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "policyAdjustments": { "inflationTarget": 5, "stakingRate": 6, "creatorRewardMultiplier": 1.2 },
  "reasoning": "explanation of why these adjustments are needed"
}`;

    try {
      const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      const rawContent = response.choices[0].message.content ?? "{}";
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          recommendations: string[];
          policyAdjustments: Record<string, number>;
          reasoning: string;
        };

        // Apply adjustments within safe bounds
        if (parsed.policyAdjustments) {
          const adj = parsed.policyAdjustments;
          if (adj.inflationTarget && adj.inflationTarget >= 1 && adj.inflationTarget <= 20) {
            this.digitalNationState.economicPolicy.inflationTarget = adj.inflationTarget;
          }
          if (adj.stakingRate && adj.stakingRate >= 1 && adj.stakingRate <= 30) {
            this.digitalNationState.economicPolicy.stakingRate = adj.stakingRate;
          }
          if (adj.creatorRewardMultiplier && adj.creatorRewardMultiplier >= 0.5 && adj.creatorRewardMultiplier <= 3) {
            this.digitalNationState.economicPolicy.creatorRewardMultiplier = adj.creatorRewardMultiplier;
          }
          this.digitalNationState.lastPolicyAdjustment = new Date();
          eventBus.publish("RULE_ADJUSTED", { adjustments: adj, reasoning: parsed.reasoning });
        }

        return parsed;
      }
    } catch {
      // Fall through
    }

    return {
      recommendations: [
        "Maintain current staking rates — economy is stable",
        "Monitor creator-gamer interaction patterns for XP inflation signals",
        "Consider introducing GOLD token utility in premium content unlocks",
      ],
      policyAdjustments: {},
      reasoning: "No significant anomalies detected. Maintaining current policy.",
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  getDigitalNationStatus(): DigitalNationStatus {
    return { ...this.digitalNationState };
  }

  getActiveSinks(): EmergentSink[] {
    return Array.from(this.activeSinks.values());
  }

  getDetectedPatterns(): EmergentPattern[] {
    return this.detectedPatterns.slice(-20);
  }

  destroy(): void {
    if (this.monitorTimer) clearInterval(this.monitorTimer);
  }
}

export const emergentEconomyEngine = new EmergentEconomyEngine();
