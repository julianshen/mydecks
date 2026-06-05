import { NextRequest, NextResponse } from 'next/server';
import { addSlide } from '@/lib/decks';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const slide = addSlide({
    deckId: body.deck_id,
    sortOrder: body.sort_order,
    layout: body.layout,
    backgroundColor: body.background_color,
  });
  if (!slide) {
    return NextResponse.json({ error: 'Failed to retrieve created slide' }, { status: 500 });
  }
  return NextResponse.json(slide, { status: 201 });
}
