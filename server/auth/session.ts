import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {db} from '../db';
import {SESSION_COOKIE_NAME, SESSION_TTL_DAYS} from './constants';

const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  nickname: string;
};

type SessionUserRow = {
  user_id: string;
  email: string;
  nickname: string;
  session_id: string;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(input: {
  userId: string;
  userAgent?: string;
  ip?: string;
}): {token: string; expiresAt: Date} {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const tokenHash = hashToken(token);

  db.prepare(
    `
      INSERT INTO user_sessions (
        id,
        user_id,
        token_hash,
        expires_at,
        user_agent,
        ip
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  ).run(
    randomUUID(),
    input.userId,
    tokenHash,
    expiresAt.toISOString(),
    input.userAgent ?? '',
    input.ip ?? '',
  );

  return {token, expiresAt};
}

export function getUserBySessionToken(token: string): SessionUser | null {
  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      `
      SELECT
        u.id AS user_id,
        u.email AS email,
        u.nickname AS nickname,
        s.id AS session_id
      FROM user_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND datetime(s.expires_at) > datetime('now')
      LIMIT 1
    `,
    )
    .get(tokenHash) as SessionUserRow | undefined;

  if (!row) return null;

  db.prepare('UPDATE user_sessions SET last_seen_at = datetime(\'now\') WHERE id = ?').run(row.session_id);

  return {
    id: row.user_id,
    email: row.email,
    nickname: row.nickname,
  };
}

export function revokeSession(token: string): void {
  const tokenHash = hashToken(token);
  db.prepare('DELETE FROM user_sessions WHERE token_hash = ?').run(tokenHash);
}

export function revokeSessionsByUserId(userId: string): void {
  db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(userId);
}

export function revokeExpiredSessions(): void {
  db.prepare('DELETE FROM user_sessions WHERE datetime(expires_at) <= datetime(\'now\')').run();
}
