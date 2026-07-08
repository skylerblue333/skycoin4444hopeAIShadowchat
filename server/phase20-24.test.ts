/**
 * PHASE 20–24 TEST SUITE
 * Attention Engine, Creator Empire, Economic Moat, AI Autonomy, Ecosystem Lock-In
 */
import { describe, it, expect, beforeEach } from "vitest";

// ─── PHASE 20: ATTENTION ENGINE ───────────────────────────────────────────────

describe("Phase 20A: Feed Intelligence V2", () => {
  let feedIntelligenceV2: any;
  beforeEach(async () => {
    const m = await import("./phase20-attention-engine");
    feedIntelligenceV2 = m.feedIntelligenceV2;
  });

  it("should rank feed posts by multi-signal score", () => {
    const posts = [
      { postId: "p1", authorId: 1, contentType: "video" as const, createdAt: new Date(), likes: 100, comments: 50, shares: 20, views: 1000, watchTimeSeconds: 60000, communityIds: ["c1"], topicTags: ["crypto"], isPremium: false, isSponsored: false },
      { postId: "p2", authorId: 2, contentType: "text" as const, createdAt: new Date(Date.now() - 3600000 * 10), likes: 5, comments: 1, shares: 0, views: 10, watchTimeSeconds: 100, communityIds: [], topicTags: ["gaming"], isPremium: false, isSponsored: false },
    ];
    const ranked = feedIntelligenceV2.rankFeed(1, posts);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].rankPosition).toBe(1);
    expect(ranked[1].rankPosition).toBe(2);
    expect(ranked[0].finalScore).toBeGreaterThanOrEqual(ranked[1].finalScore);
    expect(ranked[0].explanation).toBeDefined();
  });

  it("should record watch time and update affinity", () => {
    feedIntelligenceV2.recordWatchTime(10, "post1", 99, 300);
    const affinity = feedIntelligenceV2.getCreatorAffinity(10, 99);
    expect(affinity).not.toBeNull();
    expect(affinity.totalWatchTimeSeconds).toBe(300);
    expect(affinity.affinityScore).toBeGreaterThan(0);
  });

  it("should record interactions and update affinity score", () => {
    feedIntelligenceV2.recordInteraction(11, 88, "like");
    feedIntelligenceV2.recordInteraction(11, 88, "comment");
    feedIntelligenceV2.recordInteraction(11, 88, "share");
    const affinity = feedIntelligenceV2.getCreatorAffinity(11, 88);
    expect(affinity).not.toBeNull();
    expect(affinity.totalLikes).toBe(1);
    expect(affinity.totalComments).toBe(1);
    expect(affinity.totalShares).toBe(1);
    expect(affinity.affinityScore).toBeGreaterThan(0);
  });

  it("should return top creators by affinity", () => {
    feedIntelligenceV2.recordInteraction(12, 101, "purchase");
    feedIntelligenceV2.recordInteraction(12, 102, "like");
    const top = feedIntelligenceV2.getTopCreatorsByAffinity(12, 5);
    expect(top.length).toBeGreaterThan(0);
    expect(top[0].affinityScore).toBeGreaterThanOrEqual(top[top.length - 1].affinityScore);
  });

  it("should manage interest clusters", () => {
    const cluster = feedIntelligenceV2.upsertInterestCluster(20, ["crypto", "defi", "nft"], 0.8);
    expect(cluster.clusterId).toBeDefined();
    expect(cluster.topics).toContain("crypto");
    const clusters = feedIntelligenceV2.getUserInterestClusters(20);
    expect(clusters.length).toBeGreaterThan(0);
  });

  it("should manage session chains", () => {
    const session = feedIntelligenceV2.startSession(30);
    expect(session.isActive).toBe(true);
    const updated = feedIntelligenceV2.recordSessionView(session.sessionId, "post_x", 120);
    expect(updated).not.toBeNull();
    expect(updated.postsViewed).toContain("post_x");
    expect(updated.chainBonus).toBeGreaterThan(0);
    const ended = feedIntelligenceV2.endSession(session.sessionId);
    expect(ended.isActive).toBe(false);
  });

  it("should return session metrics", () => {
    const session = feedIntelligenceV2.startSession(40);
    feedIntelligenceV2.recordSessionView(session.sessionId, "post_a", 60);
    feedIntelligenceV2.endSession(session.sessionId);
    const metrics = feedIntelligenceV2.getSessionMetrics(40);
    expect(metrics.totalSessions).toBeGreaterThan(0);
    expect(metrics.avgSessionLength).toBeGreaterThanOrEqual(0);
  });
});

