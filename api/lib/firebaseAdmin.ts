import admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import fs from 'node:fs';
import path from 'node:path';
import fallbackAppletConfig from '../../firebase-applet-config.json';

function formatPrivateKey(rawKey?: string): string | undefined {
  if (!rawKey) return undefined;
  let key = rawKey.trim();
  // Strip surrounding quotes if wrapped
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.substring(1, key.length - 1);
  }
  // Replace literal \n or escaped newlines with actual newline characters
  key = key.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
  return key;
}

function initializeFirebaseAdmin(): { app: admin.app.App; auth: Auth; db: Firestore } {
  let app: admin.app.App;

  if (admin.apps.length > 0 && admin.apps[0]) {
    app = admin.apps[0];
  } else {
    let projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = formatPrivateKey(rawPrivateKey);

    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!projectId && config.projectId) {
          projectId = config.projectId;
        }
      }
    } catch {
      // Fallback to static imported config
      if (!projectId && fallbackAppletConfig?.projectId) {
        projectId = fallbackAppletConfig.projectId;
      }
    }

    const targetProjectId = projectId || fallbackAppletConfig?.projectId || 'gen-lang-client-0847187407';

    if (clientEmail && privateKey) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: targetProjectId,
          clientEmail,
          privateKey
        }),
        projectId: targetProjectId
      });
    } else {
      // Cloud Run / Google Cloud containers use Application Default Credentials (ADC)
      app = admin.initializeApp({
        projectId: targetProjectId
      });
    }
  }

  let databaseId = process.env.FIRESTORE_DATABASE_ID;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!databaseId && config.firestoreDatabaseId) {
        databaseId = config.firestoreDatabaseId;
      }
    }
  } catch {
    if (!databaseId && (fallbackAppletConfig as any)?.firestoreDatabaseId) {
      databaseId = (fallbackAppletConfig as any).firestoreDatabaseId;
    }
  }

  const auth = getAuth(app);
  const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

  return { app, auth, db };
}

const { app: adminApp, auth: adminAuth, db: adminDb } = initializeFirebaseAdmin();

export { adminApp, adminAuth, adminDb };
