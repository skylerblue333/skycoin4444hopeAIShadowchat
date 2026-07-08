import crypto from 'crypto';
/**
 * CORE FACADES
 *
 * Thin aggregate facades that wrap the individual Phase 2 service singletons
 * into unified interfaces. Used by:
 * - The TRPC router (via dynamic import)
 * - The test suite
 * - Any consumer that wants a single entry point per domain
 */

import { communityServer, rolePermissions } from "./community-core";
import {
  trendEngine,
  reelsEngine,
  friendGraph,
  reputationEngine,
  voiceNoteService,
} from "./social-core";
import {
  liveGifting,
  streamBattles,
  streamScheduler,
  streamAnalyticsDashboard,
  rtmpIngest,
} from "./streaming-core";
import {
  videoTranscoding,
  creatorMediaLibrary,
  storageLifecycle,
} from "./media-core";

// ─── COMMUNITY CORE FACADE ────────────────────────────────────────────────────

interface ServerWithMeta {
  id: string;
  ownerId: number;
  name: string;
  description?: string;
  category?: string;
  isPublic: boolean;
  tokenGated: boolean;
  requiredTokenAddress?: string;
  requiredTokenAmount?: number;
  iconUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  channels: ChannelRecord[];
  members: Set<number>;
  inviteCode: string;
  createdAt: Date;
}

interface ChannelRecord {
  id: string;
  serverId: string;
  name: string;
  type: string;
  description?: string;
  isPrivate: boolean;
  position: number;
  createdAt: Date;
}

interface MessageRecord {
  id: string;
  channelId: string;
  authorId: number;
  content: string;
  attachments?: string[];
  replyToId?: string;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

interface InviteRecord {
  code: string;
  serverId: string;
  createdBy: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

class CommunityCoreFacade {
  private servers = new Map<string, ServerWithMeta>();
  private channels = new Map<string, ChannelRecord>();
  private messages = new Map<string, MessageRecord[]>(); // channelId -> messages
  private invites = new Map<string, InviteRecord>(); // code -> invite
  private roles = new Map<string, { id: string; serverId: string; name: string; color?: string; permissions: string[]; isHoisted: boolean; isMentionable: boolean; createdBy: number }>();
  private memberRoles = new Map<string, string[]>(); // `${serverId}:${userId}` -> roleIds
  private channelCounter = 0;
  private messageCounter = 0;
  private roleCounter = 0;

  async createServer(params: {
    ownerId: number;
    name: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
    tokenGated?: boolean;
    requiredTokenAddress?: string;
    requiredTokenAmount?: number;
    iconUrl?: string;
    bannerUrl?: string;
  }): Promise<ServerWithMeta> {
    const serverId = `srv_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`;
    const inviteCode = (crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 10).toUpperCase();

    // Create default channels
    const generalChannel: ChannelRecord = {
      id: `ch_${++this.channelCounter}`,
      serverId,
      name: "general",
      type: "text",
      isPrivate: false,
      position: 0,
      createdAt: new Date(),
    };
    const welcomeChannel: ChannelRecord = {
      id: `ch_${++this.channelCounter}`,
      serverId,
      name: "welcome",
      type: "text",
      isPrivate: false,
      position: 1,
      createdAt: new Date(),
    };

    this.channels.set(generalChannel.id, generalChannel);
    this.channels.set(welcomeChannel.id, welcomeChannel);
    this.messages.set(generalChannel.id, []);
    this.messages.set(welcomeChannel.id, []);

    const server: ServerWithMeta = {
      id: serverId,
      ownerId: params.ownerId,
      name: params.name,
      description: params.description,
      category: params.category || "general",
      isPublic: params.isPublic !== false,
      tokenGated: params.tokenGated || false,
      requiredTokenAddress: params.requiredTokenAddress,
      requiredTokenAmount: params.requiredTokenAmount,
      iconUrl: params.iconUrl,
      bannerUrl: params.bannerUrl,
      memberCount: 1,
      channels: [generalChannel, welcomeChannel],
      members: new Set([params.ownerId]),
      inviteCode,
      createdAt: new Date(),
    };

    this.servers.set(serverId, server);
    return server;
  }

