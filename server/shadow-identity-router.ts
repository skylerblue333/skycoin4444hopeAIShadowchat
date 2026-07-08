import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { users } from "../drizzle";
import { eq, desc } from "drizzle-orm";
import * as dbHelpers from "./db";
import { invokeLLM } from "./_core/llm";

// ─── Shadow Identity Utilities ────────────────────────────────────────────────

function generateShadowId(userId: number): string {
  // Deterministic shadow hash: shadow_ + base36 of userId XOR'd with a salt
  const salt = 0x4444;
  const hash = (userId * 7919 + salt) % 1000000;
  return `shadow_${hash.toString(36).toUpperCase().padStart(4, "0")}`;
}

function computeReputationTier(behavior: number, toxicity: number, contribution: number, reliability: number): string {
  const composite = (behavior * 0.3) + (contribution * 0.3) + (reliability * 0.25) - (toxicity * 0.15);
  if (composite >= 85) return "LEGENDARY";
  if (composite >= 70) return "TRUSTED";
  if (composite >= 55) return "ESTABLISHED";
  if (composite >= 40) return "RISING";
  if (composite >= 25) return "NEW";
  return "RESTRICTED";
}

// ─── Shadow Identity Router ───────────────────────────────────────────────────

export const shadowIdentityRouter = router({

  // Get current user's shadow identity profile
  getMyIdentity: protectedProcedure.query(async ({ ctx }) => {
    const user = await dbHelpers.getUserById(ctx.user.id);
    if (!user) throw new Error("User not found");

    // Auto-generate shadowId if not set
    let shadowId = (user as any).shadowId;
    if (!shadowId) {
      shadowId = generateShadowId(ctx.user.id);
      const _db = await dbHelpers.getDb();
      if (_db) await _db.update(users)
        .set({ shadowId } as any)
        .where(eq(users.id, ctx.user.id));
    }

    const behavior = (user as any).behaviorScore ?? 50;
    const toxicity = (user as any).toxicityScore ?? 0;
    const contribution = (user as any).contributionScore ?? 0;
    const reliability = (user as any).reliabilityScore ?? 50;

    return {
      shadowId,
      identityMode: (user as any).identityMode ?? "social",
      verifiedReveal: (user as any).verifiedReveal ?? false,
      scores: {
        behavior,
        toxicity,
        contribution,
        reliability,
        composite: Math.round((behavior * 0.3) + (contribution * 0.3) + (reliability * 0.25) - (toxicity * 0.15)),
      },
      reputationTier: computeReputationTier(behavior, toxicity, contribution, reliability),
      displayName: getDisplayName(user, (user as any).identityMode ?? "social"),
      displayAvatar: getDisplayAvatar(user, (user as any).identityMode ?? "social"),
    };
  }),

  // Switch identity mode
  setIdentityMode: protectedProcedure
    .input(z.object({
      mode: z.enum(["shadow", "semi", "social", "public"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const _db = await dbHelpers.getDb();
      if (_db) await _db.update(users)
        .set({ identityMode: input.mode } as any)
        .where(eq(users.id, ctx.user.id));
      return { success: true, mode: input.mode };
    }),

  // Toggle verified reveal
  toggleVerifiedReveal: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await dbHelpers.getUserById(ctx.user.id);
    const current = (user as any)?.verifiedReveal ?? false;
    const _db = await dbHelpers.getDb();
    if (_db) await _db.update(users)
      .set({ verifiedReveal: !current } as any)
      .where(eq(users.id, ctx.user.id));
    return { verifiedReveal: !current };
  }),

  // Get public identity of any user (respects their mode)
  getPublicIdentity: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await dbHelpers.getUserById(input.userId);
      if (!user) return null;
      const mode = (user as any).identityMode ?? "social";
      return {
        shadowId: (user as any).shadowId ?? generateShadowId(input.userId),
        identityMode: mode,
        displayName: getDisplayName(user, mode),
        displayAvatar: getDisplayAvatar(user, mode),
        reputationTier: computeReputationTier(
          (user as any).behaviorScore ?? 50,
          (user as any).toxicityScore ?? 0,
          (user as any).contributionScore ?? 0,
          (user as any).reliabilityScore ?? 50,
        ),
        verifiedReveal: (user as any).verifiedReveal ?? false,
        realName: (user as any).verifiedReveal ? user.name : null,
      };
    }),

  // AI-powered reputation analysis
  getReputationAnalysis: protectedProcedure.query(async ({ ctx }) => {
    const user = await dbHelpers.getUserById(ctx.user.id);
    if (!user) throw new Error("User not found");

    const behavior = (user as any).behaviorScore ?? 50;
    const toxicity = (user as any).toxicityScore ?? 0;
    const contribution = (user as any).contributionScore ?? 0;
    const reliability = (user as any).reliabilityScore ?? 50;
    const tier = computeReputationTier(behavior, toxicity, contribution, reliability);

    // Generate AI insight about reputation
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a reputation analyst for a Web3 social platform. Provide a brief 2-sentence insight about a user's reputation profile. Be constructive and specific.",
        },
        {
          role: "user",
          content: `User reputation data: Behavior=${behavior}/100, Toxicity=${toxicity}/100, Contribution=${contribution}/100, Reliability=${reliability}/100, Tier=${tier}. Give actionable insight.`,
        },
      ],
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const insight = typeof rawContent === "string" ? rawContent : "Keep engaging positively to build your reputation.";

    return {
      tier,
      scores: { behavior, toxicity, contribution, reliability },
      insight,
      recommendations: getRecommendations(behavior, toxicity, contribution, reliability),
    };
  }),

  // Update behavior score (called by system actions)
  recordBehaviorEvent: protectedProcedure
    .input(z.object({
      event: z.enum(["post", "like", "comment", "report_received", "report_filed", "tip_sent", "tip_received", "stream", "stake"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await dbHelpers.getUserById(ctx.user.id);
      if (!user) return;

      const current = {
        behavior: (user as any).behaviorScore ?? 50,
        toxicity: (user as any).toxicityScore ?? 0,
        contribution: (user as any).contributionScore ?? 0,
        reliability: (user as any).reliabilityScore ?? 50,
      };

      const deltas: Record<string, Partial<typeof current>> = {
        post:             { contribution: 2, reliability: 1 },
        like:             { behavior: 1 },
        comment:          { contribution: 1, behavior: 1 },
        report_received:  { toxicity: 5, behavior: -3 },
        report_filed:     { reliability: 1 },
        tip_sent:         { contribution: 3, behavior: 2 },
        tip_received:     { contribution: 2 },
        stream:           { contribution: 4, reliability: 2 },
        stake:            { reliability: 3, behavior: 1 },
      };

      const delta = deltas[input.event] ?? {};
      const clamp = (v: number) => Math.max(0, Math.min(100, v));

      const _db = await dbHelpers.getDb();
      if (_db) await _db.update(users)
        .set({
          behaviorScore: clamp(current.behavior + (delta.behavior ?? 0)),
          toxicityScore: clamp(current.toxicity + (delta.toxicity ?? 0)),
          contributionScore: clamp(current.contribution + (delta.contribution ?? 0)),
          reliabilityScore: clamp(current.reliability + (delta.reliability ?? 0)),
        } as any)
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  // Leaderboard of top reputation users
  getReputationLeaderboard: publicProcedure.query(async () => {
    // Fetch top users by reputation
    const _db = await dbHelpers.getDb();
    const topUsers = _db ? await _db.select().from(users).orderBy(desc(users.reputation)).limit(20).catch(() => []) : [];
    return topUsers.map((u: any) => ({
      id: u.id,
      shadowId: u.shadowId ?? generateShadowId(u.id),
      displayName: getDisplayName(u, u.identityMode ?? "social"),
      displayAvatar: getDisplayAvatar(u, u.identityMode ?? "social"),
      reputationTier: computeReputationTier(
        u.behaviorScore ?? 50, u.toxicityScore ?? 0,
        u.contributionScore ?? 0, u.reliabilityScore ?? 50,
      ),
      composite: Math.round(
        ((u.behaviorScore ?? 50) * 0.3) +
        ((u.contributionScore ?? 0) * 0.3) +
        ((u.reliabilityScore ?? 50) * 0.25) -
        ((u.toxicityScore ?? 0) * 0.15)
      ),
    }));
  }),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDisplayName(user: any, mode: string): string {
  switch (mode) {
    case "shadow": return user.shadowId ?? generateShadowId(user.id);
    case "semi":   return user.displayName ?? user.shadowId ?? generateShadowId(user.id);
    case "social": return user.displayName ?? user.name ?? "User";
    case "public": return user.name ?? user.displayName ?? "User";
    default:       return user.displayName ?? user.name ?? "User";
  }
}

function getDisplayAvatar(user: any, mode: string): string | null {
  if (mode === "shadow") return null; // No avatar in shadow mode
  return user.avatar ?? null;
}

function getRecommendations(behavior: number, toxicity: number, contribution: number, reliability: number): string[] {
  const recs: string[] = [];
  if (behavior < 50) recs.push("Engage more positively with the community");
  if (toxicity > 20) recs.push("Reduce flagged content to lower your toxicity score");
  if (contribution < 30) recs.push("Post, tip, and stream to boost your contribution score");
  if (reliability < 40) recs.push("Stake SKY444 and maintain consistent activity to improve reliability");
  if (recs.length === 0) recs.push("Keep up the great work — you're a trusted community member!");
  return recs;
}
