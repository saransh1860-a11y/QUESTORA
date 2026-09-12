import React from 'react';
import { useGame, NavigationTab } from '../../context/GameContext';
import {
  Home,
  CheckSquare,
  User,
  Map,
  ShoppingBag,
  Package,
  BarChart2,
  Award,
  UserCheck,
  Settings,
  Flame,
  Volume2,
  VolumeX,
  LogOut,
  Zap
} from 'lucide-react';
import { calculateLevelData } from '../../utils/level';

export const Sidebar: React.FC = () => {
  const { user, activeTab, setActiveTab, soundEnabled, setSoundEnabled, logout } = useGame();

  if (!user) return null;

  const levelData = calculateLevelData(user.totalXp);

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'quests', label: 'Quests', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'character', label: 'Character', icon: <User className="w-4 h-4" /> },
    { id: 'journey', label: 'Journey', icon: <Map className="w-4 h-4" /> },
    { id: 'rewards', label: 'Rewards Shop', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0d0f17] border-r border-violet-900/20 text-slate-300 min-h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-violet-900/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-wider text-lg text-white font-['Orbitron']">QUESTORA</h1>
            <p className="text-[10px] text-violet-400 font-medium tracking-tight">Level Up Your Real Life</p>
          </div>
        </div>
      </div>

      {/* User Quick RPG Status Badge */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-violet-950/40 border border-violet-800/30">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-violet-300 font-mono">LVL {levelData.level}</span>
            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[90px]">{user.username}</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
            🪙 {user.gold}
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2 border border-violet-900/40 overflow-hidden relative">
          <div
            className="bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-400 h-full transition-all duration-500 rounded-full"
            style={{ width: `${levelData.progressPct}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
          <span>{levelData.currentLevelXp} XP</span>
          <span>{levelData.nextLevelXp} XP</span>
        </div>
      </div>

      {/* Streak Counter Banner */}
      <div className="px-5 mb-2">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-orange-950/30 border border-orange-500/30 text-orange-400 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
            <span>Streak</span>
          </div>
          <span className="font-mono font-bold text-orange-300">{user.currentStreak} Days</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-white border border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-violet-400' : 'text-slate-400'}>{item.icon}</span>
              <span className="font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Controls: Sound Toggle & Logout */}
      <div className="p-3 border-t border-violet-900/20 space-y-2">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-violet-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>SFX Audio</span>
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${soundEnabled ? 'bg-violet-900/40 text-violet-300' : 'bg-slate-800 text-slate-500'}`}>
            {soundEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
