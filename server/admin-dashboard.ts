import fs from 'node:fs';
import path from 'node:path';
import {UPLOADS_DIR, db} from './db';
import {
  DEFAULT_USER_SPACE_LIMIT,
  DEFAULT_USER_STORAGE_LIMIT_BYTES,
  calculateRemaining,
  calculateUsagePercent,
  formatStorageLimit,
  normalizeSpaceLimit,
  normalizeStorageLimitBytes,
} from './account-limits';
import {parseUploadUrl} from './upload-storage';

type UserRow = {
  id: string;
  email: string;
  nickname: string;
  space_limit: number;
  storage_limit_bytes: number;
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

type UserQuotaSettings = {
  spaceLimit: number;
  storageLimitBytes: number;
};

type AccountQuotaBreakdown = {
  spaceCount: number;
  spaceLimit: number;
  remainingSpaceCount: number;
  spaceUsagePercent: number;
  photoFileCount: number;
  referencedPhotoCount: number;
  storageBytes: number;
  storageLimitBytes: number;
  remainingStorageBytes: number;
  storageUsagePercent: number;
};

export type AccountDashboardStats = {
  generatedAt: string;
  spaceCount: number;
  spaceLimit: number;
  remainingSpaceCount: number;
  spaceUsagePercent: number;
  photoFileCount: number;
  referencedPhotoCount: number;
  storageBytes: number;
  storageLimitBytes: number;
  remainingStorageBytes: number;
  storageUsagePercent: number;
};

export type AdminUserStorageStat = {
  userId: string;
  email: string;
  nickname: string;
  spaceCount: number;
  spaceLimit: number;
  remainingSpaceCount: number;
  spaceUsagePercent: number;
  photoFileCount: number;
  referencedPhotoCount: number;
  storageBytes: number;
  storageLimitBytes: number;
  remainingStorageBytes: number;
  storageUsagePercent: number;
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

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

const DEFAULT_STORAGE_CAPACITY_GB = 20;
const USAGE_SNAPSHOT_TTL_MS = 1500;

type StorageScanSnapshot = {
  photoFileCount: number;
  usedBytes: number;
  fileKeys: Set<string>;
  byUser: Map<string, UserStorageScan>;
};

type UploadReferenceSnapshot = {
  referencedFileKeys: Set<string>;
  referencedByUser: Map<string, number>;
};

type UsageSnapshot = {
  storageScan: StorageScanSnapshot;
  references: UploadReferenceSnapshot;
  spaceCountByUser: Map<string, number>;
  expiresAt: number;
};

let cachedUsageSnapshot: UsageSnapshot | null = null;

export function invalidateUsageSnapshotCache(): void {
  cachedUsageSnapshot = null;
}

function normalizeQuotaSettings(spaceLimit: number, storageLimitBytes: number): UserQuotaSettings {
  return {
    spaceLimit: normalizeSpaceLimit(spaceLimit),
    storageLimitBytes: normalizeStorageLimitBytes(storageLimitBytes),
  };
}

function getStorageCapacityBytes(): number {
  const configured = Number(process.env.STORAGE_CAPACITY_GB ?? DEFAULT_STORAGE_CAPACITY_GB);
  const storageGb = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_STORAGE_CAPACITY_GB;
  return Math.round(storageGb * 1024 * 1024 * 1024);
}

function scanUploadDirectory(): StorageScanSnapshot {
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

function listUploadReferences(): UploadReferenceSnapshot {
  const rows = db
    .prepare(
      `
      SELECT image_url AS url FROM timeline_images
      UNION ALL
      SELECT thumbnail_url AS url FROM timeline_images
      UNION ALL
      SELECT avatar_image AS url FROM spaces
      UNION ALL
      SELECT avatar_thumbnail_image AS url FROM spaces
      UNION ALL
      SELECT hero_image AS url FROM spaces
      UNION ALL
      SELECT hero_thumbnail_image AS url FROM spaces
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

function collectUsageSnapshot(): Omit<UsageSnapshot, 'expiresAt'> {
  const now = Date.now();
  if (cachedUsageSnapshot && cachedUsageSnapshot.expiresAt > now) {
    return {
      storageScan: cachedUsageSnapshot.storageScan,
      references: cachedUsageSnapshot.references,
      spaceCountByUser: cachedUsageSnapshot.spaceCountByUser,
    };
  }

  const snapshot: UsageSnapshot = {
    storageScan: scanUploadDirectory(),
    references: listUploadReferences(),
    spaceCountByUser: listSpaceCountByUser(),
    expiresAt: now + USAGE_SNAPSHOT_TTL_MS,
  };
  cachedUsageSnapshot = snapshot;

  return {
    storageScan: snapshot.storageScan,
    references: snapshot.references,
    spaceCountByUser: snapshot.spaceCountByUser,
  };
}

function getUserQuotaSettings(userId: string): UserQuotaSettings | null {
  const row = db
    .prepare(
      `
      SELECT space_limit, storage_limit_bytes
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    )
    .get(userId) as {space_limit: number; storage_limit_bytes: number} | undefined;

  if (!row) return null;
  return normalizeQuotaSettings(row.space_limit, row.storage_limit_bytes);
}

function buildQuotaBreakdown(
  userId: string,
  quotaSettings: UserQuotaSettings,
  storageScan: StorageScanSnapshot,
  references: UploadReferenceSnapshot,
  spaceCountByUser: Map<string, number>,
): AccountQuotaBreakdown {
  const spaceCount = spaceCountByUser.get(userId) ?? 0;
  const storageUsage = storageScan.byUser.get(userId) ?? {photoFileCount: 0, storageBytes: 0};
  const referencedPhotoCount = references.referencedByUser.get(userId) ?? 0;

  return {
    spaceCount,
    spaceLimit: quotaSettings.spaceLimit,
    remainingSpaceCount: calculateRemaining(quotaSettings.spaceLimit, spaceCount),
    spaceUsagePercent: calculateUsagePercent(spaceCount, quotaSettings.spaceLimit),
    photoFileCount: storageUsage.photoFileCount,
    referencedPhotoCount,
    storageBytes: storageUsage.storageBytes,
    storageLimitBytes: quotaSettings.storageLimitBytes,
    remainingStorageBytes: calculateRemaining(quotaSettings.storageLimitBytes, storageUsage.storageBytes),
    storageUsagePercent: calculateUsagePercent(storageUsage.storageBytes, quotaSettings.storageLimitBytes),
  };
}

export function getAccountDashboardStats(userId: string): AccountDashboardStats | null {
  const quotaSettings = getUserQuotaSettings(userId);
  if (!quotaSettings) return null;

  const {storageScan, references, spaceCountByUser} = collectUsageSnapshot();
  const breakdown = buildQuotaBreakdown(userId, quotaSettings, storageScan, references, spaceCountByUser);

  return {
    generatedAt: new Date().toISOString(),
    ...breakdown,
  };
}

export function assertCanCreateSpace(userId: string): void {
  const stats = getAccountDashboardStats(userId);
  if (!stats) {
    throw new Error('User not found');
  }
  if (stats.spaceCount >= stats.spaceLimit) {
    throw new QuotaExceededError(`当前账户最多只能创建 ${stats.spaceLimit} 个空间`);
  }
}

export function assertStorageQuotaAvailable(userId: string, additionalBytes = 0): void {
  const stats = getAccountDashboardStats(userId);
  if (!stats) {
    throw new Error('User not found');
  }

  const projectedBytes = stats.storageBytes + Math.max(additionalBytes, 0);
  if (projectedBytes > stats.storageLimitBytes) {
    throw new QuotaExceededError(`当前账户已达到 ${formatStorageLimit(stats.storageLimitBytes)} 存储上限`);
  }
}

export function assertGlobalStorageCapacityAvailable(additionalBytes = 0): void {
  const capacityBytes = getStorageCapacityBytes();
  const {storageScan} = collectUsageSnapshot();
  const projectedBytes = storageScan.usedBytes + Math.max(additionalBytes, 0);

  if (projectedBytes > capacityBytes) {
    throw new QuotaExceededError(`服务器存储已达到 ${formatStorageLimit(capacityBytes)} 总容量上限`);
  }
}

export function getAdminDashboardStats(): AdminDashboardStats {
  const users = db
    .prepare(
      `
      SELECT id, email, nickname, space_limit, storage_limit_bytes
      FROM users
      ORDER BY created_at ASC
    `,
    )
    .all() as UserRow[];

  const capacityBytes = getStorageCapacityBytes();
  const {storageScan, references, spaceCountByUser} = collectUsageSnapshot();

  let referencedExistingPhotoCount = 0;
  for (const fileKey of references.referencedFileKeys) {
    if (storageScan.fileKeys.has(fileKey)) referencedExistingPhotoCount += 1;
  }

  const userLookup = new Map(users.map((user) => [user.id, user]));
  const quotaSettingsByUser = new Map(
    users.map((user) => [user.id, normalizeQuotaSettings(user.space_limit, user.storage_limit_bytes)]),
  );
  const allUserIds = new Set<string>(users.map((user) => user.id));
  for (const userId of quotaSettingsByUser.keys()) allUserIds.add(userId);
  for (const userId of storageScan.byUser.keys()) allUserIds.add(userId);
  for (const userId of references.referencedByUser.keys()) allUserIds.add(userId);
  for (const userId of spaceCountByUser.keys()) allUserIds.add(userId);

  const perUser = Array.from(allUserIds)
    .map((userId): AdminUserStorageStat => {
      const profile = userLookup.get(userId);
      const quotaSettings = quotaSettingsByUser.get(userId) ?? {
        spaceLimit: DEFAULT_USER_SPACE_LIMIT,
        storageLimitBytes: DEFAULT_USER_STORAGE_LIMIT_BYTES,
      };
      const quotaBreakdown = buildQuotaBreakdown(userId, quotaSettings, storageScan, references, spaceCountByUser);
      const storageSharePercent =
        storageScan.usedBytes > 0 ? (quotaBreakdown.storageBytes / storageScan.usedBytes) * 100 : 0;

      return {
        userId,
        email: profile?.email ?? '-',
        nickname: profile?.nickname ?? 'Unknown user',
        storageSharePercent,
        ...quotaBreakdown,
      };
    })
    .sort((a, b) => {
      if (b.storageBytes !== a.storageBytes) return b.storageBytes - a.storageBytes;
      if (b.spaceUsagePercent !== a.spaceUsagePercent) return b.spaceUsagePercent - a.spaceUsagePercent;
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
