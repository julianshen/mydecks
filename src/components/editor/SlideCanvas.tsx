'use client';

import { useRef, useState, useCallback } from 'react';
import { SLIDE_WIDTH, SLIDE_HEIGHT, GRID_SIZE } from '@/types';
import type { Slide, SlideElement, EditorState } from '@/types';
import SlideElementView from './SlideElementView';

interface Props {
  slide: Slide;
  editorState: EditorState;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onSelectElement: (id: string | null) => void;
  onDeleteElement: (id: string) => void;
}

export default function SlideCanvas({ slide, editorState, onUpdateElement, onSelectElement }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; startW: number; startH: number; corner: string } | null>(null);

  const snap = useCallback((val: number) => {
    if (!editorState.snapToGrid) return val;
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
  }, [editorState.snapToGrid]);

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (editorState.mode !== 'select') return;
    e.stopPropagation();
    onSelectElement(elementId);
    const el = slide.elements?.find(e2 => e2.id === elementId);
    if (!el) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({
      id: elementId,
      offsetX: (e.clientX - rect.left) / editorState.zoom - el.x,
      offsetY: (e.clientY - rect.top) / editorState.zoom - el.y,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    const el = slide.elements?.find(e2 => e2.id === elementId);
    if (!el) return;
    setResizing({ id: elementId, startX: e.clientX, startY: e.clientY, startW: el.width, startH: el.height, corner });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = snap((e.clientX - rect.left) / editorState.zoom - dragging.offsetX);
      const y = snap((e.clientY - rect.top) / editorState.zoom - dragging.offsetY);
      onUpdateElement(dragging.id, { x: Math.max(0, Math.min(SLIDE_WIDTH - 10, x)), y: Math.max(0, Math.min(SLIDE_HEIGHT - 10, y)) });
    }
    if (resizing) {
      const dx = (e.clientX - resizing.startX) / editorState.zoom;
      const dy = (e.clientY - resizing.startY) / editorState.zoom;
      let w = resizing.startW;
      let h = resizing.startH;
      if (resizing.corner.includes('e')) w = Math.max(20, resizing.startW + dx);
      if (resizing.corner.includes('w')) w = Math.max(20, resizing.startW - dx);
      if (resizing.corner.includes('s')) h = Math.max(20, resizing.startH + dy);
      if (resizing.corner.includes('n')) h = Math.max(20, resizing.startH - dy);
      onUpdateElement(resizing.id, { width: snap(w), height: snap(h) });
    }
  }, [dragging, resizing, editorState.zoom, snap, onUpdateElement]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.role === 'slide-background') {
      onSelectElement(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-zinc-200 flex items-center justify-center p-8" data-testid="slide-canvas-container">
      <div
        ref={canvasRef}
        data-testid="slide-canvas"
        data-role="slide-background"
        className="relative bg-white shadow-lg"
        style={{
          width: SLIDE_WIDTH * editorState.zoom,
          height: SLIDE_HEIGHT * editorState.zoom,
          backgroundColor: slide.background_color || '#ffffff',
          backgroundImage: slide.background_image ? `url(${slide.background_image})` : undefined,
          backgroundSize: 'cover',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {editorState.showGrid && (
          <svg className="absolute inset-0 pointer-events-none" width={SLIDE_WIDTH * editorState.zoom} height={SLIDE_HEIGHT * editorState.zoom}>
            <defs>
              <pattern id="grid" width={GRID_SIZE * editorState.zoom} height={GRID_SIZE * editorState.zoom} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID_SIZE * editorState.zoom} 0 L 0 0 0 ${GRID_SIZE * editorState.zoom}`} fill="none" stroke="#e5e5e5" strokeWidth={0.5} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}
        {slide.elements?.map(el => (
          <SlideElementView
            key={el.id}
            element={el}
            zoom={editorState.zoom}
            isSelected={editorState.selectedElementId === el.id}
            onMouseDown={handleMouseDown}
            onResizeMouseDown={handleResizeMouseDown}
            onDoubleClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
