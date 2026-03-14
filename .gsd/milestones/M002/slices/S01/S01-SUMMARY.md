---
id: S01
parent: M002
milestone: M002
provides:
  - 4 Mermaid diagrams in README.md (system architecture, ER, chat flow, auth flow)
requires: []
affects: []
key_files:
  - README.md
key_decisions:
  - Placed auth flow diagram as new ### Auth Flow subsection after ### API Routes (no existing ### Authentication heading)
  - Pinned mermaid-cli to 11.4.2 for validation (11.12.0 has broken CLI argument parsing)
patterns_established:
  - Mermaid diagram blocks inserted alongside existing prose sections, not replacing them
observability_surfaces:
  - "grep -c '```mermaid' README.md" returns 4 to confirm diagram count
  - "npx @mermaid-js/mermaid-cli@11.4.2 mmdc -i README.md -o /tmp/out.md" validates syntax
drill_down_paths:
  - .gsd/milestones/M002/slices/S01/tasks/T01-SUMMARY.md
duration: ~10m
verification_result: passed
completed_at: 2026-03-14
---

# S01: README Mermaid Diagrams

**Added 4 Mermaid diagrams to README.md — system architecture flowchart, entity-relationship diagram, chat flow sequence, and auth flow sequence — all derived from actual source code.**

## What Happened

Read schema.ts, chat.ts, auth.ts, and ai.ts to derive diagram content from real code. Inserted 4 Mermaid blocks into README.md at appropriate locations within the existing Architecture section:

1. **System architecture flowchart** (graph LR) at top of `## Architecture` — Browser → Frontend → Backend → PostgreSQL/pgvector, Backend → Claude API, Backend → Voyage AI.
2. **ER diagram** after `### Data Model` prose — all 6 tables (users, sessions, nodes, node_references, conversations, conversation_nodes) with PK/FK relationships and key columns.
3. **Chat flow sequence diagram** after `### Chat Flow` prose — full POST /api/chat pipeline from message receipt through embedding, semantic search, context formatting, Claude streaming, node saving, reference parsing, and edge creation.
4. **Auth flow sequence diagram** as new `### Auth Flow` subsection after `### API Routes` — Google OAuth with PKCE: redirect → consent → callback → token exchange → user info → upsert → session → cookie → redirect.

## Verification

- `grep -c '```mermaid' README.md` → **4** ✅
- `npx @mermaid-js/mermaid-cli@11.4.2 mmdc -i README.md -o /tmp/mermaid-out.md` → all 4 charts parsed, exit 0 ✅
- `git diff origin/main -- README.md | grep '^-[^-]' | wc -l` → **0** deleted lines ✅

## Requirements Validated

- R004 — All 4 diagrams present, valid Mermaid syntax confirmed by mermaid-cli, content traceable to source files, no existing README content removed.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- Auth flow diagram placed after `### API Routes` as new `### Auth Flow` subsection — plan referenced inserting after `### Authentication` which doesn't exist in README.
- Used mermaid-cli 11.4.2 instead of latest (11.12.0) due to upstream CLI bug.

## Known Limitations

- No automated staleness detection — if schema.ts, chat.ts, or auth.ts change significantly, diagrams may drift. Reviewers should compare diagrams against source files during relevant PRs.

## Follow-ups

- none

## Files Created/Modified

- `README.md` — Added 4 Mermaid diagram blocks (architecture flowchart, ER diagram, chat flow sequence, auth flow sequence)

## Forward Intelligence

### What the next slice should know
- README.md now has 4 mermaid blocks. Any future README edits should preserve them or update them if the underlying code changes.

### What's fragile
- Mermaid diagrams are static snapshots of code structure — they'll silently go stale if schema or flow logic changes.

### Authoritative diagnostics
- `npx @mermaid-js/mermaid-cli@11.4.2 mmdc -i README.md -o /tmp/out.md` — validates all Mermaid syntax in one command.

### What assumptions changed
- Assumed a `### Authentication` heading existed in README — it didn't. Created `### Auth Flow` instead.
