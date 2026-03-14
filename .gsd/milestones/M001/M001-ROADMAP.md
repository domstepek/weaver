# M001: Repository Documentation

**Vision:** Give Weaver a proper project foundation — GSD planning infrastructure for structured work, and repository documentation so anyone can understand and run the project without reading source code.

## Success Criteria

- `.gsd/` directory contains accurate, non-stub PROJECT.md, STATE.md, DECISIONS.md, REQUIREMENTS.md, and M001 artifacts
- README.md exists at repo root and accurately describes the project, setup, and dev workflow
- CLAUDE.md exists at repo root and is discoverable by Claude Code

## Key Risks / Unknowns

- None — straightforward documentation work

## Proof Strategy

(No risks to retire)

## Verification Classes

- Contract verification: files exist with accurate content, not stubs
- Integration verification: none
- Operational verification: none
- UAT / human verification: skim README for accuracy and completeness

## Milestone Definition of Done

This milestone is complete only when all are true:

- All GSD artifacts (PROJECT.md, STATE.md, DECISIONS.md, REQUIREMENTS.md, M001-CONTEXT.md, M001-ROADMAP.md) exist with real content
- README.md accurately describes project, architecture, prerequisites, setup, dev commands, and key concepts
- CLAUDE.md exists and Claude Code can discover it
- Content is derived from existing sources, not invented

## Requirement Coverage

- Covers: R001, R002, R003
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [x] **S01: GSD Project Scaffolding** `risk:low` `depends:[]`
  > After this: `.gsd/` directory is populated with PROJECT.md, STATE.md, DECISIONS.md, REQUIREMENTS.md, and M001 planning artifacts. `/gsd` can route to next work.

- [x] **S02: Repository Documentation** `risk:low` `depends:[S01]`
  > After this: README.md and CLAUDE.md exist at repo root. GitHub visitors can understand and set up the project.

## Boundary Map

### S01 → S02

Produces:
- `.gsd/PROJECT.md` — project description and current state (S02 references for consistency)
- `.gsd/REQUIREMENTS.md` — requirement contract (S02 validates R002, R003 against it)
- `.gsd/STATE.md` — active milestone/slice pointer

Consumes:
- nothing (first slice)

### S02

Produces:
- `README.md` — repository documentation
- `CLAUDE.md` — Claude Code discovery file

Consumes from S01:
- `.gsd/PROJECT.md` — ensures README is consistent with GSD project description
