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
import { firestoreService } from './firestoreService';

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
    try {
      return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/init', {
        method: 'POST'
      });
    } catch (err) {
      console.warn('Backend API /api/user/init unavailable, using direct Firestore service:', err);
      if (auth.currentUser) {
        return await firestoreService.initOrGetUser(auth.currentUser);
      }
      throw err;
    }
  },

  getMe: async (): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    try {
      return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/me', {
        method: 'GET'
      });
    } catch (err) {
      if (auth.currentUser) {
        return await firestoreService.getUser(auth.currentUser.uid);
      }
      throw err;
    }
  },

  onboardingSetup: async (payload: { characterClass?: string; goals?: string[] }): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    try {
      return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/onboarding', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      if (auth.currentUser) {
        return await firestoreService.onboardingSetup(auth.currentUser.uid, payload);
      }
      throw err;
    }
  },

  updateAvatar: async (payload: { customAvatarUrl?: string; userPhotoUrl?: string }): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    try {
      return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/avatar', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      if (auth.currentUser) {
        return await firestoreService.updateAvatar(auth.currentUser.uid, payload);
      }
      throw err;
    }
  },

  updateGender: async (gender: 'male' | 'female'): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    try {
      return await request<{ user: UserProfile; stats: CharacterStats }>('/api/user/gender', {
        method: 'POST',
        body: JSON.stringify({ gender })
      });
    } catch (err) {
      if (auth.currentUser) {
        return await firestoreService.updateGender(auth.currentUser.uid, gender);
      }
      throw err;
    }
  },

  getQuests: async (): Promise<{ quests: Quest[] }> => {
    try {
      return await request<{ quests: Quest[] }>('/api/quests', {
        method: 'GET'
      });
    } catch (err) {
      if (auth.currentUser) {
        const quests = await firestoreService.getQuests(auth.currentUser.uid);
        return { quests };
      }
      throw err;
    }
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
    try {
      return await request<{ quest: Quest }>('/api/quests', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      if (auth.currentUser) {
        const quest = await firestoreService.createQuest(auth.currentUser.uid, payload);
        return { quest };
      }
      throw err;
    }
  },

  deleteQuest: async (questId: string): Promise<{ success: boolean }> => {
    try {
      return await request<{ success: boolean }>(`/api/quests/${questId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      const success = await firestoreService.deleteQuest(questId);
      return { success };
    }
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
    try {
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
    } catch (err) {
      if (auth.currentUser) {
        return await firestoreService.completeQuest(auth.currentUser.uid, questId);
      }
      throw err;
    }
  },

  getShopItems: async (): Promise<{ items: ShopItem[] }> => {
    try {
      return await request<{ items: ShopItem[] }>('/api/shop/items', { method: 'GET' });
    } catch {
      return { items: firestoreService.getShopItems() };
    }
  },

  buyShopItem: async (itemId: string): Promise<{ user: UserProfile; item: ShopItem; inventory: InventoryItem[] }> => {
    try {
      return await request<{ user: UserProfile; item: ShopItem; inventory: InventoryItem[] }>('/api/shop/buy', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      });
    } catch (err) {
      if (auth.currentUser) {
        return await firestoreService.buyShopItem(auth.currentUser.uid, itemId);
      }
      throw err;
    }
  },

  getInventory: async (): Promise<{ inventory: InventoryItem[]; items: ShopItem[] }> => {
    try {
      return await request<{ inventory: InventoryItem[]; items: ShopItem[] }>('/api/inventory', {
        method: 'GET'
      });
    } catch (err) {
      if (auth.currentUser) {
        return await firestoreService.getInventory(auth.currentUser.uid);
      }
      throw err;
    }
  },

  equipItem: async (itemId: string, unequip = false): Promise<{ user: UserProfile }> => {
    try {
      return await request<{ user: UserProfile }>('/api/inventory/equip', {
        method: 'POST',
        body: JSON.stringify({ itemId, unequip })
      });
    } catch (err) {
      if (auth.currentUser) {
        return await firestoreService.equipItem(auth.currentUser.uid, itemId, unequip);
      }
      throw err;
    }
  },

  getAchievements: async (): Promise<{ achievements: (Achievement & { unlocked: boolean; unlockedAt?: string })[] }> => {
    try {
      return await request<{ achievements: (Achievement & { unlocked: boolean; unlockedAt?: string })[] }>('/api/achievements', {
        method: 'GET'
      });
    } catch (err) {
      if (auth.currentUser) {
        const achievements = await firestoreService.getAchievements(auth.currentUser.uid);
        return { achievements };
      }
      throw err;
    }
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
    try {
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
    } catch (err) {
      if (auth.currentUser) {
        return await firestoreService.getProgress(auth.currentUser.uid);
      }
      throw err;
    }
  }
};

