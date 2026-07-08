/**
 * CREATOR MARKETPLACE ENGINE
 *
 * Creator-to-creator economy systems.
 *
 * Systems:
 * - CreatorHiringBoardService: Job postings for editors, designers, mods, and other creator roles
 * - ServiceListingService: Creator service offerings with packages and portfolios
 * - ServiceEscrowService: Milestone-based escrow for creator service contracts
 * - SponsorshipBoardService: Brand campaign offers and creator applications
 * - CreatorContractService: Digital contracts with e-signature and dispute resolution
 * - AffiliateProgramService: Creator affiliate links, commissions, and tracking
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface HiringPost {
  id: string;
  posterId: number;
  title: string;
  description: string;
  role: "editor" | "designer" | "moderator" | "thumbnail_artist" | "social_manager" | "writer" | "developer" | "other";
  skills: string[];
  budget: { min: number; max: number; currency: "coins" | "usd"; type: "fixed" | "hourly" | "monthly" };
  duration: "one_time" | "part_time" | "full_time";
  remote: boolean;
  applicationDeadline: Date;
  status: "open" | "in_review" | "filled" | "cancelled";
  applicants: number;
  views: number;
  createdAt: Date;
  tags: string[];
}

export interface JobApplication {
  id: string;
  postId: string;
  applicantId: number;
  coverLetter: string;
  proposedRate: number;
  portfolioLinks: string[];
  estimatedDelivery?: string;
  status: "submitted" | "shortlisted" | "interviewing" | "accepted" | "rejected";
  submittedAt: Date;
  respondedAt?: Date;
}

export interface ServiceListing {
  id: string;
  sellerId: number;
  title: string;
  description: string;
  category: "video_editing" | "graphic_design" | "thumbnail_creation" | "community_management" | "content_writing" | "social_media" | "music_production" | "voice_over" | "animation" | "coding" | "consulting" | "other";
  packages: ServicePackage[];
  portfolio: { title: string; url: string; type: "image" | "video" | "link" }[];
  rating: number;
  reviewCount: number;
  completedOrders: number;
  responseTime: string; // e.g., "within 24 hours"
  languages: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  tags: string[];
}

export interface ServicePackage {
  id: string;
  name: "basic" | "standard" | "premium";
  title: string;
  description: string;
  price: number; // in coins
  deliveryDays: number;
  revisions: number;
  features: string[];
}

export interface ServiceOrder {
  id: string;
  listingId: string;
  packageId: string;
  buyerId: number;
  sellerId: number;
  requirements: string;
  status: "pending" | "accepted" | "in_progress" | "delivered" | "revision_requested" | "completed" | "cancelled" | "disputed";
  milestones: OrderMilestone[];
  totalPrice: number;
  escrowId?: string;
  deliveryDeadline: Date;
  createdAt: Date;
  completedAt?: Date;
  cancellationReason?: string;
}

export interface OrderMilestone {
  id: string;
  title: string;
  description: string;
  percentage: number; // % of total price released on completion
  status: "pending" | "in_progress" | "submitted" | "approved" | "rejected";
  dueDate: Date;
  completedAt?: Date;
  deliverables?: string[];
}

export interface ServiceEscrow {
  id: string;
  orderId: string;
  buyerId: number;
  sellerId: number;
  totalAmount: number;
  heldAmount: number;
  releasedAmount: number;
  refundedAmount: number;
  status: "active" | "completed" | "disputed" | "refunded";
  milestoneReleases: { milestoneId: string; amount: number; releasedAt: Date }[];
  disputeId?: string;
  createdAt: Date;
}

export interface ServiceDispute {
  id: string;
  escrowId: string;
  orderId: string;
  initiatorId: number;
  respondentId: number;
  reason: string;
  evidence: { type: "text" | "image" | "link"; content: string; submittedBy: number; timestamp: Date }[];
  status: "open" | "under_review" | "resolved_buyer" | "resolved_seller" | "resolved_split";
  resolution?: { buyerRefund: number; sellerPayout: number; reason: string };
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ServiceReview {
  id: string;
  orderId: string;
  reviewerId: number;
  sellerId: number;
  rating: number; // 1-5
  title: string;
  content: string;
  categories: { communication: number; quality: number; delivery: number; value: number };
  sellerResponse?: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface SponsorshipCampaign {
  id: string;
  brandId: number;
  brandName: string;
  title: string;
  description: string;
  objectives: string[];
  budget: number;
  budgetSpent: number;
  targetAudience: { ageRange?: string; interests: string[]; regions: string[] };
  requirements: {
    minFollowers: number;
    minEngagementRate: number;
    contentTypes: string[];
    platforms: string[];
    exclusivity?: string;
  };
  deliverables: { type: string; quantity: number; deadline: Date }[];
  compensation: { type: "fixed" | "per_post" | "revenue_share"; amount: number };
  applicationDeadline: Date;
  campaignStart: Date;
  campaignEnd: Date;
  status: "draft" | "open" | "in_progress" | "completed" | "cancelled";
  selectedCreators: number[];
  applicantCount: number;
  createdAt: Date;
}

export interface CampaignApplication {
  id: string;
  campaignId: string;
  creatorId: number;
  pitch: string;
  proposedContent: string;
  audienceStats: { followers: number; avgViews: number; engagementRate: number };
  status: "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn";
  submittedAt: Date;
  aiMatchScore: number;
}

export interface AffiliateProgram {
  id: string;
  creatorId: number;
  productId: string;
  productType: "listing" | "subscription" | "nft" | "service";
  commissionRate: number; // percentage
  cookieDurationDays: number;
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  isActive: boolean;
  createdAt: Date;
}

export interface AffiliateClick {
  affiliateId: string;
  clickerId?: number;
  ip: string;
  userAgent: string;
  timestamp: Date;
  converted: boolean;
  conversionValue?: number;
  commissionEarned?: number;
}

// ─── CREATOR HIRING BOARD SERVICE ────────────────────────────────────────────

export class CreatorHiringBoardService {
  private posts = new Map<string, HiringPost>();
  private applications = new Map<string, JobApplication[]>(); // postId -> applications
  private postCounter = 0;
  private appCounter = 0;

  async createPost(params: Omit<HiringPost, "id" | "applicants" | "views" | "createdAt">): Promise<HiringPost> {
    const id = `job_${++this.postCounter}`;
    const post: HiringPost = {
      id,
      ...params,
      applicants: 0,
      views: 0,
      createdAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async applyForJob(params: {
    postId: string;
    applicantId: number;
    coverLetter: string;
    proposedRate: number;
    portfolioLinks: string[];
    estimatedDelivery?: string;
  }): Promise<JobApplication> {
    const post = this.posts.get(params.postId);
    if (!post || post.status !== "open") throw new Error("Job not available");
    if (new Date() > post.applicationDeadline) throw new Error("Application deadline passed");

    const id = `app_${++this.appCounter}`;
    const application: JobApplication = {
      id,
      postId: params.postId,
      applicantId: params.applicantId,
      coverLetter: params.coverLetter,
      proposedRate: params.proposedRate,
      portfolioLinks: params.portfolioLinks,
      estimatedDelivery: params.estimatedDelivery,
      status: "submitted",
      submittedAt: new Date(),
    };

    const appList = this.applications.get(params.postId) || [];
    appList.push(application);
    this.applications.set(params.postId, appList);
    post.applicants++;

    return application;
  }

  async updateApplicationStatus(applicationId: string, posterId: number, status: JobApplication["status"]): Promise<JobApplication | null> {
    for (const [postId, apps] of this.applications) {
      const post = this.posts.get(postId);
      if (post?.posterId !== posterId) continue;

      const app = apps.find(a => a.id === applicationId);
      if (app) {
        app.status = status;
        app.respondedAt = new Date();
        if (status === "accepted") {
          post.status = "filled";
        }
        return app;
      }
    }
    return null;
  }

  async searchPosts(filters: {
    role?: HiringPost["role"];
    minBudget?: number;
    maxBudget?: number;
    duration?: HiringPost["duration"];
    skills?: string[];
    remote?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<HiringPost[]> {
    let results = Array.from(this.posts.values())
      .filter(p => p.status === "open" && new Date() <= p.applicationDeadline);

    if (filters.role) results = results.filter(p => p.role === filters.role);
    if (filters.duration) results = results.filter(p => p.duration === filters.duration);
    if (filters.remote !== undefined) results = results.filter(p => p.remote === filters.remote);
    if (filters.minBudget) results = results.filter(p => p.budget.max >= filters.minBudget!);
    if (filters.maxBudget) results = results.filter(p => p.budget.min <= filters.maxBudget!);
    if (filters.skills?.length) {
      results = results.filter(p => filters.skills!.some(s => p.skills.includes(s)));
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const offset = filters.offset || 0;
    const limit = filters.limit || 20;
    return results.slice(offset, offset + limit);
  }

  recordView(postId: string): void {
    const post = this.posts.get(postId);
    if (post) post.views++;
  }

  getPost(postId: string): HiringPost | null {
    return this.posts.get(postId) || null;
  }

  getApplications(postId: string): JobApplication[] {
    return this.applications.get(postId) || [];
  }

  getUserPosts(userId: number): HiringPost[] {
    return Array.from(this.posts.values())
      .filter(p => p.posterId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

// ─── SERVICE LISTING SERVICE ──────────────────────────────────────────────────

export class ServiceListingService {
  private listings = new Map<string, ServiceListing>();
  private orders = new Map<string, ServiceOrder>();
  private reviews = new Map<string, ServiceReview[]>(); // listingId -> reviews
  private listingCounter = 0;
  private orderCounter = 0;
  private reviewCounter = 0;

  async createListing(params: Omit<ServiceListing, "id" | "rating" | "reviewCount" | "completedOrders" | "createdAt">): Promise<ServiceListing> {
    const id = `svc_${++this.listingCounter}`;
    const listing: ServiceListing = {
      id,
      ...params,
      rating: 0,
      reviewCount: 0,
      completedOrders: 0,
      createdAt: new Date(),
    };
    this.listings.set(id, listing);
    return listing;
  }

  async placeOrder(params: {
    listingId: string;
    packageId: string;
    buyerId: number;
    requirements: string;
  }): Promise<ServiceOrder> {
    const listing = this.listings.get(params.listingId);
    if (!listing || !listing.isActive) throw new Error("Service not available");

    const pkg = listing.packages.find(p => p.id === params.packageId);
    if (!pkg) throw new Error("Package not found");

    const id = `order_${++this.orderCounter}`;
    const deliveryDeadline = new Date(Date.now() + pkg.deliveryDays * 86400000);

    const order: ServiceOrder = {
      id,
      listingId: params.listingId,
      packageId: params.packageId,
      buyerId: params.buyerId,
      sellerId: listing.sellerId,
      requirements: params.requirements,
      status: "pending",
      milestones: [
        {
          id: `ms_1`,
          title: "Work in Progress",
          description: "Seller is working on your order",
          percentage: 0,
          status: "pending",
          dueDate: new Date(Date.now() + pkg.deliveryDays * 86400000 * 0.5),
        },
        {
          id: `ms_2`,
          title: "Final Delivery",
          description: "Seller delivers the completed work",
          percentage: 100,
          status: "pending",
          dueDate: deliveryDeadline,
        },
      ],
      totalPrice: pkg.price,
      deliveryDeadline,
      createdAt: new Date(),
    };

    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(orderId: string, userId: number, status: ServiceOrder["status"], note?: string): Promise<ServiceOrder | null> {
    const order = this.orders.get(orderId);
    if (!order) return null;
    if (order.buyerId !== userId && order.sellerId !== userId) return null;

    order.status = status;
    if (status === "completed") {
      order.completedAt = new Date();
      const listing = this.listings.get(order.listingId);
      if (listing) listing.completedOrders++;
    }
    if (note) order.cancellationReason = note;

    return order;
  }

  async submitReview(params: {
    orderId: string;
    reviewerId: number;
    rating: number;
    title: string;
    content: string;
    categories: ServiceReview["categories"];
  }): Promise<ServiceReview> {
    const order = this.orders.get(params.orderId);
    if (!order || order.status !== "completed") throw new Error("Can only review completed orders");
    if (order.buyerId !== params.reviewerId) throw new Error("Only buyer can review");

    const id = `rev_${++this.reviewCounter}`;
    const review: ServiceReview = {
      id,
      orderId: params.orderId,
      reviewerId: params.reviewerId,
      sellerId: order.sellerId,
      rating: Math.min(5, Math.max(1, params.rating)),
      title: params.title,
      content: params.content,
      categories: params.categories,
      isVerified: true,
      createdAt: new Date(),
    };

    const reviewList = this.reviews.get(order.listingId) || [];
    reviewList.push(review);
    this.reviews.set(order.listingId, reviewList);

    // Update listing rating
    const listing = this.listings.get(order.listingId);
    if (listing) {
      const allRatings = reviewList.map(r => r.rating);
      listing.rating = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
      listing.reviewCount = reviewList.length;
    }

    return review;
  }

  async searchListings(filters: {
    category?: ServiceListing["category"];
    maxPrice?: number;
    minRating?: number;
    deliveryDays?: number;
    limit?: number;
    offset?: number;
    sortBy?: "rating" | "price_asc" | "price_desc" | "newest" | "most_orders";
  }): Promise<ServiceListing[]> {
    let results = Array.from(this.listings.values()).filter(l => l.isActive);

    if (filters.category) results = results.filter(l => l.category === filters.category);
    if (filters.minRating) results = results.filter(l => l.rating >= filters.minRating!);
    if (filters.maxPrice) {
      results = results.filter(l => l.packages.some(p => p.price <= filters.maxPrice!));
    }
    if (filters.deliveryDays) {
      results = results.filter(l => l.packages.some(p => p.deliveryDays <= filters.deliveryDays!));
    }

    switch (filters.sortBy) {
      case "rating": results.sort((a, b) => b.rating - a.rating); break;
      case "price_asc": results.sort((a, b) => Math.min(...a.packages.map(p => p.price)) - Math.min(...b.packages.map(p => p.price))); break;
      case "price_desc": results.sort((a, b) => Math.min(...b.packages.map(p => p.price)) - Math.min(...a.packages.map(p => p.price))); break;
      case "most_orders": results.sort((a, b) => b.completedOrders - a.completedOrders); break;
      default: results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const offset = filters.offset || 0;
    const limit = filters.limit || 20;
    return results.slice(offset, offset + limit);
  }

  getListing(listingId: string): ServiceListing | null {
    return this.listings.get(listingId) || null;
  }

  getOrder(orderId: string): ServiceOrder | null {
    return this.orders.get(orderId) || null;
  }

  getListingReviews(listingId: string): ServiceReview[] {
    return (this.reviews.get(listingId) || []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getUserOrders(userId: number, role: "buyer" | "seller"): ServiceOrder[] {
    return Array.from(this.orders.values())
      .filter(o => role === "buyer" ? o.buyerId === userId : o.sellerId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

// ─── SERVICE ESCROW SERVICE ───────────────────────────────────────────────────

export class ServiceEscrowService {
  private escrows = new Map<string, ServiceEscrow>();
  private disputes = new Map<string, ServiceDispute>();
  private escrowCounter = 0;
  private disputeCounter = 0;

  async createEscrow(orderId: string, buyerId: number, sellerId: number, totalAmount: number): Promise<ServiceEscrow> {
    const id = `esc_${++this.escrowCounter}`;
    const escrow: ServiceEscrow = {
      id,
      orderId,
      buyerId,
      sellerId,
      totalAmount,
      heldAmount: totalAmount,
      releasedAmount: 0,
      refundedAmount: 0,
      status: "active",
      milestoneReleases: [],
      createdAt: new Date(),
    };
    this.escrows.set(id, escrow);
    return escrow;
  }

  async releaseMilestonePayment(escrowId: string, milestoneId: string, percentage: number): Promise<{ released: number; remaining: number }> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow || escrow.status !== "active") throw new Error("Escrow not active");

    const amount = Math.floor(escrow.totalAmount * (percentage / 100));
    if (amount > escrow.heldAmount) throw new Error("Insufficient held amount");

    escrow.heldAmount -= amount;
    escrow.releasedAmount += amount;
    escrow.milestoneReleases.push({ milestoneId, amount, releasedAt: new Date() });

    if (escrow.heldAmount === 0) {
      escrow.status = "completed";
    }

    return { released: amount, remaining: escrow.heldAmount };
  }

  async refundBuyer(escrowId: string, amount?: number): Promise<number> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow || escrow.status === "completed") throw new Error("Cannot refund");

    const refundAmount = amount || escrow.heldAmount;
    if (refundAmount > escrow.heldAmount) throw new Error("Refund exceeds held amount");

    escrow.heldAmount -= refundAmount;
    escrow.refundedAmount += refundAmount;

    if (escrow.heldAmount === 0) {
      escrow.status = "refunded";
    }

    return refundAmount;
  }

  async openDispute(params: {
    escrowId: string;
    initiatorId: number;
    reason: string;
    evidence: string;
  }): Promise<ServiceDispute> {
    const escrow = this.escrows.get(params.escrowId);
    if (!escrow || escrow.status !== "active") throw new Error("Cannot dispute");

    escrow.status = "disputed";

    const id = `disp_${++this.disputeCounter}`;
    const dispute: ServiceDispute = {
      id,
      escrowId: params.escrowId,
      orderId: escrow.orderId,
      initiatorId: params.initiatorId,
      respondentId: params.initiatorId === escrow.buyerId ? escrow.sellerId : escrow.buyerId,
      reason: params.reason,
      evidence: [{
        type: "text",
        content: params.evidence,
        submittedBy: params.initiatorId,
        timestamp: new Date(),
      }],
      status: "open",
      createdAt: new Date(),
    };

    this.disputes.set(id, dispute);
    escrow.disputeId = id;
    return dispute;
  }

  async resolveDispute(disputeId: string, resolution: ServiceDispute["resolution"]): Promise<ServiceDispute | null> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute || dispute.status !== "open") return null;

    const escrow = this.escrows.get(dispute.escrowId);
    if (!escrow) return null;

    if (resolution) {
      dispute.resolution = resolution;
      if (resolution.buyerRefund > 0) {
        escrow.refundedAmount += resolution.buyerRefund;
      }
      if (resolution.sellerPayout > 0) {
        escrow.releasedAmount += resolution.sellerPayout;
      }
      escrow.heldAmount = 0;
      escrow.status = "completed";
    }

    dispute.status = resolution
      ? (resolution.buyerRefund > resolution.sellerPayout ? "resolved_buyer" : "resolved_seller")
      : "resolved_split";
    dispute.resolvedAt = new Date();

    return dispute;
  }

  getEscrow(escrowId: string): ServiceEscrow | null {
    return this.escrows.get(escrowId) || null;
  }

  getEscrowByOrder(orderId: string): ServiceEscrow | null {
    return Array.from(this.escrows.values()).find(e => e.orderId === orderId) || null;
  }

  getDispute(disputeId: string): ServiceDispute | null {
    return this.disputes.get(disputeId) || null;
  }

  getOpenDisputes(): ServiceDispute[] {
    return Array.from(this.disputes.values())
      .filter(d => d.status === "open" || d.status === "under_review")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

// ─── SPONSORSHIP BOARD SERVICE ────────────────────────────────────────────────

export class SponsorshipBoardService {
  private campaigns = new Map<string, SponsorshipCampaign>();
  private applications = new Map<string, CampaignApplication[]>(); // campaignId -> applications
  private campaignCounter = 0;
  private appCounter = 0;

  async createCampaign(params: Omit<SponsorshipCampaign, "id" | "budgetSpent" | "selectedCreators" | "applicantCount" | "createdAt">): Promise<SponsorshipCampaign> {
    const id = `camp_${++this.campaignCounter}`;
    const campaign: SponsorshipCampaign = {
      id,
      ...params,
      budgetSpent: 0,
      selectedCreators: [],
      applicantCount: 0,
      createdAt: new Date(),
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async applyForCampaign(params: {
    campaignId: string;
    creatorId: number;
    pitch: string;
    proposedContent: string;
    audienceStats: CampaignApplication["audienceStats"];
  }): Promise<CampaignApplication> {
    const campaign = this.campaigns.get(params.campaignId);
    if (!campaign || campaign.status !== "open") throw new Error("Campaign not available");
    if (new Date() > campaign.applicationDeadline) throw new Error("Application deadline passed");

    // Calculate AI match score
    let aiMatchScore = 0;
    if (params.audienceStats.followers >= campaign.requirements.minFollowers) aiMatchScore += 35;
    if (params.audienceStats.engagementRate >= campaign.requirements.minEngagementRate) aiMatchScore += 35;
    if (params.audienceStats.avgViews > params.audienceStats.followers * 0.1) aiMatchScore += 20;
    if (params.pitch.length > 200) aiMatchScore += 10;

    const id = `capp_${++this.appCounter}`;
    const application: CampaignApplication = {
      id,
      campaignId: params.campaignId,
      creatorId: params.creatorId,
      pitch: params.pitch,
      proposedContent: params.proposedContent,
      audienceStats: params.audienceStats,
      status: "submitted",
      submittedAt: new Date(),
      aiMatchScore,
    };

    const appList = this.applications.get(params.campaignId) || [];
    appList.push(application);
    this.applications.set(params.campaignId, appList);
    campaign.applicantCount++;

    return application;
  }

  async selectCreator(campaignId: string, creatorId: number): Promise<SponsorshipCampaign | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;

    if (!campaign.selectedCreators.includes(creatorId)) {
      campaign.selectedCreators.push(creatorId);
    }

    const apps = this.applications.get(campaignId) || [];
    const app = apps.find(a => a.creatorId === creatorId);
    if (app) app.status = "accepted";

    return campaign;
  }

  async getMatchedCampaigns(creatorStats: {
    followers: number;
    engagementRate: number;
    niche: string;
    platforms: string[];
  }): Promise<(SponsorshipCampaign & { matchScore: number })[]> {
    const results = [];
    for (const campaign of this.campaigns.values()) {
      if (campaign.status !== "open") continue;
      if (new Date() > campaign.applicationDeadline) continue;

      let matchScore = 0;
      if (creatorStats.followers >= campaign.requirements.minFollowers) matchScore += 35;
      if (creatorStats.engagementRate >= campaign.requirements.minEngagementRate) matchScore += 35;
      if (campaign.requirements.platforms.some(p => creatorStats.platforms.includes(p))) matchScore += 20;
      if (campaign.targetAudience.interests.some(i => creatorStats.niche.toLowerCase().includes(i.toLowerCase()))) matchScore += 10;

      if (matchScore >= 35) {
        results.push({ ...campaign, matchScore });
      }
    }
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  getCampaign(campaignId: string): SponsorshipCampaign | null {
    return this.campaigns.get(campaignId) || null;
  }

  getCampaigns(status?: SponsorshipCampaign["status"]): SponsorshipCampaign[] {
    return Array.from(this.campaigns.values())
      .filter(c => !status || c.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getCampaignApplications(campaignId: string): CampaignApplication[] {
    return (this.applications.get(campaignId) || [])
      .sort((a, b) => b.aiMatchScore - a.aiMatchScore);
  }
}

// ─── AFFILIATE PROGRAM SERVICE ────────────────────────────────────────────────

export class AffiliateProgramService {
  private programs = new Map<string, AffiliateProgram>();
  private clicks = new Map<string, AffiliateClick[]>(); // affiliateId -> clicks
  private programCounter = 0;

  async createProgram(params: Omit<AffiliateProgram, "id" | "totalClicks" | "totalConversions" | "totalEarned" | "createdAt">): Promise<AffiliateProgram> {
    const id = `aff_${++this.programCounter}`;
    const program: AffiliateProgram = {
      id,
      ...params,
      totalClicks: 0,
      totalConversions: 0,
      totalEarned: 0,
      createdAt: new Date(),
    };
    this.programs.set(id, program);
    return program;
  }

  async recordClick(affiliateId: string, clickData: Omit<AffiliateClick, "converted" | "conversionValue" | "commissionEarned">): Promise<void> {
    const program = this.programs.get(affiliateId);
    if (!program || !program.isActive) return;

    const click: AffiliateClick = { ...clickData, converted: false };
    const clickList = this.clicks.get(affiliateId) || [];
    clickList.push(click);
    this.clicks.set(affiliateId, clickList);
    program.totalClicks++;
  }

  async recordConversion(affiliateId: string, conversionValue: number, clickerIp: string): Promise<number> {
    const program = this.programs.get(affiliateId);
    if (!program) return 0;

    const clickList = this.clicks.get(affiliateId) || [];
    const recentClick = clickList
      .filter(c => c.ip === clickerIp && !c.converted)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (!recentClick) return 0;

    // Check cookie duration
    const cookieExpiry = new Date(recentClick.timestamp.getTime() + program.cookieDurationDays * 86400000);
    if (new Date() > cookieExpiry) return 0;

    const commission = Math.floor(conversionValue * program.commissionRate);
    recentClick.converted = true;
    recentClick.conversionValue = conversionValue;
    recentClick.commissionEarned = commission;

    program.totalConversions++;
    program.totalEarned += commission;

    return commission;
  }

  getProgram(affiliateId: string): AffiliateProgram | null {
    return this.programs.get(affiliateId) || null;
  }

  getCreatorPrograms(creatorId: number): AffiliateProgram[] {
    return Array.from(this.programs.values())
      .filter(p => p.creatorId === creatorId && p.isActive);
  }

  getAffiliateStats(affiliateId: string): { clicks: number; conversions: number; conversionRate: number; totalEarned: number } {
    const program = this.programs.get(affiliateId);
    if (!program) return { clicks: 0, conversions: 0, conversionRate: 0, totalEarned: 0 };

    return {
      clicks: program.totalClicks,
      conversions: program.totalConversions,
      conversionRate: program.totalClicks > 0 ? program.totalConversions / program.totalClicks : 0,
      totalEarned: program.totalEarned,
    };
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const creatorHiringBoard = new CreatorHiringBoardService();
export const serviceListingService = new ServiceListingService();
export const serviceEscrowService = new ServiceEscrowService();
export const sponsorshipBoardService = new SponsorshipBoardService();
export const affiliateProgramService = new AffiliateProgramService();
