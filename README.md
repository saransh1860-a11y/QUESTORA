# QUESTORA — Level Up Your Real Life

> **Your life. Your quest. Your character.**

QUESTORA transforms real-life personal goals, habits, and tasks into an immersive RPG progression experience. Complete real-world quests to earn XP, Gold, character attributes, calendar streaks, achievements, and cosmetic progression.

---

## Core Progression Loop

**Real-world Action → Verified Quest → XP + Gold → Attribute Growth → Level Up → Cosmetics → Visible Proof**

- **XP & Level:** Exponential progression curve calculated server-side; Level thresholds cannot be forged.
- **Gold & Economy:** Transaction-guarded currency; client balance and prices are validated strictly on the server.
- **Attributes:** Intellect, Strength, Discipline, Wisdom, and Creativity grow based on quest category.
- **Date-Based Streaks:** Streaks advance strictly on consecutive calendar days; completing multiple tasks in a single day does not falsely inflate the streak count.
- **Achievements & Badges:** Earned through genuine milestones; never purchasable.

---

## Anti-Cheat & Security Architecture

QUESTORA enforces a strict **Zero-Client-Trust** architecture:

```
[ Browser / Client ]
      │
      │  1. Signs in via Google OAuth
      │  2. Obtains Firebase ID Token (JWT signed by Google)
      │  3. Submits only intent (e.g. { questId } or { itemId })
      ▼  with "Authorization: Bearer <idToken>"
[ Vercel API / Express Backend ]
      │
      │  4. Verifies ID Token using Firebase Admin SDK
      │  5. Derives UID from verified token (rejects client-supplied UID)
      │  6. Validates quest ownership, level gates, and gold balances
      │  7. Calculates XP, Gold, Level, Attributes, Streaks, Achievements server-side
      ▼  8. Runs atomic Firestore transaction
[ Cloud Firestore Database ]
      │
      └── Firestore Security Rules enforce: direct client writes DENIED (allow write: if false;)
          Mutations occur exclusively through the trusted Firebase Admin SDK.
```

### Critical Security Guarantees:
1. **Never Trust Client for Progression:** The client never specifies XP rewards, Gold amounts, current Level, or Attribute gains. Any client-sent values are completely discarded.
2. **Never Trust Client for Economy:** Shop item prices, item ownership, and Level requirements are enforced within atomic server transactions (`adminDb.runTransaction`).
3. **Double Completion Prevention:** Quests cannot be completed twice; completed quests immediately reject subsequent completion attempts.
4. **Ownership Verification:** Users can only view and interact with their own quests, history, inventory, and profile.
5. **Direct Client Write Lockdown:** Firestore Security Rules deny direct client-side writes to `users`, `stats`, `quests`, `inventory`, `questHistory`, and `userAchievements`. All writes must pass through the verified backend API.

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti, Web Audio API sound generator.
- **Authentication:** Firebase Authentication with **Google OAuth only**. No email/password, no custom JWT tokens.
- **Backend API:** Node.js Express server running locally with Vite middleware and deployable as a serverless function on Vercel (`api/[[...path]].ts`).
- **Database:** Google Cloud Firestore (multi-region / named database instance).
- **Admin SDK:** `firebase-admin` for server-side token verification and transaction-guarded database mutations.
- **Zero Mock Policy:** No `db.json`, no mock database, no simulated storage. All data is persisted directly in Firestore.

---

## Firestore Data Schema

| Collection | Document ID | Read Rule | Write Rule | Description |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `{uid}` | Owner only (`request.auth.uid == userId`) | `false` (Server Admin only) | User profile, total XP, level, gold, streak, equipped items |
| `stats` | `{uid}` | Owner only (`request.auth.uid == userId`) | `false` (Server Admin only) | Character attributes (intellect, strength, discipline, etc.) |
| `quests` | `{questId}` | Owner only (`resource.data.userId == uid`) | `false` (Server Admin only) | User quests with difficulty, category, and rewards |
| `inventory` | `inv_{uid}_{itemId}` | Owner only (`resource.data.userId == uid`) | `false` (Server Admin only) | Purchased cosmetic items |
| `questHistory`| `{historyId}` | Owner only (`resource.data.userId == uid`) | `false` (Server Admin only) | Immutable completion log with timestamp and earnings |
| `userAchievements` | `ach_{uid}_{id}` | Owner only (`resource.data.userId == uid`) | `false` (Server Admin only) | Unlocked milestone achievements |

