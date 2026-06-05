import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getDeck } from '@/lib/decks';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = getDeck(id);
  if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(deck);
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
  const result = db.prepare('DELETE FROM decks WHERE id = ?').run(id);
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
