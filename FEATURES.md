# Weaver Feature Inventory

This document tracks the current product feature set for Weaver and serves as the source of truth for feature-level behavior.

## Maintenance Rules

- When a feature is added, changed, or removed, update this file in the same change set.
- Add a concise entry to the change log with date, scope, and summary of behavior changes.
- Keep this file focused on user-visible and API-available product capabilities.

## Current Features

### Authentication and Access

- Google OAuth sign-in flow with secure session cookies.
- Authenticated app shell with route protection (`/login` is public, dashboard is protected).
- Session-backed `me` lookup and logout support.

### Conversations and Chat

- Create, list, load, update title, and delete conversations.
- Messages are stored as ordered conversation entries with `user` and `assistant` roles.
- Sending a chat message appends both user and assistant messages to the active conversation.
- Chat supports manual context input via explicit node references and an explicit-only mode.

### Knowledge Nodes

- Nodes store message or idea content with optional name and pinned status.
- Create, list, fetch single node, update, and delete node APIs.
- Node list UI separates pinned nodes and recent nodes.
- Messages can be pinned from chat with optional naming/editing via modal.
- Chat-created user and assistant message nodes auto-generate concise names.
- Pinning an unnamed node without an explicit name now auto-generates a name instead of leaving it unnamed.

### Graph and References

- Every node can have outgoing and incoming references.
- `explicit` references are used for direct links, including user message -> assistant reply flow edges.
- `implicit` references are used for context-driven links from current messages to retrieved context nodes.
- Graph view renders nodes and references with interactive selection.
- Reference styling differentiates explicit vs implicit edges.

### Context and Retrieval

- Hybrid context strategy combines user-selected explicit refs with semantic retrieval of similar nodes.
- Semantic retrieval is skipped when explicit-only mode is enabled.
- Embeddings are generated with Voyage AI (`voyage-3.5-lite`, 1024 dimensions).
- Semantic retrieval is backed by pgvector cosine similarity over 1024-d embeddings.
- Context formatting injects selected/retrieved nodes into assistant system prompt.

### Node Reference Linking in Responses

- Assistant can reference stored nodes via `[NodeName](nodeId)` markdown syntax.
- Backend parses these references and creates corresponding edges when IDs are valid.
- Frontend renders these references as clickable links in message bubbles.

### Search and Related Discovery

- API endpoint for semantic node search by text query.
- API endpoint for fetching related nodes to a specific node via embedding similarity.
- API endpoint for fetching all references for graph rendering.

### Graph Workspace UX

- Three-panel layout with left sidebar (conversations/nodes/context), center graph visualization, and right chat panel.
- Node click selection syncs graph/sidebar/chat interactions.
- Context panel supports pinned-node-first selection and search filtering.

## Known Constraints

- Embedding generation depends on a valid `VOYAGE_API_KEY` and external API availability.
- Retrieval quality and latency are sensitive to embedding model behavior and API performance.

## Feature Change Log

### 2026-02-06

- Updated context/retrieval documentation to reflect live Voyage AI embeddings (`voyage-3.5-lite`, 1024-d) instead of deterministic mock embeddings.
- `WEA-10`: Fixed node naming so chat-created nodes always get generated names.
- `WEA-10`: Updated pin flow to preserve existing names when pin modal input is blank.
- `WEA-10`: Added backend safeguard to auto-name unnamed nodes during pin updates.
- `WEA-10`: Added one-time backend backfill command `pnpm --filter backend backfill:node-names` for historical unnamed nodes.

### 2026-02-05

- Established `FEATURES.md` as the canonical feature inventory at the project repository root.
- Documented current authentication, chat, node, graph, reference, and retrieval feature set.
