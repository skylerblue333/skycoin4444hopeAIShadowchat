import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";

// Create a base router template for all feature modules
const createFeatureRouter = () => router({
  list: publicProcedure.query(() => []),
  get: publicProcedure.input(z.string()).query(({ input }) => ({})),
  create: protectedProcedure.input(z.object({})).mutation(({ input }) => ({ success: true })),
  update: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => ({ success: true })),
  delete: protectedProcedure.input(z.string()).mutation(({ input }) => ({ success: true })),
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // AI & Agents Routers
  ai: createFeatureRouter(),
  aiEngineer: createFeatureRouter(),
  aiMarket: createFeatureRouter(),
  aiPersonas: createFeatureRouter(),
  hopeAI: createFeatureRouter(),
  hopeIntelligence: createFeatureRouter(),
  agents44: createFeatureRouter(),

  // Social & Community Routers
  social: createFeatureRouter(),
  socialCore: createFeatureRouter(),
  feed: createFeatureRouter(),
  community: createFeatureRouter(),
  dm: createFeatureRouter(),
  story: createFeatureRouter(),

  // Marketplace & Commerce Routers
  marketplace: createFeatureRouter(),
  creator: createFeatureRouter(),
  creatorGrowth: createFeatureRouter(),
  digitalArt: createFeatureRouter(),
  payments: createFeatureRouter(),

  // Blockchain & Crypto Routers
  blockchain: createFeatureRouter(),
  staking: createFeatureRouter(),
  economy: createFeatureRouter(),
  gamefi: createFeatureRouter(),
  ico: createFeatureRouter(),

  // Admin & Moderation Routers
  admin: createFeatureRouter(),
  moderation: createFeatureRouter(),
  auditLogs: createFeatureRouter(),
  security: createFeatureRouter(),
  complianceIntelligence: createFeatureRouter(),

  // Platform & Enterprise Routers
  platform: createFeatureRouter(),
  enterprise: createFeatureRouter(),
  governance: createFeatureRouter(),
  orchestrator: createFeatureRouter(),
  search: createFeatureRouter(),

  // Gaming & Gamification Routers
  gamification: createFeatureRouter(),
  simulation: createFeatureRouter(),
  legendary: createFeatureRouter(),

  // Additional Feature Routers
  charity: createFeatureRouter(),
  stream: createFeatureRouter(),
  languageExchange: createFeatureRouter(),
  audienceLockIn: createFeatureRouter(),
  shadowIdentity: createFeatureRouter(),
  proofVault: createFeatureRouter(),
  goc: createFeatureRouter(),
  notifIntelligence: createFeatureRouter(),
  investor: createFeatureRouter(),
  installer: createFeatureRouter(),
  sprint: createFeatureRouter(),
});

export type AppRouter = typeof appRouter;
