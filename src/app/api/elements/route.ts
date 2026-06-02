import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = randomUUID();
  const slideId = body.slide_id;
  const type = body.type || 'text';
  const content = JSON.stringify(body.content || {});
  const x = body.x ?? 100;
  const y = body.y ?? 100;
  const width = body.width ?? 200;
  const height = body.height ?? 50;
  const rotation = body.rotation ?? 0;
  const zIndex = body.z_index ?? 1;
  const style = JSON.stringify(body.style || {});

  db.prepare(`INSERT INTO elements (id, slide_id, type, content, x, y, width, height, rotation, z_index, style)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, slideId, type, content, x, y, width, height, rotation, zIndex, style);

  const element = db.prepare('SELECT * FROM elements WHERE id = ?').get(id);
  return NextResponse.json(element, { status: 201 });
}
