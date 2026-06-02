import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(id);
  if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const slides = db.prepare('SELECT * FROM slides WHERE deck_id = ? ORDER BY sort_order').all(id);
  for (const slide of slides) {
    (slide as any).elements = db.prepare('SELECT * FROM elements WHERE slide_id = ? ORDER BY z_index').all((slide as any).id);
  }

  return NextResponse.json({ ...deck as any, slides });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  db.prepare('UPDATE decks SET title = ?, theme = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(body.title || 'Untitled Deck', body.theme || 'default', id);
  const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(id);
  return NextResponse.json(deck);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM decks WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
