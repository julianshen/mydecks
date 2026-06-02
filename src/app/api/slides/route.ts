import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = randomUUID();
  const deckId = body.deck_id;
  const sortOrder = body.sort_order ?? 0;
  const layout = body.layout || 'blank';
  const bgColor = body.background_color || '#ffffff';

  db.prepare('INSERT INTO slides (id, deck_id, sort_order, layout, background_color) VALUES (?, ?, ?, ?, ?)')
    .run(id, deckId, sortOrder, layout, bgColor);

  // Add layout elements based on layout type
  if (layout === 'title') {
    addElement(db, id, 'heading', 'Click to add title', 80, 180, 800, 60, { fontSize: 44, textAlign: 'center', color: '#1a1a1a' });
    addElement(db, id, 'text', 'Click to add subtitle', 80, 280, 800, 40, { fontSize: 24, textAlign: 'center', color: '#666666' });
  } else if (layout === 'title-content') {
    addElement(db, id, 'heading', 'Click to add title', 60, 40, 840, 50, { fontSize: 36, color: '#1a1a1a' });
    addElement(db, id, 'text', 'Click to add content', 60, 120, 840, 360, { fontSize: 18, color: '#333333' });
  } else if (layout === 'two-column') {
    addElement(db, id, 'heading', 'Click to add title', 60, 40, 840, 50, { fontSize: 36, color: '#1a1a1a' });
    addElement(db, id, 'text', 'Left column', 60, 120, 420, 360, { fontSize: 18, color: '#333333' });
    addElement(db, id, 'text', 'Right column', 500, 120, 420, 360, { fontSize: 18, color: '#333333' });
  } else if (layout === 'image-text') {
    addElement(db, id, 'image', '', 60, 60, 400, 420, { backgroundColor: '#f0f0f0' }, JSON.stringify({ src: '', alt: 'Placeholder' }));
    addElement(db, id, 'heading', 'Click to add title', 500, 60, 400, 50, { fontSize: 32, color: '#1a1a1a' });
    addElement(db, id, 'text', 'Click to add description', 500, 140, 400, 340, { fontSize: 18, color: '#333333' });
  }

  const slide = db.prepare('SELECT * FROM slides WHERE id = ?').get(id);
  (slide as any).elements = db.prepare('SELECT * FROM elements WHERE slide_id = ? ORDER BY z_index').all(id);
  return NextResponse.json(slide, { status: 201 });
}

function addElement(
  db: any,
  slideId: string,
  type: string,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  style: Record<string, any>,
  content?: string
) {
  const id = randomUUID();
  db.prepare(`INSERT INTO elements (id, slide_id, type, content, x, y, width, height, z_index, style)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, slideId, type, content || JSON.stringify({ text }), x, y, w, h, 1, JSON.stringify(style));
}
