import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Cpu, GraduationCap, Gamepad2, Vote, BarChart3, Heart,
  ShoppingBag, Menu, X, LogOut, Zap, LayoutDashboard, TrendingUp, Wallet, Trophy,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/engineer", label: "HopeAI", icon: Cpu },
  { href: "/school", label: "Sky School", icon: GraduationCap },
  { href: "/arcade", label: "Arcade", icon: Gamepad2 },
  { href: "/governance", label: "Governance", icon: Vote },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/trading", label: "Trading", icon: TrendingUp },
  { href: "/crypto", label: "Crypto", icon: Wallet },
  { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
  { href: "/charity", label: "Charity", icon: Heart },
  { href: "/marketplace", label: "Market", icon: ShoppingBag },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,oklch(0.82 0.15 200),oklch(0.62 0.2 295))" }}
            >
              <Zap className="w-5 h-5 text-background" fill="currentColor" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">SkyCoin4444</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="sk-live-dot" /> {user?.name ?? "Online"}
                </span>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Exit
                </button>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="sk-gradient px-5 py-2.5 rounded-full text-sm font-bold transition-transform active:scale-[0.97]"
              >
                Dashboard
              </Link>
            )}
          </div>

          <button
            className="lg:hidden text-foreground"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden bg-background border-t border-border/60 px-4 py-3 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
            <div className="pt-2">
              {isAuthenticated ? (
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm bg-secondary text-foreground"
                >
                  <LogOut className="w-4 h-4" /> Exit
                </button>
              ) : (
                <button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="w-full sk-gradient px-3 py-3 rounded-full text-sm font-bold"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60 mt-16">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,oklch(0.82 0.15 200),oklch(0.62 0.2 295))" }}
            >
              <Zap className="w-4 h-4 text-background" fill="currentColor" />
            </div>
            <span className="font-bold tracking-tight">SkyCoin4444</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            One platform for AI, learning, gaming, governance, charity & commerce.
          </p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SKYCOIN4444</p>
        </div>
      </footer>
    </div>
  );
}
