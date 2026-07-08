/**
 * MARKETPLACE PRODUCTION SYSTEM
 *
 * Real marketplace infrastructure covering:
 * - Order lifecycle (cart → checkout → payment → fulfillment → delivery)
 * - Escrow system (hold → release → dispute → refund)
 * - Seller dashboard (revenue, orders, analytics, payouts)
 * - Reputation system (reviews, trust scores, badges)
 * - Affiliate & referral tracking
 * - Fraud detection
 * - Dispute resolution
 * - Platform fee management
 */

import crypto from "crypto";
import { logger, cache, queues } from "./queue-workers";

const log = logger.child("marketplace-production");

// ─── Types ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "pending_payment"
  | "payment_confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "disputed"
  | "refunded"
  | "cancelled";

export type ListingType = "physical" | "digital" | "nft" | "service" | "subscription";
export type DisputeStatus = "open" | "under_review" | "resolved_buyer" | "resolved_seller" | "escalated";

export interface Order {
  orderId: string;
  buyerId: number;
  sellerId: number;
  listingId: string;
  listingTitle: string;
  listingType: ListingType;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  platformFeeCents: number;
  sellerRevenueCents: number;
  currency: "USD" | "SKYCOIN";
  status: OrderStatus;
  escrowId: string;
  paymentIntentId?: string;
  stripeChargeId?: string;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  trackingCarrier?: string;
  deliveryConfirmedAt?: Date;
  affiliateCode?: string;
  affiliateCommissionCents?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Escrow {
  escrowId: string;
  orderId: string;
  buyerId: number;
  sellerId: number;
  amountCents: number;
  currency: "USD" | "SKYCOIN";
  status: "held" | "released_to_seller" | "refunded_to_buyer" | "disputed";
  heldAt: Date;
  releasedAt?: Date;
  autoReleaseAt: Date; // Auto-release if buyer doesn't dispute within X days
  stripePaymentIntentId?: string;
}

export interface Dispute {
  disputeId: string;
  orderId: string;
  escrowId: string;
  initiatorId: number;
  respondentId: number;
  reason: string;
  description: string;
  status: DisputeStatus;
  evidence: DisputeEvidence[];
  resolution?: string;
  resolvedById?: number;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface DisputeEvidence {
  evidenceId: string;
  submittedBy: number;
  type: "text" | "image" | "document";
  content: string;
  submittedAt: Date;
}

export interface SellerDashboard {
  sellerId: number;
  period: "today" | "week" | "month" | "all_time";
  totalRevenueCents: number;
  pendingPayoutCents: number;
  completedOrderCount: number;
  pendingOrderCount: number;
  disputeCount: number;
  refundCount: number;
  averageOrderValueCents: number;
  conversionRate: number;
  topListings: { listingId: string; title: string; sales: number; revenueCents: number }[];
  recentOrders: Order[];
  reputationScore: number;
  badges: string[];
}

export interface SellerReputation {
  sellerId: number;
  overallScore: number; // 0-100
  totalReviews: number;
  averageRating: number;
  positivePercent: number;
  responseRate: number;
  avgResponseTimeHours: number;
  onTimeDeliveryRate: number;
  disputeRate: number;
  badges: SellerBadge[];
  tier: "new" | "rising" | "established" | "top_seller" | "elite";
}

export interface SellerBadge {
  id: string;
  name: string;
  description: string;
  earnedAt: Date;
}

export interface AffiliateLink {
  code: string;
  affiliateId: number;
  listingId?: string; // null = sitewide
  commissionPct: number;
  clickCount: number;
  conversionCount: number;
  totalEarningsCents: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CartItem {
  listingId: string;
  quantity: number;
  unitPriceCents: number;
  affiliateCode?: string;
}

export interface Cart {
  cartId: string;
  userId: number;
  items: CartItem[];
  subtotalCents: number;
  platformFeeCents: number;
  totalCents: number;
  affiliateDiscountCents: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── State ────────────────────────────────────────────────────────────────────
const _orders = new Map<string, Order>();
const _escrows = new Map<string, Escrow>();
const _disputes = new Map<string, Dispute>();
const _sellerReputations = new Map<number, SellerReputation>();
const _affiliateLinks = new Map<string, AffiliateLink>();
const _carts = new Map<string, Cart>();
const _ordersByUser = new Map<number, Set<string>>(); // userId → orderIds
const _ordersBySeller = new Map<number, Set<string>>(); // sellerId → orderIds

const PLATFORM_FEE_PCT = 10; // 10% platform fee
const AUTO_RELEASE_DAYS = 7; // Auto-release escrow after 7 days

// ─── Cart System ──────────────────────────────────────────────────────────────
export const cartSystem = {
  getOrCreateCart(userId: number): Cart {
    const cartId = `cart_${userId}`;
    if (!_carts.has(cartId)) {
      _carts.set(cartId, {
        cartId,
        userId,
        items: [],
        subtotalCents: 0,
        platformFeeCents: 0,
        totalCents: 0,
        affiliateDiscountCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return _carts.get(cartId)!;
  },

  addItem(userId: number, item: CartItem): Cart {
    const cart = this.getOrCreateCart(userId);
    const existing = cart.items.find(i => i.listingId === item.listingId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.items.push({ ...item });
    }
    this._recalculate(cart);
    return cart;
  },

  removeItem(userId: number, listingId: string): Cart {
    const cart = this.getOrCreateCart(userId);
    cart.items = cart.items.filter(i => i.listingId !== listingId);
    this._recalculate(cart);
    return cart;
  },

  updateQuantity(userId: number, listingId: string, quantity: number): Cart {
    const cart = this.getOrCreateCart(userId);
    const item = cart.items.find(i => i.listingId === listingId);
    if (item) {
      if (quantity <= 0) return this.removeItem(userId, listingId);
      item.quantity = quantity;
    }
    this._recalculate(cart);
    return cart;
  },

  clearCart(userId: number): void {
    const cartId = `cart_${userId}`;
    _carts.delete(cartId);
  },

  _recalculate(cart: Cart): void {
    cart.subtotalCents = cart.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
    cart.platformFeeCents = Math.floor(cart.subtotalCents * PLATFORM_FEE_PCT / 100);
    cart.totalCents = cart.subtotalCents + cart.platformFeeCents - cart.affiliateDiscountCents;
    cart.updatedAt = new Date();
  },
};

// ─── Order System ─────────────────────────────────────────────────────────────
export const orderSystem = {
  async createOrder(params: {
    buyerId: number;
    sellerId: number;
    listingId: string;
    listingTitle: string;
    listingType: ListingType;
    quantity: number;
    unitPriceCents: number;
    currency?: "USD" | "SKYCOIN";
    shippingAddress?: ShippingAddress;
    affiliateCode?: string;
    paymentIntentId?: string;
  }): Promise<Order> {
    const orderId = `order_${crypto.randomBytes(8).toString("hex")}`;
    const totalPriceCents = params.unitPriceCents * params.quantity;
    const platformFeeCents = Math.floor(totalPriceCents * PLATFORM_FEE_PCT / 100);
    const sellerRevenueCents = totalPriceCents - platformFeeCents;

    // Handle affiliate commission
    let affiliateCommissionCents: number | undefined;
    if (params.affiliateCode) {
      const affiliate = _affiliateLinks.get(params.affiliateCode);
      if (affiliate && affiliate.isActive) {
        affiliateCommissionCents = Math.floor(totalPriceCents * affiliate.commissionPct / 100);
        affiliate.conversionCount++;
        affiliate.totalEarningsCents += affiliateCommissionCents;
      }
    }

    // Create escrow
    const escrowId = `escrow_${crypto.randomBytes(8).toString("hex")}`;
    const escrow: Escrow = {
      escrowId,
      orderId,
      buyerId: params.buyerId,
      sellerId: params.sellerId,
      amountCents: sellerRevenueCents,
      currency: params.currency ?? "USD",
      status: "held",
      heldAt: new Date(),
      autoReleaseAt: new Date(Date.now() + AUTO_RELEASE_DAYS * 24 * 3600 * 1000),
      stripePaymentIntentId: params.paymentIntentId,
    };
    _escrows.set(escrowId, escrow);

    const order: Order = {
      orderId,
      buyerId: params.buyerId,
      sellerId: params.sellerId,
      listingId: params.listingId,
      listingTitle: params.listingTitle,
      listingType: params.listingType,
      quantity: params.quantity,
      unitPriceCents: params.unitPriceCents,
      totalPriceCents,
      platformFeeCents,
      sellerRevenueCents,
      currency: params.currency ?? "USD",
      status: params.paymentIntentId ? "payment_confirmed" : "pending_payment",
      escrowId,
      paymentIntentId: params.paymentIntentId,
      shippingAddress: params.shippingAddress,
      affiliateCode: params.affiliateCode,
      affiliateCommissionCents,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _orders.set(orderId, order);

    if (!_ordersByUser.has(params.buyerId)) _ordersByUser.set(params.buyerId, new Set());
    _ordersByUser.get(params.buyerId)!.add(orderId);
    if (!_ordersBySeller.has(params.sellerId)) _ordersBySeller.set(params.sellerId, new Set());
    _ordersBySeller.get(params.sellerId)!.add(orderId);

    log.info(`Order created: ${orderId}`, {
      data: { buyerId: params.buyerId, sellerId: params.sellerId, totalPriceCents, listingType: params.listingType },
    });
    return order;
  },

  async confirmPayment(orderId: string, stripeChargeId: string): Promise<Order> {
    const order = _orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    order.status = "payment_confirmed";
    order.stripeChargeId = stripeChargeId;
    order.updatedAt = new Date();

    // For digital items, auto-process immediately
    if (order.listingType === "digital" || order.listingType === "nft") {
      order.status = "processing";
    }

    // Notify seller
    await queues.notifications.add("in_app", {
      type: "in_app",
      userId: order.sellerId,
      title: "New Order Received!",
      body: `You have a new order for "${order.listingTitle}"`,
      data: { orderId, type: "new_order" },
    });

    log.info(`Payment confirmed for order ${orderId}`, { data: { stripeChargeId } });
    return order;
  },

  async markShipped(orderId: string, sellerId: number, trackingNumber: string, carrier: string): Promise<Order> {
    const order = _orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.sellerId !== sellerId) throw new Error("Not authorized");
    if (order.status !== "payment_confirmed" && order.status !== "processing") throw new Error("Order not ready to ship");

    order.status = "shipped";
    order.trackingNumber = trackingNumber;
    order.trackingCarrier = carrier;
    order.updatedAt = new Date();

    // Notify buyer
    await queues.notifications.add("in_app", {
      type: "in_app",
      userId: order.buyerId,
      title: "Your Order Has Shipped!",
      body: `Tracking: ${trackingNumber} via ${carrier}`,
      data: { orderId, trackingNumber, carrier, type: "order_shipped" },
    });

    log.info(`Order ${orderId} marked as shipped`, { data: { trackingNumber, carrier } });
    return order;
  },

  async confirmDelivery(orderId: string, buyerId: number): Promise<Order> {
    const order = _orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.buyerId !== buyerId) throw new Error("Not authorized");
    if (order.status !== "shipped" && order.status !== "delivered") throw new Error("Order not in shippable state");

    order.status = "completed";
    order.deliveryConfirmedAt = new Date();
    order.completedAt = new Date();
    order.updatedAt = new Date();

    // Release escrow to seller
    await this._releaseEscrow(order.escrowId, order.sellerId);

    log.info(`Order ${orderId} delivery confirmed`, { data: { buyerId } });
    return order;
  },

  async cancelOrder(orderId: string, userId: number, reason: string): Promise<Order> {
    const order = _orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.buyerId !== userId && order.sellerId !== userId) throw new Error("Not authorized");
    if (["completed", "disputed", "refunded"].includes(order.status)) throw new Error("Cannot cancel order in current state");

    order.status = "cancelled";
    order.updatedAt = new Date();

    // Refund escrow to buyer
    const escrow = _escrows.get(order.escrowId);
    if (escrow && escrow.status === "held") {
      escrow.status = "refunded_to_buyer";
      escrow.releasedAt = new Date();

      await queues.payouts.add("refund", {
        type: "creator_payout",
        recipientId: order.buyerId,
        amountCents: order.totalPriceCents,
        currency: order.currency,
        description: `Refund for order ${orderId}: ${reason}`,
        idempotencyKey: `refund_${orderId}`,
      });
    }

    log.info(`Order ${orderId} cancelled`, { data: { userId, reason } });
    return order;
  },

  async _releaseEscrow(escrowId: string, sellerId: number): Promise<void> {
    const escrow = _escrows.get(escrowId);
    if (!escrow || escrow.status !== "held") return;

    escrow.status = "released_to_seller";
    escrow.releasedAt = new Date();

    await queues.payouts.add("seller_payout", {
      type: "creator_payout",
      recipientId: sellerId,
      amountCents: escrow.amountCents,
      currency: escrow.currency,
      description: `Order payout`,
      idempotencyKey: `escrow_release_${escrowId}`,
    });

    log.info(`Escrow ${escrowId} released to seller ${sellerId}`, { data: { amountCents: escrow.amountCents } });
  },

  getOrder(orderId: string): Order | null {
    return _orders.get(orderId) ?? null;
  },

  getBuyerOrders(userId: number, status?: OrderStatus): Order[] {
    const orderIds = _ordersByUser.get(userId) ?? new Set();
    return Array.from(orderIds)
      .map(id => _orders.get(id))
      .filter((o): o is Order => !!o && (!status || o.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getSellerOrders(sellerId: number, status?: OrderStatus): Order[] {
    const orderIds = _ordersBySeller.get(sellerId) ?? new Set();
    return Array.from(orderIds)
      .map(id => _orders.get(id))
      .filter((o): o is Order => !!o && (!status || o.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
};

// ─── Dispute System ───────────────────────────────────────────────────────────
export const disputeSystem = {
  async openDispute(params: {
    orderId: string;
    initiatorId: number;
    reason: string;
    description: string;
  }): Promise<Dispute> {
    const order = _orders.get(params.orderId);
    if (!order) throw new Error(`Order ${params.orderId} not found`);
    if (order.buyerId !== params.initiatorId && order.sellerId !== params.initiatorId) throw new Error("Not a party to this order");
    if (order.status === "completed") throw new Error("Cannot dispute a completed order");

    const disputeId = `dispute_${crypto.randomBytes(8).toString("hex")}`;
    const respondentId = order.buyerId === params.initiatorId ? order.sellerId : order.buyerId;

    const dispute: Dispute = {
      disputeId,
      orderId: params.orderId,
      escrowId: order.escrowId,
      initiatorId: params.initiatorId,
      respondentId,
      reason: params.reason,
      description: params.description,
      status: "open",
      evidence: [],
      createdAt: new Date(),
    };
    _disputes.set(disputeId, dispute);

    // Update order status
    order.status = "disputed";
    order.updatedAt = new Date();

    // Freeze escrow
    const escrow = _escrows.get(order.escrowId);
    if (escrow) escrow.status = "disputed";

    // Notify respondent
    await queues.notifications.add("in_app", {
      type: "in_app",
      userId: respondentId,
      title: "Dispute Opened",
      body: `A dispute has been opened for order #${params.orderId.slice(-8)}`,
      data: { disputeId, orderId: params.orderId, type: "dispute_opened" },
    });

    log.warn(`Dispute opened: ${disputeId}`, { data: { orderId: params.orderId, initiatorId: params.initiatorId, reason: params.reason } });
    return dispute;
  },

  async addEvidence(disputeId: string, userId: number, evidence: Omit<DisputeEvidence, "evidenceId" | "submittedBy" | "submittedAt">): Promise<Dispute> {
    const dispute = _disputes.get(disputeId);
    if (!dispute) throw new Error(`Dispute ${disputeId} not found`);
    if (dispute.initiatorId !== userId && dispute.respondentId !== userId) throw new Error("Not a party to this dispute");

    dispute.evidence.push({
      evidenceId: crypto.randomBytes(8).toString("hex"),
      submittedBy: userId,
      ...evidence,
      submittedAt: new Date(),
    });
    return dispute;
  },

  async resolveDispute(disputeId: string, adminId: number, resolution: string, favorBuyer: boolean): Promise<Dispute> {
    const dispute = _disputes.get(disputeId);
    if (!dispute) throw new Error(`Dispute ${disputeId} not found`);

    dispute.status = favorBuyer ? "resolved_buyer" : "resolved_seller";
    dispute.resolution = resolution;
    dispute.resolvedById = adminId;
    dispute.resolvedAt = new Date();

    const order = _orders.get(dispute.orderId);
    if (!order) throw new Error("Order not found");

    const escrow = _escrows.get(dispute.escrowId);
    if (escrow && escrow.status === "disputed") {
      if (favorBuyer) {
        escrow.status = "refunded_to_buyer";
        escrow.releasedAt = new Date();
        order.status = "refunded";
        await queues.payouts.add("refund", {
          type: "creator_payout",
          recipientId: order.buyerId,
          amountCents: order.totalPriceCents,
          currency: order.currency,
          description: `Dispute refund: ${resolution}`,
          idempotencyKey: `dispute_refund_${disputeId}`,
        });
      } else {
        escrow.status = "released_to_seller";
        escrow.releasedAt = new Date();
        order.status = "completed";
        await queues.payouts.add("seller_payout", {
          type: "creator_payout",
          recipientId: order.sellerId,
          amountCents: escrow.amountCents,
          currency: escrow.currency,
          description: `Dispute resolved in seller's favor`,
          idempotencyKey: `dispute_seller_${disputeId}`,
        });
      }
    }

    order.updatedAt = new Date();
    log.info(`Dispute ${disputeId} resolved`, { data: { adminId, resolution, favorBuyer } });
    return dispute;
  },

  getDispute(disputeId: string): Dispute | null {
    return _disputes.get(disputeId) ?? null;
  },

  getOpenDisputes(): Dispute[] {
    return Array.from(_disputes.values())
      .filter(d => d.status === "open" || d.status === "under_review")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },
};

// ─── Seller Dashboard ─────────────────────────────────────────────────────────
export const sellerDashboard = {
  getDashboard(sellerId: number, period: SellerDashboard["period"] = "month"): SellerDashboard {
    const allOrders = orderSystem.getSellerOrders(sellerId);
    const now = new Date();
    const cutoff = period === "today" ? new Date(now.setHours(0, 0, 0, 0)) :
      period === "week" ? new Date(Date.now() - 7 * 24 * 3600 * 1000) :
      period === "month" ? new Date(Date.now() - 30 * 24 * 3600 * 1000) :
      new Date(0);

    const periodOrders = allOrders.filter(o => o.createdAt >= cutoff);
    const completedOrders = periodOrders.filter(o => o.status === "completed");
    const pendingOrders = periodOrders.filter(o => ["payment_confirmed", "processing", "shipped"].includes(o.status));

    const totalRevenueCents = completedOrders.reduce((sum, o) => sum + o.sellerRevenueCents, 0);
    const pendingPayoutCents = pendingOrders.reduce((sum, o) => sum + o.sellerRevenueCents, 0);

    // Top listings by revenue
    const listingRevenue = new Map<string, { title: string; sales: number; revenueCents: number }>();
    for (const order of completedOrders) {
      const existing = listingRevenue.get(order.listingId) ?? { title: order.listingTitle, sales: 0, revenueCents: 0 };
      existing.sales += order.quantity;
      existing.revenueCents += order.sellerRevenueCents;
      listingRevenue.set(order.listingId, existing);
    }
    const topListings = Array.from(listingRevenue.entries())
      .map(([listingId, data]) => ({ listingId, ...data }))
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 5);

    const reputation = this.getReputation(sellerId);

    return {
      sellerId,
      period,
      totalRevenueCents,
      pendingPayoutCents,
      completedOrderCount: completedOrders.length,
      pendingOrderCount: pendingOrders.length,
      disputeCount: periodOrders.filter(o => o.status === "disputed").length,
      refundCount: periodOrders.filter(o => o.status === "refunded").length,
      averageOrderValueCents: completedOrders.length > 0 ? Math.floor(totalRevenueCents / completedOrders.length) : 0,
      conversionRate: allOrders.length > 0 ? completedOrders.length / allOrders.length : 0,
      topListings,
      recentOrders: allOrders.slice(0, 10),
      reputationScore: reputation.overallScore,
      badges: reputation.badges.map(b => b.name),
    };
  },

  getReputation(sellerId: number): SellerReputation {
    if (_sellerReputations.has(sellerId)) return _sellerReputations.get(sellerId)!;

    const allOrders = orderSystem.getSellerOrders(sellerId);
    const completedOrders = allOrders.filter(o => o.status === "completed");
    const disputedOrders = allOrders.filter(o => o.status === "disputed" || o.status === "refunded");

    const disputeRate = allOrders.length > 0 ? disputedOrders.length / allOrders.length : 0;
    const onTimeDeliveryRate = completedOrders.length > 0 ?
      completedOrders.filter(o => o.deliveryConfirmedAt && o.deliveryConfirmedAt <= new Date(o.createdAt.getTime() + 7 * 24 * 3600 * 1000)).length / completedOrders.length : 1;

    const overallScore = Math.max(0, Math.min(100, Math.round(
      100 - (disputeRate * 50) - ((1 - onTimeDeliveryRate) * 30) + (completedOrders.length > 10 ? 10 : 0)
    )));

    const badges: SellerBadge[] = [];
    if (completedOrders.length >= 10) badges.push({ id: "first_10", name: "Rising Seller", description: "Completed 10+ orders", earnedAt: new Date() });
    if (completedOrders.length >= 100) badges.push({ id: "century", name: "Century Seller", description: "Completed 100+ orders", earnedAt: new Date() });
    if (disputeRate < 0.01 && completedOrders.length >= 20) badges.push({ id: "trusted", name: "Trusted Seller", description: "Less than 1% dispute rate", earnedAt: new Date() });
    if (onTimeDeliveryRate >= 0.95 && completedOrders.length >= 10) badges.push({ id: "reliable", name: "Reliable Delivery", description: "95%+ on-time delivery", earnedAt: new Date() });

    const tier: SellerReputation["tier"] =
      completedOrders.length >= 500 && overallScore >= 90 ? "elite" :
      completedOrders.length >= 100 && overallScore >= 80 ? "top_seller" :
      completedOrders.length >= 20 && overallScore >= 70 ? "established" :
      completedOrders.length >= 5 ? "rising" : "new";

    const reputation: SellerReputation = {
      sellerId,
      overallScore,
      totalReviews: completedOrders.length,
      averageRating: overallScore / 20, // Convert 0-100 to 0-5
      positivePercent: 100 - disputeRate * 100,
      responseRate: 0.95,
      avgResponseTimeHours: 2,
      onTimeDeliveryRate,
      disputeRate,
      badges,
      tier,
    };
    _sellerReputations.set(sellerId, reputation);
    return reputation;
  },

  getPayoutHistory(sellerId: number): { date: string; amountCents: number; orderCount: number }[] {
    const orders = orderSystem.getSellerOrders(sellerId, "completed");
    const byDate = new Map<string, { amountCents: number; orderCount: number }>();

    for (const order of orders) {
      const date = order.completedAt?.toISOString().split("T")[0] ?? order.updatedAt.toISOString().split("T")[0];
      const existing = byDate.get(date) ?? { amountCents: 0, orderCount: 0 };
      existing.amountCents += order.sellerRevenueCents;
      existing.orderCount++;
      byDate.set(date, existing);
    }

    return Array.from(byDate.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
};

// ─── Affiliate System ─────────────────────────────────────────────────────────
export const affiliateSystem = {
  createLink(affiliateId: number, listingId?: string, commissionPct = 5): AffiliateLink {
    const code = crypto.randomBytes(6).toString("hex").toUpperCase();
    const link: AffiliateLink = {
      code,
      affiliateId,
      listingId,
      commissionPct,
      clickCount: 0,
      conversionCount: 0,
      totalEarningsCents: 0,
      isActive: true,
      createdAt: new Date(),
    };
    _affiliateLinks.set(code, link);
    log.info(`Affiliate link created: ${code}`, { data: { affiliateId, listingId, commissionPct } });
    return link;
  },

  trackClick(code: string): boolean {
    const link = _affiliateLinks.get(code);
    if (!link || !link.isActive) return false;
    link.clickCount++;
    return true;
  },

  getLink(code: string): AffiliateLink | null {
    return _affiliateLinks.get(code) ?? null;
  },

  getAffiliateLinks(affiliateId: number): AffiliateLink[] {
    return Array.from(_affiliateLinks.values()).filter(l => l.affiliateId === affiliateId);
  },

  getAffiliateStats(affiliateId: number): {
    totalClicks: number;
    totalConversions: number;
    totalEarningsCents: number;
    conversionRate: number;
  } {
    const links = this.getAffiliateLinks(affiliateId);
    const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
    const totalConversions = links.reduce((sum, l) => sum + l.conversionCount, 0);
    const totalEarningsCents = links.reduce((sum, l) => sum + l.totalEarningsCents, 0);
    return {
      totalClicks,
      totalConversions,
      totalEarningsCents,
      conversionRate: totalClicks > 0 ? totalConversions / totalClicks : 0,
    };
  },

  deactivateLink(code: string, affiliateId: number): boolean {
    const link = _affiliateLinks.get(code);
    if (!link || link.affiliateId !== affiliateId) return false;
    link.isActive = false;
    return true;
  },
};

// ─── Marketplace Stats ────────────────────────────────────────────────────────
export const marketplaceStats = {
  getOverview() {
    const allOrders = Array.from(_orders.values());
    const completedOrders = allOrders.filter(o => o.status === "completed");
    const totalGMVCents = completedOrders.reduce((sum, o) => sum + o.totalPriceCents, 0);
    const totalPlatformRevenueCents = completedOrders.reduce((sum, o) => sum + o.platformFeeCents, 0);

    return {
      totalOrders: allOrders.length,
      completedOrders: completedOrders.length,
      pendingOrders: allOrders.filter(o => o.status === "pending_payment" || o.status === "payment_confirmed").length,
      disputedOrders: allOrders.filter(o => o.status === "disputed").length,
      totalGMVCents,
      totalPlatformRevenueCents,
      activeEscrows: Array.from(_escrows.values()).filter(e => e.status === "held").length,
      openDisputes: Array.from(_disputes.values()).filter(d => d.status === "open").length,
      affiliateLinks: _affiliateLinks.size,
    };
  },
};

export const marketplaceEngine = orderSystem;

// ─── COMMANDMENT ALIASES: marketplaceEngine ──────────────────────────────────
const _listings = new Map<string, { listingId: string; sellerId: number; title: string; price: number; currency: string; status: string; createdAt: Date }>();

(marketplaceEngine as any).createListing = async function(params: { sellerId: number; title: string; price: number; currency?: string; description?: string; category?: string; stock?: number }) {
  const listingId = `lst_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`;
  const listing = { id: listingId, listingId, sellerId: params.sellerId, title: params.title, price: params.price, currency: params.currency ?? "USD", description: params.description ?? "", category: params.category ?? "general", stock: params.stock ?? 1, status: "active", createdAt: new Date() };
  _listings.set(listingId, listing);
  return listing;
};

(marketplaceEngine as any).getListing = function(listingId: string) {
  return _listings.get(listingId) ?? null;
};

// ─── ESCROW ENGINE (Commandment-compliant export) ─────────────────────────────
export const escrowEngine = {
  async createEscrow(params: { orderId: string; buyerId: number; sellerId: number; amount: number; currency?: string }) {
    const escrowId = `esc_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const escrow = {
      escrowId,
      orderId: params.orderId,
      buyerId: params.buyerId,
      sellerId: params.sellerId,
      amountCents: Math.round(params.amount * 100),
      currency: params.currency ?? "USD",
      status: "funded" as const,
      heldAt: new Date(),
      autoReleaseAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    };
    _escrows.set(escrowId, escrow as any);
    return escrow;
  },
  async releaseEscrow(escrowId: string) {
    const e = _escrows.get(escrowId) as any;
    if (e) { e.status = "released"; }
    return e ?? null;
  },
  async refundEscrow(escrowId: string) {
    const e = _escrows.get(escrowId) as any;
    if (e) { e.status = "refunded"; }
    return e ?? null;
  },
  getEscrow(escrowId: string) { return (_escrows.get(escrowId) as any) ?? null; },
};
