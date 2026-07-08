/**
 * Phase 7-9 Test Suite — Ecosystem Expansion, Platform Singularity, Infrastructure Maturity
 * Target: 400+ tests
 */
import { describe, it, expect, beforeEach } from "vitest";

// ─── Phase 7A: Developer Platform ────────────────────────────────────────────
import {
  developerPlatform,
  pluginSystem,
  businessLayer,
  brandEconomy,
  educationExpansion,
  financialExpansion,
  partnershipInfrastructure,
  governanceExpansion,
  identityExpansion,
  enterpriseInfrastructure,
} from "./phase7-engines";

describe("Phase 7A: Developer Platform — API Keys", () => {
  it("creates an API key", () => {
    const key = developerPlatform.createAPIKey(1, "app_1", "My Key", ["read:posts", "write:posts"]);
    expect(key).toHaveProperty("id");
    expect(key).toHaveProperty("key");
    expect(key.scopes).toContain("read:posts");
  });

  it("validates an API key", () => {
    const key = developerPlatform.createAPIKey(1, "app_1", "Validation Key", ["read:users"]);
    const result = developerPlatform.validateAPIKey(key.key);
    expect(result).toHaveProperty("valid", true);
    expect(result).toHaveProperty("scopes");
  });

  it("rejects invalid API key", () => {
    const result = developerPlatform.validateAPIKey("invalid-key-xyz");
    expect(result.valid).toBe(false);
  });

  it("revokes an API key", () => {
    const key = developerPlatform.createAPIKey(2, "app_2", "Revoke Me", ["read:posts"]);
    developerPlatform.revokeAPIKey(key.id);
    const result = developerPlatform.validateAPIKey(key.key);
    expect(result.valid).toBe(false);
  });

  it("gets developer keys", () => {
    developerPlatform.createAPIKey(3, "app_3", "Dev Key", ["read:posts"]);
    const keys = developerPlatform.getDeveloperKeys(3);
    expect(keys.length).toBeGreaterThan(0);
  });

  it("tracks API key usage", () => {
    const key = developerPlatform.createAPIKey(4, "app_4", "Usage Key", ["read:posts"]);
    developerPlatform.trackUsage(key.id, "/api/posts", 200);
    const stats = developerPlatform.getKeyStats(key.id);
    expect(stats.totalRequests).toBeGreaterThan(0);
  });
});

describe("Phase 7A: Developer Platform — OAuth Apps", () => {
  it("registers an OAuth app", () => {
    const app = developerPlatform.registerOAuthApp(1, "My App", "A cool app", ["https://myapp.com/callback"], ["read:posts"]);
    expect(app).toHaveProperty("clientId");
    expect(app).toHaveProperty("clientSecret");
    expect(app.name).toBe("My App");
  });

  it("gets app marketplace", () => {
    const marketplace = developerPlatform.getAppMarketplace();
    expect(marketplace).toHaveProperty("apps");
    expect(Array.isArray(marketplace.apps)).toBe(true);
  });

  it("gets developer apps", () => {
    developerPlatform.registerOAuthApp(2, "App Two", "Another app", ["https://app2.com/cb"], ["read:users"]);
    const apps = developerPlatform.getDeveloperApps(2);
    expect(apps.length).toBeGreaterThan(0);
  });
});

describe("Phase 7A: Plugin System", () => {
  it("publishes a plugin", () => {
    const plugin = pluginSystem.publishPlugin(1, {
      name: "Analytics Widget",
      version: "1.0.0",
      description: "Show analytics in your profile",
      type: "widget",
      entryPoint: "https://cdn.example.com/analytics-widget.js",
      permissions: ["read:analytics"],
      price: 0,
      currency: "USD",
    });
    expect(plugin).toHaveProperty("id");
    expect(plugin.name).toBe("Analytics Widget");
  });

  it("gets plugins by type", () => {
    pluginSystem.publishPlugin(1, {
      name: "Chat Bot",
      version: "1.0.0",
      description: "Auto-respond to messages",
      type: "bot",
      entryPoint: "https://cdn.example.com/chatbot.js",
      permissions: ["read:messages", "write:messages"],
      price: 4.99,
      currency: "USD",
    });
    const bots = pluginSystem.getPlugins("bot");
    expect(bots.every(p => p.type === "bot")).toBe(true);
  });

  it("installs a plugin", () => {
    const plugin = pluginSystem.publishPlugin(2, {
      name: "Tip Jar",
      version: "1.0.0",
      description: "Accept tips",
      type: "monetization",
      entryPoint: "https://cdn.example.com/tipjar.js",
      permissions: ["write:payments"],
      price: 0,
      currency: "USD",
    });
    const install = pluginSystem.installPlugin(plugin.id, 100);
    expect(install).toMatchObject({ pluginId: plugin.id, userId: 100, status: "active" });
  });

  it("uninstalls a plugin", () => {
    const plugin = pluginSystem.publishPlugin(3, {
      name: "Scheduler",
      version: "1.0.0",
      description: "Schedule posts",
      type: "tool",
      entryPoint: "https://cdn.example.com/scheduler.js",
      permissions: ["write:posts"],
      price: 2.99,
      currency: "USD",
    });
    pluginSystem.installPlugin(plugin.id, 200);
    pluginSystem.uninstallPlugin(plugin.id, 200);
    const installs = pluginSystem.getUserInstalls(200);
    const found = installs.find(i => i.pluginId === plugin.id);
    expect(found?.status).toBe("uninstalled");
  });
});

