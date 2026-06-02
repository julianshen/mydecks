'use client';

import { useState, useRef, useEffect } from 'react';
import type { SlideElement } from '@/types';

interface Props {
  element: SlideElement;
  zoom: number;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeMouseDown: (e: React.MouseEvent, id: string, corner: string) => void;
  onDoubleClick: () => void;
}

export default function SlideElementView({ element, zoom, isSelected, onMouseDown, onResizeMouseDown, onDoubleClick }: Props) {
  const [editing, setEditing] = useState(false);
  const content = typeof element.content === 'string' ? JSON.parse(element.content) : element.content;
  const style = typeof element.style === 'string' ? JSON.parse(element.style) : element.style;
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x * zoom,
    top: element.y * zoom,
    width: element.width * zoom,
    height: element.height * zoom,
    transform: `rotate(${element.rotation}deg)`,
    zIndex: element.z_index,
    cursor: editing ? 'text' : 'move',
    userSelect: editing ? 'text' : 'none',
    overflow: 'hidden',
  };

  const contentStyle: React.CSSProperties = {
    fontSize: (style.fontSize || 16) * zoom,
    fontFamily: style.fontFamily || 'Arial',
    fontWeight: style.fontWeight || 'normal',
    color: style.color || '#000000',
    backgroundColor: style.backgroundColor || 'transparent',
    textAlign: (style.textAlign || 'left') as any,
    lineHeight: style.lineHeight || 1.4,
    padding: (style.padding || 8) * zoom,
    width: '100%',
    height: '100%',
    outline: 'none',
    border: 'none',
    wordWrap: 'break-word',
    opacity: style.opacity ?? 1,
  };

  const handleBlur = () => {
    setEditing(false);
    if (textRef.current) {
      const newText = textRef.current.innerText;
      if (newText !== content.text) {
        // Parent will handle update via onUpdateElement
        const event = new CustomEvent('element-text-change', { detail: { id: element.id, text: newText } });
        window.dispatchEvent(event);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && element.type === 'heading') {
      e.preventDefault();
      handleBlur();
    }
  };

  const renderContent = () => {
    if (element.type === 'image') {
      if (content.src) {
        return <img src={content.src} alt={content.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
      }
      return (
        <div style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
          <span style={{ fontSize: 14 * zoom, color: '#999' }}>Image</span>
        </div>
      );
    }

    if (element.type === 'shape') {
      const shapeType = content.shapeType || 'rect';
      const borderRadius = shapeType === 'circle' ? '50%' : shapeType === 'rect' ? (style.borderRadius || 0) * zoom : 0;
      return (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: style.backgroundColor || '#3B82F6',
          borderRadius,
          border: `${(style.borderWidth || 0) * zoom}px solid ${style.borderColor || 'transparent'}`,
          opacity: style.opacity ?? 1,
        }} />
      );
    }

    if (element.type === 'line') {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{
            width: '100%',
            height: (style.borderWidth || 2) * zoom,
            backgroundColor: style.borderColor || '#000000',
          }} />
        </div>
      );
    }

    // text / heading
    if (editing) {
      return (
        <div
          ref={textRef}
          contentEditable
          suppressContentEditableWarning
          style={contentStyle}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          dangerouslySetInnerHTML={{ __html: content.text?.replace(/\n/g, '<br>') || '' }}
        />
      );
    }

    return (
      <div
        style={contentStyle}
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); onDoubleClick(); }}
      >
        {content.text || ''}
      </div>
    );
  };

  const resizeHandles = ['nw', 'ne', 'sw', 'se'];

  return (
    <div
      style={baseStyle}
      onMouseDown={(e) => onMouseDown(e, element.id)}
      data-testid={`element-${element.id}`}
      data-element-type={element.type}
    >
      {renderContent()}
      {isSelected && !editing && (
        <>
          {resizeHandles.map(corner => (
            <div
              key={corner}
              data-testid={`resize-handle-${corner}-${element.id}`}
              style={{
                position: 'absolute',
                width: 8 * zoom,
                height: 8 * zoom,
                backgroundColor: '#3B82F6',
                border: `${zoom}px solid white`,
                borderRadius: '50%',
                cursor: `${corner}-resize`,
                ...(corner.includes('n') ? { top: -4 * zoom } : { bottom: -4 * zoom }),
                ...(corner.includes('w') ? { left: -4 * zoom } : { right: -4 * zoom }),
                zIndex: 100,
              }}
              onMouseDown={(e) => onResizeMouseDown(e, element.id, corner)}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              inset: -2 * zoom,
              border: `${zoom}px solid #3B82F6`,
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  );
}
