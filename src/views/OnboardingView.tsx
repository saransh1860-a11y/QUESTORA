import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Shield, Sparkles, Check, ArrowRight, Lock, ShoppingBag } from 'lucide-react';

export const OnboardingView: React.FC = () => {
  const { onboardingSetup, setActiveTab } = useGame();

  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Academics', 'Coding', 'Fitness']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const starterCharacter = {
    name: 'Cybernetic Knight',
    title: 'Starter Hero Archetype',
    classTag: 'Warrior / Balanced Defender',
    image: '/avatars/rpg_warrior_avatar_1789192164641.jpg',
    description: 'Forged in high-tech obsidian alloy plate with a luminous violet energy blade. Assigned as your starter hero.',
    stats: '+1 to All Attributes',
    level: 1
  };

  const goalsList = [
    'Academics',
    'Fitness',
    'Coding',
    'Reading',
    'Discipline',
    'Creativity',
    'Personal Goals'
  ];

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await onboardingSetup('Warrior', selectedGoals);
      setActiveTab('home');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 p-6 flex items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-3xl w-full bg-[#10121a]/95 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(139,92,246,0.2)] relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-xs font-mono font-bold text-violet-400 tracking-widest uppercase block mb-1">
            INITIAL HERO COMMISSION
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Orbitron'] tracking-wider">
            YOUR STARTER CHARACTER
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            You begin your adventure with the Cybernetic Knight. Unlock more hero characters in the Rewards Shop as you level up and earn Gold!
          </p>
        </div>

        {/* Assigned Single Starter Character Card */}
        <div className="bg-[#141724] border border-violet-500/40 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-5 shadow-[0_0_25px_rgba(139,92,246,0.15)]">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-violet-500 shrink-0 shadow-lg">
            <img
              src={starterCharacter.image}
              alt={starterCharacter.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 right-1 bg-violet-900/90 text-violet-200 border border-violet-500/50 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
              LVL 1
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> DEFAULT STARTER HERO
              </span>
              <span className="text-xs font-mono font-bold text-violet-300 bg-violet-950/60 border border-violet-800/40 px-2 py-0.5 rounded-full">
                {starterCharacter.classTag}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white font-['Orbitron']">
              {starterCharacter.name}
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              {starterCharacter.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-mono">
              <span className="bg-slate-900/90 text-amber-300 border border-amber-800/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                {starterCharacter.stats}
              </span>
              <span className="bg-slate-900/90 text-violet-300 border border-violet-800/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-violet-400" />
                Rest purchased in Rewards Shop
              </span>
            </div>
          </div>
        </div>

        {/* Informative Note about Shop */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="p-2 rounded-lg bg-violet-950/60 border border-violet-800/40 text-violet-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-200 block font-mono text-[11px]">LOOKING FOR OTHER ARCHETYPES?</span>
            <span>Sorcerers, Shadow Assassins, Valkyries, and specialized avatars unlock in the <strong className="text-violet-300">Rewards Section</strong> using gold earned from completed quests.</span>
          </div>
        </div>

        {/* Improve Goals Section */}
        <div className="mb-6 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 font-mono mb-1">
            WHAT DO YOU WANT TO IMPROVE IN REAL LIFE?
          </h3>
          <p className="text-xs text-slate-400 mb-3">Select all focus areas you want to prioritize in your quest log.</p>

          <div className="flex flex-wrap gap-2">
            {goalsList.map(goal => {
              const active = selectedGoals.includes(goal);
              return (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 text-white" />}
                  <span>{goal}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <button
            onClick={handleFinish}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold px-10 py-4 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all active:scale-95 cursor-pointer font-['Orbitron'] text-xs tracking-wider"
          >
            <span>ENTER QUESTORA WITH YOUR HERO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
