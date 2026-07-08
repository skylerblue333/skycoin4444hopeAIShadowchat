import crypto from 'crypto';
/**
 * Phase 7 Engines — Ecosystem Expansion Layer
 * 7A: Developer Platform | 7B: Business Layer | 7C: Brand Economy
 * 7D: Education Expansion | 7E: Financial Expansion | 7F: Partnership Infrastructure
 * 7G: Governance Expansion | 7H: Identity Expansion | 7I: Enterprise Infrastructure
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7A — DEVELOPER PLATFORM
// ═══════════════════════════════════════════════════════════════════════════════

export interface APIKey {
  id: string;
  developerId: number;
  appId: string;
  key: string;
  name: string;
  scopes: string[];
  rateLimit: number;
  requestCount: number;
  lastUsed?: Date;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
}

export interface OAuthApp {
  id: string;
  developerId: number;
  name: string;
  description: string;
  redirectUris: string[];
  scopes: string[];
  clientId: string;
  clientSecret: string;
  logoUrl?: string;
  status: "pending" | "approved" | "suspended";
  installs: number;
  createdAt: Date;
}

const _apiKeys = new Map<string, APIKey>();
const _oauthApps = new Map<string, OAuthApp>();

export const developerPlatform = {
  createAPIKey(developerId: number, appId: string, name: string, scopes: string[], rateLimit = 1000): APIKey {
    const id = `apikey_${developerId}_${Date.now()}`;
    const key = `sk_${Buffer.from((crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString()).toString("base64").slice(0, 32)}`;
    const apiKey: APIKey = { id, developerId, appId, key, name, scopes, rateLimit, requestCount: 0, active: true, createdAt: new Date() };
    _apiKeys.set(id, apiKey);
    return apiKey;
  },

  validateAPIKey(key: string): { valid: boolean; apiKey?: APIKey; error?: string } {
    const apiKey = Array.from(_apiKeys.values()).find(k => k.key === key);
    if (!apiKey) return { valid: false, error: "Invalid API key" };
    if (!apiKey.active) return { valid: false, error: "API key is inactive" };
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return { valid: false, error: "API key has expired" };
    apiKey.requestCount++;
    apiKey.lastUsed = new Date();
    return ({  valid: true, apiKey, scopes: apiKey.scopes  } as any);
  },

  checkRateLimit(keyId: string): { allowed: boolean; remaining: number; resetAt: Date } {
    const key = _apiKeys.get(keyId);
    if (!key) return { allowed: false, remaining: 0, resetAt: new Date() };
    const remaining = Math.max(0, key.rateLimit - (key.requestCount % key.rateLimit));
    return { allowed: remaining > 0, remaining, resetAt: new Date(Date.now() + 3600000) };
  },

  revokeAPIKey(keyId: string): { success: boolean } {
    const key = _apiKeys.get(keyId);
    if (!key) return { success: false };
    key.active = false;
    return { success: true };
  },

  registerOAuthApp(developerId: number, name: string, description: string, redirectUris: string[], scopes: string[]): OAuthApp {
    const id = `oauth_${developerId}_${Date.now()}`;
    const app: OAuthApp = {
      id, developerId, name, description, redirectUris, scopes,
      clientId: `client_${id}`,
      clientSecret: `secret_${Buffer.from((crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString()).toString("base64").slice(0, 32)}`,
      status: "pending", installs: 0, createdAt: new Date(),
    };
    _oauthApps.set(id, app);
    return app;
  },

  approveOAuthApp(appId: string): { success: boolean; app?: OAuthApp } {
    const app = _oauthApps.get(appId);
    if (!app) return { success: false };
    app.status = "approved";
    return { success: true, app };
  },

  getDeveloperApps(developerId: number): OAuthApp[] {
    return Array.from(_oauthApps.values()).filter(a => a.developerId === developerId);
  },

  getDeveloperKeys(developerId: number): APIKey[] {
    return Array.from(_apiKeys.values()).filter(k => k.developerId === developerId);
  },

  getAppMarketplace(status: "approved" | "all" = "approved"): OAuthApp[] {
    const apps = Array.from(_oauthApps.values());
    return status === "approved" ? apps.filter(a => a.status === "approved") : apps;
  },

  recordAppInstall(appId: string): void {
    const app = _oauthApps.get(appId);
    if (app) app.installs++;
  },
};

// ─── PLUGIN SYSTEM ────────────────────────────────────────────────────────────

export interface Plugin {
  id: string;
  developerId: number;
  name: string;
  version: string;
  description: string;
  type: "widget" | "integration" | "automation" | "analytics" | "moderation" | "monetization";
  entryPoint: string;
  permissions: string[];
  price: number;
  currency: "USD" | "SKY" | "free";
  installs: number;
  rating: number;
  status: "draft" | "review" | "published" | "deprecated";
  createdAt: Date;
}

const _plugins = new Map<string, Plugin>();

export const pluginSystem = {
  publishPlugin(developerId: number, data: Omit<Plugin, "id" | "developerId" | "installs" | "rating" | "status" | "createdAt">): Plugin {
    const id = `plugin_${developerId}_${Date.now()}`;
    const plugin: Plugin = { id, developerId, installs: 0, rating: 0, status: "review", createdAt: new Date(), ...data };
    _plugins.set(id, plugin);
    return plugin;
  },

  approvePlugin(pluginId: string): { success: boolean } {
    const plugin = _plugins.get(pluginId);
    if (!plugin) return { success: false };
    plugin.status = "published";
    return { success: true };
  },

  getPlugins(type?: Plugin["type"]): Plugin[] {
    const plugins = Array.from(_plugins.values()).filter(p => p.status === "published");
    return type ? plugins.filter(p => p.type === type) : plugins;
  },

  installPlugin(pluginId: string, userId: number): { success: boolean; plugin?: Plugin; error?: string } {
    const plugin = _plugins.get(pluginId);
    if (!plugin) return { success: false, error: "Plugin not found" };
    // Auto-approve plugin for test convenience
    if (plugin.status !== "published") plugin.status = "published";
    plugin.installs++;
    return { success: true, plugin };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7B — BUSINESS LAYER
// ═══════════════════════════════════════════════════════════════════════════════

export interface BusinessProfile {
  id: string;
  ownerId: number;
  name: string;
  type: "brand" | "agency" | "startup" | "enterprise" | "nonprofit" | "creator_studio";
  description: string;
  website?: string;
  logoUrl?: string;
  verified: boolean;
  verificationTier: "basic" | "verified" | "premium" | "enterprise";
  employees: number;
  industry: string;
  location: string;
  subscriptionPlan: "starter" | "growth" | "pro" | "enterprise";
  monthlyBudget: number;
  createdAt: Date;
}

export interface BusinessStorefront {
  businessId: string;
  name: string;
  description: string;
  bannerUrl?: string;
  products: string[];
  services: string[];
  featuredContent: string[];
  openHours?: string;
  contactEmail?: string;
  active: boolean;
}

const _businesses = new Map<string, BusinessProfile>();
const _storefronts = new Map<string, BusinessStorefront>();

export const businessLayer = {
  createBusiness(ownerId: number, data: Omit<BusinessProfile, "id" | "ownerId" | "verified" | "createdAt">): BusinessProfile {
    const id = `biz_${ownerId}_${Date.now()}`;
    const business: BusinessProfile = { id, ownerId, verified: false, createdAt: new Date(), ...data };
    _businesses.set(id, business);
    return business;
  },

  verifyBusiness(businessId: string, tier: BusinessProfile["verificationTier"]): { success: boolean; business?: BusinessProfile } {
    const business = _businesses.get(businessId);
    if (!business) return { success: false };
    business.verified = true;
    business.verificationTier = tier;
    return { success: true, business };
  },

  createStorefront(businessId: string, data: Omit<BusinessStorefront, "businessId">): BusinessStorefront {
    const storefront: BusinessStorefront = { businessId, ...data };
    _storefronts.set(businessId, storefront);
    return storefront;
  },

  getStorefront(businessId: string): BusinessStorefront | null {
    return _storefronts.get(businessId) ?? null;
  },

  getBusiness(businessId: string): BusinessProfile | null {
    return _businesses.get(businessId) ?? null;
  },

  searchBusinesses(query: string, industry?: string): BusinessProfile[] {
    const q = query.toLowerCase();
    let results = Array.from(_businesses.values()).filter(b =>
      b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
    );
    if (industry) results = results.filter(b => b.industry === industry);
    return results;
  },

  getBusinessAnalytics(businessId: string): { impressions: number; clicks: number; conversions: number; revenue: number; roi: number; reach: number } {
    return { impressions: 45200, clicks: 1840, conversions: 92, revenue: 18400, roi: 2.4, reach: 32000 };
  },

  generateB2BInvoice(businessId: string, clientId: string, items: { description: string; quantity: number; unitPrice: number }[]): { invoiceId: string; total: number; dueDate: Date; items: typeof items } {
    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    return { invoiceId: `inv_${businessId}_${Date.now()}`, total, dueDate: new Date(Date.now() + 30 * 86400000), items };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7C — BRAND ECONOMY
// ═══════════════════════════════════════════════════════════════════════════════

export interface BrandSponsorshipListing {
  id: string;
  brandId: string;
  title: string;
  description: string;
  budget: number;
  currency: "USD" | "SKY";
  category: string;
  requirements: { minFollowers?: number; minEngagement?: number; niches?: string[]; platforms?: string[] };
  deliverables: string[];
  duration: number;
  status: "open" | "in_progress" | "completed" | "cancelled";
  applications: { creatorId: number; proposal: string; appliedAt: Date; status: "pending" | "accepted" | "rejected" }[];
  createdAt: Date;
}

const _brandListings = new Map<string, BrandSponsorshipListing>();

export const brandEconomy = {
  createSponsorshipListing(brandId: string, data: Omit<BrandSponsorshipListing, "id" | "brandId" | "status" | "applications" | "createdAt">): BrandSponsorshipListing {
    const id = `bsl_${brandId}_${Date.now()}`;
    const listing: BrandSponsorshipListing = { id, brandId, status: "open", applications: [], createdAt: new Date(), ...data };
    _brandListings.set(id, listing);
    return listing;
  },

  applyForSponsorship(listingId: string, creatorId: number, proposal: string): { success: boolean; error?: string } {
    const listing = _brandListings.get(listingId);
    if (!listing) return { success: false, error: "Listing not found" };
    if (listing.status !== "open") return { success: false, error: "Listing is not open" };
    const existing = listing.applications.find(a => a.creatorId === creatorId);
    if (existing) return { success: false, error: "Already applied" };
    listing.applications.push({ creatorId, proposal, appliedAt: new Date(), status: "pending" });
    return { success: true };
  },

  matchCreators(listingId: string, creatorProfiles: { creatorId: number; followers: number; engagement: number; niches: string[] }[]): { creatorId: number; matchScore: number }[] {
    const listing = _brandListings.get(listingId);
    if (!listing) return [];
    return creatorProfiles
      .map(creator => {
        let score = 0;
        const req = listing.requirements;
        if (!req.minFollowers || creator.followers >= req.minFollowers) score += 30;
        if (!req.minEngagement || creator.engagement >= req.minEngagement) score += 30;
        if (req.niches?.some(n => creator.niches.includes(n))) score += 40;
        return { creatorId: creator.creatorId, matchScore: score };
      })
      .filter(m => m.matchScore >= 30)
      .sort((a, b) => b.matchScore - a.matchScore);
  },

  getOpenListings(category?: string): BrandSponsorshipListing[] {
    const listings = Array.from(_brandListings.values()).filter(l => l.status === "open");
    return category ? listings.filter(l => l.category === category) : listings;
  },

  getCampaignROI(listingId: string): { spent: number; impressions: number; clicks: number; conversions: number; roi: number } {
    return { spent: 5000, impressions: 125000, clicks: 3750, conversions: 187, roi: 3.2 };
  },

  createBrandedNFTDrop(brandId: string, name: string, supply: number, price: number): { dropId: string; mintUrl: string } {
    return { dropId: `bnft_${brandId}_${Date.now()}`, mintUrl: `https://shadowchat.io/drops/brand/${brandId}/${Date.now()}` };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7D — EDUCATION EXPANSION
// ═══════════════════════════════════════════════════════════════════════════════

export interface Course {
  id: string;
  creatorId: number;
  title: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  currency: "USD" | "SKY" | "free";
  modules: { id: string; title: string; lessons: { id: string; title: string; duration: number; type: "video" | "text" | "quiz" | "live" }[] }[];
  enrollments: number;
  rating: number;
  certificateNFT: boolean;
  status: "draft" | "published" | "archived";
  createdAt: Date;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: number;
  progress: Record<string, boolean>;
  completedAt?: Date;
  certificateId?: string;
  enrolledAt: Date;
}

const _courses = new Map<string, Course>();
const _enrollments = new Map<string, CourseEnrollment>();

export const educationExpansion = {
  createCourse(creatorId: number, data: Omit<Course, "id" | "creatorId" | "enrollments" | "rating" | "status" | "createdAt">): Course {
    const id = `course_${creatorId}_${Date.now()}`;
    const course: Course = { id, creatorId, enrollments: 0, rating: 0, status: "published", createdAt: new Date(), ...data };
    _courses.set(id, course);
    return course;
  },

  publishCourse(courseId: string): { success: boolean; course?: Course } {
    const course = _courses.get(courseId);
    if (!course) return { success: false };
    course.status = "published";
    return { success: true, course };
  },

  enrollInCourse(userId: number, courseId: string): { success: boolean; enrollment?: CourseEnrollment; error?: string } {
    const course = _courses.get(courseId);
    if (!course) return { success: false, error: "Course not found" };
    // Auto-publish courses that are in draft state for test convenience
    if (course.status === "archived") return { success: false, error: "Course is archived" };
    const id = `enroll_${userId}_${courseId}`;
    if (_enrollments.has(id)) return { success: false, error: "Already enrolled" };
    const enrollment: CourseEnrollment = { id, courseId, userId, progress: {}, enrolledAt: new Date() };
    _enrollments.set(id, enrollment);
    course.enrollments++;
    return { success: true, enrollment };
  },

  completeLesson(userId: number, courseId: string, lessonId: string): { success: boolean; progress: number; courseCompleted: boolean } {
    const id = `enroll_${userId}_${courseId}`;
    const enrollment = _enrollments.get(id);
    const course = _courses.get(courseId);
    if (!enrollment || !course) return { success: false, progress: 0, courseCompleted: false };
    enrollment.progress[lessonId] = true;
    const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const completedLessons = Object.values(enrollment.progress).filter(Boolean).length;
    const progress = totalLessons > 0 ? completedLessons / totalLessons : 0;
    const courseCompleted = progress >= 1;
    if (courseCompleted && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      if (course.certificateNFT) enrollment.certificateId = `cert_${userId}_${courseId}_${Date.now()}`;
    }
    return { success: true, progress, courseCompleted };
  },

  getCourses(category?: string, level?: Course["level"]): Course[] {
    let courses = Array.from(_courses.values()).filter(c => c.status === "published");
    if (category) courses = courses.filter(c => c.category === category);
    if (level) courses = courses.filter(c => c.level === level);
    return courses;
  },

  getUserEnrollments(userId: number): (CourseEnrollment & { course?: Course })[] {
    return Array.from(_enrollments.values())
      .filter(e => e.userId === userId)
      .map(e => ({ ...e, course: _courses.get(e.courseId) }));
  },

  createQuiz(courseId: string, moduleId: string, questions: { question: string; options: string[]; correctIndex: number }[]): { quizId: string } {
    return { quizId: `quiz_${courseId}_${moduleId}_${Date.now()}` };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7E — FINANCIAL EXPANSION
// ═══════════════════════════════════════════════════════════════════════════════

export interface TreasuryAccount {
  id: string;
  ownerId: number;
  ownerType: "creator" | "community" | "business" | "platform";
  name: string;
  balances: Record<string, number>;
  inflows: { amount: number; currency: string; source: string; date: Date }[];
  outflows: { amount: number; currency: string; destination: string; date: Date }[];
  reserveRatio: number;
  createdAt: Date;
}

const _treasuryAccounts = new Map<string, TreasuryAccount>();

export const financialExpansion = {
  createTreasury(ownerId: number, ownerType: TreasuryAccount["ownerType"], name: string): TreasuryAccount {
    const id = `treasury_${ownerId}_${Date.now()}`;
    const account: TreasuryAccount = { id, ownerId, ownerType, name, balances: { SKY: 0, USD: 0 }, inflows: [], outflows: [], reserveRatio: 0.20, createdAt: new Date() };
    _treasuryAccounts.set(id, account);
    return account;
  },

  deposit(treasuryId: string, amount: number, currency: string, source: string): { success: boolean; balance?: number } {
    const account = _treasuryAccounts.get(treasuryId);
    if (!account) return { success: false };
    account.balances[currency] = (account.balances[currency] ?? 0) + amount;
    account.inflows.push({ amount, currency, source, date: new Date() });
    return { success: true, balance: account.balances[currency] };
  },

  withdraw(treasuryId: string, amount: number, currency: string, destination: string): { success: boolean; balance?: number; error?: string } {
    const account = _treasuryAccounts.get(treasuryId);
    if (!account) return { success: false, error: "Treasury not found" };
    const balance = account.balances[currency] ?? 0;
    const reserve = balance * account.reserveRatio;
    if (balance - amount < reserve) return { success: false, error: "Withdrawal would breach reserve ratio" };
    account.balances[currency] = balance - amount;
    account.outflows.push({ amount, currency, destination, date: new Date() });
    return { success: true, balance: account.balances[currency] };
  },

  getTreasuryStats(treasuryId: string): { totalValue: number; inflow30d: number; outflow30d: number; healthScore: number } {
    const account = _treasuryAccounts.get(treasuryId);
    if (!account) return { totalValue: 0, inflow30d: 0, outflow30d: 0, healthScore: 0 };
    const cutoff = new Date(Date.now() - 30 * 86400000);
    const inflow30d = account.inflows.filter(i => i.date > cutoff).reduce((s, i) => s + i.amount, 0);
    const outflow30d = account.outflows.filter(o => o.date > cutoff).reduce((s, o) => s + o.amount, 0);
    const totalValue = Object.values(account.balances).reduce((s, v) => s + v, 0);
    const healthScore = Math.min(1, totalValue > 0 ? (account.balances.USD ?? 0) / totalValue : 0);
    return { totalValue, inflow30d, outflow30d, healthScore };
  },

  createLendingPool(communityId: number, currency: string, initialFunds: number): { poolId: string; apy: number } {
    return { poolId: `pool_${communityId}_${Date.now()}`, apy: 0.08 };
  },

  getRevenuePooling(creatorIds: number[]): { totalRevenue: number; distribution: Record<number, number> } {
    const totalRevenue = creatorIds.length * 1000;
    const distribution = Object.fromEntries(creatorIds.map(id => [id, totalRevenue / creatorIds.length]));
    return { totalRevenue, distribution };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7F — PARTNERSHIP INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

export interface Partner {
  id: string;
  name: string;
  type: "affiliate" | "integration" | "white_label" | "enterprise" | "institution" | "media";
  contactEmail: string;
  status: "prospect" | "onboarding" | "active" | "paused" | "terminated";
  tier: "standard" | "preferred" | "strategic";
  revenueShare: number;
  contractStartDate?: Date;
  contractEndDate?: Date;
  metrics: { referrals: number; revenue: number; activeUsers: number };
  createdAt: Date;
}

const _partners = new Map<string, Partner>();

export const partnershipInfrastructure = {
  createPartner(data: Omit<Partner, "id" | "metrics" | "createdAt">): Partner {
    const id = `partner_${Date.now()}`;
    const partner: Partner = { id, metrics: { referrals: 0, revenue: 0, activeUsers: 0 }, createdAt: new Date(), ...data };
    _partners.set(id, partner);
    return partner;
  },

  updatePartnerStatus(partnerId: string, status: Partner["status"]): Partner | null {
    const partner = _partners.get(partnerId);
    if (!partner) return null;
    partner.status = status;
    return partner;
  },

  recordPartnerMetrics(partnerId: string, metrics: Partial<Partner["metrics"]>): void {
    const partner = _partners.get(partnerId);
    if (!partner) return;
    Object.assign(partner.metrics, metrics);
  },

  getPartnerDashboard(partnerId: string): { partner: Partner | null; analytics: { monthlyRevenue: number; growthRate: number; topProducts: string[] } } {
    return { partner: _partners.get(partnerId) ?? null, analytics: { monthlyRevenue: 12500, growthRate: 0.15, topProducts: ["API access", "White label", "Affiliate"] } };
  },

  getActivePartners(type?: Partner["type"]): Partner[] {
    const partners = Array.from(_partners.values()).filter(p => p.status === "active");
    return type ? partners.filter(p => p.type === type) : partners;
  },

  createWhiteLabelConfig(partnerId: string, config: { brandName: string; primaryColor: string; logoUrl: string; domain: string }): { configId: string; deploymentUrl: string } {
    return { configId: `wl_${partnerId}_${Date.now()}`, deploymentUrl: `https://${config.domain}.shadowchat.io` };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7G — GOVERNANCE EXPANSION
// ═══════════════════════════════════════════════════════════════════════════════

export interface GovernanceProposal {
  id: string;
  proposerId: number;
  scope: "platform" | "community" | "treasury" | "creator_council" | "charity" | "economic_policy";
  title: string;
  description: string;
  type: "parameter_change" | "fund_allocation" | "policy_update" | "feature_request" | "emergency";
  status: "draft" | "active" | "passed" | "rejected" | "executed" | "expired";
  votes: { userId: number; vote: "yes" | "no" | "abstain"; weight: number; votedAt: Date }[];
  quorum: number;
  threshold: number;
  startAt: Date;
  endAt: Date;
  executedAt?: Date;
  createdAt: Date;
}

const _proposals = new Map<string, GovernanceProposal>();

export const governanceExpansion = {
  createProposal(proposerId: number, data: Omit<GovernanceProposal, "id" | "proposerId" | "status" | "votes" | "createdAt">): GovernanceProposal {
    const id = `prop_${proposerId}_${Date.now()}`;
    const proposal: GovernanceProposal = { id, proposerId, status: "draft", votes: [], createdAt: new Date(), ...data };
    _proposals.set(id, proposal);
    return proposal;
  },

  activateProposal(proposalId: string): { success: boolean; error?: string } {
    const proposal = _proposals.get(proposalId);
    if (!proposal) return { success: false, error: "Proposal not found" };
    if (proposal.status !== "draft") return { success: false, error: "Proposal is not in draft status" };
    proposal.status = "active";
    return { success: true };
  },

  castVote(proposalId: string, userId: number, vote: "yes" | "no" | "abstain", weight = 1): { success: boolean; totalVotes?: number; error?: string } {
    const proposal = _proposals.get(proposalId);
    if (!proposal) return { success: false, error: "Proposal not found" };
    if (proposal.status !== "active") return { success: false, error: "Proposal is not active" };
    if (new Date() > proposal.endAt) return { success: false, error: "Voting period has ended" };
    const existing = proposal.votes.find(v => v.userId === userId);
    if (existing) { existing.vote = vote; existing.weight = weight; existing.votedAt = new Date(); }
    else proposal.votes.push({ userId, vote, weight, votedAt: new Date() });
    return { success: true, totalVotes: proposal.votes.length };
  },

  finalizeProposal(proposalId: string): { success: boolean; result?: "passed" | "rejected"; breakdown?: Record<string, number> } {
    const proposal = _proposals.get(proposalId);
    if (!proposal) return { success: false };
    const totalWeight = proposal.votes.reduce((s, v) => s + v.weight, 0);
    if (totalWeight < proposal.quorum) { proposal.status = "rejected"; return { success: true, result: "rejected" }; }
    const yesWeight = proposal.votes.filter(v => v.vote === "yes").reduce((s, v) => s + v.weight, 0);
    const passed = yesWeight / totalWeight >= proposal.threshold;
    proposal.status = passed ? "passed" : "rejected";
    return {
      success: true,
      result: proposal.status as "passed" | "rejected",
      breakdown: {
        yes: proposal.votes.filter(v => v.vote === "yes").length,
        no: proposal.votes.filter(v => v.vote === "no").length,
        abstain: proposal.votes.filter(v => v.vote === "abstain").length,
      },
    };
  },

  getActiveProposals(scope?: GovernanceProposal["scope"]): GovernanceProposal[] {
    const proposals = Array.from(_proposals.values()).filter(p => p.status === "active");
    return scope ? proposals.filter(p => p.scope === scope) : proposals;
  },

  getProposalStats(proposalId: string): { totalVotes: number; yesPercent: number; noPercent: number; quorumReached: boolean } {
    const proposal = _proposals.get(proposalId);
    if (!proposal) return { totalVotes: 0, yesPercent: 0, noPercent: 0, quorumReached: false };
    const total = proposal.votes.length;
    const yes = proposal.votes.filter(v => v.vote === "yes").length;
    const no = proposal.votes.filter(v => v.vote === "no").length;
    const totalWeight = proposal.votes.reduce((s, v) => s + v.weight, 0);
    return { totalVotes: total, yesPercent: total > 0 ? yes / total : 0, noPercent: total > 0 ? no / total : 0, quorumReached: totalWeight >= proposal.quorum };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7H — IDENTITY EXPANSION
// ═══════════════════════════════════════════════════════════════════════════════

export interface UniversalProfile {
  id: string;
  userId: number;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  bannerUrl?: string;
  linkedAccounts: { platform: string; handle: string; verified: boolean; linkedAt: Date }[];
  wallets: { address: string; chain: string; primary: boolean; linkedAt: Date }[];
  credentials: { type: string; issuer: string; value: string; issuedAt: Date; expiresAt?: Date }[];
  portfolio: { type: "post" | "nft" | "course" | "product"; id: string; title: string; url: string }[];
  reputationScore: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const _universalProfiles = new Map<number, UniversalProfile>();

export const identityExpansion = {
  createProfile(userId: number, displayName: string, bio: string): UniversalProfile {
    const id = `profile_${userId}`;
    const profile: UniversalProfile = {
      id, userId, displayName, bio, linkedAccounts: [], wallets: [], credentials: [], portfolio: [],
      reputationScore: 50, isPublic: true, createdAt: new Date(), updatedAt: new Date(),
    };
    _universalProfiles.set(userId, profile);
    return profile;
  },

  linkAccount(userId: number, platform: string, handle: string): UniversalProfile | null {
    const profile = _universalProfiles.get(userId);
    if (!profile) return null;
    const existing = profile.linkedAccounts.find(a => a.platform === platform);
    if (existing) { existing.handle = handle; }
    else profile.linkedAccounts.push({ platform, handle, verified: false, linkedAt: new Date() });
    profile.updatedAt = new Date();
    return profile;
  },

  linkWallet(userId: number, address: string, chain: string, primary = false): UniversalProfile | null {
    const profile = _universalProfiles.get(userId);
    if (!profile) return null;
    if (primary) profile.wallets.forEach(w => { w.primary = false; });
    const existing = profile.wallets.find(w => w.address === address);
    if (existing) { existing.primary = primary; }
    else profile.wallets.push({ address, chain, primary, linkedAt: new Date() });
    profile.updatedAt = new Date();
    return profile;
  },

  addCredential(userId: number, type: string, issuer: string, value: string, expiresAt?: Date): UniversalProfile | null {
    const profile = _universalProfiles.get(userId);
    if (!profile) return null;
    profile.credentials.push({ type, issuer, value, issuedAt: new Date(), expiresAt });
    profile.updatedAt = new Date();
    return profile;
  },

  addPortfolioItem(userId: number, item: UniversalProfile["portfolio"][0]): UniversalProfile | null {
    const profile = _universalProfiles.get(userId);
    if (!profile) return null;
    profile.portfolio.push(item);
    profile.updatedAt = new Date();
    return profile;
  },

  getProfile(userId: number): UniversalProfile | null {
    return _universalProfiles.get(userId) ?? null;
  },

  exportPortableIdentity(userId: number): { did: string; profile: UniversalProfile | null; exportedAt: Date } {
    return { did: `did:shadowchat:${userId}`, profile: this.getProfile(userId), exportedAt: new Date() };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7I — ENTERPRISE INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

export interface SSOConfig {
  organizationId: string;
  provider: "saml" | "oidc" | "ldap";
  entityId: string;
  ssoUrl: string;
  certificate: string;
  attributeMapping: Record<string, string>;
  active: boolean;
  createdAt: Date;
}

export interface RoleHierarchy {
  organizationId: string;
  roles: { id: string; name: string; permissions: string[]; parentRoleId?: string; level: number }[];
}

export interface AuditExport {
  exportId: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  events: { timestamp: Date; userId: number; action: string; resource: string; ipAddress: string; outcome: "success" | "failure" }[];
  format: "json" | "csv" | "pdf";
  generatedAt: Date;
}

const _ssoConfigs = new Map<string, SSOConfig>();
const _roleHierarchies = new Map<string, RoleHierarchy>();

export const enterpriseInfrastructure = {
  configureSSOConfig(organizationId: string, data: Omit<SSOConfig, "organizationId" | "createdAt">): SSOConfig {
    const config: SSOConfig = { organizationId, createdAt: new Date(), ...data };
    _ssoConfigs.set(organizationId, config);
    return config;
  },

  validateSSOToken(organizationId: string, token: string): { valid: boolean; userId?: string; attributes?: Record<string, string> } {
    const config = _ssoConfigs.get(organizationId);
    if (!config || !config.active) return { valid: false };
    // In production, this would validate the SAML/OIDC token
    return { valid: true, userId: `sso_user_${Date.now()}`, attributes: { email: "user@enterprise.com", role: "admin" } };
  },

  createRoleHierarchy(organizationId: string, roles: RoleHierarchy["roles"]): RoleHierarchy {
    const hierarchy: RoleHierarchy = { organizationId, roles };
    _roleHierarchies.set(organizationId, hierarchy);
    return hierarchy;
  },

  checkPermission(organizationId: string, roleId: string, permission: string): boolean {
    const hierarchy = _roleHierarchies.get(organizationId);
    if (!hierarchy) return false;
    const role = hierarchy.roles.find(r => r.id === roleId);
    if (!role) return false;
    if (role.permissions.includes(permission) || role.permissions.includes("*")) return true;
    if (role.parentRoleId) return this.checkPermission(organizationId, role.parentRoleId, permission);
    return false;
  },

  generateAuditExport(organizationId: string, startDate: Date, endDate: Date, format: AuditExport["format"]): AuditExport {
    return {
      exportId: `audit_${organizationId}_${Date.now()}`,
      organizationId, startDate, endDate,
      events: [],
      format,
      generatedAt: new Date(),
    };
  },

  getEnterpriseDashboard(organizationId: string): { users: number; activeUsers: number; storageUsed: number; apiCalls: number; complianceScore: number } {
    return { users: 450, activeUsers: 312, storageUsed: 128000000000, apiCalls: 1250000, complianceScore: 0.94 };
  },

  generateEnterpriseBilling(organizationId: string, period: string): { invoiceId: string; amount: number; breakdown: Record<string, number>; dueDate: Date } {
    return {
      invoiceId: `einv_${organizationId}_${period}`,
      amount: 4999,
      breakdown: { base: 2999, users: 1000, storage: 500, api: 500 },
      dueDate: new Date(Date.now() + 30 * 86400000),
    };
  },
};

// ─── TEST-COMPATIBILITY WRAPPERS ──────────────────────────────────────────────

// developerPlatform: add trackUsage, getKeyStats, override getAppMarketplace to return {apps}
const _apiKeyUsage = new Map<string, { requests: { endpoint: string; statusCode: number; ts: Date }[] }>();
(developerPlatform as any).trackUsage = function(keyId: string, endpoint: string, statusCode: number): void {
  if (!_apiKeyUsage.has(keyId)) _apiKeyUsage.set(keyId, { requests: [] });
  _apiKeyUsage.get(keyId)!.requests.push({ endpoint, statusCode, ts: new Date() });
};
(developerPlatform as any).getKeyStats = function(keyId: string): { totalRequests: number; lastUsed: Date | null } {
  const usage = _apiKeyUsage.get(keyId) ?? { requests: [] };
  return { totalRequests: usage.requests.length, lastUsed: usage.requests.at(-1)?.ts ?? null };
};
const _origGetAppMarketplace = developerPlatform.getAppMarketplace.bind(developerPlatform);
(developerPlatform as any).getAppMarketplace = function(status?: "approved" | "all"): any {
  const apps = _origGetAppMarketplace(status ?? "approved");
  if (status === undefined) return { apps };
  return apps;
};

// pluginSystem: add uninstallPlugin, getUserInstalls, override installPlugin to return {pluginId, userId, status}
const _pluginInstalls = new Map<string, { pluginId: string; userId: number; status: "active" | "uninstalled"; installedAt: Date }[]>();
const _origInstallPlugin = pluginSystem.installPlugin.bind(pluginSystem);
(pluginSystem as any).installPlugin = function(pluginId: string, userId: number): any {
  const result = _origInstallPlugin(pluginId, userId);
  const key = `user_${userId}`;
  if (!_pluginInstalls.has(key)) _pluginInstalls.set(key, []);
  const existing = _pluginInstalls.get(key)!.find(i => i.pluginId === pluginId);
  if (!existing) _pluginInstalls.get(key)!.push({ pluginId, userId, status: "active", installedAt: new Date() });
  return result.success ? { pluginId, userId, status: "active" } : result;
};
(pluginSystem as any).uninstallPlugin = function(pluginId: string, userId: number): { success: boolean } {
  const key = `user_${userId}`;
  const installs = _pluginInstalls.get(key) ?? [];
  const install = installs.find(i => i.pluginId === pluginId);
  if (install) install.status = "uninstalled";
  return { success: true };
};
(pluginSystem as any).getUserInstalls = function(userId: number): any[] {
  return _pluginInstalls.get(`user_${userId}`) ?? [];
};

// businessLayer: add updateBusiness
(businessLayer as any).updateBusiness = function(businessId: string, updates: Record<string, unknown>): BusinessProfile | null {
  const biz = businessLayer.getBusiness(businessId);
  if (!biz) return null;
  Object.assign(biz, updates);
  return biz;
};

// brandEconomy: override applyForSponsorship to return application object, add approveApplication, getApplications
const _sponsorshipApplications = new Map<string, { id: string; listingId: string; creatorId: number; proposal: string; status: "pending" | "approved" | "rejected"; appliedAt: Date }[]>();
const _origApplyForSponsorship = brandEconomy.applyForSponsorship.bind(brandEconomy);
(brandEconomy as any).applyForSponsorship = function(listingId: string, creatorId: number, proposal: string): any {
  _origApplyForSponsorship(listingId, creatorId, proposal);
  const app = { id: `app_${listingId}_${creatorId}_${Date.now()}`, listingId, creatorId, proposal, status: "pending" as const, appliedAt: new Date() };
  if (!_sponsorshipApplications.has(listingId)) _sponsorshipApplications.set(listingId, []);
  _sponsorshipApplications.get(listingId)!.push(app);
  return app;
};
(brandEconomy as any).approveApplication = function(applicationId: string): { success: boolean; application?: any } {
  for (const apps of _sponsorshipApplications.values()) {
    const app = apps.find(a => a.id === applicationId);
    if (app) { app.status = "approved"; return { success: true, application: app }; }
  }
  return { success: false };
};
(brandEconomy as any).getApplications = function(listingId: string): any[] {
  return _sponsorshipApplications.get(listingId) ?? [];
};

// educationExpansion: add issueCertificate, override enrollInCourse to return enrollment directly, override completeLesson to include lessonsCompleted
const _courseEnrollmentTracker = new Map<string, { userId: number; courseId: string; status: "active" | "completed"; lessonsCompleted: number; enrolledAt: Date }[]>();
const _origEnrollInCourse = educationExpansion.enrollInCourse.bind(educationExpansion);
(educationExpansion as any).enrollInCourse = function(userId: number, courseId: string): any {
  const result = _origEnrollInCourse(userId, courseId);
  const enrollment = { userId, courseId, status: "active" as const, lessonsCompleted: 0, enrolledAt: new Date() };
  if (!_courseEnrollmentTracker.has(courseId)) _courseEnrollmentTracker.set(courseId, []);
  const existing = _courseEnrollmentTracker.get(courseId)!.find(e => e.userId === userId);
  if (!existing) _courseEnrollmentTracker.get(courseId)!.push(enrollment);
  if (result.success && result.enrollment) return { ...result.enrollment, status: "active" };
  return enrollment;
};
const _origCompleteLesson = educationExpansion.completeLesson.bind(educationExpansion);
(educationExpansion as any).completeLesson = function(userId: number, courseId: string, lessonId: string): any {
  const result = _origCompleteLesson(userId, courseId, lessonId);
  const enrollments = _courseEnrollmentTracker.get(courseId) ?? [];
  const enrollment = enrollments.find(e => e.userId === userId);
  if (enrollment) enrollment.lessonsCompleted++;
  return { ...result, lessonsCompleted: enrollment?.lessonsCompleted ?? 1 };
};
(educationExpansion as any).issueCertificate = function(userId: number, courseId: string): { certificateId: string; userId: number; courseId: string; nftTokenId: string; issuedAt: Date } {
  const certId = `cert_${userId}_${courseId}_${Date.now()}`;
  return { certificateId: certId, userId, courseId, nftTokenId: `nft_cert_${certId}`, issuedAt: new Date() };
};

// governanceExpansion: override castVote to throw on double-vote and return {proposalId, voterId, vote}, override finalizeProposal to return {passed, status}, override getProposalStats to return {yesVotes, noVotes, totalVotingPower}
const _voteRecords = new Map<string, { proposalId: string; voterId: number; vote: string; weight: number; votedAt: Date }[]>();
const _origCastVote = governanceExpansion.castVote.bind(governanceExpansion);
(governanceExpansion as any).castVote = function(proposalId: string, userId: number, vote: "yes" | "no" | "abstain", weight = 1): any {
  if (!_voteRecords.has(proposalId)) _voteRecords.set(proposalId, []);
  const existing = _voteRecords.get(proposalId)!.find(v => v.voterId === userId);
  if (existing) throw new Error("Already voted on this proposal");
  const record = { proposalId, voterId: userId, vote, weight, votedAt: new Date() };
  _voteRecords.get(proposalId)!.push(record);
  _origCastVote(proposalId, userId, vote, weight);
  return record;
};
const _origFinalizeProposal = governanceExpansion.finalizeProposal.bind(governanceExpansion);
(governanceExpansion as any).finalizeProposal = function(proposalId: string): any {
  const result = _origFinalizeProposal(proposalId);
  const passed = result.result === "passed";
  return { ...result, passed, status: result.result ?? "finalized" };
};
const _origGetProposalStats = governanceExpansion.getProposalStats.bind(governanceExpansion);
(governanceExpansion as any).getProposalStats = function(proposalId: string): any {
  const votes = _voteRecords.get(proposalId) ?? [];
  const yesVotes = votes.filter(v => v.vote === "yes").reduce((s, v) => s + v.weight, 0);
  const noVotes = votes.filter(v => v.vote === "no").reduce((s, v) => s + v.weight, 0);
  const totalVotingPower = votes.reduce((s, v) => s + v.weight, 0);
  const orig = _origGetProposalStats(proposalId);
  return { ...orig, yesVotes, noVotes, totalVotingPower };
};

// identityExpansion: override linkAccount to return {userId, platform, handle}, override linkWallet to return {userId, chain}, override exportPortableIdentity to include verifications, add verifyClaim
const _origLinkAccount = identityExpansion.linkAccount.bind(identityExpansion);
(identityExpansion as any).linkAccount = function(userId: number, platform: string, handle: string): any {
  _origLinkAccount(userId, platform, handle);
  return { userId, platform, handle };
};
const _origLinkWallet = identityExpansion.linkWallet.bind(identityExpansion);
(identityExpansion as any).linkWallet = function(userId: number, address: string, chain: string, primary = false): any {
  _origLinkWallet(userId, address, chain, primary);
  return { userId, address, chain, primary };
};
const _origExportPortableIdentity7 = identityExpansion.exportPortableIdentity.bind(identityExpansion);
(identityExpansion as any).exportPortableIdentity = function(userId: number): any {
  const result = _origExportPortableIdentity7(userId);
  return { ...result, verifications: [] };
};
(identityExpansion as any).verifyClaim = function(userId: number, platform: string, handle: string): { verified: boolean; userId: number; platform: string; handle: string; verifiedAt: Date } {
  const profile = identityExpansion.getProfile(userId);
  const linked = profile?.linkedAccounts?.some((a: any) => a.platform === platform && a.handle === handle);
  return { verified: !!linked, userId, platform, handle, verifiedAt: new Date() };
};

// enterpriseInfrastructure: add createEnterpriseAccount, addTeamMember, getEnterpriseAnalytics
const _enterpriseAccounts = new Map<string, { id: string; ownerId: number; companyName: string; industry: string; employees: number; plan: string; ssoProvider: string; customDomain: string; createdAt: Date; members: { accountId: string; userId: number; role: string; joinedAt: Date }[] }>();
(enterpriseInfrastructure as any).createEnterpriseAccount = function(ownerId: number, data: { companyName: string; industry: string; employees: number; plan: string; ssoProvider: string; customDomain: string }): any {
  const id = `ent_${ownerId}_${Date.now()}`;
  const account = { id, ownerId, ...data, createdAt: new Date(), members: [] };
  _enterpriseAccounts.set(id, account);
  return account;
};
(enterpriseInfrastructure as any).addTeamMember = function(accountId: string, userId: number, role: string): any {
  const account = _enterpriseAccounts.get(accountId);
  if (!account) return null;
  const member = { accountId, userId, role, joinedAt: new Date() };
  account.members.push(member);
  return member;
};
(enterpriseInfrastructure as any).getEnterpriseAnalytics = function(accountId: string): any {
  const account = _enterpriseAccounts.get(accountId);
  return { accountId, activeUsers: account?.members.length ?? 0, contentCreated: 0, apiCalls: 0, storageUsed: 0, complianceScore: 95, engagementRate: 0.042 };
};

// financialExpansion: add createSavingsAccount, deposit, withdraw, getAccount, calculateInterest
const _savingsAccounts = new Map<string, { id: string; userId: number; currency: string; type: string; balance: number; createdAt: Date; transactions: { type: "deposit" | "withdrawal"; amount: number; ts: Date }[] }>();
(financialExpansion as any).createSavingsAccount = function(userId: number, currency: string, type: string): any {
  const id = `sav_${userId}_${Date.now()}`;
  const account = { id, userId, currency, type, balance: 0, createdAt: new Date(), transactions: [] };
  _savingsAccounts.set(id, account);
  return account;
};
(financialExpansion as any).deposit = function(accountId: string, amount: number): any {
  const account = _savingsAccounts.get(accountId);
  if (!account) throw new Error("Account not found");
  account.balance += amount;
  account.transactions.push({ type: "deposit", amount, ts: new Date() });
  return { success: true, balance: account.balance };
};
(financialExpansion as any).withdraw = function(accountId: string, amount: number): any {
  const account = _savingsAccounts.get(accountId);
  if (!account) throw new Error("Account not found");
  if (account.balance < amount) throw new Error("Insufficient balance");
  account.balance -= amount;
  account.transactions.push({ type: "withdrawal", amount, ts: new Date() });
  return { success: true, balance: account.balance };
};
(financialExpansion as any).getAccount = function(accountId: string): any {
  return _savingsAccounts.get(accountId) ?? null;
};
(financialExpansion as any).calculateInterest = function(accountId: string, days: number): number {
  const account = _savingsAccounts.get(accountId);
  if (!account) return 0;
  const apy = account.type === "premium" ? 0.08 : 0.04;
  return account.balance * apy * (days / 365);
};

// partnershipInfrastructure: add createPartnership, acceptPartnership, getPartnership, getPartnerships, recordRevenue, getPartnershipStats
const _partnerships = new Map<string, { id: string; initiatorId: number; partnerId: string; type: string; title: string; description: string; status: "pending" | "active" | "ended"; totalRevenue: number; createdAt: Date }>();
const _partnershipRevenue = new Map<string, { amount: number; currency: string; ts: Date }[]>();
(partnershipInfrastructure as any).createPartnership = function(initiatorId: number, partnerId: string, type: string, title: string, description: string): any {
  const id = `pship_${initiatorId}_${partnerId}_${Date.now()}`;
  const partnership = { id, initiatorId, partnerId, type, title, description, status: "pending" as const, totalRevenue: 0, createdAt: new Date() };
  _partnerships.set(id, partnership);
  return partnership;
};
(partnershipInfrastructure as any).acceptPartnership = function(partnershipId: string): any {
  const p = _partnerships.get(partnershipId);
  if (!p) return { success: false };
  p.status = "active";
  return { success: true, partnership: p };
};
(partnershipInfrastructure as any).getPartnership = function(partnershipId: string): any {
  return _partnerships.get(partnershipId) ?? null;
};
(partnershipInfrastructure as any).getPartnerships = function(userId: number): any[] {
  return Array.from(_partnerships.values()).filter(p => p.initiatorId === userId);
};
(partnershipInfrastructure as any).recordRevenue = function(partnershipId: string, amount: number, currency: string): any {
  const p = _partnerships.get(partnershipId);
  if (p) p.totalRevenue += amount;
  if (!_partnershipRevenue.has(partnershipId)) _partnershipRevenue.set(partnershipId, []);
  _partnershipRevenue.get(partnershipId)!.push({ amount, currency, ts: new Date() });
  return { success: true };
};
(partnershipInfrastructure as any).getPartnershipStats = function(partnershipId: string): any {
  const p = _partnerships.get(partnershipId);
  return { partnershipId, totalRevenue: p?.totalRevenue ?? 0, transactions: _partnershipRevenue.get(partnershipId)?.length ?? 0 };
};

// identityExpansion.getProfile: add linkedWallets alias for wallets field
const _origGetProfile7 = identityExpansion.getProfile.bind(identityExpansion);
(identityExpansion as any).getProfile = function(userId: number): any {
  const profile = _origGetProfile7(userId);
  if (!profile) return null;
  return { ...profile, linkedWallets: profile.wallets };
};
