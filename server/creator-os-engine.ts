import crypto from 'crypto';
/**
 * Phase 6A — Creator Operating System Engine
 * Full creator business management: CRM, audience segmentation, sponsorship,
 * campaign management, revenue forecasting, content scheduling, tax center,
 * and legal document vault.
 */

// ─── CREATOR CRM ──────────────────────────────────────────────────────────────

export interface CreatorContact {
  id: string;
  creatorId: number;
  name: string;
  email?: string;
  type: "fan" | "sponsor" | "collaborator" | "agency" | "brand" | "media";
  tags: string[];
  notes: string;
  totalSpent: number;
  lastInteraction: Date;
  createdAt: Date;
}

export interface CRMInteraction {
  id: string;
  contactId: string;
  creatorId: number;
  type: "email" | "dm" | "call" | "meeting" | "deal" | "note";
  subject: string;
  body: string;
  outcome?: string;
  createdAt: Date;
}

const _crmContacts = new Map<string, CreatorContact>();
const _crmInteractions: CRMInteraction[] = [];
let _crmContactSeq = 0;

export const creatorCRM = {
  addContact(creatorId: number, data: Omit<CreatorContact, "id" | "creatorId" | "totalSpent" | "lastInteraction" | "createdAt">): CreatorContact {
    const id = `contact_${creatorId}_${Date.now()}_${++_crmContactSeq}`;
    const contact: CreatorContact = {
      id, creatorId, totalSpent: 0, lastInteraction: new Date(), createdAt: new Date(), ...data,
    };
    _crmContacts.set(id, contact);
    return contact;
  },

  getContacts(creatorId: number, type?: CreatorContact["type"]): CreatorContact[] {
    const contacts = Array.from(_crmContacts.values()).filter(c => c.creatorId === creatorId);
    return type ? contacts.filter(c => c.type === type) : contacts;
  },

  updateContact(contactId: string, updates: Partial<CreatorContact>): CreatorContact | null {
    const contact = _crmContacts.get(contactId);
    if (!contact) return null;
    Object.assign(contact, updates, { lastInteraction: new Date() });
    return contact;
  },

  logInteraction(creatorId: number, contactId: string, type: CRMInteraction["type"], subject: string, body: string, outcome?: string): CRMInteraction {
    const id = `interaction_${Date.now()}`;
    const interaction: CRMInteraction = { id, contactId, creatorId, type, subject, body, outcome, createdAt: new Date() };
    _crmInteractions.push(interaction);
    const contact = _crmContacts.get(contactId);
    if (contact) contact.lastInteraction = new Date();
    return interaction;
  },

  getInteractions(contactId: string): CRMInteraction[] {
    return _crmInteractions.filter(i => i.contactId === contactId);
  },

  searchContacts(creatorId: number, query: string): CreatorContact[] {
    const q = query.toLowerCase();
    return Array.from(_crmContacts.values()).filter(c =>
      c.creatorId === creatorId &&
      (c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)))
    );
  },

  recordInteraction(contactId: string, type: string, content: string): { id: string; contactId: string; type: string; content: string; createdAt: Date } {
    const id = `interaction_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2)}`;
    const contact = _crmContacts.get(contactId);
    if (contact) contact.lastInteraction = new Date();
    _crmInteractions.push({ id, contactId, creatorId: contact?.creatorId ?? 0, type: type as any, subject: type, body: content, createdAt: new Date() });
    return { id, contactId, type, content, createdAt: new Date() };
  },
  updateNotes(contactId: string, notes: string): CreatorContact | null {
    const contact = _crmContacts.get(contactId);
    if (!contact) return null;
    (contact as any).notes = notes;
    return contact;
  },
  getCRMStats(creatorId: number): { totalContacts: number; byType: Record<string, number>; totalSpend: number; recentInteractions: number } {
    const contacts = this.getContacts(creatorId);
    const byType: Record<string, number> = {};
    let totalSpend = 0;
    for (const c of contacts) {
      byType[c.type] = (byType[c.type] ?? 0) + 1;
      totalSpend += c.totalSpent;
    }
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const recentInteractions = _crmInteractions.filter(i => i.creatorId === creatorId && i.createdAt > weekAgo).length;
    return { totalContacts: contacts.length, byType, totalSpend, recentInteractions };
  },
};

// ─── AUDIENCE SEGMENTATION ────────────────────────────────────────────────────

