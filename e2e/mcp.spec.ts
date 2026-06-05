import { test, expect } from '@playwright/test';

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
});
