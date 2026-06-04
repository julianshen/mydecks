import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';

const DB_PATH = process.env.DB_PATH || join(process.cwd(), 'data', 'mydecks.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure the parent directory exists; the data/ dir is gitignored and
    // may be absent on a fresh checkout (e.g. CI), which would otherwise
    // make better-sqlite3 fail to open/create the database file.
    mkdirSync(dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled Deck',
      theme TEXT NOT NULL DEFAULT 'default',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS slides (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      layout TEXT NOT NULL DEFAULT 'blank',
      background_color TEXT DEFAULT '#ffffff',
      background_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS elements (
      id TEXT PRIMARY KEY,
      slide_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('text','heading','image','shape','line','chart','table')),
      content TEXT NOT NULL DEFAULT '{}',
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      width REAL NOT NULL DEFAULT 100,
      height REAL NOT NULL DEFAULT 50,
      rotation REAL NOT NULL DEFAULT 0,
      z_index INTEGER NOT NULL DEFAULT 0,
      style TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_slides_deck ON slides(deck_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_elements_slide ON elements(slide_id, z_index);
  `);
}
