import crypto from 'crypto';
/**
 * PHASE 24 — ECOSYSTEM LOCK-IN
 * Unified Identity Layer, Cross-System Persistence, Migration Resistance
 * Goal: Users and creators build permanent value inside the system.
 */

// ─── UNIFIED IDENTITY TYPES ───────────────────────────────────────────────────

export interface UnifiedIdentity {
  userId: number;
  // Social identity
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  bannerUrl?: string;
  verifiedBadges: Array<"creator" | "verified" | "institution" | "charity" | "partner" | "developer">;
  socialLinks: Record<string, string>;
  // Wallet identity
  primaryWalletAddress?: string;
  linkedWallets: string[];
  totalWalletValue: number;
  // Creator identity
  isCreator: boolean;
  creatorTier: "none" | "emerging" | "rising" | "established" | "elite" | "legendary";
  creatorScore: number;
  totalFollowers: number;
  totalSubscribers: number;
  totalEarned: number;
  // Trust identity
  trustScore: number;
  trustLevel: "new" | "basic" | "trusted" | "verified" | "elite";
  accountAge: number; // days
  reportCount: number;
  // Reputation identity
  reputationScore: number;
  reputationBadges: string[];
  engagementLadderTier: string;
  governanceVotingPower: number;
  // Cross-system linkage
  linkedSystems: Array<"social" | "streaming" | "marketplace" | "gaming" | "charity" | "staking" | "nft">;
  lastUpdatedAt: Date;
  createdAt: Date;
}

export interface IdentityVerification {
  id: string;
  userId: number;
  verificationType: "email" | "phone" | "kyc" | "wallet_ownership" | "social_oauth" | "institution";
  status: "pending" | "verified" | "failed" | "expired";
  verifiedAt?: Date;
  expiresAt?: Date;
  metadata: Record<string, unknown>;
}

// ─── CROSS-SYSTEM PERSISTENCE TYPES ──────────────────────────────────────────

export interface UserActivityGraph {
  userId: number;
  posts: number;
  comments: number;
  likes: number;
  shares: number;
  streams: number;
  streamWatchHours: number;
  nftsMinted: number;
  nftsPurchased: number;
  marketplacePurchases: number;
  marketplaceSales: number;
  communitiesJoined: number;
  communitiesCreated: number;
  referrals: number;
  donations: number;
  governanceVotes: number;
  rewardsEarned: number;
  totalTransactions: number;
  totalValueTransacted: number;
  lastUpdatedAt: Date;
}

