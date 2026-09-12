import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Sparkles, X, Check, UserCheck, Shield, Zap, User } from 'lucide-react';

import warriorMaleImg from '../../assets/images/rpg_warrior_avatar_1789192164641.jpg';
import mageMaleImg from '../../assets/images/rpg_mage_avatar_1789192179062.jpg';
import rogueMaleImg from '../../assets/images/rpg_rogue_avatar_1789192196827.jpg';

import warriorFemaleImg from '../../assets/images/rpg_female_warrior_1789193037795.jpg';
import mageFemaleImg from '../../assets/images/rpg_female_mage_1789193053987.jpg';
import rogueFemaleImg from '../../assets/images/rpg_female_rogue_1789193069133.jpg';
import paladinFemaleImg from '../../assets/images/rpg_female_paladin_1789193088314.jpg';

interface PhotoAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface HeroAvatarOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  classTag: string;
  description: string;
  image: string;
  statsPreview: {
    primaryStat: string;
    value: string;
  };
}

export const MALE_HERO_AVATARS: HeroAvatarOption[] = [
  {
    id: 'male-cyber-knight',
    name: 'Cybernetic Knight (Male)',
    gender: 'male',
    classTag: 'Warrior / Defender',
    description: 'Forged in high-tech obsidian alloy plate with a luminous violet energy blade.',
    image: warriorMaleImg,
    statsPreview: { primaryStat: 'STRENGTH', value: '+15 STR' }
  },
  {
    id: 'male-astral-mage',
    name: 'Astral Sorcerer (Male)',
    gender: 'male',
    classTag: 'Mage / Scholar',
    description: 'Wears glowing sapphire robes and wields a crystalline staff tuned to cosmic knowledge.',
    image: mageMaleImg,
    statsPreview: { primaryStat: 'INTELLECT', value: '+15 INT' }
  },
  {
    id: 'male-shadow-rogue',
    name: 'Shadow Assassin (Male)',
    gender: 'male',
    classTag: 'Rogue / Engineer',
    description: 'Equipped with a sleek neon stealth exoskeleton and light-bending energy daggers.',
    image: rogueMaleImg,
    statsPreview: { primaryStat: 'DISCIPLINE', value: '+15 DIS' }
  },
  {
    id: 'male-solar-paladin',
    name: 'Solar Paladin (Male)',
    gender: 'male',
    classTag: 'Leader / Balanced',
    description: 'Radiant golden plate armor radiating a holy solar aura of goal completion.',
    image: warriorMaleImg,
    statsPreview: { primaryStat: 'WISDOM', value: '+15 WIS' }
  }
];

export const FEMALE_HERO_AVATARS: HeroAvatarOption[] = [
  {
    id: 'female-cyber-knight',
    name: 'Cybernetic Knight (Female)',
    gender: 'female',
    classTag: 'Valkyrie Warrior',
    description: 'High-tech obsidian armor with luminous violet plasma blade.',
    image: warriorFemaleImg,
    statsPreview: { primaryStat: 'STRENGTH', value: '+15 STR' }
  },
  {
    id: 'female-astral-mage',
    name: 'Astral Sorceress (Female)',
    gender: 'female',
    classTag: 'Astral Empress',
    description: 'Glowing sapphire & gold robes with floating crystalline staff.',
    image: mageFemaleImg,
    statsPreview: { primaryStat: 'INTELLECT', value: '+15 INT' }
  },
  {
    id: 'female-shadow-rogue',
    name: 'Shadow Assassin (Female)',
    gender: 'female',
    classTag: 'Shadow Phantom',
    description: 'Sleek obsidian stealth exoskeleton with glowing violet daggers.',
    image: rogueFemaleImg,
    statsPreview: { primaryStat: 'DISCIPLINE', value: '+15 DIS' }
  },
  {
    id: 'female-solar-paladin',
    name: 'Solar Valkyrie (Female)',
    gender: 'female',
    classTag: 'Solar Paladin',
    description: 'Radiant golden armor with ethereal wings of light.',
    image: paladinFemaleImg,
    statsPreview: { primaryStat: 'WISDOM', value: '+15 WIS' }
  }
];

