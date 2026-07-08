import { getDb } from "./db";
import {
  languagePartners,
  languagePartnerFavorites,
  practiceSessions,
  progressTracking,
  translationBounties,
  teacherProfiles,
  teacherReviews,
  teacherBookings,
  translationCache,
  languageExchangeStats,
} from "../drizzle";
import { eq, and, desc, like, gte, lte } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// LANGUAGE PARTNERS
// ═══════════════════════════════════════════════════════════════

export async function getLanguagePartners(filters?: {
  language?: string;
  minRating?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  if (!db) throw new Error("Database connection failed");
  let query = db.select().from(languagePartners) as any;

  if (filters?.language) {
    query = query.where(like(languagePartners.learningLanguages, `%${filters.language}%`));
  }

  query = query.orderBy(desc(languagePartners.rating));

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  return await query;
}

export async function getLanguagePartner(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(languagePartners)
    .where(eq(languagePartners.userId, userId))
    .then((rows: any[]) => rows[0]);
}

export async function createLanguagePartner(data: {
  userId: number;
  nativeLanguage: string;
  learningLanguages: string[];
  proficiencyLevel: string;
  bio?: string;
  interests?: string[];
  availability?: string;
  timezone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.insert(languagePartners).values({
    userId: data.userId,
    nativeLanguage: data.nativeLanguage,
    learningLanguages: JSON.stringify(data.learningLanguages),
    proficiencyLevel: data.proficiencyLevel as any,
    bio: data.bio,
    interests: data.interests ? JSON.stringify(data.interests) : null,
    availability: data.availability,
    timezone: data.timezone,
  });
}

export async function updateLanguagePartner(
  userId: number,
  data: Partial<typeof languagePartners.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .update(languagePartners)
    .set(data)
    .where(eq(languagePartners.userId, userId));
}

// ═══════════════════════════════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════════════════════════════

export async function getFavoritePartners(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select({ partner: languagePartners })
    .from(languagePartnerFavorites)
    .innerJoin(
      languagePartners,
      eq(languagePartnerFavorites.partnerId, languagePartners.id)
    )
    .where(eq(languagePartnerFavorites.userId, userId));
}

export async function saveFavoritePartner(userId: number, partnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.insert(languagePartnerFavorites).values({
    userId,
    partnerId,
  });
}

export async function removeFavoritePartner(userId: number, partnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .delete(languagePartnerFavorites)
    .where(
      and(
        eq(languagePartnerFavorites.userId, userId),
        eq(languagePartnerFavorites.partnerId, partnerId)
      )
    );
}

// ═══════════════════════════════════════════════════════════════
// PRACTICE SESSIONS
// ═══════════════════════════════════════════════════════════════

export async function createPracticeSession(data: {
  studentId: number;
  teacherId: number;
  sourceLanguage: string;
  targetLanguage: string;
  topic?: string;
  notes?: string;
  scheduledAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.insert(practiceSessions).values({
    studentId: data.studentId,
    teacherId: data.teacherId,
    sourceLanguage: data.sourceLanguage,
    targetLanguage: data.targetLanguage,
    topic: data.topic,
    notes: data.notes,
    scheduledAt: data.scheduledAt,
    status: "scheduled",
  });
}

export async function getPracticeSessions(userId: number, type: "student" | "teacher" = "student") {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const condition =
    type === "student"
      ? eq(practiceSessions.studentId, userId)
      : eq(practiceSessions.teacherId, userId);

  return await db
    .select()
    .from(practiceSessions)
    .where(condition)
    .orderBy(desc(practiceSessions.scheduledAt));
}

export async function completePracticeSession(
  sessionId: number,
  data: {
    endedAt: Date;
    duration: number;
    rating?: number;
    feedback?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .update(practiceSessions)
    .set({
      status: "completed",
      endedAt: data.endedAt,
      duration: data.duration,
      rating: data.rating,
      feedback: data.feedback,
    })
    .where(eq(practiceSessions.id, sessionId));
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS TRACKING
// ═══════════════════════════════════════════════════════════════

export async function getProgress(userId: number, language: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(progressTracking)
    .where(and(eq(progressTracking.userId, userId), eq(progressTracking.language, language)))
    .then((rows: any[]) => rows[0]);
}

export async function updateProgress(
  userId: number,
  language: string,
  data: Partial<typeof progressTracking.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const existing = await getProgress(userId, language);

  if (existing) {
    return await db
      .update(progressTracking)
      .set(data)
      .where(
        and(eq(progressTracking.userId, userId), eq(progressTracking.language, language))
      );
  } else {
    return await db.insert(progressTracking).values({
      userId,
      language,
      ...data,
    } as any);
  }
}

// ═══════════════════════════════════════════════════════════════
// TRANSLATION BOUNTIES
// ═══════════════════════════════════════════════════════════════

export async function getBounties(filters?: {
  difficulty?: string;
  language?: string;
  status?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  let query = db.select().from(translationBounties) as any;

  if (filters?.status) {
    query = query.where(eq(translationBounties.status, filters.status as any));
  }

  if (filters?.difficulty) {
    query = query.where(eq(translationBounties.difficulty, filters.difficulty as any));
  }

  query = query.orderBy(desc(translationBounties.reward));

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  return await query;
}

export async function createBounty(data: {
  createdBy: number;
  sourceLanguage: string;
  targetLanguage: string;
  content: string;
  difficulty: "easy" | "medium" | "hard";
  reward: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.insert(translationBounties).values({
    createdBy: data.createdBy,
    sourceLanguage: data.sourceLanguage,
    targetLanguage: data.targetLanguage,
    content: data.content,
    difficulty: data.difficulty,
    reward: data.reward,
    status: "open",
  });
}

export async function completeBounty(
  bountyId: number,
  completedBy: number,
  translation: string,
  qualityScore: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .update(translationBounties)
    .set({
      status: "completed",
      completedBy,
      completedAt: new Date(),
      translation,
      qualityScore: qualityScore as any,
    })
    .where(eq(translationBounties.id, bountyId));
}

// ═══════════════════════════════════════════════════════════════
// TEACHER PROFILES
// ═══════════════════════════════════════════════════════════════

export async function getTeacherProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(teacherProfiles)
    .where(eq(teacherProfiles.userId, userId))
    .then((rows: any[]) => rows[0]);
}

export async function createTeacherProfile(data: {
  userId: number;
  language: string;
  proficiency: "native" | "fluent" | "advanced" | "intermediate";
  hourlyRate: number;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  availability?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.insert(teacherProfiles).values({
    userId: data.userId,
    language: data.language,
    proficiency: data.proficiency,
    hourlyRate: data.hourlyRate,
    bio: data.bio,
    specialties: data.specialties ? JSON.stringify(data.specialties) : null,
    certifications: data.certifications ? JSON.stringify(data.certifications) : null,
    availability: data.availability,
  });
}

export async function getTeachers(filters?: {
  language?: string;
  minRating?: number;
  maxRate?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  let query = db.select().from(teacherProfiles) as any;

  if (filters?.language) {
    query = query.where(eq(teacherProfiles.language, filters.language));
  }

  if (filters?.maxRate) {
    query = query.where(lte(teacherProfiles.hourlyRate, filters.maxRate));
  }

  query = query.orderBy(desc(teacherProfiles.rating));

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  return await query;
}

// ═══════════════════════════════════════════════════════════════
// TEACHER BOOKINGS
// ═══════════════════════════════════════════════════════════════

export async function createTeacherBooking(data: {
  studentId: number;
  teacherId: number;
  startTime: Date;
  duration: number;
  topic?: string;
  notes?: string;
  amount: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.insert(teacherBookings).values({
    studentId: data.studentId,
    teacherId: data.teacherId,
    startTime: data.startTime,
    duration: data.duration,
    topic: data.topic,
    notes: data.notes,
    amount: data.amount,
    status: "pending",
    paymentStatus: "pending",
  });
}

export async function getTeacherBookings(userId: number, type: "student" | "teacher" = "student") {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const condition =
    type === "student"
      ? eq(teacherBookings.studentId, userId)
      : eq(teacherBookings.teacherId, userId);

  return await db
    .select()
    .from(teacherBookings)
    .where(condition)
    .orderBy(desc(teacherBookings.startTime));
}

export async function updateTeacherBooking(
  bookingId: number,
  data: Partial<typeof teacherBookings.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .update(teacherBookings)
    .set(data)
    .where(eq(teacherBookings.id, bookingId));
}

// ═══════════════════════════════════════════════════════════════
// TRANSLATION CACHE
// ═══════════════════════════════════════════════════════════════

export async function getTranslationFromCache(
  sourceText: string,
  sourceLanguage: string,
  targetLanguage: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(translationCache)
    .where(
      and(
        eq(translationCache.sourceText, sourceText),
        eq(translationCache.sourceLanguage, sourceLanguage),
        eq(translationCache.targetLanguage, targetLanguage)
      )
    )
    .then((rows: any[]) => rows[0]);
}

export async function cacheTranslation(data: {
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  translatedText: string;
  confidence: number;
  accuracy?: number;
  fluency?: number;
  terminology?: number;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const existing = await getTranslationFromCache(
    data.sourceText,
    data.sourceLanguage,
    data.targetLanguage
  );

  if (existing) {
    return await db
      .update(translationCache)
      .set({
        hitCount: (existing.hitCount || 0) + 1,
        lastUsedAt: new Date(),
      })
      .where(
        and(
          eq(translationCache.sourceText, data.sourceText),
          eq(translationCache.sourceLanguage, data.sourceLanguage),
          eq(translationCache.targetLanguage, data.targetLanguage)
        )
      );
  } else {
    return await db.insert(translationCache).values({
      sourceText: data.sourceText,
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage,
      translatedText: data.translatedText,
      confidence: data.confidence as any,
      accuracy: data.accuracy || 0,
      fluency: data.fluency || 0,
      terminology: data.terminology || 0,
      expiresAt: data.expiresAt,
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// TEACHER REVIEWS
// ═══════════════════════════════════════════════════════════════

export async function createTeacherReview(data: {
  teacherId: number;
  studentId: number;
  sessionId?: number;
  rating: number;
  comment?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.insert(teacherReviews).values({
    teacherId: data.teacherId,
    studentId: data.studentId,
    sessionId: data.sessionId,
    rating: data.rating,
    comment: data.comment,
  });
}

export async function getTeacherReviews(teacherId: number, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(teacherReviews)
    .where(eq(teacherReviews.teacherId, teacherId))
    .orderBy(desc(teacherReviews.createdAt))
    .limit(limit) as any;
}

// ═══════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════

export async function getLanguageExchangeStats(date?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const targetDate = date || new Date().toISOString().split("T")[0];

  return await db
    .select()
    .from(languageExchangeStats)
    .where(eq(languageExchangeStats.date, targetDate))
    .then((rows: any[]) => rows[0]);
}

export async function updateLanguageExchangeStats(
  date: string,
  data: Partial<typeof languageExchangeStats.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const existing = await getLanguageExchangeStats(date);

  if (existing) {
    return await db
      .update(languageExchangeStats)
      .set(data)
      .where(eq(languageExchangeStats.date, date));
  } else {
    return await db.insert(languageExchangeStats).values({
      date,
      ...data,
    } as any);
  }
}
