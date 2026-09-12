import {
  UserProfile,
  CharacterStats,
  Quest,
  Achievement,
  ShopItem,
  InventoryItem,
  QuestCategory,
  QuestDifficulty,
  QuestType,
  QuestFrequency,
  AttributeType
} from '../types';
import { auth } from '../lib/firebase';
import { SHOP_ITEMS } from '../data/shopAndAchievements';

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated with Firebase');
  }
  return await user.getIdToken();
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errData = await res.json();
      if (errData && errData.error) {
        errorMsg = errData.error;
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export const api = {
  loginWithGoogle: async (): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/init', {
      method: 'POST'
    });
  },

  getMe: async (): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/me', {
      method: 'GET'
    });
  },

  onboardingSetup: async (payload: { characterClass?: string; goals?: string[] }): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateAvatar: async (payload: { customAvatarUrl?: string; userPhotoUrl?: string }): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/avatar', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateGender: async (gender: 'male' | 'female'): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/gender', {
      method: 'POST',
      body: JSON.stringify({ gender })
    });
  },

  getQuests: async (): Promise<{ quests: Quest[] }> => {
    return await request<{ quests: Quest[] }>('/api/quests', {
      method: 'GET'
    });
  },

  createQuest: async (payload: {
    title: string;
    description?: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
    type: QuestType;
    frequency: QuestFrequency;
    attributeTarget?: AttributeType;
  }): Promise<{ quest: Quest }> => {
    return await request<{ quest: Quest }>('/api/quests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  deleteQuest: async (questId: string): Promise<{ success: boolean }> => {
    return await request<{ success: boolean }>(`/api/quests/${questId}`, {
      method: 'DELETE'
    });
  },

  completeQuest: async (questId: string): Promise<{
    quest: Quest;
    user: UserProfile;
    stats: CharacterStats;
    didLevelUp: boolean;
    newLevel: number;
    levelData: { level: number; currentLevelXp: number; nextLevelXp: number; progressPct: number };
    unlockedAchievements: Achievement[];
  }> => {
    // Only questId is submitted. Server authoritatively determines XP, Gold, Level, Attributes, Streak & Achievements
    return await request<{
      quest: Quest;
      user: UserProfile;
      stats: CharacterStats;
      didLevelUp: boolean;
      newLevel: number;
      levelData: { level: number; currentLevelXp: number; nextLevelXp: number; progressPct: number };
      unlockedAchievements: Achievement[];
    }>('/api/quests/complete', {
      method: 'POST',
      body: JSON.stringify({ questId })
    });
  },

  getShopItems: async (): Promise<{ items: ShopItem[] }> => {
    try {
      return await request<{ items: ShopItem[] }>('/api/shop/items', { method: 'GET' });
    } catch {
      return { items: SHOP_ITEMS };
    }
  },

  buyShopItem: async (itemId: string): Promise<{ user: UserProfile; item: ShopItem; inventory: InventoryItem[] }> => {
    // Only itemId is submitted. Server authoritatively validates level, price, ownership & executes Firestore transaction
    return await request<{ user: UserProfile; item: ShopItem; inventory: InventoryItem[] }>('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ itemId })
    });
  },

  getInventory: async (): Promise<{ inventory: InventoryItem[]; items: ShopItem[] }> => {
    return await request<{ inventory: InventoryItem[]; items: ShopItem[] }>('/api/inventory', {
      method: 'GET'
    });
  },

  equipItem: async (itemId: string, unequip = false): Promise<{ user: UserProfile }> => {
    // Only itemId & unequip flag submitted. Server validates ownership before allowing cosmetic equip
    return await request<{ user: UserProfile }>('/api/inventory/equip', {
      method: 'POST',
      body: JSON.stringify({ itemId, unequip })
    });
  },

  getAchievements: async (): Promise<{ achievements: (Achievement & { unlocked: boolean; unlockedAt?: string })[] }> => {
    return await request<{ achievements: (Achievement & { unlocked: boolean; unlockedAt?: string })[] }>('/api/achievements', {
      method: 'GET'
    });
  },

  getProgress: async (): Promise<{
    history: any[];
    historyByDate: Record<string, { xp: number; gold: number; count: number }>;
    stats: CharacterStats;
    totalCompleted: number;
    totalQuests: number;
    currentStreak: number;
    longestStreak: number;
  }> => {
    return await request<{
      history: any[];
      historyByDate: Record<string, { xp: number; gold: number; count: number }>;
      stats: CharacterStats;
      totalCompleted: number;
      totalQuests: number;
      currentStreak: number;
      longestStreak: number;
    }>('/api/progress', {
      method: 'GET'
    });
  }
};
