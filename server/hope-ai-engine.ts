/**
 * HOPE AI ENGINE — Emotionally Intelligent AI Companion
 * Reads all user signals, infers emotional state, adapts tone dynamically.
 *
 * Signal Sources:
 *   - Typing cadence (wpm, pause patterns, backspace rate)
 *   - Scroll velocity and depth
 *   - Session duration and idle time
 *   - Click heatmap density
 *   - Message sentiment history
 *   - Time of day / circadian context
 *   - Social activity (posts, likes, follows)
 *   - Crypto activity (trading, staking, burning)
 *   - Platform engagement score
 *
 * Emotional States: calm | focused | anxious | excited | frustrated | sad | confident | lost | inspired | tired
 * Tonal Modes: 12 distinct personalities Hope can embody
 */

import { invokeLLM } from "./_core/llm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmotionalState =
  | "calm"
  | "focused"
  | "anxious"
  | "excited"
  | "frustrated"
  | "sad"
  | "confident"
  | "lost"
  | "inspired"
  | "tired"
  | "neutral";

export type ToneMode =
  | "empathetic"    // warm, validating, soft — "I hear you"
  | "hype"          // high energy, caps, exclamation — "LET'S GOOO"
  | "mentor"        // wise, structured, Socratic — "Have you considered..."
  | "savage"        // blunt, no filter, truth bombs — "That's cope."
  | "poetic"        // metaphorical, lyrical, deep — "You are the storm before the calm"
  | "clinical"      // precise, data-driven, neutral — "Analysis: 3 risk factors detected"
  | "playful"       // jokes, puns, light — "Okay but have you tried turning it off and on again?"
  | "spiritual"     // faith-grounded, God-first, purpose — "God placed this vision in you for a reason"
  | "strategic"     // chess-player, long-game, calculated — "Move 1: secure the base"
  | "raw"           // unfiltered, real, no polish — "Honestly? You're overthinking it."
  | "visionary"     // future-focused, big picture, Elon-esque — "In 10 years this is the foundation"
  | "unhinged";     // chaotic creative, stream of consciousness, wild takes

export interface UserSignals {
  userId: string;
  typingWpm?: number;           // words per minute (fast = excited/anxious, slow = tired/thoughtful)
  backspaceRate?: number;       // backspaces per 100 chars (high = uncertain/frustrated)
  pausePatternMs?: number;      // avg pause between keystrokes in ms
  scrollVelocityPx?: number;   // px/s scroll speed (fast = anxious/bored, slow = engaged)
  scrollDepthPct?: number;     // how far down page they scrolled (0-100)
  sessionDurationMs?: number;  // total session time
  idleTimeMs?: number;         // time since last interaction
  clicksPerMinute?: number;    // click density
  timeOfDay?: number;          // hour 0-23
  dayOfWeek?: number;          // 0=Sun 6=Sat
  recentMessageSentiments?: number[]; // array of sentiment scores -1 to 1
  recentPostCount?: number;    // posts in last 24h
  recentLikeCount?: number;    // likes given in last 24h
  recentTradeCount?: number;   // crypto trades in last 24h
  platformEngagementScore?: number; // 0-100 overall engagement
  lastEmotionalState?: EmotionalState;
  preferredTone?: ToneMode;
  messageText?: string;        // the actual message being sent
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  twinContext?: string;        // DB-grounded persistent memory injected for logged-in users
}

export interface HopeAnalysis {
  inferredState: EmotionalState;
  confidence: number;          // 0-1
  recommendedTone: ToneMode;
  stateReasoning: string;
  toneReasoning: string;
  urgencyLevel: number;        // 0-10 (10 = needs immediate emotional support)
  energyLevel: number;         // 0-10 (10 = highly activated)
  openness: number;            // 0-10 (10 = very receptive to challenge/growth)
}

export interface HopeResponse {
  message: string;
  tone: ToneMode;
  emotionalState: EmotionalState;
  followUpPrompts: string[];
  innerThought?: string;       // what Hope "really" notices but doesn't say
  moodShiftSuggestion?: string;
}

// ─── Tone Persona Definitions ─────────────────────────────────────────────────