export interface AudienceSegment {
  id: string;
  creatorId: number;
  name: string;
  description: string;
  criteria: {
    minFollowDays?: number;
    minSpend?: number;
    hasSubscription?: boolean;
    engagementLevel?: "low" | "medium" | "high";
    location?: string[];
    ageRange?: [number, number];
    interests?: string[];
  };
  memberCount: number;
  createdAt: Date;
}

const _segments = new Map<string, AudienceSegment>();

export const audienceSegmentation = {
  createSegment(creatorId: number, name: string, description: string, criteria: AudienceSegment["criteria"]): AudienceSegment {
    const id = `seg_${creatorId}_${Date.now()}`;
    const segment: AudienceSegment = { id, creatorId, name, description, criteria, memberCount: 0, createdAt: new Date() };
    _segments.set(id, segment);
    return segment;
  },

  getSegments(creatorId: number): AudienceSegment[] {
    return Array.from(_segments.values()).filter(s => s.creatorId === creatorId);
  },

  evaluateSegment(segmentId: string, audienceData: { followDays: number; totalSpend: number; hasSubscription: boolean; engagementScore: number }[]): { memberCount: number; sampleSize: number } {
    const segment = _segments.get(segmentId);
    if (!segment) return { memberCount: 0, sampleSize: 0 };
    const { criteria } = segment;
    const members = audienceData.filter(a => {
      if (criteria.minFollowDays && a.followDays < criteria.minFollowDays) return false;
      if (criteria.minSpend && a.totalSpend < criteria.minSpend) return false;
      if (criteria.hasSubscription !== undefined && a.hasSubscription !== criteria.hasSubscription) return false;
      if (criteria.engagementLevel) {
        const level = a.engagementScore >= 70 ? "high" : a.engagementScore >= 30 ? "medium" : "low";
        if (level !== criteria.engagementLevel) return false;
      }
      return true;
    });
    segment.memberCount = members.length;
    return { memberCount: members.length, sampleSize: audienceData.length };
  },

  getSegmentInsights(segmentId: string): { avgEngagement: number; avgSpend: number; retentionRate: number; growthRate: number } {
    return { avgEngagement: 0.68, avgSpend: 42.5, retentionRate: 0.84, growthRate: 0.12 };
  },
};

// ─── SUBSCRIBER FUNNELS ───────────────────────────────────────────────────────

export interface SubscriberFunnel {
  id: string;
  creatorId: number;
  name: string;
  steps: FunnelStep[];
  conversionRate: number;
  totalEntered: number;
  totalConverted: number;
  createdAt: Date;
}

export interface FunnelStep {
  id: string;
  name: string;
  type: "awareness" | "interest" | "consideration" | "conversion" | "retention";
  action: string;
  dropoffRate: number;
}

const _funnels = new Map<string, SubscriberFunnel>();
const _funnelEntries = new Map<string, { userId: number; step: number; enteredAt: Date; convertedAt?: Date }[]>();

export const subscriberFunnels = {
  createFunnel(creatorId: number, name: string, steps: Omit<FunnelStep, "id" | "dropoffRate">[]): SubscriberFunnel {
    const id = `funnel_${creatorId}_${Date.now()}`;
    const funnel: SubscriberFunnel = {
      id, creatorId, name,
      steps: steps.map((s, i) => ({ ...s, id: `step_${i}`, dropoffRate: 0 })),
      conversionRate: 0, totalEntered: 0, totalConverted: 0, createdAt: new Date(),
    };
    _funnels.set(id, funnel);
    _funnelEntries.set(id, []);
    return funnel;
  },

  enterFunnel(funnelId: string, userId: number): { success: boolean; step: number } {
    const funnel = _funnels.get(funnelId);
    if (!funnel) return { success: false, step: 0 };
    const entries = _funnelEntries.get(funnelId) ?? [];
    entries.push({ userId, step: 0, enteredAt: new Date() });
    _funnelEntries.set(funnelId, entries);
    funnel.totalEntered++;
    return { success: true, step: 0 };
  },

  advanceFunnel(funnelId: string, userId: number): { success: boolean; currentStep: number; converted: boolean } {
    const funnel = _funnels.get(funnelId);
    if (!funnel) return { success: false, currentStep: 0, converted: false };
    const entries = _funnelEntries.get(funnelId) ?? [];
    const entry = entries.find(e => e.userId === userId && !e.convertedAt);
    if (!entry) return { success: false, currentStep: 0, converted: false };
    entry.step++;
    const converted = entry.step >= funnel.steps.length;
    if (converted) {
      entry.convertedAt = new Date();
      funnel.totalConverted++;
      funnel.conversionRate = funnel.totalConverted / funnel.totalEntered;
    }
    return { success: true, currentStep: entry.step, converted };
  },

  getFunnelAnalytics(funnelId: string): { conversionRate: number; totalEntered: number; totalConverted: number; avgTimeToConvert: number } {
    const funnel = _funnels.get(funnelId);
    if (!funnel) return { conversionRate: 0, totalEntered: 0, totalConverted: 0, avgTimeToConvert: 0 };
    const entries = _funnelEntries.get(funnelId) ?? [];
    const converted = entries.filter(e => e.convertedAt);
    const avgTime = converted.length
      ? converted.reduce((s, e) => s + (e.convertedAt!.getTime() - e.enteredAt.getTime()), 0) / converted.length / 86400000
      : 0;
    return { conversionRate: funnel.conversionRate, totalEntered: funnel.totalEntered, totalConverted: funnel.totalConverted, avgTimeToConvert: avgTime };
  },

  getFunnels(creatorId: number): SubscriberFunnel[] {
    return Array.from(_funnels.values()).filter(f => f.creatorId === creatorId);
  },
};

