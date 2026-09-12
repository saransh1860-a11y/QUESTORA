import { UserProfile, CharacterStats, Quest, Achievement, ShopItem, InventoryItem, QuestCategory, QuestDifficulty, QuestType, QuestFrequency, AttributeType } from '../types';
import { auth } from '../lib/firebase';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string,string> || {}) };
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'API Request failed');
  return data as T;
}

export const api = {
  loginWithGoogle: () => request<{user:UserProfile;stats:CharacterStats}>('/auth/google',{method:'POST'}),
  getMe: () => request<{user:UserProfile;stats:CharacterStats}>('/auth/me'),
  onboardingSetup: (payload:{characterClass?:string;goals?:string[]}) => request<{user:UserProfile;stats:CharacterStats}>('/onboarding/setup',{method:'POST',body:JSON.stringify(payload)}),
  updateAvatar: (payload:{customAvatarUrl?:string;userPhotoUrl?:string}) => request<{user:UserProfile;stats:CharacterStats}>('/user/avatar',{method:'POST',body:JSON.stringify(payload)}),
  updateGender: (gender:'male'|'female') => request<{user:UserProfile;stats:CharacterStats}>('/user/gender',{method:'POST',body:JSON.stringify({gender})}),
  getQuests: () => request<{quests:Quest[]}>('/quests'),
  createQuest: (payload:{title:string;description?:string;category:QuestCategory;difficulty:QuestDifficulty;type:QuestType;frequency:QuestFrequency;attributeTarget?:AttributeType}) => request<{quest:Quest}>('/quests',{method:'POST',body:JSON.stringify(payload)}),
  deleteQuest: (questId:string) => request<{success:boolean}>(`/quests/${questId}`,{method:'DELETE'}),
  completeQuest: (questId:string) => request<{quest:Quest;user:UserProfile;stats:CharacterStats;didLevelUp:boolean;newLevel:number;levelData:{level:number;currentLevelXp:number;nextLevelXp:number;progressPct:number};unlockedAchievements:Achievement[]}>(`/quests/${questId}/complete`,{method:'POST'}),
  getShopItems: () => request<{items:ShopItem[]}>('/shop'),
  buyShopItem: (itemId:string) => request<{user:UserProfile;item:ShopItem;inventory:InventoryItem[]}>('/shop/buy',{method:'POST',body:JSON.stringify({itemId})}),
  getInventory: () => request<{inventory:InventoryItem[];items:ShopItem[]}>('/inventory'),
  equipItem: (itemId:string,unequip=false) => request<{user:UserProfile}>('/inventory/equip',{method:'POST',body:JSON.stringify({itemId,unequip})}),
  getAchievements: () => request<{achievements:(Achievement & {unlocked:boolean;unlockedAt?:string})[]}>('/achievements'),
  getProgress: () => request<{history:any[];historyByDate:Record<string,{xp:number;gold:number;count:number}>;stats:CharacterStats;totalCompleted:number;totalQuests:number;currentStreak:number;longestStreak:number}>('/progress')
};
