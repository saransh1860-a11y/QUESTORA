import React from 'react';
import { useGame } from '../../context/GameContext';
import { NameplateBadge } from '../character/NameplateBadge';
import { Plus, Flame, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, activeTab, setIsCreateQuestOpen } = useGame();

  if (!user) return null;

  const tabTitles: Record<string, string> = {
    home: 'MAIN DASHBOARD',
    quests: 'QUEST LOG',
    character: 'CHARACTER PROFILE',
    journey: 'PROGRESSION MAP',
    rewards: 'REWARD SHOP',
    inventory: 'ARMORY & INVENTORY',
    progress: 'ANALYTICS & HISTORY',
    achievements: 'HALL OF ACHIEVEMENTS',
    profile: 'USER SETTINGS & BADGES',
    settings: 'SYSTEM CONFIGURATION'
  };

  return (
    <header className="bg-[#0b0c10]/80 backdrop-blur-md border-b border-violet-900/20 px-4 lg:px-8 py-4 sticky top-0 z-20 flex items-center justify-between">
      {/* Page Title */}
      <div>
        <h2 className="text-base lg:text-lg font-bold text-white tracking-wider font-['Orbitron']">
          {tabTitles[activeTab] || 'QUESTORA'}
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400 hidden sm:block">
            Welcome back, <span className="text-violet-300 font-semibold">{user.username}</span>
          </p>
          <NameplateBadge titleId={user.equippedTitle} size="sm" />
        </div>
      </div>

      {/* Header Stat Widgets & Quick Action */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Streak Pill */}
        <div className="flex items-center gap-1.5 bg-orange-950/40 border border-orange-500/40 text-orange-400 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold">
          <Flame className="w-4 h-4 fill-orange-400 text-orange-400 animate-pulse" />
          <span>{user.currentStreak}d</span>
        </div>

        {/* Gold Pill */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]">
          <span>🪙</span>
          <span>{user.gold}</span>
        </div>

        {/* Create Quest Button */}
        <button
          onClick={() => setIsCreateQuestOpen(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">NEW QUEST</span>
        </button>
      </div>
    </header>
  );
};