export interface CrossSystemLink {
  id: string;
  userId: number;
  systemA: string;
  entityAId: string;
  systemB: string;
  entityBId: string;
  linkType: "created_from" | "references" | "rewards" | "unlocks" | "governs" | "funds";
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface PlatformValueScore {
  userId: number;
  socialScore: number;
  economicScore: number;
  creatorScore: number;
  communityScore: number;
  trustScore: number;
  governanceScore: number;
  totalScore: number;
  percentile: number;
  tier: "newcomer" | "member" | "contributor" | "power_user" | "ecosystem_pillar" | "legend";
  breakdown: Record<string, number>;
  calculatedAt: Date;
}

// ─── MIGRATION RESISTANCE TYPES ───────────────────────────────────────────────

export interface CreatorVaultExport {
  id: string;
  creatorId: number;
  exportType: "full" | "content" | "audience" | "monetization" | "trust";
  status: "pending" | "generating" | "ready" | "downloaded" | "expired";
  requestedAt: Date;
  readyAt?: Date;
  downloadedAt?: Date;
  expiresAt: Date;
  fileUrl?: string;
  fileSizeBytes?: number;
  recordCount?: number;
  checksum?: string;
}

export interface AudienceGraph {
  creatorId: number;
  totalFollowers: number;
  totalSubscribers: number;
  topFans: Array<{ userId: number; lifetimeValue: number; watchHours: number; tier: string }>;
  demographicBreakdown: Record<string, number>;
  engagementRate: number;
  retentionRate: number;
  churnRate: number;
  avgRevenuePerFan: number;
  generatedAt: Date;
}

export interface MonetizationHistory {
  userId: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalPending: number;
  bySource: Record<string, number>;
  byMonth: Record<string, number>;
  firstEarningAt?: Date;
  lastEarningAt?: Date;
  generatedAt: Date;
}

export interface ContentOwnershipProof {
  id: string;
  creatorId: number;
  contentId: string;
  contentType: string;
  contentHash: string;
  ipfsHash?: string;
  onChainTxHash?: string;
  registeredAt: Date;
  platform: "shadowchat";
  metadata: Record<string, unknown>;
}

export interface TrustHistory {
  userId: number;
  trustScore: number;
  trustLevel: UnifiedIdentity["trustLevel"];
  events: Array<{
    eventType: "positive" | "negative" | "neutral";
    description: string;
    scoreChange: number;
    recordedAt: Date;
  }>;
  totalPositiveEvents: number;
  totalNegativeEvents: number;
  generatedAt: Date;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _unifiedIdentities = new Map<number, UnifiedIdentity>();
const _identityVerifications = new Map<string, IdentityVerification>();
const _activityGraphs = new Map<number, UserActivityGraph>();
const _crossSystemLinks = new Map<string, CrossSystemLink>();
const _platformValueScores = new Map<number, PlatformValueScore>();
const _vaultExports = new Map<string, CreatorVaultExport>();
const _audienceGraphs = new Map<number, AudienceGraph>();
const _monetizationHistories = new Map<number, MonetizationHistory>();
const _contentOwnershipProofs = new Map<string, ContentOwnershipProof>();
const _trustHistories = new Map<number, TrustHistory>();

// ─── UNIFIED IDENTITY ENGINE ──────────────────────────────────────────────────

export const unifiedIdentityEngine = {
  upsertIdentity(params: Partial<UnifiedIdentity> & { userId: number }): UnifiedIdentity {
    const existing = _unifiedIdentities.get(params.userId);
    if (existing) {
      Object.assign(existing, params);
      existing.lastUpdatedAt = new Date();
      return existing;
    }
    const identity: UnifiedIdentity = {
      userId: params.userId,
      username: params.username ?? `user_${params.userId}`,
      displayName: params.displayName ?? `User ${params.userId}`,
      bio: params.bio ?? "",
      verifiedBadges: params.verifiedBadges ?? [],
      socialLinks: params.socialLinks ?? {},
      linkedWallets: params.linkedWallets ?? [],
      totalWalletValue: params.totalWalletValue ?? 0,
      isCreator: params.isCreator ?? false,
      creatorTier: params.creatorTier ?? "none",
      creatorScore: params.creatorScore ?? 0,
      totalFollowers: params.totalFollowers ?? 0,
      totalSubscribers: params.totalSubscribers ?? 0,
      totalEarned: params.totalEarned ?? 0,
      trustScore: params.trustScore ?? 50,
      trustLevel: params.trustLevel ?? "new",
      accountAge: params.accountAge ?? 0,
      reportCount: params.reportCount ?? 0,
      reputationScore: params.reputationScore ?? 0,
      reputationBadges: params.reputationBadges ?? [],
      engagementLadderTier: params.engagementLadderTier ?? "bronze",
      governanceVotingPower: params.governanceVotingPower ?? 0,
      linkedSystems: params.linkedSystems ?? [],
      lastUpdatedAt: new Date(),
      createdAt: new Date(),
    };
    _unifiedIdentities.set(params.userId, identity);
    return identity;
  },

  getIdentity(userId: number): UnifiedIdentity | null {
    return _unifiedIdentities.get(userId) ?? null;
  },

  addVerifiedBadge(userId: number, badge: UnifiedIdentity["verifiedBadges"][number]): UnifiedIdentity | null {
    const identity = _unifiedIdentities.get(userId);
    if (!identity) return null;
    if (!identity.verifiedBadges.includes(badge)) {
      identity.verifiedBadges.push(badge);
      identity.lastUpdatedAt = new Date();
    }
    return identity;
  },

  linkWallet(userId: number, walletAddress: string): UnifiedIdentity | null {
    const identity = _unifiedIdentities.get(userId);
    if (!identity) return null;
    if (!identity.linkedWallets.includes(walletAddress)) {
      identity.linkedWallets.push(walletAddress);
      if (!identity.primaryWalletAddress) identity.primaryWalletAddress = walletAddress;
      identity.lastUpdatedAt = new Date();
    }
    return identity;
  },

  linkSystem(userId: number, system: UnifiedIdentity["linkedSystems"][number]): UnifiedIdentity | null {
    const identity = _unifiedIdentities.get(userId);
    if (!identity) return null;
    if (!identity.linkedSystems.includes(system)) {
      identity.linkedSystems.push(system);
      identity.lastUpdatedAt = new Date();
    }
    return identity;
  },

  addVerification(params: Omit<IdentityVerification, "id">): IdentityVerification {
    const id = `verify_${params.userId}_${params.verificationType}`;
    const verification: IdentityVerification = { ...params, id };
    _identityVerifications.set(id, verification);
    return verification;
  },

  getVerifications(userId: number): IdentityVerification[] {
    return Array.from(_identityVerifications.values()).filter(v => v.userId === userId);
  },

  searchIdentities(query: string, limit = 20): UnifiedIdentity[] {
    const q = query.toLowerCase();
    return Array.from(_unifiedIdentities.values())
      .filter(i => i.username.toLowerCase().includes(q) || i.displayName.toLowerCase().includes(q))
      .slice(0, limit);
  },
};

// ─── CROSS-SYSTEM PERSISTENCE ENGINE ─────────────────────────────────────────

export const crossSystemPersistence = {
  updateActivityGraph(userId: number, updates: Partial<Omit<UserActivityGraph, "userId" | "lastUpdatedAt">>): UserActivityGraph {
    const existing = _activityGraphs.get(userId);
    if (existing) {
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === "number" && key in existing) {
          (existing as any)[key] = ((existing as any)[key] ?? 0) + value;
        }
      }
      existing.lastUpdatedAt = new Date();
      return existing;
    }
    const graph: UserActivityGraph = {
      userId,
      posts: 0, comments: 0, likes: 0, shares: 0,
      streams: 0, streamWatchHours: 0,
      nftsMinted: 0, nftsPurchased: 0,
      marketplacePurchases: 0, marketplaceSales: 0,
      communitiesJoined: 0, communitiesCreated: 0,
      referrals: 0, donations: 0, governanceVotes: 0,
      rewardsEarned: 0, totalTransactions: 0, totalValueTransacted: 0,
      lastUpdatedAt: new Date(),
      ...updates,
    };
    _activityGraphs.set(userId, graph);
    return graph;
  },

