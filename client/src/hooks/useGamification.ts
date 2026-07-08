import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  achievements: Achievement[];
  badges: Badge[];
  totalCoins: number;
  dailyBonus: number;
  nextLevelXp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  icon: string;
  earnedAt: number;
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1500, 2500, 4000, 6000, 10000];

const ACHIEVEMENTS = [
  {
    id: "first-login",
    title: "Welcome Aboard",
    description: "Complete your first login",
    icon: "🚀",
    xpReward: 50,
    maxProgress: 1,
  },
  {
    id: "stake-100",
    title: "Staker",
    description: "Stake 100 SKY4 tokens",
    icon: "💰",
    xpReward: 200,
    maxProgress: 100,
  },
  {
    id: "trading-spree",
    title: "Trader",
    description: "Complete 10 trades",
    icon: "📈",
    xpReward: 150,
    maxProgress: 10,
  },
  {
    id: "social-butterfly",
    title: "Social Butterfly",
    description: "Follow 50 users",
    icon: "🦋",
    xpReward: 100,
    maxProgress: 50,
  },
  {
    id: "course-master",
    title: "Course Master",
    description: "Complete 5 Sky School courses",
    icon: "🎓",
    xpReward: 500,
    maxProgress: 5,
  },
  {
    id: "charity-hero",
    title: "Charity Hero",
    description: "Donate to 10 charity campaigns",
    icon: "❤️",
    xpReward: 300,
    maxProgress: 10,
  },
  {
    id: "gaming-champion",
    title: "Gaming Champion",
    description: "Win 20 games",
    icon: "🏆",
    xpReward: 250,
    maxProgress: 20,
  },
  {
    id: "ai-expert",
    title: "AI Expert",
    description: "Use Hope AI 100 times",
    icon: "🤖",
    xpReward: 200,
    maxProgress: 100,
  },
];

export function useGamification() {
  const [state, setState] = useState<GamificationState>({
    xp: 0,
    level: 1,
    streak: 0,
    achievements: ACHIEVEMENTS.map(a => ({ ...a, progress: 0, unlockedAt: undefined })),
    badges: [],
    totalCoins: 0,
    dailyBonus: 0,
    nextLevelXp: LEVEL_THRESHOLDS[1],
  });

  // Add XP and handle level ups
  const addXP = useCallback((amount: number, reason: string) => {
    setState(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let leveledUp = false;

      // Check for level up
      while (newLevel < LEVEL_THRESHOLDS.length && newXp >= LEVEL_THRESHOLDS[newLevel]) {
        newLevel++;
        leveledUp = true;
      }

      if (leveledUp) {
        toast.success(`🎉 Level Up! You're now level ${newLevel}!`);
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: LEVEL_THRESHOLDS[Math.min(newLevel, LEVEL_THRESHOLDS.length - 1)],
      };
    });

    toast.success(`+${amount} XP - ${reason}`);
  }, []);

  // Add coins
  const addCoins = useCallback((amount: number, reason: string) => {
    setState(prev => ({
      ...prev,
      totalCoins: prev.totalCoins + amount,
    }));
    toast.success(`+${amount} SKY4 - ${reason}`);
  }, []);

  // Unlock achievement
  const unlockAchievement = useCallback((achievementId: string) => {
    setState(prev => {
      const achievement = prev.achievements.find(a => a.id === achievementId);
      if (!achievement || achievement.unlockedAt) return prev;

      const newAchievements = prev.achievements.map(a =>
        a.id === achievementId ? { ...a, unlockedAt: Date.now() } : a
      );

      toast.success(`🏆 Achievement Unlocked: ${achievement.title}`);

      return {
        ...prev,
        achievements: newAchievements,
        xp: prev.xp + achievement.xpReward,
      };
    });
  }, []);

  // Update achievement progress
  const updateAchievementProgress = useCallback((achievementId: string, progress: number) => {
    setState(prev => {
      const achievement = prev.achievements.find(a => a.id === achievementId);
      if (!achievement || achievement.unlockedAt) return prev;

      const newProgress = Math.min(progress, achievement.maxProgress);
      const newAchievements = prev.achievements.map(a =>
        a.id === achievementId ? { ...a, progress: newProgress } : a
      );

      // Check if achievement should be unlocked
      if (newProgress >= achievement.maxProgress) {
        return {
          ...prev,
          achievements: newAchievements.map(a =>
            a.id === achievementId ? { ...a, unlockedAt: Date.now() } : a
          ),
          xp: prev.xp + achievement.xpReward,
        };
      }

      return {
        ...prev,
        achievements: newAchievements,
      };
    });
  }, []);

  // Earn badge
  const earnBadge = useCallback((badge: Badge) => {
    setState(prev => ({
      ...prev,
      badges: [...prev.badges, badge],
    }));
    toast.success(`🎖️ Badge Earned: ${badge.name}`);
  }, []);

  // Increase streak
  const increaseStreak = useCallback(() => {
    setState(prev => ({
      ...prev,
      streak: prev.streak + 1,
    }));
  }, []);

  // Reset streak
  const resetStreak = useCallback(() => {
    setState(prev => ({
      ...prev,
      streak: 0,
    }));
  }, []);

  // Claim daily bonus
  const claimDailyBonus = useCallback(() => {
    const bonus = 100 + state.streak * 10;
    setState(prev => ({
      ...prev,
      dailyBonus: bonus,
      totalCoins: prev.totalCoins + bonus,
      streak: prev.streak + 1,
    }));
    toast.success(`🎁 Daily Bonus: +${bonus} SKY4 (Streak: ${state.streak + 1})`);
  }, [state.streak]);

  // Get level progress percentage
  const getLevelProgress = useCallback(() => {
    const currentThreshold = LEVEL_THRESHOLDS[state.level - 1] || 0;
    const nextThreshold = state.nextLevelXp;
    const progress = ((state.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [state.xp, state.level, state.nextLevelXp]);

  // Get unlockedAchievements count
  const getUnlockedAchievementsCount = useCallback(() => {
    return state.achievements.filter(a => a.unlockedAt).length;
  }, [state.achievements]);

  return {
    state,
    addXP,
    addCoins,
    unlockAchievement,
    updateAchievementProgress,
    earnBadge,
    increaseStreak,
    resetStreak,
    claimDailyBonus,
    getLevelProgress,
    getUnlockedAchievementsCount,
  };
}

export default useGamification;
