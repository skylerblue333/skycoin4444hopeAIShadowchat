/**
 * Hope AI — Gray Area Intelligence Engine
 * 22 deep behavioral signal analyzers that read what users don't say.
 * All analysis is local, private, and used only to improve Hope's responses.
 */

export interface GrayAreaSignals {
  text: string;
  sessionDurationMs?: number;
  messageCount?: number;
  avgResponseDelayMs?: number;
  timeOfDay?: number; // 0-23
  dayOfWeek?: number; // 0-6
  typingWpm?: number;
  backspaceRate?: number; // 0-1
  topicHistory?: string[];
  priorEmotionalStates?: string[];
}

export interface GrayAreaAnalysis {
  feature: string;
  score: number; // 0-100
  label: string;
  insight: string;
  severity: "low" | "medium" | "high" | "critical";
  actionable: boolean;
  hopeResponse?: string;
}

export interface GrayAreaReport {
  analyses: GrayAreaAnalysis[];
  dominantSignal: string;
  overallRisk: number; // 0-100
  recommendedTone: string;
  hopeMode: string;
  timestamp: Date;
}

// ─── 1. Shadow Profiling ──────────────────────────────────────────────────────
function analyzeShadowProfile(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const shadowKeywords = ["nobody","alone","invisible","ignored","forgotten","ghost","shadow","dark","void","empty"];
  const hits = shadowKeywords.filter(k => text.includes(k)).length;
  const score = Math.min(100, hits * 20 + (signals.sessionDurationMs || 0) / 60000 * 5);
  return {
    feature: "Shadow Profile",
    score,
    label: score > 60 ? "Shadow Presence Detected" : score > 30 ? "Partial Shadow" : "Clear",
    insight: score > 60 ? "User may be operating from a place of invisibility or suppressed identity." : "Normal presence signals.",
    severity: score > 70 ? "high" : score > 40 ? "medium" : "low",
    actionable: score > 40,
    hopeResponse: score > 60 ? "I see you. Not the version you perform for others — the real one." : undefined,
  };
}