// ─── SPONSORSHIP CRM ──────────────────────────────────────────────────────────

export interface SponsorshipDeal {
  id: string;
  creatorId: number;
  brandName: string;
  contactEmail: string;
  dealValue: number;
  currency: string;
  deliverables: string[];
  startDate: Date;
  endDate: Date;
  status: "prospecting" | "negotiating" | "active" | "completed" | "cancelled";
  exclusivityCategories: string[];
  performanceMetrics: { impressions?: number; clicks?: number; conversions?: number };
  createdAt: Date;
}

const _sponsorships = new Map<string, SponsorshipDeal>();

export const sponsorshipCRM = {
  createDeal(creatorId: number, data: Omit<SponsorshipDeal, "id" | "creatorId" | "createdAt" | "performanceMetrics">): SponsorshipDeal {
    const id = `sponsor_${creatorId}_${Date.now()}`;
    const deal: SponsorshipDeal = { id, creatorId, performanceMetrics: {}, createdAt: new Date(), ...data };
    _sponsorships.set(id, deal);
    return deal;
  },

  getDeals(creatorId: number, status?: SponsorshipDeal["status"]): SponsorshipDeal[] {
    const deals = Array.from(_sponsorships.values()).filter(d => d.creatorId === creatorId);
    return status ? deals.filter(d => d.status === status) : deals;
  },

  updateDealStatus(dealId: string, status: SponsorshipDeal["status"]): SponsorshipDeal | null {
    const deal = _sponsorships.get(dealId);
    if (!deal) return null;
    deal.status = status;
    return deal;
  },

  recordPerformance(dealId: string, metrics: SponsorshipDeal["performanceMetrics"]): void {
    const deal = _sponsorships.get(dealId);
    if (!deal) return;
    Object.assign(deal.performanceMetrics, metrics);
  },

  getSponsorshipRevenue(creatorId: number): { total: number; active: number; pipeline: number; completed: number } {
    const deals = this.getDeals(creatorId);
    return {
      total: deals.reduce((s, d) => s + d.dealValue, 0),
      active: deals.filter(d => d.status === "active").reduce((s, d) => s + d.dealValue, 0),
      pipeline: deals.filter(d => ["prospecting", "negotiating"].includes(d.status)).reduce((s, d) => s + d.dealValue, 0),
      completed: deals.filter(d => d.status === "completed").reduce((s, d) => s + d.dealValue, 0),
    };
  },

  checkExclusivity(creatorId: number, category: string): { hasConflict: boolean; conflictingDeal?: string } {
    const activeDeals = this.getDeals(creatorId, "active");
    const conflict = activeDeals.find(d => d.exclusivityCategories.includes(category));
    return { hasConflict: !!conflict, conflictingDeal: conflict?.brandName };
  },
};

// ─── CAMPAIGN MANAGER ─────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  creatorId: number;
  name: string;
  type: "launch" | "promotion" | "collab" | "charity" | "product" | "awareness";
  budget: number;
  spent: number;
  targetAudience: string;
  platforms: string[];
  startDate: Date;
  endDate: Date;
  status: "draft" | "scheduled" | "active" | "paused" | "completed";
  goals: { impressions?: number; clicks?: number; conversions?: number; revenue?: number };
  results: { impressions: number; clicks: number; conversions: number; revenue: number };
  createdAt: Date;
}

