import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { QuestCard } from '../components/quests/QuestCard';
import { AvatarCanvas } from '../components/character/AvatarCanvas';
import { calculateLevelData } from '../utils/level';
import { Plus, Flame, Zap, Award, BookOpen, Activity, Target, Shield, Sparkles, Filter } from 'lucide-react';
import { QuestType } from '../types';

export const DashboardView: React.FC = () => {
  const { user, stats, quests, setIsCreateQuestOpen, setActiveTab, setIsAvatarModalOpen } = useGame();
  const [filterType, setFilterType] = useState<QuestType | 'All'>('All');

  if (!user || !stats) return null;

  const levelData = calculateLevelData(user.totalXp);

  const filteredQuests = quests.filter(q => {
    if (filterType === 'All') return true;
    return q.type === filterType;
  });

  const activeQuestsCount = quests.filter(q => !q.completed).length;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Character Header Card */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#141226] via-[#10121d] to-[#16122b] border border-violet-900/30 p-6 shadow-[0_0_30px_rgba(139,92,246,0.15)] overflow-hidden">
        {/* Subtle Background Particle Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="flex flex-col items-center gap-1.5">
              <AvatarCanvas user={user} size="md" />
              <button
                onClick={() => setIsAvatarModalOpen(true)}
                className="text-[10px] font-mono font-bold text-violet-300 hover:text-white bg-slate-900/80 hover:bg-violet-900/60 border border-violet-500/40 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-md cursor-pointer"
              >
                <span>✨ Hero Avatar</span>
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest bg-violet-950/60 px-2.5 py-0.5 rounded-full border border-violet-800/40">
                  {user.characterClass}
                </span>
                {user.equippedTitle && (
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-800/40">
                    «{user.equippedTitle}»
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-white font-['Orbitron'] tracking-wide">
                {user.username}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Level {levelData.level} RPG Character • {user.currentStreak} Day Streak 🔥
              </p>
            </div>
          </div>

          {/* XP Progress Section */}
          <div className="w-full md:w-72 bg-slate-950/60 border border-violet-900/30 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-violet-300 flex items-center gap-1">
                <Zap className="w-4 h-4 text-violet-400 fill-violet-400" />
                LEVEL {levelData.level}
              </span>
              <span className="text-slate-400">
                {levelData.currentLevelXp} / {levelData.nextLevelXp} XP
              </span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-3 border border-violet-900/40 overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-400 h-full transition-all duration-700 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                style={{ width: `${levelData.progressPct}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>{levelData.progressPct}% TO LEVEL {levelData.level + 1}</span>
              <span className="text-amber-400 font-bold">🪙 {user.gold} GOLD</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Character Attributes Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-300 font-['Orbitron'] tracking-wider">
            CHARACTER ATTRIBUTES
          </h2>
          <button
            onClick={() => setActiveTab('character')}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            View Full Character Screen →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-[#12141f] border border-indigo-900/30 flex flex-col items-center text-center">
            <div className="p-2 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 mb-2">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">INTELLECT</span>
            <span className="text-xl font-black text-white font-mono mt-0.5">{stats.intellect}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#12141f] border border-rose-900/30 flex flex-col items-center text-center">
            <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/40 mb-2">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">STRENGTH</span>
            <span className="text-xl font-black text-white font-mono mt-0.5">{stats.strength}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#12141f] border border-amber-900/30 flex flex-col items-center text-center">
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40 mb-2">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">DISCIPLINE</span>
            <span className="text-xl font-black text-white font-mono mt-0.5">{stats.discipline}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#12141f] border border-emerald-900/30 flex flex-col items-center text-center">
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 mb-2">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">WISDOM</span>
            <span className="text-xl font-black text-white font-mono mt-0.5">{stats.wisdom}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#12141f] border border-pink-900/30 flex flex-col items-center text-center col-span-2 sm:col-span-1">
            <div className="p-2 rounded-xl bg-pink-950/60 text-pink-400 border border-pink-800/40 mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">CREATIVITY</span>
            <span className="text-xl font-black text-white font-mono mt-0.5">{stats.creativity}</span>
          </div>
        </div>
      </div>

      {/* 3. Today's Quests Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white font-['Orbitron'] tracking-wider flex items-center gap-2">
              <span>TODAY'S QUESTS</span>
              <span className="text-xs font-mono font-bold bg-violet-900/40 text-violet-300 px-2.5 py-0.5 rounded-full border border-violet-700/40">
                {activeQuestsCount} ACTIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400">Complete real-world tasks to gain XP, Gold & Attribute points.</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['All', 'Daily', 'Main', 'Epic'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  filterType === tab
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Quest List */}
        {filteredQuests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuests.map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-3xl bg-[#10121a] border border-slate-800 p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-400 flex items-center justify-center mx-auto">
              <Plus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Orbitron']">
                YOUR ADVENTURE HAS NO QUESTS IN THIS CATEGORY
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Create your first real-life quest to begin gaining XP, Gold, and attribute progression!
              </p>
            </div>
            <button
              onClick={() => setIsCreateQuestOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE QUEST NOW</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
