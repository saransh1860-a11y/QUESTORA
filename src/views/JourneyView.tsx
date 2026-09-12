import React from 'react';
import { useGame } from '../context/GameContext';
import { calculateLevelData } from '../utils/level';
import { Lock, CheckCircle2, Star, Trophy, Award, Crown } from 'lucide-react';

interface JourneyNode {
  level: number;
  title: string;
  unlockNote: string;
  icon: React.ReactNode;
}

export const JourneyView: React.FC = () => {
  const { user } = useGame();

  if (!user) return null;

  const currentLevel = calculateLevelData(user.totalXp).level;

  const milestones: JourneyNode[] = [
    { level: 1, title: 'Novice Adventurer', unlockNote: 'Basic Wearables & Explorer Title Unlocked', icon: <Star className="w-5 h-5 text-indigo-400" /> },
    { level: 3, title: 'Apprentice Specialist', unlockNote: 'Cyber Visor & Lightning XP Effect Unlocked', icon: <Award className="w-5 h-5 text-violet-400" /> },
    { level: 5, title: 'Seasoned Challenger', unlockNote: 'Tactical Warrior Jacket & Citadel Spire Unlocked', icon: <Trophy className="w-5 h-5 text-cyan-400" /> },
    { level: 8, title: 'Royal Paragon', unlockNote: 'Royal Gold Frame & Elite Title Unlocked', icon: <Award className="w-5 h-5 text-amber-400" /> },
    { level: 10, title: 'Master Conqueror', unlockNote: 'Aura Crown & Celestial Temple Unlocked', icon: <Crown className="w-5 h-5 text-amber-300" /> },
    { level: 15, title: 'Grandmaster Legend', unlockNote: 'Grandmaster Title & Legendary Cosmetics Unlocked', icon: <Crown className="w-5 h-5 text-pink-400" /> },
    { level: 20, title: 'Eternal Myth', unlockNote: 'Ultimate Realm Prestige & Celestial Aura', icon: <Star className="w-5 h-5 text-yellow-300" /> }
  ];

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <span className="text-xs font-mono font-bold text-violet-400 tracking-widest uppercase">
          RPG PROGRESSION ROADMAP
        </span>
        <h1 className="text-2xl font-black text-white font-['Orbitron'] tracking-wider">
          JOURNEY TO MASTERY
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Every quest you complete brings you closer to higher level milestones and exclusive RPG cosmetic unlocks.
        </p>
      </div>

      {/* Level Milestone Path */}
      <div className="relative py-6">
        {/* Vertical Connecting Line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-violet-600 via-indigo-500 to-slate-800" />

        <div className="space-y-8 relative z-10">
          {milestones.map((m, index) => {
            const isCompleted = currentLevel > m.level;
            const isCurrent = currentLevel === m.level;
            const isLocked = currentLevel < m.level;

            const isEven = index % 2 === 0;

            return (
              <div
                key={m.level}
                className={`flex items-center gap-4 ${
                  isEven ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* Content Box */}
                <div className={`w-1/2 ${isEven ? 'text-right pr-6' : 'text-left pl-6'}`}>
                  <div
                    className={`inline-block p-5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-violet-950/80 border-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.4)] scale-105'
                        : isCompleted
                        ? 'bg-[#10121a] border-slate-800 opacity-80'
                        : 'bg-slate-950/60 border-slate-900 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 justify-end">
                      {isCurrent && (
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/40 animate-pulse">
                          ⭐ YOU ARE HERE
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-violet-300">
                        LEVEL {m.level}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white font-['Orbitron'] mb-1">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{m.unlockNote}</p>
                  </div>
                </div>

                {/* Center Node Icon Badge */}
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-bold z-20 transition-all ${
                    isCurrent
                      ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-125'
                      : isCompleted
                      ? 'bg-violet-600 border-violet-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : isCurrent ? (
                    <Star className="w-6 h-6 fill-slate-950" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                {/* Spacer for 50/50 Grid */}
                <div className="w-1/2" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
