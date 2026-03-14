# Requirements

This file is the explicit capability and coverage contract for the project.

Use it to track what is actively in scope, what has been validated by completed work, what is intentionally deferred, and what is explicitly out of scope.

Guidelines:
- Keep requirements capability-oriented, not a giant feature wishlist.
- Requirements should be atomic, testable, and stated in plain language.
- Every **Active** requirement should be mapped to a slice, deferred, blocked with reason, or moved out of scope.
- Each requirement should have one accountable primary owner and may have supporting slices.
- Research may suggest requirements, but research does not silently make them binding.
- Validation means the requirement was actually proven by completed work and verification, not just discussed.

## Active

(none)

## Validated

### R001 — GSD Project Scaffolding
- Class: operability
- Status: validated
- Description: Initialize `.gsd/` directory with PROJECT.md, STATE.md, DECISIONS.md, REQUIREMENTS.md, and M001 context + roadmap reflecting the current state of the Weaver project.
- Why it matters: Enables structured planning and execution tracking for all future work on Weaver.
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: validated
- Proof: S01 completion — all six GSD files verified present with non-empty, template-conformant content; STATE.md has all template fields; PROJECT.md tech details confirmed against codebase.
- Notes: This requirement is self-referential — completing S01 satisfies it.

### R002 — Project README
- Class: launchability
- Status: validated
- Description: Write a README.md at the repo root covering project description, architecture (monorepo, backend/frontend split), prerequisites, setup instructions, development commands, and key concepts (knowledge graph, nodes, embeddings, semantic search).
- Why it matters: Anyone encountering the repo (including future-self) can understand what it is and how to run it without reading source code.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: validated
- Proof: S02/T01 — README.md exists with 15 `##` sections covering project description, key concepts, tech stack, prerequisites, setup, dev commands, architecture, API routes, key technical details, and links to further docs. Content derived from PROJECT.md, FEATURES.md, .env.example, docker-compose.yml, package.json.
- Notes: Content sourced from existing project artifacts; Voyage AI embedding info confirmed correct.

### R003 — CLAUDE.md Exists
- Class: operability
- Status: validated
- Description: Ensure a `CLAUDE.md` file exists at the repo root for Claude Code discovery.
- Why it matters: Claude Code looks for CLAUDE.md by convention. Without it, project context may not be auto-loaded.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: validated
- Proof: S02/T01 — AGENTS.md renamed to CLAUDE.md via `git mv`. Heading confirmed `# CLAUDE.md`. Four stale embedding references (1536-d, mock) corrected to Voyage AI `voyage-3.5-lite` 1024-d.
- Notes: Rename chosen over symlink for simplicity and git history preservation.

## Deferred

(none)

## Out of Scope

(none)

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | operability | validated | M001/S01 | none | S01 verified — all six GSD files present and conformant |
| R002 | launchability | validated | M001/S02 | none | README.md exists with 15 sections, content derived from project sources |
| R003 | operability | validated | M001/S02 | none | AGENTS.md → CLAUDE.md, stale embedding refs fixed |

## Coverage Summary

- Active requirements: 0
- Mapped to slices: 0
- Validated: 3
- Unmapped active requirements: 0
