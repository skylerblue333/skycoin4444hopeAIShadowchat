/**
 * CHARITY NETWORK EFFECTS ENGINE
 *
 * Systems that make giving viral and transparent.
 *
 * Systems:
 * - CharityVerificationService: Campaign verification, org vetting, impact scoring
 * - DonationCompetitionService: Charity challenges, donation battles, matching campaigns
 * - ImpactDashboardService: Real-time impact metrics, milestone tracking, beneficiary stories
 * - DonorRewardService: NFT badges, donor tiers, exclusive perks for giving
 * - PublicTransparencyService: On-chain donation tracking, wallet transparency, audit trails
 * - CharityDAOService: Community voting on fund allocation, grant proposals
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface VerifiedCharity {
  id: string;
  name: string;
  description: string;
  mission: string;
  category: "education" | "health" | "environment" | "poverty" | "animals" | "disaster_relief" | "arts" | "research" | "community" | "other";
  registrationNumber?: string;
  country: string;
  website?: string;
  walletAddress: string;
  verificationStatus: "pending" | "verified" | "suspended" | "rejected";
  verificationTier: "basic" | "standard" | "platinum";
  impactScore: number; // 0-100
  totalRaised: number;
  donorCount: number;
  projectCount: number;
  transparencyScore: number; // 0-100 based on reporting
  createdAt: Date;
  verifiedAt?: Date;
}

export interface CharityCampaign {
  id: string;
  charityId: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  donorCount: number;
  startDate: Date;
  endDate: Date;
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  category: VerifiedCharity["category"];
  images: string[];
  updates: CampaignUpdate[];
  milestones: CampaignMilestone[];
  beneficiaries: string;
  impactMetrics: ImpactMetric[];
  matchingEnabled: boolean;
  matchingMultiplier?: number;
  matchingCap?: number;
  matchingRaised?: number;
  featuredUntil?: Date;
  createdAt: Date;
}

export interface CampaignUpdate {
  id: string;
  title: string;
  content: string;
  images?: string[];
  publishedAt: Date;
  authorId: number;
}

export interface CampaignMilestone {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  reachedAt?: Date;
  rewardDescription?: string;
}

export interface ImpactMetric {
  label: string;
  value: number;
  unit: string;
  description: string;
  verifiedAt?: Date;
}

export interface Donation {
  id: string;
  campaignId: string;
  charityId: string;
  donorId: number;
  amount: number;
  isAnonymous: boolean;
  message?: string;
  transactionHash?: string;
  matchedAmount: number;
  rewardId?: string;
  createdAt: Date;
}

export interface DonationCompetition {
  id: string;
  title: string;
  description: string;
  type: "leaderboard" | "team_battle" | "challenge" | "matching_race";
  campaignIds: string[];
  startDate: Date;
  endDate: Date;
  prizePool: number;
  prizeDistribution: { rank: number; amount: number; description: string }[];
  participants: CompetitionParticipant[];
  teams?: CompetitionTeam[];
  status: "upcoming" | "active" | "completed";
  totalRaised: number;
  createdAt: Date;
}

export interface CompetitionParticipant {
  userId: number;
  displayName: string;
  totalDonated: number;
  rank: number;
  teamId?: string;
  joinedAt: Date;
}

export interface CompetitionTeam {
  id: string;
  name: string;
  captainId: number;
  memberIds: number[];
  totalDonated: number;
  rank: number;
}

export interface DonorReward {
  id: string;
  donorId: number;
  type: "nft_badge" | "platform_badge" | "exclusive_role" | "merchandise" | "experience" | "recognition";
  name: string;
  description: string;
  imageUrl?: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  campaignId?: string;
  totalDonatedAtEarn: number;
  earnedAt: Date;
  claimedAt?: Date;
  isClaimed: boolean;
  tokenId?: string; // NFT token ID if applicable
}

export interface DonorProfile {
  userId: number;
  totalDonated: number;
  donationCount: number;
  campaignsSupported: number;
  charitiesSupported: number;
  tier: "supporter" | "contributor" | "champion" | "hero" | "legend";
  rewards: DonorReward[];
  impactSummary: { label: string; value: string }[];
  isPublic: boolean;
  joinedAt: Date;
  lastDonationAt?: Date;
}

export interface TransparencyReport {
  charityId: string;
  period: string; // e.g., "2024-Q1"
  totalReceived: number;
  totalSpent: number;
  breakdown: { category: string; amount: number; percentage: number; description: string }[];
  walletTransactions: { hash: string; amount: number; recipient: string; purpose: string; date: Date }[];
  impactAchieved: ImpactMetric[];
  auditedBy?: string;
  publishedAt: Date;
}

export interface GrantProposal {
  id: string;
  charityId: string;
  title: string;
  description: string;
  requestedAmount: number;
  approvedAmount?: number;
  impact: string;
  timeline: string;
  status: "draft" | "submitted" | "voting" | "approved" | "rejected" | "funded";
  votes: { userId: number; approve: boolean; timestamp: Date }[];
  votingDeadline?: Date;
  createdAt: Date;
  fundedAt?: Date;
}

// ─── CHARITY VERIFICATION SERVICE ────────────────────────────────────────────

export class CharityVerificationService {
  private charities = new Map<string, VerifiedCharity>();
  private charityCounter = 0;

  async registerCharity(params: Omit<VerifiedCharity, "id" | "verificationStatus" | "verificationTier" | "impactScore" | "totalRaised" | "donorCount" | "projectCount" | "transparencyScore" | "createdAt">): Promise<VerifiedCharity> {
    const id = `charity_${++this.charityCounter}`;
    const charity: VerifiedCharity = {
      id,
      ...params,
      verificationStatus: "pending",
      verificationTier: "basic",
      impactScore: 0,
      totalRaised: 0,
      donorCount: 0,
      projectCount: 0,
      transparencyScore: 0,
      createdAt: new Date(),
    };
    this.charities.set(id, charity);
    return charity;
  }

  async verifyCharity(charityId: string, tier: VerifiedCharity["verificationTier"]): Promise<VerifiedCharity | null> {
    const charity = this.charities.get(charityId);
    if (!charity) return null;

    charity.verificationStatus = "verified";
    charity.verificationTier = tier;
    charity.verifiedAt = new Date();
    charity.transparencyScore = tier === "platinum" ? 90 : tier === "standard" ? 70 : 50;

    return charity;
  }

  async updateImpactScore(charityId: string, score: number): Promise<void> {
    const charity = this.charities.get(charityId);
    if (charity) charity.impactScore = Math.min(100, Math.max(0, score));
  }

  async recordDonation(charityId: string, amount: number): Promise<void> {
    const charity = this.charities.get(charityId);
    if (charity) {
      charity.totalRaised += amount;
      charity.donorCount++;
    }
  }

  getCharity(charityId: string): VerifiedCharity | null {
    return this.charities.get(charityId) || null;
  }

  getVerifiedCharities(category?: VerifiedCharity["category"]): VerifiedCharity[] {
    return Array.from(this.charities.values())
      .filter(c => c.verificationStatus === "verified" && (!category || c.category === category))
      .sort((a, b) => b.impactScore - a.impactScore);
  }

  searchCharities(query: string): VerifiedCharity[] {
    const q = query.toLowerCase();
    return Array.from(this.charities.values())
      .filter(c => c.verificationStatus === "verified" &&
        (c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.mission.toLowerCase().includes(q)))
      .sort((a, b) => b.impactScore - a.impactScore);
  }
}

// ─── DONATION COMPETITION SERVICE ────────────────────────────────────────────

export class DonationCompetitionService {
  private competitions = new Map<string, DonationCompetition>();
  private competitionCounter = 0;

  async createCompetition(params: Omit<DonationCompetition, "id" | "participants" | "status" | "totalRaised" | "createdAt">): Promise<DonationCompetition> {
    const id = `comp_${++this.competitionCounter}`;
    const competition: DonationCompetition = {
      id,
      ...params,
      participants: [],
      status: new Date() < params.startDate ? "upcoming" : "active",
      totalRaised: 0,
      createdAt: new Date(),
    };
    this.competitions.set(id, competition);
    return competition;
  }

  async joinCompetition(competitionId: string, userId: number, displayName: string, teamId?: string): Promise<CompetitionParticipant> {
    const competition = this.competitions.get(competitionId);
    if (!competition || competition.status === "completed") throw new Error("Competition not joinable");

    const existing = competition.participants.find(p => p.userId === userId);
    if (existing) return existing;

    const participant: CompetitionParticipant = {
      userId,
      displayName,
      totalDonated: 0,
      rank: competition.participants.length + 1,
      teamId,
      joinedAt: new Date(),
    };

    competition.participants.push(participant);
    return participant;
  }

  async recordCompetitionDonation(competitionId: string, userId: number, amount: number): Promise<void> {
    const competition = this.competitions.get(competitionId);
    if (!competition) return;

    const participant = competition.participants.find(p => p.userId === userId);
    if (participant) {
      participant.totalDonated += amount;
      competition.totalRaised += amount;

      // Update team total if applicable
      if (participant.teamId && competition.teams) {
        const team = competition.teams.find(t => t.id === participant.teamId);
        if (team) team.totalDonated += amount;
      }

      // Recalculate ranks
      const sorted = [...competition.participants].sort((a, b) => b.totalDonated - a.totalDonated);
      sorted.forEach((p, i) => { p.rank = i + 1; });

      if (competition.teams) {
        const teamsSorted = [...competition.teams].sort((a, b) => b.totalDonated - a.totalDonated);
        teamsSorted.forEach((t, i) => { t.rank = i + 1; });
      }
    }
  }

  async completeCompetition(competitionId: string): Promise<{ winners: CompetitionParticipant[]; prizes: { userId: number; amount: number }[] }> {
    const competition = this.competitions.get(competitionId);
    if (!competition) throw new Error("Competition not found");

    competition.status = "completed";
    const winners = competition.participants.slice(0, competition.prizeDistribution.length);
    const prizes = winners.map((w, i) => ({
      userId: w.userId,
      amount: competition.prizeDistribution[i]?.amount || 0,
    }));

    return { winners, prizes };
  }

  getCompetition(competitionId: string): DonationCompetition | null {
    return this.competitions.get(competitionId) || null;
  }

  getActiveCompetitions(): DonationCompetition[] {
    return Array.from(this.competitions.values())
      .filter(c => c.status === "active")
      .sort((a, b) => b.totalRaised - a.totalRaised);
  }

  getLeaderboard(competitionId: string, limit = 20): CompetitionParticipant[] {
    const competition = this.competitions.get(competitionId);
    if (!competition) return [];
    return competition.participants
      .sort((a, b) => b.totalDonated - a.totalDonated)
      .slice(0, limit);
  }
}

// ─── IMPACT DASHBOARD SERVICE ─────────────────────────────────────────────────

export class ImpactDashboardService {
  private campaigns = new Map<string, CharityCampaign>();
  private donations = new Map<string, Donation[]>(); // campaignId -> donations
  private campaignCounter = 0;
  private donationCounter = 0;

  async createCampaign(params: Omit<CharityCampaign, "id" | "raisedAmount" | "donorCount" | "updates" | "createdAt">): Promise<CharityCampaign> {
    const id = `campaign_${++this.campaignCounter}`;
    const campaign: CharityCampaign = {
      id,
      ...params,
      raisedAmount: 0,
      donorCount: 0,
      updates: [],
      createdAt: new Date(),
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async recordDonation(params: Omit<Donation, "id" | "matchedAmount" | "createdAt">): Promise<Donation> {
    const campaign = this.campaigns.get(params.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status !== "active") throw new Error("Campaign not active");

    let matchedAmount = 0;
    if (campaign.matchingEnabled && campaign.matchingMultiplier) {
      const remainingMatch = (campaign.matchingCap || Infinity) - (campaign.matchingRaised || 0);
      matchedAmount = Math.min(params.amount * (campaign.matchingMultiplier - 1), remainingMatch);
      campaign.matchingRaised = (campaign.matchingRaised || 0) + matchedAmount;
    }

    const donation: Donation = {
      id: `don_${++this.donationCounter}`,
      ...params,
      matchedAmount,
      createdAt: new Date(),
    };

    const donationList = this.donations.get(params.campaignId) || [];
    donationList.push(donation);
    this.donations.set(params.campaignId, donationList);

    campaign.raisedAmount += params.amount + matchedAmount;
    campaign.donorCount++;

    // Check milestones
    for (const milestone of campaign.milestones) {
      if (!milestone.reachedAt && campaign.raisedAmount >= milestone.targetAmount) {
        milestone.reachedAt = new Date();
      }
    }

    // Check if goal reached
    if (campaign.raisedAmount >= campaign.goalAmount) {
      campaign.status = "completed";
    }

    return donation;
  }

  async addCampaignUpdate(campaignId: string, update: Omit<CampaignUpdate, "id">): Promise<CampaignUpdate> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const id = `upd_${Date.now()}`;
    const newUpdate: CampaignUpdate = { id, ...update };
    campaign.updates.push(newUpdate);
    return newUpdate;
  }

  async updateImpactMetrics(campaignId: string, metrics: ImpactMetric[]): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) campaign.impactMetrics = metrics;
  }

  getCampaign(campaignId: string): CharityCampaign | null {
    return this.campaigns.get(campaignId) || null;
  }

  getCampaignDonations(campaignId: string, limit = 50): Donation[] {
    return (this.donations.get(campaignId) || [])
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  getActiveCampaigns(category?: VerifiedCharity["category"]): CharityCampaign[] {
    return Array.from(this.campaigns.values())
      .filter(c => c.status === "active" && (!category || c.category === category))
      .sort((a, b) => b.raisedAmount - a.raisedAmount);
  }

  getPlatformImpactStats(): {
    totalRaised: number;
    totalDonors: number;
    activeCampaigns: number;
    completedCampaigns: number;
    topCampaign?: CharityCampaign;
  } {
    const all = Array.from(this.campaigns.values());
    const active = all.filter(c => c.status === "active");
    const completed = all.filter(c => c.status === "completed");
    const totalRaised = all.reduce((sum, c) => sum + c.raisedAmount, 0);
    const totalDonors = all.reduce((sum, c) => sum + c.donorCount, 0);
    const topCampaign = all.sort((a, b) => b.raisedAmount - a.raisedAmount)[0];

    return {
      totalRaised,
      totalDonors,
      activeCampaigns: active.length,
      completedCampaigns: completed.length,
      topCampaign,
    };
  }
}

// ─── DONOR REWARD SERVICE ─────────────────────────────────────────────────────

export class DonorRewardService {
  private profiles = new Map<number, DonorProfile>();
  private rewards = new Map<string, DonorReward>();
  private rewardCounter = 0;

  private TIER_THRESHOLDS = {
    supporter: 0,
    contributor: 50,
    champion: 250,
    hero: 1000,
    legend: 5000,
  };

  private getTier(totalDonated: number): DonorProfile["tier"] {
    if (totalDonated >= this.TIER_THRESHOLDS.legend) return "legend";
    if (totalDonated >= this.TIER_THRESHOLDS.hero) return "hero";
    if (totalDonated >= this.TIER_THRESHOLDS.champion) return "champion";
    if (totalDonated >= this.TIER_THRESHOLDS.contributor) return "contributor";
    return "supporter";
  }

  private getRewardTier(totalDonated: number): DonorReward["tier"] {
    if (totalDonated >= 5000) return "diamond";
    if (totalDonated >= 1000) return "platinum";
    if (totalDonated >= 250) return "gold";
    if (totalDonated >= 50) return "silver";
    return "bronze";
  }

  async recordDonation(userId: number, amount: number, campaignId: string): Promise<{ profile: DonorProfile; newReward?: DonorReward }> {
    let profile = this.profiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        totalDonated: 0,
        donationCount: 0,
        campaignsSupported: 0,
        charitiesSupported: 0,
        tier: "supporter",
        rewards: [],
        impactSummary: [],
        isPublic: true,
        joinedAt: new Date(),
      };
    }

    const previousTier = profile.tier;
    profile.totalDonated += amount;
    profile.donationCount++;
    profile.campaignsSupported++;
    profile.tier = this.getTier(profile.totalDonated);
    profile.lastDonationAt = new Date();

    this.profiles.set(userId, profile);

    // Check for new reward
    let newReward: DonorReward | undefined;
    if (profile.tier !== previousTier) {
      newReward = await this.issueReward(userId, profile.totalDonated, campaignId);
      if (newReward) profile.rewards.push(newReward);
    }

    return { profile, newReward };
  }

  async issueReward(userId: number, totalDonated: number, campaignId?: string): Promise<DonorReward> {
    const tier = this.getRewardTier(totalDonated);
    const tierNames = { bronze: "Bronze Heart", silver: "Silver Star", gold: "Gold Crown", platinum: "Platinum Angel", diamond: "Diamond Champion" };

    const id = `reward_${++this.rewardCounter}`;
    const reward: DonorReward = {
      id,
      donorId: userId,
      type: "nft_badge",
      name: tierNames[tier],
      description: `Awarded for donating $${totalDonated}+ to platform charities`,
      tier,
      campaignId,
      totalDonatedAtEarn: totalDonated,
      earnedAt: new Date(),
      isClaimed: false,
    };

    this.rewards.set(id, reward);
    return reward;
  }

  async claimReward(rewardId: string, userId: number): Promise<DonorReward | null> {
    const reward = this.rewards.get(rewardId);
    if (!reward || reward.donorId !== userId || reward.isClaimed) return null;

    reward.isClaimed = true;
    reward.claimedAt = new Date();
    reward.tokenId = `nft_${Date.now()}_${userId}`;
    return reward;
  }

  getDonorProfile(userId: number): DonorProfile | null {
    return this.profiles.get(userId) || null;
  }

  getTopDonors(limit = 20): DonorProfile[] {
    return Array.from(this.profiles.values())
      .filter(p => p.isPublic)
      .sort((a, b) => b.totalDonated - a.totalDonated)
      .slice(0, limit);
  }
}

// ─── PUBLIC TRANSPARENCY SERVICE ──────────────────────────────────────────────

export class PublicTransparencyService {
  private reports = new Map<string, TransparencyReport[]>(); // charityId -> reports
  private grantProposals = new Map<string, GrantProposal>();
  private proposalCounter = 0;

  async publishTransparencyReport(report: TransparencyReport): Promise<void> {
    const reports = this.reports.get(report.charityId) || [];
    reports.push(report);
    this.reports.set(report.charityId, reports);
  }

  async createGrantProposal(params: Omit<GrantProposal, "id" | "votes" | "status" | "createdAt">): Promise<GrantProposal> {
    const id = `grant_${++this.proposalCounter}`;
    const proposal: GrantProposal = {
      id,
      ...params,
      votes: [],
      status: "submitted",
      createdAt: new Date(),
    };
    this.grantProposals.set(id, proposal);
    return proposal;
  }

  async voteOnGrant(proposalId: string, userId: number, approve: boolean): Promise<GrantProposal | null> {
    const proposal = this.grantProposals.get(proposalId);
    if (!proposal || proposal.status !== "voting") return null;

    proposal.votes = proposal.votes.filter(v => v.userId !== userId);
    proposal.votes.push({ userId, approve, timestamp: new Date() });

    const approvals = proposal.votes.filter(v => v.approve).length;
    const rejections = proposal.votes.filter(v => !v.approve).length;

    if (approvals >= 10) proposal.status = "approved";
    else if (rejections >= 10) proposal.status = "rejected";

    return proposal;
  }

  async fundGrant(proposalId: string, amount: number): Promise<GrantProposal | null> {
    const proposal = this.grantProposals.get(proposalId);
    if (!proposal || proposal.status !== "approved") return null;

    proposal.approvedAmount = amount;
    proposal.status = "funded";
    proposal.fundedAt = new Date();
    return proposal;
  }

  getCharityReports(charityId: string): TransparencyReport[] {
    return (this.reports.get(charityId) || [])
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  getGrantProposals(status?: GrantProposal["status"]): GrantProposal[] {
    return Array.from(this.grantProposals.values())
      .filter(p => !status || p.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getPlatformTransparencyScore(): number {
    const allReports = Array.from(this.reports.values()).flat();
    if (allReports.length === 0) return 0;

    // Score based on reporting frequency and completeness
    const avgBreakdownItems = allReports.reduce((sum, r) => sum + r.breakdown.length, 0) / allReports.length;
    const avgTransactions = allReports.reduce((sum, r) => sum + r.walletTransactions.length, 0) / allReports.length;

    return Math.min(100, Math.round((avgBreakdownItems * 5) + (avgTransactions * 2)));
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const charityVerificationService = new CharityVerificationService();
export const donationCompetitionService = new DonationCompetitionService();
export const impactDashboardService = new ImpactDashboardService();
export const donorRewardService = new DonorRewardService();
export const publicTransparencyService = new PublicTransparencyService();
