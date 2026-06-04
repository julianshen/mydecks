'use client';

import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types';
import type { Slide, ElementStyle, ElementContent } from '@/types';

const ChartComponent = dynamic(() => import('./ChartElement'), { ssr: false });

function parse<T>(value: unknown): T {
  if (value && typeof value === 'object') return value as T;
  if (typeof value !== 'string') return {} as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
}

interface Props {
  slide: Slide;
  testid?: string;
  className?: string;
}

/**
 * Renders a slide's elements at their true 960×540 coordinates, scaled to
 * fill the container (which sets a 16:9 box). Scale is measured so charts and
 * fonts stay pixel-accurate at any size — reused by the presenter previews.
 */
export default function SlideView({ slide, testid, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      if (entries[0]) setScale(entries[0].contentRect.width / SLIDE_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-testid={testid}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${SLIDE_WIDTH} / ${SLIDE_HEIGHT}`,
        overflow: 'hidden',
        background: slide.background_color || '#ffffff',
        backgroundImage: slide.background_image ? `url(${slide.background_image})` : undefined,
        backgroundSize: 'cover',
      }}
    >
      {scale > 0 && slide.elements?.map(el => {
        const style = parse<ElementStyle>(el.style);
        const content = parse<ElementContent>(el.content);
        const base: React.CSSProperties = {
          position: 'absolute',
          left: el.x * scale,
          top: el.y * scale,
          width: el.width * scale,
          height: el.height * scale,
          transform: `rotate(${el.rotation}deg)`,
          zIndex: el.z_index,
          overflow: 'hidden',
        };

        if (el.type === 'image') {
          return (
            <div key={el.id} style={base}>
              {content.src
                ? <img src={content.src} alt={content.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: '#f0f0f0' }} />}
            </div>
          );
        }
        if (el.type === 'shape') {
          const shapeType = content.shapeType || 'rect';
          const borderRadius = shapeType === 'circle' ? '50%' : (style.borderRadius || 0) * scale;
          return (
            <div key={el.id} style={base}>
              <div style={{
                width: '100%', height: '100%',
                backgroundColor: style.backgroundColor || '#3B82F6',
                borderRadius,
                border: `${(style.borderWidth || 0) * scale}px solid ${style.borderColor || 'transparent'}`,
                opacity: style.opacity ?? 1,
              }} />
            </div>
          );
        }
        if (el.type === 'line') {
          return (
            <div key={el.id} style={{ ...base, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', height: (style.borderWidth || 2) * scale, backgroundColor: style.borderColor || '#000' }} />
            </div>
          );
        }
        if (el.type === 'chart') {
          return (
            <div key={el.id} style={base}>
              <ChartComponent
                chartType={content.chartType || 'bar'}
                chartData={content.chartData || { labels: [], datasets: [] }}
                width={el.width * scale}
                height={el.height * scale}
              />
            </div>
          );
        }
        return (
          <div key={el.id} style={base}>
            <div style={{
              fontSize: (style.fontSize || 16) * scale,
              fontFamily: style.fontFamily || 'Arial',
              fontWeight: style.fontWeight || 'normal',
              color: style.color || '#000',
              backgroundColor: style.backgroundColor || 'transparent',
              textAlign: (style.textAlign || 'left') as React.CSSProperties['textAlign'],
              lineHeight: style.lineHeight || 1.4,
              padding: (style.padding || 8) * scale,
              width: '100%', height: '100%', wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}>
              {content.text || ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
