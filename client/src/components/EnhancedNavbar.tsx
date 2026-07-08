import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import {
  ChevronDown,
  Home,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  Gamepad2,
  Store,
  GraduationCap,
  Sparkles,
  Code2,
  Settings,
  Zap,
  Wallet,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  submenu?: Array<{
    label: string;
    href: string;
    description?: string;
  }>;
}

export function EnhancedNavbar() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = useMemo(() => [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="w-4 h-4" />,
    },
    {
      label: '💰 Finance',
      icon: <DollarSign className="w-4 h-4" />,
      submenu: [
        { label: 'Trading Dashboard', href: '/trading', description: 'Real-time trading' },
        { label: 'Portfolio', href: '/portfolio', description: 'Manage investments' },
        { label: 'Wallet', href: '/wallet', description: 'Multi-chain wallet' },
        { label: 'Mining', href: '/mining', description: 'Crypto mining' },
        { label: 'Staking', href: '/staking', description: 'Earn rewards' },
        { label: 'Cross-chain Swaps', href: '/swaps', description: 'Atomic swaps' },
        { label: 'Yield Farming', href: '/yield-farming', description: 'DeFi yields' },
        { label: 'Day Trading', href: '/day-trading', description: 'Active trading' },
      ],
    },
    {
      label: '📊 Crypto',
      icon: <TrendingUp className="w-4 h-4" />,
      submenu: [
        { label: 'Markets', href: '/crypto-markets', description: 'Market data' },
        { label: 'Analysis', href: '/crypto-analysis', description: 'Technical analysis' },
        { label: 'Signals', href: '/trading-signals', description: 'Trading signals' },
        { label: 'Price Alerts', href: '/price-alerts', description: 'Custom alerts' },
      ],
    },
    {
      label: '📈 Stocks',
      icon: <BarChart3 className="w-4 h-4" />,
      submenu: [
        { label: 'Stock Markets', href: '/stocks', description: 'Global markets' },
        { label: 'Watchlist', href: '/watchlist', description: 'Track stocks' },
        { label: 'Portfolio', href: '/stock-portfolio', description: 'Your holdings' },
        { label: 'Research', href: '/stock-research', description: 'Analysis tools' },
      ],
    },
    {
      label: '👥 Social',
      icon: <Users className="w-4 h-4" />,
      submenu: [
        { label: 'Feed', href: '/feed', description: 'Social feed' },
        { label: 'Profiles', href: '/profiles', description: 'User profiles' },
        { label: 'Messages', href: '/messages', description: 'Direct messaging' },
        { label: 'Communities', href: '/communities', description: 'Join communities' },
        { label: 'Comments', href: '/comments', description: 'Discussions' },
        { label: 'Follows', href: '/follows', description: 'Follow users' },
      ],
    },
    {
      label: '🎮 Gaming',
      icon: <Gamepad2 className="w-4 h-4" />,
      submenu: [
        { label: 'Games', href: '/games', description: 'Play games' },
        { label: 'Leaderboards', href: '/leaderboards', description: 'Rankings' },
        { label: 'Tournaments', href: '/tournaments', description: 'Compete' },
        { label: 'Rewards', href: '/rewards', description: 'Earn rewards' },
        { label: 'Quests', href: '/quests', description: 'Daily quests' },
        { label: 'Crypto Games', href: '/crypto-games', description: 'Blockchain games' },
      ],
    },
    {
      label: '🛍️ Marketplace',
      icon: <Store className="w-4 h-4" />,
      submenu: [
        { label: 'Browse', href: '/marketplace', description: 'Product listings' },
        { label: 'Sell', href: '/sell', description: 'Vendor management' },
        { label: 'Orders', href: '/orders', description: 'Order tracking' },
        { label: 'Escrow', href: '/escrow', description: 'Secure payments' },
        { label: 'Bulk Ordering', href: '/bulk-ordering', description: 'B2B orders' },
        { label: 'Wishlist', href: '/wishlist', description: 'Save items' },
      ],
    },
    {
      label: '🎓 Learning',
      icon: <GraduationCap className="w-4 h-4" />,
      submenu: [
        { label: 'Courses', href: '/courses', description: 'Online courses' },
        { label: 'Certifications', href: '/certifications', description: 'Earn certs' },
        { label: 'Tutorials', href: '/tutorials', description: 'Video tutorials' },
        { label: 'Resources', href: '/resources', description: 'Learning materials' },
        { label: 'Lessons', href: '/lessons', description: 'Structured lessons' },
        { label: 'Quizzes', href: '/quizzes', description: 'Test knowledge' },
      ],
    },
    {
      label: '✨ Creator',
      icon: <Sparkles className="w-4 h-4" />,
      submenu: [
        { label: 'Studio', href: '/creator-studio', description: 'Content studio' },
        { label: 'Analytics', href: '/creator-analytics', description: 'Performance' },
        { label: 'Monetization', href: '/monetization', description: 'Earn money' },
        { label: 'Content', href: '/content', description: 'Manage content' },
        { label: 'Streaming', href: '/live-streaming', description: 'Go live' },
        { label: 'Creator Economy', href: '/creator-economy', description: 'Marketplace' },
      ],
    },
    {
      label: '🤖 AI',
      icon: <Code2 className="w-4 h-4" />,
      submenu: [
        { label: 'AI Brain', href: '/ai-brain', description: 'Core AI' },
        { label: 'AI Assistant', href: '/ai-assistant', description: 'Chat AI' },
        { label: 'AI Tools', href: '/ai-tools', description: 'AI utilities' },
        { label: 'AI Agents', href: '/ai-agents', description: 'Autonomous agents' },
        { label: 'AI Trading', href: '/ai-trading', description: 'Bot trading' },
        { label: 'Code Studio', href: '/code-studio', description: 'Code generation' },
        { label: 'Agent Market', href: '/agent-market', description: 'Buy/sell agents' },
      ],
    },
    {
      label: '⚙️ Admin',
      icon: <Settings className="w-4 h-4" />,
      submenu: [
        { label: 'Dashboard', href: '/admin-dashboard', description: 'Admin panel' },
        { label: 'Users', href: '/admin-users', description: 'User management' },
        { label: 'Moderation', href: '/moderation', description: 'Content moderation' },
        { label: 'Settings', href: '/admin-settings', description: 'System settings' },
        { label: 'Audit Logs', href: '/audit-logs', description: 'Activity logs' },
        { label: 'Reports', href: '/admin-reports', description: 'Analytics' },
      ],
    },
    {
      label: '🔌 API',
      icon: <Zap className="w-4 h-4" />,
      submenu: [
        { label: 'Documentation', href: '/api-docs', description: 'API reference' },
        { label: 'Keys', href: '/api-keys', description: 'API management' },
        { label: 'Webhooks', href: '/webhooks', description: 'Event webhooks' },
        { label: 'Testing', href: '/api-testing', description: 'Test endpoints' },
        { label: 'Monitoring', href: '/api-monitoring', description: 'Monitor usage' },
        { label: 'Integration', href: '/api-integration', description: 'Integration guide' },
      ],
    },
    {
      label: '📊 Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      submenu: [
        { label: 'Dashboard', href: '/analytics-dashboard', description: 'Analytics' },
        { label: 'Reports', href: '/analytics-reports', description: 'Custom reports' },
        { label: 'Charts', href: '/analytics-charts', description: 'Data viz' },
        { label: 'Metrics', href: '/analytics-metrics', description: 'KPIs' },
        { label: 'Exports', href: '/analytics-exports', description: 'Export data' },
      ],
    },
    {
      label: '👤 Profile',
      icon: <Wallet className="w-4 h-4" />,
      submenu: [
        { label: 'My Profile', href: '/profile', description: 'User profile' },
        { label: 'Followers', href: '/followers', description: 'Your followers' },
        { label: 'Verification', href: '/verification', description: 'KYC/AML' },
        { label: 'Earnings', href: '/earnings', description: 'Income tracking' },
        { label: 'Settings', href: '/settings', description: 'Account settings' },
        { label: 'Privacy', href: '/privacy-settings', description: 'Privacy controls' },
      ],
    },
  ], []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 shadow-2xl backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-300 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg">
              SK
            </div>
            <span className="hidden sm:inline">SKY4444</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center px-8">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative group"
                onMouseEnter={() => item.submenu && setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.href ? (
                  <Link href={item.href} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-pink-400 hover:bg-pink-600/10 rounded-lg transition-all duration-200 whitespace-nowrap">
                    {item.icon}
                    {item.label}
                  </Link>
                ) : (
                  <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-pink-400 hover:bg-pink-600/10 rounded-lg transition-all duration-200 whitespace-nowrap">
                    {item.icon}
                    {item.label}
                    {item.submenu && <ChevronDown className="w-4 h-4" />}
                  </button>
                )}

                {/* Dropdown Menu */}
                {item.submenu && (
                  <div className="absolute left-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                    {item.submenu.map((sub) => (
                      <Link key={sub.label} href={sub.href} className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-pink-600/20 hover:text-pink-400 transition-all duration-150 border-l-2 border-transparent hover:border-pink-500 mx-1 rounded">
                        <div className="font-medium">{sub.label}</div>
                        {sub.description && (
                          <div className="text-xs text-slate-500 mt-0.5">{sub.description}</div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/dashboard" className="hidden sm:inline-flex px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-pink-500/50">
              Dashboard
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-pink-400 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-md max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => (
              <div key={item.label} className="border-b border-slate-800">
                {item.href ? (
                  <Link href={item.href}>
                    <a
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-300 hover:text-pink-400 hover:bg-pink-600/10 transition-all duration-150 rounded-lg mx-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      {item.label}
                    </a>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === item.label ? null : item.label
                        )
                      }
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-300 hover:text-pink-400 hover:bg-pink-600/10 transition-all duration-150 rounded-lg"
                    >
                      {item.icon}
                      {item.label}
                      {item.submenu && (
                        <ChevronDown
                          className={`w-4 h-4 ml-auto transition-transform ${
                            openDropdown === item.label ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Mobile Submenu */}
                    {item.submenu && openDropdown === item.label && (
                      <div className="bg-slate-800/50 border-t border-slate-700">
                        {item.submenu.map((sub) => (
                          <Link key={sub.label} href={sub.href}>
                            <a
                              className="flex flex-col px-6 py-2.5 text-sm text-slate-400 hover:text-pink-400 transition-all duration-150 rounded-lg mx-2"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <span className="font-medium">{sub.label}</span>
                              {sub.description && (
                                <span className="text-xs text-slate-600 mt-0.5">
                                  {sub.description}
                                </span>
                              )}
                            </a>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
