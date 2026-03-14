# M002: README Mermaid Diagrams — Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

## Project Description

Weaver already has a comprehensive 15-section README. This milestone enriches it with Mermaid diagrams that visually explain the system's architecture, data model, chat flow, and auth flow — making the repo immediately understandable at a glance.

## Why This Milestone

The README currently uses an ASCII directory tree and prose descriptions. Visual diagrams communicate architecture and data relationships faster than text, especially for first-time visitors. GitHub renders Mermaid natively in markdown — no external tooling needed.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Open README.md on GitHub and see rendered diagrams showing system architecture, data model relationships, chat flow pipeline, and auth flow
- Understand the full architecture without reading source code

### Entry point / environment

- Entry point: GitHub repo page (README.md)
- Environment: GitHub web UI (Mermaid rendering)
- Live dependencies involved: none

## Completion Class

- Contract complete means: README contains valid Mermaid blocks that accurately reflect the codebase
- Integration complete means: n/a — documentation only
- Operational complete means: n/a — no runtime components

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- README.md contains Mermaid diagram blocks with valid syntax
- Diagrams accurately reflect the actual schema (`backend/src/db/schema.ts`), chat flow (`backend/src/routes/chat.ts`), auth flow (`backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts`), and system architecture
- Existing README content is preserved — diagrams supplement, not replace

## Risks and Unknowns

- No significant risks — straightforward documentation enrichment

## Existing Codebase / Prior Art

- `README.md` — Current 15-section README to be enriched with diagrams
- `backend/src/db/schema.ts` — Full schema with 6 tables, enums, relations, indexes — source of truth for ER diagram
- `backend/src/routes/chat.ts` — Chat endpoint with full message→embed→search→Claude→parse→edges pipeline — source of truth for sequence diagram
- `backend/src/routes/auth.ts` — Google OAuth flow
- `backend/src/middleware/auth.ts` — Session validation middleware

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R004 — This milestone directly satisfies the Mermaid diagrams requirement

## Scope

### In Scope

- System architecture diagram (frontend/backend/DB/AI services and how they connect)
- Entity-relationship diagram derived from `schema.ts` (6 tables, relationships, key columns)
- Chat flow sequence diagram derived from `chat.ts` (message→embed→search→context→Claude→parse→edges)
- Auth flow diagram derived from `auth.ts` and `auth` middleware

### Out of Scope / Non-Goals

- Code changes to the application
- External diagram hosting or image generation
- Diagrams for features not yet built

## Technical Constraints

- Must use GitHub-compatible Mermaid syntax (```mermaid code blocks)
- Diagrams must be readable at GitHub's default rendering size
- Content must be derived from actual source files, not invented

## Integration Points

- None — documentation only

## Open Questions

- None