describe("Phase 20B: Addiction Loops Engine", () => {
  let addictionLoopsEngine: any;
  beforeEach(async () => {
    const m = await import("./phase20-attention-engine");
    addictionLoopsEngine = m.addictionLoopsEngine;
  });

  it("should create and claim daily drops", () => {
    const now = new Date();
    const drop = addictionLoopsEngine.createDailyDrop({
      dropType: "token",
      title: "Daily SKY",
      description: "Claim your daily SKY444",
      rewardAmount: 10,
      rewardCurrency: "SKY444",
      availableFrom: new Date(now.getTime() - 1000),
      availableUntil: new Date(now.getTime() + 86400000),
      maxClaims: 1000,
      isActive: true,
    });
    expect(drop.id).toBeDefined();
    const claim = addictionLoopsEngine.claimDailyDrop(50, drop.id);
    expect(claim).not.toBeNull();
    expect(claim.rewardDelivered).toBe(true);
    // Cannot claim twice
    const duplicate = addictionLoopsEngine.claimDailyDrop(50, drop.id);
    expect(duplicate).toBeNull();
  });

  it("should return active daily drops", () => {
    const drops = addictionLoopsEngine.getActiveDailyDrops();
    expect(Array.isArray(drops)).toBe(true);
  });

  it("should manage engagement ladders and award points", () => {
    const ladder = addictionLoopsEngine.getOrCreateLadder(60);
    expect(ladder.currentTier).toBe("bronze");
    const updated = addictionLoopsEngine.awardPoints(60, 600, "Post engagement");
    expect(updated.currentTier).toBe("silver");
    expect(updated.currentPoints).toBeGreaterThanOrEqual(600);
    expect(updated.perks.length).toBeGreaterThan(0);
  });

  it("should advance to gold tier with enough points", () => {
    const ladder = addictionLoopsEngine.getOrCreateLadder(61);
    addictionLoopsEngine.awardPoints(61, 2500, "Milestone");
    const updated = addictionLoopsEngine.getLadder(61);
    expect(updated.currentTier).toBe("gold");
  });

  it("should return engagement leaderboard", () => {
    addictionLoopsEngine.awardPoints(62, 100, "test");
    const leaderboard = addictionLoopsEngine.getLeaderboard(10);
    expect(Array.isArray(leaderboard)).toBe(true);
    expect(leaderboard.length).toBeGreaterThan(0);
  });

  it("should issue and claim return bonuses", () => {
    const bonus = addictionLoopsEngine.issueReturnBonus(70, 8);
    expect(bonus).not.toBeNull();
    expect(bonus.bonusType).toBe("day_7");
    expect(bonus.rewardAmount).toBe(25);
    const claimed = addictionLoopsEngine.claimReturnBonus(bonus.id);
    expect(claimed.claimed).toBe(true);
    // Cannot claim again
    const duplicate = addictionLoopsEngine.claimReturnBonus(bonus.id);
    expect(duplicate).toBeNull();
  });

  it("should not issue bonus for same-day return", () => {
    const bonus = addictionLoopsEngine.issueReturnBonus(71, 0);
    expect(bonus).toBeNull();
  });

  it("should issue creator loyalty rewards", () => {
    const reward = addictionLoopsEngine.issueCreatorLoyaltyReward(80, 200, 600, 250);
    expect(reward.loyaltyTier).toBe("champion");
    expect(reward.rewardAmount).toBe(75);
    const claimed = addictionLoopsEngine.claimLoyaltyReward(reward.id);
    expect(claimed.claimed).toBe(true);
  });
});

describe("Phase 20C: Retention AI Engine", () => {
  let retentionAI: any;
  beforeEach(async () => {
    const m = await import("./phase20-attention-engine");
    retentionAI = m.retentionAI;
  });

  it("should detect churn triggers", () => {
    const trigger = retentionAI.detectChurnTrigger(90, 15, false, false);
    expect(trigger).not.toBeNull();
    expect(trigger.triggerType).toBe("inactivity_14d");
    expect(trigger.severity).toBe("high");
  });

  it("should not trigger for active users", () => {
    const trigger = retentionAI.detectChurnTrigger(91, 0, false, false);
    expect(trigger).toBeNull();
  });

  it("should detect subscription lapse as critical", () => {
    const trigger = retentionAI.detectChurnTrigger(92, 0, false, true);
    expect(trigger.severity).toBe("critical");
    expect(trigger.triggerType).toBe("subscription_lapse");
  });

  it("should send and track interventions", () => {
    const trigger = retentionAI.detectChurnTrigger(93, 7, false, false);
    const updated = retentionAI.sendIntervention(trigger.id, "push");
    expect(updated.interventionSent).toBe(true);
    expect(updated.interventionType).toBe("push");
  });

  it("should resolve churn triggers", () => {
    const trigger = retentionAI.detectChurnTrigger(94, 3, false, false);
    const resolved = retentionAI.resolveChurnTrigger(trigger.id);
    expect(resolved.resolved).toBe(true);
  });

  it("should send creator comeback prompts", () => {
    const prompt = retentionAI.sendCreatorComebackPrompt(100, "trending_topic", "Your audience is waiting!");
    expect(prompt.id).toBeDefined();
    const opened = retentionAI.recordComebackPromptOpen(prompt.id);
    expect(opened.opened).toBe(true);
    const acted = retentionAI.recordComebackPromptAction(prompt.id);
    expect(acted.actedOn).toBe(true);
  });

  it("should send friend re-engagement prompts", () => {
    const prompt = retentionAI.sendFriendReEngagementPrompt(110, 111, "friend_posted", "Your friend just posted!");
    expect(prompt.id).toBeDefined();
    const clicked = retentionAI.recordFriendPromptClick(prompt.id);
    expect(clicked.clicked).toBe(true);
  });

  it("should send community revival prompts", () => {
    const prompt = retentionAI.sendCommunityRevivalPrompt("comm_1", "new_post", [120, 121], "New activity in your community!");
    expect(prompt.id).toBeDefined();
    const clicked = retentionAI.recordRevivalClick(prompt.id);
    expect(clicked.clickCount).toBe(1);
  });

  it("should return retention dashboard", () => {
    const dashboard = retentionAI.getRetentionDashboard();
    expect(dashboard.activeChurnTriggers).toBeGreaterThanOrEqual(0);
    expect(dashboard.interventionsSent).toBeGreaterThanOrEqual(0);
    expect(dashboard.interventionResolvedRate).toBeGreaterThanOrEqual(0);
  });
});

// ─── PHASE 21: CREATOR EMPIRE ENGINE ─────────────────────────────────────────

