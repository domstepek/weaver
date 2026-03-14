# M001: Repository Documentation — Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

## Project Description

Weaver is an existing, functional knowledge graph chat app. This milestone adds no features — it creates the planning infrastructure (GSD) and repository documentation (README, CLAUDE.md) that the project currently lacks.

## Why This Milestone

The repo has no README.md and no GSD scaffolding. Anyone landing on this repo — including future-self in a new session — has to read AGENTS.md and source code to understand what it is. GSD scaffolding enables structured work tracking going forward.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Open the repo on GitHub and immediately understand what Weaver is, how to set it up, and how to run it
- Run `/gsd` in any session and get routed to the next planned work item
- Open the repo in Claude Code and have project context auto-loaded via CLAUDE.md

### Entry point / environment

- Entry point: GitHub repo page, local clone, Claude Code session
- Environment: local dev
- Live dependencies involved: none

## Completion Class

- Contract complete means: files exist with accurate, non-stub content
- Integration complete means: n/a — no runtime integration
- Operational complete means: n/a — documentation only

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- README.md exists and accurately describes setup, dev commands, and architecture
- CLAUDE.md exists and is discoverable by Claude Code
- `.gsd/` directory contains PROJECT.md, STATE.md, DECISIONS.md, REQUIREMENTS.md, and M001 artifacts

## Risks and Unknowns

- No significant risks — this is documentation and scaffolding work

## Existing Codebase / Prior Art

- `AGENTS.md` — Contains comprehensive project guidance, architecture docs, dev commands. Primary source for README content.
- `FEATURES.md` — Feature inventory. Secondary source for README.
- `backend/.env.example` — Environment variable reference for setup docs.
- `package.json` — Workspace scripts for dev commands section.
- `docker-compose.yml` — PostgreSQL + pgvector setup for prerequisites section.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001 — GSD scaffolding is the direct output of S01
- R002 — README.md is the direct output of S02
- R003 — CLAUDE.md is produced alongside README in S02

## Scope

### In Scope

- GSD directory structure and planning artifacts
- README.md with project description, architecture, setup, dev commands, key concepts
- CLAUDE.md for Claude Code discovery

### Out of Scope / Non-Goals

- Code changes to the application
- Feature additions or bug fixes
- Deployment documentation
- Contributing guidelines

## Technical Constraints

- README content must be derived from existing sources (AGENTS.md, FEATURES.md, .env.example), not invented
- CLAUDE.md must work with Claude Code's file discovery conventions

## Integration Points

- None — documentation only

## Open Questions

- Whether CLAUDE.md should be a symlink to AGENTS.md or a standalone file — decide during S02 execution
