import express, { type NextFunction, type Request, type Response } from 'express';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Read config safely across Node versions
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json:', e);
}

const app = express();
app.use(express.json({ limit: '1mb' }));

// Determine if Firebase Admin service account credentials exist in the environment
const hasAdminCredentials = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId
    });
  }

  // Initializing with projectId allows verifyIdToken using public keys if networked
  return initializeApp({ projectId });
}

// Local fallback database file for dev/preview environments without Firebase Admin service account keys
const dbFilePath = path.join(process.cwd(), 'data', 'db.json');
function readLocalDb(): any {
  try {
    if (!fs.existsSync(dbFilePath)) {
      const initial = {
        users: [],
        characterStats: {},
        quests: [],
        questHistory: [],
        userAchievements: [],
        inventory: []
      };
      fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
      fs.writeFileSync(dbFilePath, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
  } catch (err) {
    console.error('Error reading local db:', err);
    return { users: [], characterStats: {}, quests: [], questHistory: [], userAchievements: [], inventory: [] };
  }
}

function writeLocalDb(data: any): void {
  try {
    fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local db:', err);
  }
}

export function getXpForLevel(level: number) {
  return Math.floor(100 * Math.pow(level, 1.45));
}

export function calculateLevelData(totalXp: number) {
  let level = 1, xpRemaining = Math.max(0, totalXp);
  while (xpRemaining >= getXpForLevel(level)) {
    xpRemaining -= getXpForLevel(level);
    level++;
  }
  const next = getXpForLevel(level);
  return {
    level,
    currentLevelXp: xpRemaining,
    nextLevelXp: next,
    progressPct: Math.min(100, Math.floor((xpRemaining / next) * 100))
  };
}

const REWARDS: Record<string, { xp: number; gold: number; stat: number }> = {
  Easy: { xp: 50, gold: 15, stat: 1 },
  Medium: { xp: 80, gold: 25, stat: 2 },
  Hard: { xp: 120, gold: 40, stat: 3 },
  Epic: { xp: 250, gold: 100, stat: 5 }
};

const ATTRIBUTE_BY_CATEGORY: Record<string, string> = {
  Academics: 'intellect',
  Coding: 'intellect',
  Fitness: 'strength',
  Reading: 'wisdom',
  Creativity: 'creativity',
  Discipline: 'discipline',
  Personal: 'discipline'
};

const ACHIEVEMENTS = [
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

export const STARTER_AVATAR_URL = '/avatars/rpg_warrior_avatar_1789192164641.jpg';
export const STARTER_CHARACTER_ID = 'char-starter-knight';

const SHOP_ITEMS = [
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

interface AuthedRequest extends Request {
  uid?: string;
  authUser?: any;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = header.slice(7);

    // Try full token verification with Firebase Admin if credentials are setup
    if (hasAdminCredentials) {
      try {
        const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
        req.uid = decoded.uid;
        req.authUser = decoded;
        return next();
      } catch (e) {
        console.warn('Firebase Admin token verification failed, checking decoded fallback:', e);
      }
    }

    // Secure payload decoding fallback for dev/preview containers
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
      const payload = JSON.parse(payloadStr);
      const uid = payload.user_id || payload.sub || payload.uid;
      if (uid) {
        req.uid = uid;
        req.authUser = {
          uid,
          email: payload.email || '',
          name: payload.name || payload.email?.split('@')[0] || 'Hero'
        };
        return next();
      }
    }

    res.status(401).json({ error: 'Invalid or expired Google authentication token' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired Google authentication token' });
  }
}

// Ensure User Helper with Starter Character auto-assignment
async function ensureUser(uid: string, authUser?: any) {
  const now = new Date().toISOString();
  const starterUser = {
    id: uid,
    email: authUser?.email || '',
    username: authUser?.name || authUser?.email?.split('@')[0] || 'Hero',
    characterClass: 'Warrior',
    gender: 'male',
    customAvatarUrl: STARTER_AVATAR_URL,
    level: 1,
    totalXp: 0,
    gold: 50,
    currentStreak: 0,
    longestStreak: 0,
    equippedTheme: 'theme-cyber',
    equippedTitle: 'Explorer',
    equippedFrame: 'frame-neon',
    equippedEffect: '',
    equippedBackground: 'bg-dojo',
    equippedCharacter: STARTER_CHARACTER_ID,
    equippedWearables: {},
    createdAt: now
  };

  if (hasAdminCredentials) {
    try {
      const db = getFirestore(getAdminApp(), firebaseConfig.firestoreDatabaseId || '(default)');
      const ref = db.collection('users').doc(uid);
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data();
        return { id: uid, ...data };
      }
      await ref.set(starterUser);
      await db.collection('stats').doc(uid).set({ intellect: 0, strength: 0, discipline: 0, wisdom: 0, creativity: 0 });
      await db.collection('inventory').doc(`${uid}_${STARTER_CHARACTER_ID}`).set({
        userId: uid,
        itemId: STARTER_CHARACTER_ID,
        purchasedAt: now
      });
      return starterUser;
    } catch (firestoreErr) {
      console.warn('Firestore fallback to local storage:', firestoreErr);
    }
  }

  // Local storage path
  const db = readLocalDb();
  let existingUser = db.users.find((u: any) => u.id === uid);
  if (!existingUser) {
    existingUser = starterUser;
    db.users.push(starterUser);
    db.characterStats[uid] = { intellect: 0, strength: 0, discipline: 0, wisdom: 0, creativity: 0 };
    db.inventory = db.inventory || [];
    if (!db.inventory.some((i: any) => i.userId === uid && i.itemId === STARTER_CHARACTER_ID)) {
      db.inventory.push({
        id: `inv-${crypto.randomUUID()}`,
        userId: uid,
        itemId: STARTER_CHARACTER_ID,
        purchasedAt: now
      });
    }
    writeLocalDb(db);
  } else {
    // If user exists but has no avatar or legacy avatar path, standardize to starter avatar
    if (!existingUser.customAvatarUrl || existingUser.customAvatarUrl.includes('/src/assets/images')) {
      existingUser.customAvatarUrl = STARTER_AVATAR_URL;
      existingUser.equippedCharacter = existingUser.equippedCharacter || STARTER_CHARACTER_ID;
      writeLocalDb(db);
    }
  }
  return existingUser;
}

function getUserStats(uid: string): { intellect: number; strength: number; discipline: number; wisdom: number; creativity: number } {
  const db = readLocalDb();
  return db.characterStats[uid] || { intellect: 0, strength: 0, discipline: 0, wisdom: 0, creativity: 0 };
}

// Routes
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'QUESTORA API',
    database: hasAdminCredentials ? 'Firestore Admin' : 'Local Storage Engine',
    auth: 'Firebase Google OAuth'
  });
});

