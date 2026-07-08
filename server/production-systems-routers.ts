/**
 * PRODUCTION SYSTEMS ROUTERS
 *
 * tRPC router layer wiring all new production systems:
 * - GameFi (tournaments, wagers, XP, leaderboards, daily challenges, battle pass)
 * - Marketplace (cart, orders, disputes, seller dashboard, affiliates)
 * - Crypto/Web3 (wallet connect, staking, DEX swaps, treasury, vesting, governance)
 * - Queue workers & logging
 * - Media pipeline
 * - Growth engine
 * - Monetization ledger
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";

// GameFi imports
import {
  xpEngine,
  tournamentEngine,
  wagerSystem,
  leaderboardEngine,
  dailyChallengeEngine,
  battlePassEngine,
  antiCheatEngine,
} from "./gamefi-production";

// Marketplace imports
import {
  cartSystem,
  orderSystem,
  disputeSystem,
  sellerDashboard,
  affiliateSystem,
  marketplaceStats,
} from "./marketplace-production";

// Crypto/Web3 imports
import {
  walletConnect,
  stakingEngine,
  dexSwapEngine,
  treasuryEngine,
  vestingEngine,
  governanceEngine,
  cryptoStats,
} from "./crypto-web3-production";

// ─── GameFi Router ────────────────────────────────────────────────────────────
export const gamefiRouter = router({
  // XP
  getMyProfile: protectedProcedure.query(({ ctx }: any) => {
    return xpEngine.getProfile((ctx as any).user.id);
  }),

  getXPHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).optional() }))
    .query(({ ctx, input }: any) => {
      return xpEngine.getXPHistory((ctx as any).user.id, input.limit);
    }),

  awardXP: protectedProcedure
    .input(z.object({ action: z.string(), multiplier: z.number().min(0.1).max(10).optional() }))
    .query(async ({ ctx, input }: any) => {
      return xpEngine.awardXP((ctx as any).user.id, input.action, input.multiplier);
    }),

  // Tournaments
  createTournament: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(100),
      game: z.string(),
      bracketType: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss"]),
      maxParticipants: z.number().min(4).max(1024),
      entryFeeCents: z.number().min(0),
      prizePoolCents: z.number().min(0),
      registrationDeadline: z.string().datetime(),
      startTime: z.string().datetime(),
      rules: z.string(),
    }))
    .query(async ({ ctx, input }: any) => {
      return tournamentEngine.create({
        ...input,
        organizerId: (ctx as any).user.id,
        registrationDeadline: new Date(input.registrationDeadline),
        startTime: new Date(input.startTime),
      });
    }),

  registerForTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string(), username: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return tournamentEngine.register(input.tournamentId, (ctx as any).user.id, input.username);
    }),

  checkInTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return tournamentEngine.checkIn(input.tournamentId, (ctx as any).user.id);
    }),

  seedTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input }: any) => {
      return tournamentEngine.seed(input.tournamentId);
    }),

  reportMatch: protectedProcedure
    .input(z.object({
      tournamentId: z.string(),
      matchId: z.string(),
      winnerId: z.number(),
      score1: z.number(),
      score2: z.number(),
      evidenceUrl: z.string().url().optional(),
    }))
    .query(async ({ input }: any) => {
      return tournamentEngine.reportMatch(input.tournamentId, input.matchId, input.winnerId, input.score1, input.score2, input.evidenceUrl);
    }),

  getTournament: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(({ input }: any) => {
      return tournamentEngine.getTournament(input.tournamentId);
    }),

  getActiveTournaments: publicProcedure
    .input(z.object({ game: z.string().optional() }))
    .query(({ input }: any) => {
      return tournamentEngine.getActiveTournaments(input.game);
    }),

  // Wagers
  createWager: protectedProcedure
    .input(z.object({
      challengeeId: z.number(),
      game: z.string(),
      amountCents: z.number().min(100),
      currency: z.enum(["USD", "SKYCOIN"]),
      expiresInHours: z.number().min(1).max(168).optional(),
    }))
    .query(async ({ ctx, input }: any) => {
      return wagerSystem.createWager({ ...input, challengerId: (ctx as any).user.id });
    }),

  acceptWager: protectedProcedure
    .input(z.object({ wagerId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return wagerSystem.acceptWager(input.wagerId, (ctx as any).user.id);
    }),

  reportWagerResult: protectedProcedure
    .input(z.object({ wagerId: z.string(), winnerId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      return wagerSystem.reportResult(input.wagerId, (ctx as any).user.id, input.winnerId);
    }),

  disputeWager: protectedProcedure
    .input(z.object({ wagerId: z.string(), reason: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return wagerSystem.disputeWager(input.wagerId, (ctx as any).user.id, input.reason);
    }),

  getMyWagers: protectedProcedure
    .input(z.object({ status: z.enum(["pending", "accepted", "in_progress", "completed", "disputed", "cancelled"]).optional() }))
    .query(({ ctx, input }: any) => {
      return wagerSystem.getUserWagers((ctx as any).user.id, input.status as any);
    }),

  // Leaderboards
  getXPLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(500).optional() }))
    .query(async ({ input }: any) => {
      return leaderboardEngine.getGlobalXPLeaderboard(input.limit);
    }),

  getWinRateLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(200).optional() }))
    .query(async ({ input }: any) => {
      return leaderboardEngine.getWinRateLeaderboard(input.limit);
    }),

  getEarningsLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(200).optional() }))
    .query(async ({ input }: any) => {
      return leaderboardEngine.getEarningsLeaderboard(input.limit);
    }),

  // Daily Challenges
  getTodayChallenge: publicProcedure.query((_: any) => {
    return dailyChallengeEngine.getTodayChallenge();
  }),

  completeDailyChallenge: protectedProcedure.query(async ({ ctx }: any) => {
    const today = new Date().toISOString().split("T")[0];
    return dailyChallengeEngine.completeChallenge((ctx as any).user.id, today);
  }),

  // Battle Pass
  getActiveSeason: publicProcedure.query((_: any) => {
    return battlePassEngine.getActiveSeason();
  }),

  getBattlePassProgress: protectedProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(({ ctx, input }: any) => {
      return battlePassEngine.getUserProgress((ctx as any).user.id, input.seasonId);
    }),

  purchaseBattlePass: protectedProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(({ ctx, input }: any) => {
      return battlePassEngine.purchasePremium((ctx as any).user.id, input.seasonId);
    }),

  // Anti-Cheat
  analyzePlayer: protectedProcedure
    .input(z.object({ targetUserId: z.number() }))
    .query(({ input }: any) => {
      return antiCheatEngine.analyzePlayer(input.targetUserId);
    }),
});

// ─── Marketplace Router ───────────────────────────────────────────────────────
export const marketplaceProductionRouter = router({
  // Cart
  getCart: protectedProcedure.query(({ ctx }: any) => {
    return cartSystem.getOrCreateCart((ctx as any).user.id);
  }),

  addToCart: protectedProcedure
    .input(z.object({
      listingId: z.string(),
      quantity: z.number().min(1),
      unitPriceCents: z.number().min(0),
      affiliateCode: z.string().optional(),
    }))
    .query(({ ctx, input }: any) => {
      return cartSystem.addItem((ctx as any).user.id, input);
    }),

  removeFromCart: protectedProcedure
    .input(z.object({ listingId: z.string() }))
    .query(({ ctx, input }: any) => {
      return cartSystem.removeItem((ctx as any).user.id, input.listingId);
    }),

  updateCartQuantity: protectedProcedure
    .input(z.object({ listingId: z.string(), quantity: z.number().min(0) }))
    .query(({ ctx, input }: any) => {
      return cartSystem.updateQuantity((ctx as any).user.id, input.listingId, input.quantity);
    }),

  // Orders
  createOrder: protectedProcedure
    .input(z.object({
      sellerId: z.number(),
      listingId: z.string(),
      listingTitle: z.string(),
      listingType: z.enum(["physical", "digital", "nft", "service", "subscription"]),
      quantity: z.number().min(1),
      unitPriceCents: z.number().min(0),
      currency: z.enum(["USD", "SKYCOIN"]).optional(),
      shippingAddress: z.object({
        name: z.string(),
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        postalCode: z.string(),
        country: z.string(),
      }).optional(),
      affiliateCode: z.string().optional(),
      paymentIntentId: z.string().optional(),
    }))
    .query(async ({ ctx, input }: any) => {
      return orderSystem.createOrder({ ...input, buyerId: (ctx as any).user.id });
    }),

  confirmPayment: protectedProcedure
    .input(z.object({ orderId: z.string(), stripeChargeId: z.string() }))
    .query(async ({ input }: any) => {
      return orderSystem.confirmPayment(input.orderId, input.stripeChargeId);
    }),

  markShipped: protectedProcedure
    .input(z.object({ orderId: z.string(), trackingNumber: z.string(), carrier: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return orderSystem.markShipped(input.orderId, (ctx as any).user.id, input.trackingNumber, input.carrier);
    }),

  confirmDelivery: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return orderSystem.confirmDelivery(input.orderId, (ctx as any).user.id);
    }),

  cancelOrder: protectedProcedure
    .input(z.object({ orderId: z.string(), reason: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return orderSystem.cancelOrder(input.orderId, (ctx as any).user.id, input.reason);
    }),

  getOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(({ input }: any) => {
      return orderSystem.getOrder(input.orderId);
    }),

  getMyOrders: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(({ ctx, input }: any) => {
      return orderSystem.getBuyerOrders((ctx as any).user.id, input.status as any);
    }),

  getMySellerOrders: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(({ ctx, input }: any) => {
      return orderSystem.getSellerOrders((ctx as any).user.id, input.status as any);
    }),

  // Disputes
  openDispute: protectedProcedure
    .input(z.object({ orderId: z.string(), reason: z.string(), description: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return disputeSystem.openDispute({ ...input, initiatorId: (ctx as any).user.id });
    }),

  addDisputeEvidence: protectedProcedure
    .input(z.object({
      disputeId: z.string(),
      type: z.enum(["text", "image", "document"]),
      content: z.string(),
    }))
    .query(async ({ ctx, input }: any) => {
      return disputeSystem.addEvidence(input.disputeId, (ctx as any).user.id, { type: input.type, content: input.content });
    }),

  resolveDispute: protectedProcedure
    .input(z.object({ disputeId: z.string(), resolution: z.string(), favorBuyer: z.boolean() }))
    .query(async ({ ctx, input }: any) => {
      return disputeSystem.resolveDispute(input.disputeId, (ctx as any).user.id, input.resolution, input.favorBuyer);
    }),

  getOpenDisputes: protectedProcedure.query((_: any) => {
    return disputeSystem.getOpenDisputes();
  }),

  // Seller Dashboard
  getSellerDashboard: protectedProcedure
    .input(z.object({ period: z.enum(["today", "week", "month", "all_time"]).optional() }))
    .query(({ ctx, input }: any) => {
      return sellerDashboard.getDashboard((ctx as any).user.id, input.period);
    }),

  getSellerReputation: publicProcedure
    .input(z.object({ sellerId: z.number() }))
    .query(({ input }: any) => {
      return sellerDashboard.getReputation(input.sellerId);
    }),

  getPayoutHistory: protectedProcedure.query(({ ctx }: any) => {
    return sellerDashboard.getPayoutHistory((ctx as any).user.id);
  }),

  // Affiliates
  createAffiliateLink: protectedProcedure
    .input(z.object({ listingId: z.string().optional(), commissionPct: z.number().min(1).max(50).optional() }))
    .query(({ ctx, input }: any) => {
      return affiliateSystem.createLink((ctx as any).user.id, input.listingId, input.commissionPct);
    }),

  trackAffiliateClick: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(({ input }: any) => {
      return affiliateSystem.trackClick(input.code);
    }),

  getMyAffiliateLinks: protectedProcedure.query(({ ctx }: any) => {
    return affiliateSystem.getAffiliateLinks((ctx as any).user.id);
  }),

  getAffiliateStats: protectedProcedure.query(({ ctx }: any) => {
    return affiliateSystem.getAffiliateStats((ctx as any).user.id);
  }),

  // Platform Stats
  getMarketplaceStats: publicProcedure.query((_: any) => {
    return marketplaceStats.getOverview();
  }),
});

// ─── Crypto/Web3 Router ───────────────────────────────────────────────────────
export const cryptoWeb3Router = router({
  // Wallet Connect
  generateNonce: protectedProcedure.query(({ ctx }: any) => {
    return { nonce: walletConnect.generateNonce((ctx as any).user.id) };
  }),

  connectWallet: protectedProcedure
    .input(z.object({
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      chainId: z.number(),
      signature: z.string(),
      nonce: z.string(),
      message: z.string(),
    }))
    .query(async ({ ctx, input }: any) => {
      return walletConnect.connect({
        userId: (ctx as any).user.id,
        address: input.address,
        chainId: input.chainId as any,
        signature: input.signature,
        nonce: input.nonce,
        message: input.message,
      });
    }),

  disconnectWallet: protectedProcedure
    .input(z.object({ connectionId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return walletConnect.disconnect(input.connectionId, (ctx as any).user.id);
    }),

  getMyWallets: protectedProcedure.query(({ ctx }: any) => {
    return walletConnect.getUserWallets((ctx as any).user.id);
  }),

  // Staking
  stake: protectedProcedure
    .input(z.object({
      walletAddress: z.string(),
      amountFormatted: z.number().min(100),
      lockPeriodDays: z.number().min(7),
      txHash: z.string().optional(),
    }))
    .query(async ({ ctx, input }: any) => {
      return stakingEngine.stake({ ...input, userId: (ctx as any).user.id });
    }),

  accrueRewards: protectedProcedure
    .input(z.object({ stakeId: z.string() }))
    .query(async ({ input }: any) => {
      return stakingEngine.accrueRewards(input.stakeId);
    }),

  requestUnstake: protectedProcedure
    .input(z.object({ stakeId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return stakingEngine.requestUnstake(input.stakeId, (ctx as any).user.id);
    }),

  completeUnstake: protectedProcedure
    .input(z.object({ stakeId: z.string(), txHash: z.string() }))
    .query(async ({ input }: any) => {
      return stakingEngine.completeUnstake(input.stakeId, input.txHash);
    }),

  getMyStakes: protectedProcedure
    .input(z.object({ status: z.enum(["active", "unstaking", "completed", "slashed"]).optional() }))
    .query(({ ctx, input }: any) => {
      return stakingEngine.getUserStakes((ctx as any).user.id, input.status as any);
    }),

  getTotalStaked: protectedProcedure.query(({ ctx }: any) => {
    return { totalStaked: stakingEngine.getTotalStaked((ctx as any).user.id) };
  }),

  // DEX Swaps
  getSwapQuote: protectedProcedure
    .input(z.object({
      fromToken: z.string(),
      toToken: z.string(),
      fromAmount: z.string(),
      slippagePct: z.number().min(0.1).max(50).optional(),
      chainId: z.number().optional(),
    }))
    .query(async ({ input }: any) => {
      return dexSwapEngine.getQuote(input as any);
    }),

  executeSwap: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
      walletAddress: z.string(),
      txHash: z.string().optional(),
    }))
    .query(async ({ ctx, input }: any) => {
      return dexSwapEngine.executeSwap({ ...input, userId: (ctx as any).user.id });
    }),

  confirmSwap: protectedProcedure
    .input(z.object({
      swapId: z.string(),
      txHash: z.string(),
      blockNumber: z.number(),
      gasUsed: z.string(),
      toAmount: z.string(),
    }))
    .query(async ({ input }: any) => {
      return dexSwapEngine.confirmSwap(input.swapId, input.txHash, input.blockNumber, input.gasUsed, input.toAmount);
    }),

  getMySwaps: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).optional() }))
    .query(({ ctx, input }: any) => {
      return dexSwapEngine.getUserSwaps((ctx as any).user.id, input.limit);
    }),

  // Treasury
  getTreasurySnapshot: publicProcedure.query((_: any) => {
    return treasuryEngine.getLatestSnapshot();
  }),

  getTreasuryHistory: publicProcedure
    .input(z.object({ days: z.number().min(1).max(365).optional() }))
    .query(({ input }: any) => {
      return treasuryEngine.getSnapshotHistory(input.days);
    }),

  checkRebalance: protectedProcedure.query(async () => {
    return treasuryEngine.checkRebalanceNeeded();
  }),

  // Vesting
  getMyVestingSchedules: protectedProcedure.query(({ ctx }: any) => {
    return vestingEngine.getUserSchedules((ctx as any).user.id);
  }),

  getVestedAmount: protectedProcedure
    .input(z.object({ vestingId: z.string() }))
    .query(({ input }: any) => {
      return { vestedAmount: vestingEngine.calculateVested(input.vestingId) };
    }),

  claimVesting: protectedProcedure
    .input(z.object({ vestingId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return vestingEngine.claim(input.vestingId, (ctx as any).user.id);
    }),

  // Governance
  getMyVotingPower: protectedProcedure.query(async ({ ctx }: any) => {
    return governanceEngine.getVotingPower((ctx as any).user.id);
  }),

  delegateVotes: protectedProcedure
    .input(z.object({ delegateAddress: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return governanceEngine.delegate((ctx as any).user.id, input.delegateAddress);
    }),

  undelegateVotes: protectedProcedure.query(async ({ ctx }: any) => {
    return governanceEngine.undelegate((ctx as any).user.id);
  }),

  getTopVoters: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(({ input }: any) => {
      return governanceEngine.getTopVoters(input.limit);
    }),

  // Platform Crypto Stats
  getCryptoStats: publicProcedure.query((_: any) => {
    return cryptoStats.getPlatformStats();
  }),
});
