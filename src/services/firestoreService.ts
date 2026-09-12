import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  type DocumentData
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, type FirebaseUser } from '../lib/firebase';
import {
  UserProfile,
  CharacterStats,
  Quest,
  InventoryItem,
  ShopItem,
  Achievement,
  QuestCategory,
  QuestDifficulty,
  QuestType,
  QuestFrequency,
  AttributeType
} from '../types';
import {
  STARTER_AVATAR_URL,
  STARTER_CHARACTER_ID,
  SHOP_ITEMS,
  ACHIEVEMENTS,
  REWARDS,
  ATTRIBUTE_BY_CATEGORY
} from '../data/shopAndAchievements';
import { calculateLevelData } from '../utils/level';

export const firestoreService = {
  /**
   * Initializes or fetches a user's real Firestore profile and character stats.
   * Eliminates all mock/simulated fallback data.
   */
  async initOrGetUser(fbUser: FirebaseUser): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const uid = fbUser.uid;
    const userDocRef = doc(db, 'users', uid);
    const statsDocRef = doc(db, 'stats', uid);

    try {
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        const statsSnap = await getDoc(statsDocRef);
        let statsData = statsSnap.exists() ? (statsSnap.data() as CharacterStats) : null;

        // Check if user has any completed quests in history
        const completedQuestsSnap = await getDocs(
          query(collection(db, 'quests'), where('userId', '==', uid), where('completed', '==', true))
        );

        if (!statsData || completedQuestsSnap.empty) {
          // If no quests have been completed, all stats must be strictly zero at start
          statsData = {
            intellect: 0,
            strength: 0,
            discipline: 0,
            wisdom: 0,
            creativity: 0
          };
          await setDoc(statsDocRef, statsData);

          if (userData.totalXp === 0 && (userData.gold !== 0 || userData.currentStreak !== 0 || userData.longestStreak !== 0)) {
            userData.gold = 0;
            userData.currentStreak = 0;
            userData.longestStreak = 0;
            await updateDoc(userDocRef, {
              gold: 0,
              currentStreak: 0,
              longestStreak: 0
            });
          }
        } else if (
          // If stats still hold legacy starting default of 10, recalculate accurately from completed quests
          statsData.intellect >= 10 && statsData.strength >= 10 && statsData.discipline >= 10
        ) {
          const freshStats: CharacterStats = {
            intellect: 0,
            strength: 0,
            discipline: 0,
            wisdom: 0,
            creativity: 0
          };
          completedQuestsSnap.forEach(d => {
            const q = d.data() as Quest;
            if (q.attributeReward?.attribute) {
              freshStats[q.attributeReward.attribute] = (freshStats[q.attributeReward.attribute] || 0) + (q.attributeReward.amount || 1);
            }
          });
          statsData = freshStats;
          await setDoc(statsDocRef, statsData);
        }

        return { user: { ...userData, id: uid }, stats: statsData };
      }

      // Fresh User Initialization directly in Firestore: all data starts at ZERO
      const now = new Date().toISOString();
      const newProfile: UserProfile = {
        id: uid,
        username: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cyber Adventurer',
        email: fbUser.email || '',
        characterClass: 'Warrior',
        gender: 'male',
        customAvatarUrl: STARTER_AVATAR_URL,
        level: 1,
        totalXp: 0,
        gold: 0,
        currentStreak: 0,
        longestStreak: 0,
        equippedTheme: 'theme-cyber',
        equippedTitle: 'Explorer',
        equippedFrame: 'frame-neon',
        equippedEffect: 'effect-lightning',
        equippedBackground: 'bg-citadel',
        equippedWearables: {},
        goals: ['Academics', 'Coding', 'Fitness'],
        onboardingCompleted: false,
        createdAt: now
      };

      const newStats: CharacterStats = {
        intellect: 0,
        strength: 0,
        discipline: 0,
        wisdom: 0,
        creativity: 0
      };

      // Write User & Stats to Firestore
      await setDoc(userDocRef, newProfile);
      await setDoc(statsDocRef, newStats);

      // Add Starter Character to Firestore Inventory
      const starterInventoryDocRef = doc(db, 'inventory', `${uid}_starter`);
      const starterInvItem: InventoryItem = {
        id: `${uid}_starter`,
        userId: uid,
        itemId: STARTER_CHARACTER_ID,
        purchasedAt: now
      };
      await setDoc(starterInventoryDocRef, starterInvItem);

      return { user: newProfile, stats: newStats };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      throw err;
    }
  },

  async getUser(uid: string): Promise<{ user: UserProfile; stats: CharacterStats }> {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) {
        throw new Error(`User profile ${uid} not found in Firestore`);
      }
      const userData = userSnap.data() as UserProfile;

      const statsSnap = await getDoc(doc(db, 'stats', uid));
      const statsData: CharacterStats = statsSnap.exists()
        ? (statsSnap.data() as CharacterStats)
        : {
            intellect: 0,
            strength: 0,
            discipline: 0,
            wisdom: 0,
            creativity: 0
          };

      return { user: { ...userData, id: uid }, stats: statsData };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      throw err;
    }
  },

  async getQuests(uid: string): Promise<Quest[]> {
    try {
      const q = query(collection(db, 'quests'), where('userId', '==', uid));
      const snap = await getDocs(q);
      const list: Quest[] = [];
      const legacySeedIds = new Set([`quest_${uid}_1`, `quest_${uid}_2`, `quest_${uid}_3`]);

      for (const d of snap.docs) {
        if (legacySeedIds.has(d.id)) {
          // Clean up any legacy simulated/auto-generated quests from Firestore
          await deleteDoc(doc(db, 'quests', d.id));
          continue;
        }
        const item = d.data() as Quest;
        list.push({ ...item, id: d.id });
      }

      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'quests');
      throw err;
    }
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
    const diff = payload.difficulty || 'Medium';
    const reward = REWARDS[diff] || REWARDS.Medium;
    const cat = payload.category || 'General';
    const attrTarget = payload.attributeTarget || (ATTRIBUTE_BY_CATEGORY[cat] as AttributeType) || 'intellect';

    const questId = `quest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newQuest: Quest = {
      id: questId,
      userId: uid,
      title: payload.title.trim(),
      description: (payload.description || '').trim(),
      category: payload.category,
      difficulty: diff,
      type: payload.type || 'Daily',
      frequency: payload.frequency || 'Daily',
      xpReward: reward.xp,
      goldReward: reward.gold,
      attributeReward: {
        attribute: attrTarget,
        amount: reward.stat
      },
      completed: false,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'quests', questId), newQuest);
      return newQuest;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `quests/${questId}`);
      throw err;
    }
  },

  async deleteQuest(questId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'quests', questId));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `quests/${questId}`);
      throw err;
    }
  },

  async completeQuest(uid: string, questId: string): Promise<{
    quest: Quest;
    user: UserProfile;
    stats: CharacterStats;
    didLevelUp: boolean;
    newLevel: number;
    levelData: { level: number; currentLevelXp: number; nextLevelXp: number; progressPct: number };
    unlockedAchievements: Achievement[];
  }> {
    const questRef = doc(db, 'quests', questId);
    const userRef = doc(db, 'users', uid);
    const statsRef = doc(db, 'stats', uid);

    try {
      const [questSnap, userSnap, statsSnap] = await Promise.all([
        getDoc(questRef),
        getDoc(userRef),
        getDoc(statsRef)
      ]);

      if (!questSnap.exists()) throw new Error('Quest not found');
      if (!userSnap.exists()) throw new Error('User profile not found');

      const quest = questSnap.data() as Quest;
      const user = userSnap.data() as UserProfile;
      const stats: CharacterStats = statsSnap.exists()
        ? (statsSnap.data() as CharacterStats)
        : {
            intellect: 0,
            strength: 0,
            discipline: 0,
            wisdom: 0,
            creativity: 0
          };

      // Mark quest completed
      const now = new Date().toISOString();
      const updatedQuest: Quest = {
        ...quest,
        id: questId,
        completed: true,
        completedAt: now
      };
      await updateDoc(questRef, {
        completed: true,
        completedAt: now
      });

      // Calculate XP & Level Progression
      const oldLevel = user.level || 1;
      const newTotalXp = (user.totalXp || 0) + (quest.xpReward || 50);
      const levelData = calculateLevelData(newTotalXp);
      const didLevelUp = levelData.level > oldLevel;
      const newGold = (user.gold || 0) + (quest.goldReward || 20);
      const newStreak = (user.currentStreak || 0) + 1;
      const longestStreak = Math.max(user.longestStreak || 0, newStreak);

      const updatedUser: UserProfile = {
        ...user,
        id: uid,
        totalXp: newTotalXp,
        level: levelData.level,
        gold: newGold,
        currentStreak: newStreak,
        longestStreak: longestStreak,
        lastQuestCompletedDate: now
      };
      await updateDoc(userRef, {
        totalXp: newTotalXp,
        level: levelData.level,
        gold: newGold,
        currentStreak: newStreak,
        longestStreak: longestStreak,
        lastQuestCompletedDate: now
      });

      // Update Character Stats attributes: calculated starting strictly from 0
      const attrKey = (quest.attributeReward?.attribute || 'intellect') as AttributeType;
      const attrAmount = quest.attributeReward?.amount || 1;
      const currentVal = (stats as any)[attrKey] ?? 0;
      const updatedStats: CharacterStats = {
        intellect: stats.intellect ?? 0,
        strength: stats.strength ?? 0,
        discipline: stats.discipline ?? 0,
        wisdom: stats.wisdom ?? 0,
        creativity: stats.creativity ?? 0,
        [attrKey]: currentVal + attrAmount
      };
      await setDoc(statsRef, updatedStats);

      // Record to Firestore questHistory
      const historyId = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await setDoc(doc(db, 'questHistory', historyId), {
        id: historyId,
        userId: uid,
        questId: questId,
        questTitle: quest.title,
        xpEarned: quest.xpReward,
        goldEarned: quest.goldReward,
        completedAt: now
      });

      // Check and award achievements in Firestore
      const unlockedAchievements: Achievement[] = [];
      const userAchsSnap = await getDocs(
        query(collection(db, 'userAchievements'), where('userId', '==', uid))
      );
      const unlockedSet = new Set<string>();
      userAchsSnap.forEach(d => unlockedSet.add(d.data().achievementId));

      // 1. First Quest
      if (!unlockedSet.has('ach-first-quest')) {
        const a = ACHIEVEMENTS.find(x => x.id === 'ach-first-quest');
        if (a) unlockedAchievements.push(a);
      }
      // 2. Streaks
      if (newStreak >= 7 && !unlockedSet.has('ach-streak-7')) {
        const a = ACHIEVEMENTS.find(x => x.id === 'ach-streak-7');
        if (a) unlockedAchievements.push(a);
      }
      if (newStreak >= 14 && !unlockedSet.has('ach-streak-14')) {
        const a = ACHIEVEMENTS.find(x => x.id === 'ach-streak-14');
        if (a) unlockedAchievements.push(a);
      }
      // 3. Levels
      if (levelData.level >= 5 && !unlockedSet.has('ach-level-5')) {
        const a = ACHIEVEMENTS.find(x => x.id === 'ach-level-5');
        if (a) unlockedAchievements.push(a);
      }
      if (levelData.level >= 10 && !unlockedSet.has('ach-level-10')) {
        const a = ACHIEVEMENTS.find(x => x.id === 'ach-level-10');
        if (a) unlockedAchievements.push(a);
      }

      // Write any new achievements to Firestore
      for (const ach of unlockedAchievements) {
        if (!ach) continue;
        const achDocId = `${uid}_${ach.id}`;
        await setDoc(doc(db, 'userAchievements', achDocId), {
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
        unlockedAchievements: unlockedAchievements.filter(Boolean)
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `quests/${questId}`);
      throw err;
    }
  },

  getShopItems(): ShopItem[] {
    return SHOP_ITEMS;
  },

  async getInventory(uid: string): Promise<{ inventory: InventoryItem[]; items: ShopItem[] }> {
    try {
      const snap = await getDocs(
        query(collection(db, 'inventory'), where('userId', '==', uid))
      );
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
        await setDoc(doc(db, 'inventory', `${uid}_starter`), starterInvItem);
        inventory.push(starterInvItem);
      }

      const ownedIds = new Set(inventory.map(i => i.itemId));
      const items = SHOP_ITEMS.filter(s => ownedIds.has(s.id));

      return { inventory, items };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'inventory');
      throw err;
    }
  },

  async buyShopItem(uid: string, itemId: string): Promise<{
    user: UserProfile;
    item: ShopItem;
    inventory: InventoryItem[];
  }> {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found in catalogue');

    const userRef = doc(db, 'users', uid);

    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data() as UserProfile;

      if ((user.gold || 0) < item.price) {
        throw new Error(`Insufficient gold. You need ${item.price} Gold.`);
      }

      // Check if already owned
      const invSnap = await getDocs(
        query(
          collection(db, 'inventory'),
          where('userId', '==', uid),
          where('itemId', '==', itemId)
        )
      );
      if (!invSnap.empty) {
        throw new Error('You already own this item!');
      }

      const newGold = (user.gold || 0) - item.price;
      const now = new Date().toISOString();

      // Deduct gold
      await updateDoc(userRef, {
        gold: newGold
      });

      // Add to inventory
      const invDocId = `inv_${uid}_${itemId}`;
      const newInvItem: InventoryItem = {
        id: invDocId,
        userId: uid,
        itemId: itemId,
        purchasedAt: now
      };
      await setDoc(doc(db, 'inventory', invDocId), newInvItem);

      // If it's a character avatar, set it as active avatar
      let updatedUser: UserProfile = {
        ...user,
        gold: newGold
      };

      if (item.category === 'characters' && item.previewUrl) {
        await updateDoc(userRef, {
          customAvatarUrl: item.previewUrl
        });
        updatedUser.customAvatarUrl = item.previewUrl;
      }

      const allInv = await this.getInventory(uid);
      return {
        user: updatedUser,
        item,
        inventory: allInv.inventory
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `inventory/${uid}_${itemId}`);
      throw err;
    }
  },

  async equipItem(uid: string, itemId: string, unequip = false): Promise<{ user: UserProfile }> {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');

    const userRef = doc(db, 'users', uid);

    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data() as UserProfile;

      let customAvatarUrl = user.customAvatarUrl;
      const updates: DocumentData = {};

      if (item.category === 'characters') {
        customAvatarUrl = unequip ? STARTER_AVATAR_URL : (item.previewUrl || STARTER_AVATAR_URL);
        updates.customAvatarUrl = customAvatarUrl;
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

      await updateDoc(userRef, updates);

      return {
        user: {
          ...user,
          ...updates
        }
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      throw err;
    }
  },

  async getAchievements(uid: string): Promise<(Achievement & { unlocked: boolean; unlockedAt?: string })[]> {
    try {
      const userAchsSnap = await getDocs(
        query(collection(db, 'userAchievements'), where('userId', '==', uid))
      );
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
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'userAchievements');
      throw err;
    }
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
    try {
      const [histSnap, questsSnap, userRes] = await Promise.all([
        getDocs(query(collection(db, 'questHistory'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'quests'), where('userId', '==', uid))),
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
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'questHistory');
      throw err;
    }
  },

  async onboardingSetup(uid: string, payload: { characterClass?: string; goals?: string[] }): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const userRef = doc(db, 'users', uid);
    try {
      const updates: DocumentData = {
        characterClass: 'Warrior', // Starter commission
        goals: payload.goals || ['Academics', 'Coding', 'Fitness'],
        onboardingCompleted: true
      };
      await updateDoc(userRef, updates);
      return await this.getUser(uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      throw err;
    }
  },

  async updateAvatar(uid: string, payload: { customAvatarUrl?: string; userPhotoUrl?: string }): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const userRef = doc(db, 'users', uid);
    try {
      const updates: DocumentData = {};
      if (payload.customAvatarUrl) updates.customAvatarUrl = payload.customAvatarUrl;
      await updateDoc(userRef, updates);
      return await this.getUser(uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      throw err;
    }
  },

  async updateGender(uid: string, gender: 'male' | 'female'): Promise<{ user: UserProfile; stats: CharacterStats }> {
    const userRef = doc(db, 'users', uid);
    try {
      await updateDoc(userRef, {
        gender
      });
      return await this.getUser(uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      throw err;
    }
  }
};
