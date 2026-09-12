import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'questora-secret-key-gamified-rpg-2026';
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Helper for leveling calculation
export function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.45));
}

export function calculateLevelData(totalXp: number) {
  let level = 1;
  let xpRemaining = totalXp;
  
  while (true) {
    const required = getXpForLevel(level);
    if (xpRemaining >= required) {
      xpRemaining -= required;
      level++;
    } else {
      break;
    }
  }
  
  return {
    level,
    currentLevelXp: xpRemaining,
    nextLevelXp: getXpForLevel(level),
    progressPct: Math.min(100, Math.floor((xpRemaining / getXpForLevel(level)) * 100))
  };
}

// Ensure data folder
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initial Shop Items Catalog
const INITIAL_SHOP_ITEMS = [
  // Cartoonish Full-Body Hero Characters (Male & Female)
  { id: 'char-male-cyber-knight', name: 'Cybernetic Knight (Male)', description: 'Obsidian armor with luminous violet blade.', category: 'characters', price: 300, requiredLevel: 1, icon: 'Shield', gender: 'male', previewUrl: '/src/assets/images/rpg_warrior_avatar_1789192164641.jpg' },
  { id: 'char-male-astral-mage', name: 'Astral Sorcerer (Male)', description: 'Sapphire robes with crystalline staff.', category: 'characters', price: 400, requiredLevel: 2, icon: 'Sparkles', gender: 'male', previewUrl: '/src/assets/images/rpg_mage_avatar_1789192179062.jpg' },
  { id: 'char-male-shadow-rogue', name: 'Shadow Assassin (Male)', description: 'Stealth suit with twin energy daggers.', category: 'characters', price: 500, requiredLevel: 3, icon: 'Zap', gender: 'male', previewUrl: '/src/assets/images/rpg_rogue_avatar_1789192196827.jpg' },
  { id: 'char-male-solar-paladin', name: 'Solar Paladin (Male)', description: 'Golden plate armor with radiant solar shield.', category: 'characters', price: 800, requiredLevel: 5, icon: 'Crown', gender: 'male', previewUrl: '/src/assets/images/rpg_warrior_avatar_1789192164641.jpg' },

  { id: 'char-female-cyber-knight', name: 'Cybernetic Knight (Female)', description: 'Cyber armor with violet energy sword.', category: 'characters', price: 300, requiredLevel: 1, icon: 'Shield', gender: 'female', previewUrl: '/src/assets/images/rpg_female_warrior_1789193037795.jpg' },
  { id: 'char-female-astral-mage', name: 'Astral Sorceress (Female)', description: 'Sapphire robes with floating crystal staff.', category: 'characters', price: 400, requiredLevel: 2, icon: 'Sparkles', gender: 'female', previewUrl: '/src/assets/images/rpg_female_mage_1789193053987.jpg' },
  { id: 'char-female-shadow-rogue', name: 'Shadow Assassin (Female)', description: 'Obsidian suit with luminous daggers.', category: 'characters', price: 500, requiredLevel: 3, icon: 'Zap', gender: 'female', previewUrl: '/src/assets/images/rpg_female_rogue_1789193069133.jpg' },
  { id: 'char-female-solar-paladin', name: 'Solar Valkyrie Paladin (Female)', description: 'Golden armor with wings of light.', category: 'characters', price: 800, requiredLevel: 5, icon: 'Crown', gender: 'female', previewUrl: '/src/assets/images/rpg_female_paladin_1789193088314.jpg' },

  // Frames
  { id: 'frame-neon', name: 'Neon Frame', description: 'Vibrant electric border for your character badge.', category: 'frames', price: 150, requiredLevel: 1, icon: 'Square' },
  { id: 'frame-galaxy', name: 'Galaxy Frame', description: 'Swirling cosmic border of deep space dust.', category: 'frames', price: 450, requiredLevel: 4, icon: 'Sparkles' },
  { id: 'frame-royal', name: 'Royal Gold Frame', description: 'Polished metallic gold frame fit for high levels.', category: 'frames', price: 800, requiredLevel: 8, icon: 'Award' },
  { id: 'frame-cyber', name: 'Cyber Matrix Frame', description: 'Animated glitch digital frame for elite tech ops.', category: 'frames', price: 1500, requiredLevel: 12, icon: 'Cpu' },

  // Effects
  { id: 'effect-lightning', name: 'Lightning XP Burst', description: 'Electrifying aura burst when earning XP.', category: 'effects', price: 300, requiredLevel: 3, icon: 'Zap' },
  { id: 'effect-fire', name: 'Flame Aura', description: 'Ignites fiery embers upon quest completion.', category: 'effects', price: 600, requiredLevel: 6, icon: 'Flame' },
  { id: 'effect-crystal', name: 'Crystal Nova', description: 'Prismatic crystal shards burst into the air.', category: 'effects', price: 900, requiredLevel: 9, icon: 'Gem' },
  { id: 'effect-energy', name: 'Energy Pulse', description: 'Shockwave pulse reverberating across the dashboard.', category: 'effects', price: 1400, requiredLevel: 11, icon: 'Activity' },

  // Themes
  { id: 'theme-cyber', name: 'Cyber Night (Default)', description: 'Deep dark indigo canvas with electric violet accents.', category: 'themes', price: 0, requiredLevel: 1, themeClass: 'theme-cyber' },
  { id: 'theme-forest', name: 'Mystic Forest', description: 'Emerald shadows and bio-luminescent flora atmosphere.', category: 'themes', price: 350, requiredLevel: 4, themeClass: 'theme-forest' },
  { id: 'theme-solar', name: 'Solar Gold', description: 'Warm amber glow with luxurious metallic accents.', category: 'themes', price: 700, requiredLevel: 7, themeClass: 'theme-solar' },
  { id: 'theme-void', name: 'Midnight Void', description: 'Pitch black minimalist canvas with sharp monochrome text.', category: 'themes', price: 1000, requiredLevel: 10, themeClass: 'theme-void' },
  { id: 'theme-aurora', name: 'Aurora Neon', description: 'Shifting teal and magenta light waves.', category: 'themes', price: 1800, requiredLevel: 14, themeClass: 'theme-aurora' },

  // Nameplates
  { id: 'title-explorer', name: 'Explorer', description: 'Bronze metallic adventurer title banner.', category: 'nameplates', price: 0, requiredLevel: 1, icon: 'Shield' },
  { id: 'title-scholar', name: 'Arcane Scholar', description: 'Sapphire glowing arcane lore banner.', category: 'nameplates', price: 150, requiredLevel: 2, icon: 'BookOpen' },
  { id: 'title-architect', name: 'Cyber Architect', description: 'Neon cyan system builder tech banner.', category: 'nameplates', price: 400, requiredLevel: 5, icon: 'Cpu' },
  { id: 'title-elite', name: 'Elite Paragon', description: 'Royal violet & gold metallic crown banner.', category: 'nameplates', price: 800, requiredLevel: 8, icon: 'Award' },
  { id: 'title-legend', name: 'Grandmaster Legend', description: 'Animated golden dragon flame pinnacle banner.', category: 'nameplates', price: 2000, requiredLevel: 15, icon: 'Crown' },
  { id: 'title-cyber', name: 'Cyberpunk Phantom', description: 'Electric neon pink glitch speedster banner.', category: 'nameplates', price: 1200, requiredLevel: 10, icon: 'Zap' },
  { id: 'title-void', name: 'Void Shadow Lord', description: 'Dark obsidian void lord sovereign banner.', category: 'nameplates', price: 1600, requiredLevel: 12, icon: 'Flame' },

  // Backgrounds
  { id: 'bg-dojo', name: 'Cyber Dojo', description: 'Neon-lit training sanctuary with cyber grid scanlines.', category: 'backgrounds', price: 250, requiredLevel: 2, icon: 'MapPin' },
  { id: 'bg-citadel', name: 'Citadel Spire', description: 'Overlooking futuristic city skyline horizon.', category: 'backgrounds', price: 500, requiredLevel: 5, icon: 'Globe' },
  { id: 'bg-temple', name: 'Celestial Temple', description: 'Sacred mountain peaks under cosmic starry night.', category: 'backgrounds', price: 1000, requiredLevel: 10, icon: 'Sparkles' },
  { id: 'bg-neon-grid', name: 'Neon Matrix Void', description: 'Retro-futuristic glowing magenta grid backdrop.', category: 'backgrounds', price: 750, requiredLevel: 7, icon: 'Zap' },
  { id: 'bg-shadow-dungeon', name: 'Shadow Dungeon', description: 'Deep crimson obsidian dark fantasy gothic backdrop.', category: 'backgrounds', price: 1200, requiredLevel: 11, icon: 'Shield' },
  { id: 'bg-solar-sanctuary', name: 'Solar Sanctuary', description: 'Radiant golden sanctuary atmosphere.', category: 'backgrounds', price: 1500, requiredLevel: 13, icon: 'Sun' }
];

