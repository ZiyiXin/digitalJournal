import fs from 'node:fs';
import path from 'node:path';
import {UPLOADS_DIR, db} from './db';

type UserRow = {
  id: string;
  email: string;
  nickname: string;
};

type GroupCountRow = {
  owner_id: string;
  count: number;
};

type UploadUrlRow = {
  url: string;
};

type UserStorageScan = {
  photoFileCount: number;
  storageBytes: number;
};

export type AdminUserStorageStat = {
  userId: string;
  email: string;
  nickname: string;
  spaceCount: number;
  photoFileCount: number;
  referencedPhotoCount: number;
  storageBytes: number;
  storageSharePercent: number;
};

export type AdminDashboardStats = {
  generatedAt: string;
  userCount: number;
  spaceCount: number;
  photoFileCount: number;
  photoReferenceCount: number;
  referencedExistingPhotoCount: number;
  orphanPhotoFileCount: number;
  missingPhotoFileCount: number;
  usedBytes: number;
  capacityBytes: number;
  remainingBytes: number;
  usagePercent: number;
  perUser: AdminUserStorageStat[];
};

const DEFAULT_STORAGE_CAPACITY_GB = 5;
const UPLOAD_URL_REGEX = /^\/uploads\/([^/]+)\/([^?#]+)$/;

function getStorageCapacityBytes(): number {
  const configured = Number(process.env.STORAGE_CAPACITY_GB ?? DEFAULT_STORAGE_CAPACITY_GB);
  const storageGb = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_STORAGE_CAPACITY_GB;
  return Math.round(storageGb * 1024 * 1024 * 1024);
}

function parseUploadUrl(url: string): {userId: string; fileKey: string} | null {
  const normalized = url.trim();
  if (!normalized) return null;

  const matched = UPLOAD_URL_REGEX.exec(normalized);
  if (!matched) return null;

  let userId = '';
  let filePath = '';
  try {
    userId = decodeURIComponent(matched[1] ?? '').trim();
    filePath = decodeURIComponent((matched[2] ?? '').trim());
  } catch {
    return null;
  }

  if (!userId || !filePath || filePath.includes('\0')) return null;

  return {
    userId,
    fileKey: path.posix.join(userId, filePath),
  };
}

function scanUploadDirectory(): {
  photoFileCount: number;
  usedBytes: number;
  fileKeys: Set<string>;
  byUser: Map<string, UserStorageScan>;
} {
  const fileKeys = new Set<string>();
  const byUser = new Map<string, UserStorageScan>();
  let photoFileCount = 0;
  let usedBytes = 0;

  if (!fs.existsSync(UPLOADS_DIR)) {
    return {
      photoFileCount,
      usedBytes,
      fileKeys,
      byUser,
    };
  }

  const stack = [UPLOADS_DIR];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, {withFileTypes: true});

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      const relativePath = path.relative(UPLOADS_DIR, fullPath);
      if (!relativePath || relativePath.startsWith('..')) continue;

      const segments = relativePath.split(path.sep).filter(Boolean);
      if (segments.length < 2) continue;

      const userId = segments[0]!;
      const fileKey = segments.join('/');
      const fileStat = fs.statSync(fullPath);
      const fileSize = fileStat.size;

      photoFileCount += 1;
      usedBytes += fileSize;
      fileKeys.add(fileKey);

      const currentUserUsage = byUser.get(userId) ?? {photoFileCount: 0, storageBytes: 0};
      currentUserUsage.photoFileCount += 1;
      currentUserUsage.storageBytes += fileSize;
      byUser.set(userId, currentUserUsage);
    }
  }

  return {
    photoFileCount,
    usedBytes,
    fileKeys,
    byUser,
  };
}