  async joinServer(serverId: string, userId: number, inviteCode?: string): Promise<{ success: boolean; reason?: string }> {
    const server = this.servers.get(serverId);
    if (!server) return { success: false, reason: "Server not found" };

    if (server.members.has(userId)) {
      return { success: false, reason: "Already a member" };
    }

    // Validate invite code if provided
    if (inviteCode) {
      const invite = this.invites.get(inviteCode);
      if (!invite || invite.serverId !== serverId) {
        return { success: false, reason: "Invalid invite code" };
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return { success: false, reason: "Invite expired" };
      }
      if (invite.maxUses && invite.usedCount >= invite.maxUses) {
        return { success: false, reason: "Invite max uses reached" };
      }
      invite.usedCount++;
    }

    server.members.add(userId);
    server.memberCount++;
    return { success: true };
  }

  async leaveServer(serverId: string, userId: number): Promise<{ success: boolean; reason?: string }> {
    const server = this.servers.get(serverId);
    if (!server) return { success: false, reason: "Server not found" };
    if (server.ownerId === userId) return { success: false, reason: "Owner cannot leave server" };
    if (!server.members.has(userId)) return { success: false, reason: "Not a member" };

    server.members.delete(userId);
    server.memberCount--;
    return { success: true };
  }

  async createChannel(params: {
    serverId: string;
    creatorId: number;
    name: string;
    type: string;
    description?: string;
    isPrivate?: boolean;
    position?: number;
  }): Promise<ChannelRecord | null> {
    const server = this.servers.get(params.serverId);
    if (!server) return null;

    const channel: ChannelRecord = {
      id: `ch_${++this.channelCounter}`,
      serverId: params.serverId,
      name: params.name,
      type: params.type,
      description: params.description,
      isPrivate: params.isPrivate || false,
      position: params.position ?? server.channels.length,
      createdAt: new Date(),
    };

    this.channels.set(channel.id, channel);
    this.messages.set(channel.id, []);
    server.channels.push(channel);
    return channel;
  }

  async sendMessage(params: {
    channelId: string;
    authorId: number;
    content: string;
    attachments?: string[];
    replyToId?: string;
  }): Promise<MessageRecord | null> {
    const channel = this.channels.get(params.channelId);
    if (!channel) return null;

    const message: MessageRecord = {
      id: `msg_${++this.messageCounter}`,
      channelId: params.channelId,
      authorId: params.authorId,
      content: params.content,
      attachments: params.attachments,
      replyToId: params.replyToId,
      isPinned: false,
      isDeleted: false,
      createdAt: new Date(),
    };

    const channelMessages = this.messages.get(params.channelId) || [];
    channelMessages.push(message);
    this.messages.set(params.channelId, channelMessages);
    return message;
  }

  async getMessages(channelId: string, limit = 50, before?: string): Promise<MessageRecord[]> {
    const msgs = this.messages.get(channelId) || [];
    let filtered = msgs.filter(m => !m.isDeleted);
    if (before) {
      const idx = filtered.findIndex(m => m.id === before);
      if (idx > 0) filtered = filtered.slice(0, idx);
    }
    return filtered.slice(-limit).reverse();
  }

  async createRole(params: {
    serverId: string;
    createdBy: number;
    name: string;
    color?: string;
    permissions?: string[];
    isHoisted?: boolean;
    isMentionable?: boolean;
    position?: number;
  }): Promise<{ id: string; name: string; color?: string; permissions: string[]; isHoisted: boolean; isMentionable: boolean } | null> {
    const server = this.servers.get(params.serverId);
    if (!server) return null;

    const role = {
      id: `role_${++this.roleCounter}`,
      serverId: params.serverId,
      name: params.name,
      color: params.color,
      permissions: params.permissions || [],
      isHoisted: params.isHoisted || false,
      isMentionable: params.isMentionable !== false,
      createdBy: params.createdBy,
    };

    this.roles.set(role.id, role);
    return role;
  }

  async assignRole(serverId: string, targetUserId: number, roleId: string, assignerId: number): Promise<{ success: boolean }> {
    const server = this.servers.get(serverId);
    if (!server) return { success: false };
    if (!server.members.has(targetUserId)) return { success: false };

    const key = `${serverId}:${targetUserId}`;
    const existing = this.memberRoles.get(key) || [];
    if (!existing.includes(roleId)) {
      existing.push(roleId);
      this.memberRoles.set(key, existing);
    }
    return { success: true };
  }

