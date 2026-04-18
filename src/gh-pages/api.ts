import type {AccountDashboardStats, AdminDashboardStats, ImageUploadResult, Space, User} from '../types';

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type UploadProgressHandler = (progress: UploadProgress) => void;

type DemoUserRecord = {
  id: string;
  email: string;
  nickname: string;
  password: string;
  avatarImage?: string;
};

type DemoDatabase = {
  users: DemoUserRecord[];
  spacesByUserId: Record<string, Space[]>;
};

type DemoSession = {
  userId: string;
};

const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL ?? 'demo@digital-journal.local').trim().toLowerCase();
const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_PASSWORD ?? 'Demo123456!').trim();
const DEMO_NICKNAME = (import.meta.env.VITE_DEMO_NICKNAME ?? 'Demo User').trim() || 'Demo User';
const DEMO_SPACE_LIMIT = 3;
const DEMO_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
const HERO_IMAGE = 'https://images.unsplash.com/photo-1518599904199-0ca897819ddb?auto=format&fit=crop&w=2000&q=80';
const AVATAR_IMAGE = 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=80';
const ENTRY_IMAGE_1 = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
const ENTRY_IMAGE_2 = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';
const DB_KEY = 'digital-journal-gh-pages-db';
const SESSION_KEY = 'digital-journal-gh-pages-session';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneSpace<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createDemoSpace(): Space {
  return {
    id: 'demo-space-1',
    name: '星尘档案馆',
    avatarImage: AVATAR_IMAGE,
    avatarThumbnailImage: AVATAR_IMAGE,
    avatarFocus: {x: 50, y: 50, scale: 1},
    heroImage: HERO_IMAGE,
    heroThumbnailImage: HERO_IMAGE,
    description: '一个适合展示角色设定、时间线和情绪碎片的数字手账 demo。',
    visibility: 'private',
    infoCapsules: [
      {id: 'capsule-date', type: 'date', label: '日期', value: '2026-04-18'},
      {id: 'capsule-location', type: 'location', label: '地点', value: '上海'},
      {id: 'capsule-custom', type: 'custom', label: '关键词', value: 'AI Demo / 角色宇宙'},
    ],
    entries: [
      {
        id: 'entry-1',
        title: '初次苏醒',
        date: '2026-04-01',
        description: '在玻璃穹顶下第一次记录自己的设定、偏好和记忆碎片。',
        images: [
          {id: 'entry-1-image-1', imageUrl: ENTRY_IMAGE_1, thumbnailUrl: ENTRY_IMAGE_1, text: '设定海报'},
          {id: 'entry-1-image-2', imageUrl: ENTRY_IMAGE_2, thumbnailUrl: ENTRY_IMAGE_2, text: '场景参考'},
        ],
        coverFocus: {x: 50, y: 42},
        rotation: -1.5,
        type: 'timeline',
      },
      {
        id: 'entry-2',
        title: '收集情绪样本',
        date: '2026-04-10',
        description: '把图片、文字和树洞整理成可浏览的个人记忆空间。',
        images: [
          {id: 'entry-2-image-1', imageUrl: ENTRY_IMAGE_2, thumbnailUrl: ENTRY_IMAGE_2, text: '夜色样本'},
        ],
        coverFocus: {x: 50, y: 42},
        rotation: 1.2,
        type: 'album',
      },
    ],
    treeholeEntries: [
      {
        id: 'treehole-1',
        date: '2026-04-12',
        text: '今天把 demo 改成了纯前端版，终于可以直接丢到 GitHub Pages。',
        color: 'bg-[#fff0f3]',
        rotation: -1.2,
      },
      {
        id: 'treehole-2',
        date: '2026-04-15',
        text: '登录页默认填好账号密码，评审打开链接后直接就能体验。',
        color: 'bg-[#f0f9ff]',
        rotation: 0.8,
      },
    ],
  };
}

function createDefaultDatabase(): DemoDatabase {
  return {
    users: [
      {
        id: 'demo-user-1',
        email: DEMO_EMAIL,
        nickname: DEMO_NICKNAME,
        password: DEMO_PASSWORD,
      },
    ],
    spacesByUserId: {
      'demo-user-1': [createDemoSpace()],
    },
  };
}

