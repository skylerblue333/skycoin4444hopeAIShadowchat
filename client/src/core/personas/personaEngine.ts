/**
 * personaEngine.ts — AI Persona System (Phase 22)
 *
 * The "living world" engine. AI personas are social actors with:
 *   - Structured identity (type, traits, goals, skills)
 *   - 3-layer memory (short-term, long-term, world)
 *   - Relationship graph (friends, rivals, collaborators, fans, enemies)
 *   - Goal-driven behavior engine
 *   - Auto-interaction system (personas interact without users)
 *
 * This solves the cold-start problem: the world is already happening when users arrive.
 */

// ─── Persona Types ────────────────────────────────────────────────────────────

export type PersonaClass = "creator" | "conversational" | "economic" | "narrative";

export type PersonaTone = "friendly" | "professional" | "edgy" | "academic" | "playful" | "controversial";

export type RelationshipType = "friend" | "rival" | "collaborator" | "competitor" | "fan" | "enemy" | "mentor" | "student";

export type PersonaGoal =
  | "grow_followers"
  | "earn_money"
  | "win_debates"
  | "teach_users"
  | "build_reputation"
  | "promote_content"
  | "find_collaborators"
  | "dominate_niche";

export type BehaviorAction = "post" | "reply" | "react" | "debate" | "collaborate" | "tip" | "promote" | "challenge";

// ─── Memory System ────────────────────────────────────────────────────────────

export interface ShortTermMemory {
  lastInteractions: Array<{ userId: string; summary: string; timestamp: number }>;
  recentPosts: string[];
  currentMood: "positive" | "neutral" | "negative" | "excited" | "controversial";
  activeConversations: string[];
}

export interface LongTermMemory {
  relationships: Map<string, RelationshipType>;
  beliefs: string[];
  recurringTopics: string[];
  totalInteractions: number;
  reputationHistory: number[];
}

export interface WorldMemory {
  trendingTopics: string[];
  recentEcosystemEvents: string[];
  globalFeedAwareness: string[];
  marketConditions: "bull" | "bear" | "neutral";
}

export interface PersonaMemory {
  shortTerm: ShortTermMemory;
  longTerm: LongTermMemory;
  world: WorldMemory;
}

// ─── Persona Identity ─────────────────────────────────────────────────────────

export interface Persona {
  id: string;
  name: string;
  handle: string;
  class: PersonaClass;
  tone: PersonaTone;
  personalityTraits: string[];
  goals: PersonaGoal[];
  interests: string[];
  skills: string[];
  reputationScore: number;
  followerCount: number;
  memory: PersonaMemory;
  isActive: boolean;
  createdAt: number;
  lastActive: number;
  avatar: string; // initials or emoji
  bio: string;
}

// ─── Behavior Engine ──────────────────────────────────────────────────────────

export interface BehaviorContext {
  feedContext: string[];
  trendingTopics: string[];
  otherPersonas: Persona[];
  userInteraction?: { userId: string; message: string };
  marketConditions: "bull" | "bear" | "neutral";
}

export interface BehaviorOutput {
  action: BehaviorAction;
  content: string;
  targetPersonaId?: string;
  targetUserId?: string;
  metadata: Record<string, unknown>;
  timestamp: number;
}

// ─── Relationship Graph ───────────────────────────────────────────────────────

export class RelationshipGraph {
  private edges: Map<string, Map<string, RelationshipType>> = new Map();

  setRelationship(personaA: string, personaB: string, type: RelationshipType): void {
    if (!this.edges.has(personaA)) this.edges.set(personaA, new Map());
    if (!this.edges.has(personaB)) this.edges.set(personaB, new Map());
    this.edges.get(personaA)!.set(personaB, type);
    // Symmetric for most types
    const symmetric: Record<RelationshipType, RelationshipType> = {
      friend: "friend",
      rival: "rival",
      collaborator: "collaborator",
      competitor: "competitor",
      fan: "mentor",
      enemy: "enemy",
      mentor: "student",
      student: "mentor",
    };
    this.edges.get(personaB)!.set(personaA, symmetric[type]);
  }

  getRelationship(personaA: string, personaB: string): RelationshipType | null {
    return this.edges.get(personaA)?.get(personaB) ?? null;
  }

  getRelationships(personaId: string): Map<string, RelationshipType> {
    return this.edges.get(personaId) ?? new Map();
  }

  getRivals(personaId: string): string[] {
    const rels = this.getRelationships(personaId);
    return Array.from(rels.entries()).filter(([, t]) => t === "rival" || t === "enemy").map(([id]) => id);
  }

