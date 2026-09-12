import { adminDb } from '../lib/firebaseAdmin';
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
  async getUser(uid: string): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const userDocRef = adminDb.collection('users').doc(uid);
    const statsDocRef = adminDb.collection('stats').doc(uid);

    const [userSnap, statsSnap] = await Promise.all([
      userDocRef.get(),
      statsDocRef.get()
    ]);

    if (!userSnap.exists) {
      throw new Error('User profile not found');
    }

    const user = userSnap.data() as UserProfile;
    const stats = (statsSnap.exists ? statsSnap.data() : {
      intellect: 0,
      strength: 0,
      discipline: 0,
      wisdom: 0,
      creativity: 0
    }) as CharacterStats;

    return { user, stats };
  },

  async initOrGetUser(uid: string, tokenData?: { email?: string; name?: string }): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const userDocRef = adminDb.collection('users').doc(uid);
    const statsDocRef = adminDb.collection('stats').doc(uid);

    const [userSnap, statsSnap] = await Promise.all([
      userDocRef.get(),
      statsDocRef.get()
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
        userDocRef.set(initialProfile),
        statsDocRef.set(initialStats),
        adminDb.collection('inventory').doc(`${uid}_starter`).set(starterInvItem)
      ]);

      return { user: initialProfile, stats: initialStats };
    }

    const existingUser = userSnap.data() as UserProfile;
    let existingStats = (statsSnap.exists ? statsSnap.data() : {
      intellect: 0,
      strength: 0,
      discipline: 0,
      wisdom: 0,
      creativity: 0
    }) as CharacterStats;

    if (!statsSnap.exists) {
      await statsDocRef.set(existingStats);
    }

    // Ensure starter inventory item exists
    const starterInvRef = adminDb.collection('inventory').doc(`${uid}_starter`);
    const starterInvSnap = await starterInvRef.get();
    if (!starterInvSnap.exists) {
      await starterInvRef.set({
        id: `${uid}_starter`,
        userId: uid,
        itemId: STARTER_CHARACTER_ID,
        purchasedAt: now
      });
    }

    // Validate streak status using historical dates
    if (existingUser.lastQuestCompletedDate) {
      const historySnap = await adminDb.collection('questHistory')
        .where('userId', '==', uid)
        .get();

      const dates: string[] = [];
      historySnap.forEach(d => {
        const h = d.data();
        if (h.completedAt) dates.push(h.completedAt);
      });

      if (dates.length > 0) {
        const computedStreak = computeDateBasedStreak(dates, new Date());
        if (computedStreak.currentStreak !== existingUser.currentStreak) {
          await userDocRef.update({
            currentStreak: computedStreak.currentStreak,
            longestStreak: Math.max(existingUser.longestStreak || 0, computedStreak.longestStreak),
            updatedAt: now
          });
          existingUser.currentStreak = computedStreak.currentStreak;
          existingUser.longestStreak = Math.max(existingUser.longestStreak || 0, computedStreak.longestStreak);
        }
      }
    }

    return { user: existingUser, stats: existingStats };
  },

  async onboardingSetup(uid: string, payload: { characterClass?: string; goals?: string[] }): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const userDocRef = adminDb.collection('users').doc(uid);
    const updates: Record<string, any> = {
      onboardingCompleted: true,
      updatedAt: new Date().toISOString()
    };

    if (payload.characterClass) updates.characterClass = payload.characterClass;
    if (payload.goals && Array.isArray(payload.goals)) updates.goals = payload.goals;

    await userDocRef.update(updates);
    return await this.getUser(uid);
  },

  async updateAvatar(uid: string, payload: { customAvatarUrl?: string; userPhotoUrl?: string }): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const userDocRef = adminDb.collection('users').doc(uid);
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (payload.customAvatarUrl !== undefined) updates.customAvatarUrl = payload.customAvatarUrl;
    if (payload.userPhotoUrl !== undefined) updates.userPhotoUrl = payload.userPhotoUrl;

    await userDocRef.update(updates);
    return await this.getUser(uid);
  },

  async updateGender(uid: string, gender: 'male' | 'female'): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const userDocRef = adminDb.collection('users').doc(uid);
    const userSnap = await userDocRef.get();
    if (!userSnap.exists) throw new Error('User not found');
    const user = userSnap.data() as UserProfile;

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

    await userDocRef.update(updates);
    return await this.getUser(uid);
  },

  async getQuests(uid: string): Promise<Quest[]> {
    const questsSnap = await adminDb.collection('quests')
      .where('userId', '==', uid)
      .get();

    const quests: Quest[] = [];
    questsSnap.forEach(d => {
      quests.push(d.data() as Quest);
    });

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
  }): Promise<Quest> {
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

    await adminDb.collection('quests').doc(questId).set(newQuest);
    return newQuest;
  },

  async deleteQuest(uid: string, questId: string): Promise<boolean> {
    const questRef = adminDb.collection('quests').doc(questId);
    const questSnap = await questRef.get();

    if (!questSnap.exists) {
      throw new Error('Quest not found');
    }

    const quest = questSnap.data() as Quest;
    if (quest.userId !== uid) {
      throw new Error('Unauthorized: Quest does not belong to the user');
    }

    await questRef.delete();
    return true;
  },

  /**
   * Secure, Server-Authoritative Quest Completion
   * Atomically updates Quest, User Profile, Character Stats, History, and Achievements in a single transaction.
   */
  async completeQuest(uid: string, questId: string): Promise<{
    quest: Quest;
    user: UserProfile;
    stats: CharacterStats;
    didLevelUp: boolean;
    newLevel: number;
    levelData: { level: number; currentLevelXp: number; nextLevelXp: number; progressPct: number };
    unlockedAchievements: Achievement[];
  }> {
    const questRef = adminDb.collection('quests').doc(questId);
    const userRef = adminDb.collection('users').doc(uid);
    const statsRef = adminDb.collection('stats').doc(uid);

    // Pre-fetch historical completions for accurate calendar streak calculation
    const [historySnap, userAchievementsSnap, inventorySnap] = await Promise.all([
      adminDb.collection('questHistory').where('userId', '==', uid).get(),
      adminDb.collection('userAchievements').where('userId', '==', uid).get(),
      adminDb.collection('inventory').where('userId', '==', uid).get()
    ]);

    const existingCompletionDates: string[] = [];
    historySnap.forEach(d => {
      const h = d.data();
      if (h.completedAt) existingCompletionDates.push(h.completedAt);
    });

    const unlockedAchievementIds = new Set<string>();
    userAchievementsSnap.forEach(d => {
      const a = d.data();
      if (a.achievementId) unlockedAchievementIds.add(a.achievementId);
    });

    const inventoryCount = inventorySnap.size;

    const result = await adminDb.runTransaction(async (transaction) => {
      // Step 1: Read all documents first (Firestore transaction rule)
      const [questSnap, userSnap, statsSnap] = await Promise.all([
        transaction.get(questRef),
        transaction.get(userRef),
        transaction.get(statsRef)
      ]);

      if (!questSnap.exists) {
        throw new Error('Quest not found');
      }
      const quest = questSnap.data() as Quest;

      if (quest.userId !== uid) {
        throw new Error('Unauthorized: Quest does not belong to the logged-in user');
      }

      if (quest.completed) {
        throw new Error('Quest has already been completed');
      }

      if (!userSnap.exists) {
        throw new Error('User not found');
      }
      const user = userSnap.data() as UserProfile;

      const currentStats: CharacterStats = (statsSnap.exists ? statsSnap.data() : {
        intellect: 0,
        strength: 0,
        discipline: 0,
        wisdom: 0,
        creativity: 0
      }) as CharacterStats;

      // Step 2: Compute Authoritative Rewards (Server-Controlled)
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

      // Step 3: Transaction Writes (Atomicity Guaranteed)
      // 1. Update Quest
      const updatedQuest: Quest = {
        ...quest,
        completed: true,
        completedAt: now
      };
      transaction.update(questRef, {
        completed: true,
        completedAt: now
      });

      // 2. Update User Profile
      const updatedUser: UserProfile = {
        ...user,
        totalXp: newTotalXp,
        level: levelData.level,
        gold: newGold,
        currentStreak: newStreak,
        longestStreak: longestStreak,
        lastQuestCompletedDate: now
      };
      transaction.update(userRef, {
        totalXp: newTotalXp,
        level: levelData.level,
        gold: newGold,
        currentStreak: newStreak,
        longestStreak: longestStreak,
        lastQuestCompletedDate: now
      });

      // 3. Update Character Stats
      transaction.set(statsRef, updatedStats);

      // 4. Create Immutable Quest History Entry
      const historyId = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const historyDocRef = adminDb.collection('questHistory').doc(historyId);
      transaction.set(historyDocRef, {
        id: historyId,
        userId: uid,
        questId: questId,
        questTitle: quest.title,
        xpEarned,
        goldEarned,
        completedAt: now
      });

      // 5. Create newly unlocked Achievements
      for (const ach of newlyUnlockedAchievements) {
        const achDocId = `${uid}_${ach.id}`;
        const achDocRef = adminDb.collection('userAchievements').doc(achDocId);
        transaction.set(achDocRef, {
          id: achDocId,
          userId: uid,
          achievementId: ach.id,
          unlockedAt: now
        });
      }

      return {
        quest: updatedQuest,
        user: updatedUser,
        stats: updatedStats,
        didLevelUp,
        newLevel: levelData.level,
        levelData,
        unlockedAchievements: newlyUnlockedAchievements
      };
    });

    return result;
  },

  getShopItems(): ShopItem[] {
    return SHOP_ITEMS;
  },

  async getInventory(uid: string): Promise<{ inventory: InventoryItem[]; items: ShopItem[] }> {
    const snap = await adminDb.collection('inventory')
      .where('userId', '==', uid)
      .get();

    const inventory: InventoryItem[] = [];
    snap.forEach(d => inventory.push(d.data() as InventoryItem));

    if (inventory.length === 0) {
      const now = new Date().toISOString();
      const starterInvItem: InventoryItem = {
        id: `${uid}_starter`,
        userId: uid,
        itemId: STARTER_CHARACTER_ID,
        purchasedAt: now
      };
      await adminDb.collection('inventory').doc(`${uid}_starter`).set(starterInvItem);
      inventory.push(starterInvItem);
    }

    const ownedIds = new Set(inventory.map(i => i.itemId));
    const items = SHOP_ITEMS.filter(s => ownedIds.has(s.id));

    return { inventory, items };
  },

  /**
   * Secure, Server-Authoritative Shop Purchase
   * Validates level gate, Gold amount, catalog pricing, and prior ownership inside a Firestore transaction.
   */
  async buyShopItem(uid: string, itemId: string): Promise<{
    user: UserProfile;
    item: ShopItem;
    inventory: InventoryItem[];
  }> {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found in official shop catalogue');
    }

    const userRef = adminDb.collection('users').doc(uid);
    const invDocId = `inv_${uid}_${itemId}`;
    const invRef = adminDb.collection('inventory').doc(invDocId);

    const now = new Date().toISOString();

    const updatedUser = await adminDb.runTransaction(async (transaction) => {
      const [userSnap, invSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(invRef)
      ]);

      if (!userSnap.exists) {
        throw new Error('User not found');
      }

      const user = userSnap.data() as UserProfile;

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

      const newGold = currentGold - item.price;
      const userUpdates: Record<string, any> = {
        gold: newGold,
        updatedAt: now
      };

      // If user purchases a character avatar, set it as active avatar
      if (item.category === 'characters' && item.previewUrl) {
        userUpdates.customAvatarUrl = item.previewUrl;
      }

      // Transaction Writes: Gold deduction + Inventory item creation
      transaction.update(userRef, userUpdates);
      transaction.set(invRef, {
        id: invDocId,
        userId: uid,
        itemId: item.id,
        purchasedAt: now
      });

      return {
        ...user,
        ...userUpdates
      } as UserProfile;
    });

    const allInv = await this.getInventory(uid);
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
  async equipItem(uid: string, itemId: string, unequip = false): Promise<{ user: UserProfile }> {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found in official catalogue');
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error('User not found');
    const user = userSnap.data() as UserProfile;

    // Security check: Verify user owns the item before equipping!
    if (!unequip && itemId !== STARTER_CHARACTER_ID) {
      const invDocId = `inv_${uid}_${itemId}`;
      const invSnap = await adminDb.collection('inventory').doc(invDocId).get();

      if (!invSnap.exists) {
        // Double check query in case of alternate ID
        const altSnap = await adminDb.collection('inventory')
          .where('userId', '==', uid)
          .where('itemId', '==', itemId)
          .get();

        if (altSnap.empty) {
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

    await userRef.update(updates);

    return {
      user: {
        ...user,
        ...updates
      }
    };
  },

  async getAchievements(uid: string): Promise<(Achievement & { unlocked: boolean; unlockedAt?: string })[]> {
    const userAchsSnap = await adminDb.collection('userAchievements')
      .where('userId', '==', uid)
      .get();

    const unlockedMap = new Map<string, string>();
    userAchsSnap.forEach(d => {
      const data = d.data();
      unlockedMap.set(data.achievementId, data.unlockedAt);
    });

    return ACHIEVEMENTS.map(ach => ({
      ...ach,
      unlocked: unlockedMap.has(ach.id),
      unlockedAt: unlockedMap.get(ach.id)
    }));
  },

  async getProgress(uid: string): Promise<{
    history: any[];
    historyByDate: Record<string, { xp: number; gold: number; count: number }>;
    stats: CharacterStats;
    totalCompleted: number;
    totalQuests: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    const [histSnap, questsSnap, userRes] = await Promise.all([
      adminDb.collection('questHistory').where('userId', '==', uid).get(),
      adminDb.collection('quests').where('userId', '==', uid).get(),
      this.getUser(uid)
    ]);

    const history: any[] = [];
    const historyByDate: Record<string, { xp: number; gold: number; count: number }> = {};

    histSnap.forEach(d => {
      const item = d.data();
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
      totalQuests: questsSnap.size,
      currentStreak: userRes.user.currentStreak || 0,
      longestStreak: userRes.user.longestStreak || 0
    };
  }
};
