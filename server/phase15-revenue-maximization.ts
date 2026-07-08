/**
 * PHASE 15 — REVENUE MAXIMIZATION ENGINE
 * Creator Revenue, Platform Revenue, Treasury Intelligence
 * Every dollar trackable. Every route monetized.
 */

// ─── CREATOR REVENUE ENGINE ──────────────────────────────────────────────────

export interface AdRevenueSplit {
  creatorId: number;
  period: string;
  totalAdRevenue: number;
  platformCut: number;     // 30%
  creatorShare: number;    // 70%
  impressions: number;
  clicks: number;
  cpm: number;
  ctr: number;
  paidOut: boolean;
  settledAt?: Date;
}

export interface SubscriptionTier {
  id: string;
  creatorId: number;
  name: string;
  price: number;
  currency: "USD" | "SKY444" | "ETH";
  interval: "monthly" | "quarterly" | "annual";
  perks: string[];
  maxSubscribers?: number;
  isActive: boolean;
  subscriberCount: number;
  mrr: number;
  createdAt: Date;
}

export interface CreatorPremiumVault {
  id: string;
  creatorId: number;
  title: string;
  description: string;
  price: number;
  currency: "USD" | "SKY444" | "ETH";
  contentType: "video" | "audio" | "document" | "bundle" | "course";
  contentUrl: string;
  thumbnailUrl: string;
  purchaseCount: number;
  totalRevenue: number;
  isActive: boolean;
  createdAt: Date;
}

export interface PPVStream {
  id: string;
  creatorId: number;
  streamId: string;
  title: string;
  price: number;
  currency: "USD" | "SKY444" | "ETH";
  scheduledFor: Date;
  purchaseCount: number;
  totalRevenue: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  createdAt: Date;
}

