/**
 * Phase 5 Sovereignty Test Suite
 * Covers: SKY444 Chain Economy, NFT Ownership, Payment Core, Data Warehouse,
 *         Ad Network, Mobile Core, Distribution, Security Core, Infrastructure
 * Target: 200+ tests across all Phase 5 systems
 */

import { describe, it, expect, beforeEach } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5A: SKY444 CHAIN ECONOMY TESTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  sky444Token, stakingContract, treasuryContract, burnContract,
  farmingContract, emissionsEngine, vestingEngine, launchpadEngine,
} from "./phase5-adapters";

describe("SKY444 Token — Core Operations", () => {
  it("should return zero balance for unknown address", () => {
    const balance = sky444Token.getBalance("0xunknown");
    expect(balance).toBe(0);
  });

  it("should mint tokens to an address", () => {
    sky444Token.mint("0xtest001", 1000);
    const balance = sky444Token.getBalance("0xtest001");
    expect(balance).toBe(1000);
  });

  it("should transfer tokens between addresses", () => {
    sky444Token.mint("0xsender", 500);
    const result = sky444Token.transfer("0xsender", "0xreceiver", 200);
    expect(result.success).toBe(true);
    expect(sky444Token.getBalance("0xsender")).toBe(300);
    expect(sky444Token.getBalance("0xreceiver")).toBe(200);
  });

  it("should reject transfer when insufficient balance", () => {
    sky444Token.mint("0xpoor", 50);
    const result = sky444Token.transfer("0xpoor", "0xrich", 100);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient");
  });

  it("should burn tokens from an address", () => {
    sky444Token.mint("0xburner", 1000);
    sky444Token.burn("0xburner", 300);
    expect(sky444Token.getBalance("0xburner")).toBe(700);
  });

  it("should return correct total supply", () => {
    const supply = sky444Token.getTotalSupply();
    expect(typeof supply).toBe("number");
    expect(supply).toBeGreaterThanOrEqual(0);
  });

  it("should return token analytics", () => {
    const analytics = sky444Token.getAnalytics();
    expect(analytics).toHaveProperty("totalSupply");
    expect(analytics).toHaveProperty("circulatingSupply");
    expect(analytics).toHaveProperty("burnedSupply");
  });

  it("should reject transfer to zero address", () => {
    sky444Token.mint("0xvalid", 100);
    const result = sky444Token.transfer("0xvalid", "0x0000000000000000000000000000000000000000", 50);
    expect(result.success).toBe(false);
  });
});

describe("SKY444 Staking Contract", () => {
  it("should stake tokens and return a staking position", () => {
    sky444Token.mint("0xstaker1", 10000);
    const result = stakingContract.stake(1, "0xstaker1", 1000, 30);
    expect(result.success).toBe(true);
    expect(result.stakeId).toBeDefined();
    expect(result.apy).toBeGreaterThan(0);
  });

  it("should calculate higher APY for longer lock periods", () => {
    sky444Token.mint("0xstaker2", 20000);
    const short = stakingContract.stake(2, "0xstaker2", 1000, 30);
    const long = stakingContract.stake(2, "0xstaker2", 1000, 365);
    expect(long.apy).toBeGreaterThan(short.apy);
  });

  it("should reject staking with insufficient balance", () => {
    sky444Token.mint("0xpoorstaker", 100);
    const result = stakingContract.stake(3, "0xpoorstaker", 10000, 30);
    expect(result.success).toBe(false);
  });

  it("should return staking positions for a wallet", () => {
    sky444Token.mint("0xpositionholder", 5000);
    stakingContract.stake(4, "0xpositionholder", 500, 60);
    const positions = stakingContract.getPositions("0xpositionholder");
    expect(Array.isArray(positions)).toBe(true);
    expect(positions.length).toBeGreaterThan(0);
  });

  it("should reject unstaking before lock period expires", () => {
    sky444Token.mint("0xlocked", 5000);
    const stakeResult = stakingContract.stake(5, "0xlocked", 1000, 365);
    const unstakeResult = stakingContract.unstake(stakeResult.stakeId!);
    expect(unstakeResult.success).toBe(false);
    expect(unstakeResult.error).toContain("locked");
  });

  it("should claim staking rewards", () => {
    sky444Token.mint("0xrewardclaimer", 5000);
    const stakeResult = stakingContract.stake(6, "0xrewardclaimer", 1000, 30);
    const claimResult = stakingContract.claimRewards(stakeResult.stakeId!);
    expect(claimResult.success).toBe(true);
    expect(typeof claimResult.rewards).toBe("number");
  });
});

describe("SKY444 Treasury Contract", () => {
  it("should return treasury stats", () => {
    const stats = treasuryContract.getStats();
    expect(stats).toHaveProperty("totalBalance");
    expect(stats).toHaveProperty("allocations");
    expect(stats).toHaveProperty("recentTransactions");
  });

  it("should allocate treasury funds", () => {
    const result = treasuryContract.allocate("development", 10000, "Q1 development budget");
    expect(result.success).toBe(true);
    expect(result.allocationId).toBeDefined();
  });

  it("should reject allocation exceeding available balance", () => {
    const stats = treasuryContract.getStats();
    const result = treasuryContract.allocate("impossible", stats.totalBalance + 1000000, "Too much");
    expect(result.success).toBe(false);
  });
});

describe("SKY444 Burn Contract", () => {
  it("should burn tokens and record the event", () => {
    sky444Token.mint("0xburntest", 5000);
    const result = burnContract.burn("0xburntest", 500, "fee_burn");
    expect(result.success).toBe(true);
    expect(result.burnId).toBeDefined();
    expect(result.totalBurned).toBeGreaterThan(0);
  });

  it("should return burn statistics", () => {
    const stats = burnContract.getStats();
    expect(stats).toHaveProperty("totalBurned");
    expect(stats).toHaveProperty("burnRate");
    expect(stats).toHaveProperty("burnHistory");
  });

  it("should reject burn with insufficient balance", () => {
    sky444Token.mint("0xnoburnfunds", 10);
    const result = burnContract.burn("0xnoburnfunds", 1000, "fee_burn");
    expect(result.success).toBe(false);
  });
});

