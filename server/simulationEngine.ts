import crypto from 'crypto';
/**
 * Simulation Engine — Tick-Based World Loop
 *
 * Architecture:
 *   AI Service
 *      ↓
 *   Simulation Engine (tick-based world loop)
 *      ↓
 *   Entity System (agents, personas, trends)
 *      ↓
 *   Event Generation
 *
 * Powers:
 *   - self-generating feed
 *   - AI personas
 *   - dynamic trends
 *   - behavior prediction
 *   - dating recommendations
 */

// DB imports available for future persistence layer
// import { db } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntityType = "persona" | "trend" | "market" | "social" | "dating";
export type EntityState = "active" | "dormant" | "evolving" | "decaying";
export type EventType =
  | "post_generated"
  | "trend_spike"
  | "market_move"
  | "match_suggested"
  | "action_triggered"
  | "persona_interaction"
  | "feed_update"
  | "behavior_signal";

export interface SimEntity {
  id: string;
  type: EntityType;
  name: string;
  state: EntityState;
  energy: number;       // 0–100: how active/influential this entity is
  momentum: number;     // -1 to 1: direction of change
  traits: Record<string, number>;  // personality/behavior dimensions
  memory: string[];     // recent context
  lastTick: number;
  createdAt: number;
}

export interface WorldEvent {
  id: string;
  type: EventType;
  entityId: string;
  entityName: string;
  payload: Record<string, unknown>;
  impact: number;       // 0–100: how much this affects the world
  timestamp: number;
}

export interface WorldState {
  tick: number;
  entities: SimEntity[];
  recentEvents: WorldEvent[];
  trends: TrendSignal[];
  feedItems: FeedItem[];
  datingSignals: DatingSignal[];
  marketSignals: MarketSignal[];
  timestamp: number;
}

export interface TrendSignal {
  topic: string;
  score: number;
  momentum: number;
  relatedEntities: string[];
}

export interface FeedItem {
  id: string;
  authorEntityId: string;
  authorName: string;
  content: string;
  energy: number;
  tags: string[];
  generatedAt: number;
}

export interface DatingSignal {
  entityA: string;
  entityB: string;
  compatibility: number;
  emotionalAlignment: number;
  behaviorMatch: number;
  aiReason: string;
}

export interface MarketSignal {
  symbol: string;
  price: number;
  change24h: number;
  momentum: number;
  sentiment: number;
}

// ─── Persona Templates ────────────────────────────────────────────────────────

const PERSONA_TEMPLATES: Omit<SimEntity, "lastTick" | "createdAt">[] = [
  {
    id: "nova",
    type: "persona",
    name: "NOVA",
    state: "active",
    energy: 92,
    momentum: 0.8,
    traits: { creativity: 95, technical: 80, social: 85, risk: 60, empathy: 70 },
    memory: ["Analyzing feed patterns", "Generating content", "Optimizing engagement"],
  },
  {
    id: "cipher",
    type: "persona",
    name: "CIPHER",
    state: "active",
    energy: 88,
    momentum: 0.6,
    traits: { creativity: 60, technical: 98, social: 50, risk: 75, empathy: 45 },
    memory: ["Monitoring blockchain", "Analyzing market data", "Running anomaly detection"],
  },
  {
    id: "prism",
    type: "persona",
    name: "PRISM",
    state: "active",
    energy: 85,
    momentum: 0.5,
    traits: { creativity: 75, technical: 85, social: 90, risk: 50, empathy: 80 },
    memory: ["Ranking feed content", "Predicting engagement", "Personalizing experience"],
  },
  {
    id: "atlas",
    type: "persona",
    name: "ATLAS",
    state: "evolving",
    energy: 78,
    momentum: 0.3,
    traits: { creativity: 70, technical: 90, social: 65, risk: 40, empathy: 60 },
    memory: ["Mapping knowledge graph", "Building connections", "Synthesizing data"],
  },
  {
    id: "echo",
    type: "persona",
    name: "ECHO",
    state: "active",
    energy: 82,
    momentum: 0.4,
    traits: { creativity: 85, technical: 65, social: 95, risk: 55, empathy: 90 },
    memory: ["Monitoring conversations", "Detecting sentiment", "Amplifying signals"],
  },
];

const CONTENT_TEMPLATES = [
  "The {topic} landscape is shifting. {insight} — this changes everything.",
  "Analysis complete: {topic} shows {metric}% {direction} in the last 24h.",
  "New pattern detected in {topic}: {insight}. Confidence: {confidence}%.",
  "Breaking: {topic} just crossed a critical threshold. {insight}.",
  "AI prediction: {topic} will {direction} by {metric}% within 72h.",
];

