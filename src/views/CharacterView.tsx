import React from 'react';
import { useGame } from '../context/GameContext';
import { AvatarCanvas } from '../components/character/AvatarCanvas';
import { calculateLevelData } from '../utils/level';
import { BookOpen, Activity, Target, Shield, Sparkles, Award, Zap, Package, Camera } from 'lucide-react';

export const CharacterView: React.FC = () => {
  const { user, stats, achievements, setActiveTab, setIsAvatarModalOpen } = useGame();

  if (!user || !stats) return null;

  const levelData = calculateLevelData(user.totalXp);
  const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-8 pb-12">
      {/* RPG Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Avatar & Quick Details Box */}
        <div className="lg:col-span-5 bg-[#10121a] border border-violet-900/30 rounded-3xl p-6 text-center space-y-4 shadow-[0_0_30px_rgba(139,92,246,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-600 via-indigo-500 to-amber-400" />

          {/* Large RPG Character Canvas */}
          <div className="py-4 flex flex-col items-center">
            <AvatarCanvas user={user} size="xl" showDetails={true} />
            
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-violet-950/80 hover:bg-violet-900 border border-violet-500/50 text-violet-200 text-xs font-mono font-bold transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>CHOOSE FULL-BODY HERO AVATAR</span>
            </button>
          </div>

          <div>
            {user.equippedTitle && (
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-800/40 inline-block mb-1">
                «{user.equippedTitle}»
              </span>
            )}
            <h1 className="text-2xl font-black text-white font-['Orbitron'] tracking-wider">
              {user.username}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              LEVEL {levelData.level} • {user.characterClass.toUpperCase()} ARCHETYPE
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">TOTAL XP</span>
              <span className="font-bold text-violet-300">{user.totalXp}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">GOLD</span>
              <span className="font-bold text-amber-400">🪙 {user.gold}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">STREAK</span>
              <span className="font-bold text-orange-400">🔥 {user.currentStreak}d</span>
            </div>
          </div>
        </div>

        {/* Right Attributes & Gear Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Attributes Breakdown Card */}
          <div className="bg-[#10121a] border border-violet-900/30 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white font-['Orbitron'] tracking-wider flex items-center justify-between">
              <span>CHARACTER ATTRIBUTES</span>
              <span className="text-xs font-mono text-slate-400">TOTAL LEVEL POWER</span>
            </h2>

            <div className="space-y-3 font-mono">
              {/* Intellect */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> INTELLECT
                  </span>
                  <span className="text-white font-bold">{stats.intellect} PTS</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.intellect * 3)}%` }} />
                </div>
              </div>

              {/* Strength */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> STRENGTH
                  </span>
                  <span className="text-white font-bold">{stats.strength} PTS</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.strength * 3)}%` }} />
                </div>
              </div>

              {/* Discipline */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Target className="w-4 h-4" /> DISCIPLINE
                  </span>
                  <span className="text-white font-bold">{stats.discipline} PTS</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.discipline * 3)}%` }} />
                </div>
              </div>

              {/* Wisdom */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> WISDOM
                  </span>
                  <span className="text-white font-bold">{stats.wisdom} PTS</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.wisdom * 3)}%` }} />
                </div>
              </div>

              {/* Creativity */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-pink-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> CREATIVITY
                  </span>
                  <span className="text-white font-bold">{stats.creativity} PTS</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                  <div className="bg-pink-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.creativity * 3)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Equipped Cosmetics Summary */}
          <div className="bg-[#10121a] border border-violet-900/30 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white font-['Orbitron'] tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-400" />
                <span>EQUIPPED LOADOUT</span>
              </h2>
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                Manage Armory →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">THEME</span>
                <span className="font-bold text-violet-300 truncate block">{user.equippedTheme}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">FRAME</span>
                <span className="font-bold text-cyan-300 truncate block">{user.equippedFrame || 'Standard'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">AURA EFFECT</span>
                <span className="font-bold text-pink-300 truncate block">{user.equippedEffect || 'None'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">TITLE</span>
                <span className="font-bold text-amber-300 truncate block">{user.equippedTitle || 'Explorer'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
