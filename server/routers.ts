import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import bcrypt from "bcrypt";
import { miningRouter } from "./mining";
import { voiceRouter } from "./voice-router";
import { enterpriseRouter } from "./enterprise-router";
import { aiRouter } from "./real-ai-engine-v2";
import * as db from "./db";
import { users, posts, transactions, products, orders, streams, comments, likes, wallets, notifications, messages, reviews, follows } from "../drizzle/schema";
import { eq, desc, and, or } from "drizzle-orm";

// ============ AUTH PROCEDURES ============
export const authRouter = router({
  signup: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.getUserByEmail(input.email);
      if (existing) throw new Error("Email already registered");
      
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await db.createUser({
        email: input.email,
        password: hashedPassword,
        name: input.name || input.email.split("@")[0],
      });
      
      const token = await sdk.createSessionToken(user);
      ctx.res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      return { user, token };
    }),
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user) throw new Error("Invalid email or password");
      
      const passwordMatch = await bcrypt.compare(input.password, user.password || "");
      if (!passwordMatch) throw new Error("Invalid email or password");
      
      const token = await sdk.createSessionToken(user);
      ctx.res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      return { user, token };
    }),
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    ctx.res.setHeader("Set-Cookie", `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    return { success: true };
  }),
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
});

// ============ USER PROCEDURES ============
export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserById(ctx.user.id);
  }),
  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().optional(), bio: z.string().optional(), avatar: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await db.getUserById(ctx.user.id);
      return { success: true };
    }),
  getProfile: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    return db.getUserById(input.userId);
  }),
  follow: protectedProcedure.input(z.object({ userId: z.string() })).mutation(async ({ ctx, input }) => {
    return { success: true };
  }),
  getFollowers: publicProcedure.input(z.object({ userId: z.string() })).query(async () => []),
  getStats: publicProcedure.input(z.object({ userId: z.string() })).query(async () => ({
    followers: 0, following: 0, posts: 0, earnings: 0
  })),
});

// ============ POST PROCEDURES ============
export const postRouter = router({
  list: publicProcedure.input(z.object({ limit: z.number().default(10), offset: z.number().default(0) }))
    .query(async ({ input }) => db.getPosts(input.limit, input.offset)),
  create: protectedProcedure.input(z.object({ content: z.string(), media: z.string().optional() }))
    .mutation(async ({ ctx, input }) => db.createPost(ctx.user.id, input.content, input.media)),
  like: protectedProcedure.input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  comment: protectedProcedure.input(z.object({ postId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  delete: protectedProcedure.input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  edit: protectedProcedure.input(z.object({ postId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
});

// ============ MARKETPLACE PROCEDURES ============
export const marketplaceRouter = router({
  listings: publicProcedure.input(z.object({ category: z.string().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => db.getProducts(input.limit, input.offset, input.category)),
  listProducts: publicProcedure.input(z.object({ category: z.string().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => db.getProducts(input.limit, input.offset, input.category)),
  getProduct: publicProcedure.input(z.object({ id: z.string() }))
    .query(async ({ input }) => db.getProductById(input.id)),
  createProduct: protectedProcedure.input(z.object({ name: z.string(), price: z.number(), category: z.string() }))
    .mutation(async ({ ctx, input }) => db.createProduct({ ...input, sellerId: ctx.user.id })),
  createOrder: protectedProcedure.input(z.object({ productId: z.string(), quantity: z.number(), shippingAddress: z.string() }))
    .mutation(async ({ ctx, input }) => db.createOrder({ ...input, userId: ctx.user.id, status: "pending" })),
  getOrders: protectedProcedure.query(async ({ ctx }) => db.getOrders(ctx.user.id)),
  updateOrderStatus: protectedProcedure.input(z.object({ orderId: z.string(), status: z.string() }))
    .mutation(async ({ input }) => db.updateOrderStatus(input.orderId, input.status)),
  addReview: protectedProcedure.input(z.object({ productId: z.string(), rating: z.number(), comment: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  placeOrder: protectedProcedure.input(z.object({ productId: z.string(), quantity: z.number() }))
    .mutation(async ({ ctx, input }) => ({ success: true, orderId: `order_${Date.now()}` })),
});

// ============ STREAMING PROCEDURES ============
export const streamRouter = router({
  live: publicProcedure.query(async () => []),
  create: protectedProcedure.input(z.object({ title: z.string(), description: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  sendChat: protectedProcedure.input(z.object({ streamId: z.string(), message: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  chat: publicProcedure.input(z.object({ streamId: z.string(), limit: z.number().default(100) }))
    .query(async () => []),
  donate: protectedProcedure.input(z.object({ streamId: z.string(), amount: z.number() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  endStream: protectedProcedure.input(z.object({ streamId: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
});

// ============ TRANSACTION PROCEDURES ============
export const transactionRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => db.getTransactions(ctx.user.id)),
  create: protectedProcedure.input(z.object({ type: z.string(), amount: z.number(), toUserId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => db.createTransaction({ ...input, userId: ctx.user.id, status: "completed" })),
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    return { balance: user?.balance || 0 };
  }),
});

// ============ WALLET PROCEDURES ============
export const walletRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => []),
  create: protectedProcedure.input(z.object({ currency: z.string(), address: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  getBalance: protectedProcedure.input(z.object({ currency: z.string() }))
    .query(async ({ ctx, input }) => ({ balance: 0 })),
  send: protectedProcedure.input(z.object({ currency: z.string(), amount: z.number(), toAddress: z.string() }))
    .mutation(async ({ ctx, input }) => ({ txHash: "0x..." })),
  receive: protectedProcedure.input(z.object({ currency: z.string() }))
    .query(async ({ ctx, input }) => ({ address: "..." })),
});

// ============ NOTIFICATION PROCEDURES ============
export const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => []),
  markAsRead: protectedProcedure.input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  delete: protectedProcedure.input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  getUnread: protectedProcedure.query(async ({ ctx }) => ({ count: 0 })),
});

// ============ MESSAGE PROCEDURES ============
export const messageRouter = router({
  list: protectedProcedure.input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => []),
  send: protectedProcedure.input(z.object({ recipientId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  markAsRead: protectedProcedure.input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
});

// ============ GAMING PROCEDURES ============
export const gamingRouter = router({
  play: protectedProcedure.input(z.object({ gameId: z.string(), bet: z.number() }))
    .mutation(async ({ ctx, input }) => ({ result: "win", earnings: input.bet * 2 })),
  getLeaderboard: publicProcedure.query(async () => []),
  getAchievements: protectedProcedure.query(async ({ ctx }) => []),
});

// ============ CONTENT PROCEDURES ============
export const contentRouter = router({
  createBlog: protectedProcedure.input(z.object({ title: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  uploadVideo: protectedProcedure.input(z.object({ title: z.string(), url: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  uploadPodcast: protectedProcedure.input(z.object({ title: z.string(), url: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  getContent: publicProcedure.query(async () => []),
});

// ============ ANALYTICS PROCEDURES ============
export const analyticsRouter = router({
  getDashboard: protectedProcedure.query(async ({ ctx }) => ({
    views: 0, clicks: 0, revenue: 0, users: 0
  })),
  getCharts: protectedProcedure.query(async ({ ctx }) => []),
  getReports: protectedProcedure.query(async ({ ctx }) => []),
});

// ============ ADMIN PROCEDURES ============
export const adminRouter = router({
  getUsers: protectedProcedure.query(async ({ ctx }) => []),
  banUser: protectedProcedure.input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  deleteContent: protectedProcedure.input(z.object({ contentId: z.string() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  getReports: protectedProcedure.query(async ({ ctx }) => []),
  getSystemStats: protectedProcedure.query(async ({ ctx }) => ({
    totalUsers: 0, totalTransactions: 0, totalRevenue: 0
  })),
});

// ============ GAMEFI PROCEDURES ============
export const gameFiRouter = router({
  seasonPass: publicProcedure.query(async () => ({
    id: "season-1",
    name: "Season 1: Genesis",
    level: 1,
    progress: 45,
    rewards: 1000,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })),
  leaderboard: publicProcedure.input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => [
      { rank: 1, username: "SkyMaster", score: 50000, earnings: 5000 },
      { rank: 2, username: "CryptoKing", score: 45000, earnings: 4500 },
      { rank: 3, username: "GameGod", score: 40000, earnings: 4000 },
    ]),
  quests: publicProcedure.query(async () => [
    { id: "q1", title: "First Trade", reward: 100, completed: false },
    { id: "q2", title: "Stake 100 SKY", reward: 500, completed: false },
    { id: "q3", title: "Invite 5 Friends", reward: 1000, completed: false },
  ]),
  tournaments: publicProcedure.query(async () => [
    { id: "t1", name: "Weekly Trading", prize: 10000, participants: 234, endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "t2", name: "Gaming Championship", prize: 50000, participants: 1200, endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
  ]),
});

// ============ SEARCH PROCEDURES ============
export const searchRouter = router({
  global: publicProcedure.input(z.object({ query: z.string() }))
    .query(async ({ input }) => ({ users: [], products: [], posts: [] })),
  users: publicProcedure.input(z.object({ query: z.string() }))
    .query(async ({ input }) => []),
  products: publicProcedure.input(z.object({ query: z.string() }))
    .query(async ({ input }) => []),
  posts: publicProcedure.input(z.object({ query: z.string() }))
    .query(async ({ input }) => []),
});

// ============ SETTINGS PROCEDURES ============
export const settingsRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => ({})),
  updateSettings: protectedProcedure.input(z.object({ key: z.string(), value: z.any() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
  getPrivacy: protectedProcedure.query(async ({ ctx }) => ({})),
  updatePrivacy: protectedProcedure.input(z.object({ key: z.string(), value: z.boolean() }))
    .mutation(async ({ ctx, input }) => ({ success: true })),
});

// ============ MAIN ROUTER ============
export const appRouter = router({
  auth: authRouter,
  platform: router({
    stats: publicProcedure.query(async () => ({
      totalUsers: 1250,
      totalPosts: 8945,
      totalCommunities: 42,
      onlineUsers: 347,
    })),
  }),
  mining: miningRouter,
  user: userRouter,
  post: postRouter,
  marketplace: marketplaceRouter,
  stream: streamRouter,
  transaction: transactionRouter,
  wallet: walletRouter,
  notification: notificationRouter,
  message: messageRouter,
  gaming: gamingRouter,
  content: contentRouter,
  analytics: analyticsRouter,
  admin: adminRouter,
  search: searchRouter,
  settings: settingsRouter,
  voice: voiceRouter,
  enterprise: enterpriseRouter,
  ai: aiRouter,
  gamefi: gameFiRouter,
});

export type AppRouter = typeof appRouter;
