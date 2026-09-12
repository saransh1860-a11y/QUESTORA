import express, { type Request, type Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';

const router = express.Router();
router.use(express.json({ limit: '1mb' }));

// Health check endpoint
router.get('/api/health', (_req: Request, res: Response) => {
  let hasAppletConfig = false;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    hasAppletConfig = fs.existsSync(configPath);
  } catch {
    hasAppletConfig = false;
  }

  res.json({
    status: 'ok',
    service: 'Questora Backend',
    database: 'Firestore (Client-Native Authenticated Access)',
    firestoreConfigured: hasAppletConfig,
    timestamp: new Date().toISOString()
  });
});

export default router;
