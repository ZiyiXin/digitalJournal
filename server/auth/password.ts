import {randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';

const PASSWORD_FORMAT = 'scrypt';
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const normalized = password.trim();
  if (normalized.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const salt = randomBytes(SALT_BYTES);
  const digest = scryptSync(normalized, salt, KEY_LENGTH);
  return `${PASSWORD_FORMAT}$${salt.toString('base64url')}$${digest.toString('base64url')}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const normalized = password.trim();
  const [format, saltValue, digestValue] = passwordHash.split('$');
  if (format !== PASSWORD_FORMAT || !saltValue || !digestValue) {
    return false;
  }

  try {
    const salt = Buffer.from(saltValue, 'base64url');
    const digest = Buffer.from(digestValue, 'base64url');
    const candidate = scryptSync(normalized, salt, digest.length);
    return timingSafeEqual(candidate, digest);
  } catch {
    return false;
  }
}
