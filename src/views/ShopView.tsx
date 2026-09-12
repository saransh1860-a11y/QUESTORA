import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ShopItem, ShopCategory } from '../types';
import { AvatarCanvas } from '../components/character/AvatarCanvas';
import { NameplateBadge } from '../components/character/NameplateBadge';
import { motion } from 'motion/react';
import { ShoppingBag, Lock, CheckCircle2, Sparkles, AlertCircle, Eye, Shield, Crown, User, Zap, Flame, Globe, MapPin, Sun } from 'lucide-react';

export const ShopView: React.FC = () => {
  const { user, shopItems, ownedItems, buyShopItem, equipItem, updateAvatar, updateGender, triggerXpGain } = useGame();
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('characters');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'all' | 'male' | 'female'>(user?.gender || 'all');
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
  const [testBurstTrigger, setTestBurstTrigger] = useState<number>(0);
  const [isBuying, setIsBuying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!user) return null;

  const categories: { id: ShopCategory; label: string }[] = [
    { id: 'characters', label: 'HERO CHARACTERS' },
    { id: 'effects', label: 'XP EFFECTS' },
    { id: 'frames', label: 'AVATAR FRAMES' },
    { id: 'themes', label: 'THEMES' },
    { id: 'nameplates', label: 'NAMEPLATES' },
    { id: 'backgrounds', label: 'BACKGROUNDS' }
  ];

  // Filter shop items based on category and gender filter
  const filteredItems = shopItems.filter(item => {
    if (item.category !== activeCategory) return false;
    if (activeCategory === 'characters' && selectedGenderFilter !== 'all') {
      return item.gender === selectedGenderFilter;
    }
    return true;
  });

  const ownedItemIds = ownedItems.map(i => i.id);

  // Calculate live try-on override for AvatarCanvas
  const getTryOnOverride = () => {
    if (!previewItem) return undefined;

    const override: any = {};
    if (previewItem.category === 'characters' && previewItem.previewUrl) {
      override.customAvatarUrl = previewItem.previewUrl;
    } else if (previewItem.category === 'frames') {
      override.frame = previewItem.id;
    } else if (previewItem.category === 'effects') {
      override.effect = previewItem.id;
    } else if (previewItem.category === 'backgrounds') {
      override.background = previewItem.id;
    } else if (previewItem.category === 'nameplates') {
      override.title = previewItem.id;
    }
    return override;
  };

  const handleBuy = async (item: ShopItem) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsBuying(true);
    try {
      await buyShopItem(item.id);

      // Auto equip logic depending on item category
      if (item.category === 'characters' && item.previewUrl) {
        await updateAvatar({ customAvatarUrl: item.previewUrl });
      } else {
        await equipItem(item.id);
      }

      setSuccessMsg(`Successfully unlocked ${item.name}! Item equipped to profile.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Purchase failed');
    } finally {
      setIsBuying(false);
    }
  };

  const handleGenderChange = async (gender: 'male' | 'female') => {
    setSelectedGenderFilter(gender);
    try {
      await updateGender(gender);
    } catch (err) {
      console.error('Update gender failed:', err);
    }
  };

  // Helper renderer for background thumbnails
  const renderBackgroundThumbnail = (bgId: string) => {
    switch (bgId) {
      case 'bg-dojo':
        return 'bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 border-violet-500/40';
      case 'bg-citadel':
        return 'bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-950 border-cyan-500/40';
      case 'bg-temple':
        return 'bg-gradient-to-br from-amber-950 via-slate-950 to-purple-950 border-amber-500/40';
      case 'bg-neon-grid':
        return 'bg-gradient-to-br from-pink-950 via-slate-950 to-fuchsia-950 border-pink-500/40';
      case 'bg-shadow-dungeon':
        return 'bg-gradient-to-br from-[#12080a] via-[#1a0c10] to-[#280c14] border-rose-800/40';
      case 'bg-solar-sanctuary':
        return 'bg-gradient-to-br from-[#1f1406] via-[#2a1a08] to-[#3a220a] border-amber-600/40';
      default:
        return 'bg-gradient-to-br from-slate-900 via-violet-950/40 to-slate-950 border-violet-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#10121a] p-6 rounded-3xl border border-violet-900/30">
        <div>
          <span className="text-xs font-mono font-bold text-violet-400 tracking-wider uppercase block mb-1">
            ARMORY REWARD MARKETPLACE
          </span>
          <h1 className="text-2xl font-black text-white font-['Orbitron'] tracking-wide flex items-center gap-2">
            <span>REWARD SHOP</span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/40">
              🪙 {user.gold} GOLD
            </span>
          </h1>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setPreviewItem(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gender Filter Controls for Characters Category */}
      {activeCategory === 'characters' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-violet-950/40 border border-violet-900/40 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-violet-300">
            <User className="w-4 h-4 text-violet-400" />
            <span className="font-bold">HERO GENDER FILTER:</span>
            <span className="text-slate-400 text-[11px] hidden md:inline">(Identified as {user.gender === 'female' ? 'Female Hero' : 'Male Hero'})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedGenderFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                selectedGenderFilter === 'all'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              ALL HEROES
            </button>
            <button
              onClick={() => handleGenderChange('male')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                selectedGenderFilter === 'male'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>MALE HEROES ♂</span>
            </button>
            <button
              onClick={() => handleGenderChange('female')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                selectedGenderFilter === 'female'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>FEMALE HEROES ♀</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Layout: Items Grid + Real Time Try-On Preview Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Grid Items */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const isOwned = ownedItemIds.includes(item.id);
            const isLevelLocked = user.level < item.requiredLevel;
            const isBeingTriedOn = previewItem?.id === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isOwned
                    ? 'bg-[#12141f]/70 border-slate-800 opacity-90'
                    : isLevelLocked
                    ? 'bg-slate-950/60 border-slate-900 opacity-60'
                    : 'bg-[#12141f] border-violet-900/30 hover:border-violet-500/50 shadow-md hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                }`}
              >
                <div>
                  {/* Hero Character Preview */}
                  {item.category === 'characters' && item.previewUrl && (
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-violet-900/40 relative">
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.gender && (
                        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-md ${
                          item.gender === 'female' ? 'bg-pink-950/90 text-pink-300 border border-pink-700/60' : 'bg-indigo-950/90 text-indigo-300 border border-indigo-700/60'
                        }`}>
                          {item.gender === 'female' ? '♀ FEMALE HERO' : '♂ MALE HERO'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Nameplate Badge Live Card Demo */}
                  {item.category === 'nameplates' && (
                    <div className="w-full py-6 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-center mb-3 shadow-inner">
                      <NameplateBadge titleId={item.id} size="lg" />
                    </div>
                  )}

                  {/* Background Theme Card Demo */}
                  {item.category === 'backgrounds' && (
                    <div className={`w-full aspect-[16/9] rounded-xl border mb-3 flex flex-col items-center justify-center p-4 relative overflow-hidden ${renderBackgroundThumbnail(item.id)}`}>
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider bg-slate-950/70 px-3 py-1 rounded-full border border-white/20">
                        {item.name}
                      </span>
                    </div>
                  )}

                  {/* XP Effect Aura Card Demo */}
                  {item.category === 'effects' && (
                    <div className="w-full py-5 rounded-xl bg-violet-950/40 border border-violet-800/40 flex items-center justify-center mb-3 text-center space-y-1">
                      <div>
                        <span className="text-xs font-mono font-bold text-amber-300 block">⚡ XP AURA EFFECT</span>
                        <span className="text-[10px] text-violet-300 font-mono">Blinks floating +XP upon completing quests!</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/40">
                      🪙 {item.price} GOLD
                    </span>

                    {isLevelLocked ? (
                      <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> REQ LVL {item.requiredLevel}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        LVL {item.requiredLevel}+
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">{item.description}</p>
                </div>

                {/* Actions: Try On & Buy */}
                <div className="space-y-2 pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className={`w-full py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      isBeingTriedOn
                        ? 'bg-violet-900/60 border-violet-500 text-violet-200'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isBeingTriedOn ? 'PREVIEWING IN LIVE CANVAS' : 'LIVE PREVIEW'}</span>
                  </button>

                  {!isOwned ? (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={isLevelLocked || user.gold < item.price || isBuying}
                      className="w-full py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>UNLOCK ITEM — {item.price} GOLD</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => equipItem(item.id)}
                      className="w-full py-2 rounded-xl text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/50 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>EQUIPPED / READY</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Real Time Character & Nameplates Live Try-On Sidebar */}
        <div className="lg:col-span-5 bg-[#10121a] border border-violet-900/40 rounded-3xl p-6 text-center space-y-4 sticky top-24 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-mono font-bold text-violet-300 tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>LIVE HERO & NAMEPLATE PREVIEW</span>
            </h3>
            {previewItem && (
              <button
                onClick={() => setPreviewItem(null)}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300 underline cursor-pointer"
              >
                Reset Preview
              </button>
            )}
          </div>

          <div className="py-2 flex justify-center">
            {/* User Hero Avatar Canvas with Live Nameplate & XP Aura */}
            <AvatarCanvas
              user={{
                ...user,
                customAvatarUrl: getTryOnOverride()?.customAvatarUrl || user.customAvatarUrl
              }}
              equippedOverride={getTryOnOverride()}
              size="lg"
              showNameplate={true}
              testBurstTrigger={testBurstTrigger}
            />
          </div>

          {/* Test XP Burst Button */}
          <div className="pt-2">
            <button
              onClick={() => setTestBurstTrigger(prev => prev + 1)}
              className="w-full py-2.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/50 text-violet-200 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>⚡ TEST XP BURST ANIMATION (+50 XP)</span>
            </button>
          </div>

          {previewItem ? (
            <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-800/40 space-y-2 text-left font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{previewItem.name}</span>
                <span className="text-xs font-bold text-amber-400">🪙 {previewItem.price} GOLD</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">{previewItem.description}</p>
              
              {!ownedItemIds.includes(previewItem.id) ? (
                <button
                  onClick={() => handleBuy(previewItem)}
                  disabled={user.level < previewItem.requiredLevel || user.gold < previewItem.price || isBuying}
                  className="w-full mt-2 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer font-['Orbitron'] disabled:opacity-40"
                >
                  UNLOCK FOR {previewItem.price} GOLD
                </button>
              ) : (
                <button
                  onClick={() => equipItem(previewItem.id)}
                  className="w-full mt-2 py-2 text-center text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 rounded-xl hover:bg-emerald-900/50 cursor-pointer"
                >
                  EQUIP TO HERO PROFILE
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-violet-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>DYNAMIC PREVIEW CANVAS</span>
              </div>
              <p className="text-xs text-slate-400">
                Click any Hero Character, Nameplate, XP Effect, or Background in the shop to preview it live on your avatar canvas!
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
