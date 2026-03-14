# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Weaver is a knowledge graph-based chat application that allows users to save important conversation content as nodes and build a personal knowledge graph. The system integrates Claude AI for chat functionality with semantic search over user-generated nodes.

**Core Concept**: Users chat with Claude, pin important messages as nodes, and the system automatically finds and includes relevant context from their knowledge graph in future conversations based on semantic similarity.

## Feature Documentation Requirement

- Keep the full product feature inventory in `FEATURES.md` at the active project repository root, not in `AGENTS.md`.
- Any agent that implements or materially changes a feature must update that repo-root `FEATURES.md` in the same change with a concise summary entry under its change log section.
- If a feature is removed or behavior changes, update the relevant feature section and log entry in that repo-root `FEATURES.md`.

## Architecture

### Monorepo Structure (pnpm workspace)
- `backend/` - Express.js + Drizzle ORM + PostgreSQL with pgvector
- `frontend/` - React + Vite + TailwindCSS + React Query + XYFlow (for graph visualization)
- Root workspace manages shared tooling (Biome for linting/formatting)

### Data Model

**Core entities** (see `backend/src/db/schema.ts`):
- **Nodes**: The fundamental unit - represents a saved idea/message with embeddings for semantic search
- **NodeReferences**: Directed edges between nodes, either `explicit` (user-created) or `implicit` (AI-detected)
- **Conversations**: Chat sessions containing messages
- **ConversationNodes**: Join table linking nodes to conversations with role (user/assistant) and position

**Key insight**: Messages are stored as nodes, and conversations reference these nodes. This allows nodes to be reused across conversations and enables the knowledge graph to grow organically.

### Database

PostgreSQL with pgvector extension for semantic search:
- Uses HNSW indexing for fast vector similarity search (`vector_cosine_ops`)
- Embeddings are 1024-dimensional vectors (Voyage AI `voyage-3.5-lite`) generated in `backend/src/services/ai.ts`

### Authentication

Google OAuth via `arctic` library:
- Session-based auth with cookies
- Sessions stored in PostgreSQL with expiration
- Middleware: `backend/src/middleware/auth.ts` - use `requireAuth` to protect routes

### AI Integration

Backend service (`backend/src/services/ai.ts`) handles:
- Embedding generation via Voyage AI (`voyage-3.5-lite`, 1024-d)
- Semantic similarity search using pgvector cosine distance
- Claude API chat with system prompts that include relevant context
- Node reference parsing from responses using markdown link format: `[NodeName](nodeId)`

### Frontend State Management

React Query for server state:
- Query keys: `['nodes']`, `['conversations']`, `['conversation', id]`, `['node', id]`
- Main app state in `App.tsx` coordinates three panels: Sidebar (node list + context control), Chat, Graph
- Graph visualization uses `@xyflow/react` to render nodes and references

## Development Commands

### Session Setup
```bash
# Source shell configuration (required for pnpm to be available)
source ~/.zshrc

# Set Node.js version (required at the start of each session)
nvm use 20
```

### First-time Setup
```bash
# Install dependencies
pnpm install

# Start PostgreSQL with pgvector
docker compose up -d

# Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your Google OAuth credentials and Anthropic API key

# Run database migrations
pnpm db:migrate
```

### Development
```bash
# Run both frontend and backend concurrently
pnpm dev

# Run individually
pnpm dev:frontend  # Vite dev server on :5173
pnpm dev:backend   # tsx watch on :3000
```

### Database Management
```bash
pnpm db:generate   # Generate new migrations from schema changes
pnpm db:migrate    # Apply migrations to database
pnpm db:studio     # Open Drizzle Studio GUI
```

### Code Quality
```bash
pnpm lint          # Check for linting errors (Biome)
pnpm lint:fix      # Auto-fix linting errors
pnpm format        # Format code
pnpm check         # Format + lint + fix in one command
```

### Workspace Shortcuts
```bash
pnpm b <command>   # Run command in backend workspace
pnpm f <command>   # Run command in frontend workspace
```

## Key Technical Details

### Node Reference Linking
- AI responses can reference nodes using markdown link syntax: `[Node Name](uuid)`
- Frontend parses these in `MessageBubble.tsx` and renders clickable links
- Backend parses references in `ai.ts` to create implicit node references

### Context Retrieval Strategy
The chat flow (`backend/src/routes/chat.ts`):
1. Get explicitly selected nodes from request
2. If "use only explicit" is false, find 5 semantically similar nodes via embedding search
3. Format nodes as context with markdown links
4. Send to Claude with system prompt containing context
5. Parse Claude's response for node references and create implicit edges

### Graph Visualization
Uses `@xyflow/react` in `frontend/src/components/Graph/GraphView.tsx`:
- Nodes are laid out automatically (or can be dragged)
- Edges show explicit vs implicit references with different styling
- Clicking a node in the graph selects it for context in the chat

### API Routes
- `/auth/google` - OAuth flow
- `/api/nodes` - CRUD operations on knowledge graph nodes
- `/api/conversations` - CRUD for chat conversations
- `/api/chat` - POST to send message and get AI response with context

## Git and Linear Workflow

### Branching Strategy
- **ALWAYS branch off `origin/main`** - Never branch off feature branches or other work-in-progress branches
- Use the branch name suggested by Linear (found in the issue's `gitBranchName` field)
- Before creating a branch, run `git fetch origin` to ensure you have the latest main

### Linear Issue Management
When working on a Linear ticket:
1. **Start of work**: Mark the issue as "In Progress" using Linear's `update_issue` endpoint
2. **After plan acceptance, before implementation**: Post the full accepted execution plan as a comment on the same Linear ticket using `create_comment`
3. **PR opened**: Mark the issue as "In Review" using Linear's `update_issue` endpoint
4. **PR merged**: The issue should be marked as "Done" (typically done manually or via automation)

When creating a new Linear ticket:
- **Always set an issue type** (for example: `bug`, `improvement`, `feature`) during creation.
- Use Linear's supported issue types for the workspace/org; if needed, fetch them first via `list_issue_types` and then pass the selected value in the `type` field of `create_issue` (or `issue_write` when applicable).

### Example Workflow
```bash
# Fetch latest and create branch from origin/main
git fetch origin
git checkout -b feature-branch-name origin/main

# Make changes, commit, and push
git add .
git commit -m "Your commit message"
git push -u origin feature-branch-name

# Create PR and update Linear to "In Review"
```

## Important Development Notes

- Embeddings use Voyage AI's `voyage-3.5-lite` model (1024 dimensions)
- Google OAuth requires credentials from Google Cloud Console
- The frontend expects backend on `localhost:3000` and runs on `localhost:5173`
- Session cookies require `credentials: true` in CORS config (already configured)
- PostgreSQL must have pgvector extension installed (handled by `pgvector/pgvector` Docker image)
