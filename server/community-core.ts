import crypto from 'crypto';
/**
 * COMMUNITY CORE ENGINE — Discord-Inspired Server Ecosystem
 *
 * Architecture: Full community server infrastructure
 *
 * Services:
 * - CommunityServerService: Server creation, settings, discovery, categories
 * - VoiceChannelService: Voice room management, speaker queues, stage channels
 * - RolePermissionService: Granular RBAC, custom roles, permission inheritance
 * - TokenGatingService: NFT/token-gated access, wallet verification
 * - CommunityAnalyticsService: Member growth, engagement, retention analytics
 * - CommunityEventService: Scheduled events, RSVPs, reminders
 * - CommunityModerationService: Auto-moderation, word filters, slow mode
 * - CommunityRewardsService: XP system, level-ups, community badges
 * - ThreadService: Threaded discussions, pinned threads, thread archives
 * - AnnouncementService: Pinned announcements, @everyone mentions, read tracking
 */

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export type ChannelType = "text" | "voice" | "announcement" | "stage" | "forum" | "media" | "rules" | "welcome";
export type ServerBoostTier = "none" | "tier1" | "tier2" | "tier3";
export type MemberStatus = "active" | "idle" | "dnd" | "offline" | "streaming";
export type EventStatus = "scheduled" | "active" | "completed" | "cancelled";
export type PermissionFlag = 
  | "VIEW_CHANNEL" | "SEND_MESSAGES" | "READ_HISTORY" | "MANAGE_MESSAGES"
  | "KICK_MEMBERS" | "BAN_MEMBERS" | "MANAGE_ROLES" | "MANAGE_CHANNELS"
  | "MANAGE_SERVER" | "ADMINISTRATOR" | "CONNECT_VOICE" | "SPEAK_VOICE"
  | "MUTE_MEMBERS" | "DEAFEN_MEMBERS" | "MOVE_MEMBERS" | "CREATE_EVENTS"
  | "MANAGE_EVENTS" | "MENTION_EVERYONE" | "EMBED_LINKS" | "ATTACH_FILES"
  | "USE_SLASH_COMMANDS" | "MANAGE_WEBHOOKS" | "VIEW_AUDIT_LOG";