// Initial Achievements
const INITIAL_ACHIEVEMENTS = [
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

// Database initial structure
interface DbSchema {
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    username: string;
    characterClass: any;
    gender?: 'male' | 'female';
    level: number;
    totalXp: number;
    gold: number;
    currentStreak: number;
    longestStreak: number;
    lastQuestCompletedDate?: string;
    customAvatarUrl?: string;
    userPhotoUrl?: string;
    equippedTheme: string;
    equippedTitle: string;
    equippedFrame: string;
    equippedEffect: string;
    equippedBackground: string;
    equippedWearables: Record<string, string>;
    createdAt: string;
  }>;
  characterStats: Record<string, {
    intellect: number;
    strength: number;
    discipline: number;
    wisdom: number;
    creativity: number;
  }>;
  quests: Array<any>;
  questHistory: Array<any>;
  userAchievements: Array<{ userId: string; achievementId: string; unlockedAt: string }>;
  inventory: Array<{ id: string; userId: string; itemId: string; purchasedAt: string }>;
}

function loadDb(): DbSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return data;
    } catch (e) {
      console.error('Error reading db.json, creating new', e);
    }
  }

  // Seed default database with demo user
  const passwordHash = bcrypt.hashSync('demo1234', 10);
  const demoUserId = 'user-demo-1';

  const defaultDb: DbSchema = {
    users: [
      {
        id: demoUserId,
        email: 'hero@questora.app',
        passwordHash,
        username: 'Aetheris',
        characterClass: 'Scholar',
        level: 3,
        totalXp: 450,
        gold: 240,
        currentStreak: 4,
        longestStreak: 7,
        lastQuestCompletedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        equippedTheme: 'theme-cyber',
        equippedTitle: 'Scholar',
        equippedFrame: 'frame-neon',
        equippedEffect: 'effect-lightning',
        equippedBackground: 'bg-dojo',
        equippedWearables: {
          head: 'wearable-headphones-neon',
          body: 'wearable-hoodie-adventurer',
          eyes: 'wearable-spectacles-scholar'
        },
        createdAt: new Date().toISOString()
      }
    ],
    characterStats: {
      [demoUserId]: {
        intellect: 18,
        strength: 11,
        discipline: 21,
        wisdom: 14,
        creativity: 9
      }
    },
    quests: [
      {
        id: 'q-1',
        userId: demoUserId,
        title: 'Complete Quantum Physics Chapter',
        description: 'Read Chapter 4 on wave-particle duality and answer 5 review questions.',
        category: 'Academics',
        difficulty: 'Hard',
        type: 'Daily',
        xpReward: 120,
        goldReward: 30,
        attributeReward: { attribute: 'intellect', amount: 3 },
        frequency: 'Daily',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'q-2',
        userId: demoUserId,
        title: '60 Minutes Full-Stack Coding Session',
        description: 'Build backend API routes and unit test endpoint edge cases.',
        category: 'Coding',
        difficulty: 'Medium',
        type: 'Daily',
        xpReward: 80,
        goldReward: 20,
        attributeReward: { attribute: 'intellect', amount: 2 },
        frequency: 'Daily',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'q-3',
        userId: demoUserId,
        title: 'Read 20 Pages of Philosophy',
        description: 'Read Meditations by Marcus Aurelius and take bullet notes.',
        category: 'Reading',
        difficulty: 'Easy',
        type: 'Daily',
        xpReward: 50,
        goldReward: 10,
        attributeReward: { attribute: 'wisdom', amount: 1 },
        frequency: 'Daily',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'q-4',
        userId: demoUserId,
        title: '30 Minute High Intensity Cardio',
        description: '5km outdoor run or stationary bicycle sprint.',
        category: 'Fitness',
        difficulty: 'Hard',
        type: 'Main',
        xpReward: 120,
        goldReward: 40,
        attributeReward: { attribute: 'strength', amount: 3 },
        frequency: 'Weekly',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'q-5',
        userId: demoUserId,
        title: 'Cold Shower & Morning Meditation',
        description: 'Maintain deep breathing cycle for 10 continuous minutes.',
        category: 'Discipline',
        difficulty: 'Medium',
        type: 'Daily',
        xpReward: 80,
        goldReward: 25,
        attributeReward: { attribute: 'discipline', amount: 2 },
        frequency: 'Daily',
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ],
    questHistory: [
      {
        id: 'qh-1',
        userId: demoUserId,
        questId: 'q-5',
        questTitle: 'Cold Shower & Morning Meditation',
        category: 'Discipline',
        xpEarned: 80,
        goldEarned: 25,
        attributeReward: { attribute: 'discipline', amount: 2 },
        completedAt: new Date().toISOString()
      }
    ],
    userAchievements: [
      { userId: demoUserId, achievementId: 'ach-first-quest', unlockedAt: new Date().toISOString() }
    ],
    inventory: [
      { id: 'inv-1', userId: demoUserId, itemId: 'wearable-hoodie-adventurer', purchasedAt: new Date().toISOString() },
      { id: 'inv-2', userId: demoUserId, itemId: 'wearable-headphones-neon', purchasedAt: new Date().toISOString() },
      { id: 'inv-3', userId: demoUserId, itemId: 'wearable-spectacles-scholar', purchasedAt: new Date().toISOString() },
      { id: 'inv-4', userId: demoUserId, itemId: 'frame-neon', purchasedAt: new Date().toISOString() },
      { id: 'inv-5', userId: demoUserId, itemId: 'effect-lightning', purchasedAt: new Date().toISOString() },
      { id: 'inv-6', userId: demoUserId, itemId: 'theme-cyber', purchasedAt: new Date().toISOString() },
      { id: 'inv-7', userId: demoUserId, itemId: 'title-explorer', purchasedAt: new Date().toISOString() },
      { id: 'inv-8', userId: demoUserId, itemId: 'title-scholar', purchasedAt: new Date().toISOString() },
      { id: 'inv-9', userId: demoUserId, itemId: 'bg-dojo', purchasedAt: new Date().toISOString() }
    ]
  };

  saveDb(defaultDb);
  return defaultDb;
}

