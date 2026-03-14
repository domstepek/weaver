# Weaver

A knowledge graph-based chat application. Chat with Claude AI, pin important messages as nodes, and let the system automatically enrich future conversations with relevant context from your personal knowledge graph via semantic similarity.

## Key Concepts

- **Nodes** — The fundamental unit. A saved idea, message, or piece of knowledge with an embedding for semantic search.
- **Knowledge Graph** — Nodes connected by directed references (explicit user-created links or implicit AI-detected links). Grows organically from conversation.
- **Context Injection** — When you chat, the system finds semantically similar nodes from your graph and injects them into the AI's context, so Claude can reference your prior knowledge.
- **Chat-to-Graph Loop** — Conversations generate nodes, nodes enrich future conversations. The more you use it, the smarter the context becomes.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TailwindCSS, React Query, XYFlow |
| Backend | Express.js, Drizzle ORM, TypeScript |
| Database | PostgreSQL 16 with pgvector (HNSW indexing) |
| AI Chat | Anthropic Claude |
| Embeddings | Voyage AI `voyage-3.5-lite` (1024 dimensions) |
| Auth | Google OAuth via `arctic` (session cookies) |
| Monorepo | pnpm workspaces |
| Linting/Formatting | Biome |
| Testing | Vitest |

## Prerequisites

- **Node.js 20+** (managed via nvm)
- **pnpm** (package manager)
- **Docker** (for PostgreSQL with pgvector)
- **Google OAuth credentials** from Google Cloud Console
- **Anthropic API key** for Claude chat
- **Voyage AI API key** for embedding generation

## Setup

```bash
# 1. Clone and install dependencies
git clone <repo-url> && cd weaver
pnpm install

# 2. Start PostgreSQL with pgvector
docker compose up -d

# 3. Configure environment variables
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (default provided) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL (`http://localhost:3000/auth/google/callback`) |
| `SESSION_SECRET` | Session signing secret (≥32 characters) |
| `FRONTEND_URL` | Frontend origin for CORS (`http://localhost:5173`) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `VOYAGE_API_KEY` | Voyage AI API key for embeddings |
| `PORT` | Backend server port (default: `3000`) |
| `NODE_ENV` | Environment (`development`) |

```bash
# 4. Run database migrations
pnpm db:migrate
```

## Development

```bash
# Run both frontend and backend concurrently
pnpm dev

# Or individually
pnpm dev:frontend  # Vite dev server on :5173
pnpm dev:backend   # tsx watch on :3000
```

### Database Management

```bash
pnpm db:generate   # Generate migrations from schema changes
pnpm db:migrate    # Apply migrations
pnpm db:studio     # Open Drizzle Studio GUI
```

### Code Quality

```bash
pnpm lint          # Check for linting errors (Biome)
pnpm lint:fix      # Auto-fix linting errors
pnpm format        # Format code
pnpm check         # Format + lint + fix in one command
```

### Testing

```bash
pnpm test              # Run all tests (backend + frontend)
pnpm test:backend      # Backend tests only
pnpm test:frontend     # Frontend tests only
pnpm test:coverage     # Tests with coverage
```

### Workspace Shortcuts

```bash
pnpm b <command>   # Run command in backend workspace
pnpm f <command>   # Run command in frontend workspace
```

## Architecture

```
weaver/
├── backend/           Express.js + Drizzle ORM + PostgreSQL
│   ├── src/
│   │   ├── db/        Schema, migrations, connection
│   │   ├── routes/    API routes (auth, nodes, conversations, chat)
│   │   ├── services/  AI service (Claude chat, Voyage embeddings, semantic search)
│   │   └── middleware/ Auth middleware (session + Google OAuth)
│   └── .env.example
├── frontend/          React + Vite + TailwindCSS
│   └── src/
│       ├── components/ Chat, Graph (XYFlow), Sidebar, Modals
│       └── api/        React Query hooks + API client
├── docker-compose.yml PostgreSQL 16 + pgvector
└── package.json       Workspace scripts
```

### Data Model

- **Nodes** store content + 1024-d Voyage AI embeddings for semantic search
- **NodeReferences** create directed edges (explicit or implicit) between nodes
- **Conversations** contain ordered message references via **ConversationNodes** join table
- Messages are stored as nodes — they can be reused across conversations and form graph connections

### Chat Flow

1. User sends a message with optionally selected context nodes
2. Backend finds 5 semantically similar nodes via pgvector cosine distance (unless explicit-only mode)
3. Context nodes are formatted into Claude's system prompt with `[NodeName](nodeId)` links
4. Claude responds, referencing relevant nodes via markdown links
5. Backend parses response for node references and creates implicit graph edges

### API Routes

| Route | Purpose |
|---|---|
| `/auth/google` | Google OAuth flow |
| `/api/nodes` | CRUD for knowledge graph nodes |
| `/api/conversations` | CRUD for chat conversations |
| `/api/chat` | Send message → AI response with context |

## Key Technical Details

- **Embeddings**: Voyage AI `voyage-3.5-lite` produces 1024-dimensional vectors, indexed with HNSW (`vector_cosine_ops`) for fast cosine similarity search
- **Node references in AI responses**: Claude references nodes using `[Node Name](uuid)` markdown syntax. Frontend renders these as clickable links; backend creates implicit graph edges.
- **Session auth**: Google OAuth via `arctic` library, sessions stored in PostgreSQL with expiration. Use `requireAuth` middleware to protect routes.
- **Graph visualization**: `@xyflow/react` renders nodes and references with differentiated styling for explicit vs implicit edges. Interactive selection syncs with sidebar and chat.

## Further Documentation

- **[FEATURES.md](./FEATURES.md)** — Full product feature inventory and change log
- **[CLAUDE.md](./CLAUDE.md)** — Claude Code context file with detailed development guidance
- **[docs/design-system-foundations.md](./docs/design-system-foundations.md)** — Design system tokens and usage guide
