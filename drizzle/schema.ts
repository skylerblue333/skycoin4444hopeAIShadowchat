import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ============ USER & AUTH TABLES ============
export type User = typeof users.$inferSelect;

export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 255 }),
  dateOfBirth: timestamp("date_of_birth"),
  profileImage: varchar("profile_image", { length: 255 }),
  bio: text("bio"),
  avatar: varchar("avatar", { length: 255 }),
  balance: decimal("balance", { precision: 38, scale: 18 }).default("0"),
  role: varchar("role", { length: 255 }).default("user"),
  status: varchar("status", { length: 255 }).default("active"),
  lastLogin: timestamp("last_login"),
  mfaEnabled: boolean("mfa_enabled").default(false),
  isCron: boolean("is_cron").default(false),
  profileComplete: boolean("profile_complete").default(false),
  emailVerified: boolean("email_verified").default(false),
  mfaSecret: varchar("mfa_secret", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ AI AGENT TABLES ============
export const aiAgents = mysqlTable("ai_agents", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(), // analyst | trader | creative | assistant
  status: varchar("status", { length: 255 }).default("idle"),
  personality: text("personality"),
  knowledgeBase: text("knowledge_base"),
  capabilities: text("capabilities"), // JSON string
  ownerId: varchar("user_id", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const aiConversations = mysqlTable("ai_conversations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  agentId: varchar("agent_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  summary: text("summary"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const aiMessages = mysqlTable("ai_messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  conversationId: varchar("conversation_id", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(), // user | assistant | system
  content: text("content").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ SOCIAL & CONTENT TABLES ============
export const posts = mysqlTable("posts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 255 }).default("text"), // text | image | video | ai_generated
  mediaUrls: text("media_urls"), // JSON array string
  likesCount: int("likes_count").default(0),
  likeCount: int("like_count").default(0), // Alias for legacy code
  commentsCount: int("comments_count").default(0),
  sharesCount: int("shares_count").default(0),
  visibility: varchar("visibility", { length: 255 }).default("public"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const comments = mysqlTable("comments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  postId: varchar("post_id", { length: 255 }).notNull(),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  likesCount: int("likes_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const follows = mysqlTable("follows", {
  id: varchar("id", { length: 255 }).primaryKey(),
  followerId: varchar("follower_id", { length: 255 }).notNull(),
  followingId: varchar("following_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ MARKET & FINANCE TABLES ============
export const marketAssets = mysqlTable("market_assets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  symbol: varchar("symbol", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(), // crypto | stock | commodity
  currentPrice: decimal("current_price", { precision: 38, scale: 18 }),
  change24h: decimal("change_24h", { precision: 38, scale: 18 }),
  marketCap: decimal("market_cap", { precision: 38, scale: 18 }),
  volume24h: decimal("volume_24h", { precision: 38, scale: 18 }),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userPortfolios = mysqlTable("user_portfolios", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  assetId: varchar("asset_id", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  averagePrice: decimal("average_price", { precision: 38, scale: 18 }),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(), // buy | sell | transfer | deposit | withdraw
  assetId: varchar("asset_id", { length: 255 }),
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  price: decimal("price", { precision: 38, scale: 18 }),
  fee: decimal("fee", { precision: 38, scale: 18 }),
  status: varchar("status", { length: 255 }).default("completed"),
  txHash: varchar("tx_hash", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ GAMIFICATION & ENGAGEMENT TABLES ============
export const userQuests = mysqlTable("user_quests", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  questId: varchar("quest_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("in_progress"), // in_progress | completed | failed
  progress: int("progress").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userAchievements = mysqlTable("user_achievements", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  achievementId: varchar("achievement_id", { length: 255 }).notNull(),
  unlockedAt: timestamp("unlocked_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userInventory = mysqlTable("user_inventory", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  itemId: varchar("item_id", { length: 255 }).notNull(),
  quantity: int("quantity").default(1),
  metadata: text("metadata"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userArchetypes = mysqlTable("user_archetypes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  archetype: varchar("archetype", { length: 255 }).notNull(),
  primary: varchar("primary", { length: 255 }),
  secondary: varchar("secondary", { length: 255 }),
  scores: text("scores"), // JSON string
  confidence: decimal("confidence", { precision: 38, scale: 18 }),
  computedAt: timestamp("computed_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const custodyWallets = mysqlTable("custody_wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  chain: varchar("chain", { length: 255 }).notNull(),
  chainId: int("chain_id"),
  chainName: varchar("chain_name", { length: 255 }),
  walletType: varchar("wallet_type", { length: 255 }).default("hd"), // hd | imported | multisig
  label: varchar("label", { length: 255 }),
  isPrimary: boolean("is_primary").default(false),
  derivationPath: varchar("derivation_path", { length: 255 }),
  lastKnownNonce: int("last_known_nonce").default(0),
  cachedBalanceWei: varchar("cached_balance_wei", { length: 255 }).default("0"),
  encryptedPrivateKey: text("encrypted_private_key"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ BLOCKCHAIN SPECIFIC TABLES ============
export const userWallets = mysqlTable("user_wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }).notNull().unique(),
  chain: varchar("chain", { length: 255 }).notNull(), // ethereum | solana | bitcoin | skycoin
  encryptedPrivateKey: text("encrypted_private_key"),
  mnemonic: text("mnemonic"),
  isCustodial: boolean("is_custodial").default(true),
  balance: decimal("balance", { precision: 38, scale: 18 }).default("0"),
  lockedBalance: decimal("locked_balance", { precision: 38, scale: 18 }).default("0"),
  stakedBalance: decimal("staked_balance", { precision: 38, scale: 18 }).default("0"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ USER BEHAVIOR SIGNALS TABLE ============
export const userBehaviorSignals = mysqlTable("user_behavior_signals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  signalType: varchar("signal_type", { length: 255 }).notNull(), // login | purchase | post | comment | follow | etc
  value: decimal("value", { precision: 38, scale: 18 }).default("0"),
  metadata: text("metadata"),
  recordedAt: timestamp("recorded_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ DATING SYSTEM TABLES ============
export const datingProfiles = mysqlTable("dating_profiles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  bio: text("bio"),
  photos: text("photos"), // JSON string
  interests: text("interests"), // JSON string
  location: varchar("location", { length: 255 }),
  age: int("age"),
  gender: varchar("gender", { length: 255 }),
  lookingFor: varchar("looking_for", { length: 255 }),
  height: int("height"),
  bodyType: varchar("body_type", { length: 255 }),
  ethnicity: varchar("ethnicity", { length: 255 }),
  religion: varchar("religion", { length: 255 }),
  education: varchar("education", { length: 255 }),
  occupation: varchar("occupation", { length: 255 }),
  relationshipGoal: varchar("relationship_goal", { length: 255 }),
  smoker: varchar("smoker", { length: 255 }),
  drinker: varchar("drinker", { length: 255 }),
  hasKids: varchar("has_kids", { length: 255 }),
  wantsKids: varchar("wants_kids", { length: 255 }),
  profileCompleteness: int("profile_completeness").default(0),
  verified: boolean("verified").default(false),
  verificationStatus: varchar("verification_status", { length: 255 }).default("unverified"),
  isActive: boolean("is_active").default(true),
  suspended: boolean("suspended").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingMatches = mysqlTable("dating_matches", {
  id: varchar("id", { length: 255 }).primaryKey(),
  user1Id: varchar("user_id_1", { length: 255 }).notNull(),
  user2Id: varchar("user_id_2", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending"), // pending | matched | rejected | blocked
  matchType: varchar("match_type", { length: 255 }),
  isMutual: boolean("is_mutual").default(false),
  isBlocked: boolean("is_blocked").default(false),
  compatibilityScore: int("compatibility_score"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingLikes = mysqlTable("dating_likes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  likedUserId: varchar("liked_user_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).default("like"), // like | superlike
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingSubscriptions = mysqlTable("dating_subscriptions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tier: varchar("tier", { length: 255 }).notNull(), // basic | premium | vip
  status: varchar("status", { length: 255 }).default("active"),
  paymentId: varchar("payment_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  price: decimal("price", { precision: 38, scale: 18 }),
  unlimitedLikes: boolean("unlimited_likes").default(false),
  unlimitedSuperLikes: boolean("unlimited_super_likes").default(false),
  rewindAccess: boolean("rewind_access").default(false),
  rewindFeature: boolean("rewind_feature").default(false), // Alias for rewindAccess
  boostAccess: boolean("boost_access").default(false),
  boostFeature: boolean("boost_feature").default(false), // Alias for boostAccess
  readReceipts: boolean("read_receipts").default(false),
  incognitoMode: boolean("incognito_mode").default(false),
  unlimitedMessages: boolean("unlimited_messages").default(false),
  advancedFilters: boolean("advanced_filters").default(false),
  seenByFeature: boolean("seen_by_feature").default(false),
  startDate: timestamp("start_date").default(sql`CURRENT_TIMESTAMP`),
  startsAt: timestamp("starts_at").default(sql`CURRENT_TIMESTAMP`), // Alias for startDate
  endDate: timestamp("end_date"),
  cancelledAt: timestamp("cancelled_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingReports = mysqlTable("dating_reports", {
  id: varchar("id", { length: 255 }).primaryKey(),
  reporterId: varchar("reporter_id", { length: 255 }).notNull(),
  reportedUserId: varchar("reported_user_id", { length: 255 }).notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending"), // pending | reviewed | resolved
  moderatorNotes: text("moderator_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ FRAUD & SECURITY TABLES ============
export const fraudSignals = mysqlTable("fraud_signals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  signalType: varchar("signal_type", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 255 }).default("low"), // low | medium | high | critical
  details: text("details"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const rateLimitBuckets = mysqlTable("rate_limit_buckets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  action: varchar("action", { length: 255 }).notNull(),
  count: int("count").default(0),
  windowStart: timestamp("window_start"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ WALLET & TRANSACTION TABLES ============
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  walletId: varchar("wallet_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(), // deposit | withdraw | transfer | stake | swap
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending"),
  txHash: varchar("tx_hash", { length: 255 }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const onChainTransactions = mysqlTable("on_chain_transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  walletId: varchar("wallet_id", { length: 255 }).notNull(),
  txHash: varchar("tx_hash", { length: 255 }).notNull().unique(),
  chain: varchar("chain", { length: 255 }).notNull(),
  chainId: int("chain_id"),
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  fromAddress: varchar("from_address", { length: 255 }),
  toAddress: varchar("to_address", { length: 255 }),
  valueWei: varchar("value_wei", { length: 255 }),
  gasLimit: varchar("gas_limit", { length: 255 }),
  maxFeePerGas: varchar("max_fee_per_gas", { length: 255 }),
  maxPriorityFeePerGas: varchar("max_priority_fee_per_gas", { length: 255 }),
  tokenContract: varchar("token_contract", { length: 255 }),
  tokenSymbol: varchar("token_symbol", { length: 255 }),
  tokenAmount: varchar("token_amount", { length: 255 }),
  tokenDecimals: int("token_decimals"),
  nonce: int("nonce"),
  signedTxHex: text("signed_tx_hex"),
  status: varchar("status", { length: 255 }).default("pending"),
  errorMessage: text("error_message"),
  blockNumber: int("block_number"),
  confirmations: int("confirmations").default(0),
  internalNote: text("internal_note"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ EXTENDED USER FIELDS ============
// Note: We'll need to update the 'users' table definition in the next step to include these fields.
// For now, adding other missing tables.

export const icoInvestorStats = mysqlTable("ico_investor_stats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  totalInvested: decimal("total_invested", { precision: 38, scale: 18 }).default("0"),
  tokensBought: decimal("tokens_bought", { precision: 38, scale: 18 }).default("0"),
  totalRaisedUsd: decimal("total_raised_usd", { precision: 38, scale: 18 }).default("0"),
  totalInvestors: int("total_investors").default(0),
  tokenPriceUsd: decimal("token_price_usd", { precision: 38, scale: 18 }).default("0"),
  tokensSold: decimal("tokens_sold", { precision: 38, scale: 18 }).default("0"),
  tokensRemaining: decimal("tokens_remaining", { precision: 38, scale: 18 }).default("0"),
  hardCapUsd: decimal("hard_cap_usd", { precision: 38, scale: 18 }).default("0"),
  softCapUsd: decimal("soft_cap_usd", { precision: 38, scale: 18 }).default("0"),
  softCapReached: boolean("soft_cap_reached").default(false),
  currentRound: int("current_round").default(1),
  roundBonus: decimal("round_bonus", { precision: 38, scale: 18 }).default("0"),
  rarityStatus: varchar("rarity_status", { length: 255 }),
  rarityLabel: varchar("rarity_label", { length: 255 }),
  rarityScore: decimal("rarity_score", { precision: 38, scale: 18 }).default("0"),
  momentumScore: decimal("momentum_score", { precision: 38, scale: 18 }).default("0"),
  sentimentScore: decimal("sentiment_score", { precision: 38, scale: 18 }).default("0"),
  trendDirection: varchar("trend_direction", { length: 255 }),
  priceChange24h: decimal("price_change_24h", { precision: 38, scale: 18 }).default("0"),
  volumeUsd24h: decimal("volume_usd_24h", { precision: 38, scale: 18 }).default("0"),
  rewardPoolSky: decimal("reward_pool_sky", { precision: 38, scale: 18 }).default("0"),
  rewardDistributed: decimal("reward_distributed", { precision: 38, scale: 18 }).default("0"),
  rewardApy: decimal("reward_apy", { precision: 38, scale: 18 }).default("0"),
  lastAgentCycleAt: timestamp("last_agent_cycle_at"),
  lastRarityUpdateAt: timestamp("last_rarity_update_at"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const marketSignals = mysqlTable("market_signals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  assetId: varchar("asset_id", { length: 255 }).notNull(),
  agentId: varchar("agent_id", { length: 255 }),
  title: varchar("title", { length: 255 }),
  commentary: text("commentary"),
  targetAsset: varchar("target_asset", { length: 255 }),
  priceTarget: decimal("price_target", { precision: 38, scale: 18 }),
  confidenceScore: decimal("confidence_score", { precision: 38, scale: 18 }),
  momentumDelta: decimal("momentum_delta", { precision: 38, scale: 18 }),
  tags: text("tags"), // JSON string
  postedToFeed: boolean("posted_to_feed").default(false),
  signalType: varchar("signal_type", { length: 255 }).notNull(), // buy | sell | neutral
  strength: decimal("strength", { precision: 38, scale: 18 }),
  source: varchar("source", { length: 255 }),
  isPublic: boolean("is_public").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const aiMarketAgents = mysqlTable("ai_market_agents", {
  id: varchar("id", { length: 255 }).primaryKey(),
  agentId: varchar("agent_id", { length: 255 }).notNull(),
  strategy: text("strategy"),
  performance: decimal("performance", { precision: 38, scale: 18 }).default("0"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const wallets = mysqlTable("wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }).notNull().unique(),
  chain: varchar("chain", { length: 255 }).notNull(),
  balance: decimal("balance", { precision: 38, scale: 18 }).default("0"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const miningStats = mysqlTable("mining_stats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  hashRate: decimal("hash_rate", { precision: 38, scale: 18 }).default("0"),
  totalMined: decimal("total_mined", { precision: 38, scale: 18 }).default("0"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const ai_usage = mysqlTable("ai_usage", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tokensUsed: int("tokens_used").default(0),
  cost: decimal("cost", { precision: 38, scale: 18 }).default("0"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const aiAgentActivity = mysqlTable("ai_agent_activity", {
  id: varchar("id", { length: 255 }).primaryKey(),
  agentId: varchar("agent_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  activityType: varchar("activity_type", { length: 255 }),
  summary: text("summary"),
  impactScore: decimal("impact_score", { precision: 38, scale: 18 }),
  details: text("details"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const dailyRaritySnapshots = mysqlTable("daily_rarity_snapshots", {
  id: varchar("id", { length: 255 }).primaryKey(),
  assetId: varchar("asset_id", { length: 255 }).notNull(),
  rarityScore: decimal("rarity_score", { precision: 38, scale: 18 }),
  date: timestamp("date").default(sql`CURRENT_TIMESTAMP`),
  snapshotDate: timestamp("snapshot_date").default(sql`CURRENT_TIMESTAMP`),
});

export const platformMetrics = mysqlTable("platform_metrics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  metric: varchar("metric", { length: 255 }),
  metricName: varchar("metric_name", { length: 255 }).notNull(),
  value: decimal("value", { precision: 38, scale: 18 }).notNull(),
  category: varchar("category", { length: 255 }),
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const tips = mysqlTable("tips", {
  id: varchar("id", { length: 255 }).primaryKey(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  receiverId: varchar("receiver_id", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const creatorSubscriptions = mysqlTable("creator_subscriptions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }), // Legacy field
  subscriberId: varchar("subscriber_id", { length: 255 }).notNull(),
  creatorId: varchar("creator_id", { length: 255 }).notNull(),
  tier: varchar("tier", { length: 255 }),
  status: varchar("status", { length: 255 }).default("active"),
  price: decimal("price", { precision: 38, scale: 18 }).default("0"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tokenBalances = mysqlTable("token_balances", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 255 }).notNull(),
  balance: decimal("balance", { precision: 38, scale: 18 }).default("0"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const streams = mysqlTable("streams", {
  id: varchar("id", { length: 255 }).primaryKey(),
  hostId: varchar("host_id", { length: 255 }).notNull(),
  streamerId: varchar("streamer_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("idle"),
  viewerCount: int("viewer_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const stakingPositions = mysqlTable("staking_positions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  apy: decimal("apy", { precision: 38, scale: 18 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tokenTransactions = mysqlTable("token_transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 255 }).default("SKY444"),
  type: varchar("type", { length: 255 }).notNull(), // burn | mint | transfer | reward | spend
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  interactionType: varchar("interaction_type", { length: 255 }),
  purpose: varchar("purpose", { length: 255 }),
  description: text("description"),
  metadata: text("metadata"),
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const feedback = mysqlTable("feedback", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  content: text("content").notNull(),
  category: varchar("category", { length: 255 }),
  status: varchar("status", { length: 255 }).default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const roadmapItems = mysqlTable("roadmap_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 255 }).default("planned"), // planned | in_progress | completed
  priority: varchar("priority", { length: 255 }).default("medium"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const experiments = mysqlTable("experiments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("active"),
  config: text("config"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const simulations = mysqlTable("simulations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  type: varchar("type", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("running"),
  results: text("results"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const trades = mysqlTable("trades", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  assetId: varchar("asset_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(), // buy | sell
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  price: decimal("price", { precision: 38, scale: 18 }).notNull(),
  status: varchar("status", { length: 255 }).default("completed"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingNotifications = mysqlTable("dating_notifications", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  metadata: text("metadata"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingMessages = mysqlTable("dating_messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  matchId: varchar("match_id", { length: 255 }).notNull(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingBlocks = mysqlTable("dating_blocks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  blockedUserId: varchar("blocked_user_id", { length: 255 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingPreferences = mysqlTable("dating_preferences", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  minAge: int("min_age").default(18),
  maxAge: int("max_age").default(99),
  maxDistance: int("max_distance").default(50),
  genders: text("genders"), // JSON string
  interests: text("interests"), // JSON string
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const mfaRecoveryCodes = mysqlTable("mfa_recovery_codes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  code: varchar("code", { length: 255 }).notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const auditLedger = mysqlTable("audit_ledger", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tokenEmissionCaps = mysqlTable("token_emission_caps", {
  id: varchar("id", { length: 255 }).primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  capAmount: decimal("cap_amount", { precision: 38, scale: 18 }).notNull(),
  currentIssued: decimal("current_issued", { precision: 38, scale: 18 }).default("0"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tokenMarketState = mysqlTable("token_market_state", {
  id: varchar("id", { length: 255 }).primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  price: decimal("price", { precision: 38, scale: 18 }).notNull(),
  volume24h: decimal("volume_24h", { precision: 38, scale: 18 }).default("0"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const communityMembers = mysqlTable("community_members", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  communityId: varchar("community_id", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).default("member"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const directMessages = mysqlTable("direct_messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  receiverId: varchar("receiver_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const payouts = mysqlTable("payouts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  quantity: int("quantity").default(1),
  status: varchar("status", { length: 255 }).default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const codebaseSprints = mysqlTable("codebase_sprints", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sprintNumber: int("sprint_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sprintTasks = mysqlTable("sprint_tasks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sprintId: varchar("sprint_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sprintMetrics = mysqlTable("sprint_metrics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sprintId: varchar("sprint_id", { length: 255 }).notNull(),
  metricName: varchar("metric_name", { length: 255 }).notNull(),
  value: decimal("value", { precision: 38, scale: 18 }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const marketplaceListings = mysqlTable("marketplace_listings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 38, scale: 18 }).notNull(),
  status: varchar("status", { length: 255 }).default("active"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