function saveDb(db: DbSchema) {
  const tmpPath = DB_FILE + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_FILE);
}

// Global DB in-memory reference synced to disk
const db = loadDb();

// Express app setup
const app = express();
app.use(express.json());

// Auth Middleware helper
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }
}

// ---------------- API ENDPOINTS ---------------- //

// 1. Auth Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, username, characterClass } = req.body;
  
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required.' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const selectedClass = characterClass || 'Balanced';

  // Base stats based on class
  const baseStats: Record<string, any> = {
    Warrior: { intellect: 10, strength: 16, discipline: 14, wisdom: 10, creativity: 10 },
    Scholar: { intellect: 16, strength: 9, discipline: 12, wisdom: 15, creativity: 10 },
    Engineer: { intellect: 16, strength: 10, discipline: 15, wisdom: 11, creativity: 12 },
    Creator: { intellect: 11, strength: 9, discipline: 11, wisdom: 12, creativity: 17 },
    Balanced: { intellect: 12, strength: 12, discipline: 12, wisdom: 12, creativity: 12 }
  };

  const newUser = {
    id: userId,
    email,
    passwordHash,
    username,
    characterClass: selectedClass,
    level: 1,
    totalXp: 0,
    gold: 50, // Starting bonus gold
    currentStreak: 1,
    longestStreak: 1,
    lastQuestCompletedDate: undefined,
    equippedTheme: 'theme-cyber',
    equippedTitle: 'Explorer',
    equippedFrame: 'frame-neon',
    equippedEffect: 'effect-lightning',
    equippedBackground: 'bg-dojo',
    equippedWearables: {
      body: 'wearable-hoodie-adventurer'
    },
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.characterStats[userId] = baseStats[selectedClass] || baseStats['Balanced'];

  // Add initial starter inventory items
  db.inventory.push(
    { id: 'inv-' + Date.now() + '-1', userId, itemId: 'wearable-hoodie-adventurer', purchasedAt: new Date().toISOString() },
    { id: 'inv-' + Date.now() + '-2', userId, itemId: 'frame-neon', purchasedAt: new Date().toISOString() },
    { id: 'inv-' + Date.now() + '-3', userId, itemId: 'theme-cyber', purchasedAt: new Date().toISOString() },
    { id: 'inv-' + Date.now() + '-4', userId, itemId: 'title-explorer', purchasedAt: new Date().toISOString() }
  );

  // Initial recommended starter quests
  const starterQuests = [
    {
      id: 'q-' + Date.now() + '-1',
      userId,
      title: 'Complete Your First Questora Task',
      description: 'Check off this initial quest to feel the XP & Gold progression flow.',
      category: 'Discipline',
      difficulty: 'Easy',
      type: 'Daily',
      xpReward: 50,
      goldReward: 20,
      attributeReward: { attribute: 'discipline', amount: 1 },
      frequency: 'Daily',
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'q-' + Date.now() + '-2',
      userId,
      title: 'Read 15 Minutes of a Book or Article',
      description: 'Expand your mind and build your Intellect attribute.',
      category: 'Reading',
      difficulty: 'Medium',
      type: 'Daily',
      xpReward: 80,
      goldReward: 25,
      attributeReward: { attribute: 'wisdom', amount: 2 },
      frequency: 'Daily',
      completed: false,
      createdAt: new Date().toISOString()
    }
  ];

  db.quests.push(...starterQuests);
  saveDb(db);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, username: newUser.username }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      characterClass: newUser.characterClass,
      level: newUser.level,
      totalXp: newUser.totalXp,
      gold: newUser.gold,
      currentStreak: newUser.currentStreak,
      longestStreak: newUser.longestStreak,
      equippedTheme: newUser.equippedTheme,
      equippedTitle: newUser.equippedTitle,
      equippedFrame: newUser.equippedFrame,
      equippedEffect: newUser.equippedEffect,
      equippedBackground: newUser.equippedBackground,
      equippedWearables: newUser.equippedWearables
    },
    stats: db.characterStats[userId]
  });
});

