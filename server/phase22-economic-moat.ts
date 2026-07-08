import crypto from 'crypto';
/**
 * PHASE 22 — ECONOMIC MOAT ENGINE
 * Token Utility Expansion, Liquidity Systems, NFT Utility Layer
 * Goal: Make economy inseparable from user behavior.
 */

// ─── TOKEN UTILITY TYPES ─────────────────────────────────────────────────────

export interface TokenUtilityAction {
  id: string;
  actionType: "tip" | "governance_vote" | "marketplace_purchase" | "community_boost" | "ad_credit" | "premium_boost" | "staking_reward" | "nft_mint" | "subscription_payment" | "charity_donation";
  userId: number;
  amount: number;
  currency: "SKY444" | "GOV_SKY" | "CREATOR_SKY";
  targetId?: string;
  targetType?: "creator" | "community" | "post" | "nft" | "campaign";
  txHash?: string;
  status: "pending" | "confirmed" | "failed" | "reversed";
  createdAt: Date;
  confirmedAt?: Date;
}

export interface GovernanceToken {
  tokenId: string;
  holderId: number;
  balance: number;
  lockedBalance: number;
  votingPower: number;
  delegatedTo?: number;
  delegatedFrom: number[];
  lastVotedAt?: Date;
  createdAt: Date;
}

export interface GovernanceProposal {
  id: string;
  proposerId: number;
  title: string;
  description: string;
  proposalType: "fee_change" | "feature_add" | "treasury_spend" | "token_policy" | "community_rule" | "partnership";
  status: "active" | "passed" | "rejected" | "executed" | "cancelled";
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorumRequired: number;
  passingThreshold: number;
  startAt: Date;
  endAt: Date;
  executedAt?: Date;
  executionPayload?: Record<string, unknown>;
}

export interface GovernanceVote {
  id: string;
  proposalId: string;
  voterId: number;
  vote: "for" | "against" | "abstain";
  votingPower: number;
  reason?: string;
  castAt: Date;
}

// ─── LIQUIDITY SYSTEM TYPES ───────────────────────────────────────────────────

