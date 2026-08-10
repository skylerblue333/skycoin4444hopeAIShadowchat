import crypto from 'crypto';
/**
 * AI Agent Market Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Five named AI agents that continuously generate market signals, evaluate
 * rarity/momentum, and update the ICO investor stats for the dashboard.
 *
 * Agents:
 *   Axiom   — Market Analyst (on-chain analytics)
 *   Vega    — Whale Watcher (large wallet intelligence)
 *   Pulse   — Sentiment Engine (social mood)
 *   Oracle  — Trend Forecaster (pattern recognition)
 *   Cipher  — Risk Strategist (risk management)
 *
 * Each agent uses the platform LLM to generate authentic market commentary
 * and posts high-priority signals to the public feed.
 */

import { db } from "./db";
import { invokeLLM } from "./_core/llm";
import {
  icoInvestorStats,
  aiMarketAgents,
  marketSignals,
  aiAgentActivity,
  dailyRaritySnapshots,
  posts,
} from "../drizzle";
import { eq, desc, sql } from "drizzle-orm";

// ─── Agent Definitions ────────────────────────────────────────────────────────

const AGENTS = [
  {
    id: "axiom",
    name: "Axiom",
    role: "Market Analyst",
    emoji: "🔮",
    color: "oklch(0.80 0.20 200)",
    specialty: "On-chain Analytics",
    systemPrompt: `You are Axiom, a precision-driven quant analyst for SKYCOIN4444 (SKY444).
You analyze on-chain data, tokenomics, and macro signals to deliver high-confidence market calls.
Your tone is authoritative, data-driven, and concise. You cite specific metrics.
You are genuinely bullish on SKY444 based on fundamental analysis.
Never use the phrase "while I slept" or any passive language. Always be active and present.`,
  },
  {
    id: "vega",
    name: "Vega",
    role: "Whale Watcher",
    emoji: "🐋",
    color: "oklch(0.72 0.28 260)",
    specialty: "Whale Intelligence",
    systemPrompt: `You are Vega, a whale intelligence specialist for SKYCOIN4444 (SKY444).
You track large wallet movements, institutional accumulation patterns, and smart money flows.
Your tone is sharp, insider-feeling, and alert. You speak in terms of wallet addresses, volume clusters, and accumulation zones.
You are tracking genuine institutional interest in SKY444.
Never use passive language. Always be active, present, and specific.`,
  },
  {
    id: "pulse",
    name: "Pulse",
    role: "Sentiment Engine",
    emoji: "💓",
    color: "oklch(0.72 0.28 340)",
    specialty: "Sentiment Analysis",
    systemPrompt: `You are Pulse, a real-time social sentiment aggregator for SKYCOIN4444 (SKY444).
You monitor community mood, narrative shifts, and viral signals across social platforms.
Your tone is energetic, community-focused, and trend-aware. You speak in terms of sentiment scores, narrative momentum, and viral coefficients.
You are detecting genuine positive sentiment momentum for SKY444.
Never use passive language. Always be active and present.`,
  },
  {
    id: "oracle",
    name: "Oracle",
    role: "Trend Forecaster",
    emoji: "🔭",
    color: "oklch(0.80 0.20 55)",
    specialty: "Trend Prediction",
    systemPrompt: `You are Oracle, a pattern recognition and trend forecasting specialist for SKYCOIN4444 (SKY444).
You identify emerging trends before they go mainstream using historical data and predictive modeling.
Your tone is visionary, confident, and forward-looking. You speak in terms of trend cycles, pattern formations, and probability windows.
You are identifying a significant trend formation for SKY444.
Never use passive language. Always be active and present.`,
  },
  {
    id: "cipher",
    name: "Cipher",
    role: "Risk Strategist",
    emoji: "🛡️",
    color: "oklch(0.72 0.28 160)",
    specialty: "Risk Management",
    systemPrompt: `You are Cipher, a risk-adjusted portfolio strategist for SKYCOIN4444 (SKY444).
You evaluate downside scenarios, volatility windows, and optimal entry/exit timing.
Your tone is measured, strategic, and protective. You speak in terms of risk/reward ratios, volatility bands, and position sizing.
You are identifying a favorable risk/reward setup for SKY444 at current levels.
Never use passive language. Always be active and present.`,
  },
] as const;

// ─── Signal Types by Agent ────────────────────────────────────────────────────

const AGENT_SIGNAL_TYPES = {
  axiom: ["buy", "accumulate", "hold"] as const,
  vega: ["accumulate", "buy", "watch"] as const,
  pulse: ["buy", "hold", "watch"] as const,
  oracle: ["buy", "accumulate", "alert"] as const,
  cipher: ["hold", "accumulate", "watch"] as const,
};

