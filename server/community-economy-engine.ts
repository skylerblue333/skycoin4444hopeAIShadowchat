/**
 * COMMUNITY ECONOMY ENGINE
 *
 * Systems that turn communities into economic engines.
 *
 * Systems:
 * - CommunityTreasuryService: Multi-sig community treasuries with spending proposals
 * - TokenizedCommunityService: Community token issuance, distribution, and governance
 * - RewardPoolService: Automated reward distribution for community contributions
 * - CommunityQuestService: Quest system with XP, milestones, and rewards
 * - CommunityXPService: Experience points, levels, and progression ladders
 * - CommunityReputationService: Reputation scoring and trust tiers
 * - GuildStoreService: Community-operated stores with token-gated products
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CommunityTreasury {
  communityId: string;
  balance: number; // in platform coins
  tokenBalance: number; // in community tokens
  totalDeposited: number;
  totalWithdrawn: number;
  pendingProposals: number;
  signers: number[]; // user IDs who can approve spending
  requiredSignatures: number;
  createdAt: Date;
  lastActivityAt: Date;
}

export interface TreasuryTransaction {
  id: string;
  communityId: string;
  type: "deposit" | "withdrawal" | "reward_distribution" | "quest_payout" | "store_revenue";
  amount: number;
  tokenAmount?: number;
  fromUserId?: number;
  toUserId?: number;
  description: string;
  proposalId?: string;
  signatures: number[];
  status: "pending" | "approved" | "executed" | "rejected";
  createdAt: Date;
  executedAt?: Date;
}

export interface SpendingProposal {
  id: string;
  communityId: string;
  proposerId: number;
  title: string;
  description: string;
  amount: number;
  recipient: number; // userId
  category: "reward" | "event" | "infrastructure" | "charity" | "marketing" | "other";
  votes: { userId: number; approve: boolean; timestamp: Date }[];
  status: "voting" | "approved" | "rejected" | "executed";
  votingDeadline: Date;
  createdAt: Date;
}

export interface CommunityToken {
  communityId: string;
  symbol: string;
  name: string;
  totalSupply: number;
  circulatingSupply: number;
  holdersCount: number;
  priceInCoins: number; // exchange rate to platform coins
  isTransferable: boolean;
  isBurnable: boolean;
  mintingAuthority: "admin" | "dao" | "automated";
  createdAt: Date;
}

export interface TokenHolder {
  communityId: string;
  userId: number;
  balance: number;
  lockedBalance: number; // staked or vesting
  earnedFromQuests: number;
  earnedFromRewards: number;
  purchasedAmount: number;
  firstAcquiredAt: Date;
  lastTransactionAt: Date;
}

export interface RewardPool {
  id: string;
  communityId: string;
  name: string;
  totalFunds: number;
  distributedFunds: number;
  remainingFunds: number;
  rewardType: "coins" | "tokens" | "nft" | "badge";
  distributionRule: "equal" | "proportional" | "top_n" | "threshold";
  eligibilityCriteria: {
    minXP?: number;
    minReputation?: number;
    requiredRole?: string;
    activityRequirement?: string;
  };
  distributionSchedule: "weekly" | "monthly" | "on_trigger" | "manual";
  nextDistributionAt: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface CommunityQuest {
  id: string;
  communityId: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "monthly" | "one_time" | "chain";
  category: "content" | "engagement" | "social" | "trading" | "charity" | "gaming";
  objectives: QuestObjective[];
  rewards: QuestReward[];
  maxParticipants?: number;
  currentParticipants: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  completionCount: number;
  chainedQuestId?: string; // next quest in chain
}

export interface QuestObjective {
  id: string;
  description: string;
  metric: string; // e.g., "posts_created", "comments_made", "coins_donated"
  target: number;
  isOptional: boolean;
}

export interface QuestReward {
  type: "xp" | "coins" | "tokens" | "badge" | "role" | "nft";
  amount: number;
  itemId?: string;
  description: string;
}

export interface QuestProgress {
  questId: string;
  userId: number;
  communityId: string;
  startedAt: Date;
  completedAt?: Date;
  objectiveProgress: Record<string, number>; // objectiveId -> current value
  isCompleted: boolean;
  rewardsClaimed: boolean;
}

export interface CommunityXPRecord {
  userId: number;
  communityId: string;
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpHistory: { amount: number; reason: string; timestamp: Date }[];
  rank: number;
  title?: string;
}

export interface XPLevel {
  level: number;
  xpRequired: number;
  title: string;
  perks: string[];
  badge?: string;
}

export interface CommunityReputation {
  userId: number;
  communityId: string;
  score: number; // 0-1000
  tier: "newcomer" | "member" | "trusted" | "veteran" | "elder" | "legend";
  positiveActions: number;
  negativeActions: number;
  reportCount: number;
  endorsements: number;
  specializations: string[]; // areas of expertise
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface GuildStore {
  id: string;
  communityId: string;
  name: string;
  description: string;
  isTokenGated: boolean;
  minTokensRequired?: number;
  minReputationRequired?: number;
  products: GuildProduct[];
  totalRevenue: number;
  isActive: boolean;
  createdAt: Date;
}

export interface GuildProduct {
  id: string;
  storeId: string;
  name: string;
  description: string;
  type: "digital" | "service" | "nft" | "badge" | "role" | "content_access";
  priceCoins: number;
  priceTokens?: number;
  stock?: number; // null = unlimited
  sold: number;
  isActive: boolean;
  createdAt: Date;
}

// ─── XP LEVEL TABLE ───────────────────────────────────────────────────────────

const XP_LEVELS: XPLevel[] = [
  { level: 1, xpRequired: 0, title: "Newcomer", perks: ["Basic posting"], badge: "newcomer" },
  { level: 2, xpRequired: 100, title: "Member", perks: ["Create polls", "Join quests"], badge: "member" },
  { level: 3, xpRequired: 300, title: "Active Member", perks: ["Custom reactions", "Extended posts"], badge: "active" },
  { level: 4, xpRequired: 700, title: "Contributor", perks: ["Pin messages", "Create events"], badge: "contributor" },
  { level: 5, xpRequired: 1500, title: "Regular", perks: ["Slow mode bypass", "Priority support"], badge: "regular" },
  { level: 6, xpRequired: 3000, title: "Veteran", perks: ["Moderator nomination", "Custom title"], badge: "veteran" },
  { level: 7, xpRequired: 6000, title: "Elder", perks: ["Community proposals", "Treasury view"], badge: "elder" },
  { level: 8, xpRequired: 12000, title: "Legend", perks: ["All perks", "Honorary role", "Treasury vote"], badge: "legend" },
];

const XP_REWARDS: Record<string, number> = {
  post_created: 10,
  comment_made: 5,
  post_liked: 2,
  post_shared: 8,
  quest_completed: 50,
  stream_watched_30min: 15,
  donation_made: 20,
  new_member_referred: 100,
  collab_completed: 75,
  daily_login: 3,
};

// ─── COMMUNITY TREASURY SERVICE ───────────────────────────────────────────────

export class CommunityTreasuryService {
  private treasuries = new Map<string, CommunityTreasury>();
  private transactions = new Map<string, TreasuryTransaction[]>();
  private proposals = new Map<string, SpendingProposal>();
  private txCounter = 0;
  private propCounter = 0;

  async initializeTreasury(communityId: string, signers: number[], requiredSignatures = 2): Promise<CommunityTreasury> {
    const treasury: CommunityTreasury = {
      communityId,
      balance: 0,
      tokenBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      pendingProposals: 0,
      signers,
      requiredSignatures: Math.min(requiredSignatures, signers.length),
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };
    this.treasuries.set(communityId, treasury);
    return treasury;
  }

  async deposit(communityId: string, fromUserId: number, amount: number, description = "Deposit"): Promise<TreasuryTransaction> {
    const treasury = this.treasuries.get(communityId);
    if (!treasury) throw new Error("Treasury not found");

    treasury.balance += amount;
    treasury.totalDeposited += amount;
    treasury.lastActivityAt = new Date();

    const tx: TreasuryTransaction = {
      id: `tx_${++this.txCounter}`,
      communityId,
      type: "deposit",
      amount,
      fromUserId,
      description,
      signatures: [],
      status: "executed",
      createdAt: new Date(),
      executedAt: new Date(),
    };

    const txList = this.transactions.get(communityId) || [];
    txList.push(tx);
    this.transactions.set(communityId, txList);

    return tx;
  }

  async createSpendingProposal(params: {
    communityId: string;
    proposerId: number;
    title: string;
    description: string;
    amount: number;
    recipient: number;
    category: SpendingProposal["category"];
    votingDurationHours?: number;
  }): Promise<SpendingProposal> {
    const treasury = this.treasuries.get(params.communityId);
    if (!treasury) throw new Error("Treasury not found");
    if (treasury.balance < params.amount) throw new Error("Insufficient treasury balance");

    const proposal: SpendingProposal = {
      id: `prop_${++this.propCounter}`,
      communityId: params.communityId,
      proposerId: params.proposerId,
      title: params.title,
      description: params.description,
      amount: params.amount,
      recipient: params.recipient,
      category: params.category,
      votes: [],
      status: "voting",
      votingDeadline: new Date(Date.now() + (params.votingDurationHours || 72) * 3600000),
      createdAt: new Date(),
    };

    this.proposals.set(proposal.id, proposal);
    treasury.pendingProposals++;
    return proposal;
  }

  async voteOnProposal(proposalId: string, userId: number, approve: boolean): Promise<{ status: string; approvals: number; rejections: number }> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.status !== "voting") throw new Error("Voting closed");
    if (new Date() > proposal.votingDeadline) throw new Error("Voting deadline passed");

    const treasury = this.treasuries.get(proposal.communityId);
    if (!treasury) throw new Error("Treasury not found");

    // Remove existing vote from this user
    proposal.votes = proposal.votes.filter(v => v.userId !== userId);
    proposal.votes.push({ userId, approve, timestamp: new Date() });

    const approvals = proposal.votes.filter(v => v.approve).length;
    const rejections = proposal.votes.filter(v => !v.approve).length;
    const totalSigners = treasury.signers.length;

    // Check if threshold reached
    if (approvals >= treasury.requiredSignatures) {
      proposal.status = "approved";
      treasury.pendingProposals--;
    } else if (rejections > totalSigners - treasury.requiredSignatures) {
      proposal.status = "rejected";
      treasury.pendingProposals--;
    }

    return { status: proposal.status, approvals, rejections };
  }

  async executeProposal(proposalId: string): Promise<TreasuryTransaction | null> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== "approved") return null;

    const treasury = this.treasuries.get(proposal.communityId);
    if (!treasury || treasury.balance < proposal.amount) return null;

    treasury.balance -= proposal.amount;
    treasury.totalWithdrawn += proposal.amount;
    treasury.lastActivityAt = new Date();
    proposal.status = "executed";

    const tx: TreasuryTransaction = {
      id: `tx_${++this.txCounter}`,
      communityId: proposal.communityId,
      type: "withdrawal",
      amount: proposal.amount,
      toUserId: proposal.recipient,
      description: `Proposal: ${proposal.title}`,
      proposalId,
      signatures: proposal.votes.filter(v => v.approve).map(v => v.userId),
      status: "executed",
      createdAt: new Date(),
      executedAt: new Date(),
    };

    const txList = this.transactions.get(proposal.communityId) || [];
    txList.push(tx);
    this.transactions.set(proposal.communityId, txList);

    return tx;
  }

  getTreasury(communityId: string): CommunityTreasury | null {
    return this.treasuries.get(communityId) || null;
  }

  getTransactions(communityId: string, limit = 50): TreasuryTransaction[] {
    return (this.transactions.get(communityId) || [])
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  getProposals(communityId: string, status?: SpendingProposal["status"]): SpendingProposal[] {
    return Array.from(this.proposals.values())
      .filter(p => p.communityId === communityId && (!status || p.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

// ─── TOKENIZED COMMUNITY SERVICE ──────────────────────────────────────────────

export class TokenizedCommunityService {
  private tokens = new Map<string, CommunityToken>();
  private holders = new Map<string, TokenHolder>(); // `${communityId}:${userId}`
  private transferHistory = new Map<string, { from: number; to: number; amount: number; timestamp: Date }[]>();

  async createToken(params: {
    communityId: string;
    symbol: string;
    name: string;
    initialSupply: number;
    isTransferable?: boolean;
    isBurnable?: boolean;
    mintingAuthority?: CommunityToken["mintingAuthority"];
    priceInCoins?: number;
  }): Promise<CommunityToken> {
    if (this.tokens.has(params.communityId)) {
      throw new Error("Community already has a token");
    }

    const token: CommunityToken = {
      communityId: params.communityId,
      symbol: params.symbol.toUpperCase(),
      name: params.name,
      totalSupply: params.initialSupply,
      circulatingSupply: 0,
      holdersCount: 0,
      priceInCoins: params.priceInCoins || 1,
      isTransferable: params.isTransferable ?? true,
      isBurnable: params.isBurnable ?? false,
      mintingAuthority: params.mintingAuthority || "admin",
      createdAt: new Date(),
    };

    this.tokens.set(params.communityId, token);
    return token;
  }

  async mintTokens(communityId: string, toUserId: number, amount: number, reason: string): Promise<TokenHolder> {
    const token = this.tokens.get(communityId);
    if (!token) throw new Error("Token not found");
    if (token.circulatingSupply + amount > token.totalSupply) throw new Error("Exceeds total supply");

    const key = `${communityId}:${toUserId}`;
    const existing = this.holders.get(key);

    if (existing) {
      existing.balance += amount;
      existing.earnedFromRewards += amount;
      existing.lastTransactionAt = new Date();
    } else {
      this.holders.set(key, {
        communityId,
        userId: toUserId,
        balance: amount,
        lockedBalance: 0,
        earnedFromQuests: 0,
        earnedFromRewards: amount,
        purchasedAmount: 0,
        firstAcquiredAt: new Date(),
        lastTransactionAt: new Date(),
      });
      token.holdersCount++;
    }

    token.circulatingSupply += amount;
    return this.holders.get(key)!;
  }

  async transferTokens(communityId: string, fromUserId: number, toUserId: number, amount: number): Promise<boolean> {
    const token = this.tokens.get(communityId);
    if (!token || !token.isTransferable) throw new Error("Token not transferable");

    const fromKey = `${communityId}:${fromUserId}`;
    const fromHolder = this.holders.get(fromKey);
    if (!fromHolder || fromHolder.balance - fromHolder.lockedBalance < amount) {
      throw new Error("Insufficient balance");
    }

    fromHolder.balance -= amount;
    fromHolder.lastTransactionAt = new Date();

    const toKey = `${communityId}:${toUserId}`;
    const toHolder = this.holders.get(toKey);
    if (toHolder) {
      toHolder.balance += amount;
      toHolder.lastTransactionAt = new Date();
    } else {
      this.holders.set(toKey, {
        communityId,
        userId: toUserId,
        balance: amount,
        lockedBalance: 0,
        earnedFromQuests: 0,
        earnedFromRewards: 0,
        purchasedAmount: 0,
        firstAcquiredAt: new Date(),
        lastTransactionAt: new Date(),
      });
      token.holdersCount++;
    }

    const history = this.transferHistory.get(communityId) || [];
    history.push({ from: fromUserId, to: toUserId, amount, timestamp: new Date() });
    this.transferHistory.set(communityId, history);

    return true;
  }

  getToken(communityId: string): CommunityToken | null {
    return this.tokens.get(communityId) || null;
  }

  getHolder(communityId: string, userId: number): TokenHolder | null {
    return this.holders.get(`${communityId}:${userId}`) || null;
  }

  getTopHolders(communityId: string, limit = 20): TokenHolder[] {
    return Array.from(this.holders.values())
      .filter(h => h.communityId === communityId)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }
}

// ─── REWARD POOL SERVICE ──────────────────────────────────────────────────────

export class RewardPoolService {
  private pools = new Map<string, RewardPool>();
  private poolCounter = 0;
  private distributions = new Map<string, { userId: number; amount: number; timestamp: Date }[]>();

  async createPool(params: Omit<RewardPool, "id" | "distributedFunds" | "remainingFunds" | "createdAt">): Promise<RewardPool> {
    const id = `pool_${++this.poolCounter}`;
    const pool: RewardPool = {
      id,
      ...params,
      distributedFunds: 0,
      remainingFunds: params.totalFunds,
      createdAt: new Date(),
    };
    this.pools.set(id, pool);
    return pool;
  }

  async distributeRewards(poolId: string, recipients: { userId: number; contribution: number }[]): Promise<{ userId: number; amount: number }[]> {
    const pool = this.pools.get(poolId);
    if (!pool || !pool.isActive || pool.remainingFunds <= 0) return [];

    const distributions: { userId: number; amount: number }[] = [];
    const totalContribution = recipients.reduce((sum, r) => sum + r.contribution, 0);

    for (const recipient of recipients) {
      let amount = 0;

      switch (pool.distributionRule) {
        case "equal":
          amount = Math.floor(pool.remainingFunds / recipients.length);
          break;
        case "proportional":
          amount = totalContribution > 0
            ? Math.floor((recipient.contribution / totalContribution) * pool.remainingFunds * 0.9)
            : 0;
          break;
        case "top_n":
          // Only top 10 get rewards
          const rank = recipients
            .sort((a, b) => b.contribution - a.contribution)
            .findIndex(r => r.userId === recipient.userId);
          if (rank < 10) {
            amount = Math.floor(pool.remainingFunds / Math.min(10, recipients.length));
          }
          break;
        case "threshold":
          if (recipient.contribution >= (pool.eligibilityCriteria.minXP || 0)) {
            amount = Math.floor(pool.remainingFunds / recipients.length);
          }
          break;
      }

      if (amount > 0 && pool.remainingFunds >= amount) {
        pool.remainingFunds -= amount;
        pool.distributedFunds += amount;
        distributions.push({ userId: recipient.userId, amount });

        const distHistory = this.distributions.get(poolId) || [];
        distHistory.push({ userId: recipient.userId, amount, timestamp: new Date() });
        this.distributions.set(poolId, distHistory);
      }
    }

    return distributions;
  }

  getPool(poolId: string): RewardPool | null {
    return this.pools.get(poolId) || null;
  }

  getCommunityPools(communityId: string): RewardPool[] {
    return Array.from(this.pools.values())
      .filter(p => p.communityId === communityId && p.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

// ─── COMMUNITY QUEST SERVICE ──────────────────────────────────────────────────

export class CommunityQuestService {
  private quests = new Map<string, CommunityQuest>();
  private progress = new Map<string, QuestProgress>(); // `${questId}:${userId}`
  private questCounter = 0;

  async createQuest(params: Omit<CommunityQuest, "id" | "currentParticipants" | "completionCount">): Promise<CommunityQuest> {
    const id = `quest_${++this.questCounter}`;
    const quest: CommunityQuest = {
      id,
      ...params,
      currentParticipants: 0,
      completionCount: 0,
    };
    this.quests.set(id, quest);
    return quest;
  }

  async joinQuest(questId: string, userId: number): Promise<QuestProgress | null> {
    const quest = this.quests.get(questId);
    if (!quest || !quest.isActive) return null;
    if (quest.maxParticipants && quest.currentParticipants >= quest.maxParticipants) return null;
    if (new Date() > quest.endDate) return null;

    const key = `${questId}:${userId}`;
    if (this.progress.has(key)) return this.progress.get(key)!;

    const progress: QuestProgress = {
      questId,
      userId,
      communityId: quest.communityId,
      startedAt: new Date(),
      objectiveProgress: Object.fromEntries(quest.objectives.map(o => [o.id, 0])),
      isCompleted: false,
      rewardsClaimed: false,
    };

    this.progress.set(key, progress);
    quest.currentParticipants++;
    return progress;
  }

  async updateObjectiveProgress(questId: string, userId: number, objectiveId: string, value: number): Promise<{ progress: QuestProgress; newlyCompleted: boolean }> {
    const key = `${questId}:${userId}`;
    const progress = this.progress.get(key);
    if (!progress) throw new Error("Not participating in quest");

    const quest = this.quests.get(questId);
    if (!quest) throw new Error("Quest not found");

    progress.objectiveProgress[objectiveId] = value;

    // Check if all required objectives are complete
    const allRequired = quest.objectives
      .filter(o => !o.isOptional)
      .every(o => (progress.objectiveProgress[o.id] || 0) >= o.target);

    const wasCompleted = progress.isCompleted;
    if (allRequired && !wasCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
      quest.completionCount++;
    }

    return { progress, newlyCompleted: !wasCompleted && progress.isCompleted };
  }

  async claimRewards(questId: string, userId: number): Promise<QuestReward[]> {
    const key = `${questId}:${userId}`;
    const progress = this.progress.get(key);
    if (!progress || !progress.isCompleted || progress.rewardsClaimed) return [];

    const quest = this.quests.get(questId);
    if (!quest) return [];

    progress.rewardsClaimed = true;
    return quest.rewards;
  }

  getQuest(questId: string): CommunityQuest | null {
    return this.quests.get(questId) || null;
  }

  getCommunityQuests(communityId: string, activeOnly = true): CommunityQuest[] {
    return Array.from(this.quests.values())
      .filter(q => q.communityId === communityId && (!activeOnly || (q.isActive && new Date() <= q.endDate)))
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
  }

  getUserProgress(userId: number, communityId: string): QuestProgress[] {
    return Array.from(this.progress.values())
      .filter(p => p.userId === userId && p.communityId === communityId);
  }
}

// ─── COMMUNITY XP SERVICE ─────────────────────────────────────────────────────

export class CommunityXPService {
  private records = new Map<string, CommunityXPRecord>(); // `${communityId}:${userId}`

  private calculateLevel(totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number; title: string } {
    let level = 1;
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
      if (totalXP >= XP_LEVELS[i].xpRequired) {
        level = XP_LEVELS[i].level;
        break;
      }
    }

    const currentLevelData = XP_LEVELS[level - 1];
    const nextLevelData = XP_LEVELS[level] || XP_LEVELS[XP_LEVELS.length - 1];

    return {
      level,
      currentLevelXP: totalXP - currentLevelData.xpRequired,
      nextLevelXP: nextLevelData.xpRequired - currentLevelData.xpRequired,
      title: currentLevelData.title,
    };
  }

  async awardXP(communityId: string, userId: number, action: string, customAmount?: number): Promise<{ record: CommunityXPRecord; leveledUp: boolean; newLevel?: number }> {
    const amount = customAmount || XP_REWARDS[action] || 1;
    const key = `${communityId}:${userId}`;

    let record = this.records.get(key);
    const previousLevel = record ? record.level : 1;

    if (!record) {
      record = {
        userId,
        communityId,
        totalXP: 0,
        level: 1,
        currentLevelXP: 0,
        nextLevelXP: XP_LEVELS[1]?.xpRequired || 100,
        xpHistory: [],
        rank: 0,
      };
    }

    record.totalXP += amount;
    record.xpHistory.push({ amount, reason: action, timestamp: new Date() });
    if (record.xpHistory.length > 50) record.xpHistory.shift();

    const levelData = this.calculateLevel(record.totalXP);
    record.level = levelData.level;
    record.currentLevelXP = levelData.currentLevelXP;
    record.nextLevelXP = levelData.nextLevelXP;
    record.title = levelData.title;

    this.records.set(key, record);

    const leveledUp = record.level > previousLevel;
    return { record, leveledUp, newLevel: leveledUp ? record.level : undefined };
  }

  getRecord(communityId: string, userId: number): CommunityXPRecord | null {
    return this.records.get(`${communityId}:${userId}`) || null;
  }

  getLeaderboard(communityId: string, limit = 50): CommunityXPRecord[] {
    const records = Array.from(this.records.values())
      .filter(r => r.communityId === communityId)
      .sort((a, b) => b.totalXP - a.totalXP)
      .slice(0, limit);

    records.forEach((r, i) => { r.rank = i + 1; });
    return records;
  }

  getLevelPerks(level: number): string[] {
    return XP_LEVELS.find(l => l.level === level)?.perks || [];
  }
}

// ─── COMMUNITY REPUTATION SERVICE ────────────────────────────────────────────

export class CommunityReputationService {
  private reputations = new Map<string, CommunityReputation>(); // `${communityId}:${userId}`

  private getTier(score: number): CommunityReputation["tier"] {
    if (score >= 900) return "legend";
    if (score >= 700) return "elder";
    if (score >= 500) return "veteran";
    if (score >= 300) return "trusted";
    if (score >= 100) return "member";
    return "newcomer";
  }

  async initializeReputation(communityId: string, userId: number): Promise<CommunityReputation> {
    const key = `${communityId}:${userId}`;
    if (this.reputations.has(key)) return this.reputations.get(key)!;

    const rep: CommunityReputation = {
      userId,
      communityId,
      score: 50, // Starting score
      tier: "newcomer",
      positiveActions: 0,
      negativeActions: 0,
      reportCount: 0,
      endorsements: 0,
      specializations: [],
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    };

    this.reputations.set(key, rep);
    return rep;
  }

  async adjustReputation(communityId: string, userId: number, delta: number, reason: string): Promise<CommunityReputation> {
    const key = `${communityId}:${userId}`;
    let rep = this.reputations.get(key);

    if (!rep) {
      rep = await this.initializeReputation(communityId, userId);
    }

    rep.score = Math.max(0, Math.min(1000, rep.score + delta));
    rep.tier = this.getTier(rep.score);
    rep.lastActiveAt = new Date();

    if (delta > 0) rep.positiveActions++;
    else if (delta < 0) rep.negativeActions++;

    return rep;
  }

  async endorseUser(communityId: string, endorserId: number, targetUserId: number, specialization: string): Promise<CommunityReputation> {
    const rep = await this.adjustReputation(communityId, targetUserId, 10, `Endorsed by ${endorserId}`);
    rep.endorsements++;
    if (!rep.specializations.includes(specialization)) {
      rep.specializations.push(specialization);
    }
    return rep;
  }

  async reportUser(communityId: string, targetUserId: number): Promise<CommunityReputation> {
    const rep = await this.adjustReputation(communityId, targetUserId, -20, "Reported by community member");
    rep.reportCount++;
    return rep;
  }

  getReputation(communityId: string, userId: number): CommunityReputation | null {
    return this.reputations.get(`${communityId}:${userId}`) || null;
  }

  getTopReputation(communityId: string, limit = 20): CommunityReputation[] {
    return Array.from(this.reputations.values())
      .filter(r => r.communityId === communityId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// ─── GUILD STORE SERVICE ──────────────────────────────────────────────────────

export class GuildStoreService {
  private stores = new Map<string, GuildStore>();
  private products = new Map<string, GuildProduct>();
  private purchases = new Map<string, { userId: number; productId: number; timestamp: Date; pricePaid: number }[]>();
  private storeCounter = 0;
  private productCounter = 0;

  async createStore(params: Omit<GuildStore, "id" | "products" | "totalRevenue" | "createdAt">): Promise<GuildStore> {
    const id = `store_${++this.storeCounter}`;
    const store: GuildStore = {
      id,
      ...params,
      products: [],
      totalRevenue: 0,
      createdAt: new Date(),
    };
    this.stores.set(id, store);
    return store;
  }

  async addProduct(storeId: string, params: Omit<GuildProduct, "id" | "storeId" | "sold" | "createdAt">): Promise<GuildProduct> {
    const store = this.stores.get(storeId);
    if (!store) throw new Error("Store not found");

    const id = `prod_${++this.productCounter}`;
    const product: GuildProduct = {
      id,
      storeId,
      ...params,
      sold: 0,
      createdAt: new Date(),
    };

    this.products.set(id, product);
    store.products.push(product);
    return product;
  }

  async purchaseProduct(storeId: string, productId: string, userId: number, payWithTokens = false): Promise<{ success: boolean; product?: GuildProduct; reason?: string }> {
    const store = this.stores.get(storeId);
    const product = this.products.get(productId);

    if (!store || !product) return { success: false, reason: "Not found" };
    if (!product.isActive) return { success: false, reason: "Product not available" };
    if (product.stock !== undefined && product.stock !== null && product.sold >= product.stock) {
      return { success: false, reason: "Out of stock" };
    }

    const price = payWithTokens && product.priceTokens ? product.priceTokens : product.priceCoins;

    product.sold++;
    store.totalRevenue += product.priceCoins;

    const purchaseList = this.purchases.get(storeId) || [];
    purchaseList.push({ userId, productId: parseInt(productId), timestamp: new Date(), pricePaid: price });
    this.purchases.set(storeId, purchaseList);

    return { success: true, product };
  }

  getStore(storeId: string): GuildStore | null {
    return this.stores.get(storeId) || null;
  }

  getCommunityStore(communityId: string): GuildStore | null {
    return Array.from(this.stores.values()).find(s => s.communityId === communityId) || null;
  }

  getStoreProducts(storeId: string, activeOnly = true): GuildProduct[] {
    return Array.from(this.products.values())
      .filter(p => p.storeId === storeId && (!activeOnly || p.isActive));
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const communityTreasury = new CommunityTreasuryService();
export const tokenizedCommunity = new TokenizedCommunityService();
export const rewardPoolService = new RewardPoolService();
export const communityQuestService = new CommunityQuestService();
export const communityXPService = new CommunityXPService();
export const communityReputationService = new CommunityReputationService();
export const guildStoreService = new GuildStoreService();

// ─── ROUTER COMPATIBILITY METHOD ALIASES ─────────────────────────────────────
// CommunityTreasuryService aliases
(CommunityTreasuryService.prototype as any).getBalance = function(communityId: number) {
  return this.getTreasury(String(communityId)) || { communityId, balance: 0, currency: "SKY444" };
};
(CommunityTreasuryService.prototype as any).proposeSpend = function(communityId: number, userId: number, amount: number, purpose: string, description: string) {
  return this.createSpendingProposal({ communityId: String(communityId), proposerId: userId, amount, purpose: purpose as any, description, recipientId: String(userId) });
};