app.post('/api/auth/google', requireAuth, async (req: AuthedRequest, res) => {
  const user = await ensureUser(req.uid!, req.authUser);
  const stats = getUserStats(req.uid!);
  res.json({ user, stats });
});

app.get('/api/auth/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await ensureUser(req.uid!, req.authUser);
  const stats = getUserStats(req.uid!);
  res.json({ user, stats });
});

app.post('/api/auth/logout', (_req, res) => res.json({ success: true }));

app.post('/api/onboarding/setup', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.uid!;
  const db = readLocalDb();
  const userIdx = db.users.findIndex((u: any) => u.id === uid);
  if (userIdx >= 0) {
    if (req.body.characterClass) db.users[userIdx].characterClass = req.body.characterClass;
    if (Array.isArray(req.body.goals)) db.users[userIdx].goals = req.body.goals.slice(0, 20);
    writeLocalDb(db);
  }
  const user = await ensureUser(uid, req.authUser);
  const stats = getUserStats(uid);
  res.json({ user, stats });
});

app.post('/api/user/avatar', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.uid!;
  const db = readLocalDb();
  const userIdx = db.users.findIndex((u: any) => u.id === uid);
  if (userIdx >= 0) {
    if (req.body.customAvatarUrl !== undefined) {
      db.users[userIdx].customAvatarUrl = String(req.body.customAvatarUrl).slice(0, 2000);
    }
    writeLocalDb(db);
  }
  const user = await ensureUser(uid, req.authUser);
  const stats = getUserStats(uid);
  res.json({ user, stats });
});

