import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {hashPassword} from './auth/password';
import {DEFAULT_USER_SPACE_LIMIT, DEFAULT_USER_STORAGE_LIMIT_BYTES} from './account-limits';

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'digital-journal.db');
const DEFAULT_INFO_CAPSULES_JSON = '[{"id":"default-date","type":"date","label":"日期","value":"1997-10-14"},{"id":"default-zodiac","type":"zodiac","label":"星座","value":"天秤座"},{"id":"default-location","type":"location","label":"地点","value":"重庆市"}]';

fs.mkdirSync(DATA_DIR, {recursive: true});
fs.mkdirSync(UPLOADS_DIR, {recursive: true});

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar_image TEXT NOT NULL DEFAULT '',
    space_limit INTEGER NOT NULL DEFAULT ${DEFAULT_USER_SPACE_LIMIT},
    storage_limit_bytes INTEGER NOT NULL DEFAULT ${DEFAULT_USER_STORAGE_LIMIT_BYTES},
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    user_agent TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS spaces (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    avatar_image TEXT NOT NULL,
    avatar_thumbnail_image TEXT NOT NULL DEFAULT '',
    avatar_x REAL NOT NULL DEFAULT 50,
    avatar_y REAL NOT NULL DEFAULT 50,
    avatar_scale REAL NOT NULL DEFAULT 1,
    hero_image TEXT NOT NULL,
    hero_thumbnail_image TEXT NOT NULL DEFAULT '',
    visibility TEXT NOT NULL DEFAULT 'private',
    description TEXT NOT NULL DEFAULT '',
    info_capsules TEXT NOT NULL DEFAULT '${DEFAULT_INFO_CAPSULES_JSON}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS timeline_entries (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL DEFAULT '',
    space_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    rotation REAL NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'timeline',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS timeline_images (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL DEFAULT '',
    entry_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (entry_id) REFERENCES timeline_entries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS treehole_entries (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL DEFAULT '',
    space_id TEXT NOT NULL,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    color TEXT NOT NULL,
    rotation REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
  );
`);

type TableInfoRow = {
  name: string;
};

function ensureColumn(table: string, column: string, definition: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as TableInfoRow[];
  if (!rows.some((row) => row.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('timeline_entries', 'cover_x', 'REAL NOT NULL DEFAULT 50');
ensureColumn('timeline_entries', 'cover_y', 'REAL NOT NULL DEFAULT 42');
ensureColumn('users', 'space_limit', `INTEGER NOT NULL DEFAULT ${DEFAULT_USER_SPACE_LIMIT}`);
ensureColumn('users', 'storage_limit_bytes', `INTEGER NOT NULL DEFAULT ${DEFAULT_USER_STORAGE_LIMIT_BYTES}`);
ensureColumn('spaces', 'avatar_x', 'REAL NOT NULL DEFAULT 50');
ensureColumn('spaces', 'avatar_y', 'REAL NOT NULL DEFAULT 50');
ensureColumn('spaces', 'avatar_scale', 'REAL NOT NULL DEFAULT 1');
ensureColumn('spaces', 'avatar_thumbnail_image', "TEXT NOT NULL DEFAULT ''");
ensureColumn('spaces', 'owner_id', "TEXT NOT NULL DEFAULT ''");
ensureColumn('spaces', 'visibility', "TEXT NOT NULL DEFAULT 'private'");
ensureColumn('spaces', 'info_capsules', `TEXT NOT NULL DEFAULT '${DEFAULT_INFO_CAPSULES_JSON}'`);
ensureColumn('spaces', 'hero_thumbnail_image', "TEXT NOT NULL DEFAULT ''");
ensureColumn('timeline_entries', 'owner_id', "TEXT NOT NULL DEFAULT ''");
ensureColumn('timeline_images', 'owner_id', "TEXT NOT NULL DEFAULT ''");
ensureColumn('timeline_images', 'thumbnail_url', "TEXT NOT NULL DEFAULT ''");
ensureColumn('treehole_entries', 'owner_id', "TEXT NOT NULL DEFAULT ''");

db.exec(`
  UPDATE spaces
  SET avatar_thumbnail_image = avatar_image
  WHERE avatar_image <> '' AND (avatar_thumbnail_image IS NULL OR avatar_thumbnail_image = '');

  UPDATE spaces
  SET hero_thumbnail_image = hero_image
  WHERE hero_image <> '' AND (hero_thumbnail_image IS NULL OR hero_thumbnail_image = '');

  UPDATE timeline_images
  SET thumbnail_url = image_url
  WHERE image_url <> '' AND (thumbnail_url IS NULL OR thumbnail_url = '');
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_spaces_owner_created
    ON spaces(owner_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_timeline_entries_owner_space
    ON timeline_entries(owner_id, space_id);
  CREATE INDEX IF NOT EXISTS idx_timeline_images_owner_entry
    ON timeline_images(owner_id, entry_id);
  CREATE INDEX IF NOT EXISTS idx_treehole_entries_owner_space
    ON treehole_entries(owner_id, space_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_exp
    ON user_sessions(user_id, expires_at);
`);

function parseLegacyUploadUrl(url: string, userId: string): {filename: string; url: string} | null {
  const matched = /^\/uploads\/([^/]+)$/.exec(url);
  if (!matched) return null;
  const filename = matched[1];
  if (!filename) return null;
  return {
    filename,
    url: `/uploads/${userId}/${filename}`,
  };
}

function moveUploadIntoUserDir(userId: string, filename: string): boolean {
  const userUploadsDir = path.join(UPLOADS_DIR, userId);
  fs.mkdirSync(userUploadsDir, {recursive: true});

  const sourcePath = path.join(UPLOADS_DIR, filename);
  const targetPath = path.join(userUploadsDir, filename);

  if (fs.existsSync(targetPath)) return true;
  if (!fs.existsSync(sourcePath)) return false;

  fs.renameSync(sourcePath, targetPath);
  return true;
}

function migrateUploadUrlsForLegacyUser(legacyUserId: string) {
  const spaceImageRows = db
    .prepare(
      `
      SELECT id, avatar_image, hero_image
      FROM spaces
      WHERE owner_id = ?
    `,
    )
    .all(legacyUserId) as Array<{id: string; avatar_image: string; hero_image: string}>;

  const updateSpaceAvatar = db.prepare('UPDATE spaces SET avatar_image = ? WHERE id = ?');
  const updateSpaceHero = db.prepare('UPDATE spaces SET hero_image = ? WHERE id = ?');

  for (const row of spaceImageRows) {
    const avatar = parseLegacyUploadUrl(row.avatar_image, legacyUserId);
    if (avatar && moveUploadIntoUserDir(legacyUserId, avatar.filename)) {
      updateSpaceAvatar.run(avatar.url, row.id);
    }

    const hero = parseLegacyUploadUrl(row.hero_image, legacyUserId);
    if (hero && moveUploadIntoUserDir(legacyUserId, hero.filename)) {
      updateSpaceHero.run(hero.url, row.id);
    }
  }

  const timelineImageRows = db
    .prepare(
      `
      SELECT id, image_url
      FROM timeline_images
      WHERE owner_id = ?
    `,
    )
    .all(legacyUserId) as Array<{id: string; image_url: string}>;

  const updateTimelineImage = db.prepare('UPDATE timeline_images SET image_url = ? WHERE id = ?');
  for (const row of timelineImageRows) {
    const parsed = parseLegacyUploadUrl(row.image_url, legacyUserId);
    if (!parsed) continue;
    if (!moveUploadIntoUserDir(legacyUserId, parsed.filename)) continue;
    updateTimelineImage.run(parsed.url, row.id);
  }
}

function ensureLegacyUserForBackfill(): string | null {
  const needsBackfillRow = db
    .prepare(
      `
      SELECT
        (SELECT COUNT(*) FROM spaces WHERE owner_id IS NULL OR owner_id = '') AS spaces_count,
        (SELECT COUNT(*) FROM timeline_entries WHERE owner_id IS NULL OR owner_id = '') AS timeline_count,
        (SELECT COUNT(*) FROM timeline_images WHERE owner_id IS NULL OR owner_id = '') AS image_count,
        (SELECT COUNT(*) FROM treehole_entries WHERE owner_id IS NULL OR owner_id = '') AS treehole_count
    `,
    )
    .get() as {
      spaces_count: number;
      timeline_count: number;
      image_count: number;
      treehole_count: number;
    };

  const needsBackfill =
    needsBackfillRow.spaces_count > 0 ||
    needsBackfillRow.timeline_count > 0 ||
    needsBackfillRow.image_count > 0 ||
    needsBackfillRow.treehole_count > 0;

  if (!needsBackfill) return null;

  const email = (process.env.LEGACY_OWNER_EMAIL ?? 'legacy@digital-journal.local').trim().toLowerCase();
  const password = process.env.LEGACY_OWNER_PASSWORD ?? 'ChangeMeNow123!';
  const nickname = (process.env.LEGACY_OWNER_NICKNAME ?? 'Legacy Owner').trim() || 'Legacy Owner';

  const existing = db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').get(email) as {id: string} | undefined;
  if (existing) return existing.id;

  const userId = randomUUID();
  const passwordHash = hashPassword(password);
  db.prepare(
    `
      INSERT INTO users (id, email, password_hash, nickname, avatar_image)
      VALUES (?, ?, ?, ?, '')
    `,
  ).run(userId, email, passwordHash, nickname);
  return userId;
}

const backfillOwnershipTx = db.transaction((legacyUserId: string) => {
  db.prepare(
    `
      UPDATE spaces
      SET owner_id = ?, visibility = 'private'
      WHERE owner_id IS NULL OR owner_id = ''
    `,
  ).run(legacyUserId);

  db.prepare(
    `
      UPDATE timeline_entries
      SET owner_id = (
        SELECT s.owner_id
        FROM spaces s
        WHERE s.id = timeline_entries.space_id
      )
      WHERE owner_id IS NULL OR owner_id = ''
    `,
  ).run();

  db.prepare(
    `
      UPDATE timeline_images
      SET owner_id = (
        SELECT e.owner_id
        FROM timeline_entries e
        WHERE e.id = timeline_images.entry_id
      )
      WHERE owner_id IS NULL OR owner_id = ''
    `,
  ).run();

  db.prepare(
    `
      UPDATE treehole_entries
      SET owner_id = (
        SELECT s.owner_id
        FROM spaces s
        WHERE s.id = treehole_entries.space_id
      )
      WHERE owner_id IS NULL OR owner_id = ''
    `,
  ).run();

  db.prepare(`UPDATE spaces SET visibility = 'private' WHERE visibility != 'private' OR visibility IS NULL`).run();
});

const legacyUserId = ensureLegacyUserForBackfill();
if (legacyUserId) {
  backfillOwnershipTx(legacyUserId);
  migrateUploadUrlsForLegacyUser(legacyUserId);
}

export function getUserUploadsDir(userId: string): string {
  const userUploadsDir = path.join(UPLOADS_DIR, userId);
  fs.mkdirSync(userUploadsDir, {recursive: true});
  return userUploadsDir;
}