// Google Sign-In Endpoint
app.post('/api/auth/google', async (req, res) => {
  const { email, displayName, uid } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required for Google Sign-In.' });
  }

  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    const username = displayName || email.split('@')[0];
    const passwordHash = await bcrypt.hash(uid || 'google-auth-user', 10);
    const userId = uid || ('user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
    const selectedClass = 'Balanced';

    const baseStats: Record<string, any> = {
      Balanced: { intellect: 12, strength: 12, discipline: 12, wisdom: 12, creativity: 12 }
    };

    user = {
      id: userId,
      email,
      passwordHash,
      username,
      characterClass: selectedClass,
      gender: req.body.gender || (username.toLowerCase().includes('female') ? 'female' : 'male'),
      level: 1,
      totalXp: 0,
      gold: 50,
      currentStreak: 1,
      longestStreak: 1,
      lastQuestCompletedDate: undefined,
      equippedTheme: 'theme-cyber',
      equippedTitle: 'Explorer',
      equippedFrame: 'frame-neon',
      equippedEffect: 'effect-lightning',
      equippedBackground: 'bg-dojo',
      equippedWearables: {
        body: 'wearable-hoodie-adventurer'
      },
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    db.characterStats[user.id] = baseStats['Balanced'];

    db.inventory.push(
      { id: 'inv-' + Date.now() + '-1', userId: user.id, itemId: 'wearable-hoodie-adventurer', purchasedAt: new Date().toISOString() },
      { id: 'inv-' + Date.now() + '-2', userId: user.id, itemId: 'frame-neon', purchasedAt: new Date().toISOString() },
      { id: 'inv-' + Date.now() + '-3', userId: user.id, itemId: 'theme-cyber', purchasedAt: new Date().toISOString() },
      { id: 'inv-' + Date.now() + '-4', userId: user.id, itemId: 'title-explorer', purchasedAt: new Date().toISOString() }
    );

    const starterQuests = [
      {
        id: 'q-' + Date.now() + '-1',
        userId: user.id,
        title: 'Complete Your First Questora Task',
        description: 'Check off this initial quest to feel the XP & Gold progression flow.',
        category: 'Discipline',
        difficulty: 'Easy',
        type: 'Daily',
        xpReward: 50,
        goldReward: 20,
        attributeReward: { attribute: 'discipline', amount: 1 },
        frequency: 'Daily',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'q-' + Date.now() + '-2',
        userId: user.id,
        title: 'Read 15 Minutes of a Book or Article',
        description: 'Expand your mind and build your Intellect attribute.',
        category: 'Reading',
        difficulty: 'Medium',
        type: 'Daily',
        xpReward: 80,
        goldReward: 25,
        attributeReward: { attribute: 'wisdom', amount: 2 },
        frequency: 'Daily',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    db.quests.push(...starterQuests);
    saveDb(db);
  }

  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      characterClass: user.characterClass,
      level: user.level,
      totalXp: user.totalXp,
      gold: user.gold,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      equippedTheme: user.equippedTheme,
      equippedTitle: user.equippedTitle,
      equippedFrame: user.equippedFrame,
      equippedEffect: user.equippedEffect,
      equippedBackground: user.equippedBackground,
      equippedWearables: user.equippedWearables
    },
    stats: db.characterStats[user.id]
  });
});

