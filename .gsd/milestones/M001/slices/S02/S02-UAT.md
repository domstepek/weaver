# S02: Repository Documentation — UAT

**Milestone:** M001
**Written:** 2026-03-14

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice produces only static documentation files (README.md, CLAUDE.md). No runtime behavior, no UI changes, no API changes. Verification is file existence, content accuracy, and absence of stale information.

## Preconditions

- Repository checked out locally
- No services need to be running

## Smoke Test

Run `test -f README.md && test -f CLAUDE.md && ! test -f AGENTS.md && echo "PASS"` — confirms both target files exist and the old file is gone.

## Test Cases

### 1. README.md exists with required sections

1. Open `README.md` at repository root
2. Scan for section headings (`##`)
3. **Expected:** At least these sections are present: project description (top-level), Key Concepts, Tech Stack, Prerequisites, Setup, Development, Architecture, Key Technical Details

### 2. README.md content is accurate and source-derived

1. Read the Prerequisites section
2. **Expected:** Lists Node.js 20+, pnpm, Docker, Google OAuth credentials, Anthropic API key, Voyage AI API key
3. Read the Setup section
4. **Expected:** Steps include `pnpm install`, `docker compose up -d`, `cp backend/.env.example backend/.env`, and `pnpm db:migrate` — matching actual project workflow
5. Read the Tech Stack section
6. **Expected:** Mentions React, Vite, TailwindCSS, Express, Drizzle ORM, PostgreSQL, pgvector, XYFlow, Voyage AI — all real dependencies

### 3. README.md references correct embedding information

1. Search README.md for "Voyage" and "1024"
2. **Expected:** References Voyage AI `voyage-3.5-lite` with 1024 dimensions
3. Search README.md for "1536" or "mock"
4. **Expected:** Neither term appears (no stale info from old AGENTS.md)

### 4. CLAUDE.md exists with correct identity

1. Run `head -1 CLAUDE.md`
2. **Expected:** Output is `# CLAUDE.md`
3. Confirm CLAUDE.md contains project overview, architecture, and development commands sections
4. **Expected:** File is substantive (not a stub), contains guidance for Claude Code

### 5. AGENTS.md is gone

1. Run `test -f AGENTS.md`
2. **Expected:** File does not exist (exit code 1)
3. Run `git log --oneline --follow CLAUDE.md | head -5`
4. **Expected:** Git history shows the rename from AGENTS.md (history preserved)

### 6. No stale embedding references in CLAUDE.md

1. Run `grep -n "1536" CLAUDE.md`
2. **Expected:** No output (no stale dimension references)
3. Run `grep -niE "mock.*(embed|implementation)" CLAUDE.md`
4. **Expected:** No output (no stale mock references)
5. Run `grep "Voyage" CLAUDE.md`
6. **Expected:** At least one line referencing Voyage AI with correct model info

### 7. Requirements updated

1. Open `.gsd/REQUIREMENTS.md`
2. Find R002 and R003
3. **Expected:** Both appear under `## Validated` section with status `validated` and proof references pointing to S02/T01

## Edge Cases

### README.md links are valid

1. Check any relative links in README.md (e.g., links to FEATURES.md, CLAUDE.md)
2. **Expected:** Referenced files exist at the specified paths

### CLAUDE.md internal consistency

1. Search CLAUDE.md for any remaining references to "AGENTS.md"
2. **Expected:** No self-references to old filename

## Failure Signals

- `test -f AGENTS.md` succeeds — old file was not removed
- `grep -q "1536" CLAUDE.md` succeeds — stale dimension info survived
- `grep -qiE "mock.*(embed|implementation)" CLAUDE.md` succeeds — stale mock references survived
- `grep -c "^##" README.md` returns less than 6 — README is incomplete
- README.md contains invented information not traceable to PROJECT.md, FEATURES.md, .env.example, or package.json

## Requirements Proved By This UAT

- R002 — README.md exists with comprehensive, accurate, source-derived content (tests 1–3)
- R003 — CLAUDE.md exists at repo root, discoverable by Claude Code, with correct content (tests 4–6)

## Not Proven By This UAT

- Runtime behavior is unaffected — no API, UI, or database changes to verify
- README setup instructions are not executed end-to-end (would require clean environment)

## Notes for Tester

- This is pure documentation. Skim README.md for clarity and accuracy — does it make sense to someone who's never seen the project?
- Check that the dev commands in README match what `package.json` scripts actually provide.
- CLAUDE.md was renamed from AGENTS.md, so git history should show the rename if you check `git log --follow`.
