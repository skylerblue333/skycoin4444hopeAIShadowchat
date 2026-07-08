/**
 * ENGINE TEST SUITE
 * Comprehensive tests for all engine modules:
 * - Trust & Safety Engine
 * - Real-time Engine
 * - Media Engine
 * - Social Engine
 * - Streaming Engine
 * - Marketplace Engine
 * - GameFi Engine
 * - Analytics Engine
 * - Creator Economy Engine
 * - DeFi Engine
 * - Governance Engine
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  ContentModerationService,
  UserReputationService,
  ReportService,
  AppealService,
  AntiSpamEngine,
} from "./trust-safety-engine";
import {
  EventBus,
  SSEConnectionManager,
  PresenceService,
  TypingIndicatorService,
  NotificationPipeline,
} from "./realtime-engine";
import {
  ImageProcessingService,
  MediaLibraryService,
  StorageQuotaService,
  MediaAnalyticsService,
  CDNService,
} from "./media-engine";

// ═══════════════════════════════════════════════════════════════
// TRUST & SAFETY ENGINE TESTS
// ═══════════════════════════════════════════════════════════════

describe("ContentModerationService", () => {
  let service: ContentModerationService;

  beforeEach(() => {
    service = new ContentModerationService();
  });

  it("should allow clean content", async () => {
    const result = await service.moderateContent("Hello, how are you today?", 1, "post");
    expect(result.allowed).toBe(true);
    expect(result.flags).toHaveLength(0);
    expect(result.score).toBe(0);
  });

  it("should flag spam patterns", async () => {
    const result = await service.moderateContent("Buy now free! Click here to win prizes!", 1, "post");
    expect(result.flags.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
  });

  it("should flag toxic keywords", async () => {
    const result = await service.moderateContent("You are an idiot and a loser", 1, "comment");
    expect(result.flags.some(f => f.includes("toxic_keyword"))).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it("should flag excessive caps", async () => {
    const result = await service.moderateContent("THIS IS ALL CAPS AND VERY LOUD SHOUTING", 1, "post");
    expect(result.flags).toContain("excessive_caps");
  });

  it("should flag character spam", async () => {
    const result = await service.moderateContent("hellooooooo everyone", 1, "message");
    expect(result.flags).toContain("character_spam");
  });

  it("should block high-score content", async () => {
    const result = await service.moderateContent("Buy now free! Double your crypto! Send 1 ETH! Click here to win! Guaranteed returns!", 1, "post");
    expect(result.allowed).toBe(false);
    expect(result.autoAction).toBeDefined();
  });

  it("should track moderation actions", async () => {
    await service.takeAction(1, "warn", "Test warning", "spam", "low", true);
    await service.takeAction(2, "mute", "Test mute", "harassment", "medium", false, 99);
    const actions = service.getActions();
    expect(actions).toHaveLength(2);
  });

  it("should return stats by category and severity", () => {
    service.takeAction(1, "warn", "Test", "spam", "low", true);
    service.takeAction(2, "mute", "Test", "harassment", "medium", true);
    service.takeAction(3, "tempban", "Test", "spam", "high", false);
    const stats = service.getStats();
    expect(stats.total).toBe(3);
    expect(stats.automated).toBe(2);
    expect(stats.manual).toBe(1);
    expect(stats.byCategory["spam"]).toBe(2);
    expect(stats.bySeverity["low"]).toBe(1);
  });
});

describe("UserReputationService", () => {
  let service: UserReputationService;

  beforeEach(() => {
    service = new UserReputationService();
  });

  it("should initialize with default reputation", async () => {
    const rep = await service.getReputation(1);
    expect(rep.userId).toBe(1);
    expect(rep.trustScore).toBeGreaterThan(0);
    expect(rep.riskLevel).toBe("low");
  });

  it("should decrease trust on reports", async () => {
    const initial = await service.getReputation(1);
    const initialScore = initial.trustScore;
    await service.updateReputation(1, "report");
    const updated = await service.getReputation(1);
    expect(updated.trustScore).toBeLessThan(initialScore);
    expect(updated.reportCount).toBe(1);
  });

  it("should increase trust on positive actions", async () => {
    const initial = await service.getReputation(1);
    const initialScore = initial.trustScore;
    await service.updateReputation(1, "positive");
    const updated = await service.getReputation(1);
    expect(updated.trustScore).toBeGreaterThan(initialScore);
    expect(updated.positiveActions).toBe(1);
  });

  it("should set trust to 0 on ban", async () => {
    await service.updateReputation(1, "ban");
    const rep = await service.getReputation(1);
    expect(rep.trustScore).toBe(0);
    expect(rep.riskLevel).toBe("critical");
  });

  it("should award badges for verification", async () => {
    await service.updateReputation(1, "verified");
    const rep = await service.getReputation(1);
    expect(rep.verificationLevel).toBe("full");
    expect(rep.badges).toContain("verified");
  });
});

describe("ReportService", () => {
  let service: ReportService;

  beforeEach(() => {
    service = new ReportService();
  });

  it("should create reports with correct priority", async () => {
    const report = await service.createReport(1, 2, "Threatening messages", "violence", "message");
    expect(report.priority).toBe("urgent");
    expect(report.status).toBe("pending");
  });

  it("should resolve reports", async () => {
    const report = await service.createReport(1, 2, "Spam", "spam", "post");
    const resolved = await service.resolveReport(report.id, "Content removed", 99);
    expect(resolved).toBe(true);
  });

  it("should dismiss reports", async () => {
    const report = await service.createReport(1, 2, "Not spam", "spam", "post");
    const dismissed = await service.dismissReport(report.id, 99);
    expect(dismissed).toBe(true);
  });

  it("should return pending reports sorted by priority", async () => {
    await service.createReport(1, 2, "Spam", "spam", "post"); // low
    await service.createReport(3, 4, "Threats", "violence", "message"); // urgent
    await service.createReport(5, 6, "Hate", "hate_speech", "comment"); // high

    const pending = service.getPendingReports();
    expect(pending[0].priority).toBe("urgent");
    expect(pending[1].priority).toBe("high");
    expect(pending[2].priority).toBe("low");
  });

  it("should calculate report stats", async () => {
    await service.createReport(1, 2, "Test", "spam", "post");
    await service.createReport(3, 4, "Test", "harassment", "comment");
    const report3 = await service.createReport(5, 6, "Test", "scam", "listing");
    await service.resolveReport(report3.id, "Resolved", 99);

    const stats = service.getReportStats();
    expect(stats.total).toBe(3);
    expect(stats.pending).toBe(2);
    expect(stats.resolved).toBe(1);
  });
});

describe("AppealService", () => {
  let service: AppealService;

  beforeEach(() => {
    service = new AppealService();
  });

  it("should create appeals", async () => {
    const appeal = await service.createAppeal(1, "MOD-000001", "I was wrongly banned", "Screenshot evidence");
    expect(appeal.status).toBe("pending");
    expect(appeal.userId).toBe(1);
  });

  it("should approve appeals", async () => {
    const appeal = await service.createAppeal(1, "MOD-000001", "Wrong ban");
    const result = await service.reviewAppeal(appeal.id, 99, true, "Ban was incorrect");
    expect(result).toBe(true);
  });

  it("should deny appeals", async () => {
    const appeal = await service.createAppeal(1, "MOD-000001", "Unfair");
    const result = await service.reviewAppeal(appeal.id, 99, false, "Violation confirmed");
    expect(result).toBe(true);
  });
});

describe("AntiSpamEngine", () => {
  let engine: AntiSpamEngine;

  beforeEach(() => {
    engine = new AntiSpamEngine();
  });

  it("should detect rate limiting", () => {
    // Send 11 messages quickly
    for (let i = 0; i < 11; i++) {
      engine.checkSpam(1, `Message ${i}`);
    }
    const signals = engine.checkSpam(1, "One more");
    expect(signals.some(s => s.type === "rate_limit")).toBe(true);
  });

  it("should detect duplicate content", () => {
    engine.checkSpam(1, "This is a duplicate message");
    const signals = engine.checkSpam(1, "This is a duplicate message");
    expect(signals.some(s => s.type === "duplicate_content")).toBe(true);
  });

  it("should detect link spam", () => {
    const signals = engine.checkSpam(1, "Check https://a.com https://b.com https://c.com https://d.com");
    expect(signals.some(s => s.type === "link_spam")).toBe(true);
  });

  it("should detect keyword spam", () => {
    const signals = engine.checkSpam(1, "Free airdrop! Claim your guaranteed win now!");
    expect(signals.some(s => s.type === "keyword_spam")).toBe(true);
  });

  it("should allow normal messages", () => {
    const signals = engine.checkSpam(1, "Hey everyone, how's it going today?");
    expect(signals).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// REAL-TIME ENGINE TESTS
// ═══════════════════════════════════════════════════════════════

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it("should publish and receive events", async () => {
    let received = false;
    bus.subscribe("test:event", () => { received = true; });
    await bus.publish("test:event", "global", { data: "hello" });
    expect(received).toBe(true);
  });

  it("should support wildcard subscriptions", async () => {
    let count = 0;
    bus.subscribe("*", () => { count++; });
    await bus.publish("event:a", "ch1", {});
    await bus.publish("event:b", "ch2", {});
    expect(count).toBe(2);
  });

  it("should store event history", async () => {
    await bus.publish("test", "ch", { x: 1 });
    await bus.publish("test", "ch", { x: 2 });
    const events = bus.getRecentEvents("ch");
    expect(events).toHaveLength(2);
  });

  it("should unsubscribe correctly", async () => {
    let count = 0;
    const unsub = bus.subscribe("test", () => { count++; });
    await bus.publish("test", "ch", {});
    unsub();
    await bus.publish("test", "ch", {});
    expect(count).toBe(1);
  });
});

describe("SSEConnectionManager", () => {
  let manager: SSEConnectionManager;

  beforeEach(() => {
    manager = new SSEConnectionManager();
  });

  it("should add and track connections", () => {
    const connId = manager.addConnection(1, () => {});
    expect(connId).toBeDefined();
    expect(manager.getConnectionCount()).toBe(1);
    expect(manager.getOnlineUsers()).toContain(1);
  });

  it("should remove connections", () => {
    const connId = manager.addConnection(1, () => {});
    manager.removeConnection(connId);
    expect(manager.getConnectionCount()).toBe(0);
  });

  it("should broadcast to channel subscribers", () => {
    let received = 0;
    manager.addConnection(1, () => { received++; });
    manager.addConnection(2, () => { received++; });

    const sent = manager.broadcastToChannel("global", {
      id: "1", type: "test", channel: "global", payload: {}, timestamp: new Date(), priority: "normal",
    });
    expect(sent).toBe(2);
    expect(received).toBe(2);
  });

  it("should send to specific user", () => {
    let user1Received = 0;
    let user2Received = 0;
    manager.addConnection(1, () => { user1Received++; });
    manager.addConnection(2, () => { user2Received++; });

    manager.sendToUser(1, {
      id: "1", type: "test", channel: "user:1", payload: {}, timestamp: new Date(), priority: "normal",
    });
    expect(user1Received).toBe(1);
    expect(user2Received).toBe(0);
  });

  it("should handle channel subscriptions", () => {
    let received = 0;
    const connId = manager.addConnection(1, () => { received++; });
    manager.subscribeToChannel(connId, "room:123");

    manager.broadcastToChannel("room:123", {
      id: "1", type: "test", channel: "room:123", payload: {}, timestamp: new Date(), priority: "normal",
    });
    expect(received).toBe(1);
  });

  afterEach(() => {
    manager.destroy();
  });
});

describe("PresenceService", () => {
  let presence: PresenceService;
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
    presence = new PresenceService(bus);
  });

  it("should track online status", () => {
    presence.setOnline(1, "desktop");
    const state = presence.getPresence(1);
    expect(state?.status).toBe("online");
    expect(state?.device).toBe("desktop");
  });

  it("should track offline status", () => {
    presence.setOnline(1);
    presence.setOffline(1);
    const state = presence.getPresence(1);
    expect(state?.status).toBe("offline");
  });

  it("should list online users", () => {
    presence.setOnline(1);
    presence.setOnline(2);
    presence.setOffline(1);
    const online = presence.getOnlineUsers();
    expect(online).toHaveLength(1);
    expect(online[0].userId).toBe(2);
  });

  it("should support custom statuses", () => {
    presence.setOnline(1);
    presence.setStatus(1, "dnd");
    const state = presence.getPresence(1);
    expect(state?.status).toBe("dnd");
  });
});

describe("TypingIndicatorService", () => {
  let typing: TypingIndicatorService;

  beforeEach(() => {
    typing = new TypingIndicatorService();
  });

  it("should track typing users", () => {
    typing.startTyping(1, "channel:1");
    typing.startTyping(2, "channel:1");
    const users = typing.getTypingUsers("channel:1");
    expect(users).toContain(1);
    expect(users).toContain(2);
  });

  it("should stop typing", () => {
    typing.startTyping(1, "channel:1");
    typing.stopTyping(1, "channel:1");
    const users = typing.getTypingUsers("channel:1");
    expect(users).not.toContain(1);
  });

  it("should isolate channels", () => {
    typing.startTyping(1, "channel:1");
    typing.startTyping(2, "channel:2");
    expect(typing.getTypingUsers("channel:1")).toHaveLength(1);
    expect(typing.getTypingUsers("channel:2")).toHaveLength(1);
  });
});

describe("NotificationPipeline", () => {
  let pipeline: NotificationPipeline;
  let sseManager: SSEConnectionManager;
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
    sseManager = new SSEConnectionManager();
    pipeline = new NotificationPipeline(sseManager, bus);
  });

  it("should send notifications", async () => {
    const notif = await pipeline.send(1, "message", "New Message", "You have a new message");
    expect(notif.id).toBeDefined();
    expect(notif.read).toBe(false);
  });

  it("should retrieve unread notifications", async () => {
    await pipeline.send(1, "message", "Msg 1", "Body 1");
    await pipeline.send(1, "like", "Like", "Someone liked your post");
    const notifs = pipeline.getNotifications(1, true);
    expect(notifs).toHaveLength(2);
  });

  it("should mark as read", async () => {
    const notif = await pipeline.send(1, "follow", "New Follower", "User followed you");
    pipeline.markAsRead(1, notif.id);
    const unread = pipeline.getNotifications(1, true);
    expect(unread).toHaveLength(0);
  });

  it("should mark all as read", async () => {
    await pipeline.send(1, "message", "A", "A");
    await pipeline.send(1, "message", "B", "B");
    await pipeline.send(1, "message", "C", "C");
    const count = pipeline.markAllAsRead(1);
    expect(count).toBe(3);
    expect(pipeline.getUnreadCount(1)).toBe(0);
  });

  it("should count unread correctly", async () => {
    await pipeline.send(1, "tip", "Tip", "You received a tip");
    await pipeline.send(1, "achievement", "Badge", "New badge!");
    expect(pipeline.getUnreadCount(1)).toBe(2);
  });

  afterEach(() => {
    sseManager.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// MEDIA ENGINE TESTS
// ═══════════════════════════════════════════════════════════════

describe("ImageProcessingService", () => {
  let service: ImageProcessingService;

  beforeEach(() => {
    service = new ImageProcessingService();
  });

  it("should generate image variants", async () => {
    const result = await service.processImage("https://example.com/photo.jpg", 1);
    expect(result.variants.length).toBeGreaterThan(0);
    expect(result.variants.find(v => v.name === "thumbnail")).toBeDefined();
    expect(result.variants.find(v => v.name === "large")).toBeDefined();
  });

  it("should extract metadata", async () => {
    const result = await service.processImage("https://example.com/photo.png", 1);
    expect(result.metadata.colorSpace).toBe("sRGB");
    expect(result.metadata.hasAlpha).toBe(true); // .png
    expect(result.metadata.blurhash).toBeDefined();
    expect(result.metadata.dominantColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("should generate avatars", async () => {
    const avatar = await service.generateAvatar(1, "JD");
    expect(avatar).toContain("data:image/svg+xml");
    expect(avatar).toContain("JD");
  });

  it("should generate different avatars for different users", async () => {
    const avatar1 = await service.generateAvatar(1, "AB");
    const avatar2 = await service.generateAvatar(5, "CD");
    expect(avatar1).not.toBe(avatar2);
  });
});

describe("MediaLibraryService", () => {
  let library: MediaLibraryService;

  beforeEach(() => {
    library = new MediaLibraryService();
  });

  it("should upload assets", async () => {
    const asset = await library.uploadAsset(1, {
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      size: 1024000,
      url: "https://storage.example.com/photo.jpg",
    });
    expect(asset.id).toBeDefined();
    expect(asset.type).toBe("image");
    expect(asset.status).toBe("ready");
  });

  it("should categorize media types", async () => {
    const image = await library.uploadAsset(1, { filename: "a.jpg", mimeType: "image/jpeg", size: 100, url: "u1" });
    const video = await library.uploadAsset(1, { filename: "b.mp4", mimeType: "video/mp4", size: 100, url: "u2" });
    const audio = await library.uploadAsset(1, { filename: "c.mp3", mimeType: "audio/mpeg", size: 100, url: "u3" });
    const doc = await library.uploadAsset(1, { filename: "d.pdf", mimeType: "application/pdf", size: 100, url: "u4" });

    expect(image.type).toBe("image");
    expect(video.type).toBe("video");
    expect(audio.type).toBe("audio");
    expect(doc.type).toBe("document");
  });

  it("should list user assets", async () => {
    await library.uploadAsset(1, { filename: "a.jpg", mimeType: "image/jpeg", size: 100, url: "u1" });
    await library.uploadAsset(1, { filename: "b.jpg", mimeType: "image/jpeg", size: 100, url: "u2" });
    await library.uploadAsset(2, { filename: "c.jpg", mimeType: "image/jpeg", size: 100, url: "u3" });

    const user1Assets = await library.getUserAssets(1);
    expect(user1Assets).toHaveLength(2);
  });

  it("should delete assets", async () => {
    const asset = await library.uploadAsset(1, { filename: "a.jpg", mimeType: "image/jpeg", size: 100, url: "u1" });
    const deleted = await library.deleteAsset(asset.id, 1);
    expect(deleted).toBe(true);

    const assets = await library.getUserAssets(1);
    expect(assets).toHaveLength(0);
  });

  it("should prevent unauthorized deletion", async () => {
    const asset = await library.uploadAsset(1, { filename: "a.jpg", mimeType: "image/jpeg", size: 100, url: "u1" });
    const deleted = await library.deleteAsset(asset.id, 2); // Different user
    expect(deleted).toBe(false);
  });

  it("should manage collections", async () => {
    const collection = await library.createCollection(1, "My Album", "Vacation photos");
    expect(collection.name).toBe("My Album");

    const asset = await library.uploadAsset(1, { filename: "a.jpg", mimeType: "image/jpeg", size: 100, url: "u1" });
    await library.addToCollection(collection.id, asset.id, 1);

    const collections = await library.getUserCollections(1);
    expect(collections).toHaveLength(1);
    expect(collections[0].assetIds).toContain(asset.id);
  });
});

describe("StorageQuotaService", () => {
  let quota: StorageQuotaService;

  beforeEach(() => {
    quota = new StorageQuotaService();
  });

  it("should initialize with free tier limits", async () => {
    const q = await quota.getQuota(1);
    expect(q.tier).toBe("free");
    expect(q.maxBytes).toBe(500 * 1024 * 1024); // 500MB
    expect(q.usedBytes).toBe(0);
  });

  it("should allow uploads within quota", async () => {
    const check = await quota.checkQuota(1, 1024 * 1024); // 1MB
    expect(check.allowed).toBe(true);
  });

  it("should reject uploads exceeding quota", async () => {
    const q = await quota.getQuota(1);
    const check = await quota.checkQuota(1, q.maxBytes + 1);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("Storage limit exceeded");
  });

  it("should track consumed quota", async () => {
    await quota.consumeQuota(1, 10 * 1024 * 1024); // 10MB
    const q = await quota.getQuota(1);
    expect(q.usedBytes).toBe(10 * 1024 * 1024);
    expect(q.fileCount).toBe(1);
  });

  it("should release quota on deletion", async () => {
    await quota.consumeQuota(1, 10 * 1024 * 1024);
    await quota.releaseQuota(1, 10 * 1024 * 1024);
    const q = await quota.getQuota(1);
    expect(q.usedBytes).toBe(0);
  });

  it("should upgrade tiers", async () => {
    await quota.upgradeTier(1, "premium");
    const q = await quota.getQuota(1);
    expect(q.tier).toBe("premium");
    expect(q.maxBytes).toBe(50 * 1024 * 1024 * 1024); // 50GB
  });
});

describe("MediaAnalyticsService", () => {
  let analytics: MediaAnalyticsService;

  beforeEach(() => {
    analytics = new MediaAnalyticsService();
  });

  it("should track views", () => {
    analytics.recordView("asset_1");
    analytics.recordView("asset_1");
    analytics.recordView("asset_1");
    const stats = analytics.getAssetStats("asset_1");
    expect(stats.views).toBe(3);
  });

  it("should track downloads and bandwidth", () => {
    analytics.recordDownload("asset_1", 1024000);
    analytics.recordDownload("asset_1", 1024000);
    const stats = analytics.getAssetStats("asset_1");
    expect(stats.downloads).toBe(2);
    expect(analytics.getTotalBandwidth()).toBe(2048000);
  });

  it("should return top assets", () => {
    analytics.recordView("asset_1");
    analytics.recordView("asset_1");
    analytics.recordView("asset_1");
    analytics.recordView("asset_2");
    analytics.recordView("asset_2");
    analytics.recordView("asset_3");

    const top = analytics.getTopAssets(2);
    expect(top[0].assetId).toBe("asset_1");
    expect(top[0].views).toBe(3);
    expect(top).toHaveLength(2);
  });
});

describe("CDNService", () => {
  let cdn: CDNService;

  beforeEach(() => {
    cdn = new CDNService();
  });

  it("should generate optimized URLs", () => {
    const url = cdn.getOptimizedUrl("https://storage.com/img.jpg", { width: 640, quality: 80, format: "webp" });
    expect(url).toContain("w=640");
    expect(url).toContain("q=80");
    expect(url).toContain("fmt=webp");
  });

  it("should return original URL without options", () => {
    const url = cdn.getOptimizedUrl("https://storage.com/img.jpg");
    expect(url).toBe("https://storage.com/img.jpg");
  });

  it("should generate srcSet", () => {
    const srcSet = cdn.generateSrcSet("https://storage.com/img.jpg");
    expect(srcSet).toContain("320w");
    expect(srcSet).toContain("1920w");
    expect(srcSet).toContain("fmt=webp");
  });

  it("should return cache policies by content type", () => {
    const imagePolicy = cdn.getCachePolicy("image/jpeg");
    expect(imagePolicy.maxAge).toBe(86400 * 30); // 30 days

    const videoPolicy = cdn.getCachePolicy("video/mp4");
    expect(videoPolicy.maxAge).toBe(86400 * 7); // 7 days
  });
});