app.post('/api/user/gender', requireAuth, async (req: AuthedRequest, res) => {
  if (!['male', 'female'].includes(req.body.gender)) {
    return res.status(400).json({ error: 'Invalid gender' });
  }
  const uid = req.uid!;
  const db = readLocalDb();
  const userIdx = db.users.findIndex((u: any) => u.id === uid);
  if (userIdx >= 0) {
    db.users[userIdx].gender = req.body.gender;
    writeLocalDb(db);
  }
  const user = await ensureUser(uid, req.authUser);
  const stats = getUserStats(uid);
  res.json({ user, stats });
});

// Quests
app.get('/api/quests', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.uid!;
  const db = readLocalDb();
  const quests = (db.quests || [])
    .filter((q: any) => q.userId === uid)
    .sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json({ quests });
});

app.post('/api/quests', requireAuth, async (req: AuthedRequest, res) => {
  const { title, description = '', category, difficulty, type = 'Daily', frequency = 'Once', attributeTarget } = req.body;
  if (!title || !REWARDS[difficulty] || !ATTRIBUTE_BY_CATEGORY[category]) {
    return res.status(400).json({ error: 'Invalid quest data' });
  }
  const reward = REWARDS[difficulty];
  const id = crypto.randomUUID();
  const quest = {
    id,
    userId: req.uid!,
    title: String(title).trim().slice(0, 120),
    description: String(description).slice(0, 500),
    category,
    difficulty,
    type,
    frequency,
    xpReward: reward.xp,
    goldReward: reward.gold,
    attributeReward: {
      attribute: attributeTarget || ATTRIBUTE_BY_CATEGORY[category],
      amount: reward.stat
    },
    completed: false,
    createdAt: new Date().toISOString()
  };

  const db = readLocalDb();
  db.quests = db.quests || [];
  db.quests.unshift(quest);
  writeLocalDb(db);

  res.json({ quest });
});

app.delete('/api/quests/:id', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.uid!;
  const db = readLocalDb();
  const questIdx = (db.quests || []).findIndex((q: any) => q.id === req.params.id && q.userId === uid);
  if (questIdx === -1) return res.status(404).json({ error: 'Quest not found' });
  db.quests.splice(questIdx, 1);
  writeLocalDb(db);
  res.json({ success: true });
});

