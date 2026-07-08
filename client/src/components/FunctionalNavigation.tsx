import React, { useState } from 'react';
import { Link } from 'wouter';
import { ChevronDown } from 'lucide-react';

interface NavSection {
  label: string;
  path?: string;
  submenu?: { label: string; path: string }[];
}

const navSections: NavSection[] = [
  { label: 'Home', path: '/' },
  {
    label: 'Finance',
    submenu: [
      { label: 'Trading', path: '/trading' },
      { label: 'Portfolio', path: '/portfolio' },
      { label: 'Crypto', path: '/crypto-ai' },
      { label: 'Stocks', path: '/stocks' },
      { label: 'Wallet', path: '/wallet' },
      { label: 'Mining', path: '/mining' }
    ]
  },
  {
    label: 'Social',
    submenu: [
      { label: 'Feed', path: '/social-feed' },
      { label: 'Profiles', path: '/profiles' },
      { label: 'Messaging', path: '/messaging' },
      { label: 'Communities', path: '/communities' }
    ]
  },
  {
    label: 'Gaming',
    submenu: [
      { label: 'Games', path: '/games' },
      { label: 'Leaderboard', path: '/leaderboard' },
      { label: 'Tournaments', path: '/tournaments' },
      { label: 'Rewards', path: '/rewards' }
    ]
  },
  {
    label: 'Marketplace',
    submenu: [
      { label: 'Browse', path: '/marketplace' },
      { label: 'Sell', path: '/marketplace-sell' },
      { label: 'Orders', path: '/orders' },
      { label: 'Auctions', path: '/auctions' }
    ]
  },
  {
    label: 'Learning',
    submenu: [
      { label: 'Courses', path: '/courses' },
      { label: 'Tutorials', path: '/tutorials' },
      { label: 'Certifications', path: '/certifications' },
      { label: 'Resources', path: '/resources' }
    ]
  },
  {
    label: 'Creator',
    submenu: [
      { label: 'Dashboard', path: '/creator-dashboard' },
      { label: 'Analytics', path: '/creator-analytics' },
      { label: 'Monetization', path: '/monetization' },
      { label: 'Content', path: '/creator-content' }
    ]
  },
  {
    label: 'AI',
    submenu: [
      { label: 'Brain', path: '/ai-brain' },
      { label: 'Assistant', path: '/ai-assistant' },
      { label: 'Tools', path: '/ai-tools' },
      { label: 'Agents', path: '/ai-agents' }
    ]
  },
  {
    label: 'Tools',
    submenu: [
      { label: 'Developer', path: '/dev-tools' },
      { label: 'Utilities', path: '/utilities' },
      { label: 'Converters', path: '/converters' },
      { label: 'Generators', path: '/generators' }
    ]
  },
  {
    label: 'Admin',
    submenu: [
      { label: 'Dashboard', path: '/admin-dashboard' },
      { label: 'Users', path: '/admin-users' },
      { label: 'Settings', path: '/admin-settings' },
      { label: 'Reports', path: '/admin-reports' }
    ]
  }
];

export function FunctionalNavigation() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Navigation Row */}
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SKY</span>
            </div>
            <span className="text-white font-bold hidden sm:inline">SKYCOIN4444</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navSections.map((section) => (
              <div key={section.label} className="relative group">
                {section.path ? (
                  <Link href={section.path}>
                    <a className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors">
                      {section.label}
                    </a>
                  </Link>
                ) : (
                  <button className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors flex items-center gap-1">
                    {section.label}
                    <ChevronDown size={16} />
                  </button>
                )}

                {/* Dropdown Menu */}
                {section.submenu && (
                  <div className="absolute left-0 mt-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {section.submenu.map((item) => (
                      <Link key={item.path} href={item.path}>
                        <a className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 first:rounded-t-lg last:rounded-b-lg transition-colors">
                          {item.label}
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Secondary Navigation Row - All Sections */}
        <div className="hidden md:grid grid-cols-5 lg:grid-cols-10 gap-1 pb-2 border-t border-slate-700 pt-2">
          {navSections.map((section) => (
            <Link key={section.label} href={section.path || '#'}>
              <a className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-pink-400 hover:bg-slate-700/30 rounded transition-colors text-center whitespace-nowrap">
                {section.label}
              </a>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default FunctionalNavigation;
