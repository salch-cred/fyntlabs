# FyntLabs — Notion-style Docs + Visual Workflow Automation

A full-stack app that combines a Notion-like block editor with an embedded
n8n/Zapier-style visual workflow canvas. Write a doc, drop in a "Canvas
Portal" block, and design an automation (trigger → extract → AI agent →
output) right next to your notes — or ask the built-in AI to generate a
workflow skeleton from what you just wrote.

## Features

- **Block-based document editor** — headings, bulleted lists, code blocks
  (with live Python execution + AI "auto-fix" on error), slash (`/`) command
  menu, drag-to-reorder blocks, auto-save to the backend.
- **Visual workflow canvas** (built on `@xyflow/react`) — trigger, extract,
  AI analysis, interactive-UI, autonomous-agent and output nodes; drag to
  connect; **Run Workflow** executes the graph topologically with live
  status indicators (running → success/error).
- **Autonomous Agent node** — delegates execution to the backend
  `/api/execute-agent` endpoint and displays its step-by-step reasoning.
- **Time Travel** — every graph change is snapshotted; scrub the slider to
  rewind/replay the workflow's history.
- **AI: Generate Workflow** — turns the text of the current document into a
  starter workflow graph, loaded straight onto the canvas.
- **Debug Logs & integrated Terminal** panels on the canvas.
- **Multi-page workspace** — create, rename (via the page title), and delete
  pages from the sidebar; full-text search across pages.
- **Light/dark theme**, collapsible sidebar, simulated Google sign-in
  (session persisted in `localStorage`).

## Tech stack

- **Frontend:** React 19, Vite, React Router, `@xyflow/react`, `@dnd-kit`,
  Tailwind CSS v4, `lucide-react` icons.
- **Backend:** FastAPI, SQLAlchemy (SQLite), WebSockets (terminal).

## Project structure

```
fyntlabs/
├── src/                  # React app
│   ├── components/       # Editor, Canvas, Sidebar, Login, ErrorBoundary...
│   └── context/          # Auth, Pages, Workflow (React context/state)
├── backend/               # FastAPI server
│   ├── main.py            # REST + WebSocket API
│   ├── models.py          # SQLAlchemy models
│   └── database.py        # SQLite engine/session setup
└── public/
```

## Getting started

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py                # runs on http://localhost:8000
```

The SQLite database (`gumloop2.db`) is created automatically on first run.

### 2. Frontend (Vite + React)

In a second terminal, from the project root:

```bash
npm install
npm run dev                   # runs on http://localhost:5173
```

Open http://localhost:5173, click **Continue with Google** (simulated —
no real OAuth call is made) to enter the workspace.

> Both servers must be running for the app to work — the frontend talks to
> the backend at `http://localhost:8000` for documents, workflows, code
> execution, and the terminal WebSocket.

### 3. Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Notes on the current implementation

- **Code execution** (`/api/execute-code`) runs arbitrary Python via `exec()`
  with no sandboxing — fine for local experimentation, **do not deploy this
  as-is on a public server**.
- **Agent execution and AI auto-fix are simulated** on the backend (rule-based
  responses) rather than calling a real LLM, so the app works fully offline
  with no API keys required. Swap in a real LLM call inside
  `backend/main.py` (`/api/auto-fix`, `/api/generate-workflow`,
  `/api/execute-agent`) to make these fully AI-driven.
- **Login is a simulated Google sign-in** (no real OAuth) — the session is
  just stored in `localStorage`. Wire up real OAuth if you need actual
  authentication.

## License

MIT