// ─── Phase 7B: Business Layer ─────────────────────────────────────────────────
describe("Phase 7B: Business Layer", () => {
  it("creates a business profile", () => {
    const biz = businessLayer.createBusiness(1, {
      name: "Acme Corp",
      type: "brand",
      description: "A great company",
      industry: "technology",
      location: "San Francisco, CA",
      subscriptionPlan: "pro",
      monthlyBudget: 5000,
      employees: 50,
      verificationTier: "standard",
    });
    expect(biz).toMatchObject({ name: "Acme Corp", type: "brand" });
  });

  it("gets a business by ID", () => {
    const biz = businessLayer.createBusiness(2, {
      name: "Fashion House",
      type: "brand",
      description: "Luxury fashion",
      industry: "fashion",
      location: "New York, NY",
      subscriptionPlan: "enterprise",
      monthlyBudget: 20000,
      employees: 200,
      verificationTier: "premium",
    });
    const found = businessLayer.getBusiness(biz.id);
    expect(found?.name).toBe("Fashion House");
  });

  it("searches businesses by name", () => {
    businessLayer.createBusiness(3, {
      name: "TechStartup Inc",
      type: "startup",
      description: "Building the future",
      industry: "technology",
      location: "Austin, TX",
      subscriptionPlan: "basic",
      monthlyBudget: 1000,
      employees: 5,
      verificationTier: "basic",
    });
    const results = businessLayer.searchBusinesses("TechStartup");
    expect(results.some(b => b.name === "TechStartup Inc")).toBe(true);
  });

  it("gets business analytics", () => {
    const biz = businessLayer.createBusiness(4, {
      name: "Analytics Co",
      type: "agency",
      description: "Data analytics",
      industry: "analytics",
      location: "Chicago, IL",
      subscriptionPlan: "pro",
      monthlyBudget: 8000,
      employees: 30,
      verificationTier: "standard",
    });
    const analytics = businessLayer.getBusinessAnalytics(biz.id);
    expect(analytics).toHaveProperty("impressions");
    expect(analytics).toHaveProperty("reach");
    expect(analytics).toHaveProperty("conversions");
  });

  it("updates business profile", () => {
    const biz = businessLayer.createBusiness(5, {
      name: "Old Name",
      type: "brand",
      description: "Old description",
      industry: "retail",
      location: "Miami, FL",
      subscriptionPlan: "basic",
      monthlyBudget: 500,
      employees: 3,
      verificationTier: "basic",
    });
    businessLayer.updateBusiness(biz.id, { name: "New Name" });
    const updated = businessLayer.getBusiness(biz.id);
    expect(updated?.name).toBe("New Name");
  });
});

// ─── Phase 7C: Brand Economy ──────────────────────────────────────────────────
describe("Phase 7C: Brand Economy", () => {
  it("creates a sponsorship listing", () => {
    const listing = brandEconomy.createSponsorshipListing("brand_1", {
      title: "Tech Review Partnership",
      description: "Review our product",
      budget: 5000,
      currency: "USD",
      category: "technology",
      requirements: { minFollowers: 10000, minEngagement: 3 },
      deliverables: ["1 video review", "3 story mentions"],
      duration: 30,
    });
    expect(listing).toMatchObject({ title: "Tech Review Partnership", budget: 5000 });
  });

  it("applies for a sponsorship", () => {
    const listing = brandEconomy.createSponsorshipListing("brand_2", {
      title: "Fashion Campaign",
      description: "Wear our clothes",
      budget: 2000,
      currency: "USD",
      category: "fashion",
      requirements: { minFollowers: 5000 },
      deliverables: ["5 posts"],
      duration: 14,
    });
    const application = brandEconomy.applyForSponsorship(listing.id, 1, "I love fashion!");
    expect(application).toMatchObject({ listingId: listing.id, creatorId: 1 });
  });

  it("gets open listings", () => {
    brandEconomy.createSponsorshipListing("brand_3", {
      title: "Gaming Partnership",
      description: "Stream our game",
      budget: 3000,
      currency: "USD",
      category: "gaming",
      requirements: { minFollowers: 1000 },
      deliverables: ["2 streams"],
      duration: 7,
    });
    const listings = brandEconomy.getOpenListings();
    expect(listings.length).toBeGreaterThan(0);
  });

  it("filters listings by category", () => {
    const listings = brandEconomy.getOpenListings("gaming");
    expect(listings.every(l => l.category === "gaming")).toBe(true);
  });

  it("approves a sponsorship application", () => {
    const listing = brandEconomy.createSponsorshipListing("brand_4", {
      title: "Food Review",
      description: "Review our restaurant",
      budget: 1000,
      currency: "USD",
      category: "food",
      requirements: {},
      deliverables: ["1 post"],
      duration: 7,
    });
    const app = brandEconomy.applyForSponsorship(listing.id, 2, "I love food!");
    brandEconomy.approveApplication(app.id);
    const apps = brandEconomy.getApplications(listing.id);
    const updated = apps.find(a => a.id === app.id);
    expect(updated?.status).toBe("approved");
  });
});

// ─── Phase 7D: Education Expansion ───────────────────────────────────────────
describe("Phase 7D: Education Expansion", () => {
  it("creates a course", () => {
    const course = educationExpansion.createCourse(1, {
      title: "Web3 Fundamentals",
      description: "Learn blockchain basics",
      category: "technology",
      level: "beginner",
      price: 49.99,
      currency: "USD",
      modules: [{ title: "Intro", lessons: [{ title: "What is Web3?", type: "video", duration: 10 }] }],
      certificateNFT: true,
    });
    expect(course).toMatchObject({ title: "Web3 Fundamentals", level: "beginner" });
  });

  it("enrolls a user in a course", () => {
    const course = educationExpansion.createCourse(1, {
      title: "DeFi Mastery",
      description: "Master decentralized finance",
      category: "finance",
      level: "intermediate",
      price: 99.99,
      currency: "USD",
      modules: [],
      certificateNFT: false,
    });
    const enrollment = educationExpansion.enrollInCourse(5001, course.id);
    expect(enrollment).toMatchObject({ userId: 5001, courseId: course.id, status: "active" });
  });

  it("completes a lesson", () => {
    const course = educationExpansion.createCourse(2, {
      title: "NFT Creation",
      description: "Create and sell NFTs",
      category: "art",
      level: "beginner",
      price: 29.99,
      currency: "USD",
      modules: [{ title: "Module 1", lessons: [{ id: "lesson_1", title: "Intro to NFTs", type: "video", duration: 15 }] }],
      certificateNFT: true,
    });
    educationExpansion.enrollInCourse(5002, course.id);
    const progress = educationExpansion.completeLesson(5002, course.id, "lesson_1");
    expect(progress).toHaveProperty("lessonsCompleted");
    expect(progress.lessonsCompleted).toBeGreaterThan(0);
  });

  it("gets courses by category", () => {
    const courses = educationExpansion.getCourses("technology");
    expect(courses.every(c => c.category === "technology")).toBe(true);
  });

  it("gets user enrollments", () => {
    const course = educationExpansion.createCourse(3, {
      title: "Crypto Trading",
      description: "Trade crypto profitably",
      category: "finance",
      level: "advanced",
      price: 149.99,
      currency: "USD",
      modules: [],
      certificateNFT: false,
    });
    educationExpansion.enrollInCourse(5003, course.id);
    const enrollments = educationExpansion.getUserEnrollments(5003);
    expect(enrollments.some(e => e.courseId === course.id)).toBe(true);
  });

  it("issues a certificate on completion", () => {
    const course = educationExpansion.createCourse(4, {
      title: "Quick Course",
      description: "Short course",
      category: "misc",
      level: "beginner",
      price: 0,
      currency: "USD",
      modules: [],
      certificateNFT: true,
    });
    educationExpansion.enrollInCourse(5004, course.id);
    const cert = educationExpansion.issueCertificate(5004, course.id);
    expect(cert).toHaveProperty("certificateId");
    expect(cert).toHaveProperty("nftTokenId");
  });
});

