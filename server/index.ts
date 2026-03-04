import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import express from 'express';
import multer from 'multer';
import {UPLOADS_DIR} from './db';
import {
  createSpace,
  deleteSpace,
  getSpaceById,
  listSpaces,
  saveSpaceSnapshot,
  updateSpaceMeta,
} from './repository';
import type {CreateSpaceInput, Space} from './types';

const app = express();
const port = Number(process.env.PORT ?? 3001);

const uploadsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
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

app.use(express.json({limit: '10mb'}));
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ok: true, timestamp: new Date().toISOString()});
});

app.post('/api/uploads', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({error: 'No file uploaded'});
    return;
  }
  res.status(201).json({url: `/uploads/${req.file.filename}`});
});

app.get('/api/spaces', (_req, res) => {
  res.json(listSpaces());
});

app.get('/api/spaces/:id', (req, res) => {
  const space = getSpaceById(req.params.id);
  if (!space) {
    res.status(404).json({error: 'Space not found'});
    return;
  }
  res.json(space);
});

app.post('/api/spaces', (req, res) => {
  const payload = req.body as Partial<CreateSpaceInput>;
  if (!payload.name || !payload.avatarImage) {
    res.status(400).json({error: 'name and avatarImage are required'});
    return;
  }
  const created = createSpace({
    name: payload.name,
    avatarImage: payload.avatarImage,
    heroImage: payload.heroImage,
    description: payload.description,
  });
  res.status(201).json(created);
});

app.put('/api/spaces/:id', (req, res) => {
  const updated = updateSpaceMeta(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({error: 'Space not found'});
    return;
  }
  res.json(updated);
});

app.put('/api/spaces/:id/full', (req, res) => {
  const payload = req.body as Space;
  if (!payload || payload.id !== req.params.id) {
    res.status(400).json({error: 'Space payload id mismatch'});
    return;
  }

  if (!payload.name || !Array.isArray(payload.entries) || !Array.isArray(payload.treeholeEntries)) {
    res.status(400).json({error: 'Invalid payload'});
    return;
  }

  const saved = saveSpaceSnapshot(payload);
  res.json(saved);
});

app.delete('/api/spaces/:id', (req, res) => {
  const deleted = deleteSpace(req.params.id);
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

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server running on http://localhost:${port}`);
});
