import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS_DIR, db } from './db';
import { DEFAULT_USER_SPACE_LIMIT, DEFAULT_USER_STORAGE_LIMIT_BYTES, calculateRemaining, calculateUsagePercent, formatStorageLimit, normalizeSpaceLimit, normalizeStorageLimitBytes, } from './account-limits';
import { parseUploadUrl } from './upload-storage';
export class QuotaExceededError extends Error {
    constructor(message) {
        super(message);
        this.name = 'QuotaExceededError';
    }
}
const DEFAULT_STORAGE_CAPACITY_GB = 20;
function normalizeQuotaSettings(spaceLimit, storageLimitBytes) {
    return {
        spaceLimit: normalizeSpaceLimit(spaceLimit),
        storageLimitBytes: normalizeStorageLimitBytes(storageLimitBytes),
    };
}
function getStorageCapacityBytes() {
    const configured = Number(process.env.STORAGE_CAPACITY_GB ?? DEFAULT_STORAGE_CAPACITY_GB);
    const storageGb = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_STORAGE_CAPACITY_GB;
    return Math.round(storageGb * 1024 * 1024 * 1024);
}
function scanUploadDirectory() {
    const fileKeys = new Set();
    const byUser = new Map();
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
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }
            if (!entry.isFile())
                continue;
            const relativePath = path.relative(UPLOADS_DIR, fullPath);
            if (!relativePath || relativePath.startsWith('..'))
                continue;
            const segments = relativePath.split(path.sep).filter(Boolean);
            if (segments.length < 2)
                continue;
            const userId = segments[0];
            const fileKey = segments.join('/');
            const fileStat = fs.statSync(fullPath);
            const fileSize = fileStat.size;
            photoFileCount += 1;
            usedBytes += fileSize;
            fileKeys.add(fileKey);
            const currentUserUsage = byUser.get(userId) ?? { photoFileCount: 0, storageBytes: 0 };
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
function listUploadReferences() {
    const rows = db
        .prepare(`
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
    `)
        .all();
    const referencedFileKeys = new Set();
    const referencedByUser = new Map();
    for (const row of rows) {
        const parsed = parseUploadUrl(row.url ?? '');
        if (!parsed)
            continue;
        if (referencedFileKeys.has(parsed.fileKey))
            continue;
        referencedFileKeys.add(parsed.fileKey);
        referencedByUser.set(parsed.userId, (referencedByUser.get(parsed.userId) ?? 0) + 1);
    }
    return {
        referencedFileKeys,
        referencedByUser,
    };
}
function listSpaceCountByUser() {
    const rows = db
        .prepare(`
      SELECT owner_id, COUNT(*) AS count
      FROM spaces
      GROUP BY owner_id
    `)
        .all();
    return new Map(rows.map((row) => [row.owner_id, row.count]));
}
function getUserQuotaSettings(userId) {
    const row = db
        .prepare(`
      SELECT space_limit, storage_limit_bytes
      FROM users
      WHERE id = ?
      LIMIT 1
    `)
        .get(userId);
    if (!row)
        return null;
    return normalizeQuotaSettings(row.space_limit, row.storage_limit_bytes);
}
function buildQuotaBreakdown(userId, quotaSettings, storageScan, references, spaceCountByUser) {
    const spaceCount = spaceCountByUser.get(userId) ?? 0;
    const storageUsage = storageScan.byUser.get(userId) ?? { photoFileCount: 0, storageBytes: 0 };
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
export function getAccountDashboardStats(userId) {
    const quotaSettings = getUserQuotaSettings(userId);
    if (!quotaSettings)
        return null;
    const storageScan = scanUploadDirectory();
    const references = listUploadReferences();
    const spaceCountByUser = listSpaceCountByUser();
    const breakdown = buildQuotaBreakdown(userId, quotaSettings, storageScan, references, spaceCountByUser);
    return {
        generatedAt: new Date().toISOString(),
        ...breakdown,
    };
}
export function assertCanCreateSpace(userId) {
    const stats = getAccountDashboardStats(userId);
    if (!stats) {
        throw new Error('User not found');
    }
    if (stats.spaceCount >= stats.spaceLimit) {
        throw new QuotaExceededError(`当前账户最多只能创建 ${stats.spaceLimit} 个空间`);
    }
}
export function assertStorageQuotaAvailable(userId, additionalBytes = 0) {
    const stats = getAccountDashboardStats(userId);
    if (!stats) {
        throw new Error('User not found');
    }
    const projectedBytes = stats.storageBytes + Math.max(additionalBytes, 0);
    if (projectedBytes > stats.storageLimitBytes) {
        throw new QuotaExceededError(`当前账户已达到 ${formatStorageLimit(stats.storageLimitBytes)} 存储上限`);
    }
}
export function assertGlobalStorageCapacityAvailable(additionalBytes = 0) {
    const capacityBytes = getStorageCapacityBytes();
    const storageScan = scanUploadDirectory();
    const projectedBytes = storageScan.usedBytes + Math.max(additionalBytes, 0);
    if (projectedBytes > capacityBytes) {
        throw new QuotaExceededError(`服务器存储已达到 ${formatStorageLimit(capacityBytes)} 总容量上限`);
    }
}
export function getAdminDashboardStats() {
    const users = db
        .prepare(`
      SELECT id, email, nickname, space_limit, storage_limit_bytes
      FROM users
      ORDER BY created_at ASC
    `)
        .all();
    const capacityBytes = getStorageCapacityBytes();
    const storageScan = scanUploadDirectory();
    const references = listUploadReferences();
    const spaceCountByUser = listSpaceCountByUser();
    let referencedExistingPhotoCount = 0;
    for (const fileKey of references.referencedFileKeys) {
        if (storageScan.fileKeys.has(fileKey))
            referencedExistingPhotoCount += 1;
    }
    const userLookup = new Map(users.map((user) => [user.id, user]));
    const quotaSettingsByUser = new Map(users.map((user) => [user.id, normalizeQuotaSettings(user.space_limit, user.storage_limit_bytes)]));
    const allUserIds = new Set(users.map((user) => user.id));
    for (const userId of quotaSettingsByUser.keys())
        allUserIds.add(userId);
    for (const userId of storageScan.byUser.keys())
        allUserIds.add(userId);
    for (const userId of references.referencedByUser.keys())
        allUserIds.add(userId);
    for (const userId of spaceCountByUser.keys())
        allUserIds.add(userId);
    const perUser = Array.from(allUserIds)
        .map((userId) => {
        const profile = userLookup.get(userId);
        const quotaSettings = quotaSettingsByUser.get(userId) ?? {
            spaceLimit: DEFAULT_USER_SPACE_LIMIT,
            storageLimitBytes: DEFAULT_USER_STORAGE_LIMIT_BYTES,
        };
        const quotaBreakdown = buildQuotaBreakdown(userId, quotaSettings, storageScan, references, spaceCountByUser);
        const storageSharePercent = storageScan.usedBytes > 0 ? (quotaBreakdown.storageBytes / storageScan.usedBytes) * 100 : 0;
        return {
            userId,
            email: profile?.email ?? '-',
            nickname: profile?.nickname ?? 'Unknown user',
            storageSharePercent,
            ...quotaBreakdown,
        };
    })
        .sort((a, b) => {
        if (b.storageBytes !== a.storageBytes)
            return b.storageBytes - a.storageBytes;
        if (b.spaceUsagePercent !== a.spaceUsagePercent)
            return b.spaceUsagePercent - a.spaceUsagePercent;
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
