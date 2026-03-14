import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import multer from 'multer';
import sharp from 'sharp';
import { assertCanCreateSpace, assertGlobalStorageCapacityAvailable, assertStorageQuotaAvailable, getAccountDashboardStats, getAdminDashboardStats, QuotaExceededError, } from './admin-dashboard';
import { UPLOADS_DIR, getUserUploadsDir } from './db';
import { createSpace, deleteSpace, getSpaceById, getSpaceSnapshotTarget, listSpaces, saveSpaceSnapshot, updateSpaceMeta, } from './repository';
import { hashPassword, verifyPassword } from './auth/password';
import { getSessionTokenFromRequest, requireAuth } from './auth/middleware';
import { createSession, revokeExpiredSessions, revokeSession, revokeSessionsByUserId } from './auth/session';
import { SESSION_COOKIE_NAME, SESSION_TTL_DAYS } from './auth/constants';
import { createUser, getUserByEmailWithPassword, getUserById, getUserByIdWithPassword, normalizeEmail, updateUserPassword, } from './user-repository';
import { pruneStaleOrphanedUploads } from './upload-storage';
const app = express();
const port = Number(process.env.PORT ?? 3001);
const SESSION_MAX_AGE_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
const THUMBNAIL_MAX_DIMENSION = 960;
const THUMBNAIL_QUALITY = 80;
const CLIENT_DIST_DIR = path.resolve(process.cwd(), 'dist');
const CLIENT_INDEX_PATH = path.join(CLIENT_DIST_DIR, 'index.html');
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: '认证请求过于频繁，请稍后再试' },
});
const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: '上传请求过于频繁，请稍后再试' },
});
const uploadsStorage = multer.diskStorage({
    destination: (req, _file, cb) => {
        const userId = req.user?.id;
        if (!userId) {
            cb(new Error('Unauthorized'), UPLOADS_DIR);
            return;
        }
        try {
            cb(null, getUserUploadsDir(userId));
        }
        catch (error) {
            cb(error, UPLOADS_DIR);
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
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image uploads are supported'));
            return;
        }
        cb(null, true);
    },
    limits: {
        fileSize: 8 * 1024 * 1024,
    },
});
function getThumbnailFilename(filename) {
    const ext = path.extname(filename);
    const baseName = ext ? filename.slice(0, -ext.length) : filename;
    return `${baseName}-thumb.jpg`;
}
async function createThumbnail(sourcePath, outputPath) {
    try {
        await sharp(sourcePath)
            .rotate()
            .resize({
            width: THUMBNAIL_MAX_DIMENSION,
            height: THUMBNAIL_MAX_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true,
        })
            .jpeg({
            quality: THUMBNAIL_QUALITY,
            mozjpeg: true,
        })
            .toFile(outputPath);
    }
    catch {
        throw new Error('Failed to generate image thumbnail');
    }
}
function cleanupFiles(paths) {
    const seen = new Set();
    for (const filePath of paths) {
        if (!filePath || seen.has(filePath))
            continue;
        seen.add(filePath);
        try {
            fs.unlinkSync(filePath);
        }
        catch {
            // Ignore cleanup failures and preserve the original error.
        }
    }
}
function setSessionCookie(res, token) {
    res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_MAX_AGE_MS,
        path: '/',
    });
}
function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
}
function extractClientIp(req) {
    return req.ip;
}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
const LEGACY_ADMIN_EMAIL = normalizeEmail(process.env.LEGACY_OWNER_EMAIL ?? 'legacy@digital-journal.local');
function canAccessAdminDashboard(email) {
    return normalizeEmail(email) === LEGACY_ADMIN_EMAIL;
}
function toResponseUser(user) {
    return {
        ...user,
        canAccessAdminDashboard: canAccessAdminDashboard(user.email),
    };
}
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(express.json({ limit: '10mb' }));
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
});
app.post('/api/auth/register', authRateLimiter, (req, res) => {
    const payload = req.body;
    const email = normalizeEmail(payload.email ?? '');
    const password = payload.password?.trim() ?? '';
    const nickname = payload.nickname?.trim() ?? '';
    if (!email || !password || !nickname) {
        res.status(400).json({ error: 'email, password and nickname are required' });
        return;
    }
    if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Invalid email' });
        return;
    }
    if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
    }
    if (nickname.length > 32) {
        res.status(400).json({ error: 'Nickname is too long' });
        return;
    }
    if (getUserByEmailWithPassword(email)) {
        res.status(409).json({ error: 'Email already exists' });
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
    res.status(201).json(toResponseUser(user));
});
app.post('/api/auth/login', authRateLimiter, (req, res) => {
    const payload = req.body;
    const email = normalizeEmail(payload.email ?? '');
    const password = payload.password?.trim() ?? '';
    if (!email || !password) {
        res.status(400).json({ error: 'email and password are required' });
        return;
    }
    const existing = getUserByEmailWithPassword(email);
    if (!existing || !verifyPassword(password, existing.passwordHash)) {
        res.status(401).json({ error: 'Invalid email or password' });
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
        res.status(500).json({ error: 'Failed to load user profile' });
        return;
    }
    res.json(toResponseUser(user));
});
app.post('/api/auth/logout', (req, res) => {
    const token = getSessionTokenFromRequest(req);
    if (token)
        revokeSession(token);
    clearSessionCookie(res);
    res.status(204).send();
});
app.post('/api/auth/change-password', authRateLimiter, requireAuth, (req, res) => {
    const payload = req.body;
    const currentPassword = payload.currentPassword?.trim() ?? '';
    const newPassword = payload.newPassword?.trim() ?? '';
    if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'currentPassword and newPassword are required' });
        return;
    }
    if (newPassword.length < 8) {
        res.status(400).json({ error: 'New password must be at least 8 characters' });
        return;
    }
    const user = getUserByIdWithPassword(req.user.id);
    if (!user) {
        clearSessionCookie(res);
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
    }
    if (verifyPassword(newPassword, user.passwordHash)) {
        res.status(400).json({ error: 'New password must be different from current password' });
        return;
    }
    const newPasswordHash = hashPassword(newPassword);
    const updated = updateUserPassword(user.id, newPasswordHash);
    if (!updated) {
        res.status(500).json({ error: 'Failed to update password' });
        return;
    }
    revokeSessionsByUserId(user.id);
    const session = createSession({
        userId: user.id,
        userAgent: req.get('user-agent') ?? '',
        ip: extractClientIp(req),
    });
    setSessionCookie(res, session.token);
    res.json({ ok: true });
});
app.get('/api/me', requireAuth, (req, res) => {
    const user = getUserById(req.user.id);
    if (!user) {
        clearSessionCookie(res);
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    res.json(toResponseUser(user));
});
app.get('/api/admin/dashboard', requireAuth, (req, res) => {
    if (!canAccessAdminDashboard(req.user.email)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    res.json(getAdminDashboardStats());
});
app.get('/api/account/dashboard', requireAuth, (req, res) => {
    const stats = getAccountDashboardStats(req.user.id);
    if (!stats) {
        clearSessionCookie(res);
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    res.json(stats);
});
app.get('/uploads/:userId/:filename', requireAuth, (req, res) => {
    const requestedUserId = req.params.userId;
    if (req.user.id !== requestedUserId) {
        res.status(404).json({ error: 'File not found' });
        return;
    }
    const filename = req.params.filename;
    if (!filename || filename !== path.basename(filename)) {
        res.status(400).json({ error: 'Invalid filename' });
        return;
    }
    const baseDir = path.resolve(path.join(UPLOADS_DIR, requestedUserId));
    const filePath = path.resolve(path.join(baseDir, filename));
    if (!filePath.startsWith(`${baseDir}${path.sep}`)) {
        res.status(400).json({ error: 'Invalid file path' });
        return;
    }
    if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'File not found' });
        return;
    }
    res.sendFile(filePath);
});
app.post('/api/uploads', uploadRateLimiter, requireAuth, upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    const userId = req.user.id;
    const originalPath = req.file.path;
    const thumbnailFilename = getThumbnailFilename(req.file.filename);
    const thumbnailPath = path.join(path.dirname(originalPath), thumbnailFilename);
    try {
        await createThumbnail(originalPath, thumbnailPath);
        assertStorageQuotaAvailable(userId);
        assertGlobalStorageCapacityAvailable();
    }
    catch (error) {
        cleanupFiles([originalPath, thumbnailPath]);
        next(error);
        return;
    }
    res.status(201).json({
        url: `/uploads/${userId}/${req.file.filename}`,
        thumbnailUrl: `/uploads/${userId}/${thumbnailFilename}`,
    });
});
app.get('/api/spaces', requireAuth, (req, res) => {
    res.json(listSpaces(req.user.id));
});
app.get('/api/spaces/:id', requireAuth, (req, res) => {
    const space = getSpaceById(req.params.id, req.user.id);
    if (!space) {
        res.status(404).json({ error: 'Space not found' });
        return;
    }
    res.json(space);
});
app.post('/api/spaces', requireAuth, (req, res) => {
    const payload = req.body;
    if (!payload.name || !payload.avatarImage) {
        res.status(400).json({ error: 'name and avatarImage are required' });
        return;
    }
    if (payload.visibility && payload.visibility !== 'private') {
        res.status(400).json({ error: 'Only private visibility is supported in stage 1' });
        return;
    }
    assertCanCreateSpace(req.user.id);
    const created = createSpace(req.user.id, {
        name: payload.name,
        avatarImage: payload.avatarImage,
        heroImage: payload.heroImage,
        description: payload.description,
        infoCapsules: payload.infoCapsules,
        visibility: 'private',
    });
    res.status(201).json(created);
});
app.put('/api/spaces/:id', requireAuth, (req, res) => {
    const body = req.body;
    if (body.visibility && body.visibility !== 'private') {
        res.status(400).json({ error: 'Only private visibility is supported in stage 1' });
        return;
    }
    const updated = updateSpaceMeta(req.params.id, req.user.id, {
        ...body,
        visibility: 'private',
    });
    if (!updated) {
        res.status(404).json({ error: 'Space not found' });
        return;
    }
    res.json(updated);
});
app.put('/api/spaces/:id/full', requireAuth, (req, res) => {
    const payload = req.body;
    if (!payload || payload.id !== req.params.id) {
        res.status(400).json({ error: 'Space payload id mismatch' });
        return;
    }
    if (!payload.name || !Array.isArray(payload.entries) || !Array.isArray(payload.treeholeEntries)) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
    }
    if (payload.visibility && payload.visibility !== 'private') {
        res.status(400).json({ error: 'Only private visibility is supported in stage 1' });
        return;
    }
    const snapshotTarget = getSpaceSnapshotTarget(req.params.id, req.user.id);
    if (snapshotTarget === 'forbidden') {
        res.status(404).json({ error: 'Space not found' });
        return;
    }
    if (snapshotTarget === 'create') {
        assertCanCreateSpace(req.user.id);
    }
    try {
        const saved = saveSpaceSnapshot({
            ...payload,
            visibility: 'private',
        }, req.user.id);
        res.json(saved);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Space not found') {
            res.status(404).json({ error: 'Space not found' });
            return;
        }
        throw error;
    }
});
app.delete('/api/spaces/:id', requireAuth, (req, res) => {
    const deleted = deleteSpace(req.params.id, req.user.id);
    if (!deleted) {
        res.status(404).json({ error: 'Space not found' });
        return;
    }
    res.status(204).send();
});
app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
if (fs.existsSync(CLIENT_INDEX_PATH)) {
    app.use(express.static(CLIENT_DIST_DIR, { index: false }));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            next();
            return;
        }
        res.sendFile(CLIENT_INDEX_PATH);
    });
}
app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ error: 'Image upload exceeds the 8 MB limit' });
            return;
        }
        res.status(400).json({ error: err.message || 'Invalid upload payload' });
        return;
    }
    if (err.message === 'Only image uploads are supported' || err.message === 'Failed to generate image thumbnail') {
        res.status(400).json({ error: err.message });
        return;
    }
    if (err instanceof QuotaExceededError) {
        res.status(409).json({ error: err.message });
        return;
    }
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
revokeExpiredSessions();
const removedOrphanUploads = pruneStaleOrphanedUploads();
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API server running on http://localhost:${port}`);
    if (removedOrphanUploads > 0) {
        // eslint-disable-next-line no-console
        console.log(`Pruned ${removedOrphanUploads} stale orphan upload(s) on startup`);
    }
});