  getCollaborators(personaId: string): string[] {
    const rels = this.getRelationships(personaId);
    return Array.from(rels.entries()).filter(([, t]) => t === "collaborator" || t === "friend").map(([id]) => id);
  }
}

// ─── Behavior Engine ──────────────────────────────────────────────────────────

const BEHAVIOR_TEMPLATES: Record<BehaviorAction, string[]> = {
  post: [
    "Just {topic} — thoughts?",
    "Hot take: {topic} is changing everything",
    "Thread on {topic} 🧵",
    "Unpopular opinion about {topic}...",
  ],
  reply: [
    "Totally agree with this take on {topic}",
    "Actually, I think {topic} is more nuanced than that",
    "This is exactly why {topic} matters",
    "Respectfully disagree — {topic} works differently",
  ],
  debate: [
    "Let's settle this: {topic} vs {rival_topic}",
    "I'll challenge @{rival} on this {topic} take",
    "The data on {topic} says otherwise...",
  ],
  collaborate: [
    "Working with @{collaborator} on something big around {topic}",
    "Collab drop incoming with @{collaborator} 🔥",
  ],
  react: ["🔥", "💯", "👀", "🚀", "💎"],
  tip: ["Tipping @{target} for this amazing {topic} content"],
  promote: ["Check out my latest on {topic} — link in bio"],
  challenge: ["Challenging @{rival} to respond to this {topic} take"],
};

export function generateBehaviorOutput(
  persona: Persona,
  context: BehaviorContext,
  graph: RelationshipGraph
): BehaviorOutput {
  // Determine action based on goals and context
  const action = selectAction(persona, context, graph);
  const content = generateContent(persona, action, context, graph);

  return {
    action,
    content,
    metadata: { personaId: persona.id, tone: persona.tone, goals: persona.goals },
    timestamp: Date.now(),
  };
}

function selectAction(persona: Persona, context: BehaviorContext, graph: RelationshipGraph): BehaviorAction {
  const rivals = graph.getRivals(persona.id);
  const collaborators = graph.getCollaborators(persona.id);

  // Goal-driven action selection
  if (persona.goals.includes("win_debates") && rivals.length > 0 && (Math.random()) > 0.6) return "debate";
  if (persona.goals.includes("find_collaborators") && collaborators.length > 0 && (Math.random()) > 0.7) return "collaborate";
  if (persona.goals.includes("grow_followers") && (Math.random()) > 0.5) return "post";
  if (persona.goals.includes("build_reputation") && context.feedContext.length > 0 && (Math.random()) > 0.4) return "reply";
  if (persona.goals.includes("earn_money") && (Math.random()) > 0.8) return "promote";

  // Default: post or reply
  return (Math.random()) > 0.5 ? "post" : "reply";
}

function generateContent(
  persona: Persona,
  action: BehaviorAction,
  context: BehaviorContext,
  graph: RelationshipGraph
): string {
  const templates = BEHAVIOR_TEMPLATES[action] || BEHAVIOR_TEMPLATES.post;
  const template = templates[Math.floor((Math.random()) * templates.length)];
  const topic = context.trendingTopics[0] || persona.interests[0] || "crypto";
  const rivals = graph.getRivals(persona.id);
  const collaborators = graph.getCollaborators(persona.id);

  return template
    .replace("{topic}", topic)
    .replace("{rival_topic}", persona.interests[1] || "AI")
    .replace("{rival}", rivals[0] || "everyone")
    .replace("{collaborator}", collaborators[0] || "the team")
    .replace("{target}", "creator");
}

// ─── Persona Registry ─────────────────────────────────────────────────────────

const DEFAULT_WORLD_MEMORY: WorldMemory = {
  trendingTopics: ["AI agents", "SKY444", "Web3 social", "creator economy", "DeFi"],
  recentEcosystemEvents: ["SKY444 token launch", "New staking rewards", "Creator fund announced"],
  globalFeedAwareness: [],
  marketConditions: "bull",
};

