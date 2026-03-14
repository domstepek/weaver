# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001 | convention | GSD methodology | Manual bootstrap via files on disk | Project is small, full GSD automation not needed yet | Yes — if project grows |
| D002 | M001/S02 | convention | AGENTS.md → CLAUDE.md | `git mv` rename, not symlink | Preserves git history, simpler than symlink, no cross-platform issues | No |
