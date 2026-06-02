# MyDecks

A professional, self-hosted presentation editor built with Next.js, React, and SQLite. No login required — just open and start creating beautiful slides.

## Features

- **Professional Slide Editor**: Drag-and-drop canvas with grid snapping, zoom controls, and precise positioning
- **Rich Elements**: Text, headings, images, shapes (rectangles, circles), and lines
- **Multiple Layouts**: Title, title+content, two-column, image+text, and blank layouts
- **Live Presentation Mode**: Full-screen presentation with keyboard navigation (arrow keys, space, page up/down)
- **PPTX Export**: Export your decks to PowerPoint format
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
