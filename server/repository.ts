import {randomUUID} from 'node:crypto';
import {db} from './db';
import {canEditSpace, canViewSpace} from './authz';
import type {
  CreateSpaceInput,
  InfoCapsule,
  InfoCapsuleType,
  Space,
  SpaceVisibility,
  TimelineEntry,
  TimelineEntryType,
  TimelineImage,
  TreeholeEntry,
} from './types';

type SpaceRow = {
  id: string;
  owner_id: string;
  name: string;
  avatar_image: string;
  avatar_thumbnail_image: string;
  avatar_x: number;
  avatar_y: number;
  avatar_scale: number;
  hero_image: string;
  hero_thumbnail_image: string;
  visibility: SpaceVisibility;
  description: string;
  info_capsules: string;
};

type TimelineJoinRow = {
  entry_id: string;
  entry_title: string;
  entry_date: string;
  entry_description: string;
  entry_rotation: number;
  entry_type: TimelineEntryType;
  entry_cover_x: number;
  entry_cover_y: number;
  image_id: string | null;
  image_url: string | null;
  image_thumbnail_url: string | null;
  image_text: string | null;
};

type TreeholeRow = {
  id: string;
  date: string;
  text: string;
  color: string;
  rotation: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const INFO_CAPSULE_TYPES: InfoCapsuleType[] = ['date', 'zodiac', 'location', 'custom'];
const DEFAULT_INFO_CAPSULES: InfoCapsule[] = [
  { id: 'default-date', type: 'date', label: '日期', value: '1997-10-14' },
  { id: 'default-zodiac', type: 'zodiac', label: '星座', value: '天秤座' },
  { id: 'default-location', type: 'location', label: '地点', value: '重庆市' },
];
const MAX_INFO_CAPSULES = 24;

function defaultCapsuleLabel(type: InfoCapsuleType): string {
  switch (type) {
    case 'date':
      return '日期';
    case 'zodiac':
      return '星座';
    case 'location':
      return '地点';
    default:
      return '自定义';
  }
}

function normalizeAvatarFocus(x: number, y: number, scale: number) {
  return {
    x: clamp(Number.isFinite(x) ? x : 50, 0, 100),
    y: clamp(Number.isFinite(y) ? y : 50, 0, 100),
    scale: clamp(Number.isFinite(scale) ? scale : 1, 1, 3),
  };
}

function normalizeVisibility(_visibility?: SpaceVisibility): SpaceVisibility {
  return 'private';
}

function normalizeInfoCapsuleType(value: unknown): InfoCapsuleType {
  if (typeof value !== 'string') return 'custom';
  return INFO_CAPSULE_TYPES.includes(value as InfoCapsuleType) ? (value as InfoCapsuleType) : 'custom';
}

function normalizeInfoCapsules(input: unknown): InfoCapsule[] {
  if (!Array.isArray(input)) {
    return DEFAULT_INFO_CAPSULES.map((capsule) => ({ ...capsule }));
  }

  const normalized = input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const capsule = item as Partial<InfoCapsule>;
      const type = normalizeInfoCapsuleType(capsule.type);
      const label = typeof capsule.label === 'string' && capsule.label.trim() ? capsule.label.trim().slice(0, 20) : defaultCapsuleLabel(type);
      const value = typeof capsule.value === 'string' ? capsule.value.trim().slice(0, 120) : '';
      if (!label && !value) return null;
      const id =
        typeof capsule.id === 'string' && capsule.id.trim()
          ? capsule.id.trim().slice(0, 64)
          : `capsule-${randomUUID()}`;
      return {
        id,
        type,
        label,
        value,
      };
    })
    .filter((item): item is InfoCapsule => item !== null)
    .slice(0, MAX_INFO_CAPSULES);
  return normalized;
}

function parseInfoCapsules(raw: string): InfoCapsule[] {
  if (!raw) return DEFAULT_INFO_CAPSULES.map((capsule) => ({ ...capsule }));
  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeInfoCapsules(parsed);
  } catch {
    return DEFAULT_INFO_CAPSULES.map((capsule) => ({ ...capsule }));
  }
}

