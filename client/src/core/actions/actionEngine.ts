/**
 * actionEngine.ts — The Core OS Intelligence Layer
 *
 * Chat → AI Interpretation → Action Selection → Execution → UI Update
 *
 * Every message in ShadowChat is parsed through this engine.
 * The engine detects intent, routes to the correct handler,
 * executes the action, and formats the response.
 *
 * Action types: PAYMENT | TIP | REQUEST_SERVICE | CREATE_LISTING |
 *               MATCH_USER | CALL_AI_AGENT | SCHEDULE_EVENT |
 *               SWAP_TOKEN | STAKE_TOKEN | SUBSCRIBE | CREATE_POST | PLAIN_TEXT
 */

import {
  ACTION_TYPES,
  ACTION_META,
  type ActionType,
  type ActionPayload,
  type ParsedIntent,
  type ActionResult,
  type PaymentPayload,
  type TipPayload,
  type RequestServicePayload,
  type CreateListingPayload,
  type MatchUserPayload,
  type CallAIAgentPayload,
  type ScheduleEventPayload,
  type SwapTokenPayload,
  type StakeTokenPayload,
  type SubscribePayload,
} from "./actionTypes";

// ─── Intent Pattern Registry ──────────────────────────────────────────────────

interface IntentPattern {
  pattern: RegExp;
  type: ActionType;
  confidence: number;
  extract: (match: RegExpMatchArray, text: string) => ActionPayload;
  confirmationPrompt: (payload: ActionPayload) => string;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // PAYMENT — "pay $20", "send 50 sky to @alice", "transfer 100"
  {
    pattern: /(?:pay|send|transfer)\s+(?:\$|usd|sky|skycoin)?\s*(\d+(?:\.\d+)?)\s*(?:sky|usd|skycoin)?\s*(?:to\s+@?(\w+))?(?:\s+for\s+(.+))?/i,
    type: ACTION_TYPES.PAYMENT,
    confidence: 0.92,
    extract: (m): PaymentPayload => ({
      type: "PAYMENT",
      amount: parseFloat(m[1]),
      currency: "SKY",
      to: m[2] || undefined,
      reason: m[3] || undefined,
    }),
    confirmationPrompt: (p) => {
      const pp = p as PaymentPayload;
      return `Send ${pp.amount} SKY${pp.to ? ` to @${pp.to}` : ""}${pp.reason ? ` for "${pp.reason}"` : ""}?`;
    },
  },

  // TIP — "tip @alice 10", "tip 25 sky"
  {
    pattern: /(?:tip|give\s+a\s+tip\s+to|reward)\s+@?(\w+)\s+(?:\$|sky)?\s*(\d+(?:\.\d+)?)|(?:tip|give)\s+(?:\$|sky)?\s*(\d+(?:\.\d+)?)\s+(?:to\s+)?@?(\w+)/i,
    type: ACTION_TYPES.TIP,
    confidence: 0.9,
    extract: (m): TipPayload => ({
      type: "TIP",
      to: m[1] || m[4] || "creator",
      amount: parseFloat(m[2] || m[3]),
    }),
    confirmationPrompt: (p) => {
      const tp = p as TipPayload;
      return `Tip @${tp.to} ${tp.amount} SKY?`;
    },
  },

  // REQUEST_SERVICE — "I need a designer", "find me a developer for $200"
  {
    pattern: /(?:i\s+need|find\s+me|hire|looking\s+for|get\s+me)\s+(?:a\s+)?(?:good\s+)?(\w+(?:\s+\w+)?)\s*(?:for\s+(?:\$|sky)?\s*(\d+))?/i,
    type: ACTION_TYPES.REQUEST_SERVICE,
    confidence: 0.78,
    extract: (m, text): RequestServicePayload => ({
      type: "REQUEST_SERVICE",
      serviceType: m[1],
      budget: m[2] ? parseFloat(m[2]) : undefined,
      description: text,
    }),
    confirmationPrompt: (p) => {
      const rp = p as RequestServicePayload;
      return `Find a ${rp.serviceType}${rp.budget ? ` for ${rp.budget} SKY` : ""}?`;
    },
  },

