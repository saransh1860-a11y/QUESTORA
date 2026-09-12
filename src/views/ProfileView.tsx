import React from 'react';
import { useGame } from '../context/GameContext';
import { AvatarCanvas } from '../components/character/AvatarCanvas';
import { NameplateBadge } from '../components/character/NameplateBadge';
import { calculateLevelData } from '../utils/level';
import { UserCheck, Flame, Award, Zap, Calendar, Mail } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, achievements, quests } = useGame();

  if (!user) return null;

  const levelData = calculateLevelData(user.totalXp);
  const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length;
  const completedQuestsCount = quests.filter(q => q.completed).length;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="bg-[#10121a] border border-violet-900/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(139,92,246,0.15)] relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-800">
          <AvatarCanvas user={user} size="lg" showDetails={true} />

          <div className="space-y-2 text-center sm:text-left">
            {user.equippedTitle && (
              <div className="flex justify-center sm:justify-start">
                <NameplateBadge titleId={user.equippedTitle} size="md" />
              </div>
            )}
            <h1 className="text-3xl font-black text-white font-['Orbitron'] tracking-wider">
              {user.username}
            </h1>
            <p className="text-xs text-slate-400 font-mono flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-3.5 h-3.5 text-violet-400" />
              <span>{user.email}</span>
            </p>
            <p className="text-xs font-mono text-violet-300">
              Joined Questora: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Lifetime RPG Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 font-mono">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block">HERO LEVEL</span>
            <span className="text-2xl font-black text-violet-300 mt-1 block font-['Orbitron']">LVL {levelData.level}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block">CURRENT STREAK</span>
            <span className="text-2xl font-black text-orange-400 mt-1 block flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 fill-orange-400" /> {user.currentStreak}d
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block">QUESTS DONE</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block font-['Orbitron']">{completedQuestsCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block">BADGES EARNED</span>
            <span className="text-2xl font-black text-amber-300 mt-1 block font-['Orbitron']">{unlockedAchievementsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
