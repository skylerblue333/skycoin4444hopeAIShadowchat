import crypto from 'crypto';
/**
 * PHASE 34 — ECONOMIC CIVILIZATION LAYER
 * Creator labor markets, skill marketplaces, bounty boards, grant systems,
 * DAO funding pools, economic reputation, job boards, contract work,
 * project funding, community investment pools, economic governance,
 * platform-wide economic health monitoring.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type JobStatus = "open" | "in_progress" | "review" | "completed" | "cancelled" | "disputed";
export type BountyStatus = "open" | "claimed" | "submitted" | "approved" | "rejected" | "expired";
export type GrantStatus = "open" | "applied" | "under_review" | "approved" | "rejected" | "disbursed" | "completed";
export type DAOFundStatus = "active" | "paused" | "depleted" | "closed";
export type EconomicRole = "employer" | "worker" | "investor" | "grantee" | "grantor" | "bounty_hunter" | "dao_member";
export type ContractType = "fixed_price" | "hourly" | "milestone" | "revenue_share" | "equity";
export type SkillCategory = "development" | "design" | "marketing" | "content" | "moderation" | "research" | "legal" | "finance" | "other";

export interface JobListing {
  id: string;
  posterId: number;
  title: string;
  description: string;
  category: SkillCategory;
  contractType: ContractType;
  budget: number;
  currency: string;
  duration?: string;
  requiredSkills: string[];
  experienceLevel: "entry" | "mid" | "senior" | "expert";
  status: JobStatus;
  applicantCount: number;
  selectedWorkerId?: number;
  escrowAmount: number;
  isEscrowFunded: boolean;
  createdAt: Date;
  deadline?: Date;
  completedAt?: Date;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: number;
  coverLetter: string;
  proposedBudget: number;
  proposedDuration: string;
  portfolioLinks: string[];
  status: "pending" | "shortlisted" | "accepted" | "rejected" | "withdrawn";
  appliedAt: Date;
  respondedAt?: Date;
}

export interface Milestone {
  id: string;
  jobId: string;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: "pending" | "submitted" | "approved" | "rejected" | "paid";
  submittedAt?: Date;
  approvedAt?: Date;
  paidAt?: Date;
  deliverables: string[];
}

export interface BountyListing {
  id: string;
  posterId: number;
  title: string;
  description: string;
  category: SkillCategory;
  reward: number;
  currency: string;
  requirements: string[];
  status: BountyStatus;
  claimantId?: number;
  submissionUrl?: string;
  claimedAt?: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  maxClaims: number;
  currentClaims: number;
}

export interface GrantProgram {
  id: string;
  organizationId: number;
  name: string;
  description: string;
  totalBudget: number;
  remainingBudget: number;
  currency: string;
  maxGrantAmount: number;
  minGrantAmount: number;
  eligibilityCriteria: string[];
  categories: SkillCategory[];
  status: GrantStatus;
  applicationDeadline: Date;
  totalApplications: number;
  totalApproved: number;
  totalDisbursed: number;
  createdAt: Date;
}

export interface GrantApplication {
  id: string;
  programId: string;
  applicantId: number;
  projectTitle: string;
  projectDescription: string;
  requestedAmount: number;
  milestones: string[];
  teamSize: number;
  expectedImpact: string;
  status: GrantStatus;
  reviewScore?: number;
  reviewNotes?: string;
  approvedAmount?: number;
  disbursedAmount: number;
  appliedAt: Date;
  reviewedAt?: Date;
  disbursedAt?: Date;
}

export interface DAOFundingPool {
  id: string;
  daoId: string;
  name: string;
  description: string;
  totalBalance: number;
  currency: string;
  status: DAOFundStatus;
  contributorCount: number;
  totalContributed: number;
  totalDisbursed: number;
  votingThreshold: number;
  minContribution: number;
  governanceTokenRequired: number;
  createdAt: Date;
}

export interface DAOFundingProposal {
  id: string;
  poolId: string;
  proposerId: number;
  title: string;
  description: string;
  requestedAmount: number;
  beneficiaryId: number;
  milestones: string[];
  votesFor: number;
  votesAgainst: number;
  totalVotingPower: number;
  status: "voting" | "approved" | "rejected" | "executed" | "cancelled";
  votingEndsAt: Date;
  executedAt?: Date;
  createdAt: Date;
}

export interface EconomicReputationScore {
  userId: number;
  overallScore: number;
  components: {
    jobCompletionRate: number;
    onTimeDelivery: number;
    clientSatisfaction: number;
    disputeRate: number;
    paymentReliability: number;
    communityContribution: number;
  };
  totalJobsCompleted: number;
  totalEarned: number;
  totalSpent: number;
  activeContracts: number;
  level: "newcomer" | "established" | "professional" | "expert" | "elite";
  lastUpdatedAt: Date;
}

export interface SkillEndorsement {
  id: string;
  endorserId: number;
  endorseeId: number;
  skill: string;
  category: SkillCategory;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface EconomicHealthMetrics {
  timestamp: Date;
  totalActiveJobs: number;
  totalOpenBounties: number;
  totalActiveGrants: number;
  totalDAOPools: number;
  totalEconomicVolume: number;
  avgJobValue: number;
  avgBountyReward: number;
  jobCompletionRate: number;
  bountyClaimRate: number;
  grantApprovalRate: number;
  activeWorkers: number;
  activeEmployers: number;
  platformTake: number;
}

// ─── STATE ────────────────────────────────────────────────────────────────────

const _jobs = new Map<string, JobListing>();
const _applications = new Map<string, JobApplication>();
const _milestones = new Map<string, Milestone>();
const _bounties = new Map<string, BountyListing>();
const _grantPrograms = new Map<string, GrantProgram>();
const _grantApplications = new Map<string, GrantApplication>();
const _daoPools = new Map<string, DAOFundingPool>();
const _daoProposals = new Map<string, DAOFundingProposal>();
const _economicReputations = new Map<number, EconomicReputationScore>();
const _skillEndorsements = new Map<string, SkillEndorsement>();
const _healthMetricsHistory: EconomicHealthMetrics[] = [];

function _id(prefix: string): string {
  return `${prefix}_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 9)}`;
}

// ─── JOB MARKET ENGINE ────────────────────────────────────────────────────────

export const jobMarketEngine = {
  postJob(params: {
    posterId: number;
    title: string;
    description: string;
    category: SkillCategory;
    contractType: ContractType;
    budget: number;
    currency: string;
    requiredSkills: string[];
    experienceLevel: JobListing["experienceLevel"];
    duration?: string;
    deadline?: Date;
  }): JobListing {
    const job: JobListing = {
      id: _id("job"),
      posterId: params.posterId,
      title: params.title,
      description: params.description,
      category: params.category,
      contractType: params.contractType,
      budget: params.budget,
      currency: params.currency,
      duration: params.duration,
      requiredSkills: params.requiredSkills,
      experienceLevel: params.experienceLevel,
      status: "open",
      applicantCount: 0,
      escrowAmount: 0,
      isEscrowFunded: false,
      createdAt: new Date(),
      deadline: params.deadline,
    };
    _jobs.set(job.id, job);
    return job;
  },

  applyToJob(params: {
    jobId: string;
    applicantId: number;
    coverLetter: string;
    proposedBudget: number;
    proposedDuration: string;
    portfolioLinks?: string[];
  }): JobApplication | null {
    const job = _jobs.get(params.jobId);
    if (!job || job.status !== "open") return null;

    const application: JobApplication = {
      id: _id("app"),
      jobId: params.jobId,
      applicantId: params.applicantId,
      coverLetter: params.coverLetter,
      proposedBudget: params.proposedBudget,
      proposedDuration: params.proposedDuration,
      portfolioLinks: params.portfolioLinks ?? [],
      status: "pending",
      appliedAt: new Date(),
    };
    _applications.set(application.id, application);
    job.applicantCount++;
    return application;
  },

  selectWorker(jobId: string, applicationId: string): { job: JobListing; application: JobApplication } | null {
    const job = _jobs.get(jobId);
    const app = _applications.get(applicationId);
    if (!job || !app || app.jobId !== jobId) return null;

    job.status = "in_progress";
    job.selectedWorkerId = app.applicantId;
    job.escrowAmount = app.proposedBudget;
    job.isEscrowFunded = true;
    app.status = "accepted";
    app.respondedAt = new Date();

    // Reject all other applications
    for (const [, a] of _applications) {
      if (a.jobId === jobId && a.id !== applicationId && a.status === "pending") {
        a.status = "rejected";
        a.respondedAt = new Date();
      }
    }

    return { job, application: app };
  },

  addMilestone(params: {
    jobId: string;
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    deliverables?: string[];
  }): Milestone | null {
    const job = _jobs.get(params.jobId);
    if (!job) return null;

    const milestone: Milestone = {
      id: _id("ms"),
      jobId: params.jobId,
      title: params.title,
      description: params.description,
      amount: params.amount,
      dueDate: params.dueDate,
      status: "pending",
      deliverables: params.deliverables ?? [],
    };
    _milestones.set(milestone.id, milestone);
    return milestone;
  },

  submitMilestone(milestoneId: string, submissionUrl: string): Milestone | null {
    const ms = _milestones.get(milestoneId);
    if (!ms || ms.status !== "pending") return null;
    ms.status = "submitted";
    ms.submittedAt = new Date();
    ms.deliverables.push(submissionUrl);
    return ms;
  },

  approveMilestone(milestoneId: string): Milestone | null {
    const ms = _milestones.get(milestoneId);
    if (!ms || ms.status !== "submitted") return null;
    ms.status = "paid";
    ms.approvedAt = new Date();
    ms.paidAt = new Date();
    return ms;
  },

  completeJob(jobId: string): JobListing | null {
    const job = _jobs.get(jobId);
    if (!job || job.status !== "in_progress") return null;
    job.status = "completed";
    job.completedAt = new Date();
    // Update worker economic reputation
    if (job.selectedWorkerId) {
      economicReputationEngine.recordJobCompletion(job.selectedWorkerId, job.budget, true);
    }
    return job;
  },

  disputeJob(jobId: string): JobListing | null {
    const job = _jobs.get(jobId);
    if (!job) return null;
    job.status = "disputed";
    return job;
  },

  searchJobs(params: {
    category?: SkillCategory;
    maxBudget?: number;
    minBudget?: number;
    skills?: string[];
    experienceLevel?: JobListing["experienceLevel"];
    limit?: number;
  }): JobListing[] {
    let jobs = Array.from(_jobs.values()).filter(j => j.status === "open");
    if (params.category) jobs = jobs.filter(j => j.category === params.category);
    if (params.maxBudget) jobs = jobs.filter(j => j.budget <= params.maxBudget!);
    if (params.minBudget) jobs = jobs.filter(j => j.budget >= params.minBudget!);
    if (params.experienceLevel) jobs = jobs.filter(j => j.experienceLevel === params.experienceLevel);
    if (params.skills?.length) {
      jobs = jobs.filter(j => params.skills!.some(s => j.requiredSkills.includes(s)));
    }
    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, params.limit ?? 50);
  },

  getJobStats(): {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    disputed: number;
    totalVolume: number;
  } {
    const jobs = Array.from(_jobs.values());
    return {
      total: jobs.length,
      open: jobs.filter(j => j.status === "open").length,
      inProgress: jobs.filter(j => j.status === "in_progress").length,
      completed: jobs.filter(j => j.status === "completed").length,
      disputed: jobs.filter(j => j.status === "disputed").length,
      totalVolume: jobs.filter(j => j.status === "completed").reduce((s, j) => s + j.budget, 0),
    };
  },
};

// ─── BOUNTY BOARD ENGINE ──────────────────────────────────────────────────────

export const bountyBoardEngine = {
  postBounty(params: {
    posterId: number;
    title: string;
    description: string;
    category: SkillCategory;
    reward: number;
    currency: string;
    requirements: string[];
    expiresAt: Date;
    maxClaims?: number;
  }): BountyListing {
    const bounty: BountyListing = {
      id: _id("bounty"),
      posterId: params.posterId,
      title: params.title,
      description: params.description,
      category: params.category,
      reward: params.reward,
      currency: params.currency,
      requirements: params.requirements,
      status: "open",
      expiresAt: params.expiresAt,
      createdAt: new Date(),
      maxClaims: params.maxClaims ?? 1,
      currentClaims: 0,
    };
    _bounties.set(bounty.id, bounty);
    return bounty;
  },

  claimBounty(bountyId: string, claimantId: number): BountyListing | null {
    const bounty = _bounties.get(bountyId);
    if (!bounty || bounty.status !== "open") return null;
    if (bounty.currentClaims >= bounty.maxClaims) return null;
    if (bounty.expiresAt < new Date()) {
      bounty.status = "expired";
      return null;
    }

    bounty.claimantId = claimantId;
    bounty.status = "claimed";
    bounty.claimedAt = new Date();
    bounty.currentClaims++;
    return bounty;
  },

  submitBounty(bountyId: string, submissionUrl: string): BountyListing | null {
    const bounty = _bounties.get(bountyId);
    if (!bounty || bounty.status !== "claimed") return null;
    bounty.submissionUrl = submissionUrl;
    bounty.status = "submitted";
    bounty.submittedAt = new Date();
    return bounty;
  },

  approveBounty(bountyId: string): BountyListing | null {
    const bounty = _bounties.get(bountyId);
    if (!bounty || bounty.status !== "submitted") return null;
    bounty.status = "approved";
    bounty.approvedAt = new Date();
    if (bounty.claimantId) {
      economicReputationEngine.recordJobCompletion(bounty.claimantId, bounty.reward, true);
    }
    return bounty;
  },

  rejectBounty(bountyId: string): BountyListing | null {
    const bounty = _bounties.get(bountyId);
    if (!bounty || bounty.status !== "submitted") return null;
    bounty.status = "rejected";
    return bounty;
  },

  getOpenBounties(category?: SkillCategory, limit = 50): BountyListing[] {
    let bounties = Array.from(_bounties.values())
      .filter(b => b.status === "open" && b.expiresAt > new Date());
    if (category) bounties = bounties.filter(b => b.category === category);
    return bounties.sort((a, b) => b.reward - a.reward).slice(0, limit);
  },

  getBountyStats(): {
    total: number;
    open: number;
    claimed: number;
    approved: number;
    totalRewards: number;
  } {
    const bounties = Array.from(_bounties.values());
    return {
      total: bounties.length,
      open: bounties.filter(b => b.status === "open").length,
      claimed: bounties.filter(b => b.status === "claimed" || b.status === "submitted").length,
      approved: bounties.filter(b => b.status === "approved").length,
      totalRewards: bounties.filter(b => b.status === "approved").reduce((s, b) => s + b.reward, 0),
    };
  },
};

// ─── GRANT SYSTEM ENGINE ──────────────────────────────────────────────────────

export const grantSystemEngine = {
  createProgram(params: {
    organizationId: number;
    name: string;
    description: string;
    totalBudget: number;
    currency: string;
    maxGrantAmount: number;
    minGrantAmount: number;
    eligibilityCriteria: string[];
    categories: SkillCategory[];
    applicationDeadline: Date;
  }): GrantProgram {
    const program: GrantProgram = {
      id: _id("grant"),
      organizationId: params.organizationId,
      name: params.name,
      description: params.description,
      totalBudget: params.totalBudget,
      remainingBudget: params.totalBudget,
      currency: params.currency,
      maxGrantAmount: params.maxGrantAmount,
      minGrantAmount: params.minGrantAmount,
      eligibilityCriteria: params.eligibilityCriteria,
      categories: params.categories,
      status: "open",
      applicationDeadline: params.applicationDeadline,
      totalApplications: 0,
      totalApproved: 0,
      totalDisbursed: 0,
      createdAt: new Date(),
    };
    _grantPrograms.set(program.id, program);
    return program;
  },

  applyForGrant(params: {
    programId: string;
    applicantId: number;
    projectTitle: string;
    projectDescription: string;
    requestedAmount: number;
    milestones: string[];
    teamSize: number;
    expectedImpact: string;
  }): GrantApplication | null {
    const program = _grantPrograms.get(params.programId);
    if (!program || program.status !== "open") return null;
    if (params.requestedAmount > program.maxGrantAmount || params.requestedAmount < program.minGrantAmount) return null;
    if (program.applicationDeadline < new Date()) return null;

    const application: GrantApplication = {
      id: _id("gapp"),
      programId: params.programId,
      applicantId: params.applicantId,
      projectTitle: params.projectTitle,
      projectDescription: params.projectDescription,
      requestedAmount: params.requestedAmount,
      milestones: params.milestones,
      teamSize: params.teamSize,
      expectedImpact: params.expectedImpact,
      status: "applied",
      disbursedAmount: 0,
      appliedAt: new Date(),
    };
    _grantApplications.set(application.id, application);
    program.totalApplications++;
    return application;
  },

  reviewApplication(applicationId: string, score: number, notes: string, approved: boolean, approvedAmount?: number): GrantApplication | null {
    const app = _grantApplications.get(applicationId);
    if (!app || app.status !== "applied") return null;
    const program = _grantPrograms.get(app.programId);
    if (!program) return null;

    app.reviewScore = score;
    app.reviewNotes = notes;
    app.reviewedAt = new Date();

    if (approved) {
      app.status = "approved";
      app.approvedAmount = approvedAmount ?? app.requestedAmount;
      program.totalApproved++;
    } else {
      app.status = "rejected";
    }
    return app;
  },

  disburseGrant(applicationId: string): GrantApplication | null {
    const app = _grantApplications.get(applicationId);
    if (!app || app.status !== "approved") return null;
    const program = _grantPrograms.get(app.programId);
    if (!program) return null;

    const amount = app.approvedAmount ?? app.requestedAmount;
    if (program.remainingBudget < amount) return null;

    app.disbursedAmount = amount;
    app.status = "disbursed";
    app.disbursedAt = new Date();
    program.remainingBudget -= amount;
    program.totalDisbursed += amount;
    return app;
  },

  getOpenPrograms(): GrantProgram[] {
    return Array.from(_grantPrograms.values())
      .filter(p => p.status === "open" && p.applicationDeadline > new Date())
      .sort((a, b) => b.totalBudget - a.totalBudget);
  },

  getGrantStats(): {
    totalPrograms: number;
    totalBudget: number;
    totalDisbursed: number;
    totalApplications: number;
    approvalRate: number;
  } {
    const programs = Array.from(_grantPrograms.values());
    const apps = Array.from(_grantApplications.values());
    const approved = apps.filter(a => a.status === "approved" || a.status === "disbursed").length;
    return {
      totalPrograms: programs.length,
      totalBudget: programs.reduce((s, p) => s + p.totalBudget, 0),
      totalDisbursed: programs.reduce((s, p) => s + p.totalDisbursed, 0),
      totalApplications: apps.length,
      approvalRate: apps.length > 0 ? Math.round((approved / apps.length) * 100) : 0,
    };
  },
};

// ─── DAO FUNDING ENGINE ───────────────────────────────────────────────────────

export const daoFundingEngine = {
  createPool(params: {
    daoId: string;
    name: string;
    description: string;
    currency: string;
    votingThreshold: number;
    minContribution: number;
    governanceTokenRequired?: number;
  }): DAOFundingPool {
    const pool: DAOFundingPool = {
      id: _id("pool"),
      daoId: params.daoId,
      name: params.name,
      description: params.description,
      totalBalance: 0,
      currency: params.currency,
      status: "active",
      contributorCount: 0,
      totalContributed: 0,
      totalDisbursed: 0,
      votingThreshold: params.votingThreshold,
      minContribution: params.minContribution,
      governanceTokenRequired: params.governanceTokenRequired ?? 0,
      createdAt: new Date(),
    };
    _daoPools.set(pool.id, pool);
    return pool;
  },

  contribute(poolId: string, contributorId: number, amount: number): DAOFundingPool | null {
    const pool = _daoPools.get(poolId);
    if (!pool || pool.status !== "active") return null;
    if (amount < pool.minContribution) return null;

    pool.totalBalance += amount;
    pool.totalContributed += amount;
    pool.contributorCount++;
    return pool;
  },

  proposeDisbursal(params: {
    poolId: string;
    proposerId: number;
    title: string;
    description: string;
    requestedAmount: number;
    beneficiaryId: number;
    milestones: string[];
    votingDays?: number;
  }): DAOFundingProposal | null {
    const pool = _daoPools.get(params.poolId);
    if (!pool || pool.status !== "active") return null;
    if (params.requestedAmount > pool.totalBalance) return null;

    const votingEndsAt = new Date();
    votingEndsAt.setDate(votingEndsAt.getDate() + (params.votingDays ?? 7));

    const proposal: DAOFundingProposal = {
      id: _id("dprop"),
      poolId: params.poolId,
      proposerId: params.proposerId,
      title: params.title,
      description: params.description,
      requestedAmount: params.requestedAmount,
      beneficiaryId: params.beneficiaryId,
      milestones: params.milestones,
      votesFor: 0,
      votesAgainst: 0,
      totalVotingPower: 0,
      status: "voting",
      votingEndsAt,
      createdAt: new Date(),
    };
    _daoProposals.set(proposal.id, proposal);
    return proposal;
  },

  vote(proposalId: string, voterId: number, inFavor: boolean, votingPower: number): DAOFundingProposal | null {
    const proposal = _daoProposals.get(proposalId);
    if (!proposal || proposal.status !== "voting") return null;
    if (proposal.votingEndsAt < new Date()) {
      // Auto-finalize
      this.finalizeProposal(proposalId);
      return proposal;
    }

    if (inFavor) proposal.votesFor += votingPower;
    else proposal.votesAgainst += votingPower;
    proposal.totalVotingPower += votingPower;
    return proposal;
  },

  finalizeProposal(proposalId: string): DAOFundingProposal | null {
    const proposal = _daoProposals.get(proposalId);
    if (!proposal || proposal.status !== "voting") return null;
    const pool = _daoPools.get(proposal.poolId);
    if (!pool) return null;

    const approvalRate = proposal.totalVotingPower > 0
      ? proposal.votesFor / proposal.totalVotingPower
      : 0;

    if (approvalRate >= pool.votingThreshold) {
      proposal.status = "approved";
    } else {
      proposal.status = "rejected";
    }
    return proposal;
  },

  executeProposal(proposalId: string): DAOFundingProposal | null {
    const proposal = _daoProposals.get(proposalId);
    if (!proposal || proposal.status !== "approved") return null;
    const pool = _daoPools.get(proposal.poolId);
    if (!pool || pool.totalBalance < proposal.requestedAmount) return null;

    pool.totalBalance -= proposal.requestedAmount;
    pool.totalDisbursed += proposal.requestedAmount;
    proposal.status = "executed";
    proposal.executedAt = new Date();
    return proposal;
  },

  getPoolStats(): {
    totalPools: number;
    totalBalance: number;
    totalDisbursed: number;
    activeProposals: number;
  } {
    const pools = Array.from(_daoPools.values());
    const proposals = Array.from(_daoProposals.values());
    return {
      totalPools: pools.length,
      totalBalance: pools.reduce((s, p) => s + p.totalBalance, 0),
      totalDisbursed: pools.reduce((s, p) => s + p.totalDisbursed, 0),
      activeProposals: proposals.filter(p => p.status === "voting").length,
    };
  },
};

// ─── ECONOMIC REPUTATION ENGINE ───────────────────────────────────────────────

export const economicReputationEngine = {
  getOrCreate(userId: number): EconomicReputationScore {
    const existing = _economicReputations.get(userId);
    if (existing) return existing;
    const score: EconomicReputationScore = {
      userId,
      overallScore: 50,
      components: {
        jobCompletionRate: 100,
        onTimeDelivery: 100,
        clientSatisfaction: 50,
        disputeRate: 0,
        paymentReliability: 100,
        communityContribution: 0,
      },
      totalJobsCompleted: 0,
      totalEarned: 0,
      totalSpent: 0,
      activeContracts: 0,
      level: "newcomer",
      lastUpdatedAt: new Date(),
    };
    _economicReputations.set(userId, score);
    return score;
  },

  recordJobCompletion(userId: number, amount: number, onTime: boolean): EconomicReputationScore {
    const score = this.getOrCreate(userId);
    score.totalJobsCompleted++;
    score.totalEarned += amount;
    if (!onTime) {
      score.components.onTimeDelivery = Math.max(0,
        (score.components.onTimeDelivery * (score.totalJobsCompleted - 1)) / score.totalJobsCompleted
      );
    }
    score.components.jobCompletionRate = Math.min(100,
      score.components.jobCompletionRate * 0.9 + 10
    );
    this._recalculate(score);
    return score;
  },

  recordDispute(userId: number): EconomicReputationScore {
    const score = this.getOrCreate(userId);
    score.components.disputeRate = Math.min(100, score.components.disputeRate + 5);
    this._recalculate(score);
    return score;
  },

  recordClientRating(userId: number, rating: number): EconomicReputationScore {
    const score = this.getOrCreate(userId);
    score.components.clientSatisfaction = Math.round(
      score.components.clientSatisfaction * 0.8 + rating * 20 * 0.2
    );
    this._recalculate(score);
    return score;
  },

  _recalculate(score: EconomicReputationScore): void {
    score.overallScore = Math.round(
      score.components.jobCompletionRate * 0.25 +
      score.components.onTimeDelivery * 0.2 +
      score.components.clientSatisfaction * 0.2 +
      (100 - score.components.disputeRate) * 0.15 +
      score.components.paymentReliability * 0.1 +
      score.components.communityContribution * 0.1
    );

    score.level =
      score.overallScore >= 90 ? "elite" :
      score.overallScore >= 75 ? "expert" :
      score.overallScore >= 60 ? "professional" :
      score.overallScore >= 40 ? "established" : "newcomer";

    score.lastUpdatedAt = new Date();
  },

  getScore(userId: number): EconomicReputationScore | null {
    return _economicReputations.get(userId) ?? null;
  },

  getLeaderboard(limit = 20): EconomicReputationScore[] {
    return Array.from(_economicReputations.values())
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  },
};

// ─── SKILL ENDORSEMENT ENGINE ─────────────────────────────────────────────────

export const skillEndorsementEngine = {
  endorse(params: {
    endorserId: number;
    endorseeId: number;
    skill: string;
    category: SkillCategory;
    rating: number;
    comment?: string;
  }): SkillEndorsement {
    const endorsement: SkillEndorsement = {
      id: _id("endorse"),
      endorserId: params.endorserId,
      endorseeId: params.endorseeId,
      skill: params.skill,
      category: params.category,
      rating: Math.min(5, Math.max(1, params.rating)),
      comment: params.comment,
      isVerified: false,
      createdAt: new Date(),
    };
    _skillEndorsements.set(endorsement.id, endorsement);
    return endorsement;
  },

  getUserEndorsements(userId: number): SkillEndorsement[] {
    return Array.from(_skillEndorsements.values())
      .filter(e => e.endorseeId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getSkillRating(userId: number, skill: string): { avgRating: number; count: number } {
    const endorsements = Array.from(_skillEndorsements.values())
      .filter(e => e.endorseeId === userId && e.skill === skill);
    if (endorsements.length === 0) return { avgRating: 0, count: 0 };
    const avgRating = endorsements.reduce((s, e) => s + e.rating, 0) / endorsements.length;
    return { avgRating: Math.round(avgRating * 10) / 10, count: endorsements.length };
  },
};

// ─── ECONOMIC HEALTH MONITOR ──────────────────────────────────────────────────

export const economicHealthMonitor = {
  captureSnapshot(): EconomicHealthMetrics {
    const jobStats = jobMarketEngine.getJobStats();
    const bountyStats = bountyBoardEngine.getBountyStats();
    const grantStats = grantSystemEngine.getGrantStats();
    const daoStats = daoFundingEngine.getPoolStats();

    const totalJobs = jobStats.total;
    const avgJobValue = totalJobs > 0 ? jobStats.totalVolume / Math.max(jobStats.completed, 1) : 0;
    const openBounties = bountyStats.open;
    const avgBountyReward = bountyStats.total > 0 ? bountyStats.totalRewards / Math.max(bountyStats.approved, 1) : 0;

    const metrics: EconomicHealthMetrics = {
      timestamp: new Date(),
      totalActiveJobs: jobStats.open + jobStats.inProgress,
      totalOpenBounties: openBounties,
      totalActiveGrants: grantStats.totalPrograms,
      totalDAOPools: daoStats.totalPools,
      totalEconomicVolume: jobStats.totalVolume + bountyStats.totalRewards + grantStats.totalDisbursed + daoStats.totalDisbursed,
      avgJobValue,
      avgBountyReward,
      jobCompletionRate: totalJobs > 0 ? Math.round((jobStats.completed / totalJobs) * 100) : 0,
      bountyClaimRate: bountyStats.total > 0 ? Math.round(((bountyStats.claimed + bountyStats.approved) / bountyStats.total) * 100) : 0,
      grantApprovalRate: grantStats.approvalRate,
      activeWorkers: _economicReputations.size,
      activeEmployers: new Set(Array.from(_jobs.values()).map(j => j.posterId)).size,
      platformTake: jobStats.totalVolume * 0.05,
    };
    _healthMetricsHistory.push(metrics);
    return metrics;
  },

  getLatestSnapshot(): EconomicHealthMetrics | null {
    return _healthMetricsHistory[_healthMetricsHistory.length - 1] ?? null;
  },

  getHistoricalTrend(limit = 30): EconomicHealthMetrics[] {
    return _healthMetricsHistory.slice(-limit);
  },
};

// ─── ECONOMIC CIVILIZATION DASHBOARD ─────────────────────────────────────────

export const economicCivilizationDashboard = {
  getFullEconomicProfile(userId: number): {
    reputation: EconomicReputationScore | null;
    postedJobs: JobListing[];
    applications: JobApplication[];
    endorsements: SkillEndorsement[];
    bountyActivity: BountyListing[];
    grantApplications: GrantApplication[];
  } {
    return {
      reputation: economicReputationEngine.getScore(userId),
      postedJobs: Array.from(_jobs.values()).filter(j => j.posterId === userId),
      applications: Array.from(_applications.values()).filter(a => a.applicantId === userId),
      endorsements: skillEndorsementEngine.getUserEndorsements(userId),
      bountyActivity: Array.from(_bounties.values()).filter(b => b.claimantId === userId),
      grantApplications: Array.from(_grantApplications.values()).filter(a => a.applicantId === userId),
    };
  },

  getPlatformEconomicStats(): {
    jobs: ReturnType<typeof jobMarketEngine.getJobStats>;
    bounties: ReturnType<typeof bountyBoardEngine.getBountyStats>;
    grants: ReturnType<typeof grantSystemEngine.getGrantStats>;
    daoPools: ReturnType<typeof daoFundingEngine.getPoolStats>;
    healthSnapshot: EconomicHealthMetrics | null;
  } {
    return {
      jobs: jobMarketEngine.getJobStats(),
      bounties: bountyBoardEngine.getBountyStats(),
      grants: grantSystemEngine.getGrantStats(),
      daoPools: daoFundingEngine.getPoolStats(),
      healthSnapshot: economicHealthMonitor.getLatestSnapshot(),
    };
  },
};