---

## API Endpoints

All protected endpoints require an `Authorization: Bearer <Firebase_ID_Token>` header.

### User & Onboarding
- `POST /api/user/init` — Initializes or fetches user profile from verified ID token.
- `GET /api/user/me` — Retrieves current user profile and stats.
- `POST /api/user/onboarding` — Sets initial character class and personal goals.
- `POST /api/user/avatar` — Updates character avatar URL.
- `POST /api/user/gender` — Updates character gender.

### Quests & Progression
- `GET /api/quests` — Fetches active quests for the verified user.
- `POST /api/quests` — Creates a new quest (server assigns rewards based on difficulty).
- `DELETE /api/quests/:id` — Deletes an owned quest.
- `POST /api/quests/complete` — **Atomic Transaction:** Validates ownership, checks completed status, calculates XP, Gold, attributes, date-based streak, and unlocks achievements.

### Shop & Inventory
- `GET /api/shop/items` — Returns catalogue of cosmetics, prices, and level requirements.
- `POST /api/shop/buy` — **Atomic Transaction:** Verifies level requirement, checks gold balance, prevents duplicate purchase, deducts gold, and adds item to inventory.
- `GET /api/inventory` — Retrieves owned inventory items.
- `POST /api/inventory/equip` — Verifies item ownership and equips the cosmetic.

### Achievements & History
- `GET /api/achievements` — Returns all achievements with user unlock status.
- `GET /api/progress` — Returns historical completion metrics, date distribution, and stats.

---

## Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/saransh1860-a11y/QUESTORA.git
cd QUESTORA
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set the following variables:
```env
# Optional Gemini API Key
GEMINI_API_KEY=

# Firebase Admin Credentials (from Firebase Console -> Project Settings -> Service Accounts)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIRESTORE_DATABASE_ID=(default)
```

### 3. Run Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`. The server runs Vite middleware for frontend development and Express for the `/api/*` endpoints simultaneously.

---

## Vercel Deployment

1. **Push to GitHub:**
   Ensure all changes are committed and pushed to your repository.

2. **Connect Project to Vercel:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Serverless Functions: `api/[[...path]].ts` (Node.js 20.x runtime)

3. **Set Environment Variables on Vercel:**
   In your Vercel Project Dashboard -> **Settings** -> **Environment Variables**, add:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (Paste the private key string including header and footer)
   - `FIRESTORE_DATABASE_ID` (If using a named database, e.g. `ai-studio-questora-...`, otherwise leave blank for default)

4. **Deploy:**
   Click **Deploy**. Vercel will bundle the client into `dist` and compile the API into serverless functions routed via `vercel.json`.

---

## Verification Checklist

- [x] **Google Login:** Authenticates exclusively via Google OAuth popup using Firebase Auth.
- [x] **ID Token Forwarding:** Client automatically transmits the Firebase ID token in `Authorization: Bearer <token>` on all requests.
- [x] **Server Token Verification:** Express middleware verifies token signature via Firebase Admin SDK and injects verified `req.user.uid`.
- [x] **Zero Client Authority:** Client cannot forge XP, Gold, Level, Streak, or Attributes.
- [x] **Atomic Quest Completion:** Uses `adminDb.runTransaction` so all updates (quest, profile, stats, streak, achievements) succeed or fail together.
- [x] **Double Completion Blocked:** Quests already marked `completed: true` are rejected.
- [x] **Atomic Shop Purchases:** Level requirements, Gold deduction, and duplicate ownership prevention verified server-side.
- [x] **Date-Based Streaks:** Streaks only advance on distinct consecutive calendar days.
- [x] **Direct Write Lockdown:** Client cannot bypass API to mutate Firestore documents.
- [x] **Cross-Session Persistence:** Refreshing the page or logging in from another device retains exact user progression.
