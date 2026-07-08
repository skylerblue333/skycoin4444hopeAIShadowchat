import { useState, useEffect, useCallback } from 'react';

export interface UserBehavior {
  pageViews: Record<string, number>;
  featureUsage: Record<string, number>;
  timeSpent: Record<string, number>;
  interactions: string[];
  lastActiveFeature: string;
  sessionDuration: number;
  totalSessions: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  feature: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  action: () => void;
  icon?: string;
}

export function useAIRecommendations() {
  const [behavior, setBehavior] = useState<UserBehavior>({
    pageViews: {},
    featureUsage: {},
    timeSpent: {},
    interactions: [],
    lastActiveFeature: '',
    sessionDuration: 0,
    totalSessions: 0,
  });

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Track user behavior
  useEffect(() => {
    const trackPageView = (page: string) => {
      setBehavior(prev => ({
        ...prev,
        pageViews: {
          ...prev.pageViews,
          [page]: (prev.pageViews[page] || 0) + 1,
        },
        lastActiveFeature: page,
      }));
    };

    const trackFeatureUsage = (feature: string) => {
      setBehavior(prev => ({
        ...prev,
        featureUsage: {
          ...prev.featureUsage,
          [feature]: (prev.featureUsage[feature] || 0) + 1,
        },
      }));
    };

    // Listen to navigation events
    const handlePopState = () => {
      trackPageView(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Generate recommendations based on behavior
  const generateRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      // Analyze behavior patterns
      const unusedFeatures = analyzeUnusedFeatures(behavior);
      const relatedFeatures = findRelatedFeatures(behavior);
      const optimizationTips = generateOptimizationTips(behavior);

      const newRecommendations: Recommendation[] = [];

      // Unused features recommendations
      unusedFeatures.forEach(feature => {
        newRecommendations.push({
          id: `unused-${feature.name}`,
          title: `Try ${feature.name}`,
          description: `You haven't explored ${feature.name} yet. It could help you ${feature.benefit}.`,
          feature: feature.name,
          reason: 'Unused feature',
          priority: 'medium',
          action: () => window.location.href = feature.url,
          icon: feature.icon,
        });
      });

      // Related features recommendations
      relatedFeatures.forEach(feature => {
        newRecommendations.push({
          id: `related-${feature.name}`,
          title: `Complement with ${feature.name}`,
          description: `Based on your usage of ${behavior.lastActiveFeature}, you might like ${feature.name}.`,
          feature: feature.name,
          reason: 'Related to your activity',
          priority: 'high',
          action: () => window.location.href = feature.url,
          icon: feature.icon,
        });
      });

      // Optimization tips
      optimizationTips.forEach(tip => {
        newRecommendations.push({
          id: `tip-${tip.id}`,
          title: tip.title,
          description: tip.description,
          feature: tip.feature,
          reason: 'Optimization tip',
          priority: 'low',
          action: tip.action,
          icon: tip.icon,
        });
      });

      setRecommendations(newRecommendations.slice(0, 5)); // Top 5 recommendations
    } catch (error) {
          } finally {
      setIsLoading(false);
    }
  }, [behavior]);

  // Analyze unused features
  const analyzeUnusedFeatures = (behavior: UserBehavior) => {
    const allFeatures = [
      { name: 'Mining', url: '/miner-dashboard', benefit: 'earn passive income', icon: '⛏️' },
      { name: 'Trading', url: '/trading', benefit: 'trade cryptocurrencies', icon: '📈' },
      { name: 'Gaming', url: '/gaming', benefit: 'earn rewards through games', icon: '🎮' },
      { name: 'Marketplace', url: '/marketplace', benefit: 'buy and sell items', icon: '🛍️' },
      { name: 'Governance', url: '/governance', benefit: 'vote on proposals', icon: '🗳️' },
      { name: 'Charity', url: '/charity', benefit: 'contribute to causes', icon: '❤️' },
      { name: 'School', url: '/sky-school', benefit: 'learn and earn', icon: '🎓' },
    ];

    return allFeatures
      .filter(f => !behavior.featureUsage[f.name] || behavior.featureUsage[f.name] === 0)
      .slice(0, 2);
  };

  // Find related features
  const findRelatedFeatures = (behavior: UserBehavior) => {
    const featureRelations: Record<string, any[]> = {
      'Mining': [
        { name: 'Trading', url: '/trading', benefit: 'sell mined coins', icon: '📈' },
        { name: 'Wallet', url: '/wallet', benefit: 'manage earnings', icon: '💰' },
      ],
      'Trading': [
        { name: 'Marketplace', url: '/marketplace', benefit: 'diversify portfolio', icon: '🛍️' },
        { name: 'Analytics', url: '/analytics', benefit: 'track performance', icon: '📊' },
      ],
      'Gaming': [
        { name: 'Marketplace', url: '/marketplace', benefit: 'sell gaming items', icon: '🛍️' },
        { name: 'Leaderboard', url: '/leaderboard', benefit: 'compete with others', icon: '🏆' },
      ],
      'Social': [
        { name: 'Gaming', url: '/gaming', benefit: 'play with friends', icon: '🎮' },
        { name: 'Marketplace', url: '/marketplace', benefit: 'share items', icon: '🛍️' },
      ],
    };

    const lastFeature = behavior.lastActiveFeature;
    return featureRelations[lastFeature] || [];
  };

  // Generate optimization tips
  const generateOptimizationTips = (behavior: UserBehavior) => {
    const tips = [];

    // Tip 1: Diversification
    const usedFeatures = Object.keys(behavior.featureUsage).length;
    if (usedFeatures < 3) {
      tips.push({
        id: 'diversify',
        title: 'Diversify Your Portfolio',
        description: 'Try using multiple features to maximize your earnings.',
        feature: 'Portfolio',
        action: () => alert('Diversification guide'),
        icon: '📊',
      });
    }

    // Tip 2: Daily activity
    if (behavior.totalSessions < 5) {
      tips.push({
        id: 'daily-activity',
        title: 'Daily Activity Bonus',
        description: 'Log in daily to earn bonus rewards.',
        feature: 'Rewards',
        action: () => alert('Daily bonus info'),
        icon: '🎁',
      });
    }

    // Tip 3: Command palette
    if (!behavior.interactions.includes('command-palette')) {
      tips.push({
        id: 'command-palette',
        title: 'Use Command Palette',
        description: 'Press Cmd+K to quickly access any feature.',
        feature: 'Navigation',
        action: () => alert('Command palette tutorial'),
        icon: '⌨️',
      });
    }

    return tips;
  };

  return {
    behavior,
    recommendations,
    generateRecommendations,
    isLoading,
    trackFeatureUsage: (feature: string) => {
      setBehavior(prev => ({
        ...prev,
        featureUsage: {
          ...prev.featureUsage,
          [feature]: (prev.featureUsage[feature] || 0) + 1,
        },
      }));
    },
  };
}