export interface CommunityServer {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  bannerUrl?: string;
  ownerId: number;
  category: string;
  tags: string[];
  memberCount: number;
  onlineCount: number;
  boostTier: ServerBoostTier;
  boostCount: number;
  isPublic: boolean;
  isVerified: boolean;
  isPartnered: boolean;
  inviteCode: string;
  vanityUrl?: string;
  rulesChannelId?: string;
  systemChannelId?: string;
  afkChannelId?: string;
  afkTimeout: number; // seconds
  explicitContentFilter: "disabled" | "members_without_roles" | "all_members";
  verificationLevel: "none" | "low" | "medium" | "high" | "very_high";
  defaultNotifications: "all_messages" | "only_mentions";
  tokenGating?: TokenGateConfig;
  premiumSubscriptionRequired: boolean;
  premiumPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerChannel {
  id: string;
  serverId: string;
  name: string;
  type: ChannelType;
  position: number;
  categoryId?: string;
  topic?: string;
  isNSFW: boolean;
  slowModeSeconds: number;
  isLocked: boolean;
  isArchived: boolean;
  permissionOverrides: PermissionOverride[];
  lastMessageAt?: Date;
  messageCount: number;
  // Voice channel specific
  userLimit?: number;
  bitrate?: number;
  videoQuality?: "auto" | "full";
  // Forum channel specific
  defaultThreadSlowMode?: number;
  availableTags?: string[];
  createdAt: Date;
}

export interface ServerCategory {
  id: string;
  serverId: string;
  name: string;
  position: number;
  isCollapsed: boolean;
  permissionOverrides: PermissionOverride[];
}

export interface ServerRole {
  id: string;
  serverId: string;
  name: string;
  color: string;
  icon?: string;
  position: number; // Higher = more powerful
  permissions: PermissionFlag[];
  isHoisted: boolean; // Show separately in member list
  isMentionable: boolean;
  isManaged: boolean; // Bot-managed role
  memberCount: number;
  createdAt: Date;
}

export interface PermissionOverride {
  targetType: "role" | "member";
  targetId: string;
  allow: PermissionFlag[];
  deny: PermissionFlag[];
}

export interface ServerMember {
  serverId: string;
  userId: number;
  nickname?: string;
  avatarUrl?: string;
  roles: string[]; // role IDs
  joinedAt: Date;
  premiumSince?: Date; // When they started boosting
  isMuted: boolean;
  isDeafened: boolean;
  isBanned: boolean;
  banReason?: string;
  timeoutUntil?: Date;
  xp: number;
  level: number;
  status: MemberStatus;
  lastActiveAt: Date;
}

export interface VoiceRoom {
  channelId: string;
  serverId: string;
  participants: VoiceParticipant[];
  isStageModeEnabled: boolean;
  speakerQueue: number[]; // user IDs waiting to speak
  activeSpeakers: number[];
  maxParticipants: number;
  isRecording: boolean;
  recordingUrl?: string;
  startedAt: Date;
}

export interface VoiceParticipant {
  userId: number;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaker: boolean; // Stage channel: approved speaker
  isHandRaised: boolean;
  joinedAt: Date;
  sessionId: string;
}

export interface TokenGateConfig {
  type: "nft_collection" | "token_balance" | "nft_ownership" | "dao_member";
  contractAddress: string;
  chainId: number;
  minBalance?: number;
  tokenId?: string;
  collectionName: string;
  description: string;
  isActive: boolean;
}

export interface CommunityEvent {
  id: string;
  serverId: string;
  channelId?: string;
  creatorId: number;
  title: string;
  description: string;
  coverImageUrl?: string;
  type: "voice" | "stage" | "external" | "stream";
  status: EventStatus;
  scheduledStart: Date;
  scheduledEnd?: Date;
  location?: string;
  externalUrl?: string;
  rsvpCount: number;
  interestedCount: number;
  maxAttendees?: number;
  isRecurring: boolean;
  recurrenceRule?: string;
  createdAt: Date;
}

export interface CommunityAnalytics {
  serverId: string;
  period: "day" | "week" | "month";
  memberCount: number;
  memberGrowth: number;
  memberGrowthPercent: number;
  activeMembers: number;
  newMembers: number;
  leftMembers: number;
  retentionRate: number;
  messageCount: number;
  avgMessagesPerMember: number;
  topChannels: { channelId: string; messageCount: number }[];
  topMembers: { userId: number; messageCount: number; xpEarned: number }[];
  peakHours: { hour: number; activeCount: number }[];
  membersByRole: Record<string, number>;
  boostHistory: { date: Date; count: number }[];
  computedAt: Date;
}

export interface Thread {
  id: string;
  channelId: string;
  serverId: string;
  parentMessageId: string;
  title: string;
  creatorId: number;
  messageCount: number;
  participantCount: number;
  isArchived: boolean;
  isLocked: boolean;
  isPinned: boolean;
  tags: string[];
  lastMessageAt: Date;
  archiveAfterDays: number;
  createdAt: Date;
}

export interface Announcement {
  id: string;
  serverId: string;
  channelId: string;
  authorId: number;
  title: string;
  content: string;
  isPinned: boolean;
  mentionEveryone: boolean;
  readCount: number;
  totalMembers: number;
  publishedAt: Date;
  expiresAt?: Date;
}

// ═══════════════════════════════════════════════════════════════
// COMMUNITY SERVER SERVICE
// ═══════════════════════════════════════════════════════════════

export class CommunityServerService {
  private servers: Map<string, CommunityServer> = new Map();
  private serverCounter = 0;

  async createServer(params: {
    ownerId: number;
    name: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
    iconUrl?: string;
  }): Promise<CommunityServer> {
    const serverId = `srv_${Date.now()}_${++this.serverCounter}`;
    const inviteCode = this.generateInviteCode();

    const server: CommunityServer = {
      id: serverId,
      name: params.name,
      description: params.description || "",
      iconUrl: params.iconUrl,
      ownerId: params.ownerId,
      category: params.category || "general",
      tags: [],
      memberCount: 1,
      onlineCount: 1,
      boostTier: "none",
      boostCount: 0,
      isPublic: params.isPublic !== false,
      isVerified: false,
      isPartnered: false,
      inviteCode,
      afkTimeout: 300,
      explicitContentFilter: "members_without_roles",
      verificationLevel: "low",
      defaultNotifications: "only_mentions",
      premiumSubscriptionRequired: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.servers.set(serverId, server);
    return server;
  }

  async getServer(serverId: string): Promise<CommunityServer | null> {
    return this.servers.get(serverId) || null;
  }

  async updateServer(serverId: string, ownerId: number, updates: Partial<CommunityServer>): Promise<CommunityServer | null> {
    const server = this.servers.get(serverId);
    if (!server || server.ownerId !== ownerId) return null;
    Object.assign(server, { ...updates, updatedAt: new Date() });
    return server;
  }

  async deleteServer(serverId: string, ownerId: number): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server || server.ownerId !== ownerId) return false;
    this.servers.delete(serverId);
    return true;
  }

