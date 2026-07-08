/**
 * socketClient.ts — Real-Time Event Bus + Action State Machine
 *
 * Architecture:
 *   Chat message → Action Engine → Event Bus → UI sync
 *
 * Events:
 *   message:new | action:started | action:completed | payment:confirmed
 *   ai:response | typing:start | typing:stop | user:online | user:offline
 *
 * Action State Machine:
 *   PENDING → VALIDATING → PROCESSING → EXECUTING → COMPLETED | FAILED | ROLLED_BACK
 */

import { REALTIME_EVENTS, type RealtimeEvent } from "@/core/actions/actionTypes";

// ─── Action Lifecycle States ──────────────────────────────────────────────────

export const ACTION_STATES = {
  PENDING: "PENDING",
  VALIDATING: "VALIDATING",
  PROCESSING: "PROCESSING",
  EXECUTING: "EXECUTING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  ROLLED_BACK: "ROLLED_BACK",
} as const;

export type ActionState = (typeof ACTION_STATES)[keyof typeof ACTION_STATES];

export interface ActionLifecycle {
  id: string;
  type: string;
  state: ActionState;
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  error?: string;
  txHash?: string;
  retryCount: number;
  traceId: string;
}

// ─── Event Bus ────────────────────────────────────────────────────────────────

type EventHandler<T = unknown> = (data: T) => void;

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);
    return () => this.off(event, handler);
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler as EventHandler);
  }

  emit<T>(event: string, data: T): void {
    this.listeners.get(event)?.forEach(h => {
      try {
        h(data);
      } catch (err) {
              }
    });
  }

  once<T>(event: string, handler: EventHandler<T>): void {
    const wrapper: EventHandler<T> = (data) => {
      handler(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

// ─── Action State Machine ─────────────────────────────────────────────────────

class ActionStateMachine {
  private actions: Map<string, ActionLifecycle> = new Map();
  private bus: EventBus;

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  private generateId(): string {
    return `act_${Date.now()}_${(Math.random()).toString(36).slice(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${(Math.random()).toString(36).slice(2, 11)}`;
  }

  start(type: string): ActionLifecycle {
    const action: ActionLifecycle = {
      id: this.generateId(),
      type,
      state: ACTION_STATES.PENDING,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 0,
      traceId: this.generateTraceId(),
    };
    this.actions.set(action.id, action);
    this.bus.emit(REALTIME_EVENTS.ACTION_STARTED, { ...action });
    return action;
  }

  transition(id: string, nextState: ActionState, data?: Partial<ActionLifecycle>): ActionLifecycle | null {
    const action = this.actions.get(id);
    if (!action) return null;

    const VALID_TRANSITIONS: Record<ActionState, ActionState[]> = {
      PENDING: ["VALIDATING", "FAILED"],
      VALIDATING: ["PROCESSING", "FAILED"],
      PROCESSING: ["EXECUTING", "FAILED"],
      EXECUTING: ["COMPLETED", "FAILED"],
      COMPLETED: [],
      FAILED: ["PENDING"], // allow retry
      ROLLED_BACK: [],
    };

    if (!VALID_TRANSITIONS[action.state].includes(nextState)) {
            return action;
    }

    const updated: ActionLifecycle = {
      ...action,
      ...data,
      state: nextState,
      updatedAt: Date.now(),
      completedAt: nextState === ACTION_STATES.COMPLETED ? Date.now() : action.completedAt,
    };
    this.actions.set(id, updated);

    if (nextState === ACTION_STATES.COMPLETED) {
      this.bus.emit(REALTIME_EVENTS.ACTION_COMPLETED, { ...updated });
    }

    return updated;
  }

  complete(id: string, txHash?: string): ActionLifecycle | null {
    return this.transition(id, ACTION_STATES.COMPLETED, { txHash });
  }

  fail(id: string, error: string): ActionLifecycle | null {
    const action = this.actions.get(id);
    if (!action) return null;
    // Try to roll back through states
    const updated = this.transition(id, ACTION_STATES.FAILED, { error });
    return updated;
  }

  retry(id: string): ActionLifecycle | null {
    const action = this.actions.get(id);
    if (!action || action.state !== ACTION_STATES.FAILED) return null;
    const updated: ActionLifecycle = {
      ...action,
      state: ACTION_STATES.PENDING,
      retryCount: action.retryCount + 1,
      updatedAt: Date.now(),
      error: undefined,
    };
    this.actions.set(id, updated);
    this.bus.emit(REALTIME_EVENTS.ACTION_STARTED, { ...updated, isRetry: true });
    return updated;
  }

  get(id: string): ActionLifecycle | undefined {
    return this.actions.get(id);
  }

  getAll(): ActionLifecycle[] {
    return Array.from(this.actions.values());
  }

  getByState(state: ActionState): ActionLifecycle[] {
    return this.getAll().filter(a => a.state === state);
  }
}

// ─── Socket Client (SSE-based, upgradeable to WebSocket) ─────────────────────

class SocketClient {
  private bus: EventBus;
  private stateMachine: ActionStateMachine;
  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isConnected = false;
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  constructor() {
    this.bus = new EventBus();
    this.stateMachine = new ActionStateMachine(this.bus);
  }

  connect(userId?: string): void {
    if (this.isConnected) return;
    this.connectSSE(userId);
  }

  private connectSSE(userId?: string): void {
    const url = userId ? `/api/events?userId=${userId}` : "/api/events";
    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectDelay = 1000;
        this.notifyConnectionListeners(true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type) {
            this.bus.emit(data.type, data.payload ?? data);
          }
        } catch {
          // Ignore malformed events
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.eventSource?.close();
        this.eventSource = null;
        this.notifyConnectionListeners(false);
        this.scheduleReconnect(userId);
      };

      // Listen for specific event types
      const eventTypes = Object.values(REALTIME_EVENTS);
      eventTypes.forEach(type => {
        this.eventSource?.addEventListener(type, (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            this.bus.emit(type, data);
          } catch {
            // Ignore
          }
        });
      });
    } catch {
      this.scheduleReconnect(userId);
    }
  }

  private scheduleReconnect(userId?: string): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connectSSE(userId);
    }, this.reconnectDelay);
  }

  disconnect(): void {
    this.isConnected = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.eventSource?.close();
    this.eventSource = null;
    this.notifyConnectionListeners(false);
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(l => l(connected));
  }

  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  // ── Event Bus proxy ──────────────────────────────────────────────────────────

  on<T>(event: RealtimeEvent | string, handler: EventHandler<T>): () => void {
    return this.bus.on(event, handler);
  }

  emit<T>(event: RealtimeEvent | string, data: T): void {
    this.bus.emit(event, data);
  }

  // ── Action State Machine proxy ────────────────────────────────────────────────

  startAction(type: string): ActionLifecycle {
    return this.stateMachine.start(type);
  }

  transitionAction(id: string, state: ActionState, data?: Partial<ActionLifecycle>): ActionLifecycle | null {
    return this.stateMachine.transition(id, state, data);
  }

  completeAction(id: string, txHash?: string): ActionLifecycle | null {
    return this.stateMachine.complete(id, txHash);
  }

  failAction(id: string, error: string): ActionLifecycle | null {
    return this.stateMachine.fail(id, error);
  }

  retryAction(id: string): ActionLifecycle | null {
    return this.stateMachine.retry(id);
  }

  getAction(id: string): ActionLifecycle | undefined {
    return this.stateMachine.get(id);
  }

  getPendingActions(): ActionLifecycle[] {
    return this.stateMachine.getByState(ACTION_STATES.PENDING);
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const socketClient = new SocketClient();

// ─── React Hook ───────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

export function useSocketClient(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketClient.connect(userId);
    const unsub = socketClient.onConnectionChange(setIsConnected);
    return () => {
      unsub();
      // Don't disconnect on unmount — keep connection alive
    };
  }, [userId]);

  return { socketClient, isConnected };
}

export function useActionLifecycle(actionId: string | null) {
  const [lifecycle, setLifecycle] = useState<ActionLifecycle | null>(
    actionId ? socketClient.getAction(actionId) ?? null : null
  );

  useEffect(() => {
    if (!actionId) return;

    const unsubStart = socketClient.on(REALTIME_EVENTS.ACTION_STARTED, (data: any) => {
      if (data.id === actionId) setLifecycle({ ...data });
    });

    const unsubComplete = socketClient.on(REALTIME_EVENTS.ACTION_COMPLETED, (data: any) => {
      if (data.id === actionId) setLifecycle({ ...data });
    });

    return () => {
      unsubStart();
      unsubComplete();
    };
  }, [actionId]);

  return lifecycle;
}
