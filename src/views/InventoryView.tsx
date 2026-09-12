import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ShopItem, ShopCategory } from '../types';
import { AvatarCanvas } from '../components/character/AvatarCanvas';
import { NameplateBadge } from '../components/character/NameplateBadge';
import { Package, CheckCircle2, Shield, Eye, Sparkles } from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { user, ownedItems, equipItem } = useGame();
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('characters');

  if (!user) return null;

  const categories: { id: ShopCategory; label: string }[] = [
    { id: 'characters', label: 'HEROES' },
    { id: 'nameplates', label: 'NAMEPLATES' },
    { id: 'effects', label: 'XP EFFECTS' },
    { id: 'frames', label: 'FRAMES' },
    { id: 'themes', label: 'THEMES' },
    { id: 'backgrounds', label: 'BACKGROUNDS' }
  ];

  const categoryItems = ownedItems.filter(i => i.category === activeCategory);

  const isEquipped = (item: ShopItem): boolean => {
    if (item.category === 'characters') return user.customAvatarUrl === item.previewUrl;
    if (item.category === 'frames') return user.equippedFrame === item.id;
    if (item.category === 'effects') return user.equippedEffect === item.id;
    if (item.category === 'themes') return user.equippedTheme === item.id;
    if (item.category === 'nameplates') return user.equippedTitle === item.id;
    if (item.category === 'backgrounds') return user.equippedBackground === item.id;
    return false;
  };

  const handleToggleEquip = async (item: ShopItem) => {
    const equipped = isEquipped(item);
    await equipItem(item.id, equipped);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10121a] p-6 rounded-3xl border border-violet-900/30">
        <div>
          <span className="text-xs font-mono font-bold text-violet-400 tracking-wider uppercase block mb-1">
            ARMORY & LOADOUT
          </span>
          <h1 className="text-2xl font-black text-white font-['Orbitron'] tracking-wide flex items-center gap-2">
            <span>YOUR INVENTORY</span>
            <span className="text-xs font-mono font-bold text-violet-300 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-800/40">
              {ownedItems.length} UNLOCKED ITEMS
            </span>
          </h1>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
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

      {/* Main Grid + Avatar Loadout Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Inventory Items List */}
        <div className="lg:col-span-8">
          {categoryItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#10121a] border border-slate-800 space-y-3">
              <Package className="w-10 h-10 text-slate-600 mx-auto stroke-1" />
              <p className="text-sm font-bold text-slate-300">No items unlocked in this category yet</p>
              <p className="text-xs text-slate-500">Visit the Reward Shop to unlock custom hero characters, nameplates, and effects!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categoryItems.map(item => {
                const equipped = isEquipped(item);

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      equipped
                        ? 'bg-violet-950/40 border-violet-500/80 shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                        : 'bg-[#12141f] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {item.category === 'characters' && item.previewUrl && (
                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-violet-900/40">
                          <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {item.category === 'nameplates' && (
                        <div className="w-full py-5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-3">
                          <NameplateBadge titleId={item.id} size="md" />
                        </div>
                      )}

                      <h3 className="text-sm font-bold text-white mb-1">{item.name}</h3>
                      <p className="text-xs text-slate-400 mb-4">{item.description}</p>
                    </div>

                    <button
                      onClick={() => handleToggleEquip(item)}
                      className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        equipped
                          ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300'
                          : 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{equipped ? 'UNEQUIP ITEM' : 'EQUIP TO PROFILE'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Character Loadout Canvas Preview */}
        <div className="lg:col-span-4 bg-[#10121a] border border-violet-900/40 rounded-3xl p-6 text-center space-y-4 sticky top-24 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-mono font-bold text-violet-300 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>EQUIPPED LOADOUT</span>
            </h3>
          </div>

          <div className="py-2 flex justify-center">
            <AvatarCanvas user={user} size="lg" showNameplate={true} />
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">ACTIVE TITLE NAMEPLATE</span>
            <div className="flex items-center justify-center py-2">
              <NameplateBadge titleId={user.equippedTitle} size="md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
