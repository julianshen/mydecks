'use client';

import {
  MousePointer2, Type, Heading, Image as ImageIcon, Square, Minus, BarChart3,
  Table as TableIcon,
  Grid3X3, Magnet, Undo2, Redo2, Copy, BringToFront, SendToBack, Trash2,
  AlignLeft, AlignCenter, AlignRight, LayoutGrid,
} from 'lucide-react';
import type { EditorState } from '@/types';
import { ACCENTS } from './useEditorTheme';

interface Props {
  editorState: EditorState;
  onChangeMode: (mode: EditorState['mode']) => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onDeleteElement: () => void;
  onDuplicateElement: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  layout: string;
  onChangeLayout: (layout: string) => void;
  accentHue: number;
  onChangeAccent: (hue: number) => void;
  hasSelection: boolean;
  selectedAlign?: string;
  onAlign: (align: string) => void;
  canAlign: boolean;
}

const TOOLS = [
  { mode: 'select' as const, icon: MousePointer2, label: 'Select (V)' },
  { mode: 'text' as const, icon: Type, label: 'Text (T)' },
  { mode: 'heading' as const, icon: Heading, label: 'Heading (H)' },
  { mode: 'image' as const, icon: ImageIcon, label: 'Image (I)' },
  { mode: 'shape' as const, icon: Square, label: 'Shape (S)' },
  { mode: 'line' as const, icon: Minus, label: 'Line (L)' },
];

const LAYOUTS = [
  { value: 'blank', label: 'Blank' },
  { value: 'title', label: 'Title' },
  { value: 'title-content', label: 'Title + Content' },
  { value: 'two-column', label: 'Two Column' },
  { value: 'image-text', label: 'Image + Text' },
];

const ALIGNS = [
  { value: 'left', icon: AlignLeft },
  { value: 'center', icon: AlignCenter },
  { value: 'right', icon: AlignRight },
];

export default function Toolbar({
  editorState, onChangeMode, onToggleGrid, onToggleSnap,
  onDeleteElement, onDuplicateElement, onBringForward, onSendBackward,
  canUndo, canRedo, onUndo, onRedo,
  layout, onChangeLayout, accentHue, onChangeAccent,
  hasSelection, selectedAlign, onAlign, canAlign,
}: Props) {
  return (
    <div className="sc-toolbar" data-testid="editor-toolbar">
      <div className="sc-group">
        {TOOLS.map(t => (
          <button
            key={t.mode}
            className={`sc-iconbtn ${editorState.mode === t.mode ? 'active' : ''}`}
            onClick={() => onChangeMode(t.mode)}
            title={t.label}
            data-testid={`tool-${t.mode}`}
          >
            <t.icon size={15} />
          </button>
        ))}
        <button className={`sc-iconbtn ${editorState.mode === 'chart' ? 'active' : ''}`} title="Chart" onClick={() => onChangeMode('chart')} data-testid="tool-chart">
          <BarChart3 size={15} />
        </button>
        <button className={`sc-iconbtn ${editorState.mode === 'table' ? 'active' : ''}`} title="Table" onClick={() => onChangeMode('table')} data-testid="tool-table">
          <TableIcon size={15} />
        </button>
      </div>

      <div className="sc-group">
        <LayoutGrid size={14} style={{ color: 'var(--ink-4)', marginLeft: 4 }} />
        <select
          className="sc-native-select"
          style={{ width: 'auto', border: 0, background: 'transparent', fontWeight: 500 }}
          value={layout}
          onChange={e => onChangeLayout(e.target.value)}
          data-testid="toolbar-layout"
          aria-label="Slide layout"
        >
          {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <select
          className="sc-native-select"
          style={{ width: 'auto', border: 0, background: 'transparent', fontWeight: 500 }}
          value={accentHue}
          onChange={e => onChangeAccent(Number(e.target.value))}
          data-testid="toolbar-theme"
          aria-label="Accent theme"
        >
          {ACCENTS.map(a => <option key={a.hue} value={a.hue}>{a.name}</option>)}
        </select>
      </div>

      <div className="sc-group">
        {ALIGNS.map(a => (
          <button
            key={a.value}
            className={`sc-iconbtn ${selectedAlign === a.value ? 'active' : ''}`}
            onClick={() => onAlign(a.value)}
            disabled={!canAlign}
            title={`Align ${a.value}`}
          >
            <a.icon size={15} />
          </button>
        ))}
      </div>

      <div className="sc-group">
        <button className={`sc-iconbtn ${editorState.showGrid ? 'active' : ''}`} onClick={onToggleGrid} title="Toggle grid" data-testid="tool-grid">
          <Grid3X3 size={15} />
        </button>
        <button className={`sc-iconbtn ${editorState.snapToGrid ? 'active' : ''}`} onClick={onToggleSnap} title="Snap to grid" data-testid="tool-snap">
          <Magnet size={15} />
        </button>
      </div>

      <div className="sc-spacer" />

      <div className="sc-group">
        <button className="sc-iconbtn" onClick={onUndo} disabled={!canUndo} title="Undo" data-testid="tool-undo"><Undo2 size={15} /></button>
        <button className="sc-iconbtn" onClick={onRedo} disabled={!canRedo} title="Redo" data-testid="tool-redo"><Redo2 size={15} /></button>
      </div>

      <div className="sc-group">
        <button className="sc-iconbtn" onClick={onDuplicateElement} disabled={!hasSelection} title="Duplicate" data-testid="tool-duplicate"><Copy size={15} /></button>
        <button className="sc-iconbtn" onClick={onBringForward} disabled={!hasSelection} title="Bring forward" data-testid="tool-forward"><BringToFront size={15} /></button>
        <button className="sc-iconbtn" onClick={onSendBackward} disabled={!hasSelection} title="Send backward" data-testid="tool-backward"><SendToBack size={15} /></button>
        <button className="sc-iconbtn" onClick={onDeleteElement} disabled={!hasSelection} title="Delete" data-testid="tool-delete" style={{ color: hasSelection ? 'var(--danger)' : undefined }}><Trash2 size={15} /></button>
      </div>
    </div>
  );
}