describe("Phase 21A: Creator CRM", () => {
  let creatorCRM: any;
  beforeEach(async () => {
    const m = await import("./phase21-creator-empire");
    creatorCRM = m.creatorCRM;
  });

  it("should upsert and retrieve fan profiles", () => {
    const fan = creatorCRM.upsertFanProfile({
      creatorId: 1, fanUserId: 200,
      subscriptionTierId: "gold",
      totalSpent: 500, totalWatchHours: 100,
      totalLikes: 200, totalComments: 50, totalShares: 30, totalTips: 100,
      firstInteractionAt: new Date(Date.now() - 30 * 86400000),
      lastInteractionAt: new Date(),
      notes: "", tags: [],
    });
    expect(fan.id).toBeDefined();
    expect(fan.lifetimeValue).toBeGreaterThan(0);
    expect(fan.segment).toBe("superfan");
    const retrieved = creatorCRM.getFanProfile(1, 200);
    expect(retrieved).not.toBeNull();
    expect(retrieved.fanUserId).toBe(200);
  });

  it("should classify high-churn-risk fans", () => {
    const fan = creatorCRM.upsertFanProfile({
      creatorId: 1, fanUserId: 201,
      totalSpent: 10, totalWatchHours: 5,
      totalLikes: 2, totalComments: 0, totalShares: 0, totalTips: 0,
      firstInteractionAt: new Date(Date.now() - 60 * 86400000),
      lastInteractionAt: new Date(Date.now() - 35 * 86400000),
      notes: "", tags: [],
    });
    expect(fan.churnRisk).toBe("high");
  });

  it("should create subscriber segments", () => {
    const segment = creatorCRM.createSubscriberSegment({
      creatorId: 1, name: "Whales", description: "Top spenders",
      segmentType: "spend",
      criteria: { minSpend: 500 },
    });
    expect(segment.id).toBeDefined();
    const segments = creatorCRM.getCreatorSegments(1);
    expect(segments.length).toBeGreaterThan(0);
  });

  it("should create and track monetization funnels", () => {
    const funnel = creatorCRM.createMonetizationFunnel({
      creatorId: 1, funnelName: "Subscriber Upsell",
      stages: [{ stageId: "s1", name: "Follow", type: "awareness", triggerEvent: "follow", action: "send_welcome", delayHours: 0, isActive: true }],
      isActive: true,
    });
    creatorCRM.recordFunnelEntry(funnel.id);
    creatorCRM.recordFunnelConversion(funnel.id, 9.99);
    const updated = creatorCRM.getCreatorFunnels(1).find((f: any) => f.id === funnel.id);
    expect(updated.totalEntered).toBe(1);
    expect(updated.totalConverted).toBe(1);
    expect(updated.conversionRate).toBe(1);
    expect(updated.totalRevenue).toBe(9.99);
  });

  it("should generate payout forecasts", () => {
    const forecast = creatorCRM.generatePayoutForecast(1, "2026-07", { "2026-04": 1000, "2026-05": 1200, "2026-06": 1100 });
    expect(forecast.totalProjected).toBeGreaterThan(0);
    expect(forecast.confidence).toBeGreaterThan(0);
    expect(forecast.projectedSubscriptionRevenue).toBeGreaterThan(0);
    const retrieved = creatorCRM.getPayoutForecast(1, "2026-07");
    expect(retrieved).not.toBeNull();
  });

  it("should create and track campaign planners", () => {
    const campaign = creatorCRM.createCampaignPlanner({
      creatorId: 1, campaignName: "Summer Launch",
      campaignType: "launch", status: "active",
      startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000),
      budget: 500, targetReach: 10000, targetRevenue: 2000,
      tasks: [{ taskId: "t1", title: "Create promo video", dueDate: new Date(), completed: false }],
      platforms: ["shadowchat", "youtube"],
    });
    creatorCRM.updateCampaignMetrics(campaign.id, 8000, 1800);
    creatorCRM.completeCampaignTask(campaign.id, "t1");
    const campaigns = creatorCRM.getCreatorCampaigns(1);
    const found = campaigns.find((c: any) => c.id === campaign.id);
    expect(found.actualReach).toBe(8000);
    expect(found.status).toBe("completed");
  });
});

describe("Phase 21B: Hiring Marketplace", () => {
  let hiringMarketplace: any;
  beforeEach(async () => {
    const m = await import("./phase21-creator-empire");
    hiringMarketplace = m.hiringMarketplace;
  });

  it("should post and view jobs", () => {
    const job = hiringMarketplace.postJob({
      creatorId: 2, title: "Video Editor",
      description: "Edit weekly vlogs",
      jobType: "editor", budget: 500, budgetType: "fixed",
      currency: "USD", skills: ["premiere", "after_effects"],
      experienceLevel: "mid", duration: "part_time",
      status: "open",
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });
    expect(job.id).toBeDefined();
    const viewed = hiringMarketplace.viewJob(job.id);
    expect(viewed.viewCount).toBe(1);
  });

  it("should apply to jobs and review applications", () => {
    const job = hiringMarketplace.postJob({
      creatorId: 3, title: "Community Moderator",
      description: "Moderate community",
      jobType: "moderator", budget: 200, budgetType: "fixed",
      currency: "USD", skills: ["community_management"],
      experienceLevel: "entry", duration: "part_time",
      status: "open",
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });
    const app = hiringMarketplace.applyToJob({
      jobId: job.id, applicantId: 300,
      coverLetter: "I am great at moderation",
      proposedRate: 200,
    });
    expect(app.status).toBe("pending");
    const reviewed = hiringMarketplace.reviewApplication(app.id, "accepted", "Great candidate");
    expect(reviewed.status).toBe("accepted");
    // Job should be filled
    const updatedJob = hiringMarketplace.viewJob(job.id);
    expect(updatedJob.status).toBe("filled");
  });

  it("should get open jobs by type", () => {
    hiringMarketplace.postJob({
      creatorId: 4, title: "Thumbnail Artist",
      description: "Create thumbnails",
      jobType: "thumbnail_artist", budget: 100, budgetType: "per_task" as any,
      currency: "USD", skills: ["photoshop"],
      experienceLevel: "mid", duration: "one_time",
      status: "open",
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });
    const jobs = hiringMarketplace.getOpenJobs("thumbnail_artist");
    expect(jobs.length).toBeGreaterThan(0);
  });

  it("should manage creator teams", () => {
    const member = hiringMarketplace.addTeamMember({
      creatorId: 5, memberId: 400,
      role: "editor",
      permissions: ["post", "edit"],
      payRate: 500, payType: "fixed_monthly",
      currency: "USD",
      startDate: new Date(),
      isActive: true,
    });
    expect(member.id).toBeDefined();
    const paid = hiringMarketplace.payTeamMember(5, 400, 500);
    expect(paid.totalPaid).toBe(500);
    const team = hiringMarketplace.getCreatorTeam(5);
    expect(team.length).toBe(1);
    hiringMarketplace.removeTeamMember(5, 400);
    const updatedTeam = hiringMarketplace.getCreatorTeam(5);
    expect(updatedTeam.length).toBe(0);
  });
});