function normalizeDatabase(db: DemoDatabase): DemoDatabase {
  const next = cloneSpace(db);
  const hasDemoUser = next.users.some((user) => user.email === DEMO_EMAIL);
  if (!hasDemoUser) {
    next.users.unshift({
      id: 'demo-user-1',
      email: DEMO_EMAIL,
      nickname: DEMO_NICKNAME,
      password: DEMO_PASSWORD,
    });
  }

  const demoUser = next.users.find((user) => user.email === DEMO_EMAIL)!;
  if (!next.spacesByUserId[demoUser.id] || next.spacesByUserId[demoUser.id].length === 0) {
    next.spacesByUserId[demoUser.id] = [createDemoSpace()];
  }
  return next;
}

function readDatabase(): DemoDatabase {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const initial = createDefaultDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    return normalizeDatabase(JSON.parse(raw) as DemoDatabase);
  } catch {
    const initial = createDefaultDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
}

function writeDatabase(db: DemoDatabase) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function readSession(): DemoSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(session: DemoSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function toPublicUser(user: DemoUserRecord): User {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarImage: user.avatarImage,
    canAccessAdminDashboard: user.email === DEMO_EMAIL,
  };
}

function getCurrentUserRecord(): DemoUserRecord {
  const session = readSession();
  if (!session) {
    throw new ApiError('Unauthorized', 401);
  }

  const db = readDatabase();
  const user = db.users.find((item) => item.id === session.userId);
  if (!user) {
    writeSession(null);
    throw new ApiError('Unauthorized', 401);
  }

  return user;
}

function getCurrentUserSpaces(): Space[] {
  const user = getCurrentUserRecord();
  const db = readDatabase();
  return cloneSpace(db.spacesByUserId[user.id] ?? []);
}

function estimateUrlBytes(url?: string): number {
  if (!url || !url.startsWith('data:')) return 0;
  const base64 = url.split(',')[1] ?? '';
  return Math.ceil((base64.length * 3) / 4);
}

function collectSpaceImageBytes(space: Space): number {
  let total = 0;
  total += estimateUrlBytes(space.avatarImage);
  total += estimateUrlBytes(space.avatarThumbnailImage);
  total += estimateUrlBytes(space.heroImage);
  total += estimateUrlBytes(space.heroThumbnailImage);

  for (const entry of space.entries) {
    for (const image of entry.images) {
      total += estimateUrlBytes(image.imageUrl);
      total += estimateUrlBytes(image.thumbnailUrl);
    }
  }

  return total;
}

function buildAccountStats(userId: string, spaces: Space[]): AccountDashboardStats {
  const storageBytes = spaces.reduce((sum, space) => sum + collectSpaceImageBytes(space), 0);
  const referencedPhotoCount = spaces.reduce((sum, space) => sum + space.entries.reduce((entrySum, entry) => entrySum + entry.images.length, 0), 0);
  const generatedAt = nowIso();

  return {
    generatedAt,
    spaceCount: spaces.length,
    spaceLimit: DEMO_SPACE_LIMIT,
    remainingSpaceCount: Math.max(DEMO_SPACE_LIMIT - spaces.length, 0),
    spaceUsagePercent: DEMO_SPACE_LIMIT > 0 ? (spaces.length / DEMO_SPACE_LIMIT) * 100 : 0,
    photoFileCount: referencedPhotoCount,
    referencedPhotoCount,
    storageBytes,
    storageLimitBytes: DEMO_STORAGE_LIMIT_BYTES,
    remainingStorageBytes: Math.max(DEMO_STORAGE_LIMIT_BYTES - storageBytes, 0),
    storageUsagePercent: DEMO_STORAGE_LIMIT_BYTES > 0 ? (storageBytes / DEMO_STORAGE_LIMIT_BYTES) * 100 : 0,
  };
}

function ensureUniqueEmail(email: string, currentUserId?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = readDatabase();
  const duplicate = db.users.find((user) => user.email === normalizedEmail && user.id !== currentUserId);
  if (duplicate) {
    throw new ApiError('Email already exists', 409);
  }
}

