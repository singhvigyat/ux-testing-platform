import { NextFunction, Request, Response } from 'express';
import { isAuthConfigured } from '../auth/google';
import { readSession } from '../auth/session';

export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  req.user = readSession(req) || undefined;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthConfigured()) {
    res.status(503).json({
      error: 'Google sign-in is not configured on the server.',
      code: 'AUTH_NOT_CONFIGURED',
    });
    return;
  }

  const user = readSession(req);
  if (!user) {
    res.status(401).json({
      error: 'Sign in with Google to run a reading.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }

  req.user = user;
  next();
}
