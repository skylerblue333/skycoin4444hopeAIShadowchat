import crypto from 'crypto';
/**
 * @file echo-realtime-engine.ts
 * @description Production TypeScript engine file for SKYCOIN4444 platform: ECHO Real-time Engine.
 * This engine handles WebSocket connection management, pub/sub channels, presence tracking,
 * live feed updates, notification delivery, room management, message queuing, event broadcasting,
 * connection state management, reconnection logic, and message history.
 */

import { invokeLLM } from "./_core/llm";

// --- Interfaces and Types ---

enum ConnectionState {
  Disconnected = "DISCONNECTED",
  Connecting = "CONNECTING",
  Connected = "CONNECTED",
  Reconnecting = "RECONNECTING",
}

enum MessageType {
  System = "SYSTEM",
  Chat = "CHAT",
  Notification = "NOTIFICATION",
  Event = "EVENT",
}

interface WebSocketMessage<T = any> {
  type: MessageType | string;
  channel?: string;
  senderId?: string;
  timestamp: number;
  payload: T;
}

interface Subscription {
  channel: string;
  callback: (message: WebSocketMessage) => void;
}

interface PresenceInfo {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: number;
  metadata?: Record<string, any>;
}

interface RoomInfo {
  roomId: string;
  name: string;
  members: string[]; // Array of user IDs
  metadata?: Record<string, any>;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  metadata?: Record<string, any>;
}

interface LiveFeedUpdatePayload {
  feedId: string;
  itemId: string;
  data: Record<string, any>;
  timestamp: number;
}

interface MessageQueueItem {
  id: string;
  message: WebSocketMessage;
  timestamp: number;
  retries: number;
}

interface EngineConfig {
  websocketUrl: string;
  reconnectIntervalMs: number;
  maxReconnectAttempts: number;
  messageQueueCapacity: number;
  messageHistoryCapacity: number;
}

// --- Constants ---

const DEFAULT_RECONNECT_INTERVAL = 5000; // 5 seconds
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;
const DEFAULT_MESSAGE_QUEUE_CAPACITY = 1000;
const DEFAULT_MESSAGE_HISTORY_CAPACITY = 5000;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const PING_MESSAGE_TYPE = "PING";
const PONG_MESSAGE_TYPE = "PONG";

// --- Utility Functions ---

