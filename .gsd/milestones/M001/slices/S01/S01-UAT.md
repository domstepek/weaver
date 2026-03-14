# S01: GSD Project Scaffolding — UAT

**Milestone:** M001
**Written:** 2026-03-14

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice produces static planning files — no runtime, no UI, no services. Verification is file existence, structural conformance, and content accuracy.

## Preconditions

- Repository checked out at the slice branch or main (after merge)
- Shell access to run `grep`, `cat`, `ls`

## Smoke Test

Run `ls .gsd/PROJECT.md .gsd/STATE.md .gsd/DECISIONS.md .gsd/REQUIREMENTS.md .gsd/milestones/M001/M001-CONTEXT.md .gsd/milestones/M001/M001-ROADMAP.md` — all six files listed, no "No such file" errors.

## Test Cases

### 1. All six GSD files exist

1. Run `ls -la` on each of the six paths: `.gsd/PROJECT.md`, `.gsd/STATE.md`, `.gsd/DECISIONS.md`, `.gsd/REQUIREMENTS.md`, `.gsd/milestones/M001/M001-CONTEXT.md`, `.gsd/milestones/M001/M001-ROADMAP.md`
2. **Expected:** All six files exist and are non-empty (size > 0 bytes)

### 2. STATE.md contains all nine template fields

1. Run `grep -c "Active Milestone\|Active Slice\|Active Task\|Phase\|Slice Branch\|Active Workspace\|Next Action\|Last Updated\|Requirements Status" .gsd/STATE.md`
2. **Expected:** Count is 9 (each field appears exactly once)

### 3. PROJECT.md tech stack matches codebase

1. Open `.gsd/PROJECT.md` and find the technology/stack section
2. Cross-reference key claims: embedding model (Voyage AI `voyage-3.5-lite`), embedding dimensions (1024), backend framework (Express 5), ORM (Drizzle), database (PostgreSQL + pgvector), frontend (React 18, Vite 6, TailwindCSS 3, XYFlow 12)
3. Verify against `backend/package.json` and `frontend/package.json`
4. **Expected:** All tech details in PROJECT.md match actual dependencies. No references to "mock" embeddings or "1536 dimensions."

### 4. REQUIREMENTS.md shows R001 validated with proof

1. Open `.gsd/REQUIREMENTS.md`
2. Find the R001 entry
3. **Expected:** R001 appears under `## Validated` section (not Active), Status field says `validated`, Proof field references S01 completion with specifics, traceability table row shows `R001 | operability | validated`

### 5. REQUIREMENTS.md coverage summary is accurate

1. Open `.gsd/REQUIREMENTS.md` and check the Coverage Summary section
2. Count requirements in each section: Active (R002, R003), Validated (R001)
3. **Expected:** Active requirements: 2, Mapped to slices: 2, Validated: 1, Unmapped active requirements: 0

### 6. M001-ROADMAP.md has slice definitions

1. Open `.gsd/milestones/M001/M001-ROADMAP.md`
2. Find the `## Slices` section
3. **Expected:** Contains S01 and S02 entries with risk levels and dependency annotations. S01 is marked `[x]` (done).

### 7. DECISIONS.md exists with correct structure

1. Open `.gsd/DECISIONS.md`
2. **Expected:** Has a `# Decisions` heading. May have no entries yet (no architectural decisions were made in S01), but the file structure is present and ready for future use.

## Edge Cases

### STATE.md field formatting

1. Run `grep "^\*\*Active Milestone:\*\*" .gsd/STATE.md`
2. **Expected:** Field uses bold markdown formatting (`**Field:**`). If formatting changes, grep-based verification scripts will fail — this is the expected format contract.

### Empty DECISIONS.md

1. Check that `.gsd/DECISIONS.md` exists and has the heading structure even though no decisions were recorded in S01
2. **Expected:** File is not empty. Contains at minimum a heading and placeholder indicating no decisions yet.

## Failure Signals

- Any of the six files missing or empty (0 bytes)
- STATE.md missing any of the nine template fields
- REQUIREMENTS.md showing R001 still under Active instead of Validated
- PROJECT.md containing "mock" or "1536" for embedding details
- Coverage summary counts not matching actual requirement counts

## Requirements Proved By This UAT

- R001 (GSD Project Scaffolding) — tests 1-7 collectively prove all six files exist with template-conformant structure, accurate content, and proper requirement tracking

## Not Proven By This UAT

- R002 (Project README) — README.md creation is S02 scope
- R003 (CLAUDE.md Exists) — CLAUDE.md creation is S02 scope
- Runtime behavior — this slice produces static files only

## Notes for Tester

- AGENTS.md at repo root still contains stale info about embeddings ("mock implementation", "1536 dimensions"). This is a known issue but out of scope for M001. Don't flag it as a failure of this slice.
- The verification is intentionally grep-based. If STATE.md field formatting changes (e.g., bold markers removed), tests will need updating.
