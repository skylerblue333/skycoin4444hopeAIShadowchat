import crypto from 'crypto';
import { invokeLLM } from './_core/llm';

/**
 * Advanced Dating Matching Algorithm
 * Uses AI to find compatible matches based on profiles, interests, and preferences
 */

interface UserProfile {
  id: string;
  displayName: string;
  age: number;
  gender: string;
  interestedIn: string[];
  location: string;
  interests: string[];
  bio: string;
}

interface MatchScore {
  userId: string;
  score: number;
  reasons: string[];
  compatibility: {
    interests: number;
    location: number;
    age: number;
    values: number;
    overall: number;
  };
}

export class DatingMatcher {
  /**
   * Calculate match compatibility score using AI
   */
  async calculateMatchScore(
    userProfile: UserProfile,
    candidateProfile: UserProfile,
    distance: number
  ): Promise<MatchScore> {
    // Basic compatibility checks
    const interestOverlap = this.calculateInterestOverlap(
      userProfile.interests,
      candidateProfile.interests
    );
    const ageCompatibility = this.calculateAgeCompatibility(
      userProfile.age,
      candidateProfile.age
    );
    const locationScore = this.calculateLocationScore(distance);

    // Use AI to analyze deeper compatibility
    const aiAnalysis = await this.getAICompatibilityAnalysis(
      userProfile,
      candidateProfile
    );

    const overallScore =
      interestOverlap * 0.3 +
      ageCompatibility * 0.2 +
      locationScore * 0.2 +
      aiAnalysis.valueAlignment * 0.3;

    return {
      userId: candidateProfile.id,
      score: Math.round(overallScore * 100),
      reasons: [
        `${interestOverlap * 100 | 0}% interest overlap`,
        `${ageCompatibility * 100 | 0}% age compatibility`,
        `${locationScore * 100 | 0}% location match`,
        ...aiAnalysis.reasons,
      ],
      compatibility: {
        interests: interestOverlap * 100,
        location: locationScore * 100,
        age: ageCompatibility * 100,
        values: aiAnalysis.valueAlignment * 100,
        overall: overallScore * 100,
      },
    };
  }

  /**
   * Get AI-powered compatibility analysis
   */
  private async getAICompatibilityAnalysis(
    user1: UserProfile,
    user2: UserProfile
  ): Promise<{ valueAlignment: number; reasons: string[] }> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a dating compatibility expert. Analyze two user profiles and provide a compatibility score (0-1) and key reasons. Return JSON: { "valueAlignment": 0-1, "reasons": ["reason1", "reason2"] }`,
          },
          {
            role: 'user',
            content: `User 1: ${JSON.stringify(user1)}\n\nUser 2: ${JSON.stringify(user2)}\n\nProvide compatibility analysis as JSON.`,
          },
        ],
      });

      const contentRaw = response.choices[0]?.message?.content;
      const content = typeof contentRaw === 'string' ? contentRaw : '{}';
      const analysis = JSON.parse(content);
      return {
        valueAlignment: analysis.valueAlignment || 0.5,
        reasons: analysis.reasons || [],
      };
    } catch (error) {
            return { valueAlignment: 0.5, reasons: ['AI analysis unavailable'] };
    }
  }

  /**
   * Calculate interest overlap percentage
   */
  private calculateInterestOverlap(interests1: string[], interests2: string[]): number {
    if (interests1.length === 0 || interests2.length === 0) return 0.5;

    const set1 = new Set(interests1.map((i) => i.toLowerCase()));
    const set2 = new Set(interests2.map((i) => i.toLowerCase()));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate age compatibility
   */
  private calculateAgeCompatibility(age1: number, age2: number): number {
    const ageDiff = Math.abs(age1 - age2);

    if (ageDiff <= 2) return 1.0;
    if (ageDiff <= 5) return 0.8;
    if (ageDiff <= 10) return 0.6;
    if (ageDiff <= 15) return 0.4;
    return 0.2;
  }

  /**
   * Calculate location compatibility based on distance
   */
  private calculateLocationScore(distanceKm: number): number {
    if (distanceKm <= 5) return 1.0;
    if (distanceKm <= 10) return 0.9;
    if (distanceKm <= 25) return 0.7;
    if (distanceKm <= 50) return 0.5;
    if (distanceKm <= 100) return 0.3;
    return 0.1;
  }

  /**
   * Find top matches for a user
   */
  async findTopMatches(
    userProfile: UserProfile,
    candidates: UserProfile[],
    preferences: any,
    limit: number = 10
  ): Promise<MatchScore[]> {
    const scores: MatchScore[] = [];

    for (const candidate of candidates) {
      // Skip if gender preference doesn't match
      if (!userProfile.interestedIn.includes(candidate.gender)) {
        continue;
      }

      // Skip if already matched or blocked
      // (This would be checked in the actual implementation)

      // Calculate distance (simplified - would use actual geolocation)
      const distance = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 50;

      // Check preference constraints
      if (candidate.age < preferences.minAge || candidate.age > preferences.maxAge) {
        continue;
      }
      if (distance > preferences.maxDistance) {
        continue;
      }

      const score = await this.calculateMatchScore(userProfile, candidate, distance);
      scores.push(score);
    }

    // Sort by score and return top matches
    return scores.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Get recommended matches for discovery
   */
  async getRecommendedMatches(
    userProfile: UserProfile,
    candidates: UserProfile[],
    preferences: any,
    limit: number = 10
  ): Promise<MatchScore[]> {
    return this.findTopMatches(userProfile, candidates, preferences, limit);
  }

  /**
   * Calculate mutual compatibility
   */
  async calculateMutualCompatibility(
    user1: UserProfile,
    user2: UserProfile,
    prefs1: any,
    prefs2: any
  ): Promise<{ score: number; isMutual: boolean }> {
    const score1 = await this.calculateMatchScore(user1, user2, 0);
    const score2 = await this.calculateMatchScore(user2, user1, 0);

    const avgScore = (score1.score + score2.score) / 2;
    const isMutual = score1.score > 70 && score2.score > 70;

    return {
      score: avgScore,
      isMutual,
    };
  }
}

export const datingMatcher = new DatingMatcher();

export default datingMatcher;