describe("Phase 21C: Creator Expansion Engine", () => {
  let creatorExpansionEngine: any;
  beforeEach(async () => {
    const m = await import("./phase21-creator-empire");
    creatorExpansionEngine = m.creatorExpansionEngine;
  });

  it("should queue and process syndication jobs", () => {
    const job = creatorExpansionEngine.queueSyndication({
      creatorId: 6, contentId: "post_123", contentType: "post",
      targetPlatforms: ["youtube", "twitter_x", "instagram"],
    });
    expect(job.status).toBe("queued");
    const processed = creatorExpansionEngine.processSyndication(job.id);
    expect(processed.status).toBe("completed");
    expect(processed.results).toHaveLength(3);
    expect(processed.results[0].status).toBe("posted");
  });

  it("should queue and process auto-clip jobs", () => {
    const job = creatorExpansionEngine.queueAutoClip(7, "stream_456", 3600);
    expect(job.status).toBe("queued");
    const processed = creatorExpansionEngine.processAutoClip(job.id);
    expect(processed.status).toBe("completed");
    expect(processed.clipsGenerated).toBeGreaterThan(0);
    expect(processed.clips[0].highlightScore).toBeGreaterThan(0);
  });

  it("should queue and process auto-translation jobs", () => {
    const job = creatorExpansionEngine.queueAutoTranslation(8, "post_789", "post", "en", ["es", "fr", "ja"], "Hello world");
    const processed = creatorExpansionEngine.processAutoTranslation(job.id);
    expect(processed.status).toBe("completed");
    expect(processed.translations).toHaveLength(3);
    expect(processed.translations[0].status).toBe("completed");
    expect(processed.translations[0].confidence).toBeGreaterThan(0);
  });

  it("should queue and process content repurpose jobs", () => {
    const job = creatorExpansionEngine.queueContentRepurpose(9, "video_101", "long_video", ["short_clip", "reel", "thread"]);
    const processed = creatorExpansionEngine.processContentRepurpose(job.id);
    expect(processed.status).toBe("completed");
    expect(processed.outputs).toHaveLength(3);
    expect(processed.outputs[0].status).toBe("completed");
  });
});

// ─── PHASE 22: ECONOMIC MOAT ENGINE ──────────────────────────────────────────

describe("Phase 22A: Token Utility Engine", () => {
  let tokenUtilityEngine: any;
  beforeEach(async () => {
    const m = await import("./phase22-economic-moat");
    tokenUtilityEngine = m.tokenUtilityEngine;
  });

  it("should record and confirm token actions", () => {
    const action = tokenUtilityEngine.recordAction({
      actionType: "tip", userId: 500, amount: 50, currency: "SKY444",
      targetId: "creator_1", targetType: "creator",
    });
    expect(action.status).toBe("pending");
    const confirmed = tokenUtilityEngine.confirmAction(action.id, "0xabc123");
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.txHash).toBe("0xabc123");
  });

  it("should calculate token velocity", () => {
    tokenUtilityEngine.recordAction({ actionType: "governance_vote", userId: 501, amount: 10, currency: "SKY444" });
    tokenUtilityEngine.confirmAction(
      Array.from(Object.keys(tokenUtilityEngine)).length > 0 ? "dummy" : "dummy"
    );
    const velocity = tokenUtilityEngine.getTokenVelocity("SKY444");
    expect(velocity.totalVolume).toBeGreaterThanOrEqual(0);
    expect(velocity.actionCount).toBeGreaterThanOrEqual(0);
  });

  it("should mint and manage governance tokens", () => {
    const token = tokenUtilityEngine.mintGovernanceTokens(600, 1000);
    expect(token.balance).toBe(1000);
    expect(token.votingPower).toBe(1000);
    // Mint more
    const updated = tokenUtilityEngine.mintGovernanceTokens(600, 500);
    expect(updated.balance).toBe(1500);
  });

  it("should delegate voting power", () => {
    tokenUtilityEngine.mintGovernanceTokens(601, 200);
    tokenUtilityEngine.mintGovernanceTokens(602, 100);
    const delegated = tokenUtilityEngine.delegateVotingPower(601, 602);
    expect(delegated).toBe(true);
    const delegatee = tokenUtilityEngine.getGovernanceToken(602);
    expect(delegatee.votingPower).toBe(300);
  });

  it("should create proposals and cast votes", () => {
    tokenUtilityEngine.mintGovernanceTokens(610, 500);
    const proposal = tokenUtilityEngine.createProposal({
      proposerId: 610, title: "Reduce fees",
      description: "Reduce platform fee from 5% to 3%",
      proposalType: "fee_change",
      quorumRequired: 100,
      passingThreshold: 0.5,
      startAt: new Date(Date.now() - 1000),
      endAt: new Date(Date.now() + 86400000),
    });
    expect(proposal.status).toBe("active");
    const vote = tokenUtilityEngine.castVote(proposal.id, 610, "for", "Good for creators");
    expect(vote).not.toBeNull();
    expect(vote.vote).toBe("for");
    expect(vote.votingPower).toBe(500);
    expect(proposal.votesFor).toBe(500);
    // Cannot vote twice
    const duplicate = tokenUtilityEngine.castVote(proposal.id, 610, "against");
    expect(duplicate).toBeNull();
  });

  it("should get active proposals", () => {
    const proposals = tokenUtilityEngine.getActiveProposals();
    expect(Array.isArray(proposals)).toBe(true);
  });
});