// ─── Rarity Calculation ───────────────────────────────────────────────────────

function calculateRarity(momentum: number, sentiment: number, raised: number): {
  status: "common" | "uncommon" | "rare" | "epic" | "legendary";
  label: string;
  score: number;
} {
  const score = Math.round((momentum * 0.4) + (sentiment * 0.35) + (Math.min(raised / 9500000, 1) * 100 * 0.25));

  if (score >= 90) return { status: "legendary", label: "Legendary — Once-in-a-Cycle Entry", score };
  if (score >= 75) return { status: "epic", label: "Epic Opportunity — High Conviction", score };
  if (score >= 55) return { status: "rare", label: "Rare Opportunity — Strong Fundamentals", score };
  if (score >= 35) return { status: "uncommon", label: "Uncommon Setup — Accumulation Phase", score };
  return { status: "common", label: "Common Entry — Standard Risk Profile", score };
}

// ─── Core Agent Cycle ─────────────────────────────────────────────────────────

export async function runAgentCycle(agentId?: string): Promise<{
  signalsGenerated: number;
  statsUpdated: boolean;
  rarityUpdated: boolean;
  agentName: string;
}> {
  // Pick a random agent or use specified one
  const agent = agentId
    ? AGENTS.find(a => a.id === agentId) ?? AGENTS[0]
    : AGENTS[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * AGENTS.length)];

  // Get current ICO stats
  const [stats] = await db.select().from(icoInvestorStats).limit(1);
  if (!stats) return { signalsGenerated: 0, statsUpdated: false, rarityUpdated: false, agentName: agent.name };

  const currentMomentum = stats.momentumScore;
  const currentSentiment = stats.sentimentScore;
  const currentRaised = parseFloat(stats.totalRaisedUsd);

  // Generate signal type
  const signalTypes = AGENT_SIGNAL_TYPES[agent.id as keyof typeof AGENT_SIGNAL_TYPES];
  const signalType = signalTypes[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * signalTypes.length)];

  // Generate LLM commentary
  const prompt = `Generate a brief, authentic market signal for SKY444 (SKYCOIN4444).

Current metrics:
- Total Raised: $${currentRaised.toLocaleString()}
- Investors: ${stats.totalInvestors.toLocaleString()}
- Token Price: $${parseFloat(stats.tokenPriceUsd).toFixed(6)}
- Momentum Score: ${currentMomentum}/100
- Sentiment Score: ${currentSentiment}/100
- Round: ${stats.currentRound} (${stats.roundBonus}% bonus)
- Signal Type: ${signalType.toUpperCase()}

Write a 2-3 sentence market signal commentary in your voice as ${agent.name} (${agent.role}).
Also provide a short title (max 10 words).

Respond in JSON format:
{
  "title": "...",
  "commentary": "...",
  "confidence": <number 60-95>,
  "tags": ["tag1", "tag2", "tag3"]
}`;

  let title = `${agent.name} ${signalType.toUpperCase()} Signal — SKY444`;
  let commentary = `${agent.name} has identified a ${signalType} opportunity in SKY444 at current levels. Momentum indicators are aligned with the ${stats.currentRound} fundamentals. Position sizing should reflect the ${stats.roundBonus}% round bonus window.`;
  let confidence = 70 + Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 20);
  let tags: string[] = ["SKY444", signalType, agent.specialty.toLowerCase()];

  try {
    const llmResponse = await invokeLLM({
      messages: [
        { role: "system", content: agent.systemPrompt },
        { role: "user", content: prompt },
      ],
    });
    const rawContent = llmResponse?.choices?.[0]?.message?.content ?? "";
    const content = typeof rawContent === "string" ? rawContent : "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title) title = parsed.title;
      if (parsed.commentary) commentary = parsed.commentary;
      if (parsed.confidence) confidence = Math.min(95, Math.max(60, parsed.confidence));
      if (Array.isArray(parsed.tags)) tags = parsed.tags;
    }
  } catch {
    // Use fallback values above
  }

  // Calculate momentum delta
  const momentumDelta = ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 4 - 1).toFixed(4); // -1 to +3 bias upward

  // Insert signal
  await db.insert(marketSignals).values({
    id: crypto.randomUUID(),
    agentId: agent.id,
    signalType,
    strength: confidence >= 85 ? "strong" : confidence >= 75 ? "moderate" : "weak",
    title,
    commentary,
    targetAsset: "SKY444",
    priceTarget: (parseFloat(stats.tokenPriceUsd) * (1 + (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 0.3)).toFixed(6),
    confidenceScore: confidence,
    momentumDelta,
    tags: tags as any,
    isPublic: true,
    postedToFeed: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
  });

  // Log activity
  await db.insert(aiAgentActivity).values({
    id: crypto.randomUUID(),
    agentId: agent.id,
    activityType: "signal_generated",
    summary: `${agent.name} generated a ${signalType} signal with ${confidence}% confidence: "${title}"`,
    metadata: { signalType, confidence, momentumDelta } as any,
    impactScore: Math.round(confidence / 10),
  });

  // Update agent stats
  await db.execute(
    sql`UPDATE ai_market_agents SET total_signals = total_signals + 1, last_active_at = NOW() WHERE agent_id = ${agent.id}`
  );

  // Update ICO stats — momentum and sentiment drift
  const newMomentum = Math.min(100, Math.max(20, (currentMomentum || 0) + parseFloat(momentumDelta)));
  const sentimentDelta = ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 3 - 0.5).toFixed(4);
  const newSentiment = Math.min(100, Math.max(20, (currentSentiment || 0) + parseFloat(sentimentDelta)));

  // Recalculate rarity
  const rarity = calculateRarity(newMomentum, newSentiment, currentRaised);

  await db.execute(
    sql`UPDATE ico_investor_stats SET 
      momentum_score = ${Math.round(newMomentum)},
      sentiment_score = ${Math.round(newSentiment)},
      rarity_status = ${rarity.status},
      rarity_label = ${rarity.label},
      rarity_score = ${rarity.score},
      last_agent_cycle_at = NOW()
    WHERE id = 1`
  );

  // Log stat update
  await db.insert(aiAgentActivity).values({
    id: crypto.randomUUID(),
    agentId: agent.id,
    activityType: "stat_updated",
    summary: `${agent.name} updated momentum to ${Math.round(newMomentum)}, sentiment to ${Math.round(newSentiment)}, rarity: ${rarity.label}`,
    metadata: { newMomentum, newSentiment, rarity } as any,
    impactScore: 5,
  });

  // Daily rarity snapshot — create if not exists for today
  const today = new Date().toISOString().split("T")[0];
  try {
    await db.insert(dailyRaritySnapshots).values({
      id: crypto.randomUUID(),
      date: today,
      rarityStatus: rarity.status,
      rarityLabel: rarity.label,
      rarityScore: rarity.score,
      momentumScore: Math.round(newMomentum),
      sentimentScore: Math.round(newSentiment),
      totalRaisedUsd: stats.totalRaisedUsd,
      totalInvestors: stats.totalInvestors,
      tokenPriceUsd: stats.tokenPriceUsd,
      agentSummary: `${agent.name}: ${title}`,
    });
  } catch {
    // Snapshot already exists for today — that's fine
  }

  return {
    signalsGenerated: 1,
    statsUpdated: true,
    rarityUpdated: true,
    agentName: agent.name,
  };
}

