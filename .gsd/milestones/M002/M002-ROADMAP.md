# M002: README Mermaid Diagrams

**Vision:** Enrich the existing README with Mermaid diagrams that visually explain system architecture, data model, chat flow, and auth flow — making the repo's design immediately understandable at a glance.

## Success Criteria

- README.md contains at least 3 Mermaid diagrams (architecture, ER, chat flow)
- All diagrams use valid GitHub-compatible Mermaid syntax
- Diagram content accurately reflects the actual codebase (schema.ts, chat.ts, auth.ts)
- Existing README prose and structure is preserved — diagrams supplement, not replace

## Key Risks / Unknowns

- None — straightforward documentation work

## Proof Strategy

(No risks to retire)

## Verification Classes

- Contract verification: Mermaid syntax validity, diagram accuracy against source files
- Integration verification: none
- Operational verification: none
- UAT / human verification: visual skim of diagrams for readability and accuracy

## Milestone Definition of Done

This milestone is complete only when all are true:

- README.md contains Mermaid diagrams for system architecture, data model (ER), and chat flow
- All Mermaid blocks parse without syntax errors
- Diagram content is traceable to actual source files (schema.ts, chat.ts, auth.ts)
- Existing README sections are preserved intact
- Content is derived from code, not invented

## Requirement Coverage

- Covers: R004
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [x] **S01: README Mermaid Diagrams** `risk:low` `depends:[]`
  > After this: README.md renders 3-4 Mermaid diagrams on GitHub showing system architecture, entity relationships, chat flow sequence, and auth flow.

## Boundary Map

### S01

Produces:
- Updated `README.md` with Mermaid diagram blocks inserted into existing sections

Consumes:
- nothing (single slice milestone)
