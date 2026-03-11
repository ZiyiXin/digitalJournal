export const DEFAULT_USER_SPACE_LIMIT = 3;
export const DEFAULT_USER_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;

export function normalizeSpaceLimit(value: number): number {
  const normalized = Math.floor(value);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : DEFAULT_USER_SPACE_LIMIT;
}

export function normalizeStorageLimitBytes(value: number): number {
  const normalized = Math.floor(value);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : DEFAULT_USER_STORAGE_LIMIT_BYTES;
}

export function calculateUsagePercent(used: number, limit: number): number {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return 0;
  return (used / limit) * 100;
}

export function calculateRemaining(limit: number, used: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  if (!Number.isFinite(used) || used <= 0) return limit;
  return Math.max(limit - used, 0);
}

export function formatStorageLimit(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const fractionDigits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(fractionDigits)} ${units[unitIndex]}`;
}
