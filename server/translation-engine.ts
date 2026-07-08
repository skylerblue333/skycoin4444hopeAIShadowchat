import { invokeLLM } from "./_core/llm";
import { db } from "./db";
import { sql } from "drizzle-orm";

export interface TranslationRequest {
  text: string;
  sourceLang?: string;
  targetLang: string;
  context?: string;
}

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  confidence: number;
  timestamp: Date;
}

const LANGUAGE_CODES: Record<string, string> = {
  en: "English",
  zh: "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  ar: "Arabic",
  pt: "Portuguese",
  hi: "Hindi",
  it: "Italian",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  fil: "Filipino",
};

/**
 * Detect language using LLM
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a language detection expert. Respond with ONLY the language code (e.g., 'en', 'zh', 'es'). No explanation.",
        },
        {
          role: "user",
          content: `Detect the language of this text and respond with only the language code:\n\n"${text}"`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const detected = (typeof content === "string" ? content : "").trim().toLowerCase() || "en";
    return Object.keys(LANGUAGE_CODES).includes(detected) ? detected : "en";
  } catch (error) {
        return "en";
  }
}

/**
 * Translate text using LLM
 */
export async function translateText(request: TranslationRequest): Promise<TranslationResult> {
  const { text, targetLang, context } = request;

  try {
    // Auto-detect source language if not provided
    let sourceLang = request.sourceLang;
    if (!sourceLang) {
      sourceLang = await detectLanguage(text);
    }

    if (sourceLang === targetLang) {
      return {
        original: text,
        translated: text,
        sourceLang,
        targetLang,
        confidence: 1.0,
        timestamp: new Date(),
      };
    }

    const sourceLanguageName = LANGUAGE_CODES[sourceLang] || sourceLang;
    const targetLanguageName = LANGUAGE_CODES[targetLang] || targetLang;

    const systemPrompt = `You are a professional translator. Translate the following text from ${sourceLanguageName} to ${targetLanguageName}.
${context ? `Context: ${context}` : ""}
Maintain tone, style, and meaning. Respond with ONLY the translated text, no explanations.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const translated = (typeof content === "string" ? content : "").trim() || text;

    return {
      original: text,
      translated,
      sourceLang,
      targetLang,
      confidence: 0.95, // LLM-based confidence
      timestamp: new Date(),
    };
  } catch (error) {
        // Fallback: return original text
    return {
      original: text,
      translated: text,
      sourceLang: request.sourceLang || "unknown",
      targetLang,
      confidence: 0,
      timestamp: new Date(),
    };
  }
}

/**
 * Batch translate multiple texts
 */
export async function batchTranslate(
  texts: string[],
  targetLang: string,
  context?: string
): Promise<TranslationResult[]> {
  return Promise.all(
    texts.map(text => translateText({ text, targetLang, context }))
  );
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): Record<string, string> {
  return LANGUAGE_CODES;
}

/**
 * Create a bilingual message (original + translation)
 */
export async function createBilingualMessage(
  text: string,
  primaryLang: string,
  secondaryLang: string
): Promise<{ primary: string; secondary: string; primaryLang: string; secondaryLang: string }> {
  const translation = await translateText({
    text,
    sourceLang: primaryLang,
    targetLang: secondaryLang,
  });

  return {
    primary: text,
    secondary: translation.translated,
    primaryLang,
    secondaryLang,
  };
}

/**
 * Language proficiency levels
 */
export const PROFICIENCY_LEVELS = {
  BEGINNER: "A1",
  ELEMENTARY: "A2",
  INTERMEDIATE: "B1",
  UPPER_INTERMEDIATE: "B2",
  ADVANCED: "C1",
  MASTERY: "C2",
};

/**
 * Calculate language proficiency score (0-100)
 */
export function calculateProficiencyScore(level: string): number {
  const scores: Record<string, number> = {
    A1: 10,
    A2: 25,
    B1: 40,
    B2: 60,
    C1: 80,
    C2: 100,
  };
  return scores[level] || 0;
}

/**
 * Get next proficiency level
 */
export function getNextProficiencyLevel(currentLevel: string): string {
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : "C2";
}