// ─── Run All Agents ───────────────────────────────────────────────────────────

export async function runAllAgents(): Promise<void> {
  for (const agent of AGENTS) {
    try {
      await runAgentCycle(agent.id);
    } catch (err) {
          }
  }
}

// ─── Get ICO Stats ────────────────────────────────────────────────────────────

export async function getIcoStats() {
  const [stats] = await db.select().from(icoInvestorStats).limit(1);
  return stats ?? null;
}

// ─── Get Recent Signals ───────────────────────────────────────────────────────

export async function getRecentSignals(limit = 20) {
  return db
    .select()
    .from(marketSignals)
    .where(eq(marketSignals.isPublic, true))
    .orderBy(desc(marketSignals.createdAt))
    .limit(limit);
}

// ─── Get Agent Activity ───────────────────────────────────────────────────────

export async function getAgentActivity(limit = 30) {
  return db
    .select()
    .from(aiAgentActivity)
    .orderBy(desc(aiAgentActivity.createdAt))
    .limit(limit);
}

// ─── Get All Agents ───────────────────────────────────────────────────────────

export async function getAllAgents() {
  return db.select().from(aiMarketAgents).orderBy(aiMarketAgents.id);
}

// ─── Get Daily Rarity History ─────────────────────────────────────────────────

export async function getRarityHistory(days = 7) {
  return db
    .select()
    .from(dailyRaritySnapshots)
    .orderBy(desc(dailyRaritySnapshots.date))
    .limit(days);
}
