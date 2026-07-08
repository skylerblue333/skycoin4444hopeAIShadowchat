
import { mysqlTable, varchar, text, int, float, boolean, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// Type exports for all tables
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Stream = typeof streams.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type TokenBalance = typeof tokenBalances.$inferSelect;

// ============ USERS TABLE ============
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  openId: varchar("open_id", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  username: varchar("username", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  bio: varchar("bio", { length: 255 }),
  avatar: varchar("avatar", { length: 255 }),
  balance: float("balance").default(0),
  role: varchar("role", { length: 255 }).default("user"), // admin | user
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Export User type for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ POSTS TABLE ============
export const posts = mysqlTable("posts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
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
  postId: varchar("post_id", { length: 255 }).references(() => posts.id),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  content: varchar("content", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ LIKES TABLE ============
export const likes = mysqlTable("likes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  postId: varchar("post_id", { length: 255 }).references(() => posts.id),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ PRODUCTS TABLE ============
export const products = mysqlTable("products", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  description: varchar("description", { length: 255 }),
  price: float("price"),
  category: varchar("category", { length: 255 }),
  image: varchar("image", { length: 255 }),
  stock: int("stock"),
  sellerId: varchar("seller_id", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ ORDERS TABLE ============
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  productId: varchar("product_id", { length: 255 }).references(() => products.id),
  quantity: int("quantity"),
  total: float("total"),
  status: varchar("status", { length: 255 }), // pending | shipped | delivered | cancelled
  shippingAddress: varchar("shipping_address", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ STREAMS TABLE ============
export const streams = mysqlTable("streams", {
  id: varchar("id", { length: 255 }).primaryKey(),
  streamerId: varchar("streamer_id", { length: 255 }).references(() => users.id),
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
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  type: varchar("type", { length: 255 }), // deposit | withdrawal | transfer | purchase
  amount: float("amount"),
  toUserId: varchar("to_user_id", { length: 255 }).references(() => users.id),
  status: varchar("status", { length: 255 }), // pending | completed | failed
  txHash: varchar("tx_hash", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ WALLETS TABLE ============
export const wallets = mysqlTable("wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  address: varchar("address", { length: 255 }),
  balance: float("balance").default(0),
  currency: varchar("currency", { length: 255 }), // BTC | ETH | SOL | DOGE | SKY444
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ FOLLOWS TABLE ============
export const follows = mysqlTable("follows", {
  id: varchar("id", { length: 255 }).primaryKey(),
  followerId: varchar("follower_id", { length: 255 }).references(() => users.id),
  followingId: varchar("following_id", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ NOTIFICATIONS TABLE ============
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  type: varchar("type", { length: 255 }), // like | comment | follow | message | order
  content: varchar("content", { length: 255 }),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ MESSAGES TABLE ============
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  senderId: varchar("sender_id", { length: 255 }).references(() => users.id),
  recipientId: varchar("recipient_id", { length: 255 }).references(() => users.id),
  content: varchar("content", { length: 255 }),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ REVIEWS TABLE ============
export const reviews = mysqlTable("reviews", {
  id: varchar("id", { length: 255 }).primaryKey(),
  productId: varchar("product_id", { length: 255 }).references(() => products.id),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  rating: int("rating"), // 1-5
  comment: varchar("comment", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ RELATIONS ============
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  orders: many(orders),
  products: many(products),
  streams: many(streams),
  wallets: many(wallets),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  comments: many(comments),
  likes: many(likes),
}));


// ============ AUDIT LEDGER TABLE ============
export const auditLedger = mysqlTable("audit_ledger", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
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
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 255 }).notNull(), // BTC, ETH, SOL, DOGE, SKY444
  balance: float("balance").default(0),
  lockedBalance: float("locked_balance").default(0),
  stakedBalance: float("staked_balance").default(0),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ USER BEHAVIOR SIGNALS TABLE ============
export const userBehaviorSignals = mysqlTable("user_behavior_signals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  signalType: varchar("signal_type", { length: 255 }).notNull(), // login | purchase | post | comment | follow | etc
  value: float("value").default(0),
  metadata: varchar("metadata", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});


// ============ DATING SYSTEM TABLES ============
export const datingProfiles = mysqlTable("dating_profiles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
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
  userId1: varchar("user_id_1", { length: 255 }).references(() => users.id).notNull(),
  userId2: varchar("user_id_2", { length: 255 }).references(() => users.id).notNull(),
  status: varchar("status", { length: 255 }).default("pending"), // pending | matched | rejected
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingLikes = mysqlTable("dating_likes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  likedUserId: varchar("liked_user_id", { length: 255 }).references(() => users.id).notNull(),
  type: varchar("type", { length: 255 }).default("like"), // like | superlike
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingMessages = mysqlTable("dating_messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  matchId: varchar("match_id", { length: 255 }).references(() => datingMatches.id).notNull(),
  senderId: varchar("sender_id", { length: 255 }).references(() => users.id).notNull(),
  content: varchar("content", { length: 255 }).notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingSubscriptions = mysqlTable("dating_subscriptions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  tier: varchar("tier", { length: 255 }).default("free"), // free | premium | vip
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingPreferences = mysqlTable("dating_preferences", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  minAge: int("min_age").default(18),
  maxAge: int("max_age").default(65),
  maxDistance: int("max_distance").default(50),
  genderPreference: varchar("gender_preference", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingNotifications = mysqlTable("dating_notifications", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  type: varchar("type", { length: 255 }).notNull(), // match | message | like
  relatedUserId: varchar("related_user_id", { length: 255 }),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingBlocks = mysqlTable("dating_blocks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  blockedUserId: varchar("blocked_user_id", { length: 255 }).references(() => users.id).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const datingReports = mysqlTable("dating_reports", {
  id: varchar("id", { length: 255 }).primaryKey(),
  reporterId: varchar("reporter_id", { length: 255 }).references(() => users.id).notNull(),
  reportedUserId: varchar("reported_user_id", { length: 255 }).references(() => users.id).notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending"), // pending | reviewed | resolved
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ FRAUD & SECURITY TABLES ============
export const fraudSignals = mysqlTable("fraud_signals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  signalType: varchar("signal_type", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 255 }).default("low"), // low | medium | high | critical
  details: varchar("details", { length: 255 }),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const rateLimitBuckets = mysqlTable("rate_limit_buckets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  count: int("count").default(0),
  resetAt: timestamp("reset_at"),
});

// ============ WALLET & TRANSACTION TABLES ============
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  walletId: varchar("wallet_id", { length: 255 }).references(() => wallets.id).notNull(),
  type: varchar("type", { length: 255 }).notNull(), // deposit | withdrawal | transfer | swap
  amount: float("amount").notNull(),
  fee: float("fee").default(0),
  status: varchar("status", { length: 255 }).default("pending"), // pending | confirmed | failed
  txHash: varchar("tx_hash", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const walletAuditLog = mysqlTable("wallet_audit_log", {
  id: varchar("id", { length: 255 }).primaryKey(),
  walletId: varchar("wallet_id", { length: 255 }).references(() => wallets.id).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: varchar("details", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const custodyWallets = mysqlTable("custody_wallets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(), // coinbase | kraken | etc
  externalId: varchar("external_id", { length: 255 }).notNull(),
  balance: float("balance").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const onChainTransactions = mysqlTable("on_chain_transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  blockchain: varchar("blockchain", { length: 255 }).notNull(), // ethereum | solana | bitcoin
  txHash: varchar("tx_hash", { length: 255 }).notNull(),
  fromAddress: varchar("from_address", { length: 255 }),
  toAddress: varchar("to_address", { length: 255 }),
  amount: float("amount"),
  status: varchar("status", { length: 255 }).default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ TOKEN & ECONOMY TABLES ============
export const tokenMarketState = mysqlTable("token_market_state", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenSymbol: varchar("token_symbol", { length: 255 }).notNull(),
  price: float("price").notNull(),
  marketCap: float("market_cap"),
  volume24h: float("volume_24h"),
  circulatingSupply: float("circulating_supply"),
  totalSupply: float("total_supply"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tokenEmissionCaps = mysqlTable("token_emission_caps", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tokenSymbol: varchar("token_symbol", { length: 255 }).notNull(),
  maxEmission: float("max_emission"),
  currentEmission: float("current_emission"),
  emissionRate: float("emission_rate"),
  lastAdjustedAt: timestamp("last_adjusted_at"),
});

export const userArchetypes = mysqlTable("user_archetypes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  archetype: varchar("archetype", { length: 255 }).notNull(), // trader | hodler | miner | creator | etc
  score: float("score").default(0),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============ GOVERNANCE & MODERATION TABLES ============
export const governanceProposals = mysqlTable("governance_proposals", {
  id: varchar("id", { length: 255 }).primaryKey(),
  proposerId: varchar("proposer_id", { length: 255 }).references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  status: varchar("status", { length: 255 }).default("active"), // active | passed | failed | executed
  votesFor: int("votes_for").default(0),
  votesAgainst: int("votes_against").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  expiresAt: timestamp("expires_at"),
});

export const governanceVotes = mysqlTable("governance_votes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  proposalId: varchar("proposal_id", { length: 255 }).references(() => governanceProposals.id).notNull(),
  voterId: varchar("voter_id", { length: 255 }).references(() => users.id).notNull(),
  vote: varchar("vote", { length: 255 }).notNull(), // for | against
  weight: float("weight").default(1),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const moderationLogs = mysqlTable("moderation_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  moderatorId: varchar("moderator_id", { length: 255 }).references(() => users.id),
  targetUserId: varchar("target_user_id", { length: 255 }).references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(), // warn | mute | ban | delete
  reason: varchar("reason", { length: 255 }),
  duration: int("duration"), // in seconds, null for permanent
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const platformMetrics = mysqlTable("platform_metrics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  metricType: varchar("metric_type", { length: 255 }).notNull(), // dau | mau | tvl | volume
  value: float("value").notNull(),
  timestamp: timestamp("timestamp").default(new Date()),
});
