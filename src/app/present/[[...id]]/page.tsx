'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Deck, Slide } from '@/types';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

const ChartComponent = dynamic(() => import('@/components/editor/ChartElement'), { ssr: false });

export default function PresentPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id?.[0];

  const [deck, setDeck] = useState<Deck | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!deckId) return;
    fetch(`/api/decks/${deckId}`)
      .then(r => r.json())
      .then(data => {
        setDeck(data);
        setSlides(data.slides || []);
      });
  }, [deckId]);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') { router.push(`/editor/${deckId}`); }
      if (e.key === 'f') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, router, deckId]);

  const slide = slides[currentIndex];
  if (!slide) return <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>;

  return (
    <div className="h-screen w-screen bg-black flex flex-col" data-testid="presenter-page">
      {/* Top bar */}
      <div className="h-10 bg-zinc-900 flex items-center justify-between px-4 text-white text-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/editor/${deckId}`)} className="hover:text-zinc-300" data-testid="present-exit">
            <X className="h-4 w-4" />
          </button>
          <span className="text-zinc-400">{deck?.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">{currentIndex + 1} / {slides.length}</span>
          <button onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }} className="hover:text-zinc-300" data-testid="present-fullscreen">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center p-8" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x > rect.width / 2) goNext();
        else goPrev();
      }} data-testid="present-slide-area">
        <div
          className="relative bg-white shadow-2xl"
          style={{
            width: '100%',
            maxWidth: 1280,
            aspectRatio: '16/9',
            backgroundColor: slide.background_color || '#ffffff',
            backgroundImage: slide.background_image ? `url(${slide.background_image})` : undefined,
            backgroundSize: 'cover',
          }}
          data-testid="present-slide"
        >
          {slide.elements?.map(el => {
            const style = typeof el.style === 'string' ? JSON.parse(el.style) : el.style;
            const elContent = typeof el.content === 'string' ? JSON.parse(el.content) : el.content;
            const scale = 1280 / 960;

            const baseStyle: React.CSSProperties = {
              position: 'absolute',
              left: el.x * scale,
              top: el.y * scale,
              width: el.width * scale,
              height: el.height * scale,
              transform: `rotate(${el.rotation}deg)`,
              zIndex: el.z_index,
              overflow: 'hidden',
            };

            const textStyle: React.CSSProperties = {
              fontSize: (style.fontSize || 16) * scale,
              fontFamily: style.fontFamily || 'Arial',
              fontWeight: style.fontWeight || 'normal',
              color: style.color || '#000000',
              backgroundColor: style.backgroundColor || 'transparent',
              textAlign: (style.textAlign || 'left') as React.CSSProperties['textAlign'],
              lineHeight: style.lineHeight || 1.4,
              padding: (style.padding || 8) * scale,
              width: '100%',
              height: '100%',
              wordWrap: 'break-word',
            };

            if (el.type === 'image') {
              return (
                <div key={el.id} style={baseStyle}>
                  {elContent.src ? (
                    <img src={elContent.src} alt={elContent.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ ...textStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                      <span style={{ fontSize: 14 * scale, color: '#999' }}>Image</span>
                    </div>
                  )}
                </div>
              );
            }

            if (el.type === 'shape') {
              const shapeType = elContent.shapeType || 'rect';
              const borderRadius = shapeType === 'circle' ? '50%' : shapeType === 'rect' ? (style.borderRadius || 0) * scale : 0;
              return (
                <div key={el.id} style={baseStyle}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: style.backgroundColor || '#3B82F6',
                    borderRadius,
                    border: `${(style.borderWidth || 0) * scale}px solid ${style.borderColor || 'transparent'}`,
                  }} />
                </div>
              );
            }

            if (el.type === 'line') {
              return (
                <div key={el.id} style={baseStyle}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      width: '100%',
                      height: (style.borderWidth || 2) * scale,
                      backgroundColor: style.borderColor || '#000000',
                    }} />
                  </div>
                </div>
              );
            }

            if (el.type === 'chart') {
              return (
                <div key={el.id} style={baseStyle}>
                  <ChartComponent
                    chartType={elContent.chartType || 'bar'}
                    chartData={elContent.chartData || { labels: [], datasets: [] }}
                    width={el.width * scale}
                    height={el.height * scale}
                  />
                </div>
              );
            }

            return (
              <div key={el.id} style={baseStyle}>
                <div style={textStyle}>{elContent.text || ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="h-14 bg-zinc-900 flex items-center justify-center gap-4">
        <button onClick={goPrev} disabled={currentIndex === 0} className="text-white disabled:text-zinc-600 hover:text-zinc-300" data-testid="present-prev">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="w-64 h-1 bg-zinc-700 rounded">
          <div className="h-full bg-blue-500 rounded transition-all" style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }} />
        </div>
        <button onClick={goNext} disabled={currentIndex === slides.length - 1} className="text-white disabled:text-zinc-600 hover:text-zinc-300" data-testid="present-next">
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
