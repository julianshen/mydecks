import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  db.prepare('UPDATE slides SET sort_order = ?, layout = ?, background_color = ?, background_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(body.sort_order ?? 0, body.layout || 'blank', body.background_color || '#ffffff', body.background_image || null, id);
  const slide = db.prepare('SELECT * FROM slides WHERE id = ?').get(id);
  return NextResponse.json(slide);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const result = db.prepare('DELETE FROM slides WHERE id = ?').run(id);
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