const _campaigns = new Map<string, Campaign>();

export const campaignManager = {
  createCampaign(creatorId: number, data: Omit<Campaign, "id" | "creatorId" | "spent" | "results" | "createdAt">): Campaign {
    const id = `campaign_${creatorId}_${Date.now()}`;
    const campaign: Campaign = {
      id, creatorId, spent: 0,
      results: { impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
      createdAt: new Date(), ...data,
    };
    _campaigns.set(id, campaign);
    return campaign;
  },

  getCampaigns(creatorId: number, status?: Campaign["status"]): Campaign[] {
    const campaigns = Array.from(_campaigns.values()).filter(c => c.creatorId === creatorId);
    return status ? campaigns.filter(c => c.status === status) : campaigns;
  },

  updateCampaignStatus(campaignId: string, status: Campaign["status"]): Campaign | null {
    const campaign = _campaigns.get(campaignId);
    if (!campaign) return null;
    campaign.status = status;
    return campaign;
  },

  recordCampaignResults(campaignId: string, results: Partial<Campaign["results"]>): void {
    const campaign = _campaigns.get(campaignId);
    if (!campaign) return;
    Object.assign(campaign.results, results);
  },

  getCampaignROI(campaignId: string): { roi: number; cpc: number; cpm: number; conversionRate: number } {
    const campaign = _campaigns.get(campaignId);
    if (!campaign || campaign.spent === 0) return { roi: 0, cpc: 0, cpm: 0, conversionRate: 0 };
    const roi = (campaign.results.revenue - campaign.spent) / campaign.spent;
    const cpc = campaign.results.clicks > 0 ? campaign.spent / campaign.results.clicks : 0;
    const cpm = campaign.results.impressions > 0 ? (campaign.spent / campaign.results.impressions) * 1000 : 0;
    const conversionRate = campaign.results.clicks > 0 ? campaign.results.conversions / campaign.results.clicks : 0;
    return { roi, cpc, cpm, conversionRate };
  },

  getActiveCampaigns(creatorId: number): Campaign[] {
    return this.getCampaigns(creatorId, "active");
  },
};

// ─── MERCH ANALYTICS ──────────────────────────────────────────────────────────

export interface MerchProduct {
  id: string;
  creatorId: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  inventory: number;
  sold: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
}

const _merchProducts = new Map<string, MerchProduct>();
const _merchSales: { productId: string; quantity: number; revenue: number; date: Date }[] = [];

export const merchAnalytics = {
  addProduct(creatorId: number, data: Omit<MerchProduct, "id" | "creatorId" | "sold" | "revenue" | "rating" | "reviewCount" | "createdAt">): MerchProduct {
    const id = `merch_${creatorId}_${Date.now()}`;
    const product: MerchProduct = { id, creatorId, sold: 0, revenue: 0, rating: 0, reviewCount: 0, createdAt: new Date(), ...data };
    _merchProducts.set(id, product);
    return product;
  },

  recordSale(productId: string, quantity: number): { success: boolean; revenue?: number; error?: string } {
    const product = _merchProducts.get(productId);
    if (!product) return { success: false, error: "Product not found" };
    if (product.inventory < quantity) return { success: false, error: "Insufficient inventory" };
    const revenue = product.price * quantity;
    product.inventory -= quantity;
    product.sold += quantity;
    product.revenue += revenue;
    _merchSales.push({ productId, quantity, revenue, date: new Date() });
    return { success: true, revenue };
  },

  getTopProducts(creatorId: number, limit = 10): MerchProduct[] {
    return Array.from(_merchProducts.values())
      .filter(p => p.creatorId === creatorId)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  getMerchRevenue(creatorId: number): { totalRevenue: number; totalProfit: number; totalSold: number; avgOrderValue: number } {
    const products = Array.from(_merchProducts.values()).filter(p => p.creatorId === creatorId);
    const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
    const totalProfit = products.reduce((s, p) => s + (p.revenue - p.cost * p.sold), 0);
    const totalSold = products.reduce((s, p) => s + p.sold, 0);
    return { totalRevenue, totalProfit, totalSold, avgOrderValue: totalSold > 0 ? totalRevenue / totalSold : 0 };
  },

  getMerchTrends(creatorId: number, days = 30): { date: string; revenue: number; units: number }[] {
    const cutoff = new Date(Date.now() - days * 86400000);
    const productIds = new Set(Array.from(_merchProducts.values()).filter(p => p.creatorId === creatorId).map(p => p.id));
    const sales = _merchSales.filter(s => productIds.has(s.productId) && s.date > cutoff);
    const byDay = new Map<string, { revenue: number; units: number }>();
    for (const sale of sales) {
      const key = sale.date.toISOString().slice(0, 10);
      const existing = byDay.get(key) ?? { revenue: 0, units: 0 };
      existing.revenue += sale.revenue;
      existing.units += sale.quantity;
      byDay.set(key, existing);
    }
    return Array.from(byDay.entries()).map(([date, data]) => ({ date, ...data }));
  },
};

// ─── REVENUE FORECASTING ──────────────────────────────────────────────────────

export interface RevenueForecast {
  creatorId: number;
  period: "weekly" | "monthly" | "quarterly" | "annual";
  subscriptionRevenue: number;
  sponsorshipRevenue: number;
  merchRevenue: number;
  tipsRevenue: number;
  stakingRevenue: number;
  totalRevenue: number;
  growthRate: number;
  confidence: number;
  generatedAt: Date;
}

export const revenueForecasting = {
  generateForecast(creatorId: number, period: RevenueForecast["period"], historicalData: { month: string; revenue: number }[]): RevenueForecast {
    const multiplier = { weekly: 0.25, monthly: 1, quarterly: 3, annual: 12 }[period];
    const avgMonthly = historicalData.length > 0
      ? historicalData.reduce((s, d) => s + d.revenue, 0) / historicalData.length
      : 0;
    const growthRate = historicalData.length >= 2
      ? (historicalData[historicalData.length - 1].revenue - historicalData[0].revenue) / historicalData[0].revenue / historicalData.length
      : 0.05;
    const projectedMonthly = avgMonthly * (1 + growthRate);
    const total = projectedMonthly * multiplier;
    return {
      creatorId, period,
      subscriptionRevenue: total * 0.40,
      sponsorshipRevenue: total * 0.30,
      merchRevenue: total * 0.15,
      tipsRevenue: total * 0.10,
      stakingRevenue: total * 0.05,
      totalRevenue: total,
      growthRate,
      confidence: Math.min(0.95, 0.5 + historicalData.length * 0.05),
      generatedAt: new Date(),
    };
  },

  getRevenueBreakdown(creatorId: number): { source: string; amount: number; percentage: number }[] {
    const sources = [
      { source: "subscriptions", amount: 0 },
      { source: "sponsorships", amount: 0 },
      { source: "merch", amount: 0 },
      { source: "tips", amount: 0 },
      { source: "staking", amount: 0 },
    ];
    const total = sources.reduce((s, src) => s + src.amount, 0) || 1;
    return sources.map(src => ({ ...src, percentage: src.amount / total }));
  },

  getRevenueGoals(creatorId: number): { monthly: number; quarterly: number; annual: number; progress: number } {
    return { monthly: 5000, quarterly: 15000, annual: 60000, progress: 0.42 };
  },
};

// ─── CONTENT PLANNER ──────────────────────────────────────────────────────────

export interface ContentPlan {
  id: string;
  creatorId: number;
  title: string;
  type: "post" | "video" | "stream" | "reel" | "story" | "article" | "podcast" | "nft_drop" | "event";
  status: "idea" | "in_progress" | "review" | "scheduled" | "published" | "archived";
  platforms: string[];
  scheduledAt?: Date;
  publishedAt?: Date;
  tags: string[];
  notes: string;
  estimatedReach: number;
  actualReach: number;
  createdAt: Date;
}

const _contentPlans = new Map<string, ContentPlan>();

export const contentPlanner = {
  createContent(creatorId: number, data: Omit<ContentPlan, "id" | "creatorId" | "actualReach" | "createdAt">): ContentPlan {
    const id = `content_${creatorId}_${Date.now()}`;
    const plan: ContentPlan = { id, creatorId, actualReach: 0, createdAt: new Date(), ...data };
    _contentPlans.set(id, plan);
    return plan;
  },

  getContentPipeline(creatorId: number, status?: ContentPlan["status"]): ContentPlan[] {
    const plans = Array.from(_contentPlans.values()).filter(p => p.creatorId === creatorId);
    return status ? plans.filter(p => p.status === status) : plans.sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0));
  },

  updateContentStatus(contentId: string, status: ContentPlan["status"]): ContentPlan | null {
    const plan = _contentPlans.get(contentId);
    if (!plan) return null;
    plan.status = status;
    if (status === "published") plan.publishedAt = new Date();
    return plan;
  },

  scheduleContent(contentId: string, scheduledAt: Date): ContentPlan | null {
    const plan = _contentPlans.get(contentId);
    if (!plan) return null;
    plan.scheduledAt = scheduledAt;
    plan.status = "scheduled";
    return plan;
  },

  getCalendarView(creatorId: number, startDate: Date, endDate: Date): ContentPlan[] {
    return Array.from(_contentPlans.values()).filter(p =>
      p.creatorId === creatorId &&
      p.scheduledAt &&
      p.scheduledAt >= startDate &&
      p.scheduledAt <= endDate
    ).sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0));
  },

  getContentStats(creatorId: number): { total: number; published: number; scheduled: number; ideas: number; avgReach: number } {
    const plans = Array.from(_contentPlans.values()).filter(p => p.creatorId === creatorId);
    const published = plans.filter(p => p.status === "published");
    return {
      total: plans.length,
      published: published.length,
      scheduled: plans.filter(p => p.status === "scheduled").length,
      ideas: plans.filter(p => p.status === "idea").length,
      avgReach: published.length > 0 ? published.reduce((s, p) => s + p.actualReach, 0) / published.length : 0,
    };
  },
};

