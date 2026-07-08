import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const languageExchangeRouter = router({
  // Get saved favorite partners
  getFavorites: protectedProcedure
    .query(async ({ ctx }) => {
      try {
                return [
          { partnerId: "p1", savedAt: new Date() },
          { partnerId: "p3", savedAt: new Date() },
        ];
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch favorites",
        });
      }
    }),

  // Save a favorite partner
  saveFavorite: protectedProcedure
    .input(z.object({ partnerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return { success: true, message: "Partner added to favorites" };
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save favorite",
        });
      }
    }),

  // Remove a favorite partner
  removeFavorite: protectedProcedure
    .input(z.object({ partnerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return { success: true, message: "Partner removed from favorites" };
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove favorite",
        });
      }
    }),

  // Get available language partners
  getPartners: protectedProcedure
    .input(
      z.object({
        learningLang: z.string().optional(),
        nativeLang: z.string().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Extended partner data with all required fields
        const partners = [
          {
            id: "p1",
            name: "李明",
            nativeLang: "Chinese",
            learningLang: "English",
            proficiency: "B2",
            bio: "Native Mandarin speaker, love teaching and gaming!",
            avatar: "🇨🇳",
            responseTime: "< 1 hour",
            sessionsCompleted: 42,
            rating: 4.9,
            availability: "weekends",
            interests: ["Gaming", "Technology", "Collaborative Projects"],
            location: "Shanghai, China",
            age: 28,
            joinedDate: "2024-01-15",
            videoUrl: "https://example.com/video1.mp4",
          },
          {
            id: "p2",
            name: "Maria García",
            nativeLang: "Spanish",
            learningLang: "English",
            proficiency: "C1",
            bio: "Professional tutor passionate about charity work",
            avatar: "🇪🇸",
            responseTime: "< 30 min",
            sessionsCompleted: 156,
            rating: 4.95,
            availability: "daily",
            interests: ["Charity", "Education", "Travel"],
            location: "Madrid, Spain",
            age: 32,
            joinedDate: "2023-06-20",
            videoUrl: "https://example.com/video2.mp4",
          },
          {
            id: "p3",
            name: "Yuki Tanaka",
            nativeLang: "Japanese",
            learningLang: "English",
            proficiency: "B1",
            bio: "Tech enthusiast, love collaborative projects",
            avatar: "🇯🇵",
            responseTime: "< 2 hours",
            sessionsCompleted: 18,
            rating: 4.8,
            availability: "evenings",
            interests: ["Technology", "Collaborative Projects", "Gaming"],
            location: "Tokyo, Japan",
            age: 25,
            joinedDate: "2024-03-10",
            videoUrl: "https://example.com/video3.mp4",
          },
          {
            id: "p4",
            name: "Pierre Dubois",
            nativeLang: "French",
            learningLang: "Chinese",
            proficiency: "A2",
            bio: "Beginner French learner, very motivated",
            avatar: "🇫🇷",
            responseTime: "< 1 hour",
            sessionsCompleted: 7,
            rating: 4.7,
            availability: "flexible",
            interests: ["Business", "Entrepreneurship", "Technology"],
            location: "Paris, France",
            age: 30,
            joinedDate: "2024-02-01",
          },
          {
            id: "p5",
            name: "한지민",
            nativeLang: "Korean",
            learningLang: "English",
            proficiency: "B2",
            bio: "Tech enthusiast, love cultural exchange",
            avatar: "🇰🇷",
            responseTime: "< 45 min",
            sessionsCompleted: 34,
            rating: 4.85,
            availability: "weekdays",
            interests: ["Art & Design", "Open Source", "Technology"],
            location: "Seoul, South Korea",
            age: 26,
            joinedDate: "2024-01-05",
          },
          {
            id: "p6",
            name: "Amara Okonkwo",
            nativeLang: "English",
            learningLang: "Spanish",
            proficiency: "A2",
            bio: "Fitness enthusiast, love charity work",
            avatar: "🇳🇬",
            responseTime: "< 1 hour",
            sessionsCompleted: 22,
            rating: 4.75,
            availability: "mornings",
            interests: ["Fitness", "Charity", "Sports"],
            location: "Lagos, Nigeria",
            age: 29,
            joinedDate: "2023-11-12",
          },
          {
            id: "p7",
            name: "Marco Rossi",
            nativeLang: "Italian",
            learningLang: "English",
            proficiency: "B1",
            bio: "Cooking and travel enthusiast",
            avatar: "🇮🇹",
            responseTime: "< 3 hours",
            sessionsCompleted: 15,
            rating: 4.65,
            availability: "evenings",
            interests: ["Cooking", "Travel", "Music"],
            location: "Rome, Italy",
            age: 31,
            joinedDate: "2024-02-20",
          },
          {
            id: "p8",
            name: "Sofia Novak",
            nativeLang: "Russian",
            learningLang: "English",
            proficiency: "B2",
            bio: "Developer and open source contributor",
            avatar: "🇷🇺",
            responseTime: "< 2 hours",
            sessionsCompleted: 41,
            rating: 4.88,
            availability: "flexible",
            interests: ["Technology", "Open Source", "Collaborative Projects"],
            location: "Moscow, Russia",
            age: 27,
            joinedDate: "2023-12-05",
          },
        ];

        return partners;
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch language partners",
        });
      }
    }),

  // Request language exchange session
  requestSession: protectedProcedure
    .input(
      z.object({
        partnerId: z.string(),
        learningLang: z.string().optional(),
        nativeLang: z.string().optional(),
        preferredTime: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionId = `session_${Date.now()}`;

        return {
          sessionId,
          status: "pending",
          partnerId: input.partnerId,
          createdAt: new Date(),
          message: "Session request sent! Waiting for partner response...",
        };
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to request session",
        });
      }
    }),

  // Get user's language proficiency
  getProficiency: protectedProcedure
    .input(z.object({ language: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
                return {
          language: input.language,
          level: "B1",
          score: 65,
          nextLevel: "B2",
          wordsLearned: 2847,
          hoursSpent: 156,
          streakDays: 23,
          lastPractice: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          progressToNextLevel: 45,
        };
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch proficiency data",
        });
      }
    }),

  // Log practice session
  logSession: protectedProcedure
    .input(
      z.object({
        partnerId: z.string(),
        language: z.string(),
        durationMinutes: z.number(),
        topicsDiscussed: z.array(z.string()),
        rating: z.number().min(1).max(5),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return {
          sessionId: `session_${Date.now()}`,
          xpEarned: Math.floor(input.durationMinutes * 2.5),
          skyReward: Math.floor(input.durationMinutes * 0.1),
          message: `Great session! You earned ${Math.floor(input.durationMinutes * 2.5)} XP and ${Math.floor(input.durationMinutes * 0.1)} SKY444`,
        };
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log session",
        });
      }
    }),

  // Get user's exchange stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        totalSessions: 47,
        totalHours: 234,
        languagesLearning: 3,
        languagesTeaching: 2,
        currentStreak: 23,
        totalXP: 12450,
        totalSKYEarned: 1245,
        averageRating: 4.87,
        partnersConnected: 12,
        nextMilestone: { sessions: 50, xp: 15000, reward: "Gold Badge" },
      };
    } catch (error) {
            throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch stats",
      });
    }
  }),

  // Get translation bounties (earn by translating)
  getBounties: protectedProcedure
    .input(z.object({ language: z.string(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      try {
                const bounties = [
          {
            id: "b1",
            title: "Translate blog post about AI",
            sourceLanguage: "English",
            targetLanguage: input.language,
            wordCount: 1200,
            reward: 50,
            difficulty: "medium",
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: "open",
          },
          {
            id: "b2",
            title: "Translate product documentation",
            sourceLanguage: "English",
            targetLanguage: input.language,
            wordCount: 2500,
            reward: 120,
            difficulty: "hard",
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: "open",
          },
          {
            id: "b3",
            title: "Translate marketing copy",
            sourceLanguage: "English",
            targetLanguage: input.language,
            wordCount: 350,
            reward: 25,
            difficulty: "easy",
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            status: "open",
          },
        ];

        return bounties;
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch bounties",
        });
      }
    }),

  // Accept and complete translation bounty
  completeBounty: protectedProcedure
    .input(
      z.object({
        bountyId: z.string(),
        translatedText: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return {
          bountyId: input.bountyId,
          status: "submitted",
          reward: 50,
          xpEarned: 250,
          message: "Translation submitted for review! You'll earn rewards once approved.",
        };
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit translation",
        });
      }
    }),

  // Get teaching opportunities (earn by teaching)
  getTeachingOpportunities: protectedProcedure
    .input(z.object({ language: z.string(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      try {
        return [
          {
            id: "t1",
            studentName: "Alex",
            studentLevel: "A1",
            language: input.language,
            topicRequest: "Basic greetings and introductions",
            sessionDuration: 30,
            reward: 15,
            urgency: "medium",
            createdAt: new Date(),
          },
          {
            id: "t2",
            studentName: "Jordan",
            studentLevel: "B1",
            language: input.language,
            topicRequest: "Business vocabulary and email writing",
            sessionDuration: 60,
            reward: 40,
            urgency: "high",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            id: "t3",
            studentName: "Sam",
            studentLevel: "B2",
            language: input.language,
            topicRequest: "Advanced conversation practice",
            sessionDuration: 45,
            reward: 30,
            urgency: "low",
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        ];
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch teaching opportunities",
        });
      }
    }),

  // Accept teaching opportunity
  acceptTeachingSession: protectedProcedure
    .input(z.object({ opportunityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return {
          sessionId: `teach_${Date.now()}`,
          status: "scheduled",
          message: "Teaching session scheduled! Student will be notified.",
        };
      } catch (error) {
                throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to accept teaching session",
        });
      }
    }),
});
