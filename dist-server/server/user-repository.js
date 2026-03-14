import { randomUUID } from 'node:crypto';
import { db } from './db';
function mapPublicUser(row) {
    return {
        id: row.id,
        email: row.email,
        nickname: row.nickname,
        avatarImage: row.avatar_image || undefined,
    };
}
export function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
export function getUserByEmailWithPassword(email) {
    const normalizedEmail = normalizeEmail(email);
    const row = db
        .prepare(`
      SELECT id, email, nickname, avatar_image, password_hash
      FROM users
      WHERE email = ?
      LIMIT 1
    `)
        .get(normalizedEmail);
    if (!row)
        return null;
    return {
        ...mapPublicUser(row),
        passwordHash: row.password_hash,
    };
}
export function getUserById(userId) {
    const row = db
        .prepare(`
      SELECT id, email, nickname, avatar_image
      FROM users
      WHERE id = ?
      LIMIT 1
    `)
        .get(userId);
    if (!row)
        return null;
    return mapPublicUser(row);
}
export function getUserByIdWithPassword(userId) {
    const row = db
        .prepare(`
      SELECT id, email, nickname, avatar_image, password_hash
      FROM users
      WHERE id = ?
      LIMIT 1
    `)
        .get(userId);
    if (!row)
        return null;
    return {
        ...mapPublicUser(row),
        passwordHash: row.password_hash,
    };
}
export function createUser(input) {
    const normalizedEmail = normalizeEmail(input.email);
    const nickname = input.nickname.trim();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, nickname, avatar_image)
      VALUES (?, ?, ?, ?, '')
    `).run(id, normalizedEmail, input.passwordHash, nickname);
    return getUserById(id);
}
export function findUserByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    const row = db
        .prepare(`
      SELECT id, email, nickname, avatar_image
      FROM users
      WHERE email = ?
      LIMIT 1
    `)
        .get(normalizedEmail);
    if (!row)
        return null;
    return mapPublicUser(row);
}
export function updateUserPassword(userId, passwordHash) {
    const result = db
        .prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
        .run(passwordHash, userId);
    return result.changes > 0;
}