function serializeInfoCapsules(capsules: unknown): string {
  return JSON.stringify(normalizeInfoCapsules(capsules));
}

function mapSpace(row: SpaceRow, entries: TimelineEntry[], treeholeEntries: TreeholeEntry[]): Space {
  return {
    id: row.id,
    name: row.name,
    avatarImage: row.avatar_image,
    avatarThumbnailImage: row.avatar_thumbnail_image || row.avatar_image,
    avatarFocus: normalizeAvatarFocus(row.avatar_x, row.avatar_y, row.avatar_scale),
    heroImage: row.hero_image,
    heroThumbnailImage: row.hero_thumbnail_image || row.hero_image,
    visibility: normalizeVisibility(row.visibility),
    description: row.description,
    infoCapsules: parseInfoCapsules(row.info_capsules),
    entries,
    treeholeEntries,
  };
}

function getTimelineBySpace(spaceId: string, ownerId: string): TimelineEntry[] {
  const rows = db
    .prepare(
      `
      SELECT
        e.id AS entry_id,
        e.title AS entry_title,
        e.date AS entry_date,
        e.description AS entry_description,
        e.rotation AS entry_rotation,
        e.type AS entry_type,
        e.cover_x AS entry_cover_x,
        e.cover_y AS entry_cover_y,
        i.id AS image_id,
        i.image_url AS image_url,
        i.thumbnail_url AS image_thumbnail_url,
        i.text AS image_text
      FROM timeline_entries e
      LEFT JOIN timeline_images i ON i.entry_id = e.id AND i.owner_id = e.owner_id
      WHERE e.space_id = ? AND e.owner_id = ?
      ORDER BY e.date DESC, e.created_at DESC, i.created_at ASC
    `,
    )
    .all(spaceId, ownerId) as TimelineJoinRow[];

  const entryMap = new Map<string, TimelineEntry>();

  for (const row of rows) {
    let entry = entryMap.get(row.entry_id);
    if (!entry) {
      entry = {
        id: row.entry_id,
        title: row.entry_title,
        date: row.entry_date,
        description: row.entry_description || '',
        rotation: row.entry_rotation || 0,
        type: row.entry_type || 'timeline',
        coverFocus: {
          x: Number.isFinite(row.entry_cover_x) ? row.entry_cover_x : 50,
          y: Number.isFinite(row.entry_cover_y) ? row.entry_cover_y : 42,
        },
        images: [],
      };
      entryMap.set(row.entry_id, entry);
    }

    if (row.image_id && row.image_url) {
      const image: TimelineImage = {
        id: row.image_id,
        imageUrl: row.image_url,
        thumbnailUrl: row.image_thumbnail_url || row.image_url,
      };
      if (row.image_text) {
        image.text = row.image_text;
      }
      entry.images.push(image);
    }
  }

  return Array.from(entryMap.values());
}

function getTreeholeBySpace(spaceId: string, ownerId: string): TreeholeEntry[] {
  const rows = db
    .prepare(
      `
      SELECT id, date, text, color, rotation
      FROM treehole_entries
      WHERE space_id = ? AND owner_id = ?
      ORDER BY date DESC, created_at DESC
    `,
    )
    .all(spaceId, ownerId) as TreeholeRow[];

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    text: row.text,
    color: row.color,
    rotation: row.rotation,
  }));
}

export function listSpaces(ownerId: string): Space[] {
  const rows = db
    .prepare(
      `
      SELECT id, owner_id, name, avatar_image, avatar_thumbnail_image, avatar_x, avatar_y, avatar_scale, hero_image, hero_thumbnail_image, visibility, description, info_capsules
      FROM spaces
      WHERE owner_id = ?
      ORDER BY created_at ASC
    `,
    )
    .all(ownerId) as SpaceRow[];

  return rows.map((row) => mapSpace(row, getTimelineBySpace(row.id, ownerId), getTreeholeBySpace(row.id, ownerId)));
}

