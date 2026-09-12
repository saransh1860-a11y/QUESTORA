import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { NameplateBadge } from './NameplateBadge';
import { useGame } from '../../context/GameContext';

interface AvatarCanvasProps {
  user?: Partial<UserProfile> | null;
  equippedOverride?: {
    head?: string;
    body?: string;
    eyes?: string;
    frame?: string;
    background?: string;
    effect?: string;
    title?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDetails?: boolean;
  showNameplate?: boolean;
  testBurstTrigger?: number; // Force trigger XP burst animation for testing/previewing
}

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  user,
  equippedOverride,
  size = 'md',
  showDetails = false,
  showNameplate = true,
  testBurstTrigger
}) => {
  const { lastXpGain } = useGame();
  const [xpBurstActive, setXpBurstActive] = useState<boolean>(false);
  const [xpBurstAmount, setXpBurstAmount] = useState<number>(50);

  // Trigger floating XP Burst animation when XP is earned or test button clicked
  useEffect(() => {
    if (lastXpGain) {
      setXpBurstAmount(lastXpGain.amount || 50);
      setXpBurstActive(true);
      const timer = setTimeout(() => setXpBurstActive(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [lastXpGain?.timestamp]);

  useEffect(() => {
    if (testBurstTrigger) {
      setXpBurstAmount(50);
      setXpBurstActive(true);
      const timer = setTimeout(() => setXpBurstActive(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [testBurstTrigger]);

  // Determine equipped items (user standard vs override try-on in shop)
  const headId = equippedOverride?.head ?? user?.equippedWearables?.head;
  const bodyId = equippedOverride?.body ?? user?.equippedWearables?.body;
  const eyesId = equippedOverride?.eyes ?? user?.equippedWearables?.eyes;
  const frameId = equippedOverride?.frame ?? user?.equippedFrame;
  const bgId = equippedOverride?.background ?? user?.equippedBackground;
  const effectId = equippedOverride?.effect ?? user?.equippedEffect;
  const titleId = equippedOverride?.title ?? user?.equippedTitle;

  const sizeClasses = {
    sm: 'w-16 h-16 text-xs',
    md: 'w-32 h-32 text-sm',
    lg: 'w-48 h-48 text-base',
    xl: 'w-64 h-64 text-lg'
  };

  const currentClass = user?.characterClass || 'Scholar';
  const level = user?.level || 1;

  // Background color scheme lookup
  const getBgStyle = () => {
    switch (bgId) {
      case 'bg-dojo':
        return 'from-violet-950/80 via-slate-950 to-indigo-950/90 border-violet-500/50';
      case 'bg-citadel':
        return 'from-cyan-950/80 via-slate-950 to-blue-950/90 border-cyan-500/50';
      case 'bg-temple':
        return 'from-amber-950/80 via-slate-950 to-purple-950/90 border-amber-500/50';
      case 'bg-neon-grid':
        return 'from-pink-950/80 via-slate-950 to-fuchsia-950/90 border-pink-500/50';
      case 'bg-shadow-dungeon':
        return 'from-[#12080a] via-[#1a0c10] to-[#280c14] border-rose-800/50';
      case 'bg-solar-sanctuary':
        return 'from-[#1f1406] via-[#2a1a08] to-[#3a220a] border-amber-600/50';
      default:
        return 'from-slate-900 via-violet-950/40 to-slate-950 border-violet-500/20';
    }
  };

  // Frame border effect
  const getFrameStyle = () => {
    switch (frameId) {
      case 'frame-neon':
        return 'ring-2 ring-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]';
      case 'frame-galaxy':
        return 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.6)]';
      case 'frame-royal':
        return 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.7)]';
      case 'frame-cyber':
        return 'ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-950 shadow-[0_0_25px_rgba(236,72,153,0.8)] animate-pulse';
      default:
        return 'ring-1 ring-white/10';
    }
  };

  // Atmospheric elemental aura (clean idle aura without permanent "+50 XP" numbers)
  const renderEffectAura = () => {
    if (!effectId) return null;

    switch (effectId) {
      case 'effect-lightning':
        return (
          <>
            <div className="absolute inset-0 pointer-events-none rounded-2xl animate-pulse bg-violet-600/20 mix-blend-screen z-20 overflow-hidden">
              <svg className="w-full h-full opacity-70" viewBox="0 0 100 100">
                <path d="M45 5 L55 35 L48 40 L65 75 L42 50 L48 45 Z" fill="#c084fc" />
                <path d="M15 25 L30 50 L22 55 L38 85" fill="none" stroke="#e9d5ff" strokeWidth="2.5" />
              </svg>
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-violet-500/20 blur-md animate-pulse z-0" />
          </>
        );
      case 'effect-fire':
        return (
          <>
            <div className="absolute inset-0 pointer-events-none rounded-2xl bg-gradient-to-t from-amber-500/30 via-orange-500/15 to-transparent animate-pulse z-20 overflow-hidden" />
            <div className="absolute -inset-1 rounded-2xl bg-amber-500/30 blur-md animate-pulse z-0" />
          </>
        );
      case 'effect-crystal':
        return (
          <>
            <div className="absolute inset-0 pointer-events-none rounded-2xl bg-cyan-500/15 shadow-[inset_0_0_25px_rgba(6,182,212,0.4)] z-20 overflow-hidden flex items-center justify-center">
              <div className="w-24 h-24 border border-cyan-400/40 rounded-full animate-spin [animation-duration:8s]" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-cyan-400/20 blur-md z-0" />
          </>
        );
      case 'effect-energy':
        return (
          <>
            <div className="absolute inset-0 pointer-events-none rounded-2xl ring-4 ring-pink-500/40 animate-pulse z-20 overflow-hidden">
              <div className="absolute inset-0 ring-2 ring-pink-400/30 animate-ping opacity-40" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-pink-500/20 blur-md z-0" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      {/* Container Frame */}
      <div className={`relative rounded-2xl bg-gradient-to-b ${getBgStyle()} ${getFrameStyle()} ${sizeClasses[size]} flex items-center justify-center overflow-hidden transition-all duration-300 backdrop-blur-md`}>
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#a78bfa_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Dynamic Atmospheric Effect Aura */}
        {renderEffectAura()}

        {/* Floating XP Burst Animation (Triggers ONLY when XP is gained or test clicked!) */}
        {xpBurstActive && (
          <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center">
            <div className="animate-bounce animate-pulse bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-['Orbitron'] font-black px-3 py-1 rounded-full text-xs sm:text-sm border-2 border-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.9)] scale-110">
              +{xpBurstAmount} XP!
            </div>
          </div>
        )}

        {user?.customAvatarUrl ? (
          <img
            src={user.customAvatarUrl}
            alt={`${user.username || 'Character'} Avatar`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover relative z-10 transition-transform duration-300 hover:scale-105"
          />
        ) : (
          /* Character Silhouette SVG */
          <svg className="w-full h-full p-2 relative z-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="80" r="32" fill="#334155" stroke="#475569" strokeWidth="2" />
            <circle cx="100" cy="82" r="28" fill="#1e293b" />
            <circle cx="88" cy="80" r="3.5" fill="#e2e8f0" />
            <circle cx="112" cy="80" r="3.5" fill="#e2e8f0" />
            <circle cx="88" cy="80" r="1.5" fill="#818cf8" />
            <circle cx="112" cy="80" r="1.5" fill="#818cf8" />
            <path d="M50 160 C50 120, 70 110, 100 110 C130 110, 150 120, 150 160 Z" fill="#1e293b" stroke="#334155" strokeWidth="3" />
            <path d="M70 70 C70 45, 130 45, 130 70 C125 55, 75 55, 70 70 Z" fill="#475569" />
          </svg>
        )}

        {/* Level Tag Overlay */}
        <div className="absolute bottom-1 right-1 bg-violet-900/90 text-violet-200 border border-violet-500/50 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider z-20">
          LVL {level}
        </div>
      </div>

      {/* Render Nameplate Badge directly below the character frame */}
      {showNameplate && (
        <div className="mt-1">
          <NameplateBadge titleId={titleId || 'title-explorer'} size={size === 'sm' ? 'sm' : 'md'} />
        </div>
      )}

      {showDetails && (
        <div className="text-center">
          <p className="text-xs font-mono tracking-widest text-violet-400 font-bold uppercase">{currentClass}</p>
        </div>
      )}
    </div>
  );
};
