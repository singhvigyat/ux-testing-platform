import { CookieOptions, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser } from './types';

const COOKIE_NAME = 'argus_session';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type SessionPayload = AuthUser & { iat?: number; exp?: number };

function cookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  };
}

export function signSession(user: AuthUser): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set');
  }
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, picture: user.picture },
    secret,
    { expiresIn: '7d' },
  );
}

export function readSession(req: Request): AuthUser | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const token = req.cookies?.[COOKIE_NAME];
  if (!token || typeof token !== 'string') return null;

  try {
    const payload = jwt.verify(token, secret) as SessionPayload;
    if (!payload.id || !payload.email) return null;
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || '',
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, user: AuthUser): void {
  res.cookie(COOKIE_NAME, signSession(user), cookieOptions());
}

export function clearSessionCookie(res: Response): void {
  const options = cookieOptions();
  res.clearCookie(COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
}