// 2. Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

  const { passwordHash, ...userClean } = user;
  return res.json({
    token,
    user: userClean,
    stats: db.characterStats[user.id] || { intellect: 10, strength: 10, discipline: 10, wisdom: 10, creativity: 10 }
  });
});

// 3. Auth Me
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash, ...userClean } = user;
  return res.json({
    user: userClean,
    stats: db.characterStats[user.id] || { intellect: 10, strength: 10, discipline: 10, wisdom: 10, creativity: 10 }
  });
});

// Update User Avatar (Photo & Full-Body RPG Avatar)
app.post('/api/user/avatar', authenticateToken, (req: any, res) => {
  const { customAvatarUrl, userPhotoUrl } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (customAvatarUrl !== undefined) user.customAvatarUrl = customAvatarUrl;
  if (userPhotoUrl !== undefined) user.userPhotoUrl = userPhotoUrl;

  saveDb(db);

  const { passwordHash, ...userClean } = user;
  return res.json({
    user: userClean,
    stats: db.characterStats[user.id] || { intellect: 10, strength: 10, discipline: 10, wisdom: 10, creativity: 10 }
  });
});

// Update User Gender
app.post('/api/user/gender', authenticateToken, (req: any, res) => {
  const { gender } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (gender === 'male' || gender === 'female') {
    user.gender = gender;
  }
  saveDb(db);

  const { passwordHash, ...userClean } = user;
  return res.json({
    user: userClean,
    stats: db.characterStats[user.id] || { intellect: 10, strength: 10, discipline: 10, wisdom: 10, creativity: 10 }
  });
});

