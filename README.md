# MyDecks

A professional, self-hosted presentation editor built with Next.js, React, and SQLite. No login required — just open and start creating beautiful slides.

## Features

- **Professional Slide Editor**: Drag-and-drop canvas with grid snapping, zoom controls, and precise positioning
- **Rich Elements**: Text, headings, images, shapes (rectangles, circles), and lines
- **Multiple Layouts**: Title, title+content, two-column, image+text, and blank layouts
- **Live Presentation Mode**: Full-screen presentation with keyboard navigation (arrow keys, space, page up/down)
- **PPTX & PDF Export**: Export your decks to PowerPoint or PDF
- **MCP Server**: Lets AI agents generate decks programmatically and open them in the editor (see below)
- **AI-LLM Friendly Interface**: Semantic HTML with `data-testid` attributes throughout for easy automation
- **No Login Required**: Works entirely locally with SQLite storage

## Quick Start

### Using Docker Compose (Recommended)

```bash
git clone https://github.com/julianshen/mydecks.git
cd mydecks
docker-compose up -d
```

Open http://localhost:3000

### Manual Setup

```bash
npm install
npm run build
npm start
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select tool |
| T | Text tool |
| H | Heading tool |
| I | Image tool |
| S | Shape tool |
| L | Line tool |
| Delete / Backspace | Delete selected element |
| Ctrl+D | Duplicate element |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Escape | Deselect / Exit presentation |

## Presentation Mode

- **Arrow Right / Space / Page Down**: Next slide
- **Arrow Left / Page Up**: Previous slide
- **F**: Toggle fullscreen
- **Escape**: Exit presentation

## MCP Server (AI agents)

MyDecks exposes a [Model Context Protocol](https://modelcontextprotocol.io) server over streamable HTTP so an AI agent can generate decks and hand back a URL to open in the editor.

- **Endpoint**: `POST http://localhost:3000/api/mcp` (the running app — no separate process)
- **Editor/auto-open base URL**: set `MYDECKS_BASE_URL` if the app isn't on `http://localhost:3000`. `open_in_browser` only launches a browser when the server runs on your own machine.

Point an MCP client at the endpoint, e.g.:

```json
{
  "mcpServers": {
    "mydecks": { "type": "http", "url": "http://localhost:3000/api/mcp" }
  }
}
```

### Tools

| Tool | Purpose |
|------|---------|
| `list_decks` | List decks (id, title, timestamps) |
| `get_deck` | Get a deck with all slides and elements |
| `create_deck` | Create a deck with a title slide → returns `editorUrl` |
| `update_deck` | Update a deck's title/theme |
| `delete_deck` | Delete a deck (and its slides/elements) |
| `add_slide` | Append a slide (`blank` or a named layout) |
| `update_slide` | Update a slide's layout, background, or sort order |
| `delete_slide` | Delete a slide and its elements |
| `reorder_slides` | Reorder a deck's slides |
| `add_element` | Add an element (text, heading, image, shape, line, chart, table) at 960×540 coordinates |
| `update_element` | Update an element's text/content, position, size, rotation, z-order, or style |
| `delete_element` | Delete an element |
| `generate_deck` | Build a whole deck from an outline in one call → returns `editorUrl` |
| `export_deck` | Get a `.pptx`/`.pdf` download URL for a deck |
| `open_in_browser` | Return (and try to launch) a deck's editor or presenter URL |

`generate_deck` takes a `title` and a `slides[]` outline, where each slide has an optional `layout`/`background_color` and an `elements[]` list. Each element accepts `type`, a `text` shorthand (or a `content` object for images/tables/charts), `x`/`y`/`width`/`height`, and a `style` object — then returns the deck id and an `editorUrl` you can open to edit.

## Project Structure

```
mydecks/
├── src/
│   ├── app/              # Next.js app routes
│   │   ├── api/          # REST API endpoints
│   │   ├── editor/       # Slide editor page
│   │   ├── present/      # Presentation mode
│   │   └── page.tsx      # Home / deck list
│   ├── components/
│   │   ├── editor/       # Editor components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/
│   │   └── db/           # SQLite database
│   └── types/            # TypeScript types
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Tech Stack

- **Frontend**: React 19, Next.js 16, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, better-sqlite3
- **Export**: pptxgenjs
- **Container**: Docker + Docker Compose

## License

MIT