  async generateInviteCode(serverId: string, creatorId: number, maxUses?: number, expiresInHours?: number): Promise<InviteRecord> {
    const code = (crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 10).toUpperCase();
    const invite: InviteRecord = {
      code,
      serverId,
      createdBy: creatorId,
      maxUses,
      usedCount: 0,
      expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 3600000) : undefined,
      createdAt: new Date(),
    };
    this.invites.set(code, invite);
    return invite;
  }

  async getServerStats(serverId: string): Promise<{ memberCount: number; channelCount: number; totalMessages: number; onlineCount: number } | null> {
    const server = this.servers.get(serverId);
    if (!server) return null;

    let totalMessages = 0;
    for (const [channelId, msgs] of this.messages) {
      const channel = this.channels.get(channelId);
      if (channel?.serverId === serverId) {
        totalMessages += msgs.filter(m => !m.isDeleted).length;
      }
    }

    return {
      memberCount: server.memberCount,
      channelCount: server.channels.length,
      totalMessages,
      onlineCount: Math.floor(server.memberCount * 0.3),
    };
  }

  async discoverServers(category?: string, limit = 20): Promise<ServerWithMeta[]> {
    const all = Array.from(this.servers.values()).filter(s => s.isPublic);
    const filtered = category ? all.filter(s => s.category === category) : all;
    return filtered.slice(0, limit);
  }

  async moderateMessage(serverId: string, messageId: string, action: "delete" | "pin" | "unpin", moderatorId: number): Promise<{ success: boolean }> {
    for (const [channelId, msgs] of this.messages) {
      const channel = this.channels.get(channelId);
      if (channel?.serverId !== serverId) continue;
      const msg = msgs.find(m => m.id === messageId);
      if (msg) {
        if (action === "delete") msg.isDeleted = true;
        else if (action === "pin") msg.isPinned = true;
        else if (action === "unpin") msg.isPinned = false;
        return { success: true };
      }
    }
    return { success: false };
  }
}

// ─── SOCIAL CORE FACADE ───────────────────────────────────────────────────────

class SocialCoreFacade {
  async getTrendingTopics(limit = 20, category?: string) {
    return trendEngine.getTrending({ limit, category: category as any });
  }

  async discoverCreators(limit = 20, _category?: string) {
    // Return top reputation users as creator suggestions
    return reputationEngine.getLeaderboard(limit);
  }

  async getReputationScore(userId: number) {
    const rep = await reputationEngine.getReputation(userId);
    return { ...rep, totalScore: rep.score, level: rep.tier };
  }

  async updateReputation(userId: number, action: string, value: number) {
    return reputationEngine.updateScore(userId, value, action);
  }

  async createReel(params: {
    creatorId: number;
    videoUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    audioTrack?: string;
    duration: number;
    hashtags?: string[];
  }) {
    const reel = await (reelsEngine as any).createReel(params);
    return { ...reel, status: "active" as const };
  }

  async getReelsFeed(limit = 20, cursor?: number) {
    // Use trending reels for public feed
    return reelsEngine.getTrendingReels(limit);
  }

  async getFriendSuggestions(userId: number, limit = 10) {
    return friendGraph.getSuggestions(userId, limit);
  }

  async sendVoiceNote(senderId: number, recipientId: number, audioUrl: string, duration: number) {
    return voiceNoteService.createVoiceNote({ senderId, recipientId, audioUrl, duration });
  }

  async recordEngagement(userId: number, contentId: string, contentType: string, action: string, durationSeconds?: number) {
    if (contentType === "post") {
      await trendEngine.recordHashtag("engagement", contentId);
    }
    return { recorded: true };
  }
}

// ─── STREAMING CORE FACADE ────────────────────────────────────────────────────

interface StreamSessionRecord {
  id: string;
  creatorId: number;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPremium: boolean;
  premiumPrice?: number;
  status: "scheduled" | "live" | "ended";
  streamKey?: string;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  scheduledFor?: Date;
  viewerCount: number;
  peakViewers: number;
  createdAt: Date;
}

class StreamingCoreFacade {
  private sessions = new Map<string, StreamSessionRecord>();
  private sessionCounter = 0;

