import React from 'react';
import { useGame } from '../context/GameContext';
import { Award, Lock, CheckCircle2, Star, Shield, Flame, Zap, Target, BookOpen, Activity, ShoppingBag } from 'lucide-react';

export const AchievementsView: React.FC = () => {
  const { achievements } = useGame();

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Flag': return <Award className="w-5 h-5 text-indigo-400" />;
      case 'Flame': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-violet-400" />;
      case 'Star': return <Star className="w-5 h-5 text-amber-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-rose-400" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-indigo-300" />;
      case 'Activity': return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'Target': return <Target className="w-5 h-5 text-amber-300" />;
      case 'CheckCircle': return <CheckCircle2 className="w-5 h-5 text-teal-400" />;
      case 'ShoppingBag': return <ShoppingBag className="w-5 h-5 text-pink-400" />;
      default: return <Award className="w-5 h-5 text-violet-400" />;
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10121a] p-6 rounded-3xl border border-violet-900/30">
        <div>
          <span className="text-xs font-mono font-bold text-violet-400 tracking-wider uppercase block mb-1">
            PERFORMANCE BADGES & MILESTONES
          </span>
          <h1 className="text-2xl font-black text-white font-['Orbitron'] tracking-wide flex items-center gap-2">
            <span>HALL OF ACHIEVEMENTS</span>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/40">
              🏆 {unlockedCount} / {achievements.length} UNLOCKED
            </span>
          </h1>
        </div>

        <div className="text-xs font-mono text-slate-400 max-w-xs">
          Badges cannot be bought. They must be earned through real-world performance.
        </div>
      </div>

      {/* Grid Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map(ach => (
          <div
            key={ach.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              ach.unlocked
                ? 'bg-violet-950/40 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                : 'bg-[#10121a]/60 border-slate-900 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl border ${ach.unlocked ? 'bg-violet-900/60 border-violet-500' : 'bg-slate-900 border-slate-800'}`}>
                  {getIconComponent(ach.icon)}
                </div>

                {ach.unlocked ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> EARNED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> LOCKED
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-white mb-1 font-['Orbitron']">{ach.name}</h3>
              <p className="text-xs text-slate-300 mb-3">{ach.description}</p>
              
              <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 mb-3">
                Requirement: <span className="text-violet-300 font-bold">{ach.requirement}</span>
              </div>
            </div>

            {/* Bonus Rewards */}
            <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-800/60">
              <span className="text-slate-500 text-[10px]">REWARD BONUS</span>
              <div className="flex items-center gap-2">
                <span className="text-violet-300 font-bold">+{ach.xpReward} XP</span>
                <span className="text-amber-400 font-bold">🪙 +{ach.goldReward}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