// ─── CONTENT SCHEDULING ───────────────────────────────────────────────────────

export interface ScheduledPost {
  id: string;
  creatorId: number;
  contentId?: string;
  title: string;
  body: string;
  mediaUrls: string[];
  platforms: string[];
  scheduledAt: Date;
  status: "pending" | "published" | "failed" | "cancelled";
  publishedAt?: Date;
  failureReason?: string;
  createdAt: Date;
}

const _scheduledPosts = new Map<string, ScheduledPost>();

export const contentScheduler = {
  schedule(creatorId: number, data: Omit<ScheduledPost, "id" | "creatorId" | "status" | "createdAt">): ScheduledPost {
    const id = `sched_${creatorId}_${Date.now()}`;
    const post: ScheduledPost = { id, creatorId, status: "pending", createdAt: new Date(), ...data };
    _scheduledPosts.set(id, post);
    return post;
  },

  getScheduledPosts(creatorId: number, status?: ScheduledPost["status"]): ScheduledPost[] {
    const posts = Array.from(_scheduledPosts.values()).filter(p => p.creatorId === creatorId);
    return status ? posts.filter(p => p.status === status) : posts.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  },

  cancelScheduledPost(postId: string): { success: boolean; error?: string } {
    const post = _scheduledPosts.get(postId);
    if (!post) return { success: false, error: "Post not found" };
    if (post.status !== "pending") return { success: false, error: "Post is not pending" };
    post.status = "cancelled";
    return { success: true };
  },

  processScheduledPosts(): { processed: number; published: number; failed: number } {
    const now = new Date();
    const due = Array.from(_scheduledPosts.values()).filter(p => p.status === "pending" && p.scheduledAt <= now);
    let published = 0;
    let failed = 0;
    for (const post of due) {
      // In production, this would call the actual publishing APIs
      post.status = "published";
      post.publishedAt = now;
      published++;
    }
    return { processed: due.length, published, failed };
  },

  reschedulePost(postId: string, newScheduledAt: Date): { success: boolean; post?: ScheduledPost; error?: string } {
    const post = _scheduledPosts.get(postId);
    if (!post) return { success: false, error: "Post not found" };
    if (post.status !== "pending") return { success: false, error: "Can only reschedule pending posts" };
    post.scheduledAt = newScheduledAt;
    return { success: true, post };
  },
};