  async createStreamSession(params: {
    creatorId: number;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    isPremium?: boolean;
    premiumPrice?: number;
    scheduledFor?: Date;
  }): Promise<StreamSessionRecord> {
    const session: StreamSessionRecord = {
      id: `stream_${++this.sessionCounter}_${Date.now()}`,
      creatorId: params.creatorId,
      title: params.title,
      description: params.description,
      category: params.category,
      tags: params.tags,
      isPremium: params.isPremium || false,
      premiumPrice: params.premiumPrice,
      status: "scheduled",
      viewerCount: 0,
      peakViewers: 0,
      scheduledFor: params.scheduledFor,
      createdAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async goLive(sessionId: string, creatorId: number, rtmpUrl?: string): Promise<StreamSessionRecord | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.creatorId !== creatorId) return null;

    const streamKey = await rtmpIngest.generateStreamKey(creatorId, sessionId);
    session.status = "live";
    session.startedAt = new Date();
    session.streamKey = streamKey.key;
    return session;
  }

  async endStream(sessionId: string, creatorId: number): Promise<StreamSessionRecord | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.creatorId !== creatorId) return null;

    session.status = "ended";
    session.endedAt = new Date();
    if (session.startedAt) {
      session.duration = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
    }
    return session;
  }

  async sendGift(params: {
    sessionId: string;
    senderId: number;
    giftType: string;
    quantity: number;
    message?: string;
  }) {
    const session = this.sessions.get(params.sessionId);
    if (!session || session.status !== "live") return null;

    return (liveGifting as any).sendGift({
      streamId: params.sessionId,
      senderId: params.senderId,
      giftType: params.giftType as any,
      quantity: params.quantity,
      message: params.message,
    });
  }

  async startStreamBattle(sessionId: string, opponentSessionId: string, creatorId: number, durationMinutes = 10) {
    return streamBattles.challengeCreator({
      challengerId: creatorId,
      challengerStreamId: sessionId,
      challengedId: creatorId + 1,       durationSeconds: durationMinutes * 60,
    });
  }

  async scheduleStream(params: {
    creatorId: number;
    title: string;
    scheduledFor: Date;
    category?: string;
    description?: string;
    isPremium?: boolean;
  }): Promise<StreamSessionRecord> {
    return this.createStreamSession(params);
  }

  async getLiveStreams(category?: string, limit = 20): Promise<StreamSessionRecord[]> {
    const live = Array.from(this.sessions.values()).filter(s => s.status === "live");
    const filtered = category ? live.filter(s => s.category === category) : live;
    return filtered.slice(0, limit);
  }

  async getStreamAnalytics(sessionId: string, creatorId: number) {
    const session = this.sessions.get(sessionId);
    if (!session || session.creatorId !== creatorId) return null;

    const analytics = await streamAnalyticsDashboard.getStreamAnalytics(sessionId);
    return {
      sessionId,
      currentViewers: session.viewerCount,
      peakViewers: session.peakViewers,
      duration: session.duration || 0,
      giftRevenue: 0,
      ...analytics,
    };
  }

  async getCreatorStreamStats(creatorId: number) {
    const creatorSessions = Array.from(this.sessions.values()).filter(s => s.creatorId === creatorId);
    const history = await streamAnalyticsDashboard.getCreatorStreamHistory(creatorId, 10);
    return {
      totalStreams: creatorSessions.length,
      totalViewers: creatorSessions.reduce((sum, s) => sum + s.peakViewers, 0),
      totalGiftsReceived: 0,
      avgViewers: creatorSessions.length > 0
        ? Math.floor(creatorSessions.reduce((sum, s) => sum + s.peakViewers, 0) / creatorSessions.length)
        : 0,
      history,
    };
  }
}

// ─── MEDIA CORE FACADE ────────────────────────────────────────────────────────

interface UploadRecord {
  uploadId: string;
  userId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  mediaType: string;
  uploadUrl: string;
  s3Key?: string;
  status: "pending" | "processing" | "ready" | "failed";
  transcodeJobId?: string;
  expiresAt: Date;
  createdAt: Date;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif",
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
  "application/pdf",
]);

