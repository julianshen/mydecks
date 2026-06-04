'use client';

import { Plus, Trash2 } from 'lucide-react';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types';
import type { Slide, ElementStyle, ElementContent } from '@/types';

// Tolerate malformed/null JSON so one bad row can't crash the whole panel.
function safeParse(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

interface Props {
  slides: Slide[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}

function MiniSlide({ slide }: { slide: Slide }) {
  return (
    <div
      className="sc-thumb-slide"
      style={{
        backgroundColor: slide.background_color || '#ffffff',
        backgroundImage: slide.background_image ? `url(${slide.background_image})` : undefined,
        backgroundSize: 'cover',
      }}
    >
      {slide.elements?.map(el => {
        const style = safeParse(el.style) as ElementStyle;
        const content = safeParse(el.content) as ElementContent;
        return (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: `${(el.x / SLIDE_WIDTH) * 100}%`,
              top: `${(el.y / SLIDE_HEIGHT) * 100}%`,
              width: `${(el.width / SLIDE_WIDTH) * 100}%`,
              height: `${(el.height / SLIDE_HEIGHT) * 100}%`,
              fontSize: `${Math.max(2, ((style.fontSize || 16) / SLIDE_WIDTH) * 100)}cqw`,
              fontWeight: style.fontWeight || 'normal',
              color: style.color || '#000',
              backgroundColor: el.type === 'shape' || el.type === 'line' ? (style.backgroundColor || style.borderColor || '#3B82F6') : (style.backgroundColor || 'transparent'),
              borderRadius: el.type === 'shape' && content.shapeType === 'circle' ? '50%' : undefined,
              overflow: 'hidden',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {el.type === 'text' || el.type === 'heading' ? content.text : ''}
          </div>
        );
      })}
    </div>
  );
}

export default function SlidePanel({ slides, selectedId, onSelect, onAdd, onDelete, onReorder }: Props) {
  return (
    <div className="sc-leftpane" data-testid="slide-panel" style={{ containerType: 'inline-size' } as React.CSSProperties}>
      <div className="sc-pane-header">
        <span>Slides · {slides.length}</span>
        <div className="sc-pane-header-actions">
          <button className="sc-iconbtn" onClick={onAdd} title="Add slide" data-testid="add-slide-btn">
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="sc-thumbs">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`sc-thumb ${selectedId === slide.id ? 'active' : ''}`}
            data-testid={`slide-thumb-${slide.id}`}
            onClick={() => onSelect(slide.id)}
            draggable
            onDragStart={e => e.dataTransfer.setData('slide-index', String(index))}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const from = parseInt(e.dataTransfer.getData('slide-index'));
              if (!Number.isNaN(from)) onReorder(from, index);
            }}
          >
            <div className="sc-thumb-num">{String(index + 1).padStart(2, '0')}</div>
            <div style={{ position: 'relative', containerType: 'inline-size' } as React.CSSProperties}>
              <MiniSlide slide={slide} />
              <button
                className="sc-thumb-del"
                onClick={e => { e.stopPropagation(); onDelete(slide.id); }}
                title="Delete slide"
                data-testid={`delete-slide-${slide.id}`}
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
