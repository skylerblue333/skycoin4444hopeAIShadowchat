/**
 * Streaming Engine + Payment Engine — Vitest Suite
 * Tests: stream lifecycle, VOD archive, subscription engine, escrow, payout
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Streaming Engine ─────────────────────────────────────────────────────────

type StreamStatus = "live" | "ended" | "scheduled" | "offline";

interface Stream {
  id: number;
  streamerId: number;
  title: string;
  category: string;
  status: StreamStatus;
  viewerCount: number;
  peakViewers: number;
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // seconds
  tags: string[];
}

function createStream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: 1,
    streamerId: 1,
    title: "Test Stream",
    category: "Gaming",
    status: "live",
    viewerCount: 0,
    peakViewers: 0,
    startedAt: new Date(),
    tags: [],
    ...overrides,
  };
}

function startStream(stream: Stream): Stream {
  return { ...stream, status: "live", startedAt: new Date() };
}

function endStream(stream: Stream): Stream {
  const endedAt = new Date();
  const duration = Math.floor((endedAt.getTime() - stream.startedAt.getTime()) / 1000);
  return { ...stream, status: "ended", endedAt, duration };
}

function updateViewerCount(stream: Stream, count: number): Stream {
  return {
    ...stream,
    viewerCount: count,
    peakViewers: Math.max(stream.peakViewers, count),
  };
}

function getStreamDuration(stream: Stream): number {
  if (stream.duration !== undefined) return stream.duration;
  if (!stream.endedAt) return Math.floor((Date.now() - stream.startedAt.getTime()) / 1000);
  return Math.floor((stream.endedAt.getTime() - stream.startedAt.getTime()) / 1000);
}

function filterStreamsByCategory(streams: Stream[], category: string): Stream[] {
  if (category === "All") return streams;
  return streams.filter(s => s.category.toLowerCase() === category.toLowerCase());
}

function sortStreamsByViewers(streams: Stream[]): Stream[] {
  return [...streams].sort((a, b) => b.viewerCount - a.viewerCount);
}

function getLiveStreams(streams: Stream[]): Stream[] {
  return streams.filter(s => s.status === "live");
}

function getVODs(streams: Stream[]): Stream[] {
  return streams.filter(s => s.status === "ended");
}

describe("Streaming Engine — Stream Lifecycle", () => {
  let stream: Stream;

  beforeEach(() => {
    stream = createStream();
  });

  it("creates stream with default values", () => {
    expect(stream.status).toBe("live");
    expect(stream.viewerCount).toBe(0);
    expect(stream.peakViewers).toBe(0);
  });

  it("starts a scheduled stream", () => {
    const scheduled = createStream({ status: "scheduled" });
    const live = startStream(scheduled);
    expect(live.status).toBe("live");
    expect(live.startedAt).toBeInstanceOf(Date);
  });

  it("ends a live stream and calculates duration", () => {
    const liveStream = createStream({
      startedAt: new Date(Date.now() - 3600_000), // 1 hour ago
    });
    const ended = endStream(liveStream);
    expect(ended.status).toBe("ended");
    expect(ended.endedAt).toBeInstanceOf(Date);
    expect(ended.duration).toBeGreaterThanOrEqual(3599);
  });

  it("tracks peak viewer count correctly", () => {
    let s = updateViewerCount(stream, 100);
    s = updateViewerCount(s, 500);
    s = updateViewerCount(s, 200);
    expect(s.viewerCount).toBe(200);
    expect(s.peakViewers).toBe(500);
  });

  it("peak viewers never decreases", () => {
    let s = updateViewerCount(stream, 1000);
    s = updateViewerCount(s, 1);
    expect(s.peakViewers).toBe(1000);
  });

  it("calculates duration for live stream", () => {
    const liveStream = createStream({
      startedAt: new Date(Date.now() - 60_000), // 1 minute ago
    });
    const duration = getStreamDuration(liveStream);
    expect(duration).toBeGreaterThanOrEqual(59);
    expect(duration).toBeLessThan(120);
  });

  it("returns stored duration for ended stream", () => {
    const ended = createStream({ status: "ended", duration: 7200 });
    expect(getStreamDuration(ended)).toBe(7200);
  });
});

describe("Streaming Engine — VOD Archive", () => {
  const streams: Stream[] = [
    createStream({ id: 1, status: "live", category: "Gaming", viewerCount: 500 }),
    createStream({ id: 2, status: "ended", category: "Gaming", viewerCount: 200, duration: 3600 }),
    createStream({ id: 3, status: "ended", category: "Crypto", viewerCount: 800, duration: 7200 }),
    createStream({ id: 4, status: "ended", category: "Education", viewerCount: 150, duration: 1800 }),
    createStream({ id: 5, status: "scheduled", category: "Gaming", viewerCount: 0 }),
  ];

  it("filters live streams only", () => {
    const live = getLiveStreams(streams);
    expect(live).toHaveLength(1);
    expect(live[0].id).toBe(1);
  });

  it("filters VODs (ended streams) only", () => {
    const vods = getVODs(streams);
    expect(vods).toHaveLength(3);
    expect(vods.every(s => s.status === "ended")).toBe(true);
  });

  it("filters by category", () => {
    const gaming = filterStreamsByCategory(streams, "Gaming");
    expect(gaming).toHaveLength(3);
  });

  it("returns all streams for 'All' category", () => {
    const all = filterStreamsByCategory(streams, "All");
    expect(all).toHaveLength(5);
  });

  it("sorts streams by viewer count descending", () => {
    const sorted = sortStreamsByViewers(streams);
    expect(sorted[0].viewerCount).toBe(800);
    expect(sorted[sorted.length - 1].viewerCount).toBe(0);
  });

  it("category filter is case-insensitive", () => {
    const gaming = filterStreamsByCategory(streams, "gaming");
    expect(gaming.length).toBeGreaterThan(0);
  });
});

// ─── Payment / Subscription Engine ───────────────────────────────────────────

type SubscriptionTier = "free" | "supporter" | "premium" | "vip";

interface Subscription {
  id: number;
  subscriberId: number;
  creatorId: number;
  tier: SubscriptionTier;
  amount: number; // cents
  active: boolean;
  createdAt: Date;
  expiresAt: Date;
}

const TIER_PRICES: Record<SubscriptionTier, number> = {
  free: 0,
  supporter: 499,
  premium: 999,
  vip: 2999,
};

function createSubscription(subscriberId: number, creatorId: number, tier: SubscriptionTier): Subscription {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return {
    id: Date.now(),
    subscriberId,
    creatorId,
    tier,
    amount: TIER_PRICES[tier],
    active: true,
    createdAt: now,
    expiresAt,
  };
}

function cancelSubscription(sub: Subscription): Subscription {
  return { ...sub, active: false };
}

function isSubscriptionActive(sub: Subscription): boolean {
  return sub.active && sub.expiresAt > new Date();
}

function upgradeSubscription(sub: Subscription, newTier: SubscriptionTier): Subscription {
  return { ...sub, tier: newTier, amount: TIER_PRICES[newTier] };
}

function getSubscriptionRevenue(subs: Subscription[]): number {
  return subs.filter(s => s.active).reduce((sum, s) => sum + s.amount, 0);
}

describe("Payment Engine — Subscriptions", () => {
  it("creates subscription with correct tier price", () => {
    const sub = createSubscription(1, 2, "premium");
    expect(sub.tier).toBe("premium");
    expect(sub.amount).toBe(999);
    expect(sub.active).toBe(true);
  });

  it("free tier has zero cost", () => {
    const sub = createSubscription(1, 2, "free");
    expect(sub.amount).toBe(0);
  });

  it("VIP tier is most expensive", () => {
    expect(TIER_PRICES.vip).toBeGreaterThan(TIER_PRICES.premium);
    expect(TIER_PRICES.premium).toBeGreaterThan(TIER_PRICES.supporter);
  });

  it("subscription expires in 30 days", () => {
    const sub = createSubscription(1, 2, "supporter");
    const diffMs = sub.expiresAt.getTime() - sub.createdAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(30, 0);
  });

  it("cancels subscription", () => {
    const sub = createSubscription(1, 2, "premium");
    const cancelled = cancelSubscription(sub);
    expect(cancelled.active).toBe(false);
  });

  it("cancelled subscription is not active", () => {
    const sub = cancelSubscription(createSubscription(1, 2, "premium"));
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it("active subscription within expiry is active", () => {
    const sub = createSubscription(1, 2, "premium");
    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it("expired subscription is not active", () => {
    const sub = createSubscription(1, 2, "premium");
    const expired = { ...sub, expiresAt: new Date(Date.now() - 1000) };
    expect(isSubscriptionActive(expired)).toBe(false);
  });

  it("upgrades subscription tier", () => {
    const sub = createSubscription(1, 2, "supporter");
    const upgraded = upgradeSubscription(sub, "vip");
    expect(upgraded.tier).toBe("vip");
    expect(upgraded.amount).toBe(TIER_PRICES.vip);
  });

  it("calculates total subscription revenue", () => {
    const subs = [
      createSubscription(1, 10, "premium"),
      createSubscription(2, 10, "supporter"),
      cancelSubscription(createSubscription(3, 10, "vip")),
    ];
    const revenue = getSubscriptionRevenue(subs);
    expect(revenue).toBe(999 + 499); // cancelled VIP excluded
  });
});

// ─── Escrow Engine ────────────────────────────────────────────────────────────

type EscrowStatus = "pending" | "funded" | "released" | "disputed" | "refunded";

interface Escrow {
  id: number;
  buyerId: number;
  sellerId: number;
  amount: number;
  currency: string;
  status: EscrowStatus;
  createdAt: Date;
  timeoutAt: Date;
}

function createEscrow(buyerId: number, sellerId: number, amount: number, timeoutHours = 72): Escrow {
  const now = new Date();
  return {
    id: Date.now(),
    buyerId,
    sellerId,
    amount,
    currency: "USD",
    status: "pending",
    createdAt: now,
    timeoutAt: new Date(now.getTime() + timeoutHours * 3600_000),
  };
}

function fundEscrow(escrow: Escrow): Escrow {
  if (escrow.status !== "pending") throw new Error("Can only fund pending escrow");
  return { ...escrow, status: "funded" };
}

function releaseEscrow(escrow: Escrow): Escrow {
  if (escrow.status !== "funded") throw new Error("Can only release funded escrow");
  return { ...escrow, status: "released" };
}

function disputeEscrow(escrow: Escrow): Escrow {
  if (!["funded", "pending"].includes(escrow.status)) throw new Error("Cannot dispute in current state");
  return { ...escrow, status: "disputed" };
}

function refundEscrow(escrow: Escrow): Escrow {
  if (!["funded", "disputed"].includes(escrow.status)) throw new Error("Cannot refund in current state");
  return { ...escrow, status: "refunded" };
}

function isEscrowExpired(escrow: Escrow): boolean {
  return escrow.timeoutAt < new Date();
}

describe("Payment Engine — Escrow", () => {
  let escrow: Escrow;

  beforeEach(() => {
    escrow = createEscrow(1, 2, 5000);
  });

  it("creates escrow in pending state", () => {
    expect(escrow.status).toBe("pending");
    expect(escrow.amount).toBe(5000);
  });

  it("funds pending escrow", () => {
    const funded = fundEscrow(escrow);
    expect(funded.status).toBe("funded");
  });

  it("cannot fund already funded escrow", () => {
    const funded = fundEscrow(escrow);
    expect(() => fundEscrow(funded)).toThrow("Can only fund pending escrow");
  });

  it("releases funded escrow", () => {
    const funded = fundEscrow(escrow);
    const released = releaseEscrow(funded);
    expect(released.status).toBe("released");
  });

  it("cannot release pending escrow", () => {
    expect(() => releaseEscrow(escrow)).toThrow("Can only release funded escrow");
  });

  it("disputes funded escrow", () => {
    const funded = fundEscrow(escrow);
    const disputed = disputeEscrow(funded);
    expect(disputed.status).toBe("disputed");
  });

  it("refunds disputed escrow", () => {
    const funded = fundEscrow(escrow);
    const disputed = disputeEscrow(funded);
    const refunded = refundEscrow(disputed);
    expect(refunded.status).toBe("refunded");
  });

  it("refunds funded escrow directly", () => {
    const funded = fundEscrow(escrow);
    const refunded = refundEscrow(funded);
    expect(refunded.status).toBe("refunded");
  });

  it("cannot refund released escrow", () => {
    const funded = fundEscrow(escrow);
    const released = releaseEscrow(funded);
    expect(() => refundEscrow(released)).toThrow("Cannot refund in current state");
  });

  it("escrow with 72-hour timeout is not expired immediately", () => {
    expect(isEscrowExpired(escrow)).toBe(false);
  });

  it("escrow with past timeout is expired", () => {
    const expired = { ...escrow, timeoutAt: new Date(Date.now() - 1000) };
    expect(isEscrowExpired(expired)).toBe(true);
  });

  it("default timeout is 72 hours", () => {
    const diffHours = (escrow.timeoutAt.getTime() - escrow.createdAt.getTime()) / 3600_000;
    expect(diffHours).toBeCloseTo(72, 0);
  });
});

// ─── Payout Engine ────────────────────────────────────────────────────────────

interface Payout {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  method: "bank_transfer" | "crypto_wallet" | "paypal";
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  fee: number;
}

const PAYOUT_FEES: Record<string, number> = {
  bank_transfer: 0.01, // 1%
  crypto_wallet: 0.005, // 0.5%
  paypal: 0.029, // 2.9%
};

function calculatePayoutFee(amount: number, method: string): number {
  const rate = PAYOUT_FEES[method] || 0.01;
  return Math.round(amount * rate);
}

function createPayout(userId: number, amount: number, method: Payout["method"]): Payout {
  const fee = calculatePayoutFee(amount, method);
  return {
    id: Date.now(),
    userId,
    amount,
    currency: "USD",
    method,
    status: "pending",
    createdAt: new Date(),
    fee,
  };
}

function getNetPayout(payout: Payout): number {
  return payout.amount - payout.fee;
}

function processPayout(payout: Payout): Payout {
  if (payout.status !== "pending") throw new Error("Can only process pending payouts");
  return { ...payout, status: "processing" };
}

describe("Payment Engine — Payouts", () => {
  it("calculates bank transfer fee at 1%", () => {
    const fee = calculatePayoutFee(10000, "bank_transfer");
    expect(fee).toBe(100);
  });

  it("calculates crypto wallet fee at 0.5%", () => {
    const fee = calculatePayoutFee(10000, "crypto_wallet");
    expect(fee).toBe(50);
  });

  it("calculates PayPal fee at 2.9%", () => {
    const fee = calculatePayoutFee(10000, "paypal");
    expect(fee).toBe(290);
  });

  it("crypto wallet has lowest fee", () => {
    const amount = 10000;
    expect(calculatePayoutFee(amount, "crypto_wallet")).toBeLessThan(calculatePayoutFee(amount, "bank_transfer"));
    expect(calculatePayoutFee(amount, "crypto_wallet")).toBeLessThan(calculatePayoutFee(amount, "paypal"));
  });

  it("creates payout with correct fee", () => {
    const payout = createPayout(1, 5000, "bank_transfer");
    expect(payout.fee).toBe(50); // 1% of 5000
    expect(payout.status).toBe("pending");
  });

  it("calculates net payout amount", () => {
    const payout = createPayout(1, 5000, "bank_transfer");
    expect(getNetPayout(payout)).toBe(4950);
  });

  it("processes pending payout", () => {
    const payout = createPayout(1, 5000, "paypal");
    const processing = processPayout(payout);
    expect(processing.status).toBe("processing");
  });

  it("cannot process non-pending payout", () => {
    const payout = createPayout(1, 5000, "paypal");
    const processing = processPayout(payout);
    expect(() => processPayout(processing)).toThrow("Can only process pending payouts");
  });

  it("net payout is always less than gross for paid methods", () => {
    const methods: Payout["method"][] = ["bank_transfer", "crypto_wallet", "paypal"];
    for (const method of methods) {
      const payout = createPayout(1, 10000, method);
      expect(getNetPayout(payout)).toBeLessThan(payout.amount);
    }
  });
});