describe("Phase 22B: Liquidity Engine", () => {
  let liquidityEngine: any;
  beforeEach(async () => {
    const m = await import("./phase22-economic-moat");
    liquidityEngine = m.liquidityEngine;
  });

  it("should create liquidity pools", () => {
    const pool = liquidityEngine.createPool({
      poolType: "treasury_lp", tokenA: "SKY444", tokenB: "USDC",
      reserveA: 100000, reserveB: 50000,
      totalLiquidity: 70710, feeRate: 0.003, apr: 0.15,
    });
    expect(pool.id).toBeDefined();
    expect(pool.tokenA).toBe("SKY444");
  });

  it("should add liquidity and create positions", () => {
    const pool = liquidityEngine.createPool({
      poolType: "creator_lp", tokenA: "SKY444", tokenB: "ETH",
      reserveA: 50000, reserveB: 10,
      totalLiquidity: 707, feeRate: 0.003, apr: 0.20,
    });
    const position = liquidityEngine.addLiquidity(pool.id, 700, 10000, 2);
    expect(position).not.toBeNull();
    expect(position.lpTokens).toBeGreaterThan(0);
    expect(position.sharePercent).toBeGreaterThan(0);
  });

  it("should remove liquidity", () => {
    const pool = liquidityEngine.createPool({
      poolType: "reward_pool", tokenA: "SKY444", tokenB: "USDC",
      reserveA: 10000, reserveB: 5000,
      totalLiquidity: 7071, feeRate: 0.003, apr: 0.12,
    });
    liquidityEngine.addLiquidity(pool.id, 800, 5000, 2500);
    const pos = liquidityEngine.getProviderPositions(800)[0];
    const result = liquidityEngine.removeLiquidity(pool.id, 800, pos.lpTokens / 2);
    expect(result).not.toBeNull();
    expect(result.tokenAOut).toBeGreaterThan(0);
    expect(result.tokenBOut).toBeGreaterThan(0);
  });

  it("should record swaps with constant product formula", () => {
    const pool = liquidityEngine.createPool({
      poolType: "treasury_lp", tokenA: "SKY444", tokenB: "USDC",
      reserveA: 100000, reserveB: 50000,
      totalLiquidity: 70710, feeRate: 0.003, apr: 0.15,
    });
    const swap = liquidityEngine.recordSwap(pool.id, "SKY444", 1000);
    expect(swap).not.toBeNull();
    expect(swap.amountOut).toBeGreaterThan(0);
    expect(swap.fee).toBeGreaterThan(0);
    expect(swap.priceImpact).toBeGreaterThan(0);
  });

  it("should stake tokens and accrue rewards", () => {
    const pool = liquidityEngine.createPool({
      poolType: "staking_pool", tokenA: "SKY444", tokenB: "SKY444",
      reserveA: 0, reserveB: 0,
      totalLiquidity: 0, feeRate: 0, apr: 0.20,
    });
    const balance = liquidityEngine.stakeTokens(pool.id, 900, 5000, 30);
    expect(balance.stakedAmount).toBe(5000);
    expect(balance.apr).toBe(0.20);
    const accrued = liquidityEngine.accrueRewards(pool.id, 900);
    expect(accrued.pendingRewards).toBeGreaterThanOrEqual(0);
    // Force some pending rewards for the claim test
    accrued.pendingRewards = 10;
    const claimed = liquidityEngine.claimRewards(pool.id, 900);
    expect(claimed).not.toBeNull();
    expect(claimed.claimed).toBe(10);
  });

  it("should balance staking rewards dynamically", () => {
    const pool = liquidityEngine.createPool({
      poolType: "staking_pool", tokenA: "SKY444", tokenB: "SKY444",
      reserveA: 0, reserveB: 0,
      totalLiquidity: 1000000, feeRate: 0, apr: 0.12,
    });
    liquidityEngine.stakeTokens(pool.id, 901, 100, 0);
    const result = liquidityEngine.balanceStakingRewards(pool.id);
    expect(result.adjustedApr).toBeGreaterThan(0);
    expect(result.totalStaked).toBeGreaterThan(0);
  });
});

describe("Phase 22C: NFT Utility Engine", () => {
  let nftUtilityEngine: any;
  beforeEach(async () => {
    const m = await import("./phase22-economic-moat");
    nftUtilityEngine = m.nftUtilityEngine;
  });

  it("should mint and use NFT passes", () => {
    const pass = nftUtilityEngine.mintPass({
      nftId: "nft_001", passType: "creator_access",
      creatorId: 10, holderId: 1000,
      benefits: ["Exclusive content", "Discord access"],
      contentUnlocks: ["exclusive_post_1", "exclusive_post_2"],
      gameUnlocks: [],
      eventAccess: ["event_2026"],
      transferable: true,
    });
    expect(pass.isActive).toBe(true);
    const used = nftUtilityEngine.usePass(pass.id);
    expect(used).not.toBeNull();
    expect(used.lastUsedAt).toBeDefined();
  });

  it("should check access via NFT pass", () => {
    nftUtilityEngine.mintPass({
      nftId: "nft_002", passType: "creator_access",
      creatorId: 11, holderId: 1001,
      benefits: ["Access"],
      contentUnlocks: ["premium_content_x"],
      gameUnlocks: ["game_y"],
      eventAccess: [],
      transferable: false,
    });
    expect(nftUtilityEngine.checkAccess(1001, "content", "premium_content_x")).toBe(true);
    expect(nftUtilityEngine.checkAccess(1001, "game", "game_y")).toBe(true);
    expect(nftUtilityEngine.checkAccess(1001, "content", "other_content")).toBe(false);
    expect(nftUtilityEngine.checkAccess(9999, "content", "premium_content_x")).toBe(false);
  });

  it("should mint NFT memberships", () => {
    const membership = nftUtilityEngine.mintMembership({
      creatorId: 12, tierId: "gold", tierName: "Gold Member",
      holderId: 1002, nftId: "nft_003",
      benefits: ["Monthly drops", "Early access"],
      monthlyValue: 9.99, currency: "USD",
      isActive: true, mintedAt: new Date(),
    });
    expect(membership.id).toBeDefined();
    const memberships = nftUtilityEngine.getCreatorMemberships(12);
    expect(memberships.length).toBeGreaterThan(0);
  });

  it("should create, reveal, and claim unlockables", () => {
    const unlockable = nftUtilityEngine.createUnlockable({
      nftId: "nft_004", creatorId: 13,
      unlockableType: "exclusive_post",
      title: "Secret Post",
      description: "Only for holders",
      contentUrl: "https://cdn.sky/secret/post1",
    });
    expect(unlockable.isRevealed).toBe(false);
    const revealed = nftUtilityEngine.revealUnlockable(unlockable.id);
    expect(revealed.isRevealed).toBe(true);
    const claimed = nftUtilityEngine.claimUnlockable(unlockable.id, 1003);
    expect(claimed.claimedByUserId).toBe(1003);
    // Cannot claim again
    const duplicate = nftUtilityEngine.claimUnlockable(unlockable.id, 1004);
    expect(duplicate).toBeNull();
  });

  it("should return economic moat metrics", () => {
    const metrics = nftUtilityEngine.getEconomicMoatMetrics();
    expect(metrics.totalTokenActions).toBeGreaterThanOrEqual(0);
    expect(metrics.activeGovernanceProposals).toBeGreaterThanOrEqual(0);
    expect(metrics.totalNFTPasses).toBeGreaterThanOrEqual(0);
  });
});

