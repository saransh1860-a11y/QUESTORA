import React, { useState } from 'react';
import { Quest } from '../../types';
import { useGame } from '../../context/GameContext';
import { CheckCircle2, Trash2, Zap, Shield, BookOpen, Activity, Target, Sparkles, Clock } from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest }) => {
  const { completeQuest, deleteQuest } = useGame();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (quest.completed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completeQuest(quest.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyBadge = () => {
    switch (quest.difficulty) {
      case 'Easy':
        return 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400';
      case 'Medium':
        return 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400';
      case 'Hard':
        return 'bg-violet-950/60 border-violet-500/40 text-violet-300';
      case 'Epic':
        return 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  const getAttributeIcon = () => {
    switch (quest.attributeReward?.attribute) {
      case 'intellect':
        return <BookOpen className="w-3.5 h-3.5 text-indigo-400" />;
      case 'strength':
        return <Activity className="w-3.5 h-3.5 text-rose-400" />;
      case 'discipline':
        return <Target className="w-3.5 h-3.5 text-amber-400" />;
      case 'wisdom':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'creativity':
        return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-violet-400" />;
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 p-5 ${
        quest.completed
          ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
          : 'bg-[#12141f]/90 hover:bg-[#161927] border-violet-900/30 hover:border-violet-500/50 shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getDifficultyBadge()}`}>
            {quest.difficulty.toUpperCase()}
          </span>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
            {quest.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{quest.frequency}</span>
        </div>
      </div>

      {/* Title & Description */}
      <h3 className={`text-base font-bold mb-1.5 ${quest.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
        {quest.title}
      </h3>
      {quest.description && (
        <p className="text-xs text-slate-400 mb-4 line-clamp-2">{quest.description}</p>
      )}

      {/* Rewards Bar & Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 mt-3">
        {/* Rewards */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1 bg-violet-950/60 text-violet-300 border border-violet-800/40 px-2 py-1 rounded-lg">
            <Zap className="w-3.5 h-3.5 fill-violet-400 text-violet-400" />
            <span className="font-bold">+{quest.xpReward} XP</span>
          </div>

          <div className="flex items-center gap-1 bg-amber-950/60 text-amber-300 border border-amber-800/40 px-2 py-1 rounded-lg">
            <span>🪙</span>
            <span className="font-bold">+{quest.goldReward}</span>
          </div>

          {quest.attributeReward && (
            <div className="flex items-center gap-1 bg-slate-900 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg">
              {getAttributeIcon()}
              <span className="font-semibold capitalize">+{quest.attributeReward.amount} {quest.attributeReward.attribute}</span>
            </div>
          )}
        </div>

        {/* Complete / Delete Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => deleteQuest(quest.id)}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Delete Quest"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {!quest.completed ? (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>COMPLETE QUEST</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-bold">
              <CheckCircle2 className="w-4 h-4" />
              COMPLETED
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
