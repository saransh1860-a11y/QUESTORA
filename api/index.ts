import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { requireAuth, type AuthenticatedRequest } from './middleware/auth';
import { progressionService } from './services/progressionService';

const app = express();

// CORS middleware for Vercel / custom domains
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json({ limit: '1mb' }));

// URL normalization for both local Express server and Vercel serverless function invocation
app.use((req, _res, next) => {
  if (!req.url.startsWith('/api') && req.originalUrl && req.originalUrl.startsWith('/api')) {
    req.url = req.originalUrl;
  }
  next();
});

// Helper to register routes on both '/api/foo' and '/foo'
function registerRoute(
  method: 'get' | 'post' | 'delete',
  endpoint: string,
  handlers: any[]
) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const apiEndpoint = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  const nonApiEndpoint = cleanEndpoint.replace(/^\/api/, '');

  (app as any)[method](apiEndpoint, ...handlers);
  if (nonApiEndpoint) {
    (app as any)[method](nonApiEndpoint, ...handlers);
  }
}

// 1. Health Check
registerRoute('get', '/api/health', [
  (_req: Request, res: Response) => {
    let hasAppletConfig = false;
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      hasAppletConfig = fs.existsSync(configPath);
    } catch {
      hasAppletConfig = false;
    }

    res.json({
      status: 'ok',
      service: 'QUESTORA Secure Backend API',
      authMethod: 'Firebase ID Token (Google OAuth)',
      securityAuthority: 'Server-Side Firebase Admin SDK',
      database: 'Firestore Transaction-Guarded Persistence',
      firestoreConfigured: hasAppletConfig,
      timestamp: new Date().toISOString()
    });
  }
]);

// 2. User Authentication & Profile
registerRoute('post', '/api/user/init', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const data = await progressionService.initOrGetUser(uid, {
        email: req.user?.email,
        name: req.user?.name
      });
      res.json(data);
    } catch (err: any) {
      console.error('user/init error:', err);
      res.status(500).json({ error: err.message || 'Failed to initialize user profile' });
    }
  }
]);

registerRoute('get', '/api/user/me', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const data = await progressionService.getUser(uid);
      res.json(data);
    } catch (err: any) {
      console.error('user/me error:', err);
      res.status(500).json({ error: err.message || 'Failed to get user profile' });
    }
  }
]);

registerRoute('post', '/api/user/onboarding', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const data = await progressionService.onboardingSetup(uid, req.body || {});
      res.json(data);
    } catch (err: any) {
      console.error('user/onboarding error:', err);
      res.status(400).json({ error: err.message || 'Failed to complete onboarding' });
    }
  }
]);

registerRoute('post', '/api/user/avatar', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const data = await progressionService.updateAvatar(uid, req.body || {});
      res.json(data);
    } catch (err: any) {
      console.error('user/avatar error:', err);
      res.status(400).json({ error: err.message || 'Failed to update avatar' });
    }
  }
]);

registerRoute('post', '/api/user/gender', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const gender = req.body?.gender;
      if (gender !== 'male' && gender !== 'female') {
        res.status(400).json({ error: 'Gender must be male or female' });
        return;
      }
      const data = await progressionService.updateGender(uid, gender);
      res.json(data);
    } catch (err: any) {
      console.error('user/gender error:', err);
      res.status(400).json({ error: err.message || 'Failed to update gender' });
    }
  }
]);

// 3. Quests
registerRoute('get', '/api/quests', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const quests = await progressionService.getQuests(uid);
      res.json({ quests });
    } catch (err: any) {
      console.error('get quests error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch quests' });
    }
  }
]);

registerRoute('post', '/api/quests', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const quest = await progressionService.createQuest(uid, req.body || {});
      res.status(201).json({ quest });
    } catch (err: any) {
      console.error('create quest error:', err);
      res.status(400).json({ error: err.message || 'Failed to create quest' });
    }
  }
]);

registerRoute('delete', '/api/quests/:id', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const questId = req.params.id;
      const success = await progressionService.deleteQuest(uid, questId);
      res.json({ success });
    } catch (err: any) {
      console.error('delete quest error:', err);
      res.status(400).json({ error: err.message || 'Failed to delete quest' });
    }
  }
]);

// 4. Secure Server-Authoritative Quest Completion
registerRoute('post', '/api/quests/complete', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { questId } = req.body || {};

      if (!questId || typeof questId !== 'string') {
        res.status(400).json({ error: 'Missing or invalid questId in completion request' });
        return;
      }

      // Progression values (XP, Gold, Level, Attributes, Streak, Achievements)
      // are calculated and validated strictly by the server. Any client-sent
      // progression overrides are completely discarded.
      const result = await progressionService.completeQuest(uid, questId);
      res.json(result);
    } catch (err: any) {
      console.error('complete quest error:', err.message || err);
      const isAlreadyCompleted = err.message?.includes('already been completed');
      const isUnauthorized = err.message?.includes('Unauthorized');
      const isNotFound = err.message?.includes('Quest not found');

      const statusCode = isUnauthorized ? 403 : (isNotFound ? 404 : 400);
      res.status(statusCode).json({
        error: err.message || 'Quest completion failed',
        alreadyCompleted: isAlreadyCompleted
      });
    }
  }
]);

// 5. Shop & Economy
registerRoute('get', '/api/shop/items', [
  (_req: Request, res: Response) => {
    const items = progressionService.getShopItems();
    res.json({ items });
  }
]);

registerRoute('post', '/api/shop/buy', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { itemId } = req.body || {};

      if (!itemId || typeof itemId !== 'string') {
        res.status(400).json({ error: 'Missing or invalid itemId in purchase request' });
        return;
      }

      // Shop prices, level requirements, ownership, and gold deduction are verified server-side
      const result = await progressionService.buyShopItem(uid, itemId);
      res.json(result);
    } catch (err: any) {
      console.error('shop purchase error:', err.message || err);
      res.status(400).json({ error: err.message || 'Shop purchase failed' });
    }
  }
]);

// 6. Inventory & Equip
registerRoute('get', '/api/inventory', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const result = await progressionService.getInventory(uid);
      res.json(result);
    } catch (err: any) {
      console.error('get inventory error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch inventory' });
    }
  }
]);

registerRoute('post', '/api/inventory/equip', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { itemId, unequip } = req.body || {};

      if (!itemId || typeof itemId !== 'string') {
        res.status(400).json({ error: 'Missing or invalid itemId in equip request' });
        return;
      }

      // Server enforces that the user genuinely owns the item before equipping
      const result = await progressionService.equipItem(uid, itemId, Boolean(unequip));
      res.json(result);
    } catch (err: any) {
      console.error('equip item error:', err.message || err);
      const isUnauthorized = err.message?.includes('Unauthorized') || err.message?.includes('do not own');
      res.status(isUnauthorized ? 403 : 400).json({ error: err.message || 'Equip item failed' });
    }
  }
]);

// 7. Achievements & Progress
registerRoute('get', '/api/achievements', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const achievements = await progressionService.getAchievements(uid);
      res.json({ achievements });
    } catch (err: any) {
      console.error('get achievements error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch achievements' });
    }
  }
]);

registerRoute('get', '/api/progress', [
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const progress = await progressionService.getProgress(uid);
      res.json(progress);
    } catch (err: any) {
      console.error('get progress error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch progress' });
    }
  }
]);

// 8. Fallback 404 handler for API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.url}`
  });
});

// 9. Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error occurred'
  });
});

export default app;
