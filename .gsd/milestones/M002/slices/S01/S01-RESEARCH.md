# S01: README Mermaid Diagrams — Research

**Date:** 2026-03-14

## Summary

This slice adds 4 Mermaid diagrams to the existing README: system architecture (flowchart), entity-relationship (erDiagram), chat flow (sequence diagram), and auth flow (sequence diagram). All four diagram types are natively supported by GitHub's Mermaid renderer.

The source files are well-structured and the domain is straightforward. The schema has 6 tables with clean FK relationships and 2 enums. The chat flow is a single POST handler with a clear pipeline. The auth flow is standard Google OAuth2 with PKCE. No ambiguity in what to diagram.

The README already has natural insertion points — `## Architecture` contains `### Data Model` and `### Chat Flow` subsections with prose descriptions. Diagrams should be placed alongside (or just below) the existing prose in those subsections, plus a new system architecture diagram near the top of `## Architecture` and an auth flow diagram near the auth-related content.

## Recommendation

Use these 4 diagram types, inserted into the existing README structure:

1. **System Architecture** — `graph LR` flowchart showing Frontend → Backend → PostgreSQL/pgvector, Backend → Claude API, Backend → Voyage AI. Place at the top of `## Architecture`, before the directory tree.
2. **Entity-Relationship** — `erDiagram` showing all 6 tables with relationships and key columns. Place after `### Data Model` prose.
3. **Chat Flow** — `sequenceDiagram` showing User → Frontend → Backend → Voyage AI → pgvector → Claude → Frontend. Place after `### Chat Flow` prose.
4. **Auth Flow** — `sequenceDiagram` showing Browser → Backend → Google → Backend → Browser cookie flow. Place after `### API Routes` or as a new `### Auth Flow` subsection.

Keep diagrams compact. GitHub renders Mermaid at the code block width — overly wide diagrams get cramped. Prefer vertical sequence diagrams and keep ER diagram columns to just PK/FK/key fields (not every column).

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Diagram syntax | GitHub-native Mermaid (`\`\`\`mermaid` blocks) | Zero dependencies, renders natively on GitHub, version-controlled as text |

## Existing Code and Patterns

- `backend/src/db/schema.ts` — 6 tables: `users`, `sessions`, `nodes`, `nodeReferences`, `conversations`, `conversationNodes`. Two enums: `referenceTypeEnum` (explicit/implicit), `roleEnum` (user/assistant). Key relationships: users→sessions (1:N), users→nodes (1:N), users→conversations (1:N), nodes↔nodeReferences (M:N via from/to), conversations↔nodes (M:N via conversationNodes join table). Nodes have 1024-d vector embedding with HNSW index.
- `backend/src/routes/chat.ts` — Single POST handler pipeline: validate input (Zod) → verify conversation ownership → fetch existing messages → create user node + Voyage embedding + AI-generated name → gather context (explicit refs + semantic search limited to conversation scope) → format context → stream Claude response (SSE) → save AI node + embedding → parse `[Name](uuid)` references → create explicit edges from referenced nodes → create user→AI explicit edge → create implicit edges from explicitly-selected context nodes → update conversation timestamp → send final SSE event with metadata.
- `backend/src/routes/auth.ts` — Google OAuth via `arctic`: GET `/google` generates state+PKCE verifier, stores in cookies, redirects to Google. GET `/google/callback` validates state, exchanges code for tokens, fetches Google user info, upserts user in DB, creates 30-day session, sets session cookie, redirects to frontend. POST `/logout` deletes session. GET `/me` returns current user from session.
- `backend/src/middleware/auth.ts` — `requireAuth` middleware: reads session cookie → joins sessions+users → validates not expired → attaches `req.user` and `req.sessionId`. Also exports `optionalAuth` variant.
- `backend/src/services/ai.ts` — Voyage AI `voyage-3.5-lite` for embeddings (1024-d), Anthropic Claude for chat, pgvector cosine distance for semantic search, `parseNodeReferences` for `[Name](uuid)` link extraction.
- `README.md` — 15 sections, 168 lines. Key insertion points: `## Architecture` (line 113), `### Data Model` (line 132), `### Chat Flow` (line 139), `### API Routes` (line 147).

## Constraints

- Must use GitHub-compatible Mermaid syntax only (fenced `\`\`\`mermaid` code blocks)
- Node labels must avoid bare parentheses — GitHub's Mermaid renderer can crash on them. Use square brackets or quotes for labels containing parens.
- erDiagram syntax uses `||--o{` style relationship notation, not standard crow's foot text
- Sequence diagrams should stay under ~10 participants to remain readable at GitHub's default render width
- Existing README structure and prose must be preserved — diagrams supplement, not replace

## Common Pitfalls

- **Parentheses in node labels** — GitHub Mermaid crashes on `Node(text)` syntax in flowcharts. Use `Node["text"]` or `Node[text]` instead.
- **Overly detailed ER diagrams** — Listing every column makes the diagram unreadable. Show PK, FK, and key domain columns only (e.g., `embedding`, `referenceType`, `role`, `position`).
- **Sequence diagram width** — Too many parallel activations or long participant names push the diagram off-screen. Use short aliases (`FE`, `BE`, `DB`, `Claude`, `Voyage`).
- **Mermaid version drift** — GitHub pins a specific Mermaid version. Stick to well-established syntax (flowchart, sequenceDiagram, erDiagram) and avoid beta features (treemap-beta, architecture diagrams).

## Open Risks

- None — all four diagram types (flowchart, erDiagram, sequenceDiagram) are stable and well-supported on GitHub. Source files are clear. Low risk slice.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Mermaid diagrams | softaworks/agent-toolkit@mermaid-diagrams | available (3.5K installs) |
| Mermaid diagrams | imxv/pretty-mermaid-skills@pretty-mermaid | available (973 installs) |

The `mermaid-diagrams` skill (3.5K installs) could help with syntax correctness. Install with: `npx skills add softaworks/agent-toolkit@mermaid-diagrams`. Not required for this straightforward slice but may be useful.

## Sources

- Schema structure derived from `backend/src/db/schema.ts` (6 tables, 2 enums, relations)
- Chat pipeline derived from `backend/src/routes/chat.ts` (single POST handler, ~278 lines)
- Auth flow derived from `backend/src/routes/auth.ts` (4 endpoints) and `backend/src/middleware/auth.ts` (2 middleware functions)
- AI service capabilities derived from `backend/src/services/ai.ts` (Voyage AI embeddings, Claude chat, semantic search)
- GitHub Mermaid support and limitations (source: [GitHub Docs](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams), [GitHub Blog](https://github.blog/changelog/2022-02-14-include-diagrams-in-your-markdown-files-with-mermaid/))
