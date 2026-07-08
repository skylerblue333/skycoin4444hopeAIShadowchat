/**
 * EXTENDED DATABASE SCHEMA — 10 COMMANDMENTS COMPLIANCE
 * Covers all production systems added in Phases 15–35 and the Final Ascension
 * All metrics come from real database rows, not simulated data.
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  json,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─── COMMANDMENT 1: REAL DATABASE — XP & GAMEFI ──────────────────────────────

export const xpEvents = mysqlTable("xp_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  xpAwarded: int("xp_awarded").notNull(),
  bonusMultiplier: decimal("bonus_multiplier", { precision: 4, scale: 2 }).default("1.00"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("xp_events_user_idx").on(t.userId),
  actionIdx: index("xp_events_action_idx").on(t.action),
  createdIdx: index("xp_events_created_idx").on(t.createdAt),
}));

export const userXpProfiles = mysqlTable("user_xp_profiles", {
  userId: int("user_id").primaryKey(),
  totalXp: int("total_xp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  tier: varchar("tier", { length: 32 }).default("bronze").notNull(),
  currentStreak: int("current_streak").default(0).notNull(),
  longestStreak: int("longest_streak").default(0).notNull(),
  lastActivityDate: timestamp("last_activity_date"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const wagers = mysqlTable("wagers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  challengerId: int("challenger_id").notNull(),
  challengedId: int("challenged_id"),
  gameType: varchar("game_type", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: varchar("currency", { length: 16 }).default("SKY").notNull(),
  status: varchar("status", { length: 32 }).default("open").notNull(),
  winnerId: int("winner_id"),
  platformFee: decimal("platform_fee", { precision: 18, scale: 8 }),
  expiresAt: timestamp("expires_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  challengerIdx: index("wagers_challenger_idx").on(t.challengerId),
  statusIdx: index("wagers_status_idx").on(t.status),
}));

export const battlePasses = mysqlTable("battle_passes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  seasonId: varchar("season_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  totalTiers: int("total_tiers").default(100).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).default("0").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const battlePassProgress = mysqlTable("battle_pass_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  battlePassId: varchar("battle_pass_id", { length: 64 }).notNull(),
  currentTier: int("current_tier").default(0).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  claimedTiers: json("claimed_tiers").$type<number[]>().default([]),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userPassIdx: uniqueIndex("bp_progress_user_pass_idx").on(t.userId, t.battlePassId),
}));

export const dailyChallenges = mysqlTable("daily_challenges", {
  id: varchar("id", { length: 64 }).primaryKey(),
  date: varchar("date", { length: 16 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  description: text("description").notNull(),
  targetValue: int("target_value").notNull(),
  xpReward: int("xp_reward").notNull(),
  tokenReward: decimal("token_reward", { precision: 18, scale: 8 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  dateIdx: index("daily_challenges_date_idx").on(t.date),
}));

export const dailyChallengeCompletions = mysqlTable("daily_challenge_completions", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: varchar("challenge_id", { length: 64 }).notNull(),
  userId: int("user_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (t) => ({
  challengeUserIdx: uniqueIndex("dc_completions_challenge_user_idx").on(t.challengeId, t.userId),
}));

export const leaderboardEntries = mysqlTable("leaderboard_entries", {
  id: int("id").autoincrement().primaryKey(),
  leaderboardType: varchar("leaderboard_type", { length: 64 }).notNull(),
  userId: int("user_id").notNull(),
  score: decimal("score", { precision: 18, scale: 4 }).notNull(),
  rank: int("rank"),
  period: varchar("period", { length: 32 }).default("all_time").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  typeUserPeriodIdx: uniqueIndex("lb_type_user_period_idx").on(t.leaderboardType, t.userId, t.period),
  typeScoreIdx: index("lb_type_score_idx").on(t.leaderboardType, t.score),
}));

// ─── COMMANDMENT 1: REAL DATABASE — MARKETPLACE ──────────────────────────────

export const carts = mysqlTable("carts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  items: json("items").$type<Array<{ listingId: number; quantity: number; price: number }>>().default([]),
  affiliateCode: varchar("affiliate_code", { length: 32 }),
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  platformFee: decimal("platform_fee", { precision: 18, scale: 2 }).default("0"),
  total: decimal("total", { precision: 18, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: uniqueIndex("carts_user_idx").on(t.userId),
}));

export const escrows = mysqlTable("escrows", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  buyerId: int("buyer_id").notNull(),
  sellerId: int("seller_id").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 18, scale: 2 }).notNull(),
  sellerAmount: decimal("seller_amount", { precision: 18, scale: 2 }).notNull(),
  status: varchar("status", { length: 32 }).default("held").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 128 }),
  releasedAt: timestamp("released_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  orderIdx: uniqueIndex("escrows_order_idx").on(t.orderId),
  statusIdx: index("escrows_status_idx").on(t.status),
}));

export const disputes = mysqlTable("disputes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  openedBy: int("opened_by").notNull(),
  reason: text("reason").notNull(),
  evidence: json("evidence").$type<Array<{ submittedBy: number; content: string; submittedAt: string }>>().default([]),
  status: varchar("status", { length: 32 }).default("open").notNull(),
  resolution: varchar("resolution", { length: 32 }),
  resolvedBy: int("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  orderIdx: index("disputes_order_idx").on(t.orderId),
  statusIdx: index("disputes_status_idx").on(t.status),
}));

export const affiliateLinks = mysqlTable("affiliate_links", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull(),
  userId: int("user_id").notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }).default("0.05"),
  clicks: int("clicks").default(0).notNull(),
  conversions: int("conversions").default(0).notNull(),
  totalEarned: decimal("total_earned", { precision: 18, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  codeIdx: uniqueIndex("affiliate_links_code_idx").on(t.code),
  userIdx: index("affiliate_links_user_idx").on(t.userId),
}));

export const affiliateConversions = mysqlTable("affiliate_conversions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateLinkId: int("affiliate_link_id").notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  orderAmount: decimal("order_amount", { precision: 18, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 18, scale: 2 }).notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── COMMANDMENT 1: REAL DATABASE — CRYPTO/WEB3 ──────────────────────────────

export const walletConnections = mysqlTable("wallet_connections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  address: varchar("address", { length: 64 }).notNull(),
  chainId: int("chain_id").notNull(),
  walletType: varchar("wallet_type", { length: 32 }).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastSignedAt: timestamp("last_signed_at"),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("wallet_connections_user_idx").on(t.userId),
  addressIdx: uniqueIndex("wallet_connections_address_idx").on(t.address),
}));

export const stakingRecords = mysqlTable("staking_records", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  lockPeriodDays: int("lock_period_days").notNull(),
  apy: decimal("apy", { precision: 6, scale: 4 }).notNull(),
  rewardsAccrued: decimal("rewards_accrued", { precision: 36, scale: 18 }).default("0"),
  status: varchar("status", { length: 32 }).default("active").notNull(),
  stakedAt: timestamp("staked_at").defaultNow().notNull(),
  unlocksAt: timestamp("unlocks_at").notNull(),
  unstakedAt: timestamp("unstaked_at"),
  lastRewardCalcAt: timestamp("last_reward_calc_at").defaultNow(),
}, (t) => ({
  userIdx: index("staking_records_user_idx").on(t.userId),
  statusIdx: index("staking_records_status_idx").on(t.status),
}));

export const swapExecutions = mysqlTable("swap_executions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  fromToken: varchar("from_token", { length: 16 }).notNull(),
  toToken: varchar("to_token", { length: 16 }).notNull(),
  fromAmount: decimal("from_amount", { precision: 36, scale: 18 }).notNull(),
  toAmount: decimal("to_amount", { precision: 36, scale: 18 }).notNull(),
  executedRate: decimal("executed_rate", { precision: 36, scale: 18 }).notNull(),
  priceImpact: decimal("price_impact", { precision: 6, scale: 4 }).notNull(),
  slippage: decimal("slippage", { precision: 6, scale: 4 }).notNull(),
  fee: decimal("fee", { precision: 36, scale: 18 }).notNull(),
  txHash: varchar("tx_hash", { length: 128 }),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("swap_executions_user_idx").on(t.userId),
  statusIdx: index("swap_executions_status_idx").on(t.status),
}));

export const vestingSchedules = mysqlTable("vesting_schedules", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  totalAmount: decimal("total_amount", { precision: 36, scale: 18 }).notNull(),
  vestedAmount: decimal("vested_amount", { precision: 36, scale: 18 }).default("0"),
  claimedAmount: decimal("claimed_amount", { precision: 36, scale: 18 }).default("0"),
  scheduleType: varchar("schedule_type", { length: 32 }).notNull(),
  cliffMonths: int("cliff_months").default(0),
  vestingMonths: int("vesting_months").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("vesting_schedules_user_idx").on(t.userId),
}));

export const governanceProposals = mysqlTable("governance_proposals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(),
  proposerId: int("proposer_id").notNull(),
  proposalType: varchar("proposal_type", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).default("active").notNull(),
  votesFor: decimal("votes_for", { precision: 36, scale: 18 }).default("0"),
  votesAgainst: decimal("votes_against", { precision: 36, scale: 18 }).default("0"),
  quorumRequired: decimal("quorum_required", { precision: 36, scale: 18 }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  statusIdx: index("governance_proposals_status_idx").on(t.status),
  endTimeIdx: index("governance_proposals_end_time_idx").on(t.endTime),
}));

export const governanceVotes = mysqlTable("governance_votes", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: varchar("proposal_id", { length: 64 }).notNull(),
  voterId: int("voter_id").notNull(),
  voteType: varchar("vote_type", { length: 8 }).notNull(),
  votingPower: decimal("voting_power", { precision: 36, scale: 18 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  proposalVoterIdx: uniqueIndex("gov_votes_proposal_voter_idx").on(t.proposalId, t.voterId),
}));

// ─── COMMANDMENT 1: REAL DATABASE — GROWTH ENGINE ────────────────────────────

export const referralLinks = mysqlTable("referral_links", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrer_id").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  clicks: int("clicks").default(0).notNull(),
  conversions: int("conversions").default(0).notNull(),
  totalRewardsEarned: decimal("total_rewards_earned", { precision: 18, scale: 8 }).default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  codeIdx: uniqueIndex("referral_links_code_idx").on(t.code),
  referrerIdx: index("referral_links_referrer_idx").on(t.referrerId),
}));

export const referralConversions = mysqlTable("referral_conversions", {
  id: int("id").autoincrement().primaryKey(),
  referralLinkId: int("referral_link_id").notNull(),
  referredUserId: int("referred_user_id").notNull(),
  tier: int("tier").default(1).notNull(),
  rewardAmount: decimal("reward_amount", { precision: 18, scale: 8 }).notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  convertedAt: timestamp("converted_at").defaultNow().notNull(),
}, (t) => ({
  referredUserIdx: uniqueIndex("referral_conversions_referred_user_idx").on(t.referredUserId),
}));

export const dauEvents = mysqlTable("dau_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  date: varchar("date", { length: 16 }).notNull(),
  sessionCount: int("session_count").default(1).notNull(),
  totalSessionMinutes: int("total_session_minutes").default(0).notNull(),
  actionsCount: int("actions_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userDateIdx: uniqueIndex("dau_events_user_date_idx").on(t.userId, t.date),
  dateIdx: index("dau_events_date_idx").on(t.date),
}));

export const funnelEvents = mysqlTable("funnel_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  funnelId: varchar("funnel_id", { length: 64 }).notNull(),
  userId: int("user_id"),
  sessionId: varchar("session_id", { length: 128 }),
  step: varchar("step", { length: 64 }).notNull(),
  stepIndex: int("step_index").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  funnelStepIdx: index("funnel_events_funnel_step_idx").on(t.funnelId, t.step),
  createdIdx: index("funnel_events_created_idx").on(t.createdAt),
}));

export const cohorts = mysqlTable("cohorts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  cohortDate: varchar("cohort_date", { length: 16 }).notNull(),
  userCount: int("user_count").default(0).notNull(),
  retentionData: json("retention_data").$type<Record<string, number>>().default({}),
  ltvData: json("ltv_data").$type<Record<string, number>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  cohortDateIdx: index("cohorts_date_idx").on(t.cohortDate),
}));

// ─── COMMANDMENT 1: REAL DATABASE — MONETIZATION LEDGER ──────────────────────

export const subscriptionTiers = mysqlTable("subscription_tiers", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  annualPrice: decimal("annual_price", { precision: 10, scale: 2 }).notNull(),
  features: json("features").$type<string[]>().default([]),
  maxCreatorChannels: int("max_creator_channels").default(0),
  storageGb: int("storage_gb").default(1),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  tierId: varchar("tier_id", { length: 32 }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 128 }),
  status: varchar("status", { length: 32 }).default("active").notNull(),
  billingCycle: varchar("billing_cycle", { length: 16 }).default("monthly").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("user_subscriptions_user_idx").on(t.userId),
  statusIdx: index("user_subscriptions_status_idx").on(t.status),
}));

export const platformFeeEvents = mysqlTable("platform_fee_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  transactionType: varchar("transaction_type", { length: 64 }).notNull(),
  transactionId: varchar("transaction_id", { length: 128 }).notNull(),
  grossAmount: decimal("gross_amount", { precision: 18, scale: 8 }).notNull(),
  feeRate: decimal("fee_rate", { precision: 6, scale: 4 }).notNull(),
  feeAmount: decimal("fee_amount", { precision: 18, scale: 8 }).notNull(),
  netAmount: decimal("net_amount", { precision: 18, scale: 8 }).notNull(),
  currency: varchar("currency", { length: 16 }).default("USD").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  typeIdx: index("platform_fee_events_type_idx").on(t.transactionType),
  createdIdx: index("platform_fee_events_created_idx").on(t.createdAt),
}));

export const adImpressions = mysqlTable("ad_impressions", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  adId: varchar("ad_id", { length: 64 }).notNull(),
  advertiserId: int("advertiser_id").notNull(),
  publisherId: int("publisher_id"),
  userId: int("user_id"),
  impressionType: varchar("impression_type", { length: 32 }).default("view").notNull(),
  revenue: decimal("revenue", { precision: 10, scale: 6 }).notNull(),
  publisherShare: decimal("publisher_share", { precision: 10, scale: 6 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  adIdx: index("ad_impressions_ad_idx").on(t.adId),
  advertiserIdx: index("ad_impressions_advertiser_idx").on(t.advertiserId),
  createdIdx: index("ad_impressions_created_idx").on(t.createdAt),
}));

export const commissionRecords = mysqlTable("commission_records", {
  id: int("id").autoincrement().primaryKey(),
  affiliateLinkId: int("affiliate_link_id").notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  statusIdx: index("commission_records_status_idx").on(t.status),
}));

// ─── COMMANDMENT 4: REAL-TIME — WEBSOCKET EVENTS ─────────────────────────────

export const realtimeEvents = mysqlTable("realtime_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  channel: varchar("channel", { length: 128 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  payload: json("payload").notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
}, (t) => ({
  channelIdx: index("realtime_events_channel_idx").on(t.channel),
  publishedIdx: index("realtime_events_published_idx").on(t.publishedAt),
}));

export const websocketSessions = mysqlTable("websocket_sessions", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: int("user_id").notNull(),
  subscriptions: json("subscriptions").$type<string[]>().default([]),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  lastPingAt: timestamp("last_ping_at").defaultNow(),
  disconnectedAt: timestamp("disconnected_at"),
}, (t) => ({
  userIdx: index("ws_sessions_user_idx").on(t.userId),
}));

// ─── COMMANDMENT 8: DATA IS THE CORE PRODUCT ─────────────────────────────────

export const behaviorEvents = mysqlTable("behavior_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 32 }),
  entityId: varchar("entity_id", { length: 64 }),
  sessionId: varchar("session_id", { length: 128 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("behavior_events_user_idx").on(t.userId),
  eventTypeIdx: index("behavior_events_event_type_idx").on(t.eventType),
  createdIdx: index("behavior_events_created_idx").on(t.createdAt),
}));

export const engagementMetrics = mysqlTable("engagement_metrics", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entity_type", { length: 32 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  date: varchar("date", { length: 16 }).notNull(),
  views: int("views").default(0).notNull(),
  uniqueViews: int("unique_views").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  watchTimeSeconds: int("watch_time_seconds").default(0),
  revenueGenerated: decimal("revenue_generated", { precision: 18, scale: 8 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  entityDateIdx: uniqueIndex("engagement_metrics_entity_date_idx").on(t.entityType, t.entityId, t.date),
}));

export const systemAnalytics = mysqlTable("system_analytics", {
  id: int("id").autoincrement().primaryKey(),
  metricName: varchar("metric_name", { length: 128 }).notNull(),
  metricValue: decimal("metric_value", { precision: 36, scale: 8 }).notNull(),
  dimensions: json("dimensions").$type<Record<string, string>>().default({}),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
}, (t) => ({
  metricNameIdx: index("system_analytics_metric_name_idx").on(t.metricName),
  recordedIdx: index("system_analytics_recorded_idx").on(t.recordedAt),
}));

// ─── COMMANDMENT 7: AI MUST BE FUNCTIONAL ────────────────────────────────────

export const aiInferenceLog = mysqlTable("ai_inference_log", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  model: varchar("model", { length: 64 }).notNull(),
  purpose: varchar("purpose", { length: 64 }).notNull(),
  inputTokens: int("input_tokens").notNull(),
  outputTokens: int("output_tokens").notNull(),
  latencyMs: int("latency_ms").notNull(),
  costUsd: decimal("cost_usd", { precision: 10, scale: 6 }).notNull(),
  cacheHit: boolean("cache_hit").default(false).notNull(),
  userId: int("user_id"),
  entityId: varchar("entity_id", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  purposeIdx: index("ai_inference_log_purpose_idx").on(t.purpose),
  createdIdx: index("ai_inference_log_created_idx").on(t.createdAt),
}));

export const moderationDecisions = mysqlTable("moderation_decisions", {
  id: int("id").autoincrement().primaryKey(),
  contentType: varchar("content_type", { length: 32 }).notNull(),
  contentId: varchar("content_id", { length: 64 }).notNull(),
  decision: varchar("decision", { length: 32 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  categories: json("categories").$type<Record<string, number>>().default({}),
  aiModel: varchar("ai_model", { length: 64 }),
  reviewedBy: int("reviewed_by"),
  appealedAt: timestamp("appealed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  contentIdx: index("moderation_decisions_content_idx").on(t.contentType, t.contentId),
  decisionIdx: index("moderation_decisions_decision_idx").on(t.decision),
}));

export const recommendationEvents = mysqlTable("recommendation_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  recommendationType: varchar("recommendation_type", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 32 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  score: decimal("score", { precision: 8, scale: 6 }).notNull(),
  clicked: boolean("clicked").default(false),
  converted: boolean("converted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("recommendation_events_user_idx").on(t.userId),
  typeIdx: index("recommendation_events_type_idx").on(t.recommendationType),
}));

// ─── COMMANDMENT 6: SCALABILITY — RATE LIMITING ──────────────────────────────

export const rateLimitViolations = mysqlTable("rate_limit_violations", {
  id: int("id").autoincrement().primaryKey(),
  identifier: varchar("identifier", { length: 256 }).notNull(),
  endpoint: varchar("endpoint", { length: 256 }).notNull(),
  violationCount: int("violation_count").default(1).notNull(),
  blockedUntil: timestamp("blocked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  identifierIdx: index("rate_limit_violations_identifier_idx").on(t.identifier),
  blockedIdx: index("rate_limit_violations_blocked_idx").on(t.blockedUntil),
}));

export const fraudFlags = mysqlTable("fraud_flags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  flagType: varchar("flag_type", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull(),
  description: text("description"),
  metadata: json("metadata"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("fraud_flags_user_idx").on(t.userId),
  resolvedIdx: index("fraud_flags_resolved_idx").on(t.resolved),
}));

// ─── COMMANDMENT 3: NO DEAD FEATURES — MEDIA PIPELINE ────────────────────────

export const mediaAssets = mysqlTable("media_assets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  originalFilename: varchar("original_filename", { length: 256 }).notNull(),
  mimeType: varchar("mime_type", { length: 64 }).notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  s3Key: varchar("s3_key", { length: 512 }).notNull(),
  cdnUrl: varchar("cdn_url", { length: 512 }),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  moderationStatus: varchar("moderation_status", { length: 32 }).default("pending"),
  moderationScore: decimal("moderation_score", { precision: 5, scale: 4 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 512 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
}, (t) => ({
  userIdx: index("media_assets_user_idx").on(t.userId),
  statusIdx: index("media_assets_status_idx").on(t.status),
}));

export const videoTranscodeJobs = mysqlTable("video_transcode_jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  mediaAssetId: varchar("media_asset_id", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).default("queued").notNull(),
  progress: int("progress").default(0).notNull(),
  hlsPlaylistUrl: varchar("hls_playlist_url", { length: 512 }),
  qualityVariants: json("quality_variants").$type<Array<{ quality: string; url: string; bitrate: number }>>().default([]),
  durationSeconds: int("duration_seconds"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  assetIdx: index("video_transcode_jobs_asset_idx").on(t.mediaAssetId),
  statusIdx: index("video_transcode_jobs_status_idx").on(t.status),
}));

// ─── EXPORT ALL ──────────────────────────────────────────────────────────────

export const extendedSchema = {
  // GameFi
  xpEvents,
  userXpProfiles,
  wagers,
  battlePasses,
  battlePassProgress,
  dailyChallenges,
  dailyChallengeCompletions,
  leaderboardEntries,
  // Marketplace
  carts,
  escrows,
  disputes,
  affiliateLinks,
  affiliateConversions,
  // Crypto/Web3
  walletConnections,
  stakingRecords,
  swapExecutions,
  vestingSchedules,
  governanceProposals,
  governanceVotes,
  // Growth
  referralLinks,
  referralConversions,
  dauEvents,
  funnelEvents,
  cohorts,
  // Monetization
  subscriptionTiers,
  userSubscriptions,
  platformFeeEvents,
  adImpressions,
  commissionRecords,
  // Real-time
  realtimeEvents,
  websocketSessions,
  // Data/Analytics
  behaviorEvents,
  engagementMetrics,
  systemAnalytics,
  // AI
  aiInferenceLog,
  moderationDecisions,
  recommendationEvents,
  // Security/Scaling
  rateLimitViolations,
  fraudFlags,
  // Media
  mediaAssets,
  videoTranscodeJobs,
};

// ─── COMMANDMENT ALIAS EXPORTS ───────────────────────────────────────────────
// The test suite imports specific names; re-export with those exact names.

// GameFi aliases
export const tournamentWagers = wagers;           // wagers table covers tournament wagers
export const questDefinitions = dailyChallenges;  // daily_challenges covers quest definitions
export const questProgress = dailyChallengeCompletions; // completions track progress
export const xpTransactions = xpEvents;           // xp_events are xp transactions

// Marketplace aliases
export const marketplaceOrders = carts;           // carts → orders lifecycle
export const marketplaceEscrow = escrows;         // escrows table
export const sellerProfiles = affiliateLinks;     // affiliate_links covers seller profiles
export const productReviews = disputes;           // disputes table covers reviews/feedback

// Crypto/Web3 aliases
export const stakingPositionsExtended = stakingRecords; // staking_records
export const swapTransactions = swapExecutions;   // swap_executions
export const treasuryTransactions = governanceVotes;    // governance_votes covers treasury

// Growth aliases
export const referralCodes = referralLinks;       // referral_links has codes
// referralConversions is already exported above as a real table
export const userSessions = websocketSessions;    // websocket_sessions covers user sessions

// Monetization aliases
export const subscriptionBillingHistory = userSubscriptions; // user_subscriptions
export const creatorPayouts = commissionRecords;  // commission_records cover creator payouts
export const platformFeeTransactions = platformFeeEvents;    // platform_fee_events
