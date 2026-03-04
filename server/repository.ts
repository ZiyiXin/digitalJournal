import {randomUUID} from 'node:crypto';
import {db} from './db';
import type {
  CreateSpaceInput,
  Space,
  TimelineEntry,
  TimelineEntryType,
  TimelineImage,
  TreeholeEntry,
} from './types';

type SpaceRow = {
  id: string;
  name: string;
  avatar_image: string;
  hero_image: string;
  description: string;
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
  image_text: string | null;
};

type TreeholeRow = {
  id: string;
  date: string;
  text: string;
  color: string;
  rotation: number;
};

function mapSpace(row: SpaceRow, entries: TimelineEntry[], treeholeEntries: TreeholeEntry[]): Space {
  return {
    id: row.id,
    name: row.name,
    avatarImage: row.avatar_image,
    heroImage: row.hero_image,
    description: row.description,
    entries,
    treeholeEntries,
  };
}

function getTimelineBySpace(spaceId: string): TimelineEntry[] {
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
        i.text AS image_text
      FROM timeline_entries e
      LEFT JOIN timeline_images i ON i.entry_id = e.id
      WHERE e.space_id = ?
      ORDER BY e.date DESC, e.created_at DESC, i.created_at ASC
    `,
    )
    .all(spaceId) as TimelineJoinRow[];

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
      };
      if (row.image_text) {
        image.text = row.image_text;
      }
      entry.images.push(image);
    }
  }

  return Array.from(entryMap.values());
}

function getTreeholeBySpace(spaceId: string): TreeholeEntry[] {
  const rows = db
    .prepare(
      `
      SELECT id, date, text, color, rotation
      FROM treehole_entries
      WHERE space_id = ?
      ORDER BY date DESC, created_at DESC
    `,
    )
    .all(spaceId) as TreeholeRow[];

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    text: row.text,
    color: row.color,
    rotation: row.rotation,
  }));
}

export function listSpaces(): Space[] {
  const rows = db
    .prepare(
      `
      SELECT id, name, avatar_image, hero_image, description
      FROM spaces
      ORDER BY created_at ASC
    `,
    )
    .all() as SpaceRow[];

  return rows.map((row) => mapSpace(row, getTimelineBySpace(row.id), getTreeholeBySpace(row.id)));
}

export function getSpaceById(spaceId: string): Space | null {
  const row = db
    .prepare(
      `
      SELECT id, name, avatar_image, hero_image, description
      FROM spaces
      WHERE id = ?
    `,
    )
    .get(spaceId) as SpaceRow | undefined;

  if (!row) return null;
  return mapSpace(row, getTimelineBySpace(spaceId), getTreeholeBySpace(spaceId));
}

export function createSpace(input: CreateSpaceInput): Space {
  const id = randomUUID();

  db.prepare(
    `
      INSERT INTO spaces (id, name, avatar_image, hero_image, description)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(
    id,
    input.name.trim(),
    input.avatarImage,
    input.heroImage ?? 'https://images.unsplash.com/photo-1518599904199-0ca897819ddb?auto=format&fit=crop&w=2000&q=80',
    input.description ?? '记录每一个闪光瞬间。',
  );

  return getSpaceById(id)!;
}

export function updateSpaceMeta(
  spaceId: string,
  input: Partial<Pick<Space, 'name' | 'avatarImage' | 'heroImage' | 'description'>>,
): Space | null {
  const current = getSpaceById(spaceId);
  if (!current) return null;

  db.prepare(
    `
      UPDATE spaces
      SET
        name = ?,
        avatar_image = ?,
        hero_image = ?,
        description = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
  ).run(
    input.name ?? current.name,
    input.avatarImage ?? current.avatarImage,
    input.heroImage ?? current.heroImage,
    input.description ?? current.description,
    spaceId,
  );

  return getSpaceById(spaceId);
}

const saveSpaceSnapshotTx = db.transaction((space: Space) => {
  db.prepare(
    `
      INSERT INTO spaces (id, name, avatar_image, hero_image, description)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        avatar_image = excluded.avatar_image,
        hero_image = excluded.hero_image,
        description = excluded.description,
        updated_at = datetime('now')
    `,
  ).run(space.id, space.name, space.avatarImage, space.heroImage, space.description);

  db.prepare('DELETE FROM timeline_images WHERE entry_id IN (SELECT id FROM timeline_entries WHERE space_id = ?)').run(space.id);
  db.prepare('DELETE FROM timeline_entries WHERE space_id = ?').run(space.id);

  const insertEntry = db.prepare(
    `
      INSERT INTO timeline_entries (id, space_id, title, date, description, rotation, type, cover_x, cover_y)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  );
  const insertImage = db.prepare(
    `
      INSERT INTO timeline_images (id, entry_id, image_url, text)
      VALUES (?, ?, ?, ?)
    `,
  );

  for (const entry of space.entries) {
    const entryId = entry.id || randomUUID();
    insertEntry.run(
      entryId,
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
      insertImage.run(image.id || randomUUID(), entryId, image.imageUrl, image.text ?? '');
    }
  }

  db.prepare('DELETE FROM treehole_entries WHERE space_id = ?').run(space.id);
  const insertTreehole = db.prepare(
    `
      INSERT INTO treehole_entries (id, space_id, date, text, color, rotation)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  );
  for (const entry of space.treeholeEntries) {
    insertTreehole.run(
      entry.id || randomUUID(),
      space.id,
      entry.date,
      entry.text,
      entry.color,
      entry.rotation ?? 0,
    );
  }
});

export function saveSpaceSnapshot(space: Space): Space {
  saveSpaceSnapshotTx(space);
  return getSpaceById(space.id)!;
}

export function deleteSpace(spaceId: string): boolean {
  const result = db.prepare('DELETE FROM spaces WHERE id = ?').run(spaceId);
  return result.changes > 0;
}
