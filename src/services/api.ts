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
import { firestoreService } from './firestoreService';

function getRequiredUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated with Firebase');
  return user.uid;
}

export const api = {
  loginWithGoogle: async (): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated Firebase user found');
    return await firestoreService.initOrGetUser(user);
  },

  getMe: async (): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    const uid = getRequiredUid();
    return await firestoreService.getUser(uid);
  },

  onboardingSetup: async (payload: { characterClass?: string; goals?: string[] }): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    const uid = getRequiredUid();
    return await firestoreService.onboardingSetup(uid, payload);
  },

  updateAvatar: async (payload: { customAvatarUrl?: string; userPhotoUrl?: string }): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    const uid = getRequiredUid();
    return await firestoreService.updateAvatar(uid, payload);
  },

  updateGender: async (gender: 'male' | 'female'): Promise<{ user: UserProfile; stats: CharacterStats }> => {
    const uid = getRequiredUid();
    return await firestoreService.updateGender(uid, gender);
  },

  getQuests: async (): Promise<{ quests: Quest[] }> => {
    const uid = getRequiredUid();
    const quests = await firestoreService.getQuests(uid);
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
    const uid = getRequiredUid();
    const quest = await firestoreService.createQuest(uid, payload);
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
    const uid = getRequiredUid();
    return await firestoreService.completeQuest(uid, questId);
  },

  getShopItems: async (): Promise<{ items: ShopItem[] }> => {
    const items = firestoreService.getShopItems();
    return { items };
  },

  buyShopItem: async (itemId: string): Promise<{ user: UserProfile; item: ShopItem; inventory: InventoryItem[] }> => {
    const uid = getRequiredUid();
    return await firestoreService.buyShopItem(uid, itemId);
  },

  getInventory: async (): Promise<{ inventory: InventoryItem[]; items: ShopItem[] }> => {
    const uid = getRequiredUid();
    return await firestoreService.getInventory(uid);
  },

  equipItem: async (itemId: string, unequip = false): Promise<{ user: UserProfile }> => {
    const uid = getRequiredUid();
    return await firestoreService.equipItem(uid, itemId, unequip);
  },

  getAchievements: async (): Promise<{ achievements: (Achievement & { unlocked: boolean; unlockedAt?: string })[] }> => {
    const uid = getRequiredUid();
    const achievements = await firestoreService.getAchievements(uid);
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
    const uid = getRequiredUid();
    return await firestoreService.getProgress(uid);
  }
};
