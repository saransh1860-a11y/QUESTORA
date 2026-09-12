import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Header } from './components/layout/Header';
import { LandingView } from './views/LandingView';
import { OnboardingView } from './views/OnboardingView';
import { DashboardView } from './views/DashboardView';
import { QuestsView } from './views/QuestsView';
import { CharacterView } from './views/CharacterView';
import { JourneyView } from './views/JourneyView';
import { ShopView } from './views/ShopView';
import { InventoryView } from './views/InventoryView';
import { ProgressView } from './views/ProgressView';
import { AchievementsView } from './views/AchievementsView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';
import { CreateQuestModal } from './components/quests/CreateQuestModal';
import { QuestCompletionModal } from './components/quests/QuestCompletionModal';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, activeTab } = useGame();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono text-violet-300 font-bold tracking-wider">
            INITIALIZING QUESTORA RPG ENGINE...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LandingView />;
  }

  // Active App Background Backdrop Theme
  const getAppBackgroundStyle = () => {
    switch (user.equippedBackground) {
      case 'bg-dojo':
        return 'bg-gradient-to-br from-[#0b0817] via-[#100a26] to-[#180a36]';
      case 'bg-citadel':
        return 'bg-gradient-to-br from-[#060b14] via-[#0d1629] to-[#161f3d]';
      case 'bg-temple':
        return 'bg-gradient-to-br from-[#0a081c] via-[#120e30] to-[#211140]';
      case 'bg-neon-grid':
        return 'bg-gradient-to-br from-[#120716] via-[#1b0726] to-[#260736]';
      case 'bg-shadow-dungeon':
        return 'bg-gradient-to-br from-[#12080a] via-[#1c0a10] to-[#2b0914]';
      case 'bg-solar-sanctuary':
        return 'bg-gradient-to-br from-[#1c1005] via-[#281606] to-[#3b2006]';
      default:
        return 'bg-[#090a0f]';
    }
  };

  // Render active main content view
  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardView />;
      case 'quests':
        return <QuestsView />;
      case 'character':
        return <CharacterView />;
      case 'journey':
        return <JourneyView />;
      case 'rewards':
        return <ShopView />;
      case 'inventory':
        return <InventoryView />;
      case 'progress':
        return <ProgressView />;
      case 'achievements':
        return <AchievementsView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className={`min-h-screen ${getAppBackgroundStyle()} text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-violet-600 selection:text-white transition-colors duration-500 relative`}>
      {/* Background Ambient Glow Overlay */}
      {user.equippedBackground && (
        <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#a78bfa_1px,transparent_1px)] [background-size:24px_24px] z-0" />
      )}

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0 relative z-10">
        <Header />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Modals */}
      <CreateQuestModal />
      <QuestCompletionModal />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <MainAppContent />
    </GameProvider>
  );
}
