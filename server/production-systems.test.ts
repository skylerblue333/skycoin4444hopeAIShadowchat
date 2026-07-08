/**
 * PRODUCTION SYSTEMS TEST SUITE
 * Tests for: GameFi, Marketplace, Crypto/Web3 production systems
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  xpEngine,
  tournamentEngine,
  wagerSystem,
  leaderboardEngine,
  dailyChallengeEngine,
  battlePassEngine,
  antiCheatEngine,
} from "./gamefi-production";
import {
  cartSystem,
  orderSystem,
  disputeSystem,
  sellerDashboard,
  affiliateSystem,
  marketplaceStats,
} from "./marketplace-production";
import {
  walletConnect,
  stakingEngine,
  dexSwapEngine,
  treasuryEngine,
  vestingEngine,
  governanceEngine,
  cryptoStats,
} from "./crypto-web3-production";

// ─── GameFi Tests ─────────────────────────────────────────────────────────────
describe("Phase A: XP Engine", () => {
  it("A1: awards XP for known action", async () => {
    const result = await xpEngine.awardXP(1001, "post_created");
    expect(result.xpAwarded).toBe(10);
    expect(result.newTotal).toBeGreaterThan(0);
  });

  it("A2: awards 0 XP for unknown action", async () => {
    const result = await xpEngine.awardXP(1001, "unknown_action_xyz");
    expect(result.xpAwarded).toBe(0);
  });

  it("A3: applies multiplier correctly", async () => {
    const result = await xpEngine.awardXP(1002, "post_created", 2.0);
    expect(result.xpAwarded).toBe(20);
  });

  it("A4: levels up when enough XP accumulated", async () => {
    // Award enough XP to level up (level 1 requires 100 XP)
    await xpEngine.awardXP(1003, "tournament_win"); // 200 XP
    const result = await xpEngine.awardXP(1003, "post_created");
    expect(result.newLevel).toBeGreaterThan(1);
  });

  it("A5: getProfile returns correct structure", () => {
    const profile = xpEngine.getProfile(1001);
    expect(profile).toMatchObject({
      userId: 1001,
      level: expect.any(Number),
      tier: expect.any(String),
      wins: expect.any(Number),
      losses: expect.any(Number),
    });
  });

  it("A6: getXPHistory returns events", async () => {
    await xpEngine.awardXP(1004, "like_given");
    const history = xpEngine.getXPHistory(1004);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toMatchObject({ action: "like_given", xpAwarded: 1 });
  });

  it("A7: tier assignment is correct for high level", async () => {
    // Award massive XP to reach diamond/legend tier
    for (let i = 0; i < 20; i++) {
      await xpEngine.awardXP(1005, "tournament_win", 10.0); // 2000 XP each
    }
    const profile = xpEngine.getProfile(1005);
    expect(["silver", "gold", "platinum", "diamond", "legend"]).toContain(profile.tier);
  });
});

describe("Phase B: Tournament Engine", () => {
  let tournamentId: string;

  it("B1: creates a tournament", async () => {
    const tournament = await tournamentEngine.create({
      organizerId: 2001,
      name: "Test Championship",
      game: "chess",
      bracketType: "single_elimination",
      maxParticipants: 8,
      entryFeeCents: 500,
      prizePoolCents: 3000,
      registrationDeadline: new Date(Date.now() + 3600 * 1000),
      startTime: new Date(Date.now() + 7200 * 1000),
      rules: "Standard chess rules",
    });
    tournamentId = tournament.id;
    expect(tournament.status).toBe("registration");
    expect(tournament.prizeDistribution.length).toBeGreaterThan(0);
    expect(tournament.prizeDistribution[0].rankLabel).toBe("1st Place");
  });

  it("B2: registers a participant", async () => {
    const result = await tournamentEngine.register(tournamentId, 2002, "player2");
    expect(result.success).toBe(true);
    expect(result.position).toBe(1);
  });

  it("B3: prevents duplicate registration", async () => {
    await expect(tournamentEngine.register(tournamentId, 2002, "player2"))
      .rejects.toThrow("Already registered");
  });

  it("B4: check-in works", async () => {
    const result = await tournamentEngine.checkIn(tournamentId, 2002);
    expect(result).toBe(true);
  });

  it("B5: getTournament returns correct data", () => {
    const t = tournamentEngine.getTournament(tournamentId);
    expect(t).not.toBeNull();
    expect(t!.name).toBe("Test Championship");
    expect(t!.currentParticipants).toBe(1);
  });

  it("B6: getActiveTournaments returns the tournament", () => {
    const active = tournamentEngine.getActiveTournaments("chess");
    expect(active.some(t => t.id === tournamentId)).toBe(true);
  });

  it("B7: prize distribution sums to ~100%", async () => {
    const t = tournamentEngine.getTournament(tournamentId)!;
    const totalPct = t.prizeDistribution.reduce((sum, p) => sum + p.prizePercent, 0);
    expect(totalPct).toBeLessThanOrEqual(100);
    expect(totalPct).toBeGreaterThan(50);
  });
});

describe("Phase C: Wager System", () => {
  let wagerId: string;

  it("C1: creates a wager", async () => {
    const wager = await wagerSystem.createWager({
      challengerId: 3001,
      challengeeId: 3002,
      game: "chess",
      amountCents: 1000,
      currency: "USD",
    });
    wagerId = wager.wagerId;
    expect(wager.status).toBe("pending");
    expect(wager.escrowId).toBeTruthy();
  });

  it("C2: rejects wager below minimum", async () => {
    await expect(wagerSystem.createWager({
      challengerId: 3001,
      challengeeId: 3002,
      game: "chess",
      amountCents: 50,
      currency: "USD",
    })).rejects.toThrow("Minimum wager");
  });

  it("C3: rejects self-wager", async () => {
    await expect(wagerSystem.createWager({
      challengerId: 3001,
      challengeeId: 3001,
      game: "chess",
      amountCents: 1000,
      currency: "USD",
    })).rejects.toThrow("Cannot wager against yourself");
  });

  it("C4: challengee can accept wager", async () => {
    const accepted = await wagerSystem.acceptWager(wagerId, 3002);
    expect(accepted.status).toBe("accepted");
  });

  it("C5: reports result and pays winner", async () => {
    const result = await wagerSystem.reportResult(wagerId, 3001, 3001);
    expect(result.payoutCents).toBeGreaterThan(0);
    expect(result.payoutCents).toBeLessThan(2000); // Less than 2x due to platform fee
  });

  it("C6: getUserWagers returns correct wagers", () => {
    const wagers = wagerSystem.getUserWagers(3001);
    expect(wagers.length).toBeGreaterThan(0);
    expect(wagers[0].challengerId).toBe(3001);
  });

  it("C7: can dispute a wager", async () => {
    const newWager = await wagerSystem.createWager({
      challengerId: 3003,
      challengeeId: 3004,
      game: "poker",
      amountCents: 500,
      currency: "USD",
    });
    await wagerSystem.acceptWager(newWager.wagerId, 3004);
    const disputed = await wagerSystem.disputeWager(newWager.wagerId, 3003, "Cheating suspected");
    expect(disputed).toBe(true);
    expect(wagerSystem.getWager(newWager.wagerId)!.status).toBe("disputed");
  });
});

describe("Phase D: Leaderboards", () => {
  it("D1: XP leaderboard returns sorted results", async () => {
    await xpEngine.awardXP(4001, "tournament_win", 5.0);
    await xpEngine.awardXP(4002, "post_created");
    const lb = await leaderboardEngine.getGlobalXPLeaderboard(10);
    expect(lb.length).toBeGreaterThan(0);
    if (lb.length > 1) {
      expect(lb[0].xp).toBeGreaterThanOrEqual(lb[1].xp);
    }
  });

  it("D2: earnings leaderboard returns sorted results", async () => {
    const lb = await leaderboardEngine.getEarningsLeaderboard(10);
    expect(Array.isArray(lb)).toBe(true);
    if (lb.length > 1) {
      expect(lb[0].totalEarningsCents).toBeGreaterThanOrEqual(lb[1].totalEarningsCents);
    }
  });

  it("D3: win rate leaderboard filters minimum games", async () => {
    const lb = await leaderboardEngine.getWinRateLeaderboard(10);
    // All entries should have at least 5 games
    lb.forEach(entry => {
      expect(entry.wins + entry.losses).toBeGreaterThanOrEqual(5);
    });
  });
});

describe("Phase E: Daily Challenges", () => {
  it("E1: getTodayChallenge returns a challenge", () => {
    const challenge = dailyChallengeEngine.getTodayChallenge();
    expect(challenge).toMatchObject({
      challengeId: expect.any(String),
      title: expect.any(String),
      xpReward: expect.any(Number),
      tokenReward: expect.any(Number),
    });
  });

  it("E2: challenge is deterministic for same date", () => {
    const c1 = dailyChallengeEngine.generateChallenge("2025-01-01");
    const c2 = dailyChallengeEngine.generateChallenge("2025-01-01");
    expect(c1.challengeId).toBe(c2.challengeId);
    expect(c1.title).toBe(c2.title);
  });

  it("E3: different dates produce potentially different challenges", () => {
    const c1 = dailyChallengeEngine.generateChallenge("2025-01-01");
    const c2 = dailyChallengeEngine.generateChallenge("2025-01-02");
    // They may or may not be different, but both should be valid
    expect(c1.xpReward).toBeGreaterThan(0);
    expect(c2.xpReward).toBeGreaterThan(0);
  });

  it("E4: completing a challenge awards XP", async () => {
    const date = "2025-06-15";
    dailyChallengeEngine.generateChallenge(date);
    const result = await dailyChallengeEngine.completeChallenge(5001, date);
    expect(result.xpAwarded).toBeGreaterThan(0);
    expect(result.tokenAwarded).toBeGreaterThan(0);
  });

  it("E5: cannot complete challenge twice", async () => {
    const date = "2025-06-16";
    dailyChallengeEngine.generateChallenge(date);
    await dailyChallengeEngine.completeChallenge(5002, date);
    await expect(dailyChallengeEngine.completeChallenge(5002, date)).rejects.toThrow("Already completed");
  });

  it("E6: isCompleted returns correct status", async () => {
    const date = "2025-06-17";
    dailyChallengeEngine.generateChallenge(date);
    expect(dailyChallengeEngine.isCompleted(5003, date)).toBe(false);
    await dailyChallengeEngine.completeChallenge(5003, date);
    expect(dailyChallengeEngine.isCompleted(5003, date)).toBe(true);
  });
});

describe("Phase F: Battle Pass", () => {
  let seasonId: string;

  it("F1: creates a battle pass season", () => {
    const season = battlePassEngine.createSeason({
      name: "Season 1: Genesis",
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000),
      tierCount: 50,
    });
    seasonId = season.seasonId;
    expect(season.tiers.length).toBe(50);
    expect(season.premiumPrice).toBe(999);
  });

  it("F2: getActiveSeason returns the current season", () => {
    const active = battlePassEngine.getActiveSeason();
    expect(active).not.toBeNull();
    expect(active!.seasonId).toBe(seasonId);
  });

  it("F3: getUserProgress returns correct structure", () => {
    const progress = battlePassEngine.getUserProgress(6001, seasonId);
    expect(progress).toMatchObject({
      currentTier: expect.any(Number),
      xp: expect.any(Number),
      isPremium: false,
    });
  });

  it("F4: purchasePremium activates premium", () => {
    const result = battlePassEngine.purchasePremium(6001, seasonId);
    expect(result).toBe(true);
    const progress = battlePassEngine.getUserProgress(6001, seasonId);
    expect(progress.isPremium).toBe(true);
  });
});

describe("Phase G: Anti-Cheat", () => {
  it("G1: records events without error", () => {
    expect(() => {
      antiCheatEngine.recordEvent(7001, "match_result", { score: 100 });
    }).not.toThrow();
  });

  it("G2: analyzes player risk correctly", () => {
    const analysis = antiCheatEngine.analyzePlayer(7001);
    expect(analysis).toMatchObject({
      riskScore: expect.any(Number),
      flags: expect.any(Array),
      recommendation: expect.stringMatching(/^(allow|monitor|suspend)$/),
    });
  });

  it("G3: clean player gets allow recommendation", () => {
    const analysis = antiCheatEngine.analyzePlayer(7999); // New user, no events
    expect(analysis.recommendation).toBe("allow");
    expect(analysis.riskScore).toBe(0);
  });
});

// ─── Marketplace Tests ────────────────────────────────────────────────────────
describe("Phase H: Cart System", () => {
  it("H1: creates cart on first access", () => {
    const cart = cartSystem.getOrCreateCart(8001);
    expect(cart.userId).toBe(8001);
    expect(cart.items).toHaveLength(0);
  });

  it("H2: adds item to cart", () => {
    const cart = cartSystem.addItem(8001, {
      listingId: "listing_001",
      quantity: 2,
      unitPriceCents: 1000,
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.subtotalCents).toBe(2000);
  });

  it("H3: calculates platform fee correctly", () => {
    const cart = cartSystem.getOrCreateCart(8001);
    expect(cart.platformFeeCents).toBe(200); // 10% of 2000
    expect(cart.totalCents).toBe(2200);
  });

  it("H4: increases quantity for existing item", () => {
    const cart = cartSystem.addItem(8001, {
      listingId: "listing_001",
      quantity: 1,
      unitPriceCents: 1000,
    });
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.subtotalCents).toBe(3000);
  });

  it("H5: removes item from cart", () => {
    const cart = cartSystem.removeItem(8001, "listing_001");
    expect(cart.items).toHaveLength(0);
    expect(cart.subtotalCents).toBe(0);
  });

  it("H6: updateQuantity to 0 removes item", () => {
    cartSystem.addItem(8002, { listingId: "listing_002", quantity: 3, unitPriceCents: 500 });
    const cart = cartSystem.updateQuantity(8002, "listing_002", 0);
    expect(cart.items).toHaveLength(0);
  });
});

describe("Phase I: Order System", () => {
  let orderId: string;

  it("I1: creates an order with escrow", async () => {
    const order = await orderSystem.createOrder({
      buyerId: 9001,
      sellerId: 9002,
      listingId: "listing_100",
      listingTitle: "Digital Art NFT",
      listingType: "nft",
      quantity: 1,
      unitPriceCents: 5000,
      currency: "USD",
    });
    orderId = order.orderId;
    expect(order.status).toBe("pending_payment");
    expect(order.platformFeeCents).toBe(500); // 10%
    expect(order.sellerRevenueCents).toBe(4500);
    expect(order.escrowId).toBeTruthy();
  });

  it("I2: confirms payment and updates status", async () => {
    const order = await orderSystem.confirmPayment(orderId, "ch_stripe_123");
    expect(order.status).toBe("processing"); // NFT auto-processes
    expect(order.stripeChargeId).toBe("ch_stripe_123");
  });

  it("I3: getOrder returns correct data", () => {
    const order = orderSystem.getOrder(orderId);
    expect(order).not.toBeNull();
    expect(order!.buyerId).toBe(9001);
  });

  it("I4: getBuyerOrders returns orders for buyer", () => {
    const orders = orderSystem.getBuyerOrders(9001);
    expect(orders.some(o => o.orderId === orderId)).toBe(true);
  });

  it("I5: getSellerOrders returns orders for seller", () => {
    const orders = orderSystem.getSellerOrders(9002);
    expect(orders.some(o => o.orderId === orderId)).toBe(true);
  });

  it("I6: creates physical order and ships it", async () => {
    const physOrder = await orderSystem.createOrder({
      buyerId: 9003,
      sellerId: 9004,
      listingId: "listing_200",
      listingTitle: "T-Shirt",
      listingType: "physical",
      quantity: 2,
      unitPriceCents: 2500,
      paymentIntentId: "pi_test_456",
    });
    await orderSystem.confirmPayment(physOrder.orderId, "ch_test_456");
    const shipped = await orderSystem.markShipped(physOrder.orderId, 9004, "1Z999AA10123456784", "UPS");
    expect(shipped.status).toBe("shipped");
    expect(shipped.trackingNumber).toBe("1Z999AA10123456784");
  });

  it("I7: cancels order and refunds buyer", async () => {
    const cancelOrder = await orderSystem.createOrder({
      buyerId: 9005,
      sellerId: 9006,
      listingId: "listing_300",
      listingTitle: "Service",
      listingType: "service",
      quantity: 1,
      unitPriceCents: 10000,
    });
    const cancelled = await orderSystem.cancelOrder(cancelOrder.orderId, 9005, "Changed my mind");
    expect(cancelled.status).toBe("cancelled");
  });
});

describe("Phase J: Dispute System", () => {
  let disputeId: string;
  let disputeOrderId: string;

  it("J1: opens a dispute", async () => {
    const order = await orderSystem.createOrder({
      buyerId: 10001,
      sellerId: 10002,
      listingId: "listing_400",
      listingTitle: "Fake Item",
      listingType: "physical",
      quantity: 1,
      unitPriceCents: 3000,
      paymentIntentId: "pi_dispute_test",
    });
    disputeOrderId = order.orderId;
    await orderSystem.confirmPayment(disputeOrderId, "ch_dispute_test");

    const dispute = await disputeSystem.openDispute({
      orderId: disputeOrderId,
      initiatorId: 10001,
      reason: "Item not as described",
      description: "The item I received is completely different from the listing.",
    });
    disputeId = dispute.disputeId;
    expect(dispute.status).toBe("open");
    expect(dispute.initiatorId).toBe(10001);
    expect(dispute.respondentId).toBe(10002);
  });

  it("J2: adds evidence to dispute", async () => {
    const dispute = await disputeSystem.addEvidence(disputeId, 10001, {
      type: "text",
      content: "The seller sent a completely different product.",
    });
    expect(dispute.evidence).toHaveLength(1);
    expect(dispute.evidence[0].submittedBy).toBe(10001);
  });

  it("J3: resolves dispute in buyer's favor", async () => {
    const resolved = await disputeSystem.resolveDispute(disputeId, 99999, "Buyer's claim is valid", true);
    expect(resolved.status).toBe("resolved_buyer");
    expect(resolved.resolution).toBeTruthy();
  });

  it("J4: getOpenDisputes returns only open disputes", () => {
    const open = disputeSystem.getOpenDisputes();
    // The resolved dispute should not appear
    expect(open.every(d => d.status === "open" || d.status === "under_review")).toBe(true);
  });
});

describe("Phase K: Seller Dashboard", () => {
  it("K1: getDashboard returns correct structure", () => {
    const dashboard = sellerDashboard.getDashboard(9002, "all_time");
    expect(dashboard).toMatchObject({
      sellerId: 9002,
      period: "all_time",
      totalRevenueCents: expect.any(Number),
      completedOrderCount: expect.any(Number),
      reputationScore: expect.any(Number),
    });
  });

  it("K2: getReputation returns valid tier", () => {
    const rep = sellerDashboard.getReputation(9002);
    expect(["new", "rising", "established", "top_seller", "elite"]).toContain(rep.tier);
    expect(rep.overallScore).toBeGreaterThanOrEqual(0);
    expect(rep.overallScore).toBeLessThanOrEqual(100);
  });

  it("K3: getPayoutHistory returns array", () => {
    const history = sellerDashboard.getPayoutHistory(9002);
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Phase L: Affiliate System", () => {
  let affiliateCode: string;

  it("L1: creates an affiliate link", () => {
    const link = affiliateSystem.createLink(11001, "listing_500", 8);
    affiliateCode = link.code;
    expect(link.code).toHaveLength(12);
    expect(link.commissionPct).toBe(8);
    expect(link.isActive).toBe(true);
  });

  it("L2: tracks clicks", () => {
    const result = affiliateSystem.trackClick(affiliateCode);
    expect(result).toBe(true);
    const link = affiliateSystem.getLink(affiliateCode);
    expect(link!.clickCount).toBe(1);
  });

  it("L3: getAffiliateLinks returns user links", () => {
    const links = affiliateSystem.getAffiliateLinks(11001);
    expect(links.some(l => l.code === affiliateCode)).toBe(true);
  });

  it("L4: getAffiliateStats returns correct structure", () => {
    const stats = affiliateSystem.getAffiliateStats(11001);
    expect(stats).toMatchObject({
      totalClicks: expect.any(Number),
      totalConversions: expect.any(Number),
      totalEarningsCents: expect.any(Number),
      conversionRate: expect.any(Number),
    });
  });

  it("L5: deactivates link", () => {
    const result = affiliateSystem.deactivateLink(affiliateCode, 11001);
    expect(result).toBe(true);
    const link = affiliateSystem.getLink(affiliateCode);
    expect(link!.isActive).toBe(false);
  });

  it("L6: inactive link click returns false", () => {
    const result = affiliateSystem.trackClick(affiliateCode);
    expect(result).toBe(false);
  });
});

// ─── Crypto/Web3 Tests ────────────────────────────────────────────────────────
describe("Phase M: Wallet Connect", () => {
  let connectionId: string;
  const testAddress = "0xabcdef1234567890abcdef1234567890abcdef12";

  it("M1: generates a nonce", () => {
    const nonce = walletConnect.generateNonce(12001);
    expect(nonce).toHaveLength(32);
    expect(typeof nonce).toBe("string");
  });

  it("M2: connects a wallet", async () => {
    const connection = await walletConnect.connect({
      userId: 12001,
      address: testAddress,
      chainId: 1,
      signature: "0xsig",
      nonce: "testnonce",
      message: "Sign in with Ethereum",
    });
    connectionId = connection.connectionId;
    expect(connection.address).toBe(testAddress.toLowerCase());
    expect(connection.status).toBe("connected");
    expect(connection.isPrimary).toBe(true);
  });

  it("M3: getUserWallets returns connected wallets", () => {
    const wallets = walletConnect.getUserWallets(12001);
    expect(wallets.some(w => w.connectionId === connectionId)).toBe(true);
  });

  it("M4: getPrimaryWallet returns the primary wallet", () => {
    const primary = walletConnect.getPrimaryWallet(12001);
    expect(primary).not.toBeNull();
    expect(primary!.connectionId).toBe(connectionId);
  });

  it("M5: getWalletByAddress finds wallet", () => {
    const wallet = walletConnect.getWalletByAddress(testAddress);
    expect(wallet).not.toBeNull();
    expect(wallet!.userId).toBe(12001);
  });

  it("M6: disconnects wallet", async () => {
    const result = await walletConnect.disconnect(connectionId, 12001);
    expect(result).toBe(true);
    const wallets = walletConnect.getUserWallets(12001);
    expect(wallets.some(w => w.connectionId === connectionId)).toBe(false);
  });
});

describe("Phase N: Staking Engine", () => {
  let stakeId: string;

  it("N1: creates a stake position", async () => {
    const stake = await stakingEngine.stake({
      userId: 13001,
      walletAddress: "0xstaker001",
      amountFormatted: 1000,
      lockPeriodDays: 90,
    });
    stakeId = stake.stakeId;
    expect(stake.apy).toBe(20); // 90-day tier
    expect(stake.status).toBe("active");
    expect(stake.amountFormatted).toBe(1000);
  });

  it("N2: rejects stake below minimum", async () => {
    await expect(stakingEngine.stake({
      userId: 13001,
      walletAddress: "0xstaker001",
      amountFormatted: 50,
      lockPeriodDays: 30,
    })).rejects.toThrow("Minimum stake");
  });

  it("N3: rejects lock period below minimum", async () => {
    await expect(stakingEngine.stake({
      userId: 13001,
      walletAddress: "0xstaker001",
      amountFormatted: 500,
      lockPeriodDays: 3,
    })).rejects.toThrow("Minimum lock period");
  });

  it("N4: accrues rewards over time", async () => {
    // Manually set lastRewardAt to 2 hours ago
    const stake = stakingEngine.getStake(stakeId)!;
    stake.lastRewardAt = new Date(Date.now() - 2 * 3600 * 1000);
    const result = await stakingEngine.accrueRewards(stakeId);
    expect(result.rewardsAccrued).toBeGreaterThan(0);
    expect(result.totalRewards).toBeGreaterThan(0);
  });

  it("N5: getTotalStaked returns correct amount", () => {
    const total = stakingEngine.getTotalStaked(13001);
    expect(total).toBe(1000);
  });

  it("N6: getUserStakes returns active stakes", () => {
    const stakes = stakingEngine.getUserStakes(13001, "active");
    expect(stakes.some(s => s.stakeId === stakeId)).toBe(true);
  });

  it("N7: requestUnstake before lock period shows penalty", async () => {
    const result = await stakingEngine.requestUnstake(stakeId, 13001);
    expect(result.canUnstake).toBe(false);
    expect(result.penaltyPct).toBe(15);
  });

  it("N8: requestUnstake after lock period has no penalty", async () => {
    const expiredStake = await stakingEngine.stake({
      userId: 13002,
      walletAddress: "0xstaker002",
      amountFormatted: 500,
      lockPeriodDays: 7,
    });
    // Manually expire the lock
    const stake = stakingEngine.getStake(expiredStake.stakeId)!;
    stake.unlockAt = new Date(Date.now() - 1000);
    const result = await stakingEngine.requestUnstake(expiredStake.stakeId, 13002);
    expect(result.canUnstake).toBe(true);
    expect(result.penaltyPct).toBe(0);
  });
});

describe("Phase O: DEX Swap Engine", () => {
  let quoteId: string;
  let swapId: string;

  it("O1: generates a swap quote", async () => {
    const quote = await dexSwapEngine.getQuote({
      fromToken: "0xUSDC",
      toToken: "0xSKYCOIN_CONTRACT_ADDRESS",
      fromAmount: "1000000", // 1 USDC (6 decimals)
    });
    quoteId = quote.quoteId;
    expect(quote.toAmount).toBeTruthy();
    expect(quote.priceImpactPct).toBeGreaterThanOrEqual(0);
    expect(quote.slippagePct).toBe(0.5);
    expect(quote.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("O2: rejects quote for unknown token", async () => {
    await expect(dexSwapEngine.getQuote({
      fromToken: "0xUNKNOWN",
      toToken: "0xUSDC",
      fromAmount: "1000000",
    })).rejects.toThrow("Unknown token");
  });

  it("O3: executes a swap", async () => {
    const execution = await dexSwapEngine.executeSwap({
      userId: 14001,
      quoteId,
      walletAddress: "0xswapper001",
    });
    swapId = execution.swapId;
    expect(execution.status).toBe("submitted");
    expect(execution.fromToken).toBe("0xUSDC");
  });

  it("O4: confirms a swap", async () => {
    const confirmed = await dexSwapEngine.confirmSwap(swapId, "0xtxhash", 12345678, "120000", "5000000000000000000");
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.blockNumber).toBe(12345678);
  });

  it("O5: getUserSwaps returns swap history", () => {
    const swaps = dexSwapEngine.getUserSwaps(14001);
    expect(swaps.some(s => s.swapId === swapId)).toBe(true);
  });

  it("O6: fails a swap gracefully", async () => {
    const failQuote = await dexSwapEngine.getQuote({
      fromToken: "0xETH",
      toToken: "0xUSDC",
      fromAmount: "1000000000000000000",
    });
    const failExec = await dexSwapEngine.executeSwap({
      userId: 14002,
      quoteId: failQuote.quoteId,
      walletAddress: "0xswapper002",
    });
    const failed = await dexSwapEngine.failSwap(failExec.swapId, "Insufficient liquidity");
    expect(failed.status).toBe("failed");
    expect(failed.failureReason).toBe("Insufficient liquidity");
  });
});

describe("Phase P: Treasury Engine", () => {
  it("P1: takes a treasury snapshot", async () => {
    const snapshot = await treasuryEngine.takeSnapshot(5000000); // $5M
    expect(snapshot.totalValueUSD).toBe(5000000);
    expect(snapshot.allocations.length).toBeGreaterThan(0);
    expect(snapshot.monthlyYieldUSD).toBeGreaterThan(0);
  });

  it("P2: getLatestSnapshot returns the snapshot", () => {
    const latest = treasuryEngine.getLatestSnapshot();
    expect(latest).not.toBeNull();
    expect(latest!.totalValueUSD).toBe(5000000);
  });

  it("P3: allocations sum to 100%", () => {
    const latest = treasuryEngine.getLatestSnapshot()!;
    const totalPct = latest.allocations.reduce((sum, a) => sum + a.targetPct, 0);
    expect(totalPct).toBe(100);
  });

  it("P4: getSnapshotHistory returns snapshots", async () => {
    await treasuryEngine.takeSnapshot(5100000);
    const history = treasuryEngine.getSnapshotHistory(30);
    expect(history.length).toBeGreaterThanOrEqual(2);
  });

  it("P5: checkRebalanceNeeded returns correct structure", async () => {
    const result = await treasuryEngine.checkRebalanceNeeded();
    expect(result).toMatchObject({
      needed: expect.any(Boolean),
      deviations: expect.any(Array),
    });
  });
});

describe("Phase Q: Vesting Engine", () => {
  let vestingId: string;

  it("Q1: creates a linear vesting schedule", () => {
    const schedule = vestingEngine.createSchedule({
      beneficiaryId: 15001,
      walletAddress: "0xbeneficiary001",
      totalAmount: "1000000000000000000000", // 1000 tokens
      cliffDate: new Date(Date.now() - 30 * 24 * 3600 * 1000), // Cliff passed
      vestingEndDate: new Date(Date.now() + 335 * 24 * 3600 * 1000), // 335 days remaining
      vestingType: "linear",
    });
    vestingId = schedule.vestingId;
    expect(schedule.vestingType).toBe("linear");
    expect(schedule.claimedAmount).toBe("0");
  });

  it("Q2: calculates vested amount correctly", () => {
    const vested = vestingEngine.calculateVested(vestingId);
    const vestedNum = BigInt(vested);
    expect(vestedNum).toBeGreaterThan(BigInt(0)); // Some should be vested
  });

  it("Q3: cliff vesting returns 0 before cliff", () => {
    const schedule = vestingEngine.createSchedule({
      beneficiaryId: 15002,
      walletAddress: "0xbeneficiary002",
      totalAmount: "500000000000000000000",
      cliffDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), // Future cliff
      vestingEndDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      vestingType: "cliff",
    });
    const vested = vestingEngine.calculateVested(schedule.vestingId);
    expect(vested).toBe("0");
  });

  it("Q4: can claim vested tokens", async () => {
    const result = await vestingEngine.claim(vestingId, 15001);
    expect(BigInt(result.claimedAmount)).toBeGreaterThan(BigInt(0));
    expect(result.txHash).toMatch(/^0x/);
  });

  it("Q5: cannot claim when nothing left to claim", async () => {
    // Immediately after claiming, nothing should be left
    await expect(vestingEngine.claim(vestingId, 15001)).rejects.toThrow("Nothing to claim");
  });

  it("Q6: getUserSchedules returns schedules", () => {
    const schedules = vestingEngine.getUserSchedules(15001);
    expect(schedules.some(s => s.vestingId === vestingId)).toBe(true);
  });
});

describe("Phase R: Governance Engine", () => {
  it("R1: getVotingPower returns correct structure", async () => {
    // First stake some tokens to have voting power
    await stakingEngine.stake({
      userId: 16001,
      walletAddress: "0xvoter001",
      amountFormatted: 5000,
      lockPeriodDays: 365,
    });
    const power = await governanceEngine.getVotingPower(16001);
    expect(power).toMatchObject({
      userId: 16001,
      stakedTokens: expect.any(Number),
      totalVotingPower: expect.any(Number),
      multiplier: expect.any(Number),
    });
    expect(power.multiplier).toBe(3.0); // 365-day lock = 3x multiplier
    expect(power.totalVotingPower).toBe(5000 * 3.0);
  });

  it("R2: delegates voting power", async () => {
    const result = await governanceEngine.delegate(16001, "0xdelegate001");
    expect(result).toBe(true);
    const power = await governanceEngine.getVotingPower(16001);
    expect(power.delegatedTo).toBe("0xdelegate001");
  });

  it("R3: undelegates voting power", async () => {
    const result = await governanceEngine.undelegate(16001);
    expect(result).toBe(true);
    const power = await governanceEngine.getVotingPower(16001);
    expect(power.delegatedTo).toBeUndefined();
  });

  it("R4: getTopVoters returns sorted list", async () => {
    await stakingEngine.stake({ userId: 16002, walletAddress: "0xvoter002", amountFormatted: 10000, lockPeriodDays: 180 });
    const topVoters = governanceEngine.getTopVoters(10);
    expect(topVoters.length).toBeGreaterThan(0);
    if (topVoters.length > 1) {
      expect(topVoters[0].totalVotingPower).toBeGreaterThanOrEqual(topVoters[1].totalVotingPower);
    }
  });
});

describe("Phase S: Platform Crypto Stats", () => {
  it("S1: getCryptoStats returns comprehensive stats", () => {
    const stats = cryptoStats.getPlatformStats();
    expect(stats).toMatchObject({
      connectedWallets: expect.any(Number),
      totalStaked: expect.any(Number),
      activeStakeCount: expect.any(Number),
      totalRewardsDistributed: expect.any(Number),
      totalSwaps: expect.any(Number),
      confirmedSwaps: expect.any(Number),
      swapSuccessRate: expect.any(Number),
    });
    expect(stats.swapSuccessRate).toBeGreaterThanOrEqual(0);
    expect(stats.swapSuccessRate).toBeLessThanOrEqual(1);
  });

  it("S2: marketplaceStats returns overview", () => {
    const stats = marketplaceStats.getOverview();
    expect(stats).toMatchObject({
      totalOrders: expect.any(Number),
      completedOrders: expect.any(Number),
      totalGMVCents: expect.any(Number),
      totalPlatformRevenueCents: expect.any(Number),
    });
    expect(stats.totalPlatformRevenueCents).toBeLessThanOrEqual(stats.totalGMVCents);
  });
});