// 4. Update Onboarding Class / Goals
app.post('/api/onboarding/setup', authenticateToken, (req: any, res) => {
  const { characterClass, goals } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (characterClass) {
    user.characterClass = characterClass;
  }

  // Adjust starting quests based on user selected goals
  if (Array.isArray(goals) && goals.length > 0) {
    goals.forEach(goal => {
      if (goal === 'Coding') {
        db.quests.push({
          id: 'q-' + Date.now() + '-code',
          userId: user.id,
          title: '60 Minute Coding Session',
          description: 'Focus deeply on software development or bug fixing.',
          category: 'Coding',
          difficulty: 'Medium',
          type: 'Daily',
          xpReward: 80,
          goldReward: 25,
          attributeReward: { attribute: 'intellect', amount: 2 },
          frequency: 'Daily',
          completed: false,
          createdAt: new Date().toISOString()
        });
      } else if (goal === 'Fitness') {
        db.quests.push({
          id: 'q-' + Date.now() + '-fit',
          userId: user.id,
          title: '30 Minute Workout or Gym Session',
          description: 'Push physical limits and gain Strength attribute XP.',
          category: 'Fitness',
          difficulty: 'Hard',
          type: 'Daily',
          xpReward: 120,
          goldReward: 35,
          attributeReward: { attribute: 'strength', amount: 3 },
          frequency: 'Daily',
          completed: false,
          createdAt: new Date().toISOString()
        });
      }
    });
  }

  saveDb(db);
  const { passwordHash, ...userClean } = user;
  return res.json({ user: userClean, stats: db.characterStats[user.id] });
});

// 5. Quests API: Get Quests
app.get('/api/quests', authenticateToken, (req: any, res) => {
  const userQuests = db.quests.filter(q => q.userId === req.user.id);
  return res.json({ quests: userQuests });
});

// 6. Create Quest
app.post('/api/quests', authenticateToken, (req: any, res) => {
  const { title, description, category, difficulty, type, frequency, attributeTarget } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Quest title is required.' });
  }

  // Calculate rewards based on difficulty
  const difficultyMap: Record<string, { xp: number; gold: number; stat: number }> = {
    Easy: { xp: 50, gold: 15, stat: 1 },
    Medium: { xp: 80, gold: 25, stat: 2 },
    Hard: { xp: 120, gold: 40, stat: 3 },
    Epic: { xp: 250, gold: 100, stat: 5 }
  };

  const diffConfig = difficultyMap[difficulty] || difficultyMap['Medium'];
  const attribute = attributeTarget || (
    category === 'Academics' || category === 'Coding' ? 'intellect' :
    category === 'Fitness' ? 'strength' :
    category === 'Reading' ? 'wisdom' :
    category === 'Creativity' ? 'creativity' : 'discipline'
  );

  const newQuest = {
    id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId: req.user.id,
    title: title.trim(),
    description: description ? description.trim() : '',
    category: category || 'Discipline',
    difficulty: difficulty || 'Medium',
    type: type || 'Daily',
    xpReward: diffConfig.xp,
    goldReward: diffConfig.gold,
    attributeReward: { attribute, amount: diffConfig.stat },
    frequency: frequency || 'Daily',
    completed: false,
    createdAt: new Date().toISOString()
  };

  db.quests.unshift(newQuest);
  saveDb(db);

  return res.json({ quest: newQuest });
});

// 7. Delete Quest
app.delete('/api/quests/:id', authenticateToken, (req: any, res) => {
  const questIndex = db.quests.findIndex(q => q.id === req.params.id && q.userId === req.user.id);
  if (questIndex === -1) {
    return res.status(404).json({ error: 'Quest not found or not owned by user.' });
  }
  db.quests.splice(questIndex, 1);
  saveDb(db);
  return res.json({ success: true });
});

