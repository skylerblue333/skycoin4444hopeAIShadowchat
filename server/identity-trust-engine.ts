/**
 * IDENTITY & TRUST ENGINE
 *
 * Platform-wide trust infrastructure.
 *
 * Systems:
 * - IdentityVerificationService: KYC tiers, document verification, biometric checks
 * - WalletReputationService: On-chain behavior scoring, wallet age, transaction history
 * - TrustScoreService: Composite trust scores for creators, vendors, donors, traders
 * - FraudFlagService: Behavioral fraud detection, flag management, appeals
 * - CrossPlatformIdentityService: Social account linking, verification badges
 * - SybilDetectionService: Multi-account detection, bot detection, collusion detection
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type VerificationTier = "none" | "email" | "phone" | "id_document" | "biometric" | "enterprise";

export interface IdentityProfile {
  userId: number;
  tier: VerificationTier;
  email: { verified: boolean; verifiedAt?: Date };
  phone: { verified: boolean; verifiedAt?: Date; countryCode?: string };
  document: { verified: boolean; type?: "passport" | "drivers_license" | "national_id"; country?: string; verifiedAt?: Date };
  biometric: { verified: boolean; verifiedAt?: Date };
  linkedAccounts: LinkedAccount[];
  trustScore: number; // 0-1000
  riskLevel: "low" | "medium" | "high" | "critical";
  flags: string[];
  createdAt: Date;
  lastVerifiedAt?: Date;
}

export interface LinkedAccount {
  platform: "twitter" | "youtube" | "twitch" | "instagram" | "github" | "discord" | "tiktok";
  platformUserId: string;
  username: string;
  followerCount: number;
  isVerifiedOnPlatform: boolean;
  linkedAt: Date;
  verificationProof: string;
}

export interface WalletReputation {
  walletAddress: string;
  userId?: number;
  chainId: number;
  score: number; // 0-1000
  tier: "unknown" | "new" | "established" | "trusted" | "whale" | "institution";
  ageInDays: number;
  transactionCount: number;
  totalVolumeUSD: number;
  uniqueContractsInteracted: number;
  defiProtocolsUsed: string[];
  nftCollectionsHeld: number;
  isContractWallet: boolean;
  hasBeenFlagged: boolean;
  flagReasons: string[];
  lastActivityAt: Date;
  firstSeenAt: Date;
}

export interface TrustScore {
  userId: number;
  composite: number; // 0-1000 weighted average
  breakdown: {
    identity: number;
    wallet: number;
    social: number;
    behavioral: number;
    community: number;
    financial: number;
  };
  tier: "untrusted" | "basic" | "trusted" | "verified" | "elite" | "institution";
  badges: TrustBadge[];
  lastCalculatedAt: Date;
  trend: "improving" | "stable" | "declining";
}

export interface TrustBadge {
  id: string;
  name: string;
  description: string;
  category: "identity" | "creator" | "trader" | "donor" | "community" | "security";
  earnedAt: Date;
  expiresAt?: Date;
  isRevocable: boolean;
}

export interface FraudFlag {
  id: string;
  userId: number;
  type: "spam" | "fake_engagement" | "wash_trading" | "multi_account" | "phishing" | "impersonation" | "payment_fraud" | "bot_behavior" | "collusion";
  severity: "low" | "medium" | "high" | "critical";
  evidence: FraudEvidence[];
  status: "active" | "under_review" | "resolved_guilty" | "resolved_innocent" | "appealed";
  autoDetected: boolean;
  reportedBy?: number;
  reviewedBy?: number;
  createdAt: Date;
  resolvedAt?: Date;
  appealId?: string;
}

export interface FraudEvidence {
  type: "behavioral_pattern" | "ip_correlation" | "device_fingerprint" | "transaction_pattern" | "content_pattern" | "manual_report";
  description: string;
  confidence: number; // 0-1
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface FraudAppeal {
  id: string;
  flagId: string;
  userId: number;
  reason: string;
  evidence: string[];
  status: "submitted" | "under_review" | "approved" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface SybilCluster {
  id: string;
  userIds: number[];
  confidence: number;
  detectionMethod: "ip_sharing" | "device_sharing" | "behavioral_similarity" | "timing_correlation" | "financial_correlation";
  detectedAt: Date;
  status: "suspected" | "confirmed" | "false_positive";
}

export interface BehavioralProfile {
  userId: number;
  sessionPatterns: { avgSessionLength: number; sessionsPerDay: number; peakHours: number[] };
  contentPatterns: { avgPostsPerDay: number; avgLikesPerDay: number; avgCommentsPerDay: number };
  engagementVelocity: number; // actions per minute
  deviceFingerprints: string[];
  ipAddresses: string[];
  isBot: boolean;
  botConfidence: number;
  lastUpdatedAt: Date;
}

// ─── IDENTITY VERIFICATION SERVICE ───────────────────────────────────────────

export class IdentityVerificationService {
  private profiles = new Map<number, IdentityProfile>();
  private verificationQueue = new Map<string, { userId: number; type: string; data: unknown; submittedAt: Date }>();
  private queueCounter = 0;

  async initializeProfile(userId: number): Promise<IdentityProfile> {
    if (this.profiles.has(userId)) return this.profiles.get(userId)!;

    const profile: IdentityProfile = {
      userId,
      tier: "none",
      email: { verified: false },
      phone: { verified: false },
      document: { verified: false },
      biometric: { verified: false },
      linkedAccounts: [],
      trustScore: 100,
      riskLevel: "medium",
      flags: [],
      createdAt: new Date(),
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  async verifyEmail(userId: number, email: string): Promise<{ success: boolean; tier: VerificationTier }> {
    const profile = await this.initializeProfile(userId);

    // Email verification logic (in production: send verification link)
    profile.email = { verified: true, verifiedAt: new Date() };
    if (profile.tier === "none") profile.tier = "email";
    profile.trustScore = Math.min(1000, profile.trustScore + 50);
    profile.lastVerifiedAt = new Date();

    return { success: true, tier: profile.tier };
  }

  async verifyPhone(userId: number, phone: string, countryCode: string): Promise<{ success: boolean; tier: VerificationTier }> {
    const profile = await this.initializeProfile(userId);

    profile.phone = { verified: true, verifiedAt: new Date(), countryCode };
    if (["none", "email"].includes(profile.tier)) profile.tier = "phone";
    profile.trustScore = Math.min(1000, profile.trustScore + 100);
    profile.lastVerifiedAt = new Date();

    return { success: true, tier: profile.tier };
  }

  async submitDocumentVerification(userId: number, documentType: "passport" | "drivers_license" | "national_id", country: string): Promise<string> {
    const queueId = `vq_${++this.queueCounter}`;
    this.verificationQueue.set(queueId, {
      userId,
      type: "document",
      data: { documentType, country },
      submittedAt: new Date(),
    });
    return queueId;
  }

  async approveDocumentVerification(queueId: string, approved: boolean): Promise<IdentityProfile | null> {
    const item = this.verificationQueue.get(queueId);
    if (!item) return null;

    const profile = await this.initializeProfile(item.userId);
    const data = item.data as { documentType: "passport" | "drivers_license" | "national_id"; country: string };

    if (approved) {
      profile.document = {
        verified: true,
        type: data.documentType,
        country: data.country,
        verifiedAt: new Date(),
      };
      profile.tier = "id_document";
      profile.trustScore = Math.min(1000, profile.trustScore + 200);
      profile.riskLevel = "low";
      profile.lastVerifiedAt = new Date();
    }

    this.verificationQueue.delete(queueId);
    return profile;
  }

  async linkSocialAccount(userId: number, account: Omit<LinkedAccount, "linkedAt" | "verificationProof">): Promise<IdentityProfile> {
    const profile = await this.initializeProfile(userId);

    // Remove existing link for same platform
    profile.linkedAccounts = profile.linkedAccounts.filter(a => a.platform !== account.platform);

    const linked: LinkedAccount = {
      ...account,
      linkedAt: new Date(),
      verificationProof: `oauth_${Date.now()}`,
    };

    profile.linkedAccounts.push(linked);

    // Boost trust score based on follower count
    const followerBoost = Math.min(100, Math.floor(account.followerCount / 1000));
    profile.trustScore = Math.min(1000, profile.trustScore + followerBoost);

    if (account.isVerifiedOnPlatform) {
      profile.trustScore = Math.min(1000, profile.trustScore + 50);
    }

    return profile;
  }

  getProfile(userId: number): IdentityProfile | null {
    return this.profiles.get(userId) || null;
  }

  getVerificationQueue(): { queueId: string; userId: number; type: string; submittedAt: Date }[] {
    return Array.from(this.verificationQueue.entries())
      .map(([queueId, item]) => ({ queueId, userId: item.userId, type: item.type, submittedAt: item.submittedAt }))
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
  }
}

// ─── WALLET REPUTATION SERVICE ────────────────────────────────────────────────

export class WalletReputationService {
  private reputations = new Map<string, WalletReputation>(); // walletAddress -> reputation

  private calculateTier(score: number, ageInDays: number, volumeUSD: number): WalletReputation["tier"] {
    if (volumeUSD > 1000000) return "institution";
    if (volumeUSD > 100000 && score > 700) return "whale";
    if (score > 600 && ageInDays > 365) return "trusted";
    if (score > 400 && ageInDays > 90) return "established";
    if (ageInDays > 0) return "new";
    return "unknown";
  }

  async analyzeWallet(walletAddress: string, chainId: number, onChainData: {
    ageInDays: number;
    transactionCount: number;
    totalVolumeUSD: number;
    uniqueContracts: number;
    defiProtocols: string[];
    nftCollections: number;
    isContract: boolean;
  }): Promise<WalletReputation> {
    let score = 100;

    // Age scoring (max 200 points)
    score += Math.min(200, onChainData.ageInDays * 0.5);

    // Transaction volume scoring (max 200 points)
    score += Math.min(200, Math.log10(onChainData.transactionCount + 1) * 50);

    // DeFi participation (max 150 points)
    score += Math.min(150, onChainData.defiProtocols.length * 25);

    // NFT diversity (max 100 points)
    score += Math.min(100, onChainData.nftCollections * 10);

    // Contract interaction diversity (max 150 points)
    score += Math.min(150, onChainData.uniqueContracts * 5);

    // Penalty for contract wallets (often bots)
    if (onChainData.isContract) score -= 50;

    score = Math.max(0, Math.min(1000, score));

    const rep: WalletReputation = {
      walletAddress,
      chainId,
      score,
      tier: this.calculateTier(score, onChainData.ageInDays, onChainData.totalVolumeUSD),
      ageInDays: onChainData.ageInDays,
      transactionCount: onChainData.transactionCount,
      totalVolumeUSD: onChainData.totalVolumeUSD,
      uniqueContractsInteracted: onChainData.uniqueContracts,
      defiProtocolsUsed: onChainData.defiProtocols,
      nftCollectionsHeld: onChainData.nftCollections,
      isContractWallet: onChainData.isContract,
      hasBeenFlagged: false,
      flagReasons: [],
      lastActivityAt: new Date(),
      firstSeenAt: new Date(Date.now() - onChainData.ageInDays * 86400000),
    };

    this.reputations.set(walletAddress, rep);
    return rep;
  }

  async flagWallet(walletAddress: string, reason: string): Promise<void> {
    const rep = this.reputations.get(walletAddress);
    if (!rep) return;
    rep.hasBeenFlagged = true;
    if (!rep.flagReasons.includes(reason)) rep.flagReasons.push(reason);
    rep.score = Math.max(0, rep.score - 200);
    rep.tier = this.calculateTier(rep.score, rep.ageInDays, rep.totalVolumeUSD);
  }

  getReputation(walletAddress: string): WalletReputation | null {
    return this.reputations.get(walletAddress) || null;
  }

  getTopWallets(limit = 20): WalletReputation[] {
    return Array.from(this.reputations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// ─── TRUST SCORE SERVICE ──────────────────────────────────────────────────────

export class TrustScoreService {
  private scores = new Map<number, TrustScore>();
  private badges = new Map<number, TrustBadge[]>();
  private badgeCounter = 0;

  private BADGE_DEFINITIONS: Omit<TrustBadge, "id" | "earnedAt" | "expiresAt">[] = [
    { name: "Email Verified", description: "Email address confirmed", category: "identity", isRevocable: false },
    { name: "Phone Verified", description: "Phone number confirmed", category: "identity", isRevocable: false },
    { name: "ID Verified", description: "Government ID verified", category: "identity", isRevocable: false },
    { name: "Top Creator", description: "Top 1% creator by engagement", category: "creator", isRevocable: true },
    { name: "Trusted Trader", description: "100+ successful trades", category: "trader", isRevocable: true },
    { name: "Impact Donor", description: "$1000+ donated to charity", category: "donor", isRevocable: false },
    { name: "Community Pillar", description: "500+ reputation in 3+ communities", category: "community", isRevocable: true },
    { name: "Security Champion", description: "Reported 10+ valid security issues", category: "security", isRevocable: false },
  ];

  async calculateTrustScore(userId: number, inputs: {
    identityScore: number;
    walletScore: number;
    socialScore: number;
    behavioralScore: number;
    communityScore: number;
    financialScore: number;
  }): Promise<TrustScore> {
    // Weighted composite score
    const weights = { identity: 0.25, wallet: 0.20, social: 0.20, behavioral: 0.15, community: 0.10, financial: 0.10 };
    const composite = Math.round(
      inputs.identityScore * weights.identity +
      inputs.walletScore * weights.wallet +
      inputs.socialScore * weights.social +
      inputs.behavioralScore * weights.behavioral +
      inputs.communityScore * weights.community +
      inputs.financialScore * weights.financial
    );

    const tier = composite >= 900 ? "institution"
      : composite >= 750 ? "elite"
      : composite >= 550 ? "verified"
      : composite >= 350 ? "trusted"
      : composite >= 150 ? "basic"
      : "untrusted";

    const existing = this.scores.get(userId);
    const trend = existing
      ? (composite > existing.composite ? "improving" : composite < existing.composite ? "declining" : "stable")
      : "stable";

    const score: TrustScore = {
      userId,
      composite,
      breakdown: { identity: inputs.identityScore, wallet: inputs.walletScore, social: inputs.socialScore, behavioral: inputs.behavioralScore, community: inputs.communityScore, financial: inputs.financialScore },
      tier,
      badges: this.badges.get(userId) || [],
      lastCalculatedAt: new Date(),
      trend,
    };

    this.scores.set(userId, score);
    return score;
  }

  async awardBadge(userId: number, badgeName: string, expiresInDays?: number): Promise<TrustBadge | null> {
    const definition = this.BADGE_DEFINITIONS.find(b => b.name === badgeName);
    if (!definition) return null;

    const badge: TrustBadge = {
      id: `badge_${++this.badgeCounter}`,
      ...definition,
      earnedAt: new Date(),
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : undefined,
    };

    const userBadges = this.badges.get(userId) || [];
    // Don't duplicate badges
    if (!userBadges.some(b => b.name === badgeName)) {
      userBadges.push(badge);
      this.badges.set(userId, userBadges);
    }

    return badge;
  }

  async revokeBadge(userId: number, badgeName: string): Promise<boolean> {
    const userBadges = this.badges.get(userId) || [];
    const badge = userBadges.find(b => b.name === badgeName);
    if (!badge || !badge.isRevocable) return false;

    this.badges.set(userId, userBadges.filter(b => b.name !== badgeName));
    return true;
  }

  getScore(userId: number): TrustScore | null {
    return this.scores.get(userId) || null;
  }

  getBadges(userId: number): TrustBadge[] {
    return (this.badges.get(userId) || []).filter(b => !b.expiresAt || b.expiresAt > new Date());
  }
}

// ─── FRAUD FLAG SERVICE ───────────────────────────────────────────────────────

export class FraudFlagService {
  private flags = new Map<string, FraudFlag>();
  private appeals = new Map<string, FraudAppeal>();
  private userFlags = new Map<number, string[]>(); // userId -> flagIds
  private flagCounter = 0;
  private appealCounter = 0;

  async createFlag(params: {
    userId: number;
    type: FraudFlag["type"];
    severity: FraudFlag["severity"];
    evidence: FraudEvidence[];
    autoDetected: boolean;
    reportedBy?: number;
  }): Promise<FraudFlag> {
    const id = `flag_${++this.flagCounter}`;
    const flag: FraudFlag = {
      id,
      userId: params.userId,
      type: params.type,
      severity: params.severity,
      evidence: params.evidence,
      status: "active",
      autoDetected: params.autoDetected,
      reportedBy: params.reportedBy,
      createdAt: new Date(),
    };

    this.flags.set(id, flag);
    const userFlagList = this.userFlags.get(params.userId) || [];
    userFlagList.push(id);
    this.userFlags.set(params.userId, userFlagList);

    return flag;
  }

  async reviewFlag(flagId: string, reviewerId: number, verdict: "resolved_guilty" | "resolved_innocent", notes?: string): Promise<FraudFlag | null> {
    const flag = this.flags.get(flagId);
    if (!flag || flag.status !== "active") return null;

    flag.status = verdict;
    flag.reviewedBy = reviewerId;
    flag.resolvedAt = new Date();

    return flag;
  }

  async submitAppeal(flagId: string, userId: number, reason: string, evidence: string[]): Promise<FraudAppeal> {
    const flag = this.flags.get(flagId);
    if (!flag || flag.userId !== userId) throw new Error("Flag not found");

    const id = `appeal_${++this.appealCounter}`;
    const appeal: FraudAppeal = {
      id,
      flagId,
      userId,
      reason,
      evidence,
      status: "submitted",
      submittedAt: new Date(),
    };

    this.appeals.set(id, appeal);
    flag.status = "appealed";
    flag.appealId = id;

    return appeal;
  }

  async resolveAppeal(appealId: string, approved: boolean, notes: string): Promise<FraudAppeal | null> {
    const appeal = this.appeals.get(appealId);
    if (!appeal) return null;

    appeal.status = approved ? "approved" : "rejected";
    appeal.reviewedAt = new Date();
    appeal.reviewNotes = notes;

    const flag = this.flags.get(appeal.flagId);
    if (flag) {
      flag.status = approved ? "resolved_innocent" : "resolved_guilty";
      flag.resolvedAt = new Date();
    }

    return appeal;
  }

  getUserFlags(userId: number, activeOnly = false): FraudFlag[] {
    const flagIds = this.userFlags.get(userId) || [];
    return flagIds
      .map(id => this.flags.get(id)!)
      .filter(f => f && (!activeOnly || f.status === "active"))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getActiveFlags(limit = 50): FraudFlag[] {
    return Array.from(this.flags.values())
      .filter(f => f.status === "active")
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, limit);
  }

  hasActiveFlag(userId: number, type?: FraudFlag["type"]): boolean {
    const flags = this.getUserFlags(userId, true);
    return type ? flags.some(f => f.type === type) : flags.length > 0;
  }
}

// ─── SYBIL DETECTION SERVICE ──────────────────────────────────────────────────

export class SybilDetectionService {
  private clusters = new Map<string, SybilCluster>();
  private profiles = new Map<number, BehavioralProfile>();
  private clusterCounter = 0;

  async updateBehavioralProfile(userId: number, activity: {
    sessionLength: number;
    actionsPerMinute: number;
    deviceFingerprint: string;
    ipAddress: string;
  }): Promise<BehavioralProfile> {
    let profile = this.profiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        sessionPatterns: { avgSessionLength: 0, sessionsPerDay: 0, peakHours: [] },
        contentPatterns: { avgPostsPerDay: 0, avgLikesPerDay: 0, avgCommentsPerDay: 0 },
        engagementVelocity: 0,
        deviceFingerprints: [],
        ipAddresses: [],
        isBot: false,
        botConfidence: 0,
        lastUpdatedAt: new Date(),
      };
    }

    // Update device fingerprints
    if (!profile.deviceFingerprints.includes(activity.deviceFingerprint)) {
      profile.deviceFingerprints.push(activity.deviceFingerprint);
    }

    // Update IP addresses
    if (!profile.ipAddresses.includes(activity.ipAddress)) {
      profile.ipAddresses.push(activity.ipAddress);
    }

    // Update session patterns
    profile.sessionPatterns.avgSessionLength =
      (profile.sessionPatterns.avgSessionLength * 0.9) + (activity.sessionLength * 0.1);
    profile.engagementVelocity =
      (profile.engagementVelocity * 0.9) + (activity.actionsPerMinute * 0.1);

    // Bot detection heuristics
    let botConfidence = 0;
    if (activity.actionsPerMinute > 60) botConfidence += 0.4; // Too fast for human
    if (activity.actionsPerMinute > 120) botConfidence += 0.3; // Definitely automated
    if (profile.sessionPatterns.avgSessionLength < 10) botConfidence += 0.1; // Very short sessions
    if (profile.deviceFingerprints.length > 10) botConfidence += 0.1; // Many devices
    if (profile.ipAddresses.length > 20) botConfidence += 0.1; // Many IPs

    profile.botConfidence = Math.min(1, botConfidence);
    profile.isBot = profile.botConfidence > 0.7;
    profile.lastUpdatedAt = new Date();

    this.profiles.set(userId, profile);
    return profile;
  }

  async detectSybilCluster(userIds: number[], method: SybilCluster["detectionMethod"], confidence: number): Promise<SybilCluster> {
    const id = `cluster_${++this.clusterCounter}`;
    const cluster: SybilCluster = {
      id,
      userIds,
      confidence,
      detectionMethod: method,
      detectedAt: new Date(),
      status: confidence > 0.8 ? "confirmed" : "suspected",
    };
    this.clusters.set(id, cluster);
    return cluster;
  }

  async findSharedDeviceUsers(deviceFingerprint: string): Promise<number[]> {
    return Array.from(this.profiles.values())
      .filter(p => p.deviceFingerprints.includes(deviceFingerprint))
      .map(p => p.userId);
  }

  async findSharedIPUsers(ipAddress: string): Promise<number[]> {
    return Array.from(this.profiles.values())
      .filter(p => p.ipAddresses.includes(ipAddress))
      .map(p => p.userId);
  }

  getBehavioralProfile(userId: number): BehavioralProfile | null {
    return this.profiles.get(userId) || null;
  }

  getSuspectedBots(): BehavioralProfile[] {
    return Array.from(this.profiles.values())
      .filter(p => p.botConfidence > 0.5)
      .sort((a, b) => b.botConfidence - a.botConfidence);
  }

  getActiveClusters(): SybilCluster[] {
    return Array.from(this.clusters.values())
      .filter(c => c.status !== "false_positive")
      .sort((a, b) => b.confidence - a.confidence);
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const identityVerificationService = new IdentityVerificationService();
export const walletReputationService = new WalletReputationService();
export const trustScoreService = new TrustScoreService();
export const fraudFlagService = new FraudFlagService();
export const sybilDetectionService = new SybilDetectionService();
