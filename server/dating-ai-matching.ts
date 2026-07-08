import { db } from './db';
import { datingProfiles, datingMatches, datingLikes, users } from '../drizzle/schema';
import { eq, and, ne, not, inArray, or as drizzleOr, gte, lte } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';

export interface MatchingProfile {
  id: number;
  userId: number;
  age: number | null;
  gender: string | null;
  lookingFor: string | null;
  bio: string | null;
  interests: string[];
  height: string | null;
  bodyType: string | null;
  ethnicity: string | null;
  religion: string | null;
  education: string | null;
  occupation: string | null;
  relationshipGoal: string | null;
}

export interface CompatibilityScore {
  userId: number;
  score: number;
  reasons: string[];
  matchType: 'perfect' | 'great' | 'good' | 'fair';
}

/**
 * Calculate compatibility between two profiles using AI
 */
export async function calculateCompatibility(
  profile1: MatchingProfile,
  profile2: MatchingProfile
): Promise<CompatibilityScore> {
  try {
    const prompt = `
You are a dating compatibility expert. Analyze these two dating profiles and calculate their compatibility score.

Profile 1:
- Age: ${profile1.age}
- Gender: ${profile1.gender}
- Looking for: ${profile1.lookingFor}
- Bio: ${profile1.bio || 'Not provided'}
- Interests: ${profile1.interests?.join(', ') || 'Not specified'}
- Height: ${profile1.height || 'Not specified'}
- Body Type: ${profile1.bodyType || 'Not specified'}
- Ethnicity: ${profile1.ethnicity || 'Not specified'}
- Religion: ${profile1.religion || 'Not specified'}
- Education: ${profile1.education || 'Not specified'}
- Occupation: ${profile1.occupation || 'Not specified'}
- Relationship Goal: ${profile1.relationshipGoal || 'Not specified'}

Profile 2:
- Age: ${profile2.age}
- Gender: ${profile2.gender}
- Looking for: ${profile2.lookingFor}
- Bio: ${profile2.bio || 'Not provided'}
- Interests: ${profile2.interests?.join(', ') || 'Not specified'}
- Height: ${profile2.height || 'Not specified'}
- Body Type: ${profile2.bodyType || 'Not specified'}
- Ethnicity: ${profile2.ethnicity || 'Not specified'}
- Religion: ${profile2.religion || 'Not specified'}
- Education: ${profile2.education || 'Not specified'}
- Occupation: ${profile2.occupation || 'Not specified'}
- Relationship Goal: ${profile2.relationshipGoal || 'Not specified'}

Provide a JSON response with:
{
  "score": <0-100>,
  "matchType": "perfect" | "great" | "good" | "fair",
  "reasons": [
    "reason 1",
    "reason 2",
    ...
  ]
}

Consider:
1. Gender and looking for compatibility
2. Age compatibility
3. Shared interests
4. Relationship goal alignment
5. Lifestyle compatibility
6. Values alignment
7. Physical attraction indicators
8. Life stage compatibility
`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a dating compatibility expert. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return {
        userId: profile2.userId,
        score: 50,
        reasons: ['Invalid response format'],
        matchType: 'fair',
      };
    }
    const result = JSON.parse(content);

    return {
      userId: profile2.userId,
      score: Math.min(100, Math.max(0, result.score || 0)),
      reasons: result.reasons || [],
      matchType: result.matchType || 'fair',
    };
  } catch (error) {
        return {
      userId: profile2.userId,
      score: 50,
      reasons: ['Error calculating compatibility'],
      matchType: 'fair',
    };
  }
}

/**
 * Get recommended matches for a user
 */
