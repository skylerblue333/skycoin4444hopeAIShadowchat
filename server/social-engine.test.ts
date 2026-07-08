import crypto from 'crypto';
/**
 * Social Engine Test Suite
 * Tests: feed ranking, trending, tips, follows, posts, comments
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  userId: number;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  createdAt: Date;
  isPremium: boolean;
  hasMedia: boolean;
  tags: string[];
}

interface User {
  id: number;
  name: string;
  followers: number;
  reputation: number;
  isVerified: boolean;
}

interface Tip {
  id: number;
  senderId: number;
  recipientId: number;
  amount: number;
  message?: string;
  postId?: number;
  createdAt: Date;
}

// ─── Feed Ranking Engine ──────────────────────────────────────────────────────

function rankPost(post: Post, author: User, viewerFollowsAuthor: boolean, nowMs: number): number {
  const ageHours = (nowMs - post.createdAt.getTime()) / (1000 * 60 * 60);
  const decayFactor = 1 / Math.pow(ageHours + 2, 1.5);

  const engagementScore =
    post.likes * 1.0 +
    post.comments * 2.0 +
    post.shares * 3.0 +
    post.views * 0.1;

  const authorBoost = author.isVerified ? 1.3 : 1.0;
  const followBoost = viewerFollowsAuthor ? 1.5 : 1.0;
  const mediaBoost = post.hasMedia ? 1.2 : 1.0;
  const premiumBoost = post.isPremium ? 0.8 : 1.0; // premium posts shown less in public feed

  return engagementScore * decayFactor * authorBoost * followBoost * mediaBoost * premiumBoost;
}

function rankFeed(
  posts: Post[],
  authors: Map<number, User>,
  viewerFollowedIds: Set<number>,
  nowMs: number
): Post[] {
  return [...posts].sort((a, b) => {
    const authorA = authors.get(a.userId)!;
    const authorB = authors.get(b.userId)!;
    const scoreA = rankPost(a, authorA, viewerFollowedIds.has(a.userId), nowMs);
    const scoreB = rankPost(b, authorB, viewerFollowedIds.has(b.userId), nowMs);
    return scoreB - scoreA;
  });
}

// ─── Trending Engine ──────────────────────────────────────────────────────────

interface TrendingTag {
  tag: string;
  count: number;
  velocity: number; // posts/hour in last 3h vs previous 3h
}

function calculateTrending(
  posts: Post[],
  windowMs = 3 * 60 * 60 * 1000,
  nowMs = Date.now()
): TrendingTag[] {
  const recent = posts.filter((p) => nowMs - p.createdAt.getTime() < windowMs);
  const older = posts.filter(
    (p) =>
      nowMs - p.createdAt.getTime() >= windowMs &&
      nowMs - p.createdAt.getTime() < windowMs * 2
  );

  const tagCounts: Record<string, { recent: number; older: number }> = {};
  for (const post of recent) {
    for (const tag of post.tags) {
      if (!tagCounts[tag]) tagCounts[tag] = { recent: 0, older: 0 };
      tagCounts[tag].recent++;
    }
  }
  for (const post of older) {
    for (const tag of post.tags) {
      if (!tagCounts[tag]) tagCounts[tag] = { recent: 0, older: 0 };
      tagCounts[tag].older++;
    }
  }

  return Object.entries(tagCounts)
    .map(([tag, counts]) => ({
      tag,
      count: counts.recent,
      velocity: counts.older > 0 ? counts.recent / counts.older : counts.recent,
    }))
    .sort((a, b) => b.velocity * b.count - a.velocity * a.count)
    .slice(0, 10);
}

// ─── Tip Engine ───────────────────────────────────────────────────────────────

let tipLedger: Tip[] = [];
let nextTipId = 1;

function sendTip(
  senderId: number,
  recipientId: number,
  amount: number,
  message?: string,
  postId?: number
): Tip {
  if (amount <= 0) throw new Error("Tip amount must be positive");
  if (senderId === recipientId) throw new Error("Cannot tip yourself");
  const tip: Tip = {
    id: nextTipId++,
    senderId,
    recipientId,
    amount,
    message,
    postId,
    createdAt: new Date(),
  };
  tipLedger.push(tip);
  return tip;
}

function getCreatorTips(creatorId: number): Tip[] {
  return tipLedger.filter((t) => t.recipientId === creatorId);
}

function getTotalTipRevenue(creatorId: number): number {
  return getCreatorTips(creatorId).reduce((sum, t) => sum + t.amount, 0);
}

// ─── Follow Engine ────────────────────────────────────────────────────────────

const followGraph: Map<number, Set<number>> = new Map();

function follow(followerId: number, followedId: number): void {
  if (!followGraph.has(followerId)) followGraph.set(followerId, new Set());
  followGraph.get(followerId)!.add(followedId);
}

function unfollow(followerId: number, followedId: number): void {
  followGraph.get(followerId)?.delete(followedId);
}

function isFollowing(followerId: number, followedId: number): boolean {
  return followGraph.get(followerId)?.has(followedId) ?? false;
}

function getFollowerCount(userId: number): number {
  let count = 0;
  for (const [, followed] of followGraph) {
    if (followed.has(userId)) count++;
  }
  return count;
}

// ─── Test Data Factories ──────────────────────────────────────────────────────
const NOW = Date.now();
function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10000),
    userId: 1,
    content: "Test post content",
    likes: 10,
    comments: 5,
    shares: 2,
    views: 100,
    createdAt: new Date(NOW - 60 * 60 * 1000), // 1 hour ago
    isPremium: false,
    hasMedia: false,
    tags: ["#test"],
    ...overrides,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10000),
    name: "Test User",
    followers: 100,
    reputation: 50,
    isVerified: false,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Social Engine — Feed Ranking", () => {
  it("ranks more engaging posts higher", () => {
    const highEngagement = makePost({ id: 1, likes: 1000, comments: 200, shares: 100, views: 5000 });
    const lowEngagement = makePost({ id: 2, likes: 1, comments: 0, shares: 0, views: 5 });
    const author = makeUser({ id: 1 });
    const authors = new Map([[1, author]]);
    const followed = new Set<number>();

    const ranked = rankFeed([lowEngagement, highEngagement], authors, followed, NOW);
    expect(ranked[0].id).toBe(1);
  });

  it("newer posts rank higher than older with same engagement", () => {
    const newPost = makePost({ id: 1, userId: 1, createdAt: new Date(NOW - 30 * 60 * 1000) }); // 30 min ago
    const oldPost = makePost({ id: 2, userId: 1, createdAt: new Date(NOW - 24 * 60 * 60 * 1000) }); // 24h ago
    const author = makeUser({ id: 1 });
    const authors = new Map([[1, author]]);
    const followed = new Set<number>();

    const ranked = rankFeed([oldPost, newPost], authors, followed, NOW);
    expect(ranked[0].id).toBe(1);
  });

  it("followed authors get boost in feed", () => {
    const followedPost = makePost({ id: 1, userId: 10, likes: 50 });
    const unfollowedPost = makePost({ id: 2, userId: 20, likes: 50 });
    const authors = new Map([
      [10, makeUser({ id: 10 })],
      [20, makeUser({ id: 20 })],
    ]);
    const followed = new Set([10]);

    const ranked = rankFeed([unfollowedPost, followedPost], authors, followed, NOW);
    expect(ranked[0].id).toBe(1);
  });

  it("verified authors get boost", () => {
    const verifiedPost = makePost({ id: 1, userId: 10, likes: 50 });
    const unverifiedPost = makePost({ id: 2, userId: 20, likes: 50 });
    const authors = new Map([
      [10, makeUser({ id: 10, isVerified: true })],
      [20, makeUser({ id: 20, isVerified: false })],
    ]);
    const followed = new Set<number>();

    const ranked = rankFeed([unverifiedPost, verifiedPost], authors, followed, NOW);
    expect(ranked[0].id).toBe(1);
  });

  it("posts with media rank higher than text-only", () => {
    const mediaPost = makePost({ id: 1, userId: 1, hasMedia: true, likes: 50 });
    const textPost = makePost({ id: 2, userId: 1, hasMedia: false, likes: 50 });
    const authors = new Map([[1, makeUser({ id: 1 })]]);
    const followed = new Set<number>();

    const ranked = rankFeed([textPost, mediaPost], authors, followed, NOW);
    expect(ranked[0].id).toBe(1);
  });

  it("premium posts are slightly penalized in public feed", () => {
    const premiumPost = makePost({ id: 1, userId: 1, isPremium: true, likes: 50 });
    const publicPost = makePost({ id: 2, userId: 1, isPremium: false, likes: 50 });
    const authors = new Map([[1, makeUser({ id: 1 })]]);
    const followed = new Set<number>();

    const ranked = rankFeed([premiumPost, publicPost], authors, followed, NOW);
    expect(ranked[0].id).toBe(2);
  });

  it("comments are weighted more than likes", () => {
    const commentPost = makePost({ id: 1, userId: 1, likes: 0, comments: 10, shares: 0 });
    const likePost = makePost({ id: 2, userId: 1, likes: 15, comments: 0, shares: 0 });
    const authors = new Map([[1, makeUser({ id: 1 })]]);
    const followed = new Set<number>();

    const ranked = rankFeed([likePost, commentPost], authors, followed, NOW);
    expect(ranked[0].id).toBe(1);
  });

  it("shares are weighted more than comments", () => {
    // shares*3 > comments*2 when shares=6 (18) vs comments=8 (16)
    const sharePost = makePost({ id: 1, userId: 1, likes: 0, comments: 0, shares: 6 });
    const commentPost = makePost({ id: 2, userId: 1, likes: 0, comments: 8, shares: 0 });
    const authors = new Map([[1, makeUser({ id: 1 })]]);
    const followed = new Set<number>();

    const ranked = rankFeed([commentPost, sharePost], authors, followed, NOW);
    expect(ranked[0].id).toBe(1);
  });

  it("returns posts in array of same length", () => {
    const posts = [makePost({ id: 1, userId: 1 }), makePost({ id: 2, userId: 1 }), makePost({ id: 3, userId: 1 })];
    const authors = new Map([[1, makeUser({ id: 1 })]]);
    const ranked = rankFeed(posts, authors, new Set(), NOW);
    expect(ranked).toHaveLength(3);
  });
});

describe("Social Engine — Trending", () => {
  const NOW = Date.now();

  it("identifies trending tags from recent posts", () => {
    const posts = [
      makePost({ tags: ["#crypto", "#web3"], createdAt: new Date(NOW - 30 * 60 * 1000) }),
      makePost({ tags: ["#crypto", "#defi"], createdAt: new Date(NOW - 60 * 60 * 1000) }),
      makePost({ tags: ["#crypto"], createdAt: new Date(NOW - 90 * 60 * 1000) }),
    ];
    const trending = calculateTrending(posts, 3 * 60 * 60 * 1000, NOW);
    expect(trending[0].tag).toBe("#crypto");
    expect(trending[0].count).toBe(3);
  });

  it("returns at most 10 trending tags", () => {
    const posts = Array.from({ length: 20 }, (_, i) =>
      makePost({ tags: [`#tag${i}`], createdAt: new Date(NOW - 30 * 60 * 1000) })
    );
    const trending = calculateTrending(posts, 3 * 60 * 60 * 1000, NOW);
    expect(trending.length).toBeLessThanOrEqual(10);
  });

  it("tags with high velocity rank higher than stale popular tags", () => {
    const posts = [
      // New burst: #newtrend appears 5 times in recent window
      ...Array.from({ length: 5 }, () =>
        makePost({ tags: ["#newtrend"], createdAt: new Date(NOW - 30 * 60 * 1000) })
      ),
      // Old popular: #oldtag appeared 10 times in older window
      ...Array.from({ length: 10 }, () =>
        makePost({ tags: ["#oldtag"], createdAt: new Date(NOW - 4 * 60 * 60 * 1000) })
      ),
    ];
    const trending = calculateTrending(posts, 3 * 60 * 60 * 1000, NOW);
    const newTrendIdx = trending.findIndex((t) => t.tag === "#newtrend");
    const oldTagIdx = trending.findIndex((t) => t.tag === "#oldtag");
    if (newTrendIdx !== -1 && oldTagIdx !== -1) {
      expect(newTrendIdx).toBeLessThan(oldTagIdx);
    }
  });

  it("returns empty array when no posts have tags", () => {
    const posts = [makePost({ tags: [] }), makePost({ tags: [] })];
    const trending = calculateTrending(posts, 3 * 60 * 60 * 1000, NOW);
    expect(trending).toHaveLength(0);
  });
});

describe("Social Engine — Tips", () => {
  beforeEach(() => {
    tipLedger = [];
    nextTipId = 1;
  });

  it("sends a tip successfully", () => {
    const tip = sendTip(1, 2, 10, "Great post!");
    expect(tip.id).toBe(1);
    expect(tip.amount).toBe(10);
    expect(tip.senderId).toBe(1);
    expect(tip.recipientId).toBe(2);
  });

  it("throws on zero or negative tip amount", () => {
    expect(() => sendTip(1, 2, 0)).toThrow("Tip amount must be positive");
    expect(() => sendTip(1, 2, -5)).toThrow("Tip amount must be positive");
  });

  it("throws when tipping yourself", () => {
    expect(() => sendTip(1, 1, 10)).toThrow("Cannot tip yourself");
  });

  it("accumulates total tip revenue for creator", () => {
    sendTip(1, 10, 5);
    sendTip(2, 10, 15);
    sendTip(3, 10, 30);
    expect(getTotalTipRevenue(10)).toBe(50);
  });

  it("only returns tips for specified creator", () => {
    sendTip(1, 10, 5);
    sendTip(1, 20, 15);
    const tips = getCreatorTips(10);
    expect(tips).toHaveLength(1);
    expect(tips[0].recipientId).toBe(10);
  });

  it("tip can be linked to a post", () => {
    const tip = sendTip(1, 2, 10, "Nice!", 42);
    expect(tip.postId).toBe(42);
  });

  it("tip without message has undefined message", () => {
    const tip = sendTip(1, 2, 5);
    expect(tip.message).toBeUndefined();
  });

  it("multiple tips from different senders accumulate correctly", () => {
    for (let i = 1; i <= 10; i++) {
      sendTip(i, 99, i * 2);
    }
    const total = getTotalTipRevenue(99);
    expect(total).toBe(2 + 4 + 6 + 8 + 10 + 12 + 14 + 16 + 18 + 20); // 110
  });
});

describe("Social Engine — Follow Graph", () => {
  beforeEach(() => {
    followGraph.clear();
  });

  it("follows a user correctly", () => {
    follow(1, 2);
    expect(isFollowing(1, 2)).toBe(true);
  });

  it("unfollows a user correctly", () => {
    follow(1, 2);
    unfollow(1, 2);
    expect(isFollowing(1, 2)).toBe(false);
  });

  it("returns false for non-existent follow relationship", () => {
    expect(isFollowing(1, 999)).toBe(false);
  });

  it("counts followers correctly", () => {
    follow(1, 5);
    follow(2, 5);
    follow(3, 5);
    expect(getFollowerCount(5)).toBe(3);
  });

  it("does not double-count duplicate follows", () => {
    follow(1, 5);
    follow(1, 5); // duplicate
    expect(getFollowerCount(5)).toBe(1);
  });

  it("user can follow multiple users", () => {
    follow(1, 2);
    follow(1, 3);
    follow(1, 4);
    expect(isFollowing(1, 2)).toBe(true);
    expect(isFollowing(1, 3)).toBe(true);
    expect(isFollowing(1, 4)).toBe(true);
  });

  it("unfollowing a non-followed user does not throw", () => {
    expect(() => unfollow(1, 999)).not.toThrow();
  });
});

describe("Social Engine — Reputation Score", () => {
  function calculateReputation(user: User, posts: Post[], tips: Tip[]): number {
    const postScore = posts.filter((p) => p.userId === user.id).length * 2;
    const likeScore = posts
      .filter((p) => p.userId === user.id)
      .reduce((sum, p) => sum + p.likes, 0) * 0.1;
    const tipScore = tips.filter((t) => t.recipientId === user.id).reduce((sum, t) => sum + t.amount, 0) * 0.5;
    const verifiedBonus = user.isVerified ? 50 : 0;
    return Math.min(1000, postScore + likeScore + tipScore + verifiedBonus);
  }

  it("verified users have higher base reputation", () => {
    const verified = makeUser({ id: 1, isVerified: true });
    const unverified = makeUser({ id: 2, isVerified: false });
    const repV = calculateReputation(verified, [], []);
    const repU = calculateReputation(unverified, [], []);
    expect(repV).toBeGreaterThan(repU);
  });

  it("more posts increase reputation", () => {
    const user = makeUser({ id: 1 });
    const posts5 = Array.from({ length: 5 }, (_, i) => makePost({ id: i, userId: 1 }));
    const posts10 = Array.from({ length: 10 }, (_, i) => makePost({ id: i, userId: 1 }));
    const rep5 = calculateReputation(user, posts5, []);
    const rep10 = calculateReputation(user, posts10, []);
    expect(rep10).toBeGreaterThan(rep5);
  });

  it("reputation is capped at 1000", () => {
    const user = makeUser({ id: 1, isVerified: true });
    const manyPosts = Array.from({ length: 1000 }, (_, i) =>
      makePost({ id: i, userId: 1, likes: 1000 })
    );
    const rep = calculateReputation(user, manyPosts, []);
    expect(rep).toBeLessThanOrEqual(1000);
  });
});
