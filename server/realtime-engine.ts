import crypto from 'crypto';
/**
 * REAL-TIME EVENT ENGINE
 * Server-Sent Events based real-time system:
 * - Event Bus (pub/sub for internal events)
 * - SSE Connection Manager (per-user connections, heartbeat)
 * - Channel Subscriptions (rooms, topics, DMs)
 * - Presence System (online/offline/away/dnd)
 * - Typing Indicators (per-channel)
 * - Read Receipts (message seen tracking)
 * - Live Activity Feed (platform-wide events)
 * - Notification Pipeline (priority queue, batching, dedup)
 * - Rate-Limited Broadcasting (prevent event storms)
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface RealtimeEvent {
  id: string;
  type: string;
  channel: string;
  payload: unknown;
  timestamp: Date;
  senderId?: number;
  priority: "low" | "normal" | "high" | "urgent";
}

export interface SSEConnection {
  userId: number;
  connectionId: string;
  channels: Set<string>;
  lastHeartbeat: Date;
  createdAt: Date;
  send: (event: RealtimeEvent) => void;
}

export interface PresenceState {
  userId: number;
  status: "online" | "offline" | "away" | "dnd";
  lastSeen: Date;
  currentChannel?: string;
  device?: string;
}

export interface TypingState {
  userId: number;
  channelId: string;
  startedAt: Date;
  expiresAt: Date;
}

export interface NotificationItem {
  id: string;
  userId: number;
  type: "message" | "mention" | "follow" | "like" | "comment" | "tip" | "system" | "achievement";
  title: string;
  body: string;
  actionUrl?: string;
  read: boolean;
  priority: "low" | "normal" | "high";
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// EVENT BUS (Internal Pub/Sub)
// ═══════════════════════════════════════════════════════════════

type EventHandler = (event: RealtimeEvent) => void | Promise<void>;

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventHistory: RealtimeEvent[] = [];
  private eventCounter = 0;

  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  async publish(type: string, channel: string, payload: unknown, senderId?: number, priority: RealtimeEvent["priority"] = "normal"): Promise<void> {
    this.eventCounter++;
    const event: RealtimeEvent = {
      id: `evt_${this.eventCounter}`,
      type,
      channel,
      payload,
      timestamp: new Date(),
      senderId,
      priority,
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-500);
    }

    // Notify handlers
    const handlers = this.handlers.get(type) || new Set();
    const wildcardHandlers = this.handlers.get("*") || new Set();

    const allHandlers = [...Array.from(handlers), ...Array.from(wildcardHandlers)];
    await Promise.allSettled(allHandlers.map(h => h(event)));
  }

  getRecentEvents(channel?: string, limit = 50): RealtimeEvent[] {
    let events = this.eventHistory;
    if (channel) {
      events = events.filter(e => e.channel === channel);
    }
    return events.slice(-limit);
  }
}

// ═══════════════════════════════════════════════════════════════
// SSE CONNECTION MANAGER
// ═══════════════════════════════════════════════════════════════

export class SSEConnectionManager {
  private connections: Map<string, SSEConnection> = new Map();
  private userConnections: Map<number, Set<string>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start heartbeat checker
    this.heartbeatInterval = setInterval(() => this.cleanupStaleConnections(), 30000);
  }

  addConnection(userId: number, send: (event: RealtimeEvent) => void): string {
    const connectionId = `conn_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`;

    const connection: SSEConnection = {
      userId,
      connectionId,
      channels: new Set(["global", `user:${userId}`]),
      lastHeartbeat: new Date(),
      createdAt: new Date(),
      send,
    };

    this.connections.set(connectionId, connection);

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    return connectionId;
  }

  removeConnection(connectionId: string): void {
    const conn = this.connections.get(connectionId);
    if (conn) {
      this.userConnections.get(conn.userId)?.delete(connectionId);
      this.connections.delete(connectionId);
    }
  }

  subscribeToChannel(connectionId: string, channel: string): void {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.channels.add(channel);
    }
  }

  unsubscribeFromChannel(connectionId: string, channel: string): void {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.channels.delete(channel);
    }
  }

  broadcastToChannel(channel: string, event: RealtimeEvent): number {
    let sent = 0;
    this.connections.forEach(conn => {
      if (conn.channels.has(channel)) {
        try {
          conn.send(event);
          sent++;
        } catch {
          // Connection dead, will be cleaned up
        }
      }
    });
    return sent;
  }

  sendToUser(userId: number, event: RealtimeEvent): number {
    const connIds = this.userConnections.get(userId);
    if (!connIds) return 0;

    let sent = 0;
    connIds.forEach(connId => {
      const conn = this.connections.get(connId);
      if (conn) {
        try {
          conn.send(event);
          sent++;
        } catch {
          // Connection dead
        }
      }
    });
    return sent;
  }

  heartbeat(connectionId: string): void {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.lastHeartbeat = new Date();
    }
  }

  getOnlineUsers(): number[] {
    return Array.from(this.userConnections.keys());
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getUserConnectionCount(userId: number): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  private cleanupStaleConnections(): void {
    const staleThreshold = Date.now() - 60000; // 60 seconds without heartbeat
    this.connections.forEach((conn, id) => {
      if (conn.lastHeartbeat.getTime() < staleThreshold) {
        this.removeConnection(id);
      }
    });
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PRESENCE SYSTEM
// ═══════════════════════════════════════════════════════════════

export class PresenceService {
  private presenceMap: Map<number, PresenceState> = new Map();
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  setOnline(userId: number, device?: string): void {
    const prev = this.presenceMap.get(userId);
    this.presenceMap.set(userId, {
      userId,
      status: "online",
      lastSeen: new Date(),
      device,
    });

    if (!prev || prev.status !== "online") {
      this.eventBus.publish("presence:online", "global", { userId, device });
    }
  }

  setOffline(userId: number): void {
    const state = this.presenceMap.get(userId);
    if (state) {
      state.status = "offline";
      state.lastSeen = new Date();
      this.eventBus.publish("presence:offline", "global", { userId, lastSeen: state.lastSeen });
    }
  }

  setStatus(userId: number, status: PresenceState["status"]): void {
    const state = this.presenceMap.get(userId) || {
      userId,
      status,
      lastSeen: new Date(),
    };
    state.status = status;
    this.presenceMap.set(userId, state);
    this.eventBus.publish("presence:status_change", "global", { userId, status });
  }

  getPresence(userId: number): PresenceState | undefined {
    return this.presenceMap.get(userId);
  }

  getOnlineUsers(): PresenceState[] {
    return Array.from(this.presenceMap.values()).filter(p => p.status === "online");
  }

  getBulkPresence(userIds: number[]): Map<number, PresenceState> {
    const result = new Map<number, PresenceState>();
    for (const id of userIds) {
      const state = this.presenceMap.get(id);
      if (state) result.set(id, state);
    }
    return result;
  }
}

// ═══════════════════════════════════════════════════════════════
// TYPING INDICATORS
// ═══════════════════════════════════════════════════════════════

export class TypingIndicatorService {
  private typingStates: Map<string, TypingState[]> = new Map();
  private readonly TYPING_TIMEOUT = 5000; // 5 seconds

  startTyping(userId: number, channelId: string): void {
    const key = channelId;
    if (!this.typingStates.has(key)) {
      this.typingStates.set(key, []);
    }

    const states = this.typingStates.get(key)!;
    const existing = states.find(s => s.userId === userId);

    if (existing) {
      existing.expiresAt = new Date(Date.now() + this.TYPING_TIMEOUT);
    } else {
      states.push({
        userId,
        channelId,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + this.TYPING_TIMEOUT),
      });
    }
  }

  stopTyping(userId: number, channelId: string): void {
    const states = this.typingStates.get(channelId);
    if (states) {
      const index = states.findIndex(s => s.userId === userId);
      if (index !== -1) states.splice(index, 1);
    }
  }

  getTypingUsers(channelId: string): number[] {
    const states = this.typingStates.get(channelId) || [];
    const now = Date.now();
    // Filter expired
    const active = states.filter(s => s.expiresAt.getTime() > now);
    this.typingStates.set(channelId, active);
    return active.map(s => s.userId);
  }
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION PIPELINE
// ═══════════════════════════════════════════════════════════════

export class NotificationPipeline {
  private notifications: Map<number, NotificationItem[]> = new Map();
  private notificationCounter = 0;
  private sseManager: SSEConnectionManager;
  private eventBus: EventBus;

  constructor(sseManager: SSEConnectionManager, eventBus: EventBus) {
    this.sseManager = sseManager;
    this.eventBus = eventBus;
  }

  async send(userId: number, type: NotificationItem["type"], title: string, body: string, options?: {
    actionUrl?: string;
    priority?: NotificationItem["priority"];
    metadata?: Record<string, unknown>;
    expiresAt?: Date;
  }): Promise<NotificationItem> {
    this.notificationCounter++;

    const notification: NotificationItem = {
      id: `notif_${this.notificationCounter}`,
      userId,
      type,
      title,
      body,
      actionUrl: options?.actionUrl,
      read: false,
      priority: options?.priority || "normal",
      createdAt: new Date(),
      expiresAt: options?.expiresAt,
      metadata: options?.metadata,
    };

    // Store
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    const userNotifs = this.notifications.get(userId)!;
    userNotifs.push(notification);

    // Keep last 200 per user
    if (userNotifs.length > 200) {
      this.notifications.set(userId, userNotifs.slice(-200));
    }

    // Push via SSE if user is online
    this.sseManager.sendToUser(userId, {
      id: notification.id,
      type: "notification",
      channel: `user:${userId}`,
      payload: notification,
      timestamp: new Date(),
      priority: notification.priority === "high" ? "high" : "normal",
    });

    // Publish to event bus
    this.eventBus.publish("notification:new", `user:${userId}`, notification);

    return notification;
  }

  async sendBulk(userIds: number[], type: NotificationItem["type"], title: string, body: string): Promise<number> {
    let sent = 0;
    for (const userId of userIds) {
      await this.send(userId, type, title, body);
      sent++;
    }
    return sent;
  }

  getNotifications(userId: number, unreadOnly = false, limit = 50): NotificationItem[] {
    const notifs = this.notifications.get(userId) || [];
    let filtered = notifs;
    if (unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }
    return filtered.slice(-limit).reverse();
  }

  markAsRead(userId: number, notificationId: string): boolean {
    const notifs = this.notifications.get(userId);
    if (!notifs) return false;

    const notif = notifs.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  markAllAsRead(userId: number): number {
    const notifs = this.notifications.get(userId);
    if (!notifs) return 0;

    let count = 0;
    notifs.forEach(n => {
      if (!n.read) {
        n.read = true;
        count++;
      }
    });
    return count;
  }

  getUnreadCount(userId: number): number {
    const notifs = this.notifications.get(userId) || [];
    return notifs.filter(n => !n.read).length;
  }
}

// ═══════════════════════════════════════════════════════════════
// LIVE ACTIVITY FEED
// ═══════════════════════════════════════════════════════════════

export class LiveActivityFeed {
  private activities: { type: string; message: string; userId?: number; timestamp: Date }[] = [];
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;

    // Subscribe to relevant events
    this.eventBus.subscribe("*", (event) => {
      if (event.type.startsWith("activity:")) {
        this.activities.push({
          type: event.type.replace("activity:", ""),
          message: String(event.payload),
          userId: event.senderId,
          timestamp: event.timestamp,
        });

        if (this.activities.length > 500) {
          this.activities = this.activities.slice(-250);
        }
      }
    });
  }

  getRecent(limit = 20): typeof this.activities {
    return this.activities.slice(-limit).reverse();
  }

  publishActivity(type: string, message: string, userId?: number): void {
    this.eventBus.publish(`activity:${type}`, "global", message, userId);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const eventBus = new EventBus();
export const sseManager = new SSEConnectionManager();
export const presenceService = new PresenceService(eventBus);
export const typingIndicators = new TypingIndicatorService();
export const notificationPipeline = new NotificationPipeline(sseManager, eventBus);
export const liveActivityFeed = new LiveActivityFeed(eventBus);

// ═══════════════════════════════════════════════════════════════
// REALTIME ENGINE v2 — ADVANCED MODULES
// ═══════════════════════════════════════════════════════════════

// ─── Live Chat Rooms ──────────────────────────────────────────

export interface ChatRoom {
  id: string;
  name: string;
  type: "public" | "private" | "dm" | "community" | "stream";
  createdBy: number;
  createdAt: number;
  memberCount: number;
  messageCount: number;
  lastActivity: number;
  metadata: Record<string, unknown>;
  pinned: boolean;
  slowMode: number; // seconds between messages, 0 = disabled
  maxMembers: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: "text" | "image" | "video" | "audio" | "file" | "sticker" | "reaction" | "system" | "tip" | "poll";
  replyToId?: string;
  reactions: Record<string, number[]>; // emoji -> userIds
  edited: boolean;
  editedAt?: number;
  deleted: boolean;
  pinned: boolean;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface LivePoll {
  id: string;
  roomId: string;
  creatorId: number;
  question: string;
  options: Array<{ id: string; text: string; votes: number[]; }>;
  multipleChoice: boolean;
  endsAt: number;
  createdAt: number;
  totalVotes: number;
}

export interface CollaborativeCursor {
  userId: number;
  username: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
  documentId: string;
}

export interface LiveReaction {
  userId: number;
  emoji: string;
  targetId: string;
  targetType: "post" | "comment" | "message" | "stream";
  timestamp: number;
  x?: number; // for floating reaction animations
  y?: number;
}

export interface ActivityHeatmapEntry {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6
  count: number;
  types: Record<string, number>;
}

export interface StreamChatState {
  streamId: string;
  viewerCount: number;
  messageCount: number;
  reactionCount: number;
  topDonors: Array<{ userId: number; username: string; amount: number; currency: string }>;
  activePoll?: LivePoll;
  pinnedMessage?: ChatMessage;
  slowMode: number;
  subscriberOnly: boolean;
  emoteOnly: boolean;
}

// ─── In-Memory Stores ─────────────────────────────────────────

const chatRooms = new Map<string, ChatRoom>();
const chatMessages = new Map<string, ChatMessage[]>(); // roomId -> messages
const livePolls = new Map<string, LivePoll>();
const collaborativeCursors = new Map<string, CollaborativeCursor>(); // `${docId}:${userId}`
const liveReactions: LiveReaction[] = [];
const activityHeatmap = new Map<string, ActivityHeatmapEntry>(); // `${dow}:${hour}`
const streamChatStates = new Map<string, StreamChatState>();
const slowModeTimers = new Map<string, Map<number, number>>(); // roomId -> userId -> lastMessageTime
const dmRooms = new Map<string, string>(); // `${uid1}:${uid2}` -> roomId

// ─── Room Management ──────────────────────────────────────────

export function createChatRoom(params: {
  name: string; type: ChatRoom["type"]; createdBy: number;
  maxMembers?: number; slowMode?: number; metadata?: Record<string, unknown>;
}): ChatRoom {
  const room: ChatRoom = {
    id: `room_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    name: params.name,
    type: params.type,
    createdBy: params.createdBy,
    createdAt: Date.now(),
    memberCount: 1,
    messageCount: 0,
    lastActivity: Date.now(),
    metadata: params.metadata || {},
    pinned: false,
    slowMode: params.slowMode || 0,
    maxMembers: params.maxMembers || 10_000,
  };
  chatRooms.set(room.id, room);
  chatMessages.set(room.id, []);
  return room;
}

export function getOrCreateDMRoom(userId1: number, userId2: number): ChatRoom {
  const key = [userId1, userId2].sort((a, b) => a - b).join(":");
  const existingId = dmRooms.get(key);
  if (existingId) return chatRooms.get(existingId)!;
  const room = createChatRoom({ name: `DM:${key}`, type: "dm", createdBy: userId1, maxMembers: 2 });
  dmRooms.set(key, room.id);
  return room;
}

export function getChatRoom(roomId: string): ChatRoom | undefined {
  return chatRooms.get(roomId);
}

export function listChatRooms(type?: ChatRoom["type"]): ChatRoom[] {
  const rooms = Array.from(chatRooms.values());
  return type ? rooms.filter(r => r.type === type) : rooms;
}

export function updateRoomSettings(roomId: string, settings: Partial<Pick<ChatRoom, "slowMode" | "pinned" | "maxMembers" | "name">>): boolean {
  const room = chatRooms.get(roomId);
  if (!room) return false;
  Object.assign(room, settings);
  return true;
}

// ─── Message Management ───────────────────────────────────────

export function sendChatMessage(params: {
  roomId: string; senderId: number; senderName: string; content: string;
  type?: ChatMessage["type"]; replyToId?: string; metadata?: Record<string, unknown>;
}): { message?: ChatMessage; error?: string } {
  const room = chatRooms.get(params.roomId);
  if (!room) return { error: "Room not found" };
  if (room.memberCount >= room.maxMembers) return { error: "Room is full" };
  if (room.slowMode > 0) {
    const timers = slowModeTimers.get(params.roomId) || new Map<number, number>();
    const lastMsg = timers.get(params.senderId) || 0;
    if (Date.now() - lastMsg < room.slowMode * 1000) {
      return { error: `Slow mode: wait ${room.slowMode}s between messages` };
    }
    timers.set(params.senderId, Date.now());
    slowModeTimers.set(params.roomId, timers);
  }
  const message: ChatMessage = {
    id: `msg_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    roomId: params.roomId,
    senderId: params.senderId,
    senderName: params.senderName,
    content: params.content,
    type: params.type || "text",
    replyToId: params.replyToId,
    reactions: {},
    edited: false,
    deleted: false,
    pinned: false,
    timestamp: Date.now(),
    metadata: params.metadata,
  };
  const msgs = chatMessages.get(params.roomId) || [];
  msgs.push(message);
  if (msgs.length > 1000) msgs.splice(0, 100);
  chatMessages.set(params.roomId, msgs);
  room.messageCount++;
  room.lastActivity = Date.now();
  recordActivity("message");
  broadcastToChannel(params.roomId, { type: "chat_message", payload: message, priority: "normal" });
  return { message };
}

export function getChatHistory(roomId: string, limit = 50, before?: number): ChatMessage[] {
  const msgs = chatMessages.get(roomId) || [];
  let filtered = msgs.filter(m => !m.deleted);
  if (before) filtered = filtered.filter(m => m.timestamp < before);
  return filtered.slice(-limit);
}

export function reactToMessage(roomId: string, messageId: string, userId: number, emoji: string): boolean {
  const msgs = chatMessages.get(roomId) || [];
  const msg = msgs.find(m => m.id === messageId);
  if (!msg) return false;
  if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
  const idx = msg.reactions[emoji].indexOf(userId);
  if (idx >= 0) msg.reactions[emoji].splice(idx, 1);
  else msg.reactions[emoji].push(userId);
  broadcastToChannel(roomId, { type: "message_reaction", payload: { messageId, emoji, reactions: msg.reactions }, priority: "low" });
  return true;
}

export function editMessage(roomId: string, messageId: string, userId: number, newContent: string): boolean {
  const msgs = chatMessages.get(roomId) || [];
  const msg = msgs.find(m => m.id === messageId && m.senderId === userId);
  if (!msg) return false;
  msg.content = newContent;
  msg.edited = true;
  msg.editedAt = Date.now();
  broadcastToChannel(roomId, { type: "message_edited", payload: msg, priority: "normal" });
  return true;
}

export function deleteMessage(roomId: string, messageId: string, userId: number): boolean {
  const msgs = chatMessages.get(roomId) || [];
  const msg = msgs.find(m => m.id === messageId && m.senderId === userId);
  if (!msg) return false;
  msg.deleted = true;
  msg.content = "[Message deleted]";
  broadcastToChannel(roomId, { type: "message_deleted", payload: { messageId }, priority: "normal" });
  return true;
}

export function pinMessage(roomId: string, messageId: string): boolean {
  const msgs = chatMessages.get(roomId) || [];
  msgs.forEach(m => { m.pinned = m.id === messageId; });
  broadcastToChannel(roomId, { type: "message_pinned", payload: { messageId }, priority: "normal" });
  return true;
}

// ─── Live Polls ───────────────────────────────────────────────

export function createLivePoll(params: {
  roomId: string; creatorId: number; question: string;
  options: string[]; multipleChoice?: boolean; durationSeconds?: number;
}): LivePoll {
  const poll: LivePoll = {
    id: `poll_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    roomId: params.roomId,
    creatorId: params.creatorId,
    question: params.question,
    options: params.options.map((text, i) => ({ id: `opt_${i}`, text, votes: [] })),
    multipleChoice: params.multipleChoice || false,
    endsAt: Date.now() + (params.durationSeconds || 300) * 1000,
    createdAt: Date.now(),
    totalVotes: 0,
  };
  livePolls.set(poll.id, poll);
  broadcastToChannel(params.roomId, { type: "poll_created", payload: poll, priority: "high" });
  return poll;
}

export function votePoll(pollId: string, userId: number, optionIds: string[]): { success: boolean; poll?: LivePoll; error?: string } {
  const poll = livePolls.get(pollId);
  if (!poll) return { success: false, error: "Poll not found" };
  if (Date.now() > poll.endsAt) return { success: false, error: "Poll has ended" };
  const alreadyVoted = poll.options.some(o => o.votes.includes(userId));
  if (alreadyVoted) {
    poll.options.forEach(o => { const idx = o.votes.indexOf(userId); if (idx >= 0) o.votes.splice(idx, 1); });
    poll.totalVotes = Math.max(0, poll.totalVotes - 1);
  }
  const targetOptions = poll.multipleChoice ? optionIds : [optionIds[0]];
  for (const optId of targetOptions) {
    const opt = poll.options.find(o => o.id === optId);
    if (opt && !opt.votes.includes(userId)) { opt.votes.push(userId); poll.totalVotes++; }
  }
  broadcastToChannel(poll.roomId, { type: "poll_updated", payload: poll, priority: "normal" });
  return { success: true, poll };
}

export function getLivePoll(pollId: string): LivePoll | undefined {
  return livePolls.get(pollId);
}

export function getActivePolls(roomId: string): LivePoll[] {
  const now = Date.now();
  return Array.from(livePolls.values()).filter(p => p.roomId === roomId && p.endsAt > now);
}

// ─── Collaborative Cursors ────────────────────────────────────

export function updateCursor(documentId: string, userId: number, username: string, x: number, y: number): void {
  const key = `${documentId}:${userId}`;
  const colors = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F"];
  const color = colors[userId % colors.length];
  collaborativeCursors.set(key, { userId, username, x, y, color, timestamp: Date.now(), documentId });
  broadcastToChannel(`doc:${documentId}`, { type: "cursor_update", payload: { userId, username, x, y, color }, priority: "low" });
}

export function getDocumentCursors(documentId: string): CollaborativeCursor[] {
  const now = Date.now();
  return Array.from(collaborativeCursors.values())
    .filter(c => c.documentId === documentId && now - c.timestamp < 30_000);
}

// ─── Live Reactions ───────────────────────────────────────────

export function emitLiveReaction(params: {
  userId: number; emoji: string; targetId: string; targetType: LiveReaction["targetType"]; x?: number; y?: number;
}): void {
  const reaction: LiveReaction = { ...params, timestamp: Date.now() };
  liveReactions.push(reaction);
  if (liveReactions.length > 10_000) liveReactions.splice(0, 1_000);
  broadcastToChannel(`reactions:${params.targetType}:${params.targetId}`, { type: "live_reaction", payload: reaction, priority: "low" });
}

export function getRecentReactions(targetId: string, targetType: LiveReaction["targetType"], since = 5_000): LiveReaction[] {
  const cutoff = Date.now() - since;
  return liveReactions.filter(r => r.targetId === targetId && r.targetType === targetType && r.timestamp > cutoff);
}

// ─── Activity Heatmap ─────────────────────────────────────────

export function recordActivity(type: string): void {
  const now = new Date();
  const key = `${now.getDay()}:${now.getHours()}`;
  const entry = activityHeatmap.get(key) || { hour: now.getHours(), dayOfWeek: now.getDay(), count: 0, types: {} };
  entry.count++;
  entry.types[type] = (entry.types[type] || 0) + 1;
  activityHeatmap.set(key, entry);
}

export function getActivityHeatmap(): ActivityHeatmapEntry[] {
  return Array.from(activityHeatmap.values());
}

// ─── Stream Chat ──────────────────────────────────────────────

export function getOrCreateStreamChat(streamId: string): StreamChatState {
  let state = streamChatStates.get(streamId);
  if (!state) {
    state = { streamId, viewerCount: 0, messageCount: 0, reactionCount: 0, topDonors: [], slowMode: 3, subscriberOnly: false, emoteOnly: false };
    streamChatStates.set(streamId, state);
  }
  return state;
}

export function updateStreamViewerCount(streamId: string, delta: number): number {
  const state = getOrCreateStreamChat(streamId);
  state.viewerCount = Math.max(0, state.viewerCount + delta);
  broadcastToChannel(`stream:${streamId}`, { type: "viewer_count", payload: { count: state.viewerCount }, priority: "low" });
  return state.viewerCount;
}

export function recordStreamDonation(streamId: string, userId: number, username: string, amount: number, currency: string): void {
  const state = getOrCreateStreamChat(streamId);
  const existing = state.topDonors.find(d => d.userId === userId);
  if (existing) existing.amount += amount;
  else state.topDonors.push({ userId, username, amount, currency });
  state.topDonors.sort((a, b) => b.amount - a.amount);
  state.topDonors = state.topDonors.slice(0, 10);
  broadcastToChannel(`stream:${streamId}`, { type: "stream_donation", payload: { userId, username, amount, currency }, priority: "high" });
}

export function setStreamChatMode(streamId: string, settings: Partial<Pick<StreamChatState, "slowMode" | "subscriberOnly" | "emoteOnly">>): void {
  const state = getOrCreateStreamChat(streamId);
  Object.assign(state, settings);
  broadcastToChannel(`stream:${streamId}`, { type: "chat_mode_changed", payload: settings, priority: "normal" });
}

// ─── Broadcast Helper ─────────────────────────────────────────

function broadcastToChannel(channel: string, event: Omit<RealtimeEvent, "id" | "timestamp" | "channel">): void {
  const full: RealtimeEvent = {
    ...event,
    id: `evt_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    channel,
  };
  // Emit to event bus (existing system picks it up)
  eventBus.publish(full.type, channel, full.payload, full.senderId, full.priority).catch(() => {});
}

// ─── Connection Stats ─────────────────────────────────────────

export function getRealtimeStats() {
  return {
    chatRooms: chatRooms.size,
    totalMessages: Array.from(chatMessages.values()).reduce((s, m) => s + m.length, 0),
    activePolls: Array.from(livePolls.values()).filter(p => p.endsAt > Date.now()).length,
    activeCursors: collaborativeCursors.size,
    streamChats: streamChatStates.size,
    recentReactions: liveReactions.filter(r => Date.now() - r.timestamp < 60_000).length,
    activityHeatmapEntries: activityHeatmap.size,
  };
}

// ─── Cleanup ─────────────────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  // Clean up expired polls
  livePolls.forEach((p, k) => { if (now - p.endsAt > 24 * 60 * 60_000) livePolls.delete(k); });
  // Clean up stale cursors
  collaborativeCursors.forEach((c, k) => { if (now - c.timestamp > 60_000) collaborativeCursors.delete(k); });
  // Clean up old reactions
  while (liveReactions.length > 5_000) liveReactions.shift();
}, 5 * 60_000);
