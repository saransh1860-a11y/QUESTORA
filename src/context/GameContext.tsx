import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  UserProfile,
  CharacterStats,
  Quest,
  ShopItem,
  InventoryItem,
  Achievement,
  QuestCategory,
  QuestDifficulty,
  QuestType,
  QuestFrequency,
  AttributeType
} from '../types';
import { api } from '../services/api';
import { soundManager } from '../services/audio';
import confetti from 'canvas-confetti';
import { signInWithGoogle, logoutFirebase, auth, onAuthStateChanged } from '../lib/firebase';

export type NavigationTab =
  | 'home'
  | 'quests'
  | 'character'
  | 'journey'
  | 'rewards'
  | 'inventory'
  | 'progress'
  | 'achievements'
  | 'profile'
  | 'settings';

export interface QuestCompletionResult {
  quest: Quest;
  xpEarned: number;
  goldEarned: number;
  attributeReward: { attribute: AttributeType; amount: number };
  didLevelUp: boolean;
  newLevel: number;
  unlockedAchievements: Achievement[];
}

interface GameContextType {
  user: UserProfile | null;
  stats: CharacterStats | null;
  quests: Quest[];
  shopItems: ShopItem[];
  inventory: InventoryItem[];
  ownedItems: ShopItem[];
  achievements: (Achievement & { unlocked: boolean; unlockedAt?: string })[];
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  onboardingSetup: (characterClass?: string, goals?: string[]) => Promise<void>;
  updateAvatar: (payload: { customAvatarUrl?: string; userPhotoUrl?: string }) => Promise<void>;
  updateGender: (gender: 'male' | 'female') => Promise<void>;
  fetchQuests: () => Promise<void>;
  createQuest: (payload: {
    title: string;
    description?: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
    type: QuestType;
    frequency: QuestFrequency;
    attributeTarget?: AttributeType;
  }) => Promise<void>;
  deleteQuest: (questId: string) => Promise<void>;
  completeQuest: (questId: string) => Promise<QuestCompletionResult | null>;
  fetchShopAndInventory: () => Promise<void>;
  buyShopItem: (itemId: string) => Promise<void>;
  equipItem: (itemId: string, unequip?: boolean) => Promise<void>;
  completionResultModal: QuestCompletionResult | null;
  setCompletionResultModal: (res: QuestCompletionResult | null) => void;
  isCreateQuestOpen: boolean;
  setIsCreateQuestOpen: (open: boolean) => void;
  isAvatarModalOpen: boolean;
  setIsAvatarModalOpen: (open: boolean) => void;
  shopTryOnItem: ShopItem | null;
  setShopTryOnItem: (item: ShopItem | null) => void;
  lastXpGain: { amount: number; timestamp: number } | null;
  triggerXpGain: (amount: number) => void;
  refreshAll: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<CharacterStats | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [ownedItems, setOwnedItems] = useState<ShopItem[]>([]);
  const [achievements, setAchievements] = useState<(Achievement & { unlocked: boolean; unlockedAt?: string })[]>([]);
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabledState] = useState(soundManager.enabled);

  const [completionResultModal, setCompletionResultModal] = useState<QuestCompletionResult | null>(null);
  const [isCreateQuestOpen, setIsCreateQuestOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [shopTryOnItem, setShopTryOnItem] = useState<ShopItem | null>(null);
  const [lastXpGain, setLastXpGain] = useState<{ amount: number; timestamp: number } | null>(null);

  const triggerXpGain = (amount: number) => setLastXpGain({ amount, timestamp: Date.now() });

  const setSoundEnabled = (enabled: boolean) => {
    soundManager.setEnabled(enabled);
    setSoundEnabledState(enabled);
  };

  const refreshAll = async () => {
    if (!auth.currentUser) {
      setUser(null);
      setStats(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me.user);
      setStats(me.stats);

      const [q, s, i, a] = await Promise.all([
        api.getQuests(),
        api.getShopItems(),
        api.getInventory(),
        api.getAchievements()
      ]);

      setQuests(q.quests);
      setShopItems(s.items);
      setInventory(i.inventory);
      setOwnedItems(i.items);
      setAchievements(a.achievements);
    } catch (e) {
      console.error('Failed to refresh data from Firestore:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      setIsLoading(true);
      if (fbUser) {
        try {
          const r = await api.loginWithGoogle();
          setUser(r.user);
          setStats(r.stats);
          await refreshAll();
        } catch (e) {
          console.error('Failed to initialize user session in Firestore:', e);
          setUser(null);
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setStats(null);
        setQuests([]);
        setInventory([]);
        setOwnedItems([]);
        setAchievements([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      soundManager.playClick();
    } catch (err) {
      console.error('Sign-in cancelled or failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutFirebase();
    setUser(null);
    setStats(null);
    setQuests([]);
    setActiveTab('home');
  };

  const onboardingSetup = async (characterClass?: string, goals?: string[]) => {
    setIsLoading(true);
    try {
      const r = await api.onboardingSetup({ characterClass, goals });
      setUser(r.user);
      setStats(r.stats);
      await fetchQuests();
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async (payload: { customAvatarUrl?: string; userPhotoUrl?: string }) => {
    setIsLoading(true);
    try {
      const r = await api.updateAvatar(payload);
      setUser(r.user);
      setStats(r.stats);
      soundManager.playAchievement();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } finally {
      setIsLoading(false);
    }
  };

  const updateGender = async (gender: 'male' | 'female') => {
    const r = await api.updateGender(gender);
    setUser(r.user);
    setStats(r.stats);
  };

  const fetchQuests = async () => {
    const res = await api.getQuests();
    setQuests(res.quests);
  };

  const createQuest = async (payload: {
    title: string;
    description?: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
    type: QuestType;
    frequency: QuestFrequency;
    attributeTarget?: AttributeType;
  }) => {
    const r = await api.createQuest(payload);
    setQuests(p => [r.quest, ...p]);
    soundManager.playClick();
  };

  const deleteQuest = async (id: string) => {
    await api.deleteQuest(id);
    setQuests(p => p.filter(q => q.id !== id));
  };

  const completeQuest = async (id: string): Promise<QuestCompletionResult | null> => {
    const target = quests.find(q => q.id === id);
    if (!target || target.completed) return null;

    setQuests(p => p.map(q => (q.id === id ? { ...q, completed: true } : q)));

    try {
      const r = await api.completeQuest(id);
      setUser(r.user);
      setStats(r.stats);
      triggerXpGain(r.quest.xpReward);

      const result: QuestCompletionResult = {
        quest: r.quest,
        xpEarned: r.quest.xpReward,
        goldEarned: r.quest.goldReward,
        attributeReward: r.quest.attributeReward,
        didLevelUp: r.didLevelUp,
        newLevel: r.newLevel,
        unlockedAchievements: r.unlockedAchievements
      };

      if (r.didLevelUp) {
        soundManager.playLevelUp();
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } else if (r.unlockedAchievements.length) {
        soundManager.playAchievement();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      } else {
        soundManager.playQuestComplete();
      }

      setCompletionResultModal(result);
      await refreshAll();
      return result;
    } catch (e) {
      setQuests(p => p.map(q => (q.id === id ? { ...q, completed: false } : q)));
      throw e;
    }
  };

  const fetchShopAndInventory = async () => {
    const [i, s] = await Promise.all([api.getInventory(), api.getShopItems()]);
    setInventory(i.inventory);
    setOwnedItems(i.items);
    setShopItems(s.items);
  };

  const buyShopItem = async (id: string) => {
    const r = await api.buyShopItem(id);
    setUser(r.user);
    setInventory(r.inventory);
    soundManager.playPurchase();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    await fetchShopAndInventory();
  };

  const equipItem = async (id: string, unequip = false) => {
    const r = await api.equipItem(id, unequip);
    setUser(r.user);
    soundManager.playClick();
  };

  return (
    <GameContext.Provider
      value={{
        user,
        stats,
        quests,
        shopItems,
        inventory,
        ownedItems,
        achievements,
        activeTab,
        setActiveTab,
        isLoading,
        isAuthenticated: !!user,
        soundEnabled,
        setSoundEnabled,
        loginWithGoogle,
        logout,
        onboardingSetup,
        updateAvatar,
        updateGender,
        fetchQuests,
        createQuest,
        deleteQuest,
        completeQuest,
        fetchShopAndInventory,
        buyShopItem,
        equipItem,
        completionResultModal,
        setCompletionResultModal,
        isCreateQuestOpen,
        setIsCreateQuestOpen,
        isAvatarModalOpen,
        setIsAvatarModalOpen,
        shopTryOnItem,
        setShopTryOnItem,
        lastXpGain,
        triggerXpGain,
        refreshAll
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