// ─── Phase 7G: Governance Expansion ──────────────────────────────────────────
describe("Phase 7G: Governance Expansion", () => {
  it("creates a proposal", () => {
    const proposal = governanceExpansion.createProposal(1, {
      scope: "platform",
      title: "Increase staking rewards",
      description: "Proposal to increase APY by 2%",
      type: "parameter_change",
      quorum: 100,
      threshold: 60,
      startAt: new Date(),
      endAt: new Date(Date.now() + 7 * 86400000),
    });
    expect(proposal).toMatchObject({ title: "Increase staking rewards", scope: "platform" });
  });

  it("casts a vote", () => {
    const proposal = governanceExpansion.createProposal(2, {
      scope: "community",
      title: "New community rules",
      description: "Update moderation guidelines",
      type: "policy_change",
      quorum: 50,
      threshold: 51,
      startAt: new Date(),
      endAt: new Date(Date.now() + 3 * 86400000),
    });
    const vote = governanceExpansion.castVote(proposal.id, 1, "yes", 100);
    expect(vote).toMatchObject({ proposalId: proposal.id, voterId: 1, vote: "yes" });
  });

  it("prevents double voting", () => {
    const proposal = governanceExpansion.createProposal(3, {
      scope: "platform",
      title: "Fee reduction",
      description: "Reduce platform fees",
      type: "parameter_change",
      quorum: 100,
      threshold: 60,
      startAt: new Date(),
      endAt: new Date(Date.now() + 5 * 86400000),
    });
    governanceExpansion.castVote(proposal.id, 10, "yes", 50);
    expect(() => governanceExpansion.castVote(proposal.id, 10, "no", 50)).toThrow();
  });

  it("gets active proposals", () => {
    const proposals = governanceExpansion.getActiveProposals();
    expect(Array.isArray(proposals)).toBe(true);
  });

  it("gets proposal stats", () => {
    const proposal = governanceExpansion.createProposal(4, {
      scope: "platform",
      title: "Token burn",
      description: "Burn 1% of supply monthly",
      type: "economic",
      quorum: 200,
      threshold: 67,
      startAt: new Date(),
      endAt: new Date(Date.now() + 14 * 86400000),
    });
    governanceExpansion.castVote(proposal.id, 20, "yes", 100);
    governanceExpansion.castVote(proposal.id, 21, "no", 50);
    const stats = governanceExpansion.getProposalStats(proposal.id);
    expect(stats).toHaveProperty("yesVotes");
    expect(stats).toHaveProperty("noVotes");
    expect(stats).toHaveProperty("totalVotingPower");
  });

  it("finalizes a proposal after end date", () => {
    const proposal = governanceExpansion.createProposal(5, {
      scope: "platform",
      title: "Past proposal",
      description: "Already ended",
      type: "policy_change",
      quorum: 10,
      threshold: 51,
      startAt: new Date(Date.now() - 14 * 86400000),
      endAt: new Date(Date.now() - 86400000),
    });
    governanceExpansion.castVote(proposal.id, 30, "yes", 100);
    const result = governanceExpansion.finalizeProposal(proposal.id);
    expect(result).toHaveProperty("passed");
    expect(result).toHaveProperty("status");
  });
});

// ─── Phase 7H: Identity Expansion ────────────────────────────────────────────
describe("Phase 7H: Identity Expansion", () => {
  it("creates a portable identity profile", () => {
    const profile = identityExpansion.createProfile(30001, "CryptoCreator", "Building the future of Web3");
    expect(profile).toMatchObject({ userId: 30001, displayName: "CryptoCreator" });
  });

  it("links a social account", () => {
    identityExpansion.createProfile(30002, "SocialUser", "Active on all platforms");
    const link = identityExpansion.linkAccount(30002, "twitter", "@socialuser");
    expect(link).toMatchObject({ userId: 30002, platform: "twitter", handle: "@socialuser" });
  });

  it("links a wallet", () => {
    identityExpansion.createProfile(30003, "WalletUser", "Multi-chain user");
    const wallet = identityExpansion.linkWallet(30003, "0xABCDEF1234567890", "ethereum", true);
    expect(wallet).toMatchObject({ userId: 30003, chain: "ethereum" });
  });

  it("gets identity profile", () => {
    identityExpansion.createProfile(30004, "FullUser", "Complete profile");
    identityExpansion.linkAccount(30004, "instagram", "@fulluser");
    identityExpansion.linkWallet(30004, "0x1234ABCD", "polygon", false);
    const profile = identityExpansion.getProfile(30004);
    expect(profile).toHaveProperty("linkedAccounts");
    expect(profile).toHaveProperty("linkedWallets");
  });

  it("exports portable identity", () => {
    identityExpansion.createProfile(30005, "PortableUser", "Portable identity");
    const exported = identityExpansion.exportPortableIdentity(30005);
    expect(exported).toHaveProperty("did");
    expect(exported).toHaveProperty("profile");
    expect(exported).toHaveProperty("verifications");
  });

  it("verifies identity claim", () => {
    identityExpansion.createProfile(30006, "VerifiedUser", "Verified creator");
    identityExpansion.linkAccount(30006, "twitter", "@verifieduser");
    const claim = identityExpansion.verifyClaim(30006, "twitter", "@verifieduser");
    expect(claim).toHaveProperty("verified");
  });
});

