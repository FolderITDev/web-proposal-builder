import { createHash, randomBytes } from 'node:crypto';

import { BASE_PATH } from '@/config/site';

export const SESSION_COOKIE = 'pb_session';
/** Matches the retention of a proposal: seven days after its last change. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const TOKEN = /^[A-Za-z0-9_-]{32,64}$/;

/**
 * Visitors are anonymous. A random token in an HttpOnly cookie ties proposals to the browser
 * that created them; only its SHA-256 hash is stored, so the database alone cannot impersonate
 * anyone.
 */
export type Session = { ownerHash: string; setCookie: string };

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function readToken(request: Request): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) {
      const value = rest.join('=');
      return TOKEN.test(value) ? value : null;
    }
  }
  return null;
}

/** HTTPS as seen by the browser, including behind a proxy that terminates TLS. */
function isSecure(request: Request): boolean {
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return (forwarded ?? new URL(request.url).protocol.replace(/:$/, '')) === 'https';
}

function sessionCookie(request: Request, token: string): string {
  const secure = isSecure(request) ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; Path=${BASE_PATH}; Max-Age=${MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

/** The current visitor's owner hash, or null when they have not created anything yet. */
export function readSession(request: Request): string | null {
  const token = readToken(request);
  return token ? hashToken(token) : null;
}

/**
 * Returns the visitor's session, creating one when missing. The cookie is re-issued on every
 * write, so it stays valid for as long as the visitor's most recently changed proposal is kept.
 */
export function ensureSession(request: Request): Session {
  const token = readToken(request) ?? randomBytes(24).toString('base64url');
  return { ownerHash: hashToken(token), setCookie: sessionCookie(request, token) };
}

/** A fresh Set-Cookie for an existing session, or null when the visitor has none. */
export function renewSession(request: Request): string | null {
  const token = readToken(request);
  return token ? sessionCookie(request, token) : null;
}
