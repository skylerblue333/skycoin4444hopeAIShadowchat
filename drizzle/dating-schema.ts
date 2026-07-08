import { sqliteTable, text, integer, real, timestamp, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { users } from './schema';

/**
 * Dating System Database Schema
 * Comprehensive dating/social matching platform
 */

// User Dating Profiles
export const datingProfiles = sqliteTable('dating_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  age: integer('age'),
  gender: text('gender'), // 'male', 'female', 'non-binary', 'other'
  interestedIn: text('interested_in'), // JSON array of genders
  location: text('location'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  profileImageUrl: text('profile_image_url'),
  galleryImages: text('gallery_images'), // JSON array of image URLs
  interests: text('interests'), // JSON array of interests/tags
  verificationStatus: text('verification_status').default('unverified'), // 'verified', 'unverified', 'suspended'
  isActive: integer('is_active').default(1),
  lastSeen: timestamp('last_seen'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Dating Preferences
export const datingPreferences = sqliteTable('dating_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  minAge: integer('min_age').default(18),
  maxAge: integer('max_age').default(99),
  maxDistance: integer('max_distance').default(50), // km
  lookingFor: text('looking_for'), // 'dating', 'relationship', 'friendship', 'casual'
  dealBreakers: text('deal_breakers'), // JSON array
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Matches (mutual likes)
export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  userId1: text('user_id_1').notNull(),
  userId2: text('user_id_2').notNull(),
  matchedAt: timestamp('matched_at').defaultNow(),
  status: text('status').default('matched'), // 'matched', 'unmatched', 'blocked'
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueMatch: uniqueIndex('unique_match').on(table.userId1, table.userId2),
}));

// Likes/Swipes
export const likes = sqliteTable('likes', {
  id: text('id').primaryKey(),
  fromUserId: text('from_user_id').notNull(),
  toUserId: text('to_user_id').notNull(),
  likeType: text('like_type').default('like'), // 'like', 'superlike', 'pass'
  createdAt: timestamp('created_at').defaultNow(),
});

// Messages
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull(),
  fromUserId: text('from_user_id').notNull(),
  toUserId: text('to_user_id').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  isRead: integer('is_read').default(0),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Conversations (match chat rooms)
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().unique(),
  userId1: text('user_id_1').notNull(),
  userId2: text('user_id_2').notNull(),
  lastMessage: text('last_message'),
  lastMessageAt: timestamp('last_message_at'),
  unreadCount1: integer('unread_count_1').default(0),
  unreadCount2: integer('unread_count_2').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Blocks
export const blocks = sqliteTable('blocks', {
  id: text('id').primaryKey(),
  blockerId: text('blocker_id').notNull(),
  blockedId: text('blocked_id').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Reports (for safety)
export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').notNull(),
  reportedUserId: text('reported_user_id').notNull(),
  reason: text('reason').notNull(), // 'inappropriate', 'fake', 'harassment', 'spam', 'other'
  description: text('description'),
  status: text('status').default('pending'), // 'pending', 'investigating', 'resolved', 'dismissed'
  createdAt: timestamp('created_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// Favorites
export const favorites = sqliteTable('favorites', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  favoriteUserId: text('favorite_user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Activity Log
export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(), // 'viewed', 'liked', 'messaged', 'matched', 'unmatched'
  targetUserId: text('target_user_id'),
  metadata: text('metadata'), // JSON
  createdAt: timestamp('created_at').defaultNow(),
});

// Verification Codes
export const verificationCodes = sqliteTable('verification_codes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  code: text('code').notNull(),
  type: text('type').notNull(), // 'email', 'phone', 'photo'
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: integer('is_used').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subscriptions (premium features)
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  planType: text('plan_type').default('free'), // 'free', 'premium', 'vip'
  expiresAt: timestamp('expires_at'),
  autoRenew: integer('auto_renew').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const datingProfilesRelations = relations(datingProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [datingProfiles.userId],
    references: [users.id],
  }),
  preferences: one(datingPreferences, {
    fields: [datingProfiles.userId],
    references: [datingPreferences.userId],
  }),
  matches: many(matches),
  likes: many(likes),
  messages: many(messages),
  blocks: many(blocks),
  subscription: one(subscriptions, {
    fields: [datingProfiles.userId],
    references: [subscriptions.userId],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  user1: one(datingProfiles, {
    fields: [matches.userId1],
    references: [datingProfiles.userId],
  }),
  user2: one(datingProfiles, {
    fields: [matches.userId2],
    references: [datingProfiles.userId],
  }),
  messages: many(messages),
  conversation: one(conversations, {
    fields: [matches.id],
    references: [conversations.matchId],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  match: one(matches, {
    fields: [conversations.matchId],
    references: [matches.id],
  }),
  messages: many(messages),
}));

export default {
  datingProfiles,
  datingPreferences,
  matches,
  likes,
  messages,
  conversations,
  blocks,
  reports,
  favorites,
  activityLog,
  verificationCodes,
  subscriptions,
};
