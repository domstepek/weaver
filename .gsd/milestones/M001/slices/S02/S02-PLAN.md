# S02: Repository Documentation

**Goal:** README.md and CLAUDE.md exist at repo root with accurate, source-derived content.
**Demo:** GitHub visitors can read the README and understand what Weaver is, how to set it up, and how to run it. Claude Code discovers CLAUDE.md automatically.

## Must-Haves

- README.md covers project description, tech stack, prerequisites, setup, dev commands, architecture, and key concepts
- README.md content is derived from existing sources (PROJECT.md, FEATURES.md, .env.example, package.json, docker-compose.yml) — not invented
- README.md uses correct embedding info (Voyage AI `voyage-3.5-lite`, 1024-d) — not stale AGENTS.md values
- CLAUDE.md exists at repo root and is discoverable by Claude Code
- Stale embedding references in CLAUDE.md (4 occurrences of mock/1536-d) are corrected

## Verification

- `test -f README.md && test -f CLAUDE.md` — both files exist at repo root
- `head -1 CLAUDE.md` outputs `# CLAUDE.md` — confirms correct file content
- `! test -f AGENTS.md` — old file is gone (renamed, not copied)
- `! grep -q "1536" CLAUDE.md && ! grep -q "mock" CLAUDE.md` — stale embedding info removed
- README.md contains sections for: project description, tech stack, prerequisites, setup, dev commands, architecture
- `grep -q "Voyage" README.md` — correct embedding provider referenced
- `grep -n "1536\|mock.*embed" CLAUDE.md` returns no matches — diagnostic check for stale content survival

## Observability / Diagnostics

- **Inspection:** `head -1 CLAUDE.md` confirms file identity; `grep -c "^##" README.md` confirms section count; `grep "1536\|mock.*embed" CLAUDE.md` detects stale info.
- **Failure visibility:** If stale references survive, `grep -n "1536\|mock.*embed" CLAUDE.md` pinpoints lines. If README sections are missing, `grep "^##" README.md` shows what's present.
- **Validation state:** `grep -A1 "R00[23]" .gsd/REQUIREMENTS.md` shows requirement status inline.
- **No runtime services or secrets involved** — this slice is pure documentation.

## Tasks

- [x] **T01: Write README.md, rename AGENTS.md → CLAUDE.md, fix stale embedding info** `est:25m`
  - Why: Satisfies R002 (README) and R003 (CLAUDE.md exists) — the two requirements this slice owns
  - Files: `README.md`, `CLAUDE.md` (renamed from `AGENTS.md`), `.gsd/REQUIREMENTS.md`
  - Do: (1) `git mv AGENTS.md CLAUDE.md`. (2) Fix 4 stale embedding references in CLAUDE.md (lines 38, 39, 51, 182) — replace mock/1536-d with Voyage AI `voyage-3.5-lite`/1024-d per PROJECT.md. (3) Write README.md from PROJECT.md, FEATURES.md, .env.example, docker-compose.yml, package.json. Structure: project description → key concepts → tech stack → prerequisites → setup → dev commands → architecture → key technical details. Keep concise, link to FEATURES.md for detail. (4) Update REQUIREMENTS.md — move R002 and R003 to Validated with proof references.
  - Verify: Run verification commands from slice verification section — all must pass
  - Done when: Both files exist with accurate content, AGENTS.md is gone, no stale embedding info in either file, R002 and R003 validated

## Files Likely Touched

- `README.md` (new)
- `CLAUDE.md` (renamed from `AGENTS.md`, stale info fixed)
- `.gsd/REQUIREMENTS.md` (R002, R003 → validated)
