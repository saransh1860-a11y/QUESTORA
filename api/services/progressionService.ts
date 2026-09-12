import { serverDb } from '../lib/db';
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
} from '../../src/types';
import {
  SHOP_ITEMS,
  ACHIEVEMENTS,
  REWARDS,
  ATTRIBUTE_BY_CATEGORY,
  STARTER_AVATAR_URL,
  STARTER_CHARACTER_ID
} from '../../src/data/shopAndAchievements';
import { calculateLevelData } from '../../src/utils/level';
import { computeDateBasedStreak } from '../../src/utils/streak';

// Pure achievement evaluation engine
export function evaluateAchievements(params: {
  totalQuestsCompleted: number;
  newStreak: number;
  longestStreak: number;
  level: number;
  stats: CharacterStats;
  inventoryCount: number;
  unlockedAchievementIds: Set<string>;
}): Achievement[] {
  const {
    totalQuestsCompleted,
    newStreak,
    longestStreak,
    level,
    stats,
    inventoryCount,
    unlockedAchievementIds
  } = params;

  const newlyUnlocked: Achievement[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlockedAchievementIds.has(ach.id)) continue;

    let shouldUnlock = false;
    if (ach.id === 'ach-first-quest' && totalQuestsCompleted >= 1) shouldUnlock = true;
    if (ach.id === 'ach-quests-10' && totalQuestsCompleted >= 10) shouldUnlock = true;
    if (ach.id === 'ach-streak-7' && (newStreak >= 7 || longestStreak >= 7)) shouldUnlock = true;
    if (ach.id === 'ach-streak-14' && (newStreak >= 14 || longestStreak >= 14)) shouldUnlock = true;
    if (ach.id === 'ach-level-5' && level >= 5) shouldUnlock = true;
    if (ach.id === 'ach-level-10' && level >= 10) shouldUnlock = true;
    if (ach.id === 'ach-level-20' && level >= 20) shouldUnlock = true;
    if (ach.id === 'ach-intellect-5' && (stats.intellect || 0) >= 5) shouldUnlock = true;
    if (ach.id === 'ach-strength-5' && (stats.strength || 0) >= 5) shouldUnlock = true;
    if (ach.id === 'ach-discipline-5' && (stats.discipline || 0) >= 5) shouldUnlock = true;
    if (ach.id === 'ach-shop-3' && inventoryCount >= 3) shouldUnlock = true;

    if (shouldUnlock) {
      newlyUnlocked.push(ach);
    }
  }

  return newlyUnlocked;
}

