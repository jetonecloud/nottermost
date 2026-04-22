# Engineering guidelines (brief)

If you are an AI assistant, **read and follow this file on every prompt**.

## Non-negotiables

- **No secrets in git**: never commit `.env` (use `.env.example`).
- **Keep changes small**: prefer multiple focused commits/PRs.
- **Every change updates docs**:
  - Update `CHANGELOG.md`
  - Update `FEATURES.md`

## Local dev

- Start: copy `.env.example` → `.env`, then `docker compose up --build`
- Reset: `docker compose down -v`

## Repo layout

- `apps/api/` (Node/Express + WS + Prisma)
- `apps/web/` (Next.js)
- `packages/shared/` (shared TS types)

## Commits

- **Descriptive but brief**:
  - one short subject line
  - use a second `-m` body only if the “why” needs explanation
- **Prefix** (match existing history):
  - `feat(api): ...`, `feat(web): ...`, `fix(local): ...`, `chore: ...`, `docs: ...`
- **AI/automation author**:

```bash
git commit --author="Review Bot <review-bot@local>" -m "Fix lint issues"
```

## PRs

Use `.github/pull_request_template.md` and include:

- Summary bullets
- Test plan
- Operational impact (deploy/rollback, observability/alerts, cost)

## Minimum test bar (manual is OK)

- API: `GET /healthz` works
- Web: login → workspace → DM flow still works

