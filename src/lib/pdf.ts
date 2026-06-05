import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import { normalizeTableData } from '@/components/editor/TableElement';

// Slides use a 960×540 coordinate space; we emit one PDF page per slide at
// 960×540 points (a clean 16:9), so element coordinates map 1:1 — only the
// origin flips (PDF is bottom-left, slides are top-left).
const W = 960;
const H = 540;

interface ExportElement {
  type: string;
  content: Record<string, unknown>;
  style: Record<string, unknown>;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExportSlide {
  background_color?: string;
  elements: ExportElement[];
}

function hexToRgb(hex: string | undefined, fallback: [number, number, number]): RGB {
  if (!hex) return rgb(...fallback);
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(n)) return rgb(...fallback);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

// StandardFonts use WinAnsi encoding, which can't encode arbitrary Unicode
// (emoji, CJK, …) and would throw. Replace anything outside the safe range,
// but preserve newlines (used to split paragraphs) and drop carriage returns.
function sanitize(value: unknown): string {
  return Array.from(String(value ?? '')).map(ch => {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp === 10) return ch;   // newline — kept for paragraph splitting
    if (cp === 13) return '';   // carriage return — strip (CRLF → LF)
    if (cp === 9) return ' ';
    if (cp >= 32 && cp <= 126) return ch;
    if (cp >= 160 && cp <= 255) return ch;
    return '?';
  }).join('');
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

/** Truncate a string until it fits `maxWidth` at the given font/size. */
function fit(font: PDFFont, text: string, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(t + '…', size) > maxWidth) t = t.slice(0, -1);
  return t + '…';
}

function drawTextBox(page: PDFPage, regular: PDFFont, bold: PDFFont, el: ExportElement) {
  const text = sanitize(str(el.content.text) ?? '');
  if (!text) return;
  const size = num(el.style.fontSize, 16);
  const font = el.style.fontWeight === 'bold' ? bold : regular;
  const color = hexToRgb(str(el.style.color), [0, 0, 0]);
  const opacity = num(el.style.opacity, 1);
  const align = str(el.style.textAlign) ?? 'left';
  const padding = num(el.style.padding, 8);
  const lineHeight = num(el.style.lineHeight, 1.4) * size;
  const maxWidth = Math.max(1, el.width - padding * 2);

  // Wrap each paragraph to the box width.
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    if (para === '') { lines.push(''); continue; }
    let cur = '';
    for (const word of para.split(' ')) {
      const trial = cur ? `${cur} ${word}` : word;
      if (cur && font.widthOfTextAtSize(trial, size) > maxWidth) { lines.push(cur); cur = word; }
      else cur = trial;
    }
    if (cur) lines.push(cur);
  }

  const boxBottom = H - el.y - el.height;
  let baseline = H - el.y - padding - size;
  for (const line of lines) {
    if (baseline < boxBottom) break; // overflowed the box
    // Guard against a single unbroken token (or space-less script) wider than
    // the box — truncate it so it can't draw past the element bounds.
    const fitted = fit(font, line, size, maxWidth);
    const w = font.widthOfTextAtSize(fitted, size);
    let x = el.x + padding;
    if (align === 'center') x = el.x + (el.width - w) / 2;
    else if (align === 'right') x = el.x + el.width - padding - w;
    page.drawText(fitted, { x, y: baseline, size, font, color, opacity });
    baseline -= lineHeight;
  }
}

function drawTable(page: PDFPage, regular: PDFFont, bold: PDFFont, el: ExportElement) {
  const data = normalizeTableData(el.content.tableData as string[][] | undefined);
  const rows = data.length;
  const cols = data[0].length;
  const cellW = el.width / cols;
  const cellH = el.height / rows;
  const size = num(el.style.fontSize, 14);
  const textColor = hexToRgb(str(el.style.color), [0.1, 0.1, 0.1]);
  const borderColor = hexToRgb(str(el.style.borderColor), [0.82, 0.84, 0.86]);
  const borderWidth = num(el.style.borderWidth, 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const left = el.x + c * cellW;
      const bottom = H - el.y - (r + 1) * cellH;
      page.drawRectangle({
        x: left,
        y: bottom,
        width: cellW,
        height: cellH,
        color: r === 0 ? rgb(0.95, 0.95, 0.95) : undefined,
        borderColor: borderWidth > 0 ? borderColor : undefined,
        borderWidth: borderWidth > 0 ? borderWidth : undefined,
      });
      const font = r === 0 ? bold : regular;
      const text = fit(font, sanitize(data[r][c]).replace(/\n/g, ' '), size, cellW - 8);
      if (text) {
        page.drawText(text, {
          x: left + 4,
          y: bottom + (cellH - size) / 2 + size * 0.15,
          size,
          font,
          color: textColor,
        });
      }
    }
  }
}