function ensureValidAuthInput(email: string, password: string, nickname?: string) {
  if (!email || !password || (nickname !== undefined && !nickname)) {
    throw new ApiError('email, password and nickname are required', 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError('Invalid email', 400);
  }

  if (password.length < 8) {
    throw new ApiError('Password must be at least 8 characters', 400);
  }

  if (nickname !== undefined && nickname.length > 32) {
    throw new ApiError('Nickname is too long', 400);
  }
}

export async function fetchMe(): Promise<User> {
  return toPublicUser(getCurrentUserRecord());
}

export async function register(payload: {email: string; password: string; nickname: string}): Promise<User> {
  const email = payload.email.trim().toLowerCase();
  const password = payload.password.trim();
  const nickname = payload.nickname.trim();

  ensureValidAuthInput(email, password, nickname);
  ensureUniqueEmail(email);

  const db = readDatabase();
  const user: DemoUserRecord = {
    id: createId('user'),
    email,
    nickname,
    password,
  };

  db.users.push(user);
  db.spacesByUserId[user.id] = [];
  writeDatabase(db);
  writeSession({userId: user.id});

  return toPublicUser(user);
}

export async function login(payload: {email: string; password: string}): Promise<User> {
  const email = payload.email.trim().toLowerCase();
  const password = payload.password.trim();
  if (!email || !password) {
    throw new ApiError('email and password are required', 400);
  }

  const db = readDatabase();
  const user = db.users.find((item) => item.email === email);
  if (!user || user.password !== password) {
    throw new ApiError('Invalid email or password', 401);
  }

  writeSession({userId: user.id});
  return toPublicUser(user);
}

export async function logout(): Promise<void> {
  writeSession(null);
}

export async function changePassword(payload: {currentPassword: string; newPassword: string}): Promise<void> {
  const currentUser = getCurrentUserRecord();
  const currentPassword = payload.currentPassword.trim();
  const newPassword = payload.newPassword.trim();

  if (currentUser.password !== currentPassword) {
    throw new ApiError('Current password is incorrect', 401);
  }

  if (newPassword.length < 8) {
    throw new ApiError('Password must be at least 8 characters', 400);
  }

  const db = readDatabase();
  const index = db.users.findIndex((user) => user.id === currentUser.id);
  db.users[index] = {
    ...db.users[index],
    password: newPassword,
  };
  writeDatabase(db);
}

export async function fetchSpaces(): Promise<Space[]> {
  return getCurrentUserSpaces();
}

export async function createSpace(payload: {
  name: string;
  avatarImage: string;
  avatarThumbnailImage?: string;
  heroImage?: string;
  heroThumbnailImage?: string;
  description?: string;
}): Promise<Space> {
  const user = getCurrentUserRecord();
  const db = readDatabase();
  const spaces = db.spacesByUserId[user.id] ?? [];

  if (spaces.length >= DEMO_SPACE_LIMIT) {
    throw new ApiError('当前账户已达到空间数量上限', 409);
  }

  const nextSpace: Space = {
    id: createId('space'),
    name: payload.name.trim() || '未命名空间',
    avatarImage: payload.avatarImage,
    avatarThumbnailImage: payload.avatarThumbnailImage ?? payload.avatarImage,
    avatarFocus: {x: 50, y: 50, scale: 1},
    heroImage: payload.heroImage ?? HERO_IMAGE,
    heroThumbnailImage: payload.heroThumbnailImage ?? payload.heroImage ?? HERO_IMAGE,
    description: payload.description ?? '记录每一个闪光瞬间。',
    visibility: 'private',
    infoCapsules: [
      {id: createId('capsule'), type: 'date', label: '日期', value: '2026-04-18'},
      {id: createId('capsule'), type: 'location', label: '地点', value: '未设定'},
    ],
    entries: [],
    treeholeEntries: [],
  };

  db.spacesByUserId[user.id] = [...spaces, nextSpace];
  writeDatabase(db);
  return cloneSpace(nextSpace);
}

export async function updateSpaceMeta(
  id: string,
  payload: Partial<
    Pick<
      Space,
      'name' | 'avatarImage' | 'avatarThumbnailImage' | 'heroImage' | 'heroThumbnailImage' | 'description' | 'infoCapsules'
    >
  >,
): Promise<Space> {
  const user = getCurrentUserRecord();
  const db = readDatabase();
  const spaces = db.spacesByUserId[user.id] ?? [];
  const index = spaces.findIndex((space) => space.id === id);
  if (index < 0) {
    throw new ApiError('Space not found', 404);
  }

  const updated: Space = {
    ...spaces[index],
    ...cloneSpace(payload),
  };

  spaces[index] = updated;
  db.spacesByUserId[user.id] = spaces;
  writeDatabase(db);
  return cloneSpace(updated);
}

export async function deleteSpace(id: string): Promise<void> {
  const user = getCurrentUserRecord();
  const db = readDatabase();
  db.spacesByUserId[user.id] = (db.spacesByUserId[user.id] ?? []).filter((space) => space.id !== id);
  writeDatabase(db);
}

export async function saveSpaceSnapshot(space: Space): Promise<Space> {
  const user = getCurrentUserRecord();
  const db = readDatabase();
  const spaces = db.spacesByUserId[user.id] ?? [];
  const index = spaces.findIndex((item) => item.id === space.id);
  if (index < 0) {
    throw new ApiError('Space not found', 404);
  }

  spaces[index] = cloneSpace(space);
  db.spacesByUserId[user.id] = spaces;
  writeDatabase(db);
  return cloneSpace(space);
}

export async function uploadImage(file: File, onProgress?: UploadProgressHandler): Promise<ImageUploadResult> {
  return new Promise<ImageUploadResult>((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const total = Math.max(event.total, 0);
      const loaded = Math.min(Math.max(event.loaded, 0), total);
      const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
      onProgress({loaded, total, percent});
    };

    reader.onerror = () => {
      reject(new ApiError('Image upload failed', 400));
    };

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new ApiError('Image upload failed', 400));
        return;
      }

      if (onProgress) {
        onProgress({
          loaded: file.size,
          total: file.size,
          percent: 100,
        });
      }

      resolve({
        url: result,
        thumbnailUrl: result,
      });
    };

    reader.readAsDataURL(file);
  });
}

