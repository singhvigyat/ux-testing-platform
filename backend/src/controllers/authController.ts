import { Request, Response } from 'express';
import { isAuthConfigured, verifyGoogleIdToken } from '../auth/google';
import { clearSessionCookie, setSessionCookie } from '../auth/session';
import { getLimits, getQuota } from '../auth/usageStore';

export function getAuthConfig(_req: Request, res: Response): void {
  const { dailyLimit, globalDailyLimit } = getLimits();
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    configured: isAuthConfigured(),
    dailyLimit,
    globalDailyLimit,
  });
}

export function getMe(req: Request, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not signed in', code: 'UNAUTHENTICATED' });
    return;
  }

  res.json({
    user: req.user,
    quota: getQuota(req.user.id),
  });
}

export async function loginWithGoogle(req: Request, res: Response): Promise<void> {
  if (!isAuthConfigured()) {
    res.status(503).json({
      error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and SESSION_SECRET.',
      code: 'AUTH_NOT_CONFIGURED',
    });
    return;
  }

  const credential = req.body?.credential;
  if (!credential || typeof credential !== 'string') {
    res.status(400).json({ error: 'Google credential is required' });
    return;
  }

  try {
    const user = await verifyGoogleIdToken(credential);
    setSessionCookie(res, user);
    res.json({
      user,
      quota: getQuota(user.id),
    });
  } catch (error) {
    console.error('[Auth] Google verification failed:', (error as Error).message);
    res.status(401).json({ error: 'Google sign-in failed. Try again.', code: 'INVALID_TOKEN' });
  }
}

export function logout(_req: Request, res: Response): void {
  clearSessionCookie(res);
  res.json({ ok: true });
}
