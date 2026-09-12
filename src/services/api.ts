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
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    return await firestoreService.initOrGetUser(user);
  },

  getMe: async (): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    return await firestoreService.getUser(user.uid);
  },

  onboardingSetup: async (payload: { characterClass?: string; goals?: string[] }): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    return await firestoreService.onboardingSetup(user.uid, payload);
  },

  updateAvatar: async (payload: { customAvatarUrl?: string; userPhotoUrl?: string }): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    return await firestoreService.updateAvatar(user.uid, payload);
  },

  updateGender: async (gender: 'male' | 'female'): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    return await firestoreService.updateGender(user.uid, gender);
  },

  getQuests: async (): Promise<{ quests: Quest[] }> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    const quests = await firestoreService.getQuests(user.uid);
    return { quests };
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
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    const quest = await firestoreService.createQuest(user.uid, payload);
    return { quest };
  },

  deleteQuest: async (questId: string): Promise<{ success: boolean }> => {
    const success = await firestoreService.deleteQuest(questId);
    return { success };
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
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    return await firestoreService.completeQuest(user.uid, questId);
  },

  getShopItems: async (): Promise<{ items: ShopItem[] }> => {
    return { items: firestoreService.getShopItems() };
  },

  buyShopItem: async (itemId: string): Promise<{ user: UserProfile; item: ShopItem; inventory: InventoryItem[] }> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    return await firestoreService.buyShopItem(user.uid, itemId);
  },

  getInventory: async (): Promise<{ inventory: InventoryItem[]; items: ShopItem[] }> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    return await firestoreService.getInventory(user.uid);
  },

  equipItem: async (itemId: string, unequip = false): Promise<{ user: UserProfile }> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    return await firestoreService.equipItem(user.uid, itemId, unequip);
  },

  getAchievements: async (): Promise<{ achievements: (Achievement & { unlocked: boolean; unlockedAt?: string })[] }> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    const achievements = await firestoreService.getAchievements(user.uid);
    return { achievements };
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
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated with Firebase');
    }
    return await firestoreService.getProgress(user.uid);
  }
};

