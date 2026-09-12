import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CharacterClass } from '../types';
import { Shield, BookOpen, Cpu, Sparkles, Target, Check, ArrowRight } from 'lucide-react';

export const OnboardingView: React.FC = () => {
  const { user, onboardingSetup, setActiveTab } = useGame();

  const [selectedClass, setSelectedClass] = useState<CharacterClass>(user?.characterClass || 'Scholar');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Academics', 'Coding']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const classes: { id: CharacterClass; name: string; desc: string; icon: React.ReactNode; stats: string }[] = [
    { id: 'Scholar', name: 'Scholar', desc: 'Masters academics, deep reading, and research.', icon: <BookOpen className="w-6 h-6 text-indigo-400" />, stats: '+Intellect & +Wisdom' },
    { id: 'Warrior', name: 'Warrior', desc: 'Pushes physical fitness, energy, and strength.', icon: <Shield className="w-6 h-6 text-rose-400" />, stats: '+Strength & +Discipline' },
    { id: 'Engineer', name: 'Engineer', desc: 'Builds systems, writes code, and solves logic.', icon: <Cpu className="w-6 h-6 text-cyan-400" />, stats: '+Intellect & +Discipline' },
    { id: 'Creator', name: 'Creator', desc: 'Crafts art, design, music, and writing.', icon: <Sparkles className="w-6 h-6 text-pink-400" />, stats: '+Creativity & +Wisdom' },
    { id: 'Balanced', name: 'Balanced', desc: 'Well-rounded distribution across all attributes.', icon: <Target className="w-6 h-6 text-amber-400" />, stats: '+1 to All Attributes' }
  ];

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
      await onboardingSetup(selectedClass, selectedGoals);
      setActiveTab('home');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 p-6 flex items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-3xl w-full bg-[#10121a]/95 border border-violet-900/40 rounded-3xl p-8 shadow-[0_0_60px_rgba(139,92,246,0.2)] relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-bold text-violet-400 tracking-widest uppercase block mb-1">
            CHARACTER CREATION
          </span>
          <h1 className="text-3xl font-extrabold text-white font-['Orbitron'] tracking-wider">
            SELECT YOUR ARCHETYPE
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Choose your starting class to calibrate your attribute bonuses and initial quest recommendations.
          </p>
        </div>

        {/* Class Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
          {classes.map(c => {
            const isSelected = selectedClass === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c.id)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                  isSelected
                    ? 'bg-violet-950/60 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] scale-105'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="p-2.5 rounded-xl bg-slate-900 w-fit mb-3 border border-slate-800">
                    {c.icon}
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1 font-['Orbitron']">{c.name}</h3>
                  <p className="text-[11px] text-slate-400 leading-tight mb-3">{c.desc}</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-900/40 px-2 py-0.5 rounded border border-violet-800/40">
                  {c.stats}
                </span>
              </button>
            );
          })}
        </div>

        {/* Improve Goals Section */}
        <div className="mb-8 pt-6 border-t border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 font-mono mb-1">
            WHAT DO YOU WANT TO IMPROVE IN REAL LIFE?
          </h3>
          <p className="text-xs text-slate-400 mb-4">Select all areas you want to prioritize in your quest log.</p>

          <div className="flex flex-wrap gap-2">
            {goalsList.map(goal => {
              const active = selectedGoals.includes(goal);
              return (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
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
        <div className="text-center">
          <button
            onClick={handleFinish}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold px-10 py-4 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all active:scale-95 cursor-pointer font-['Orbitron'] text-xs tracking-wider"
          >
            <span>YOUR JOURNEY BEGINS — ENTER QUESTORA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
