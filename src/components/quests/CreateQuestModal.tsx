import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { QuestCategory, QuestDifficulty, QuestType, QuestFrequency, AttributeType } from '../../types';
import { X, Plus, Zap } from 'lucide-react';

export const CreateQuestModal: React.FC = () => {
  const { isCreateQuestOpen, setIsCreateQuestOpen, createQuest } = useGame();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('Discipline');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('Medium');
  const [type, setType] = useState<QuestType>('Daily');
  const [frequency, setFrequency] = useState<QuestFrequency>('Daily');
  const [attributeTarget, setAttributeTarget] = useState<AttributeType>('discipline');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isCreateQuestOpen) return null;

  const difficultyRewards: Record<QuestDifficulty, { xp: number; gold: number; stat: number }> = {
    Easy: { xp: 50, gold: 15, stat: 1 },
    Medium: { xp: 80, gold: 25, stat: 2 },
    Hard: { xp: 120, gold: 40, stat: 3 },
    Epic: { xp: 250, gold: 100, stat: 5 }
  };

  const previewRewards = difficultyRewards[difficulty];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a quest title.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createQuest({
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        type,
        frequency,
        attributeTarget
      });
      setIsCreateQuestOpen(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#10121a] border border-violet-900/40 rounded-3xl w-full max-w-lg p-6 relative shadow-[0_0_40px_rgba(139,92,246,0.2)]">
        
        {/* Close Button */}
        <button
          onClick={() => setIsCreateQuestOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-violet-900/40 border border-violet-500/40 flex items-center justify-center text-violet-300">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-['Orbitron']">CREATE NEW QUEST</h2>
            <p className="text-xs text-slate-400">Define a real-life action to convert into XP & Gold.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1">QUEST NAME *</label>
            <input
              type="text"
              placeholder="e.g., Read 30 Pages of Technical Book"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1">DESCRIPTION (OPTIONAL)</label>
            <textarea
              rows={2}
              placeholder="e.g., Take structured notes on key formulas..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          {/* Grid Category & Attribute */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1">CATEGORY</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as QuestCategory)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="Academics">Academics</option>
                <option value="Fitness">Fitness</option>
                <option value="Coding">Coding</option>
                <option value="Reading">Reading</option>
                <option value="Discipline">Discipline</option>
                <option value="Creativity">Creativity</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1">ATTRIBUTE GAIN</label>
              <select
                value={attributeTarget}
                onChange={e => setAttributeTarget(e.target.value as AttributeType)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white outline-none capitalize"
              >
                <option value="intellect">Intellect</option>
                <option value="strength">Strength</option>
                <option value="discipline">Discipline</option>
                <option value="wisdom">Wisdom</option>
                <option value="creativity">Creativity</option>
              </select>
            </div>
          </div>

          {/* Grid Difficulty & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1">DIFFICULTY</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as QuestDifficulty)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="Easy">Easy (+50 XP / 15 Gold)</option>
                <option value="Medium">Medium (+80 XP / 25 Gold)</option>
                <option value="Hard">Hard (+120 XP / 40 Gold)</option>
                <option value="Epic">Epic (+250 XP / 100 Gold)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1">FREQUENCY</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as QuestFrequency)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="Daily">Daily Quest</option>
                <option value="Weekly">Weekly Quest</option>
                <option value="Once">One-time Quest</option>
              </select>
            </div>
          </div>

          {/* Reward Calculation Preview Card */}
          <div className="p-3.5 rounded-2xl bg-violet-950/40 border border-violet-800/40 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold">REWARD PREVIEW</span>
            <div className="flex items-center gap-3">
              <span className="text-violet-300 font-bold">+{previewRewards.xp} XP</span>
              <span className="text-amber-400 font-bold">🪙 +{previewRewards.gold}</span>
              <span className="text-indigo-300 font-bold capitalize">+{previewRewards.stat} {attributeTarget}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateQuestOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>DISPATCH QUEST</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
