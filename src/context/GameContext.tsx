import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, CharacterStats, Quest, ShopItem, InventoryItem, Achievement, QuestCategory, QuestDifficulty, QuestType, QuestFrequency, AttributeType } from '../types';
import { api, getToken, setToken, removeToken } from '../services/api';
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
  
  // Auth methods
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, username: string, characterClass?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  onboardingSetup: (characterClass?: string, goals?: string[]) => Promise<void>;
  updateAvatar: (payload: { customAvatarUrl?: string; userPhotoUrl?: string }) => Promise<void>;
  updateGender: (gender: 'male' | 'female') => Promise<void>;

  // Quest methods
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

  // Shop & Inventory methods
  fetchShopAndInventory: () => Promise<void>;
  buyShopItem: (itemId: string) => Promise<void>;
  equipItem: (itemId: string, unequip?: boolean) => Promise<void>;

  // Modals & UI state
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(soundManager.enabled);

  // Modals & XP Animation
  const [completionResultModal, setCompletionResultModal] = useState<QuestCompletionResult | null>(null);
  const [isCreateQuestOpen, setIsCreateQuestOpen] = useState<boolean>(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [shopTryOnItem, setShopTryOnItem] = useState<ShopItem | null>(null);
  const [lastXpGain, setLastXpGain] = useState<{ amount: number; timestamp: number } | null>(null);

  const triggerXpGain = (amount: number) => {
    setLastXpGain({ amount, timestamp: Date.now() });
  };

  const setSoundEnabled = (enabled: boolean) => {
    soundManager.setEnabled(enabled);
    setSoundEnabledState(enabled);
  };

  const refreshAll = async () => {
    try {
      if (!getToken()) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const meData = await api.getMe();
      setUser(meData.user);
      setStats(meData.stats);

      const [qRes, shopRes, invRes, achRes] = await Promise.all([
        api.getQuests(),
        api.getShopItems(),
        api.getInventory(),
        api.getAchievements()
      ]);

      setQuests(qRes.quests);
      setShopItems(shopRes.items);
      setInventory(invRes.inventory);
      setOwnedItems(invRes.items);
      setAchievements(achRes.achievements);
    } catch (e) {
      console.error('Error fetching user state:', e);
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      setToken(res.token);
      setUser(res.user);
      setStats(res.stats);
      soundManager.playClick();
      await refreshAll();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, username: string, characterClass?: string) => {
    setIsLoading(true);
    try {
      const res = await api.register({ email, password: pass, username, characterClass });
      setToken(res.token);
      setUser(res.user);
      setStats(res.stats);
      soundManager.playClick();
      await refreshAll();
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      if (!fbUser || !fbUser.email) {
        throw new Error('Google Sign-In failed or email is missing.');
      }
      const res = await api.loginWithGoogle({
        email: fbUser.email,
        displayName: fbUser.displayName,
        uid: fbUser.uid
      });
      setToken(res.token);
      setUser(res.user);
      setStats(res.stats);
      soundManager.playClick();
      await refreshAll();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    logoutFirebase();
    setUser(null);
    setStats(null);
    setQuests([]);
    setActiveTab('home');
  };

  const onboardingSetup = async (characterClass?: string, goals?: string[]) => {
    setIsLoading(true);
    try {
      const res = await api.onboardingSetup({ characterClass, goals });
      setUser(res.user);
      setStats(res.stats);
      await fetchQuests();
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async (payload: { customAvatarUrl?: string; userPhotoUrl?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.updateAvatar(payload);
      setUser(res.user);
      if (res.stats) setStats(res.stats);
      soundManager.playAchievement();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateGender = async (gender: 'male' | 'female') => {
    setIsLoading(true);
    try {
      const res = await api.updateGender(gender);
      setUser(res.user);
      if (res.stats) setStats(res.stats);
    } finally {
      setIsLoading(false);
    }
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
    const res = await api.createQuest(payload);
    soundManager.playClick();
    setQuests(prev => [res.quest, ...prev]);
  };

  const deleteQuest = async (questId: string) => {
    await api.deleteQuest(questId);
    setQuests(prev => prev.filter(q => q.id !== questId));
  };

  const completeQuest = async (questId: string): Promise<QuestCompletionResult | null> => {
    // Find quest
    const targetQuest = quests.find(q => q.id === questId);
    if (!targetQuest || targetQuest.completed) return null;

    // Optimistic UI update
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));

    try {
      const res = await api.completeQuest(questId);
      setUser(res.user);
      setStats(res.stats);
      if (res.quest.xpReward) {
        triggerXpGain(res.quest.xpReward);
      }

      const resultData: QuestCompletionResult = {
        quest: res.quest,
        xpEarned: res.quest.xpReward,
        goldEarned: res.quest.goldReward,
        attributeReward: res.quest.attributeReward,
        didLevelUp: res.didLevelUp,
        newLevel: res.newLevel,
        unlockedAchievements: res.unlockedAchievements
      };

      // Play Sound Effects
      if (res.didLevelUp) {
        soundManager.playLevelUp();
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else if (res.unlockedAchievements.length > 0) {
        soundManager.playAchievement();
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 }
        });
      } else {
        soundManager.playQuestComplete();
      }

      setCompletionResultModal(resultData);
      await refreshAll();
      return resultData;
    } catch (e) {
      // Revert optimistic update on error
      setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: false } : q));
      throw e;
    }
  };

  const fetchShopAndInventory = async () => {
    const [shopRes, invRes] = await Promise.all([api.getShopItems(), api.getInventory()]);
    setShopItems(shopRes.items);
    setInventory(invRes.inventory);
    setOwnedItems(invRes.items);
  };

  const buyShopItem = async (itemId: string) => {
    const res = await api.buyShopItem(itemId);
    setUser(res.user);
    setInventory(res.inventory);
    soundManager.playPurchase();
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 }
    });
    await fetchShopAndInventory();
  };

  const equipItem = async (itemId: string, unequip = false) => {
    const res = await api.equipItem(itemId, unequip);
    setUser(res.user);
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
        login,
        register,
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
