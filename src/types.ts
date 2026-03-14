export type TimelineEntryType = 'timeline' | 'album' | 'loose_photo';
export type SpaceVisibility = 'private' | 'public' | 'friends' | 'custom';
export type InfoCapsuleType = 'date' | 'zodiac' | 'location' | 'custom';

export interface ImageUploadResult {
  url: string;
  thumbnailUrl: string;
}

export interface TimelineImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  text?: string;
}

export interface CoverFocus {
  x: number;
  y: number;
}

export interface AvatarFocus {
  x: number;
  y: number;
  scale: number;
}

export interface TimelineEntry {
  id: string;
  title: string;
  date: string;
  description?: string;
  images: TimelineImage[];
  coverFocus?: CoverFocus;
  rotation: number;
  type?: TimelineEntryType;
}

export interface TreeholeEntry {
  id: string;
  date: string;
  text: string;
  color: string;
  rotation: number;
}

export interface InfoCapsule {
  id: string;
  type: InfoCapsuleType;
  label: string;
  value: string;
}

export interface Space {
  id: string;
  name: string;
  avatarImage: string;
  avatarThumbnailImage?: string;
  avatarFocus: AvatarFocus;
  heroImage: string;
  heroThumbnailImage?: string;
  description: string;
  infoCapsules: InfoCapsule[];
  visibility?: SpaceVisibility;
  entries: TimelineEntry[];
  treeholeEntries: TreeholeEntry[];
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarImage?: string;
  canAccessAdminDashboard?: boolean;
}

export interface AccountDashboardStats {
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
}

export interface AdminUserStorageStat {
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
}

export interface AdminDashboardStats {
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
}