const MAX_FILE_SIZES: Record<string, number> = {
  image: 50 * 1024 * 1024,    // 50MB
  video: 5 * 1024 * 1024 * 1024, // 5GB
  audio: 500 * 1024 * 1024,   // 500MB
  document: 100 * 1024 * 1024, // 100MB
};

class MediaCoreFacade {
  private uploads = new Map<string, UploadRecord>();
  private userStorage = new Map<number, number>(); // userId -> usedBytes
  private uploadCounter = 0;

  async generateUploadUrl(params: {
    userId: number;
    fileName: string;
    fileSize: number;
    mimeType: string;
    mediaType: string;
    purpose?: string;
  }): Promise<{ uploadId: string; uploadUrl: string; expiresAt: Date }> {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(params.mimeType)) {
      throw new Error(`Unsupported file type: ${params.mimeType}`);
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[params.mediaType] || MAX_FILE_SIZES.document;
    if (params.fileSize > maxSize) {
      throw new Error(`File too large: ${params.fileSize} bytes exceeds ${maxSize} byte limit for ${params.mediaType}`);
    }

    const uploadId = `upload_${++this.uploadCounter}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    const record: UploadRecord = {
      uploadId,
      userId: params.userId,
      fileName: params.fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      mediaType: params.mediaType,
      uploadUrl: `https://s3.amazonaws.com/shadowchat-media/uploads/${uploadId}?X-Amz-Expires=3600`,
      status: "pending",
      expiresAt,
      createdAt: new Date(),
    };

    this.uploads.set(uploadId, record);
    return { uploadId, uploadUrl: record.uploadUrl, expiresAt };
  }

  async confirmUpload(uploadId: string, userId: number, s3Key: string): Promise<UploadRecord> {
    const upload = this.uploads.get(uploadId);
    if (!upload || upload.userId !== userId) {
      throw new Error("Upload not found or unauthorized");
    }

    upload.s3Key = s3Key;
    upload.status = "processing";

    // Start transcoding for video
    if (upload.mediaType === "video") {
      const job = await videoTranscoding.submitTranscodingJob({
        assetId: uploadId,
        userId,
        inputUrl: `https://s3.amazonaws.com/shadowchat-media/${s3Key}`,
        targetQualities: ["1080p", "720p", "480p"],
        generateHLS: true,
        generateThumbnails: true,
      });
      upload.transcodeJobId = job.id;
    } else {
      upload.status = "ready";
    }

    // Track storage usage
    const current = this.userStorage.get(userId) || 0;
    this.userStorage.set(userId, current + upload.fileSize);

    return upload;
  }

  async getUserLibrary(userId: number, mediaType?: string, limit = 20, offset = 0): Promise<UploadRecord[]> {
    const userUploads = Array.from(this.uploads.values())
      .filter(u => u.userId === userId && u.status === "ready")
      .filter(u => !mediaType || u.mediaType === mediaType)
      .slice(offset, offset + limit);
    return userUploads;
  }

  async deleteMedia(mediaId: string, userId: number): Promise<{ success: boolean }> {
    const upload = this.uploads.get(mediaId);
    if (!upload || upload.userId !== userId) return { success: false };

    const current = this.userStorage.get(userId) || 0;
    this.userStorage.set(userId, Math.max(0, current - upload.fileSize));
    this.uploads.delete(mediaId);
    return { success: true };
  }

  async getStorageUsage(userId: number): Promise<{ usedBytes: number; limitBytes: number; usedPercent: number }> {
    const usedBytes = this.userStorage.get(userId) || 0;
    const limitBytes = 100 * 1024 * 1024 * 1024; // 100GB default
    return {
      usedBytes,
      limitBytes,
      usedPercent: Math.min(100, (usedBytes / limitBytes) * 100),
    };
  }

  async getTranscodeStatus(jobId: string) {
    return videoTranscoding.getJobStatus(jobId);
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const communityCore = new CommunityCoreFacade();
export const socialCore = new SocialCoreFacade();
export const streamingCore = new StreamingCoreFacade();
export const mediaCore = new MediaCoreFacade();