export interface LiquidityPool {
  id: string;
  poolType: "treasury_lp" | "creator_lp" | "reward_pool" | "staking_pool";
  tokenA: string;
  tokenB: string;
  reserveA: number;
  reserveB: number;
  totalLiquidity: number;
  feeRate: number;
  apr: number;
  totalVolume24h: number;
  totalFeesCollected: number;
  lpProviders: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiquidityPosition {
  id: string;
  poolId: string;
  providerId: number;
  lpTokens: number;
  tokenAAmount: number;
  tokenBAmount: number;
  sharePercent: number;
  feesEarned: number;
  addedAt: Date;
  updatedAt: Date;
}

export interface StakingRewardBalance {
  id: string;
  poolId: string;
  stakerId: number;
  stakedAmount: number;
  pendingRewards: number;
  claimedRewards: number;
  apr: number;
  lockPeriodDays: number;
  lockedUntil?: Date;
  lastClaimedAt?: Date;
  stakedAt: Date;
  updatedAt: Date;
}

// ─── NFT UTILITY TYPES ────────────────────────────────────────────────────────

export interface NFTUtilityPass {
  id: string;
  nftId: string;
  passType: "membership" | "creator_access" | "game_unlock" | "event_pass" | "unlockable_content";
  creatorId?: number;
  communityId?: string;
  holderId: number;
  benefits: string[];
  contentUnlocks: string[];
  gameUnlocks: string[];
  eventAccess: string[];
  isActive: boolean;
  transferable: boolean;
  expiresAt?: Date;
  mintedAt: Date;
  lastUsedAt?: Date;
}

export interface NFTMembership {
  id: string;
  creatorId: number;
  tierId: string;
  tierName: string;
  holderId: number;
  nftId: string;
  benefits: string[];
  monthlyValue: number;
  currency: string;
  isActive: boolean;
  mintedAt: Date;
  renewsAt?: Date;
}

export interface NFTUnlockable {
  id: string;
  nftId: string;
  creatorId: number;
  unlockableType: "exclusive_post" | "private_stream" | "download" | "merch_discount" | "1on1_call";
  title: string;
  description: string;
  contentUrl?: string;
  discountPercent?: number;
  isRevealed: boolean;
  revealedAt?: Date;
  claimedByUserId?: number;
  claimedAt?: Date;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _tokenActions = new Map<string, TokenUtilityAction>();
const _govTokens = new Map<number, GovernanceToken>();
const _govProposals = new Map<string, GovernanceProposal>();
const _govVotes = new Map<string, GovernanceVote>();
const _liquidityPools = new Map<string, LiquidityPool>();
const _liquidityPositions = new Map<string, LiquidityPosition>();
const _stakingRewards = new Map<string, StakingRewardBalance>();
const _nftPasses = new Map<string, NFTUtilityPass>();
const _nftMemberships = new Map<string, NFTMembership>();
const _nftUnlockables = new Map<string, NFTUnlockable>();

// ─── TOKEN UTILITY ENGINE ─────────────────────────────────────────────────────

export const tokenUtilityEngine = {
  recordAction(params: Omit<TokenUtilityAction, "id" | "status" | "createdAt">): TokenUtilityAction {
    const id = `tua_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const action: TokenUtilityAction = {
      ...params, id,
      status: "pending",
      createdAt: new Date(),
    };
    _tokenActions.set(id, action);
    return action;
  },

  confirmAction(actionId: string, txHash?: string): TokenUtilityAction | null {
    const action = _tokenActions.get(actionId);
    if (!action) return null;
    action.status = "confirmed";
    action.confirmedAt = new Date();
    if (txHash) action.txHash = txHash;
    return action;
  },

  getTokenVelocity(currency: string, windowHours = 24): { totalVolume: number; actionCount: number; uniqueUsers: number } {
    const cutoff = new Date(Date.now() - windowHours * 3600000);
    const actions = Array.from(_tokenActions.values()).filter(a =>
      a.currency === currency && a.status === "confirmed" && a.createdAt >= cutoff
    );
    return {
      totalVolume: actions.reduce((s, a) => s + a.amount, 0),
      actionCount: actions.length,
      uniqueUsers: new Set(actions.map(a => a.userId)).size,
    };
  },

  getTopUtilityActions(limit = 10): TokenUtilityAction[] {
    return Array.from(_tokenActions.values())
      .filter(a => a.status === "confirmed")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  },

  // Governance Token
  mintGovernanceTokens(userId: number, amount: number): GovernanceToken {
    const existing = _govTokens.get(userId);
    if (existing) {
      existing.balance += amount;
      existing.votingPower = existing.balance - existing.lockedBalance;
      return existing;
    }
    const token: GovernanceToken = {
      tokenId: `gov_${userId}`,
      holderId: userId,
      balance: amount,
      lockedBalance: 0,
      votingPower: amount,
      delegatedFrom: [],
      createdAt: new Date(),
    };
    _govTokens.set(userId, token);
    return token;
  },

  delegateVotingPower(fromUserId: number, toUserId: number): boolean {
    const fromToken = _govTokens.get(fromUserId);
    const toToken = _govTokens.get(toUserId);
    if (!fromToken || !toToken) return false;
    fromToken.delegatedTo = toUserId;
    toToken.delegatedFrom.push(fromUserId);
    toToken.votingPower += fromToken.votingPower;
    fromToken.votingPower = 0;
    return true;
  },

  getGovernanceToken(userId: number): GovernanceToken | null {
    return _govTokens.get(userId) ?? null;
  },

  // Governance Proposals
  createProposal(params: Omit<GovernanceProposal, "id" | "status" | "votesFor" | "votesAgainst" | "votesAbstain">): GovernanceProposal {
    const id = `prop_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const proposal: GovernanceProposal = {
      ...params, id,
      status: "active",
      votesFor: 0, votesAgainst: 0, votesAbstain: 0,
    };
    _govProposals.set(id, proposal);
    return proposal;
  },

  castVote(proposalId: string, voterId: number, vote: GovernanceVote["vote"], reason?: string): GovernanceVote | null {
    const proposal = _govProposals.get(proposalId);
    if (!proposal || proposal.status !== "active") return null;
    const now = new Date();
    if (now < proposal.startAt || now > proposal.endAt) return null;
    // Prevent double voting
    const alreadyVoted = Array.from(_govVotes.values()).some(v => v.proposalId === proposalId && v.voterId === voterId);
    if (alreadyVoted) return null;
    const token = _govTokens.get(voterId);
    const votingPower = token?.votingPower ?? 1;
    const id = `vote_${proposalId}_${voterId}`;
    const govVote: GovernanceVote = { id, proposalId, voterId, vote, votingPower, reason, castAt: new Date() };
    _govVotes.set(id, govVote);
    if (vote === "for") proposal.votesFor += votingPower;
    else if (vote === "against") proposal.votesAgainst += votingPower;
    else proposal.votesAbstain += votingPower;
    if (token) token.lastVotedAt = new Date();
    this._checkProposalOutcome(proposal);
    return govVote;
  },

  _checkProposalOutcome(proposal: GovernanceProposal): void {
    const now = new Date();
    if (now <= proposal.endAt) return;
    const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
    if (totalVotes < proposal.quorumRequired) { proposal.status = "rejected"; return; }
    const forPercent = totalVotes > 0 ? proposal.votesFor / totalVotes : 0;
    proposal.status = forPercent >= proposal.passingThreshold ? "passed" : "rejected";
  },

  executeProposal(proposalId: string): GovernanceProposal | null {
    const proposal = _govProposals.get(proposalId);
    if (!proposal || proposal.status !== "passed") return null;
    proposal.status = "executed";
    proposal.executedAt = new Date();
    return proposal;
  },

  getActiveProposals(): GovernanceProposal[] {
    const now = new Date();
    return Array.from(_govProposals.values()).filter(p => p.status === "active" && now <= p.endAt);
  },

  getProposalVotes(proposalId: string): GovernanceVote[] {
    return Array.from(_govVotes.values()).filter(v => v.proposalId === proposalId);
  },
};

// ─── LIQUIDITY ENGINE ─────────────────────────────────────────────────────────

export const liquidityEngine = {
  createPool(params: Omit<LiquidityPool, "id" | "totalVolume24h" | "totalFeesCollected" | "lpProviders" | "createdAt" | "updatedAt">): LiquidityPool {
    const id = `pool_${params.tokenA}_${params.tokenB}_${Date.now()}`;
    const pool: LiquidityPool = {
      ...params, id,
      totalVolume24h: 0,
      totalFeesCollected: 0,
      lpProviders: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _liquidityPools.set(id, pool);
    return pool;
  },

  addLiquidity(poolId: string, providerId: number, tokenAAmount: number, tokenBAmount: number): LiquidityPosition | null {
    const pool = _liquidityPools.get(poolId);
    if (!pool) return null;
    const lpTokens = Math.sqrt(tokenAAmount * tokenBAmount);
    pool.reserveA += tokenAAmount;
    pool.reserveB += tokenBAmount;
    pool.totalLiquidity += lpTokens;
    pool.lpProviders++;
    pool.updatedAt = new Date();
    const posId = `lp_${poolId}_${providerId}`;
    const existing = _liquidityPositions.get(posId);
    if (existing) {
      existing.lpTokens += lpTokens;
      existing.tokenAAmount += tokenAAmount;
      existing.tokenBAmount += tokenBAmount;
      existing.sharePercent = existing.lpTokens / pool.totalLiquidity;
      existing.updatedAt = new Date();
      return existing;
    }
    const position: LiquidityPosition = {
      id: posId, poolId, providerId, lpTokens,
      tokenAAmount, tokenBAmount,
      sharePercent: lpTokens / pool.totalLiquidity,
      feesEarned: 0,
      addedAt: new Date(),
      updatedAt: new Date(),
    };
    _liquidityPositions.set(posId, position);
    return position;
  },

  removeLiquidity(poolId: string, providerId: number, lpTokens: number): { tokenAOut: number; tokenBOut: number } | null {
    const pool = _liquidityPools.get(poolId);
    const posId = `lp_${poolId}_${providerId}`;
    const position = _liquidityPositions.get(posId);
    if (!pool || !position || lpTokens > position.lpTokens) return null;
    const shareRemoved = lpTokens / pool.totalLiquidity;
    const tokenAOut = pool.reserveA * shareRemoved;
    const tokenBOut = pool.reserveB * shareRemoved;
    pool.reserveA -= tokenAOut;
    pool.reserveB -= tokenBOut;
    pool.totalLiquidity -= lpTokens;
    position.lpTokens -= lpTokens;
    position.tokenAAmount -= tokenAOut;
    position.tokenBAmount -= tokenBOut;
    position.sharePercent = pool.totalLiquidity > 0 ? position.lpTokens / pool.totalLiquidity : 0;
    position.updatedAt = new Date();
    pool.updatedAt = new Date();
    return { tokenAOut, tokenBOut };
  },

  recordSwap(poolId: string, tokenIn: string, amountIn: number): { amountOut: number; fee: number; priceImpact: number } | null {
    const pool = _liquidityPools.get(poolId);
    if (!pool) return null;
    const isTokenA = tokenIn === pool.tokenA;
    const reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
    const reserveOut = isTokenA ? pool.reserveB : pool.reserveA;
    const fee = amountIn * pool.feeRate;
    const amountInAfterFee = amountIn - fee;
    // Constant product formula: x * y = k
    const amountOut = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);
    const priceImpact = amountInAfterFee / (reserveIn + amountInAfterFee);
    if (isTokenA) { pool.reserveA += amountIn; pool.reserveB -= amountOut; }
    else { pool.reserveB += amountIn; pool.reserveA -= amountOut; }
    pool.totalVolume24h += amountIn;
    pool.totalFeesCollected += fee;
    pool.updatedAt = new Date();
    return { amountOut, fee, priceImpact };
  },

  getPool(poolId: string): LiquidityPool | null {
    return _liquidityPools.get(poolId) ?? null;
  },

  getAllPools(): LiquidityPool[] {
    return Array.from(_liquidityPools.values());
  },

  getProviderPositions(providerId: number): LiquidityPosition[] {
    return Array.from(_liquidityPositions.values()).filter(p => p.providerId === providerId);
  },

  // Staking Rewards
  stakeTokens(poolId: string, stakerId: number, amount: number, lockPeriodDays: number): StakingRewardBalance {
    const pool = _liquidityPools.get(poolId);
    const apr = pool?.apr ?? 0.12;
    const id = `stake_${poolId}_${stakerId}`;
    const existing = _stakingRewards.get(id);
    if (existing) {
      existing.stakedAmount += amount;
      existing.updatedAt = new Date();
      return existing;
    }
    const balance: StakingRewardBalance = {
      id, poolId, stakerId, stakedAmount: amount,
      pendingRewards: 0, claimedRewards: 0,
      apr, lockPeriodDays,
      lockedUntil: lockPeriodDays > 0 ? new Date(Date.now() + lockPeriodDays * 86400000) : undefined,
      stakedAt: new Date(),
      updatedAt: new Date(),
    };
    _stakingRewards.set(id, balance);
    return balance;
  },

  accrueRewards(poolId: string, stakerId: number): StakingRewardBalance | null {
    const id = `stake_${poolId}_${stakerId}`;
    const balance = _stakingRewards.get(id);
    if (!balance) return null;
    const daysSinceStake = (Date.now() - balance.stakedAt.getTime()) / 86400000;
    const totalRewards = balance.stakedAmount * balance.apr * (daysSinceStake / 365);
    balance.pendingRewards = totalRewards - balance.claimedRewards;
    balance.updatedAt = new Date();
    return balance;
  },

  claimRewards(poolId: string, stakerId: number): { claimed: number } | null {
    const id = `stake_${poolId}_${stakerId}`;
    const balance = _stakingRewards.get(id);
    if (!balance || balance.pendingRewards <= 0) return null;
    const claimed = balance.pendingRewards;
    balance.claimedRewards += claimed;
    balance.pendingRewards = 0;
    balance.lastClaimedAt = new Date();
    balance.updatedAt = new Date();
    return { claimed };
  },

  getStakingBalance(poolId: string, stakerId: number): StakingRewardBalance | null {
    return _stakingRewards.get(`stake_${poolId}_${stakerId}`) ?? null;
  },

  balanceStakingRewards(poolId: string): { adjustedApr: number; totalStaked: number } {
    const pool = _liquidityPools.get(poolId);
    if (!pool) return { adjustedApr: 0, totalStaked: 0 };
    const stakes = Array.from(_stakingRewards.values()).filter(s => s.poolId === poolId);
    const totalStaked = stakes.reduce((s, b) => s + b.stakedAmount, 0);
    // Dynamic APR: higher when less staked, lower when over-subscribed
    const targetStake = pool.totalLiquidity * 0.5;
    const adjustedApr = totalStaked < targetStake
      ? pool.apr * 1.5
      : pool.apr * (targetStake / Math.max(1, totalStaked));
    pool.apr = Math.min(0.5, Math.max(0.05, adjustedApr));
    return { adjustedApr: pool.apr, totalStaked };
  },
};

// ─── NFT UTILITY ENGINE ───────────────────────────────────────────────────────

export const nftUtilityEngine = {
  mintPass(params: Omit<NFTUtilityPass, "id" | "isActive" | "mintedAt">): NFTUtilityPass {
    const id = `nftpass_${params.nftId}_${params.holderId}`;
    const pass: NFTUtilityPass = {
      ...params, id,
      isActive: true,
      mintedAt: new Date(),
    };
    _nftPasses.set(id, pass);
    return pass;
  },

  usePass(passId: string): NFTUtilityPass | null {
    const pass = _nftPasses.get(passId);
    if (!pass || !pass.isActive) return null;
    if (pass.expiresAt && pass.expiresAt < new Date()) {
      pass.isActive = false;
      return null;
    }
    pass.lastUsedAt = new Date();
    return pass;
  },

  getHolderPasses(holderId: number, passType?: NFTUtilityPass["passType"]): NFTUtilityPass[] {
    return Array.from(_nftPasses.values()).filter(p =>
      p.holderId === holderId && p.isActive && (!passType || p.passType === passType)
    );
  },

  checkAccess(holderId: number, resourceType: "content" | "game" | "event" | "creator", resourceId: string): boolean {
    const passes = Array.from(_nftPasses.values()).filter(p => p.holderId === holderId && p.isActive);
    for (const pass of passes) {
      if (pass.expiresAt && pass.expiresAt < new Date()) continue;
      if (resourceType === "content" && pass.contentUnlocks.includes(resourceId)) return true;
      if (resourceType === "game" && pass.gameUnlocks.includes(resourceId)) return true;
      if (resourceType === "event" && pass.eventAccess.includes(resourceId)) return true;
      if (resourceType === "creator" && pass.creatorId?.toString() === resourceId) return true;
    }
    return false;
  },

  mintMembership(params: Omit<NFTMembership, "id">): NFTMembership {
    const id = `nftmem_${params.creatorId}_${params.holderId}_${params.tierId}`;
    const membership: NFTMembership = { ...params, id };
    _nftMemberships.set(id, membership);
    return membership;
  },

  getCreatorMemberships(creatorId: number): NFTMembership[] {
    return Array.from(_nftMemberships.values()).filter(m => m.creatorId === creatorId && m.isActive);
  },

  getHolderMemberships(holderId: number): NFTMembership[] {
    return Array.from(_nftMemberships.values()).filter(m => m.holderId === holderId && m.isActive);
  },

  createUnlockable(params: Omit<NFTUnlockable, "id" | "isRevealed">): NFTUnlockable {
    const id = `unlock_${params.nftId}_${params.unlockableType}`;
    const unlockable: NFTUnlockable = { ...params, id, isRevealed: false };
    _nftUnlockables.set(id, unlockable);
    return unlockable;
  },

  revealUnlockable(unlockableId: string): NFTUnlockable | null {
    const unlockable = _nftUnlockables.get(unlockableId);
    if (!unlockable || unlockable.isRevealed) return null;
    unlockable.isRevealed = true;
    unlockable.revealedAt = new Date();
    return unlockable;
  },

  claimUnlockable(unlockableId: string, userId: number): NFTUnlockable | null {
    const unlockable = _nftUnlockables.get(unlockableId);
    if (!unlockable || !unlockable.isRevealed || unlockable.claimedByUserId) return null;
    unlockable.claimedByUserId = userId;
    unlockable.claimedAt = new Date();
    return unlockable;
  },

  getNFTUnlockables(nftId: string): NFTUnlockable[] {
    return Array.from(_nftUnlockables.values()).filter(u => u.nftId === nftId);
  },

  getEconomicMoatMetrics(): {
    totalTokenActions: number;
    totalTokenVolume: number;
    activeGovernanceProposals: number;
    totalLiquidityTVL: number;
    activeLPProviders: number;
    totalNFTPasses: number;
    totalNFTMemberships: number;
  } {
    const confirmedActions = Array.from(_tokenActions.values()).filter(a => a.status === "confirmed");
    const pools = Array.from(_liquidityPools.values());
    return {
      totalTokenActions: confirmedActions.length,
      totalTokenVolume: confirmedActions.reduce((s, a) => s + a.amount, 0),
      activeGovernanceProposals: Array.from(_govProposals.values()).filter(p => p.status === "active").length,
      totalLiquidityTVL: pools.reduce((s, p) => s + p.totalLiquidity, 0),
      activeLPProviders: new Set(Array.from(_liquidityPositions.values()).map(p => p.providerId)).size,
      totalNFTPasses: Array.from(_nftPasses.values()).filter(p => p.isActive).length,
      totalNFTMemberships: Array.from(_nftMemberships.values()).filter(m => m.isActive).length,
    };
  },
};
