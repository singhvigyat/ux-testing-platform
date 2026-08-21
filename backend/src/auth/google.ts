import { OAuth2Client } from 'google-auth-library';
import type { AuthUser } from './types';

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not set');
  }
  if (!client) {
    client = new OAuth2Client(clientId);
  }
  return client;
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.SESSION_SECRET);
}

export async function verifyGoogleIdToken(idToken: string): Promise<AuthUser> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not set');
  }

  const ticket = await getClient().verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Google token was missing identity claims');
  }
  if (payload.email_verified === false) {
    throw new Error('Google email is not verified');
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || '',
  };
}
