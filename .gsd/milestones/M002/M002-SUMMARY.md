---
id: M002
provides:
  - 4 Mermaid diagrams in README.md (system architecture flowchart, ER diagram, chat flow sequence, auth flow sequence)
key_decisions:
  - Auth flow diagram placed as new ### Auth Flow subsection after ### API Routes (no pre-existing ### Authentication heading)
  - Pinned mermaid-cli to 11.4.2 for validation (11.12.0 has broken CLI argument parsing)
patterns_established:
  - Mermaid diagram blocks inserted alongside existing prose — diagrams supplement, never replace
observability_surfaces:
  - "grep -c '```mermaid' README.md" returns 4 to confirm diagram count
  - "npx @mermaid-js/mermaid-cli@11.4.2 mmdc -i README.md -o /tmp/out.md" validates syntax
requirement_outcomes:
  - id: R004
    from_status: active
    to_status: validated
    proof: "4 Mermaid blocks in README.md — architecture (graph LR), ER (erDiagram), chat flow (sequenceDiagram), auth flow (sequenceDiagram). All parse via mermaid-cli 11.4.2 exit 0. Zero existing prose lines deleted. Content derived from schema.ts, chat.ts, auth.ts, ai.ts."
duration: ~15m
verification_result: passed
completed_at: 2026-03-14
---

# M002: README Mermaid Diagrams

**Added 4 Mermaid diagrams to README.md — system architecture, entity-relationship, chat flow sequence, and auth flow sequence — all derived from actual source code, supplementing existing prose.**

## What Happened

Single-slice milestone. Read the four source-of-truth files (schema.ts, chat.ts, auth.ts, ai.ts) and inserted Mermaid diagram blocks at appropriate locations within the existing Architecture section of README.md:

1. **System architecture flowchart** (graph LR) at top of `## Architecture` — shows Browser → Frontend → Backend → PostgreSQL/pgvector, Backend → Claude API, Backend → Voyage AI.
2. **ER diagram** after `### Data Model` prose — all 6 tables (users, sessions, nodes, node_references, conversations, conversation_nodes) with PK/FK relationships and key columns.
3. **Chat flow sequence diagram** after `### Chat Flow` prose — full POST /api/chat pipeline from message receipt through embedding, semantic search, context formatting, Claude streaming, node saving, reference parsing, and edge creation.
4. **Auth flow sequence diagram** as new `### Auth Flow` subsection after `### API Routes` — Google OAuth with PKCE: redirect → consent → callback → token exchange → user info → upsert → session → cookie → redirect.

No existing README content was removed or modified. All original headings and prose remain intact.

## Cross-Slice Verification

Single slice — no cross-slice integration needed. Success criteria verified:

| Criterion | Evidence |
|---|---|
| README.md contains at least 3 Mermaid diagrams | `grep -c '```mermaid' README.md` → **4** ✅ |
| All diagrams use valid GitHub-compatible Mermaid syntax | mermaid-cli 11.4.2 parses all 4 blocks, exit 0 ✅ |
| Diagram content accurately reflects codebase | Content derived from schema.ts, chat.ts, auth.ts, ai.ts — verified during S01 ✅ |
| Existing README prose and structure preserved | `git diff origin/main -- README.md | grep '^-[^-]' | wc -l` → 0 deleted lines; all original `##`/`###` headings confirmed present ✅ |

## Requirement Changes

- R004: active → validated — 4 Mermaid blocks present with valid syntax (mermaid-cli confirms), content traceable to source files, zero existing prose removed.

## Forward Intelligence

### What the next milestone should know
- README.md now contains 4 mermaid blocks. Any future README edits should preserve or update them if underlying code changes.
- GitHub renders Mermaid natively — no build step or image hosting needed.

### What's fragile
- Mermaid diagrams are static snapshots of code structure — they'll silently go stale if schema.ts, chat.ts, or auth.ts change significantly. No automated staleness detection exists.

### Authoritative diagnostics
- `npx @mermaid-js/mermaid-cli@11.4.2 mmdc -i README.md -o /tmp/out.md` — validates all Mermaid syntax in one command. Pin to 11.4.2; 11.12.0 has a broken CLI.

### What assumptions changed
- Assumed a `### Authentication` heading existed in README — it didn't. Created `### Auth Flow` instead.

## Files Created/Modified

- `README.md` — Added 4 Mermaid diagram blocks (architecture flowchart, ER diagram, chat flow sequence, auth flow sequence)
