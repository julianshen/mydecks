import type Database from 'better-sqlite3';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * Shared deck/slide/element data operations used by both the REST routes and
 * the MCP server, so programmatic decks behave identically to ones built in the
 * editor UI. All functions are synchronous (better-sqlite3) and return the
 * persisted rows.
 */

export const ELEMENT_TYPES = ['text', 'heading', 'image', 'shape', 'line', 'chart', 'table'] as const;
export type ElementType = (typeof ELEMENT_TYPES)[number];

interface ElementInput {
  slideId: string;
  type?: ElementType;
  content?: Record<string, unknown>;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  style?: Record<string, unknown>;
}

function insertElement(
  db: Database.Database,
  slideId: string,
  type: string,
  content: Record<string, unknown>,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex: number,
  style: Record<string, unknown>,
  rotation = 0,
) {
  const id = randomUUID();
  db.prepare(`INSERT INTO elements (id, slide_id, type, content, x, y, width, height, rotation, z_index, style)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, slideId, type, JSON.stringify(content), x, y, width, height, rotation, zIndex, JSON.stringify(style));
  return id;
}

/** Default placeholder elements seeded for the built-in slide layouts. */
function seedLayout(db: Database.Database, slideId: string, layout: string) {
  if (layout === 'title') {
    insertElement(db, slideId, 'heading', { text: 'Click to add title' }, 80, 180, 800, 60, 1, { fontSize: 44, textAlign: 'center', color: '#1a1a1a' });
    insertElement(db, slideId, 'text', { text: 'Click to add subtitle' }, 80, 280, 800, 40, 2, { fontSize: 24, textAlign: 'center', color: '#666666' });
  } else if (layout === 'title-content') {
    insertElement(db, slideId, 'heading', { text: 'Click to add title' }, 60, 40, 840, 50, 1, { fontSize: 36, color: '#1a1a1a' });
    insertElement(db, slideId, 'text', { text: 'Click to add content' }, 60, 120, 840, 360, 1, { fontSize: 18, color: '#333333' });
  } else if (layout === 'two-column') {
    insertElement(db, slideId, 'heading', { text: 'Click to add title' }, 60, 40, 840, 50, 1, { fontSize: 36, color: '#1a1a1a' });
    insertElement(db, slideId, 'text', { text: 'Left column' }, 60, 120, 420, 360, 1, { fontSize: 18, color: '#333333' });
    insertElement(db, slideId, 'text', { text: 'Right column' }, 500, 120, 420, 360, 1, { fontSize: 18, color: '#333333' });
  } else if (layout === 'image-text') {
    insertElement(db, slideId, 'image', { src: '', alt: 'Placeholder' }, 60, 60, 400, 420, 1, { backgroundColor: '#f0f0f0' });
    insertElement(db, slideId, 'heading', { text: 'Click to add title' }, 500, 60, 400, 50, 1, { fontSize: 32, color: '#1a1a1a' });
    insertElement(db, slideId, 'text', { text: 'Click to add description' }, 500, 140, 400, 340, 1, { fontSize: 18, color: '#333333' });
  }
}

export function listDecks() {
  return getDb().prepare('SELECT * FROM decks ORDER BY updated_at DESC').all();
}

export function getDeck(id: string) {
  const db = getDb();
  const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!deck) return null;
  const slides = db.prepare('SELECT * FROM slides WHERE deck_id = ? ORDER BY sort_order').all(id) as Array<Record<string, unknown> & { id: string }>;
  for (const slide of slides) {
    slide.elements = db.prepare('SELECT * FROM elements WHERE slide_id = ? ORDER BY z_index').all(slide.id);
  }
  return { ...deck, slides };
}

/** Creates a deck plus a first "title" slide with placeholder title/subtitle. */
export function createDeck(input: { title?: string; theme?: string } = {}) {
  const db = getDb();
  const id = randomUUID();
  const title = input.title || 'Untitled Deck';
  const theme = input.theme || 'default';
  db.prepare('INSERT INTO decks (id, title, theme) VALUES (?, ?, ?)').run(id, title, theme);

  const slideId = randomUUID();
  db.prepare('INSERT INTO slides (id, deck_id, sort_order, layout) VALUES (?, ?, ?, ?)').run(slideId, id, 0, 'title');
  seedLayout(db, slideId, 'title');

  return db.prepare('SELECT * FROM decks WHERE id = ?').get(id) as Record<string, unknown>;
}

export function addSlide(input: { deckId: string; sortOrder?: number; layout?: string; backgroundColor?: string }) {
  const db = getDb();
  const id = randomUUID();
  const layout = input.layout || 'blank';
  db.prepare('INSERT INTO slides (id, deck_id, sort_order, layout, background_color) VALUES (?, ?, ?, ?, ?)')
    .run(id, input.deckId, input.sortOrder ?? 0, layout, input.backgroundColor || '#ffffff');
  seedLayout(db, id, layout);

  const slide = db.prepare('SELECT * FROM slides WHERE id = ?').get(id) as (Record<string, unknown> & { elements?: unknown }) | undefined;
  if (!slide) return null;
  slide.elements = db.prepare('SELECT * FROM elements WHERE slide_id = ? ORDER BY z_index').all(id);
  return slide;
}

export function addElement(input: ElementInput) {
  const db = getDb();
  const id = insertElement(
    db,
    input.slideId,
    input.type || 'text',
    input.content || {},
    input.x ?? 100,
    input.y ?? 100,
    input.width ?? 200,
    input.height ?? 50,
    input.zIndex ?? 1,
    input.style || {},
    input.rotation ?? 0,
  );
  return db.prepare('SELECT * FROM elements WHERE id = ?').get(id) as Record<string, unknown>;
}

export function deleteSlide(id: string): boolean {
  return getDb().prepare('DELETE FROM slides WHERE id = ?').run(id).changes > 0;
}