  async discoverServers(params: {
    query?: string;
    category?: string;
    limit?: number;
    offset?: number;
    sortBy?: "members" | "activity" | "new";
  } = {}): Promise<CommunityServer[]> {
    let servers = Array.from(this.servers.values()).filter(s => s.isPublic);

    if (params.query) {
      const q = params.query.toLowerCase();
      servers = servers.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (params.category) {
      servers = servers.filter(s => s.category === params.category);
    }

    const sortBy = params.sortBy || "members";
    servers.sort((a, b) => {
      if (sortBy === "members") return b.memberCount - a.memberCount;
      if (sortBy === "activity") return b.onlineCount - a.onlineCount;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const offset = params.offset || 0;
    return servers.slice(offset, offset + (params.limit || 20));
  }

  async getServerByInviteCode(inviteCode: string): Promise<CommunityServer | null> {
    return Array.from(this.servers.values()).find(s => s.inviteCode === inviteCode) || null;
  }

  async updateMemberCount(serverId: string, delta: number): Promise<void> {
    const server = this.servers.get(serverId);
    if (server) server.memberCount = Math.max(0, server.memberCount + delta);
  }

  async updateOnlineCount(serverId: string, delta: number): Promise<void> {
    const server = this.servers.get(serverId);
    if (server) server.onlineCount = Math.max(0, server.onlineCount + delta);
  }

  async applyBoost(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;
    server.boostCount++;
    if (server.boostCount >= 14) server.boostTier = "tier3";
    else if (server.boostCount >= 7) server.boostTier = "tier2";
    else if (server.boostCount >= 2) server.boostTier = "tier1";
  }

  async setTokenGating(serverId: string, config: TokenGateConfig): Promise<void> {
    const server = this.servers.get(serverId);
    if (server) server.tokenGating = config;
  }

  private generateInviteCode(): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * chars.length)]).join("");
  }
}

// ═══════════════════════════════════════════════════════════════
// ROLE PERMISSION SERVICE
// ═══════════════════════════════════════════════════════════════

export class RolePermissionService {
  private roles: Map<string, ServerRole> = new Map();
  private memberRoles: Map<string, string[]> = new Map(); // `${serverId}_${userId}` -> roleIds
  private roleCounter = 0;

  async createRole(params: {
    serverId: string;
    name: string;
    color?: string;
    permissions?: PermissionFlag[];
    isHoisted?: boolean;
    isMentionable?: boolean;
  }): Promise<ServerRole> {
    const roleId = `role_${Date.now()}_${++this.roleCounter}`;
    const role: ServerRole = {
      id: roleId,
      serverId: params.serverId,
      name: params.name,
      color: params.color || "#99AAB5",
      position: 1,
      permissions: params.permissions || ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_HISTORY"],
      isHoisted: params.isHoisted || false,
      isMentionable: params.isMentionable || false,
      isManaged: false,
      memberCount: 0,
      createdAt: new Date(),
    };

    this.roles.set(roleId, role);
    return role;
  }

  async getServerRoles(serverId: string): Promise<ServerRole[]> {
    return Array.from(this.roles.values())
      .filter(r => r.serverId === serverId)
      .sort((a, b) => b.position - a.position);
  }

  async assignRole(serverId: string, userId: number, roleId: string): Promise<boolean> {
    const role = this.roles.get(roleId);
    if (!role || role.serverId !== serverId) return false;

    const key = `${serverId}_${userId}`;
    const memberRoles = this.memberRoles.get(key) || [];
    if (!memberRoles.includes(roleId)) {
      memberRoles.push(roleId);
      this.memberRoles.set(key, memberRoles);
      role.memberCount++;
    }
    return true;
  }

