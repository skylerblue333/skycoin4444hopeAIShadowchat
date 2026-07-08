import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Home, Search, Gamepad2, Coins, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/social", label: "Social", icon: Search },
  { href: "/gaming", label: "Games", icon: Gamepad2 },
  { href: "/staking", label: "Earn", icon: Coins },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomTabBar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{
        background: 'oklch(0.09 0.025 270 / 0.97)',
        borderTop: '1px solid oklch(0.18 0.025 270)',
        backdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = tab.href === "/" ? location === "/" : location.startsWith(tab.href);
          const href = tab.href === "/profile" && user ? `/profile/${user.id}` : tab.href;
          return (
            <Link key={tab.href} href={href}>
              <button
                className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all"
                style={{
                  color: isActive ? 'oklch(0.85 0.25 305)' : 'oklch(0.45 0.020 275)',
                  background: isActive ? 'oklch(0.72 0.28 305 / 0.10)' : 'transparent',
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
