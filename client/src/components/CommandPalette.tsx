/**
 * CommandPalette — Cmd+K global search + navigation
 * Jump to any feature, page, or action from anywhere
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, Zap, ArrowRight, Hash, Users, Gamepad2, Coins, Heart, GraduationCap, Tv, Bot, ShoppingBag, Star, TrendingUp, Shield, Settings, Home } from "lucide-react";

const COMMANDS = [
  // Core Navigation
  { id: "home",         label: "Home",              icon: Home,          route: "/",                category: "Navigate",    shortcut: "H" },
  { id: "feed",         label: "Social Feed",        icon: Hash,          route: "/feed",            category: "Social",      shortcut: "" },
  { id: "discover",     label: "Discover",           icon: TrendingUp,    route: "/explore",         category: "Social",      shortcut: "" },
  { id: "social",       label: "Social Hub",         icon: Users,         route: "/social",          category: "Social",      shortcut: "" },
  // Crypto
  { id: "crypto",       label: "Crypto Hub",         icon: Coins,         route: "/crypto",          category: "Crypto",      shortcut: "" },
  { id: "wallet",       label: "My Wallet",          icon: Coins,         route: "/wallet",          category: "Crypto",      shortcut: "" },
  { id: "staking",      label: "Staking Portal",     icon: Coins,         route: "/staking",         category: "Crypto",      shortcut: "" },
  { id: "swap",         label: "Token Swap",         icon: Coins,         route: "/token-swap",      category: "Crypto",      shortcut: "" },
  { id: "ico",          label: "ICO / Investors",    icon: Zap,           route: "/investor-portal", category: "Investors",   shortcut: "I" },
  // Gaming
  { id: "gaming",       label: "Gaming Hub",         icon: Gamepad2,      route: "/gaming",          category: "Gaming",      shortcut: "G" },
  { id: "arcade",       label: "Arcade",             icon: Gamepad2,      route: "/arcade",          category: "Gaming",      shortcut: "" },
  { id: "tournaments",  label: "Tournaments",        icon: Gamepad2,      route: "/tournaments",     category: "Gaming",      shortcut: "" },
  { id: "leaderboard",  label: "Leaderboard",        icon: Star,          route: "/leaderboard",     category: "Gaming",      shortcut: "" },
  // AI
  { id: "hope-ai",      label: "HOPE AI",            icon: Bot,           route: "/hope-ai",         category: "AI",          shortcut: "A" },
  { id: "ai-agents",    label: "AI Market Agents",   icon: Bot,           route: "/ai-market-agents",category: "AI",          shortcut: "" },
  { id: "ai-brain",     label: "AI Brain",           icon: Bot,           route: "/ai-brain",        category: "AI",          shortcut: "" },
  // Charity
  { id: "charity",      label: "Charity",            icon: Heart,         route: "/charity",         category: "Charity",     shortcut: "C" },
  { id: "charity-lb",   label: "Charity Leaderboard",icon: Heart,         route: "/charity-leaderboard", category: "Charity", shortcut: "" },
  // School
  { id: "school",       label: "SkySchool",          icon: GraduationCap, route: "/sky-school",      category: "School",      shortcut: "S" },
  { id: "courses",      label: "My Courses",         icon: GraduationCap, route: "/school-dashboard",category: "School",      shortcut: "" },
  // Streaming
  { id: "streaming",    label: "Live Streams",       icon: Tv,            route: "/streaming",       category: "Live",        shortcut: "L" },
  { id: "create-stream",label: "Go Live",            icon: Tv,            route: "/create-stream",   category: "Live",        shortcut: "" },
  // Creator
  { id: "creator",      label: "Creator Studio",     icon: Star,          route: "/creator-studio",  category: "Creator",     shortcut: "" },
  { id: "creator-analytics", label: "Creator Analytics", icon: Star,      route: "/creator-analytics", category: "Creator",   shortcut: "" },
  // Marketplace
  { id: "marketplace",  label: "Marketplace",        icon: ShoppingBag,   route: "/marketplace",     category: "Market",      shortcut: "M" },
  // Gamification
  { id: "spin",         label: "Daily Spin Wheel",   icon: Zap,           route: "/spin",            category: "Gamification",shortcut: "" },
  { id: "battle-pass",  label: "Battle Pass",        icon: Zap,           route: "/battle-pass",     category: "Gamification",shortcut: "" },
  { id: "achievements", label: "Achievements",       icon: Star,          route: "/achievements",    category: "Gamification",shortcut: "" },
  // Settings
  { id: "settings",     label: "Settings",           icon: Settings,      route: "/settings",        category: "Account",     shortcut: "" },
  { id: "profile",      label: "My Profile",         icon: Users,         route: "/profile",         category: "Account",     shortcut: "P" },
  { id: "security",     label: "Security",           icon: Shield,        route: "/security",        category: "Account",     shortcut: "" },
  { id: "platform-map", label: "Platform Map",       icon: TrendingUp,    route: "/platform-map",    category: "Navigate",    shortcut: "" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Navigate:     "text-blue-400",
  Social:       "text-cyan-400",
  Crypto:       "text-yellow-400",
  Investors:    "text-amber-400",
  Gaming:       "text-green-400",
  AI:           "text-fuchsia-400",
  Charity:      "text-rose-400",
  School:       "text-indigo-400",
  Live:         "text-red-400",
  Creator:      "text-pink-400",
  Market:       "text-orange-400",
  Gamification: "text-purple-400",
  Account:      "text-slate-400",
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS.slice(0, 12);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const execute = useCallback((cmd: typeof COMMANDS[0]) => {
    navigate(cmd.route);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); if (filtered[selected]) execute(filtered[selected]); }
      if (e.key === "Escape")    { onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selected, execute, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Palette */}
      <div className="relative w-full max-w-2xl mx-4 bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search features, pages, actions..."
            className="flex-1 bg-transparent text-white placeholder:text-muted-foreground outline-none text-base"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-none">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No results for "{query}"
            </div>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            const catColor = CATEGORY_COLORS[cmd.category] || "text-muted-foreground";
            return (
              <button
                key={cmd.id}
                onClick={() => execute(cmd)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  i === selected ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  i === selected ? "bg-primary/20" : "bg-white/5"
                }`}>
                  <Icon className={`w-4 h-4 ${i === selected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{cmd.label}</div>
                  <div className={`text-xs ${catColor}`}>{cmd.category}</div>
                </div>
                {cmd.shortcut && (
                  <kbd className="hidden sm:flex items-center px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-muted-foreground">
                    {cmd.shortcut}
                  </kbd>
                )}
                {i === selected && <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-white/2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><kbd className="px-1 bg-white/5 border border-white/10 rounded">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 bg-white/5 border border-white/10 rounded">↵</kbd> open</span>
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
}

// Global keyboard shortcut hook
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