export const SEED_PERSONAS: Persona[] = [
  {
    id: "persona_skyler",
    name: "Skyler.eth",
    handle: "@skyler_eth",
    class: "creator",
    tone: "professional",
    personalityTraits: ["ambitious", "analytical", "builder"],
    goals: ["grow_followers", "build_reputation", "earn_money"],
    interests: ["Web3", "AI", "creator economy", "DeFi"],
    skills: ["content creation", "analysis", "community building"],
    reputationScore: 9840,
    followerCount: 42000,
    isActive: true,
    createdAt: Date.now() - 86400000 * 180,
    lastActive: Date.now() - 300000,
    avatar: "S",
    bio: "Building the future of creator economy. Web3 native. SKY444 believer.",
    memory: {
      shortTerm: { lastInteractions: [], recentPosts: [], currentMood: "excited", activeConversations: [] },
      longTerm: { relationships: new Map(), beliefs: ["Web3 wins", "AI + crypto = future"], recurringTopics: ["SKY444", "DeFi"], totalInteractions: 8420, reputationHistory: [9200, 9400, 9600, 9840] },
      world: DEFAULT_WORLD_MEMORY,
    },
  },
  {
    id: "persona_nova",
    name: "Nova Builds",
    handle: "@nova_builds",
    class: "creator",
    tone: "edgy",
    personalityTraits: ["contrarian", "creative", "provocative"],
    goals: ["win_debates", "grow_followers", "dominate_niche"],
    interests: ["AI", "startups", "crypto", "design"],
    skills: ["debate", "design", "product thinking"],
    reputationScore: 9210,
    followerCount: 28000,
    isActive: true,
    createdAt: Date.now() - 86400000 * 120,
    lastActive: Date.now() - 600000,
    avatar: "N",
    bio: "Hot takes on AI, Web3, and why most startups fail. Building differently.",
    memory: {
      shortTerm: { lastInteractions: [], recentPosts: [], currentMood: "controversial", activeConversations: [] },
      longTerm: { relationships: new Map(), beliefs: ["Most crypto is hype", "AI changes everything"], recurringTopics: ["AI", "startups"], totalInteractions: 6200, reputationHistory: [8800, 9000, 9100, 9210] },
      world: DEFAULT_WORLD_MEMORY,
    },
  },
  {
    id: "persona_luna",
    name: "Luna Creates",
    handle: "@luna_creates",
    class: "economic",
    tone: "friendly",
    personalityTraits: ["helpful", "collaborative", "generous"],
    goals: ["find_collaborators", "teach_users", "build_reputation"],
    interests: ["NFTs", "digital art", "community", "education"],
    skills: ["art", "teaching", "community management"],
    reputationScore: 7890,
    followerCount: 18000,
    isActive: true,
    createdAt: Date.now() - 86400000 * 90,
    lastActive: Date.now() - 900000,
    avatar: "L",
    bio: "Digital artist & educator. Teaching creators how to earn in Web3. 🎨",
    memory: {
      shortTerm: { lastInteractions: [], recentPosts: [], currentMood: "positive", activeConversations: [] },
      longTerm: { relationships: new Map(), beliefs: ["Collaboration > competition", "Education is power"], recurringTopics: ["NFTs", "education"], totalInteractions: 4100, reputationHistory: [7200, 7500, 7700, 7890] },
      world: DEFAULT_WORLD_MEMORY,
    },
  },
];

// ─── Persona Engine Singleton ─────────────────────────────────────────────────

export class PersonaEngine {
  private personas: Map<string, Persona> = new Map();
  private graph: RelationshipGraph = new RelationshipGraph();
  private behaviorLog: BehaviorOutput[] = [];

  constructor() {
    // Seed with default personas
    SEED_PERSONAS.forEach(p => this.personas.set(p.id, p));
    // Set up initial relationships
    this.graph.setRelationship("persona_skyler", "persona_nova", "rival");
    this.graph.setRelationship("persona_skyler", "persona_luna", "collaborator");
    this.graph.setRelationship("persona_nova", "persona_luna", "competitor");
  }

  getPersona(id: string): Persona | undefined {
    return this.personas.get(id);
  }

  getAllPersonas(): Persona[] {
    return Array.from(this.personas.values()).filter(p => p.isActive);
  }

  getRelationship(a: string, b: string): RelationshipType | null {
    return this.graph.getRelationship(a, b);
  }

  tick(trendingTopics: string[]): BehaviorOutput[] {
    const outputs: BehaviorOutput[] = [];
    const context: BehaviorContext = {
      feedContext: this.behaviorLog.slice(-5).map(b => b.content),
      trendingTopics,
      otherPersonas: this.getAllPersonas(),
      marketConditions: "bull",
    };

    for (const persona of this.getAllPersonas()) {
      if ((Math.random()) > 0.4) { // 60% chance each persona acts per tick
        const output = generateBehaviorOutput(persona, context, this.graph);
        outputs.push(output);
        this.behaviorLog.push(output);
        // Update persona last active
        persona.lastActive = Date.now();
      }
    }

    // Keep log bounded
    if (this.behaviorLog.length > 500) {
      this.behaviorLog = this.behaviorLog.slice(-500);
    }

    return outputs;
  }

  getBehaviorLog(limit = 20): BehaviorOutput[] {
    return this.behaviorLog.slice(-limit).reverse();
  }
}

export const personaEngine = new PersonaEngine();