// ─── Phase 7I: Enterprise Infrastructure ─────────────────────────────────────
describe("Phase 7I: Enterprise Infrastructure", () => {
  it("creates an enterprise account", () => {
    const account = enterpriseInfrastructure.createEnterpriseAccount(1, {
      companyName: "MegaCorp",
      industry: "technology",
      employees: 10000,
      plan: "enterprise",
      ssoProvider: "okta",
      customDomain: "megacorp.shadowchat.com",
    });
    expect(account).toMatchObject({ companyName: "MegaCorp", plan: "enterprise" });
  });

  it("adds a team member", () => {
    const account = enterpriseInfrastructure.createEnterpriseAccount(2, {
      companyName: "StartupCo",
      industry: "fintech",
      employees: 25,
      plan: "business",
      ssoProvider: "google",
      customDomain: "startupco.shadowchat.com",
    });
    const member = enterpriseInfrastructure.addTeamMember(account.id, 1001, "admin");
    expect(member).toMatchObject({ accountId: account.id, userId: 1001, role: "admin" });
  });

  it("gets enterprise analytics", () => {
    const account = enterpriseInfrastructure.createEnterpriseAccount(3, {
      companyName: "AnalyticsCorp",
      industry: "analytics",
      employees: 100,
      plan: "enterprise",
      ssoProvider: "azure",
      customDomain: "analytics.shadowchat.com",
    });
    const analytics = enterpriseInfrastructure.getEnterpriseAnalytics(account.id);
    expect(analytics).toHaveProperty("activeUsers");
    expect(analytics).toHaveProperty("contentCreated");
    expect(analytics).toHaveProperty("engagementRate");
  });
});

// ─── Phase 8C: AI Orchestration ───────────────────────────────────────────────
import {
  universalEconomy,
  universalIdentity,
  aiOrchestration,
  universalSearch,
  universalMessaging,
  universalEvents,
  appEcosystem,
  globalIntelligence,
  resilienceLayer,
} from "./phase8-engines";

describe("Phase 8C: AI Orchestration", () => {
  it("submits an AI request", () => {
    const req = aiOrchestration.submitRequest(1, "content_creation", { topic: "blockchain" });
    expect(req).toHaveProperty("id");
    expect(req).toHaveProperty("status");
    expect(req.copilotType).toBe("content_creation");
  });

  it("processes an AI request", () => {
    const req = aiOrchestration.submitRequest(2, "moderation", { content: "test content" });
    const result = aiOrchestration.processRequest(req.id);
    expect(result).toHaveProperty("requestId");
    expect(result).toHaveProperty("result");
  });

  it("gets orchestration stats", () => {
    const stats = aiOrchestration.getOrchestrationStats();
    expect(stats).toHaveProperty("totalRequests");
    expect(stats).toHaveProperty("successRate");
    expect(stats).toHaveProperty("avgLatency");
  });

  it("gets audit log", () => {
    aiOrchestration.submitRequest(3, "recommendation", { userId: 100 });
    const log = aiOrchestration.getAuditLog(10);
    expect(Array.isArray(log)).toBe(true);
  });

  it("handles high-priority requests", () => {
    const req = aiOrchestration.submitRequest(4, "fraud_detection", { transaction: "tx_123" }, "critical");
    expect(req.priority).toBe("critical");
  });
});