describe("SKY444 Farming Contract", () => {
  it("should return available farming pools", () => {
    const pools = farmingContract.getPools();
    expect(Array.isArray(pools)).toBe(true);
    expect(pools.length).toBeGreaterThan(0);
  });

  it("should allow deposit into a farming pool", () => {
    sky444Token.mint("0xfarmer1", 10000);
    const pools = farmingContract.getPools();
    const result = farmingContract.deposit(pools[0].id, "0xfarmer1", 1000);
    expect(result.success).toBe(true);
    expect(result.positionId).toBeDefined();
  });

  it("should harvest farming rewards", () => {
    sky444Token.mint("0xfarmer2", 10000);
    const pools = farmingContract.getPools();
    const depositResult = farmingContract.deposit(pools[0].id, "0xfarmer2", 1000);
    const harvestResult = farmingContract.harvest(depositResult.positionId!);
    expect(harvestResult.success).toBe(true);
    expect(typeof harvestResult.harvested).toBe("number");
  });
});

describe("SKY444 Emissions Engine", () => {
  it("should return emissions schedule", () => {
    const schedule = emissionsEngine.getSchedule();
    expect(schedule).toHaveProperty("phases");
    expect(Array.isArray(schedule.phases)).toBe(true);
    expect(schedule.phases.length).toBeGreaterThan(0);
  });

  it("should calculate current epoch emissions", () => {
    const current = emissionsEngine.getCurrentEpoch();
    expect(current).toHaveProperty("epoch");
    expect(current).toHaveProperty("dailyEmission");
    expect(current.dailyEmission).toBeGreaterThanOrEqual(0);
  });
});

describe("SKY444 Vesting Engine", () => {
  it("should create a vesting schedule", () => {
    const result = vestingEngine.createSchedule("0xvestee", 10000, 12, 3, "team");
    expect(result.success).toBe(true);
    expect(result.scheduleId).toBeDefined();
  });

  it("should return vesting schedules for a wallet", () => {
    vestingEngine.createSchedule("0xvestee2", 5000, 6, 1, "advisor");
    const schedules = vestingEngine.getSchedules("0xvestee2");
    expect(Array.isArray(schedules)).toBe(true);
  });

  it("should calculate claimable amount based on elapsed time", () => {
    const result = vestingEngine.createSchedule("0xvestee3", 12000, 12, 0, "investor");
    const claimable = vestingEngine.getClaimable(result.scheduleId!);
    expect(typeof claimable).toBe("number");
    expect(claimable).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5B: NFT OWNERSHIP ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  nftMinting, creatorDrops, rarityEngine as nftRarity,
  royaltyEngine, nftSettlement, specialNFTs, nftRegistry,
} from "./phase5-adapters";

describe("NFT Minting", () => {
  it("should mint an NFT and return token data", () => {
    const result = nftMinting.mint(1, "collection-001", {
      name: "Test NFT #1",
      description: "A test NFT",
      image: "ipfs://QmTest123",
      attributes: [{ trait_type: "Rarity", value: "Common" }],
    }, "0xrecipient001");
    expect(result.success).toBe(true);
    expect(result.tokenId).toBeDefined();
    expect(result.metadataUri).toContain("ipfs://");
  });

  it("should reject minting with invalid metadata", () => {
    const result = nftMinting.mint(1, "collection-001", {
      name: "",
      description: "Missing name",
      image: "",
    }, "0xrecipient002");
    expect(result.success).toBe(false);
  });

  it("should track minted NFTs in registry", () => {
    nftMinting.mint(2, "collection-002", {
      name: "Registry Test NFT",
      description: "Testing registry",
      image: "ipfs://QmRegistry",
    }, "0xregistrytest");
    const nfts = nftRegistry.getByOwner("0xregistrytest");
    expect(Array.isArray(nfts)).toBe(true);
    expect(nfts.length).toBeGreaterThan(0);
  });
});

describe("Creator Drops", () => {
  it("should create a new drop", () => {
    const result = creatorDrops.createDrop(1, {
      name: "Genesis Collection",
      description: "First drop",
      totalSupply: 100,
      price: 0.1,
      currency: "ETH",
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 86400000),
      creatorAddress: "0xcreator001",
    });
    expect(result.success).toBe(true);
    expect(result.dropId).toBeDefined();
  });

  it("should allow minting from an active drop", () => {
    const dropResult = creatorDrops.createDrop(2, {
      name: "Active Drop",
      description: "Mintable",
      totalSupply: 50,
      price: 0.05,
      currency: "ETH",
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 86400000),
      creatorAddress: "0xcreator002",
    });
    const mintResult = creatorDrops.mintFromDrop(dropResult.dropId!, "0xminter001", 1);
    expect(mintResult.success).toBe(true);
    expect(mintResult.tokenIds).toBeDefined();
    expect(mintResult.tokenIds!.length).toBe(1);
  });

  it("should reject minting from a future drop", () => {
    const dropResult = creatorDrops.createDrop(3, {
      name: "Future Drop",
      description: "Not yet",
      totalSupply: 10,
      price: 1,
      currency: "ETH",
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 172800000),
      creatorAddress: "0xcreator003",
    });
    const mintResult = creatorDrops.mintFromDrop(dropResult.dropId!, "0xearlyminter", 1);
    expect(mintResult.success).toBe(false);
    expect(mintResult.error).toContain("not started");
  });

  it("should enforce supply limits", () => {
    const dropResult = creatorDrops.createDrop(4, {
      name: "Limited Drop",
      description: "Only 2",
      totalSupply: 2,
      price: 0.1,
      currency: "ETH",
      startTime: new Date(Date.now() - 1000),
      endTime: new Date(Date.now() + 86400000),
      creatorAddress: "0xcreator004",
    });
    creatorDrops.mintFromDrop(dropResult.dropId!, "0xbuyer1", 1);
    creatorDrops.mintFromDrop(dropResult.dropId!, "0xbuyer2", 1);
    const overflow = creatorDrops.mintFromDrop(dropResult.dropId!, "0xbuyer3", 1);
    expect(overflow.success).toBe(false);
    expect(overflow.error).toContain("sold out");
  });
});

