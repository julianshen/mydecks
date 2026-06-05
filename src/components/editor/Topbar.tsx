'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Download, Share2, Sun, Moon, Presentation, FileText } from 'lucide-react';
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
  onExport: (format: 'pptx' | 'pdf') => void;
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '7px 10px',
  background: 'transparent',
  border: 0,
  borderRadius: 6,
  textAlign: 'left',
  fontSize: 13,
  color: 'var(--ink)',
  cursor: 'pointer',
};

const COLLABORATORS: Collaborator[] = [
  { initials: 'MC', color: '#ef6f6f' },
  { initials: 'SL', color: '#3fb27f' },
  { initials: 'JK', color: '#d9a13b' },
  { initials: 'RP', color: '#b066c9' },
];

export default function Topbar({ docName, themeName, mode, onToggleMode, onPresent, onExport }: Props) {
  const [exportOpen, setExportOpen] = useState(false);
  const pick = (format: 'pptx' | 'pdf') => { setExportOpen(false); onExport(format); };
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
        <div style={{ position: 'relative' }}>
          <button
            className="sc-btn outline"
            data-testid="tool-export"
            onClick={() => setExportOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={exportOpen}
          >
            <Download size={14} /> Export
          </button>
          {exportOpen && (
            <>
              <div onClick={() => setExportOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div
                role="menu"
                data-testid="export-menu"
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 41,
                  minWidth: 190, padding: 4, background: 'var(--bg-2)',
                  border: '1px solid var(--line)', borderRadius: 8,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
                }}
              >
                <button role="menuitem" data-testid="export-pptx" style={menuItemStyle} onClick={() => pick('pptx')}>
                  <Presentation size={15} /> PowerPoint (.pptx)
                </button>
                <button role="menuitem" data-testid="export-pdf" style={menuItemStyle} onClick={() => pick('pdf')}>
                  <FileText size={15} /> PDF (.pdf)
                </button>
              </div>
            </>
          )}
        </div>
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