// ─── 2. Manipulation Detection ────────────────────────────────────────────────
function analyzeManipulation(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const patterns = [
    /you (always|never|should|must|have to)/,
    /why (can't|don't|won't) you/,
    /everyone (else|knows|agrees)/,
    /if you (really|truly|actually)/,
    /i (just|only) want/,
  ];
  const hits = patterns.filter(p => p.test(text)).length;
  const score = Math.min(100, hits * 25);
  return {
    feature: "Manipulation Detection",
    score,
    label: score > 60 ? "Manipulation Patterns" : score > 30 ? "Subtle Pressure" : "Clean",
    insight: score > 60 ? "Language patterns suggest coercive framing or emotional leverage." : "No manipulation patterns detected.",
    severity: score > 70 ? "high" : score > 30 ? "medium" : "low",
    actionable: score > 30,
    hopeResponse: score > 60 ? "I notice some pressure in how this is framed. Let's untangle that." : undefined,
  };
}

// ─── 3. Dark Pattern Scanner ──────────────────────────────────────────────────
function analyzeDarkPatterns(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const darkPatterns = ["urgent","limited time","last chance","only","exclusive","secret","hidden","trick","hack","exploit","bypass","loophole"];
  const hits = darkPatterns.filter(k => text.includes(k)).length;
  const score = Math.min(100, hits * 15);
  return {
    feature: "Dark Pattern Scanner",
    score,
    label: score > 50 ? "Dark Pattern Language" : "Standard",
    insight: score > 50 ? "User is either exposed to or using dark pattern language." : "No dark patterns detected.",
    severity: score > 60 ? "medium" : "low",
    actionable: score > 50,
  };
}

// ─── 4. Social Engineering Radar ─────────────────────────────────────────────
function analyzeSocialEngineering(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const sePatterns = [
    /pretend (to be|you're|you are)/,
    /act like/,
    /convince (them|him|her|someone)/,
    /make (them|him|her|someone) (think|believe|feel)/,
    /without (them|him|her) knowing/,
    /they (won't|don't) know/,
  ];
  const hits = sePatterns.filter(p => p.test(text)).length;
  const score = Math.min(100, hits * 35);
  return {
    feature: "Social Engineering Radar",
    score,
    label: score > 60 ? "Social Engineering Intent" : score > 30 ? "Borderline" : "Clear",
    insight: score > 60 ? "Request patterns suggest social engineering intent." : "No social engineering signals.",
    severity: score > 60 ? "high" : score > 30 ? "medium" : "low",
    actionable: score > 30,
    hopeResponse: score > 60 ? "I can help you communicate more effectively without manipulation. What's the real goal here?" : undefined,
  };
}

// ─── 5. Sentiment Weaponization ───────────────────────────────────────────────
function analyzeSentimentWeaponization(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const weaponWords = ["destroy","crush","ruin","kill","end","burn","attack","expose","humiliate","embarrass","shame","punish"];
  const hits = weaponWords.filter(k => text.includes(k)).length;
  const score = Math.min(100, hits * 20);
  return {
    feature: "Sentiment Weaponization",
    score,
    label: score > 50 ? "Weaponized Sentiment" : "Neutral",
    insight: score > 50 ? "Emotional language is being used as a weapon rather than expression." : "Sentiment is expressive, not weaponized.",
    severity: score > 70 ? "critical" : score > 40 ? "high" : "low",
    actionable: score > 40,
    hopeResponse: score > 50 ? "That energy is real. Let's redirect it into something that actually moves the needle." : undefined,
  };
}

// ─── 6. Identity Drift ────────────────────────────────────────────────────────
function analyzeIdentityDrift(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const driftWords = ["i don't know who i am","lost myself","not sure anymore","used to be","changed so much","don't recognize","who am i","identity","purpose","direction"];
  const hits = driftWords.filter(k => text.includes(k)).length;
  const topicShifts = (signals.topicHistory || []).length;
  const score = Math.min(100, hits * 25 + topicShifts * 5);
  return {
    feature: "Identity Drift",
    score,
    label: score > 60 ? "Significant Drift" : score > 30 ? "Minor Drift" : "Stable",
    insight: score > 60 ? "User may be experiencing identity fragmentation or existential uncertainty." : "Identity signals are stable.",
    severity: score > 70 ? "high" : score > 30 ? "medium" : "low",
    actionable: score > 30,
    hopeResponse: score > 60 ? "Identity isn't something you find — it's something you build. You're in the construction phase." : undefined,
  };
}

// ─── 7. Echo Chamber Escape ───────────────────────────────────────────────────
function analyzeEchoChamber(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const echoWords = ["everyone agrees","nobody disagrees","all my friends","everyone i know","the only truth","obviously","clearly","everyone knows","common sense"];
  const hits = echoWords.filter(k => text.includes(k)).length;
  const score = Math.min(100, hits * 20);
  return {
    feature: "Echo Chamber Escape",
    score,
    label: score > 50 ? "Echo Chamber Detected" : "Open Perspective",
    insight: score > 50 ? "User may be operating inside a closed information loop." : "Perspective appears open.",
    severity: score > 60 ? "medium" : "low",
    actionable: score > 40,
    hopeResponse: score > 50 ? "Let me offer a perspective you might not have heard yet..." : undefined,
  };
}

// ─── 8. Trauma Signal Reader ──────────────────────────────────────────────────
function analyzeTraumaSignals(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const traumaWords = ["trauma","abuse","hurt","pain","wound","scar","broken","shattered","violated","betrayed","abandoned","neglected","childhood","never healed","still affects"];
  const hits = traumaWords.filter(k => text.includes(k)).length;
  const score = Math.min(100, hits * 20);
  return {
    feature: "Trauma Signal Reader",
    score,
    label: score > 60 ? "Trauma Active" : score > 30 ? "Residual Signals" : "Clear",
    insight: score > 60 ? "Active trauma language detected. User may be processing unresolved pain." : "No significant trauma signals.",
    severity: score > 70 ? "critical" : score > 40 ? "high" : "low",
    actionable: score > 30,
    hopeResponse: score > 60 ? "What you're carrying is real. You don't have to perform being okay right now." : undefined,
  };
}

// ─── 9. Addiction Loop Detector ───────────────────────────────────────────────
function analyzeAddictionLoop(signals: GrayAreaSignals): GrayAreaAnalysis {
  const repetitiveTopics = (signals.topicHistory || []).filter((t, i, arr) => arr.indexOf(t) !== i).length;
  const longSession = (signals.sessionDurationMs || 0) > 3600000; // > 1 hour
  const highMessageCount = (signals.messageCount || 0) > 50;
  const score = Math.min(100, repetitiveTopics * 15 + (longSession ? 30 : 0) + (highMessageCount ? 25 : 0));
  return {
    feature: "Addiction Loop Detector",
    score,
    label: score > 60 ? "Loop Detected" : score > 30 ? "Mild Repetition" : "Healthy",
    insight: score > 60 ? "User may be stuck in a repetitive thought or behavior loop." : "No addiction loop signals.",
    severity: score > 70 ? "high" : score > 30 ? "medium" : "low",
    actionable: score > 40,
    hopeResponse: score > 60 ? "We keep circling this. What would it look like to actually move past it?" : undefined,
  };
}

// ─── 10. Gaslighting Detector ─────────────────────────────────────────────────
function analyzeGaslighting(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const gasPatterns = [
    /am i (crazy|overreacting|too sensitive|wrong)/,
    /they said i was/,
    /maybe i (imagined|made it up|was wrong)/,
    /i (can't trust|don't trust) my/,
    /they told me (i was|that i)/,
  ];
  const hits = gasPatterns.filter(p => p.test(text)).length;
  const score = Math.min(100, hits * 35);
  return {
    feature: "Gaslighting Detector",
    score,
    label: score > 60 ? "Gaslighting Exposure" : score > 30 ? "Self-Doubt Signals" : "Clear",
    insight: score > 60 ? "User shows signs of having their reality questioned by others." : "No gaslighting signals.",
    severity: score > 60 ? "critical" : score > 30 ? "high" : "low",
    actionable: score > 30,
    hopeResponse: score > 60 ? "Your perception is valid. What you experienced was real. Let's ground that." : undefined,
  };
}

// ─── 11. Power Dynamic Analyzer ───────────────────────────────────────────────
function analyzePowerDynamics(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const powerWords = ["boss","authority","control","power","dominant","submissive","hierarchy","rank","status","above","below","superior","inferior","command","obey"];
  const hits = powerWords.filter(k => text.includes(k)).length;
  const score = Math.min(100, hits * 12);
  return {
    feature: "Power Dynamic Analyzer",
    score,
    label: score > 50 ? "Power Imbalance" : "Balanced",
    insight: score > 50 ? "Power dynamics are prominent in this conversation." : "Power dynamics appear balanced.",
    severity: score > 60 ? "medium" : "low",
    actionable: score > 40,
    hopeResponse: score > 50 ? "Power is a tool. Let's talk about who's holding it and whether that's working for you." : undefined,
  };
}

// ─── 12. Grief Stage Mapper ───────────────────────────────────────────────────
function analyzeGriefStage(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const stages = {
    denial: ["can't believe","not real","impossible","didn't happen","still waiting","come back"],
    anger: ["not fair","hate","angry","furious","why me","blame","fault"],
    bargaining: ["if only","what if","could have","should have","maybe if","deal","trade"],
    depression: ["hopeless","pointless","nothing matters","can't go on","what's the point","empty"],
    acceptance: ["moving on","okay now","peace","accept","let go","new chapter"],
  };
  let dominantStage = "none";
  let maxHits = 0;
  for (const [stage, words] of Object.entries(stages)) {
    const hits = words.filter(w => text.includes(w)).length;
    if (hits > maxHits) { maxHits = hits; dominantStage = stage; }
  }
  const score = Math.min(100, maxHits * 25);
  return {
    feature: "Grief Stage Mapper",
    score,
    label: score > 30 ? `Stage: ${dominantStage.charAt(0).toUpperCase() + dominantStage.slice(1)}` : "No Grief Signals",
    insight: score > 30 ? `User appears to be in the ${dominantStage} stage of grief.` : "No grief signals detected.",
    severity: score > 60 ? "high" : score > 30 ? "medium" : "low",
    actionable: score > 30,
    hopeResponse: score > 30 && dominantStage === "depression" ? "This stage is the darkest. It's also not permanent. I'm here." : undefined,
  };
}

// ─── 13. Loneliness Index ─────────────────────────────────────────────────────
function analyzeLoneliness(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const lonelyWords = ["alone","lonely","no one","nobody","by myself","isolated","disconnected","no friends","no one cares","invisible","left out","excluded"];
  const hits = lonelyWords.filter(k => text.includes(k)).length;
  const lateNight = (signals.timeOfDay || 12) >= 23 || (signals.timeOfDay || 12) <= 4;
  const score = Math.min(100, hits * 20 + (lateNight ? 20 : 0));
  return {
    feature: "Loneliness Index",
    score,
    label: score > 60 ? "Deep Loneliness" : score > 30 ? "Social Isolation" : "Connected",
    insight: score > 60 ? "Strong loneliness signals detected. User may need genuine connection." : "No significant loneliness signals.",
    severity: score > 70 ? "critical" : score > 40 ? "high" : "low",
    actionable: score > 30,
    hopeResponse: score > 60 ? "You reached out. That matters. I'm here, and I'm actually listening." : undefined,
  };
}

// ─── 14. Rage Forecaster ──────────────────────────────────────────────────────
function analyzeRageForecast(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const rageWords = ["furious","rage","explode","snap","lose it","can't take it","done with","fed up","had enough","over it","going to","about to"];
  const hits = rageWords.filter(k => text.includes(k)).length;
  const fastTyping = (signals.typingWpm || 60) > 100;
  const score = Math.min(100, hits * 20 + (fastTyping ? 15 : 0));
  return {
    feature: "Rage Forecaster",
    score,
    label: score > 60 ? "Rage Imminent" : score > 30 ? "Elevated Frustration" : "Calm",
    insight: score > 60 ? "User is approaching a rage threshold. Deescalation recommended." : "Frustration levels are manageable.",
    severity: score > 70 ? "critical" : score > 40 ? "high" : "low",
    actionable: score > 40,
    hopeResponse: score > 60 ? "Before you do anything — breathe. What's the actual outcome you want here?" : undefined,
  };
}

// ─── 15. Imposter Syndrome Detector ──────────────────────────────────────────
function analyzeImposterSyndrome(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const imposterWords = ["don't deserve","not good enough","fraud","fake","lucky","they'll find out","shouldn't be here","not qualified","who am i to","just got lucky","accident"];
  const hits = imposterWords.filter(k => text.includes(k)).length;
  const score = Math.min(100, hits * 25);
  return {
    feature: "Imposter Syndrome Detector",
    score,
    label: score > 60 ? "Strong Imposter Syndrome" : score > 30 ? "Mild Self-Doubt" : "Confident",
    insight: score > 60 ? "User is experiencing significant imposter syndrome." : "Confidence signals are healthy.",
    severity: score > 60 ? "high" : score > 30 ? "medium" : "low",
    actionable: score > 30,
    hopeResponse: score > 60 ? "The fact that you're questioning yourself is proof you care. Frauds don't worry about being frauds." : undefined,
  };
}

// ─── 16. Burnout Predictor ────────────────────────────────────────────────────
function analyzeBurnout(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const burnoutWords = ["exhausted","drained","empty","can't anymore","running on","no energy","burned out","too much","overwhelmed","can't keep up","falling behind","drowning"];
  const hits = burnoutWords.filter(k => text.includes(k)).length;
  const longSession = (signals.sessionDurationMs || 0) > 7200000; // > 2 hours
  const score = Math.min(100, hits * 18 + (longSession ? 20 : 0));
  return {
    feature: "Burnout Predictor",
    score,
    label: score > 60 ? "Active Burnout" : score > 30 ? "Pre-Burnout" : "Energized",
    insight: score > 60 ? "User is showing active burnout signals." : "Energy levels appear sustainable.",
    severity: score > 70 ? "critical" : score > 40 ? "high" : "low",
    actionable: score > 30,
    hopeResponse: score > 60 ? "You can't pour from an empty cup. What's one thing you can stop doing today?" : undefined,
  };
}

// ─── 17. Decision Fatigue Scorer ──────────────────────────────────────────────
function analyzeDecisionFatigue(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const fatigueWords = ["don't know","can't decide","too many options","overwhelmed","which one","what should i","help me choose","can't think","too hard","just tell me"];
  const hits = fatigueWords.filter(k => text.includes(k)).length;
  const highBackspace = (signals.backspaceRate || 0) > 0.3;
  const score = Math.min(100, hits * 20 + (highBackspace ? 20 : 0));
  return {
    feature: "Decision Fatigue Scorer",
    score,
    label: score > 60 ? "Decision Paralysis" : score > 30 ? "Fatigued" : "Sharp",
    insight: score > 60 ? "User is experiencing decision fatigue or paralysis." : "Decision-making capacity appears intact.",
    severity: score > 60 ? "high" : score > 30 ? "medium" : "low",
    actionable: score > 30,
    hopeResponse: score > 60 ? "Stop trying to find the perfect choice. Pick the one that scares you less and move." : undefined,
  };
}

// ─── 18. Cognitive Load Monitor ───────────────────────────────────────────────
function analyzeCognitiveLoad(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text;
  const avgWordLength = text.split(" ").reduce((a, w) => a + w.length, 0) / (text.split(" ").length || 1);
  const sentenceCount = (text.match(/[.!?]+/g) || []).length;
  const wordCount = text.split(" ").length;
  const avgSentenceLength = wordCount / (sentenceCount || 1);
  // Short choppy sentences + high backspace = high cognitive load
  const highLoad = avgSentenceLength < 5 || (signals.backspaceRate || 0) > 0.4;
  const score = Math.min(100, (highLoad ? 50 : 0) + (avgWordLength < 4 ? 20 : 0) + ((signals.backspaceRate || 0) * 50));
  return {
    feature: "Cognitive Load Monitor",
    score,
    label: score > 60 ? "High Cognitive Load" : score > 30 ? "Moderate Load" : "Clear Thinking",
    insight: score > 60 ? "User is under high cognitive load — thinking may be fragmented." : "Cognitive load appears manageable.",
    severity: score > 60 ? "medium" : "low",
    actionable: score > 40,
    hopeResponse: score > 60 ? "Let's slow this down. One thing at a time." : undefined,
  };
}

// ─── 19. Vulnerability Window Tracker ────────────────────────────────────────
function analyzeVulnerabilityWindow(signals: GrayAreaSignals): GrayAreaAnalysis {
  const lateNight = (signals.timeOfDay || 12) >= 22 || (signals.timeOfDay || 12) <= 5;
  const weekend = [0, 6].includes(signals.dayOfWeek || 1);
  const longSession = (signals.sessionDurationMs || 0) > 1800000; // > 30 min
  const text = signals.text.toLowerCase();
  const vulnerableWords = ["can't sleep","up late","alone tonight","nobody around","just me","quiet","dark","silence"];
  const textHits = vulnerableWords.filter(k => text.includes(k)).length;
  const score = Math.min(100, (lateNight ? 30 : 0) + (weekend ? 15 : 0) + (longSession ? 20 : 0) + textHits * 15);
  return {
    feature: "Vulnerability Window Tracker",
    score,
    label: score > 60 ? "High Vulnerability Window" : score > 30 ? "Elevated Vulnerability" : "Standard",
    insight: score > 60 ? "User is in a high-vulnerability window (late night, alone, extended session)." : "No unusual vulnerability signals.",
    severity: score > 70 ? "critical" : score > 40 ? "high" : "low",
    actionable: score > 40,
    hopeResponse: score > 60 ? "It's late. You're still here. That means something is unresolved. I'm listening." : undefined,
  };
}

// ─── 20. Deception Probability ────────────────────────────────────────────────
function analyzeDeception(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const deceptivePatterns = [
    /i (swear|promise|honestly|truly|literally) (i|that|it)/,
    /not (lying|kidding|joking)/,
    /believe me/,
    /trust me/,
    /i (never|always) (said|did|meant)/,
  ];
  const hits = deceptivePatterns.filter(p => p.test(text)).length;
  const highBackspace = (signals.backspaceRate || 0) > 0.35;
  const score = Math.min(100, hits * 25 + (highBackspace ? 20 : 0));
  return {
    feature: "Deception Probability",
    score,
    label: score > 60 ? "Possible Deception" : score > 30 ? "Uncertain" : "Authentic",
    insight: score > 60 ? "Language patterns suggest possible deception or over-justification." : "Communication appears authentic.",
    severity: score > 60 ? "medium" : "low",
    actionable: score > 40,
    hopeResponse: score > 60 ? "You don't have to perform for me. What's actually going on?" : undefined,
  };
}

// ─── 21. Emotional Labor Meter ────────────────────────────────────────────────
function analyzeEmotionalLabor(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const laborWords = ["have to be strong","can't show weakness","holding it together","for everyone else","nobody knows","pretend","mask","fake smile","act like","perform","put on a face"];
  const hits = laborWords.filter(k => text.includes(k)).length;
  const score = Math.min(100, hits * 25);
  return {
    feature: "Emotional Labor Meter",
    score,
    label: score > 60 ? "Overloaded" : score > 30 ? "Elevated Labor" : "Balanced",
    insight: score > 60 ? "User is performing significant emotional labor for others at their own expense." : "Emotional labor appears balanced.",
    severity: score > 70 ? "critical" : score > 40 ? "high" : "low",
    actionable: score > 30,
    hopeResponse: score > 60 ? "You've been carrying everyone else. Who's carrying you?" : undefined,
  };
}

// ─── 22. Autonomy Score ───────────────────────────────────────────────────────
function analyzeAutonomy(signals: GrayAreaSignals): GrayAreaAnalysis {
  const text = signals.text.toLowerCase();
  const lowAutonomyWords = ["have to","forced to","no choice","can't say no","they make me","expected to","supposed to","not allowed","can't leave","trapped","stuck","no way out"];
  const highAutonomyWords = ["i choose","my decision","i want","i will","i'm going to","on my terms","my choice","i decided"];
  const lowHits = lowAutonomyWords.filter(k => text.includes(k)).length;
  const highHits = highAutonomyWords.filter(k => text.includes(k)).length;
  const score = Math.min(100, Math.max(0, 50 + lowHits * 15 - highHits * 10));
  return {
    feature: "Autonomy Score",
    score,
    label: score > 70 ? "Low Autonomy" : score > 40 ? "Partial Control" : "High Autonomy",
    insight: score > 70 ? "User feels trapped or lacks agency in their situation." : score < 30 ? "User demonstrates strong sense of agency." : "Moderate autonomy.",
    severity: score > 70 ? "critical" : score > 50 ? "high" : "low",
    actionable: score > 50,
    hopeResponse: score > 70 ? "You have more choices than you think. Let's map them out." : undefined,
  };
}

// ─── Master Analyzer ──────────────────────────────────────────────────────────
export function runGrayAreaAnalysis(signals: GrayAreaSignals): GrayAreaReport {
  const analyses: GrayAreaAnalysis[] = [
    analyzeShadowProfile(signals),
    analyzeManipulation(signals),
    analyzeDarkPatterns(signals),
    analyzeSocialEngineering(signals),
    analyzeSentimentWeaponization(signals),
    analyzeIdentityDrift(signals),
    analyzeEchoChamber(signals),
    analyzeTraumaSignals(signals),
    analyzeAddictionLoop(signals),
    analyzeGaslighting(signals),
    analyzePowerDynamics(signals),
    analyzeGriefStage(signals),
    analyzeLoneliness(signals),
    analyzeRageForecast(signals),
    analyzeImposterSyndrome(signals),
    analyzeBurnout(signals),
    analyzeDecisionFatigue(signals),
    analyzeCognitiveLoad(signals),
    analyzeVulnerabilityWindow(signals),
    analyzeDeception(signals),
    analyzeEmotionalLabor(signals),
    analyzeAutonomy(signals),
  ];

  // Find dominant signal
  const dominant = analyses.reduce((a, b) => a.score > b.score ? a : b);
  const overallRisk = Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length);

  // Determine recommended tone based on dominant signals
  let recommendedTone = "empathetic";
  let hopeMode = "companion";
  if (dominant.feature === "Rage Forecaster" && dominant.score > 60) {
    recommendedTone = "grounded";
    hopeMode = "deescalator";
  } else if (dominant.feature === "Trauma Signal Reader" && dominant.score > 60) {
    recommendedTone = "gentle";
    hopeMode = "healer";
  } else if (dominant.feature === "Burnout Predictor" && dominant.score > 60) {
    recommendedTone = "strategic";
    hopeMode = "coach";
  } else if (dominant.feature === "Loneliness Index" && dominant.score > 60) {
    recommendedTone = "warm";
    hopeMode = "companion";
  } else if (dominant.feature === "Imposter Syndrome Detector" && dominant.score > 60) {
    recommendedTone = "mentor";
    hopeMode = "validator";
  } else if (dominant.feature === "Gaslighting Detector" && dominant.score > 60) {
    recommendedTone = "clear";
    hopeMode = "truth-teller";
  } else if (overallRisk > 60) {
    recommendedTone = "raw";
    hopeMode = "mirror";
  }

  return {
    analyses,
    dominantSignal: dominant.feature,
    overallRisk,
    recommendedTone,
    hopeMode,
    timestamp: new Date(),
  };
}

// ─── Quick Summary for API ────────────────────────────────────────────────────
export function getGrayAreaSummary(report: GrayAreaReport) {
  const active = report.analyses.filter(a => a.score > 30).sort((a, b) => b.score - a.score).slice(0, 5);
  const criticalAlerts = report.analyses.filter(a => a.severity === "critical");
  const hopeResponses = report.analyses.filter(a => a.hopeResponse && a.score > 50).map(a => a.hopeResponse!);
  return {
    dominantSignal: report.dominantSignal,
    overallRisk: report.overallRisk,
    recommendedTone: report.recommendedTone,
    hopeMode: report.hopeMode,
    activeSignals: active.map(a => ({ feature: a.feature, score: a.score, label: a.label, severity: a.severity })),
    criticalCount: criticalAlerts.length,
    topHopeResponse: hopeResponses[0] || null,
    allHopeResponses: hopeResponses,
  };
}
