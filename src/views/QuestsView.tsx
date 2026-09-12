import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { QuestCard } from '../components/quests/QuestCard';
import { Plus, Search, Filter, CheckCircle2 } from 'lucide-react';
import { QuestCategory, QuestDifficulty, QuestType } from '../types';

export const QuestsView: React.FC = () => {
  const { quests, setIsCreateQuestOpen } = useGame();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const filteredQuests = quests.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || q.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
    const matchesType = typeFilter === 'All' || q.type === typeFilter;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesType;
  });

  const activeCount = quests.filter(q => !q.completed).length;
  const completedCount = quests.filter(q => q.completed).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#10121a] p-4 rounded-2xl border border-violet-900/30">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search active & completed quests..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Academics">Academics</option>
            <option value="Fitness">Fitness</option>
            <option value="Coding">Coding</option>
            <option value="Reading">Reading</option>
            <option value="Discipline">Discipline</option>
            <option value="Creativity">Creativity</option>
            <option value="Personal">Personal</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Epic">Epic</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none"
          >
            <option value="All">All Types</option>
            <option value="Daily">Daily</option>
            <option value="Main">Main</option>
            <option value="Epic">Epic</option>
          </select>

          <button
            onClick={() => setIsCreateQuestOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NEW QUEST</span>
          </button>
        </div>
      </div>

      {/* Quest Stats Summary Bar */}
      <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-400 px-2">
        <span>ACTIVE QUESTS: <strong className="text-violet-400">{activeCount}</strong></span>
        <span>•</span>
        <span>COMPLETED: <strong className="text-emerald-400">{completedCount}</strong></span>
      </div>

      {/* Quest Cards Grid */}
      {filteredQuests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      ) : quests.length === 0 ? (
        <div className="rounded-3xl bg-[#10121a] border border-slate-800 p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-400 flex items-center justify-center mx-auto">
            <Plus className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-['Orbitron']">
              NO QUESTS FOUND
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Your quest log is completely empty. Create your own custom real-life quests to start your adventure!
            </p>
          </div>
          <button
            onClick={() => setIsCreateQuestOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE YOUR FIRST QUEST</span>
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#10121a] border border-slate-800 p-10 text-center space-y-3">
          <p className="text-sm text-slate-400 font-mono">No quests found matching your search or filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
              setDifficultyFilter('All');
              setTypeFilter('All');
            }}
            className="text-xs text-violet-400 font-semibold hover:underline"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