export async function getRecommendedMatches(
  userId: number,
  limit: number = 10
): Promise<CompatibilityScore[]> {
  try {
    // Get user's profile
    const userProfiles = await db
      .select()
      .from(datingProfiles)
      .where(eq(datingProfiles.userId, userId));

    const userProfile = userProfiles[0];

    if (!userProfile) {
      return [];
    }

    // Get user's preferences
    const userPrefs = userProfile.lookingFor ? [userProfile.lookingFor] : [];
    const userAge = userProfile.age || 30;
    const userGender = userProfile.gender;

    // Get profiles that match user's preferences
    const conditions: any[] = [
      ne(datingProfiles.userId, userId),
      eq(datingProfiles.isActive, true),
    ];

    // Gender matching
    if (userPrefs.length > 0) {
      conditions.push(inArray(datingProfiles.gender as any, userPrefs as any));
    }

    // Age range (within 5-15 years)
    if (userProfile.age) {
      const minAge = Math.max(18, userProfile.age - 15);
      const maxAge = userProfile.age + 15;
      conditions.push(gte(datingProfiles.age, minAge));
      conditions.push(lte(datingProfiles.age, maxAge));
    }

    const potentialMatches = await db
      .select()
      .from(datingProfiles)
      .where(and(...conditions))
      .limit(limit * 2); // Get more to filter

    // Get already liked/matched users
    const likedUsers = await db
      .select()
      .from(datingLikes)
      .where(eq(datingLikes.userId, userId));

    const likedUserIds = new Set(likedUsers.map((l) => l.likedUserId));

    // Get existing matches
    const matches = await db
      .select()
      .from(datingMatches)
      .where(
        drizzleOr(
          eq(datingMatches.user1Id, userId),
          eq(datingMatches.user2Id, userId)
        )
      );

    const matchedUserIds = new Set(
      matches.flatMap((m) => [m.user1Id, m.user2Id]).filter((id) => id !== userId)
    );

    // Filter out already liked/matched users
    const candidates = potentialMatches.filter(
      (p) => !likedUserIds.has(p.userId) && !matchedUserIds.has(p.userId)
    );

    // Calculate compatibility for each candidate
    const compatibilityScores = await Promise.all(
      candidates.slice(0, limit).map((candidate) =>
        calculateCompatibility(
          {
            id: userProfile.id,
            userId: userProfile.userId,
            age: userProfile.age,
            gender: userProfile.gender,
            lookingFor: userProfile.lookingFor,
            bio: userProfile.bio,
            interests: (userProfile.interests as string[]) || [],
            height: userProfile.height,
            bodyType: userProfile.bodyType,
            ethnicity: userProfile.ethnicity,
            religion: userProfile.religion,
            education: userProfile.education,
            occupation: userProfile.occupation,
            relationshipGoal: userProfile.relationshipGoal,
          },
          {
            id: candidate.id,
            userId: candidate.userId,
            age: candidate.age,
            gender: candidate.gender,
            lookingFor: candidate.lookingFor,
            bio: candidate.bio,
            interests: (candidate.interests as string[]) || [],
            height: candidate.height,
            bodyType: candidate.bodyType,
            ethnicity: candidate.ethnicity,
            religion: candidate.religion,
            education: candidate.education,
            occupation: candidate.occupation,
            relationshipGoal: candidate.relationshipGoal,
          }
        )
      )
    );

    // Sort by compatibility score (descending)
    return compatibilityScores.sort((a, b) => b.score - a.score);
  } catch (error) {
        return [];
  }
}

/**
 * Analyze user profile for improvement suggestions
 */
export async function analyzeProfileForImprovements(userId: number): Promise<string[]> {
  try {
    const [profile] = await db
      .select()
      .from(datingProfiles)
      .where(eq(datingProfiles.userId, userId));

    if (!profile) {
      return [];
    }

    const prompt = `
Analyze this dating profile and suggest improvements:

Bio: ${profile.bio || 'Empty'}
Interests: ${(profile.interests as string[])?.join(', ') || 'Not specified'}
Photos: ${profile.photos ? 'Has photos' : 'No photos'}
Height: ${profile.height || 'Not specified'}
Body Type: ${profile.bodyType || 'Not specified'}
Education: ${profile.education || 'Not specified'}
Occupation: ${profile.occupation || 'Not specified'}

Provide 3-5 specific, actionable suggestions to improve the profile and increase match rate.
Respond with a JSON array of strings.
`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a dating profile expert. Respond only with a valid JSON array of strings.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '[]';
    const suggestions = JSON.parse(content);

    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
        return [];
  }
}

/**
 * Get conversation starters based on profiles
 */
export async function generateConversationStarters(
  userId: number,
  matchUserId: number
): Promise<string[]> {
  try {
    const [userProfile] = await db
      .select()
      .from(datingProfiles)
      .where(eq(datingProfiles.userId, userId));

    const [matchProfile] = await db
      .select()
      .from(datingProfiles)
      .where(eq(datingProfiles.userId, matchUserId));

    if (!userProfile || !matchProfile) {
      return [];
    }

    const prompt = `
Generate 5 creative and engaging conversation starters for a dating match based on these profiles:

Your Profile:
- Bio: ${userProfile.bio || 'Not provided'}
- Interests: ${(userProfile.interests as string[])?.join(', ') || 'Not specified'}
- Occupation: ${userProfile.occupation || 'Not specified'}

Match Profile:
- Bio: ${matchProfile.bio || 'Not provided'}
- Interests: ${(matchProfile.interests as string[])?.join(', ') || 'Not specified'}
- Occupation: ${matchProfile.occupation || 'Not specified'}

Create conversation starters that:
1. Reference shared interests
2. Ask genuine questions
3. Show personality
4. Are respectful and appropriate
5. Encourage response

Respond with a JSON array of 5 strings.
`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a dating conversation expert. Respond only with a valid JSON array of strings.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '[]';
    const starters = JSON.parse(content);

    return Array.isArray(starters) ? starters : [];
  } catch (error) {
        return [];
  }
}



export default {
  calculateCompatibility,
  getRecommendedMatches,
  analyzeProfileForImprovements,
  generateConversationStarters,
};