async function drawElement(pdfDoc: PDFDocument, page: PDFPage, regular: PDFFont, bold: PDFFont, el: ExportElement) {
  const left = el.x;
  const bottom = H - el.y - el.height;
  const opacity = num(el.style.opacity, 1);

  switch (el.type) {
    case 'image': {
      const src = str(el.content.src);
      const img = src ? await loadImage(pdfDoc, src) : null;
      if (img) page.drawImage(img, { x: left, y: bottom, width: el.width, height: el.height, opacity });
      else page.drawRectangle({ x: left, y: bottom, width: el.width, height: el.height, color: rgb(0.94, 0.94, 0.94) });
      return;
    }
    case 'shape': {
      const shapeType = str(el.content.shapeType) ?? 'rect';
      const fill = hexToRgb(str(el.style.backgroundColor), [0.231, 0.51, 0.965]);
      const borderWidth = num(el.style.borderWidth, 0);
      const borderColor = borderWidth > 0 ? hexToRgb(str(el.style.borderColor), [0, 0, 0]) : undefined;
      if (shapeType === 'circle') {
        page.drawEllipse({ x: left + el.width / 2, y: bottom + el.height / 2, xScale: el.width / 2, yScale: el.height / 2, color: fill, opacity, borderColor, borderWidth: borderWidth || undefined });
      } else if (shapeType === 'triangle') {
        // SVG path origin is top-left with y pointing down, positioned at (x, top).
        const path = `M ${el.width / 2} 0 L 0 ${el.height} L ${el.width} ${el.height} Z`;
        page.drawSvgPath(path, { x: left, y: H - el.y, color: fill, opacity, borderColor, borderWidth: borderWidth || undefined });
      } else {
        page.drawRectangle({ x: left, y: bottom, width: el.width, height: el.height, color: fill, opacity, borderColor, borderWidth: borderWidth || undefined });
      }
      return;
    }
    case 'line': {
      const y = H - el.y - el.height / 2;
      page.drawLine({ start: { x: left, y }, end: { x: left + el.width, y }, thickness: num(el.style.borderWidth, 2), color: hexToRgb(str(el.style.borderColor), [0, 0, 0]), opacity });
      return;
    }
    case 'chart': {
      // No server-side canvas: render a labeled placeholder.
      page.drawRectangle({ x: left, y: bottom, width: el.width, height: el.height, color: rgb(0.97, 0.97, 0.98), borderColor: rgb(0.8, 0.8, 0.82), borderWidth: 1 });
      const label = `Chart (${sanitize(str(el.content.chartType) ?? 'bar')})`;
      const w = regular.widthOfTextAtSize(label, 14);
      page.drawText(label, { x: left + (el.width - w) / 2, y: bottom + el.height / 2 - 5, size: 14, font: regular, color: rgb(0.5, 0.5, 0.55) });
      return;
    }
    case 'table':
      drawTable(page, regular, bold, el);
      return;
    default:
      drawTextBox(page, regular, bold, el);
  }
}

const FETCH_TIMEOUT_MS = 5000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 4;

// Best-effort SSRF guard: reject loopback/link-local/private literals so a
// deck can't make the server fetch internal hosts or cloud metadata. This does
// not resolve DNS, so a hostname pointing at a private IP can still slip
// through — full protection needs connect-time IP checks.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === '0.0.0.0' || h === '::1') return true;
  if (/^127\./.test(h)) return true;                        // loopback
  if (/^10\./.test(h)) return true;                         // private
  if (/^192\.168\./.test(h)) return true;                   // private
  if (/^169\.254\./.test(h)) return true;                   // link-local (incl. metadata)
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;   // private
  return false;
}

// Follow redirects manually so every hop's host is re-checked against the SSRF
// guard — a fetch with default redirect handling could be bounced from an
// allowed host to a private/link-local one and bypass the initial check.
async function safeFetchImage(initial: string): Promise<Response | null> {
  let target = initial;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let url: URL;
    try { url = new URL(target); } catch { return null; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (isBlockedHost(url.hostname)) return null;
    const res = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return null;
      target = new URL(location, target).toString(); // resolve relative redirects, re-validate next loop
      continue;
    }
    return res;
  }
  return null; // too many redirects
}

async function loadImage(pdfDoc: PDFDocument, src: string) {
  try {
    let bytes: Uint8Array;
    let isPng: boolean;
    if (src.startsWith('data:')) {
      const comma = src.indexOf(',');
      if (comma === -1) return null;
      const meta = src.slice(5, comma);
      // Buffer is a Uint8Array subclass — use it directly, no extra copy.
      bytes = Buffer.from(src.slice(comma + 1), meta.includes('base64') ? 'base64' : 'utf8');
      isPng = meta.includes('png');
    } else if (src.startsWith('http://') || src.startsWith('https://')) {
      const res = await safeFetchImage(src);
      if (!res || !res.ok) return null;
      if (Number(res.headers.get('content-length') || 0) > MAX_IMAGE_BYTES) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > MAX_IMAGE_BYTES) return null;
      bytes = buf;
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      isPng = contentType.includes('image/png')
        || (!contentType.includes('image/jpeg') && src.toLowerCase().includes('.png'));
    } else {
      return null;
    }
    try { return isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes); }
    catch { return isPng ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes); }
  } catch {
    return null;
  }
}

/**
 * Renders a deck's slides into a landscape 16:9 PDF, drawing each element with
 * vector primitives. Mirrors the element model used by the PPTX export so the
 * two stay consistent. Charts have no server-side renderer and appear as a
 * labeled placeholder.
 */
export async function buildDeckPdf(title: string, slides: ExportSlide[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);
  pdfDoc.setProducer('MyDecks');
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Always emit at least one page so the PDF is valid for empty decks.
  const list = slides.length ? slides : [{ elements: [] as ExportElement[] }];
  for (const slide of list) {
    const page = pdfDoc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: hexToRgb(slide.background_color, [1, 1, 1]) });
    for (const el of slide.elements) {
      try { await drawElement(pdfDoc, page, regular, bold, el); }
      catch { /* skip any element that fails to render rather than aborting the file */ }
    }
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
