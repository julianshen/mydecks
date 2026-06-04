'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Sparkles, LayoutTemplate, Upload, LayoutGrid, History, Share2, Star,
  Trash2, Sun, Moon, Play, Pencil,
} from 'lucide-react';
import { useEditorTheme } from '@/components/editor/useEditorTheme';
import type { Deck } from '@/types';

const SECTIONS = [
  { id: 'all', label: 'All files', icon: LayoutGrid },
  { id: 'recent', label: 'Recent', icon: History },
  { id: 'shared', label: 'Shared', icon: Share2 },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const NEW_CARDS = [
  { id: 'blank', title: 'Blank deck', meta: '16:9 · 960×540', icon: Plus, primary: true },
  { id: 'ai', title: 'Start with AI', meta: 'From a prompt', icon: Sparkles, primary: false },
  { id: 'tmpl', title: 'From template', meta: '30+ templates', icon: LayoutTemplate, primary: false },
  { id: 'import', title: 'Import', meta: '.pptx · .key', icon: Upload, primary: false },
];

// Deterministic tint from the deck id for the dashboard cover.
function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, oklch(0.55 0.16 ${h}), oklch(0.45 0.15 ${(h + 40) % 360}))`;
}

function DeckCover({ deck }: { deck: Deck }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: tintFor(deck.id), color: '#fff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 10, left: 12, fontFamily: 'var(--f-mono)', fontSize: 9, opacity: 0.7, letterSpacing: '0.08em' }}>MYDECKS</div>
      <div style={{ position: 'absolute', bottom: 14, right: 14, width: 30, height: 30, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.3)' }} />
      <div style={{ position: 'absolute', left: '10%', top: '42%', fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: '70%', overflow: 'hidden' }}>{deck.title}</div>
    </div>
  );
}

// Lets a non-semantic element behave like a button for keyboard users:
// Enter/Space trigger the same handler as a click.
function onActivate(handler: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler();
    }
  };
}

export default function HomePage() {
  const router = useRouter();
  const { mode, toggleMode, accentHue } = useEditorTheme();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/decks')
      .then(r => r.json())
      .then(d => setDecks(Array.isArray(d) ? d : []))
      .catch(() => setDecks([]));
  }, []);

  async function createDeck() {
    const res = await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle || 'Untitled Deck' }),
    });
    if (!res.ok) return;
    const deck = (await res.json()) as Partial<Deck>;
    if (!deck.id) return;
    router.push(`/editor/${deck.id}`);
  }

  // Shared/Starred/Trash aren't backed by data yet, so those sections show an
  // empty state rather than misleadingly listing every active deck.
  const visibleDecks = filter === 'all' || filter === 'recent' ? decks : [];

  async function deleteDeck(id: string) {
    if (!confirm('Delete this deck?')) return;
    const res = await fetch(`/api/decks/${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    setDecks(prev => prev.filter(d => d.id !== id));
  }

  return (
    <div className="sc-app" data-theme={mode} data-testid="home-page" style={{ '--accent-h': accentHue } as React.CSSProperties}>
      <div className="sc-topbar">
        <div className="sc-logo">
          <span className="sc-logo-mark">M</span>
          <span data-testid="app-title">MyDecks</span>
        </div>
        <div className="sc-spacer" style={{ flex: 1 }} />
        <button className="sc-iconbtn" onClick={toggleMode} title="Toggle theme" data-testid="theme-toggle">
          {mode === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <button className="sc-btn accent" onClick={() => setOpen(true)} data-testid="new-deck-btn">
          <Plus size={14} /> New Deck
        </button>
      </div>

      <div className="home">
        <aside className="home-side">
          <div className="group-label">Library</div>
          {SECTIONS.map(s => (
            <div key={s.id} className={`side-item ${filter === s.id ? 'active' : ''}`} role="button" tabIndex={0} aria-pressed={filter === s.id} onClick={() => setFilter(s.id)} onKeyDown={onActivate(() => setFilter(s.id))}>
              <s.icon size={14} /> <span>{s.label}</span>
              <span className="count">{String(s.id === 'all' ? decks.length : 0).padStart(2, '0')}</span>
            </div>
          ))}
          <div className="group-label">Spaces</div>
          <div className="side-item"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)' }} /><span>Personal</span></div>
          <div className="side-item"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'oklch(0.62 0.13 155)' }} /><span>Atlas Co.</span></div>
        </aside>

        <main className="home-main">
          <h1>Your presentations</h1>
          <p className="home-sub">Create, edit, and present — all stored locally.</p>

          <div className="home-actions">
            {NEW_CARDS.map(c => (
              <div key={c.id} className={`new-card ${c.primary ? 'primary' : ''}`} role="button" tabIndex={0} aria-label={c.title} onClick={() => setOpen(true)} onKeyDown={onActivate(() => setOpen(true))}>
                <div className="preview">
                  <c.icon size={22} />
                </div>
                <div>
                  <div className="title">{c.title}</div>
                  <div className="meta">{c.meta}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-head">
            <h2>Your decks · {String(visibleDecks.length).padStart(2, '0')}</h2>
          </div>

          {visibleDecks.length === 0 ? (
            <div className="home-empty" data-testid="empty-state">
              <LayoutGrid size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
              <p>{filter === 'all' || filter === 'recent'
                ? 'No decks yet. Create your first presentation.'
                : 'Nothing here yet.'}</p>
            </div>
          ) : (
            <div className="deck-grid" data-testid="decks-grid">
              {visibleDecks.map((deck, i) => (
                <div key={deck.id} className="deck-card" data-testid={`deck-card-${deck.id}`} role="button" tabIndex={0} aria-label={`Open ${deck.title}`} onClick={() => router.push(`/editor/${deck.id}`)} onKeyDown={onActivate(() => router.push(`/editor/${deck.id}`))}>
                  <div className="cover"><DeckCover deck={deck} /></div>
                  <div className="info">
                    <div className="title">
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deck.title}</span>
                      {i === 0 && <span className="badge" style={{ background: 'var(--accent-wash)', color: 'var(--accent)' }}>LATEST</span>}
                    </div>
                    <div className="sub">
                      <span suppressHydrationWarning>{new Date(deck.updated_at).toLocaleDateString()}</span>
                      <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        <button className="sc-iconbtn" style={{ width: 22, height: 22 }} title="Edit" data-testid={`edit-deck-${deck.id}`} onClick={e => { e.stopPropagation(); router.push(`/editor/${deck.id}`); }}><Pencil size={12} /></button>
                        <button className="sc-iconbtn" style={{ width: 22, height: 22 }} title="Present" data-testid={`present-deck-${deck.id}`} onClick={e => { e.stopPropagation(); router.push(`/present/${deck.id}`); }}><Play size={12} /></button>
                        <button className="sc-iconbtn del" style={{ width: 22, height: 22 }} title="Delete" data-testid={`delete-deck-${deck.id}`} onClick={e => { e.stopPropagation(); deleteDeck(deck.id); }}><Trash2 size={12} /></button>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><h3>Create new deck</h3></div>
            <div className="modal-body">
              <input
                className="sc-text-input"
                placeholder="Deck title…"
                value={newTitle}
                autoFocus
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createDeck()}
                data-testid="deck-title-input"
              />
            </div>
            <div className="modal-foot">
              <button className="sc-btn quiet" onClick={() => setOpen(false)}>Cancel</button>
              <button className="sc-btn accent" onClick={createDeck} data-testid="create-deck-btn">Create deck</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