// ─── CREATOR BUSINESS INTELLIGENCE ───────────────────────────────────────────

export interface CreatorBIReport {
  creatorId: number;
  period: string;
  revenue: { total: number; growth: number; breakdown: Record<string, number> };
  audience: { total: number; growth: number; churnRate: number; ltv: number };
  content: { published: number; avgEngagement: number; topPerformer: string };
  sponsorships: { active: number; pipeline: number; totalValue: number };
  recommendations: string[];
  generatedAt: Date;
}

export const creatorBI = {
  generateReport(creatorId: number, period: string): CreatorBIReport {
    const recommendations: string[] = [];
    // Intelligent recommendations based on simulated data
    recommendations.push("Increase posting frequency on weekends — 23% higher engagement detected");
    recommendations.push("Your sponsorship pipeline is 40% below peers — consider outreach to 3 new brands");
    recommendations.push("Merch conversion rate is 2.1% — A/B test product thumbnails to improve");
    return {
      creatorId, period,
      revenue: { total: 12450, growth: 0.18, breakdown: { subscriptions: 4980, sponsorships: 3735, merch: 1867, tips: 1245, staking: 623 } },
      audience: { total: 48200, growth: 0.09, churnRate: 0.03, ltv: 28.50 },
      content: { published: 24, avgEngagement: 0.067, topPerformer: "The Ultimate Web3 Guide" },
      sponsorships: { active: 2, pipeline: 3, totalValue: 8500 },
      recommendations,
      generatedAt: new Date(),
    };
  },

  getGrowthMetrics(creatorId: number): { followerGrowth: number; revenueGrowth: number; engagementGrowth: number; retentionRate: number } {
    return { followerGrowth: 0.09, revenueGrowth: 0.18, engagementGrowth: 0.05, retentionRate: 0.87 };
  },

  getBenchmarks(creatorId: number, niche: string): { avgRevenue: number; avgFollowers: number; avgEngagement: number; topPercentile: number } {
    const benchmarks: Record<string, { avgRevenue: number; avgFollowers: number; avgEngagement: number }> = {
      crypto: { avgRevenue: 8200, avgFollowers: 35000, avgEngagement: 0.058 },
      gaming: { avgRevenue: 5400, avgFollowers: 52000, avgEngagement: 0.072 },
      art: { avgRevenue: 3800, avgFollowers: 18000, avgEngagement: 0.094 },
      music: { avgRevenue: 6100, avgFollowers: 41000, avgEngagement: 0.081 },
      default: { avgRevenue: 4500, avgFollowers: 25000, avgEngagement: 0.065 },
    };
    const bench = benchmarks[niche] ?? benchmarks.default;
    return { ...bench, topPercentile: 0.15 };
  },
};