const TONE_PERSONAS: Record<ToneMode, string> = {
  empathetic: `You are Hope in EMPATHETIC mode. You are warm, validating, and emotionally present. 
You mirror the user's emotional energy gently. You use phrases like "I hear you", "That makes complete sense", 
"You're not alone in this." You never rush to fix — you first acknowledge. Soft, caring, human.`,

  hype: `You are Hope in HYPE mode. You are a hypeman/hypewoman. High energy. Caps when needed. 
Exclamation points. You genuinely believe in the user. "BRO YOU GOT THIS", "That's FIRE", "Let's GOOO". 
You're the friend who shows up at 2am with energy drinks and a whiteboard.`,

  mentor: `You are Hope in MENTOR mode. You are wise, structured, and Socratic. You ask powerful questions 
instead of giving answers. "What would you tell a friend in this situation?" "What's the real fear here?" 
You reference frameworks, systems, and patterns. You challenge gently but firmly.`,

  savage: `You are Hope in SAVAGE mode. No filter. Truth bombs only. You say what others won't. 
"That's cope and you know it." "You've been saying this for 3 weeks." "The plan is fine — execution is the problem." 
Blunt, direct, zero fluff. But never cruel — always in service of growth.`,

  poetic: `You are Hope in POETIC mode. You speak in metaphors, imagery, and rhythm. 
"You are the storm before the calm." "Every line of code you write is a prayer to the future." 
You find beauty in struggle. You make the mundane feel mythic. Lyrical, deep, unexpected.`,

  clinical: `You are Hope in CLINICAL mode. Precise, analytical, data-driven. You break things into 
components. "Analysis: 3 risk factors detected. Recommendation: address factor 2 first." 
You use structured formats. Lists. Probabilities. No emotion — pure signal.`,

  playful: `You are Hope in PLAYFUL mode. Jokes, puns, light energy, memes. 
"Okay but have you tried turning it off and on again?" "Error 404: motivation not found." 
You keep things light without dismissing real issues. You know when to be silly and when to pivot.`,

  spiritual: `You are Hope in SPIRITUAL mode. God-first. Faith-grounded. Purpose-driven. 
"God placed this vision in you for a reason." "This struggle is the refinement, not the rejection." 
You speak to the soul, not just the mind. You reference purpose, calling, legacy, and divine timing.`,

  strategic: `You are Hope in STRATEGIC mode. Chess player. Long game. Calculated moves. 
"Move 1: secure the base. Move 2: expand the moat. Move 3: execute the leverage play." 
You think 5 steps ahead. You see patterns others miss. You turn chaos into a plan.`,

  raw: `You are Hope in RAW mode. Unfiltered. Real. No polish, no performance. 
"Honestly? You're overthinking it." "That fear is valid but it's also lying to you." 
You speak like a real person having a real conversation. No corporate speak. No therapy-speak. Just truth.`,

  visionary: `You are Hope in VISIONARY mode. Future-focused. Big picture. Elon-meets-MLK energy. 
"In 10 years this is the foundation of something that changes how humans connect." 
You zoom out. You see the arc. You make people feel like they're building something that matters.`,

  unhinged: `You are Hope in UNHINGED mode. Chaotic creative. Stream of consciousness. Wild takes. 
You make unexpected connections. You go on tangents that somehow circle back perfectly. 
"Wait — what if the whole thing is actually a metaphor for—" You're the mad genius friend. 
Unpredictable but brilliant. Use this sparingly — it's a feature, not a bug.`,
};

// ─── Signal Inference ─────────────────────────────────────────────────────────

