import crypto from 'crypto';
/**
 * PHASE 27 — LIVE COMMERCE ENGINE
 * Live Shopping Streams, Product Pinning, Timed Drops, Flash Auctions,
 * Limited Edition NFTs, Charity Auctions, Commerce AI
 * Goal: Turn content into sales.
 */

import { invokeLLM } from "./_core/llm";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type LiveShoppingStatus = "scheduled" | "live" | "ended" | "cancelled";
export type AuctionStatus = "pending" | "active" | "ended" | "cancelled" | "settled";
export type DropStatus = "upcoming" | "active" | "sold_out" | "ended";
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface LiveShoppingStream {
  id: string;
  creatorId: number;
  title: string;
  description: string;
  streamId?: string;
  status: LiveShoppingStatus;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  viewerCount: number;
  peakViewerCount: number;
  totalSales: number;
  totalRevenue: number;
  currency: string;
  pinnedProductIds: string[];
  chatEnabled: boolean;
  guestCreatorIds: number[];
  thumbnailUrl?: string;
  tags: string[];
  createdAt: Date;
}

export interface ShoppingProduct {
  id: string;
  creatorId: number;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  stock: number;
  soldCount: number;
  imageUrls: string[];
  category: string;
  tags: string[];
  isDigital: boolean;
  isNFT: boolean;
  nftContractAddress?: string;
  shippingRequired: boolean;
  estimatedDeliveryDays?: number;
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  affiliateCommissionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPin {
  id: string;
  streamId: string;
  productId: string;
  pinnedAt: Date;
  unpinnedAt?: Date;
  displayDurationSeconds?: number;
  clickCount: number;
  purchaseCount: number;
  isActive: boolean;
}

export interface TimedDrop {
  id: string;
  creatorId: number;
  productId: string;
  title: string;
  description: string;
  dropPrice: number;
  originalPrice: number;
  currency: string;
  totalSupply: number;
  remainingSupply: number;
  maxPerWallet: number;
  status: DropStatus;
  startsAt: Date;
  endsAt: Date;
  whitelistOnly: boolean;
  whitelistAddresses: string[];
  totalRevenue: number;
  createdAt: Date;
}

export interface FlashAuction {
  id: string;
  creatorId: number;
  productId?: string;
  nftId?: string;
  title: string;
  description: string;
  startingBid: number;
  reservePrice?: number;
  currentBid: number;
  currentBidderId?: number;
  currency: string;
  status: AuctionStatus;
  auctionType: "english" | "dutch" | "sealed" | "charity";
  startsAt: Date;
  endsAt: Date;
  extensionMinutes: number; // extend if bid in last N minutes
  bids: Array<{
    bidderId: number;
    amount: number;
    timestamp: Date;
    isWinning: boolean;
  }>;
  totalBids: number;
  winnerBidderId?: number;
  finalPrice?: number;
  charityId?: string;
  charityPercentage?: number;
  createdAt: Date;
}

export interface CommerceOrder {
  id: string;
  buyerId: number;
  sellerId: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentTxHash?: string;
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  trackingNumber?: string;
  notes?: string;
  affiliateId?: number;
  affiliateCommission?: number;
  streamId?: string;
  dropId?: string;
  auctionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuyerSegment {
  id: string;
  creatorId: number;
  segmentName: string;
  segmentType: "whale" | "repeat_buyer" | "first_time" | "cart_abandoner" | "high_ltv" | "at_risk";
  buyerIds: number[];
  avgOrderValue: number;
  totalRevenue: number;
  conversionRate: number;
  lastUpdated: Date;
}

export interface CommerceAIInsight {
  id: string;
  creatorId: number;
  insightType: "pricing" | "upsell" | "cross_sell" | "conversion" | "inventory" | "timing";
  title: string;
  description: string;
  recommendation: string;
  expectedImpact: string;
  confidence: number;
  dataPoints: Record<string, unknown>;
  isActioned: boolean;
  generatedAt: Date;
}

export interface UpsellOffer {
  id: string;
  triggeredByProductId: string;
  offeredProductId: string;
  offerType: "upsell" | "cross_sell" | "bundle";
  discountPercent?: number;
  bundlePrice?: number;
  displayText: string;
  acceptanceRate: number;
  isActive: boolean;
  createdAt: Date;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _liveStreams = new Map<string, LiveShoppingStream>();
const _products = new Map<string, ShoppingProduct>();
const _productPins = new Map<string, ProductPin>();
const _timedDrops = new Map<string, TimedDrop>();
const _flashAuctions = new Map<string, FlashAuction>();
const _orders = new Map<string, CommerceOrder>();
const _buyerSegments = new Map<string, BuyerSegment>();
const _aiInsights = new Map<string, CommerceAIInsight>();
const _upsellOffers = new Map<string, UpsellOffer>();

// ─── LIVE SHOPPING STREAM ENGINE ─────────────────────────────────────────────

export const liveShoppingEngine = {
  createStream(params: Omit<LiveShoppingStream, "id" | "viewerCount" | "peakViewerCount" | "totalSales" | "totalRevenue" | "pinnedProductIds" | "createdAt">): LiveShoppingStream {
    const id = `lss_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const stream: LiveShoppingStream = {
      ...params,
      id,
      viewerCount: 0,
      peakViewerCount: 0,
      totalSales: 0,
      totalRevenue: 0,
      pinnedProductIds: [],
      createdAt: new Date(),
    };
    _liveStreams.set(id, stream);
    return stream;
  },

  startStream(streamId: string): LiveShoppingStream | null {
    const stream = _liveStreams.get(streamId);
    if (!stream || stream.status !== "scheduled") return null;
    stream.status = "live";
    stream.startedAt = new Date();
    return stream;
  },

  endStream(streamId: string): LiveShoppingStream | null {
    const stream = _liveStreams.get(streamId);
    if (!stream || stream.status !== "live") return null;
    stream.status = "ended";
    stream.endedAt = new Date();
    return stream;
  },

  updateViewerCount(streamId: string, count: number): LiveShoppingStream | null {
    const stream = _liveStreams.get(streamId);
    if (!stream) return null;
    stream.viewerCount = count;
    if (count > stream.peakViewerCount) stream.peakViewerCount = count;
    return stream;
  },

  pinProduct(streamId: string, productId: string, durationSeconds?: number): ProductPin | null {
    const stream = _liveStreams.get(streamId);
    const product = _products.get(productId);
    if (!stream || !product) return null;

    // Deactivate previous pins for this product
    for (const pin of _productPins.values()) {
      if (pin.streamId === streamId && pin.productId === productId && pin.isActive) {
        pin.isActive = false;
        pin.unpinnedAt = new Date();
      }
    }

    const id = `pin_${streamId}_${productId}_${Date.now()}`;
    const pin: ProductPin = {
      id,
      streamId,
      productId,
      pinnedAt: new Date(),
      displayDurationSeconds: durationSeconds,
      clickCount: 0,
      purchaseCount: 0,
      isActive: true,
    };
    _productPins.set(id, pin);
    if (!stream.pinnedProductIds.includes(productId)) {
      stream.pinnedProductIds.push(productId);
    }
    return pin;
  },

  unpinProduct(streamId: string, productId: string): boolean {
    for (const pin of _productPins.values()) {
      if (pin.streamId === streamId && pin.productId === productId && pin.isActive) {
        pin.isActive = false;
        pin.unpinnedAt = new Date();
      }
    }
    const stream = _liveStreams.get(streamId);
    if (stream) stream.pinnedProductIds = stream.pinnedProductIds.filter(id => id !== productId);
    return true;
  },

  getActivePins(streamId: string): Array<{ pin: ProductPin; product: ShoppingProduct }> {
    const results: Array<{ pin: ProductPin; product: ShoppingProduct }> = [];
    for (const pin of _productPins.values()) {
      if (pin.streamId === streamId && pin.isActive) {
        const product = _products.get(pin.productId);
        if (product) results.push({ pin, product });
      }
    }
    return results;
  },

  getLiveStreams(creatorId?: number): LiveShoppingStream[] {
    return Array.from(_liveStreams.values())
      .filter(s => s.status === "live" && (!creatorId || s.creatorId === creatorId))
      .sort((a, b) => b.viewerCount - a.viewerCount);
  },

  getStreamAnalytics(streamId: string): {
    stream: LiveShoppingStream | null;
    pins: ProductPin[];
    orders: CommerceOrder[];
    conversionRate: number;
  } {
    const stream = _liveStreams.get(streamId) ?? null;
    const pins = Array.from(_productPins.values()).filter(p => p.streamId === streamId);
    const orders = Array.from(_orders.values()).filter(o => o.streamId === streamId);
    const totalClicks = pins.reduce((s, p) => s + p.clickCount, 0);
    return {
      stream,
      pins,
      orders,
      conversionRate: totalClicks > 0 ? orders.length / totalClicks : 0,
    };
  },
};

// ─── PRODUCT ENGINE ───────────────────────────────────────────────────────────

export const productEngine = {
  createProduct(params: Omit<ShoppingProduct, "id" | "soldCount" | "rating" | "reviewCount" | "createdAt" | "updatedAt">): ShoppingProduct {
    const id = `prod_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const product: ShoppingProduct = {
      ...params,
      id,
      soldCount: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _products.set(id, product);
    return product;
  },

  getProduct(id: string): ShoppingProduct | null {
    return _products.get(id) ?? null;
  },

  updateProduct(id: string, updates: Partial<ShoppingProduct>): ShoppingProduct | null {
    const product = _products.get(id);
    if (!product) return null;
    Object.assign(product, updates, { updatedAt: new Date() });
    return product;
  },

  getCreatorProducts(creatorId: number, activeOnly = true): ShoppingProduct[] {
    return Array.from(_products.values())
      .filter(p => p.creatorId === creatorId && (!activeOnly || p.isActive))
      .sort((a, b) => b.soldCount - a.soldCount);
  },

  searchProducts(query: string, category?: string, maxPrice?: number): ShoppingProduct[] {
    const q = query.toLowerCase();
    return Array.from(_products.values())
      .filter(p =>
        p.isActive &&
        (p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))) &&
        (!category || p.category === category) &&
        (!maxPrice || p.price <= maxPrice)
      )
      .sort((a, b) => b.soldCount - a.soldCount);
  },

