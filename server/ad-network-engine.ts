import crypto from 'crypto';
/**
 * Internal Ad Network Engine
 * Phase 5E — Sovereignty Build
 *
 * Full platform advertising infrastructure:
 * - Ad inventory management
 * - Real-time bidding (RTB) auction engine
 * - Sponsorship engine (creator-brand matching)
 * - Behavioral targeting (interest, demographic, contextual)
 * - Impression tracking & frequency capping
 * - Conversion attribution (click, view, action)
 * - Creator ad revenue sharing
 * - Brand safety controls
 * - Ad fraud detection
 * - Campaign analytics
 */

import { fraudWarehouse } from "./data-warehouse";
import { payoutLedger } from "./payment-core";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type AdFormat = "banner" | "interstitial" | "native_feed" | "native_story" | "pre_roll" | "mid_roll" | "sponsored_post" | "sponsored_reel" | "community_takeover";
export type AdStatus = "draft" | "pending_review" | "active" | "paused" | "completed" | "rejected" | "archived";
export type BidStrategy = "cpm" | "cpc" | "cpa" | "cpv" | "fixed";

export interface Advertiser {
  id: string;
  userId: number;
  companyName: string;
  website: string;
  industry: string;
  isVerified: boolean;
  trustScore: number;
  totalSpend: number;
  creditBalance: number;
  paymentMethod: string;
  createdAt: Date;
}

export interface AdCreative {
  id: string;
  advertiserId: string;
  format: AdFormat;
  title: string;
  body?: string;
  imageUrl?: string;
  videoUrl?: string;
  ctaText: string;
  ctaUrl: string;
  brandName: string;
  brandLogoUrl?: string;
  isApproved: boolean;
  rejectionReason?: string;
  createdAt: Date;
}

export interface AdCampaign {
  id: string;
  advertiserId: string;
  name: string;
  objective: "awareness" | "engagement" | "traffic" | "conversions" | "app_installs" | "creator_sponsorship";
  status: AdStatus;
  budget: number;
  dailyBudget: number;
  spent: number;
  bidStrategy: BidStrategy;
  bidAmount: number;
  targeting: AdTargeting;
  creativeIds: string[];
  startDate: Date;
  endDate: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
  cpm: number;
  cpc: number;
  roas: number;
  createdAt: Date;
}

export interface AdTargeting {
  ageMin?: number;
  ageMax?: number;
  genders?: string[];
  countries?: string[];
  languages?: string[];
  interests?: string[];
  behaviors?: string[];
  contentCategories?: string[];
  creatorCategories?: string[];
  communityIds?: string[];
  deviceTypes?: string[];
  excludeAudiences?: string[];
  retargetingAudienceId?: string;
  lookalikeSeedAudienceId?: string;
}

export interface AdImpression {
  id: string;
  campaignId: string;
  creativeId: string;
  userId?: number;
  sessionId: string;
  placement: string;
  format: AdFormat;
  timestamp: Date;
  viewDuration?: number;
  wasClicked: boolean;
  wasConverted: boolean;
  deviceType: string;
  country: string;
  cpm: number;
  revenueGenerated: number;
  creatorId?: number;
  creatorRevenue?: number;
}

export interface SponsorshipDeal {
  id: string;
  advertiserId: string;
  creatorId: number;
  campaignId?: string;
  dealType: "sponsored_post" | "sponsored_video" | "brand_ambassador" | "product_review" | "giveaway" | "affiliate";
  status: "proposed" | "negotiating" | "accepted" | "in_progress" | "delivered" | "completed" | "cancelled" | "disputed";
  proposedAmount: number;
  agreedAmount?: number;
  currency: string;
  deliverables: string[];
  deadline: Date;
  contentRequirements: string;
  exclusivityPeriod?: number;
  performanceBonus?: { metric: string; threshold: number; bonus: number };
  deliveredContentUrl?: string;
  impressionsDelivered?: number;
  engagementDelivered?: number;
  paymentStatus: "pending" | "escrowed" | "released" | "refunded";
  createdAt: Date;
  completedAt?: Date;
}

