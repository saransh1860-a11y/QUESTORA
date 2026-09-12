# QUESTORA — Level Up Your Real Life

> **"I am playing a game, but the game is my real life."**

QUESTORA is a full-stack, production-quality gamified real-life productivity and personal progression platform built on Role-Playing Game (RPG) mechanics.

---

## 🌟 Product Concept & Core Philosophy

Every real-life goal, habit, or task becomes a **Quest**.
- Completing quests yields **XP**, **Gold 🪙**, and **Attribute Points** (Intellect, Strength, Discipline, Wisdom, Creativity).
- **XP** drives non-linear level progression on an exponential growth curve.
- **Gold** purchases RPG cosmetics (Wearables, Frames, Aura FX, Themes, Titles, Backgrounds).
- **Performance Achievements** unlock automatically through streak maintenance and goal execution (badges are strictly earned, never purchased).
- Your virtual RPG avatar evolves visually as you accomplish real-world goals.

---

## 🚀 90-180 Second Demo Flow

1. **SIGN UP / LOG IN**: Create a character or click **⚡ Instant Demo Login**.
2. **CHARACTER CREATION**: Select an RPG Archetype (Scholar, Warrior, Engineer, Creator, Balanced) and set growth goals.
3. **MAIN DASHBOARD**: View your custom character avatar, current level (LVL 3), XP progress bar, and active quests.
4. **CREATE QUEST**: Click **+ NEW QUEST** to add a task with difficulty rating (Easy, Medium, Hard, Epic).
5. **COMPLETE QUEST**: Click **COMPLETE QUEST** to trigger the reward animation (+XP, +Gold, +Attribute gain).
6. **LEVEL UP / UNLOCK**: Experience the non-linear XP bar fill up, level up fanfare, and achievement popups!
7. **REWARD SHOP**: Open the Reward Shop, select a cosmetic item (e.g., Cyberpunk Visor, Aura Crown, Flame FX), click **TRY ON** for real-time live avatar preview, and purchase with Gold.
8. **ARMORY / INVENTORY**: Equip or unequip cosmetics in your inventory.
9. **PERSISTENCE PROOF**: Refresh the browser page or log out/in — all progression, XP, Gold, streak, and inventory persist in the database.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Web Audio API Synthesizer, Canvas Confetti.
- **Backend**: Express REST Server running full-stack on Node.js / Vite middleware mode.
- **Database & Persistence**: Persistent Relational JSON/Disk database store in `./data/db.json` with atomic file transactions.
- **Authentication**: JWT session tokens + bcrypt password hashing.

---

## 🗄️ Relational Database Schema

- `Users`: id, email, passwordHash, username, characterClass, level, totalXp, gold, currentStreak, longestStreak, equippedCosmetics, createdAt.
- `CharacterStats`: userId, intellect, strength, discipline, wisdom, creativity.
- `Quests`: id, userId, title, description, category, difficulty, type, frequency, xpReward, goldReward, attributeReward, completed, createdAt.
- `QuestHistory`: id, userId, questId, questTitle, category, xpEarned, goldEarned, attributeReward, completedAt.
- `Achievements`: id, name, description, icon, requirement, xpReward, goldReward.
- `UserAchievements`: userId, achievementId, unlockedAt.
- `ShopItems`: id, name, description, category, price, requiredLevel, icon, slot.
- `Inventory`: id, userId, itemId, purchasedAt.

---

## ⚡ Local Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/questora/questora.git
cd questora

# 2. Install dependencies
npm install

# 3. Start development server (serves Express API + Vite on port 3000)
npm run dev

# 4. Open in browser
http://localhost:3000
```

---

## 🔒 Security & Anti-Cheating

- All progression math (XP calculation, level thresholds, Gold rewards, item prices, level lock requirements, streak counters) is computed and validated **server-side**.
- Badges and achievements cannot be purchased or altered client-side.