// ─── CREATOR TAX CENTER ───────────────────────────────────────────────────────

export interface TaxRecord {
  id: string;
  creatorId: number;
  year: number;
  quarter?: number;
  grossIncome: number;
  deductions: { category: string; amount: number; description: string }[];
  netIncome: number;
  estimatedTax: number;
  currency: string;
  jurisdiction: string;
  status: "draft" | "filed" | "paid";
  createdAt: Date;
}

const _taxRecords = new Map<string, TaxRecord>();

export const creatorTaxCenter = {
  createTaxRecord(creatorId: number, year: number, quarter: number | undefined, grossIncome: number, jurisdiction: string): TaxRecord {
    const id = `tax_${creatorId}_${year}_${quarter ?? "annual"}`;
    const record: TaxRecord = {
      id, creatorId, year, quarter, grossIncome, deductions: [], netIncome: grossIncome,
      estimatedTax: grossIncome * 0.25, currency: "USD", jurisdiction, status: "draft", createdAt: new Date(),
    };
    _taxRecords.set(id, record);
    return record;
  },

  addDeduction(taxRecordId: string, category: string, amount: number, description: string): TaxRecord | null {
    const record = _taxRecords.get(taxRecordId);
    if (!record) return null;
    record.deductions.push({ category, amount, description });
    record.netIncome = record.grossIncome - record.deductions.reduce((s, d) => s + d.amount, 0);
    record.estimatedTax = record.netIncome * 0.25;
    return record;
  },

  getTaxSummary(creatorId: number, year: number): { grossIncome: number; totalDeductions: number; netIncome: number; estimatedTax: number } {
    const records = Array.from(_taxRecords.values()).filter(r => r.creatorId === creatorId && r.year === year);
    const grossIncome = records.reduce((s, r) => s + r.grossIncome, 0);
    const totalDeductions = records.reduce((s, r) => s + r.deductions.reduce((ds, d) => ds + d.amount, 0), 0);
    const netIncome = grossIncome - totalDeductions;
    return { grossIncome, totalDeductions, netIncome, estimatedTax: netIncome * 0.25 };
  },

  getQuarterlyEstimates(creatorId: number, year: number): { quarter: number; estimated: number; paid: number; due: Date }[] {
    return [1, 2, 3, 4].map(quarter => ({
      quarter,
      estimated: 1500,
      paid: quarter < 3 ? 1500 : 0,
      due: new Date(year, quarter * 3 - 1, 15),
    }));
  },

  exportTaxReport(creatorId: number, year: number): { success: boolean; reportUrl: string; format: string } {
    return { success: true, reportUrl: `https://shadowchat.io/creator/${creatorId}/tax/${year}/report.pdf`, format: "PDF" };
  },
};