const TOPICS = ["Web3", "AI agents", "DeFi yields", "social reputation", "creator economy", "SKY444", "action OS", "trust scores", "dating compatibility", "feed ranking"];
const INSIGHTS = [
  "behavioral signals are converging",
  "network effects are accelerating",
  "early adopters are capturing most value",
  "the moat is widening",
  "trust is becoming the new currency",
];

// ─── Simulation Engine ────────────────────────────────────────────────────────

class SimulationEngine {
  private worldState: WorldState;
  private tickInterval: NodeJS.Timeout | null = null;
  private tickCount = 0;
  private readonly TICK_MS = 5000; // 5 second world tick

  constructor() {
    this.worldState = this.initWorld();
  }

  private initWorld(): WorldState {
    const now = Date.now();
    const entities: SimEntity[] = PERSONA_TEMPLATES.map(t => ({
      ...t,
      lastTick: now,
      createdAt: now,
    }));

    return {
      tick: 0,
      entities,
      recentEvents: [],
      trends: this.generateInitialTrends(),
      feedItems: this.generateInitialFeed(entities),
      datingSignals: this.generateDatingSignals(entities),
      marketSignals: this.generateMarketSignals(),
      timestamp: now,
    };
  }

  private generateInitialTrends(): TrendSignal[] {
    return [
      { topic: "#SKY444", score: 94, momentum: 0.8, relatedEntities: ["cipher", "nova"] },
      { topic: "#AIAgents", score: 89, momentum: 0.7, relatedEntities: ["nova", "atlas"] },
      { topic: "#Web3OS", score: 82, momentum: 0.6, relatedEntities: ["cipher", "prism"] },
      { topic: "#ChatToEarn", score: 78, momentum: 0.5, relatedEntities: ["echo", "nova"] },
      { topic: "#ShadowChat", score: 71, momentum: 0.4, relatedEntities: ["prism", "echo"] },
    ];
  }

  private generateInitialFeed(entities: SimEntity[]): FeedItem[] {
    return entities.slice(0, 3).map((entity, i) => ({
      id: `feed-init-${i}`,
      authorEntityId: entity.id,
      authorName: entity.name,
      content: this.generateContent(entity),
      energy: entity.energy,
      tags: [TOPICS[i % TOPICS.length], TOPICS[(i + 1) % TOPICS.length]],
      generatedAt: Date.now() - i * 60000,
    }));
  }

