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
  runTransaction,
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
import { computeDateBasedStreak } from '../utils/streak';

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

        // Recalculate streak accurately based on calendar dates (not task count)
        const historySnap = await getDocs(
          query(collection(db, 'questHistory'), where('userId', '==', uid))
        );
        const completionDates: string[] = [];
        historySnap.forEach(d => {
          if (d.data().completedAt) completionDates.push(d.data().completedAt);
        });
        completedQuestsSnap.forEach(d => {
          const q = d.data() as Quest;
          if (q.completedAt) completionDates.push(q.completedAt);
        });

        const streakResult = computeDateBasedStreak(completionDates);
        if (userData.currentStreak !== streakResult.currentStreak || userData.longestStreak !== streakResult.longestStreak) {
          userData.currentStreak = streakResult.currentStreak;
          userData.longestStreak = streakResult.longestStreak;
          await updateDoc(userDocRef, {
            currentStreak: streakResult.currentStreak,
            longestStreak: streakResult.longestStreak
          });
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

      // Ensure streak reflects real calendar dates
      const historySnap = await getDocs(
        query(collection(db, 'questHistory'), where('userId', '==', uid))
      );
      const completionDates: string[] = [];
      historySnap.forEach(d => {
        if (d.data().completedAt) completionDates.push(d.data().completedAt);
      });
      const streakResult = computeDateBasedStreak(completionDates);
      if (userData.currentStreak !== streakResult.currentStreak || userData.longestStreak !== streakResult.longestStreak) {
        userData.currentStreak = streakResult.currentStreak;
        userData.longestStreak = streakResult.longestStreak;
        await updateDoc(doc(db, 'users', uid), {
          currentStreak: streakResult.currentStreak,
          longestStreak: streakResult.longestStreak
        });
      }

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
      // Fetch completion history for calendar-based streak calculation and current unlocked achievements
      const [historySnap, userAchsSnap] = await Promise.all([
        getDocs(query(collection(db, 'questHistory'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'userAchievements'), where('userId', '==', uid)))
      ]);

      const historyDates: string[] = [];
      historySnap.forEach(d => {
        if (d.data().completedAt) historyDates.push(d.data().completedAt);
      });
      const totalCompletedQuestsCount = historySnap.size + 1;

      const alreadyUnlockedAchIds = new Set<string>();
      userAchsSnap.forEach(d => alreadyUnlockedAchIds.add(d.data().achievementId));

      // Execute ALL quest completion updates in a single atomic Firestore transaction
      // Either ALL updates succeed together, or NONE are saved.
      const result = await runTransaction(db, async (transaction) => {
        // --- ALL READS MUST PRECEDE ALL WRITES (Strict Firestore Transaction Rule) ---
        const [questSnap, userSnap, statsSnap] = await Promise.all([
          transaction.get(questRef),
          transaction.get(userRef),
          transaction.get(statsRef)
        ]);

        if (!questSnap.exists()) {
          throw new Error('Quest not found');
        }
        if (!userSnap.exists()) {
          throw new Error('User profile not found');
        }

        const quest = questSnap.data() as Quest;
        const user = userSnap.data() as UserProfile;

        // Security check: quest must belong to logged-in user
        if (quest.userId !== uid) {
          throw new Error('Unauthorized: Quest does not belong to the logged-in user');
        }

        // Integrity check: a quest cannot be completed twice
        if (quest.completed) {
          throw new Error('Quest has already been completed');
        }

        const stats: CharacterStats = statsSnap.exists()
          ? (statsSnap.data() as CharacterStats)
          : {
              intellect: 0,
              strength: 0,
              discipline: 0,
              wisdom: 0,
              creativity: 0
            };

        const now = new Date().toISOString();

        // Calculate XP, Level and Gold Progression
        const oldLevel = user.level || 1;
        const xpEarned = quest.xpReward || 50;
        const goldEarned = quest.goldReward || 20;
        const newTotalXp = (user.totalXp || 0) + xpEarned;
        const levelData = calculateLevelData(newTotalXp);
        const didLevelUp = levelData.level > oldLevel;
        const newGold = (user.gold || 0) + goldEarned;

        // Date-based streak calculation: advances ONLY across calendar days, not per-task
        const combinedDates = [...historyDates, now];
        const streakData = computeDateBasedStreak(combinedDates, new Date());
        const newStreak = streakData.currentStreak;
        const longestStreak = Math.max(user.longestStreak || 0, streakData.longestStreak);

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

        const updatedQuest: Quest = {
          ...quest,
          id: questId,
          completed: true,
          completedAt: now
        };

        // Determine newly unlocked achievements based on final results
        const newlyUnlockedAchievements: Achievement[] = [];
        if (!alreadyUnlockedAchIds.has('ach-first-quest')) {
          const a = ACHIEVEMENTS.find(x => x.id === 'ach-first-quest');
          if (a) newlyUnlockedAchievements.push(a);
        }
        if (newStreak >= 7 && !alreadyUnlockedAchIds.has('ach-streak-7')) {
          const a = ACHIEVEMENTS.find(x => x.id === 'ach-streak-7');
          if (a) newlyUnlockedAchievements.push(a);
        }
        if (newStreak >= 14 && !alreadyUnlockedAchIds.has('ach-streak-14')) {
          const a = ACHIEVEMENTS.find(x => x.id === 'ach-streak-14');
          if (a) newlyUnlockedAchievements.push(a);
        }
        if (levelData.level >= 5 && !alreadyUnlockedAchIds.has('ach-level-5')) {
          const a = ACHIEVEMENTS.find(x => x.id === 'ach-level-5');
          if (a) newlyUnlockedAchievements.push(a);
        }
        if (levelData.level >= 10 && !alreadyUnlockedAchIds.has('ach-level-10')) {
          const a = ACHIEVEMENTS.find(x => x.id === 'ach-level-10');
          if (a) newlyUnlockedAchievements.push(a);
        }
        if (levelData.level >= 20 && !alreadyUnlockedAchIds.has('ach-level-20')) {
          const a = ACHIEVEMENTS.find(x => x.id === 'ach-level-20');
          if (a) newlyUnlockedAchievements.push(a);
        }
        if (totalCompletedQuestsCount >= 10 && !alreadyUnlockedAchIds.has('ach-quests-10')) {
          const a = ACHIEVEMENTS.find(x => x.id === 'ach-quests-10');
          if (a) newlyUnlockedAchievements.push(a);
        }
        if (updatedStats.intellect >= 5 && !alreadyUnlockedAchIds.has('ach-intellect-5')) {
          const a = ACHIEVEMENTS.find(x => x.id === 'ach-intellect-5');
          if (a) newlyUnlockedAchievements.push(a);
        }
        if (updatedStats.strength >= 5 && !alreadyUnlockedAchIds.has('ach-strength-5')) {
          const a = ACHIEVEMENTS.find(x => x.id === 'ach-strength-5');
          if (a) newlyUnlockedAchievements.push(a);
        }
        if (updatedStats.discipline >= 5 && !alreadyUnlockedAchIds.has('ach-discipline-5')) {
          const a = ACHIEVEMENTS.find(x => x.id === 'ach-discipline-5');
          if (a) newlyUnlockedAchievements.push(a);
        }

        // --- ALL WRITES MUST FOLLOW ALL READS (ATOMIC TRANSACTION COMMIT) ---
        // 1. Update Quest completion status
        transaction.update(questRef, {
          completed: true,
          completedAt: now,
          userId: uid
        });

        // 2. Update User Profile (totalXp, level, gold, streak)
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

        // 4. Create Quest History Entry
        const historyId = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const historyDocRef = doc(db, 'questHistory', historyId);
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
          const achDocRef = doc(db, 'userAchievements', achDocId);
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
          unlockedAchievements: newlyUnlockedAchievements.filter(Boolean)
        };
      });

      return result;
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