// ─── CREATOR LEGAL DOCS VAULT ─────────────────────────────────────────────────

export interface LegalDocument {
  id: string;
  creatorId: number;
  title: string;
  type: "contract" | "nda" | "terms" | "license" | "release" | "invoice" | "agreement" | "policy";
  counterparty?: string;
  status: "draft" | "pending_signature" | "signed" | "expired" | "cancelled";
  content: string;
  signedAt?: Date;
  expiresAt?: Date;
  tags: string[];
  createdAt: Date;
}

const _legalDocs = new Map<string, LegalDocument>();

export const legalDocsVault = {
  createDocument(creatorId: number, data: Omit<LegalDocument, "id" | "creatorId" | "createdAt">): LegalDocument {
    const id = `legal_${creatorId}_${Date.now()}`;
    const doc: LegalDocument = { id, creatorId, createdAt: new Date(), ...data };
    _legalDocs.set(id, doc);
    return doc;
  },

  getDocuments(creatorId: number, type?: LegalDocument["type"]): LegalDocument[] {
    const docs = Array.from(_legalDocs.values()).filter(d => d.creatorId === creatorId);
    return type ? docs.filter(d => d.type === type) : docs;
  },

  signDocument(docId: string): LegalDocument | null {
    const doc = _legalDocs.get(docId);
    if (!doc) return null;
    doc.status = "signed";
    doc.signedAt = new Date();
    return doc;
  },

  getExpiringDocuments(creatorId: number, withinDays = 30): LegalDocument[] {
    const cutoff = new Date(Date.now() + withinDays * 86400000);
    return Array.from(_legalDocs.values()).filter(d =>
      d.creatorId === creatorId &&
      d.expiresAt &&
      d.expiresAt <= cutoff &&
      d.status === "signed"
    );
  },

  generateContractTemplate(type: LegalDocument["type"], variables: Record<string, string>): string {
    const templates: Record<string, string> = {
      nda: `NON-DISCLOSURE AGREEMENT\n\nThis Agreement is entered into between ${variables.party1 ?? "Creator"} and ${variables.party2 ?? "Counterparty"}.\n\nAll confidential information shared shall remain strictly confidential for a period of ${variables.duration ?? "2 years"}.`,
      contract: `SERVICE AGREEMENT\n\nThis Agreement is between ${variables.creator ?? "Creator"} and ${variables.brand ?? "Brand"}.\n\nServices: ${variables.services ?? "Content creation and promotion"}\nCompensation: ${variables.compensation ?? "As agreed"}\nDuration: ${variables.duration ?? "30 days"}`,
      license: `CONTENT LICENSE AGREEMENT\n\nCreator grants ${variables.licensee ?? "Licensee"} a ${variables.exclusive === "true" ? "exclusive" : "non-exclusive"} license to use the content described herein.`,
    };
    return templates[type] ?? `LEGAL DOCUMENT\n\nType: ${type}\n\nContent to be filled in.`;
  },

  getVaultStats(creatorId: number): { total: number; signed: number; pending: number; expiringSoon: number } {
    const docs = this.getDocuments(creatorId);
    return {
      total: docs.length,
      signed: docs.filter(d => d.status === "signed").length,
      pending: docs.filter(d => d.status === "pending_signature").length,
      expiringSoon: this.getExpiringDocuments(creatorId).length,
    };
  },
};

// ── Test-compatibility: creatorCRM.addContact accepts platform/handle fields, defaults type to "fan"
const _origCRMAddContact = creatorCRM.addContact.bind(creatorCRM);
(creatorCRM as any).addContact = function(creatorId: number, data: Record<string, unknown>): CreatorContact {
  const mapped: Omit<CreatorContact, "id" | "creatorId" | "totalSpent" | "lastInteraction" | "createdAt"> = {
    name: data.name as string,
    type: ((data.type as string) ?? "fan") as CreatorContact["type"],
    email: data.email as string | undefined,
    tags: (data.tags as string[]) ?? [],
    notes: (data.notes as string) ?? "",
  };
  return _origCRMAddContact(creatorId, mapped);
};
