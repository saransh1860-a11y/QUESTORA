# QUESTORA — Level Up Your Real Life

> **Your life. Your quest. Your character.**

QUESTORA turns real-life goals, habits, and tasks into RPG quests. Complete quests to earn XP, Gold, attributes, streaks, achievements, and cosmetic progression.

## Core loop

**Real-world action → Quest → XP + Gold → Attributes → Level → Cosmetics → visible progress**

Badges and achievements are earned through performance and are never purchasable.

## Demo flow

1. Continue with Google.
2. Create your character and choose goals.
3. Create a quest.
4. Complete it and watch XP, Gold, attributes, streaks, and achievement feedback update.
5. Open Rewards and preview/buy cosmetics.
6. Equip an item.
7. Refresh the page and sign in again to prove Firestore persistence.

## Technology stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Motion, Web Audio API, Canvas Confetti.
- **Authentication:** Firebase Authentication with **Google OAuth only**.
- **Backend:** Express API, deployable as a Vercel serverless function and runnable locally through `server-v2.ts`.
- **Database:** Firebase Firestore. No JSON/disk database is used as application persistence.
- **Server security:** Firebase Admin SDK verifies Firebase ID tokens. The server derives the user ID from the verified token; the client cannot choose another user's UID.
- **Progression security:** XP, Gold, level calculations, streaks, achievements, inventory ownership, level gates, and shop prices are validated server-side.

## Firestore data model

- `users/{uid}` — account, character, progression, streak, equipped cosmetics.
- `stats/{uid}` — Intellect, Strength, Discipline, Wisdom, Creativity.
- `quests/{questId}` — user-owned quest records.
- `questHistory/{historyId}` — immutable progression history.
- `userAchievements/{uid_achievementId}` — earned achievement records.
- `inventory/{uid_itemId}` — owned cosmetic records.

Quest completion and shop purchases use Firestore transactions so the economy cannot be updated by a stale client state.

## Local setup

```bash
git clone https://github.com/saransh1860-a11y/QUESTORA.git
cd QUESTORA
npm install
npm run dev
```

The local development server runs the Vite frontend and Firestore-backed API together.

## Environment variables

Copy `.env.example` and configure the Firebase Admin credentials for the API. Never commit a real Firebase private key.

The Firebase web configuration used by the client must have Google sign-in enabled and Firestore provisioned in the Firebase console.

## Vercel deployment

- Build command: `npm run build`
- Output directory: `dist`
- API: `api/[[...path]].ts`
- Runtime: Node.js 20
- Required server environment variables: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

After deployment, verify this complete flow on the production URL:

**Google login → create quest → complete quest → XP/Gold/attribute update → reward purchase → refresh → login again → persistence confirmed.**

## Accessibility and UX

QUESTORA uses semantic controls, visible focus states, labelled inputs, responsive layouts, reduced-motion considerations, and immediate feedback for quest completion and progression.

## Security checklist

- Google OAuth only.
- Firebase ID tokens verified server-side.
- No JWT session storage.
- No email/password authentication.
- No client-trusted UID for protected operations.
- No localStorage/db.json as the primary database.
- User-owned records are scoped by verified UID.
- Progression and economy are calculated server-side.
- Purchases reject insufficient Gold, locked items, and duplicate ownership.
