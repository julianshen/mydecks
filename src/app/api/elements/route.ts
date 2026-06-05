import { NextRequest, NextResponse } from 'next/server';
import { addElement, ELEMENT_TYPES, type ElementType } from '@/lib/decks';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type !== undefined && !(ELEMENT_TYPES as readonly string[]).includes(body.type)) {
    return NextResponse.json({ error: `Invalid element type: ${body.type}` }, { status: 400 });
  }
  const element = addElement({
    slideId: body.slide_id,
    type: body.type as ElementType | undefined,
    content: body.content,
    x: body.x,
    y: body.y,
    width: body.width,
    height: body.height,
    rotation: body.rotation,
    zIndex: body.z_index,
    style: body.style,
  });
  return NextResponse.json(element, { status: 201 });
}
