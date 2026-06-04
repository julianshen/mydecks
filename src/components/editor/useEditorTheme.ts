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

export function useEditorTheme() {
  // Start from the SSR defaults so the server HTML and the first client
  // render agree (theme drives several bits of markup — select values, the
  // toggle icon, swatch state — so a lazy localStorage read would cause a
  // hydration mismatch). Persisted prefs are loaded after mount, and writes
  // are gated on `mounted` so the load can't be clobbered by a save.
  const [mode, setMode] = useState<EditorThemeMode>('light');
  const [accentHue, setAccentHue] = useState<number>(265);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time client hydration of persisted prefs */
    setMounted(true);
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m === 'dark' || m === 'light') setMode(m);
      const a = localStorage.getItem(ACCENT_KEY);
      const hue = a == null ? NaN : Number(a);
      if (Number.isFinite(hue)) setAccentHue(hue);
    } catch {
      /* ignore (e.g. private mode) */
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(MODE_KEY, mode); } catch {}
  }, [mode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(ACCENT_KEY, String(accentHue)); } catch {}
  }, [accentHue, mounted]);

  const toggleMode = () => setMode(m => (m === 'light' ? 'dark' : 'light'));

  return { mode, setMode, toggleMode, accentHue, setAccentHue };
}
