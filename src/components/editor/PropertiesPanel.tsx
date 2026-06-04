'use client';

import { useState } from 'react';
import { Type, Heading, Image as ImageIcon, Square, Minus, BarChart3, Table as TableIcon, Plus, Trash2 } from 'lucide-react';
import type { SlideElement, Slide, EditorState } from '@/types';
import { ACCENTS } from './useEditorTheme';

interface Props {
  element: SlideElement | null;
  slide: Slide | null;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onUpdateSlide: (id: string, updates: Partial<Slide>) => void;
  accentHue: number;
  onChangeAccent: (hue: number) => void;
  onPickTool: (mode: EditorState['mode']) => void;
}

const COMPONENTS: { label: string; icon: typeof Type; mode: EditorState['mode'] }[] = [
  { label: 'Text', icon: Type, mode: 'text' },
  { label: 'Heading', icon: Heading, mode: 'heading' },
  { label: 'Image', icon: ImageIcon, mode: 'image' },
  { label: 'Shape', icon: Square, mode: 'shape' },
  { label: 'Chart', icon: BarChart3, mode: 'chart' },
  { label: 'Table', icon: TableIcon, mode: 'table' },
  { label: 'Line', icon: Minus, mode: 'line' },
];

const LAYOUTS = [
  { value: 'blank', label: 'Blank' },
  { value: 'title', label: 'Title' },
  { value: 'title-content', label: 'Title + Content' },
  { value: 'two-column', label: 'Two Column' },
  { value: 'image-text', label: 'Image + Text' },
];

