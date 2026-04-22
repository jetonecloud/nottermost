# Engineering guidelines (read this first)

This file is the **single source of truth** for how to work in this repository.

If you are an AI assistant, **read and follow this file on every prompt** before making changes.

## North stars

- **Keep the repo mergeable**: small PRs, clear descriptions, reversible changes.
- **Prefer documented trade-offs over complexity**: cost/latency/durability/ops.
- **No secrets in git**: `.env` stays local; use `.env.example` for defaults.

## Local development (expected workflow)

- Start stack:
  - Copy `.env.example` → `.env`
  - `docker compose up --build`
- Stop + reset (including volumes):
  - `docker compose down -v`

## Repo structure

- `apps/api/`: Node/Express API + WebSocket server + Prisma schema
- `apps/web/`: Next.js frontend
- `packages/shared/`: shared TypeScript types

## Branching & PRs

- **Default**: work on a feature branch, open a PR, use `.github/pull_request_template.md`.
- **PR must include**:
  - Summary (1–3 bullets)
  - Test plan (even if manual)
  - Operational impact (deploy/rollback, observability/alerts, cost)

## Commits (style + required author)

### Commit message style

Use short, consistent prefixes (match existing history):

- `feat(api): ...`
- `feat(web): ...`
- `fix(local): ...`
- `chore: ...`
- `docs: ...`

Add a second paragraph (commit body) when the “why” isn’t obvious.

### Required commit author (for AI / automation)

When committing changes produced by AI or automation, use this author:

```bash
git commit --author="Review Bot <review-bot@local>" -m "Fix lint issues"
```

If a commit needs a body, use two `-m` flags:

```bash
git commit --author="Review Bot <review-bot@local>" -m "feat(api): add X" -m "Why this change exists."
```

### Commit hygiene

- **Do not** commit `.env` or any secrets.
- Prefer multiple focused commits over one large commit.
- Run quick verification (see **Test expectations**) before committing when feasible.

## Test expectations

Minimum bar for any change:

- **API changes**: `GET /healthz` still returns `{"ok":true}` and core endpoints still function.
- **Web changes**: pages render and key flows still work (login → workspace → DM).
- If you add a bug fix, include a repro + a check that proves it’s fixed (manual is OK for now).

## Code & design rules

- **API**:
  - Validate inputs (Zod).
  - Keep auth checks explicit.
  - Keep pagination stable and deterministic.
  - Prefer clear error codes (`{ "error": "..." }`) over ambiguous messages.
- **Web**:
  - Keep pages simple and resilient; handle missing token/session clearly.
  - Avoid heavy abstractions until needed.
- **Shared**:
  - Put request/response/WS payload types in `packages/shared` when they cross boundaries.

## Operational discipline

- Any meaningful behavior change should be reflected in at least one of:
  - `README.md` (developer UX / how to run / key flows)
  - `FEATURES.md` (feature done/not done status)
  - `CHANGELOG.md` (notable changes)

## When in doubt

- Prefer the smallest change that moves the product forward.
- Write down assumptions in the PR summary if the code can’t.