export const PhotoAvatarModal: React.FC<PhotoAvatarModalProps> = ({ isOpen, onClose }) => {
  const { user, updateAvatar, updateGender } = useGame();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(user?.gender || 'male');
  
  const currentList = selectedGender === 'female' ? FEMALE_HERO_AVATARS : MALE_HERO_AVATARS;
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(currentList[0].id);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentOption = currentList.find(a => a.id === selectedAvatarId) || currentList[0];

  const handleGenderSwitch = async (g: 'male' | 'female') => {
    setSelectedGender(g);
    const newList = g === 'female' ? FEMALE_HERO_AVATARS : MALE_HERO_AVATARS;
    setSelectedAvatarId(newList[0].id);
    try {
      await updateGender(g);
    } catch (err) {
      console.error('Failed to set gender:', err);
    }
  };

  const handleApplyAvatar = async () => {
    setIsSaving(true);
    try {
      await updateGender(selectedGender);
      await updateAvatar({
        customAvatarUrl: currentOption.image
      });
      onClose();
    } catch (err) {
      console.error('Failed to update avatar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#10121c] border border-violet-900/60 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-[0_0_60px_rgba(139,92,246,0.3)] relative text-slate-100 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-900 border border-slate-700 hover:border-violet-500 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-mono font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>FULL-BODY HERO AVATAR SELECTOR</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-['Cinzel'] tracking-wide text-white">
            SELECT YOUR RPG HERO CHARACTER
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Choose your preferred gender and full-body RPG character avatar to evolve your profile across QUESTORA.
          </p>
        </div>

        {/* Gender Preference Selector Bar */}
        <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <User className="w-4 h-4 text-violet-400" />
            <span>SELECT HERO GENDER:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenderSwitch('male')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedGender === 'male'
                  ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              ♂ MALE HEROES
            </button>
            <button
              onClick={() => handleGenderSwitch('female')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedGender === 'female'
                  ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              ♀ FEMALE HEROES
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mb-6">
          
          {/* Left Column: Hero Character Options Grid (7 cols) */}
          <div className="md:col-span-7 space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              {selectedGender.toUpperCase()} HERO ARCHETYPES
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentList.map((option) => {
                const isSelected = option.id === selectedAvatarId;
                return (
                  <div
                    key={option.id}
                    onClick={() => setSelectedAvatarId(option.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-violet-950/90 to-indigo-950/80 border-violet-500 ring-2 ring-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-white tracking-wide">
                        {option.name.split(' ')[0]} {option.name.split(' ')[1]}
                      </span>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-700" />
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={option.image}
                        alt={option.name}
                        className="w-12 h-16 object-cover rounded-xl border border-violet-500/30"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono text-violet-300 font-semibold block truncate">
                          {option.classTag}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 inline-block mt-1">
                          {option.statsPreview.value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Full-Body Preview Card (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center">
            <h4 className="text-xs font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider text-center">
              CHARACTER PREVIEW
            </h4>

            <div className="w-full aspect-[3/4] max-w-[240px] rounded-2xl bg-gradient-to-b from-violet-950/40 via-slate-950 to-indigo-950/60 border-2 border-violet-500/50 flex flex-col items-center justify-center overflow-hidden relative shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <img
                src={currentOption.image}
                alt={currentOption.name}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Selected Badge */}
              <div className="absolute top-2 right-2 bg-slate-950/90 border border-violet-500/60 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold text-amber-300 shadow-md flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-amber-400" />
                <span>{selectedGender === 'female' ? '♀ FEMALE' : '♂ MALE'} PREVIEW</span>
              </div>

              {/* Bottom Label Overlay */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 border border-violet-500/40 rounded-xl p-2.5 text-center backdrop-blur-sm">
                <p className="text-xs font-mono font-extrabold text-white uppercase tracking-wider">
                  {currentOption.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 font-mono">
                  {currentOption.description}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyAvatar}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-amber-500 hover:from-violet-500 hover:to-amber-400 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isSaving ? 'APPLYING AVATAR...' : 'CONFIRM FULL-BODY AVATAR'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
