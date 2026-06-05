import { test, expect, type APIRequestContext } from '@playwright/test';

const MCP = '/api/mcp';
const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };

// The streamable-HTTP transport replies as an SSE frame; pull the JSON out.
function parseSse(body: string) {
  const data = body
    .split('\n')
    .filter(l => l.startsWith('data: '))
    .map(l => l.slice('data: '.length))
    .join('');
  return JSON.parse(data);
}

let rpcId = 100;
// Call an MCP tool and return its parsed structured result (the JSON text).
async function callTool(request: APIRequestContext, name: string, args: Record<string, unknown>) {
  const resp = await request.post(MCP, {
    headers,
    data: { jsonrpc: '2.0', id: rpcId++, method: 'tools/call', params: { name, arguments: args } },
  });
  const msg = parseSse(await resp.text());
  return JSON.parse(msg.result.content[0].text);
}

test.describe('MCP server', () => {
  test('lists tools and generates a deck that opens in the editor', async ({ request, page }) => {
    const init = await request.post(MCP, {
      headers,
      data: { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'e2e', version: '1' } } },
    });
    expect(init.ok()).toBeTruthy();

    const listMsg = parseSse(await (await request.post(MCP, {
      headers,
      data: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    })).text());
    const names = listMsg.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual(expect.arrayContaining([
      'create_deck', 'add_slide', 'add_element', 'generate_deck', 'open_in_browser', 'list_decks', 'get_deck',
    ]));

    const genMsg = parseSse(await (await request.post(MCP, {
      headers,
      data: {
        jsonrpc: '2.0', id: 3, method: 'tools/call',
        params: {
          name: 'generate_deck',
          arguments: {
            title: 'MCP E2E',
            slides: [{ elements: [{ type: 'heading', text: 'Hello from MCP', x: 80, y: 80, width: 800, height: 80 }] }],
          },
        },
      },
    })).text());
    const result = JSON.parse(genMsg.result.content[0].text);
    expect(result.deckId).toBeTruthy();
    expect(result.slideCount).toBe(1);

    // The generated deck is persisted and matches the outline.
    const deck = await (await request.get(`/api/decks/${result.deckId}`)).json();
    expect(deck.title).toBe('MCP E2E');
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].elements[0].type).toBe('heading');

    // And the returned editor URL actually loads the editor.
    await page.goto(`/editor/${result.deckId}`);
    await expect(page.getByTestId('editor-page')).toBeVisible();
  });

  test('supports the full CRUD + export toolset', async ({ request }) => {
    // create_deck → has one (title) slide
    const { deckId } = await callTool(request, 'create_deck', { title: 'CRUD' });
    expect(deckId).toBeTruthy();

    // update_deck
    await callTool(request, 'update_deck', { deckId, title: 'CRUD Renamed', theme: 'midnight' });

    // add_slide + add_element
    const { slideId } = await callTool(request, 'add_slide', { deckId, layout: 'blank' });
    const { elementId } = await callTool(request, 'add_element', { slideId, type: 'text', text: 'hello', x: 10, y: 10, width: 200, height: 40 });

    // update_element (text merges into content; position changes)
    await callTool(request, 'update_element', { elementId, text: 'updated', x: 50 });

    // update_slide
    await callTool(request, 'update_slide', { slideId, background_color: '#222222' });

    // Verify state via the API
    let deck = await (await request.get(`/api/decks/${deckId}`)).json();
    expect(deck.title).toBe('CRUD Renamed');
    expect(deck.theme).toBe('midnight');
    const target = deck.slides.find((s: { id: string }) => s.id === slideId);
    expect(target.background_color).toBe('#222222');
    const el = target.elements.find((e: { id: string }) => e.id === elementId);
    expect(JSON.parse(el.content).text).toBe('updated');
    expect(el.x).toBe(50);

    // reorder_slides (deck now has the title slide + the added one)
    const ids = deck.slides.map((s: { id: string }) => s.id);
    const reordered = await callTool(request, 'reorder_slides', { deckId, slideIds: [...ids].reverse() });
    expect(reordered.order).toEqual([...ids].reverse());

    // export_deck returns a working URL
    const exp = await callTool(request, 'export_deck', { deckId, format: 'pdf' });
    expect(exp.url).toContain(`/api/export/${deckId}`);
    expect(exp.url).toContain('format=pdf');
    const pdf = await request.get(`/api/export/${deckId}?format=pdf`);
    expect(pdf.ok()).toBeTruthy();
    expect(pdf.headers()['content-type']).toContain('application/pdf');

    // delete_element, delete_slide
    expect((await callTool(request, 'delete_element', { elementId })).deleted).toBe(elementId);
    expect((await callTool(request, 'delete_slide', { slideId })).deleted).toBe(slideId);
    deck = await (await request.get(`/api/decks/${deckId}`)).json();
    expect(deck.slides.some((s: { id: string }) => s.id === slideId)).toBe(false);

    // delete_deck → gone
    expect((await callTool(request, 'delete_deck', { deckId })).deleted).toBe(deckId);
    const after = await request.get(`/api/decks/${deckId}`);
    expect(after.status()).toBe(404);
  });
});