  // CREATE_LISTING — "list my logo for 50 sky", "sell template for $30"
  {
    pattern: /(?:list|sell|create\s+listing\s+for|post\s+for\s+sale)\s+(?:my\s+)?(.+?)\s+for\s+(?:\$|sky)?\s*(\d+(?:\.\d+)?)/i,
    type: ACTION_TYPES.CREATE_LISTING,
    confidence: 0.88,
    extract: (m): CreateListingPayload => ({
      type: "CREATE_LISTING",
      title: m[1],
      price: parseFloat(m[2]),
      description: m[1],
    }),
    confirmationPrompt: (p) => {
      const cl = p as CreateListingPayload;
      return `Create listing "${cl.title}" for ${cl.price} SKY?`;
    },
  },

  // MATCH_USER — "match me with a designer", "connect me with someone who knows React"
  {
    pattern: /(?:match\s+me|connect\s+me|find\s+someone|introduce\s+me)\s+(?:with\s+)?(?:a\s+)?(.+?)(?:\s+who\s+(.+))?$/i,
    type: ACTION_TYPES.MATCH_USER,
    confidence: 0.75,
    extract: (m, text): MatchUserPayload => ({
      type: "MATCH_USER",
      criteria: text,
      skills: m[2] ? [m[2]] : undefined,
    }),
    confirmationPrompt: () => "Find a matching user for you?",
  },

  // CALL_AI_AGENT — "ask AI to", "have NOVA", "run agent"
  {
    pattern: /(?:ask\s+(?:ai|nova|the\s+ai)|have\s+(?:ai|nova)|run\s+(?:an?\s+)?agent|ai\s+(?:please|can\s+you)?)\s+(.+)/i,
    type: ACTION_TYPES.CALL_AI_AGENT,
    confidence: 0.85,
    extract: (m): CallAIAgentPayload => ({
      type: "CALL_AI_AGENT",
      task: m[1],
    }),
    confirmationPrompt: (p) => {
      const ap = p as CallAIAgentPayload;
      return `Run AI task: "${ap.task}"?`;
    },
  },

  // SCHEDULE_EVENT — "schedule a call", "set up a meeting"
  {
    pattern: /(?:schedule|set\s+up|create|plan)\s+(?:a\s+)?(?:meeting|call|event|stream|session|interview)\s*(?:with\s+@?(\w+))?(?:\s+(?:on|at)\s+(.+))?/i,
    type: ACTION_TYPES.SCHEDULE_EVENT,
    confidence: 0.82,
    extract: (m, text): ScheduleEventPayload => ({
      type: "SCHEDULE_EVENT",
      title: text,
      participants: m[1] ? [m[1]] : undefined,
      datetime: m[2] || undefined,
    }),
    confirmationPrompt: () => "Schedule this event?",
  },