function listUploadReferences(): {
  referencedFileKeys: Set<string>;
  referencedByUser: Map<string, number>;
} {
  const rows = db
    .prepare(
      `
      SELECT image_url AS url FROM timeline_images
      UNION ALL
      SELECT avatar_image AS url FROM spaces
      UNION ALL
      SELECT hero_image AS url FROM spaces
      UNION ALL
      SELECT avatar_image AS url FROM users
    `,
    )
    .all() as UploadUrlRow[];

  const referencedFileKeys = new Set<string>();
  const referencedByUser = new Map<string, number>();

  for (const row of rows) {
    const parsed = parseUploadUrl(row.url ?? '');
    if (!parsed) continue;
    if (referencedFileKeys.has(parsed.fileKey)) continue;
    referencedFileKeys.add(parsed.fileKey);
    referencedByUser.set(parsed.userId, (referencedByUser.get(parsed.userId) ?? 0) + 1);
  }

  return {
    referencedFileKeys,
    referencedByUser,
  };
}

function listSpaceCountByUser(): Map<string, number> {
  const rows = db
    .prepare(
      `
      SELECT owner_id, COUNT(*) AS count
      FROM spaces
      GROUP BY owner_id
    `,
    )
    .all() as GroupCountRow[];

  return new Map(rows.map((row) => [row.owner_id, row.count]));
}

export function getAdminDashboardStats(): AdminDashboardStats {
  const users = db
    .prepare(
      `
      SELECT id, email, nickname
      FROM users
      ORDER BY created_at ASC
    `,
    )
    .all() as UserRow[];

  const capacityBytes = getStorageCapacityBytes();
  const storageScan = scanUploadDirectory();
  const references = listUploadReferences();
  const spaceCountByUser = listSpaceCountByUser();

  let referencedExistingPhotoCount = 0;
  for (const fileKey of references.referencedFileKeys) {
    if (storageScan.fileKeys.has(fileKey)) referencedExistingPhotoCount += 1;
  }

  const userLookup = new Map(users.map((user) => [user.id, user]));
  const allUserIds = new Set<string>(users.map((user) => user.id));
  for (const userId of storageScan.byUser.keys()) allUserIds.add(userId);
  for (const userId of references.referencedByUser.keys()) allUserIds.add(userId);
  for (const userId of spaceCountByUser.keys()) allUserIds.add(userId);

  const perUser = Array.from(allUserIds)
    .map((userId): AdminUserStorageStat => {
      const profile = userLookup.get(userId);
      const storageUsage = storageScan.byUser.get(userId) ?? {photoFileCount: 0, storageBytes: 0};
      const storageSharePercent =
        storageScan.usedBytes > 0 ? (storageUsage.storageBytes / storageScan.usedBytes) * 100 : 0;

      return {
        userId,
        email: profile?.email ?? '-',
        nickname: profile?.nickname ?? 'Unknown user',
        spaceCount: spaceCountByUser.get(userId) ?? 0,
        photoFileCount: storageUsage.photoFileCount,
        referencedPhotoCount: references.referencedByUser.get(userId) ?? 0,
        storageBytes: storageUsage.storageBytes,
        storageSharePercent,
      };
    })
    .sort((a, b) => {
      if (b.storageBytes !== a.storageBytes) return b.storageBytes - a.storageBytes;
      if (b.photoFileCount !== a.photoFileCount) return b.photoFileCount - a.photoFileCount;
      return a.userId.localeCompare(b.userId);
    });

  const usagePercent = capacityBytes > 0 ? (storageScan.usedBytes / capacityBytes) * 100 : 0;
  const remainingBytes = Math.max(capacityBytes - storageScan.usedBytes, 0);

  return {
    generatedAt: new Date().toISOString(),
    userCount: users.length,
    spaceCount: Array.from(spaceCountByUser.values()).reduce((sum, value) => sum + value, 0),
    photoFileCount: storageScan.photoFileCount,
    photoReferenceCount: references.referencedFileKeys.size,
    referencedExistingPhotoCount,
    orphanPhotoFileCount: Math.max(storageScan.fileKeys.size - referencedExistingPhotoCount, 0),
    missingPhotoFileCount: Math.max(references.referencedFileKeys.size - referencedExistingPhotoCount, 0),
    usedBytes: storageScan.usedBytes,
    capacityBytes,
    remainingBytes,
    usagePercent,
    perUser,
  };
}