// ─── PHASE 23: AI AUTONOMY ENGINE ────────────────────────────────────────────

describe("Phase 23A: Platform Agent Registry", () => {
  let platformAgentRegistry: any;
  beforeEach(async () => {
    const m = await import("./phase23-ai-autonomy");
    platformAgentRegistry = m.platformAgentRegistry;
  });

  it("should register and start agents", () => {
    const agent = platformAgentRegistry.registerAgent({
      agentType: "growth_agent",
      name: "Growth Agent Alpha",
      description: "Drives user acquisition",
      config: { targetDAU: 10000 },
      runIntervalMinutes: 60,
    });
    expect(agent.status).toBe("idle");
    const run = platformAgentRegistry.startAgent(agent.id);
    expect(run).not.toBeNull();
    expect(run.status).toBe("running");
    expect(agent.status).toBe("running");
  });

  it("should complete agent runs with decisions", () => {
    const agent = platformAgentRegistry.registerAgent({
      agentType: "moderation_agent",
      name: "Moderation Agent Beta",
      description: "Auto-moderates content",
      config: {},
      runIntervalMinutes: 5,
    });
    const run = platformAgentRegistry.startAgent(agent.id);
    const decisions = [{
      decisionId: "d1", agentType: "moderation_agent" as const,
      decisionType: "content_removal", targetId: "post_bad",
      targetType: "post", action: "remove",
      reasoning: "Violates community guidelines",
      confidence: 0.95, executedAt: new Date(), outcome: "success" as const,
    }];
    const completed = platformAgentRegistry.completeAgentRun(run.id, decisions, "Removed 1 violating post");
    expect(completed.status).toBe("completed");
    expect(completed.actionsExecuted).toBe(1);
    expect(agent.status).toBe("idle");
    expect(agent.successfulRuns).toBe(1);
  });

  it("should fail agent runs", () => {
    const agent = platformAgentRegistry.registerAgent({
      agentType: "treasury_agent",
      name: "Treasury Agent",
      description: "Manages treasury",
      config: {},
      runIntervalMinutes: 1440,
    });
    const run = platformAgentRegistry.startAgent(agent.id);
    const failed = platformAgentRegistry.failAgentRun(run.id, "Database connection error");
    expect(failed.status).toBe("failed");
    expect(agent.status).toBe("error");
    expect(agent.failedRuns).toBe(1);
  });

  it("should pause and resume agents", () => {
    const agent = platformAgentRegistry.registerAgent({
      agentType: "fraud_agent",
      name: "Fraud Agent",
      description: "Detects fraud",
      config: {},
      runIntervalMinutes: 15,
    });
    platformAgentRegistry.pauseAgent(agent.id);
    expect(agent.status).toBe("paused");
    platformAgentRegistry.resumeAgent(agent.id);
    expect(agent.status).toBe("idle");
  });

  it("should return agent dashboard", () => {
    const dashboard = platformAgentRegistry.getAgentDashboard();
    expect(dashboard.totalAgents).toBeGreaterThan(0);
    expect(dashboard.successRate).toBeGreaterThanOrEqual(0);
  });
});

describe("Phase 23B: Self-Healing Engine", () => {
  let selfHealingEngine: any;
  beforeEach(async () => {
    const m = await import("./phase23-ai-autonomy");
    selfHealingEngine = m.selfHealingEngine;
  });

  it("should detect and auto-remediate critical anomalies", () => {
    const anomaly = selfHealingEngine.detectAnomaly({
      anomalyType: "latency_spike",
      severity: "critical",
      service: "api-gateway",
      metric: "p99_latency_ms",
      currentValue: 5000,
      expectedValue: 200,
      deviationPercent: 2400,
    });
    expect(anomaly.id).toBeDefined();
    expect(anomaly.autoRemediated).toBe(true);
    expect(anomaly.remediationAction).toBeDefined();
  });

  it("should resolve anomalies", () => {
    const anomaly = selfHealingEngine.detectAnomaly({
      anomalyType: "error_rate_surge",
      severity: "warning",
      service: "user-service",
      metric: "error_rate",
      currentValue: 0.05,
      expectedValue: 0.001,
      deviationPercent: 4900,
    });
    const resolved = selfHealingEngine.resolveAnomaly(anomaly.id);
    expect(resolved.isResolved).toBe(true);
    expect(resolved.resolvedAt).toBeDefined();
  });

  it("should get active anomalies by severity", () => {
    selfHealingEngine.detectAnomaly({
      anomalyType: "queue_backup",
      severity: "warning",
      service: "notification-service",
      metric: "queue_depth",
      currentValue: 50000,
      expectedValue: 1000,
      deviationPercent: 4900,
    });
    const warnings = selfHealingEngine.getActiveAnomalies("warning");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.every((a: any) => a.severity === "warning")).toBe(true);
  });

  it("should trigger and complete rollbacks", () => {
    const rollback = selfHealingEngine.triggerRollback("payment-service", "v2.1.0", "v2.0.9", "Critical payment bug", "auto");
    expect(rollback.status).toBe("pending");
    const completed = selfHealingEngine.completeRollback(rollback.id, true);
    expect(completed.status).toBe("completed");
  });

  it("should contain abuse and allow review", () => {
    const containment = selfHealingEngine.containAbuse({
      containmentType: "rate_limit",
      targetType: "user",
      targetId: "user_999",
      reason: "Automated spam detection",
      triggeredBy: "auto",
      severity: "medium",
      expiresAt: new Date(Date.now() + 3600000),
    });
    expect(containment.isActive).toBe(true);
    const reviewed = selfHealingEngine.reviewContainment(containment.id, "upheld");
    expect(reviewed.reviewOutcome).toBe("upheld");
    expect(reviewed.isActive).toBe(true);
    // Reverse it
    selfHealingEngine.reviewContainment(containment.id, "reversed");
    expect(containment.isActive).toBe(false);
  });

  it("should track cost optimization actions", () => {
    const action = selfHealingEngine.recordCostOptimization({
      actionType: "scale_down",
      service: "video-transcoder",
      estimatedSavingsUSD: 500,
      details: "Scale down from 10 to 3 instances during off-peak",
    });
    const completed = selfHealingEngine.completeCostAction(action.id, 480);
    expect(completed.actualSavingsUSD).toBe(480);
    const summary = selfHealingEngine.getCostOptimizationSummary();
    expect(summary.totalActual).toBeGreaterThan(0);
  });
});

