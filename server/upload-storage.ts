import fs from 'node:fs';
import path from 'node:path';
import {db, UPLOADS_DIR} from './db';
import type {Space} from './types';

const UPLOAD_URL_REGEX = /^\/uploads\/([^/]+)\/([^?#]+)$/;
const DEFAULT_ORPHAN_UPLOAD_TTL_HOURS = 24;

type UploadReferenceRow = {
  present: 1;
};

export type ParsedUploadUrl = {
  userId: string;
  filename: string;
  fileKey: string;
  absolutePath: string;
  url: string;
};

const hasUploadReferenceStatement = db.prepare(
  `
    SELECT 1 AS present
    WHERE
      EXISTS (SELECT 1 FROM spaces WHERE avatar_image = @url)
      OR EXISTS (SELECT 1 FROM spaces WHERE avatar_thumbnail_image = @url)
      OR EXISTS (SELECT 1 FROM spaces WHERE hero_image = @url)
      OR EXISTS (SELECT 1 FROM spaces WHERE hero_thumbnail_image = @url)
      OR EXISTS (SELECT 1 FROM timeline_images WHERE image_url = @url)
      OR EXISTS (SELECT 1 FROM timeline_images WHERE thumbnail_url = @url)
      OR EXISTS (SELECT 1 FROM users WHERE avatar_image = @url)
    LIMIT 1
  `,
);

export function parseUploadUrl(url: string): ParsedUploadUrl | null {
  const normalized = url.trim();
  if (!normalized) return null;

  const matched = UPLOAD_URL_REGEX.exec(normalized);
  if (!matched) return null;

  let userId = '';
  let filename = '';
  try {
    userId = decodeURIComponent(matched[1] ?? '').trim();
    filename = decodeURIComponent((matched[2] ?? '').trim());
  } catch {
    return null;
  }

  if (!userId || !filename || filename.includes('\0')) return null;
  if (filename !== path.posix.basename(filename)) return null;

  const baseDir = path.resolve(path.join(UPLOADS_DIR, userId));
  const absolutePath = path.resolve(path.join(baseDir, filename));
  if (!absolutePath.startsWith(`${baseDir}${path.sep}`)) return null;

  return {
    userId,
    filename,
    fileKey: `${userId}/${filename}`,
    absolutePath,
    url: `/uploads/${encodeURIComponent(userId)}/${encodeURIComponent(filename)}`,
  };
}

export function isUploadUrlReferenced(url: string): boolean {
  return Boolean(hasUploadReferenceStatement.get({url}) as UploadReferenceRow | undefined);
}

export function collectUploadUrlsFromSpace(space: Space | null | undefined): string[] {
  if (!space) return [];

  const urls = new Set<string>();
  const addUrl = (value?: string) => {
    const normalized = value?.trim();
    if (normalized) urls.add(normalized);
  };

  addUrl(space.avatarImage);
  addUrl(space.avatarThumbnailImage);
  addUrl(space.heroImage);
  addUrl(space.heroThumbnailImage);

  for (const entry of space.entries) {
    for (const image of entry.images ?? []) {
      addUrl(image.imageUrl);
      addUrl(image.thumbnailUrl);
    }
  }

  return Array.from(urls);
}

function removeFile(filePath: string) {
  try {
    fs.unlinkSync(filePath);
  } catch {
    return;
  }

  const parentDir = path.dirname(filePath);
  if (path.resolve(parentDir) === path.resolve(UPLOADS_DIR)) return;

  try {
    if (fs.readdirSync(parentDir).length === 0) {
      fs.rmdirSync(parentDir);
    }
  } catch {
    // Ignore cleanup failures. They do not affect upload consistency.
  }
}

export function deleteUnreferencedUploadUrls(urls: string[]): void {
  const deduped = new Set(urls.map((url) => url.trim()).filter(Boolean));

  for (const url of deduped) {
    const parsed = parseUploadUrl(url);
    if (!parsed) continue;
    if (isUploadUrlReferenced(parsed.url)) continue;
    if (!fs.existsSync(parsed.absolutePath)) continue;
    removeFile(parsed.absolutePath);
  }
}

function getOrphanUploadTtlMs(): number {
  const configured = Number(process.env.ORPHAN_UPLOAD_TTL_HOURS ?? DEFAULT_ORPHAN_UPLOAD_TTL_HOURS);
  const normalized = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_ORPHAN_UPLOAD_TTL_HOURS;
  return normalized * 60 * 60 * 1000;
}

export function pruneStaleOrphanedUploads(): number {
  if (!fs.existsSync(UPLOADS_DIR)) return 0;

  const cutoffTime = Date.now() - getOrphanUploadTtlMs();
  const stack = [UPLOADS_DIR];
  let deletedCount = 0;

  while (stack.length > 0) {
    const currentDir = stack.pop()!;
    const entries = fs.readdirSync(currentDir, {withFileTypes: true});

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      const relativePath = path.relative(UPLOADS_DIR, fullPath);
      const segments = relativePath.split(path.sep).filter(Boolean);
      if (segments.length !== 2) continue;

      const fileStat = fs.statSync(fullPath);
      if (fileStat.mtimeMs > cutoffTime) continue;

      const [userId, filename] = segments;
      const encodedUrl = `/uploads/${encodeURIComponent(userId!)}/${encodeURIComponent(filename!)}`;
      if (isUploadUrlReferenced(encodedUrl)) continue;

      removeFile(fullPath);
      deletedCount += 1;
    }
  }

  return deletedCount;
}
