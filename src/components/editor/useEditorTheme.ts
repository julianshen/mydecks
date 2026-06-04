'use client';

import { useEffect, useState } from 'react';

export type EditorThemeMode = 'light' | 'dark';

/** Accent presets — name + oklch hue (chroma/lightness fixed in CSS). */
export const ACCENTS: { name: string; hue: number; swatch: string }[] = [
  { name: 'Indigo', hue: 265, swatch: 'oklch(0.62 0.17 265)' },
  { name: 'Emerald', hue: 155, swatch: 'oklch(0.62 0.17 155)' },
  { name: 'Amber', hue: 70, swatch: 'oklch(0.7 0.15 70)' },
  { name: 'Coral', hue: 25, swatch: 'oklch(0.62 0.19 25)' },
  { name: 'Magenta', hue: 330, swatch: 'oklch(0.62 0.19 330)' },
  { name: 'Cyan', hue: 230, swatch: 'oklch(0.62 0.13 230)' },
];

const MODE_KEY = 'mydecks.editor.theme';
const ACCENT_KEY = 'mydecks.editor.accent';

function readStored<T>(key: string, fallback: T, parse: (v: string) => T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : parse(v);
  } catch {
    return fallback;
  }
}

export function useEditorTheme() {
  // Lazy initializers read persisted prefs on the client without a
  // setState-in-effect (which would cause cascading renders). On a fresh
  // SSR load this defaults to light/indigo, then the client picks up the
  // stored value on first render.
  const [mode, setMode] = useState<EditorThemeMode>(() =>
    readStored<EditorThemeMode>(MODE_KEY, 'light', v => (v === 'dark' ? 'dark' : 'light')),
  );
  const [accentHue, setAccentHue] = useState<number>(() =>
    readStored<number>(ACCENT_KEY, 265, v => Number(v) || 265),
  );

  useEffect(() => {
    try { localStorage.setItem(MODE_KEY, mode); } catch {}
  }, [mode]);

  useEffect(() => {
    try { localStorage.setItem(ACCENT_KEY, String(accentHue)); } catch {}
  }, [accentHue]);

  const toggleMode = () => setMode(m => (m === 'light' ? 'dark' : 'light'));

  return { mode, setMode, toggleMode, accentHue, setAccentHue };
}
