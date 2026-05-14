Run the full pre-PR check suite and assess pending changes against AGENTS.md conventions.

## Step 1 — AGENTS.md Compliance Review

Read AGENTS.md and review all pending changes (staged and unstaged) using `git diff HEAD`. Assess the changes against every section of AGENTS.md:

- Coding conventions (naming, no `any`, no barrel files, Swagger decorators, model validation, comments)
- Patterns (SOLID, DRY, established patterns only)
- Do Not rules (token logging, lightweight controllers, no inline rule disables, etc.)
- Open issues (check if any new deferred items should be logged in `docs/build/open-issues.md`)

Report any violations clearly. If violations are found, alert the user and advise them to resolve before proceeding. If clean, confirm compliance and continue.

## Step 2 — Automated Check Suite

Run each step in order. If any step produces errors or warnings, stop immediately and report:
- Which step failed
- The exact error/warning output
- A clear message that the PR is NOT ready to proceed

1. `npm run typecheck` — TypeScript type checking
2. `npm run format` — Prettier (auto-fixes; if files are modified, warn the user to review the changes)
3. `npm run lint` — ESLint (auto-fixes; same warning as format if files are modified)
4. `npm test` — Unit tests
5. `npm run test:e2e` — End-to-end tests
6. `npm run build` — Production build

## Step 3 — Summary

If everything passes, confirm the branch is ready to submit for review. If anything failed in either step, summarise all issues and clearly state the PR is NOT ready.
