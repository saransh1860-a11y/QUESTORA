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

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated with Firebase');
  }
  return await user.getIdToken(true);
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
    return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/me');
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
    return await request<{ quests: Quest[] }>('/api/quests');
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
    return await request<{ success: boolean }>(`/api/quests/${encodeURIComponent(questId)}`, {
      method: 'DELETE'
    });
  },

  /**
   * Authoritative Quest Completion:
   * Client sends ONLY questId. The backend authoritatively determines XP, Gold, Level, Stats, Streak, and Achievements.
   */
  completeQuest: async (questId: string): Promise<{
    quest: Quest;
    user: UserProfile;
    stats: CharacterStats;
    didLevelUp: boolean;
    newLevel: number;
    levelData: { level: number; currentLevelXp: number; nextLevelXp: number; progressPct: number };
    unlockedAchievements: Achievement[];
  }> => {
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
    const res = await fetch('/api/shop/items');
    if (!res.ok) {
      throw new Error(`Failed to fetch shop catalogue (${res.status})`);
    }
    return await res.json();
  },

  /**
   * Authoritative Shop Purchase:
   * Client sends ONLY itemId. The backend validates prices from its secure catalog, checks level requirement,
   * checks user Gold balance, prevents duplicate purchases, and writes to inventory atomically.
   */
  buyShopItem: async (itemId: string): Promise<{ user: UserProfile; item: ShopItem; inventory: InventoryItem[] }> => {
    return await request<{ user: UserProfile; item: ShopItem; inventory: InventoryItem[] }>('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ itemId })
    });
  },

  getInventory: async (): Promise<{ inventory: InventoryItem[]; items: ShopItem[] }> => {
    return await request<{ inventory: InventoryItem[]; items: ShopItem[] }>('/api/inventory');
  },

  /**
   * Authoritative Item Equipping:
   * Server validates user owns the item in inventory before applying cosmetics.
   */
  equipItem: async (itemId: string, unequip = false): Promise<{ user: UserProfile }> => {
    return await request<{ user: UserProfile }>('/api/inventory/equip', {
      method: 'POST',
      body: JSON.stringify({ itemId, unequip })
    });
  },

  getAchievements: async (): Promise<{ achievements: (Achievement & { unlocked: boolean; unlockedAt?: string })[] }> => {
    return await request<{ achievements: (Achievement & { unlocked: boolean; unlockedAt?: string })[] }>('/api/achievements');
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
    }>('/api/progress');
  }
};
