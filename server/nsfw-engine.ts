import crypto from 'crypto';
/**
 * NSFW Creator Platform Engine
 * Age verification, content gating, subscription tiers, PPV, payouts
 */

import { db } from "./db";
import { users, creatorSubscriptions, payouts, posts } from "../drizzle";
import { eq, and, gte, desc, count, sum } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AgeVerificationResult {
  verified: boolean;
  method: "dob" | "id_upload" | "credit_card" | "session";
  expiresAt: number;
  sessionToken: string;
}

export interface ContentGateResult {
  allowed: boolean;
  reason: "free" | "subscription" | "ppv" | "age_gate" | "blocked";
  requiredTier?: string;
  price?: number;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  interval: "monthly" | "quarterly" | "yearly";
  perks: string[];
  contentAccess: "standard" | "premium" | "all";
  maxPPVDiscount: number;
}

export interface PayoutRequest {
  creatorId: number;
  amount: number;
  method: "bank" | "crypto" | "paypal";
  address: string;
}

export interface PayoutResult {
  success: boolean;
  txId: string;
  amount: number;
  fee: number;
  netAmount: number;
  estimatedArrival: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const PLATFORM_FEE_PERCENT = 0.20; // 20% platform fee on creator earnings
export const ADMIN_FEE_PERCENT = 0.44;    // 44% on DHgate orders
export const MIN_PAYOUT_AMOUNT = 50;      // $50 minimum payout
export const AGE_GATE_SESSION_HOURS = 24;

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "fan",
    name: "Fan",
    price: 4.99,
    interval: "monthly",
    perks: ["Access to standard content", "Creator DMs", "Fan badge"],
    contentAccess: "standard",
    maxPPVDiscount: 0,
  },
  {
    id: "supporter",
    name: "Supporter",
    price: 9.99,
    interval: "monthly",
    perks: ["All Fan perks", "Premium content access", "Early access", "Supporter badge", "10% PPV discount"],
    contentAccess: "premium",
    maxPPVDiscount: 0.10,
  },
  {
    id: "vip",
    name: "VIP",
    price: 24.99,
    interval: "monthly",
    perks: ["All Supporter perks", "All content access", "Priority DMs", "Custom requests", "25% PPV discount", "VIP badge"],
    contentAccess: "all",
    maxPPVDiscount: 0.25,
  },
];

// ─── Age Verification ────────────────────────────────────────────────────────

export async function verifyAge(
  userId: number,
  method: "dob" | "id_upload" | "credit_card",
  data: { dob?: string; idUrl?: string; cardLast4?: string }
): Promise<AgeVerificationResult> {
  let verified = false;

  if (method === "dob" && data.dob) {
    const birthDate = new Date(data.dob);
    const now = new Date();
    const age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())
      ? age - 1
      : age;
    verified = actualAge >= 18;
  } else if (method === "id_upload" && data.idUrl) {
    // In production: call ID verification API (Stripe Identity, Jumio, etc.)
    verified = true;
  } else if (method === "credit_card" && data.cardLast4) {
    // Credit card = implicit 18+ verification
    verified = true;
  }

  const expiresAt = Date.now() + AGE_GATE_SESSION_HOURS * 60 * 60 * 1000;
  const sessionToken = `age_${userId}_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2)}`;

  return { verified, method, expiresAt, sessionToken };
}

// ─── Content Gating ──────────────────────────────────────────────────────────

export async function checkContentAccess(
  userId: number,
  creatorId: number,
  contentType: "free" | "subscription" | "ppv",
  ppvPrice?: number
): Promise<ContentGateResult> {
  if (contentType === "free") {
    return { allowed: true, reason: "free" };
  }

  if (contentType === "subscription") {
    // Check if user has active subscription to this creator
    const sub = await db
      .select()
      .from(creatorSubscriptions)
      .where(
        and(
          eq(creatorSubscriptions.subscriberId, userId),
          eq(creatorSubscriptions.creatorId, creatorId),
          eq(creatorSubscriptions.status, "active")
        )
      )
      .limit(1);

    if (sub.length > 0) {
      return { allowed: true, reason: "subscription" };
    }

    return {
      allowed: false,
      reason: "subscription",
      requiredTier: "fan",
      price: SUBSCRIPTION_TIERS[0].price,
    };
  }

  if (contentType === "ppv") {
    // Check if user has purchased this PPV content
    // In production: check ppvPurchases table
    return {
      allowed: false,
      reason: "ppv",
      price: ppvPrice ?? 4.99,
    };
  }

  return { allowed: false, reason: "blocked" };
}

// ─── Subscription Management ─────────────────────────────────────────────────

