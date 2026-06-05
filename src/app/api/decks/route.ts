import { NextRequest, NextResponse } from 'next/server';
import { createDeck, listDecks } from '@/lib/decks';

export async function GET() {
  return NextResponse.json(listDecks());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const deck = createDeck({ title: body.title, theme: body.theme });
  return NextResponse.json(deck, { status: 201 });
}
