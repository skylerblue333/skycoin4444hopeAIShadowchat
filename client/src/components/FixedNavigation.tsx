import { Link } from "wouter";
import { useState } from "react";
import { ChevronDown, Home, DollarSign, Users, Gamepad2, Store, GraduationCap, Sparkles, Code2, Settings, BarChart3 } from "lucide-react";

export function FixedNavigation() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    {
      label: "Finance",
      icon: DollarSign,
      submenu: [
        { label: "Trading", href: "/trading" },
        { label: "Portfolio", href: "/portfolio" },
        { label: "Wallet", href: "/wallet" },
        { label: "Mining", href: "/mining" },
        { label: "Staking", href: "/staking" },
      ],
    },
    {
      label: "Crypto",
      icon: BarChart3,
      submenu: [
        { label: "Markets", href: "/markets" },
        { label: "Stocks", href: "/stocks" },
        { label: "Analysis", href: "/analysis" },
        { label: "Signals", href: "/signals" },
      ],
    },
    {
      label: "Social",
      icon: Users,
      submenu: [
        { label: "Feed", href: "/feed" },
        { label: "Profile", href: "/profile" },
        { label: "Messages", href: "/messages" },
        { label: "Communities", href: "/communities" },
      ],
    },
    {
      label: "Gaming",
      icon: Gamepad2,
      submenu: [
        { label: "Games", href: "/games" },
        { label: "Leaderboards", href: "/leaderboards" },
        { label: "Tournaments", href: "/tournaments" },
        { label: "Rewards", href: "/rewards" },
      ],
    },
  ];

  const navItems2 = [
    {
      label: "Marketplace",
      icon: Store,
      submenu: [
        { label: "Browse", href: "/marketplace" },
        { label: "Sell", href: "/sell" },
        { label: "Orders", href: "/orders" },
        { label: "Wishlist", href: "/wishlist" },
      ],
    },
    {
      label: "Learning",
      icon: GraduationCap,
      submenu: [
        { label: "Courses", href: "/courses" },
        { label: "Certifications", href: "/certifications" },
        { label: "Tutorials", href: "/tutorials" },
        { label: "Resources", href: "/resources" },
      ],
    },
    {
      label: "Creator",
      icon: Sparkles,
      submenu: [
        { label: "Studio", href: "/creator-studio" },
        { label: "Analytics", href: "/creator-analytics" },
        { label: "Monetization", href: "/monetization" },
        { label: "Content", href: "/content" },
      ],
    },
    {
      label: "AI",
      icon: Code2,
      submenu: [
        { label: "AI Brain", href: "/ai-brain" },
        { label: "AI Assistant", href: "/ai-assistant" },
        { label: "AI Tools", href: "/ai-tools" },
        { label: "AI Agents", href: "/ai-agents" },
      ],
    },
    {
      label: "Tools",
      icon: Settings,
      submenu: [
        { label: "Dev Tools", href: "/dev-tools" },
        { label: "Utilities", href: "/utilities" },
        { label: "Converters", href: "/converters" },
        { label: "Generators", href: "/generators" },
      ],
    },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950 border-b border-slate-800">
      {/* Row 1 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <div key={item.label} className="relative group">
              {item.href ? (
                <Link href={item.href}>
                  <a className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:text-pink-400 transition-colors">
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.label}
                  </a>
                </Link>
              ) : (
                <button
                  onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:text-pink-400 transition-colors"
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
              {item.submenu && (
                <div className="absolute left-0 mt-0 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {item.submenu.map((sub) => (
                    <Link key={sub.label} href={sub.href}>
                      <a className="block px-4 py-2 text-sm text-white hover:bg-pink-600 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg">
                        {sub.label}
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <Link href="/dashboard">
          <a className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors">
            Dashboard
          </a>
        </Link>
      </div>

      {/* Row 2 */}
      <div className="flex items-center gap-1 px-4 py-3 bg-slate-900/50">
        {navItems2.map((item) => (
          <div key={item.label} className="relative group">
            {item.href ? (
              <Link href={item.href}>
                <a className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:text-pink-400 transition-colors">
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </a>
              </Link>
            ) : (
              <button
                onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:text-pink-400 transition-colors"
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
            {item.submenu && (
              <div className="absolute left-0 mt-0 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {item.submenu.map((sub) => (
                  <Link key={sub.label} href={sub.href}>
                    <a className="block px-4 py-2 text-sm text-white hover:bg-pink-600 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg">
                      {sub.label}
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