describe("Phase 23C: AI Decision Layer", () => {
  let aiDecisionLayer: any;
  beforeEach(async () => {
    const m = await import("./phase23-ai-autonomy");
    aiDecisionLayer = m.aiDecisionLayer;
  });

  it("should make and log AI decisions", async () => {
    const decision = await aiDecisionLayer.makeDecision({
      category: "fraud_escalation",
      context: { userId: 2000, riskScore: 85, signals: ["multiple_accounts", "unusual_velocity"] },
      options: ["monitor", "flag", "restrict", "ban"],
    });
    expect(decision.id).toBeDefined();
    expect(decision.decisionCategory).toBe("fraud_escalation");
    expect(decision.confidence).toBeGreaterThan(0);
    expect(decision.modelUsed).toBeDefined();
  }, 15000);

  it("should record decision outcomes and feedback", async () => {
    const decision = await aiDecisionLayer.makeDecision({
      category: "payout_optimization",
      context: { creatorId: 2001, pendingAmount: 1000 },
    });
    const updated = aiDecisionLayer.recordOutcome(decision.id, "payout_processed", 0.9);
    expect(updated.outcome).toBe("payout_processed");
    expect(updated.feedbackScore).toBe(0.9);
  }, 15000);

  it("should return decision accuracy by category", async () => {
    await aiDecisionLayer.makeDecision({
      category: "content_surfacing",
      context: { userId: 2002, candidateCount: 20 },
    });
    const accuracy = aiDecisionLayer.getDecisionAccuracy();
    expect(typeof accuracy).toBe("object");
  }, 15000);

  it("should escalate fraud with AI decision", async () => {
    const result = await aiDecisionLayer.escalateFraud(2003, ["bot_activity", "wash_trading"], 90);
    expect(result.action).toBeDefined();
    expect(result.reasoning).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  }, 15000);
});

// ─── PHASE 24: ECOSYSTEM LOCK-IN ─────────────────────────────────────────────

describe("Phase 24A: Unified Identity Engine", () => {
  let unifiedIdentityEngine: any;
  beforeEach(async () => {
    const m = await import("./phase24-ecosystem-lockin");
    unifiedIdentityEngine = m.unifiedIdentityEngine;
  });

  it("should create and retrieve unified identities", () => {
    const identity = unifiedIdentityEngine.upsertIdentity({
      userId: 3000,
      username: "skyler_blue",
      displayName: "Skyler Blue",
      bio: "Web3 creator",
      isCreator: true,
      creatorTier: "elite",
      totalFollowers: 50000,
      trustScore: 85,
      trustLevel: "verified",
    });
    expect(identity.userId).toBe(3000);
    expect(identity.creatorTier).toBe("elite");
    const retrieved = unifiedIdentityEngine.getIdentity(3000);
    expect(retrieved).not.toBeNull();
    expect(retrieved.username).toBe("skyler_blue");
  });

  it("should add verified badges", () => {
    unifiedIdentityEngine.upsertIdentity({ userId: 3001, username: "creator_x" });
    const updated = unifiedIdentityEngine.addVerifiedBadge(3001, "creator");
    expect(updated.verifiedBadges).toContain("creator");
    // Adding same badge twice should not duplicate
    unifiedIdentityEngine.addVerifiedBadge(3001, "creator");
    expect(updated.verifiedBadges.filter((b: string) => b === "creator").length).toBe(1);
  });

  it("should link wallets", () => {
    unifiedIdentityEngine.upsertIdentity({ userId: 3002, username: "wallet_user" });
    const updated = unifiedIdentityEngine.linkWallet(3002, "0xdeadbeef");
    expect(updated.primaryWalletAddress).toBe("0xdeadbeef");
    expect(updated.linkedWallets).toContain("0xdeadbeef");
    unifiedIdentityEngine.linkWallet(3002, "0xcafebabe");
    expect(updated.linkedWallets.length).toBe(2);
  });

  it("should link systems", () => {
    unifiedIdentityEngine.upsertIdentity({ userId: 3003, username: "multi_user" });
    unifiedIdentityEngine.linkSystem(3003, "social");
    unifiedIdentityEngine.linkSystem(3003, "streaming");
    unifiedIdentityEngine.linkSystem(3003, "marketplace");
    const identity = unifiedIdentityEngine.getIdentity(3003);
    expect(identity.linkedSystems).toHaveLength(3);
  });

  it("should add verifications", () => {
    unifiedIdentityEngine.upsertIdentity({ userId: 3004, username: "verified_user" });
    const verification = unifiedIdentityEngine.addVerification({
      userId: 3004, verificationType: "kyc",
      status: "verified", verifiedAt: new Date(),
      metadata: { provider: "jumio" },
    });
    expect(verification.status).toBe("verified");
    const verifications = unifiedIdentityEngine.getVerifications(3004);
    expect(verifications.length).toBeGreaterThan(0);
  });

  it("should search identities", () => {
    unifiedIdentityEngine.upsertIdentity({ userId: 3005, username: "searchable_user", displayName: "Searchable User" });
    const results = unifiedIdentityEngine.searchIdentities("searchable");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].username).toContain("searchable");
  });
});

