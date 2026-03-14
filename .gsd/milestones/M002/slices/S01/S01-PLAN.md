# S01: README Mermaid Diagrams

**Goal:** README.md contains 4 Mermaid diagrams (system architecture, ER, chat flow, auth flow) that accurately reflect the codebase.
**Demo:** Opening README.md on GitHub renders all 4 diagrams inline with no syntax errors.

## Must-Haves

- System architecture flowchart showing Frontend → Backend → PostgreSQL/pgvector, Backend → Claude API, Backend → Voyage AI
- Entity-relationship diagram showing all 6 tables with PK/FK relationships and key columns
- Chat flow sequence diagram showing the full POST `/api/chat` pipeline
- Auth flow sequence diagram showing Google OAuth with PKCE, session creation, and cookie flow
- All diagrams use valid GitHub-compatible Mermaid syntax (fenced ```mermaid blocks)
- Existing README prose and structure preserved — diagrams inserted alongside existing content
- Diagram content traceable to actual source files (schema.ts, chat.ts, auth.ts, ai.ts)

## Verification

- `npx --yes @mermaid-js/mermaid-cli mmdc -i README.md -o /dev/null` parses all Mermaid blocks without errors (or equivalent syntax check)
- Manual grep confirms 4 ` ```mermaid ` blocks exist in README.md
- Diff shows no existing prose lines were deleted

## Tasks

- [x] **T01: Add Mermaid diagrams to README** `est:30m`
  - Why: Delivers the entire slice — 4 diagrams covering architecture, data model, chat flow, and auth flow
  - Files: `README.md`, `backend/src/db/schema.ts`, `backend/src/routes/chat.ts`, `backend/src/routes/auth.ts`, `backend/src/services/ai.ts`
  - Do: Read source files for accuracy. Insert system architecture flowchart at top of `## Architecture`. Insert ER diagram after `### Data Model` prose. Insert chat flow sequence diagram after `### Chat Flow` prose. Insert auth flow sequence diagram as new `### Auth Flow` subsection near auth content. Use short aliases in sequence diagrams. Keep ER diagram to PK/FK/key fields only. Avoid parentheses in flowchart labels.
  - Verify: Install mermaid-cli and parse README. Confirm 4 mermaid blocks. Diff against main to confirm no prose deleted.
  - Done when: 4 valid Mermaid blocks in README.md, all parseable, no existing content removed

## Observability / Diagnostics

This slice is documentation-only (Mermaid diagrams in README.md). No runtime signals, services, or failure modes are introduced.

- **Verification surface**: `npx @mermaid-js/mermaid-cli mmdc` validates diagram syntax at CI/dev time
- **Inspection**: `grep -c '```mermaid' README.md` confirms expected block count (4)
- **Drift detection**: If source schema or flows change, diagrams become stale — no automated staleness check exists. Reviewers should compare diagrams against source files during PRs that touch schema.ts, chat.ts, or auth.ts.

## Files Likely Touched

- `README.md`
