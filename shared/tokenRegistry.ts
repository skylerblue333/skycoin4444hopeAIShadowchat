/**
 * SKYCOIN4444 Token Registry
 *
 * Single source of truth for all in-platform ecosystem tokens.
 * All systems (swap, stake, burn, tip, mining, marketplace, governance)
 * read from this registry instead of hard-coding token names.
 *
 * These are INTERNAL ECOSYSTEM TOKENS — not real on-chain assets.
 * No private keys, no custody, no blockchain integration.
 */

export type TokenRole =
  | "core"        // SKY4  — primary ecosystem token
  | "community"   // DOGE  — community engagement & tipping
  | "governance"  // TRUMP — governance voting & community decisions
  | "charity"     // CHARITY — charitable giving & impact rewards
  | "progression" // XP    — user progression & leveling
  | "creator"     // CREATOR — creator economy rewards
  | "premium";    // GOLD  — premium features & marketplace

export interface TokenDefinition {
  /** Canonical symbol used in token_balances.token column */
  symbol: string;
  /** Full display name */
  name: string;
  /** Short tagline */
  tagline: string;
  /** Role in the ecosystem */
  role: TokenRole;
  /** Tailwind / CSS color class for UI theming */
  color: string;
  /** Hex color for charts / badges */
  hex: string;
  /** Lucide icon name (string so frontend can resolve dynamically) */
  icon: string;
  /** Emoji shorthand for compact display */
  emoji: string;
  /** Whether this token can be staked */
  stakeable: boolean;
  /** Whether this token can be burned */
  burnable: boolean;
  /** Whether this token can be tipped between users */
  tippable: boolean;
  /** Whether this token is used in governance voting */
  govWeight: number; // 0 = no vote, 1 = standard, 2 = double weight
  /** Whether this token can be mined / earned via activity */
  earnable: boolean;
  /** Whether this token appears in the swap interface */
  swappable: boolean;
  /** Initial airdrop amount for new users (0 = none) */
  newUserAirdrop: number;
  /** Description for UI tooltips */
  description: string;
}

export const TOKEN_REGISTRY: TokenDefinition[] = [
  {
    symbol: "SKY4",
    name: "SKYCOIN4444",
    tagline: "Core Ecosystem Token",
    role: "core",
    color: "text-amber-400",
    hex: "#F59E0B",
    icon: "Coins",
    emoji: "🪙",
    stakeable: true,
    burnable: true,
    tippable: true,
    govWeight: 1,
    earnable: true,
    swappable: true,
    newUserAirdrop: 100,
    description:
      "The primary token powering the SKYCOIN4444 ecosystem. Used for staking, governance, marketplace, and all core platform activities.",
  },
  {
    symbol: "DOGE",
    name: "DOGE",
    tagline: "Community Token",
    role: "community",
    color: "text-yellow-300",
    hex: "#FDE047",
    icon: "Heart",
    emoji: "🐕",
    stakeable: false,
    burnable: false,
    tippable: true,
    govWeight: 0,
    earnable: true,
    swappable: true,
    newUserAirdrop: 50,
    description:
      "The community spirit token. Tip creators, reward great content, and celebrate community wins. Approved by Genesis Vote #001.",
  },
  {
    symbol: "TRUMP",
    name: "TRUMP",
    tagline: "Governance & Community Token",
    role: "governance",
    color: "text-red-400",
    hex: "#F87171",
    icon: "Vote",
    emoji: "🗳️",
    stakeable: true,
    burnable: false,
    tippable: true,
    govWeight: 2,
    earnable: false,
    swappable: true,
    newUserAirdrop: 10,
    description:
      "The governance token with double voting weight. Hold TRUMP to amplify your voice in ecosystem decisions. Approved by Genesis Vote #001.",
  },
  {
    symbol: "CHARITY",
    name: "CharityCoin",
    tagline: "Impact & Giving Token",
    role: "charity",
    color: "text-green-400",
    hex: "#4ADE80",
    icon: "HandHeart",
    emoji: "💚",
    stakeable: false,
    burnable: true,
    tippable: true,
    govWeight: 0,
    earnable: true,
    swappable: false,
    newUserAirdrop: 25,
    description:
      "Earned through charitable actions and community contributions. Burn CHARITY to trigger real-world donations.",
  },
  {
    symbol: "XP",
    name: "Experience Points",
    tagline: "Progression Token",
    role: "progression",
    color: "text-blue-400",
    hex: "#60A5FA",
    icon: "Star",
    emoji: "⭐",
    stakeable: false,
    burnable: false,
    tippable: false,
    govWeight: 0,
    earnable: true,
    swappable: false,
    newUserAirdrop: 0,
    description:
      "Earned through learning, completing missions, and platform activity. Drives your level and unlocks features.",
  },
  {
    symbol: "CREATOR",
    name: "Creator Token",
    tagline: "Creator Economy Reward",
    role: "creator",
    color: "text-purple-400",
    hex: "#C084FC",
    icon: "Palette",
    emoji: "🎨",
    stakeable: false,
    burnable: false,
    tippable: true,
    govWeight: 0,
    earnable: true,
    swappable: true,
    newUserAirdrop: 0,
    description:
      "Earned by creators through content, courses, and community building. Redeemable in the creator marketplace.",
  },
  {
    symbol: "GOLD",
    name: "Gold",
    tagline: "Premium Access Token",
    role: "premium",
    color: "text-yellow-500",
    hex: "#EAB308",
    icon: "Crown",
    emoji: "👑",
    stakeable: true,
    burnable: false,
    tippable: false,
    govWeight: 0,
    earnable: false,
    swappable: true,
    newUserAirdrop: 0,
    description:
      "Premium access token. Hold GOLD to unlock exclusive features, premium AI models, and VIP marketplace access.",
  },
];

/** Look up a token definition by symbol (case-insensitive) */
export function getToken(symbol: string): TokenDefinition | undefined {
  return TOKEN_REGISTRY.find(
    (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
  );
}

/** All symbols that can appear in token_balances */
export const ALL_TOKEN_SYMBOLS = TOKEN_REGISTRY.map((t) => t.symbol);

/** Tokens that can be swapped */
export const SWAPPABLE_TOKENS = TOKEN_REGISTRY.filter((t) => t.swappable);

/** Tokens that can be staked */
export const STAKEABLE_TOKENS = TOKEN_REGISTRY.filter((t) => t.stakeable);

/** Tokens that can be tipped */
export const TIPPABLE_TOKENS = TOKEN_REGISTRY.filter((t) => t.tippable);

/** Tokens that carry governance voting weight */
export const GOV_TOKENS = TOKEN_REGISTRY.filter((t) => t.govWeight > 0);