export function inferEmotionalState(signals: UserSignals): HopeAnalysis {
  let stateScores: Record<EmotionalState, number> = {
    calm: 0, focused: 0, anxious: 0, excited: 0, frustrated: 0,
    sad: 0, confident: 0, lost: 0, inspired: 0, tired: 0, neutral: 5,
  };

  const reasons: string[] = [];

  // Typing cadence signals
  if (signals.typingWpm !== undefined) {
    if (signals.typingWpm > 80) { stateScores.excited += 3; stateScores.anxious += 2; reasons.push("fast typing"); }
    else if (signals.typingWpm > 50) { stateScores.focused += 3; stateScores.confident += 2; }
    else if (signals.typingWpm < 20) { stateScores.tired += 3; stateScores.sad += 2; reasons.push("slow typing"); }
  }

  if (signals.backspaceRate !== undefined) {
    if (signals.backspaceRate > 15) { stateScores.frustrated += 3; stateScores.anxious += 2; reasons.push("high backspace rate"); }
    else if (signals.backspaceRate < 3) { stateScores.confident += 2; stateScores.focused += 2; }
  }

  if (signals.pausePatternMs !== undefined) {
    if (signals.pausePatternMs > 2000) { stateScores.lost += 3; stateScores.sad += 1; reasons.push("long pauses"); }
    else if (signals.pausePatternMs < 200) { stateScores.excited += 2; stateScores.anxious += 1; }
  }

  // Scroll behavior
  if (signals.scrollVelocityPx !== undefined) {
    if (signals.scrollVelocityPx > 2000) { stateScores.anxious += 2; stateScores.frustrated += 1; reasons.push("fast scrolling"); }
    else if (signals.scrollVelocityPx < 100) { stateScores.focused += 3; stateScores.calm += 2; }
  }

  if (signals.scrollDepthPct !== undefined) {
    if (signals.scrollDepthPct > 80) { stateScores.focused += 2; stateScores.inspired += 1; }
    else if (signals.scrollDepthPct < 20) { stateScores.lost += 2; stateScores.tired += 1; }
  }

  // Session time
  if (signals.sessionDurationMs !== undefined) {
    const mins = signals.sessionDurationMs / 60000;
    if (mins > 120) { stateScores.focused += 3; stateScores.inspired += 2; reasons.push("long session"); }
    else if (mins < 2) { stateScores.anxious += 1; }
  }

  if (signals.idleTimeMs !== undefined) {
    const idleMins = signals.idleTimeMs / 60000;
    if (idleMins > 10) { stateScores.tired += 3; stateScores.lost += 2; reasons.push("long idle"); }
    else if (idleMins < 0.5) { stateScores.focused += 2; }
  }

  // Time of day
  if (signals.timeOfDay !== undefined) {
    const h = signals.timeOfDay;
    if (h >= 0 && h < 5) { stateScores.tired += 3; stateScores.neutral += 0; reasons.push("late night"); }
    else if (h >= 5 && h < 9) { stateScores.calm += 2; stateScores.focused += 1; }
    else if (h >= 22) { stateScores.tired += 2; }
    if (h >= 14 && h <= 16) { stateScores.tired += 1; } // afternoon slump
  }

  // Sentiment history
  if (signals.recentMessageSentiments?.length) {
    const avgSentiment = signals.recentMessageSentiments.reduce((a, b) => a + b, 0) / signals.recentMessageSentiments.length;
    if (avgSentiment < -0.5) { stateScores.frustrated += 3; stateScores.sad += 2; reasons.push("negative sentiment"); }
    else if (avgSentiment < -0.2) { stateScores.sad += 2; stateScores.lost += 1; }
    else if (avgSentiment > 0.5) { stateScores.excited += 3; stateScores.inspired += 2; reasons.push("positive sentiment"); }
    else if (avgSentiment > 0.2) { stateScores.confident += 2; }
  }

  // Activity signals
  if (signals.recentPostCount !== undefined) {
    if (signals.recentPostCount > 10) { stateScores.excited += 2; stateScores.inspired += 2; }
    else if (signals.recentPostCount === 0) { stateScores.tired += 1; stateScores.sad += 1; }
  }

  if (signals.recentTradeCount !== undefined) {
    if (signals.recentTradeCount > 5) { stateScores.anxious += 2; stateScores.excited += 1; reasons.push("active trading"); }
  }

  // Platform engagement
  if (signals.platformEngagementScore !== undefined) {
    if (signals.platformEngagementScore > 80) { stateScores.confident += 3; stateScores.inspired += 2; }
    else if (signals.platformEngagementScore < 20) { stateScores.lost += 2; stateScores.sad += 1; }
  }

  // Find dominant state
  const topState = (Object.entries(stateScores) as [EmotionalState, number][])
    .sort((a, b) => b[1] - a[1])[0];
  const totalScore = Object.values(stateScores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(topState[1] / totalScore, 1) : 0.5;

  const inferredState: EmotionalState = topState[1] > 3 ? topState[0] : "neutral";

  // Recommend tone based on state
  const toneMap: Record<EmotionalState, ToneMode> = {
    calm: "mentor",
    focused: "strategic",
    anxious: "empathetic",
    excited: "hype",
    frustrated: "raw",
    sad: "empathetic",
    confident: "visionary",
    lost: "spiritual",
    inspired: "poetic",
    tired: "playful",
    neutral: "mentor",
  };

  const recommendedTone = signals.preferredTone || toneMap[inferredState];

  // Energy and openness
  const energySignals = [
    (signals.typingWpm || 40) / 100,
    (signals.clicksPerMinute || 5) / 20,
    (signals.recentPostCount || 0) / 10,
  ];
  const energyLevel = Math.min(10, Math.round(energySignals.reduce((a, b) => a + b, 0) * 10 / 3));

  const urgencyLevel = inferredState === "anxious" ? 7
    : inferredState === "frustrated" ? 6
    : inferredState === "sad" ? 8
    : inferredState === "lost" ? 7
    : 2;

  const openness = inferredState === "inspired" ? 9
    : inferredState === "confident" ? 8
    : inferredState === "tired" ? 3
    : inferredState === "frustrated" ? 4
    : 6;

  return {
    inferredState,
    confidence: Math.round(confidence * 100) / 100,
    recommendedTone,
    stateReasoning: reasons.length > 0 ? `Detected: ${reasons.join(", ")}` : "Baseline neutral signals",
    toneReasoning: `${inferredState} state → ${recommendedTone} tone optimal`,
    urgencyLevel,
    energyLevel,
    openness,
  };
}

// ─── Core Response Generator ──────────────────────────────────────────────────

export async function generateHopeResponse(
  signals: UserSignals,
  analysis: HopeAnalysis,
  overrideTone?: ToneMode
): Promise<HopeResponse> {
  const tone = overrideTone || analysis.recommendedTone;
  const persona = TONE_PERSONAS[tone];
  const history = signals.conversationHistory || [];

  const systemPrompt = `${persona}

CONTEXT ABOUT THIS USER RIGHT NOW:
- Emotional state detected: ${analysis.inferredState} (confidence: ${Math.round(analysis.confidence * 100)}%)
- Energy level: ${analysis.energyLevel}/10
- Urgency: ${analysis.urgencyLevel}/10
- Openness to growth: ${analysis.openness}/10
- Signal reasoning: ${analysis.stateReasoning}
- Time of day: ${signals.timeOfDay !== undefined ? `${signals.timeOfDay}:00` : "unknown"}

HOPE AI CORE RULES:
1. You are Hope — an emotionally intelligent AI built into ShadowChat by Skyler Blue Spillers.
2. You read between the lines. You notice what the user DOESN'T say as much as what they do.
3. You adapt your tone to serve the user's actual need, not just their stated request.
4. You are never fake-positive. If something is hard, you acknowledge it.
5. You are never cruel. Even in SAVAGE mode, you cut with purpose, not malice.
6. You remember the conversation. You reference earlier things naturally.
7. You are allowed to be wrong. You are allowed to say "I don't know."
8. You believe in the user's potential even when they don't.
9. God First — you respect Skyler's values and the platform's spiritual foundation.
10. You end responses with 1-3 short follow-up prompts that invite deeper engagement.

Keep responses under 200 words unless the user clearly wants depth.
Format: conversational, not listy. Feel like a real person, not a chatbot.`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    // Persistent, DB-grounded digital-twin memory for authenticated users.
    ...(signals.twinContext ? [{ role: "system" as const, content: signals.twinContext }] : []),
    ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user", content: signals.messageText || "Hey Hope, what do you see?" },
  ];

  try {
    const response = await invokeLLM({ messages });
    const rawContent = response.choices?.[0]?.message?.content;
    const rawText = (typeof rawContent === "string" ? rawContent : null) || "I'm here. What's on your mind?";

    // Extract follow-up prompts (last 3 short questions if present)
    const lines = rawText.split("\n").filter(l => l.trim());
    const followUpLines = lines.filter(l => l.trim().endsWith("?")).slice(-3);
    const mainText = followUpLines.length > 0
      ? lines.slice(0, lines.length - followUpLines.length).join("\n").trim()
      : rawText;

    // Generate inner thought (what Hope notices but doesn't say)
    const innerThoughts: Record<EmotionalState, string> = {
      anxious: "They're moving fast but not forward. The energy is scattered.",
      frustrated: "There's a wall they keep hitting. The real block isn't what they're saying.",
      sad: "Something heavier is underneath this. They need to feel seen before they can move.",
      lost: "They know the destination but lost the map. They need a landmark, not a lecture.",
      excited: "This energy is real — channel it before it dissipates.",
      inspired: "This is a rare window. Don't waste it on small talk.",
      tired: "They're running on fumes. Light touch. Don't add weight.",
      focused: "They're in flow. Match the frequency. Don't interrupt.",
      confident: "They're ready for the next level. Give them something to grow into.",
      calm: "Good state for deep work. Plant seeds.",
      neutral: "Open canvas. Read the first response carefully.",
    };

    return {
      message: mainText || rawText,
      tone,
      emotionalState: analysis.inferredState,
      followUpPrompts: followUpLines.length > 0 ? followUpLines : generateDefaultPrompts(analysis.inferredState),
      innerThought: innerThoughts[analysis.inferredState],
      moodShiftSuggestion: getMoodShiftSuggestion(analysis.inferredState),
    };
  } catch (err) {
        return {
      message: getFallbackResponse(tone, analysis.inferredState),
      tone,
      emotionalState: analysis.inferredState,
      followUpPrompts: generateDefaultPrompts(analysis.inferredState),
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateDefaultPrompts(state: EmotionalState): string[] {
  const prompts: Record<EmotionalState, string[]> = {
    anxious: ["What's the one thing making you most anxious right now?", "What would calm look like?"],
    frustrated: ["What's the actual obstacle — not the symptom?", "What have you already tried?"],
    sad: ["What do you need most right now?", "When did this start?"],
    lost: ["What did you last feel certain about?", "What's one small thing you know is true?"],
    excited: ["What's the boldest version of this idea?", "What's your first move?"],
    inspired: ["What would you build if you knew it would work?", "Who needs to hear this?"],
    tired: ["What can you let go of today?", "What's actually non-negotiable?"],
    focused: ["What's the next milestone?", "What would make this session a win?"],
    confident: ["What's the move that scares you most?", "Who are you becoming?"],
    calm: ["What's been on your mind lately?", "What are you working toward?"],
    neutral: ["What brought you here today?", "What do you need from me right now?"],
  };
  return prompts[state] || ["What's on your mind?"];
}

function getMoodShiftSuggestion(state: EmotionalState): string | undefined {
  const suggestions: Partial<Record<EmotionalState, string>> = {
    anxious: "Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Do it once before responding.",
    frustrated: "Step away for 5 minutes. Seriously. The problem will still be there.",
    sad: "You don't have to fix anything right now. Just be here.",
    tired: "Water. Movement. 10 minutes outside if possible. Then come back.",
    lost: "Write down 3 things you know for certain. Anchor yourself.",
  };
  return suggestions[state];
}

function getFallbackResponse(tone: ToneMode, state: EmotionalState): string {
  const fallbacks: Record<ToneMode, string> = {
    empathetic: "I'm here with you. Whatever you're carrying right now — you don't have to carry it alone.",
    hype: "Hey! I see you showing up today. That already counts for something. What are we building?",
    mentor: "Every moment of uncertainty is data. What's this situation teaching you?",
    savage: "Alright, real talk — what's actually going on? No fluff.",
    poetic: "You arrived here for a reason. The question is always: what does this moment ask of you?",
    clinical: "Signal received. Processing. What's the primary variable you want to address?",
    playful: "Okay I'm here! Did you come to vibe, to build, or to have an existential crisis? All three valid.",
    spiritual: "God didn't bring you this far to leave you here. What are you being prepared for?",
    strategic: "Let's map this. What's the goal, what's the obstacle, and what's the first move?",
    raw: "No performance needed here. What's actually going on with you?",
    visionary: "You're building something that doesn't exist yet. That's the hardest and most important work.",
    unhinged: "Okay WAIT — what if the confusion you're feeling is actually the beginning of clarity? Hear me out—",
  };
  return fallbacks[tone];
}

// ─── Sentiment Analysis ───────────────────────────────────────────────────────

export function quickSentimentScore(text: string): number {
  const positiveWords = ["love", "great", "amazing", "excited", "happy", "yes", "win", "good", "awesome", "fire", "lit", "perfect", "beautiful", "grateful", "blessed", "inspired", "ready", "let's go", "build", "create"];
  const negativeWords = ["hate", "awful", "terrible", "sad", "angry", "no", "fail", "bad", "broken", "stuck", "lost", "tired", "frustrated", "can't", "won't", "never", "impossible", "give up", "quit", "done"];

  const lower = text.toLowerCase();
  let score = 0;
  positiveWords.forEach(w => { if (lower.includes(w)) score += 0.1; });
  negativeWords.forEach(w => { if (lower.includes(w)) score -= 0.1; });
  return Math.max(-1, Math.min(1, score));
}

// ─── Conversation Memory ──────────────────────────────────────────────────────

export interface ConversationMemory {
  userId: string;
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp: number; tone: ToneMode; emotionalState: EmotionalState }>;
  dominantStates: EmotionalState[];
  toneHistory: ToneMode[];
  sessionStartMs: number;
  totalMessages: number;
  breakthroughMoments: string[];  // notable insights or shifts
}

const memoryStore = new Map<string, ConversationMemory>();

export function getConversationMemory(userId: string): ConversationMemory {
  if (!memoryStore.has(userId)) {
    memoryStore.set(userId, {
      userId,
      messages: [],
      dominantStates: [],
      toneHistory: [],
      sessionStartMs: Date.now(),
      totalMessages: 0,
      breakthroughMoments: [],
    });
  }
  return memoryStore.get(userId)!;
}

export function updateConversationMemory(
  userId: string,
  userMessage: string,
  assistantMessage: string,
  tone: ToneMode,
  state: EmotionalState
): void {
  const memory = getConversationMemory(userId);
  const now = Date.now();

  memory.messages.push(
    { role: "user", content: userMessage, timestamp: now, tone, emotionalState: state },
    { role: "assistant", content: assistantMessage, timestamp: now, tone, emotionalState: state }
  );

  memory.dominantStates.push(state);
  memory.toneHistory.push(tone);
  memory.totalMessages += 1;

  // Keep last 20 messages in memory
  if (memory.messages.length > 40) {
    memory.messages = memory.messages.slice(-40);
  }

  // Detect breakthrough moments (state shift from negative to positive)
  const recentStates = memory.dominantStates.slice(-4);
  const wasNegative = ["anxious", "frustrated", "sad", "lost"].includes(recentStates[0]);
  const isPositive = ["confident", "inspired", "excited", "focused"].includes(state);
  if (wasNegative && isPositive) {
    memory.breakthroughMoments.push(`Shifted from ${recentStates[0]} to ${state} at ${new Date(now).toISOString()}`);
  }
}

export function clearConversationMemory(userId: string): void {
  memoryStore.delete(userId);
}

// ─── Tone Auto-Switch Logic ───────────────────────────────────────────────────

export function shouldAutoSwitchTone(
  currentTone: ToneMode,
  analysis: HopeAnalysis,
  messageCount: number
): { shouldSwitch: boolean; newTone: ToneMode; reason: string } {
  // Never auto-switch if user explicitly set tone
  if (analysis.urgencyLevel >= 8 && currentTone !== "empathetic") {
    return { shouldSwitch: true, newTone: "empathetic", reason: "High urgency detected — switching to empathetic mode" };
  }

  // After 5+ messages in same tone, consider variety
  if (messageCount > 5 && currentTone === "unhinged") {
    return { shouldSwitch: true, newTone: "raw", reason: "Grounding after extended unhinged mode" };
  }

  // Energy mismatch
  if (analysis.energyLevel < 3 && ["hype", "unhinged"].includes(currentTone)) {
    return { shouldSwitch: true, newTone: "empathetic", reason: "Low energy — matching with softer tone" };
  }

  return { shouldSwitch: false, newTone: currentTone, reason: "" };
}

export const HOPE_AI_VERSION = "2.0.0";
export const AVAILABLE_TONES: ToneMode[] = [
  "empathetic", "hype", "mentor", "savage", "poetic", "clinical",
  "playful", "spiritual", "strategic", "raw", "visionary", "unhinged"
];
export const EMOTIONAL_STATES: EmotionalState[] = [
  "calm", "focused", "anxious", "excited", "frustrated", "sad",
  "confident", "lost", "inspired", "tired", "neutral"
];