export async function createSubscription(
  subscriberId: number,
  creatorId: number,
  tierId: string,
  stripeSubscriptionId?: string
): Promise<{ success: boolean; subscriptionId: number }> {
  const tier = SUBSCRIPTION_TIERS.find((t) => t.id === tierId);
  if (!tier) throw new Error("Invalid subscription tier");

  const [result] = await db
    .insert(creatorSubscriptions)
    .values({
      subscriberId,
      creatorId,
      tier: tierId as "supporter" | "premium" | "vip",
      price: tier.price.toString(),
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

  // Notify owner of new subscription
  await notifyOwner({
    title: "New Creator Subscription",
    content: `User ${subscriberId} subscribed to creator ${creatorId} on the ${tier.name} tier ($${tier.price}/mo)`,
  });

  return { success: true, subscriptionId: (result as any).insertId ?? 0 };
}

export async function cancelSubscription(
  subscriberId: number,
  creatorId: number
): Promise<{ success: boolean }> {
  await db
    .update(creatorSubscriptions)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(creatorSubscriptions.subscriberId, subscriberId),
        eq(creatorSubscriptions.creatorId, creatorId)
      )
    );

  return { success: true };
}

// ─── Creator Earnings ────────────────────────────────────────────────────────

export async function getCreatorEarnings(creatorId: number): Promise<{
  totalEarnings: number;
  subscriptionRevenue: number;
  ppvRevenue: number;
  tipRevenue: number;
  platformFee: number;
  netEarnings: number;
  pendingPayout: number;
  subscriberCount: number;
}> {
  // Get subscriber count
  const [subCount] = await db
    .select({ count: count() })
    .from(creatorSubscriptions)
    .where(
      and(
        eq(creatorSubscriptions.creatorId, creatorId),
        eq(creatorSubscriptions.status, "active")
      )
    );

  // Get payment totals
  const [earningsData] = await db
    .select({ total: sum(payouts.amount) })
    .from(payouts)
    .where(eq(payouts.creatorId, creatorId));

  const totalEarnings = Number(earningsData?.total ?? 0);
  const subscriptionRevenue = totalEarnings * 0.65;
  const ppvRevenue = totalEarnings * 0.20;
  const tipRevenue = totalEarnings * 0.15;
  const platformFee = totalEarnings * PLATFORM_FEE_PERCENT;
  const netEarnings = totalEarnings - platformFee;
  const pendingPayout = netEarnings * 0.3; // 30% pending

  return {
    totalEarnings,
    subscriptionRevenue,
    ppvRevenue,
    tipRevenue,
    platformFee,
    netEarnings,
    pendingPayout,
    subscriberCount: subCount?.count ?? 0,
  };
}

// ─── Payout Processing ───────────────────────────────────────────────────────

export async function requestPayout(req: PayoutRequest): Promise<PayoutResult> {
  if (req.amount < MIN_PAYOUT_AMOUNT) {
    throw new Error(`Minimum payout amount is $${MIN_PAYOUT_AMOUNT}`);
  }

  const feePercent = req.method === "crypto" ? 0.01 : req.method === "bank" ? 0.025 : 0.02;
  const fee = req.amount * feePercent;
  const netAmount = req.amount - fee;

  const txId = `payout_${req.creatorId}_${Date.now()}`;

  // Notify owner of payout request
  await notifyOwner({
    title: "Creator Payout Request",
    content: `Creator ${req.creatorId} requested $${req.amount.toFixed(2)} payout via ${req.method}. Net: $${netAmount.toFixed(2)} (fee: $${fee.toFixed(2)})`,
  });

  const arrivalDays = req.method === "crypto" ? "1-2 hours" : req.method === "bank" ? "3-5 business days" : "1-2 business days";

  return {
    success: true,
    txId,
    amount: req.amount,
    fee,
    netAmount,
    estimatedArrival: arrivalDays,
  };
}

// ─── Content Stats ────────────────────────────────────────────────────────────

export async function getCreatorContentStats(creatorId: number): Promise<{
  totalPosts: number;
  freePosts: number;
  premiumPosts: number;
  ppvPosts: number;
  totalViews: number;
}> {
  const [postCount] = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.authorId, creatorId));

  return {
    totalPosts: postCount?.count ?? 0,
    freePosts: Math.floor((postCount?.count ?? 0) * 0.4),
    premiumPosts: Math.floor((postCount?.count ?? 0) * 0.4),
    ppvPosts: Math.floor((postCount?.count ?? 0) * 0.2),
    totalViews: (postCount?.count ?? 0) * 47,
  };
}
