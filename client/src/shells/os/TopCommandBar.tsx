/**
 * TopCommandBar — Visually rich, dense mega-nav
 * Every major feature reachable in 1 click. Clean hierarchy, no clutter.
 * Groups: Social · Crypto · Earn · AI · More
 * + Mode tabs + bold CTAs + search + user
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Globe, MessageSquare, User, LayoutGrid, ChevronDown, Bell, Search,
  Rocket, Zap, UserCircle2, Pickaxe, ArrowLeftRight, LogIn, X,
  Coins, Brain, Trophy, ShoppingBag, Radio, ArrowRight, Menu,
  Home, Hash, Video, Camera, Users, Star, Wallet, TrendingUp,
  Layers, Sparkles, BarChart3, Target, Building2, Cpu, Gamepad2,
  Gift, Crown, Heart, Code2, GraduationCap, Bot, PieChart,
  Activity, Shield, Flame, BookOpen, Swords, Mic, MicOff, Newspaper,
  Package, CalendarDays, GitBranch, Webhook, Scissors, ChevronRight,
  Command, Settings, HelpCircle, ExternalLink, Lock, Gauge, Database
} from "lucide-react";
import { useAppStore } from "@/shared/state/appStore";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

// ─── Mega-nav groups ──────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: "investors",
    label: "Investors / ICO",
    icon: Rocket,
    accent: "from-amber-500 to-orange-500",
    accentText: "text-amber-400",
    accentBg: "bg-amber-500/10 hover:bg-amber-500/20",
    accentBorder: "border-amber-500/20",
    sections: [
      {
        title: "Token Sale",
        items: [
          { label: "Investor Portal",  href: "/investor-portal",  icon: Rocket,     desc: "Full ICO hub — buy SKY444" },
          { label: "ICO Launchpad",    href: "/ico",              icon: Coins,      desc: "Token sale entry point" },
          { label: "Token Metrics",    href: "/token-metrics",    icon: BarChart3,  desc: "Live price, supply, burn" },
          { label: "Whitepaper",       href: "/whitepaper",       icon: BookOpen,   desc: "SKY444 technical paper v2.0" },
        ],
      },
      {
        title: "Economics",
        items: [
          { label: "Economic Layer",   href: "/economic-layer",   icon: Coins,      desc: "SKY444 ledger & fee schedule" },
          { label: "Governance",       href: "/governance",       icon: Building2,  desc: "Vote on proposals" },
          { label: "Whale Monitor",    href: "/whale-monitor",    icon: Activity,   desc: "Large tx surveillance" },
          { label: "Vesting",          href: "/vesting",          icon: CalendarDays, desc: "Token unlock timeline" },
        ],
      },
      {
        title: "Legal & Docs",
        items: [
          { label: "Token Agreement",  href: "/legal/token-sale-agreement", icon: BookOpen, desc: "Token sale agreement" },
          { label: "Risk Disclosures", href: "/legal/risk-disclosures",     icon: Shield,   desc: "Investment risk info" },
          { label: "KYC / AML",        href: "/legal/kyc-aml-policy",       icon: Lock,     desc: "KYC & AML policy" },
          { label: "Platform Map",     href: "/platform-map",               icon: LayoutGrid, desc: "All 246+ features" },
        ],
      },
    ],
  },
  {
    id: "social",
    label: "Social",
    icon: Globe,
    accent: "from-cyan-500 to-blue-500",
    accentText: "text-cyan-400",
    accentBg: "bg-cyan-500/10 hover:bg-cyan-500/20",
    accentBorder: "border-cyan-500/20",
    sections: [
      {
        title: "Connect",
        items: [
          { label: "Feed",        href: "/social",         icon: Home,          desc: "Your personalized feed" },
          { label: "Explore",     href: "/explore",        icon: Hash,          desc: "Discover trending content" },
          { label: "Messages",    href: "/messages",       icon: MessageSquare, desc: "Direct messages" },
          { label: "Communities", href: "/community",      icon: Users,         desc: "Topic communities" },
        ],
      },
      {
        title: "Create",
        items: [
          { label: "Reels",       href: "/reels",          icon: Video,         desc: "Short-form video" },
          { label: "Stories",     href: "/stories",        icon: Camera,        desc: "24-hour stories" },
          { label: "Streaming",   href: "/streaming",      icon: Radio,         desc: "Go live now" },
          { label: "Creator Hub",     href: "/creator-studio",    icon: Star,          desc: "Creator tools" },
          { label: "Tip Jar",          href: "/tip-jar",           icon: Gift,          desc: "Send tips to creators" },
          { label: "Scheduler",        href: "/content-scheduler", icon: CalendarDays,  desc: "Schedule your posts" },
        ],
      },
      {
        title: "Discover",
        items: [
          { label: "Trending",    href: "/trending",       icon: TrendingUp,    desc: "What's hot now" },
          { label: "Channels",    href: "/channels",       icon: Newspaper,     desc: "Topic channels" },
          { label: "Leaderboard", href: "/leaderboard",    icon: Crown,         desc: "Top creators" },
          { label: "Events",          href: "/events",            icon: CalendarDays,  desc: "Upcoming events" },
          { label: "Spotlights",       href: "/creator-spotlight",  icon: Flame,         desc: "Featured creators" },
          { label: "Live Reactions",   href: "/live-reactions",     icon: Zap,           desc: "React to live content" },
        ],
      },
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    icon: Coins,
    accent: "from-yellow-500 to-orange-500",
    accentText: "text-yellow-400",
    accentBg: "bg-yellow-500/10 hover:bg-yellow-500/20",
    accentBorder: "border-yellow-500/20",
    sections: [
      {
        title: "Assets",
        items: [
          { label: "Wallet",      href: "/wallet",         icon: Wallet,        desc: "Your crypto wallet" },
          { label: "Portfolio",   href: "/portfolio",      icon: PieChart,      desc: "Asset allocation" },
          { label: "NFT Gallery", href: "/nft-gallery",    icon: Sparkles,      desc: "Your NFT collection" },
          { label: "Token Metrics",href: "/token-metrics", icon: BarChart3,     desc: "SKY444 stats" },
        ],
      },
      {
        title: "Trade & Earn",
        items: [
          { label: "Mine SKY444", href: "/mining",         icon: Pickaxe,       desc: "Proof-of-engagement mining" },
          { label: "Token Swap",  href: "/token-swap",     icon: ArrowLeftRight,desc: "Swap tokens instantly" },
          { label: "Staking",     href: "/staking",        icon: Zap,           desc: "Earn staking rewards" },
          { label: "Yield Farm",  href: "/yield-farming",  icon: Target,        desc: "Farming pools" },
        ],
      },
      {
        title: "Advanced",
        items: [
          { label: "Trading",     href: "/trading",        icon: TrendingUp,    desc: "Terminal" },
          { label: "DeFi",        href: "/defi",           icon: Layers,        desc: "Decentralized finance" },
          { label: "Governance",  href: "/governance",     icon: Building2,     desc: "Vote on proposals" },
          { label: "Whale Watch", href: "/whale-monitor",  icon: Activity,      desc: "Large tx monitor" },
          { label: "Economic Layer",href: "/economic-layer", icon: Coins,         desc: "SKY444 ledger & fees" },
          { label: "Global Ops",  href: "/global-ops",     icon: Globe,         desc: "Token Registry · Regions · Ambassadors" },
        ],
      },
    ],
  },
  {
    id: "earn",
    label: "Earn",
    icon: Trophy,
    accent: "from-purple-500 to-fuchsia-500",
    accentText: "text-purple-400",
    accentBg: "bg-purple-500/10 hover:bg-purple-500/20",
    accentBorder: "border-purple-500/20",
    sections: [
      {
        title: "Mine & Play",
        items: [
          { label: "Mine SKY444", href: "/mining",         icon: Pickaxe,       desc: "CPU proof-of-engagement" },
          { label: "Gaming",      href: "/gaming",         icon: Gamepad2,      desc: "Play-to-earn games" },
          { label: "Tournaments", href: "/tournaments",    icon: Swords,        desc: "Compete & win prizes" },
          { label: "Quest Board", href: "/quests",         icon: Target,        desc: "Daily quests + rewards" },
        ],
      },
      {
        title: "Commerce",
        items: [
          { label: "Marketplace", href: "/marketplace",    icon: ShoppingBag,   desc: "Buy & sell goods" },
          { label: "Digital Art",  href: "/art-store",      icon: Sparkles,      desc: "Signed prints & tools" },
          { label: "Subscriptions",href: "/subscriptions", icon: Star,          desc: "Creator subscriptions" },
          { label: "Payout Hub",   href: "/payout",         icon: Coins,         desc: "Creator earnings" },
          { label: "Affiliate",   href: "/affiliate",      icon: Gift,          desc: "Earn commissions" },
          { label: "Referrals",   href: "/referrals",      icon: Users,         desc: "Invite & earn" },
        ],
      },
      {
        title: "Impact",
        items: [
          { label: "Charity",     href: "/charity",        icon: Heart,         desc: "Donate & give back" },
          { label: "Achievements",href: "/achievements",   icon: Trophy,        desc: "Unlock badges" },
          { label: "Leaderboard", href: "/leaderboard",    icon: Crown,         desc: "Top earners" },
          { label: "Sky School",  href: "/school",         icon: GraduationCap, desc: "Learn & earn SKY444" },
        ],
      },
    ],
  },
  {
    id: "ai",
    label: "AI",
    icon: Brain,
    accent: "from-fuchsia-500 to-pink-500",
    accentText: "text-fuchsia-400",
    accentBg: "bg-fuchsia-500/10 hover:bg-fuchsia-500/20",
    accentBorder: "border-fuchsia-500/20",
    sections: [
      {
        title: "HOPE AI",
        items: [
          { label: "HOPE AI Chat",    href: "/hope-ai",         icon: Sparkles,   desc: "Talk to your HOPE AI assistant" },
          { label: "Mission Control", href: "/mission-control", icon: Target,     desc: "Command center & digital twin" },
          { label: "HOPE AI Control", href: "/hope-ai-control", icon: Activity,   desc: "Orchestrator control panel" },
          { label: "AI Core",         href: "/ai-core",         icon: Cpu,        desc: "Core AI engine" },
          { label: "AI Intelligence", href: "/ai-intelligence", icon: Brain,      desc: "Moderation & sentiment hub" },
        ],
      },
      {
        title: "Intelligence",
        items: [
          { label: "AI Brain",    href: "/ai-brain",       icon: Brain,         desc: "AI command center" },
          { label: "AI Agent",    href: "/ai-agent",       icon: Bot,           desc: "24/7 autonomous agent" },
          { label: "AI Personas", href: "/ai-personas",    icon: Bot,           desc: "AI persona system" },
          { label: "AI Tools",    href: "/ai-tools",       icon: Cpu,           desc: "12 AI tools suite" },
          { label: "Code Intel",  href: "/code-intelligence", icon: Code2,       desc: "HOPE AI code review & gen" },
        ],
      },
      {
        title: "Create with AI",
        items: [
          { label: "Copy Studio", href: "/ai-copy-studio", icon: Mic,           desc: "AI content generation" },
          { label: "Code Studio", href: "/ai-code-studio", icon: Code2,         desc: "AI coding assistant" },
          { label: "AI Engineer", href: "/ai-engineer",    icon: GitBranch,     desc: "AI dev tools" },
          { label: "Sentiment",   href: "/sentiment",      icon: Activity,      desc: "NLP sentiment pipeline" },
        ],
      },
      {
        title: "Analytics",
        items: [
          { label: "Analytics",   href: "/analytics",      icon: BarChart3,     desc: "Platform analytics" },
          { label: "Creator Stats",href: "/creator-analytics",icon: PieChart,   desc: "Creator dashboard" },
          { label: "Anomaly AI",  href: "/anomaly-detection",icon: Shield,      desc: "ML anomaly detection" },
          { label: "World Brain", href: "/world-brain",    icon: Globe,         desc: "Global knowledge graph" },
        ],
      },
    ],
  },
  {
    id: "more",
    label: "More",
    icon: LayoutGrid,
    accent: "from-slate-400 to-slate-500",
    accentText: "text-slate-400",
    accentBg: "bg-slate-500/10 hover:bg-slate-500/20",
    accentBorder: "border-slate-500/20",
    sections: [
      {
        title: "Platform",
        items: [
          { label: "Dashboard",   href: "/dashboard",      icon: Gauge,         desc: "Your dashboard" },
          { label: "Ecosystem",   href: "/ecosystem",      icon: Globe,         desc: "Ecosystem overview" },
          { label: "The Book",    href: "/book",           icon: BookOpen,      desc: "The Chosen One" },
          { label: "Server Health",href: "/server-health", icon: Activity,      desc: "Live system status" },
          { label: "Investor",    href: "/investor",       icon: Building2,     desc: "Investor room" },
          { label: "ICO",         href: "/ico",            icon: Coins,         desc: "ICO launchpad" },
        ],
      },
      {
        title: "Developer",
        items: [
          { label: "API Docs",    href: "/api-docs",       icon: BookOpen,      desc: "tRPC endpoint catalog" },
          { label: "Webhooks",    href: "/webhooks",       icon: Webhook,       desc: "Webhook manager" },
          { label: "DevOps Hub",  href: "/devops",         icon: Database,      desc: "Infra & operations" },
          { label: "Enterprise",  href: "/enterprise",     icon: Package,       desc: "Enterprise features" },
        ],
      },
      {
        title: "Security & Privacy",
        items: [
          { label: "Security",         href: "/security",          icon: Shield,        desc: "Security dashboard" },
          { label: "Privacy Vault",    href: "/privacy",           icon: Lock,          desc: "Encrypted data vault" },
          { label: "Ghost Mode",       href: "/ghost-mode",         icon: User,          desc: "Anonymous browsing" },
          { label: "Shadow Identity",  href: "/shadow-identity",    icon: User,          desc: "Manage your shadow persona" },
          { label: "2FA Setup",        href: "/2fa",               icon: Lock,          desc: "Two-factor auth" },
          { label: "Audit Log",        href: "/audit-log",         icon: Activity,      desc: "Platform audit log" },
          { label: "Trust & Safety",   href: "/trust-safety",      icon: Shield,        desc: "Moderation & trust scores" },
          { label: "Compliance",       href: "/compliance-center",  icon: Lock,          desc: "KYC & GDPR controls" },
          { label: "Settings",         href: "/settings",          icon: Settings,      desc: "Account settings" },
        ],
      },
    ],
  },
];

const MODES = [
  { id: "discover" as const, label: "Discover", icon: Globe },
  { id: "execute" as const,  label: "Execute",  icon: MessageSquare },
  { id: "identity" as const, label: "Identity", icon: User },
];

// ─── Mega Menu Panel ──────────────────────────────────────────────────────────
function MegaPanel({ group, onClose }: { group: typeof NAV_GROUPS[0]; onClose: () => void }) {
  const [, navigate] = useLocation();
  return (
    <div
      className="absolute top-full left-0 mt-1 bg-[#0a0812]/98 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
      style={{ width: 680, animation: "panelIn 160ms cubic-bezier(0.23,1,0.32,1)" }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header strip */}
      <div className={`h-1 w-full bg-gradient-to-r ${group.accent}`} />

      <div className="p-4">
        {/* Group title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${group.accent} flex items-center justify-center`}>
              <group.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">{group.label}</span>
            <span className="text-[10px] text-slate-500 ml-1">{group.sections.reduce((a, s) => a + s.items.length, 0)} features</span>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3-column sections */}
        <div className="grid grid-cols-3 gap-4">
          {group.sections.map(section => (
            <div key={section.title}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${group.accentText}`}>
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <button
                    key={item.href}
                    onClick={() => { navigate(item.href); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-800/70 transition-all duration-100 group text-left"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${group.accentBorder} ${group.accentBg} transition-colors`}>
                      <item.icon className={`w-3.5 h-3.5 ${group.accentText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 leading-tight group-hover:text-white transition-colors">{item.label}</p>
                      <p className="text-[10px] text-slate-600 truncate leading-tight">{item.desc}</p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-700 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Command Palette ──────────────────────────────────────────────────────────
const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.sections.flatMap(s => s.items.map(i => ({ ...i, group: g.label, accentText: g.accentText, icon: i.icon }))));

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(""); }
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const filtered = query.trim()
    ? ALL_ITEMS.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.desc?.toLowerCase().includes(query.toLowerCase()) ||
        r.group.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : ALL_ITEMS.slice(0, 10);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[12vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 bg-[#0a0812]/99 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: "scaleIn 150ms cubic-bezier(0.23,1,0.32,1)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search features, pages, actions…"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
          />
          <kbd className="text-[10px] text-slate-600 border border-slate-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="py-1.5 max-h-72 overflow-y-auto">
          {filtered.map(route => (
            <button
              key={route.href}
              onClick={() => { navigate(route.href); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-800/60 transition-colors text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <route.icon className={`w-3.5 h-3.5 ${route.accentText}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white">{route.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{route.desc}</p>
              </div>
              <span className={`text-[10px] ${route.accentText} opacity-60`}>{route.group}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-slate-800 flex items-center gap-3 text-[10px] text-slate-600">
          <span><kbd className="border border-slate-700 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="border border-slate-700 rounded px-1">↵</kbd> go</span>
          <span><kbd className="border border-slate-700 rounded px-1">ESC</kbd> close</span>
          <span className="ml-auto">{ALL_ITEMS.length} features indexed</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main TopCommandBar ───────────────────────────────────────────────────────
export function TopCommandBar() {
  const { mode, setMode, shell, toggleShell, unreadCount, clearUnread } = useAppStore();
  const { user } = useAuth();
  const [location] = useLocation();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCommandOpen(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => { setActiveGroup(null); setMobileOpen(false); }, [location]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setActiveGroup(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggleGroup = useCallback((id: string) =>
    setActiveGroup(prev => prev === id ? null : id), []);

  return (
    <>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />

      <div
        ref={navRef}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#07050f]/97 backdrop-blur-2xl border-b border-purple-900/25 shadow-2xl shadow-black/40"
            : "bg-[#07050f]/90 backdrop-blur-xl border-b border-slate-800/40"
        }`}
      >
        {/* Top accent line */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent 0%, oklch(0.72 0.28 305 / 0.6) 20%, oklch(0.72 0.28 340 / 0.5) 50%, oklch(0.80 0.20 200 / 0.6) 80%, transparent 100%)" }} />

        {/* ── Main bar ── */}
        <div className="flex items-center gap-1 px-3 h-12">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-3 shrink-0 group">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-lg" style={{ background: "linear-gradient(135deg, oklch(0.72 0.28 305), oklch(0.72 0.28 340), oklch(0.80 0.20 200))" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="font-extrabold text-sm hidden sm:block text-rainbow">
              SKYCOIN4444
            </span>
          </Link>

          {/* ── Mode tabs ── */}
          <div className="hidden sm:flex items-center gap-0.5 mr-2 shrink-0">
            {MODES.map(m => {
              const Icon = m.icon;
              const active = mode === m.id && shell === "os";
              return (
                <button
                  key={m.id}
                  onClick={() => { if (shell !== "os") toggleShell(); setMode(m.id); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:block">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-5 bg-slate-700/60 mr-1" />

          {/* ── Mega-nav group buttons ── */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 relative">
            {NAV_GROUPS.map(group => {
              const Icon = group.icon;
              const open = activeGroup === group.id;
              return (
                <div key={group.id} className="relative">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      open
                        ? `bg-gradient-to-r ${group.accent} text-white shadow-md`
                        : `text-slate-400 hover:text-white hover:bg-slate-800/60`
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{group.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && <MegaPanel group={group} onClose={() => setActiveGroup(null)} />}
                </div>
              );
            })}

            {/* Quick direct links + Full Software CTA */}
            <div className="w-px h-4 bg-slate-700/60 mx-1" />
            <Link href="/dashboard">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-white hover:bg-slate-800/60 transition-all duration-150" title="Your personal dashboard">
                <Gauge className="w-3.5 h-3.5" />
                <span className="hidden xl:block">Dashboard</span>
              </button>
            </Link>
            <Link href="/ecosystem">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-white hover:bg-slate-800/60 transition-all duration-150" title="Full platform ecosystem">
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden xl:block">Ecosystem</span>
              </button>
            </Link>
            {/* ── Full Software button — tells visitors this is the rest of the platform ── */}
            <div className="w-px h-4 bg-slate-700/60 mx-1" />
            <Link href="/home">
              <button
                title="Browse all 200+ features of the full software platform"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 border"
                style={{ background: "oklch(0.14 0.04 275 / 0.8)", borderColor: "oklch(0.40 0.15 275 / 0.4)", color: "oklch(0.80 0.15 275)" }}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:block whitespace-nowrap">Full Software</span>
                <span className="xl:hidden text-[10px] opacity-70">All</span>
              </button>
            </Link>
          </div>

          {/* Spacer */}
          <div className="flex-1 lg:hidden" />

          {/* ── Right controls ── */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Search */}
            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-white transition-all duration-150 text-xs group"
              style={{ background: "oklch(0.12 0.02 275 / 0.6)", border: "1px solid oklch(0.30 0.05 275 / 0.3)" }}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden xl:block text-[11px]">Search</span>
              <kbd className="hidden xl:flex items-center gap-0.5 text-[10px] text-slate-700 border border-slate-700/60 rounded px-1">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>

            {/* Notifications */}
            <button
              onClick={clearUnread}
              className="relative p-2 rounded-lg hover:bg-slate-800/60 transition-colors text-slate-500 hover:text-slate-200"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-1 ring-background" />
              )}
            </button>

            {/* Legacy toggle */}
            <button
              onClick={toggleShell}
              title={shell === "os" ? "Switch to Legacy Mode" : "Switch to OS Mode"}
              className={`hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                shell === "legacy"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                  : "text-slate-600 hover:text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:block">{shell === "legacy" ? "Legacy" : "OS"}</span>
            </button>

            {/* Enter App / Sign In */}
            {user ? (
              <button
                onClick={() => { if (shell !== "os") toggleShell(); setMode("discover"); navigate("/social"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 hover:scale-105 hover:shadow-cyan-500/40 transition-all duration-200 ml-0.5"
              >
                <Rocket className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:block">Enter App</span>
              </button>
            ) : (
              <Link href={getLoginUrl()}>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 hover:scale-105 hover:shadow-cyan-500/40 transition-all duration-200 ml-0.5">
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:block">Sign In</span>
                </button>
              </Link>
            )}

            {/* User avatar */}
            {user && (
              <button
                onClick={() => { if (shell !== "os") toggleShell(); useAppStore.getState().setMode("identity"); }}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0 ml-0.5 hover:scale-110 transition-transform ring-1 ring-purple-500/30"
              >
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/60 active:bg-slate-700 active:scale-95 transition-all duration-150 ml-0.5"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-800/60 bg-[#07050f]/99 backdrop-blur-2xl max-h-[80vh] overflow-y-auto">
            {/* Search */}
            <div className="px-3 pt-3 pb-2">
              <button
                onClick={() => { setCommandOpen(true); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:border-purple-500/50 hover:text-white active:scale-[0.99] transition-all duration-150"
              >
                <Search className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="flex-1 text-left text-sm">Search features, pages, actions…</span>
                <kbd className="text-[10px] text-slate-600 border border-slate-700 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
              </button>
            </div>

            {/* Mode tabs on mobile */}
            <div className="px-3 pb-3 flex gap-2">
              {MODES.map(m => {
                const Icon = m.icon;
                const active = mode === m.id && shell === "os";
                return (
                  <button
                    key={m.id}
                    onClick={() => { if (shell !== "os") toggleShell(); setMode(m.id); setMobileOpen(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                      active
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* All groups */}
            {NAV_GROUPS.map(group => (
              <div key={group.id} className="px-3 py-2 border-t border-slate-800/40">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${group.accent} flex items-center justify-center`}>
                    <group.icon className="w-3 h-3 text-white" />
                  </div>
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${group.accentText}`}>{group.label}</p>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {group.sections.flatMap(s => s.items).map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block">
                      <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl hover:bg-slate-800/70 active:bg-slate-700/80 active:scale-[0.98] transition-all duration-150 cursor-pointer border border-transparent hover:border-slate-700/50">
                        <item.icon className={`w-4 h-4 ${group.accentText} shrink-0`} />
                        <span className="text-sm text-slate-200 font-medium truncate">{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Mobile CTA */}
            <div className="px-3 py-4 border-t border-slate-800/60">
              {user ? (
                <Link href="/social" onClick={() => setMobileOpen(false)} className="block">
                  <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-base active:scale-[0.98] transition-transform shadow-lg shadow-cyan-500/25">
                    <Rocket className="w-5 h-5" />Enter App
                  </button>
                </Link>
              ) : (
                <Link href={getLoginUrl()} onClick={() => setMobileOpen(false)} className="block">
                  <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-base active:scale-[0.98] transition-transform shadow-lg shadow-cyan-500/25">
                    <LogIn className="w-5 h-5" />Sign In to Get Started
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes panelIn {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes scaleIn {
          from { opacity:0; transform:scale(0.96); }
          to   { opacity:1; transform:scale(1); }
        }
      `}</style>
    </>
  );
}
