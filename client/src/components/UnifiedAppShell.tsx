import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Home, Zap, Users, Gamepad2, Brain, Coins, Heart, Settings, LogOut,
  Menu, X, Bell, Search, User, TrendingUp, Sparkles, MessageSquare,
  Award, Wallet, ShoppingCart, Tv, Radio, Code, Lightbulb
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  category: "main" | "features" | "social" | "tools" | "admin";
  badge?: number;
  color?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Main
  { id: "home", label: "Home", icon: <Home className="w-5 h-5" />, path: "/", category: "main" },
  { id: "feed", label: "Feed", icon: <TrendingUp className="w-5 h-5" />, path: "/feed", category: "main", badge: 12 },
  { id: "discover", label: "Discover", icon: <Sparkles className="w-5 h-5" />, path: "/discover", category: "main" },

  // Features
  { id: "hope-ai", label: "Hope AI", icon: <Brain className="w-5 h-5" />, path: "/hope-ai-meta", category: "features", color: "text-purple-400" },
  { id: "sky-school", label: "Sky School", icon: <Lightbulb className="w-5 h-5" />, path: "/sky-school", category: "features", color: "text-cyan-400" },
  { id: "gaming", label: "Gaming", icon: <Gamepad2 className="w-5 h-5" />, path: "/gaming", category: "features", color: "text-orange-400" },
  { id: "crypto", label: "Crypto", icon: <Coins className="w-5 h-5" />, path: "/crypto", category: "features", color: "text-yellow-400" },
  { id: "marketplace", label: "Marketplace", icon: <ShoppingCart className="w-5 h-5" />, path: "/marketplace", category: "features", color: "text-green-400" },

  // Social
  { id: "social", label: "Social", icon: <Users className="w-5 h-5" />, path: "/social", category: "social" },
  { id: "messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, path: "/messages", category: "social", badge: 3 },
  { id: "charity", label: "Charity", icon: <Heart className="w-5 h-5" />, path: "/charity", category: "social", color: "text-red-400" },

  // Tools
  { id: "live", label: "Live", icon: <Tv className="w-5 h-5" />, path: "/live", category: "tools", color: "text-red-500" },
  { id: "wallet", label: "Wallet", icon: <Wallet className="w-5 h-5" />, path: "/wallet", category: "tools", color: "text-cyan-400" },
  { id: "achievements", label: "Achievements", icon: <Award className="w-5 h-5" />, path: "/achievements", category: "tools", color: "text-yellow-400" },
];

export function UnifiedAppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(5);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    setLocation("/");
  };

  const handleNavClick = (path: string) => {
    if (!isAuthenticated && path !== "/" && path !== "/discover") {
      toast.error("Sign in to access this feature");
      setLocation("/signin");
      return;
    }
    setLocation(path);
    setSidebarOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
    }
  };

  const currentNav = NAV_ITEMS.find(item => item.path === location);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">SKYCOIN4444</h1>
          </div>
          <p className="text-xs text-slate-400">One Platform. Unlimited Potential.</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Main Section */}
          <div>
            <p className="text-xs font-semibold text-slate-400 px-3 py-2 uppercase tracking-wider">Main</p>
            {NAV_ITEMS.filter(i => i.category === "main").map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                  location === item.path
                    ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Features Section */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-400 px-3 py-2 uppercase tracking-wider">Features</p>
            {NAV_ITEMS.filter(i => i.category === "features").map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  location === item.path
                    ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <span className={item.color}>{item.icon}</span>
                <span className="flex-1 text-left text-sm">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Social Section */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-400 px-3 py-2 uppercase tracking-wider">Social</p>
            {NAV_ITEMS.filter(i => i.category === "social").map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  location === item.path
                    ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <span className={item.color}>{item.icon}</span>
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tools Section */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-400 px-3 py-2 uppercase tracking-wider">Tools</p>
            {NAV_ITEMS.filter(i => i.category === "tools").map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  location === item.path
                    ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <span className={item.color}>{item.icon}</span>
                <span className="flex-1 text-left text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            onClick={() => handleNavClick("/settings")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </button>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-slate-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h2 className="text-lg font-semibold text-white">
                {currentNav?.label || "SKYCOIN4444"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              {showSearch ? (
                <form onSubmit={handleSearch} className="relative">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-64 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    onBlur={() => setShowSearch(false)}
                  />
                </form>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Notifications */}
              <button className="relative text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* User Profile */}
              {isAuthenticated && user ? (
                <button
                  onClick={() => handleNavClick("/profile")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600" />
                  <span className="text-sm text-white hidden sm:inline">{user.email?.split("@")[0]}</span>
                </button>
              ) : (
                <Button
                  onClick={() => handleNavClick("/signin")}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default UnifiedAppShell;
