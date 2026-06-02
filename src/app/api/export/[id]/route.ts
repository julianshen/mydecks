import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import PptxGenJS from 'pptxgenjs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(id) as any;
  if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const slides = db.prepare('SELECT * FROM slides WHERE deck_id = ? ORDER BY sort_order').all(id) as any[];

  const pptx = new PptxGenJS();
  pptx.title = deck.title;
  pptx.author = 'MyDecks';
  pptx.layout = 'LAYOUT_16x9';

  for (const slide of slides) {
    const slidePptx = pptx.addSlide();
    slidePptx.background = { color: slide.background_color || '#FFFFFF' };

    const elements = db.prepare('SELECT * FROM elements WHERE slide_id = ? ORDER BY z_index').all(slide.id) as any[];

    for (const el of elements) {
      const content = JSON.parse(el.content || '{}');
      const style = JSON.parse(el.style || '{}');
      const x = (el.x / 960) * 10;
      const y = (el.y / 540) * 5.625;
      const w = (el.width / 960) * 10;
      const h = (el.height / 540) * 5.625;

      if (el.type === 'heading' || el.type === 'text') {
        slidePptx.addText(content.text || '', {
          x, y, w, h,
          fontSize: style.fontSize ? style.fontSize * 0.75 : 18,
          fontFace: style.fontFamily || 'Arial',
          bold: style.fontWeight === 'bold',
          color: (style.color || '#000000').replace('#', ''),
          align: style.textAlign || 'left',
          valign: 'middle',
        });
      } else if (el.type === 'image') {
        if (content.src) {
          slidePptx.addImage({ path: content.src, x, y, w, h });
        } else {
          slidePptx.addShape('rect', { x, y, w, h, fill: { color: 'F0F0F0' } });
        }
      } else if (el.type === 'shape') {
        const shapeType = content.shapeType || 'rect';
        const shapeMap: Record<string, any> = {
          rect: 'rect',
          circle: 'ellipse',
          triangle: 'triangle',
        };
        slidePptx.addShape(shapeMap[shapeType] || 'rect', {
          x, y, w, h,
          fill: { color: (style.backgroundColor || '#3B82F6').replace('#', '') },
          line: { color: (style.borderColor || 'transparent').replace('#', ''), width: style.borderWidth || 0 },
        });
      }
    }
  }

  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${deck.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx"`,
    },
  });
}
