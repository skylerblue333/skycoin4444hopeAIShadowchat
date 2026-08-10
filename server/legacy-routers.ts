import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ============ SOCIAL ROUTER ============
export const socialRouter = router({
  getFeed: publicProcedure.input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => db.getPosts(input.limit, input.offset)),
  getTrending: publicProcedure.query(async () => []),
  getUserPosts: publicProcedure.input(z.object({ userId: z.string().optional() }).optional()).query(async ({ input }) => {
    if (!input?.userId) return [];
    return db.getPostsByUser(input.userId);
  }),
  getCreatorPosts: publicProcedure.query(async () => []),
  getComments: publicProcedure.input(z.object({ postId: z.string().optional() }).optional()).query(async ({ input }) => {
    if (!input?.postId) return [];
    return db.getComments(input.postId);
  }),
  likes: publicProcedure.input(z.object({ postId: z.string() })).query(async ({ input }) => {
    const likes = await db.getLikes(input.postId);
    return { count: likes.length, liked: false };
  }),
  toggleLike: protectedProcedure.input(z.object({ postId: z.string() })).mutation(async ({ ctx, input }) => {
    await db.createLike(input.postId, ctx.user.id);
    return { liked: true };
  }),
  followUser: protectedProcedure.input(z.object({ userId: z.string() })).mutation(async ({ ctx, input }) => {
    await db.createFollow(ctx.user.id, input.userId);
    return { following: true };
  }),
  getFollowers: publicProcedure.input(z.object({ userId: z.string().optional() })).query(async ({ input }) => {
    if (!input?.userId) return [];
    return db.getFollowers(input.userId);
  }),
  getFollowing: publicProcedure.input(z.object({ userId: z.string().optional() })).query(async ({ input }) => {
    if (!input?.userId) return [];
    return db.getFollowing(input.userId);
  }),
  engagement: publicProcedure.query(async () => ({ likes: 0, comments: 0, shares: 0 })),
  getUserProfile: publicProcedure.input(z.object({ userId: z.string().optional() }).optional()).query(async ({ input }) => {
    if (!input?.userId) return null;
    return db.getUserById(input.userId);
  }),
  getUserStats: publicProcedure.input(z.object({ userId: z.string().optional() }).optional()).query(async ({ input }) => {
    if (!input?.userId) return { posts: 0, followers: 0, following: 0, engagement: 0 };
    return { posts: 0, followers: 0, following: 0, engagement: 0 };
  }),
});

// ============ EXPLORE ROUTER ============
export const exploreRouter = router({
  search: publicProcedure.input(z.object({ q: z.string() })).query(async ({ input }) => {
    return db.searchPosts(input.q);
  }),
  getTrending: publicProcedure.query(async () => []),
  globalSearch: publicProcedure.input(z.object({ q: z.string() })).query(async ({ input }) => {
    const [users, posts] = await Promise.all([
      db.searchUsers(input.q),
      db.searchPosts(input.q),
    ]);
    return { users, posts, communities: [] };
  }),
  searchSuggestions: publicProcedure.input(z.object({ q: z.string() })).query(async () => []),
  trendingSearches: publicProcedure.query(async () => []),
  discoverContent: publicProcedure.query(async () => db.getPosts(20, 0)),
  discoverUsers: publicProcedure.query(async () => []),
});
