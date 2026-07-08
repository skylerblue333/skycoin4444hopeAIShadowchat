/**
 * QuickLaunchBar — Psychedelic Rainbow Neon Drip Navigation
 * 12 platform group pills with animated rainbow borders, metallic labels,
 * neon drip glow effects, and continuously cycling hue-shift backgrounds.
 */
import { useLocation } from "wouter";
import {
  Rocket, Heart, Gamepad2, GraduationCap, Radio, Globe,
  Newspaper, Compass, Sparkles, Coins, ShoppingBag, Star,
  TrendingUp, ChevronRight,
} from "lucide-react";

const QUICK_GROUPS = [
  {
    id: "investors",
    label: "Investors / ICO",
    icon: Rocket,
    href: "/investor-portal",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    activeGlow: "0 0 20px oklch(0.80 0.30 40 / 0.7), 0 0 40px oklch(0.80 0.30 40 / 0.4)",
    badge: "🔥 LIVE",
    badgeColor: "bg-orange-500/20 text-orange-300",
  },
  {
    id: "charity",
    label: "Charity",
    icon: Heart,
    href: "/charity",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    activeGlow: "0 0 20px oklch(0.72 0.28 340 / 0.7), 0 0 40px oklch(0.72 0.28 340 / 0.4)",
    badge: null,
    badgeColor: "",
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: Gamepad2,
    href: "/gaming",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    activeGlow: "0 0 20px oklch(0.72 0.28 160 / 0.7), 0 0 40px oklch(0.72 0.28 160 / 0.4)",
    badge: "P2E",
    badgeColor: "bg-green-500/20 text-green-300",
  },
  {
    id: "school",
    label: "SkySchool",
    icon: GraduationCap,
    href: "/school",
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    activeGlow: "0 0 20px oklch(0.72 0.28 260 / 0.7), 0 0 40px oklch(0.72 0.28 260 / 0.4)",
    badge: "Earn",
    badgeColor: "bg-blue-500/20 text-blue-300",
  },
  {
    id: "live",
    label: "Live",
    icon: Radio,
    href: "/streaming",
    gradient: "from-red-500 via-rose-500 to-pink-500",
    activeGlow: "0 0 20px oklch(0.72 0.28 10 / 0.7), 0 0 40px oklch(0.72 0.28 10 / 0.4)",
    badge: "● LIVE",
    badgeColor: "bg-red-500/20 text-red-300",
  },
  {
    id: "social",
    label: "Social",
    icon: Globe,
    href: "/social",
    gradient: "from-cyan-500 via-sky-500 to-blue-500",
    activeGlow: "0 0 20px oklch(0.80 0.20 200 / 0.7), 0 0 40px oklch(0.80 0.20 200 / 0.4)",
    badge: null,
    badgeColor: "",
  },
  {
    id: "feed",
    label: "Feed",
    icon: Newspaper,
    href: "/feed",
    gradient: "from-slate-400 via-slate-300 to-white",
    activeGlow: "0 0 20px oklch(0.70 0.05 270 / 0.7), 0 0 40px oklch(0.70 0.05 270 / 0.4)",
    badge: null,
    badgeColor: "",
  },
  {
    id: "discover",
    label: "Discover",
    icon: Compass,
    href: "/explore",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    activeGlow: "0 0 20px oklch(0.72 0.28 305 / 0.7), 0 0 40px oklch(0.72 0.28 305 / 0.4)",
    badge: null,
    badgeColor: "",
  },
  {
    id: "hope-ai",
    label: "HOPE AI",
    icon: Sparkles,
    href: "/hope-ai",
    gradient: "from-fuchsia-500 via-pink-500 to-rose-500",
    activeGlow: "0 0 20px oklch(0.72 0.28 320 / 0.7), 0 0 40px oklch(0.72 0.28 320 / 0.4)",
    badge: "AI",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-300",
  },
  {
    id: "crypto",
    label: "Crypto",
    icon: Coins,
    href: "/crypto-hub",
    gradient: "from-yellow-500 via-amber-500 to-orange-500",
    activeGlow: "0 0 20px oklch(0.80 0.20 70 / 0.7), 0 0 40px oklch(0.80 0.20 70 / 0.4)",
    badge: "SKY444",
    badgeColor: "bg-yellow-500/20 text-yellow-300",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    href: "/marketplace",
    gradient: "from-teal-500 via-cyan-500 to-sky-500",
    activeGlow: "0 0 20px oklch(0.72 0.28 180 / 0.7), 0 0 40px oklch(0.72 0.28 180 / 0.4)",
    badge: null,
    badgeColor: "",
  },
  {
    id: "creator",
    label: "Creator",
    icon: Star,
    href: "/creator-studio",
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    activeGlow: "0 0 20px oklch(0.72 0.28 290 / 0.7), 0 0 40px oklch(0.72 0.28 290 / 0.4)",
    badge: "Studio",
    badgeColor: "bg-purple-500/20 text-purple-300",
  },
] as const;