export interface PaidCommunity {
  id: string;
  communityId: string;
  name: string;
  price: number;
  currency: "USD" | "SKY444" | "ETH";
  interval: "monthly" | "annual";
  memberCount: number;
  mrr: number;
  perks: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface DigitalProduct {
  id: string;
  creatorId: number;
  title: string;
  description: string;
  price: number;
  currency: "USD" | "SKY444" | "ETH";
  productType: "ebook" | "template" | "preset" | "plugin" | "course" | "nft_pack" | "other";
  downloadUrl: string;
  thumbnailUrl: string;
  salesCount: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface AffiliateLink {
  id: string;
  creatorId: number;
  targetType: "product" | "community" | "subscription" | "stream" | "nft";
  targetId: string;
  code: string;
  commissionRate: number;
  clicks: number;
  conversions: number;
  totalEarned: number;
  isActive: boolean;
  createdAt: Date;
}

export interface SponsorshipContract {
  id: string;
  creatorId: number;
  sponsorId: number;
  sponsorName: string;
  dealValue: number;
  currency: "USD" | "SKY444";
  deliverables: string[];
  startDate: Date;
  endDate: Date;
  status: "proposed" | "negotiating" | "active" | "completed" | "cancelled";
  platformFee: number;
  creatorNet: number;
  createdAt: Date;
}

export interface PremiumDM {
  id: string;
  senderId: number;
  recipientId: number;
  price: number;
  currency: "USD" | "SKY444";
  message: string;
  mediaUrl?: string;
  paid: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface TippingUpgrade {
  id: string;
  senderId: number;
  recipientId: number;
  amount: number;
  currency: "USD" | "SKY444" | "ETH";
  message?: string;
  tier: "standard" | "super" | "mega" | "legendary";
  multiplier: number;
  platformFee: number;
  creatorNet: number;
  createdAt: Date;
}

// ─── PLATFORM REVENUE ENGINE ─────────────────────────────────────────────────

export interface PlatformFeeRecord {
  id: string;
  transactionType: "subscription" | "ppv" | "digital_product" | "nft_sale" | "sponsorship" | "tip" | "premium_dm" | "marketplace" | "swap";
  transactionId: string;
  grossAmount: number;
  feeRate: number;
  feeAmount: number;
  currency: "USD" | "SKY444" | "ETH";
  createdAt: Date;
}

export interface AdCampaign {
  id: string;
  advertiserId: number;
  title: string;
  budget: number;
  spent: number;
  targetAudience: {
    ageMin?: number;
    ageMax?: number;
    interests?: string[];
    regions?: string[];
    creatorCategories?: string[];
  };
  adType: "banner" | "video" | "sponsored_post" | "promoted_stream" | "promoted_community" | "featured_nft" | "creator_boost";
  cpm: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  status: "draft" | "pending_review" | "active" | "paused" | "completed" | "rejected";
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export interface PromotedContent {
  id: string;
  contentType: "post" | "stream" | "community" | "marketplace_listing" | "nft" | "creator";
  contentId: string;
  promoterId: number;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  boostMultiplier: number;
  status: "active" | "paused" | "ended";
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

// ─── TREASURY INTELLIGENCE ───────────────────────────────────────────────────

export interface TreasurySnapshot {
  id: string;
  timestamp: Date;
  mrr: number;
  arr: number;
  totalRevenue: number;
  totalPayouts: number;
  netRevenue: number;
  burnRate: number;
  runway: number;
  cashPosition: number;
  tokenTreasuryUSD: number;
  creatorPayoutRatio: number;
  adConversionRevenue: number;
  subscriptionRevenue: number;
  transactionFeeRevenue: number;
  nftRoyaltyRevenue: number;
  sponsorshipRevenue: number;
  growthRate: number;
}

export interface RevenueBreakdown {
  period: string;
  subscriptions: number;
  ppv: number;
  digitalProducts: number;
  nftSales: number;
  tips: number;
  premiumDMs: number;
  sponsorships: number;
  platformFees: number;
  adRevenue: number;
  affiliateCommissions: number;
  total: number;
}

export interface CreatorPayoutSummary {
  creatorId: number;
  period: string;
  subscriptionRevenue: number;
  adRevenue: number;
  tipRevenue: number;
  ppvRevenue: number;
  digitalProductRevenue: number;
  sponsorshipRevenue: number;
  affiliateRevenue: number;
  platformFees: number;
  netPayout: number;
  status: "pending" | "processing" | "paid" | "failed";
  payoutDate?: Date;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _adRevenueSplits = new Map<string, AdRevenueSplit>();
const _subscriptionTiers = new Map<string, SubscriptionTier>();
const _premiumVaults = new Map<string, CreatorPremiumVault>();
const _ppvStreams = new Map<string, PPVStream>();
const _paidCommunities = new Map<string, PaidCommunity>();
const _digitalProducts = new Map<string, DigitalProduct>();
const _affiliateLinks = new Map<string, AffiliateLink>();
const _sponsorshipContracts = new Map<string, SponsorshipContract>();
const _premiumDMs = new Map<string, PremiumDM>();
const _tippingUpgrades = new Map<string, TippingUpgrade>();
const _platformFees = new Map<string, PlatformFeeRecord>();
const _adCampaigns = new Map<string, AdCampaign>();
const _promotedContent = new Map<string, PromotedContent>();
const _treasurySnapshots: TreasurySnapshot[] = [];
const _revenueBreakdowns = new Map<string, RevenueBreakdown>();
const _creatorPayouts = new Map<string, CreatorPayoutSummary>();

// ─── CREATOR REVENUE ENGINE IMPLEMENTATION ───────────────────────────────────

export const creatorRevenueEngine = {
  // Ad Revenue Splits
  calculateAdRevenueSplit(creatorId: number, period: string, totalAdRevenue: number, impressions: number, clicks: number): AdRevenueSplit {
    const id = `ads_${creatorId}_${period}`;
    const platformCut = Math.round(totalAdRevenue * 0.30 * 100) / 100;
    const creatorShare = Math.round(totalAdRevenue * 0.70 * 100) / 100;
    const cpm = impressions > 0 ? (totalAdRevenue / impressions) * 1000 : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const split: AdRevenueSplit = {
      creatorId, period, totalAdRevenue, platformCut, creatorShare,
      impressions, clicks, cpm: Math.round(cpm * 100) / 100,
      ctr: Math.round(ctr * 10000) / 10000,
      paidOut: false,
    };
    _adRevenueSplits.set(id, split);
    return split;
  },

  getAdRevenueSplit(creatorId: number, period: string): AdRevenueSplit | null {
    return _adRevenueSplits.get(`ads_${creatorId}_${period}`) ?? null;
  },

  markAdRevenuePaid(creatorId: number, period: string): AdRevenueSplit | null {
    const split = _adRevenueSplits.get(`ads_${creatorId}_${period}`);
    if (!split) return null;
    split.paidOut = true;
    split.settledAt = new Date();
    return split;
  },

  // Subscription Tiers
  createSubscriptionTier(params: Omit<SubscriptionTier, "id" | "subscriberCount" | "mrr" | "createdAt">): SubscriptionTier {
    const id = `tier_${params.creatorId}_${Date.now()}`;
    const tier: SubscriptionTier = {
      ...params, id,
      subscriberCount: 0,
      mrr: 0,
      createdAt: new Date(),
    };
    _subscriptionTiers.set(id, tier);
    return tier;
  },

  getSubscriptionTiers(creatorId: number): SubscriptionTier[] {
    return Array.from(_subscriptionTiers.values()).filter(t => t.creatorId === creatorId);
  },

  updateSubscriberCount(tierId: string, delta: number): SubscriptionTier | null {
    const tier = _subscriptionTiers.get(tierId);
    if (!tier) return null;
    tier.subscriberCount = Math.max(0, tier.subscriberCount + delta);
    tier.mrr = tier.subscriberCount * tier.price;
    return tier;
  },

  // Premium Vaults
  createPremiumVault(params: Omit<CreatorPremiumVault, "id" | "purchaseCount" | "totalRevenue" | "createdAt">): CreatorPremiumVault {
    const id = `vault_${params.creatorId}_${Date.now()}`;
    const vault: CreatorPremiumVault = {
      ...params, id,
      purchaseCount: 0,
      totalRevenue: 0,
      createdAt: new Date(),
    };
    _premiumVaults.set(id, vault);
    return vault;
  },

  purchaseVault(vaultId: string): CreatorPremiumVault | null {
    const vault = _premiumVaults.get(vaultId);
    if (!vault || !vault.isActive) return null;
    vault.purchaseCount++;
    vault.totalRevenue += vault.price;
    return vault;
  },

  getCreatorVaults(creatorId: number): CreatorPremiumVault[] {
    return Array.from(_premiumVaults.values()).filter(v => v.creatorId === creatorId);
  },

  // PPV Streams
  createPPVStream(params: Omit<PPVStream, "id" | "purchaseCount" | "totalRevenue" | "createdAt">): PPVStream {
    const id = `ppv_${params.creatorId}_${Date.now()}`;
    const ppv: PPVStream = {
      ...params, id,
      purchaseCount: 0,
      totalRevenue: 0,
      createdAt: new Date(),
    };
    _ppvStreams.set(id, ppv);
    return ppv;
  },

  purchasePPVAccess(ppvId: string): PPVStream | null {
    const ppv = _ppvStreams.get(ppvId);
    if (!ppv || ppv.status === "cancelled") return null;
    ppv.purchaseCount++;
    ppv.totalRevenue += ppv.price;
    return ppv;
  },

  updatePPVStatus(ppvId: string, status: PPVStream["status"]): PPVStream | null {
    const ppv = _ppvStreams.get(ppvId);
    if (!ppv) return null;
    ppv.status = status;
    return ppv;
  },

  // Paid Communities
  createPaidCommunity(params: Omit<PaidCommunity, "id" | "memberCount" | "mrr" | "createdAt">): PaidCommunity {
    const id = `pcom_${params.communityId}_${Date.now()}`;
    const community: PaidCommunity = {
      ...params, id,
      memberCount: 0,
      mrr: 0,
      createdAt: new Date(),
    };
    _paidCommunities.set(id, community);
    return community;
  },

  joinPaidCommunity(communityId: string): PaidCommunity | null {
    const community = _paidCommunities.get(communityId);
    if (!community || !community.isActive) return null;
    community.memberCount++;
    community.mrr = community.memberCount * community.price;
    return community;
  },

  // Digital Products
  createDigitalProduct(params: Omit<DigitalProduct, "id" | "salesCount" | "totalRevenue" | "rating" | "reviewCount" | "createdAt">): DigitalProduct {
    const id = `dp_${params.creatorId}_${Date.now()}`;
    const product: DigitalProduct = {
      ...params, id,
      salesCount: 0,
      totalRevenue: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
    };
    _digitalProducts.set(id, product);
    return product;
  },

  purchaseDigitalProduct(productId: string): DigitalProduct | null {
    const product = _digitalProducts.get(productId);
    if (!product || !product.isActive) return null;
    product.salesCount++;
    product.totalRevenue += product.price;
    return product;
  },

  rateDigitalProduct(productId: string, rating: number): DigitalProduct | null {
    const product = _digitalProducts.get(productId);
    if (!product) return null;
    product.rating = (product.rating * product.reviewCount + rating) / (product.reviewCount + 1);
    product.reviewCount++;
    return product;
  },

  getCreatorDigitalProducts(creatorId: number): DigitalProduct[] {
    return Array.from(_digitalProducts.values()).filter(p => p.creatorId === creatorId);
  },

  // Affiliate System
  createAffiliateLink(params: Omit<AffiliateLink, "id" | "clicks" | "conversions" | "totalEarned" | "createdAt">): AffiliateLink {
    const id = `aff_${params.creatorId}_${Date.now()}`;
    const link: AffiliateLink = {
      ...params, id,
      clicks: 0,
      conversions: 0,
      totalEarned: 0,
      createdAt: new Date(),
    };
    _affiliateLinks.set(id, link);
    return link;
  },

  trackAffiliateClick(linkId: string): AffiliateLink | null {
    const link = _affiliateLinks.get(linkId);
    if (!link || !link.isActive) return null;
    link.clicks++;
    return link;
  },

  recordAffiliateConversion(linkId: string, saleAmount: number): AffiliateLink | null {
    const link = _affiliateLinks.get(linkId);
    if (!link || !link.isActive) return null;
    link.conversions++;
    link.totalEarned += saleAmount * link.commissionRate;
    return link;
  },

  getCreatorAffiliateLinks(creatorId: number): AffiliateLink[] {
    return Array.from(_affiliateLinks.values()).filter(l => l.creatorId === creatorId);
  },

  // Sponsorship Contracts
  createSponsorshipContract(params: Omit<SponsorshipContract, "id" | "platformFee" | "creatorNet" | "createdAt">): SponsorshipContract {
    const id = `sponsor_${params.creatorId}_${Date.now()}`;
    const platformFee = params.dealValue * 0.10;
    const creatorNet = params.dealValue - platformFee;
    const contract: SponsorshipContract = {
      ...params, id, platformFee, creatorNet,
      createdAt: new Date(),
    };
    _sponsorshipContracts.set(id, contract);
    return contract;
  },

  updateSponsorshipStatus(contractId: string, status: SponsorshipContract["status"]): SponsorshipContract | null {
    const contract = _sponsorshipContracts.get(contractId);
    if (!contract) return null;
    contract.status = status;
    return contract;
  },

  getCreatorSponsorships(creatorId: number): SponsorshipContract[] {
    return Array.from(_sponsorshipContracts.values()).filter(c => c.creatorId === creatorId);
  },

  // Premium DMs
  sendPremiumDM(params: Omit<PremiumDM, "id" | "paid" | "createdAt">): PremiumDM {
    const id = `pdm_${params.senderId}_${Date.now()}`;
    const dm: PremiumDM = {
      ...params, id,
      paid: false,
      createdAt: new Date(),
    };
    _premiumDMs.set(id, dm);
    return dm;
  },

  payForDM(dmId: string): PremiumDM | null {
    const dm = _premiumDMs.get(dmId);
    if (!dm) return null;
    dm.paid = true;
    return dm;
  },

  readPremiumDM(dmId: string): PremiumDM | null {
    const dm = _premiumDMs.get(dmId);
    if (!dm || !dm.paid) return null;
    dm.readAt = new Date();
    return dm;
  },

  getInboxPremiumDMs(recipientId: number): PremiumDM[] {
    return Array.from(_premiumDMs.values()).filter(d => d.recipientId === recipientId);
  },

  // Tipping Upgrades
  sendTip(params: { senderId: number; recipientId: number; amount: number; currency: TippingUpgrade["currency"]; message?: string }): TippingUpgrade {
    const id = `tip_${params.senderId}_${Date.now()}`;
    const tier: TippingUpgrade["tier"] =
      params.amount >= 1000 ? "legendary" :
      params.amount >= 100 ? "mega" :
      params.amount >= 10 ? "super" : "standard";
    const multipliers = { standard: 1, super: 1.5, mega: 2, legendary: 5 };
    const multiplier = multipliers[tier];
    const platformFee = params.amount * 0.05;
    const creatorNet = params.amount - platformFee;
    const tip: TippingUpgrade = {
      id,
      senderId: params.senderId,
      recipientId: params.recipientId,
      amount: params.amount,
      currency: params.currency,
      message: params.message,
      tier,
      multiplier,
      platformFee,
      creatorNet,
      createdAt: new Date(),
    };
    _tippingUpgrades.set(id, tip);
    return tip;
  },

  getCreatorTips(recipientId: number, since?: Date): TippingUpgrade[] {
    return Array.from(_tippingUpgrades.values())
      .filter(t => t.recipientId === recipientId && (!since || t.createdAt >= since));
  },

  getTopTippers(recipientId: number, limit = 10): Array<{ senderId: number; totalTipped: number }> {
    const tips = Array.from(_tippingUpgrades.values()).filter(t => t.recipientId === recipientId);
    const byUser = new Map<number, number>();
    for (const tip of tips) {
      byUser.set(tip.senderId, (byUser.get(tip.senderId) ?? 0) + tip.amount);
    }
    return Array.from(byUser.entries())
      .map(([senderId, totalTipped]) => ({ senderId, totalTipped }))
      .sort((a, b) => b.totalTipped - a.totalTipped)
      .slice(0, limit);
  },
};

// ─── PLATFORM REVENUE ENGINE IMPLEMENTATION ──────────────────────────────────

export const platformRevenueEngine = {
  // Platform Fees
  recordFee(transactionType: PlatformFeeRecord["transactionType"], transactionId: string, grossAmount: number, currency: PlatformFeeRecord["currency"]): PlatformFeeRecord {
    const feeRates: Record<PlatformFeeRecord["transactionType"], number> = {
      subscription: 0.05,
      ppv: 0.10,
      digital_product: 0.08,
      nft_sale: 0.025,
      sponsorship: 0.10,
      tip: 0.05,
      premium_dm: 0.15,
      marketplace: 0.08,
      swap: 0.003,
    };
    const feeRate = feeRates[transactionType];
    const feeAmount = Math.round(grossAmount * feeRate * 100) / 100;
    const id = `fee_${transactionId}_${Date.now()}`;
    const fee: PlatformFeeRecord = {
      id, transactionType, transactionId, grossAmount, feeRate, feeAmount, currency,
      createdAt: new Date(),
    };
    _platformFees.set(id, fee);
    return fee;
  },

  getTotalFees(since?: Date): number {
    return Array.from(_platformFees.values())
      .filter(f => !since || f.createdAt >= since)
      .reduce((sum, f) => sum + f.feeAmount, 0);
  },

  getFeesByType(transactionType: PlatformFeeRecord["transactionType"]): PlatformFeeRecord[] {
    return Array.from(_platformFees.values()).filter(f => f.transactionType === transactionType);
  },

  // Ad Campaigns
  createAdCampaign(params: Omit<AdCampaign, "id" | "spent" | "impressions" | "clicks" | "conversions" | "ctr" | "conversionRate" | "createdAt">): AdCampaign {
    const id = `ad_${params.advertiserId}_${Date.now()}`;
    const campaign: AdCampaign = {
      ...params, id,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      conversionRate: 0,
      createdAt: new Date(),
    };
    _adCampaigns.set(id, campaign);
    return campaign;
  },

  recordAdImpression(campaignId: string): AdCampaign | null {
    const campaign = _adCampaigns.get(campaignId);
    if (!campaign || campaign.status !== "active") return null;
    campaign.impressions++;
    campaign.spent += campaign.cpm / 1000;
    if (campaign.spent >= campaign.budget) campaign.status = "completed";
    return campaign;
  },

  recordAdClick(campaignId: string): AdCampaign | null {
    const campaign = _adCampaigns.get(campaignId);
    if (!campaign) return null;
    campaign.clicks++;
    campaign.ctr = campaign.impressions > 0 ? campaign.clicks / campaign.impressions : 0;
    return campaign;
  },

  recordAdConversion(campaignId: string): AdCampaign | null {
    const campaign = _adCampaigns.get(campaignId);
    if (!campaign) return null;
    campaign.conversions++;
    campaign.conversionRate = campaign.clicks > 0 ? campaign.conversions / campaign.clicks : 0;
    return campaign;
  },

  updateCampaignStatus(campaignId: string, status: AdCampaign["status"]): AdCampaign | null {
    const campaign = _adCampaigns.get(campaignId);
    if (!campaign) return null;
    campaign.status = status;
    return campaign;
  },

  getActiveCampaigns(): AdCampaign[] {
    return Array.from(_adCampaigns.values()).filter(c => c.status === "active");
  },

  getCampaignsByAdvertiser(advertiserId: number): AdCampaign[] {
    return Array.from(_adCampaigns.values()).filter(c => c.advertiserId === advertiserId);
  },

  // Promoted Content
  promoteContent(params: Omit<PromotedContent, "id" | "spent" | "impressions" | "clicks" | "createdAt">): PromotedContent {
    const id = `promo_${params.contentId}_${Date.now()}`;
    const promo: PromotedContent = {
      ...params, id,
      spent: 0,
      impressions: 0,
      clicks: 0,
      createdAt: new Date(),
    };
    _promotedContent.set(id, promo);
    return promo;
  },

  recordPromoImpression(promoId: string): PromotedContent | null {
    const promo = _promotedContent.get(promoId);
    if (!promo || promo.status !== "active") return null;
    promo.impressions++;
    return promo;
  },

  recordPromoClick(promoId: string): PromotedContent | null {
    const promo = _promotedContent.get(promoId);
    if (!promo) return null;
    promo.clicks++;
    return promo;
  },

  getActivePromotions(contentType?: PromotedContent["contentType"]): PromotedContent[] {
    return Array.from(_promotedContent.values())
      .filter(p => p.status === "active" && (!contentType || p.contentType === contentType));
  },

  getBoostMultiplier(contentId: string): number {
    const promo = Array.from(_promotedContent.values())
      .find(p => p.contentId === contentId && p.status === "active");
    return promo?.boostMultiplier ?? 1;
  },
};

// ─── TREASURY INTELLIGENCE IMPLEMENTATION ────────────────────────────────────

export const treasuryIntelligence = {
  // Revenue Snapshots
  captureSnapshot(data: Omit<TreasurySnapshot, "id" | "timestamp">): TreasurySnapshot {
    const snapshot: TreasurySnapshot = {
      ...data,
      id: `snap_${Date.now()}`,
      timestamp: new Date(),
    };
    _treasurySnapshots.push(snapshot);
    return snapshot;
  },

  getLatestSnapshot(): TreasurySnapshot | null {
    return _treasurySnapshots.length > 0
      ? _treasurySnapshots[_treasurySnapshots.length - 1]
      : null;
  },

  getSnapshotHistory(limit = 30): TreasurySnapshot[] {
    return _treasurySnapshots.slice(-limit);
  },

  computeLiveMRR(): number {
    const tiers = Array.from(_subscriptionTiers.values()).filter(t => t.isActive);
    return tiers.reduce((sum, t) => sum + t.mrr, 0);
  },

  computeLiveARR(): number {
    return this.computeLiveMRR() * 12;
  },

  computeBurnRate(period = "monthly"): number {
    const snapshot = this.getLatestSnapshot();
    if (!snapshot) return 0;
    return period === "monthly" ? snapshot.burnRate : snapshot.burnRate * 12;
  },

  computeRunway(): number {
    const snapshot = this.getLatestSnapshot();
    if (!snapshot || snapshot.burnRate === 0) return Infinity;
    return snapshot.cashPosition / snapshot.burnRate;
  },

  // Revenue Breakdowns
  recordRevenueBreakdown(period: string, breakdown: Omit<RevenueBreakdown, "period" | "total">): RevenueBreakdown {
    const total = Object.values(breakdown).reduce((s, v) => s + (v as number), 0);
    const full: RevenueBreakdown = { period, ...breakdown, total };
    _revenueBreakdowns.set(period, full);
    return full;
  },

  getRevenueBreakdown(period: string): RevenueBreakdown | null {
    return _revenueBreakdowns.get(period) ?? null;
  },

  computeCreatorPayoutRatio(): number {
    const snapshot = this.getLatestSnapshot();
    if (!snapshot || snapshot.totalRevenue === 0) return 0;
    return snapshot.totalPayouts / snapshot.totalRevenue;
  },

  computeAdConversionRevenue(): number {
    return Array.from(_adCampaigns.values())
      .filter(c => c.status === "active" || c.status === "completed")
      .reduce((sum, c) => sum + c.spent, 0);
  },

  // Creator Payouts
  scheduleCreatorPayout(params: Omit<CreatorPayoutSummary, "status" | "payoutDate">): CreatorPayoutSummary {
    const key = `payout_${params.creatorId}_${params.period}`;
    const payout: CreatorPayoutSummary = {
      ...params,
      status: "pending",
    };
    _creatorPayouts.set(key, payout);
    return payout;
  },

  processCreatorPayout(creatorId: number, period: string): CreatorPayoutSummary | null {
    const payout = _creatorPayouts.get(`payout_${creatorId}_${period}`);
    if (!payout) return null;
    payout.status = "paid";
    payout.payoutDate = new Date();
    return payout;
  },

  getCreatorPayoutHistory(creatorId: number): CreatorPayoutSummary[] {
    return Array.from(_creatorPayouts.values()).filter(p => p.creatorId === creatorId);
  },

  getPendingPayouts(): CreatorPayoutSummary[] {
    return Array.from(_creatorPayouts.values()).filter(p => p.status === "pending");
  },

  // Revenue Dashboard Data
  getDashboardMetrics(): {
    liveMRR: number;
    liveARR: number;
    burnRate: number;
    runway: number;
    creatorPayoutRatio: number;
    adConversionRevenue: number;
    pendingPayouts: number;
    activeCampaigns: number;
    totalPlatformFees: number;
  } {
    return {
      liveMRR: this.computeLiveMRR(),
      liveARR: this.computeLiveARR(),
      burnRate: this.computeBurnRate(),
      runway: this.computeRunway(),
      creatorPayoutRatio: this.computeCreatorPayoutRatio(),
      adConversionRevenue: this.computeAdConversionRevenue(),
      pendingPayouts: this.getPendingPayouts().length,
      activeCampaigns: platformRevenueEngine.getActiveCampaigns().length,
      totalPlatformFees: platformRevenueEngine.getTotalFees(),
    };
  },
};
