import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { api } from '../services/api';
import { BarChart2, Zap, Flame, Award, CheckCircle2, Calendar } from 'lucide-react';

export const ProgressView: React.FC = () => {
  const { user } = useGame();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getProgress().then(res => {
      setData(res);
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, []);

  if (!user || isLoading) {
    return (
      <div className="p-10 text-center text-xs font-mono text-slate-400">
        Loading RPG analytics & progress engine...
      </div>
    );
  }

  const history = data?.history || [];
  const stats = data?.stats || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#10121a] border border-violet-900/30 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>TOTAL QUESTS</span>
            <CheckCircle2 className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono">{data.totalCompleted}</span>
          <span className="text-[10px] text-slate-500 font-mono block">Completed lifetime</span>
        </div>

        <div className="p-5 rounded-3xl bg-[#10121a] border border-amber-900/30 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>TOTAL GOLD</span>
            <span>🪙</span>
          </div>
          <span className="text-2xl font-black text-amber-400 font-mono">{user.gold}</span>
          <span className="text-[10px] text-slate-500 font-mono block">Current balance</span>
        </div>

        <div className="p-5 rounded-3xl bg-[#10121a] border border-orange-900/30 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CURRENT STREAK</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <span className="text-2xl font-black text-orange-400 font-mono">{user.currentStreak} Days</span>
          <span className="text-[10px] text-slate-500 font-mono block">Best: {user.longestStreak} Days</span>
        </div>

        <div className="p-5 rounded-3xl bg-[#10121a] border border-indigo-900/30 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>TOTAL XP</span>
            <Zap className="w-4 h-4 text-violet-400 fill-violet-400" />
          </div>
          <span className="text-2xl font-black text-violet-300 font-mono">{user.totalXp} XP</span>
          <span className="text-[10px] text-slate-500 font-mono block">Level {user.level} Hero</span>
        </div>
      </div>

      {/* Attribute Growth Breakdown */}
      <div className="bg-[#10121a] border border-violet-900/30 rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white font-['Orbitron'] tracking-wider">
          ATTRIBUTE PROGRESSION SUMMARY
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-center">
            <span className="text-[10px] text-indigo-300 block">INTELLECT</span>
            <span className="text-lg font-bold text-white mt-1 block">{stats.intellect}</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-center">
            <span className="text-[10px] text-rose-300 block">STRENGTH</span>
            <span className="text-lg font-bold text-white mt-1 block">{stats.strength}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 text-center">
            <span className="text-[10px] text-amber-300 block">DISCIPLINE</span>
            <span className="text-lg font-bold text-white mt-1 block">{stats.discipline}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-center">
            <span className="text-[10px] text-emerald-300 block">WISDOM</span>
            <span className="text-lg font-bold text-white mt-1 block">{stats.wisdom}</span>
          </div>
          <div className="p-3 rounded-2xl bg-pink-950/40 border border-pink-800/40 text-center">
            <span className="text-[10px] text-pink-300 block">CREATIVITY</span>
            <span className="text-lg font-bold text-white mt-1 block">{stats.creativity}</span>
          </div>
        </div>
      </div>

      {/* Quest Completion History Log Table */}
      <div className="bg-[#10121a] border border-violet-900/30 rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white font-['Orbitron'] tracking-wider">
          RECENT QUEST COMPLETION HISTORY
        </h2>

        {history.length > 0 ? (
          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {history.map((h: any) => (
              <div key={h.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-white block font-sans">{h.questTitle}</span>
                  <span className="text-[10px] text-slate-500">{new Date(h.completedAt).toLocaleString()} • {h.category}</span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-violet-300 font-bold">+{h.xpEarned} XP</span>
                  <span className="text-amber-400 font-bold">🪙 +{h.goldEarned}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-mono text-center py-6">No quest completions recorded yet.</p>
        )}
      </div>
    </div>
  );
};
