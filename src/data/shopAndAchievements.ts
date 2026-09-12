import { ShopItem, Achievement } from '../types';

export const STARTER_AVATAR_URL = '/avatars/rpg_warrior_avatar_1789192164641.jpg';
export const STARTER_CHARACTER_ID = 'char-starter-knight';

export const REWARDS: Record<string, { xp: number; gold: number; stat: number }> = {
  Easy: { xp: 50, gold: 15, stat: 1 },
  Medium: { xp: 80, gold: 25, stat: 2 },
  Hard: { xp: 120, gold: 40, stat: 3 },
  Epic: { xp: 250, gold: 100, stat: 5 }
};

export const ATTRIBUTE_BY_CATEGORY: Record<string, string> = {
  Academics: 'intellect',
  Coding: 'intellect',
  Fitness: 'strength',
  Reading: 'wisdom',
  Creativity: 'creativity',
  Discipline: 'discipline',
  Personal: 'discipline'
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-first-quest', name: 'FIRST QUEST', description: 'Complete your first quest.', icon: 'Flag', requirement: '1 quest completed', xpReward: 50, goldReward: 20, category: 'General' },
  { id: 'ach-streak-7', name: 'ON FIRE', description: 'Maintain a 7-day streak.', icon: 'Flame', requirement: '7-day streak', xpReward: 100, goldReward: 50, category: 'Streaks' },
  { id: 'ach-streak-14', name: 'UNSTOPPABLE', description: 'Maintain a 14-day streak.', icon: 'Zap', requirement: '14-day streak', xpReward: 250, goldReward: 100, category: 'Streaks' },
  { id: 'ach-level-5', name: 'ADVENTURER', description: 'Reach Level 5.', icon: 'Star', requirement: 'Reach Level 5', xpReward: 200, goldReward: 80, category: 'Progression' },
  { id: 'ach-level-10', name: 'WARRIOR', description: 'Reach Level 10.', icon: 'Shield', requirement: 'Reach Level 10', xpReward: 500, goldReward: 200, category: 'Progression' },
  { id: 'ach-level-20', name: 'ELITE', description: 'Reach Level 20.', icon: 'Award', requirement: 'Reach Level 20', xpReward: 1000, goldReward: 500, category: 'Progression' },
  { id: 'ach-intellect-5', name: 'KNOWLEDGE SEEKER', description: 'Complete 5 Intellect quests.', icon: 'BookOpen', requirement: '5 Intellect quests', xpReward: 150, goldReward: 60, category: 'Attributes' },
  { id: 'ach-strength-5', name: 'TITAN OF STRENGTH', description: 'Complete 5 Strength quests.', icon: 'Activity', requirement: '5 Strength quests', xpReward: 150, goldReward: 60, category: 'Attributes' },
  { id: 'ach-discipline-5', name: 'MASTER OF DISCIPLINE', description: 'Complete 5 Discipline quests.', icon: 'Target', requirement: '5 Discipline quests', xpReward: 150, goldReward: 60, category: 'Attributes' },
  { id: 'ach-quests-10', name: 'QUEST MASTER', description: 'Complete 10 quests of any type.', icon: 'CheckCircle', requirement: '10 quests completed', xpReward: 300, goldReward: 150, category: 'General' },
  { id: 'ach-shop-3', name: 'COSMETIC COLLECTOR', description: 'Purchase 3 items from the shop.', icon: 'ShoppingBag', requirement: '3 shop items bought', xpReward: 200, goldReward: 100, category: 'Shop' }
];

