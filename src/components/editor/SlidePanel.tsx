'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { Slide } from '@/types';

interface Props {
  slides: Slide[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}

export default function SlidePanel({ slides, selectedId, onSelect, onAdd, onDelete, onReorder }: Props) {
  return (
    <div className="w-56 bg-zinc-100 border-r flex flex-col" data-testid="slide-panel">
      <div className="p-3 border-b flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase">Slides ({slides.length})</span>
        <Button size="sm" variant="ghost" onClick={onAdd} data-testid="add-slide-btn">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              onClick={() => onSelect(slide.id)}
              className={`group relative cursor-pointer rounded border-2 transition-all ${
                selectedId === slide.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-zinc-300'
              }`}
              data-testid={`slide-thumb-${slide.id}`}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('slide-index', String(index))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const from = parseInt(e.dataTransfer.getData('slide-index'));
                onReorder(from, index);
              }}
            >
              <div className="flex items-center gap-1 px-1 pt-1">
                <GripVertical className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100" />
                <span className="text-[10px] text-zinc-400">{index + 1}</span>
              </div>
              <div
                className="mx-auto mb-1 rounded bg-white shadow-sm overflow-hidden"
                style={{
                  width: 180,
                  height: 101,
                  backgroundColor: slide.background_color || '#ffffff',
                  backgroundImage: slide.background_image ? `url(${slide.background_image})` : undefined,
                  backgroundSize: 'cover',
                }}
              >
                {slide.elements?.map((el) => {
                  const style = typeof el.style === 'string' ? JSON.parse(el.style) : el.style;
                  const content = typeof el.content === 'string' ? JSON.parse(el.content) : el.content;
                  return (
                    <div
                      key={el.id}
                      style={{
                        position: 'absolute',
                        left: (el.x / 960) * 180,
                        top: (el.y / 540) * 101,
                        width: (el.width / 960) * 180,
                        height: (el.height / 540) * 101,
                        fontSize: (style.fontSize || 16) * 0.15,
                        color: style.color || '#000',
                        backgroundColor: style.backgroundColor || 'transparent',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {content.text?.slice(0, 20)}
                    </div>
                  );
                })}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-red-500"
                onClick={(e) => { e.stopPropagation(); onDelete(slide.id); }}
                data-testid={`delete-slide-${slide.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