  // SWAP_TOKEN — "swap 100 sky for eth", "exchange 50 usdc to sky"
  {
    pattern: /(?:swap|exchange|trade|convert)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to|into)\s+(\w+)/i,
    type: ACTION_TYPES.SWAP_TOKEN,
    confidence: 0.93,
    extract: (m): SwapTokenPayload => ({
      type: "SWAP_TOKEN",
      amount: parseFloat(m[1]),
      fromToken: m[2].toUpperCase(),
      toToken: m[3].toUpperCase(),
    }),
    confirmationPrompt: (p) => {
      const sp = p as SwapTokenPayload;
      return `Swap ${sp.amount} ${sp.fromToken} → ${sp.toToken}?`;
    },
  },

  // STAKE_TOKEN — "stake 500 sky", "lock 1000 tokens"
  {
    pattern: /(?:stake|lock|deposit)\s+(\d+(?:\.\d+)?)\s*(?:sky|tokens?|skycoin)?/i,
    type: ACTION_TYPES.STAKE_TOKEN,
    confidence: 0.9,
    extract: (m): StakeTokenPayload => ({
      type: "STAKE_TOKEN",
      token: "SKY",
      amount: parseFloat(m[1]),
    }),
    confirmationPrompt: (p) => {
      const sp = p as StakeTokenPayload;
      return `Stake ${sp.amount} SKY for rewards?`;
    },
  },

  // SUBSCRIBE — "subscribe to @alice", "join @creator premium"
  {
    pattern: /(?:subscribe|follow|join)\s+(?:to\s+)?@?(\w+)(?:\s+(?:premium|pro|plus))?/i,
    type: ACTION_TYPES.SUBSCRIBE,
    confidence: 0.8,
    extract: (m): SubscribePayload => ({
      type: "SUBSCRIBE",
      target: m[1],
    }),
    confirmationPrompt: (p) => {
      const sp = p as SubscribePayload;
      return `Subscribe to @${sp.target}?`;
    },
  },
];

// ─── Core Intent Parser ───────────────────────────────────────────────────────

/**
 * parseIntent — fast synchronous regex-based intent detection
 * Returns the highest-confidence match or PLAIN_TEXT fallback
 */
export function parseIntent(message: string): ParsedIntent {
  const text = message.trim();
  if (!text) {
    return {
      type: ACTION_TYPES.PLAIN_TEXT,
      confidence: 1,
      payload: { type: "PLAIN_TEXT", content: text },
      displayLabel: "",
      requiresConfirmation: false,
    };
  }

  let bestMatch: ParsedIntent | null = null;

  for (const pattern of INTENT_PATTERNS) {
    const match = text.match(pattern.pattern);
    if (match && pattern.confidence > (bestMatch?.confidence ?? 0)) {
      const payload = pattern.extract(match, text);
      const meta = ACTION_META[pattern.type];
      bestMatch = {
        type: pattern.type,
        confidence: pattern.confidence,
        payload,
        displayLabel: meta.label,
        requiresConfirmation: meta.requiresWallet,
        confirmationPrompt: pattern.confirmationPrompt(payload),
      };
    }
  }

  if (bestMatch && bestMatch.confidence >= 0.75) {
    return bestMatch;
  }

  return {
    type: ACTION_TYPES.PLAIN_TEXT,
    confidence: 1,
    payload: { type: "PLAIN_TEXT", content: text },
    displayLabel: "",
    requiresConfirmation: false,
  };
}

// ─── Action Router ────────────────────────────────────────────────────────────

/**
 * routeAction — maps action type to the correct handler URL/procedure
 */
export function routeAction(type: ActionType): { procedure: string; route?: string } {
  const routes: Record<ActionType, { procedure: string; route?: string }> = {
    PAYMENT: { procedure: "wallet.send", route: "/wallet" },
    TIP: { procedure: "wallet.send", route: "/wallet" },
    REQUEST_SERVICE: { procedure: "marketplace.createRequest", route: "/marketplace" },
    CREATE_LISTING: { procedure: "marketplace.createListing", route: "/marketplace" },
    MATCH_USER: { procedure: "social.findMatch", route: "/social" },
    CALL_AI_AGENT: { procedure: "ai.chat", route: "/ai-engineer" },
    SCHEDULE_EVENT: { procedure: "stream.scheduleEvent", route: "/streaming" },
    SWAP_TOKEN: { procedure: "token.swap", route: "/token-swap" },
    STAKE_TOKEN: { procedure: "token.stake", route: "/staking" },
    SUBSCRIBE: { procedure: "creator.subscribe", route: "/subscriptions" },
    CREATE_POST: { procedure: "feed.createPost", route: "/social" },
    PLAIN_TEXT: { procedure: "dm.send" },
  };
  return routes[type] || { procedure: "dm.send" };
}

// ─── Response Formatter ───────────────────────────────────────────────────────

/**
 * formatActionResponse — generates the AI response message for a completed action
 */
