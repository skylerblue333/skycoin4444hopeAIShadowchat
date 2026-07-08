import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  polls, pollVotes, events, eventRsvps, audioRooms,
  storyHighlights, bookmarks, reactions,
  broadcastChannels, broadcastSubscriptions, broadcastMessages,
  directMessages,
} from "../drizzle";
import { eq, desc, and, sql, or } from "drizzle-orm";

export const social44Router = router({
  // POLLS
  createPoll: protectedProcedure
    .input(z.object({
      postId: z.number(),
      question: z.string().min(3).max(300),
      options: z.array(z.string().min(1).max(100)).min(2).max(6),
      endsInHours: z.number().min(1).max(168).default(24),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const endsAt = new Date(Date.now() + input.endsInHours * 3600 * 1000);
      const [r] = await db.insert(polls).values({
        postId: input.postId,
        question: input.question,
        options: JSON.stringify(input.options.map((o, i) => ({ index: i, text: o, votes: 0 }))),
        endsAt,
      });
      return { success: true, pollId: (r as any).insertId };
    }),

  getPolls: publicProcedure
    .input(z.object({ postId: z.number().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(polls)
        .where(input.postId ? eq(polls.postId, input.postId) : sql`1=1`)
        .orderBy(desc(polls.createdAt)).limit(input.limit);
      return rows.map(p => ({ ...p, options: typeof p.options === "string" ? JSON.parse(p.options) : p.options }));
    }),

  votePoll: protectedProcedure
    .input(z.object({ pollId: z.number(), optionIndex: z.number().min(0).max(5) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db.select().from(pollVotes)
        .where(and(eq(pollVotes.pollId, input.pollId), eq(pollVotes.userId, ctx.user.id)));
      if (existing.length > 0) throw new Error("Already voted");
      await db.insert(pollVotes).values({ pollId: input.pollId, userId: ctx.user.id, optionIndex: input.optionIndex });
      const [poll] = await db.select().from(polls).where(eq(polls.id, input.pollId));
      if (poll) {
        const opts = typeof poll.options === "string" ? JSON.parse(poll.options) : (poll.options as any[]);
        if (opts[input.optionIndex]) opts[input.optionIndex].votes += 1;
        await db.update(polls).set({ options: JSON.stringify(opts) }).where(eq(polls.id, input.pollId));
      }
      return { success: true };
    }),

  // EVENTS
  createEvent: protectedProcedure
    .input(z.object({
      title: z.string().min(3).max(200),
      description: z.string().max(2000).optional(),
      startsAt: z.date(),
      endsAt: z.date().optional(),
      location: z.string().max(300).optional(),
      isOnline: z.boolean().default(false),
      maxAttendees: z.number().optional(),
      streamUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [r] = await db.insert(events).values({
        hostId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        location: input.location ?? null,
        isOnline: input.isOnline,
        maxAttendees: input.maxAttendees ?? null,
        streamUrl: input.streamUrl ?? null,
        rsvpCount: 0,
      });
      return { success: true, eventId: (r as any).insertId };
    }),

  getEvents: publicProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(events).orderBy(desc(events.startsAt)).limit(input.limit).offset(input.offset);
    }),

  rsvpEvent: protectedProcedure
    .input(z.object({ eventId: z.number(), status: z.enum(["going", "maybe", "not_going"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(eventRsvps).values({ eventId: input.eventId, userId: ctx.user.id, status: input.status })
        .onDuplicateKeyUpdate({ set: { status: input.status } });
      if (input.status === "going") {
        await db.update(events).set({ rsvpCount: sql`rsvp_count + 1` }).where(eq(events.id, input.eventId));
      }
      return { success: true };
    }),

  // AUDIO ROOMS
  createAudioRoom: protectedProcedure
    .input(z.object({
      title: z.string().min(3).max(200),
      description: z.string().max(500).optional(),
      topic: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [r] = await db.insert(audioRooms).values({
        hostId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        topic: input.topic ?? null,
        status: "live",
        listenerCount: 0,
        speakerIds: JSON.stringify([ctx.user.id]),
        startedAt: new Date(),
      });
      return { success: true, roomId: (r as any).insertId };
    }),

  getAudioRooms: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(audioRooms)
        .where(eq(audioRooms.status, "live"))
        .orderBy(desc(audioRooms.listenerCount)).limit(input.limit);
    }),

  joinAudioRoom: protectedProcedure
    .input(z.object({ roomId: z.number(), asSpeaker: z.boolean().default(false) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(audioRooms).set({ listenerCount: sql`listener_count + 1` })
        .where(eq(audioRooms.id, input.roomId));
      return { success: true, role: input.asSpeaker ? "speaker" : "listener" };
    }),

  // STORY HIGHLIGHTS
  createHighlight: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(50),
      coverImage: z.string().optional(),
      storyIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [r] = await db.insert(storyHighlights).values({
        userId: ctx.user.id,
        title: input.title,
        coverImage: input.coverImage ?? null,
        storyIds: JSON.stringify(input.storyIds),
      });
      return { success: true, highlightId: (r as any).insertId };
    }),

  getHighlights: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(storyHighlights)
        .where(eq(storyHighlights.userId, input.userId))
        .orderBy(desc(storyHighlights.createdAt));
    }),

  // BOOKMARKS
  getBookmarks: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(bookmarks)
        .where(eq(bookmarks.userId, ctx.user.id))
        .orderBy(desc(bookmarks.createdAt))
        .limit(input.limit).offset(input.offset);
    }),

  addBookmark: protectedProcedure
    .input(z.object({ postId: z.number(), collectionName: z.string().default("Saved") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(bookmarks).values({ userId: ctx.user.id, postId: input.postId, collectionName: input.collectionName })
        .onDuplicateKeyUpdate({ set: { collectionName: input.collectionName } });
      return { success: true };
    }),

  removeBookmark: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(bookmarks).where(and(eq(bookmarks.userId, ctx.user.id), eq(bookmarks.postId, input.postId)));
      return { success: true };
    }),

  // REACTIONS
  getReactions: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(reactions).where(eq(reactions.postId, input.postId));
    }),

  addReaction: protectedProcedure
    .input(z.object({ postId: z.number(), emoji: z.string().max(10) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(reactions).values({ userId: ctx.user.id, postId: input.postId, emoji: input.emoji })
        .onDuplicateKeyUpdate({ set: { emoji: input.emoji } });
      return { success: true };
    }),

  removeReaction: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(reactions).where(and(eq(reactions.userId, ctx.user.id), eq(reactions.postId, input.postId)));
      return { success: true };
    }),

  // BROADCAST CHANNELS
  createBroadcastChannel: protectedProcedure
    .input(z.object({ name: z.string().min(3).max(100), description: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [r] = await db.insert(broadcastChannels).values({
        ownerId: ctx.user.id,
        name: input.name,
        description: input.description ?? null,
        subscriberCount: 0,
        isVerified: false,
      });
      return { success: true, channelId: (r as any).insertId };
    }),

  getBroadcastChannels: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(broadcastChannels).orderBy(desc(broadcastChannels.subscriberCount)).limit(input.limit);
    }),

  subscribeBroadcast: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(broadcastSubscriptions).values({ channelId: input.channelId, userId: ctx.user.id })
        .onDuplicateKeyUpdate({ set: { channelId: input.channelId } });
      await db.update(broadcastChannels).set({ subscriberCount: sql`subscriber_count + 1` })
        .where(eq(broadcastChannels.id, input.channelId));
      return { success: true };
    }),

  sendBroadcastMessage: protectedProcedure
    .input(z.object({ channelId: z.number(), content: z.string().min(1).max(4000), mediaUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [r] = await db.insert(broadcastMessages).values({
        channelId: input.channelId,
        content: input.content,
        mediaUrl: input.mediaUrl ?? null,
        reactionCount: 0,
        viewCount: 0,
      });
      return { success: true, messageId: (r as any).insertId };
    }),

  // DIRECT MESSAGES
  sendDM: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      content: z.string().min(1).max(4000),
      mediaUrl: z.string().optional(),
      isDisappearing: z.boolean().default(false),
      disappearsInMinutes: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const disappearsAt = input.isDisappearing && input.disappearsInMinutes
        ? new Date(Date.now() + input.disappearsInMinutes * 60 * 1000)
        : null;
      const [r] = await db.insert(directMessages).values({
        senderId: ctx.user.id,
        recipientId: input.recipientId,
        content: input.content,
        mediaUrl: input.mediaUrl ?? null,
        isDisappearing: input.isDisappearing,
        disappearsAt,
        deletedBySender: false,
        deletedByRecipient: false,
      });
      return { success: true, messageId: (r as any).insertId };
    }),

  getDMs: protectedProcedure
    .input(z.object({ withUserId: z.number(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(directMessages)
        .where(or(
          and(eq(directMessages.senderId, ctx.user.id), eq(directMessages.recipientId, input.withUserId)),
          and(eq(directMessages.senderId, input.withUserId), eq(directMessages.recipientId, ctx.user.id))
        ))
        .orderBy(desc(directMessages.createdAt)).limit(input.limit);
    }),
});
