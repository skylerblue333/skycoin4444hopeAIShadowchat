import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface NavigationSuggestion {
  path: string;
  label: string;
  reason: string;
  score: number;
  icon?: string;
}

export interface UserNavigationPattern {
  path: string;
  timestamp: number;
  duration: number;
  frequency: number;
}

export const useSmartNavigation = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<NavigationSuggestion[]>([]);
  const [recentPages, setRecentPages] = useState<string[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<UserNavigationPattern[]>([]);

  // Track navigation patterns
  const trackNavigation = useCallback((path: string) => {
    const now = Date.now();
    setNavigationHistory((prev) => {
      const existing = prev.find((p) => p.path === path);
      if (existing) {
        return prev.map((p) =>
          p.path === path
            ? { ...p, frequency: p.frequency + 1, timestamp: now }
            : p
        );
      }
      return [...prev, { path, timestamp: now, duration: 0, frequency: 1 }];
    });

    // Update recent pages
    setRecentPages((prev) => {
      const filtered = prev.filter((p) => p !== path);
      return [path, ...filtered].slice(0, 5);
    });
  }, []);

  // Generate AI suggestions based on user behavior
  const generateSuggestions = useCallback((): NavigationSuggestion[] => {
    const suggestions: NavigationSuggestion[] = [];

    // Based on user role
    if (user?.role === 'admin') {
      suggestions.push(
        { path: '/admin/dashboard', label: 'Admin Dashboard', reason: 'Admin access', score: 0.95, icon: '⚙️' },
        { path: '/admin/users', label: 'User Management', reason: 'Admin access', score: 0.9, icon: '👥' },
        { path: '/admin/analytics', label: 'Analytics', reason: 'Admin access', score: 0.85, icon: '📊' }
      );
    }

    // Based on frequency
    navigationHistory
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)
      .forEach((pattern) => {
        suggestions.push({
          path: pattern.path,
          label: pattern.path.split('/').pop()?.replace('-', ' ') || 'Page',
          reason: `You visit this ${pattern.frequency} times`,
          score: Math.min(0.95, 0.5 + pattern.frequency * 0.1),
          icon: '⏱️',
        });
      });

    // Based on time of day
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      suggestions.push({
        path: '/trading',
        label: 'Trading',
        reason: 'Active trading hours',
        score: 0.8,
        icon: '📈',
      });
    } else if (hour >= 18 && hour <= 23) {
      suggestions.push({
        path: '/social',
        label: 'Social',
        reason: 'Evening activity',
        score: 0.75,
        icon: '💬',
      });
    }

    // Based on recent activity
    if (recentPages.length > 0) {
      const relatedPages: Record<string, string[]> = {
        '/mining': ['/mining/dashboard', '/mining/calculator', '/mining/pools'],
        '/trading': ['/trading/orders', '/trading/history', '/trading/alerts'],
        '/social': ['/social/feed', '/social/messages', '/social/profile'],
        '/gaming': ['/gaming/games', '/gaming/tournaments', '/gaming/achievements'],
        '/marketplace': ['/marketplace/listings', '/marketplace/purchases', '/marketplace/reviews'],
      };

      const lastPage = recentPages[0];
      const related = relatedPages[lastPage] || [];
      related.forEach((path) => {
        suggestions.push({
          path,
          label: path.split('/').pop()?.replace('-', ' ') || 'Page',
          reason: 'Related to recent activity',
          score: 0.7,
          icon: '🔗',
        });
      });
    }

    // Personalized recommendations based on user role
    if (user?.role === 'creator') {
      suggestions.push({
        path: '/social',
        label: 'Social',
        reason: 'Based on your role',
        score: 0.85,
        icon: '💬',
      });
    }

    if (user?.role === 'admin') {
      suggestions.push({
        path: '/admin/dashboard',
        label: 'Admin Dashboard',
        reason: 'Based on your role',
        score: 0.95,
        icon: '⚙️',
      });
    }

    // Remove duplicates and sort by score
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map((s) => [s.path, s])).values()
    ).sort((a, b) => b.score - a.score);

    return uniqueSuggestions.slice(0, 8);
  }, [user, navigationHistory, recentPages]);

  // Update suggestions periodically
  useEffect(() => {
    const newSuggestions = generateSuggestions();
    setSuggestions(newSuggestions);
  }, [generateSuggestions]);

  // Get personalized navigation based on role
  const getPersonalizedNavigation = useCallback(() => {
    const baseNav = [
      { label: 'Home', path: '/', icon: '🏠' },
      { label: 'Mining', path: '/mining', icon: '⛏️' },
      { label: 'Trading', path: '/trading', icon: '📈' },
      { label: 'Social', path: '/social', icon: '💬' },
      { label: 'Gaming', path: '/gaming', icon: '🎮' },
      { label: 'Marketplace', path: '/marketplace', icon: '🛒' },
      { label: 'Governance', path: '/governance', icon: '🗳️' },
    ];

    if (user?.role === 'admin') {
      baseNav.push(
        { label: 'Admin', path: '/admin', icon: '⚙️' },
        { label: 'Analytics', path: '/analytics', icon: '📊' },
        { label: 'Settings', path: '/settings', icon: '⚙️' }
      );
    }

    return baseNav;
  }, [user?.role]);

  return {
    suggestions,
    recentPages,
    navigationHistory,
    trackNavigation,
    generateSuggestions,
    getPersonalizedNavigation,
  };
};

export default useSmartNavigation;
