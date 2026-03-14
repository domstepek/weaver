# S01: README Mermaid Diagrams — UAT

**Milestone:** M002
**Written:** 2026-03-14

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice produces only static Mermaid diagram blocks in README.md — no runtime behavior, no services, no UI changes. Validation is syntax parsing and content accuracy checks against source files.

## Preconditions

- Repository checked out with the S01 changes applied
- Node.js available (for npx mermaid-cli)
- Internet access (for npx to fetch mermaid-cli if not cached)

## Smoke Test

Run `grep -c '```mermaid' README.md` — should return `4`.

## Test Cases

### 1. Mermaid block count

1. Run `grep -c '```mermaid' README.md`
2. **Expected:** Output is `4`

### 2. Mermaid syntax validity

1. Run `npx --yes @mermaid-js/mermaid-cli@11.4.2 mmdc -i README.md -o /tmp/mermaid-uat.md`
2. **Expected:** Output shows "Found 4 mermaid charts" and 4 ✅ lines. Exit code 0.

### 3. No existing prose deleted

1. Run `git diff origin/main -- README.md | grep '^-[^-]' | wc -l`
2. **Expected:** Output is `0` — no lines removed from original README content.

### 4. System architecture diagram accuracy

1. Open README.md and find the first ````mermaid` block (should be a `graph LR` flowchart under `## Architecture`)
2. Confirm it shows: Browser → Frontend (React/Vite) → Backend (Express) → PostgreSQL with pgvector
3. Confirm it shows: Backend → Claude API and Backend → Voyage AI
4. **Expected:** All components match the actual monorepo structure (frontend/, backend/, docker-compose.yml PostgreSQL, .env references to Anthropic and Voyage AI)

### 5. ER diagram accuracy

1. Find the `erDiagram` block (should be after `### Data Model` prose)
2. Confirm all 6 tables are present: users, sessions, nodes, node_references, conversations, conversation_nodes
3. Cross-reference with `backend/src/db/schema.ts` — confirm PK/FK columns and relationship lines match the actual Drizzle schema
4. **Expected:** Table names, key columns, and relationships match schema.ts. No invented tables or columns.

### 6. Chat flow sequence diagram accuracy

1. Find the sequence diagram after `### Chat Flow` prose
2. Cross-reference with `backend/src/routes/chat.ts` and `backend/src/services/ai.ts`
3. Confirm the flow covers: receive message → generate embedding → semantic search → format context → call Claude (streaming) → save AI node → parse references → create edges
4. **Expected:** Sequence steps match the actual code flow in chat.ts and ai.ts. No invented steps.

### 7. Auth flow sequence diagram accuracy

1. Find the sequence diagram under `### Auth Flow` (should be after `### API Routes`)
2. Cross-reference with `backend/src/routes/auth.ts`
3. Confirm the flow covers: redirect to Google with PKCE → user consent → callback → token exchange → fetch user info → upsert user → create session → set cookie → redirect
4. **Expected:** Sequence steps match the actual auth.ts route handlers. PKCE flow elements present.

### 8. GitHub rendering check

1. Push the branch to GitHub (or view in a Mermaid-compatible renderer)
2. Open README.md in the GitHub web UI
3. **Expected:** All 4 diagrams render as visual diagrams, not raw code blocks. No syntax error banners.

## Edge Cases

### Mermaid block isolation

1. Run `grep -n '```mermaid' README.md` and `grep -n '```$' README.md` (or equivalent to find closing fences)
2. Confirm each opening ` ```mermaid ` has a matching closing ` ``` ` and blocks don't overlap or nest
3. **Expected:** Exactly 4 opening fences, each with a corresponding closing fence. No unclosed blocks.

### No special characters breaking GitHub rendering

1. Inspect each Mermaid block for characters known to break GitHub rendering: unescaped parentheses in flowchart labels, HTML entities, ampersands
2. **Expected:** No parentheses in flowchart node labels. Sequence diagram labels use short aliases without special characters.

## Failure Signals

- `grep -c '```mermaid' README.md` returns anything other than 4
- mermaid-cli exits with non-zero status or reports parse errors
- `git diff` shows deleted lines from original README
- GitHub renders any diagram as a raw code block instead of a visual diagram
- Diagram shows tables, components, or flow steps that don't exist in the actual source code

## Requirements Proved By This UAT

- R004 — README Mermaid Diagrams: Tests 1-7 prove all 4 diagrams exist, parse correctly, and accurately reflect source code. Test 3 proves existing content is preserved.

## Not Proven By This UAT

- Long-term diagram staleness — no automated check exists to detect when source code drifts from diagrams
- Rendering on non-GitHub Mermaid viewers (only GitHub rendering is in scope)

## Notes for Tester

- Use mermaid-cli **11.4.2** specifically — version 11.12.0 has a CLI argument parsing bug that causes false failures.
- Test case 8 (GitHub rendering) requires the branch to be pushed. All other tests run locally.
- The ER diagram uses Mermaid's erDiagram syntax which renders differently from flowcharts — relationships appear as lines between entity boxes, not arrows.
