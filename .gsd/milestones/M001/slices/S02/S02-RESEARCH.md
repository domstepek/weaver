# S02: Repository Documentation — Research

**Date:** 2026-03-14

## Summary

This slice produces two files: `README.md` and `CLAUDE.md` at repo root. All source material exists and is consistent — PROJECT.md (authoritative, corrected tech details), FEATURES.md, AGENTS.md (dev commands/setup), `.env.example`, `package.json`, and `docker-compose.yml`. The main decision is how to create CLAUDE.md given that AGENTS.md already contains the Claude Code content verbatim (headed `# CLAUDE.md`).

AGENTS.md has stale embedding info in 4 locations (says mock/1536-d, actual is Voyage AI `voyage-3.5-lite`/1024-d per PROJECT.md and FEATURES.md). README must source embedding/AI details from PROJECT.md and FEATURES.md, not AGENTS.md.

## Recommendation

**README.md**: Write a standalone README derived from PROJECT.md (project description, architecture, current state), AGENTS.md (dev commands, setup flow, API routes), FEATURES.md (feature summary), `.env.example` (env vars), and `docker-compose.yml` (prerequisites). Structure: project description → key concepts → tech stack → prerequisites → setup → dev commands → architecture overview → key technical details. Keep it concise — link to FEATURES.md and docs/ for deeper detail.

**CLAUDE.md**: Rename AGENTS.md → CLAUDE.md. Rationale:
- AGENTS.md is literally headed `# CLAUDE.md` and was written for Claude Code discovery
- Only one git commit touches AGENTS.md (`1e6131f add agent.md`)
- No runtime code references AGENTS.md — only GSD artifact notes mention it, which are informational not functional
- A symlink adds a layer of indirection for no benefit. A copy creates drift risk.
- Renaming is the simplest, cleanest approach. GSD artifact references to "AGENTS.md" become stale notes but don't break any tooling or automation.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Project description | `.gsd/PROJECT.md` | Authoritative, already corrected for actual tech stack |
| Feature inventory | `FEATURES.md` | Canonical feature list, maintained per feature doc requirement |
| Dev commands / setup | `AGENTS.md` lines 63–119 | Comprehensive, tested commands |
| Env var reference | `backend/.env.example` | Lists all required env vars with descriptions |

## Existing Code and Patterns

- `AGENTS.md` — Claude Code context file (headed `# CLAUDE.md`). Contains architecture, dev commands, setup, API routes, technical details. Has stale embedding info (mock/1536-d) in 4 places — do NOT propagate to README.
- `.gsd/PROJECT.md` — Authoritative project description with corrected tech details (Voyage AI, 1024-d). Use as primary source for project/architecture content.
- `FEATURES.md` — Feature inventory with change log. Reference from README, don't duplicate.
- `backend/.env.example` — 9 env vars: DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, SESSION_SECRET, FRONTEND_URL, ANTHROPIC_API_KEY, VOYAGE_API_KEY, PORT, NODE_ENV.
- `docker-compose.yml` — Single service: `pgvector/pgvector:pg16` on port 5432 with healthcheck.
- `docs/design-system-foundations.md` — Design system documentation, can be linked from README.

## Constraints

- README content must be derived from existing sources, not invented (per R002 notes)
- CLAUDE.md must work with Claude Code's file discovery convention (repo root, named `CLAUDE.md`)
- AGENTS.md stale embedding info (mock/1536-d) must not be propagated — use PROJECT.md values (Voyage AI `voyage-3.5-lite`, 1024-d)
- No `.nvmrc` or `.node-version` file exists — Node.js 20 is used via `nvm use 20` per AGENTS.md session setup

## Common Pitfalls

- **Propagating stale AGENTS.md embedding info** — AGENTS.md says "mock implementation" and "1536-dimensional" in 4 places. Actual implementation uses Voyage AI with 1024-d vectors. Source from PROJECT.md and FEATURES.md instead.
- **README/CLAUDE.md content divergence** — README describes the project for humans; CLAUDE.md provides agent context. Different audiences, different content. Don't try to make them the same file.
- **Over-documenting in README** — Project already has FEATURES.md, docs/design-system-foundations.md, and CLAUDE.md for deeper detail. README should be an on-ramp, not a reference manual.

## Open Risks

- Renaming AGENTS.md → CLAUDE.md will make some GSD artifact text references stale (informational only, no tooling breaks). Low impact — notes in REQUIREMENTS.md and M001-CONTEXT.md mention "AGENTS.md" but these are descriptive, not consumed by automation.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| (none needed) | — | Documentation-only slice, no special technology |

## Sources

- All information derived from existing repo files (AGENTS.md, PROJECT.md, FEATURES.md, .env.example, package.json, docker-compose.yml)
- S01 forward intelligence re: stale embedding info in AGENTS.md
