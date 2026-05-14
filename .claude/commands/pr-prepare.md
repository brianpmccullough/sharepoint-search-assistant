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

## Step 3 - Git Preparation

- Ensure a branch is created in the format: [fix|feature]/[userinitials]/[short-summary-of-changes], e.g. feat/bpm/add-authentication
- Commit / Stash changes locally to the branch with a short (less than 50 characters) summary in the commit message.  Prefix the commit message with [fix|feat]: as appropriate.
- Push the changes to remote branch (create if doesn't exist).

## Step 4 — Summary

If everything passes, confirm the branch is ready to submit for review. If anything failed in either step, summarise all issues and clearly state the PR is NOT ready.

## Step 5 - Create PR

Ask the user if they want to create the PR.  If so, create the PR.  Use an brief summary for PR title (less than 50 characters).  Create bulleted list of changes and reference any work items if known (if not known, it's ok)
