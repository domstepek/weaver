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

### R002 — Project README
- Class: launchability
- Status: active
- Description: Write a README.md at the repo root covering project description, architecture (monorepo, backend/frontend split), prerequisites, setup instructions, development commands, and key concepts (knowledge graph, nodes, embeddings, semantic search).
- Why it matters: Anyone encountering the repo (including future-self) can understand what it is and how to run it without reading source code.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: mapped
- Notes: Content should be derived from AGENTS.md, FEATURES.md, .env.example, and package.json — not invented.

### R003 — CLAUDE.md Exists
- Class: operability
- Status: active
- Description: Ensure a `CLAUDE.md` file exists at the repo root for Claude Code discovery. AGENTS.md already contains the content (headed `# CLAUDE.md`).
- Why it matters: Claude Code looks for CLAUDE.md by convention. Without it, project context may not be auto-loaded.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: mapped
- Notes: Likely a symlink from CLAUDE.md → AGENTS.md, or rename AGENTS.md to CLAUDE.md. Decide during execution.

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

## Deferred

(none)

## Out of Scope

(none)

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | operability | validated | M001/S01 | none | S01 verified — all six GSD files present and conformant |
| R002 | launchability | active | M001/S02 | none | mapped |
| R003 | operability | active | M001/S02 | none | mapped |

## Coverage Summary

- Active requirements: 2
- Mapped to slices: 2
- Validated: 1
- Unmapped active requirements: 0
