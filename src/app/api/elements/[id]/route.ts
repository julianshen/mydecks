import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();

  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (body.content !== undefined) { fields.push('content = ?'); values.push(JSON.stringify(body.content)); }
  if (body.x !== undefined) { fields.push('x = ?'); values.push(body.x); }
  if (body.y !== undefined) { fields.push('y = ?'); values.push(body.y); }
  if (body.width !== undefined) { fields.push('width = ?'); values.push(body.width); }
  if (body.height !== undefined) { fields.push('height = ?'); values.push(body.height); }
  if (body.rotation !== undefined) { fields.push('rotation = ?'); values.push(body.rotation); }
  if (body.z_index !== undefined) { fields.push('z_index = ?'); values.push(body.z_index); }
  if (body.style !== undefined) { fields.push('style = ?'); values.push(JSON.stringify(body.style)); }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE elements SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const element = db.prepare('SELECT * FROM elements WHERE id = ?').get(id);
  return NextResponse.json(element);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const result = db.prepare('DELETE FROM elements WHERE id = ?').run(id);
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
