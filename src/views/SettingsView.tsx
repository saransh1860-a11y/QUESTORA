import React from 'react';
import { useGame } from '../context/GameContext';
import { Volume2, VolumeX, LogOut, Shield, Moon, Monitor, Sliders } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, soundEnabled, setSoundEnabled, logout } = useGame();

  if (!user) return null;

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto font-mono">
      <div className="bg-[#10121a] border border-violet-900/30 rounded-3xl p-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-violet-400 tracking-wider uppercase block mb-1">
            PREFERENCES & AUDIO
          </span>
          <h1 className="text-xl font-black text-white font-['Orbitron']">
            SETTINGS & CONFIGURATION
          </h1>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-950/60 border border-violet-800/40 text-violet-300">
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans">Synthesized Web Audio SFX</h3>
              <p className="text-xs text-slate-400 font-sans">Play instant ascending chimes on quest completion and level ups.</p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              soundEnabled
                ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {soundEnabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Account Summary */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-300 font-sans uppercase">Account Information</h3>
          <div className="text-xs text-slate-400 space-y-1">
            <p>Email: <strong className="text-white">{user.email}</strong></p>
            <p>Username: <strong className="text-white">{user.username}</strong></p>
            <p>Class: <strong className="text-violet-300">{user.characterClass}</strong></p>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-bold text-xs hover:bg-rose-900/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>LOG OUT OF QUESTORA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
