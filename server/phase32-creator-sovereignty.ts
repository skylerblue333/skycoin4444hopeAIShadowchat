import crypto from 'crypto';
/**
 * PHASE 32 — CREATOR SOVEREIGNTY ENGINE
 * Audience ownership exports, creator-owned storefronts, memberships,
 * token economies, reward systems, affiliate networks, revenue splitting,
 * team payroll, editor/mod payouts, creator treasury systems.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type StorefrontStatus = "draft" | "active" | "paused" | "suspended";
export type MembershipTier = "free" | "supporter" | "member" | "vip" | "founding";
export type PayrollFrequency = "weekly" | "biweekly" | "monthly";
export type PayrollRole = "editor" | "moderator" | "manager" | "contributor" | "designer" | "developer";
export type TokenEconomyType = "utility" | "governance" | "reward" | "access";
export type AffiliateStatus = "pending" | "active" | "paused" | "terminated";

export interface CreatorStorefront {
  id: string;
  creatorId: number;
  slug: string;
  name: string;
  description: string;
  bannerUrl?: string;
  logoUrl?: string;
  status: StorefrontStatus;
  currency: string;
  customDomain?: string;
  theme: Record<string, string>;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  commissionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudienceExport {
  id: string;
  creatorId: number;
  exportType: "email_list" | "follower_list" | "subscriber_list" | "buyer_list" | "full_crm";
  format: "csv" | "json" | "xlsx";
  totalRecords: number;
  filePath?: string;
  status: "pending" | "processing" | "ready" | "expired";
  requestedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  downloadCount: number;
}

export interface CreatorMembership {
  id: string;
  creatorId: number;
  tier: MembershipTier;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "annual";
  perks: string[];
  maxMembers?: number;
  currentMembers: number;
  totalRevenue: number;
  isActive: boolean;
  createdAt: Date;
}

export interface MembershipSubscription {
  id: string;
  userId: number;
  creatorId: number;
  membershipId: string;
  tier: MembershipTier;
  status: "active" | "cancelled" | "expired" | "paused";
  startedAt: Date;
  renewsAt: Date;
  cancelledAt?: Date;
  totalPaid: number;
  paymentMethod: string;
}

export interface CreatorTokenEconomy {
  id: string;
  creatorId: number;
  tokenSymbol: string;
  tokenName: string;
  economyType: TokenEconomyType;
  totalSupply: number;
  circulatingSupply: number;
  priceUSD: number;
  marketCap: number;
  holderCount: number;
  rewardPool: number;
  isActive: boolean;
  createdAt: Date;
}

export interface TokenHolder {
  id: string;
  userId: number;
  creatorId: number;
  tokenSymbol: string;
  balance: number;
  lockedBalance: number;
  earnedTotal: number;
  spentTotal: number;
  lastActivityAt: Date;
}

export interface RevenueShare {
  id: string;
  creatorId: number;
  recipientId: number;
  role: string;
  sharePercentage: number;
  fixedAmount?: number;
  currency: string;
  isActive: boolean;
  totalPaid: number;
  createdAt: Date;
}

export interface PayrollEntry {
  id: string;
  creatorId: number;
  recipientId: number;
  role: PayrollRole;
  amount: number;
  currency: string;
  frequency: PayrollFrequency;
  isActive: boolean;
  nextPaymentAt: Date;
  totalPaid: number;
  lastPaidAt?: Date;
  createdAt: Date;
}

export interface PayrollPayment {
  id: string;
  payrollEntryId: string;
  creatorId: number;
  recipientId: number;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed";
  paidAt?: Date;
  txHash?: string;
  createdAt: Date;
}

export interface CreatorTreasury {
  id: string;
  creatorId: number;
  totalBalance: number;
  currency: string;
  reserveBalance: number;
  operatingBalance: number;
  payrollBalance: number;
  investmentBalance: number;
  totalInflow: number;
  totalOutflow: number;
  lastUpdatedAt: Date;
}

export interface TreasuryTransaction {
  id: string;
  creatorId: number;
  type: "inflow" | "outflow";
  category: "revenue" | "payroll" | "investment" | "charity" | "tax" | "refund" | "other";
  amount: number;
  currency: string;
  description: string;
  recipientId?: number;
  txHash?: string;
  createdAt: Date;
}

export interface CreatorAffiliateProgram {
  id: string;
  creatorId: number;
  name: string;
  commissionRate: number;
  cookieDurationDays: number;
  minPayout: number;
  currency: string;
  isActive: boolean;
  totalAffiliates: number;
  totalRevenue: number;
  totalPaid: number;
  createdAt: Date;
}

export interface AffiliateLink {
  id: string;
  affiliateId: number;
  creatorId: number;
  programId: string;
  code: string;
  status: AffiliateStatus;
  clicks: number;
  conversions: number;
  revenue: number;
  pendingPayout: number;
  totalPaid: number;
  createdAt: Date;
  lastClickAt?: Date;
}

export interface CreatorRewardSystem {
  id: string;
  creatorId: number;
  name: string;
  description: string;
  rewardType: "points" | "tokens" | "nft" | "discount" | "access";
  triggerAction: string;
  rewardAmount: number;
  currency?: string;
  maxRewardsPerUser?: number;
  totalBudget: number;
  spentBudget: number;
  isActive: boolean;
  createdAt: Date;
}

// ─── STATE ────────────────────────────────────────────────────────────────────

const _storefronts = new Map<string, CreatorStorefront>();
const _audienceExports = new Map<string, AudienceExport>();
const _memberships = new Map<string, CreatorMembership>();
const _subscriptions = new Map<string, MembershipSubscription>();
const _tokenEconomies = new Map<string, CreatorTokenEconomy>();
const _tokenHolders = new Map<string, TokenHolder>();
const _revenueShares = new Map<string, RevenueShare>();
const _payrollEntries = new Map<string, PayrollEntry>();
const _payrollPayments = new Map<string, PayrollPayment>();
const _treasuries = new Map<number, CreatorTreasury>();
const _treasuryTxs = new Map<string, TreasuryTransaction>();
const _affiliatePrograms = new Map<string, CreatorAffiliateProgram>();
const _affiliateLinks = new Map<string, AffiliateLink>();
const _rewardSystems = new Map<string, CreatorRewardSystem>();

function _id(prefix: string): string {
  return `${prefix}_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 9)}`;
}

// ─── STOREFRONT ENGINE ────────────────────────────────────────────────────────

export const storefrontEngine = {
  create(params: {
    creatorId: number;
    slug: string;
    name: string;
    description: string;
    currency?: string;
    commissionRate?: number;
  }): CreatorStorefront {
    const storefront: CreatorStorefront = {
      id: _id("store"),
      creatorId: params.creatorId,
      slug: params.slug,
      name: params.name,
      description: params.description,
      status: "draft",
      currency: params.currency ?? "USD",
      theme: { primary: "#6366f1", secondary: "#8b5cf6", background: "#0f0f23" },
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      commissionRate: params.commissionRate ?? 0.05,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _storefronts.set(storefront.id, storefront);
    return storefront;
  },

  publish(storefrontId: string): CreatorStorefront | null {
    const s = _storefronts.get(storefrontId);
    if (!s) return null;
    s.status = "active";
    s.updatedAt = new Date();
    return s;
  },

  pause(storefrontId: string): CreatorStorefront | null {
    const s = _storefronts.get(storefrontId);
    if (!s) return null;
    s.status = "paused";
    s.updatedAt = new Date();
    return s;
  },

  getByCreator(creatorId: number): CreatorStorefront[] {
    return Array.from(_storefronts.values()).filter(s => s.creatorId === creatorId);
  },

  getBySlug(slug: string): CreatorStorefront | null {
    return Array.from(_storefronts.values()).find(s => s.slug === slug) ?? null;
  },

  recordSale(storefrontId: string, amount: number): CreatorStorefront | null {
    const s = _storefronts.get(storefrontId);
    if (!s) return null;
    s.totalRevenue += amount;
    s.totalOrders++;
    s.updatedAt = new Date();
    return s;
  },

  setCustomDomain(storefrontId: string, domain: string): CreatorStorefront | null {
    const s = _storefronts.get(storefrontId);
    if (!s) return null;
    s.customDomain = domain;
    s.updatedAt = new Date();
    return s;
  },

  getTopStorefronts(limit = 20): CreatorStorefront[] {
    return Array.from(_storefronts.values())
      .filter(s => s.status === "active")
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  },
};

// ─── AUDIENCE EXPORT ENGINE ───────────────────────────────────────────────────

export const audienceExportEngine = {
  requestExport(params: {
    creatorId: number;
    exportType: AudienceExport["exportType"];
    format: AudienceExport["format"];
    totalRecords: number;
  }): AudienceExport {
    const exp: AudienceExport = {
      id: _id("export"),
      creatorId: params.creatorId,
      exportType: params.exportType,
      format: params.format,
      totalRecords: params.totalRecords,
      status: "pending",
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
      downloadCount: 0,
    };
    _audienceExports.set(exp.id, exp);
    return exp;
  },

  processExport(exportId: string): AudienceExport | null {
    const exp = _audienceExports.get(exportId);
    if (!exp) return null;
    exp.status = "ready";
    exp.completedAt = new Date();
    exp.filePath = `/exports/${exp.creatorId}/${exp.id}.${exp.format}`;
    return exp;
  },

  downloadExport(exportId: string): AudienceExport | null {
    const exp = _audienceExports.get(exportId);
    if (!exp || exp.status !== "ready") return null;
    if (exp.expiresAt < new Date()) {
      exp.status = "expired";
      return null;
    }
    exp.downloadCount++;
    return exp;
  },

  getCreatorExports(creatorId: number): AudienceExport[] {
    return Array.from(_audienceExports.values())
      .filter(e => e.creatorId === creatorId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  },
};

// ─── MEMBERSHIP ENGINE ────────────────────────────────────────────────────────

export const membershipEngine = {
  createTier(params: {
    creatorId: number;
    tier: MembershipTier;
    name: string;
    description: string;
    price: number;
    currency: string;
    billingCycle: "monthly" | "annual";
    perks: string[];
    maxMembers?: number;
  }): CreatorMembership {
    const membership: CreatorMembership = {
      id: _id("mem"),
      creatorId: params.creatorId,
      tier: params.tier,
      name: params.name,
      description: params.description,
      price: params.price,
      currency: params.currency,
      billingCycle: params.billingCycle,
      perks: params.perks,
      maxMembers: params.maxMembers,
      currentMembers: 0,
      totalRevenue: 0,
      isActive: true,
      createdAt: new Date(),
    };
    _memberships.set(membership.id, membership);
    return membership;
  },

  subscribe(params: {
    userId: number;
    membershipId: string;
    paymentMethod: string;
  }): MembershipSubscription | null {
    const membership = _memberships.get(params.membershipId);
    if (!membership || !membership.isActive) return null;
    if (membership.maxMembers && membership.currentMembers >= membership.maxMembers) return null;

    const renewsAt = new Date();
    if (membership.billingCycle === "monthly") {
      renewsAt.setMonth(renewsAt.getMonth() + 1);
    } else {
      renewsAt.setFullYear(renewsAt.getFullYear() + 1);
    }

    const sub: MembershipSubscription = {
      id: _id("sub"),
      userId: params.userId,
      creatorId: membership.creatorId,
      membershipId: params.membershipId,
      tier: membership.tier,
      status: "active",
      startedAt: new Date(),
      renewsAt,
      totalPaid: membership.price,
      paymentMethod: params.paymentMethod,
    };
    _subscriptions.set(sub.id, sub);
    membership.currentMembers++;
    membership.totalRevenue += membership.price;
    return sub;
  },

  cancelSubscription(subscriptionId: string): MembershipSubscription | null {
    const sub = _subscriptions.get(subscriptionId);
    if (!sub) return null;
    sub.status = "cancelled";
    sub.cancelledAt = new Date();
    const membership = _memberships.get(sub.membershipId);
    if (membership) membership.currentMembers = Math.max(0, membership.currentMembers - 1);
    return sub;
  },

  getCreatorMemberships(creatorId: number): CreatorMembership[] {
    return Array.from(_memberships.values()).filter(m => m.creatorId === creatorId);
  },

  getUserSubscriptions(userId: number): MembershipSubscription[] {
    return Array.from(_subscriptions.values())
      .filter(s => s.userId === userId && s.status === "active");
  },

  getMembershipStats(creatorId: number): {
    totalMembers: number;
    totalRevenue: number;
    byTier: Record<string, number>;
  } {
    const memberships = Array.from(_memberships.values()).filter(m => m.creatorId === creatorId);
    const byTier: Record<string, number> = {};
    let totalMembers = 0;
    let totalRevenue = 0;
    for (const m of memberships) {
      byTier[m.tier] = (byTier[m.tier] ?? 0) + m.currentMembers;
      totalMembers += m.currentMembers;
      totalRevenue += m.totalRevenue;
    }
    return { totalMembers, totalRevenue, byTier };
  },
};

// ─── TOKEN ECONOMY ENGINE ─────────────────────────────────────────────────────

export const tokenEconomyEngine = {
  createEconomy(params: {
    creatorId: number;
    tokenSymbol: string;
    tokenName: string;
    economyType: TokenEconomyType;
    totalSupply: number;
    initialPrice: number;
    rewardPool?: number;
  }): CreatorTokenEconomy {
    const economy: CreatorTokenEconomy = {
      id: _id("tke"),
      creatorId: params.creatorId,
      tokenSymbol: params.tokenSymbol,
      tokenName: params.tokenName,
      economyType: params.economyType,
      totalSupply: params.totalSupply,
      circulatingSupply: 0,
      priceUSD: params.initialPrice,
      marketCap: 0,
      holderCount: 0,
      rewardPool: params.rewardPool ?? params.totalSupply * 0.3,
      isActive: true,
      createdAt: new Date(),
    };
    _tokenEconomies.set(economy.id, economy);
    return economy;
  },

  distributeTokens(economyId: string, userId: number, amount: number): TokenHolder | null {
    const economy = _tokenEconomies.get(economyId);
    if (!economy || !economy.isActive) return null;
    if (economy.rewardPool < amount) return null;

    const key = `${userId}:${economy.tokenSymbol}`;
    const existing = _tokenHolders.get(key);
    const holder: TokenHolder = existing ?? {
      id: _id("holder"),
      userId,
      creatorId: economy.creatorId,
      tokenSymbol: economy.tokenSymbol,
      balance: 0,
      lockedBalance: 0,
      earnedTotal: 0,
      spentTotal: 0,
      lastActivityAt: new Date(),
    };

    holder.balance += amount;
    holder.earnedTotal += amount;
    holder.lastActivityAt = new Date();
    _tokenHolders.set(key, holder);

    economy.rewardPool -= amount;
    economy.circulatingSupply += amount;
    economy.marketCap = economy.circulatingSupply * economy.priceUSD;
    if (!existing) economy.holderCount++;

    return holder;
  },

  getHolderBalance(userId: number, tokenSymbol: string): TokenHolder | null {
    return _tokenHolders.get(`${userId}:${tokenSymbol}`) ?? null;
  },

  getCreatorEconomies(creatorId: number): CreatorTokenEconomy[] {
    return Array.from(_tokenEconomies.values()).filter(e => e.creatorId === creatorId);
  },

  updatePrice(economyId: string, newPrice: number): CreatorTokenEconomy | null {
    const economy = _tokenEconomies.get(economyId);
    if (!economy) return null;
    economy.priceUSD = newPrice;
    economy.marketCap = economy.circulatingSupply * newPrice;
    return economy;
  },
};

// ─── REVENUE SHARE ENGINE ─────────────────────────────────────────────────────

export const revenueShareEngine = {
  createShare(params: {
    creatorId: number;
    recipientId: number;
    role: string;
    sharePercentage: number;
    currency: string;
    fixedAmount?: number;
  }): RevenueShare {
    const share: RevenueShare = {
      id: _id("revshare"),
      creatorId: params.creatorId,
      recipientId: params.recipientId,
      role: params.role,
      sharePercentage: params.sharePercentage,
      fixedAmount: params.fixedAmount,
      currency: params.currency,
      isActive: true,
      totalPaid: 0,
      createdAt: new Date(),
    };
    _revenueShares.set(share.id, share);
    return share;
  },

  distributeRevenue(creatorId: number, totalRevenue: number): Array<{ share: RevenueShare; payout: number }> {
    const shares = Array.from(_revenueShares.values())
      .filter(s => s.creatorId === creatorId && s.isActive);
    const results: Array<{ share: RevenueShare; payout: number }> = [];
    for (const share of shares) {
      const payout = share.fixedAmount ?? (totalRevenue * share.sharePercentage / 100);
      share.totalPaid += payout;
      results.push({ share, payout });
    }
    return results;
  },

  getCreatorShares(creatorId: number): RevenueShare[] {
    return Array.from(_revenueShares.values()).filter(s => s.creatorId === creatorId);
  },

  deactivateShare(shareId: string): RevenueShare | null {
    const share = _revenueShares.get(shareId);
    if (!share) return null;
    share.isActive = false;
    return share;
  },
};

// ─── PAYROLL ENGINE ───────────────────────────────────────────────────────────

export const payrollEngine = {
  addEntry(params: {
    creatorId: number;
    recipientId: number;
    role: PayrollRole;
    amount: number;
    currency: string;
    frequency: PayrollFrequency;
  }): PayrollEntry {
    const nextPaymentAt = new Date();
    if (params.frequency === "weekly") nextPaymentAt.setDate(nextPaymentAt.getDate() + 7);
    else if (params.frequency === "biweekly") nextPaymentAt.setDate(nextPaymentAt.getDate() + 14);
    else nextPaymentAt.setMonth(nextPaymentAt.getMonth() + 1);

    const entry: PayrollEntry = {
      id: _id("payroll"),
      creatorId: params.creatorId,
      recipientId: params.recipientId,
      role: params.role,
      amount: params.amount,
      currency: params.currency,
      frequency: params.frequency,
      isActive: true,
      nextPaymentAt,
      totalPaid: 0,
      createdAt: new Date(),
    };
    _payrollEntries.set(entry.id, entry);
    return entry;
  },

  processPayment(entryId: string): PayrollPayment | null {
    const entry = _payrollEntries.get(entryId);
    if (!entry || !entry.isActive) return null;

    const payment: PayrollPayment = {
      id: _id("pay"),
      payrollEntryId: entryId,
      creatorId: entry.creatorId,
      recipientId: entry.recipientId,
      amount: entry.amount,
      currency: entry.currency,
      status: "completed",
      paidAt: new Date(),
      txHash: `0x${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2).padStart(64, "0")}`,
      createdAt: new Date(),
    };
    _payrollPayments.set(payment.id, payment);

    entry.totalPaid += entry.amount;
    entry.lastPaidAt = new Date();
    // Advance next payment date
    if (entry.frequency === "weekly") entry.nextPaymentAt = new Date(entry.nextPaymentAt.getTime() + 7 * 86400000);
    else if (entry.frequency === "biweekly") entry.nextPaymentAt = new Date(entry.nextPaymentAt.getTime() + 14 * 86400000);
    else {
      entry.nextPaymentAt = new Date(entry.nextPaymentAt);
      entry.nextPaymentAt.setMonth(entry.nextPaymentAt.getMonth() + 1);
    }

    // Update treasury
    const treasury = _treasuries.get(entry.creatorId);
    if (treasury) {
      treasury.totalOutflow += entry.amount;
      treasury.payrollBalance = Math.max(0, treasury.payrollBalance - entry.amount);
      treasury.lastUpdatedAt = new Date();
    }

    return payment;
  },

  getCreatorPayroll(creatorId: number): PayrollEntry[] {
    return Array.from(_payrollEntries.values()).filter(e => e.creatorId === creatorId);
  },

  getPaymentHistory(creatorId: number): PayrollPayment[] {
    return Array.from(_payrollPayments.values())
      .filter(p => p.creatorId === creatorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getMonthlyPayrollCost(creatorId: number): number {
    const entries = Array.from(_payrollEntries.values())
      .filter(e => e.creatorId === creatorId && e.isActive);
    let monthly = 0;
    for (const e of entries) {
      if (e.frequency === "weekly") monthly += e.amount * 4.33;
      else if (e.frequency === "biweekly") monthly += e.amount * 2.17;
      else monthly += e.amount;
    }
    return Math.round(monthly * 100) / 100;
  },

  terminateEntry(entryId: string): PayrollEntry | null {
    const entry = _payrollEntries.get(entryId);
    if (!entry) return null;
    entry.isActive = false;
    return entry;
  },
};

// ─── CREATOR TREASURY ENGINE ──────────────────────────────────────────────────

export const creatorTreasuryEngine = {
  getOrCreate(creatorId: number): CreatorTreasury {
    const existing = _treasuries.get(creatorId);
    if (existing) return existing;
    const treasury: CreatorTreasury = {
      id: _id("treasury"),
      creatorId,
      totalBalance: 0,
      currency: "USD",
      reserveBalance: 0,
      operatingBalance: 0,
      payrollBalance: 0,
      investmentBalance: 0,
      totalInflow: 0,
      totalOutflow: 0,
      lastUpdatedAt: new Date(),
    };
    _treasuries.set(creatorId, treasury);
    return treasury;
  },

  deposit(creatorId: number, amount: number, category: TreasuryTransaction["category"], description: string): TreasuryTransaction {
    const treasury = this.getOrCreate(creatorId);
    treasury.totalBalance += amount;
    treasury.totalInflow += amount;
    // Auto-allocate: 30% reserve, 40% operating, 20% payroll, 10% investment
    treasury.reserveBalance += amount * 0.3;
    treasury.operatingBalance += amount * 0.4;
    treasury.payrollBalance += amount * 0.2;
    treasury.investmentBalance += amount * 0.1;
    treasury.lastUpdatedAt = new Date();

    const tx: TreasuryTransaction = {
      id: _id("ttx"),
      creatorId,
      type: "inflow",
      category,
      amount,
      currency: treasury.currency,
      description,
      createdAt: new Date(),
    };
    _treasuryTxs.set(tx.id, tx);
    return tx;
  },

  withdraw(creatorId: number, amount: number, category: TreasuryTransaction["category"], description: string, recipientId?: number): TreasuryTransaction | null {
    const treasury = _treasuries.get(creatorId);
    if (!treasury || treasury.operatingBalance < amount) return null;
    treasury.totalBalance -= amount;
    treasury.totalOutflow += amount;
    treasury.operatingBalance -= amount;
    treasury.lastUpdatedAt = new Date();

    const tx: TreasuryTransaction = {
      id: _id("ttx"),
      creatorId,
      type: "outflow",
      category,
      amount,
      currency: treasury.currency,
      description,
      recipientId,
      createdAt: new Date(),
    };
    _treasuryTxs.set(tx.id, tx);
    return tx;
  },

  getTreasury(creatorId: number): CreatorTreasury | null {
    return _treasuries.get(creatorId) ?? null;
  },

  getTransactionHistory(creatorId: number, limit = 50): TreasuryTransaction[] {
    return Array.from(_treasuryTxs.values())
      .filter(t => t.creatorId === creatorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  },

  getTreasuryStats(creatorId: number): {
    balance: number;
    monthlyInflow: number;
    monthlyOutflow: number;
    payrollCost: number;
    runway: number;
  } {
    const treasury = _treasuries.get(creatorId);
    if (!treasury) return { balance: 0, monthlyInflow: 0, monthlyOutflow: 0, payrollCost: 0, runway: 0 };
    const payrollCost = payrollEngine.getMonthlyPayrollCost(creatorId);
    const runway = payrollCost > 0 ? Math.floor(treasury.totalBalance / payrollCost) : 999;
    // Approximate monthly from last 30 days of transactions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentTxs = Array.from(_treasuryTxs.values())
      .filter(t => t.creatorId === creatorId && t.createdAt >= thirtyDaysAgo);
    const monthlyInflow = recentTxs.filter(t => t.type === "inflow").reduce((s, t) => s + t.amount, 0);
    const monthlyOutflow = recentTxs.filter(t => t.type === "outflow").reduce((s, t) => s + t.amount, 0);
    return { balance: treasury.totalBalance, monthlyInflow, monthlyOutflow, payrollCost, runway };
  },
};

// ─── AFFILIATE NETWORK ENGINE ─────────────────────────────────────────────────

export const affiliateNetworkEngine = {
  createProgram(params: {
    creatorId: number;
    name: string;
    commissionRate: number;
    cookieDurationDays?: number;
    minPayout?: number;
    currency?: string;
  }): CreatorAffiliateProgram {
    const program: CreatorAffiliateProgram = {
      id: _id("affprog"),
      creatorId: params.creatorId,
      name: params.name,
      commissionRate: params.commissionRate,
      cookieDurationDays: params.cookieDurationDays ?? 30,
      minPayout: params.minPayout ?? 50,
      currency: params.currency ?? "USD",
      isActive: true,
      totalAffiliates: 0,
      totalRevenue: 0,
      totalPaid: 0,
      createdAt: new Date(),
    };
    _affiliatePrograms.set(program.id, program);
    return program;
  },

  joinProgram(programId: string, affiliateId: number): AffiliateLink | null {
    const program = _affiliatePrograms.get(programId);
    if (!program || !program.isActive) return null;

    const code = `${program.creatorId}_${affiliateId}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8).toUpperCase()}`;
    const link: AffiliateLink = {
      id: _id("afflink"),
      affiliateId,
      creatorId: program.creatorId,
      programId,
      code,
      status: "active",
      clicks: 0,
      conversions: 0,
      revenue: 0,
      pendingPayout: 0,
      totalPaid: 0,
      createdAt: new Date(),
    };
    _affiliateLinks.set(link.id, link);
    program.totalAffiliates++;
    return link;
  },

  recordConversion(affiliateCode: string, saleAmount: number): AffiliateLink | null {
    const link = Array.from(_affiliateLinks.values()).find(l => l.code === affiliateCode);
    if (!link || link.status !== "active") return null;
    const program = _affiliatePrograms.get(link.programId);
    if (!program) return null;

    const commission = saleAmount * program.commissionRate;
    link.conversions++;
    link.revenue += saleAmount;
    link.pendingPayout += commission;
    link.lastClickAt = new Date();
    program.totalRevenue += saleAmount;
    return link;
  },

  recordClick(affiliateCode: string): boolean {
    const link = Array.from(_affiliateLinks.values()).find(l => l.code === affiliateCode);
    if (!link) return false;
    link.clicks++;
    link.lastClickAt = new Date();
    return true;
  },

  processPayout(affiliateLinkId: string): { paid: number; link: AffiliateLink } | null {
    const link = _affiliateLinks.get(affiliateLinkId);
    if (!link) return null;
    const program = _affiliatePrograms.get(link.programId);
    if (!program || link.pendingPayout < program.minPayout) return null;

    const paid = link.pendingPayout;
    link.totalPaid += paid;
    link.pendingPayout = 0;
    program.totalPaid += paid;
    return { paid, link };
  },

  getAffiliateStats(affiliateId: number): {
    totalLinks: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    pendingPayout: number;
    totalPaid: number;
  } {
    const links = Array.from(_affiliateLinks.values()).filter(l => l.affiliateId === affiliateId);
    return {
      totalLinks: links.length,
      totalClicks: links.reduce((s, l) => s + l.clicks, 0),
      totalConversions: links.reduce((s, l) => s + l.conversions, 0),
      totalRevenue: links.reduce((s, l) => s + l.revenue, 0),
      pendingPayout: links.reduce((s, l) => s + l.pendingPayout, 0),
      totalPaid: links.reduce((s, l) => s + l.totalPaid, 0),
    };
  },
};

// ─── REWARD SYSTEM ENGINE ─────────────────────────────────────────────────────

export const rewardSystemEngine = {
  createSystem(params: {
    creatorId: number;
    name: string;
    description: string;
    rewardType: CreatorRewardSystem["rewardType"];
    triggerAction: string;
    rewardAmount: number;
    currency?: string;
    maxRewardsPerUser?: number;
    totalBudget: number;
  }): CreatorRewardSystem {
    const system: CreatorRewardSystem = {
      id: _id("reward"),
      creatorId: params.creatorId,
      name: params.name,
      description: params.description,
      rewardType: params.rewardType,
      triggerAction: params.triggerAction,
      rewardAmount: params.rewardAmount,
      currency: params.currency,
      maxRewardsPerUser: params.maxRewardsPerUser,
      totalBudget: params.totalBudget,
      spentBudget: 0,
      isActive: true,
      createdAt: new Date(),
    };
    _rewardSystems.set(system.id, system);
    return system;
  },

  triggerReward(systemId: string, userId: number): { rewarded: boolean; amount: number } {
    const system = _rewardSystems.get(systemId);
    if (!system || !system.isActive) return { rewarded: false, amount: 0 };
    if (system.spentBudget + system.rewardAmount > system.totalBudget) return { rewarded: false, amount: 0 };

    system.spentBudget += system.rewardAmount;
    if (system.spentBudget >= system.totalBudget) system.isActive = false;
    return { rewarded: true, amount: system.rewardAmount };
  },

  getCreatorSystems(creatorId: number): CreatorRewardSystem[] {
    return Array.from(_rewardSystems.values()).filter(s => s.creatorId === creatorId);
  },

  getSystemStats(systemId: string): { budgetUsed: number; budgetRemaining: number; percentUsed: number } | null {
    const system = _rewardSystems.get(systemId);
    if (!system) return null;
    return {
      budgetUsed: system.spentBudget,
      budgetRemaining: system.totalBudget - system.spentBudget,
      percentUsed: Math.round((system.spentBudget / system.totalBudget) * 100),
    };
  },
};

// ─── CREATOR SOVEREIGNTY DASHBOARD ───────────────────────────────────────────

export const creatorSovereigntyDashboard = {
  getSovereigntyProfile(creatorId: number): {
    storefronts: CreatorStorefront[];
    memberships: ReturnType<typeof membershipEngine.getMembershipStats>;
    tokenEconomies: CreatorTokenEconomy[];
    treasury: ReturnType<typeof creatorTreasuryEngine.getTreasuryStats>;
    payroll: PayrollEntry[];
    revenueShares: RevenueShare[];
    affiliatePrograms: CreatorAffiliateProgram[];
    rewardSystems: CreatorRewardSystem[];
  } {
    return {
      storefronts: storefrontEngine.getByCreator(creatorId),
      memberships: membershipEngine.getMembershipStats(creatorId),
      tokenEconomies: tokenEconomyEngine.getCreatorEconomies(creatorId),
      treasury: creatorTreasuryEngine.getTreasuryStats(creatorId),
      payroll: payrollEngine.getCreatorPayroll(creatorId),
      revenueShares: revenueShareEngine.getCreatorShares(creatorId),
      affiliatePrograms: Array.from(_affiliatePrograms.values()).filter(p => p.creatorId === creatorId),
      rewardSystems: rewardSystemEngine.getCreatorSystems(creatorId),
    };
  },
};
