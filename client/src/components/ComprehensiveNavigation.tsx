import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Menu, X, ChevronDown, Home, Wallet, TrendingUp, Users, Gamepad2,
  MessageCircle, Store, GraduationCap, Settings, Shield, Heart,
  Trophy, Zap, Code2, Bot, Vote, Lock, Globe, Sparkles, BarChart3,
  Briefcase, Layers, Radio, Map, Key, Terminal, Lightbulb, Grid3x3,
  BookOpen, DollarSign, Cpu, RefreshCw, ShieldCheck, Download,
  ShoppingCart, Upload, Package, Star, Award, Play, FileText, Bell, Sliders, HelpCircle, Headphones
} from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  submenu?: NavItem[];
}

const navigationStructure: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: <Home className="w-4 h-4" />,
  },
  {
    label: "Finance",
    icon: <DollarSign className="w-4 h-4" />,
    submenu: [
      { label: "Wallet", href: "/wallet", icon: <Wallet className="w-4 h-4" /> },
      { label: "Mining", href: "/mining", icon: <Zap className="w-4 h-4" /> },
      { label: "Trading", href: "/trading", icon: <TrendingUp className="w-4 h-4" /> },
      { label: "Staking", href: "/staking", icon: <Lock className="w-4 h-4" /> },
      { label: "Swap Pool", href: "/swap", icon: <RefreshCw className="w-4 h-4" /> },
      { label: "Portfolio", href: "/portfolio", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "Investments", href: "/investments", icon: <Briefcase className="w-4 h-4" /> },
    ],
  },
  {
    label: "Social",
    icon: <Users className="w-4 h-4" />,
    submenu: [
      { label: "Feed", href: "/feed", icon: <MessageCircle className="w-4 h-4" /> },
      { label: "Profile", href: "/profile", icon: <Users className="w-4 h-4" /> },
      { label: "Messages", href: "/messages", icon: <MessageCircle className="w-4 h-4" /> },
      { label: "Communities", href: "/communities", icon: <Globe className="w-4 h-4" /> },
      { label: "Dating", href: "/dating", icon: <Heart className="w-4 h-4" /> },
      { label: "Events", href: "/events", icon: <Radio className="w-4 h-4" /> },
      { label: "Groups", href: "/groups", icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    label: "Gaming",
    icon: <Gamepad2 className="w-4 h-4" />,
    submenu: [
      { label: "Game Hub", href: "/games", icon: <Gamepad2 className="w-4 h-4" /> },
      { label: "Crypto Arcade", href: "/games/arcade", icon: <Gamepad2 className="w-4 h-4" /> },
      { label: "Strategy Game", href: "/games/strategy", icon: <Trophy className="w-4 h-4" /> },
      { label: "Puzzle Game", href: "/games/puzzle", icon: <Grid3x3 className="w-4 h-4" /> },
      { label: "Leaderboards", href: "/leaderboards", icon: <Trophy className="w-4 h-4" /> },
      { label: "Tournaments", href: "/tournaments", icon: <Trophy className="w-4 h-4" /> },
      { label: "Rewards", href: "/rewards", icon: <Sparkles className="w-4 h-4" /> },
    ],
  },
  {
    label: "Marketplace",
    icon: <Store className="w-4 h-4" />,
    submenu: [
      { label: "Browse", href: "/marketplace", icon: <Store className="w-4 h-4" /> },
      { label: "Sell", href: "/sell", icon: <Upload className="w-4 h-4" /> },
      { label: "Cart", href: "/cart", icon: <ShoppingCart className="w-4 h-4" /> },
      { label: "Orders", href: "/orders", icon: <Package className="w-4 h-4" /> },
      { label: "Wishlist", href: "/wishlist", icon: <Heart className="w-4 h-4" /> },
      { label: "Reviews", href: "/reviews", icon: <Star className="w-4 h-4" /> },
      { label: "Escrow", href: "/escrow", icon: <Lock className="w-4 h-4" /> },
    ],
  },
  {
    label: "Learning",
    icon: <GraduationCap className="w-4 h-4" />,
    submenu: [
      { label: "School", href: "/school", icon: <GraduationCap className="w-4 h-4" /> },
      { label: "Courses", href: "/courses", icon: <BookOpen className="w-4 h-4" /> },
      { label: "Certifications", href: "/certifications", icon: <Award className="w-4 h-4" /> },
      { label: "Tutorials", href: "/tutorials", icon: <Play className="w-4 h-4" /> },
      { label: "Documentation", href: "/docs", icon: <FileText className="w-4 h-4" /> },
      { label: "API Reference", href: "/api", icon: <Code2 className="w-4 h-4" /> },
      { label: "Resources", href: "/resources", icon: <Layers className="w-4 h-4" /> },
    ],
  },
  {
    label: "Creator",
    icon: <Sparkles className="w-4 h-4" />,
    submenu: [
      { label: "Studio", href: "/creator-studio", icon: <Sparkles className="w-4 h-4" /> },
      { label: "Analytics", href: "/creator-analytics", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "Monetization", href: "/monetization", icon: <DollarSign className="w-4 h-4" /> },
      { label: "Content", href: "/content", icon: <FileText className="w-4 h-4" /> },
      { label: "Audience", href: "/audience", icon: <Users className="w-4 h-4" /> },
      { label: "Collaborations", href: "/collaborations", icon: <Users className="w-4 h-4" /> },
      { label: "Revenue", href: "/revenue", icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
  {
    label: "AI",
    icon: <Bot className="w-4 h-4" />,
    submenu: [
      { label: "Hope AI", href: "/hope-ai", icon: <Bot className="w-4 h-4" /> },
      { label: "Chat", href: "/ai-chat", icon: <MessageCircle className="w-4 h-4" /> },
      { label: "Assistants", href: "/assistants", icon: <Bot className="w-4 h-4" /> },
      { label: "Mining Bot", href: "/mining-bot", icon: <Zap className="w-4 h-4" /> },
      { label: "Trading Bot", href: "/trading-bot", icon: <TrendingUp className="w-4 h-4" /> },
      { label: "Automation", href: "/automation", icon: <Cpu className="w-4 h-4" /> },
      { label: "Analytics", href: "/ai-analytics", icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    label: "Tools",
    icon: <Terminal className="w-4 h-4" />,
    submenu: [
      { label: "Dashboard", href: "/dashboard", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
      { label: "Security", href: "/security", icon: <Shield className="w-4 h-4" /> },
      { label: "Notifications", href: "/notifications", icon: <Bell className="w-4 h-4" /> },
      { label: "Preferences", href: "/preferences", icon: <Sliders className="w-4 h-4" /> },
      { label: "Help", href: "/help", icon: <HelpCircle className="w-4 h-4" /> },
      { label: "Support", href: "/support", icon: <Headphones className="w-4 h-4" /> },
    ],
  },
  {
    label: "Admin",
    icon: <Lock className="w-4 h-4" />,
    submenu: [
      { label: "Admin Panel", href: "/admin", icon: <Settings className="w-4 h-4" /> },
      { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
      { label: "Content", href: "/admin/content", icon: <FileText className="w-4 h-4" /> },
      { label: "Transactions", href: "/admin/transactions", icon: <DollarSign className="w-4 h-4" /> },
      { label: "Reports", href: "/admin/reports", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "Moderation", href: "/admin/moderation", icon: <Shield className="w-4 h-4" /> },
      { label: "System", href: "/admin/system", icon: <Cpu className="w-4 h-4" /> },
    ],
  },
];

export default function ComprehensiveNavigation() {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-purple-500/30 bg-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between">
          <Link href="/">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663608806484/ebV4wfmMWhJ74jJTNddpvH/skycoin_444_logo-7e777mDBKBGyExP5rLjJpt.webp" alt="SKY4444 Logo" className="h-8 w-auto cursor-pointer hover:scale-105 transition-transform" />
          </Link>

          <div className="flex items-center gap-1 overflow-x-auto">
            {navigationStructure.map((item) => (
              <div key={item.label} className="relative group">
                <Link href={item.href || "#"}>
                  <button className="flex items-center gap-1 px-3 py-2 text-sm text-purple-300 hover:text-pink-400 transition-colors whitespace-nowrap group-hover:bg-purple-500/10 rounded-lg">
                    {item.icon}
                    {item.label}
                    {item.submenu && <ChevronDown className="w-3 h-3" />}
                  </button>
                </Link>

                {/* Submenu */}
                {item.submenu && (
                  <div className="absolute left-0 mt-0 w-48 bg-black/95 border border-purple-500/30 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {item.submenu.map((subitem) => (
                      <Link key={subitem.label} href={subitem.href || "#"}>
                        <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-300 hover:text-pink-400 hover:bg-purple-500/10 transition-all border-b border-purple-500/10 last:border-b-0">
                          {subitem.icon}
                          {subitem.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/50">
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-between">
          <Link href="/">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663608806484/ebV4wfmMWhJ74jJTNddpvH/skycoin_444_logo-7e777mDBKBGyExP5rLjJpt.webp" alt="SKY4444 Logo" className="h-7 w-auto cursor-pointer" />
          </Link>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 space-y-2 pb-4 max-h-96 overflow-y-auto">
            {navigationStructure.map((item) => (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-purple-300 hover:text-pink-400 hover:bg-purple-500/10 rounded-lg transition-all"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </div>
                  {item.submenu && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        openMenus.includes(item.label) ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {/* Mobile Submenu */}
                {item.submenu && openMenus.includes(item.label) && (
                  <div className="ml-4 space-y-1 mt-1">
                    {item.submenu.map((subitem) => (
                      <Link key={subitem.label} href={subitem.href || "#"}>
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-purple-300 hover:text-pink-400 hover:bg-purple-500/10 rounded-lg transition-all">
                          {subitem.icon}
                          {subitem.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 mt-4">
                Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}


