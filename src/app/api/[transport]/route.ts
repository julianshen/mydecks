import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { listDecks, getDeck, createDeck, addSlide, addElement, deleteSlide, type ElementType } from '@/lib/decks';
import { openInBrowser } from '@/lib/open-browser';

export const runtime = 'nodejs';

const BASE_URL = (process.env.MYDECKS_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const editorUrl = (id: string) => `${BASE_URL}/editor/${id}`;
const presentUrl = (id: string) => `${BASE_URL}/present/${id}`;

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };
const ok = (data: unknown): ToolResult => ({
  content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
});
const fail = (message: string): ToolResult => ({ content: [{ type: 'text', text: message }], isError: true });

const LAYOUTS = ['blank', 'title', 'title-content', 'two-column', 'image-text'] as const;

// A single element spec. `text` is shorthand for `content.text`; `content`
// carries type-specific data (image src, shapeType, tableData, chartData, …).
const elementShape = {
  type: z.enum(['text', 'heading', 'image', 'shape', 'line', 'chart', 'table']).default('text'),
  text: z.string().optional().describe('Shorthand for content.text (text/heading elements)'),
  content: z.record(z.string(), z.any()).optional().describe('Type-specific content, e.g. { src }, { shapeType }, { tableData }, { chartType, chartData }'),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  z_index: z.number().optional(),
  style: z.record(z.string(), z.any()).optional().describe('Style overrides, e.g. { fontSize, color, backgroundColor, textAlign, fontWeight }'),
};
const elementSchema = z.object(elementShape);
type ElementSpec = z.infer<typeof elementSchema>;

function addElementSpec(slideId: string, e: ElementSpec) {
  const content: Record<string, unknown> = { ...(e.content ?? {}) };
  if (e.text !== undefined) content.text = e.text;
  return addElement({
    slideId,
    type: e.type as ElementType,
    content,
    x: e.x, y: e.y, width: e.width, height: e.height,
    rotation: e.rotation, zIndex: e.z_index, style: e.style,
  });
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'list_decks',
      'List all decks with their id, title, and timestamps.',
      {},
      async () => ok((listDecks() as Record<string, unknown>[]).map(d => ({ id: d.id, title: d.title, updated_at: d.updated_at }))),
    );

    server.tool(
      'get_deck',
      'Get a deck with all of its slides and elements (full JSON).',
      { deckId: z.string() },
      async ({ deckId }) => {
        const deck = getDeck(deckId);
        return deck ? ok(deck) : fail(`Deck ${deckId} not found`);
      },
    );

    server.tool(
      'create_deck',
      'Create a new deck with a single title slide. Returns the deck id and editor URL.',
      { title: z.string().optional(), theme: z.string().optional() },
      async ({ title, theme }) => {
        const deck = createDeck({ title, theme });
        const id = String(deck.id);
        return ok({ deckId: id, editorUrl: editorUrl(id) });
      },
    );

    server.tool(
      'add_slide',
      'Append a slide to a deck. Use layout "blank" (default) to add no placeholder elements, or a named layout to seed placeholders.',
      {
        deckId: z.string(),
        layout: z.enum(LAYOUTS).optional(),
        background_color: z.string().optional(),
        sort_order: z.number().optional(),
      },
      async ({ deckId, layout, background_color, sort_order }) => {
        const deck = getDeck(deckId);
        if (!deck) return fail(`Deck ${deckId} not found`);
        const sortOrder = sort_order ?? deck.slides.length;
        const slide = addSlide({ deckId, sortOrder, layout, backgroundColor: background_color });
        return slide ? ok({ slideId: slide.id }) : fail('Failed to create slide');
      },
    );

    server.tool(
      'add_element',
      'Add an element to a slide. Coordinates/sizes are in the 960×540 slide space. Types: text, heading, image, shape, line, chart, table.',
      { slideId: z.string(), ...elementShape },
      async ({ slideId, ...spec }) => {
        const el = addElementSpec(slideId, spec as ElementSpec);
        return ok({ elementId: el.id });
      },
    );

    server.tool(
      'generate_deck',
      'Create a complete deck from an outline in one call. Builds the deck with the given slides and their elements (replacing the default title slide) and returns the deck id and editor URL.',
      {
        title: z.string(),
        theme: z.string().optional(),
        slides: z.array(z.object({
          layout: z.enum(LAYOUTS).optional(),
          background_color: z.string().optional(),
          elements: z.array(elementSchema).optional(),
        })).min(1).describe('Slides in order; each may carry a layout, background, and elements'),
      },
      async ({ title, theme, slides }) => {
        const deck = createDeck({ title, theme });
        const deckId = String(deck.id);
        // Drop the auto-seeded title slide first so the requested slides own
        // sort_order 0..n-1 with no transient duplicate.
        const placeholder = getDeck(deckId)?.slides[0] as { id?: string } | undefined;
        if (placeholder?.id) deleteSlide(placeholder.id);
        slides.forEach((s, i) => {
          const slide = addSlide({ deckId, sortOrder: i, layout: s.layout ?? 'blank', backgroundColor: s.background_color });
          if (slide) for (const e of s.elements ?? []) addElementSpec(String(slide.id), e);
        });
        return ok({ deckId, slideCount: slides.length, editorUrl: editorUrl(deckId) });
      },
    );

    server.tool(
      'open_in_browser',
      'Return the editor (or presenter) URL for a deck and attempt to open it in the default browser. Auto-open only works when the server runs on your machine.',
      { deckId: z.string(), mode: z.enum(['editor', 'present']).default('editor') },
      async ({ deckId, mode }) => {
        if (!getDeck(deckId)) return fail(`Deck ${deckId} not found`);
        const url = mode === 'present' ? presentUrl(deckId) : editorUrl(deckId);
        return ok({ url, opened: openInBrowser(url) });
      },
    );
  },
  {},
  { basePath: '/api' },
);

export { handler as GET, handler as POST, handler as DELETE };
