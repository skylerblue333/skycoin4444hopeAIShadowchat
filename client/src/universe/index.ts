/**
 * UNIVERSE UI REGISTRY
 *
 * Every feature in ShadowChat is a module in this registry.
 * This is what makes it a "world system" — not a collection of pages.
 *
 * Architecture:
 *   WorldProvider (world state: entities, feed, wallet, trends)
 *     └── EventProvider (real-time event bus: actions, notifications, chat)
 *           └── AppShell (module router + OS shell)
 *                 └── [feed | chat | dating | wallet | actions | ...]
 */

// ─── Module Registry ─────────────────────────────────────────────────────────

export type UniverseModule =
  | "feed"
  | "chat"
  | "dating"
  | "wallet"
  | "actions"
  | "marketplace"
  | "ai"
  | "profile"
  | "simulation"
  | "notifications"
  | "streaming"
  | "communities"
  | "staking"
  | "tournaments"
  | "charity";

export const UNIVERSE_MODULES: UniverseModule[] = [
  "feed",
  "chat",
  "dating",
  "wallet",
  "actions",
  "marketplace",
  "ai",
  "profile",
  "simulation",
  "notifications",
  "streaming",
  "communities",
  "staking",
  "tournaments",
  "charity",
];

// Module metadata — routes, icons, tier, and monetization flag
export interface ModuleMeta {
  id: UniverseModule;
  label: string;
  route: string;
  tier: 1 | 2 | 3;         // 1=core loop, 2=growth, 3=ecosystem
  monetized: boolean;
  description: string;
}

export const MODULE_REGISTRY: Record<UniverseModule, ModuleMeta> = {
  feed:          { id: "feed",          label: "Feed",          route: "/feed",          tier: 1, monetized: false, description: "Discovery layer — AI-ranked social stream" },
  chat:          { id: "chat",          label: "Chat",          route: "/chat",          tier: 1, monetized: true,  description: "Execution layer — chat triggers actions" },
  actions:       { id: "actions",       label: "Actions",       route: "/actions",       tier: 1, monetized: true,  description: "Action OS — cost→impact→result engine" },
  wallet:        { id: "wallet",        label: "Wallet",        route: "/wallet",        tier: 1, monetized: true,  description: "Economic layer — balance, tips, escrow" },
  dating:        { id: "dating",        label: "Dating",        route: "/dating",        tier: 2, monetized: true,  description: "Match Space — AI compatibility graph" },
  profile:       { id: "profile",       label: "Profile",       route: "/profile",       tier: 2, monetized: false, description: "Identity layer — trust, reputation, earnings" },
  notifications: { id: "notifications", label: "Notifications", route: "/notifications", tier: 2, monetized: false, description: "Event layer — real-time alerts" },
  marketplace:   { id: "marketplace",   label: "Marketplace",   route: "/marketplace",   tier: 3, monetized: true,  description: "Economy layer — listings, escrow, payouts" },
  ai:            { id: "ai",            label: "AI Agents",     route: "/ai-agents",     tier: 3, monetized: true,  description: "Agent market — pay-per-use AI workers" },
  simulation:    { id: "simulation",    label: "World Brain",   route: "/world-brain",   tier: 3, monetized: false, description: "Simulation engine — rule-based world loop" },
  streaming:     { id: "streaming",     label: "Streaming",     route: "/streaming",     tier: 3, monetized: true,  description: "Live streams — VOD, clips, gifting" },
  communities:   { id: "communities",   label: "Communities",   route: "/communities",   tier: 3, monetized: false, description: "Group layer — channels, DAOs, forums" },
  staking:       { id: "staking",       label: "Staking",       route: "/staking",       tier: 3, monetized: true,  description: "DeFi layer — SKY444 yield, governance" },
  tournaments:   { id: "tournaments",   label: "Tournaments",   route: "/tournaments",   tier: 3, monetized: true,  description: "Competition layer — prizes, leaderboards" },
  charity:       { id: "charity",       label: "Charity",       route: "/charity",       tier: 3, monetized: false, description: "Impact layer — verified campaigns, donors" },
};

// Tier groupings for navigation
export const TIER_1_MODULES = UNIVERSE_MODULES.filter(m => MODULE_REGISTRY[m].tier === 1);
export const TIER_2_MODULES = UNIVERSE_MODULES.filter(m => MODULE_REGISTRY[m].tier === 2);
export const TIER_3_MODULES = UNIVERSE_MODULES.filter(m => MODULE_REGISTRY[m].tier === 3);
