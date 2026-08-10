import { mysqlTable, int, varchar, text, boolean, timestamp, json, mysqlEnum } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const twinMemory = mysqlTable("twin_memory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  summary: text("summary"),
  goals: json("goals"),
  projects: json("projects"),
  preferences: json("preferences"),
  finances: json("finances"),
  learning: json("learning"),
  lastInteractionAt: timestamp("lastInteractionAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt").default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
});

export const twinFacts = mysqlTable("twin_facts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  kind: mysqlEnum("kind", ["goal", "project", "preference", "finance", "learning", "fact", "event"]).default("fact").notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 64 }).default("chat").notNull(),
  confidence: int("confidence").default(80).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const reputationScores = mysqlTable("reputation_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  learningScore: int("learningScore").default(0).notNull(),
  builderScore: int("builderScore").default(0).notNull(),
  teachingScore: int("teachingScore").default(0).notNull(),
  communityScore: int("communityScore").default(0).notNull(),
  trustScore: int("trustScore").default(50).notNull(),
  overall: int("overall").default(0).notNull(),
  breakdown: json("breakdown"),
  computedAt: timestamp("computedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  postedBy: int("postedBy"),
  type: mysqlEnum("type", ["job", "project", "investor", "cofounder", "mentor", "study_partner", "language_partner", "gig"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  skills: json("skills"),
  tags: json("tags"),
  location: varchar("location", { length: 120 }),
  remote: boolean("remote").default(true).notNull(),
  compensation: varchar("compensation", { length: 120 }),
  status: mysqlEnum("status", ["open", "closed", "filled"]).default("open").notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const opportunityMatches = mysqlTable("opportunity_matches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  score: int("score").default(0).notNull(),
  reasoning: text("reasoning"),
  status: mysqlEnum("status", ["suggested", "saved", "applied", "dismissed"]).default("suggested").notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const missions = mysqlTable("missions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  category: mysqlEnum("category", ["skill", "language", "startup", "career", "fitness", "custom"]).default("skill").notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "completed", "paused", "abandoned"]).default("active").notNull(),
  progress: int("progress").default(0).notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt").default(sql`CURRENT_TIMESTAMP`).onUpdateNow().notNull(),
});

export const missionSteps = mysqlTable("mission_steps", {
  id: int("id").autoincrement().primaryKey(),
  missionId: int("missionId").notNull(),
  ordinal: int("ordinal").default(0).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  detail: text("detail"),
  done: boolean("done").default(false).notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const startupBlueprints = mysqlTable("startup_blueprints", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  idea: text("idea").notNull(),
  name: varchar("name", { length: 160 }),
  tagline: varchar("tagline", { length: 240 }),
  businessPlan: json("businessPlan"),
  branding: json("branding"),
  marketing: json("marketing"),
  mvpRoadmap: json("mvpRoadmap"),
  teamPlan: json("teamPlan"),
  status: mysqlEnum("status", ["draft", "generated", "launched"]).default("generated").notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const aiMarketListings = mysqlTable("ai_market_listings", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  kind: mysqlEnum("kind", ["agent", "prompt", "workflow", "template", "automation"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  content: text("content"),
  priceCents: int("priceCents").default(0).notNull(),
  tags: json("tags"),
  sales: int("sales").default(0).notNull(),
  ratingSum: int("ratingSum").default(0).notNull(),
  ratingCount: int("ratingCount").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const aiMarketPurchases = mysqlTable("ai_market_purchases", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  buyerId: int("buyerId").notNull(),
  pricePaidCents: int("pricePaidCents").default(0).notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type AiMarketListing = typeof aiMarketListings.$inferSelect;
export type StartupBlueprint = typeof startupBlueprints.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type MissionStep = typeof missionSteps.$inferSelect;
export type ReputationScore = typeof reputationScores.$inferSelect;
export type TwinMemory = typeof twinMemory.$inferSelect;
export type TwinFact = typeof twinFacts.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type OpportunityMatch = typeof opportunityMatches.$inferSelect;