export const SHOP_ITEMS: ShopItem[] = [
  // 1 Starter Character (Owned automatically at start)
  {
    id: STARTER_CHARACTER_ID,
    name: 'Cybernetic Knight (Starter)',
    description: 'Forged in obsidian alloy plate with a luminous violet energy blade. Granted to every adventurer upon joining QUESTORA.',
    category: 'characters',
    price: 0,
    requiredLevel: 1,
    icon: 'Shield',
    gender: 'male',
    previewUrl: STARTER_AVATAR_URL
  },
  // Characters for purchase in rewards shop
  {
    id: 'char-male-astral-mage',
    name: 'Astral Sorcerer (Male)',
    description: 'Wears glowing sapphire robes and wields a crystalline staff tuned to cosmic knowledge.',
    category: 'characters',
    price: 400,
    requiredLevel: 2,
    icon: 'Sparkles',
    gender: 'male',
    previewUrl: '/avatars/rpg_mage_avatar_1789192179062.jpg'
  },
  {
    id: 'char-male-shadow-rogue',
    name: 'Shadow Assassin (Male)',
    description: 'Equipped with a sleek neon stealth exoskeleton and light-bending energy daggers.',
    category: 'characters',
    price: 500,
    requiredLevel: 3,
    icon: 'Zap',
    gender: 'male',
    previewUrl: '/avatars/rpg_rogue_avatar_1789192196827.jpg'
  },
  {
    id: 'char-male-solar-paladin',
    name: 'Solar Paladin (Male)',
    description: 'Radiant golden plate armor radiating a holy solar aura of goal completion.',
    category: 'characters',
    price: 800,
    requiredLevel: 5,
    icon: 'Crown',
    gender: 'male',
    previewUrl: '/avatars/rpg_warrior_avatar_1789192164641.jpg'
  },
  {
    id: 'char-female-cyber-knight',
    name: 'Cybernetic Knight (Female)',
    description: 'High-tech obsidian alloy armor with dual violet energy blades.',
    category: 'characters',
    price: 300,
    requiredLevel: 1,
    icon: 'Shield',
    gender: 'female',
    previewUrl: '/avatars/rpg_female_warrior_1789193037795.jpg'
  },
  {
    id: 'char-female-astral-mage',
    name: 'Astral Sorceress (Female)',
    description: 'Sapphire celestial robes radiating radiant astral spellcraft.',
    category: 'characters',
    price: 400,
    requiredLevel: 2,
    icon: 'Sparkles',
    gender: 'female',
    previewUrl: '/avatars/rpg_female_mage_1789193053987.jpg'
  },
  {
    id: 'char-female-shadow-rogue',
    name: 'Shadow Assassin (Female)',
    description: 'Sleek neon phantom stealth exoskeleton with high-frequency daggers.',
    category: 'characters',
    price: 500,
    requiredLevel: 3,
    icon: 'Zap',
    gender: 'female',
    previewUrl: '/avatars/rpg_female_rogue_1789193069133.jpg'
  },
  {
    id: 'char-female-solar-paladin',
    name: 'Solar Valkyrie Paladin (Female)',
    description: 'Golden winged aegis plate with solar radiance.',
    category: 'characters',
    price: 800,
    requiredLevel: 5,
    icon: 'Crown',
    gender: 'female',
    previewUrl: '/avatars/rpg_female_paladin_1789193088314.jpg'
  },
  // Frames
  { id: 'frame-neon', name: 'Neon Frame', description: 'Vibrant neon purple aura border.', category: 'frames', price: 150, requiredLevel: 1, icon: 'Square' },
  { id: 'frame-galaxy', name: 'Galaxy Frame', description: 'Cosmic cyan starlight border.', category: 'frames', price: 450, requiredLevel: 4, icon: 'Sparkles' },
  { id: 'frame-royal', name: 'Royal Gold Frame', description: 'Regal golden border of distinction.', category: 'frames', price: 800, requiredLevel: 8, icon: 'Award' },
  { id: 'frame-cyber', name: 'Cyber Matrix Frame', description: 'High-tech digital matrix border.', category: 'frames', price: 1500, requiredLevel: 12, icon: 'Cpu' },
  // Effects
  { id: 'effect-lightning', name: 'Lightning XP Burst', description: 'Electric yellow-amber surge on completion.', category: 'effects', price: 300, requiredLevel: 3, icon: 'Zap' },
  { id: 'effect-fire', name: 'Flame Aura', description: 'Blazing infernal fire aura.', category: 'effects', price: 600, requiredLevel: 6, icon: 'Flame' },
  { id: 'effect-crystal', name: 'Crystal Nova', description: 'Orbital cyan crystal rotation.', category: 'effects', price: 900, requiredLevel: 9, icon: 'Gem' },
  { id: 'effect-energy', name: 'Energy Pulse', description: 'Rhythmic magenta pulse barrier.', category: 'effects', price: 1400, requiredLevel: 11, icon: 'Activity' },
  // Themes
  { id: 'theme-cyber', name: 'Cyber Night (Default)', description: 'Dark futuristic violet theme.', category: 'themes', price: 0, requiredLevel: 1, icon: '' },
  { id: 'theme-forest', name: 'Mystic Forest', description: 'Deep emerald forest aesthetic.', category: 'themes', price: 350, requiredLevel: 4, icon: '' },
  { id: 'theme-solar', name: 'Solar Gold', description: 'Sunlit royal gold accents.', category: 'themes', price: 700, requiredLevel: 7, icon: '' },
  { id: 'theme-void', name: 'Midnight Void', description: 'Absolute pitch darkness with subtle stars.', category: 'themes', price: 1000, requiredLevel: 10, icon: '' },
  { id: 'theme-aurora', name: 'Aurora Neon', description: 'Northern lights electric glow.', category: 'themes', price: 1800, requiredLevel: 14, icon: '' },
  // Nameplates
  { id: 'title-explorer', name: 'Explorer', description: 'Title: Explorer', category: 'nameplates', price: 0, requiredLevel: 1, icon: 'Shield' },
  { id: 'title-scholar', name: 'Arcane Scholar', description: 'Title: Arcane Scholar', category: 'nameplates', price: 150, requiredLevel: 2, icon: 'BookOpen' },
  { id: 'title-architect', name: 'Cyber Architect', description: 'Title: Cyber Architect', category: 'nameplates', price: 400, requiredLevel: 5, icon: 'Cpu' },
  { id: 'title-elite', name: 'Elite Paragon', description: 'Title: Elite Paragon', category: 'nameplates', price: 800, requiredLevel: 8, icon: 'Award' },
  { id: 'title-legend', name: 'Grandmaster Legend', description: 'Title: Grandmaster Legend', category: 'nameplates', price: 2000, requiredLevel: 15, icon: 'Crown' },
  { id: 'title-cyber', name: 'Cyberpunk Phantom', description: 'Title: Cyberpunk Phantom', category: 'nameplates', price: 1200, requiredLevel: 10, icon: 'Zap' },
  { id: 'title-void', name: 'Void Shadow Lord', description: 'Title: Void Shadow Lord', category: 'nameplates', price: 1600, requiredLevel: 12, icon: 'Flame' },
  // Backgrounds
  { id: 'bg-dojo', name: 'Cyber Dojo', description: 'A training sanctum infused with neon runes.', category: 'backgrounds', price: 250, requiredLevel: 2, icon: 'MapPin' },
  { id: 'bg-citadel', name: 'Citadel Spire', description: 'High-tech metropolis skyline view.', category: 'backgrounds', price: 500, requiredLevel: 5, icon: 'Globe' },
  { id: 'bg-temple', name: 'Celestial Temple', description: 'Sacred star temple atop the cosmic cloudline.', category: 'backgrounds', price: 1000, requiredLevel: 10, icon: 'Sparkles' },
  { id: 'bg-neon-grid', name: 'Neon Matrix Void', description: 'Infinite cyber grid stretching into the event horizon.', category: 'backgrounds', price: 750, requiredLevel: 7, icon: 'Zap' },
  { id: 'bg-shadow-dungeon', name: 'Shadow Dungeon', description: 'Crimson underground labyrinth.', category: 'backgrounds', price: 1200, requiredLevel: 11, icon: 'Shield' },
  { id: 'bg-solar-sanctuary', name: 'Solar Sanctuary', description: 'Warm amber bastion bathed in sunlight.', category: 'backgrounds', price: 1500, requiredLevel: 13, icon: 'Sun' }
];
