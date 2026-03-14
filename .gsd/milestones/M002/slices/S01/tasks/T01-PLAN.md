---
estimated_steps: 5
estimated_files: 1
---

# T01: Add Mermaid diagrams to README

**Slice:** S01 — README Mermaid Diagrams
**Milestone:** M002

## Description

Add 4 Mermaid diagrams to the existing README.md: system architecture (flowchart), entity-relationship (erDiagram), chat flow (sequenceDiagram), and auth flow (sequenceDiagram). Each diagram is derived from the actual source code and inserted into the existing README structure without removing any prose.

## Steps

1. Read `backend/src/db/schema.ts`, `backend/src/routes/chat.ts`, `backend/src/routes/auth.ts`, `backend/src/services/ai.ts` to confirm current structure matches research notes.
2. Read `README.md` to identify exact insertion points for each diagram.
3. Insert system architecture flowchart (`graph LR`) at the top of `## Architecture`, before the directory structure. Shows: Browser → Frontend (React/Vite) → Backend (Express) → PostgreSQL/pgvector, Backend → Claude API, Backend → Voyage AI.
4. Insert ER diagram (`erDiagram`) after the `### Data Model` prose. Show all 6 tables (users, sessions, nodes, nodeReferences, conversations, conversationNodes) with relationships and key columns (PK, FK, embedding, referenceType, role, position). Keep concise — not every column.
5. Insert chat flow sequence diagram (`sequenceDiagram`) after `### Chat Flow` prose. Participants: User, Frontend, Backend, Voyage, pgvector, Claude. Show: send message → create user node → generate embedding → semantic search → format context → stream Claude response → save AI node → parse references → create edges → return metadata.
6. Insert auth flow sequence diagram (`sequenceDiagram`) as a new `### Auth Flow` subsection after `### Authentication`. Participants: Browser, Backend, Google. Show: redirect to Google → callback with code → exchange for tokens → fetch user info → upsert user → create session → set cookie → redirect.
7. Verify all 4 diagrams parse correctly with mermaid-cli. Confirm no existing prose was removed.

## Must-Haves

- [ ] 4 fenced ```mermaid blocks in README.md
- [ ] System architecture flowchart showing all major components and connections
- [ ] ER diagram with all 6 tables and their relationships
- [ ] Chat flow sequence diagram covering the full POST pipeline
- [ ] Auth flow sequence diagram covering OAuth + session creation
- [ ] No existing README prose removed or rewritten
- [ ] All diagrams parse without Mermaid syntax errors
- [ ] Diagram content matches actual source code (no invented endpoints or tables)

## Verification

- `npx --yes @mermaid-js/mermaid-cli mmdc -i README.md -o /dev/null` exits 0
- `grep -c '```mermaid' README.md` returns 4
- `git diff origin/main -- README.md` shows only additions (no deleted lines of existing prose)

## Observability Impact

No runtime observability changes — this task adds static documentation only.

- **New signal**: Mermaid syntax validation via `mmdc -i README.md` can be added to CI to catch diagram regressions
- **Inspection**: `grep -c '```mermaid' README.md` returns expected count (4)
- **Failure visibility**: Broken Mermaid syntax renders as raw code blocks on GitHub — visually obvious but not programmatically flagged without CI integration

## Inputs

- `backend/src/db/schema.ts` — table definitions, relationships, enums
- `backend/src/routes/chat.ts` — chat pipeline steps
- `backend/src/routes/auth.ts` — OAuth endpoints and flow
- `backend/src/services/ai.ts` — embedding and search service details
- `README.md` — current content and insertion points
- S01-RESEARCH.md findings on insertion points, syntax constraints, and pitfalls

## Expected Output

- `README.md` — updated with 4 Mermaid diagram blocks inserted into existing sections