export async function fetchAdminDashboard(): Promise<AdminDashboardStats> {
  const currentUser = getCurrentUserRecord();
  if (currentUser.email !== DEMO_EMAIL) {
    throw new ApiError('Forbidden', 403);
  }

  const db = readDatabase();
  const perUser = db.users.map((user) => {
    const spaces = db.spacesByUserId[user.id] ?? [];
    const account = buildAccountStats(user.id, spaces);
    return {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      spaceCount: account.spaceCount,
      spaceLimit: account.spaceLimit,
      remainingSpaceCount: account.remainingSpaceCount,
      spaceUsagePercent: account.spaceUsagePercent,
      photoFileCount: account.photoFileCount,
      referencedPhotoCount: account.referencedPhotoCount,
      storageBytes: account.storageBytes,
      storageLimitBytes: account.storageLimitBytes,
      remainingStorageBytes: account.remainingStorageBytes,
      storageUsagePercent: account.storageUsagePercent,
      storageSharePercent: 0,
    };
  });

  const usedBytes = perUser.reduce((sum, item) => sum + item.storageBytes, 0);
  const totalStorage = perUser.reduce((sum, item) => sum + item.storageLimitBytes, 0);

  const normalizedPerUser = perUser.map((item) => ({
    ...item,
    storageSharePercent: usedBytes > 0 ? (item.storageBytes / usedBytes) * 100 : 0,
  }));

  return {
    generatedAt: nowIso(),
    userCount: db.users.length,
    spaceCount: normalizedPerUser.reduce((sum, item) => sum + item.spaceCount, 0),
    photoFileCount: normalizedPerUser.reduce((sum, item) => sum + item.photoFileCount, 0),
    photoReferenceCount: normalizedPerUser.reduce((sum, item) => sum + item.referencedPhotoCount, 0),
    referencedExistingPhotoCount: normalizedPerUser.reduce((sum, item) => sum + item.referencedPhotoCount, 0),
    orphanPhotoFileCount: 0,
    missingPhotoFileCount: 0,
    usedBytes,
    capacityBytes: totalStorage,
    remainingBytes: Math.max(totalStorage - usedBytes, 0),
    usagePercent: totalStorage > 0 ? (usedBytes / totalStorage) * 100 : 0,
    perUser: normalizedPerUser,
  };
}

export async function fetchAccountDashboard(): Promise<AccountDashboardStats> {
  const user = getCurrentUserRecord();
  const spaces = getCurrentUserSpaces();
  return buildAccountStats(user.id, spaces);
}