// 8. Complete Quest (Server Authoritative Progression)
app.post('/api/quests/:id/complete', authenticateToken, (req: any, res) => {
  const quest = db.quests.find(q => q.id === req.params.id && q.userId === req.user.id);
  if (!quest) {
    return res.status(404).json({ error: 'Quest not found.' });
  }

  if (quest.completed) {
    return res.status(400).json({ error: 'Quest has already been completed.' });
  }

  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const stats = db.characterStats[user.id] || { intellect: 10, strength: 10, discipline: 10, wisdom: 10, creativity: 10 };

  // Calculate level up before & after
  const oldLevelData = calculateLevelData(user.totalXp);
  
  // Apply rewards
  quest.completed = true;
  quest.completedAt = new Date().toISOString();

  user.totalXp += quest.xpReward;
  user.gold += quest.goldReward;

  // Apply attribute reward
  const attrKey = quest.attributeReward.attribute as keyof typeof stats;
  if (stats[attrKey] !== undefined) {
    stats[attrKey] += quest.attributeReward.amount;
  }
  db.characterStats[user.id] = stats;

  const newLevelData = calculateLevelData(user.totalXp);
  const didLevelUp = newLevelData.level > oldLevelData.level;
  user.level = newLevelData.level;

  // Streak update logic
  const todayStr = new Date().toISOString().split('T')[0];
  if (user.lastQuestCompletedDate !== todayStr) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (user.lastQuestCompletedDate === yesterday) {
      user.currentStreak += 1;
    } else if (!user.lastQuestCompletedDate) {
      user.currentStreak = 1;
    } else {
      user.currentStreak = 1;
    }
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }
    user.lastQuestCompletedDate = todayStr;
  }

  // Record History
  const historyEntry = {
    id: 'qh-' + Date.now(),
    userId: user.id,
    questId: quest.id,
    questTitle: quest.title,
    category: quest.category,
    xpEarned: quest.xpReward,
    goldEarned: quest.goldReward,
    attributeReward: quest.attributeReward,
    completedAt: new Date().toISOString()
  };
  db.questHistory.unshift(historyEntry);

  // Check & Unlock Achievements
  const unlockedAchievements: any[] = [];
  const userCompletedCount = db.questHistory.filter(h => h.userId === user.id).length;
  
  const checkAchievement = (achId: string, condition: boolean) => {
    if (!condition) return;
    const exists = db.userAchievements.some(ua => ua.userId === user.id && ua.achievementId === achId);
    if (!exists) {
      const ach = INITIAL_ACHIEVEMENTS.find(a => a.id === achId);
      if (ach) {
        db.userAchievements.push({ userId: user.id, achievementId: achId, unlockedAt: new Date().toISOString() });
        user.totalXp += ach.xpReward;
        user.gold += ach.goldReward;
        unlockedAchievements.push(ach);
      }
    }
  };

  checkAchievement('ach-first-quest', userCompletedCount >= 1);
  checkAchievement('ach-quests-10', userCompletedCount >= 10);
  checkAchievement('ach-streak-7', user.currentStreak >= 7);
  checkAchievement('ach-streak-14', user.currentStreak >= 14);
  checkAchievement('ach-level-5', user.level >= 5);
  checkAchievement('ach-level-10', user.level >= 10);
  checkAchievement('ach-level-20', user.level >= 20);

  // Category specific achievements
  const intellectQuestsCount = db.questHistory.filter(h => h.userId === user.id && h.attributeReward?.attribute === 'intellect').length;
  const strengthQuestsCount = db.questHistory.filter(h => h.userId === user.id && h.attributeReward?.attribute === 'strength').length;
  const disciplineQuestsCount = db.questHistory.filter(h => h.userId === user.id && h.attributeReward?.attribute === 'discipline').length;

  checkAchievement('ach-intellect-5', intellectQuestsCount >= 5);
  checkAchievement('ach-strength-5', strengthQuestsCount >= 5);
  checkAchievement('ach-discipline-5', disciplineQuestsCount >= 5);

  saveDb(db);

  const { passwordHash, ...userClean } = user;
  return res.json({
    quest,
    user: userClean,
    stats,
    didLevelUp,
    newLevel: user.level,
    levelData: newLevelData,
    unlockedAchievements
  });
});

// 9. Shop Catalog
app.get('/api/shop', (req, res) => {
  return res.json({ items: INITIAL_SHOP_ITEMS });
});

// 10. Buy Shop Item
app.post('/api/shop/buy', authenticateToken, (req: any, res) => {
  const { itemId } = req.body;
  const item = INITIAL_SHOP_ITEMS.find(i => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: 'Shop item not found.' });
  }

  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Check level requirement
  if (user.level < item.requiredLevel) {
    return res.status(400).json({ error: `You must be Level ${item.requiredLevel} to purchase this item.` });
  }

  // Check existing ownership
  const alreadyOwned = db.inventory.some(inv => inv.userId === user.id && inv.itemId === itemId);
  if (alreadyOwned) {
    return res.status(400).json({ error: 'You already own this item.' });
  }

  // Check Gold balance
  if (user.gold < item.price) {
    return res.status(400).json({ error: `Insufficient Gold. You need ${item.price} Gold but have ${user.gold} Gold.` });
  }

  // Deduct Gold and add to inventory
  user.gold -= item.price;
  const inventoryEntry = {
    id: 'inv-' + Date.now(),
    userId: user.id,
    itemId,
    purchasedAt: new Date().toISOString()
  };
  db.inventory.push(inventoryEntry);

  // Automatically equip newly bought item
  if (item.category === 'frames') {
    user.equippedFrame = item.id;
  } else if (item.category === 'effects') {
    user.equippedEffect = item.id;
  } else if (item.category === 'themes') {
    user.equippedTheme = item.id;
  } else if (item.category === 'nameplates') {
    user.equippedTitle = item.id;
  } else if (item.category === 'backgrounds') {
    user.equippedBackground = item.id;
  }

  // Check Cosmetic Collector Achievement
  const userOwnedItemsCount = db.inventory.filter(i => i.userId === user.id).length;
  if (userOwnedItemsCount >= 3) {
    const achId = 'ach-shop-3';
    const exists = db.userAchievements.some(ua => ua.userId === user.id && ua.achievementId === achId);
    if (!exists) {
      const ach = INITIAL_ACHIEVEMENTS.find(a => a.id === achId);
      if (ach) {
        db.userAchievements.push({ userId: user.id, achievementId: achId, unlockedAt: new Date().toISOString() });
        user.totalXp += ach.xpReward;
        user.gold += ach.goldReward;
      }
    }
  }

  saveDb(db);

  const { passwordHash, ...userClean } = user;
  return res.json({
    user: userClean,
    item,
    inventory: db.inventory.filter(i => i.userId === user.id)
  });
});

