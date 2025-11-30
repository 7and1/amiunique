# Deployment Guide – AmiUnique.io

This document describes how to ship the monorepo to Cloudflare (Workers + Pages) using the same account that already hosts the WhatIsMyTimezone project. Follow each section in order and keep secrets **out of git history**.

## 1. Architecture Targets
- **API** → `apps/api` Cloudflare Worker (Hono) with a D1 binding named `amiunique-db`.
- **Frontend** → `apps/web` exported Next.js site deployed to Cloudflare Pages (`amiunique`).
- **Shared Library** → `packages/core`, bundled before either surface ships.

## 2. Prerequisites
1. Node.js ≥ 18.18 and pnpm 9 (run `corepack enable`).
2. Cloudflare account + API token with scopes: `Account · Workers Scripts:Edit`, `Account · D1:Edit`, `Account · Pages:Edit`, `Account · Pages:Deploy`.
3. D1 database provisioned in the Cloudflare dashboard. Run `wrangler d1 create amiunique-db` if it does not exist yet.
4. Optional: GitHub repository (public) with Actions enabled for the automatic workflow in `.github/workflows/deploy.yml`.

> **Tip:** The same Cloudflare credentials already live in `/Volumes/SSD/dev/project/timezone/whatismytimezone/.env.local`. Reuse that token/account pair, but never check the file into version control.

## 3. Secrets & Environment Variables
| Context | Variable | Purpose |
| --- | --- | --- |
| Worker | `CLOUDFLARE_API_TOKEN` | Grants wrangler deploy + D1 execution.
| Worker | `CLOUDFLARE_ACCOUNT_ID` | Required for wrangler + Pages CLI.
| Worker | `D1_DATABASE_ID` | UUID from `wrangler d1 list`; replace the placeholder in `apps/api/wrangler.toml`.
| Frontend | `NEXT_PUBLIC_API_URL` | Points the static site to your API (e.g., `https://api.amiunique.io`).
| GitHub Actions | same as above + any preview URLs via `Repository → Settings → Secrets and variables`.

For local development:
```bash
# apps/web/.env.local (gitignored)
NEXT_PUBLIC_API_URL=http://localhost:8787
```

For Worker-only secrets, prefer `apps/api/.dev.vars` so `wrangler dev` can source them. Use `wrangler secret put KEY` for anything sensitive at runtime.

## 4. Manual Deployment Steps

### 4.1 Install & Lint
```bash
pnpm install
pnpm lint
```

### 4.2 Prepare the Database
```bash
# Create once (outputs the database_id)
wrangler d1 create amiunique-db

# Update apps/api/wrangler.toml with the real database_id

# Apply schema/migrations remotely
pnpm db:migrate
# or explicitly
wrangler d1 execute amiunique-db --file=./apps/api/schema.sql
```

### 4.3 Deploy the Worker API
```bash
# Builds via Turbo and deploys to the production environment
pnpm deploy:api
```
This wraps `wrangler deploy --env production` inside the `@amiunique/api` package, so it will use the production bindings defined under `[env.production]` in `apps/api/wrangler.toml`.

### 4.4 Build & Deploy the Frontend
```bash
pnpm build            # Turbo builds packages + web app (writes ./apps/web/out)
pnpm deploy:web       # Runs wrangler pages deploy out --project-name=amiunique
```
Update the Pages project name or branch in `apps/web/package.json` if your Cloudflare Pages project differs.

### 4.5 Post-Deployment Checklist
- `https://api.amiunique.io/api/health` returns `status: "ok"` under 200 ms.
- `https://amiunique.io/scan` loads and invokes the analyzer without CORS errors.
- `request.cf` metadata appears in Worker logs (use `wrangler tail`).
- D1 tables (`visits`, `stats_cache`, `daily_stats`, `deletion_requests`) contain expected rows.

## 5. GitHub Actions Automation
The workflow in `.github/workflows/deploy.yml` runs on pull requests (tests only) and pushes to `main` (tests + deployment):
1. Checks out the repo, sets up pnpm/Node 20, and installs dependencies with a frozen lockfile.
2. Runs `pnpm lint` and `pnpm build` to ensure TypeScript + bundling succeed.
3. Applies the D1 schema via `pnpm db:migrate` (idempotent) using the production database.
4. Calls `pnpm deploy:api` and `pnpm deploy:web` when the event is a push to `main`.

### Required GitHub Secrets / Vars
| Name | Type | Notes |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret | Same token used locally.
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Find in Cloudflare dashboard.
| `NEXT_PUBLIC_API_URL` | Secret or Repository Variable | Public value pointing to the Worker URL.
| `TURBO_TOKEN` (optional) | Secret | Only if you enable remote caching.

Add them under **Repository → Settings → Secrets and variables → Actions**. The workflow never prints their values.

## 6. Rollback & Disaster Recovery
- **Worker:** redeploy the previous build via `wrangler deploy --name amiunique-api --env production --build-upload-source`. Wrangler keeps versions; `wrangler deployments list` identifies build IDs.
- **Pages:** Cloudflare Pages retains previous deployments. Use the Pages dashboard to promote a prior deployment if the latest is unhealthy.
- **Database:** because schema statements use `IF NOT EXISTS`, re-running `pnpm db:migrate` is safe. Maintain logical backups by exporting nightly via `wrangler d1 export amiunique-db > backup.sql`.

## 7. Monitoring & Alerts
- Enable [Workers Logs & Trace Events](https://developers.cloudflare.com/workers/platform/logging/) for runtime visibility.
- Configure analytics in the Cloudflare dashboard for Pages + Workers to track latency, error rates, and resource usage.
- Add status checks (e.g., UptimeRobot) hitting `/api/health` every minute.

Following this guide keeps the AmiUnique.io stack reproducible locally and in CI/CD while respecting the security posture established in the timezone project.

## 8. Wrangler v4 Rollout Plan
Cloudflare officially deprecates the v3 CLI, so the monorepo now pins `wrangler@^4.51.0` (see the root, `apps/api`, and `apps/web` `package.json`).

1. **Local verification** – run `pnpm install` and `pnpm --filter @amiunique/api wrangler --version` to confirm the workspace resolves to ≥4.51.0.
2. **CI alignment** – runners inherit the workspace devDependency, so no extra `npm install -g wrangler` steps are required. Remove any global installs in custom scripts.
3. **Smoke tests** – execute `pnpm deploy:api --dry-run` once to ensure there are no breaking changes in Deployments API semantics.
4. **Documentation** – any future contributor must follow the instructions in this section before enabling workflow deploys; wrangler v3 binaries should be purged from caches/toolchains.

With this upgrade path noted, we can safely flip on automated deploy jobs knowing the CLI version matches Cloudflare’s current recommendations.