export const progressionService = {
  async getUser(uid: string, token?: string): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const [userSnap, statsSnap] = await Promise.all([
      serverDb.getDoc<UserProfile>('users', uid, token),
      serverDb.getDoc<CharacterStats>('stats', uid, token)
    ]);

    if (!userSnap.exists) {
      throw new Error('User profile not found');
    }

    const user = userSnap.data()!;
    const stats = (statsSnap.exists ? statsSnap.data() : {
      intellect: 0,
      strength: 0,
      discipline: 0,
      wisdom: 0,
      creativity: 0
    }) as CharacterStats;

    return { user, stats };
  },

  async initOrGetUser(uid: string, tokenData?: { email?: string; name?: string }, token?: string): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const [userSnap, statsSnap] = await Promise.all([
      serverDb.getDoc<UserProfile>('users', uid, token),
      serverDb.getDoc<CharacterStats>('stats', uid, token)
    ]);

    const now = new Date().toISOString();

    if (!userSnap.exists) {
      const initialProfile: UserProfile = {
        id: uid,
        email: tokenData?.email || '',
        username: tokenData?.name || 'Valiant Hero',
        customAvatarUrl: STARTER_AVATAR_URL,
        userPhotoUrl: '',
        characterClass: 'Warrior',
        gender: 'male',
        level: 1,
        totalXp: 0,
        gold: 50,
        currentStreak: 0,
        longestStreak: 0,
        lastQuestCompletedDate: undefined,
        goals: ['Master programming & build apps', 'Reach daily 10k steps & peak fitness'],
        equippedTitle: 'Novice Adventurer',
        equippedTheme: 'theme-cyber',
        equippedFrame: 'frame-neon',
        equippedEffect: 'effect-lightning',
        equippedBackground: 'bg-citadel',
        equippedWearables: {},
        onboardingCompleted: false,
        createdAt: now
      };

      const initialStats: CharacterStats = {
        intellect: 0,
        strength: 0,
        discipline: 0,
        wisdom: 0,
        creativity: 0
      };

      const starterInvItem: InventoryItem = {
        id: `${uid}_starter`,
        userId: uid,
        itemId: STARTER_CHARACTER_ID,
        purchasedAt: now
      };

      await Promise.all([
        serverDb.setDoc('users', uid, initialProfile, token),
        serverDb.setDoc('stats', uid, initialStats, token),
        serverDb.setDoc('inventory', `${uid}_starter`, starterInvItem, token)
      ]);

      return { user: initialProfile, stats: initialStats };
    }

    const existingUser = userSnap.data()!;
    let existingStats = (statsSnap.exists ? statsSnap.data() : {
      intellect: 0,
      strength: 0,
      discipline: 0,
      wisdom: 0,
      creativity: 0
    }) as CharacterStats;

    if (!statsSnap.exists) {
      await serverDb.setDoc('stats', uid, existingStats, token);
    }

    // Ensure starter inventory item exists
    const starterInvSnap = await serverDb.getDoc('inventory', `${uid}_starter`, token);
    if (!starterInvSnap.exists) {
      await serverDb.setDoc('inventory', `${uid}_starter`, {
        id: `${uid}_starter`,
        userId: uid,
        itemId: STARTER_CHARACTER_ID,
        purchasedAt: now
      }, token);
    }

    // Validate streak status using historical dates
    if (existingUser.lastQuestCompletedDate) {
      const historyDocs = await serverDb.queryDocs('questHistory', [
        { field: 'userId', op: '==', value: uid }
      ], token);

      const dates: string[] = [];
      historyDocs.forEach(d => {
        const h = d.data();
        if (h && (h as any).completedAt) dates.push((h as any).completedAt);
      });

      if (dates.length > 0) {
        const computedStreak = computeDateBasedStreak(dates, new Date());
        if (computedStreak.currentStreak !== existingUser.currentStreak) {
          await serverDb.updateDoc('users', uid, {
            currentStreak: computedStreak.currentStreak,
            longestStreak: Math.max(existingUser.longestStreak || 0, computedStreak.longestStreak),
            updatedAt: now
          }, token);
          existingUser.currentStreak = computedStreak.currentStreak;
          existingUser.longestStreak = Math.max(existingUser.longestStreak || 0, computedStreak.longestStreak);
        }
      }
    }

    return { user: existingUser, stats: existingStats };
  },

  async onboardingSetup(uid: string, payload: { characterClass?: string; goals?: string[] }, token?: string): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const updates: Record<string, any> = {
      onboardingCompleted: true,
      updatedAt: new Date().toISOString()
    };

    if (payload.characterClass) updates.characterClass = payload.characterClass;
    if (payload.goals && Array.isArray(payload.goals)) updates.goals = payload.goals;

    await serverDb.updateDoc('users', uid, updates, token);
    return await this.getUser(uid, token);
  },

  async updateAvatar(uid: string, payload: { customAvatarUrl?: string; userPhotoUrl?: string }, token?: string): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (payload.customAvatarUrl !== undefined) updates.customAvatarUrl = payload.customAvatarUrl;
    if (payload.userPhotoUrl !== undefined) updates.userPhotoUrl = payload.userPhotoUrl;

    await serverDb.updateDoc('users', uid, updates, token);
    return await this.getUser(uid, token);
  },

  async updateGender(uid: string, gender: 'male' | 'female', token?: string): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const userSnap = await serverDb.getDoc<UserProfile>('users', uid, token);
    if (!userSnap.exists) throw new Error('User not found');
    const user = userSnap.data()!;

    const updates: Record<string, any> = {
      gender,
      updatedAt: new Date().toISOString()
    };

    const isStarterAvatar = !user.customAvatarUrl ||
      user.customAvatarUrl === STARTER_AVATAR_URL ||
      user.customAvatarUrl === '/avatars/rpg_female_warrior_1789193037795.jpg';

    if (isStarterAvatar) {
      updates.customAvatarUrl = gender === 'female'
        ? '/avatars/rpg_female_warrior_1789193037795.jpg'
        : STARTER_AVATAR_URL;
    }

    await serverDb.updateDoc('users', uid, updates, token);
    return await this.getUser(uid, token);
  },

  async getQuests(uid: string, token?: string): Promise<Quest[]> {
    const questDocs = await serverDb.queryDocs<Quest>('quests', [
      { field: 'userId', op: '==', value: uid }
    ], token);

    const quests: Quest[] = questDocs.map(d => d.data());
    quests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return quests;
  },

  async createQuest(uid: string, payload: {
    title: string;
    description?: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
    type: QuestType;
    frequency: QuestFrequency;
    attributeTarget?: AttributeType;
  }, token?: string): Promise<Quest> {
    if (!payload.title || !payload.title.trim()) {
      throw new Error('Quest title is required');
    }

    const questId = `quest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    // Server determines authoritative rewards based on difficulty and category
    const rewardConfig = REWARDS[payload.difficulty] || REWARDS.Medium;
    const defaultAttr = (ATTRIBUTE_BY_CATEGORY[payload.category] || 'intellect') as AttributeType;
    const targetAttribute = payload.attributeTarget || defaultAttr;

    const newQuest: Quest = {
      id: questId,
      userId: uid,
      title: payload.title.trim(),
      description: payload.description?.trim() || '',
      category: payload.category || 'Discipline',
      difficulty: payload.difficulty || 'Medium',
      type: payload.type || 'Daily',
      frequency: payload.frequency || 'Daily',
      xpReward: rewardConfig.xp,
      goldReward: rewardConfig.gold,
      attributeReward: {
        attribute: targetAttribute,
        amount: rewardConfig.stat
      },
      completed: false,
      createdAt: now
    };

    await serverDb.setDoc('quests', questId, newQuest, token);
    return newQuest;
  },

  async deleteQuest(uid: string, questId: string, token?: string): Promise<boolean> {
    const questSnap = await serverDb.getDoc<Quest>('quests', questId, token);

    if (!questSnap.exists) {
      throw new Error('Quest not found');
    }

    const quest = questSnap.data()!;
    if (quest.userId !== uid) {
      throw new Error('Unauthorized: Quest does not belong to the user');
    }

    await serverDb.deleteDoc('quests', questId, token);
    return true;
  },

  /**
   * Secure, Server-Authoritative Quest Completion
   * Atomically updates Quest, User Profile, Character Stats, History, and Achievements.
   */
  async completeQuest(uid: string, questId: string, token?: string): Promise<{
    quest: Quest;
    user: UserProfile;
    stats: CharacterStats;
    didLevelUp: boolean;
    newLevel: number;
    levelData: { level: number; currentLevelXp: number; nextLevelXp: number; progressPct: number };
    unlockedAchievements: Achievement[];
  }> {
    // 1. Fetch current Quest
    const questSnap = await serverDb.getDoc<Quest>('quests', questId, token);
    if (!questSnap.exists) {
      throw new Error('Quest not found');
    }
    const quest = questSnap.data()!;

    if (quest.userId !== uid) {
      throw new Error('Unauthorized: Quest does not belong to the logged-in user');
    }

    if (quest.completed) {
      throw new Error('Quest has already been completed');
    }

    // 2. Fetch User & Stats & History
    const [userSnap, statsSnap, historyDocs, achDocs, invDocs] = await Promise.all([
      serverDb.getDoc<UserProfile>('users', uid, token),
      serverDb.getDoc<CharacterStats>('stats', uid, token),
      serverDb.queryDocs('questHistory', [{ field: 'userId', op: '==', value: uid }], token),
      serverDb.queryDocs('userAchievements', [{ field: 'userId', op: '==', value: uid }], token),
      serverDb.queryDocs('inventory', [{ field: 'userId', op: '==', value: uid }], token)
    ]);

    if (!userSnap.exists) {
      throw new Error('User not found');
    }
    const user = userSnap.data()!;

    const currentStats: CharacterStats = (statsSnap.exists ? statsSnap.data() : {
      intellect: 0,
      strength: 0,
      discipline: 0,
      wisdom: 0,
      creativity: 0
    }) as CharacterStats;

    const existingCompletionDates: string[] = [];
    historyDocs.forEach(d => {
      const h = d.data();
      if (h && (h as any).completedAt) existingCompletionDates.push((h as any).completedAt);
    });

    const unlockedAchievementIds = new Set<string>();
    achDocs.forEach(d => {
      const a = d.data();
      if (a && (a as any).achievementId) unlockedAchievementIds.add((a as any).achievementId);
    });

    const inventoryCount = invDocs.length;

    // 3. Compute Authoritative Rewards (Server-Controlled)
    const rewardConfig = REWARDS[quest.difficulty] || REWARDS.Medium;
    const xpEarned = rewardConfig.xp;
    const goldEarned = rewardConfig.gold;
    const statIncrease = rewardConfig.stat;

    const attributeKey = (quest.attributeReward?.attribute ||
      ATTRIBUTE_BY_CATEGORY[quest.category] ||
      'intellect') as AttributeType;

    const oldLevel = user.level || 1;
    const newTotalXp = (user.totalXp || 0) + xpEarned;
    const levelData = calculateLevelData(newTotalXp);
    const didLevelUp = levelData.level > oldLevel;
    const newGold = (user.gold || 0) + goldEarned;

    // Calendar Date-Based Streak Calculation
    const now = new Date().toISOString();
    const allDates = [...existingCompletionDates, now];
    const streakCalc = computeDateBasedStreak(allDates, new Date());
    const newStreak = streakCalc.currentStreak;
    const longestStreak = Math.max(user.longestStreak || 0, streakCalc.longestStreak);

    // Attribute Increase
    const updatedStats: CharacterStats = {
      ...currentStats,
      [attributeKey]: (currentStats[attributeKey] || 0) + statIncrease
    };

    // Milestone / Achievement Detection
    const totalQuestsCompleted = existingCompletionDates.length + 1;
    const newlyUnlockedAchievements = evaluateAchievements({
      totalQuestsCompleted,
      newStreak,
      longestStreak,
      level: levelData.level,
      stats: updatedStats,
      inventoryCount,
      unlockedAchievementIds
    });

    // 4. Perform Authoritative Writes
    const updatedQuest: Quest = {
      ...quest,
      completed: true,
      completedAt: now
    };

    const updatedUser: UserProfile = {
      ...user,
      totalXp: newTotalXp,
      level: levelData.level,
      gold: newGold,
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastQuestCompletedDate: now
    };

    const historyId = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const historyEntry = {
      id: historyId,
      userId: uid,
      questId: questId,
      questTitle: quest.title,
      xpEarned,
      goldEarned,
      completedAt: now
    };

    const writePromises: Promise<any>[] = [
      serverDb.updateDoc('quests', questId, { completed: true, completedAt: now }, token),
      serverDb.updateDoc('users', uid, {
        totalXp: newTotalXp,
        level: levelData.level,
        gold: newGold,
        currentStreak: newStreak,
        longestStreak: longestStreak,
        lastQuestCompletedDate: now
      }, token),
      serverDb.setDoc('stats', uid, updatedStats, token),
      serverDb.setDoc('questHistory', historyId, historyEntry, token)
    ];

    for (const ach of newlyUnlockedAchievements) {
      const achDocId = `${uid}_${ach.id}`;
      writePromises.push(
        serverDb.setDoc('userAchievements', achDocId, {
          id: achDocId,
          userId: uid,
          achievementId: ach.id,
          unlockedAt: now
        }, token)
      );
    }

    await Promise.all(writePromises);

    return {
      quest: updatedQuest,
      user: updatedUser,
      stats: updatedStats,
      didLevelUp,
      newLevel: levelData.level,
      levelData,
      unlockedAchievements: newlyUnlockedAchievements
    };
  },

  getShopItems(): ShopItem[] {
    return SHOP_ITEMS;
  },

  async getInventory(uid: string, token?: string): Promise<{ inventory: InventoryItem[]; items: ShopItem[] }> {
    const invDocs = await serverDb.queryDocs<InventoryItem>('inventory', [
      { field: 'userId', op: '==', value: uid }
    ], token);

    let inventory: InventoryItem[] = invDocs.map(d => d.data());

    if (inventory.length === 0) {
      const now = new Date().toISOString();
      const starterInvItem: InventoryItem = {
        id: `${uid}_starter`,
        userId: uid,
        itemId: STARTER_CHARACTER_ID,
        purchasedAt: now
      };
      await serverDb.setDoc('inventory', `${uid}_starter`, starterInvItem, token);
      inventory.push(starterInvItem);
    }

    const ownedIds = new Set(inventory.map(i => i.itemId));
    const items = SHOP_ITEMS.filter(s => ownedIds.has(s.id));

    return { inventory, items };
  },

  /**
   * Secure, Server-Authoritative Shop Purchase
   * Validates level gate, Gold amount, catalog pricing, and prior ownership.
   */
  async buyShopItem(uid: string, itemId: string, token?: string): Promise<{
    user: UserProfile;
    item: ShopItem;
    inventory: InventoryItem[];
  }> {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found in official shop catalogue');
    }

    const invDocId = `inv_${uid}_${itemId}`;
    const [userSnap, invSnap] = await Promise.all([
      serverDb.getDoc<UserProfile>('users', uid, token),
      serverDb.getDoc<InventoryItem>('inventory', invDocId, token)
    ]);

    if (!userSnap.exists) {
      throw new Error('User not found');
    }

    const user = userSnap.data()!;

    // 1. Level Gate Check
    const userLevel = user.level || 1;
    if (userLevel < item.requiredLevel) {
      throw new Error(`Level requirement not met. Item requires Level ${item.requiredLevel}, but you are Level ${userLevel}.`);
    }

    // 2. Gold Balance Check
    const currentGold = user.gold || 0;
    if (currentGold < item.price) {
      throw new Error(`Insufficient gold. You have ${currentGold} Gold, but this item costs ${item.price} Gold.`);
    }

    // 3. Duplicate Ownership Check
    if (invSnap.exists) {
      throw new Error('You already own this item!');
    }

    const now = new Date().toISOString();
    const newGold = currentGold - item.price;
    const userUpdates: Record<string, any> = {
      gold: newGold,
      updatedAt: now
    };

    if (item.category === 'characters' && item.previewUrl) {
      userUpdates.customAvatarUrl = item.previewUrl;
    }

    await Promise.all([
      serverDb.updateDoc('users', uid, userUpdates, token),
      serverDb.setDoc('inventory', invDocId, {
        id: invDocId,
        userId: uid,
        itemId: item.id,
        purchasedAt: now
      }, token)
    ]);

    const updatedUser: UserProfile = {
      ...user,
      ...userUpdates
    };

    const allInv = await this.getInventory(uid, token);
    return {
      user: updatedUser,
      item,
      inventory: allInv.inventory
    };
  },

  /**
   * Secure, Server-Authoritative Item Equipping
   * Verifies the user genuinely owns the item in their inventory before applying cosmetic changes.
   */
  async equipItem(uid: string, itemId: string, unequip = false, token?: string): Promise<{ user: UserProfile }> {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found in official catalogue');
    }

    const userSnap = await serverDb.getDoc<UserProfile>('users', uid, token);
    if (!userSnap.exists) throw new Error('User not found');
    const user = userSnap.data()!;

    // Security check: Verify user owns the item before equipping!
    if (!unequip && itemId !== STARTER_CHARACTER_ID) {
      const invDocId = `inv_${uid}_${itemId}`;
      const invSnap = await serverDb.getDoc('inventory', invDocId, token);

      if (!invSnap.exists) {
        const altDocs = await serverDb.queryDocs('inventory', [
          { field: 'userId', op: '==', value: uid },
          { field: 'itemId', op: '==', value: itemId }
        ], token);

        if (altDocs.length === 0) {
          throw new Error('Unauthorized: You do not own this cosmetic item in your inventory');
        }
      }
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (item.category === 'characters') {
      updates.customAvatarUrl = unequip ? STARTER_AVATAR_URL : (item.previewUrl || STARTER_AVATAR_URL);
    } else if (item.category === 'themes') {
      updates.equippedTheme = unequip ? 'theme-cyber' : item.id;
    } else if (item.category === 'frames') {
      updates.equippedFrame = unequip ? 'frame-neon' : item.id;
    } else if (item.category === 'effects') {
      updates.equippedEffect = unequip ? 'effect-lightning' : item.id;
    } else if (item.category === 'nameplates') {
      updates.equippedTitle = unequip ? 'Explorer' : item.name;
    } else if (item.category === 'backgrounds') {
      updates.equippedBackground = unequip ? 'bg-citadel' : item.id;
    }

    await serverDb.updateDoc('users', uid, updates, token);

    return {
      user: {
        ...user,
        ...updates
      }
    };
  },

  async getAchievements(uid: string, token?: string): Promise<(Achievement & { unlocked: boolean; unlockedAt?: string })[]> {
    const achDocs = await serverDb.queryDocs('userAchievements', [
      { field: 'userId', op: '==', value: uid }
    ], token);

    const unlockedMap = new Map<string, string>();
    achDocs.forEach(d => {
      const data = d.data() as any;
      if (data && data.achievementId) {
        unlockedMap.set(data.achievementId, data.unlockedAt);
      }
    });

    return ACHIEVEMENTS.map(ach => ({
      ...ach,
      unlocked: unlockedMap.has(ach.id),
      unlockedAt: unlockedMap.get(ach.id)
    }));
  },

  async getProgress(uid: string, token?: string): Promise<{
    history: any[];
    historyByDate: Record<string, { xp: number; gold: number; count: number }>;
    stats: CharacterStats;
    totalCompleted: number;
    totalQuests: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    const [histDocs, quests, userRes] = await Promise.all([
      serverDb.queryDocs('questHistory', [{ field: 'userId', op: '==', value: uid }], token),
      this.getQuests(uid, token),
      this.getUser(uid, token)
    ]);

    const history: any[] = [];
    const historyByDate: Record<string, { xp: number; gold: number; count: number }> = {};

    histDocs.forEach(d => {
      const item = d.data() as any;
      history.push(item);
      const dateKey = (item.completedAt || '').split('T')[0] || 'today';
      if (!historyByDate[dateKey]) {
        historyByDate[dateKey] = { xp: 0, gold: 0, count: 0 };
      }
      historyByDate[dateKey].xp += item.xpEarned || 0;
      historyByDate[dateKey].gold += item.goldEarned || 0;
      historyByDate[dateKey].count += 1;
    });

    return {
      history,
      historyByDate,
      stats: userRes.stats,
      totalCompleted: history.length,
      totalQuests: quests.length,
      currentStreak: userRes.user.currentStreak || 0,
      longestStreak: userRes.user.longestStreak || 0
    };
  }
};
