import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { CheckCircle2, Zap, Award, ArrowUp, X } from 'lucide-react';

export const QuestCompletionModal: React.FC = () => {
  const { completionResultModal, setCompletionResultModal } = useGame();
  const [displayedXp, setDisplayedXp] = useState(0);
  const [displayedGold, setDisplayedGold] = useState(0);

  useEffect(() => {
    if (!completionResultModal) {
      setDisplayedXp(0);
      setDisplayedGold(0);
      return;
    }

    // Number roll up animation effect
    const xpTarget = completionResultModal.xpEarned;
    const goldTarget = completionResultModal.goldEarned;

    let xpCurrent = 0;
    let goldCurrent = 0;

    const interval = setInterval(() => {
      let done = true;
      if (xpCurrent < xpTarget) {
        xpCurrent += Math.ceil(xpTarget / 15);
        if (xpCurrent > xpTarget) xpCurrent = xpTarget;
        setDisplayedXp(xpCurrent);
        done = false;
      }
      if (goldCurrent < goldTarget) {
        goldCurrent += Math.ceil(goldTarget / 15);
        if (goldCurrent > goldTarget) goldCurrent = goldTarget;
        setDisplayedGold(goldCurrent);
        done = false;
      }
      if (done) clearInterval(interval);
    }, 30);

    return () => clearInterval(interval);
  }, [completionResultModal]);

  if (!completionResultModal) return null;

  const { quest, attributeReward, didLevelUp, newLevel, unlockedAchievements } = completionResultModal;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative bg-gradient-to-b from-[#181528] to-[#0c0a14] border-2 border-violet-500/50 rounded-3xl w-full max-w-md p-6 text-center shadow-[0_0_60px_rgba(139,92,246,0.3)] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={() => setCompletionResultModal(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Glow Header Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-amber-400 p-1 mx-auto mb-4 shadow-[0_0_30px_rgba(139,92,246,0.6)] animate-bounce">
          <div className="w-full h-full rounded-full bg-[#121020] flex items-center justify-center text-amber-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-white to-amber-200 font-['Orbitron'] tracking-wider mb-1">
          QUEST COMPLETE!
        </h2>
        <p className="text-xs text-slate-400 font-medium line-clamp-1 mb-6">{quest.title}</p>

        {/* Level Up Banner if Level Up triggered */}
        {didLevelUp && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-violet-600/30 to-amber-500/20 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-pulse">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-extrabold text-lg font-['Orbitron']">
              <ArrowUp className="w-6 h-6 animate-bounce" />
              <span>LEVEL UP! LEVEL {newLevel}</span>
            </div>
            <p className="text-[11px] text-amber-200/90 mt-1">Your real-life progression has evolved your character stats!</p>
          </div>
        )}

        {/* Achievement Unlock Notice */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-4 space-y-2">
            {unlockedAchievements.map(ach => (
              <div key={ach.id} className="p-3 rounded-xl bg-violet-950/60 border border-violet-500/50 flex items-center gap-3 text-left">
                <div className="p-2 rounded-lg bg-violet-900/80 text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-violet-300 font-mono font-bold block">ACHIEVEMENT UNLOCKED</span>
                  <span className="text-xs font-bold text-white">{ach.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rewards Breakdown Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6 font-mono">
          <div className="p-3 rounded-2xl bg-violet-950/40 border border-violet-800/40">
            <Zap className="w-4 h-4 text-violet-400 mx-auto mb-1 fill-violet-400" />
            <span className="text-sm font-bold text-violet-300 block">+{displayedXp}</span>
            <span className="text-[10px] text-slate-400 font-sans">XP</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40">
            <span className="text-base block mb-0.5">🪙</span>
            <span className="text-sm font-bold text-amber-300 block">+{displayedGold}</span>
            <span className="text-[10px] text-slate-400 font-sans">GOLD</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-base block mb-0.5">📈</span>
            <span className="text-sm font-bold text-emerald-400 block">+{attributeReward.amount}</span>
            <span className="text-[10px] text-slate-400 font-sans capitalize truncate block">{attributeReward.attribute}</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setCompletionResultModal(null)}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all active:scale-95 cursor-pointer font-['Orbitron'] text-xs tracking-wider"
        >
          CLAIM REWARDS
        </button>
      </div>
    </div>
  );
};