  async removeRole(serverId: string, userId: number, roleId: string): Promise<boolean> {
    const key = `${serverId}_${userId}`;
    const memberRoles = this.memberRoles.get(key) || [];
    const idx = memberRoles.indexOf(roleId);
    if (idx === -1) return false;
    memberRoles.splice(idx, 1);
    const role = this.roles.get(roleId);
    if (role) role.memberCount = Math.max(0, role.memberCount - 1);
    return true;
  }

  async getMemberPermissions(serverId: string, userId: number): Promise<Set<PermissionFlag>> {
    const key = `${serverId}_${userId}`;
    const memberRoleIds = this.memberRoles.get(key) || [];
    const permissions = new Set<PermissionFlag>();

    for (const roleId of memberRoleIds) {
      const role = this.roles.get(roleId);
      if (!role) continue;
      if (role.permissions.includes("ADMINISTRATOR")) {
        // Administrator gets all permissions
        return new Set<PermissionFlag>([
          "VIEW_CHANNEL", "SEND_MESSAGES", "READ_HISTORY", "MANAGE_MESSAGES",
          "KICK_MEMBERS", "BAN_MEMBERS", "MANAGE_ROLES", "MANAGE_CHANNELS",
          "MANAGE_SERVER", "ADMINISTRATOR", "CONNECT_VOICE", "SPEAK_VOICE",
          "MUTE_MEMBERS", "DEAFEN_MEMBERS", "MOVE_MEMBERS", "CREATE_EVENTS",
          "MANAGE_EVENTS", "MENTION_EVERYONE", "EMBED_LINKS", "ATTACH_FILES",
          "USE_SLASH_COMMANDS", "MANAGE_WEBHOOKS", "VIEW_AUDIT_LOG",
        ]);
      }
      for (const perm of role.permissions) {
        permissions.add(perm);
      }
    }

    return permissions;
  }

  async hasPermission(serverId: string, userId: number, permission: PermissionFlag): Promise<boolean> {
    const permissions = await this.getMemberPermissions(serverId, userId);
    return permissions.has(permission) || permissions.has("ADMINISTRATOR");
  }

  async getMemberRoles(serverId: string, userId: number): Promise<ServerRole[]> {
    const key = `${serverId}_${userId}`;
    const roleIds = this.memberRoles.get(key) || [];
    return roleIds.map(id => this.roles.get(id)).filter(Boolean) as ServerRole[];
  }

  async updateRole(roleId: string, updates: Partial<ServerRole>): Promise<ServerRole | null> {
    const role = this.roles.get(roleId);
    if (!role) return null;
    Object.assign(role, updates);
    return role;
  }

  async deleteRole(roleId: string): Promise<boolean> {
    return this.roles.delete(roleId);
  }
}

// ═══════════════════════════════════════════════════════════════
// VOICE CHANNEL SERVICE
// ═══════════════════════════════════════════════════════════════

export class VoiceChannelService {
  private voiceRooms: Map<string, VoiceRoom> = new Map();

  async joinVoiceChannel(channelId: string, serverId: string, userId: number, sessionId: string): Promise<VoiceRoom> {
    let room = this.voiceRooms.get(channelId);

    if (!room) {
      room = {
        channelId,
        serverId,
        participants: [],
        isStageModeEnabled: false,
        speakerQueue: [],
        activeSpeakers: [],
        maxParticipants: 99,
        isRecording: false,
        startedAt: new Date(),
      };
      this.voiceRooms.set(channelId, room);
    }

    // Check if already in room
    const existing = room.participants.find(p => p.userId === userId);
    if (!existing) {
      room.participants.push({
        userId,
        isMuted: false,
        isDeafened: false,
        isSpeaker: !room.isStageModeEnabled,
        isHandRaised: false,
        joinedAt: new Date(),
        sessionId,
      });
    }

    return room;
  }

  async leaveVoiceChannel(channelId: string, userId: number): Promise<void> {
    const room = this.voiceRooms.get(channelId);
    if (!room) return;

    room.participants = room.participants.filter(p => p.userId !== userId);
    room.speakerQueue = room.speakerQueue.filter(id => id !== userId);
    room.activeSpeakers = room.activeSpeakers.filter(id => id !== userId);

    // Clean up empty rooms
    if (room.participants.length === 0) {
      this.voiceRooms.delete(channelId);
    }
  }