export function formatActionResponse(result: ActionResult): string {
  if (!result.success) {
    return `❌ Action failed: ${result.message}`;
  }

  const responses: Partial<Record<ActionType, string>> = {
    PAYMENT: `✅ Payment sent! TX: ${result.txHash?.slice(0, 12)}...`,
    TIP: `💜 Tip delivered! They'll love it.`,
    REQUEST_SERVICE: `🔍 I'm searching for the best match for your request...`,
    CREATE_LISTING: `📦 Listing created! It's live in the marketplace.`,
    MATCH_USER: `👥 Found ${result.data?.count ?? "some"} matching users for you.`,
    CALL_AI_AGENT: `🤖 Agent activated. ${result.message}`,
    SCHEDULE_EVENT: `📅 Event scheduled! Invites sent.`,
    SWAP_TOKEN: `🔄 Swap executed! TX: ${result.txHash?.slice(0, 12)}...`,
    STAKE_TOKEN: `🔒 Tokens staked! Earning rewards now.`,
    SUBSCRIBE: `⭐ Subscribed! You now have access to premium content.`,
    CREATE_POST: `📝 Post published to your feed.`,
    PLAIN_TEXT: result.message,
  };

  return responses[result.actionType] || result.message;
}

// ─── Action Executor (client-side orchestration) ──────────────────────────────

/**
 * executeAction — client-side action orchestration
 * Calls the appropriate tRPC mutation and returns a result
 * The actual mutation calls happen in the component via tRPC hooks
 */
export function buildExecutionContext(intent: ParsedIntent): {
  procedure: string;
  input: Record<string, unknown>;
  displayMessage: string;
} {
  const route = routeAction(intent.type);

  switch (intent.type) {
    case ACTION_TYPES.PAYMENT:
    case ACTION_TYPES.TIP: {
      const p = intent.payload as PaymentPayload | TipPayload;
      return {
        procedure: route.procedure,
        input: {
          to: "to" in p ? p.to : undefined,
          amount: p.amount,
          token: "SKY444",
          description: intent.confirmationPrompt,
        },
        displayMessage: intent.confirmationPrompt || intent.displayLabel,
      };
    }
    case ACTION_TYPES.CALL_AI_AGENT: {
      const p = intent.payload as CallAIAgentPayload;
      return {
        procedure: route.procedure,
        input: { message: p.task },
        displayMessage: `Running AI task: ${p.task}`,
      };
    }
    default:
      return {
        procedure: route.procedure,
        input: intent.payload as unknown as Record<string, unknown>,
        displayMessage: intent.displayLabel || intent.confirmationPrompt || "Executing...",
      };
  }
}

// ─── Confirmation Formatter (re-export for backward compat) ─────────────────
export function formatActionConfirmation(intent: ParsedIntent): string {
  return intent.confirmationPrompt || intent.displayLabel;
}

// ─── Quick Action Suggestions ─────────────────────────────────────────────────

/**
 * getSuggestions — returns contextual quick action suggestions
 * based on conversation context
 */
export function getSuggestions(context: { hasRecipient: boolean; userBalance: number }): Array<{
  label: string;
  type: ActionType;
  icon: string;
}> {
  const suggestions = [];

  if (context.hasRecipient && context.userBalance > 0) {
    suggestions.push({ label: "Send Tip", type: ACTION_TYPES.TIP, icon: "Heart" });
    suggestions.push({ label: "Send Payment", type: ACTION_TYPES.PAYMENT, icon: "ArrowUpRight" });
  }

  suggestions.push({ label: "Hire AI Agent", type: ACTION_TYPES.CALL_AI_AGENT, icon: "Bot" });
  suggestions.push({ label: "Request Service", type: ACTION_TYPES.REQUEST_SERVICE, icon: "ShoppingBag" });
  suggestions.push({ label: "Create Listing", type: ACTION_TYPES.CREATE_LISTING, icon: "PlusCircle" });

  return suggestions;
}