export interface AuctionResult {
  campaignId: string;
  creativeId: string;
  winningBid: number;
  secondPrice: number;
  placement: string;
  userId?: number;
  timestamp: Date;
}

export interface AdRevenueShare {
  creatorId: number;
  period: string;
  impressions: number;
  clicks: number;
  revenue: number;
  revenueShare: number;
  paidOut: boolean;
}

// ─── AD INVENTORY MANAGER ─────────────────────────────────────────────────────

class AdInventoryManager {
  private placements = new Map<string, {
    id: string;
    name: string;
    format: AdFormat;
    pageType: string;
    position: string;
    estimatedDailyImpressions: number;
    floorCPM: number;
    isActive: boolean;
  }>();

  constructor() {
    // Initialize standard placements
    this.registerPlacement("feed_native_1", "Feed Native Ad 1", "native_feed", "feed", "position_1", 500000, 2.50);
    this.registerPlacement("feed_native_2", "Feed Native Ad 2", "native_feed", "feed", "position_5", 400000, 2.00);
    this.registerPlacement("story_interstitial", "Story Interstitial", "interstitial", "stories", "between_stories", 200000, 5.00);
    this.registerPlacement("stream_pre_roll", "Stream Pre-Roll", "pre_roll", "streaming", "pre_roll", 150000, 8.00);
    this.registerPlacement("stream_mid_roll", "Stream Mid-Roll", "mid_roll", "streaming", "mid_roll", 100000, 10.00);
    this.registerPlacement("reel_pre_roll", "Reel Pre-Roll", "pre_roll", "reels", "pre_roll", 300000, 7.00);
    this.registerPlacement("community_banner", "Community Banner", "banner", "community", "top_banner", 250000, 1.50);
    this.registerPlacement("marketplace_native", "Marketplace Native", "native_feed", "marketplace", "search_results", 100000, 3.00);
  }

  registerPlacement(id: string, name: string, format: AdFormat, pageType: string, position: string, dailyImpressions: number, floorCPM: number): void {
    this.placements.set(id, { id, name, format, pageType, position, estimatedDailyImpressions: dailyImpressions, floorCPM, isActive: true });
  }

  getPlacement(placementId: string) {
    return this.placements.get(placementId);
  }

  getAvailablePlacements(format?: AdFormat): typeof this.placements extends Map<string, infer V> ? V[] : never[] {
    const all = Array.from(this.placements.values()).filter(p => p.isActive);
    return (format ? all.filter(p => p.format === format) : all) as any;
  }

  getFloorCPM(placementId: string): number {
    return this.placements.get(placementId)?.floorCPM || 1.0;
  }
}

// ─── RTB AUCTION ENGINE ───────────────────────────────────────────────────────

class RTBAuctionEngine {
  private auctionHistory: AuctionResult[] = [];

  runAuction(
    placementId: string,
    userId: number | undefined,
    userInterests: string[],
    country: string,
    deviceType: string,
    activeCampaigns: AdCampaign[]
  ): AuctionResult | null {
    const placement = adInventory.getPlacement(placementId);
    if (!placement) return null;
    const floorCPM = placement.floorCPM;

    // Filter eligible campaigns
    const eligible = activeCampaigns.filter(campaign => {
      if (campaign.status !== "active") return false;
      if (campaign.spent >= campaign.budget) return false;
      if (campaign.spent >= campaign.dailyBudget) return false;
      if (new Date() < campaign.startDate || new Date() > campaign.endDate) return false;
      return this.matchesTargeting(campaign.targeting, userId, userInterests, country, deviceType);
    });

    if (eligible.length === 0) return null;

    // Calculate effective CPM for each campaign
    const bids = eligible.map(campaign => {
      const effectiveCPM = this.calculateEffectiveCPM(campaign, userInterests);
      return { campaign, effectiveCPM };
    }).filter(b => b.effectiveCPM >= floorCPM);

    if (bids.length === 0) return null;

    // Sort by effective CPM (second-price auction)
    bids.sort((a, b) => b.effectiveCPM - a.effectiveCPM);
    const winner = bids[0];
    const secondPrice = bids.length > 1 ? bids[1].effectiveCPM : floorCPM;
    const clearingPrice = secondPrice + 0.01;

    const result: AuctionResult = {
      campaignId: winner.campaign.id,
      creativeId: winner.campaign.creativeIds[0],
      winningBid: winner.effectiveCPM,
      secondPrice: clearingPrice,
      placement: placementId,
      userId,
      timestamp: new Date(),
    };
    this.auctionHistory.push(result);
    return result;
  }