  getActivityGraph(userId: number): UserActivityGraph | null {
    return _activityGraphs.get(userId) ?? null;
  },

  createCrossSystemLink(params: Omit<CrossSystemLink, "id" | "createdAt">): CrossSystemLink {
    const id = `link_${params.userId}_${params.systemA}_${params.entityAId}_${params.systemB}_${params.entityBId}`;
    const link: CrossSystemLink = { ...params, id, createdAt: new Date() };
    _crossSystemLinks.set(id, link);
    return link;
  },

  getEntityLinks(userId: number, system?: string): CrossSystemLink[] {
    return Array.from(_crossSystemLinks.values()).filter(l =>
      l.userId === userId && (!system || l.systemA === system || l.systemB === system)
    );
  },

  calculatePlatformValueScore(userId: number): PlatformValueScore {
    const graph = _activityGraphs.get(userId);
    const identity = _unifiedIdentities.get(userId);
    const socialScore = graph
      ? Math.min(100, graph.posts * 2 + graph.comments * 1 + graph.likes * 0.5 + graph.shares * 3)
      : 0;
    const economicScore = graph
      ? Math.min(100, graph.totalValueTransacted * 0.01 + graph.rewardsEarned * 0.1)
      : 0;
    const creatorScore = identity?.isCreator
      ? Math.min(100, identity.totalFollowers * 0.001 + identity.totalEarned * 0.01)
      : 0;
    const communityScore = graph
      ? Math.min(100, graph.communitiesJoined * 5 + graph.communitiesCreated * 20)
      : 0;
    const trustScore = identity?.trustScore ?? 50;
    const governanceScore = identity
      ? Math.min(100, identity.governanceVotingPower * 0.1 + (graph?.governanceVotes ?? 0) * 5)
      : 0;
    const totalScore = (socialScore + economicScore + creatorScore + communityScore + trustScore + governanceScore) / 6;
    const tier: PlatformValueScore["tier"] =
      totalScore >= 90 ? "legend" :
      totalScore >= 70 ? "ecosystem_pillar" :
      totalScore >= 50 ? "power_user" :
      totalScore >= 30 ? "contributor" :
      totalScore >= 10 ? "member" : "newcomer";
    const score: PlatformValueScore = {
      userId, socialScore, economicScore, creatorScore, communityScore, trustScore, governanceScore,
      totalScore,
      percentile: Math.min(99, totalScore),
      tier,
      breakdown: { socialScore, economicScore, creatorScore, communityScore, trustScore, governanceScore },
      calculatedAt: new Date(),
    };
    _platformValueScores.set(userId, score);
    return score;
  },

