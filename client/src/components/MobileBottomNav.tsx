import { Link, useLocation } from "wouter";
import { Home, Globe, Coins, PlusCircle, User, Zap } from "lucide-react";

const TABS = [
  { icon: Home,       label: "Home",    href: "/" },
  { icon: Globe,      label: "Social",  href: "/social" },
  { icon: Zap,        label: "Earn",    href: "/staking" },
  { icon: PlusCircle, label: "Create",  href: "/creator-studio" },
  { icon: User,       label: "Profile", href: "/profile" },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-pb">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/60" />
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <div className="relative flex items-center justify-around h-16 px-1">
        {TABS.map(tab => {
          const isActive = location === tab.href || (tab.href !== "/" && location.startsWith(tab.href));
          const isCreate = tab.href === "/creator-studio";
          return (
            <Link key={tab.href} href={tab.href}>
              <button className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 rounded-xl transition-all duration-200 active:scale-95 ${
                isCreate
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 scale-105"
                  : isActive
                  ? "text-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}>
                {isActive && !isCreate && (
                  <div className="absolute inset-0 bg-cyan-500/10 rounded-xl" />
                )}
                <tab.icon className={`relative w-5 h-5 transition-all duration-200 ${
                  isCreate ? "text-white" : isActive ? "text-cyan-400 scale-110" : ""
                }`} />
                <span className={`relative text-[10px] font-medium leading-none ${
                  isCreate ? "text-white" : isActive ? "text-cyan-400" : ""
                }`}>{tab.label}</span>
                {isActive && !isCreate && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