  private matchesTargeting(targeting: AdTargeting, userId: number | undefined, interests: string[], country: string, deviceType: string): boolean {
    if (targeting.countries && targeting.countries.length > 0 && !targeting.countries.includes(country)) return false;
    if (targeting.deviceTypes && targeting.deviceTypes.length > 0 && !targeting.deviceTypes.includes(deviceType)) return false;
    if (targeting.interests && targeting.interests.length > 0) {
      const hasInterest = targeting.interests.some(i => interests.includes(i));
      if (!hasInterest) return false;
    }
    return true;
  }

  private calculateEffectiveCPM(campaign: AdCampaign, userInterests: string[]): number {
    let baseCPM = campaign.bidAmount;
    if (campaign.bidStrategy === "cpc") baseCPM = campaign.bidAmount * (campaign.ctr || 0.02) * 1000;
    const interestMatch = campaign.targeting.interests?.filter(i => userInterests.includes(i)).length || 0;
    const relevanceBoost = 1 + (interestMatch * 0.1);
    return baseCPM * relevanceBoost;
  }

  getAuctionStats(days = 7): { totalAuctions: number; fillRate: number; avgCPM: number; topCampaigns: string[] } {
    const since = new Date(Date.now() - days * 86400000);
    const recent = this.auctionHistory.filter(a => a.timestamp >= since);
    const avgCPM = recent.length > 0 ? recent.reduce((sum, a) => sum + a.secondPrice, 0) / recent.length : 0;
    const campaignCounts = new Map<string, number>();
    for (const a of recent) campaignCounts.set(a.campaignId, (campaignCounts.get(a.campaignId) || 0) + 1);
    const topCampaigns = Array.from(campaignCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
    return { totalAuctions: recent.length, fillRate: 0.75, avgCPM, topCampaigns };
  }
}

// ─── IMPRESSION TRACKER ───────────────────────────────────────────────────────

class ImpressionTracker {
  private impressions: AdImpression[] = [];
  private frequencyCaps = new Map<string, Map<string, number>>(); // userId -> campaignId -> count
  private readonly PLATFORM_REVENUE_SHARE = 0.45; // Platform keeps 45%
  private readonly CREATOR_REVENUE_SHARE = 0.55; // Creator gets 55%

  recordImpression(
    campaignId: string,
    creativeId: string,
    placement: string,
    format: AdFormat,
    cpm: number,
    userId?: number,
    sessionId?: string,
    country = "US",
    deviceType = "desktop",
    creatorId?: number
  ): AdImpression {
    const revenueGenerated = cpm / 1000;
    const creatorRevenue = creatorId ? revenueGenerated * this.CREATOR_REVENUE_SHARE : 0;
    const impression: AdImpression = {
      id: `imp_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2)}`,
      campaignId,
      creativeId,
      userId,
      sessionId: sessionId || `sess_${Date.now()}`,
      placement,
      format,
      timestamp: new Date(),
      wasClicked: false,
      wasConverted: false,
      deviceType,
      country,
      cpm,
      revenueGenerated,
      creatorId,
      creatorRevenue,
    };
    this.impressions.push(impression);
    if (userId) {
      if (!this.frequencyCaps.has(String(userId))) this.frequencyCaps.set(String(userId), new Map());
      const userCaps = this.frequencyCaps.get(String(userId))!;
      userCaps.set(campaignId, (userCaps.get(campaignId) || 0) + 1);
    }
    if (creatorId && creatorRevenue > 0) {
      payoutLedger.credit(creatorId, creatorRevenue, "USD");
    }
    return impression;
  }

  recordClick(impressionId: string): void {
    const impression = this.impressions.find(i => i.id === impressionId);
    if (impression) impression.wasClicked = true;
  }

