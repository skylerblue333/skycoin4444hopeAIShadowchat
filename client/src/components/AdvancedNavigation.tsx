import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Search, Bell, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  badge?: number;
}

interface AdvancedNavigationProps {
  items: NavItem[];
  onNavigate?: (path: string) => void;
}

export const AdvancedNavigation: React.FC<AdvancedNavigationProps> = ({ items, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
    onNavigate?.(path);
  };

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between bg-background border-b border-border px-6 py-4">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
            SKYCOIN4444
          </div>

          {/* Main Menu */}
          <div className="flex items-center gap-1">
            {items.slice(0, 5).map((item) => (
              <div key={item.href} className="relative group">
                <button
                  onClick={() => handleNavigate(item.href)}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                >
                  {item.icon}
                  {item.label}
                  {item.children && <ChevronDown className="w-4 h-4" />}
                  {item.badge && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Mega Menu */}
                {item.children && (
                  <div className="absolute left-0 mt-0 w-48 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {item.children.map((child) => (
                      <button
                        key={child.href}
                        onClick={() => handleNavigate(child.href)}
                        className="block w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* User Profile */}
          {user ? (
            <div className="flex items-center gap-2 pl-4 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
          ) : (
            <Button variant="default" size="sm">
              Sign In
            </Button>
          )}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="text-xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
          SKY4444
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-4 py-3 space-y-2">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Mobile Menu Items */}
            {filteredItems.map((item) => (
              <div key={item.href}>
                <button
                  onClick={() => {
                    if (item.children) {
                      setExpandedMenu(expandedMenu === item.href ? null : item.href);
                    } else {
                      handleNavigate(item.href);
                    }
                  }}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                    {item.badge && (
                      <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  {item.children && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedMenu === item.href ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Mobile Submenu */}
                {item.children && expandedMenu === item.href && (
                  <div className="pl-4 space-y-1">
                    {item.children.map((child) => (
                      <button
                        key={child.href}
                        onClick={() => handleNavigate(child.href)}
                        className="w-full text-left px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation />
    </>
  );
};

// Breadcrumb Component
const BreadcrumbNavigation: React.FC = () => {
  const [location] = useLocation();
  const segments = location.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <div className="hidden md:flex items-center gap-2 px-6 py-2 bg-background border-b border-border text-sm text-muted-foreground">
      <button className="hover:text-foreground transition-colors">Home</button>
      {segments.map((segment, index) => (
        <React.Fragment key={segment}>
          <span>/</span>
          <button className="hover:text-foreground transition-colors capitalize">
            {segment.replace('-', ' ')}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default AdvancedNavigation;