function NumField({ label, value, onChange, testid }: { label: string; value: number; onChange: (v: number) => void; testid?: string }) {
  return (
    <div className="sc-input-group">
      <span className="ico">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        onChange={e => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        data-testid={testid}
      />
    </div>
  );
}

export default function PropertiesPanel({ element, slide, onUpdateElement, onUpdateSlide, accentHue, onChangeAccent, onPickTool }: Props) {
  const [tab, setTab] = useState<'design' | 'properties'>('design');

  // Follow the selection: jump to Properties when a new element is picked.
  // Adjusting state during render (per React docs) avoids a cascading effect.
  const [prevElId, setPrevElId] = useState<string | null>(element?.id ?? null);
  if (element && element.id !== prevElId) {
    setPrevElId(element.id);
    setTab('properties');
  } else if (!element && prevElId !== null) {
    setPrevElId(null);
  }

  const elStyle = element ? (typeof element.style === 'string' ? JSON.parse(element.style) : element.style) : {};
  const elContent = element ? (typeof element.content === 'string' ? JSON.parse(element.content) : element.content) : {};
  const [imgUrl, setImgUrl] = useState('');

  const updateStyle = (key: string, value: unknown) => {
    if (!element) return;
    onUpdateElement(element.id, { style: { ...elStyle, [key]: value } });
  };
  const updateContent = (key: string, value: unknown) => {
    if (!element) return;
    onUpdateElement(element.id, { content: { ...elContent, [key]: value } });
  };

  return (
    <div className="sc-rightpane" data-testid="properties-panel">
      <div className="sc-inspector-tabs">
        <button className={tab === 'design' ? 'active' : ''} onClick={() => setTab('design')} data-testid="tab-design">Design</button>
        <button className={tab === 'properties' ? 'active' : ''} onClick={() => setTab('properties')} data-testid="tab-properties">Properties</button>
      </div>

      <div className="sc-inspector-body">
        {tab === 'design' && (
          <>
            <div className="sc-pane-section">
              <h4>Theme · Accent</h4>
              <div className="sc-swatch-grid">
                {ACCENTS.map(a => (
                  <button
                    key={a.hue}
                    className={`sc-swatch ${accentHue === a.hue ? 'active' : ''}`}
                    style={{ background: a.swatch }}
                    title={a.name}
                    onClick={() => onChangeAccent(a.hue)}
                    data-testid={`accent-${a.hue}`}
                  />
                ))}
              </div>
            </div>

            <div className="sc-pane-section">
              <h4>Tokens</h4>
              <div className="sc-tokens-row"><span className="sw" style={{ background: 'var(--ink)' }} /><span className="name">ink</span><span className="val">text</span></div>
              <div className="sc-tokens-row"><span className="sw" style={{ background: 'var(--accent)' }} /><span className="name">accent</span><span className="val">oklch · {accentHue}</span></div>
              <div className="sc-tokens-row"><span className="sw" style={{ background: 'var(--bg-2)' }} /><span className="name">bg-2</span><span className="val">surface</span></div>
              <div className="sc-tokens-row"><span className="sw" style={{ background: 'var(--line)' }} /><span className="name">line</span><span className="val">hairline</span></div>
            </div>

            <div className="sc-pane-section">
              <h4>Components <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>click to add</span></h4>
              <div className="sc-lib-rail">
                {COMPONENTS.map(c => (
                  <button key={c.label} className="sc-lib-chip" onClick={() => onPickTool(c.mode)} title={`Add ${c.label}`} data-testid={`lib-${c.label.toLowerCase()}`}>
                    <c.icon size={18} />
                    <span className="sc-lib-chip-name">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {slide && (
              <div className="sc-pane-section">
                <h4>Slide</h4>
                <div className="sc-field-row">
                  <label>layout</label>
                  <select className="sc-native-select" value={slide.layout} onChange={e => onUpdateSlide(slide.id, { layout: e.target.value })} data-testid="prop-layout">
                    {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="sc-field-row">
                  <label>bg</label>
                  <input type="color" className="sc-color-input" value={slide.background_color || '#ffffff'} onChange={e => onUpdateSlide(slide.id, { background_color: e.target.value })} data-testid="prop-bg-color" />
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'properties' && (
          !element ? (
            <div className="sc-empty">Select an element to edit its properties, or use the Design tab to add one.</div>
          ) : (
            <>
              <div className="sc-pane-section">
                <h4>{element.type}</h4>
                <div className="sc-double" style={{ marginBottom: 6 }}>
                  <NumField label="X" value={Math.round(element.x)} onChange={v => onUpdateElement(element.id, { x: v })} testid="prop-x" />
                  <NumField label="Y" value={Math.round(element.y)} onChange={v => onUpdateElement(element.id, { y: v })} testid="prop-y" />
                </div>
                <div className="sc-double" style={{ marginBottom: 6 }}>
                  <NumField label="W" value={Math.round(element.width)} onChange={v => onUpdateElement(element.id, { width: v })} testid="prop-w" />
                  <NumField label="H" value={Math.round(element.height)} onChange={v => onUpdateElement(element.id, { height: v })} testid="prop-h" />
                </div>
                <div className="sc-field-row">
                  <label>angle</label>
                  <input type="range" min={-180} max={180} step={1} value={element.rotation} onChange={e => onUpdateElement(element.id, { rotation: Number(e.target.value) })} style={{ width: '100%' }} data-testid="prop-rotation" />
                </div>
              </div>

              {(element.type === 'text' || element.type === 'heading') && (
                <div className="sc-pane-section">
                  <h4>Type</h4>
                  <div className="sc-field-row">
                    <label>size</label>
                    <NumField label="px" value={elStyle.fontSize || 16} onChange={v => updateStyle('fontSize', v)} testid="prop-fontsize" />
                  </div>
                  <div className="sc-field-row">
                    <label>font</label>
                    <select className="sc-native-select" value={elStyle.fontFamily || 'Inter'} onChange={e => updateStyle('fontFamily', e.target.value)} data-testid="prop-fontfamily">
                      <option>Inter</option><option>Arial</option><option>Georgia</option><option>Times New Roman</option><option>Helvetica</option><option>JetBrains Mono</option>
                    </select>
                  </div>
                  <div className="sc-field-row">
                    <label>color</label>
                    <input type="color" className="sc-color-input" value={elStyle.color || '#000000'} onChange={e => updateStyle('color', e.target.value)} data-testid="prop-color" />
                  </div>
                  <div className="sc-field-row">
                    <label>align</label>
                    <div className="sc-seg">
                      {['left', 'center', 'right'].map(a => (
                        <button key={a} className={elStyle.textAlign === a ? 'active' : ''} onClick={() => updateStyle('textAlign', a)} data-testid={`prop-align-${a}`}>{a[0].toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                  <div className="sc-field-row">
                    <label>weight</label>
                    <div className="sc-seg">
                      {['normal', 'bold'].map(w => (
                        <button key={w} className={(elStyle.fontWeight || 'normal') === w ? 'active' : ''} onClick={() => updateStyle('fontWeight', w)} data-testid={`prop-weight-${w}`}>{w === 'normal' ? 'R' : 'B'}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {element.type === 'image' && (
                <div className="sc-pane-section">
                  <h4>Image</h4>
                  <div className="sc-input-group" style={{ marginBottom: 6 }}>
                    <input placeholder="Image URL…" value={imgUrl} onChange={e => setImgUrl(e.target.value)} data-testid="prop-img-url" />
                  </div>
                  <button className="sc-btn outline" style={{ width: '100%' }} onClick={() => { updateContent('src', imgUrl); setImgUrl(''); }} data-testid="prop-img-apply">Set image</button>
                  {elContent.src && <img src={elContent.src} alt="preview" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginTop: 8 }} />}
                </div>
              )}

              {element.type === 'shape' && (
                <div className="sc-pane-section">
                  <h4>Shape</h4>
                  <div className="sc-field-row"><label>fill</label><input type="color" className="sc-color-input" value={elStyle.backgroundColor || '#3B82F6'} onChange={e => updateStyle('backgroundColor', e.target.value)} data-testid="prop-fill" /></div>
                  <div className="sc-field-row"><label>stroke</label><input type="color" className="sc-color-input" value={elStyle.borderColor || '#000000'} onChange={e => updateStyle('borderColor', e.target.value)} data-testid="prop-border-color" /></div>
                  <div className="sc-field-row"><label>width</label><NumField label="px" value={elStyle.borderWidth || 0} onChange={v => updateStyle('borderWidth', v)} testid="prop-border-width" /></div>
                  <div className="sc-field-row"><label>radius</label><NumField label="px" value={elStyle.borderRadius || 0} onChange={v => updateStyle('borderRadius', v)} testid="prop-radius" /></div>
                  <div className="sc-field-row"><label>opacity</label><input type="range" min={0} max={1} step={0.05} value={elStyle.opacity ?? 1} onChange={e => updateStyle('opacity', Number(e.target.value))} style={{ width: '100%' }} data-testid="prop-opacity" /></div>
                </div>
              )}

              {element.type === 'line' && (
                <div className="sc-pane-section">
                  <h4>Line</h4>
                  <div className="sc-field-row"><label>color</label><input type="color" className="sc-color-input" value={elStyle.borderColor || '#000000'} onChange={e => updateStyle('borderColor', e.target.value)} data-testid="prop-line-color" /></div>
                  <div className="sc-field-row"><label>width</label><NumField label="px" value={elStyle.borderWidth || 2} onChange={v => updateStyle('borderWidth', v)} testid="prop-line-width" /></div>
                </div>
              )}

              {element.type === 'table' && (() => {
                const data: string[][] = elContent.tableData?.length ? elContent.tableData : [['']];
                const cols = Math.max(...data.map(r => r.length));
                const setData = (next: string[][]) => updateContent('tableData', next);
                const setCell = (r: number, c: number, value: string) =>
                  setData(data.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? value : cell) : row));
                const addRow = () => setData([...data, Array.from({ length: cols }, () => '')]);
                const removeRow = () => data.length > 1 && setData(data.slice(0, -1));
                const addCol = () => setData(data.map(row => [...row, '']));
                const removeCol = () => cols > 1 && setData(data.map(row => row.slice(0, -1)));
                return (
                  <div className="sc-pane-section">
                    <h4>Table</h4>
                    <div className="sc-field-row" style={{ gap: 6 }}>
                      <label>rows</label>
                      <div className="sc-seg">
                        <button onClick={removeRow} title="Remove row" data-testid="prop-table-row-remove"><Trash2 size={12} /></button>
                        <button onClick={addRow} title="Add row" data-testid="prop-table-row-add"><Plus size={12} /></button>
                      </div>
                      <label>cols</label>
                      <div className="sc-seg">
                        <button onClick={removeCol} title="Remove column" data-testid="prop-table-col-remove"><Trash2 size={12} /></button>
                        <button onClick={addCol} title="Add column" data-testid="prop-table-col-add"><Plus size={12} /></button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4, marginTop: 6 }} data-testid="prop-table-grid">
                      {data.map((row, r) =>
                        Array.from({ length: cols }, (_, c) => (
                          <input
                            key={`${r}-${c}`}
                            className="sc-native-select"
                            style={{ minWidth: 0, fontSize: 11 }}
                            value={row[c] ?? ''}
                            placeholder={r === 0 ? `H${c + 1}` : ''}
                            onChange={e => setCell(r, c, e.target.value)}
                            data-testid={`prop-table-cell-${r}-${c}`}
                          />
                        ))
                      )}
                    </div>
                    <div className="sc-field-row" style={{ marginTop: 8 }}><label>border</label><input type="color" className="sc-color-input" value={elStyle.borderColor || '#d1d5db'} onChange={e => updateStyle('borderColor', e.target.value)} data-testid="prop-table-border" /></div>
                    <div className="sc-field-row"><label>text</label><input type="color" className="sc-color-input" value={elStyle.color || '#1a1a1a'} onChange={e => updateStyle('color', e.target.value)} data-testid="prop-table-text" /></div>
                    <div className="sc-field-row"><label>size</label><NumField label="px" value={elStyle.fontSize || 14} onChange={v => updateStyle('fontSize', v)} testid="prop-table-size" /></div>
                  </div>
                );
              })()}
            </>
          )
        )}
      </div>
    </div>
  );
}