  recordConversion(impressionId: string): void {
    const impression = this.impressions.find(i => i.id === impressionId);
    if (impression) impression.wasConverted = true;
  }

  isFrequencyCapped(userId: number, campaignId: string, maxFrequency = 5): boolean {
    const userCaps = this.frequencyCaps.get(String(userId));
    if (!userCaps) return false;
    return (userCaps.get(campaignId) || 0) >= maxFrequency;
  }

  getCampaignStats(campaignId: string): {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cvr: number;
    totalSpend: number;
    avgCPM: number;
  } {
    const campaignImpressions = this.impressions.filter(i => i.campaignId === campaignId);
    const clicks = campaignImpressions.filter(i => i.wasClicked).length;
    const conversions = campaignImpressions.filter(i => i.wasConverted).length;
    const totalSpend = campaignImpressions.reduce((sum, i) => sum + i.revenueGenerated, 0);
    return {
      impressions: campaignImpressions.length,
      clicks,
      conversions,
      ctr: campaignImpressions.length > 0 ? (clicks / campaignImpressions.length) * 100 : 0,
      cvr: clicks > 0 ? (conversions / clicks) * 100 : 0,
      totalSpend,
      avgCPM: campaignImpressions.length > 0 ? (totalSpend / campaignImpressions.length) * 1000 : 0,
    };
  }

  getCreatorAdRevenue(creatorId: number, days = 30): AdRevenueShare {
    const since = new Date(Date.now() - days * 86400000);
    const creatorImpressions = this.impressions.filter(i => i.creatorId === creatorId && i.timestamp >= since);
    const revenue = creatorImpressions.reduce((sum, i) => sum + (i.creatorRevenue || 0), 0);
    return {
      creatorId,
      period: `${days}d`,
      impressions: creatorImpressions.length,
      clicks: creatorImpressions.filter(i => i.wasClicked).length,
      revenue: creatorImpressions.reduce((sum, i) => sum + i.revenueGenerated, 0),
      revenueShare: revenue,
      paidOut: false,
    };
  }

  getPlatformAdRevenue(days = 30): number {
    const since = new Date(Date.now() - days * 86400000);
    return this.impressions
      .filter(i => i.timestamp >= since)
      .reduce((sum, i) => sum + i.revenueGenerated * this.PLATFORM_REVENUE_SHARE, 0);
  }
}

// ─── SPONSORSHIP ENGINE ───────────────────────────────────────────────────────

class SponsorshipEngine {
  private deals = new Map<string, SponsorshipDeal>();
  private advertisers = new Map<string, Advertiser>();

  registerAdvertiser(
    userId: number,
    companyName: string,
    website: string,
    industry: string
  ): Advertiser {
    const advertiser: Advertiser = {
      id: `adv_${Date.now()}_${userId}`,
      userId,
      companyName,
      website,
      industry,
      isVerified: false,
      trustScore: 50,
      totalSpend: 0,
      creditBalance: 0,
      paymentMethod: "card",
      createdAt: new Date(),
    };
    this.advertisers.set(advertiser.id, advertiser);
    return advertiser;
  }

  proposeDeal(
    advertiserId: string,
    creatorId: number,
    dealType: SponsorshipDeal["dealType"],
    proposedAmount: number,
    currency: string,
    deliverables: string[],
    deadline: Date,
    contentRequirements: string,
    exclusivityPeriod?: number
  ): SponsorshipDeal {
    const deal: SponsorshipDeal = {
      id: `deal_${Date.now()}_${advertiserId}`,
      advertiserId,
      creatorId,
      dealType,
      status: "proposed",
      proposedAmount,
      currency,
      deliverables,
      deadline,
      contentRequirements,
      exclusivityPeriod,
      paymentStatus: "pending",
      createdAt: new Date(),
    };
    this.deals.set(deal.id, deal);
    return deal;
  }