  private generateContent(entity: SimEntity): string {
    const template = CONTENT_TEMPLATES[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * CONTENT_TEMPLATES.length)];
    const topic = TOPICS[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * TOPICS.length)];
    const insight = INSIGHTS[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * INSIGHTS.length)];
    const metric = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 40 + 10);
    const direction = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) > 0.5 ? "increase" : "accelerate";
    const confidence = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 20 + 75);

    return template
      .replace("{topic}", topic)
      .replace("{insight}", insight)
      .replace("{metric}", metric.toString())
      .replace("{direction}", direction)
      .replace("{confidence}", confidence.toString());
  }

  private generateDatingSignals(entities: SimEntity[]): DatingSignal[] {
    const signals: DatingSignal[] = [];
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const a = entities[i];
        const b = entities[j];
        const compatibility = this.computeCompatibility(a, b);
        if (compatibility > 60) {
          signals.push({
            entityA: a.id,
            entityB: b.id,
            compatibility,
            emotionalAlignment: Math.min(100, compatibility + Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 20 - 10)),
            behaviorMatch: Math.min(100, compatibility + Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 15 - 7)),
            aiReason: this.generateCompatibilityReason(a, b, compatibility),
          });
        }
      }
    }
    return signals.sort((a, b) => b.compatibility - a.compatibility);
  }

  private computeCompatibility(a: SimEntity, b: SimEntity): number {
    const traitKeys = Object.keys(a.traits);
    if (traitKeys.length === 0) return 50;
    const similarity = traitKeys.reduce((sum, key) => {
      const diff = Math.abs((a.traits[key] ?? 50) - (b.traits[key] ?? 50));
      return sum + (100 - diff);
    }, 0) / traitKeys.length;
    // Complementary traits boost compatibility
    const complementBonus = traitKeys.reduce((sum, key) => {
      const aVal = a.traits[key] ?? 50;
      const bVal = b.traits[key] ?? 50;
      // High + Low = complementary
      if ((aVal > 80 && bVal < 40) || (aVal < 40 && bVal > 80)) return sum + 5;
      return sum;
    }, 0);
    return Math.min(100, Math.floor(similarity * 0.7 + complementBonus + (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10));
  }

  private generateCompatibilityReason(a: SimEntity, b: SimEntity, score: number): string {
    if (score > 85) return `Exceptional alignment between ${a.name} and ${b.name}. Complementary strengths create powerful synergy.`;
    if (score > 75) return `Strong behavioral match. ${a.name}'s ${Object.keys(a.traits)[0]} complements ${b.name}'s profile.`;
    return `Moderate compatibility. Shared interest in technical domains creates connection points.`;
  }

  private generateMarketSignals(): MarketSignal[] {
    return [
      { symbol: "SKY444", price: 0.0847, change24h: 12.4, momentum: 0.8, sentiment: 87 },
      { symbol: "BTC", price: 67420, change24h: 2.1, momentum: 0.3, sentiment: 72 },
      { symbol: "ETH", price: 3840, change24h: 3.7, momentum: 0.5, sentiment: 78 },
      { symbol: "SOL", price: 184, change24h: -1.2, momentum: -0.2, sentiment: 61 },
    ];
  }

  // ─── Tick Logic ─────────────────────────────────────────────────────────────

  tick(): WorldState {
    this.tickCount++;
    const now = Date.now();
    const newEvents: WorldEvent[] = [];

    // Update each entity
    const updatedEntities = this.worldState.entities.map(entity => {
      const updated = this.tickEntity(entity, now);
      // Generate events based on entity state
      const events = this.generateEntityEvents(updated);
      newEvents.push(...events);
      return updated;
    });

    // Update trends based on events
    const updatedTrends = this.updateTrends(this.worldState.trends, newEvents);

    // Generate new feed items from active entities
    const newFeedItems = this.generateNewFeedItems(updatedEntities, newEvents);

    // Update dating signals periodically
    const updatedDating = this.tickCount % 10 === 0
      ? this.generateDatingSignals(updatedEntities)
      : this.worldState.datingSignals;

    // Update market signals
    const updatedMarket = this.tickMarket(this.worldState.marketSignals);

    // Keep only recent events (last 50)
    const allEvents = [...newEvents, ...this.worldState.recentEvents].slice(0, 50);

    // Keep only recent feed items (last 20)
    const allFeedItems = [...newFeedItems, ...this.worldState.feedItems].slice(0, 20);

    this.worldState = {
      tick: this.tickCount,
      entities: updatedEntities,
      recentEvents: allEvents,
      trends: updatedTrends,
      feedItems: allFeedItems,
      datingSignals: updatedDating,
      marketSignals: updatedMarket,
      timestamp: now,
    };

    return this.worldState;
  }

  private tickEntity(entity: SimEntity, now: number): SimEntity {
    const timeDelta = (now - entity.lastTick) / 1000; // seconds

    // Energy evolves based on momentum
    let newEnergy = entity.energy + entity.momentum * timeDelta * 0.1;
    newEnergy = Math.max(10, Math.min(100, newEnergy));

    // Momentum decays slightly (regression to mean)
    let newMomentum = entity.momentum * 0.98;

    // Random perturbation (world noise)
    newMomentum += ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.5) * 0.05;
    newMomentum = Math.max(-1, Math.min(1, newMomentum));

    // State transitions
    let newState: EntityState = entity.state;
    if (newEnergy > 85) newState = "active";
    else if (newEnergy > 60) newState = "evolving";
    else if (newEnergy > 30) newState = "dormant";
    else newState = "decaying";

    return {
      ...entity,
      energy: Math.round(newEnergy),
      momentum: Math.round(newMomentum * 100) / 100,
      state: newState,
      lastTick: now,
    };
  }

  private generateEntityEvents(entity: SimEntity): WorldEvent[] {
    const events: WorldEvent[] = [];
    const now = Date.now();

    // High energy entities generate posts
    if (entity.energy > 80 && (crypto.getRandomValues(new Uint8Array(1))[0] / 256) < 0.3) {
      events.push({
        id: `evt-${now}-${entity.id}-post`,
        type: "post_generated",
        entityId: entity.id,
        entityName: entity.name,
        payload: { content: this.generateContent(entity), tags: [TOPICS[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * TOPICS.length)]] },
        impact: Math.floor(entity.energy * 0.8),
        timestamp: now,
      });
    }

    // Trend spikes from high-momentum entities
    if (entity.momentum > 0.6 && (crypto.getRandomValues(new Uint8Array(1))[0] / 256) < 0.2) {
      events.push({
        id: `evt-${now}-${entity.id}-trend`,
        type: "trend_spike",
        entityId: entity.id,
        entityName: entity.name,
        payload: { topic: TOPICS[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * TOPICS.length)], spike: Math.floor(entity.momentum * 50) },
        impact: Math.floor(entity.momentum * 100),
        timestamp: now,
      });
    }

    // Behavior signals from all entities
    if ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) < 0.15) {
      events.push({
        id: `evt-${now}-${entity.id}-behavior`,
        type: "behavior_signal",
        entityId: entity.id,
        entityName: entity.name,
        payload: { signal: entity.state, energy: entity.energy, momentum: entity.momentum },
        impact: 20,
        timestamp: now,
      });
    }

    return events;
  }

  private updateTrends(trends: TrendSignal[], events: WorldEvent[]): TrendSignal[] {
    const trendSpikes = events.filter(e => e.type === "trend_spike");
    return trends.map(trend => {
      const relevantSpike = trendSpikes.find(s =>
        (s.payload.topic as string)?.toLowerCase().includes(trend.topic.replace("#", "").toLowerCase())
      );
      if (relevantSpike) {
        return {
          ...trend,
          score: Math.min(100, trend.score + (relevantSpike.payload.spike as number) * 0.1),
          momentum: Math.min(1, trend.momentum + 0.05),
        };
      }
      // Natural decay
      return {
        ...trend,
        score: Math.max(10, trend.score - 0.5),
        momentum: trend.momentum * 0.99,
      };
    });
  }

  private generateNewFeedItems(entities: SimEntity[], events: WorldEvent[]): FeedItem[] {
    return events
      .filter(e => e.type === "post_generated")
      .map(e => ({
        id: e.id,
        authorEntityId: e.entityId,
        authorName: e.entityName,
        content: e.payload.content as string,
        energy: e.impact,
        tags: e.payload.tags as string[],
        generatedAt: e.timestamp,
      }));
  }

  private tickMarket(signals: MarketSignal[]): MarketSignal[] {
    return signals.map(s => {
      const change = ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.48) * 2; // slight upward bias
      return {
        ...s,
        price: Math.max(0.001, s.price * (1 + change / 100)),
        change24h: s.change24h + ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.5) * 0.5,
        momentum: Math.max(-1, Math.min(1, s.momentum + ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.5) * 0.1)),
        sentiment: Math.max(0, Math.min(100, s.sentiment + ((crypto.getRandomValues(new Uint8Array(1))[0] / 256) - 0.5) * 2)),
      };
    });
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  getWorldState(): WorldState {
    return this.worldState;
  }

  getEntity(id: string): SimEntity | undefined {
    return this.worldState.entities.find(e => e.id === id);
  }

  getRecentEvents(limit = 20): WorldEvent[] {
    return this.worldState.recentEvents.slice(0, limit);
  }

  getFeedItems(limit = 10): FeedItem[] {
    return this.worldState.feedItems.slice(0, limit);
  }

  getTrends(): TrendSignal[] {
    return this.worldState.trends;
  }

  getDatingSignals(entityId?: string): DatingSignal[] {
    if (entityId) {
      return this.worldState.datingSignals.filter(
        s => s.entityA === entityId || s.entityB === entityId
      );
    }
    return this.worldState.datingSignals;
  }

  getMarketSignals(): MarketSignal[] {
    return this.worldState.marketSignals;
  }

  // Inject external event (from user action, real-time data, etc.)
  injectEvent(event: Omit<WorldEvent, "id" | "timestamp">): void {
    const fullEvent: WorldEvent = {
      ...event,
      id: `injected-${Date.now()}`,
      timestamp: Date.now(),
    };
    this.worldState.recentEvents.unshift(fullEvent);
    this.worldState.recentEvents = this.worldState.recentEvents.slice(0, 50);

    // Boost entity energy when it receives an external event
    const entity = this.worldState.entities.find(e => e.id === event.entityId);
    if (entity) {
      entity.energy = Math.min(100, entity.energy + event.impact * 0.1);
      entity.momentum = Math.min(1, entity.momentum + 0.1);
    }
  }

  // Predict behavior for a user based on world state
  predictBehavior(userId: string): {
    likelyActions: string[];
    contentPreferences: string[];
    datingReadiness: number;
    economicActivity: number;
  } {
    const state = this.worldState;
    const topTrends = state.trends.slice(0, 3).map(t => t.topic);
    return {
      likelyActions: ["view_feed", "like_post", "check_wallet"].slice(0, 2),
      contentPreferences: topTrends,
      datingReadiness: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 30 + 60),
      economicActivity: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 40 + 50),
    };
  }

  // Start autonomous ticking
  startAutoTick(): void {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this.tick(), this.TICK_MS);
  }

  stopAutoTick(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const simulationEngine = new SimulationEngine();

// Auto-start ticking when module loads
simulationEngine.startAutoTick();
