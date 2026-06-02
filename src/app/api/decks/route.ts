import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  const db = getDb();
  const decks = db.prepare('SELECT * FROM decks ORDER BY updated_at DESC').all();
  return NextResponse.json(decks);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = randomUUID();
  const title = body.title || 'Untitled Deck';
  const theme = body.theme || 'default';

  db.prepare('INSERT INTO decks (id, title, theme) VALUES (?, ?, ?)').run(id, title, theme);

  // Create first slide
  const slideId = randomUUID();
  db.prepare('INSERT INTO slides (id, deck_id, sort_order, layout) VALUES (?, ?, ?, ?)')
    .run(slideId, id, 0, 'title');

  // Add default title + subtitle elements
  const titleElId = randomUUID();
  const subtitleElId = randomUUID();
  db.prepare(`INSERT INTO elements (id, slide_id, type, content, x, y, width, height, z_index, style)
    VALUES (?, ?, 'heading', ?, ?, ?, ?, ?, ?, ?)`)
    .run(titleElId, slideId, JSON.stringify({ text: 'Click to add title' }), 80, 180, 800, 60, 1, JSON.stringify({ fontSize: 44, textAlign: 'center', color: '#1a1a1a' }));

  db.prepare(`INSERT INTO elements (id, slide_id, type, content, x, y, width, height, z_index, style)
    VALUES (?, ?, 'text', ?, ?, ?, ?, ?, ?, ?)`)
    .run(subtitleElId, slideId, JSON.stringify({ text: 'Click to add subtitle' }), 80, 280, 800, 40, 2, JSON.stringify({ fontSize: 24, textAlign: 'center', color: '#666666' }));

  const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(id);
  return NextResponse.json(deck, { status: 201 });
}
