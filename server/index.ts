import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import express from 'express';
import multer from 'multer';
import {getAdminDashboardStats} from './admin-dashboard';
import {UPLOADS_DIR, getUserUploadsDir} from './db';
import {
  createSpace,
  deleteSpace,
  getSpaceById,
  listSpaces,
  saveSpaceSnapshot,
  updateSpaceMeta,
} from './repository';
import {hashPassword, verifyPassword} from './auth/password';
import {getSessionTokenFromRequest, requireAuth} from './auth/middleware';
import {createSession, revokeExpiredSessions, revokeSession, revokeSessionsByUserId} from './auth/session';
import {SESSION_COOKIE_NAME, SESSION_TTL_DAYS} from './auth/constants';
import {
  createUser,
  getUserByEmailWithPassword,
  getUserById,
  getUserByIdWithPassword,
  normalizeEmail,
  updateUserPassword,
} from './user-repository';
import type {CreateSpaceInput, Space} from './types';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const SESSION_MAX_AGE_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

const uploadsStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = req.user?.id;
    if (!userId) {
      cb(new Error('Unauthorized'), UPLOADS_DIR);
      return;
    }

    try {
      cb(null, getUserUploadsDir(userId));
    } catch (error) {
      cb(error as Error, UPLOADS_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 8 ? ext : '.jpg';
    cb(null, `${Date.now()}-${randomUUID()}${safeExt}`);
  },
});

const upload = multer({
  storage: uploadsStorage,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

function setSessionCookie(res: express.Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  });
}

function clearSessionCookie(res: express.Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

function extractClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] ?? req.ip;
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() || req.ip;
  return req.ip;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAdminEmailAllowList(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return [];

  const emails = raw
    .split(',')
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  return Array.from(new Set(emails));
}

function canAccessAdminDashboard(email: string): boolean {
  const allowList = getAdminEmailAllowList();
  if (allowList.length === 0) return true;
  return allowList.includes(normalizeEmail(email));
}

app.use(express.json({limit: '10mb'}));

app.get('/api/health', (_req, res) => {
  res.json({ok: true, timestamp: new Date().toISOString()});
});

app.post('/api/auth/register', (req, res) => {
  const payload = req.body as Partial<{email: string; password: string; nickname: string}>;
  const email = normalizeEmail(payload.email ?? '');
  const password = payload.password?.trim() ?? '';
  const nickname = payload.nickname?.trim() ?? '';

  if (!email || !password || !nickname) {
    res.status(400).json({error: 'email, password and nickname are required'});
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({error: 'Invalid email'});
    return;
  }

  if (password.length < 8) {
    res.status(400).json({error: 'Password must be at least 8 characters'});
    return;
  }

  if (nickname.length > 32) {
    res.status(400).json({error: 'Nickname is too long'});
    return;
  }

  if (getUserByEmailWithPassword(email)) {
    res.status(409).json({error: 'Email already exists'});
    return;
  }

  const passwordHash = hashPassword(password);
  const user = createUser({
    email,
    passwordHash,
    nickname,
  });

  const session = createSession({
    userId: user.id,
    userAgent: req.get('user-agent') ?? '',
    ip: extractClientIp(req),
  });

  setSessionCookie(res, session.token);
  res.status(201).json(user);
});

app.post('/api/auth/login', (req, res) => {
  const payload = req.body as Partial<{email: string; password: string}>;
  const email = normalizeEmail(payload.email ?? '');
  const password = payload.password?.trim() ?? '';

  if (!email || !password) {
    res.status(400).json({error: 'email and password are required'});
    return;
  }

  const existing = getUserByEmailWithPassword(email);
  if (!existing || !verifyPassword(password, existing.passwordHash)) {
    res.status(401).json({error: 'Invalid email or password'});
    return;
  }

  const session = createSession({
    userId: existing.id,
    userAgent: req.get('user-agent') ?? '',
    ip: extractClientIp(req),
  });
  setSessionCookie(res, session.token);

  const user = getUserById(existing.id);
  if (!user) {
    res.status(500).json({error: 'Failed to load user profile'});
    return;
  }

  res.json(user);
});

app.post('/api/auth/logout', (req, res) => {
  const token = getSessionTokenFromRequest(req);
  if (token) revokeSession(token);
  clearSessionCookie(res);
  res.status(204).send();
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const payload = req.body as Partial<{currentPassword: string; newPassword: string}>;
  const currentPassword = payload.currentPassword?.trim() ?? '';
  const newPassword = payload.newPassword?.trim() ?? '';

  if (!currentPassword || !newPassword) {
    res.status(400).json({error: 'currentPassword and newPassword are required'});
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({error: 'New password must be at least 8 characters'});
    return;
  }

  const user = getUserByIdWithPassword(req.user!.id);
  if (!user) {
    clearSessionCookie(res);
    res.status(401).json({error: 'Unauthorized'});
    return;
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    res.status(401).json({error: 'Current password is incorrect'});
    return;
  }

  if (verifyPassword(newPassword, user.passwordHash)) {
    res.status(400).json({error: 'New password must be different from current password'});
    return;
  }

  const newPasswordHash = hashPassword(newPassword);
  const updated = updateUserPassword(user.id, newPasswordHash);
  if (!updated) {
    res.status(500).json({error: 'Failed to update password'});
    return;
  }

  revokeSessionsByUserId(user.id);
  const session = createSession({
    userId: user.id,
    userAgent: req.get('user-agent') ?? '',
    ip: extractClientIp(req),
  });
  setSessionCookie(res, session.token);

  res.json({ok: true});
});

