'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import SlideView from '@/components/editor/SlideView';
import { useEditorTheme } from '@/components/editor/useEditorTheme';
import type { Deck, Slide } from '@/types';

export default function PresentPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id?.[0];
  const { accentHue } = useEditorTheme();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!deckId) return;
    fetch(`/api/decks/${deckId}`)
      .then(r => r.json())
      .then(data => {
        setDeck(data);
        setSlides(data.slides || []);
      });
  }, [deckId]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const goNext = useCallback(() => setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1)), [slides.length]);
  const goPrev = useCallback(() => setCurrentIndex(prev => Math.max(0, prev - 1)), []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') { router.push(`/editor/${deckId}`); }
      if (e.key === 'f') { toggleFullscreen(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, router, deckId]);

  const slide = slides[currentIndex];
  const nextSlide = slides[currentIndex + 1];

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  if (!slide) {
    return (
      <div className="sc-app" data-theme="dark">
        <div className="presenter" data-testid="presenter-page" style={{ placeItems: 'center' }}>
          <span className="mono" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-app" data-theme="dark" style={{ '--accent-h': accentHue } as React.CSSProperties}>
      <div className="presenter" data-testid="presenter-page">
        <div className="presenter-main">
          <div className="label">Now presenting · {deck?.title || 'Deck'} · slide {currentIndex + 1} of {slides.length}</div>
          <div
            className="presenter-current"
            data-testid="present-slide-area"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              if (e.clientX - rect.left > rect.width / 2) goNext(); else goPrev();
            }}
          >
            <SlideView slide={slide} testid="present-slide" />
          </div>
        </div>

        <div className="presenter-side">
          <div>
            <div className="label">Next up</div>
            <div className="presenter-next">
              {nextSlide
                ? <SlideView slide={nextSlide} />
                : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#aaa', fontFamily: 'var(--f-mono)', fontSize: 12 }}>END OF DECK</div>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="label">Speaker notes</div>
            <div className="presenter-notes">
              Drive the narrative: what should the audience walk away believing? Keep this slide to one idea and land it before moving on.
            </div>
          </div>
        </div>

        <div className="presenter-bar">
          <div>
            <div className="clock">{mm}:{ss}</div>
            <div className="muted" style={{ marginTop: 2 }}>elapsed</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ fontSize: 20, color: '#fff', fontWeight: 500 }}>{currentIndex + 1} / {slides.length}</div>
            <div className="muted" style={{ marginTop: 2 }}>→ next · ← prev · esc to exit</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />
          <div className="progress-dots" style={{ flex: 1, maxWidth: 420 }}>
            {slides.map((s, i) => (
              <div key={s.id} className={`dot ${i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''}`} />
            ))}
          </div>
          <button onClick={goPrev} disabled={currentIndex === 0} data-testid="present-prev"><ChevronLeft size={13} /> Prev</button>
          <button onClick={goNext} disabled={currentIndex === slides.length - 1} data-testid="present-next">Next <ChevronRight size={13} /></button>
          <button onClick={toggleFullscreen} data-testid="present-fullscreen"><Maximize2 size={13} /> Full</button>
          <button onClick={() => router.push(`/editor/${deckId}`)} data-testid="present-exit"><X size={13} /> End</button>
        </div>
      </div>
    </div>
  );
}
