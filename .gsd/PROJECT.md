# Project

## What This Is

Weaver is a knowledge graph-based chat application. Users chat with Claude AI, pin important messages as nodes, and the system automatically finds and includes relevant context from their knowledge graph in future conversations via semantic similarity (Voyage AI embeddings + pgvector).

Built as a pnpm monorepo: React/Vite/TailwindCSS/XYFlow frontend, Express/Drizzle ORM/PostgreSQL+pgvector backend.

## Core Value

The chat-to-knowledge-graph loop: conversations generate nodes, nodes enrich future conversations. The graph grows organically from use.

## Current State

Fully functional application with:
- Google OAuth authentication with session cookies
- Chat with Claude AI, context injection from knowledge graph
- Node CRUD, pinning, auto-naming via LLM
- Semantic search and related node discovery (Voyage AI `voyage-3.5-lite`, 1024-d embeddings, pgvector HNSW)
- Graph visualization with XYFlow (explicit + implicit edges)
- Three-panel layout: sidebar (conversations/nodes/context), center graph, right chat
- Design system foundations with semantic CSS tokens and Storybook docs
- Test coverage across frontend and backend (Vitest)
- No README.md — project lacks repository-level documentation

## Architecture / Key Patterns

- **Monorepo:** pnpm workspaces — `backend/` (Express + Drizzle + PostgreSQL) and `frontend/` (React + Vite + TailwindCSS)
- **Data model:** Nodes are the fundamental unit. Conversations reference nodes via ConversationNodes join table. NodeReferences create directed edges (explicit or implicit).
- **Embeddings:** Voyage AI `voyage-3.5-lite`, 1024 dimensions, HNSW indexing with `vector_cosine_ops`
- **Auth:** Google OAuth via `arctic`, session-based with cookies stored in PostgreSQL
- **AI:** Anthropic Claude for chat, system prompts inject relevant node context. Node references parsed from `[Name](id)` markdown links.
- **Linting/Formatting:** Biome
- **Testing:** Vitest (frontend + backend)

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M001: Repository Documentation — GSD scaffolding, README.md, and CLAUDE.md
