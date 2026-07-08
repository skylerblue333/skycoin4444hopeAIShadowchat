import { mysqlTable, varchar, decimal, int, boolean, timestamp, text } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";



// ============ USERS TABLE ============
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  username: varchar("username", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  bio: varchar("bio", { length: 255 }),
  avatar: varchar("avatar", { length: 255 }),
  balance: decimal("balance", { precision: 38, scale: 18 }).default(0),
  role: varchar("role", { length: 255 }).default("user"), // user | creator | merchant | moderator | admin | treasury
  mfaSecret: varchar("mfa_secret", { length: 255 }),
  mfaEnabled: boolean("mfa_enabled").default(false),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ POSTS TABLE ============
export const posts = mysqlTable("posts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  content: varchar("content", { length: 255 }),
  media: varchar("media", { length: 255 }),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ COMMENTS TABLE ============
export const comments = mysqlTable("comments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  postId: varchar("post_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  content: varchar("content", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ LIKES TABLE ============
export const likes = mysqlTable("likes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  postId: varchar("post_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ PRODUCTS TABLE ============
export const products = mysqlTable("products", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  description: varchar("description", { length: 255 }),
  price: decimal("price", { precision: 38, scale: 18 }),
  category: varchar("category", { length: 255 }),
  image: varchar("image", { length: 255 }),
  stock: int("stock"),
  sellerId: varchar("seller_id", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ ORDERS TABLE ============
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  productId: varchar("product_id", { length: 255 }),
  quantity: int("quantity"),
  total: decimal("total", { precision: 38, scale: 18 }),
  status: varchar("status", { length: 255 }), // pending | shipped | delivered | cancelled
  shippingAddress: varchar("shipping_address", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ STREAMS TABLE ============
export const streams = mysqlTable("streams", {
  id: varchar("id", { length: 255 }).primaryKey(),
  streamerId: varchar("streamer_id", { length: 255 }),
  title: varchar("title", { length: 255 }),
  description: varchar("description", { length: 255 }),
  status: varchar("status", { length: 255 }), // live | ended | scheduled
  viewers: int("viewers").default(0),
  hlsUrl: varchar("hls_url", { length: 255 }),
  archiveUrl: varchar("archive_url", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ TRANSACTIONS TABLE ============
export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  type: varchar("type", { length: 255 }), // deposit | withdrawal | transfer | purchase
  amount: decimal("amount", { precision: 38, scale: 18 }),
  toUserId: varchar("to_user_id", { length: 255 }),
  status: varchar("status", { length: 255 }), // pending | completed | failed
  txHash: varchar("tx_hash", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ WALLETS TABLE ============
export const wallets = mysqlTable("wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  address: varchar("address", { length: 255 }),
  balance: decimal("balance", { precision: 38, scale: 18 }).default(0),
  currency: varchar("currency", { length: 255 }), // BTC | ETH | SOL | DOGE | SKY444
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ FOLLOWS TABLE ============
export const follows = mysqlTable("follows", {
  id: varchar("id", { length: 255 }).primaryKey(),
  followerId: varchar("follower_id", { length: 255 }),
  followingId: varchar("following_id", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ NOTIFICATIONS TABLE ============
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  type: varchar("type", { length: 255 }), // like | comment | follow | message | order
  content: varchar("content", { length: 255 }),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ MESSAGES TABLE ============
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  senderId: varchar("sender_id", { length: 255 }),
  recipientId: varchar("recipient_id", { length: 255 }),
  content: varchar("content", { length: 255 }),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ REVIEWS TABLE ============
export const reviews = mysqlTable("reviews", {
  id: varchar("id", { length: 255 }).primaryKey(),
  productId: varchar("product_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  rating: int("rating"), // 1-5
  comment: varchar("comment", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ AUDIT LEDGER TABLE ============
export const auditLedger = mysqlTable("audit_ledger", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  eventType: varchar("event_type", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: varchar("details", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 255 }),
  userAgent: varchar("user_agent", { length: 255 }),
  status: varchar("status", { length: 255 }).default("success"), // success | failed | pending
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ TOKEN BALANCES TABLE ============
export const tokenBalances = mysqlTable("token_balances", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 255 }).notNull(), // BTC, ETH, SOL, DOGE, SKY444
  balance: decimal("balance", { precision: 38, scale: 18 }).default(0),
  lockedBalance: decimal("locked_balance", { precision: 38, scale: 18 }).default(0),
  stakedBalance: decimal("staked_balance", { precision: 38, scale: 18 }).default(0),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ USER BEHAVIOR SIGNALS TABLE ============
export const userBehaviorSignals = mysqlTable("user_behavior_signals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  signalType: varchar("signal_type", { length: 255 }).notNull(), // login | purchase | post | comment | follow | etc
  value: decimal("value", { precision: 38, scale: 18 }).default(0),
  metadata: varchar("metadata", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ DATING SYSTEM TABLES ============
export const datingProfiles = mysqlTable("dating_profiles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  bio: varchar("bio", { length: 255 }),
  photos: varchar("photos", { length: 255 }), // JSON array
  interests: varchar("interests", { length: 255 }), // JSON array
  location: varchar("location", { length: 255 }),
  age: int("age"),
  gender: varchar("gender", { length: 255 }),
  lookingFor: varchar("looking_for", { length: 255 }),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingMatches = mysqlTable("dating_matches", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId1: varchar("user_id_1", { length: 255 }).notNull(),
  userId2: varchar("user_id_2", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending"), // pending | matched | rejected
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingLikes = mysqlTable("dating_likes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  likedUserId: varchar("liked_user_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).default("like"), // like | superlike
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingMessages = mysqlTable("dating_messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  matchId: varchar("match_id", { length: 255 }).notNull(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  content: varchar("content", { length: 255 }).notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingSubscriptions = mysqlTable("dating_subscriptions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tier: varchar("tier", { length: 255 }).default("free"), // free | premium | vip
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingPreferences = mysqlTable("dating_preferences", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  minAge: int("min_age").default(18),
  maxAge: int("max_age").default(65),
  maxDistance: int("max_distance").default(50),
  genderPreference: varchar("gender_preference", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingNotifications = mysqlTable("dating_notifications", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(), // match | message | like
  relatedUserId: varchar("related_user_id", { length: 255 }),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingBlocks = mysqlTable("dating_blocks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  blockedUserId: varchar("blocked_user_id", { length: 255 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingReports = mysqlTable("dating_reports", {
  id: varchar("id", { length: 255 }).primaryKey(),
  reporterId: varchar("reporter_id", { length: 255 }).notNull(),
  reportedUserId: varchar("reported_user_id", { length: 255 }).notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending"), // pending | reviewed | resolved
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ FRAUD & SECURITY TABLES ============
export const fraudSignals = mysqlTable("fraud_signals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  signalType: varchar("signal_type", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 255 }).default("low"), // low | medium | high | critical
  details: varchar("details", { length: 255 }),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const rateLimitBuckets = mysqlTable("rate_limit_buckets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  count: int("count").default(0),
  resetAt: timestamp("reset_at"),
});

// ============ WALLET & TRANSACTION TABLES ============
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  walletId: varchar("wallet_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(), // deposit | withdrawal | transfer | swap
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  fee: decimal("fee", { precision: 38, scale: 18 }).default(0),
  status: varchar("status", { length: 255 }).default("pending"), // pending | confirmed | failed
  txHash: varchar("tx_hash", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const walletAuditLog = mysqlTable("wallet_audit_log", {
  id: varchar("id", { length: 255 }).primaryKey(),
  walletId: varchar("wallet_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: varchar("details", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const custodyWallets = mysqlTable("custody_wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  address: varchar("address", { length: 255 }),
  publicKey: varchar("public_key", { length: 255 }),
  privateKey: varchar("private_key", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ GOVERNANCE TABLES ============
export const governanceProposals = mysqlTable("governance_proposals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  proposerId: varchar("proposer_id", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 255 }).default("pending"), // pending | approved | rejected | executed
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  votingEndsAt: timestamp("voting_ends_at").notNull(),
});

export const governanceVotes = mysqlTable("governance_votes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  proposalId: varchar("proposal_id", { length: 255 }).notNull(),
  voterId: varchar("voter_id", { length: 255 }).notNull(),
  vote: varchar("vote", { length: 255 }).notNull(), // yes | no | abstain
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ ON-CHAIN TRANSACTIONS TABLE ============
export const onChainTransactions = mysqlTable("on_chain_transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  txHash: varchar("tx_hash", { length: 255 }).notNull().unique(),
  fromAddress: varchar("from_address", { length: 255 }).notNull(),
  toAddress: varchar("to_address", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 38, scale: 18 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending"), // pending | confirmed | failed
  blockNumber: int("block_number"),
  gasUsed: decimal("gas_used", { precision: 38, scale: 18 }),
  gasPrice: decimal("gas_price", { precision: 38, scale: 18 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ PLATFORM METRICS TABLE ============
export const platformMetrics = mysqlTable("platform_metrics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  metricName: varchar("metric_name", { length: 255 }).notNull(),
  value: decimal("value", { precision: 38, scale: 18 }).notNull(),
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`),
  metadata: varchar("metadata", { length: 255 }),
});

// ============ TOKEN EMISSION CAPS TABLE ============
export const tokenEmissionCaps = mysqlTable("token_emission_caps", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenSymbol: varchar("token_symbol", { length: 255 }).notNull().unique(),
  dailyCap: decimal("daily_cap", { precision: 38, scale: 18 }).notNull(),
  currentDayEmission: decimal("current_day_emission", { precision: 38, scale: 18 }).default(0),
  lastReset: timestamp("last_reset").default(sql`CURRENT_TIMESTAMP`),
});

// ============ TOKEN MARKET STATE TABLE ============
export const tokenMarketState = mysqlTable("token_market_state", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenSymbol: varchar("token_symbol", { length: 255 }).notNull().unique(),
  priceUSD: decimal("price_usd", { precision: 38, scale: 18 }).notNull(),
  marketCapUSD: decimal("market_cap_usd", { precision: 38, scale: 18 }).notNull(),
  volume24hUSD: decimal("volume_24h_usd", { precision: 38, scale: 18 }).notNull(),
  lastUpdated: timestamp("last_updated").default(sql`CURRENT_TIMESTAMP`),
});

// ============ USER ARCHETYPES TABLE ============
export const userArchetypes = mysqlTable("user_archetypes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  archetype: varchar("archetype", { length: 255 }).notNull(), // e.g., "early_adopter", "gamer", "trader"
  score: decimal("score").default(0),
  lastEvaluated: timestamp("last_evaluated").default(sql`CURRENT_TIMESTAMP`),
});

// ============ SPRINT MANAGEMENT TABLES ============
export const codebaseSprints = mysqlTable("codebase_sprints", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sprintNumber: int("sprint_number").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 255 }).default("planning"), // planning | active | completed | archived
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  goals: text("goals"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sprintTasks = mysqlTable("sprint_tasks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sprintId: varchar("sprint_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assigneeId: varchar("assignee_id", { length: 255 }),
  status: varchar("status", { length: 255 }).default("todo"), // todo | in_progress | review | done
  priority: varchar("priority", { length: 255 }).default("medium"), // low | medium | high | critical
  estimatedHours: int("estimated_hours"),
  actualHours: int("actual_hours"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sprintMetrics = mysqlTable("sprint_metrics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sprintId: varchar("sprint_id", { length: 255 }).notNull(),
  metricName: varchar("metric_name", { length: 255 }).notNull(),
  metricValue: decimal("metric_value").notNull(),
  metricUnit: varchar("metric_unit", { length: 255 }),
  recordedAt: timestamp("recorded_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ MFA RECOVERY CODES TABLE ============
export const mfaRecoveryCodes = mysqlTable("mfa_recovery_codes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  code: varchar("code", { length: 255 }).notNull(),
  used: boolean("used").default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
