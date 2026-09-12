import React, { useState } from 'react';
import { useGame, NavigationTab } from '../../context/GameContext';
import { Home, CheckSquare, User, ShoppingBag, MoreHorizontal, Map, Package, BarChart2, Award, UserCheck, Settings, LogOut } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { user, activeTab, setActiveTab, logout } = useGame();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  if (!user) return null;

  const mainNav: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'quests', label: 'Quests', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'character', label: 'Character', icon: <User className="w-5 h-5" /> },
    { id: 'rewards', label: 'Rewards', icon: <ShoppingBag className="w-5 h-5" /> }
  ];

  const secondaryNav: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'journey', label: 'Journey', icon: <Map className="w-5 h-5" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" /> },
    { id: 'progress', label: 'Progress', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  const handleTabSelect = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMoreOpen && (
        <div
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* More Options Bottom Drawer */}
      <div
        className={`fixed bottom-16 left-0 right-0 bg-[#0d0f17] border-t border-violet-900/40 rounded-t-3xl p-5 z-40 transition-transform duration-300 lg:hidden ${
          isMoreOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
      >
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
        <h3 className="text-sm font-bold text-slate-300 mb-3 px-1 font-['Orbitron']">MORE MENU</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {secondaryNav.map(item => (
            <button
              key={item.id}
              onClick={() => handleTabSelect(item.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-violet-900/40 text-violet-200 border-violet-500/50'
                  : 'bg-slate-900/50 text-slate-300 border-slate-800'
              }`}
            >
              <span className="text-violet-400">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#090a0f]/95 backdrop-blur-md border-t border-violet-900/30 flex items-center justify-around px-2 z-50 lg:hidden">
        {mainNav.map(item => {
          const isActive = activeTab === item.id && !isMoreOpen;
          return (
            <button
              key={item.id}
              onClick={() => handleTabSelect(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
                isActive ? 'text-violet-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* More Tab Button */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
            isMoreOpen || secondaryNav.some(n => n.id === activeTab)
              ? 'text-violet-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">More</span>
        </button>
      </nav>
    </>
  );
};
