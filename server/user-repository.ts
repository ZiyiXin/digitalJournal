import {randomUUID} from 'node:crypto';
import {db} from './db';
import type {User} from './types';

type UserRow = {
  id: string;
  email: string;
  nickname: string;
  avatar_image: string;
  password_hash: string;
};

type PublicUserRow = Omit<UserRow, 'password_hash'>;

function mapPublicUser(row: PublicUserRow): User {
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    avatarImage: row.avatar_image || undefined,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getUserByEmailWithPassword(email: string): (User & {passwordHash: string}) | null {
  const normalizedEmail = normalizeEmail(email);
  const row = db
    .prepare(
      `
      SELECT id, email, nickname, avatar_image, password_hash
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    )
    .get(normalizedEmail) as UserRow | undefined;

  if (!row) return null;

  return {
    ...mapPublicUser(row),
    passwordHash: row.password_hash,
  };
}

export function getUserById(userId: string): User | null {
  const row = db
    .prepare(
      `
      SELECT id, email, nickname, avatar_image
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    )
    .get(userId) as PublicUserRow | undefined;

  if (!row) return null;
  return mapPublicUser(row);
}

export function getUserByIdWithPassword(userId: string): (User & {passwordHash: string}) | null {
  const row = db
    .prepare(
      `
      SELECT id, email, nickname, avatar_image, password_hash
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    )
    .get(userId) as UserRow | undefined;

  if (!row) return null;

  return {
    ...mapPublicUser(row),
    passwordHash: row.password_hash,
  };
}

export function createUser(input: {email: string; passwordHash: string; nickname: string}): User {
  const normalizedEmail = normalizeEmail(input.email);
  const nickname = input.nickname.trim();
  const id = randomUUID();

  db.prepare(
    `
      INSERT INTO users (id, email, password_hash, nickname, avatar_image)
      VALUES (?, ?, ?, ?, '')
    `,
  ).run(id, normalizedEmail, input.passwordHash, nickname);

  return getUserById(id)!;
}

export function findUserByEmail(email: string): User | null {
  const normalizedEmail = normalizeEmail(email);
  const row = db
    .prepare(
      `
      SELECT id, email, nickname, avatar_image
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    )
    .get(normalizedEmail) as PublicUserRow | undefined;

  if (!row) return null;
  return mapPublicUser(row);
}

export function updateUserPassword(userId: string, passwordHash: string): boolean {
  const result = db
    .prepare(
      `
      UPDATE users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
    )
    .run(passwordHash, userId);

  return result.changes > 0;
}