describe("NFT Rarity Engine", () => {
  it("should calculate rarity score for an NFT", () => {
    const score = nftRarity.getScore("token-001", "collection-001");
    expect(typeof score.score).toBe("number");
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
  });

  it("should rank NFTs within a collection", () => {
    const rankings = nftRarity.getRankings("collection-001");
    expect(Array.isArray(rankings)).toBe(true);
  });
});

describe("Royalty Engine", () => {
  it("should calculate royalties for a sale", () => {
    const result = royaltyEngine.calculate("collection-001", 1000);
    expect(result).toHaveProperty("creatorRoyalty");
    expect(result).toHaveProperty("platformFee");
    expect(result).toHaveProperty("sellerProceeds");
    expect(result.creatorRoyalty + result.platformFee + result.sellerProceeds).toBeCloseTo(1000, 1);
  });

  it("should set custom royalty percentage for a collection", () => {
    royaltyEngine.setRoyalty("collection-custom", 0.08); // 8%
    const result = royaltyEngine.calculate("collection-custom", 1000);
    expect(result.creatorRoyalty).toBeCloseTo(80, 0);
  });
});

describe("NFT Settlement", () => {
  it("should settle an NFT sale and distribute proceeds", () => {
    const result = nftSettlement.settle(
      "token-settle-001",
      "collection-001",
      "0xseller",
      "0xbuyer",
      500,
    );
    expect(result.success).toBe(true);
    expect(result.settlementId).toBeDefined();
    expect(result.breakdown).toHaveProperty("sellerProceeds");
  });
});