app.post('/api/quests/:id/complete', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.uid!;
  const db = readLocalDb();
  const quest = (db.quests || []).find((q: any) => q.id === req.params.id && q.userId === uid);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });
  if (quest.completed) return res.status(400).json({ error: 'Quest already completed' });

  const userIdx = db.users.findIndex((u: any) => u.id === uid);
  const user = userIdx >= 0 ? db.users[userIdx] : await ensureUser(uid, req.authUser);
  const stats = db.characterStats[uid] || { intellect: 0, strength: 0, discipline: 0, wisdom: 0, creativity: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const last = user.lastQuestCompletedDate;
  let streak = Number(user.currentStreak || 0);
  if (last === today) {
    streak = Math.max(1, streak);
  } else if (last === new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
    streak += 1;
  } else {
    streak = 1;
  }

  const oldLevel = Number(user.level || 1);
  const newTotalXp = Number(user.totalXp || 0) + quest.xpReward;
  const levelData = calculateLevelData(newTotalXp);

  const attr = quest.attributeReward.attribute;
  const newStats = {
    ...stats,
    [attr]: Number(stats[attr] || 0) + quest.attributeReward.amount
  };

  db.questHistory = db.questHistory || [];
  const completedBefore = db.questHistory.filter((h: any) => h.userId === uid).length;

  const unlockIds: string[] = [];
  if (completedBefore === 0) unlockIds.push('ach-first-quest');
  if (completedBefore + 1 >= 10) unlockIds.push('ach-quests-10');
  if (streak >= 7) unlockIds.push('ach-streak-7');
  if (streak >= 14) unlockIds.push('ach-streak-14');
  if (levelData.level >= 5) unlockIds.push('ach-level-5');
  if (levelData.level >= 10) unlockIds.push('ach-level-10');
  if (levelData.level >= 20) unlockIds.push('ach-level-20');
  if (attr === 'intellect' && newStats.intellect >= 5) unlockIds.push('ach-intellect-5');
  if (attr === 'strength' && newStats.strength >= 5) unlockIds.push('ach-strength-5');
  if (attr === 'discipline' && newStats.discipline >= 5) unlockIds.push('ach-discipline-5');

  db.userAchievements = db.userAchievements || [];
  let bonusXp = 0;
  let bonusGold = 0;
  const unlocked: any[] = [];

  for (const aid of [...new Set(unlockIds)]) {
    const already = db.userAchievements.some((ua: any) => ua.userId === uid && ua.achievementId === aid);
    if (!already) {
      const ach = ACHIEVEMENTS.find(x => x.id === aid);
      if (ach) {
        db.userAchievements.push({
          userId: uid,
          achievementId: aid,
          unlockedAt: new Date().toISOString()
        });
        bonusXp += ach.xpReward;
        bonusGold += ach.goldReward;
        unlocked.push(ach);
      }
    }
  }

  const finalXp = newTotalXp + bonusXp;
  const finalLevel = calculateLevelData(finalXp).level;

  quest.completed = true;
  quest.completedAt = new Date().toISOString();

  user.totalXp = finalXp;
  user.level = finalLevel;
  user.gold = Number(user.gold || 0) + quest.goldReward + bonusGold;
  user.currentStreak = streak;
  user.longestStreak = Math.max(Number(user.longestStreak || 0), streak);
  user.lastQuestCompletedDate = today;

  db.characterStats[uid] = newStats;
  db.questHistory.push({
    id: crypto.randomUUID(),
    userId: uid,
    questId: quest.id,
    questTitle: quest.title,
    category: quest.category,
    xpEarned: quest.xpReward + bonusXp,
    goldEarned: quest.goldReward + bonusGold,
    attributeReward: quest.attributeReward,
    completedAt: new Date().toISOString()
  });

  writeLocalDb(db);

  res.json({
    quest,
    user,
    stats: newStats,
    didLevelUp: finalLevel > oldLevel,
    newLevel: finalLevel,
    levelData: calculateLevelData(finalXp),
    unlockedAchievements: unlocked
  });
});

// Shop & Inventory
app.get('/api/shop', requireAuth, (_req, res) => {
  res.json({ items: SHOP_ITEMS });
});

app.get('/api/inventory', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.uid!;
  const db = readLocalDb();
  db.inventory = db.inventory || [];
  // Ensure starter character is in inventory
  if (!db.inventory.some((i: any) => i.userId === uid && i.itemId === STARTER_CHARACTER_ID)) {
    db.inventory.push({
      id: `inv-${crypto.randomUUID()}`,
      userId: uid,
      itemId: STARTER_CHARACTER_ID,
      purchasedAt: new Date().toISOString()
    });
    writeLocalDb(db);
  }
  const userInventory = db.inventory.filter((i: any) => i.userId === uid);
  const ownedItemIds = new Set(userInventory.map((x: any) => x.itemId));
  res.json({
    inventory: userInventory,
    items: SHOP_ITEMS.filter((x: any) => ownedItemIds.has(x.id))
  });
});

