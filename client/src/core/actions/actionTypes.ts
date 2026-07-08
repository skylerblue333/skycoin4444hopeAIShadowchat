/**
 * actionTypes.ts — Canonical Action Type System
 * Every user interaction in ShadowChat maps to one of these action types.
 * Chat is the OS. These are the OS commands.
 */

// ─── Action Types ─────────────────────────────────────────────────────────────

export const ACTION_TYPES = {
  PAYMENT: "PAYMENT",
  TIP: "TIP",
  REQUEST_SERVICE: "REQUEST_SERVICE",
  CREATE_LISTING: "CREATE_LISTING",
  MATCH_USER: "MATCH_USER",
  CALL_AI_AGENT: "CALL_AI_AGENT",
  SCHEDULE_EVENT: "SCHEDULE_EVENT",
  SWAP_TOKEN: "SWAP_TOKEN",
  STAKE_TOKEN: "STAKE_TOKEN",
  SUBSCRIBE: "SUBSCRIBE",
  CREATE_POST: "CREATE_POST",
  PLAIN_TEXT: "PLAIN_TEXT",
} as const;

export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];

// ─── Action Payloads ──────────────────────────────────────────────────────────

export interface PaymentPayload {
  type: "PAYMENT";
  amount: number;
  currency: string;
  to?: string;
  reason?: string;
}

export interface TipPayload {
  type: "TIP";
  amount: number;
  to: string;
  message?: string;
}

export interface RequestServicePayload {
  type: "REQUEST_SERVICE";
  serviceType: string;
  budget?: number;
  description: string;
  deadline?: string;
}

export interface CreateListingPayload {
  type: "CREATE_LISTING";
  title: string;
  price: number;
  description: string;
  category?: string;
}

export interface MatchUserPayload {
  type: "MATCH_USER";
  criteria: string;
  skills?: string[];
  budget?: number;
}

export interface CallAIAgentPayload {
  type: "CALL_AI_AGENT";
  agentId?: string;
  task: string;
  context?: Record<string, unknown>;
}

export interface ScheduleEventPayload {
  type: "SCHEDULE_EVENT";
  title: string;
  datetime?: string;
  participants?: string[];
  description?: string;
}

export interface SwapTokenPayload {
  type: "SWAP_TOKEN";
  fromToken: string;
  toToken: string;
  amount: number;
}

export interface StakeTokenPayload {
  type: "STAKE_TOKEN";
  token: string;
  amount: number;
  duration?: number;
}

export interface SubscribePayload {
  type: "SUBSCRIBE";
  target: string;
  tier?: string;
}

export interface CreatePostPayload {
  type: "CREATE_POST";
  content: string;
  media?: string[];
  community?: string;
}

export interface PlainTextPayload {
  type: "PLAIN_TEXT";
  content: string;
}

export type ActionPayload =
  | PaymentPayload
  | TipPayload
  | RequestServicePayload
  | CreateListingPayload
  | MatchUserPayload
  | CallAIAgentPayload
  | ScheduleEventPayload
  | SwapTokenPayload
  | StakeTokenPayload
  | SubscribePayload
  | CreatePostPayload
  | PlainTextPayload;

// ─── Action Result ────────────────────────────────────────────────────────────

export interface ActionResult {
  success: boolean;
  actionType: ActionType;
  txHash?: string;
  message: string;
  data?: Record<string, unknown>;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
}

// ─── Parsed Intent (from AI or regex) ────────────────────────────────────────

export interface ParsedIntent {
  type: ActionType;
  confidence: number; // 0–1
  payload: ActionPayload;
  displayLabel: string;
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
}

// ─── Real-Time Events ─────────────────────────────────────────────────────────

export const REALTIME_EVENTS = {
  MESSAGE_NEW: "message:new",
  ACTION_STARTED: "action:started",
  ACTION_COMPLETED: "action:completed",
  PAYMENT_CONFIRMED: "payment:confirmed",
  AI_RESPONSE: "ai:response",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
} as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

// ─── Action Metadata (for UI rendering) ──────────────────────────────────────

export const ACTION_META: Record<ActionType, { label: string; icon: string; color: string; bg: string; requiresWallet: boolean }> = {
  PAYMENT: { label: "Send Payment", icon: "ArrowUpRight", color: "text-red-400", bg: "bg-red-500/10", requiresWallet: true },
  TIP: { label: "Send Tip", icon: "Heart", color: "text-pink-400", bg: "bg-pink-500/10", requiresWallet: true },
  REQUEST_SERVICE: { label: "Request Service", icon: "ShoppingBag", color: "text-blue-400", bg: "bg-blue-500/10", requiresWallet: false },
  CREATE_LISTING: { label: "Create Listing", icon: "PlusCircle", color: "text-cyan-400", bg: "bg-cyan-500/10", requiresWallet: false },
  MATCH_USER: { label: "Find Match", icon: "Users", color: "text-rose-400", bg: "bg-rose-500/10", requiresWallet: false },
  CALL_AI_AGENT: { label: "Call AI Agent", icon: "Bot", color: "text-purple-400", bg: "bg-purple-500/10", requiresWallet: false },
  SCHEDULE_EVENT: { label: "Schedule Event", icon: "Calendar", color: "text-indigo-400", bg: "bg-indigo-500/10", requiresWallet: false },
  SWAP_TOKEN: { label: "Swap Token", icon: "ArrowLeftRight", color: "text-yellow-400", bg: "bg-yellow-500/10", requiresWallet: true },
  STAKE_TOKEN: { label: "Stake Token", icon: "Layers", color: "text-orange-400", bg: "bg-orange-500/10", requiresWallet: true },
  SUBSCRIBE: { label: "Subscribe", icon: "Star", color: "text-yellow-300", bg: "bg-yellow-400/10", requiresWallet: true },
  CREATE_POST: { label: "Create Post", icon: "PenSquare", color: "text-green-400", bg: "bg-green-500/10", requiresWallet: false },
  PLAIN_TEXT: { label: "Message", icon: "MessageSquare", color: "text-muted-foreground", bg: "bg-secondary/30", requiresWallet: false },
};