// 11. Inventory Equipment API
app.get('/api/inventory', authenticateToken, (req: any, res) => {
  const userInventory = db.inventory.filter(i => i.userId === req.user.id);
  const ownedItemIds = userInventory.map(i => i.itemId);
  const ownedItems = INITIAL_SHOP_ITEMS.filter(i => ownedItemIds.includes(i.id));

  return res.json({
    inventory: userInventory,
    items: ownedItems
  });
});

app.post('/api/inventory/equip', authenticateToken, (req: any, res) => {
  const { itemId, unequip } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const item = INITIAL_SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item not found.' });

  const ownsItem = db.inventory.some(i => i.userId === user.id && i.itemId === itemId);
  if (!ownsItem) {
    return res.status(403).json({ error: 'You do not own this item.' });
  }

  if (unequip) {
    if (item.category === 'frames' && user.equippedFrame === item.id) user.equippedFrame = undefined;
    if (item.category === 'effects' && user.equippedEffect === item.id) user.equippedEffect = undefined;
    if (item.category === 'themes' && user.equippedTheme === item.id) user.equippedTheme = 'theme-cyber';
    if (item.category === 'nameplates' && user.equippedTitle === item.id) user.equippedTitle = 'title-explorer';
    if (item.category === 'backgrounds' && user.equippedBackground === item.id) user.equippedBackground = undefined;
  } else {
    if (item.category === 'frames') {
      user.equippedFrame = item.id;
    } else if (item.category === 'effects') {
      user.equippedEffect = item.id;
    } else if (item.category === 'themes') {
      user.equippedTheme = item.id;
    } else if (item.category === 'nameplates') {
      user.equippedTitle = item.id;
    } else if (item.category === 'backgrounds') {
      user.equippedBackground = item.id;
    }
  }

  saveDb(db);
  const { passwordHash, ...userClean } = user;
  return res.json({ user: userClean });
});

// 12. Achievements API
app.get('/api/achievements', authenticateToken, (req: any, res) => {
  const userUnlocked = db.userAchievements.filter(ua => ua.userId === req.user.id);
  const unlockedIds = userUnlocked.map(u => u.achievementId);

  const achievementsList = INITIAL_ACHIEVEMENTS.map(ach => ({
    ...ach,
    unlocked: unlockedIds.includes(ach.id),
    unlockedAt: userUnlocked.find(u => u.achievementId === ach.id)?.unlockedAt
  }));

  return res.json({ achievements: achievementsList });
});

// 13. Progress & Analytics API
app.get('/api/progress', authenticateToken, (req: any, res) => {
  const history = db.questHistory.filter(h => h.userId === req.user.id);
  const userQuests = db.quests.filter(q => q.userId === req.user.id);
  const user = db.users.find(u => u.id === req.user.id);

  // Group history by date for charts
  const historyByDate: Record<string, { xp: number; gold: number; count: number }> = {};
  
  history.forEach(h => {
    const dateStr = h.completedAt.split('T')[0];
    if (!historyByDate[dateStr]) {
      historyByDate[dateStr] = { xp: 0, gold: 0, count: 0 };
    }
    historyByDate[dateStr].xp += h.xpEarned;
    historyByDate[dateStr].gold += h.goldEarned;
    historyByDate[dateStr].count += 1;
  });

  return res.json({
    history,
    historyByDate,
    stats: db.characterStats[req.user.id],
    totalCompleted: history.length,
    totalQuests: userQuests.length,
    currentStreak: user?.currentStreak || 1,
    longestStreak: user?.longestStreak || 1
  });
});

// Serve frontend assets in production or mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QUESTORA RPG Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start QUESTORA server:', err);
});
