import React from 'react';
import { Shield, BookOpen, Cpu, Award, Crown, Zap, Flame, Sparkles } from 'lucide-react';

interface NameplateBadgeProps {
  titleId?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

interface TitleConfig {
  name: string;
  badgeStyle: string;
  textStyle: string;
  icon: React.ElementType;
  iconColor: string;
  subtext?: string;
}

const TITLE_CONFIGS: Record<string, TitleConfig> = {
  'title-explorer': {
    name: 'EXPLORER',
    badgeStyle: 'bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-amber-600/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    textStyle: 'font-mono font-bold tracking-wider text-amber-200 uppercase',
    icon: Shield,
    iconColor: 'text-amber-400',
    subtext: 'Novice Adventurer'
  },
  'title-scholar': {
    name: 'ARCANE SCHOLAR',
    badgeStyle: 'bg-gradient-to-r from-blue-950/90 via-slate-900 to-blue-950/90 border-blue-500/70 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.3)]',
    textStyle: 'font-mono font-bold tracking-widest text-blue-100 uppercase',
    icon: BookOpen,
    iconColor: 'text-blue-400',
    subtext: 'Master of Lore'
  },
  'title-architect': {
    name: 'CYBER ARCHITECT',
    badgeStyle: 'bg-gradient-to-r from-cyan-950/90 via-slate-900 to-cyan-950/90 border-cyan-400/80 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse',
    textStyle: 'font-mono font-black tracking-widest text-cyan-300 uppercase',
    icon: Cpu,
    iconColor: 'text-cyan-300',
    subtext: 'System Builder'
  },
  'title-elite': {
    name: 'ELITE PARAGON',
    badgeStyle: 'bg-gradient-to-r from-violet-950 via-purple-900/60 to-violet-950 border-amber-400/80 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.4)]',
    textStyle: 'font-mono font-extrabold tracking-widest text-amber-300 uppercase',
    icon: Award,
    iconColor: 'text-amber-400',
    subtext: 'Royal Tier'
  },
  'title-legend': {
    name: '✦ GRANDMASTER LEGEND ✦',
    badgeStyle: 'bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 border-2 border-amber-400 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse',
    textStyle: 'font-mono font-black tracking-widest text-yellow-300 uppercase',
    icon: Crown,
    iconColor: 'text-yellow-300 animate-spin [animation-duration:10s]',
    subtext: 'Pinnacle of Mastery'
  },
  'title-cyber': {
    name: '⚡ CYBERPUNK PHANTOM ⚡',
    badgeStyle: 'bg-gradient-to-r from-pink-950 via-fuchsia-900/50 to-pink-950 border-pink-500 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.5)]',
    textStyle: 'font-mono font-black tracking-widest text-pink-300 uppercase',
    icon: Zap,
    iconColor: 'text-pink-400',
    subtext: 'Neon Speedster'
  },
  'title-void': {
    name: '🌌 VOID SHADOW LORD 🌌',
    badgeStyle: 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-indigo-500/80 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.5)]',
    textStyle: 'font-mono font-black tracking-widest text-indigo-200 uppercase',
    icon: Flame,
    iconColor: 'text-indigo-400',
    subtext: 'Shadow Sovereign'
  }
};

export const NameplateBadge: React.FC<NameplateBadgeProps> = ({
  titleId = 'title-explorer',
  size = 'md',
  showSubtext = false
}) => {
  const config = TITLE_CONFIGS[titleId] || TITLE_CONFIGS['title-explorer'];
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1 rounded-md border',
    md: 'px-3 py-1 text-xs gap-1.5 rounded-lg border',
    lg: 'px-4 py-1.5 text-sm gap-2 rounded-xl border-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <div className="inline-flex flex-col items-center">
      <div className={`inline-flex items-center justify-center font-mono transition-all ${config.badgeStyle} ${sizeClasses[size]}`}>
        <IconComponent className={`${iconSizes[size]} ${config.iconColor} shrink-0`} />
        <span className={`${config.textStyle}`}>{config.name}</span>
      </div>

      {showSubtext && config.subtext && (
        <span className="text-[9px] font-mono text-slate-500 tracking-wider mt-0.5 uppercase">
          {config.subtext}
        </span>
      )}
    </div>
  );
};