app.get('/api/me', requireAuth, (req, res) => {
  const user = getUserById(req.user!.id);
  if (!user) {
    clearSessionCookie(res);
    res.status(401).json({error: 'Unauthorized'});
    return;
  }

  res.json(user);
});

app.get('/api/admin/dashboard', requireAuth, (req, res) => {
  if (!canAccessAdminDashboard(req.user!.email)) {
    res.status(403).json({error: 'Forbidden'});
    return;
  }

  res.json(getAdminDashboardStats());
});

app.get('/uploads/:userId/:filename', requireAuth, (req, res) => {
  const requestedUserId = req.params.userId;
  if (req.user!.id !== requestedUserId) {
    res.status(404).json({error: 'File not found'});
    return;
  }

  const filename = req.params.filename;
  if (!filename || filename !== path.basename(filename)) {
    res.status(400).json({error: 'Invalid filename'});
    return;
  }

  const baseDir = path.resolve(path.join(UPLOADS_DIR, requestedUserId));
  const filePath = path.resolve(path.join(baseDir, filename));
  if (!filePath.startsWith(`${baseDir}${path.sep}`)) {
    res.status(400).json({error: 'Invalid file path'});
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({error: 'File not found'});
    return;
  }

  res.sendFile(filePath);
});

app.post('/api/uploads', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({error: 'No file uploaded'});
    return;
  }

  res.status(201).json({url: `/uploads/${req.user!.id}/${req.file.filename}`});
});

app.get('/api/spaces', requireAuth, (req, res) => {
  res.json(listSpaces(req.user!.id));
});

app.get('/api/spaces/:id', requireAuth, (req, res) => {
  const space = getSpaceById(req.params.id, req.user!.id);
  if (!space) {
    res.status(404).json({error: 'Space not found'});
    return;
  }
  res.json(space);
});

app.post('/api/spaces', requireAuth, (req, res) => {
  const payload = req.body as Partial<CreateSpaceInput>;
  if (!payload.name || !payload.avatarImage) {
    res.status(400).json({error: 'name and avatarImage are required'});
    return;
  }
  if (payload.visibility && payload.visibility !== 'private') {
    res.status(400).json({error: 'Only private visibility is supported in stage 1'});
    return;
  }

  const created = createSpace(req.user!.id, {
    name: payload.name,
    avatarImage: payload.avatarImage,
    heroImage: payload.heroImage,
    description: payload.description,
    visibility: 'private',
  });
  res.status(201).json(created);
});

app.put('/api/spaces/:id', requireAuth, (req, res) => {
  const body = req.body as Partial<Space>;
  if (body.visibility && body.visibility !== 'private') {
    res.status(400).json({error: 'Only private visibility is supported in stage 1'});
    return;
  }

  const updated = updateSpaceMeta(req.params.id, req.user!.id, {
    ...body,
    visibility: 'private',
  });

  if (!updated) {
    res.status(404).json({error: 'Space not found'});
    return;
  }
  res.json(updated);
});

app.put('/api/spaces/:id/full', requireAuth, (req, res) => {
  const payload = req.body as Space;
  if (!payload || payload.id !== req.params.id) {
    res.status(400).json({error: 'Space payload id mismatch'});
    return;
  }

  if (!payload.name || !Array.isArray(payload.entries) || !Array.isArray(payload.treeholeEntries)) {
    res.status(400).json({error: 'Invalid payload'});
    return;
  }

  if (payload.visibility && payload.visibility !== 'private') {
    res.status(400).json({error: 'Only private visibility is supported in stage 1'});
    return;
  }

  try {
    const saved = saveSpaceSnapshot(
      {
        ...payload,
        visibility: 'private',
      },
      req.user!.id,
    );
    res.json(saved);
  } catch (error) {
    if (error instanceof Error && error.message === 'Space not found') {
      res.status(404).json({error: 'Space not found'});
      return;
    }
    throw error;
  }
});

app.delete('/api/spaces/:id', requireAuth, (req, res) => {
  const deleted = deleteSpace(req.params.id, req.user!.id);
  if (!deleted) {
    res.status(404).json({error: 'Space not found'});
    return;
  }
  res.status(204).send();
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({error: err.message || 'Internal Server Error'});
});

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, {recursive: true});
}

revokeExpiredSessions();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server running on http://localhost:${port}`);
});
