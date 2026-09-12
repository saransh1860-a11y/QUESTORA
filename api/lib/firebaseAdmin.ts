import admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import fs from 'node:fs';
import path from 'node:path';

function initializeFirebaseAdmin(): { app: admin.app.App; auth: Auth; db: Firestore } {
  let app: admin.app.App;

  if (admin.apps.length > 0 && admin.apps[0]) {
    app = admin.apps[0];
  } else {
    let projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!projectId && config.projectId) {
          projectId = config.projectId;
        }
      }
    } catch (err) {
      console.warn('Could not read firebase-applet-config.json:', err);
    }

    if (clientEmail && privateKey) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId || 'gen-lang-client-0847187407',
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n')
        }),
        projectId: projectId || 'gen-lang-client-0847187407'
      });
    } else {
      // In Google Cloud Run / Container environments, ADC credentials are automatically used
      app = admin.initializeApp({
        projectId: projectId || 'gen-lang-client-0847187407'
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
    // fallback
  }

  const auth = getAuth(app);
  const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

  return { app, auth, db };
}

const { app: adminApp, auth: adminAuth, db: adminDb } = initializeFirebaseAdmin();

export { adminApp, adminAuth, adminDb };