  getPlatformValueScore(userId: number): PlatformValueScore | null {
    return _platformValueScores.get(userId) ?? null;
  },

  getTopValueUsers(limit = 50): PlatformValueScore[] {
    return Array.from(_platformValueScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  },
};

// ─── MIGRATION RESISTANCE ENGINE ─────────────────────────────────────────────

export const migrationResistanceEngine = {
  requestVaultExport(creatorId: number, exportType: CreatorVaultExport["exportType"]): CreatorVaultExport {
    const id = `export_${creatorId}_${exportType}_${Date.now()}`;
    const exportRecord: CreatorVaultExport = {
      id, creatorId, exportType,
      status: "pending",
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days
    };
    _vaultExports.set(id, exportRecord);
    return exportRecord;
  },

  generateVaultExport(exportId: string): CreatorVaultExport | null {
    const exportRecord = _vaultExports.get(exportId);
    if (!exportRecord || exportRecord.status !== "pending") return null;
    exportRecord.status = "generating";
    // Simulate generation
    exportRecord.status = "ready";
    exportRecord.readyAt = new Date();
    exportRecord.fileUrl = `https://exports.sky/${exportId}.zip`;
    exportRecord.fileSizeBytes = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 50000000) + 1000000;
    exportRecord.recordCount = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10000) + 100;
    exportRecord.checksum = `sha256_${exportId.slice(0, 16)}`;
    return exportRecord;
  },

  downloadVaultExport(exportId: string): CreatorVaultExport | null {
    const exportRecord = _vaultExports.get(exportId);
    if (!exportRecord || exportRecord.status !== "ready") return null;
    if (exportRecord.expiresAt < new Date()) {
      exportRecord.status = "expired";
      return null;
    }
    exportRecord.status = "downloaded";
    exportRecord.downloadedAt = new Date();
    return exportRecord;
  },

  getCreatorExports(creatorId: number): CreatorVaultExport[] {
    return Array.from(_vaultExports.values()).filter(e => e.creatorId === creatorId);
  },

  generateAudienceGraph(creatorId: number): AudienceGraph {
    const graph: AudienceGraph = {
      creatorId,
      totalFollowers: 0,
      totalSubscribers: 0,
      topFans: [],
      demographicBreakdown: { "18-24": 0.35, "25-34": 0.40, "35-44": 0.15, "45+": 0.10 },
      engagementRate: 0.045,
      retentionRate: 0.72,
      churnRate: 0.28,
      avgRevenuePerFan: 0,
      generatedAt: new Date(),
    };
    _audienceGraphs.set(creatorId, graph);
    return graph;
  },

  getAudienceGraph(creatorId: number): AudienceGraph | null {
    return _audienceGraphs.get(creatorId) ?? null;
  },

  generateMonetizationHistory(userId: number): MonetizationHistory {
    const history: MonetizationHistory = {
      userId,
      totalEarned: 0,
      totalWithdrawn: 0,
      totalPending: 0,
      bySource: {},
      byMonth: {},
      generatedAt: new Date(),
    };
    _monetizationHistories.set(userId, history);
    return history;
  },

  recordEarning(userId: number, amount: number, source: string): MonetizationHistory {
    const history = _monetizationHistories.get(userId) ?? this.generateMonetizationHistory(userId);
    history.totalEarned += amount;
    history.totalPending += amount;
    history.bySource[source] = (history.bySource[source] ?? 0) + amount;
    const monthKey = new Date().toISOString().slice(0, 7);
    history.byMonth[monthKey] = (history.byMonth[monthKey] ?? 0) + amount;
    if (!history.firstEarningAt) history.firstEarningAt = new Date();
    history.lastEarningAt = new Date();
    history.generatedAt = new Date();
    _monetizationHistories.set(userId, history);
    return history;
  },

  recordWithdrawal(userId: number, amount: number): MonetizationHistory | null {
    const history = _monetizationHistories.get(userId);
    if (!history || history.totalPending < amount) return null;
    history.totalWithdrawn += amount;
    history.totalPending -= amount;
    history.generatedAt = new Date();
    return history;
  },

  getMonetizationHistory(userId: number): MonetizationHistory | null {
    return _monetizationHistories.get(userId) ?? null;
  },

  registerContentOwnership(params: Omit<ContentOwnershipProof, "id" | "registeredAt" | "platform">): ContentOwnershipProof {
    const id = `proof_${params.creatorId}_${params.contentId}`;
    const proof: ContentOwnershipProof = {
      ...params, id,
      platform: "shadowchat",
      registeredAt: new Date(),
    };
    _contentOwnershipProofs.set(id, proof);
    return proof;
  },

  getContentOwnershipProof(contentId: string): ContentOwnershipProof | null {
    return Array.from(_contentOwnershipProofs.values()).find(p => p.contentId === contentId) ?? null;
  },

  getCreatorContentProofs(creatorId: number): ContentOwnershipProof[] {
    return Array.from(_contentOwnershipProofs.values()).filter(p => p.creatorId === creatorId);
  },

  buildTrustHistory(userId: number): TrustHistory {
    const identity = _unifiedIdentities.get(userId);
    const history: TrustHistory = {
      userId,
      trustScore: identity?.trustScore ?? 50,
      trustLevel: identity?.trustLevel ?? "new",
      events: [],
      totalPositiveEvents: 0,
      totalNegativeEvents: 0,
      generatedAt: new Date(),
    };
    _trustHistories.set(userId, history);
    return history;
  },

  recordTrustEvent(userId: number, eventType: "positive" | "negative" | "neutral", description: string, scoreChange: number): TrustHistory {
    const history = _trustHistories.get(userId) ?? this.buildTrustHistory(userId);
    history.events.push({ eventType, description, scoreChange, recordedAt: new Date() });
    history.trustScore = Math.max(0, Math.min(100, history.trustScore + scoreChange));
    if (eventType === "positive") history.totalPositiveEvents++;
    if (eventType === "negative") history.totalNegativeEvents++;
    history.trustLevel =
      history.trustScore >= 90 ? "elite" :
      history.trustScore >= 70 ? "verified" :
      history.trustScore >= 50 ? "trusted" :
      history.trustScore >= 25 ? "basic" : "new";
    history.generatedAt = new Date();
    _trustHistories.set(userId, history);
    // Sync to identity
    const identity = _unifiedIdentities.get(userId);
    if (identity) {
      identity.trustScore = history.trustScore;
      identity.trustLevel = history.trustLevel;
      identity.lastUpdatedAt = new Date();
    }
    return history;
  },

  getTrustHistory(userId: number): TrustHistory | null {
    return _trustHistories.get(userId) ?? null;
  },

  getEcosystemLockInMetrics(): {
    totalUnifiedIdentities: number;
    verifiedUsers: number;
    multiSystemUsers: number;
    totalCrossSystemLinks: number;
    totalContentProofs: number;
    avgPlatformValueScore: number;
    legendUsers: number;
  } {
    const identities = Array.from(_unifiedIdentities.values());
    const scores = Array.from(_platformValueScores.values());
    return {
      totalUnifiedIdentities: identities.length,
      verifiedUsers: identities.filter(i => i.verifiedBadges.length > 0).length,
      multiSystemUsers: identities.filter(i => i.linkedSystems.length >= 3).length,
      totalCrossSystemLinks: _crossSystemLinks.size,
      totalContentProofs: _contentOwnershipProofs.size,
      avgPlatformValueScore: scores.length > 0
        ? scores.reduce((s, v) => s + v.totalScore, 0) / scores.length
        : 0,
      legendUsers: scores.filter(s => s.tier === "legend").length,
    };
  },
};
