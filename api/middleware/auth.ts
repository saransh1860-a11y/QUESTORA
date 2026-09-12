import { type Request, type Response, type NextFunction } from 'express';
import { adminAuth } from '../lib/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    token: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header. Expected Bearer <Firebase_ID_Token>'
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized: Empty token provided'
    });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken || !decodedToken.uid) {
      res.status(401).json({
        error: 'Unauthorized: Token did not contain a valid UID'
      });
      return;
    }

    // Attach server-verified UID and token
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      token
    };

    next();
  } catch (err: any) {
    console.error('Firebase token verification failed:', err.message || err);
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token. Please re-authenticate with Google.'
    });
  }
}