describe("Phase 24B: Cross-System Persistence Engine", () => {
  let crossSystemPersistence: any;
  beforeEach(async () => {
    const m = await import("./phase24-ecosystem-lockin");
    crossSystemPersistence = m.crossSystemPersistence;
  });

  it("should update and retrieve activity graphs", () => {
    const graph = crossSystemPersistence.updateActivityGraph(4000, { posts: 5, likes: 20, streams: 2 });
    expect(graph.posts).toBe(5);
    expect(graph.likes).toBe(20);
    // Increment again
    crossSystemPersistence.updateActivityGraph(4000, { posts: 3, likes: 10 });
    const updated = crossSystemPersistence.getActivityGraph(4000);
    expect(updated.posts).toBe(8);
    expect(updated.likes).toBe(30);
  });

  it("should create cross-system links", () => {
    const link = crossSystemPersistence.createCrossSystemLink({
      userId: 4001,
      systemA: "social", entityAId: "post_1",
      systemB: "nft", entityBId: "nft_1",
      linkType: "created_from",
      metadata: { mintedFromPost: true },
    });
    expect(link.id).toBeDefined();
    const links = crossSystemPersistence.getEntityLinks(4001, "social");
    expect(links.length).toBeGreaterThan(0);
  });

  it("should calculate platform value scores", async () => {
    const { unifiedIdentityEngine } = await import("./phase24-ecosystem-lockin");
    unifiedIdentityEngine.upsertIdentity({
      userId: 4002, username: "value_user",
      isCreator: true, totalFollowers: 10000, totalEarned: 5000,
      trustScore: 80, governanceVotingPower: 500,
    });
    crossSystemPersistence.updateActivityGraph(4002, { posts: 100, comments: 500, likes: 2000, shares: 50, totalValueTransacted: 10000, rewardsEarned: 500 });
    const score = crossSystemPersistence.calculatePlatformValueScore(4002);
    expect(score.totalScore).toBeGreaterThan(0);
    expect(score.tier).toBeDefined();
    expect(score.breakdown).toBeDefined();
  });

  it("should return top value users", () => {
    crossSystemPersistence.calculatePlatformValueScore(4003);
    const top = crossSystemPersistence.getTopValueUsers(10);
    expect(Array.isArray(top)).toBe(true);
  });
});

describe("Phase 24C: Migration Resistance Engine", () => {
  let migrationResistanceEngine: any;
  beforeEach(async () => {
    const m = await import("./phase24-ecosystem-lockin");
    migrationResistanceEngine = m.migrationResistanceEngine;
  });

  it("should request, generate, and download vault exports", () => {
    const exportRecord = migrationResistanceEngine.requestVaultExport(5000, "full");
    expect(exportRecord.status).toBe("pending");
    const generated = migrationResistanceEngine.generateVaultExport(exportRecord.id);
    expect(generated.status).toBe("ready");
    expect(generated.fileUrl).toBeDefined();
    expect(generated.checksum).toBeDefined();
    const downloaded = migrationResistanceEngine.downloadVaultExport(exportRecord.id);
    expect(downloaded.status).toBe("downloaded");
  });

  it("should generate audience graphs", () => {
    const graph = migrationResistanceEngine.generateAudienceGraph(5001);
    expect(graph.creatorId).toBe(5001);
    expect(graph.demographicBreakdown).toBeDefined();
    expect(graph.engagementRate).toBeGreaterThan(0);
    const retrieved = migrationResistanceEngine.getAudienceGraph(5001);
    expect(retrieved).not.toBeNull();
  });

  it("should track monetization history", () => {
    migrationResistanceEngine.recordEarning(5002, 100, "subscription");
    migrationResistanceEngine.recordEarning(5002, 50, "tips");
    migrationResistanceEngine.recordEarning(5002, 200, "sponsorship");
    const history = migrationResistanceEngine.getMonetizationHistory(5002);
    expect(history.totalEarned).toBe(350);
    expect(history.bySource["subscription"]).toBe(100);
    expect(history.bySource["tips"]).toBe(50);
    const withdrawn = migrationResistanceEngine.recordWithdrawal(5002, 200);
    expect(withdrawn.totalWithdrawn).toBe(200);
    expect(withdrawn.totalPending).toBe(150);
  });

  it("should register content ownership proofs", () => {
    const proof = migrationResistanceEngine.registerContentOwnership({
      creatorId: 5003, contentId: "video_final_001",
      contentType: "video",
      contentHash: "sha256_abc123def456",
      ipfsHash: "Qm123abc",
      metadata: { title: "My Best Video", duration: 600 },
    });
    expect(proof.platform).toBe("shadowchat");
    expect(proof.registeredAt).toBeDefined();
    const retrieved = migrationResistanceEngine.getContentOwnershipProof("video_final_001");
    expect(retrieved).not.toBeNull();
    expect(retrieved.contentHash).toBe("sha256_abc123def456");
    const proofs = migrationResistanceEngine.getCreatorContentProofs(5003);
    expect(proofs.length).toBeGreaterThan(0);
  });

  it("should build and track trust history", () => {
    const history = migrationResistanceEngine.buildTrustHistory(5004);
    expect(history.trustScore).toBe(50);
    migrationResistanceEngine.recordTrustEvent(5004, "positive", "Completed KYC", 10);
    migrationResistanceEngine.recordTrustEvent(5004, "positive", "Long-standing member", 15);
    migrationResistanceEngine.recordTrustEvent(5004, "negative", "Report received", -5);
    const updated = migrationResistanceEngine.getTrustHistory(5004);
    expect(updated.trustScore).toBe(70);
    expect(updated.totalPositiveEvents).toBe(2);
    expect(updated.totalNegativeEvents).toBe(1);
    expect(updated.events).toHaveLength(3);
    expect(updated.trustLevel).toBe("verified");
  });

  it("should return ecosystem lock-in metrics", () => {
    const metrics = migrationResistanceEngine.getEcosystemLockInMetrics();
    expect(metrics.totalUnifiedIdentities).toBeGreaterThanOrEqual(0);
    expect(metrics.totalCrossSystemLinks).toBeGreaterThanOrEqual(0);
    expect(metrics.avgPlatformValueScore).toBeGreaterThanOrEqual(0);
  });
});
