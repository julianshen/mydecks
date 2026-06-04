'use client';

import Link from 'next/link';
import { Play, Download, Share2, Sun, Moon } from 'lucide-react';
import type { EditorThemeMode } from './useEditorTheme';

interface Collaborator {
  initials: string;
  color: string;
}

interface Props {
  docName: string;
  themeName: string;
  mode: EditorThemeMode;
  onToggleMode: () => void;
  onPresent: () => void;
  onExport: () => void;
}

const COLLABORATORS: Collaborator[] = [
  { initials: 'MC', color: '#ef6f6f' },
  { initials: 'SL', color: '#3fb27f' },
  { initials: 'JK', color: '#d9a13b' },
  { initials: 'RP', color: '#b066c9' },
];

export default function Topbar({ docName, themeName, mode, onToggleMode, onPresent, onExport }: Props) {
  return (
    <div className="sc-topbar">
      <div className="sc-logo">
        <span className="sc-logo-mark">S</span>
        <span>Stagecraft</span>
      </div>

      <nav className="sc-nav">
        <Link className="sc-tab" href="/">Files</Link>
        <span className="sc-tab active">Editor</span>
        <Link className="sc-tab" href="/">Sorter</Link>
      </nav>

      <div className="sc-topbar-title">
        <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 11 }}>{themeName}</span>
        <span style={{ color: 'var(--ink-4)' }}>›</span>
        <span className="sc-doc-name" title={docName}>{docName}</span>
        <span className="sc-saved">Saved</span>
      </div>

      <div className="sc-topbar-right">
        <div className="sc-avatars">
          {COLLABORATORS.map(c => (
            <span key={c.initials} className="sc-avatar" style={{ background: c.color }} title={c.initials}>
              {c.initials}
            </span>
          ))}
          <span className="sc-more">+2</span>
        </div>
        <button
          className="sc-iconbtn"
          onClick={onToggleMode}
          title={mode === 'light' ? 'Switch to dark' : 'Switch to light'}
          data-testid="theme-toggle"
        >
          {mode === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <button className="sc-btn outline" data-testid="tool-export" onClick={onExport}>
          <Download size={14} /> Export
        </button>
        <button className="sc-btn quiet">
          <Share2 size={14} /> Share
        </button>
        <button className="sc-btn accent" data-testid="tool-present" onClick={onPresent}>
          <Play size={14} /> Present <span className="sc-kbd">⌘↵</span>
        </button>
      </div>
    </div>
  );
}
