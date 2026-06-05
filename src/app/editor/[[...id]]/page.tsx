'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SlideCanvas from '@/components/editor/SlideCanvas';
import Toolbar from '@/components/editor/Toolbar';
import SlidePanel from '@/components/editor/SlidePanel';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import Topbar from '@/components/editor/Topbar';
import { useEditorTheme, ACCENTS } from '@/components/editor/useEditorTheme';
import type { Deck, Slide, SlideElement, EditorState, ElementContent, ElementStyle } from '@/types';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types';

// Per-mode defaults for newly created elements (size, content, style). Keyed by
// the tool mode that inserts the element; falls back to text for anything else.
const ELEMENT_DEFAULTS: Record<string, { width: number; height: number; content: ElementContent; style: ElementStyle }> = {
  text: { width: 300, height: 50, content: { text: 'Text' }, style: { fontSize: 18, color: '#333333' } },
  heading: { width: 300, height: 60, content: { text: 'Heading' }, style: { fontSize: 36, color: '#1a1a1a', fontWeight: 'bold' } },
  image: { width: 300, height: 50, content: { src: '', alt: '' }, style: { fontSize: 18, color: '#333333' } },
  shape: { width: 300, height: 50, content: { shapeType: 'rect' }, style: { backgroundColor: '#3B82F6', borderRadius: 8 } },
  line: { width: 200, height: 4, content: { text: 'Text' }, style: { borderColor: '#000000', borderWidth: 2 } },
  chart: { width: 480, height: 300, content: { chartType: 'bar', chartData: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], datasets: [{ label: 'Revenue', data: [42, 58, 51, 73] }] } }, style: { backgroundColor: '#ffffff' } },
  table: { width: 420, height: 160, content: { tableData: [['Header 1', 'Header 2', 'Header 3'], ['', '', ''], ['', '', '']] }, style: { fontSize: 14, color: '#1a1a1a', borderColor: '#d1d5db', borderWidth: 1, backgroundColor: '#ffffff' } },
};

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id?.[0];

  const [deck, setDeck] = useState<Deck | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const { mode: themeMode, toggleMode, accentHue, setAccentHue } = useEditorTheme();
  const [editorState, setEditorState] = useState<EditorState>({
    selectedSlideId: null,
    selectedElementId: null,
    zoom: 1,
    mode: 'select',
    showGrid: true,
    snapToGrid: false,
  });
  const [history] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // Per-element trailing debounce so rapid edits (e.g. typing into a table
  // cell) accumulate and the latest value is always persisted.
  const pendingSaves = useRef<Record<string, Partial<SlideElement>>>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Load deck
  useEffect(() => {
    if (!deckId) return;
    fetch(`/api/decks/${deckId}`)
      .then(r => r.json())
      .then(data => {
        setDeck(data);
        const s = data.slides || [];
        setSlides(s);
        if (s.length > 0) {
          setEditorState(prev => ({ ...prev, selectedSlideId: s[0].id }));
        }
      });
  }, [deckId]);

  const getElementContent = useCallback((id: string) => {
    const slide = slides.find(s => s.id === editorState.selectedSlideId);
    const el = slide?.elements?.find(e => e.id === id);
    return el ? (typeof el.content === 'string' ? JSON.parse(el.content) : el.content) : {};
  }, [slides, editorState.selectedSlideId]);

  const flushSave = useCallback((elementId: string) => {
    const body = pendingSaves.current[elementId];
    if (!body) return;
    delete pendingSaves.current[elementId];
    fetch(`/api/elements/${elementId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    setSlides(prev => prev.map(s => {
      if (s.id !== editorState.selectedSlideId) return s;
      return {
        ...s,
        elements: s.elements?.map(e => {
          if (e.id !== elementId) return e;
          const merged = { ...e, ...updates };
          if (updates.style) merged.style = { ...(typeof e.style === 'string' ? JSON.parse(e.style) : e.style), ...updates.style };
          if (updates.content) merged.content = { ...(typeof e.content === 'string' ? JSON.parse(e.content) : e.content), ...updates.content };
          return merged;
        }),
      };
    }));

    // Accumulate the pending payload (deep-merging style/content) and reset the
    // debounce timer, so every keystroke survives and only one save is sent
    // once edits settle.
    const prevPending = pendingSaves.current[elementId] || {};
    const nextPending: Partial<SlideElement> = { ...prevPending, ...updates };
    if (updates.style) nextPending.style = { ...(prevPending.style || {}), ...updates.style };
    if (updates.content) nextPending.content = { ...(prevPending.content || {}), ...updates.content };
    pendingSaves.current[elementId] = nextPending;

    clearTimeout(saveTimers.current[elementId]);
    saveTimers.current[elementId] = setTimeout(() => flushSave(elementId), 300);
  }, [editorState.selectedSlideId, flushSave]);

  // Flush any pending edits if the editor unmounts before the debounce fires.
  useEffect(() => {
    const timers = saveTimers.current;
    const pending = pendingSaves.current;
    return () => {
      Object.keys(pending).forEach(id => {
        clearTimeout(timers[id]);
        flushSave(id);
      });
    };
  }, [flushSave]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setSlides(JSON.parse(history[newIndex]));
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setSlides(JSON.parse(history[newIndex]));
  }, [history, historyIndex]);

  const handleDeleteElement = useCallback(() => {
    if (!editorState.selectedElementId) return;
    fetch(`/api/elements/${editorState.selectedElementId}`, { method: 'DELETE' });
    setSlides(slides.map(s => s.id === editorState.selectedSlideId ? { ...s, elements: s.elements?.filter(e => e.id !== editorState.selectedElementId) } : s));
    setEditorState(prev => ({ ...prev, selectedElementId: null }));
  }, [slides, editorState.selectedSlideId, editorState.selectedElementId]);

  const handleDuplicate = useCallback(() => {
    const slide = slides.find(s => s.id === editorState.selectedSlideId);
    const el = slide?.elements?.find(e => e.id === editorState.selectedElementId);
    if (!el) return;
    fetch('/api/elements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slide_id: el.slide_id,
        type: el.type,
        content: typeof el.content === 'string' ? JSON.parse(el.content) : el.content,
        x: el.x + 20,
        y: el.y + 20,
        width: el.width,
        height: el.height,
        rotation: el.rotation,
        z_index: (slide?.elements?.length || 0) + 1,
        style: typeof el.style === 'string' ? JSON.parse(el.style) : el.style,
      }),
    })
      .then(r => r.json())
      .then(newEl => {
        setSlides(slides.map(s => s.id === editorState.selectedSlideId ? { ...s, elements: [...(s.elements || []), newEl] } : s));
        setEditorState(prev => ({ ...prev, selectedElementId: newEl.id }));
      });
  }, [slides, editorState.selectedSlideId, editorState.selectedElementId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;

      if (e.key === 'v' || e.key === 'V') setEditorState(prev => ({ ...prev, mode: 'select' }));
      if (e.key === 't' || e.key === 'T') setEditorState(prev => ({ ...prev, mode: 'text' }));
      if (e.key === 'h' || e.key === 'H') setEditorState(prev => ({ ...prev, mode: 'heading' }));
      if (e.key === 'i' || e.key === 'I') setEditorState(prev => ({ ...prev, mode: 'image' }));
      if (e.key === 's' || e.key === 'S') setEditorState(prev => ({ ...prev, mode: 'shape' }));
      if (e.key === 'l' || e.key === 'L') setEditorState(prev => ({ ...prev, mode: 'line' }));
      if (e.key === 'Delete' || e.key === 'Backspace') handleDeleteElement();
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); handleRedo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); handleDuplicate(); }
      if (e.key === 'Escape') setEditorState(prev => ({ ...prev, selectedElementId: null }));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDeleteElement, handleUndo, handleRedo, handleDuplicate]);

  // Listen for text changes from SlideElementView
  useEffect(() => {
    const handler = (e: Event) => {
      const { id, text } = (e as CustomEvent<{ id: string; text: string }>).detail;
      updateElement(id, { content: { ...getElementContent(id), text } });
    };
    window.addEventListener('element-text-change', handler);
    return () => window.removeEventListener('element-text-change', handler);
  }, [updateElement, getElementContent]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (editorState.mode === 'select') return;
    // Only insert when the click lands on the slide surface — not on the
    // rulers, status bar, or zoom controls that also live in this wrapper.
    const frame = (e.target as HTMLElement).closest('[data-role="slide-background"]') as HTMLElement | null;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = (e.clientX - rect.left) / editorState.zoom;
    const y = (e.clientY - rect.top) / editorState.zoom;

    const d = ELEMENT_DEFAULTS[editorState.mode] ?? ELEMENT_DEFAULTS.text;
    const newElement: Partial<SlideElement> = {
      slide_id: editorState.selectedSlideId!,
      type: editorState.mode,
      x: Math.max(0, Math.min(SLIDE_WIDTH - 100, x - 50)),
      y: Math.max(0, Math.min(SLIDE_HEIGHT - 50, y - 25)),
      width: d.width,
      height: d.height,
      z_index: (slides.find(s => s.id === editorState.selectedSlideId)?.elements?.length || 0) + 1,
      content: d.content,
      style: d.style,
    };

    fetch('/api/elements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newElement),
    })
      .then(r => r.json())
      .then(el => {
        setSlides(slides.map(s => s.id === editorState.selectedSlideId ? { ...s, elements: [...(s.elements || []), el] } : s));
        setEditorState(prev => ({ ...prev, mode: 'select', selectedElementId: el.id }));
      });
  };

  const handleBringForward = () => {
    if (!editorState.selectedElementId) return;
    const slide = slides.find(s => s.id === editorState.selectedSlideId);
    const el = slide?.elements?.find(e => e.id === editorState.selectedElementId);
    if (!el) return;
    updateElement(el.id, { z_index: el.z_index + 1 });
  };

  const handleSendBackward = () => {
    if (!editorState.selectedElementId) return;
    const slide = slides.find(s => s.id === editorState.selectedSlideId);
    const el = slide?.elements?.find(e => e.id === editorState.selectedElementId);
    if (!el || el.z_index <= 1) return;
    updateElement(el.id, { z_index: el.z_index - 1 });
  };

  const handleAddSlide = () => {
    fetch('/api/slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deck_id: deckId, sort_order: slides.length, layout: 'blank' }),
    })
      .then(r => r.json())
      .then(slide => {
        setSlides([...slides, slide]);
        setEditorState(prev => ({ ...prev, selectedSlideId: slide.id }));
      });
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) { alert('Cannot delete the last slide'); return; }
    fetch(`/api/slides/${id}`, { method: 'DELETE' });
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    if (editorState.selectedSlideId === id) {
      setEditorState(prev => ({ ...prev, selectedSlideId: newSlides[0]?.id || null }));
    }
  };

  const handleReorderSlides = (from: number, to: number) => {
    const newSlides = [...slides];
    const [moved] = newSlides.splice(from, 1);
    newSlides.splice(to, 0, moved);
    newSlides.forEach((s, i) => {
      fetch(`/api/slides/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: i }),
      });
    });
    setSlides(newSlides);
  };

  const handleUpdateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
    fetch(`/api/slides/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  };

  const handleExport = (format: 'pptx' | 'pdf') => {
    if (!deckId) return;
    const query = format === 'pdf' ? '?format=pdf' : '';
    window.open(`/api/export/${deckId}${query}`, '_blank');
  };

  const currentSlide = slides.find(s => s.id === editorState.selectedSlideId);
  const selectedElement = currentSlide?.elements?.find(e => e.id === editorState.selectedElementId) || null;
  const selStyle = selectedElement
    ? (typeof selectedElement.style === 'string' ? JSON.parse(selectedElement.style) : selectedElement.style)
    : {};
  const canAlign = !!selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'heading');
  const accentName = ACCENTS.find(a => a.hue === accentHue)?.name ?? 'Custom';
  const pickTool = (mode: EditorState['mode']) => setEditorState(prev => ({ ...prev, mode }));

  return (
    <div
      className="sc-app"
      data-theme={themeMode}
      data-testid="editor-page"
      style={{ '--accent-h': accentHue } as React.CSSProperties}
    >
      <Topbar
        docName={deck?.title || 'Untitled Deck'}
        themeName={`Theme · ${accentName}`}
        mode={themeMode}
        onToggleMode={toggleMode}
        onPresent={() => router.push(`/present/${deckId}`)}
        onExport={handleExport}
      />
      <Toolbar
        editorState={editorState}
        onChangeMode={pickTool}
        onToggleGrid={() => setEditorState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
        onToggleSnap={() => setEditorState(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
        onDeleteElement={handleDeleteElement}
        onDuplicateElement={handleDuplicate}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        layout={currentSlide?.layout || 'blank'}
        onChangeLayout={l => currentSlide && handleUpdateSlide(currentSlide.id, { layout: l })}
        accentHue={accentHue}
        onChangeAccent={setAccentHue}
        hasSelection={!!selectedElement}
        selectedAlign={selStyle.textAlign}
        onAlign={a => selectedElement && updateElement(selectedElement.id, { style: { textAlign: a as 'left' | 'center' | 'right' } })}
        canAlign={canAlign}
      />
      <div className="sc-body">
        <SlidePanel
          slides={slides}
          selectedId={editorState.selectedSlideId}
          onSelect={id => setEditorState(prev => ({ ...prev, selectedSlideId: id, selectedElementId: null }))}
          onAdd={handleAddSlide}
          onDelete={handleDeleteSlide}
          onReorder={handleReorderSlides}
        />
        <div data-testid="canvas-wrapper" onClick={handleCanvasClick} style={{ minWidth: 0, display: 'grid' }}>
          {currentSlide ? (
            <SlideCanvas
              slide={currentSlide}
              editorState={editorState}
              onUpdateElement={updateElement}
              onSelectElement={id => setEditorState(prev => ({ ...prev, selectedElementId: id }))}
              onZoomIn={() => setEditorState(prev => ({ ...prev, zoom: Math.min(2, prev.zoom + 0.1) }))}
              onZoomOut={() => setEditorState(prev => ({ ...prev, zoom: Math.max(0.3, prev.zoom - 0.1) }))}
            />
          ) : (
            <div className="sc-empty" style={{ alignSelf: 'center' }}>No slide selected</div>
          )}
        </div>
        <PropertiesPanel
          element={selectedElement}
          slide={currentSlide || null}
          onUpdateElement={updateElement}
          onUpdateSlide={handleUpdateSlide}
          accentHue={accentHue}
          onChangeAccent={setAccentHue}
          onPickTool={pickTool}
        />
      </div>
    </div>
  );
}