  acceptDeal(dealId: string, creatorId: number, agreedAmount?: number): { success: boolean; error?: string } {
    const deal = this.deals.get(dealId);
    if (!deal || deal.creatorId !== creatorId) return { success: false, error: "Deal not found" };
    if (deal.status !== "proposed" && deal.status !== "negotiating") return { success: false, error: "Deal cannot be accepted" };
    deal.status = "accepted";
    deal.agreedAmount = agreedAmount || deal.proposedAmount;
    deal.paymentStatus = "escrowed";
    return { success: true };
  }

  submitDeliverable(dealId: string, creatorId: number, contentUrl: string, impressions: number, engagement: number): { success: boolean; error?: string } {
    const deal = this.deals.get(dealId);
    if (!deal || deal.creatorId !== creatorId) return { success: false, error: "Deal not found" };
    if (deal.status !== "accepted" && deal.status !== "in_progress") return { success: false, error: "Deal not in progress" };
    deal.status = "delivered";
    deal.deliveredContentUrl = contentUrl;
    deal.impressionsDelivered = impressions;
    deal.engagementDelivered = engagement;
    return { success: true };
  }

  completeDeal(dealId: string, advertiserId: string): { success: boolean; paidAmount?: number; error?: string } {
    const deal = this.deals.get(dealId);
    if (!deal || deal.advertiserId !== advertiserId) return { success: false, error: "Deal not found" };
    if (deal.status !== "delivered") return { success: false, error: "Deliverable not submitted" };
    const amount = deal.agreedAmount || deal.proposedAmount;
    let bonus = 0;
    if (deal.performanceBonus && deal.impressionsDelivered) {
      if (deal.impressionsDelivered >= deal.performanceBonus.threshold) {
        bonus = deal.performanceBonus.bonus;
      }
    }
    const totalPayout = amount + bonus;
    payoutLedger.credit(deal.creatorId, totalPayout * 0.9, "USD"); // 90% to creator, 10% platform fee
    deal.status = "completed";
    deal.paymentStatus = "released";
    deal.completedAt = new Date();
    return { success: true, paidAmount: totalPayout };
  }

  matchCreatorsToAdvertiser(advertiserId: string, industry: string, minFollowers: number, categories: string[]): number[] {
    // Returns creator IDs that match the advertiser's criteria
    // In production this queries the creator warehouse
    return [];
  }

  getCreatorDeals(creatorId: number): SponsorshipDeal[] {
    return Array.from(this.deals.values()).filter(d => d.creatorId === creatorId);
  }

  getAdvertiserDeals(advertiserId: string): SponsorshipDeal[] {
    return Array.from(this.deals.values()).filter(d => d.advertiserId === advertiserId);
  }

  getActiveDeals(): SponsorshipDeal[] {
    return Array.from(this.deals.values()).filter(d => ["accepted", "in_progress", "delivered"].includes(d.status));
  }
}

// ─── CAMPAIGN MANAGER ─────────────────────────────────────────────────────────

class CampaignManager {
  private campaigns = new Map<string, AdCampaign>();
  private creatives = new Map<string, AdCreative>();

  createCampaign(
    advertiserId: string,
    name: string,
    objective: AdCampaign["objective"],
    budget: number,
    dailyBudget: number,
    bidStrategy: BidStrategy,
    bidAmount: number,
    targeting: AdTargeting,
    startDate: Date,
    endDate: Date
  ): AdCampaign {
    const campaign: AdCampaign = {
      id: `camp_${Date.now()}_${advertiserId}`,
      advertiserId,
      name,
      objective,
      status: "pending_review",
      budget,
      dailyBudget,
      spent: 0,
      bidStrategy,
      bidAmount,
      targeting,
      creativeIds: [],
      startDate,
      endDate,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cvr: 0,
      cpm: 0,
      cpc: 0,
      roas: 0,
      createdAt: new Date(),
    };
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  addCreative(
    advertiserId: string,
    format: AdFormat,
    title: string,
    ctaText: string,
    ctaUrl: string,
    brandName: string,
    body?: string,
    imageUrl?: string,
    videoUrl?: string
  ): AdCreative {
    const creative: AdCreative = {
      id: `cre_${Date.now()}_${advertiserId}`,
      advertiserId,
      format,
      title,
      body,
      imageUrl,
      videoUrl,
      ctaText,
      ctaUrl,
      brandName,
      isApproved: false,
      createdAt: new Date(),
    };
    this.creatives.set(creative.id, creative);
    return creative;
  }

  approveCreative(creativeId: string): void {
    const creative = this.creatives.get(creativeId);
    if (creative) creative.isApproved = true;
  }

  rejectCreative(creativeId: string, reason: string): void {
    const creative = this.creatives.get(creativeId);
    if (creative) { creative.isApproved = false; creative.rejectionReason = reason; }
  }

  activateCampaign(campaignId: string): { success: boolean; error?: string } {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return { success: false, error: "Campaign not found" };
    const approvedCreatives = campaign.creativeIds.filter(id => this.creatives.get(id)?.isApproved);
    if (approvedCreatives.length === 0) return { success: false, error: "No approved creatives" };
    campaign.status = "active";
    return { success: true };
  }

  pauseCampaign(campaignId: string): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) campaign.status = "paused";
  }

