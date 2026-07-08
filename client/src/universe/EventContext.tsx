/**
 * EventContext — Real-Time Event Bus Provider
 *
 * Provides a lightweight client-side event bus for:
 * - Action lifecycle events (PENDING → COMPLETED → FAILED)
 * - Notification events
 * - Chat message events
 * - World simulation events
 *
 * Architecture:
 *   EventProvider wraps the app
 *   Components subscribe via useEvent(type, handler)
 *   Components emit via emitEvent(type, payload)
 *
 * This is deterministic — no AI required.
 * AI events are a subtype that can be added later.
 */
import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import type { ParsedIntent } from "../core/actions/actionTypes";

// ─── Event Types ─────────────────────────────────────────────────────────────

export type AppEventType =
  | "action:started"
  | "action:completed"
  | "action:failed"
  | "action:cancelled"
  | "payment:confirmed"
  | "payment:failed"
  | "chat:message"
  | "chat:typing"
  | "notification:new"
  | "notification:read"
  | "feed:update"
  | "world:tick"
  | "world:trend"
  | "match:new"
  | "match:accepted"
  | "wallet:credit"
  | "wallet:debit"
  | "ai:response"
  | "ai:suggestion"
  | "voice:command";

export interface AppEvent<T = unknown> {
  id: string;
  type: AppEventType;
  payload: T;
  timestamp: number;
  source?: string;
}

type EventHandler<T = unknown> = (event: AppEvent<T>) => void;

interface EventBus {
  emit: <T>(type: AppEventType, payload: T, source?: string) => void;
  subscribe: <T>(type: AppEventType, handler: EventHandler<T>) => () => void;
  subscribeAll: (handler: EventHandler) => () => void;
  getHistory: (type?: AppEventType, limit?: number) => AppEvent[];
}

// ─── Context ─────────────────────────────────────────────────────────────────

const EventContext = createContext<EventBus | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef<Map<AppEventType | "*", Set<EventHandler>>>(new Map());
  const historyRef = useRef<AppEvent[]>([]);

  const emit = <T,>(type: AppEventType, payload: T, source?: string) => {
    const event: AppEvent<T> = {
      id: `evt-${Date.now()}-${(Math.random()).toString(36).slice(2, 7)}`,
      type,
      payload,
      timestamp: Date.now(),
      source,
    };

    // Store in history (keep last 100)
    historyRef.current = [event, ...historyRef.current].slice(0, 100);

    // Notify type-specific listeners
    const typeListeners = listenersRef.current.get(type);
    typeListeners?.forEach(handler => {
      try { handler(event as AppEvent); } catch (e) {  }
    });

    // Notify wildcard listeners
    const allListeners = listenersRef.current.get("*");
    allListeners?.forEach(handler => {
      try { handler(event as AppEvent); } catch (e) {  }
    });
  };

  const subscribe = <T,>(type: AppEventType, handler: EventHandler<T>): (() => void) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(handler as EventHandler);
    return () => {
      listenersRef.current.get(type)?.delete(handler as EventHandler);
    };
  };

  const subscribeAll = (handler: EventHandler): (() => void) => {
    if (!listenersRef.current.has("*")) {
      listenersRef.current.set("*", new Set());
    }
    listenersRef.current.get("*")!.add(handler);
    return () => {
      listenersRef.current.get("*")?.delete(handler);
    };
  };

  const getHistory = (type?: AppEventType, limit = 20): AppEvent[] => {
    const filtered = type
      ? historyRef.current.filter(e => e.type === type)
      : historyRef.current;
    return filtered.slice(0, limit);
  };

  const bus: EventBus = { emit, subscribe, subscribeAll, getHistory };

  return (
    <EventContext.Provider value={bus}>
      {children}
    </EventContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useEventBus(): EventBus {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEventBus must be used within EventProvider");
  return ctx;
}

export function useEvent<T = unknown>(
  type: AppEventType,
  handler: EventHandler<T>,
  deps: unknown[] = []
) {
  const bus = useEventBus();
  useEffect(() => {
    return bus.subscribe(type, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, ...deps]);
}

export function useEmit() {
  const bus = useEventBus();
  return bus.emit;
}
