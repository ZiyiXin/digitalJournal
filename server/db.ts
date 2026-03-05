import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'digital-journal.db');

fs.mkdirSync(DATA_DIR, {recursive: true});
fs.mkdirSync(UPLOADS_DIR, {recursive: true});

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS spaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_image TEXT NOT NULL,
    avatar_x REAL NOT NULL DEFAULT 50,
    avatar_y REAL NOT NULL DEFAULT 50,
    avatar_scale REAL NOT NULL DEFAULT 1,
    hero_image TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS timeline_entries (
    id TEXT PRIMARY KEY,
    space_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    rotation REAL NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'timeline',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS timeline_images (
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (entry_id) REFERENCES timeline_entries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS treehole_entries (
    id TEXT PRIMARY KEY,
    space_id TEXT NOT NULL,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    color TEXT NOT NULL,
    rotation REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
  );
`);

type TableInfoRow = {
  name: string;
};

function ensureColumn(table: string, column: string, definition: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as TableInfoRow[];
  if (!rows.some((row) => row.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('timeline_entries', 'cover_x', 'REAL NOT NULL DEFAULT 50');
ensureColumn('timeline_entries', 'cover_y', 'REAL NOT NULL DEFAULT 42');
ensureColumn('spaces', 'avatar_x', 'REAL NOT NULL DEFAULT 50');
ensureColumn('spaces', 'avatar_y', 'REAL NOT NULL DEFAULT 50');
ensureColumn('spaces', 'avatar_scale', 'REAL NOT NULL DEFAULT 1');

const countRow = db.prepare('SELECT COUNT(*) AS count FROM spaces').get() as {count: number};

if (countRow.count === 0) {
  db.exec(`
    INSERT INTO spaces (id, name, avatar_image, hero_image, description)
    VALUES (
      '1',
      '田曦薇',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1518599904199-0ca897819ddb?auto=format&fit=crop&w=2000&q=80',
      '笑容明媚，眼若星辰。\\n这里是属于她的元气角落，记录每一个闪光瞬间。'
    );

    INSERT INTO timeline_entries (id, space_id, title, date, description, rotation, type) VALUES
      ('t1', '1', '《大奉打更人》杀青', '2023-12-05', '历经数月的拍摄，终于迎来了杀青。感谢剧组所有人的付出。', -2, 'timeline'),
      ('t2', '1', '《卿卿日常》开播', '2022-11-10', '一部充满欢笑与温情的剧集，希望大家喜欢李薇。', 1.5, 'timeline'),
      ('t3', '1', '《如此可爱的我们》上线', '2020-07-31', '青春里最明媚的一抹色彩，黄橙子来啦。', -1, 'timeline'),
      ('t4', '1', '日常碎片', '2023-02-14', '一些零碎的日常记录。', 2, 'timeline');

    INSERT INTO timeline_images (id, entry_id, image_url, text) VALUES
      ('img1', 't1', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', '临安公主红衣似火，明艳动人。'),
      ('img1_2', 't1', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', '杀青现场的阳光正好✨'),
      ('img2', 't2', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80', '李薇的笑容治愈了一切。'),
      ('img2_2', 't2', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80', '剧组日常花絮'),
      ('img2_3', 't2', 'https://images.unsplash.com/photo-1508622222024-5aa1541450ae?auto=format&fit=crop&w=800&q=80', '冬日里的温暖'),
      ('img3', 't3', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', '眼睛里有星星，笑起来像春天的风。'),
      ('img3_2', 't3', 'https://images.unsplash.com/photo-1440589473619-3cde28941638?auto=format&fit=crop&w=800&q=80', '青春的记忆'),
      ('img4', 't4', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', '情人节快乐呀💕');

    INSERT INTO treehole_entries (id, space_id, date, text, color, rotation) VALUES
      ('th1', '1', '2023-11-20', '今天重温了《卿卿日常》，还是会被李薇的笑容治愈。希望你每天都开心！', 'bg-[#fff0f3]', -2),
      ('th2', '1', '2023-10-14', '生日快乐！新的一岁要继续闪闪发光呀✨', 'bg-[#fffbeb]', 1.5),
      ('th3', '1', '2023-09-05', '期待你的新剧，无论什么角色都相信你能诠释得很好。', 'bg-[#f0f9ff]', -1),
      ('th4', '1', '2023-08-22', '今天天气很好，想到了你明媚的笑容☀️', 'bg-[#f0fdf4]', 2);
  `);
}
