export type CharacterClass = 'Warrior' | 'Scholar' | 'Engineer' | 'Creator' | 'Balanced';

export type QuestCategory = 'Academics' | 'Fitness' | 'Coding' | 'Reading' | 'Discipline' | 'Creativity' | 'Personal';

export type QuestDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Epic';

export type QuestType = 'Daily' | 'Main' | 'Epic';

export type QuestFrequency = 'Once' | 'Daily' | 'Weekly';

export type AttributeType = 'intellect' | 'strength' | 'discipline' | 'wisdom' | 'creativity';

export interface CharacterStats {
  intellect: number;
  strength: number;
  discipline: number;
  wisdom: number;
  creativity: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  characterClass: CharacterClass;
  gender?: 'male' | 'female';
  level: number;
  totalXp: number;
  gold: number;
  currentStreak: number;
  longestStreak: number;
  lastQuestCompletedDate?: string;
  customAvatarUrl?: string;
  userPhotoUrl?: string;
  equippedTheme: string; // theme id
  equippedTitle: string; // nameplate title string
  equippedFrame: string; // frame item id
  equippedEffect: string; // effect item id
  equippedBackground: string; // background item id
  equippedWearables: {
    head?: string;
    body?: string;
    eyes?: string;
    accessory?: string;
  };
  goals?: string[];
  onboardingCompleted?: boolean;
  createdAt: string;
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  type: QuestType;
  xpReward: number;
  goldReward: number;
  attributeReward: {
    attribute: AttributeType;
    amount: number;
  };
  frequency: QuestFrequency;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface QuestHistoryEntry {
  id: string;
  userId: string;
  questId: string;
  questTitle: string;
  category: QuestCategory;
  xpEarned: number;
  goldEarned: number;
  attributeReward: {
    attribute: AttributeType;
    amount: number;
  };
  completedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  xpReward: number;
  goldReward: number;
  category: string;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export type ShopCategory = 'characters' | 'frames' | 'effects' | 'themes' | 'nameplates' | 'backgrounds';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  requiredLevel: number;
  icon: string;
  gender?: 'male' | 'female';
  wearableSlot?: 'head' | 'body' | 'eyes' | 'accessory';
  themeClass?: string;
  previewUrl?: string;
}

export interface InventoryItem {
  id: string;
  userId: string;
  itemId: string;
  purchasedAt: string;
}

export interface LevelMilestone {
  level: number;
  title: string;
  unlockNote: string;
  rewardXp?: number;
  rewardGold?: number;
}
