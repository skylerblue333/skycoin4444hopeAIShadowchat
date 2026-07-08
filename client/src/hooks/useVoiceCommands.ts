/**
 * GLOBAL VOICE COMMAND SYSTEM
 * ════════════════════════════════════════════════════════════════
 * Supports navigation to all 44 platform areas + crypto actions:
 * stake, unstake, burn, swap, trade, buy, sell, ICO, wallet connect
 * Social: post, like, follow, DM, search
 * Platform: dashboard, settings, admin, logout
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export interface VoiceCommand {
  patterns: string[];
  action: (match: RegExpMatchArray | null, transcript: string) => void;
  description: string;
  category: "navigation" | "crypto" | "social" | "platform" | "gaming" | "ai";
  example: string;
}

export interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  lastCommand: string | null;
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════
// ROUTE MAP — all 44 areas
// ═══════════════════════════════════════════════════════════════
const ROUTE_MAP: Record<string, string> = {
  // Social
  "social": "/social",
  "feed": "/social",
  "home": "/",
  "explore": "/explore",
  "stories": "/stories",
  "messages": "/messages",
  "dms": "/messages",
  "direct messages": "/messages",
  "notifications": "/notifications",
  "profile": "/profile",
  "creator": "/creator",
  "creator studio": "/creator",
  "streaming": "/streaming",
  "live": "/streaming",
  "stream": "/streaming",
  // Crypto / DeFi
  "crypto": "/crypto",
  "wallet": "/wallet",
  "token": "/token",
  "sky444": "/token",
  "skycoin": "/token",
  "swap": "/swap",
  "token swap": "/swap",
  "staking": "/staking",
  "stake": "/staking",
  "farming": "/farming",
  "yield farming": "/farming",
  "trading": "/trading",
  "trade": "/trading",
  "day trade": "/day-trade",
  "trading terminal": "/trading-terminal",
  "ai trading": "/ai-trading",
  "ico": "/token",
  "launchpad": "/token",
  // Community
  "community": "/community",
  "governance": "/governance",
  "dao": "/governance",
  "vote": "/governance",
  "charity": "/charity",
  "leaderboards": "/leaderboards",
  "leaderboard": "/leaderboards",
  "tournaments": "/tournaments",
  "tournament": "/tournaments",
  "guilds": "/guilds",
  // Gaming
  "gaming": "/gaming",
  "games": "/gaming",
  "arcade": "/arcade",
  "play": "/arcade",
  // AI
  "ai engineer": "/ai-engineer",
  "ai brain": "/ai-brain",
  "hope ai": "/hope-ai",
  "analytics": "/analytics",
  "dashboard": "/dashboard",
  // Platform
  "marketplace": "/marketplace",
  "market": "/marketplace",
  "school": "/school",
  "learn": "/school",
  "settings": "/settings",
  "admin": "/admin",
  "search": "/search",
  "ecosystem": "/ecosystem",
  "features": "/features",
  "security": "/security",
  "investor": "/investor",
};

// ═══════════════════════════════════════════════════════════════
// COMMAND REGISTRY
// ═══════════════════════════════════════════════════════════════
export function buildCommands(
  navigate: (path: string) => void,
  callbacks: {
    onSearch?: (query: string) => void;
    onStake?: (amount?: number) => void;
    onSwap?: (from?: string, to?: string, amount?: number) => void;
    onBurn?: (amount?: number) => void;
    onTrade?: (action: "buy" | "sell", token?: string, amount?: number) => void;
    onPost?: (content?: string) => void;
    onLogout?: () => void;
  }
): VoiceCommand[] {
  return [
    // ── Navigation ──────────────────────────────────────────────
    {
      patterns: ["go to (.+)", "navigate to (.+)", "open (.+)", "take me to (.+)", "show me (.+)"],
      action: (_m, transcript) => {
        const cleanTranscript = transcript
          .replace(/^(go to|navigate to|open|take me to|show me)\s*/i, "")
          .trim()
          .toLowerCase();
        const route = ROUTE_MAP[cleanTranscript];
        if (route) {
          navigate(route);
          toast.success(`🎙️ Navigating to ${cleanTranscript}`, { duration: 2000 });
        } else {
          // Fuzzy match
          const keys = Object.keys(ROUTE_MAP);
          const match = keys.find(k => cleanTranscript.includes(k) || k.includes(cleanTranscript));
          if (match) {
            navigate(ROUTE_MAP[match]);
            toast.success(`🎙️ Navigating to ${match}`, { duration: 2000 });
          } else {
            toast.error(`🎙️ Unknown destination: "${cleanTranscript}"`, { duration: 3000 });
          }
        }
      },
      description: "Navigate to any platform area",
      category: "navigation",
      example: "Go to staking",
    },
    {
      patterns: ["go home", "home page", "back to home"],
      action: () => { navigate("/"); toast.success("🎙️ Going home"); },
      description: "Go to home page",
      category: "navigation",
      example: "Go home",
    },
    {
      patterns: ["go back", "back"],
      action: () => { window.history.back(); toast.success("🎙️ Going back"); },
      description: "Go back",
      category: "navigation",
      example: "Go back",
    },
    // ── Search ───────────────────────────────────────────────────
    {
      patterns: ["search for (.+)", "search (.+)", "find (.+)", "look up (.+)"],
      action: (m) => {
        const query = m?.[1] || "";
        if (callbacks.onSearch) {
          callbacks.onSearch(query);
        } else {
          navigate(`/search?q=${encodeURIComponent(query)}`);
        }
        toast.success(`🎙️ Searching for "${query}"`, { duration: 2000 });
      },
      description: "Search the platform",
      category: "platform",
      example: "Search for SKY444",
    },
    // ── Crypto: Stake ────────────────────────────────────────────
    {
      patterns: ["stake (.+) sky", "stake (.+) tokens", "stake (.+)", "i want to stake (.+)"],
      action: (m) => {
        const amountStr = m?.[1]?.replace(/[^0-9.]/g, "") || "";
        const amount = parseFloat(amountStr) || undefined;
        navigate("/staking");
        if (callbacks.onStake) callbacks.onStake(amount);
        toast.success(`🎙️ Opening staking${amount ? ` — ${amount} SKY444` : ""}`, { duration: 2500 });
      },
      description: "Stake tokens",
      category: "crypto",
      example: "Stake 1000 SKY",
    },
    {
      patterns: ["stake", "open staking", "staking portal"],
      action: () => {
        navigate("/staking");
        toast.success("🎙️ Opening staking portal");
      },
      description: "Open staking",
      category: "crypto",
      example: "Stake",
    },
    // ── Crypto: Swap ─────────────────────────────────────────────
    {
      patterns: ["swap (.+) to (.+)", "swap (.+) for (.+)", "exchange (.+) to (.+)"],
      action: (m) => {
        const from = m?.[1]?.trim().toUpperCase() || "SKY444";
        const to = m?.[2]?.trim().toUpperCase() || "USDT";
        navigate("/swap");
        if (callbacks.onSwap) callbacks.onSwap(from, to);
        toast.success(`🎙️ Swap ${from} → ${to}`, { duration: 2500 });
      },
      description: "Swap tokens",
      category: "crypto",
      example: "Swap SKY444 to USDT",
    },
    {
      patterns: ["swap", "open swap", "token swap", "exchange tokens"],
      action: () => {
        navigate("/swap");
        toast.success("🎙️ Opening token swap");
      },
      description: "Open token swap",
      category: "crypto",
      example: "Swap",
    },
    // ── Crypto: Burn ─────────────────────────────────────────────
    {
      patterns: ["burn (.+) tokens", "burn (.+) sky", "burn (.+)"],
      action: (m) => {
        const amountStr = m?.[1]?.replace(/[^0-9.]/g, "") || "";
        const amount = parseFloat(amountStr) || undefined;
        navigate("/token");
        if (callbacks.onBurn) callbacks.onBurn(amount);
        toast.success(`🎙️ Opening burn${amount ? ` — ${amount} SKY444` : ""}`, { duration: 2500 });
      },
      description: "Burn tokens",
      category: "crypto",
      example: "Burn 500 SKY",
    },
    // ── Crypto: Trade ────────────────────────────────────────────
    {
      patterns: ["buy (.+)", "purchase (.+)"],
      action: (m) => {
        const token = m?.[1]?.trim().toUpperCase() || "SKY444";
        navigate("/trading");
        if (callbacks.onTrade) callbacks.onTrade("buy", token);
        toast.success(`🎙️ Buy order — ${token}`, { duration: 2500 });
      },
      description: "Buy a token",
      category: "crypto",
      example: "Buy SKY444",
    },
    {
      patterns: ["sell (.+)"],
      action: (m) => {
        const token = m?.[1]?.trim().toUpperCase() || "SKY444";
        navigate("/trading");
        if (callbacks.onTrade) callbacks.onTrade("sell", token);
        toast.success(`🎙️ Sell order — ${token}`, { duration: 2500 });
      },
      description: "Sell a token",
      category: "crypto",
      example: "Sell ETH",
    },
    {
      patterns: ["trade", "open trading", "trading terminal", "day trade"],
      action: () => {
        navigate("/trading");
        toast.success("🎙️ Opening trading terminal");
      },
      description: "Open trading",
      category: "crypto",
      example: "Trade",
    },
    // ── Crypto: Wallet ───────────────────────────────────────────
    {
      patterns: ["open wallet", "my wallet", "wallet", "connect wallet"],
      action: () => {
        navigate("/wallet");
        toast.success("🎙️ Opening wallet");
      },
      description: "Open wallet",
      category: "crypto",
      example: "Open wallet",
    },
    {
      patterns: ["check balance", "my balance", "show balance"],
      action: () => {
        navigate("/wallet");
        toast.success("🎙️ Checking balance");
      },
      description: "Check balance",
      category: "crypto",
      example: "Check balance",
    },
    // ── Social ───────────────────────────────────────────────────
    {
      patterns: ["create post", "new post", "post something", "write a post"],
      action: () => {
        navigate("/social");
        if (callbacks.onPost) callbacks.onPost();
        toast.success("🎙️ Opening post composer");
      },
      description: "Create a new post",
      category: "social",
      example: "Create post",
    },
    {
      patterns: ["open messages", "my messages", "direct messages", "dms"],
      action: () => {
        navigate("/messages");
        toast.success("🎙️ Opening messages");
      },
      description: "Open messages",
      category: "social",
      example: "Open messages",
    },
    {
      patterns: ["open notifications", "my notifications", "show notifications"],
      action: () => {
        navigate("/notifications");
        toast.success("🎙️ Opening notifications");
      },
      description: "Open notifications",
      category: "social",
      example: "Open notifications",
    },
    // ── Gaming ───────────────────────────────────────────────────
    {
      patterns: ["play (.+)", "start (.+) game"],
      action: (m) => {
        const game = m?.[1]?.toLowerCase().trim() || "";
        const gameRoutes: Record<string, string> = {
          "snake": "/arcade",
          "blackjack": "/arcade",
          "dice": "/arcade",
          "roulette": "/arcade",
          "tic tac toe": "/arcade",
          "tictactoe": "/arcade",
        };
        const route = gameRoutes[game] || "/arcade";
        navigate(route);
        toast.success(`🎙️ Opening ${game || "arcade"}`);
      },
      description: "Play a game",
      category: "gaming",
      example: "Play snake",
    },
    {
      patterns: ["open arcade", "arcade", "play games"],
      action: () => {
        navigate("/arcade");
        toast.success("🎙️ Opening arcade");
      },
      description: "Open arcade",
      category: "gaming",
      example: "Open arcade",
    },
    // ── AI ───────────────────────────────────────────────────────
    {
      patterns: ["open ai engineer", "ai engineer", "coding bots", "code with ai"],
      action: () => {
        navigate("/ai-engineer");
        toast.success("🎙️ Opening AI Engineer");
      },
      description: "Open AI Engineer",
      category: "ai",
      example: "Open AI engineer",
    },
    {
      patterns: ["open hope ai", "hope ai", "ai assistant", "ask ai"],
      action: () => {
        navigate("/hope-ai");
        toast.success("🎙️ Opening Hope AI");
      },
      description: "Open Hope AI",
      category: "ai",
      example: "Open Hope AI",
    },
    // ── Platform ─────────────────────────────────────────────────
    {
      patterns: ["logout", "log out", "sign out"],
      action: () => {
        if (callbacks.onLogout) callbacks.onLogout();
        toast.success("🎙️ Logging out...");
      },
      description: "Log out",
      category: "platform",
      example: "Logout",
    },
    {
      patterns: ["help", "what can you do", "voice commands", "list commands"],
      action: () => {
        toast.info(
          "🎙️ Voice commands: navigate, search, stake, swap, burn, buy, sell, trade, play, post, logout",
          { duration: 6000 }
        );
      },
      description: "Show help",
      category: "platform",
      example: "Help",
    },
    {
      patterns: ["scroll down", "scroll up", "page down", "page up"],
      action: (_m, transcript) => {
        const isDown = transcript.includes("down");
        window.scrollBy({ top: isDown ? 400 : -400, behavior: "smooth" });
        toast.success(`🎙️ Scrolling ${isDown ? "down" : "up"}`);
      },
      description: "Scroll page",
      category: "navigation",
      example: "Scroll down",
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
// VOICE COMMANDS REGISTRY (for Help Panel)
// ═══════════════════════════════════════════════════════════════
export const VOICE_COMMANDS_REGISTRY = [
  { command: "go to [page]", example: "go to wallet", category: "Navigation" },
  { command: "open [page]", example: "open marketplace", category: "Navigation" },
  { command: "go home", example: "go home", category: "Navigation" },
  { command: "go back", example: "go back", category: "Navigation" },
  { command: "scroll down / scroll up", example: "scroll down", category: "Navigation" },
  { command: "search for [query]", example: "search for SKY444", category: "Platform" },
  { command: "stake [amount] sky", example: "stake 1000 sky", category: "Crypto" },
  { command: "swap [amount] [token] to [token]", example: "swap 100 sky to eth", category: "Crypto" },
  { command: "burn [amount] tokens", example: "burn 500 sky", category: "Crypto" },
  { command: "buy [token]", example: "buy SKY444", category: "Crypto" },
  { command: "sell [token]", example: "sell ETH", category: "Crypto" },
  { command: "open wallet", example: "open wallet", category: "Crypto" },
  { command: "check balance", example: "check balance", category: "Crypto" },
  { command: "create post", example: "create post", category: "Social" },
  { command: "open messages", example: "open messages", category: "Social" },
  { command: "open notifications", example: "open notifications", category: "Social" },
  { command: "play [game]", example: "play snake", category: "Gaming" },
  { command: "open arcade", example: "open arcade", category: "Gaming" },
  { command: "open AI engineer", example: "open AI engineer", category: "AI" },
  { command: "open Hope AI", example: "open Hope AI", category: "AI" },
  { command: "ask AI [task]", example: "ask AI write a bio", category: "AI" },
  { command: "logout", example: "logout", category: "Platform" },
  { command: "help", example: "help", category: "Platform" },
];

// ═══════════════════════════════════════════════════════════════
// MAIN HOOK — AUTO-LISTENING (no toggle needed)
// Voice is always active. Restarts automatically after each result.
// ═══════════════════════════════════════════════════════════════
export function useVoiceCommands(callbacks?: Parameters<typeof buildCommands>[1]) {
  const [, navigate] = useLocation();
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSupported: typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window),
    transcript: "",
    lastCommand: null,
    confidence: 0,
  });
  const recognitionRef = useRef<any>(null);
  const commandsRef = useRef<VoiceCommand[]>([]);
  const autoRestartRef = useRef(true);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    commandsRef.current = buildCommands(navigate, callbacks || {});
  }, [navigate, callbacks]);

  const processTranscript = useCallback((transcript: string, confidence: number) => {
    const lower = transcript.toLowerCase().trim();
    setState(s => ({ ...s, transcript: lower, confidence }));

    for (const cmd of commandsRef.current) {
      for (const pattern of cmd.patterns) {
        const regex = new RegExp(`^${pattern}$`, "i");
        const match = lower.match(regex);
        if (match) {
          setState(s => ({ ...s, lastCommand: lower }));
          cmd.action(match, lower);
          return;
        }
      }
    }
    // Partial match fallback
    for (const cmd of commandsRef.current) {
      for (const pattern of cmd.patterns) {
        const simplified = pattern.replace(/\(.+\)/g, "").trim();
        if (simplified.length > 3 && lower.includes(simplified)) {
          setState(s => ({ ...s, lastCommand: lower }));
          cmd.action(null, lower);
          return;
        }
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (!state.isSupported) return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    // continuous=false + auto-restart gives better accuracy than continuous=true
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setState(s => ({ ...s, isListening: true }));

    recognition.onend = () => {
      setState(s => ({ ...s, isListening: false }));
      // Auto-restart unless explicitly stopped
      if (autoRestartRef.current) {
        restartTimerRef.current = setTimeout(startListening, 300);
      }
    };

    recognition.onerror = (e: any) => {
      setState(s => ({ ...s, isListening: false }));
      if (e.error === "not-allowed") {
        autoRestartRef.current = false;
        toast.error("🎙️ Microphone permission denied. Click the mic button to retry.");
        return;
      }
      // Restart on transient errors (no-speech, network, aborted)
      if (autoRestartRef.current) {
        restartTimerRef.current = setTimeout(startListening, 800);
      }
    };

    recognition.onresult = (e: any) => {
      const result = e.results[0];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      processTranscript(transcript, confidence);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      // Already started — ignore
    }
  }, [state.isSupported, processTranscript]);

  const stopListening = useCallback(() => {
    autoRestartRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    recognitionRef.current?.stop();
    setState(s => ({ ...s, isListening: false }));
  }, []);

  const restartListening = useCallback(() => {
    autoRestartRef.current = true;
    startListening();
  }, [startListening]);

  // Keep toggleListening for backward compat (mic button)
  const toggleListening = useCallback(() => {
    if (state.isListening || autoRestartRef.current) {
      stopListening();
    } else {
      restartListening();
    }
  }, [state.isListening, stopListening, restartListening]);

  // AUTO-START on mount — voice is always on
  useEffect(() => {
    if (state.isSupported) {
      autoRestartRef.current = true;
      startListening();
    }
    return () => {
      autoRestartRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      recognitionRef.current?.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcut: Alt+V toggles mic off/on
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "v") {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleListening]);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    restartListening,
    commands: commandsRef.current,
    voiceCommandsRegistry: VOICE_COMMANDS_REGISTRY,
  };
}

// VoiceState already exported above as interface