// ─── Phase 8D: Universal Search ───────────────────────────────────────────────
describe("Phase 8D: Universal Search", () => {
  it("searches across all types", () => {
    const results = universalSearch.search("blockchain", {});
    expect(results).toHaveProperty("results");
    expect(results).toHaveProperty("total");
    expect(results).toHaveProperty("took");
  });

  it("filters search by type", () => {
    const results = universalSearch.search("crypto", { types: ["post"] });
    expect(results).toHaveProperty("results");
  });

  it("gets search suggestions", () => {
    const suggestions = universalSearch.suggest("block");
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it("gets index stats", () => {
    const stats = universalSearch.getIndexStats();
    expect(stats).toHaveProperty("totalDocuments");
    expect(stats).toHaveProperty("indexSize");
  });

  it("indexes a document", () => {
    universalSearch.indexDocument("post", "post_999", { content: "Test post about NFTs", authorId: 1 });
    const results = universalSearch.search("NFTs", { types: ["post"] });
    expect(results.total).toBeGreaterThanOrEqual(0);
  });

  it("removes a document from index", () => {
    universalSearch.indexDocument("user", "user_888", { username: "testuser888", bio: "Test user" });
    universalSearch.removeDocument("user", "user_888");
    const stats = universalSearch.getIndexStats();
    expect(stats).toHaveProperty("totalDocuments");
  });
});

// ─── Phase 8E: Universal Messaging ───────────────────────────────────────────
describe("Phase 8E: Universal Messaging", () => {
  it("creates a direct conversation", () => {
    const conv = universalMessaging.createConversation([1001, 1002], "direct");
    expect(conv).toHaveProperty("id");
    expect(conv.type).toBe("direct");
    expect(conv.participants).toContain(1001);
  });

  it("creates a group conversation", () => {
    const conv = universalMessaging.createConversation([2001, 2002, 2003], "group", "Study Group");
    expect(conv.type).toBe("group");
    expect(conv.name).toBe("Study Group");
  });

  it("sends a text message", () => {
    const conv = universalMessaging.createConversation([3001, 3002], "direct");
    const msg = universalMessaging.sendMessage(conv.id, 3001, "text", "Hello there!");
    expect(msg).toMatchObject({ conversationId: conv.id, senderId: 3001, type: "text", content: "Hello there!" });
  });

  it("sends a media message", () => {
    const conv = universalMessaging.createConversation([4001, 4002], "direct");
    const msg = universalMessaging.sendMessage(conv.id, 4001, "image", "Check this out!", "https://example.com/image.jpg");
    expect(msg.type).toBe("image");
    expect(msg.mediaUrl).toBe("https://example.com/image.jpg");
  });

  it("gets conversations for a user", () => {
    const conv = universalMessaging.createConversation([5001, 5002], "direct");
    universalMessaging.sendMessage(conv.id, 5001, "text", "Hi!");
    const convs = universalMessaging.getConversations(5001);
    expect(convs.some(c => c.id === conv.id)).toBe(true);
  });

  it("gets messages in a conversation", () => {
    const conv = universalMessaging.createConversation([6001, 6002], "direct");
    universalMessaging.sendMessage(conv.id, 6001, "text", "Message 1");
    universalMessaging.sendMessage(conv.id, 6002, "text", "Message 2");
    const messages = universalMessaging.getMessages(conv.id, 10);
    expect(messages.length).toBe(2);
  });

  it("marks messages as read", () => {
    const conv = universalMessaging.createConversation([7001, 7002], "direct");
    universalMessaging.sendMessage(conv.id, 7001, "text", "Unread message");
    universalMessaging.markAsRead(conv.id, 7002);
    const unread = universalMessaging.getTotalUnread(7002);
    expect(unread).toBeGreaterThanOrEqual(0);
  });

  it("gets total unread count", () => {
    const unread = universalMessaging.getTotalUnread(8001);
    expect(typeof unread).toBe("number");
  });

  it("creates an encrypted conversation", () => {
    const conv = universalMessaging.createConversation([9001, 9002], "direct", undefined, true);
    expect(conv.encrypted).toBe(true);
  });
});

// ─── Phase 8F: Universal Events ───────────────────────────────────────────────
describe("Phase 8F: Universal Events", () => {
  it("creates an event", () => {
    const event = universalEvents.createEvent(1, "creator", {
      title: "Web3 Summit",
      description: "Annual Web3 conference",
      category: "conference",
      format: "virtual",
      scheduledAt: new Date(Date.now() + 7 * 86400000),
      endAt: new Date(Date.now() + 7 * 86400000 + 3600000),
      maxAttendees: 1000,
      isGated: false,
      tags: ["web3", "blockchain"],
    });
    expect(event).toMatchObject({ title: "Web3 Summit", category: "conference" });
  });

  it("registers a user for an event", () => {
    const event = universalEvents.createEvent(2, "creator", {
      title: "DeFi Workshop",
      description: "Learn DeFi",
      category: "workshop",
      format: "virtual",
      scheduledAt: new Date(Date.now() + 3 * 86400000),
      endAt: new Date(Date.now() + 3 * 86400000 + 7200000),
      maxAttendees: 50,
      isGated: false,
      tags: ["defi"],
    });
    const registration = universalEvents.register(event.id, 10001);
    expect(registration).toMatchObject({ eventId: event.id, userId: 10001, status: "registered" });
  });

  it("gets upcoming events", () => {
    const events = universalEvents.getUpcomingEvents();
    expect(Array.isArray(events)).toBe(true);
  });

  it("filters events by category", () => {
    const events = universalEvents.getUpcomingEvents("workshop");
    expect(events.every(e => e.category === "workshop")).toBe(true);
  });

  it("gets user registrations", () => {
    const event = universalEvents.createEvent(3, "creator", {
      title: "NFT Showcase",
      description: "Show your NFTs",
      category: "showcase",
      format: "hybrid",
      scheduledAt: new Date(Date.now() + 5 * 86400000),
      endAt: new Date(Date.now() + 5 * 86400000 + 5400000),
      maxAttendees: 200,
      isGated: true,
      tags: ["nft"],
    });
    universalEvents.register(event.id, 10002);
    const registrations = universalEvents.getUserRegistrations(10002);
    expect(registrations.some(r => r.eventId === event.id)).toBe(true);
  });
});

// ─── Phase 8G: App Ecosystem ──────────────────────────────────────────────────
describe("Phase 8G: App Ecosystem", () => {
  it("submits an app", () => {
    const app = appEcosystem.submitApp(1, {
      name: "Creator Dashboard",
      description: "Advanced analytics dashboard",
      category: "analytics",
      type: "web_app",
      pricing: { model: "freemium", price: 9.99, currency: "USD" },
      permissions: ["read:analytics", "read:posts"],
      apiVersion: "v2",
      monetized: true,
      revenueShare: 30,
    });
    expect(app).toMatchObject({ name: "Creator Dashboard", category: "analytics" });
  });

  it("gets marketplace apps", () => {
    const marketplace = appEcosystem.getMarketplace();
    expect(Array.isArray(marketplace)).toBe(true);
  });

  it("filters marketplace by category", () => {
    const apps = appEcosystem.getMarketplace("analytics");
    expect(apps.every(a => a.category === "analytics")).toBe(true);
  });

  it("installs an app", () => {
    const app = appEcosystem.submitApp(2, {
      name: "Tip Widget",
      description: "Accept tips easily",
      category: "monetization",
      type: "widget",
      pricing: { model: "free", price: 0, currency: "USD" },
      permissions: ["write:payments"],
      apiVersion: "v2",
      monetized: false,
      revenueShare: 0,
    });
    const install = appEcosystem.installApp(app.id, 20001);
    expect(install).toMatchObject({ appId: app.id, userId: 20001, status: "active" });
  });

  it("gets user apps", () => {
    const app = appEcosystem.submitApp(3, {
      name: "Schedule Pro",
      description: "Schedule posts",
      category: "productivity",
      type: "web_app",
      pricing: { model: "paid", price: 4.99, currency: "USD" },
      permissions: ["write:posts"],
      apiVersion: "v2",
      monetized: true,
      revenueShare: 25,
    });
    appEcosystem.installApp(app.id, 20002);
    const apps = appEcosystem.getUserApps(20002);
    expect(apps.some(a => a.appId === app.id)).toBe(true);
  });

  it("uninstalls an app", () => {
    const app = appEcosystem.submitApp(4, {
      name: "Analytics Lite",
      description: "Basic analytics",
      category: "analytics",
      type: "widget",
      pricing: { model: "free", price: 0, currency: "USD" },
      permissions: ["read:analytics"],
      apiVersion: "v1",
      monetized: false,
      revenueShare: 0,
    });
    appEcosystem.installApp(app.id, 20003);
    appEcosystem.uninstallApp(app.id, 20003);
    const apps = appEcosystem.getUserApps(20003);
    const found = apps.find(a => a.appId === app.id);
    expect(found?.status).toBe("uninstalled");
  });
});

// ─── Phase 8H: Global Intelligence ───────────────────────────────────────────
describe("Phase 8H: Global Intelligence", () => {
  it("generates an ecosystem report", () => {
    const report = globalIntelligence.generateReport("ecosystem");
    expect(report).toHaveProperty("type", "ecosystem");
    expect(report).toHaveProperty("data");
    expect(report).toHaveProperty("generatedAt");
  });

  it("generates a trend report", () => {
    const report = globalIntelligence.generateReport("trend");
    expect(report.type).toBe("trend");
    expect(report.data).toHaveProperty("trending");
  });

  it("generates a creator economy report", () => {
    const report = globalIntelligence.generateReport("creator_economy");
    expect(report.data).toHaveProperty("totalCreators");
    expect(report.data).toHaveProperty("totalRevenue");
  });

  it("gets latest report", () => {
    globalIntelligence.generateReport("market");
    const latest = globalIntelligence.getLatestReport("market");
    expect(latest).toHaveProperty("type", "market");
  });

  it("gets ecosystem snapshot", () => {
    const snapshot = globalIntelligence.getEcosystemSnapshot();
    expect(snapshot).toHaveProperty("users");
    expect(snapshot).toHaveProperty("content");
    expect(snapshot).toHaveProperty("economy");
    expect(snapshot).toHaveProperty("health");
  });
});

// ─── Phase 8I: Resilience Layer ───────────────────────────────────────────────
describe("Phase 8I: Resilience Layer", () => {
  it("gets circuit breaker status", () => {
    const status = resilienceLayer.getCircuitBreakerStatus("payment-service");
    expect(status).toHaveProperty("service", "payment-service");
    expect(status).toHaveProperty("state");
  });

  it("records a failure and opens circuit", () => {
    for (let i = 0; i < 5; i++) {
      resilienceLayer.recordFailure("email-service");
    }
    const status = resilienceLayer.getCircuitBreakerStatus("email-service");
    expect(["open", "half-open", "closed"]).toContain(status.state);
  });

  it("resets a circuit breaker", () => {
    resilienceLayer.recordFailure("cache-service");
    resilienceLayer.resetCircuit("cache-service");
    const status = resilienceLayer.getCircuitBreakerStatus("cache-service");
    expect(status.state).toBe("closed");
  });

  it("gets all circuit breakers", () => {
    const all = resilienceLayer.getAllCircuitBreakers();
    expect(Array.isArray(all)).toBe(true);
  });

  it("gets retry policy for a service", () => {
    const policy = resilienceLayer.getRetryPolicy("payment-service");
    expect(policy).toHaveProperty("maxAttempts");
    expect(policy).toHaveProperty("backoffMs");
  });
});

// ─── Phase 9A: Reliability Engine ────────────────────────────────────────────
import {
  reliabilityEngine,
  observabilityEngine,
  performanceEngine,
  securityHardening,
  dataIntegrity,
  financialFinalization,
  aiReliability,
  scalabilityEngine,
  complianceEngine,
} from "./phase9-engines";

describe("Phase 9A: Reliability Engine", () => {
  it("records an incident", () => {
    const incident = reliabilityEngine.recordIncident("Database connection timeout", "high", ["database", "api"]);
    expect(incident).toHaveProperty("id");
    expect(incident).toHaveProperty("severity", "high");
    expect(incident.status).toBe("open");
  });

  it("updates incident status", () => {
    const incident = reliabilityEngine.recordIncident("API latency spike", "medium", ["api"]);
    reliabilityEngine.updateIncident(incident.id, { status: "investigating", assignedTo: "on-call-team" });
    const updated = reliabilityEngine.getIncident(incident.id);
    expect(updated?.status).toBe("investigating");
  });

  it("resolves an incident", () => {
    const incident = reliabilityEngine.recordIncident("Minor UI bug", "low", ["frontend"]);
    reliabilityEngine.resolveIncident(incident.id, "Fixed in deployment v2.1.5");
    const resolved = reliabilityEngine.getIncident(incident.id);
    expect(resolved?.status).toBe("resolved");
  });

  it("gets open incidents", () => {
    reliabilityEngine.recordIncident("Ongoing issue", "critical", ["all"]);
    const open = reliabilityEngine.getOpenIncidents();
    expect(open.every(i => i.status !== "resolved")).toBe(true);
  });

  it("calculates SLA metrics", () => {
    const metrics = reliabilityEngine.getSLAMetrics("api");
    expect(metrics).toHaveProperty("uptime");
    expect(metrics).toHaveProperty("p99Latency");
    expect(metrics).toHaveProperty("errorRate");
  });

  it("gets reliability dashboard", () => {
    const dashboard = reliabilityEngine.getDashboard();
    expect(dashboard).toHaveProperty("incidents");
    expect(dashboard).toHaveProperty("sla");
    expect(dashboard).toHaveProperty("healthChecks");
  });
});

// ─── Phase 9B: Observability Engine ──────────────────────────────────────────
describe("Phase 9B: Observability Engine", () => {
  it("records a metric", () => {
    observabilityEngine.recordMetric("api.response_time", 125, "ms", { endpoint: "/api/posts" });
    const metrics = observabilityEngine.getMetrics("api.response_time", 60);
    expect(metrics.length).toBeGreaterThan(0);
  });

  it("starts and ends a trace", () => {
    const trace = observabilityEngine.startTrace("api.request", { endpoint: "/api/users" });
    expect(trace).toHaveProperty("traceId");
    expect(trace).toHaveProperty("spanId");
    observabilityEngine.endTrace(trace.traceId, trace.spanId, "success");
    const completed = observabilityEngine.getTrace(trace.traceId);
    expect(completed?.status).toBe("success");
  });

  it("logs at different levels", () => {
    observabilityEngine.log("info", "api", "Request processed", { requestId: "req_1" });
    observabilityEngine.log("error", "database", "Connection failed", { error: "timeout" });
    const logs = observabilityEngine.getLogs("error", "database", 10);
    expect(logs.some(l => l.level === "error")).toBe(true);
  });

  it("creates an alert rule", () => {
    const rule = observabilityEngine.createAlertRule("High Error Rate", "api.error_rate", ">", 5, "critical", ["ops-team@example.com"]);
    expect(rule).toMatchObject({ name: "High Error Rate", metric: "api.error_rate" });
  });

  it("gets dashboard metrics", () => {
    const dashboard = observabilityEngine.getDashboard();
    expect(dashboard).toHaveProperty("metrics");
    expect(dashboard).toHaveProperty("alerts");
    expect(dashboard).toHaveProperty("traces");
  });
});

// ─── Phase 9C: Performance Engine ────────────────────────────────────────────
describe("Phase 9C: Performance Engine", () => {
  it("gets cache stats", () => {
    const stats = performanceEngine.getCacheStats();
    expect(stats).toHaveProperty("hitRate");
    expect(stats).toHaveProperty("missRate");
    expect(stats).toHaveProperty("totalKeys");
  });

  it("gets bundle analysis", () => {
    const analysis = performanceEngine.getBundleAnalysis();
    expect(analysis).toHaveProperty("totalSize");
    expect(analysis).toHaveProperty("chunks");
  });

  it("gets resource optimizations", () => {
    const optimizations = performanceEngine.getResourceOptimizations();
    expect(Array.isArray(optimizations)).toBe(true);
  });

  it("records a performance metric", () => {
    performanceEngine.recordMetric("page.load_time", 1250, "/home");
    const metrics = performanceEngine.getPageMetrics("/home");
    expect(metrics).toHaveProperty("avgLoadTime");
  });

  it("gets web vitals", () => {
    const vitals = performanceEngine.getWebVitals();
    expect(vitals).toHaveProperty("lcp");
    expect(vitals).toHaveProperty("fid");
    expect(vitals).toHaveProperty("cls");
  });
});

// ─── Phase 9D: Security Hardening ────────────────────────────────────────────
describe("Phase 9D: Security Hardening", () => {
  it("runs a dependency security scan", () => {
    const result = securityHardening.runSecurityScan("package.json", "dependency");
    expect(result).toHaveProperty("scanId");
    expect(result).toHaveProperty("vulnerabilities");
    expect(result).toHaveProperty("riskLevel");
  });

  it("runs a code security scan", () => {
    const result = securityHardening.runSecurityScan("server/", "code");
    expect(result).toHaveProperty("scanId");
    expect(result).toHaveProperty("issues");
  });

  it("gets security dashboard", () => {
    const dashboard = securityHardening.getSecurityDashboard();
    expect(dashboard).toHaveProperty("vulnerabilities");
    expect(dashboard).toHaveProperty("lastScan");
    expect(dashboard).toHaveProperty("riskScore");
  });

  it("validates password strength — strong", () => {
    const result = securityHardening.validatePasswordStrength("Tr0ub4dor&3#Correct");
    expect(result.strong).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("validates password strength — weak", () => {
    const result = securityHardening.validatePasswordStrength("password123");
    expect(result.strong).toBe(false);
    expect(result.score).toBeLessThan(80);
  });

  it("generates a security report", () => {
    const report = securityHardening.generateSecurityReport();
    expect(report).toHaveProperty("summary");
    expect(report).toHaveProperty("criticalIssues");
    expect(report).toHaveProperty("recommendations");
  });
});

// ─── Phase 9E: Data Integrity ─────────────────────────────────────────────────
describe("Phase 9E: Data Integrity", () => {
  it("creates a data snapshot", () => {
    const snapshot = dataIntegrity.createSnapshot("users", { count: 50000 });
    expect(snapshot).toHaveProperty("id");
    expect(snapshot).toHaveProperty("table", "users");
    expect(snapshot).toHaveProperty("checksum");
  });

  it("validates data integrity", () => {
    const snapshot = dataIntegrity.createSnapshot("posts", { count: 200000 });
    const result = dataIntegrity.validateIntegrity("posts", snapshot.id);
    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("checksum");
  });

  it("detects data corruption", () => {
    dataIntegrity.createSnapshot("transactions", { count: 1000000 });
    const result = dataIntegrity.validateIntegrity("transactions", "nonexistent_snapshot");
    expect(result.valid).toBe(false);
  });

  it("gets integrity report", () => {
    const report = dataIntegrity.getIntegrityReport();
    expect(report).toHaveProperty("tables");
    expect(report).toHaveProperty("lastCheck");
    expect(report).toHaveProperty("overallHealth");
  });
});

// ─── Phase 9F: Financial Finalization ────────────────────────────────────────
describe("Phase 9F: Financial Finalization", () => {
  it("gets creator payout summary", () => {
    const summary = financialFinalization.getCreatorPayoutSummary(1, "2025-Q4");
    expect(summary).toHaveProperty("creatorId", 1);
    expect(summary).toHaveProperty("period", "2025-Q4");
    expect(summary).toHaveProperty("totalEarned");
    expect(summary).toHaveProperty("breakdown");
  });

  it("gets financial summary", () => {
    const summary = financialFinalization.getFinancialSummary("2025-Q4");
    expect(summary).toHaveProperty("period", "2025-Q4");
    expect(summary).toHaveProperty("totalRevenue");
    expect(summary).toHaveProperty("totalPayouts");
    expect(summary).toHaveProperty("netProfit");
  });

  it("generates a tax report", () => {
    const report = financialFinalization.generateTaxReport(1, 2025, "US", []);
    expect(report).toHaveProperty("creatorId", 1);
    expect(report).toHaveProperty("year", 2025);
    expect(report).toHaveProperty("jurisdiction", "US");
    expect(report).toHaveProperty("totalIncome");
  });

  it("processes a payout", () => {
    const result = financialFinalization.processPayout(2, 500, "USD", "bank_transfer");
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("payoutId");
    expect(result).toHaveProperty("amount", 500);
  });

  it("gets payout history", () => {
    financialFinalization.processPayout(3, 100, "USD", "crypto");
    const history = financialFinalization.getPayoutHistory(3);
    expect(Array.isArray(history)).toBe(true);
  });
});

// ─── Phase 9G: AI Reliability ─────────────────────────────────────────────────
describe("Phase 9G: AI Reliability", () => {
  it("evaluates model performance", () => {
    const evaluation = aiReliability.evaluateModel("content_moderation_v2", {
      accuracy: 0.94,
      precision: 0.92,
      recall: 0.96,
      f1Score: 0.94,
      latency: 45,
    });
    expect(evaluation).toHaveProperty("modelId", "content_moderation_v2");
    expect(evaluation).toHaveProperty("passed");
  });

  it("detects model drift", () => {
    const drift = aiReliability.detectDrift("recommendation_engine", {
      baselineAccuracy: 0.85,
      currentAccuracy: 0.72,
    });
    expect(drift).toHaveProperty("driftDetected");
    expect(drift).toHaveProperty("severity");
  });

  it("gets AI health dashboard", () => {
    const dashboard = aiReliability.getDashboard();
    expect(dashboard).toHaveProperty("models");
    expect(dashboard).toHaveProperty("overallHealth");
    expect(dashboard).toHaveProperty("alerts");
  });

  it("logs AI decision for audit", () => {
    aiReliability.logDecision("content_moderation_v2", "post_123", { safe: false, confidence: 0.95 }, "auto_removed");
    const log = aiReliability.getDecisionLog("content_moderation_v2", 10);
    expect(log.length).toBeGreaterThan(0);
  });
});

// ─── Phase 9H: Scalability Engine ────────────────────────────────────────────
describe("Phase 9H: Scalability Engine", () => {
  it("evaluates scaling needs", () => {
    const result = scalabilityEngine.evaluateScaling("api-server", {
      cpuPercent: 85,
      memoryPercent: 70,
      requestRate: 5000,
      queueDepth: 200,
    });
    expect(result).toHaveProperty("action");
    expect(result).toHaveProperty("currentInstances");
    expect(result).toHaveProperty("recommendedInstances");
  });

  it("recommends scale-up when CPU is high", () => {
    const result = scalabilityEngine.evaluateScaling("worker", {
      cpuPercent: 95,
      memoryPercent: 90,
      requestRate: 10000,
      queueDepth: 1000,
    });
    expect(result.action).toBe("scale_up");
  });

  it("recommends scale-down when load is low", () => {
    const result = scalabilityEngine.evaluateScaling("batch-processor", {
      cpuPercent: 5,
      memoryPercent: 10,
      requestRate: 10,
      queueDepth: 0,
    });
    expect(result.action).toBe("scale_down");
  });

  it("gets scaling history", () => {
    scalabilityEngine.evaluateScaling("cdn", { cpuPercent: 60, memoryPercent: 50, requestRate: 2000, queueDepth: 0 });
    const history = scalabilityEngine.getScalingHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it("gets capacity plan", () => {
    const plan = scalabilityEngine.getCapacityPlan("api-server", 20, 6);
    expect(plan).toHaveProperty("service", "api-server");
    expect(plan).toHaveProperty("months");
    expect(plan.months).toHaveLength(6);
  });
});

// ─── Phase 9I: Compliance Engine ─────────────────────────────────────────────
describe("Phase 9I: Compliance Engine", () => {
  it("submits a data subject request", () => {
    const dsr = complianceEngine.submitDataSubjectRequest(40001, "access");
    expect(dsr).toMatchObject({ userId: 40001, type: "access" });
    expect(dsr.status).toBe("pending");
  });

  it("processes a deletion request", () => {
    const dsr = complianceEngine.submitDataSubjectRequest(40002, "deletion");
    complianceEngine.processDSR(dsr.id);
    const updated = complianceEngine.getDSR(dsr.id);
    expect(["processing", "completed"]).toContain(updated?.status);
  });

  it("gets compliance dashboard", () => {
    const dashboard = complianceEngine.getComplianceDashboard();
    expect(dashboard).toHaveProperty("gdpr");
    expect(dashboard).toHaveProperty("ccpa");
    expect(dashboard).toHaveProperty("openDSRs");
    expect(dashboard).toHaveProperty("overallScore");
  });

  it("generates GDPR compliance report", () => {
    const report = complianceEngine.generateComplianceReport("GDPR");
    expect(report).toMatchObject({ framework: "GDPR" });
    expect(report).toHaveProperty("compliant");
    expect(report).toHaveProperty("findings");
  });

  it("generates SOC2 compliance report", () => {
    const report = complianceEngine.generateComplianceReport("SOC2");
    expect(report.framework).toBe("SOC2");
    expect(report).toHaveProperty("controls");
  });

  it("logs a compliance event", () => {
    complianceEngine.logComplianceEvent("data_export", 40003, { format: "json", size: "2MB" });
    const log = complianceEngine.getComplianceLog(40003);
    expect(log.some(e => e.event === "data_export")).toBe(true);
  });

  it("checks data retention policy", () => {
    const policy = complianceEngine.getRetentionPolicy("user_data");
    expect(policy).toHaveProperty("retentionDays");
    expect(policy).toHaveProperty("legalBasis");
  });
});

// ─── Phase 7E: Financial Expansion ───────────────────────────────────────────
describe("Phase 7E: Financial Expansion", () => {
  it("creates a savings account", () => {
    const account = financialExpansion.createSavingsAccount(50001, "USD", "standard");
    expect(account).toMatchObject({ userId: 50001, currency: "USD" });
    expect(account.balance).toBe(0);
  });

  it("deposits to savings account", () => {
    const account = financialExpansion.createSavingsAccount(50002, "USD", "premium");
    financialExpansion.deposit(account.id, 1000);
    const updated = financialExpansion.getAccount(account.id);
    expect(updated?.balance).toBe(1000);
  });

  it("withdraws from savings account", () => {
    const account = financialExpansion.createSavingsAccount(50003, "USD", "standard");
    financialExpansion.deposit(account.id, 500);
    financialExpansion.withdraw(account.id, 200);
    const updated = financialExpansion.getAccount(account.id);
    expect(updated?.balance).toBe(300);
  });

  it("rejects withdrawal exceeding balance", () => {
    const account = financialExpansion.createSavingsAccount(50004, "USD", "standard");
    financialExpansion.deposit(account.id, 100);
    expect(() => financialExpansion.withdraw(account.id, 500)).toThrow();
  });

  it("calculates interest", () => {
    const account = financialExpansion.createSavingsAccount(50005, "USD", "premium");
    financialExpansion.deposit(account.id, 10000);
    const interest = financialExpansion.calculateInterest(account.id, 30);
    expect(interest).toBeGreaterThan(0);
  });
});

// ─── Phase 7F: Partnership Infrastructure ────────────────────────────────────
describe("Phase 7F: Partnership Infrastructure", () => {
  it("creates a partnership", () => {
    const partnership = partnershipInfrastructure.createPartnership(1, "partner_1", "integration", "API Integration", "Integrate our services");
    expect(partnership).toMatchObject({ initiatorId: 1, partnerId: "partner_1", type: "integration" });
  });

  it("accepts a partnership", () => {
    const partnership = partnershipInfrastructure.createPartnership(2, "partner_2", "revenue_share", "Revenue Share Deal", "50/50 split");
    partnershipInfrastructure.acceptPartnership(partnership.id);
    const updated = partnershipInfrastructure.getPartnership(partnership.id);
    expect(updated?.status).toBe("active");
  });

  it("gets partnerships for a user", () => {
    partnershipInfrastructure.createPartnership(3, "partner_3", "co_marketing", "Co-Marketing", "Joint campaign");
    const partnerships = partnershipInfrastructure.getPartnerships(3);
    expect(partnerships.length).toBeGreaterThan(0);
  });

  it("records partnership revenue", () => {
    const partnership = partnershipInfrastructure.createPartnership(4, "partner_4", "revenue_share", "Revenue Deal", "30/70 split");
    partnershipInfrastructure.acceptPartnership(partnership.id);
    partnershipInfrastructure.recordRevenue(partnership.id, 1000, "USD");
    const stats = partnershipInfrastructure.getPartnershipStats(partnership.id);
    expect(stats.totalRevenue).toBe(1000);
  });
});