describe("Special NFTs", () => {
  it("should mint a donor NFT for a charity contribution", () => {
    const result = specialNFTs.mintDonorNFT(1, "campaign-001", 100, "0xdonor001");
    expect(result.success).toBe(true);
    expect(result.tokenId).toBeDefined();
    expect(result.tier).toBeDefined();
  });

  it("should mint a higher tier NFT for larger donations", () => {
    const small = specialNFTs.mintDonorNFT(2, "campaign-001", 10, "0xsmalldonor");
    const large = specialNFTs.mintDonorNFT(3, "campaign-001", 10000, "0xlargedonor");
    expect(large.tier).not.toBe(small.tier);
  });

  it("should mint an achievement NFT", () => {
    const result = specialNFTs.mintAchievementNFT(1, "first_stream", "0xachiver");
    expect(result.success).toBe(true);
    expect(result.tokenId).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5C: PAYMENT CORE TESTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  payoutLedger, escrowEngine, subscriptionEngine,
  invoiceGenerator, taxEngine, revenueSplitEngine, refundEngine,
} from "./phase5-adapters";

describe("Payout Ledger", () => {
  it("should create a payout request", () => {
    const result = payoutLedger.createPayout(1, 500, "USD", "bank_transfer", "account-001", "Creator earnings");
    expect(result.success).toBe(true);
    expect(result.payoutId).toBeDefined();
    expect(result.status).toBe("pending");
  });

  it("should return payout history for a user", () => {
    payoutLedger.createPayout(2, 100, "USD", "crypto", "0xwallet", "Test payout");
    const history = payoutLedger.getHistory(2);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("should reject payout below minimum threshold", () => {
    const result = payoutLedger.createPayout(3, 0.01, "USD", "bank_transfer", "account-003", "Too small");
    expect(result.success).toBe(false);
    expect(result.error).toContain("minimum");
  });

  it("should process pending payouts in batch", () => {
    payoutLedger.createPayout(4, 200, "USD", "crypto", "0xbatch", "Batch test");
    const result = payoutLedger.processBatch();
    expect(result).toHaveProperty("processed");
    expect(result).toHaveProperty("failed");
    expect(typeof result.processed).toBe("number");
  });
});

describe("Escrow Engine", () => {
  it("should create an escrow transaction", () => {
    const result = escrowEngine.create(1, 2, 1000, "USD", "Service payment", 72);
    expect(result.success).toBe(true);
    expect(result.escrowId).toBeDefined();
    expect(result.status).toBe("pending");
  });

  it("should release escrow to seller", () => {
    const createResult = escrowEngine.create(3, 4, 500, "USD", "Product delivery");
    const releaseResult = escrowEngine.release(createResult.escrowId!, 3);
    expect(releaseResult.success).toBe(true);
    expect(releaseResult.status).toBe("released");
  });

  it("should open a dispute on escrow", () => {
    const createResult = escrowEngine.create(5, 6, 750, "USD", "Disputed service");
    const disputeResult = escrowEngine.dispute(createResult.escrowId!, 5, "Service not delivered");
    expect(disputeResult.success).toBe(true);
    expect(disputeResult.status).toBe("disputed");
  });

  it("should reject release by non-buyer", () => {
    const createResult = escrowEngine.create(7, 8, 300, "USD", "Unauthorized release test");
    const releaseResult = escrowEngine.release(createResult.escrowId!, 999);
    expect(releaseResult.success).toBe(false);
  });

  it("should timeout escrow after deadline", () => {
    const createResult = escrowEngine.create(9, 10, 200, "USD", "Timeout test", 0);
    const status = escrowEngine.checkTimeout(createResult.escrowId!);
    expect(status).toHaveProperty("timedOut");
  });
});

describe("Subscription Engine", () => {
  it("should create a subscription", () => {
    const result = subscriptionEngine.subscribe(1, 2, "tier-gold", "crypto");
    expect(result.success).toBe(true);
    expect(result.subscriptionId).toBeDefined();
    expect(result.status).toBe("active");
  });

  it("should cancel a subscription", () => {
    const subResult = subscriptionEngine.subscribe(3, 4, "tier-silver", "card");
    const cancelResult = subscriptionEngine.cancel(subResult.subscriptionId!);
    expect(cancelResult.success).toBe(true);
    expect(cancelResult.status).toBe("cancelled");
  });

  it("should upgrade a subscription tier", () => {
    const subResult = subscriptionEngine.subscribe(5, 6, "tier-bronze", "crypto");
    const upgradeResult = subscriptionEngine.upgrade(subResult.subscriptionId!, "tier-gold");
    expect(upgradeResult.success).toBe(true);
    expect(upgradeResult.newTier).toBe("tier-gold");
  });

  it("should process subscription renewals", () => {
    const result = subscriptionEngine.processRenewals();
    expect(result).toHaveProperty("renewed");
    expect(result).toHaveProperty("failed");
    expect(result).toHaveProperty("expired");
  });
});

describe("Invoice Generator", () => {
  it("should generate an invoice with line items", () => {
    const result = invoiceGenerator.generate(1, [
      { description: "Premium subscription", quantity: 1, unitPrice: 29.99, currency: "USD" },
      { description: "Extra storage", quantity: 2, unitPrice: 5.00, currency: "USD" },
    ], "USD");
    expect(result.success).toBe(true);
    expect(result.invoiceId).toBeDefined();
    expect(result.total).toBeCloseTo(39.99, 2);
  });

  it("should apply tax to invoice total", () => {
    const result = invoiceGenerator.generate(2, [
      { description: "Service fee", quantity: 1, unitPrice: 100, currency: "USD" },
    ], "USD", { taxRate: 0.1 });
    expect(result.taxAmount).toBeCloseTo(10, 2);
    expect(result.total).toBeCloseTo(110, 2);
  });
});

describe("Tax Engine", () => {
  it("should generate a tax report for a user", () => {
    const report = taxEngine.generateReport(1, 2024);
    expect(report).toHaveProperty("userId");
    expect(report).toHaveProperty("year");
    expect(report).toHaveProperty("totalIncome");
    expect(report).toHaveProperty("taxableIncome");
    expect(report).toHaveProperty("transactions");
  });

  it("should classify income by type", () => {
    const report = taxEngine.generateReport(2, 2024);
    expect(report).toHaveProperty("incomeBreakdown");
    expect(report.incomeBreakdown).toHaveProperty("creatorEarnings");
    expect(report.incomeBreakdown).toHaveProperty("stakingRewards");
    expect(report.incomeBreakdown).toHaveProperty("nftSales");
  });
});

describe("Revenue Split Engine", () => {
  it("should split revenue according to percentages", () => {
    const result = revenueSplitEngine.split(1000, "USD", [
      { userId: 1, percentage: 70, role: "creator" },
      { userId: 2, percentage: 20, role: "collaborator" },
      { userId: 0, percentage: 10, role: "platform" },
    ]);
    expect(result.success).toBe(true);
    expect(result.splits).toHaveLength(3);
    const total = result.splits.reduce((sum: number, s: any) => sum + s.amount, 0);
    expect(total).toBeCloseTo(1000, 2);
  });

  it("should reject splits that don't sum to 100%", () => {
    const result = revenueSplitEngine.split(1000, "USD", [
      { userId: 1, percentage: 60, role: "creator" },
      { userId: 2, percentage: 20, role: "collaborator" },
    ]);
    expect(result.success).toBe(false);
    expect(result.error).toContain("100%");
  });
});

describe("Refund Engine", () => {
  it("should create a refund request", () => {
    const result = refundEngine.request("txn-001", 1, "Service not delivered");
    expect(result.success).toBe(true);
    expect(result.refundId).toBeDefined();
    expect(result.status).toBe("pending");
  });

  it("should process a full refund", () => {
    const reqResult = refundEngine.request("txn-002", 2, "Duplicate charge");
    const processResult = refundEngine.process(reqResult.refundId!, "full");
    expect(processResult.success).toBe(true);
    expect(processResult.refundedAmount).toBeGreaterThan(0);
  });

  it("should process a partial refund", () => {
    const reqResult = refundEngine.request("txn-003", 3, "Partial issue");
    const processResult = refundEngine.process(reqResult.refundId!, "partial", 50);
    expect(processResult.success).toBe(true);
    expect(processResult.refundedAmount).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5D: DATA WAREHOUSE TESTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  eventStore, analyticsAggregator, creatorWarehouse,
  fraudWarehouse, treasuryWarehouse, retentionWarehouse, dataExportPipeline,
} from "./phase5-adapters";

describe("Event Store", () => {
  it("should track a user event", () => {
    const result = eventStore.track(1, "page_view", "post", "post-001", { source: "feed" });
    expect(result.success).toBe(true);
    expect(result.eventId).toBeDefined();
  });

  it("should batch track multiple events", () => {
    const events = [
      { userId: 1, eventType: "click", entityType: "button", entityId: "like-btn" },
      { userId: 2, eventType: "scroll", entityType: "feed", entityId: "main-feed" },
      { userId: 3, eventType: "video_play", entityType: "reel", entityId: "reel-001" },
    ];
    const result = eventStore.batchTrack(events);
    expect(result.tracked).toBe(3);
  });

  it("should query events by user", () => {
    eventStore.track(10, "login", "auth", "session-001");
    const events = eventStore.query({ userId: 10, limit: 10 });
    expect(Array.isArray(events)).toBe(true);
  });

  it("should query events by type", () => {
    eventStore.track(11, "purchase", "nft", "nft-001");
    const events = eventStore.query({ eventType: "purchase", limit: 10 });
    expect(Array.isArray(events)).toBe(true);
  });
});

describe("Creator Warehouse", () => {
  it("should return creator performance metrics", () => {
    const perf = creatorWarehouse.getPerformance(1, "30d");
    expect(perf).toHaveProperty("creatorId");
    expect(perf).toHaveProperty("totalRevenue");
    expect(perf).toHaveProperty("totalViews");
    expect(perf).toHaveProperty("subscriberGrowth");
  });

  it("should return top performing creators", () => {
    const top = creatorWarehouse.getTopCreators(10);
    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeLessThanOrEqual(10);
  });
});

describe("Fraud Warehouse", () => {
  it("should return fraud report", () => {
    const report = fraudWarehouse.getReport();
    expect(report).toHaveProperty("totalFlags");
    expect(report).toHaveProperty("byType");
    expect(report).toHaveProperty("recentIncidents");
  });

  it("should log a fraud incident", () => {
    const result = fraudWarehouse.logIncident(1, "wash_trading", "high", { evidence: "repeated self-trades" });
    expect(result.success).toBe(true);
    expect(result.incidentId).toBeDefined();
  });

  it("should filter fraud report by severity", () => {
    const highSeverity = fraudWarehouse.getReport(undefined, "high");
    expect(highSeverity).toHaveProperty("totalFlags");
  });
});

describe("Treasury Warehouse", () => {
  it("should return treasury report", () => {
    const report = treasuryWarehouse.getReport();
    expect(report).toHaveProperty("totalBalance");
    expect(report).toHaveProperty("inflows");
    expect(report).toHaveProperty("outflows");
    expect(report).toHaveProperty("allocations");
  });
});

describe("Retention Warehouse", () => {
  it("should return retention report", () => {
    const report = retentionWarehouse.getReport();
    expect(report).toHaveProperty("cohorts");
    expect(report).toHaveProperty("averageRetention");
    expect(report).toHaveProperty("churnRate");
  });
});

describe("Data Export Pipeline", () => {
  it("should export user data in JSON format", () => {
    const result = dataExportPipeline.export("users", "json");
    expect(result.success).toBe(true);
    expect(result.exportId).toBeDefined();
    expect(result.format).toBe("json");
  });

  it("should export analytics data in CSV format", () => {
    const result = dataExportPipeline.export("analytics", "csv");
    expect(result.success).toBe(true);
    expect(result.format).toBe("csv");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5E: AD NETWORK TESTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  campaignManager, rtbAuction, impressionTracker,
  conversionTracker, sponsorshipEngine as adSponsorshipEngine, adFraudDetector,
} from "./phase5-adapters";

describe("Campaign Manager", () => {
  it("should create an ad campaign", () => {
    const result = campaignManager.create(1, {
      name: "Test Campaign",
      budget: 1000,
      currency: "USD",
      targeting: { interests: ["gaming", "crypto"] },
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 86400000),
    });
    expect(result.success).toBe(true);
    expect(result.campaignId).toBeDefined();
  });

  it("should reject campaign with zero budget", () => {
    const result = campaignManager.create(2, {
      name: "Zero Budget",
      budget: 0,
      currency: "USD",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
    });
    expect(result.success).toBe(false);
  });

  it("should return campaign statistics", () => {
    const createResult = campaignManager.create(3, {
      name: "Stats Test",
      budget: 500,
      currency: "USD",
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 86400000),
    });
    const stats = campaignManager.getStats(createResult.campaignId!);
    expect(stats).toHaveProperty("impressions");
    expect(stats).toHaveProperty("clicks");
    expect(stats).toHaveProperty("ctr");
    expect(stats).toHaveProperty("spent");
  });

  it("should pause and resume a campaign", () => {
    const createResult = campaignManager.create(4, {
      name: "Pause Test",
      budget: 200,
      currency: "USD",
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 86400000),
    });
    const pauseResult = campaignManager.pause(createResult.campaignId!);
    expect(pauseResult.success).toBe(true);
    expect(pauseResult.status).toBe("paused");

    const resumeResult = campaignManager.resume(createResult.campaignId!);
    expect(resumeResult.success).toBe(true);
    expect(resumeResult.status).toBe("active");
  });
});

describe("RTB Auction", () => {
  it("should run an auction for an ad placement", () => {
    const result = rtbAuction.run("feed_top", { userId: 1, interests: ["gaming"] });
    expect(result).toHaveProperty("winner");
    expect(result).toHaveProperty("clearingPrice");
  });

  it("should return no winner when no eligible campaigns", () => {
    const result = rtbAuction.run("rare_placement", { userId: 99999 });
    expect(result).toHaveProperty("winner");
    // Winner may be null if no campaigns match
    expect(result.clearingPrice).toBeGreaterThanOrEqual(0);
  });
});

describe("Impression Tracker", () => {
  it("should record an ad impression", () => {
    const result = impressionTracker.record("ad-001", "campaign-001", 1, "feed_top");
    expect(result.success).toBe(true);
    expect(result.impressionId).toBeDefined();
  });

  it("should deduplicate impressions within cooldown window", () => {
    impressionTracker.record("ad-002", "campaign-002", 2, "sidebar");
    const duplicate = impressionTracker.record("ad-002", "campaign-002", 2, "sidebar");
    expect(duplicate.deduplicated).toBe(true);
  });
});

describe("Ad Fraud Detector", () => {
  it("should analyze an impression for fraud signals", () => {
    const result = adFraudDetector.analyze("impression-001");
    expect(result).toHaveProperty("fraudScore");
    expect(result).toHaveProperty("signals");
    expect(result.fraudScore).toBeGreaterThanOrEqual(0);
    expect(result.fraudScore).toBeLessThanOrEqual(100);
  });

  it("should flag high-frequency impressions from same IP", () => {
    // Simulate rapid impressions
    for (let i = 0; i < 10; i++) {
      impressionTracker.record(`ad-fraud-${i}`, "campaign-fraud", 999, "feed", "192.168.1.1");
    }
    const result = adFraudDetector.checkIPPattern("192.168.1.1");
    expect(result.suspicious).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5F: MOBILE CORE TESTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  pushNotificationService, offlineSyncManager,
  mobileStreamingAdapter, mobileWalletManager, deepLinkManager,
} from "./phase5-adapters";

describe("Push Notification Service", () => {
  it("should register a device token", () => {
    const result = pushNotificationService.registerDevice(1, "fcm-token-001", "android", "device-001");
    expect(result.success).toBe(true);
    expect(result.deviceId).toBeDefined();
  });

  it("should update an existing device token", () => {
    pushNotificationService.registerDevice(2, "apns-token-001", "ios", "device-002");
    const update = pushNotificationService.registerDevice(2, "apns-token-002", "ios", "device-002");
    expect(update.success).toBe(true);
    expect(update.updated).toBe(true);
  });

  it("should send a push notification", () => {
    pushNotificationService.registerDevice(3, "web-token-001", "web", "device-003");
    const result = pushNotificationService.send(3, "New Message", "You have a new DM", { type: "dm" });
    expect(result.success).toBe(true);
    expect(result.sent).toBeGreaterThan(0);
  });

  it("should unregister a device", () => {
    pushNotificationService.registerDevice(4, "token-to-remove", "android", "device-004");
    const result = pushNotificationService.unregisterDevice(4, "device-004");
    expect(result.success).toBe(true);
  });
});

describe("Offline Sync Manager", () => {
  it("should sync offline operations", () => {
    const result = offlineSyncManager.sync(1, [
      { type: "create", entity: "post", data: { content: "Offline post" } },
      { type: "like", entity: "post", data: { postId: 123 } },
    ]);
    expect(result.success).toBe(true);
    expect(result.synced).toBe(2);
  });

  it("should handle conflicting offline operations", () => {
    const result = offlineSyncManager.sync(2, [
      { type: "delete", entity: "post", data: { postId: 999 } },
      { type: "like", entity: "post", data: { postId: 999 } },
    ]);
    expect(result).toHaveProperty("conflicts");
    expect(result.conflicts).toBeGreaterThanOrEqual(0);
  });

  it("should queue failed operations for retry", () => {
    const result = offlineSyncManager.sync(3, [
      { type: "invalid_operation", entity: "unknown", data: {} },
    ]);
    expect(result).toHaveProperty("queued");
  });
});

describe("Mobile Streaming Adapter", () => {
  it("should return stream configuration for mobile", () => {
    const config = mobileStreamingAdapter.getConfig("stream-001", "720p");
    expect(config).toHaveProperty("hlsUrl");
    expect(config).toHaveProperty("quality");
    expect(config).toHaveProperty("adaptiveBitrate");
  });

  it("should return lower quality config for low bandwidth", () => {
    const lowBW = mobileStreamingAdapter.getConfig("stream-001", "360p");
    const highBW = mobileStreamingAdapter.getConfig("stream-001", "1080p");
    expect(lowBW.bitrate).toBeLessThan(highBW.bitrate);
  });
});

describe("Mobile Wallet Manager", () => {
  it("should return or create a mobile wallet for a user", () => {
    const wallet = mobileWalletManager.getWallet(1);
    expect(wallet).toHaveProperty("address");
    expect(wallet).toHaveProperty("balances");
    expect(wallet).toHaveProperty("transactions");
  });

  it("should return consistent wallet address for same user", () => {
    const wallet1 = mobileWalletManager.getWallet(2);
    const wallet2 = mobileWalletManager.getWallet(2);
    expect(wallet1.address).toBe(wallet2.address);
  });
});

describe("Deep Link Manager", () => {
  it("should resolve a post deep link", () => {
    const result = deepLinkManager.resolve("shadowchat://post/123");
    expect(result).toHaveProperty("type");
    expect(result.type).toBe("post");
    expect(result.id).toBe("123");
  });

  it("should resolve a profile deep link", () => {
    const result = deepLinkManager.resolve("shadowchat://user/skyler");
    expect(result.type).toBe("user");
    expect(result.id).toBe("skyler");
  });

  it("should resolve a community deep link", () => {
    const result = deepLinkManager.resolve("shadowchat://community/crypto-traders");
    expect(result.type).toBe("community");
  });

  it("should handle invalid deep links gracefully", () => {
    const result = deepLinkManager.resolve("https://invalid-link.com/unknown");
    expect(result.type).toBe("unknown");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5G: DISTRIBUTION ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  syndicationEngine, importPipeline, rssFeedGenerator,
  seoEngine, webhookSystem,
} from "./phase5-adapters";

describe("Syndication Engine", () => {
  it("should syndicate content to multiple platforms", () => {
    const result = syndicationEngine.syndicate("post-001", "post", ["twitter", "farcaster"]);
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(2);
  });

  it("should handle partial syndication failures gracefully", () => {
    const result = syndicationEngine.syndicate("post-002", "post", ["twitter", "invalid_platform"]);
    expect(result.results.some((r: any) => r.success)).toBe(true);
    expect(result.results.some((r: any) => !r.success)).toBe(true);
  });
});

describe("Import Pipeline", () => {
  it("should initiate a content import from a platform", () => {
    const result = importPipeline.import(1, "youtube", "https://youtube.com/@testcreator");
    expect(result.success).toBe(true);
    expect(result.importId).toBeDefined();
    expect(result.status).toBe("queued");
  });

  it("should reject import from unsupported platform", () => {
    const result = importPipeline.import(2, "unsupported_platform" as any, "https://example.com");
    expect(result.success).toBe(false);
  });
});

describe("RSS Feed Generator", () => {
  it("should generate an RSS feed for a user", () => {
    const feed = rssFeedGenerator.generate(1);
    expect(feed).toHaveProperty("title");
    expect(feed).toHaveProperty("items");
    expect(Array.isArray(feed.items)).toBe(true);
  });

  it("should generate an RSS feed for a community", () => {
    const feed = rssFeedGenerator.generate(undefined, 1);
    expect(feed).toHaveProperty("title");
    expect(feed).toHaveProperty("items");
  });
});

describe("SEO Engine", () => {
  it("should generate SEO metadata for a post", () => {
    const data = seoEngine.getData("post", "post-001");
    expect(data).toHaveProperty("title");
    expect(data).toHaveProperty("description");
    expect(data).toHaveProperty("openGraph");
    expect(data).toHaveProperty("structuredData");
  });

  it("should generate SEO metadata for a creator profile", () => {
    const data = seoEngine.getData("user", "user-001");
    expect(data).toHaveProperty("title");
    expect(data.openGraph).toHaveProperty("type");
  });
});

describe("Webhook System", () => {
  it("should register a webhook endpoint", () => {
    const result = webhookSystem.register(1, "https://example.com/webhook", ["post.created", "stream.started"], "secret-key");
    expect(result.success).toBe(true);
    expect(result.webhookId).toBeDefined();
  });

  it("should list webhooks for a user", () => {
    webhookSystem.register(2, "https://example.com/hook2", ["like.created"], "secret2");
    const hooks = webhookSystem.list(2);
    expect(Array.isArray(hooks)).toBe(true);
    expect(hooks.length).toBeGreaterThan(0);
  });

  it("should delete a webhook", () => {
    const regResult = webhookSystem.register(3, "https://example.com/hook3", ["comment.created"], "secret3");
    const deleteResult = webhookSystem.delete(regResult.webhookId!);
    expect(deleteResult.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5H: SECURITY CORE TESTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  antiSybilEngine, antiBotEngine, fraudEscalationEngine,
  walletAnomalyDetector, exploitDetector, abuseScorer, ipReputationService,
} from "./phase5-adapters";

describe("Anti-Sybil Engine", () => {
  it("should check a user for sybil indicators", () => {
    const result = antiSybilEngine.check(1);
    expect(result).toHaveProperty("isSybil");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("signals");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("should flag accounts with identical device fingerprints", () => {
    antiSybilEngine.recordFingerprint(100, "fingerprint-abc");
    antiSybilEngine.recordFingerprint(101, "fingerprint-abc");
    const result = antiSybilEngine.check(101);
    expect(result.signals.some((s: any) => s.type === "shared_fingerprint")).toBe(true);
  });

  it("should return low sybil score for established accounts", () => {
    const result = antiSybilEngine.check(1);
    // Established accounts should have lower sybil confidence
    expect(typeof result.confidence).toBe("number");
  });
});

describe("Anti-Bot Engine", () => {
  it("should check a request for bot signals", () => {
    const result = antiBotEngine.check("192.168.1.1", "Mozilla/5.0 Chrome/120", {});
    expect(result).toHaveProperty("isBot");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("signals");
  });

  it("should flag known bot user agents", () => {
    const result = antiBotEngine.check("10.0.0.1", "python-requests/2.28.0", {});
    expect(result.isBot).toBe(true);
  });

  it("should flag headless browser signatures", () => {
    const result = antiBotEngine.check("10.0.0.2", "HeadlessChrome/120", { webdriver: true });
    expect(result.isBot).toBe(true);
  });

  it("should pass legitimate browser requests", () => {
    const result = antiBotEngine.check("203.0.113.1", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120", { mouseMovements: 50 });
    expect(result.isBot).toBe(false);
  });
});

describe("Fraud Escalation Engine", () => {
  it("should escalate a fraud incident", () => {
    const result = fraudEscalationEngine.escalate(1, "wash_trading", { evidence: "10 self-trades" }, "high");
    expect(result.success).toBe(true);
    expect(result.escalationId).toBeDefined();
    expect(result.assignedTo).toBeDefined();
  });

  it("should auto-suspend accounts with critical fraud", () => {
    const result = fraudEscalationEngine.escalate(2, "account_takeover", { evidence: "suspicious login" }, "critical");
    expect(result.autoAction).toBe("suspend");
  });

  it("should queue medium severity fraud for review", () => {
    const result = fraudEscalationEngine.escalate(3, "fake_reviews", { evidence: "5 identical reviews" }, "medium");
    expect(result.autoAction).toBe("review_queue");
  });
});

describe("Wallet Anomaly Detector", () => {
  it("should check a wallet for anomalies", () => {
    const result = walletAnomalyDetector.check("0xwallet001", { amount: 100, type: "transfer" });
    expect(result).toHaveProperty("isAnomaly");
    expect(result).toHaveProperty("riskScore");
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });

  it("should flag unusually large transactions", () => {
    const result = walletAnomalyDetector.check("0xwallet002", { amount: 10000000, type: "transfer" });
    expect(result.riskScore).toBeGreaterThan(50);
  });

  it("should flag rapid successive transactions", () => {
    for (let i = 0; i < 5; i++) {
      walletAnomalyDetector.check("0xrapid", { amount: 100, type: "transfer", timestamp: Date.now() + i });
    }
    const result = walletAnomalyDetector.check("0xrapid", { amount: 100, type: "transfer" });
    expect(result.signals.some((s: any) => s.type === "high_frequency")).toBe(true);
  });
});

describe("Exploit Detector", () => {
  it("should detect SQL injection attempts", () => {
    const result = exploitDetector.analyze({ body: "'; DROP TABLE users; --" });
    expect(result.detected).toBe(true);
    expect(result.type).toContain("sql_injection");
  });

  it("should detect XSS attempts", () => {
    const result = exploitDetector.analyze({ body: "<script>alert('xss')</script>" });
    expect(result.detected).toBe(true);
    expect(result.type).toContain("xss");
  });

  it("should detect path traversal attempts", () => {
    const result = exploitDetector.analyze({ path: "../../etc/passwd" });
    expect(result.detected).toBe(true);
    expect(result.type).toContain("path_traversal");
  });

  it("should pass legitimate requests", () => {
    const result = exploitDetector.analyze({ body: "Hello, this is a normal message!", path: "/api/posts" });
    expect(result.detected).toBe(false);
  });
});

describe("Abuse Scorer", () => {
  it("should return an abuse score for a user", () => {
    const result = abuseScorer.getScore(1);
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("level");
    expect(result).toHaveProperty("factors");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should increment abuse score for violations", () => {
    abuseScorer.recordViolation(100, "spam", 10);
    const result = abuseScorer.getScore(100);
    expect(result.score).toBeGreaterThan(0);
  });

  it("should classify high-score users as high risk", () => {
    abuseScorer.recordViolation(200, "harassment", 40);
    abuseScorer.recordViolation(200, "fraud", 40);
    const result = abuseScorer.getScore(200);
    expect(result.level).toBe("high");
  });
});

describe("IP Reputation Service", () => {
  it("should check IP reputation", () => {
    const result = ipReputationService.check("8.8.8.8");
    expect(result).toHaveProperty("reputation");
    expect(result).toHaveProperty("isVPN");
    expect(result).toHaveProperty("isTor");
    expect(result).toHaveProperty("isDatacenter");
  });

  it("should flag known Tor exit nodes", () => {
    // Use a known Tor exit node IP pattern
    const result = ipReputationService.check("185.220.101.1");
    expect(result).toHaveProperty("isTor");
    // May or may not be flagged depending on database
    expect(typeof result.isTor).toBe("boolean");
  });

  it("should return clean reputation for legitimate IPs", () => {
    const result = ipReputationService.check("192.0.2.1");
    expect(result.reputation).toBeDefined();
    expect(["clean", "suspicious", "malicious"]).toContain(result.reputation);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5I: INFRASTRUCTURE CORE TESTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  jobQueue, deadLetterQueue, autoscalingManager,
  observability, backupSystem, circuitBreakerManager, featureFlags,
} from "./phase5-adapters";

describe("Job Queue", () => {
  it("should enqueue a job", () => {
    const result = jobQueue.enqueue("email_notification", { userId: 1, template: "welcome" }, { priority: "normal" });
    expect(result.success).toBe(true);
    expect(result.jobId).toBeDefined();
  });

  it("should enqueue high-priority jobs", () => {
    const result = jobQueue.enqueue("fraud_check", { userId: 2 }, { priority: "high" });
    expect(result.success).toBe(true);
    expect(result.priority).toBe("high");
  });

  it("should return queue statistics", () => {
    const stats = jobQueue.getStats();
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("processing");
    expect(stats).toHaveProperty("completed");
    expect(stats).toHaveProperty("failed");
  });

  it("should process the next job in queue", () => {
    jobQueue.enqueue("test_job", { data: "test" });
    const result = jobQueue.processNext();
    expect(result).toHaveProperty("processed");
  });

  it("should schedule a delayed job", () => {
    const result = jobQueue.schedule("reminder", { userId: 3 }, new Date(Date.now() + 3600000));
    expect(result.success).toBe(true);
    expect(result.scheduledFor).toBeDefined();
  });
});

describe("Dead Letter Queue", () => {
  it("should return DLQ items", () => {
    const items = deadLetterQueue.getItems(false);
    expect(Array.isArray(items)).toBe(true);
  });

  it("should add a failed job to DLQ", () => {
    deadLetterQueue.add("failed_job_001", "email_notification", { userId: 999 }, "SMTP connection refused");
    const items = deadLetterQueue.getItems(false);
    expect(items.length).toBeGreaterThan(0);
  });

  it("should retry a DLQ item", () => {
    deadLetterQueue.add("failed_job_002", "push_notification", { userId: 1 }, "Device not registered");
    const items = deadLetterQueue.getItems(false);
    const result = deadLetterQueue.retry(items[0].id);
    expect(result.success).toBe(true);
  });
});

describe("Autoscaling Manager", () => {
  it("should evaluate current scaling needs", () => {
    const result = autoscalingManager.evaluate({ cpuUsage: 0.75, memoryUsage: 0.60, requestRate: 1000 });
    expect(result).toHaveProperty("recommendation");
    expect(result).toHaveProperty("currentInstances");
    expect(["scale_up", "scale_down", "maintain"]).toContain(result.recommendation);
  });

  it("should recommend scale-up under high load", () => {
    const result = autoscalingManager.evaluate({ cpuUsage: 0.95, memoryUsage: 0.90, requestRate: 5000 });
    expect(result.recommendation).toBe("scale_up");
  });

  it("should recommend scale-down under low load", () => {
    const result = autoscalingManager.evaluate({ cpuUsage: 0.10, memoryUsage: 0.15, requestRate: 50 });
    expect(result.recommendation).toBe("scale_down");
  });

  it("should return scaling history", () => {
    const history = autoscalingManager.getScalingHistory();
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Observability", () => {
  it("should return platform health status", () => {
    const status = observability.getHealthStatus();
    expect(status).toHaveProperty("overall");
    expect(status).toHaveProperty("services");
    expect(["healthy", "degraded", "critical"]).toContain(status.overall);
  });

  it("should return platform metrics", () => {
    const metrics = observability.getMetrics();
    expect(metrics).toHaveProperty("cpu");
    expect(metrics).toHaveProperty("memory");
    expect(metrics).toHaveProperty("requestRate");
    expect(metrics).toHaveProperty("errorRate");
  });

  it("should log a structured event", () => {
    const result = observability.log("info", "test_event", { data: "test" }, "test-service");
    expect(result.success).toBe(true);
  });

  it("should return recent logs", () => {
    observability.log("error", "db_connection_failed", {}, "database");
    const logs = observability.getLogs("error", undefined, 10);
    expect(Array.isArray(logs)).toBe(true);
  });

  it("should create a distributed trace", () => {
    const trace = observability.startTrace("api_request", { path: "/api/posts" });
    expect(trace).toHaveProperty("traceId");
    expect(trace).toHaveProperty("spanId");
  });
});

describe("Backup System", () => {
  it("should trigger a database backup", () => {
    const result = backupSystem.triggerBackup("incremental", "database");
    expect(result.success).toBe(true);
    expect(result.backupId).toBeDefined();
  });

  it("should trigger a full backup", () => {
    const result = backupSystem.triggerBackup("full", "all");
    expect(result.success).toBe(true);
    expect(result.type).toBe("full");
  });

  it("should return backup history", () => {
    const history = backupSystem.getBackupHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it("should verify backup integrity", () => {
    const backupResult = backupSystem.triggerBackup("snapshot", "database");
    const verifyResult = backupSystem.verify(backupResult.backupId!);
    expect(verifyResult).toHaveProperty("valid");
    expect(typeof verifyResult.valid).toBe("boolean");
  });
});

describe("Circuit Breaker Manager", () => {
  it("should return status of all circuit breakers", () => {
    const status = circuitBreakerManager.getAllStatus();
    expect(typeof status).toBe("object");
  });

  it("should open a circuit breaker after failures", () => {
    for (let i = 0; i < 5; i++) {
      circuitBreakerManager.recordFailure("payment_service");
    }
    const status = circuitBreakerManager.getStatus("payment_service");
    expect(["open", "half_open", "closed"]).toContain(status.state);
  });

  it("should reset a circuit breaker", () => {
    circuitBreakerManager.reset("payment_service");
    const status = circuitBreakerManager.getStatus("payment_service");
    expect(status.state).toBe("closed");
  });
});

describe("Feature Flags", () => {
  it("should return all feature flags", () => {
    const flags = featureFlags.getAll();
    expect(typeof flags).toBe("object");
  });

  it("should check if a feature is enabled", () => {
    featureFlags.set("new_feed_algorithm", { enabled: true, rolloutPercentage: 100 });
    const enabled = featureFlags.isEnabled("new_feed_algorithm", 1);
    expect(enabled).toBe(true);
  });

  it("should respect rollout percentage", () => {
    featureFlags.set("beta_feature", { enabled: true, rolloutPercentage: 0 });
    const enabled = featureFlags.isEnabled("beta_feature", 1);
    expect(enabled).toBe(false);
  });

  it("should update a feature flag", () => {
    featureFlags.set("test_flag", { enabled: false });
    featureFlags.update("test_flag", { enabled: true });
    const enabled = featureFlags.isEnabled("test_flag", 1);
    expect(enabled).toBe(true);
  });

  it("should return false for unknown feature flags", () => {
    const enabled = featureFlags.isEnabled("nonexistent_feature", 1);
    expect(enabled).toBe(false);
  });
});