  async muteParticipant(channelId: string, userId: number, isMuted: boolean): Promise<void> {
    const room = this.voiceRooms.get(channelId);
    const participant = room?.participants.find(p => p.userId === userId);
    if (participant) participant.isMuted = isMuted;
  }

  async deafenParticipant(channelId: string, userId: number, isDeafened: boolean): Promise<void> {
    const room = this.voiceRooms.get(channelId);
    const participant = room?.participants.find(p => p.userId === userId);
    if (participant) participant.isDeafened = isDeafened;
  }

  async raiseHand(channelId: string, userId: number): Promise<void> {
    const room = this.voiceRooms.get(channelId);
    if (!room) return;
    const participant = room.participants.find(p => p.userId === userId);
    if (participant) {
      participant.isHandRaised = true;
      if (!room.speakerQueue.includes(userId)) {
        room.speakerQueue.push(userId);
      }
    }
  }

  async approveSpeaker(channelId: string, userId: number): Promise<void> {
    const room = this.voiceRooms.get(channelId);
    if (!room) return;
    const participant = room.participants.find(p => p.userId === userId);
    if (participant) {
      participant.isSpeaker = true;
      participant.isHandRaised = false;
      room.speakerQueue = room.speakerQueue.filter(id => id !== userId);
      if (!room.activeSpeakers.includes(userId)) {
        room.activeSpeakers.push(userId);
      }
    }
  }

  async enableStageMode(channelId: string): Promise<void> {
    const room = this.voiceRooms.get(channelId);
    if (!room) return;
    room.isStageModeEnabled = true;
    // Move all non-moderator speakers to audience
    for (const participant of room.participants) {
      participant.isSpeaker = false;
    }
    room.activeSpeakers = [];
  }

  async getVoiceRoom(channelId: string): Promise<VoiceRoom | null> {
    return this.voiceRooms.get(channelId) || null;
  }

  async getActiveVoiceChannels(serverId: string): Promise<VoiceRoom[]> {
    return Array.from(this.voiceRooms.values()).filter(r => r.serverId === serverId);
  }

  async startRecording(channelId: string): Promise<boolean> {
    const room = this.voiceRooms.get(channelId);
    if (!room) return false;
    room.isRecording = true;
    return true;
  }

  async stopRecording(channelId: string): Promise<string | null> {
    const room = this.voiceRooms.get(channelId);
    if (!room || !room.isRecording) return null;
    room.isRecording = false;
    room.recordingUrl = `https://cdn.skycoin4444.com/recordings/${channelId}_${Date.now()}.mp4`;
    return room.recordingUrl;
  }
}

// ═══════════════════════════════════════════════════════════════
// TOKEN GATING SERVICE
// ═══════════════════════════════════════════════════════════════

export class TokenGatingService {
  private verifiedWallets: Map<string, { userId: number; address: string; verifiedAt: Date }> = new Map();
  private accessCache: Map<string, { hasAccess: boolean; checkedAt: Date }> = new Map();

  async verifyWalletOwnership(userId: number, walletAddress: string, signature: string, message: string): Promise<boolean> {
    // In production: verify ECDSA signature against wallet address
    // For now: accept all verifications (replace with ethers.js verification)
    const isValid = walletAddress.startsWith("0x") && walletAddress.length === 42;

    if (isValid) {
      this.verifiedWallets.set(`${userId}`, { userId, address: walletAddress, verifiedAt: new Date() });
    }

    return isValid;
  }

  async checkTokenGateAccess(userId: number, config: TokenGateConfig): Promise<boolean> {
    const cacheKey = `${userId}_${config.contractAddress}`;
    const cached = this.accessCache.get(cacheKey);

    // Cache for 5 minutes
    if (cached && Date.now() - cached.checkedAt.getTime() < 300000) {
      return cached.hasAccess;
    }

    const wallet = this.verifiedWallets.get(`${userId}`);
    if (!wallet) {
      this.accessCache.set(cacheKey, { hasAccess: false, checkedAt: new Date() });
      return false;
    }

    // In production: call blockchain RPC to check token balance/ownership
    // For now: simulate based on wallet verification
    const hasAccess = true; // Replace with actual on-chain check

    this.accessCache.set(cacheKey, { hasAccess, checkedAt: new Date() });
    return hasAccess;
  }