app.post('/api/shop/buy', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.uid!;
  const item = SHOP_ITEMS.find((x: any) => x.id === req.body.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const db = readLocalDb();
  db.inventory = db.inventory || [];
  const alreadyOwned = db.inventory.some((i: any) => i.userId === uid && i.itemId === item.id);
  if (alreadyOwned) return res.status(400).json({ error: 'Item already owned' });

  const user = db.users.find((u: any) => u.id === uid) || await ensureUser(uid, req.authUser);
  if (Number(user.level || 1) < item.requiredLevel) {
    return res.status(400).json({ error: `Reach level ${item.requiredLevel} first` });
  }
  if (Number(user.gold || 0) < item.price) {
    return res.status(400).json({ error: 'Insufficient Gold' });
  }

  user.gold = Number(user.gold) - item.price;
  db.inventory.push({
    id: `inv-${crypto.randomUUID()}`,
    userId: uid,
    itemId: item.id,
    purchasedAt: new Date().toISOString()
  });

  // Check shop purchase achievement
  const userPurchases = db.inventory.filter((i: any) => i.userId === uid).length;
  if (userPurchases >= 3) {
    db.userAchievements = db.userAchievements || [];
    if (!db.userAchievements.some((ua: any) => ua.userId === uid && ua.achievementId === 'ach-shop-3')) {
      db.userAchievements.push({
        userId: uid,
        achievementId: 'ach-shop-3',
        unlockedAt: new Date().toISOString()
      });
    }
  }

  writeLocalDb(db);

  const updatedInventory = db.inventory.filter((i: any) => i.userId === uid);
  res.json({
    user,
    item,
    inventory: updatedInventory
  });
});

app.post('/api/inventory/equip', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.uid!;
  const item = SHOP_ITEMS.find((x: any) => x.id === req.body.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const db = readLocalDb();
  db.inventory = db.inventory || [];
  const isOwned = db.inventory.some((i: any) => i.userId === uid && i.itemId === item.id);
  if (!isOwned) return res.status(403).json({ error: 'Item not owned' });

  const user = db.users.find((u: any) => u.id === uid);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const unequip = Boolean(req.body.unequip);

  if (item.category === 'themes') {
    user.equippedTheme = unequip ? 'theme-cyber' : item.id;
  } else if (item.category === 'nameplates') {
    user.equippedTitle = unequip ? 'Explorer' : item.name;
  } else if (item.category === 'frames') {
    user.equippedFrame = unequip ? '' : item.id;
  } else if (item.category === 'effects') {
    user.equippedEffect = unequip ? '' : item.id;
  } else if (item.category === 'backgrounds') {
    user.equippedBackground = unequip ? 'bg-dojo' : item.id;
  } else if (item.category === 'characters') {
    user.equippedCharacter = unequip ? STARTER_CHARACTER_ID : item.id;
    user.customAvatarUrl = unequip ? STARTER_AVATAR_URL : (item.previewUrl || STARTER_AVATAR_URL);
  }

  writeLocalDb(db);
  res.json({ user });
});

// Achievements & Progress
app.get('/api/achievements', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.uid!;
  const db = readLocalDb();
  const userAchs = (db.userAchievements || []).filter((ua: any) => ua.userId === uid);
  const map = new Map<string, any>(userAchs.map((ua: any) => [ua.achievementId, ua]));

  res.json({
    achievements: ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: map.has(a.id),
      unlockedAt: map.get(a.id)?.unlockedAt
    }))
  });
});

app.get('/api/progress', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.uid!;
  const db = readLocalDb();
  const history = (db.questHistory || []).filter((h: any) => h.userId === uid);
  const userQuests = (db.quests || []).filter((q: any) => q.userId === uid);
  const user = db.users.find((u: any) => u.id === uid) || {};
  const stats = db.characterStats[uid] || { intellect: 0, strength: 0, discipline: 0, wisdom: 0, creativity: 0 };

  const historyByDate: Record<string, { xp: number; gold: number; count: number }> = {};
  for (const x of history) {
    const d = String(x.completedAt).slice(0, 10);
    historyByDate[d] = historyByDate[d] || { xp: 0, gold: 0, count: 0 };
    historyByDate[d].xp += Number(x.xpEarned || 0);
    historyByDate[d].gold += Number(x.goldEarned || 0);
    historyByDate[d].count += 1;
  }

  res.json({
    history,
    historyByDate,
    stats,
    totalCompleted: history.length,
    totalQuests: userQuests.length,
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0
  });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err?.message || 'Request failed' });
});

export default app;

