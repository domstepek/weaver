---
estimated_steps: 5
estimated_files: 3
---

# T01: Write README.md, rename AGENTS.md → CLAUDE.md, fix stale embedding info

**Slice:** S02 — Repository Documentation
**Milestone:** M001

## Description

Produce the two repository documentation files that satisfy R002 and R003. Rename AGENTS.md to CLAUDE.md (it's already headed `# CLAUDE.md` and was written for Claude Code), fix its 4 stale embedding references, write a new README.md from existing project sources, and validate both requirements.

## Steps

1. `git mv AGENTS.md CLAUDE.md` — rename, preserving git history
2. Fix 4 stale embedding references in CLAUDE.md:
   - Line 38: `1536-dimensional vectors (currently mock implementation...)` → `1024-dimensional vectors (Voyage AI voyage-3.5-lite)`
   - Line 39: `**Note**: Production should replace mock embeddings...` → remove or update to reflect current Voyage AI implementation
   - Line 51: `Embedding generation (mock - needs real implementation)` → `Embedding generation via Voyage AI (voyage-3.5-lite, 1024-d)`
   - Line 182: `The embedding implementation is currently a **deterministic mock**...` → `Embeddings use Voyage AI's voyage-3.5-lite model (1024 dimensions)`
3. Write README.md sourcing content from:
   - `.gsd/PROJECT.md` — project description, architecture, current state
   - `FEATURES.md` — feature summary (link, don't duplicate)
   - `CLAUDE.md` (post-fix) — dev commands, setup instructions, API routes
   - `backend/.env.example` — env var documentation
   - `docker-compose.yml` — prerequisites (PostgreSQL + pgvector)
   - `package.json` — workspace scripts
   Structure: project description → key concepts → tech stack → prerequisites → setup → development commands → architecture overview → key technical details → links to further docs
4. Run verification commands to confirm both files are correct
5. Update `.gsd/REQUIREMENTS.md` — move R002 and R003 from Active to Validated with proof references

## Must-Haves

- [ ] CLAUDE.md exists at repo root, headed `# CLAUDE.md`
- [ ] AGENTS.md no longer exists (renamed, not copied)
- [ ] All 4 stale embedding references in CLAUDE.md corrected to Voyage AI/1024-d
- [ ] README.md exists with sections: project description, key concepts, tech stack, prerequisites, setup, dev commands, architecture, key technical details
- [ ] README.md content derived from existing sources, uses correct embedding info
- [ ] R002 and R003 marked validated in REQUIREMENTS.md

## Verification

- `test -f README.md && test -f CLAUDE.md && ! test -f AGENTS.md` — file existence
- `head -1 CLAUDE.md | grep -q "# CLAUDE.md"` — correct heading
- `! grep -q "1536" CLAUDE.md` — no stale dimension references
- `! grep -qiE "mock.*(embed|implementation)" CLAUDE.md` — no stale mock references
- `grep -q "Voyage" README.md` — correct embedding provider
- `grep -c "^##" README.md` returns ≥6 — has enough sections
- `grep -q "validated" .gsd/REQUIREMENTS.md | grep -c "R00[23]"` — both requirements validated

## Inputs

- `.gsd/PROJECT.md` — authoritative project description with corrected tech details
- `AGENTS.md` — current Claude Code context file (to be renamed)
- `FEATURES.md` — canonical feature inventory
- `backend/.env.example` — env var reference
- `docker-compose.yml` — infrastructure prerequisites
- `package.json` — workspace scripts and dependencies
- S01 forward intelligence: AGENTS.md has stale embedding info at lines 38, 39, 51, 182

## Expected Output

- `README.md` — complete repository documentation for GitHub visitors
- `CLAUDE.md` — renamed and corrected Claude Code context file
- `.gsd/REQUIREMENTS.md` — R002 and R003 moved to Validated

## Observability Impact

- **Signals changed:** None — this task produces static documentation files, no runtime behavior.
- **Inspection:** `head -1 CLAUDE.md` for identity; `grep -c "^##" README.md` for section count; `grep "1536\|mock.*embed" CLAUDE.md` for stale reference detection.
- **Failure state:** If stale references survive the fix, `grep -n "1536\|mock.*embed" CLAUDE.md` pinpoints remaining lines. Missing README sections visible via `grep "^##" README.md`.