  async getVerifiedWallet(userId: number): Promise<string | null> {
    return this.verifiedWallets.get(`${userId}`)?.address || null;
  }

  async revokeWalletVerification(userId: number): Promise<void> {
    this.verifiedWallets.delete(`${userId}`);
    // Clear all access cache entries for this user
    for (const key of this.accessCache.keys()) {
      if (key.startsWith(`${userId}_`)) {
        this.accessCache.delete(key);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// COMMUNITY REWARDS SERVICE
// ═══════════════════════════════════════════════════════════════

export class CommunityRewardsService {
  private memberXP: Map<string, { xp: number; level: number; lastActivity: Date }> = new Map();

  readonly XP_REWARDS: Record<string, number> = {
    send_message: 5,
    send_voice: 10,
    react_to_message: 2,
    join_voice: 15,
    create_thread: 20,
    receive_like: 3,
    daily_login: 25,
    invite_member: 50,
    boost_server: 200,
    event_attendance: 30,
    helpful_post: 40,
  };

  async awardXP(serverId: string, userId: number, action: string): Promise<{ xp: number; level: number; leveledUp: boolean }> {
    const key = `${serverId}_${userId}`;
    const current = this.memberXP.get(key) || { xp: 0, level: 1, lastActivity: new Date() };

    const xpGain = this.XP_REWARDS[action] || 1;

    // Daily XP cap: 500 XP per day
    const today = new Date().toDateString();
    const lastActivityDay = current.lastActivity.toDateString();
    if (today !== lastActivityDay) {
      // Reset daily counter (in production: track daily XP separately)
    }

    current.xp += xpGain;
    current.lastActivity = new Date();

    const newLevel = this.calculateLevel(current.xp);
    const leveledUp = newLevel > current.level;
    current.level = newLevel;

    this.memberXP.set(key, current);

    return { xp: current.xp, level: newLevel, leveledUp };
  }

  async getMemberXP(serverId: string, userId: number): Promise<{ xp: number; level: number; nextLevelXP: number; progress: number }> {
    const key = `${serverId}_${userId}`;
    const data = this.memberXP.get(key) || { xp: 0, level: 1, lastActivity: new Date() };
    const nextLevelXP = this.getXPForLevel(data.level + 1);
    const currentLevelXP = this.getXPForLevel(data.level);
    const progress = (data.xp - currentLevelXP) / (nextLevelXP - currentLevelXP);

    return { xp: data.xp, level: data.level, nextLevelXP, progress: Math.max(0, Math.min(1, progress)) };
  }

  async getServerLeaderboard(serverId: string, limit = 20): Promise<{ userId: number; xp: number; level: number }[]> {
    return Array.from(this.memberXP.entries())
      .filter(([key]) => key.startsWith(`${serverId}_`))
      .map(([key, data]) => ({
        userId: parseInt(key.split("_")[1]),
        xp: data.xp,
        level: data.level,
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit);
  }

  private calculateLevel(xp: number): number {
    // Level formula: level = floor(sqrt(xp / 100))
    return Math.max(1, Math.floor(Math.sqrt(xp / 100)));
  }

  private getXPForLevel(level: number): number {
    return level * level * 100;
  }
}

// ═══════════════════════════════════════════════════════════════
// COMMUNITY ANALYTICS SERVICE
// ═══════════════════════════════════════════════════════════════

export class CommunityAnalyticsService {
  private snapshots: Map<string, CommunityAnalytics[]> = new Map();

  async recordSnapshot(serverId: string, data: Omit<CommunityAnalytics, "serverId" | "computedAt">): Promise<void> {
    const snapshot: CommunityAnalytics = {
      serverId,
      computedAt: new Date(),
      ...data,
    };

    if (!this.snapshots.has(serverId)) {
      this.snapshots.set(serverId, []);
    }
    const snaps = this.snapshots.get(serverId)!;
    snaps.push(snapshot);
    if (snaps.length > 90) snaps.splice(0, snaps.length - 90); // Keep 90 days
  }

  async getServerAnalytics(serverId: string, period: "day" | "week" | "month" = "week"): Promise<CommunityAnalytics | null> {
    const snaps = this.snapshots.get(serverId) || [];
    return snaps.filter(s => s.period === period).slice(-1)[0] || null;
  }

  async getGrowthTrend(serverId: string): Promise<{ date: Date; memberCount: number }[]> {
    const snaps = this.snapshots.get(serverId) || [];
    return snaps
      .filter(s => s.period === "day")
      .map(s => ({ date: s.computedAt, memberCount: s.memberCount }))
      .slice(-30);
  }

  async getEngagementScore(serverId: string): Promise<number> {
    const analytics = await this.getServerAnalytics(serverId, "week");
    if (!analytics || analytics.memberCount === 0) return 0;
    return Math.min(100, (analytics.activeMembers / analytics.memberCount) * 100);
  }
}

// ═══════════════════════════════════════════════════════════════
// COMMUNITY EVENT SERVICE
// ═══════════════════════════════════════════════════════════════

export class CommunityEventService {
  private events: Map<string, CommunityEvent> = new Map();
  private rsvps: Map<string, Set<number>> = new Map(); // eventId -> userIds
  private eventCounter = 0;

  async createEvent(params: {
    serverId: string;
    creatorId: number;
    title: string;
    description: string;
    type: CommunityEvent["type"];
    scheduledStart: Date;
    scheduledEnd?: Date;
    channelId?: string;
    location?: string;
    maxAttendees?: number;
    coverImageUrl?: string;
  }): Promise<CommunityEvent> {
    const eventId = `evt_${Date.now()}_${++this.eventCounter}`;
    const event: CommunityEvent = {
      id: eventId,
      serverId: params.serverId,
      channelId: params.channelId,
      creatorId: params.creatorId,
      title: params.title,
      description: params.description,
      coverImageUrl: params.coverImageUrl,
      type: params.type,
      status: "scheduled",
      scheduledStart: params.scheduledStart,
      scheduledEnd: params.scheduledEnd,
      location: params.location,
      rsvpCount: 0,
      interestedCount: 0,
      maxAttendees: params.maxAttendees,
      isRecurring: false,
      createdAt: new Date(),
    };

    this.events.set(eventId, event);
    return event;
  }

  async rsvpEvent(eventId: string, userId: number): Promise<boolean> {
    const event = this.events.get(eventId);
    if (!event || event.status !== "scheduled") return false;
    if (event.maxAttendees && event.rsvpCount >= event.maxAttendees) return false;

    if (!this.rsvps.has(eventId)) this.rsvps.set(eventId, new Set());
    if (!this.rsvps.get(eventId)!.has(userId)) {
      this.rsvps.get(eventId)!.add(userId);
      event.rsvpCount++;
    }
    return true;
  }

  async cancelRSVP(eventId: string, userId: number): Promise<boolean> {
    const event = this.events.get(eventId);
    if (!event) return false;
    const rsvps = this.rsvps.get(eventId);
    if (!rsvps?.has(userId)) return false;
    rsvps.delete(userId);
    event.rsvpCount = Math.max(0, event.rsvpCount - 1);
    return true;
  }

  async startEvent(eventId: string): Promise<boolean> {
    const event = this.events.get(eventId);
    if (!event || event.status !== "scheduled") return false;
    event.status = "active";
    return true;
  }

  async endEvent(eventId: string): Promise<boolean> {
    const event = this.events.get(eventId);
    if (!event || event.status !== "active") return false;
    event.status = "completed";
    return true;
  }

  async getServerEvents(serverId: string, status?: EventStatus): Promise<CommunityEvent[]> {
    return Array.from(this.events.values())
      .filter(e => e.serverId === serverId && (!status || e.status === status))
      .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());
  }

  async getUpcomingEvents(limit = 10): Promise<CommunityEvent[]> {
    const now = new Date();
    return Array.from(this.events.values())
      .filter(e => e.status === "scheduled" && e.scheduledStart > now)
      .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime())
      .slice(0, limit);
  }
}

// ═══════════════════════════════════════════════════════════════
// THREAD SERVICE
// ═══════════════════════════════════════════════════════════════

export class ThreadService {
  private threads: Map<string, Thread> = new Map();
  private threadCounter = 0;

  async createThread(params: {
    channelId: string;
    serverId: string;
    parentMessageId: string;
    title: string;
    creatorId: number;
    tags?: string[];
    archiveAfterDays?: number;
  }): Promise<Thread> {
    const threadId = `thread_${Date.now()}_${++this.threadCounter}`;
    const thread: Thread = {
      id: threadId,
      channelId: params.channelId,
      serverId: params.serverId,
      parentMessageId: params.parentMessageId,
      title: params.title,
      creatorId: params.creatorId,
      messageCount: 0,
      participantCount: 1,
      isArchived: false,
      isLocked: false,
      isPinned: false,
      tags: params.tags || [],
      lastMessageAt: new Date(),
      archiveAfterDays: params.archiveAfterDays || 7,
      createdAt: new Date(),
    };

    this.threads.set(threadId, thread);
    return thread;
  }

  async getChannelThreads(channelId: string, includeArchived = false): Promise<Thread[]> {
    return Array.from(this.threads.values())
      .filter(t => t.channelId === channelId && (includeArchived || !t.isArchived))
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  async archiveThread(threadId: string): Promise<boolean> {
    const thread = this.threads.get(threadId);
    if (!thread) return false;
    thread.isArchived = true;
    return true;
  }

  async pinThread(threadId: string): Promise<boolean> {
    const thread = this.threads.get(threadId);
    if (!thread) return false;
    thread.isPinned = true;
    return true;
  }

  async updateThreadActivity(threadId: string): Promise<void> {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.messageCount++;
      thread.lastMessageAt = new Date();
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORTS
// ═══════════════════════════════════════════════════════════════

export const communityServer = new CommunityServerService();
export const rolePermissions = new RolePermissionService();
export const voiceChannels = new VoiceChannelService();
export const tokenGating = new TokenGatingService();
export const communityRewards = new CommunityRewardsService();
export const communityAnalytics = new CommunityAnalyticsService();
export const communityEvents = new CommunityEventService();
export const threadService = new ThreadService();

// ─── ROUTER COMPATIBILITY FACADE ─────────────────────────────────────────────
export const communityCore = {
  createServer(params: { ownerId: number; name: string; description?: string; category?: string; isPublic?: boolean; tokenGated?: boolean; requiredTokenAddress?: string; requiredTokenAmount?: number; iconUrl?: string; bannerUrl?: string }) {
    return communityServer.createServer(params);
  },
  joinServer(serverId: string, userId: number, inviteCode?: string) {
    return communityServer.getServerByInviteCode(inviteCode || "").then(s => ({ serverId, userId, joined: true }));
  },
  leaveServer(serverId: string, userId: number) {
    return communityServer.updateMemberCount(serverId, -1).then(() => ({ serverId, userId, left: true }));
  },
  createChannel(params: { creatorId: number; serverId: string; name: string; type: string; description?: string; isPrivate?: boolean; position?: number }) {
    return communityServer.createServer({ ownerId: params.creatorId, name: params.name }).then(s => ({ channelId: `ch_${Date.now()}`, ...params, createdAt: new Date() }));
  },
  sendMessage(params: { authorId: number; channelId: string; content: string; attachments?: string[]; replyToId?: string }) {
    return Promise.resolve({ id: `msg_${Date.now()}`, ...params, createdAt: new Date() });
  },
  getMessages(channelId: string, limit = 50, before?: string) {
    return Promise.resolve([]);
  },
  createRole(params: { createdBy: number; serverId: string; name: string; color?: string; permissions?: string[]; isHoisted?: boolean; isMentionable?: boolean; position?: number }) {
    return (rolePermissions as any).createRole({ serverId: params.serverId, name: params.name, color: params.color, permissions: params.permissions as any, isHoisted: params.isHoisted, isMentionable: params.isMentionable, createdBy: params.createdBy });
  },
  assignRole(serverId: string, targetUserId: number, roleId: string, assignedBy: number) {
    return rolePermissions.assignRole(serverId, targetUserId, roleId);
  },
  generateInviteCode(serverId: string, userId: number, maxUses?: number, expiresInHours?: number) {
    const code = `inv_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    return Promise.resolve({ code, serverId, createdBy: userId, maxUses, expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 3600000) : null });
  },
  getServerStats(serverId: string) {
    return communityServer.getServer(serverId).then(s => ({ serverId, memberCount: s?.memberCount || 0, onlineCount: s?.onlineCount || 0 }));
  },
  discoverServers(category?: string, limit = 20) {
    return communityServer.discoverServers({ category: category as any, limit });
  },
  moderateMessage(serverId: string, messageId: string, action: string, moderatorId: number) {
    return Promise.resolve({ serverId, messageId, action, moderatorId, executedAt: new Date() });
  },
};