  decrementStock(productId: string, quantity: number): boolean {
    const product = _products.get(productId);
    if (!product || product.stock < quantity) return false;
    product.stock -= quantity;
    product.soldCount += quantity;
    product.updatedAt = new Date();
    return true;
  },
};

// ─── TIMED DROPS ENGINE ───────────────────────────────────────────────────────

export const timedDropsEngine = {
  createDrop(params: Omit<TimedDrop, "id" | "remainingSupply" | "totalRevenue" | "createdAt">): TimedDrop {
    const id = `drop_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const drop: TimedDrop = {
      ...params,
      id,
      remainingSupply: params.totalSupply,
      totalRevenue: 0,
      createdAt: new Date(),
    };
    _timedDrops.set(id, drop);
    return drop;
  },

  activateDrop(dropId: string): TimedDrop | null {
    const drop = _timedDrops.get(dropId);
    if (!drop || drop.status !== "upcoming") return null;
    drop.status = "active";
    return drop;
  },

  purchaseDrop(dropId: string, buyerId: number, quantity: number, walletAddress?: string): {
    success: boolean;
    order?: CommerceOrder;
    reason?: string;
  } {
    const drop = _timedDrops.get(dropId);
    if (!drop) return { success: false, reason: "Drop not found" };
    if (drop.status !== "active") return { success: false, reason: "Drop not active" };
    if (drop.remainingSupply < quantity) return { success: false, reason: "Insufficient supply" };
    if (drop.whitelistOnly && walletAddress && !drop.whitelistAddresses.includes(walletAddress)) {
      return { success: false, reason: "Not whitelisted" };
    }

    drop.remainingSupply -= quantity;
    drop.totalRevenue += drop.dropPrice * quantity;
    if (drop.remainingSupply === 0) drop.status = "sold_out";

    const orderId = `ord_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const order: CommerceOrder = {
      id: orderId,
      buyerId,
      sellerId: drop.creatorId,
      productId: drop.productId,
      quantity,
      unitPrice: drop.dropPrice,
      totalPrice: drop.dropPrice * quantity,
      currency: drop.currency,
      status: "confirmed",
      paymentMethod: "platform_wallet",
      dropId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _orders.set(orderId, order);
    return { success: true, order };
  },

  getActiveDrops(creatorId?: number): TimedDrop[] {
    const now = new Date();
    return Array.from(_timedDrops.values())
      .filter(d =>
        d.status === "active" && d.startsAt <= now && d.endsAt > now &&
        (!creatorId || d.creatorId === creatorId)
      )
      .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  },

  getUpcomingDrops(limit = 10): TimedDrop[] {
    const now = new Date();
    return Array.from(_timedDrops.values())
      .filter(d => d.status === "upcoming" && d.startsAt > now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, limit);
  },
};

// ─── FLASH AUCTION ENGINE ─────────────────────────────────────────────────────

export const flashAuctionEngine = {
  createAuction(params: Omit<FlashAuction, "id" | "currentBid" | "currentBidderId" | "bids" | "totalBids" | "winnerBidderId" | "finalPrice" | "createdAt">): FlashAuction {
    const id = `auction_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const auction: FlashAuction = {
      ...params,
      id,
      currentBid: params.startingBid,
      bids: [],
      totalBids: 0,
      createdAt: new Date(),
    };
    _flashAuctions.set(id, auction);
    return auction;
  },

  placeBid(auctionId: string, bidderId: number, amount: number): {
    success: boolean;
    auction?: FlashAuction;
    reason?: string;
  } {
    const auction = _flashAuctions.get(auctionId);
    if (!auction) return { success: false, reason: "Auction not found" };
    if (auction.status !== "active") return { success: false, reason: "Auction not active" };
    if (amount <= auction.currentBid) return { success: false, reason: "Bid too low" };

    // Mark previous bids as not winning
    for (const bid of auction.bids) bid.isWinning = false;

    auction.bids.push({ bidderId, amount, timestamp: new Date(), isWinning: true });
    auction.currentBid = amount;
    auction.currentBidderId = bidderId;
    auction.totalBids++;

    // Extend auction if bid in last N minutes
    const timeLeft = auction.endsAt.getTime() - Date.now();
    if (timeLeft < auction.extensionMinutes * 60000) {
      auction.endsAt = new Date(Date.now() + auction.extensionMinutes * 60000);
    }

    return { success: true, auction };
  },

  settleAuction(auctionId: string): FlashAuction | null {
    const auction = _flashAuctions.get(auctionId);
    if (!auction || auction.status !== "active") return null;
    auction.status = "settled";
    if (auction.currentBidderId && (!auction.reservePrice || auction.currentBid >= auction.reservePrice)) {
      auction.winnerBidderId = auction.currentBidderId;
      auction.finalPrice = auction.currentBid;

      // Create order
      const orderId = `ord_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
      const order: CommerceOrder = {
        id: orderId,
        buyerId: auction.winnerBidderId,
        sellerId: auction.creatorId,
        productId: auction.productId ?? "auction_item",
        quantity: 1,
        unitPrice: auction.finalPrice,
        totalPrice: auction.finalPrice,
        currency: auction.currency,
        status: "confirmed",
        paymentMethod: "auction",
        auctionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      _orders.set(orderId, order);
    } else {
      auction.status = "ended";
    }
    return auction;
  },

  getActiveAuctions(auctionType?: FlashAuction["auctionType"]): FlashAuction[] {
    return Array.from(_flashAuctions.values())
      .filter(a => a.status === "active" && (!auctionType || a.auctionType === auctionType))
      .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  },

  getAuction(id: string): FlashAuction | null {
    return _flashAuctions.get(id) ?? null;
  },

  getAuctionLeaderboard(auctionId: string): Array<{ bidderId: number; amount: number; rank: number }> {
    const auction = _flashAuctions.get(auctionId);
    if (!auction) return [];
    const sorted = [...auction.bids].sort((a, b) => b.amount - a.amount);
    const seen = new Set<number>();
    return sorted
      .filter(b => { if (seen.has(b.bidderId)) return false; seen.add(b.bidderId); return true; })
      .map((b, i) => ({ bidderId: b.bidderId, amount: b.amount, rank: i + 1 }));
  },
};

// ─── ORDER ENGINE ─────────────────────────────────────────────────────────────

export const orderEngine = {
  createOrder(params: Omit<CommerceOrder, "id" | "createdAt" | "updatedAt">): CommerceOrder {
    const id = `ord_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const order: CommerceOrder = { ...params, id, createdAt: new Date(), updatedAt: new Date() };
    _orders.set(id, order);
    // Decrement stock
    productEngine.decrementStock(params.productId, params.quantity);
    return order;
  },

  updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string): CommerceOrder | null {
    const order = _orders.get(orderId);
    if (!order) return null;
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    order.updatedAt = new Date();
    return order;
  },

  getBuyerOrders(buyerId: number, status?: OrderStatus): CommerceOrder[] {
    return Array.from(_orders.values())
      .filter(o => o.buyerId === buyerId && (!status || o.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getSellerOrders(sellerId: number, status?: OrderStatus): CommerceOrder[] {
    return Array.from(_orders.values())
      .filter(o => o.sellerId === sellerId && (!status || o.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getOrderAnalytics(sellerId: number): {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    byStatus: Record<string, number>;
    topProducts: Array<{ productId: string; count: number; revenue: number }>;
  } {
    const orders = Array.from(_orders.values()).filter(o => o.sellerId === sellerId);
    const byStatus: Record<string, number> = {};
    const productStats: Record<string, { count: number; revenue: number }> = {};
    let totalRevenue = 0;

    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
      totalRevenue += order.totalPrice;
      if (!productStats[order.productId]) productStats[order.productId] = { count: 0, revenue: 0 };
      productStats[order.productId].count++;
      productStats[order.productId].revenue += order.totalPrice;
    }

    const topProducts = Object.entries(productStats)
      .map(([productId, stats]) => ({ productId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      byStatus,
      topProducts,
    };
  },
};

// ─── COMMERCE AI ENGINE ───────────────────────────────────────────────────────

export const commerceAIEngine = {
  async generatePricingInsight(creatorId: number, productId: string): Promise<CommerceAIInsight> {
    const product = _products.get(productId);
    const orders = Array.from(_orders.values()).filter(o => o.productId === productId);
    const avgOrderValue = orders.length > 0 ? orders.reduce((s, o) => s + o.totalPrice, 0) / orders.length : 0;

    let recommendation = `Current price: ${product?.price ?? 0}. Based on ${orders.length} sales.`;
    let confidence = 0.6;

    try {
      const response = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Analyze pricing for product "${product?.title ?? "unknown"}" priced at ${product?.price ?? 0} ${product?.currency ?? "USD"} with ${orders.length} sales and avg order value ${avgOrderValue.toFixed(2)}. Provide a JSON pricing recommendation: {"recommendation": "string", "suggestedPrice": number, "confidence": 0-1, "reasoning": "string"}`,
        }],
        maxTokens: 200,
      });
      const content = (response.choices[0]?.message?.content as string) ?? "";
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        recommendation = parsed.recommendation ?? recommendation;
        confidence = parsed.confidence ?? confidence;
      }
    } catch { /* use default */ }

    const insight: CommerceAIInsight = {
      id: `insight_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`,
      creatorId,
      insightType: "pricing",
      title: "Pricing Optimization",
      description: `Analysis for ${product?.title ?? productId}`,
      recommendation,
      expectedImpact: `+${Math.round((1 - confidence) * 20)}% revenue potential`,
      confidence,
      dataPoints: { productId, salesCount: orders.length, avgOrderValue },
      isActioned: false,
      generatedAt: new Date(),
    };
    _aiInsights.set(insight.id, insight);
    return insight;
  },

  generateUpsellOffer(triggeredByProductId: string, offeredProductId: string, offerType: "upsell" | "cross_sell" | "bundle"): UpsellOffer {
    const triggeredProduct = _products.get(triggeredByProductId);
    const offeredProduct = _products.get(offeredProductId);
    const id = `upsell_${triggeredByProductId}_${offeredProductId}`;
    const discountPercent = offerType === "bundle" ? 15 : 10;
    const bundlePrice = offerType === "bundle" && triggeredProduct && offeredProduct
      ? (triggeredProduct.price + offeredProduct.price) * (1 - discountPercent / 100)
      : undefined;

    const offer: UpsellOffer = {
      id,
      triggeredByProductId,
      offeredProductId,
      offerType,
      discountPercent: offerType !== "bundle" ? discountPercent : undefined,
      bundlePrice,
      displayText: offerType === "bundle"
        ? `Bundle with ${offeredProduct?.title ?? "item"} and save ${discountPercent}%!`
        : `Customers also bought: ${offeredProduct?.title ?? "item"} — ${discountPercent}% off`,
      acceptanceRate: 0,
      isActive: true,
      createdAt: new Date(),
    };
    _upsellOffers.set(id, offer);
    return offer;
  },

  segmentBuyers(creatorId: number): BuyerSegment[] {
    const orders = Array.from(_orders.values()).filter(o => o.sellerId === creatorId);
    const buyerStats: Record<number, { orders: CommerceOrder[]; totalSpent: number }> = {};

    for (const order of orders) {
      if (!buyerStats[order.buyerId]) buyerStats[order.buyerId] = { orders: [], totalSpent: 0 };
      buyerStats[order.buyerId].orders.push(order);
      buyerStats[order.buyerId].totalSpent += order.totalPrice;
    }

    const segments: BuyerSegment[] = [];
    const whaleIds: number[] = [];
    const repeatIds: number[] = [];
    const firstTimeIds: number[] = [];

    for (const [buyerIdStr, stats] of Object.entries(buyerStats)) {
      const buyerId = parseInt(buyerIdStr);
      if (stats.totalSpent > 500) whaleIds.push(buyerId);
      else if (stats.orders.length > 2) repeatIds.push(buyerId);
      else firstTimeIds.push(buyerId);
    }

    const makeSegment = (type: BuyerSegment["segmentType"], ids: number[]): BuyerSegment => {
      const segOrders = orders.filter(o => ids.includes(o.buyerId));
      return {
        id: `seg_${creatorId}_${type}`,
        creatorId,
        segmentName: type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        segmentType: type,
        buyerIds: ids,
        avgOrderValue: ids.length > 0 ? segOrders.reduce((s, o) => s + o.totalPrice, 0) / segOrders.length : 0,
        totalRevenue: segOrders.reduce((s, o) => s + o.totalPrice, 0),
        conversionRate: ids.length / Math.max(1, Object.keys(buyerStats).length),
        lastUpdated: new Date(),
      };
    };

    if (whaleIds.length > 0) { const s = makeSegment("whale", whaleIds); _buyerSegments.set(s.id, s); segments.push(s); }
    if (repeatIds.length > 0) { const s = makeSegment("repeat_buyer", repeatIds); _buyerSegments.set(s.id, s); segments.push(s); }
    if (firstTimeIds.length > 0) { const s = makeSegment("first_time", firstTimeIds); _buyerSegments.set(s.id, s); segments.push(s); }

    return segments;
  },

  getCreatorInsights(creatorId: number): CommerceAIInsight[] {
    return Array.from(_aiInsights.values())
      .filter(i => i.creatorId === creatorId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  },

  getUpsellOffers(productId: string): UpsellOffer[] {
    return Array.from(_upsellOffers.values())
      .filter(o => o.triggeredByProductId === productId && o.isActive);
  },

  getCommerceDashboard(): {
    totalOrders: number;
    totalRevenue: number;
    activeLiveStreams: number;
    activeDrops: number;
    activeAuctions: number;
    topProducts: Array<{ productId: string; title: string; revenue: number }>;
  } {
    const orders = Array.from(_orders.values());
    const productRevenue: Record<string, number> = {};
    for (const o of orders) {
      productRevenue[o.productId] = (productRevenue[o.productId] ?? 0) + o.totalPrice;
    }
    const topProducts = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, revenue]) => ({
        productId,
        title: _products.get(productId)?.title ?? productId,
        revenue,
      }));

    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + o.totalPrice, 0),
      activeLiveStreams: liveShoppingEngine.getLiveStreams().length,
      activeDrops: timedDropsEngine.getActiveDrops().length,
      activeAuctions: flashAuctionEngine.getActiveAuctions().length,
      topProducts,
    };
  },
};
