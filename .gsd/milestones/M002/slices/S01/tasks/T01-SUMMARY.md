---
id: T01
parent: S01
milestone: M002
provides:
  - 4 Mermaid diagrams in README.md (architecture, ER, chat flow, auth flow)
key_files:
  - README.md
key_decisions:
  - Placed auth flow diagram as new ### Auth Flow subsection after ### API Routes (no existing ### Authentication heading existed)
  - Used mermaid-cli 11.4.2 for validation (11.12.0 has a CLI argument parsing bug)
patterns_established:
  - Mermaid diagram blocks inserted alongside existing prose sections, not replacing them
observability_surfaces:
  - "grep -c '```mermaid' README.md" returns 4 to confirm diagram count
  - "npx @mermaid-js/mermaid-cli@11.4.2 mmdc -i README.md -o /tmp/out.md" validates syntax
duration: ~10m
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---

# T01: Add Mermaid diagrams to README

**Added 4 Mermaid diagrams to README.md: system architecture flowchart, ER diagram (6 tables), chat flow sequence diagram, and auth flow sequence diagram — all derived from actual source code.**

## What Happened

Read all 4 source files (schema.ts, chat.ts, auth.ts, ai.ts) to confirm current structure. Identified insertion points in README.md and inserted:

1. **System architecture flowchart** (`graph LR`) — at top of `## Architecture`, before directory tree. Shows Browser → Frontend → Backend → PostgreSQL/pgvector, Backend → Claude API, Backend → Voyage AI.
2. **ER diagram** (`erDiagram`) — after `### Data Model` prose. All 6 tables (users, sessions, nodes, node_references, conversations, conversation_nodes) with PK/FK/key columns and relationship lines.
3. **Chat flow sequence diagram** — after `### Chat Flow` prose. Full POST /api/chat pipeline: message → embedding → semantic search → context formatting → Claude streaming → save AI node → parse references → create edges → done event.
4. **Auth flow sequence diagram** — new `### Auth Flow` subsection after `### API Routes`. Google OAuth with PKCE: redirect → consent → callback → token exchange → user info → upsert → session → cookie → redirect.

## Verification

- `grep -c '```mermaid' README.md` → **4** ✅
- `npx @mermaid-js/mermaid-cli@11.4.2 mmdc -i README.md -o /tmp/mermaid-out.md` → all 4 charts parsed, exit 0 ✅
- `git diff origin/main -- README.md | grep '^-[^-]' | wc -l` → **0** deleted lines ✅

All slice-level verification checks pass. This is the only task in S01, so slice is complete.

## Diagnostics

No runtime diagnostics — this is static documentation. Broken Mermaid syntax renders as raw code blocks on GitHub (visually obvious). Use `npx @mermaid-js/mermaid-cli@11.4.2 mmdc -i README.md -o /tmp/out.md` to validate locally.

## Deviations

- Plan step 6 references inserting after `### Authentication` — no such heading exists. Placed as new `### Auth Flow` subsection after `### API Routes` instead, keeping it within the Architecture section.
- Used mermaid-cli 11.4.2 instead of latest (11.12.0) due to a CLI argument parsing bug in the latest version. Syntax validation is equivalent.

## Known Issues

- mermaid-cli 11.12.0 has a broken CLI (`error: too many arguments`). Pin to 11.4.2 for validation until upstream fixes it.

## Files Created/Modified

- `README.md` — Added 4 Mermaid diagram blocks (architecture flowchart, ER diagram, chat flow sequence, auth flow sequence)