function generateUniqueId(): string {
  return Date.now().toString(36) + (crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substring(2);
}

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// --- Sub-Engines / Helper Classes ---

class ConnectionManager {
  private ws: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.Disconnected;
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly config: EngineConfig;
  private readonly onOpenCallback: () => void;
  private readonly onCloseCallback: (event: CloseEvent) => void;
  private readonly onMessageCallback: (message: WebSocketMessage) => void;
  private readonly onErrorCallback: (event: Event) => void;

  constructor(
    config: EngineConfig,
    onOpen: () => void,
    onClose: (event: CloseEvent) => void,
    onMessage: (message: WebSocketMessage) => void,
    onError: (event: Event) => void
  ) {
    this.config = config;
    this.onOpenCallback = onOpen;
    this.onCloseCallback = onClose;
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
  }

  public connect(): void {
    if (this.state === ConnectionState.Connected || this.state === ConnectionState.Connecting) {
      return;
    }

    this.setState(ConnectionState.Connecting);
    this.ws = new WebSocket(this.config.websocketUrl);

    this.ws.onopen = () => {
      this.setState(ConnectionState.Connected);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.onOpenCallback();
    };

    this.ws.onmessage = (event) => {
      if (isValidJson(event.data)) {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === PING_MESSAGE_TYPE) {
          this.send({ type: PONG_MESSAGE_TYPE, timestamp: Date.now(), payload: {} });
        } else {
          this.onMessageCallback(message);
        }
      } else {
        console.warn(`[ConnectionManager] Received non-JSON message: ${event.data}`);
      }
    };

    this.ws.onclose = (event) => {
      this.setState(ConnectionState.Disconnected);
      this.stopHeartbeat();
      this.onCloseCallback(event);
      this.handleReconnect();
    };

    this.ws.onerror = (event) => {
        this.onErrorCallback(event);
      this.ws?.close(); // Force close to trigger onclose and reconnection logic
    };
  }

  public disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.stopReconnectTimer();
      this.ws.close();
      this.ws = null;
      this.setState(ConnectionState.Disconnected);
    }
  }

  public send(message: WebSocketMessage): void {
    if (this.state === ConnectionState.Connected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
        console.warn(`[ConnectionManager] Not connected, queuing message: ${message.type}`);
    }
  }

  public getState(): ConnectionState {
    return this.state;
  }

  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
        console.log(`[ConnectionManager] State changed to ${newState}`);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.setState(ConnectionState.Reconnecting);
      this.reconnectTimer = setTimeout(() => {
        console.log(`[ConnectionManager] Reconnecting... Attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
        this.connect();
      }, this.config.reconnectIntervalMs);
    } else {
        console.error(`[ConnectionManager] Max reconnect attempts reached. Disconnecting.`);
        this.setState(ConnectionState.Disconnected);
    }
  }

  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Ensure no duplicate heartbeats
    this.heartbeatTimer = setInterval(() => {
      if (this.state === ConnectionState.Connected) {
        this.send({ type: PING_MESSAGE_TYPE, timestamp: Date.now(), payload: {} });
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

class PubSubManager {
  private subscriptions: Map<string, Subscription[]> = new Map();

  public subscribe(channel: string, callback: (message: WebSocketMessage) => void): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }
    const channelSubscriptions = this.subscriptions.get(channel)!;
    const subscription: Subscription = { channel, callback };
    channelSubscriptions.push(subscription);

    // Return an unsubscribe function
    return () => {
      this.unsubscribe(channel, callback);
    };
  }

  public unsubscribe(channel: string, callback: (message: WebSocketMessage) => void): void {
    if (this.subscriptions.has(channel)) {
      let channelSubscriptions = this.subscriptions.get(channel)!;
      channelSubscriptions = channelSubscriptions.filter(sub => sub.callback !== callback);
      this.subscriptions.set(channel, channelSubscriptions);
      if (channelSubscriptions.length === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }

  public publish(message: WebSocketMessage): void {
    if (message.channel && this.subscriptions.has(message.channel)) {
      this.subscriptions.get(message.channel)!.forEach(sub => {
        try {
          sub.callback(message);
        } catch (error) {
          console.error(`[PubSubManager] Error in subscription callback for channel ${message.channel}: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    }
  }

  public getActiveChannels(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

class PresenceTracker {
  private presenceMap: Map<string, PresenceInfo> = new Map();
  private roomPresence: Map<string, Set<string>> = new Map(); // roomId -> Set<userId>

  public updatePresence(info: PresenceInfo): void {
    this.presenceMap.set(info.userId, info);
    console.log(`[PresenceTracker] Presence updated for user ${info.userId}: ${info.status}`);
  }

  public getPresence(userId: string): PresenceInfo | undefined {
    return this.presenceMap.get(userId);
  }

  public getAllOnlineUsers(): PresenceInfo[] {
    return Array.from(this.presenceMap.values()).filter(p => p.status === 'online');
  }

  public joinRoom(roomId: string, userId: string): void {
    if (!this.roomPresence.has(roomId)) {
      this.roomPresence.set(roomId, new Set());
    }
    this.roomPresence.get(roomId)!.add(userId);
    console.log(`[PresenceTracker] User ${userId} joined room ${roomId}`);
  }

  public leaveRoom(roomId: string, userId: string): void {
    if (this.roomPresence.has(roomId)) {
      this.roomPresence.get(roomId)!.delete(userId);
      if (this.roomPresence.get(roomId)!.size === 0) {
        this.roomPresence.delete(roomId);
      }
      console.log(`[PresenceTracker] User ${userId} left room ${roomId}`);
    }
  }

  public getRoomMembers(roomId: string): string[] {
    return this.roomPresence.has(roomId) ? Array.from(this.roomPresence.get(roomId)!) : [];
  }

  public isUserInRoom(roomId: string, userId: string): boolean {
    return this.roomPresence.has(roomId) && this.roomPresence.get(roomId)!.has(userId);
  }
}

class MessageQueue {
  private queue: MessageQueueItem[] = [];
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  public enqueue(message: WebSocketMessage): boolean {
    if (this.queue.length >= this.capacity) {
        console.warn(`[MessageQueue] Queue full, dropping oldest message.`);
        this.queue.shift(); // Remove the oldest message
    }
    const item: MessageQueueItem = {
      id: generateUniqueId(),
      message,
      timestamp: Date.now(),
      retries: 0,
    };
    this.queue.push(item);
    return true;
  }

  public dequeue(): MessageQueueItem | undefined {
    return this.queue.shift();
  }

  public peek(): MessageQueueItem | undefined {
    return this.queue[0];
  }

  public size(): number {
    return this.queue.length;
  }

  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  public retry(itemId: string): boolean {
    const itemIndex = this.queue.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      this.queue[itemIndex].retries++;
      // Re-queue at the end for another attempt
      const [item] = this.queue.splice(itemIndex, 1);
      this.queue.push(item);
      return true;
    }
    return false;
  }
}

class MessageHistory {
  private history: WebSocketMessage[] = [];
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  public addMessage(message: WebSocketMessage): void {
    if (this.history.length >= this.capacity) {
      this.history.shift(); // Remove the oldest message
    }
    this.history.push(message);
  }

  public getHistory(channel?: string, limit: number = 50): WebSocketMessage[] {
    let filteredHistory = channel
      ? this.history.filter(msg => msg.channel === channel)
      : this.history;
    return filteredHistory.slice(-limit);
  }

  public clearHistory(channel?: string): void {
    if (channel) {
      this.history = this.history.filter(msg => msg.channel !== channel);
    } else {
      this.history = [];
    }
  }
}

// --- Main Engine Class ---

class EchoRealtimeEngine {
  private config: EngineConfig;
  private connectionManager: ConnectionManager;
  private pubSubManager: PubSubManager;
  private presenceTracker: PresenceTracker;
  private messageQueue: MessageQueue;
  private messageHistory: MessageHistory;
  private userId: string | null = null;

  constructor(config: Partial<EngineConfig>) {
    this.config = {
      websocketUrl: config.websocketUrl || "ws://localhost:8080/realtime",
      reconnectIntervalMs: config.reconnectIntervalMs || DEFAULT_RECONNECT_INTERVAL,
      maxReconnectAttempts: config.maxReconnectAttempts || DEFAULT_MAX_RECONNECT_ATTEMPTS,
      messageQueueCapacity: config.messageQueueCapacity || DEFAULT_MESSAGE_QUEUE_CAPACITY,
      messageHistoryCapacity: config.messageHistoryCapacity || DEFAULT_MESSAGE_HISTORY_CAPACITY,
    };

    this.pubSubManager = new PubSubManager();
    this.presenceTracker = new PresenceTracker();
    this.messageQueue = new MessageQueue(this.config.messageQueueCapacity);
    this.messageHistory = new MessageHistory(this.config.messageHistoryCapacity);

    this.connectionManager = new ConnectionManager(
      this.config,
      this.handleOpen.bind(this),
      this.handleClose.bind(this),
      this.handleMessage.bind(this),
      this.handleError.bind(this)
    );
  }

  public initialize(userId: string): void {
    this.userId = userId;
    this.connect();
  }

  public connect(): void {
    this.connectionManager.connect();
  }

  public disconnect(): void {
    this.connectionManager.disconnect();
  }

  public getConnectionState(): ConnectionState {
    return this.connectionManager.getState();
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  // --- Pub/Sub Methods ---

  public subscribe(channel: string, callback: (message: WebSocketMessage) => void): () => void {
    // Send subscription request to server if needed
    this.sendMessage({ type: "SUBSCRIBE", channel, timestamp: Date.now(), payload: { userId: this.userId } });
    return this.pubSubManager.subscribe(channel, callback);
  }

  public unsubscribe(channel: string, callback: (message: WebSocketMessage) => void): void {
    // Send unsubscription request to server if needed
    this.sendMessage({ type: "UNSUBSCRIBE", channel, timestamp: Date.now(), payload: { userId: this.userId } });
    this.pubSubManager.unsubscribe(channel, callback);
  }

  public publish(channel: string, payload: any, messageType: MessageType | string = MessageType.Chat): void {
    const message: WebSocketMessage = {
      type: messageType,
      channel,
      senderId: this.userId || "anonymous",
      timestamp: Date.now(),
      payload,
    };
    this.sendMessage(message);
  }

  // --- Message Sending and Handling ---

  private sendMessage(message: WebSocketMessage): void {
    if (this.connectionManager.getState() === ConnectionState.Connected) {
      this.connectionManager.send(message);
      this.messageHistory.addMessage(message);
    } else {
        console.warn(`[EchoRealtimeEngine] Not connected, queuing message: ${message.type}`);
        this.messageQueue.enqueue(message);
    }
  }

  private processQueuedMessages(): void {
    while (!this.messageQueue.isEmpty() && this.connectionManager.getState() === ConnectionState.Connected) {
      const item = this.messageQueue.dequeue();
      if (item) {
                this.connectionManager.send(item.message);
        this.messageHistory.addMessage(item.message);
      }
    }
  }

  private handleOpen(): void {
        this.processQueuedMessages();
    // Re-subscribe to all active channels upon reconnection
    this.pubSubManager.getActiveChannels().forEach(channel => {
      this.sendMessage({ type: "SUBSCRIBE", channel, timestamp: Date.now(), payload: { userId: this.userId } });
    });
    // Update presence to online
    if (this.userId) {
      this.updatePresence({ userId: this.userId, status: 'online', lastSeen: Date.now() });
    }
  }

  private handleClose(event: CloseEvent): void {
        if (this.userId) {
      this.updatePresence({ userId: this.userId, status: 'offline', lastSeen: Date.now() });
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    //     this.messageHistory.addMessage(message);

    switch (message.type) {
      case "PRESENCE_UPDATE":
        this.presenceTracker.updatePresence(message.payload as PresenceInfo);
        break;
      case "ROOM_JOIN":
        if (message.payload.roomId && message.payload.userId) {
          this.presenceTracker.joinRoom(message.payload.roomId, message.payload.userId);
        }
        break;
      case "ROOM_LEAVE":
        if (message.payload.roomId && message.payload.userId) {
          this.presenceTracker.leaveRoom(message.payload.roomId, message.payload.userId);
        }
        break;
      case "LIVE_FEED_UPDATE":
        // Handle live feed updates, potentially publish to a specific channel
        this.pubSubManager.publish(message);
        break;
      case "NOTIFICATION_DELIVERY":
        // Handle notification delivery, potentially publish to a specific user channel
        this.pubSubManager.publish(message);
        break;
      default:
        // For other message types, publish to relevant channels
        this.pubSubManager.publish(message);
        break;
    }
  }

  private handleError(event: Event): void {
        // Potentially use invokeLLM for advanced error analysis or reporting
      invokeLLM({ messages: [{ role: "user", content: `WebSocket error: ${JSON.stringify(event)}` }] }).then(analysis => {
        console.error(`[EchoRealtimeEngine] AI analysis of WebSocket error: ${analysis.choices[0]?.message?.content || 'No analysis'}`);
      });
    }

  // --- Presence Tracking Methods ---

  public updatePresence(info: PresenceInfo): void {
    this.presenceTracker.updatePresence(info);
    this.sendMessage({ type: "PRESENCE_UPDATE", timestamp: Date.now(), payload: info });
  }

  public getPresence(userId: string): PresenceInfo | undefined {
    return this.presenceTracker.getPresence(userId);
  }

  public getAllOnlineUsers(): PresenceInfo[] {
    return this.presenceTracker.getAllOnlineUsers();
  }

  public joinRoom(roomId: string, userId: string): void {
    this.presenceTracker.joinRoom(roomId, userId);
      this.sendMessage({ type: "ROOM_JOIN", channel: roomId, timestamp: Date.now(), payload: { roomId, userId: this.userId } });
  }

  public leaveRoom(roomId: string, userId: string): void {
    this.presenceTracker.leaveRoom(roomId, userId);
      this.sendMessage({ type: "ROOM_LEAVE", channel: roomId, timestamp: Date.now(), payload: { roomId, userId: this.userId } });
  }

  public getRoomMembers(roomId: string): string[] {
    return this.presenceTracker.getRoomMembers(roomId);
  }

  public isUserInRoom(roomId: string, userId: string): boolean {
    return this.presenceTracker.isUserInRoom(roomId, userId);
  }

  // --- Message History Methods ---

  public getMessageHistory(channel?: string, limit?: number): WebSocketMessage[] {
    return this.messageHistory.getHistory(channel, limit);
  }

  public clearMessageHistory(channel?: string): void {
    this.messageHistory.clearHistory(channel);
  }

  // --- Live Feed and Notification Methods (simplified, relying on pub/sub) ---

  public sendLiveFeedUpdate(feedId: string, itemId: string, data: Record<string, any>): void {
    const payload: LiveFeedUpdatePayload = { feedId, itemId, data, timestamp: Date.now() };
    this.publish({ type: MessageType.Event, channel: `livefeed-${feedId}`, timestamp: Date.now(), payload: payload });
  }

  public sendNotification(targetUserId: string, notification: NotificationPayload): void {
    this.publish({ type: MessageType.Notification, channel: `user-notification-${targetUserId}`, timestamp: Date.now(), payload: notification });
  }

  // --- AI-powered methods (example usage of invokeLLM) ---

  /*
  public async analyzeMessageSentiment(messageText: string): Promise<string> {
    try {
      const resp = await invokeLLM({ messages: [{ role: "system", content: "Analyze the sentiment of the message. Reply with one word: positive, negative, or neutral." }, { role: "user", content: messageText }] });
      return String(resp.choices[0]?.message?.content || "").trim() || "neutral";
    } catch (error) {
            return "error";
    }
  }
  */

  /*
  public async generateChatbotResponse(prompt: string, context: WebSocketMessage[]): Promise<string> {
    try {
      const contextMsgs = context.slice(-5).map(m => ({ role: "user" as const, content: String(m.payload) }));
      const resp = await invokeLLM({
        messages: [
          { role: "system", content: "You are a helpful chat assistant." },
          ...contextMsgs,
          { role: "user", content: prompt },
        ],
      });
      return String(resp.choices[0]?.message?.content || "");
    } catch (error) {
      console.error(`[EchoRealtimeEngine] Error generating chatbot response: ${error instanceof Error ? error.message : String(error)}`);
      return "";
    }
  }
  */

// --- Singleton Export ---

}

const echoRealtimeEngine = new EchoRealtimeEngine({});
export default echoRealtimeEngine;

// Optional: Export the class itself if direct instantiation is desired in some advanced scenarios
export { EchoRealtimeEngine, ConnectionState, MessageType };