export function getSpaceById(spaceId: string, ownerId: string): Space | null {
  const row = db
    .prepare(
      `
      SELECT id, owner_id, name, avatar_image, avatar_thumbnail_image, avatar_x, avatar_y, avatar_scale, hero_image, hero_thumbnail_image, visibility, description, info_capsules
      FROM spaces
      WHERE id = ? AND owner_id = ?
    `,
    )
    .get(spaceId, ownerId) as SpaceRow | undefined;

  if (!row) return null;
  if (!canViewSpace({currentUserId: ownerId, ownerId: row.owner_id, visibility: row.visibility})) {
    return null;
  }
  return mapSpace(row, getTimelineBySpace(spaceId, ownerId), getTreeholeBySpace(spaceId, ownerId));
}

export function createSpace(ownerId: string, input: CreateSpaceInput): Space {
  const id = randomUUID();

  db.prepare(
    `
      INSERT INTO spaces (
        id,
        owner_id,
        name,
        avatar_image,
        avatar_thumbnail_image,
        avatar_x,
        avatar_y,
        avatar_scale,
        hero_image,
        hero_thumbnail_image,
        visibility,
        description,
        info_capsules
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    id,
    ownerId,
    input.name.trim(),
    input.avatarImage,
    input.avatarThumbnailImage ?? input.avatarImage,
    input.avatarFocus?.x ?? 50,
    input.avatarFocus?.y ?? 50,
    input.avatarFocus?.scale ?? 1,
    input.heroImage ?? 'https://images.unsplash.com/photo-1518599904199-0ca897819ddb?auto=format&fit=crop&w=2000&q=80',
    input.heroThumbnailImage ?? input.heroImage ?? 'https://images.unsplash.com/photo-1518599904199-0ca897819ddb?auto=format&fit=crop&w=2000&q=80',
    normalizeVisibility(input.visibility),
    input.description ?? '记录每一个闪光瞬间。',
    serializeInfoCapsules(input.infoCapsules),
  );

  return getSpaceById(id, ownerId)!;
}

export function updateSpaceMeta(
  spaceId: string,
  ownerId: string,
  input: Partial<
    Pick<
      Space,
      'name' | 'avatarImage' | 'avatarThumbnailImage' | 'avatarFocus' | 'heroImage' | 'heroThumbnailImage' | 'description' | 'infoCapsules' | 'visibility'
    >
  >,
): Space | null {
  const current = getSpaceById(spaceId, ownerId);
  if (!current) return null;

  db.prepare(
    `
      UPDATE spaces
      SET
        name = ?,
        avatar_image = ?,
        avatar_thumbnail_image = ?,
        avatar_x = ?,
        avatar_y = ?,
        avatar_scale = ?,
        hero_image = ?,
        hero_thumbnail_image = ?,
        visibility = ?,
        description = ?,
        info_capsules = ?,
        updated_at = datetime('now')
      WHERE id = ? AND owner_id = ?
    `,
  ).run(
    input.name ?? current.name,
    input.avatarImage ?? current.avatarImage,
    input.avatarThumbnailImage ?? current.avatarThumbnailImage ?? current.avatarImage,
    input.avatarFocus?.x ?? current.avatarFocus.x,
    input.avatarFocus?.y ?? current.avatarFocus.y,
    input.avatarFocus?.scale ?? current.avatarFocus.scale,
    input.heroImage ?? current.heroImage,
    input.heroThumbnailImage ?? current.heroThumbnailImage ?? current.heroImage,
    normalizeVisibility(input.visibility ?? current.visibility),
    input.description ?? current.description,
    serializeInfoCapsules(input.infoCapsules ?? current.infoCapsules),
    spaceId,
    ownerId,
  );

  return getSpaceById(spaceId, ownerId);
}

const saveSpaceSnapshotTx = db.transaction((space: Space, ownerId: string) => {
  const ownershipRow = db
    .prepare('SELECT owner_id, visibility FROM spaces WHERE id = ? LIMIT 1')
    .get(space.id) as {owner_id: string; visibility: SpaceVisibility} | undefined;
  if (
    ownershipRow &&
    !canEditSpace({
      currentUserId: ownerId,
      ownerId: ownershipRow.owner_id,
      visibility: ownershipRow.visibility,
    })
  ) {
    throw new Error('Space not found');
  }

  db.prepare(
    `
      INSERT INTO spaces (
        id,
        owner_id,
        name,
        avatar_image,
        avatar_thumbnail_image,
        avatar_x,
        avatar_y,
        avatar_scale,
        hero_image,
        hero_thumbnail_image,
        visibility,
        description,
        info_capsules
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        avatar_image = excluded.avatar_image,
        avatar_thumbnail_image = excluded.avatar_thumbnail_image,
        avatar_x = excluded.avatar_x,
        avatar_y = excluded.avatar_y,
        avatar_scale = excluded.avatar_scale,
        hero_image = excluded.hero_image,
        hero_thumbnail_image = excluded.hero_thumbnail_image,
        visibility = excluded.visibility,
        description = excluded.description,
        info_capsules = excluded.info_capsules,
        updated_at = datetime('now')
      WHERE spaces.owner_id = excluded.owner_id
    `,
  ).run(
    space.id,
    ownerId,
    space.name,
    space.avatarImage,
    space.avatarThumbnailImage ?? space.avatarImage,
    space.avatarFocus?.x ?? 50,
    space.avatarFocus?.y ?? 50,
    space.avatarFocus?.scale ?? 1,
    space.heroImage,
    space.heroThumbnailImage ?? space.heroImage,
    normalizeVisibility(space.visibility),
    space.description,
    serializeInfoCapsules(space.infoCapsules),
  );

  db.prepare(
    'DELETE FROM timeline_images WHERE owner_id = ? AND entry_id IN (SELECT id FROM timeline_entries WHERE space_id = ? AND owner_id = ?)',
  ).run(ownerId, space.id, ownerId);
  db.prepare('DELETE FROM timeline_entries WHERE space_id = ? AND owner_id = ?').run(space.id, ownerId);

  const insertEntry = db.prepare(
    `
      INSERT INTO timeline_entries (id, owner_id, space_id, title, date, description, rotation, type, cover_x, cover_y)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  );
  const insertImage = db.prepare(
    `
      INSERT INTO timeline_images (id, owner_id, entry_id, image_url, thumbnail_url, text)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  );

  for (const entry of space.entries) {
    const entryId = entry.id || randomUUID();
    insertEntry.run(
      entryId,
      ownerId,
      space.id,
      entry.title ?? '',
      entry.date,
      entry.description ?? '',
      entry.rotation ?? 0,
      entry.type ?? 'timeline',
      entry.coverFocus?.x ?? 50,
      entry.coverFocus?.y ?? 42,
    );

    for (const image of entry.images ?? []) {
      insertImage.run(
        image.id || randomUUID(),
        ownerId,
        entryId,
        image.imageUrl,
        image.thumbnailUrl ?? image.imageUrl,
        image.text ?? '',
      );
    }
  }

  db.prepare('DELETE FROM treehole_entries WHERE space_id = ? AND owner_id = ?').run(space.id, ownerId);
  const insertTreehole = db.prepare(
    `
      INSERT INTO treehole_entries (id, owner_id, space_id, date, text, color, rotation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  );
  for (const entry of space.treeholeEntries) {
    insertTreehole.run(
      entry.id || randomUUID(),
      ownerId,
      space.id,
      entry.date,
      entry.text,
      entry.color,
      entry.rotation ?? 0,
    );
  }
});

export function saveSpaceSnapshot(space: Space, ownerId: string): Space {
  saveSpaceSnapshotTx(space, ownerId);
  const saved = getSpaceById(space.id, ownerId);
  if (!saved) {
    throw new Error('Space not found');
  }
  return saved;
}

export function deleteSpace(spaceId: string, ownerId: string): boolean {
  const result = db.prepare('DELETE FROM spaces WHERE id = ? AND owner_id = ?').run(spaceId, ownerId);
  return result.changes > 0;
}