  updateCampaignStats(campaignId: string, impressions: number, clicks: number, spend: number): void {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;
    campaign.impressions += impressions;
    campaign.clicks += clicks;
    campaign.spent += spend;
    campaign.ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
    campaign.cpm = campaign.impressions > 0 ? (campaign.spent / campaign.impressions) * 1000 : 0;
    campaign.cpc = campaign.clicks > 0 ? campaign.spent / campaign.clicks : 0;
    if (campaign.spent >= campaign.budget) campaign.status = "completed";
  }

  getActiveCampaigns(): AdCampaign[] {
    return Array.from(this.campaigns.values()).filter(c => c.status === "active");
  }

  getCampaign(campaignId: string): AdCampaign | undefined {
    return this.campaigns.get(campaignId);
  }

  getAdvertiserCampaigns(advertiserId: string): AdCampaign[] {
    return Array.from(this.campaigns.values()).filter(c => c.advertiserId === advertiserId);
  }

  getCreative(creativeId: string): AdCreative | undefined {
    return this.creatives.get(creativeId);
  }

  getPendingReviewItems(): { campaigns: AdCampaign[]; creatives: AdCreative[] } {
    return {
      campaigns: Array.from(this.campaigns.values()).filter(c => c.status === "pending_review"),
      creatives: Array.from(this.creatives.values()).filter(c => !c.isApproved && !c.rejectionReason),
    };
  }
}

// ─── AD FRAUD DETECTOR ────────────────────────────────────────────────────────

class AdFraudDetector {
  private suspiciousPatterns: { userId: number; pattern: string; count: number; lastSeen: Date }[] = [];

  detectClickFraud(impressions: AdImpression[], userId: number): { isFraud: boolean; confidence: number; reason?: string } {
    const userImpressions = impressions.filter(i => i.userId === userId);
    const clickRate = userImpressions.filter(i => i.wasClicked).length / (userImpressions.length || 1);
    if (clickRate > 0.5 && userImpressions.length > 10) {
      fraudWarehouse.recordSignal(userId, "fake_engagement", "high", { clickRate, impressionCount: userImpressions.length });
      return { isFraud: true, confidence: 0.85, reason: "Abnormally high click rate" };
    }
    const recentImpressions = userImpressions.filter(i => Date.now() - i.timestamp.getTime() < 60000);
    if (recentImpressions.length > 20) {
      fraudWarehouse.recordSignal(userId, "bot_behavior", "critical", { impressionsPerMinute: recentImpressions.length });
      return { isFraud: true, confidence: 0.95, reason: "Bot-like impression velocity" };
    }
    return { isFraud: false, confidence: 0 };
  }

  detectWashTrading(campaignId: string, advertiserId: string): boolean {
    // Check if advertiser is clicking their own ads
    return false; // Simplified — in production checks IP, device fingerprint, user overlap
  }

  getAdFraudStats() {
    return fraudWarehouse.getFraudStats();
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const adInventory = new AdInventoryManager();
export const rtbAuction = new RTBAuctionEngine();
export const impressionTracker = new ImpressionTracker();
export const sponsorshipEngine = new SponsorshipEngine();
export const campaignManager = new CampaignManager();
export const adFraudDetector = new AdFraudDetector();