export function QuickLaunchBar() {
  const [location, navigate] = useLocation();

  return (
    <div className="sticky top-12 z-40 bg-[#07050f]/95 backdrop-blur-xl border-b border-slate-800/50">
      {/* Rainbow neon drip top border */}
      <div className="drip-divider-thick" />

      {/* Scrollable pill row */}
      <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide">
        {QUICK_GROUPS.map((group) => {
          const Icon = group.icon;
          const isActive = location === group.href || location.startsWith(group.href + "/");

          return (
            <button
              key={group.id}
              onClick={() => navigate(group.href)}
              className={`
                relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold
                whitespace-nowrap shrink-0 transition-all duration-200
                ${isActive
                  ? `bg-gradient-to-r ${group.gradient} text-white scale-105`
                  : `bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600/60 hover:scale-105`
                }
              `}
              style={
                isActive
                  ? { boxShadow: group.activeGlow }
                  : {}
              }
            >
              {/* Icon — rainbow cycle when inactive, white when active */}
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "icon-rainbow"}`}
              />

              {/* Label — rainbow when inactive, white when active */}
              <span className={isActive ? "text-white" : "text-rainbow-slow"}>
                {group.label}
              </span>

              {/* Badge */}
              {group.badge && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none ${
                    isActive
                      ? "bg-white/20 text-white"
                      : group.badgeColor
                  }`}
                >
                  {group.badge}
                </span>
              )}

              {/* Active neon drip underline */}
              {isActive && (
                <span
                  className="absolute -bottom-0.5 left-2 right-2 h-0.5 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, oklch(0.80 0.30 0), oklch(0.80 0.30 120), oklch(0.80 0.30 240), oklch(0.80 0.30 0))",
                    backgroundSize: "300% 100%",
                    animation: "rainbow-shift 2s linear infinite",
                  }}
                />
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-px h-4 bg-slate-700/50 shrink-0 mx-1" />

        {/* AI Agents shortcut */}
        <button
          onClick={() => navigate("/ai-market-agents")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200 border ${
            location === "/ai-market-agents"
              ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white border-fuchsia-500/50"
              : "bg-transparent border-fuchsia-700/50 hover:border-fuchsia-600 text-fuchsia-300"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
          <span className="text-rainbow-slow">AI Agents</span>
        </button>

        {/* Platform Map shortcut */}
        <button
          onClick={() => navigate("/platform-map")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200 border ${
            location === "/platform-map"
              ? "bg-slate-600 text-white border-slate-500"
              : "bg-transparent border-slate-700/50 hover:border-slate-600"
          }`}
          style={location === "/platform-map" ? {} : {}}
        >
          <TrendingUp className="w-3 h-3 icon-rainbow" />
          <span className="text-rainbow-slow">All Features</span>
          <ChevronRight className="w-3 h-3 opacity-60" />
        </button>
      </div>

      {/* Rainbow neon drip bottom border */}
      <div className="drip-divider" />
    </div>
  );
}
