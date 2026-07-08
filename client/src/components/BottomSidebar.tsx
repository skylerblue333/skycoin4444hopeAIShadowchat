import React from "react";
import { Link } from "wouter";
import {
  Home, Zap, Heart, Gamepad2, BookOpen, Sparkles, Radio, Share2, Wallet,
  TrendingUp, Lightbulb, Users, Settings, HelpCircle, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: TrendingUp, label: "Trading", href: "/trading" },
  { icon: Zap, label: "Staking", href: "/staking" },
  { icon: Heart, label: "Charity", href: "/charity" },
  { icon: Gamepad2, label: "Gaming", href: "/gaming" },
  { icon: BookOpen, label: "Sky School", href: "/sky-school" },
  { icon: Sparkles, label: "Hope AI", href: "/hope-ai-meta" },
  { icon: Radio, label: "Live", href: "/live" },
  { icon: Share2, label: "Social", href: "/social" },
  { icon: Lightbulb, label: "Discover", href: "/discover" },
  { icon: Users, label: "Community", href: "/community" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
];

export default function BottomSidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-900/50 border-t border-purple-500/20 backdrop-blur-md z-40 md:hidden">
      {/* Scrollable nav items */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 p-3 min-w-max">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-xs text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50"
              >
                <item.icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Button>
            </Link>
          ))}
          
          {user && (
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800/50"
            >
              <LogOut className="w-4 h-4" />
              <span className="whitespace-nowrap">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
