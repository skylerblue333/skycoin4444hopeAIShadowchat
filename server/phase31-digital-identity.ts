import crypto from 'crypto';
/**
 * PHASE 31 — DIGITAL IDENTITY LAYER
 * Creator passports, reputation passports, wallet identity fusion,
 * social identity fusion, trust identity scoring, cross-platform verification,
 * proof-of-creator history, anti-sybil identity layer, profile NFTs,
 * creator badges, proof-of-history assets, social achievements, trust credentials.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type IdentityTier = "anonymous" | "basic" | "verified" | "sovereign" | "legendary";
export type VerificationMethod = "email" | "phone" | "kyc" | "social_oauth" | "wallet_sign" | "biometric" | "government_id";
export type BadgeCategory = "creator" | "contributor" | "governance" | "achievement" | "trust" | "legacy";
export type SybilRiskLevel = "none" | "low" | "medium" | "high" | "critical";
export type CredentialType = "trust" | "creator" | "governance" | "achievement" | "identity" | "skill";

export interface CreatorPassport {
  id: string;
  userId: number;
  passportNumber: string;
  tier: IdentityTier;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  coverUrl?: string;
  verificationMethods: VerificationMethod[];
  issuedAt: Date;
  renewedAt: Date;
  expiresAt?: Date;
  totalFollowers: number;
  totalPosts: number;
  totalEarnings: number;
  totalTips: number;
  totalDonations: number;
  reputationScore: number;
  trustScore: number;
  governanceParticipation: number;
  creatorScore: number;
  walletAddresses: string[];
  socialLinks: Record<string, string>;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  metadata: Record<string, unknown>;
}

export interface ReputationPassport {
  id: string;
  userId: number;
  overallScore: number;
  tier: IdentityTier;
  components: {
    contentQuality: number;
    communityStanding: number;
    governanceParticipation: number;
    economicContribution: number;
    trustworthiness: number;
    longevity: number;
  };
  positiveEvents: number;
  negativeEvents: number;
  totalInteractions: number;
  endorsements: number;
  reports: number;
  streakDays: number;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletIdentityFusion {
  id: string;
  userId: number;
  walletAddress: string;
  chain: string;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  signatureHash: string;
  totalTransactions: number;
  totalVolume: number;
  nftCount: number;
  stakingBalance: number;
  governanceVotes: number;
  linkedAt: Date;
  lastActivityAt: Date;
}

export interface SocialIdentityFusion {
  id: string;
  userId: number;
  platform: string;
  platformUserId: string;
  platformUsername: string;
  followerCount: number;
  isVerified: boolean;
  linkedAt: Date;
  lastSyncAt: Date;
  oauthToken?: string;
  metadata: Record<string, unknown>;
}

export interface TrustIdentityScore {
  userId: number;
  overallTrust: number;
  components: {
    identityVerification: number;
    behaviorHistory: number;
    socialGraph: number;
    economicHistory: number;
    governanceHistory: number;
    contentQuality: number;
  };
  riskFlags: string[];
  sybilRisk: SybilRiskLevel;
  lastCalculatedAt: Date;
  version: number;
}

export interface AntiSybilRecord {
  id: string;
  userId: number;
  checkType: "device_fingerprint" | "ip_cluster" | "behavior_pattern" | "social_graph" | "economic_pattern";
  riskScore: number;
  riskLevel: SybilRiskLevel;
  evidence: string[];
  relatedUserIds: number[];
  isConfirmed: boolean;
  reviewedBy?: number;
  reviewedAt?: Date;
  action?: "none" | "flag" | "restrict" | "ban";
  createdAt: Date;
}

export interface ProfileNFT {
  id: string;
  userId: number;
  tokenId: string;
  contractAddress: string;
  chain: string;
  name: string;
  description: string;
  imageUrl: string;
  animationUrl?: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  attributes: Array<{ trait_type: string; value: string | number }>;
  mintedAt: Date;
  isEquipped: boolean;
  isTransferable: boolean;
  mintPrice: number;
  currentValue: number;
}

export interface CreatorBadge {
  id: string;
  userId: number;
  category: BadgeCategory;
  name: string;
  description: string;
  iconUrl: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  criteria: string;
  earnedAt: Date;
  isVisible: boolean;
  xpValue: number;
  isRare: boolean;
  totalEarned: number;
}

export interface ProofOfHistoryAsset {
  id: string;
  userId: number;
  eventType: string;
  title: string;
  description: string;
  timestamp: Date;
  blockHash?: string;
  merkleProof?: string;
  verificationUrl?: string;
  isPublic: boolean;
  isImmutable: boolean;
  metadata: Record<string, unknown>;
}

export interface SocialAchievement {
  id: string;
  userId: number;
  achievementKey: string;
  title: string;
  description: string;
  iconUrl: string;
  category: string;
  xpReward: number;
  tokenReward: number;
  unlockedAt: Date;
  isRare: boolean;
  percentileRank: number;
}

export interface TrustCredential {
  id: string;
  issuerId: number;
  subjectId: number;
  credentialType: CredentialType;
  title: string;
  description: string;
  score: number;
  evidence: string[];
  issuedAt: Date;
  expiresAt?: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  signature: string;
}

// ─── STATE ────────────────────────────────────────────────────────────────────

const _passports = new Map<number, CreatorPassport>();
const _reputationPassports = new Map<number, ReputationPassport>();
const _walletFusions = new Map<string, WalletIdentityFusion>();
const _socialFusions = new Map<string, SocialIdentityFusion>();
const _trustScores = new Map<number, TrustIdentityScore>();
const _antiSybilRecords = new Map<string, AntiSybilRecord>();
const _profileNFTs = new Map<string, ProfileNFT>();
const _creatorBadges = new Map<string, CreatorBadge>();
const _proofAssets = new Map<string, ProofOfHistoryAsset>();
const _achievements = new Map<string, SocialAchievement>();
const _trustCredentials = new Map<string, TrustCredential>();

let _passportCounter = 1000000;

function _generatePassportNumber(): string {
  _passportCounter++;
  return `SKY-${_passportCounter.toString(16).toUpperCase().padStart(8, "0")}`;
}

function _generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 9)}`;
}

function _generateSignature(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
}

// ─── CREATOR PASSPORT ENGINE ──────────────────────────────────────────────────

export const creatorPassportEngine = {
  createPassport(params: {
    userId: number;
    displayName: string;
    bio: string;
    avatarUrl?: string;
  }): CreatorPassport {
    const passport: CreatorPassport = {
      id: _generateId("passport"),
      userId: params.userId,
      passportNumber: _generatePassportNumber(),
      tier: "basic",
      displayName: params.displayName,
      bio: params.bio,
      avatarUrl: params.avatarUrl,
      verificationMethods: [],
      issuedAt: new Date(),
      renewedAt: new Date(),
      totalFollowers: 0,
      totalPosts: 0,
      totalEarnings: 0,
      totalTips: 0,
      totalDonations: 0,
      reputationScore: 50,
      trustScore: 50,
      governanceParticipation: 0,
      creatorScore: 0,
      walletAddresses: [],
      socialLinks: {},
      isActive: true,
      isSuspended: false,
      metadata: {},
    };
    _passports.set(params.userId, passport);
    return passport;
  },

  getPassport(userId: number): CreatorPassport | null {
    return _passports.get(userId) ?? null;
  },

  addVerificationMethod(userId: number, method: VerificationMethod): CreatorPassport | null {
    const passport = _passports.get(userId);
    if (!passport) return null;
    if (!passport.verificationMethods.includes(method)) {
      passport.verificationMethods.push(method);
    }
    // Upgrade tier based on verification count
    const count = passport.verificationMethods.length;
    if (count >= 5) passport.tier = "legendary";
    else if (count >= 4) passport.tier = "sovereign";
    else if (count >= 3) passport.tier = "verified";
    else if (count >= 1) passport.tier = "basic";
    passport.renewedAt = new Date();
    return passport;
  },

  updateStats(userId: number, updates: Partial<Pick<CreatorPassport,
    "totalFollowers" | "totalPosts" | "totalEarnings" | "totalTips" |
    "totalDonations" | "reputationScore" | "trustScore" | "governanceParticipation" | "creatorScore"
  >>): CreatorPassport | null {
    const passport = _passports.get(userId);
    if (!passport) return null;
    Object.assign(passport, updates);
    // Recalculate tier based on creator score
    if (passport.creatorScore >= 10000) passport.tier = "legendary";
    else if (passport.creatorScore >= 5000) passport.tier = "sovereign";
    else if (passport.verificationMethods.length >= 2) passport.tier = "verified";
    return passport;
  },

  linkWallet(userId: number, walletAddress: string): CreatorPassport | null {
    const passport = _passports.get(userId);
    if (!passport) return null;
    if (!passport.walletAddresses.includes(walletAddress)) {
      passport.walletAddresses.push(walletAddress);
    }
    return passport;
  },

  suspendPassport(userId: number, reason: string): CreatorPassport | null {
    const passport = _passports.get(userId);
    if (!passport) return null;
    passport.isSuspended = true;
    passport.suspensionReason = reason;
    return passport;
  },

  reinstatePassport(userId: number): CreatorPassport | null {
    const passport = _passports.get(userId);
    if (!passport) return null;
    passport.isSuspended = false;
    passport.suspensionReason = undefined;
    passport.renewedAt = new Date();
    return passport;
  },

  getTopCreators(limit = 20): CreatorPassport[] {
    return Array.from(_passports.values())
      .filter(p => p.isActive && !p.isSuspended)
      .sort((a, b) => b.creatorScore - a.creatorScore)
      .slice(0, limit);
  },

  getPassportStats(): { total: number; byTier: Record<string, number>; verified: number } {
    const passports = Array.from(_passports.values());
    const byTier: Record<string, number> = {};
    let verified = 0;
    for (const p of passports) {
      byTier[p.tier] = (byTier[p.tier] ?? 0) + 1;
      if (p.verificationMethods.length > 0) verified++;
    }
    return { total: passports.length, byTier, verified };
  },
};

// ─── REPUTATION PASSPORT ENGINE ───────────────────────────────────────────────

export const reputationPassportEngine = {
  createOrUpdate(userId: number, events: {
    contentQuality?: number;
    communityStanding?: number;
    governanceParticipation?: number;
    economicContribution?: number;
    trustworthiness?: number;
    longevity?: number;
  }): ReputationPassport {
    const existing = _reputationPassports.get(userId);
    const components = existing ? { ...existing.components } : {
      contentQuality: 50,
      communityStanding: 50,
      governanceParticipation: 0,
      economicContribution: 0,
      trustworthiness: 50,
      longevity: 0,
    };

    // Apply delta updates (clamped 0–100)
    for (const [key, delta] of Object.entries(events)) {
      const k = key as keyof typeof components;
      components[k] = Math.min(100, Math.max(0, components[k] + (delta ?? 0)));
    }

    const overallScore = Math.round(
      components.contentQuality * 0.2 +
      components.communityStanding * 0.2 +
      components.governanceParticipation * 0.15 +
      components.economicContribution * 0.15 +
      components.trustworthiness * 0.2 +
      components.longevity * 0.1
    );

    let tier: IdentityTier = "anonymous";
    if (overallScore >= 90) tier = "legendary";
    else if (overallScore >= 75) tier = "sovereign";
    else if (overallScore >= 60) tier = "verified";
    else if (overallScore >= 30) tier = "basic";

    const passport: ReputationPassport = {
      id: existing?.id ?? _generateId("rep"),
      userId,
      overallScore,
      tier,
      components,
      positiveEvents: (existing?.positiveEvents ?? 0) + Object.values(events).filter(v => (v ?? 0) > 0).length,
      negativeEvents: (existing?.negativeEvents ?? 0) + Object.values(events).filter(v => (v ?? 0) < 0).length,
      totalInteractions: (existing?.totalInteractions ?? 0) + 1,
      endorsements: existing?.endorsements ?? 0,
      reports: existing?.reports ?? 0,
      streakDays: existing?.streakDays ?? 0,
      lastActivityAt: new Date(),
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    _reputationPassports.set(userId, passport);
    return passport;
  },

  getReputation(userId: number): ReputationPassport | null {
    return _reputationPassports.get(userId) ?? null;
  },

  addEndorsement(userId: number): ReputationPassport | null {
    const rep = _reputationPassports.get(userId);
    if (!rep) return null;
    rep.endorsements++;
    rep.components.trustworthiness = Math.min(100, rep.components.trustworthiness + 0.5);
    rep.updatedAt = new Date();
    return rep;
  },

  addReport(userId: number, reason: string): ReputationPassport | null {
    const rep = _reputationPassports.get(userId);
    if (!rep) return null;
    rep.reports++;
    rep.negativeEvents++;
    rep.components.communityStanding = Math.max(0, rep.components.communityStanding - 2);
    rep.updatedAt = new Date();
    return rep;
  },

  incrementStreak(userId: number): ReputationPassport | null {
    const rep = _reputationPassports.get(userId);
    if (!rep) return null;
    rep.streakDays++;
    rep.components.longevity = Math.min(100, rep.components.longevity + 0.1);
    rep.updatedAt = new Date();
    return rep;
  },

  getLeaderboard(limit = 20): ReputationPassport[] {
    return Array.from(_reputationPassports.values())
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  },
};

// ─── WALLET IDENTITY FUSION ENGINE ────────────────────────────────────────────

export const walletIdentityEngine = {
  linkWallet(params: {
    userId: number;
    walletAddress: string;
    chain: string;
    signatureHash: string;
    isPrimary?: boolean;
  }): WalletIdentityFusion {
    const key = `${params.userId}:${params.walletAddress}`;
    const fusion: WalletIdentityFusion = {
      id: _generateId("wif"),
      userId: params.userId,
      walletAddress: params.walletAddress,
      chain: params.chain,
      isPrimary: params.isPrimary ?? false,
      isVerified: true,
      verifiedAt: new Date(),
      signatureHash: params.signatureHash,
      totalTransactions: 0,
      totalVolume: 0,
      nftCount: 0,
      stakingBalance: 0,
      governanceVotes: 0,
      linkedAt: new Date(),
      lastActivityAt: new Date(),
    };
    _walletFusions.set(key, fusion);
    // Also link in passport
    creatorPassportEngine.linkWallet(params.userId, params.walletAddress);
    return fusion;
  },

  getWallets(userId: number): WalletIdentityFusion[] {
    return Array.from(_walletFusions.values()).filter(w => w.userId === userId);
  },

  updateWalletStats(userId: number, walletAddress: string, updates: Partial<Pick<WalletIdentityFusion,
    "totalTransactions" | "totalVolume" | "nftCount" | "stakingBalance" | "governanceVotes"
  >>): WalletIdentityFusion | null {
    const key = `${userId}:${walletAddress}`;
    const fusion = _walletFusions.get(key);
    if (!fusion) return null;
    Object.assign(fusion, updates);
    fusion.lastActivityAt = new Date();
    return fusion;
  },

  setPrimary(userId: number, walletAddress: string): WalletIdentityFusion | null {
    // Unset all primaries for this user
    for (const [, fusion] of _walletFusions) {
      if (fusion.userId === userId) fusion.isPrimary = false;
    }
    const key = `${userId}:${walletAddress}`;
    const fusion = _walletFusions.get(key);
    if (!fusion) return null;
    fusion.isPrimary = true;
    return fusion;
  },

  getWalletStats(): { totalLinked: number; byChain: Record<string, number>; totalVolume: number } {
    const fusions = Array.from(_walletFusions.values());
    const byChain: Record<string, number> = {};
    let totalVolume = 0;
    for (const f of fusions) {
      byChain[f.chain] = (byChain[f.chain] ?? 0) + 1;
      totalVolume += f.totalVolume;
    }
    return { totalLinked: fusions.length, byChain, totalVolume };
  },
};

// ─── SOCIAL IDENTITY FUSION ENGINE ────────────────────────────────────────────

export const socialIdentityEngine = {
  linkSocial(params: {
    userId: number;
    platform: string;
    platformUserId: string;
    platformUsername: string;
    followerCount: number;
  }): SocialIdentityFusion {
    const key = `${params.userId}:${params.platform}`;
    const fusion: SocialIdentityFusion = {
      id: _generateId("sif"),
      userId: params.userId,
      platform: params.platform,
      platformUserId: params.platformUserId,
      platformUsername: params.platformUsername,
      followerCount: params.followerCount,
      isVerified: true,
      linkedAt: new Date(),
      lastSyncAt: new Date(),
      metadata: {},
    };
    _socialFusions.set(key, fusion);
    return fusion;
  },

  getSocialLinks(userId: number): SocialIdentityFusion[] {
    return Array.from(_socialFusions.values()).filter(s => s.userId === userId);
  },

  syncPlatform(userId: number, platform: string, followerCount: number): SocialIdentityFusion | null {
    const key = `${userId}:${platform}`;
    const fusion = _socialFusions.get(key);
    if (!fusion) return null;
    fusion.followerCount = followerCount;
    fusion.lastSyncAt = new Date();
    return fusion;
  },

  getTotalReach(userId: number): number {
    return Array.from(_socialFusions.values())
      .filter(s => s.userId === userId)
      .reduce((sum, s) => sum + s.followerCount, 0);
  },
};

// ─── TRUST IDENTITY SCORING ENGINE ────────────────────────────────────────────

export const trustIdentityEngine = {
  calculateScore(userId: number): TrustIdentityScore {
    const passport = creatorPassportEngine.getPassport(userId);
    const reputation = reputationPassportEngine.getReputation(userId);
    const wallets = walletIdentityEngine.getWallets(userId);
    const socials = socialIdentityEngine.getSocialLinks(userId);

    const identityVerification = Math.min(100,
      (passport?.verificationMethods.length ?? 0) * 20 +
      (wallets.length > 0 ? 20 : 0) +
      (socials.length > 0 ? 10 : 0)
    );

    const behaviorHistory = reputation?.components.communityStanding ?? 50;
    const socialGraph = Math.min(100, (socials.reduce((s, f) => s + f.followerCount, 0) / 1000));
    const economicHistory = Math.min(100, wallets.reduce((s, w) => s + w.totalVolume, 0) / 100);
    const governanceHistory = Math.min(100, (passport?.governanceParticipation ?? 0) * 10);
    const contentQuality = reputation?.components.contentQuality ?? 50;

    const overallTrust = Math.round(
      identityVerification * 0.25 +
      behaviorHistory * 0.2 +
      socialGraph * 0.1 +
      economicHistory * 0.15 +
      governanceHistory * 0.1 +
      contentQuality * 0.2
    );

    const riskFlags: string[] = [];
    if (wallets.length === 0) riskFlags.push("no_wallet_linked");
    if ((passport?.verificationMethods.length ?? 0) === 0) riskFlags.push("unverified_identity");
    if ((reputation?.reports ?? 0) > 5) riskFlags.push("high_report_count");

    const sybilRisk: SybilRiskLevel = riskFlags.length >= 3 ? "high" :
      riskFlags.length >= 2 ? "medium" :
      riskFlags.length >= 1 ? "low" : "none";

    const score: TrustIdentityScore = {
      userId,
      overallTrust,
      components: {
        identityVerification,
        behaviorHistory,
        socialGraph,
        economicHistory,
        governanceHistory,
        contentQuality,
      },
      riskFlags,
      sybilRisk,
      lastCalculatedAt: new Date(),
      version: (_trustScores.get(userId)?.version ?? 0) + 1,
    };
    _trustScores.set(userId, score);
    return score;
  },

  getScore(userId: number): TrustIdentityScore | null {
    return _trustScores.get(userId) ?? null;
  },

  getHighTrustUsers(minScore = 70, limit = 50): TrustIdentityScore[] {
    return Array.from(_trustScores.values())
      .filter(s => s.overallTrust >= minScore)
      .sort((a, b) => b.overallTrust - a.overallTrust)
      .slice(0, limit);
  },
};

// ─── ANTI-SYBIL ENGINE ────────────────────────────────────────────────────────

export const antiSybilEngine = {
  runCheck(params: {
    userId: number;
    checkType: AntiSybilRecord["checkType"];
    evidence: string[];
    relatedUserIds?: number[];
  }): AntiSybilRecord {
    // Compute risk score based on evidence count and related users
    const evidenceScore = Math.min(100, params.evidence.length * 15);
    const relatedScore = Math.min(50, (params.relatedUserIds?.length ?? 0) * 10);
    const riskScore = (evidenceScore + relatedScore) / 2;

    const riskLevel: SybilRiskLevel =
      riskScore >= 80 ? "critical" :
      riskScore >= 60 ? "high" :
      riskScore >= 40 ? "medium" :
      riskScore >= 20 ? "low" : "none";

    const record: AntiSybilRecord = {
      id: _generateId("sybil"),
      userId: params.userId,
      checkType: params.checkType,
      riskScore,
      riskLevel,
      evidence: params.evidence,
      relatedUserIds: params.relatedUserIds ?? [],
      isConfirmed: false,
      action: riskLevel === "critical" ? "ban" :
              riskLevel === "high" ? "restrict" :
              riskLevel === "medium" ? "flag" : "none",
      createdAt: new Date(),
    };
    _antiSybilRecords.set(record.id, record);
    return record;
  },

  reviewRecord(recordId: string, reviewerId: number, isConfirmed: boolean, action: AntiSybilRecord["action"]): AntiSybilRecord | null {
    const record = _antiSybilRecords.get(recordId);
    if (!record) return null;
    record.isConfirmed = isConfirmed;
    record.reviewedBy = reviewerId;
    record.reviewedAt = new Date();
    record.action = action;
    return record;
  },

  getUserRisk(userId: number): { riskLevel: SybilRiskLevel; records: AntiSybilRecord[] } {
    const records = Array.from(_antiSybilRecords.values()).filter(r => r.userId === userId);
    const maxRisk = records.reduce((max, r) => {
      const levels: SybilRiskLevel[] = ["none", "low", "medium", "high", "critical"];
      return levels.indexOf(r.riskLevel) > levels.indexOf(max) ? r.riskLevel : max;
    }, "none" as SybilRiskLevel);
    return { riskLevel: maxRisk, records };
  },

  getHighRiskUsers(limit = 50): AntiSybilRecord[] {
    return Array.from(_antiSybilRecords.values())
      .filter(r => r.riskLevel === "high" || r.riskLevel === "critical")
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);
  },

  getSybilStats(): { total: number; byRisk: Record<string, number>; confirmed: number } {
    const records = Array.from(_antiSybilRecords.values());
    const byRisk: Record<string, number> = {};
    let confirmed = 0;
    for (const r of records) {
      byRisk[r.riskLevel] = (byRisk[r.riskLevel] ?? 0) + 1;
      if (r.isConfirmed) confirmed++;
    }
    return { total: records.length, byRisk, confirmed };
  },
};

// ─── PROFILE NFT ENGINE ───────────────────────────────────────────────────────

export const profileNFTEngine = {
  mint(params: {
    userId: number;
    name: string;
    description: string;
    imageUrl: string;
    rarity?: ProfileNFT["rarity"];
    attributes?: ProfileNFT["attributes"];
    mintPrice?: number;
  }): ProfileNFT {
    const nft: ProfileNFT = {
      id: _generateId("pnft"),
      userId: params.userId,
      tokenId: `${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 9)}`,
      contractAddress: "0xSKYCOIN4444_PROFILE_NFT",
      chain: "skycoin",
      name: params.name,
      description: params.description,
      imageUrl: params.imageUrl,
      rarity: params.rarity ?? "common",
      attributes: params.attributes ?? [],
      mintedAt: new Date(),
      isEquipped: false,
      isTransferable: true,
      mintPrice: params.mintPrice ?? 0,
      currentValue: params.mintPrice ?? 0,
    };
    _profileNFTs.set(nft.id, nft);
    return nft;
  },

  equip(nftId: string, userId: number): ProfileNFT | null {
    // Unequip all other NFTs for this user
    for (const [, nft] of _profileNFTs) {
      if (nft.userId === userId) nft.isEquipped = false;
    }
    const nft = _profileNFTs.get(nftId);
    if (!nft || nft.userId !== userId) return null;
    nft.isEquipped = true;
    return nft;
  },

  getUserNFTs(userId: number): ProfileNFT[] {
    return Array.from(_profileNFTs.values()).filter(n => n.userId === userId);
  },

  getEquipped(userId: number): ProfileNFT | null {
    return Array.from(_profileNFTs.values()).find(n => n.userId === userId && n.isEquipped) ?? null;
  },

  updateValue(nftId: string, newValue: number): ProfileNFT | null {
    const nft = _profileNFTs.get(nftId);
    if (!nft) return null;
    nft.currentValue = newValue;
    return nft;
  },
};

// ─── CREATOR BADGE ENGINE ─────────────────────────────────────────────────────

export const creatorBadgeEngine = {
  award(params: {
    userId: number;
    category: BadgeCategory;
    name: string;
    description: string;
    iconUrl: string;
    tier: CreatorBadge["tier"];
    criteria: string;
    xpValue: number;
    isRare?: boolean;
  }): CreatorBadge {
    const badge: CreatorBadge = {
      id: _generateId("badge"),
      userId: params.userId,
      category: params.category,
      name: params.name,
      description: params.description,
      iconUrl: params.iconUrl,
      tier: params.tier,
      criteria: params.criteria,
      earnedAt: new Date(),
      isVisible: true,
      xpValue: params.xpValue,
      isRare: params.isRare ?? false,
      totalEarned: 1,
    };
    _creatorBadges.set(badge.id, badge);
    return badge;
  },

  getUserBadges(userId: number): CreatorBadge[] {
    return Array.from(_creatorBadges.values())
      .filter(b => b.userId === userId)
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
  },

  toggleVisibility(badgeId: string): CreatorBadge | null {
    const badge = _creatorBadges.get(badgeId);
    if (!badge) return null;
    badge.isVisible = !badge.isVisible;
    return badge;
  },

  getBadgeStats(): { total: number; byCategory: Record<string, number>; rare: number } {
    const badges = Array.from(_creatorBadges.values());
    const byCategory: Record<string, number> = {};
    let rare = 0;
    for (const b of badges) {
      byCategory[b.category] = (byCategory[b.category] ?? 0) + 1;
      if (b.isRare) rare++;
    }
    return { total: badges.length, byCategory, rare };
  },
};

// ─── PROOF OF HISTORY ENGINE ──────────────────────────────────────────────────

export const proofOfHistoryEngine = {
  record(params: {
    userId: number;
    eventType: string;
    title: string;
    description: string;
    isPublic?: boolean;
    metadata?: Record<string, unknown>;
  }): ProofOfHistoryAsset {
    const asset: ProofOfHistoryAsset = {
      id: _generateId("poh"),
      userId: params.userId,
      eventType: params.eventType,
      title: params.title,
      description: params.description,
      timestamp: new Date(),
      blockHash: _generateSignature(`${params.userId}:${params.eventType}:${Date.now()}`).slice(0, 66),
      merkleProof: _generateSignature(`merkle:${params.userId}:${Date.now()}`).slice(0, 66),
      isPublic: params.isPublic ?? true,
      isImmutable: true,
      metadata: params.metadata ?? {},
    };
    _proofAssets.set(asset.id, asset);
    return asset;
  },

  getUserHistory(userId: number, isPublicOnly = false): ProofOfHistoryAsset[] {
    return Array.from(_proofAssets.values())
      .filter(a => a.userId === userId && (!isPublicOnly || a.isPublic))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  verifyAsset(assetId: string): { isValid: boolean; asset: ProofOfHistoryAsset | null } {
    const asset = _proofAssets.get(assetId);
    if (!asset) return { isValid: false, asset: null };
    // Verify immutability flag and block hash presence
    const isValid = asset.isImmutable && !!asset.blockHash;
    return { isValid, asset };
  },
};

// ─── SOCIAL ACHIEVEMENT ENGINE ────────────────────────────────────────────────

export const socialAchievementEngine = {
  unlock(params: {
    userId: number;
    achievementKey: string;
    title: string;
    description: string;
    iconUrl: string;
    category: string;
    xpReward: number;
    tokenReward: number;
    isRare?: boolean;
    percentileRank?: number;
  }): SocialAchievement {
    const achievement: SocialAchievement = {
      id: _generateId("ach"),
      userId: params.userId,
      achievementKey: params.achievementKey,
      title: params.title,
      description: params.description,
      iconUrl: params.iconUrl,
      category: params.category,
      xpReward: params.xpReward,
      tokenReward: params.tokenReward,
      unlockedAt: new Date(),
      isRare: params.isRare ?? false,
      percentileRank: params.percentileRank ?? 50,
    };
    _achievements.set(achievement.id, achievement);
    return achievement;
  },

  getUserAchievements(userId: number): SocialAchievement[] {
    return Array.from(_achievements.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
  },

  hasAchievement(userId: number, achievementKey: string): boolean {
    return Array.from(_achievements.values()).some(
      a => a.userId === userId && a.achievementKey === achievementKey
    );
  },

  getAchievementStats(): { total: number; byCategory: Record<string, number>; rare: number } {
    const achievements = Array.from(_achievements.values());
    const byCategory: Record<string, number> = {};
    let rare = 0;
    for (const a of achievements) {
      byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
      if (a.isRare) rare++;
    }
    return { total: achievements.length, byCategory, rare };
  },
};

// ─── TRUST CREDENTIAL ENGINE ──────────────────────────────────────────────────

export const trustCredentialEngine = {
  issue(params: {
    issuerId: number;
    subjectId: number;
    credentialType: CredentialType;
    title: string;
    description: string;
    score: number;
    evidence: string[];
    expiresAt?: Date;
  }): TrustCredential {
    const data = `${params.issuerId}:${params.subjectId}:${params.credentialType}:${Date.now()}`;
    const credential: TrustCredential = {
      id: _generateId("cred"),
      issuerId: params.issuerId,
      subjectId: params.subjectId,
      credentialType: params.credentialType,
      title: params.title,
      description: params.description,
      score: params.score,
      evidence: params.evidence,
      issuedAt: new Date(),
      expiresAt: params.expiresAt,
      isRevoked: false,
      signature: _generateSignature(data),
    };
    _trustCredentials.set(credential.id, credential);
    return credential;
  },

  revoke(credentialId: string, reason: string): TrustCredential | null {
    const cred = _trustCredentials.get(credentialId);
    if (!cred) return null;
    cred.isRevoked = true;
    cred.revokedAt = new Date();
    cred.revokedReason = reason;
    return cred;
  },

  getUserCredentials(userId: number, includeRevoked = false): TrustCredential[] {
    return Array.from(_trustCredentials.values())
      .filter(c => c.subjectId === userId && (includeRevoked || !c.isRevoked))
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
  },

  getIssuedCredentials(issuerId: number): TrustCredential[] {
    return Array.from(_trustCredentials.values())
      .filter(c => c.issuerId === issuerId)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
  },

  verifyCredential(credentialId: string): { isValid: boolean; credential: TrustCredential | null } {
    const cred = _trustCredentials.get(credentialId);
    if (!cred) return { isValid: false, credential: null };
    const isExpired = cred.expiresAt ? cred.expiresAt < new Date() : false;
    return { isValid: !cred.isRevoked && !isExpired, credential: cred };
  },

  getCredentialStats(): { total: number; byType: Record<string, number>; revoked: number } {
    const creds = Array.from(_trustCredentials.values());
    const byType: Record<string, number> = {};
    let revoked = 0;
    for (const c of creds) {
      byType[c.credentialType] = (byType[c.credentialType] ?? 0) + 1;
      if (c.isRevoked) revoked++;
    }
    return { total: creds.length, byType, revoked };
  },
};

// ─── IDENTITY DASHBOARD ───────────────────────────────────────────────────────

export const identityDashboard = {
  getFullIdentityProfile(userId: number): {
    passport: CreatorPassport | null;
    reputation: ReputationPassport | null;
    trustScore: TrustIdentityScore | null;
    wallets: WalletIdentityFusion[];
    socials: SocialIdentityFusion[];
    nfts: ProfileNFT[];
    badges: CreatorBadge[];
    achievements: SocialAchievement[];
    credentials: TrustCredential[];
    proofHistory: ProofOfHistoryAsset[];
    sybilRisk: { riskLevel: SybilRiskLevel; records: AntiSybilRecord[] };
  } {
    return {
      passport: creatorPassportEngine.getPassport(userId),
      reputation: reputationPassportEngine.getReputation(userId),
      trustScore: trustIdentityEngine.getScore(userId),
      wallets: walletIdentityEngine.getWallets(userId),
      socials: socialIdentityEngine.getSocialLinks(userId),
      nfts: profileNFTEngine.getUserNFTs(userId),
      badges: creatorBadgeEngine.getUserBadges(userId),
      achievements: socialAchievementEngine.getUserAchievements(userId),
      credentials: trustCredentialEngine.getUserCredentials(userId),
      proofHistory: proofOfHistoryEngine.getUserHistory(userId),
      sybilRisk: antiSybilEngine.getUserRisk(userId),
    };
  },

  getPlatformIdentityStats(): {
    totalPassports: number;
    totalVerified: number;
    totalWallets: number;
    totalSocials: number;
    totalNFTs: number;
    totalBadges: number;
    totalAchievements: number;
    totalCredentials: number;
    sybilStats: ReturnType<typeof antiSybilEngine.getSybilStats>;
  } {
    return {
      totalPassports: _passports.size,
      totalVerified: Array.from(_passports.values()).filter(p => p.verificationMethods.length > 0).length,
      totalWallets: _walletFusions.size,
      totalSocials: _socialFusions.size,
      totalNFTs: _profileNFTs.size,
      totalBadges: _creatorBadges.size,
      totalAchievements: _achievements.size,
      totalCredentials: _trustCredentials.size,
      sybilStats: antiSybilEngine.getSybilStats(),
    };
  },
};
