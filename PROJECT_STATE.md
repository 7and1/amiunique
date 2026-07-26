# Project State

Current production-state summary. Keep this file short and factual.

## Current Truth

- Project: `amiunique`
- Platform: Cloudflare Pages + Workers
- Production URL: `https://amiunique.io`
- Custom domain: `amiunique.io`
- Source: public at `https://github.com/7and1/amiunique/`
- Deploy path: OpenClaw + Wrangler direct deployment; GitHub Actions is the preferred automated path
  after the account runner billing gate is cleared
- Smoke command: `PLAYWRIGHT_BASE_URL=https://amiunique.io PLAYWRIGHT_CHANNEL=chrome pnpm --filter @amiunique/web test:e2e`
- OpenClaw project: `oc-amiunique-9d723bfb`
- Last known good: production Worker and Pages with idempotent scan refresh handling, corrected
  hardware-observation labeling, healthy D1/IPBot bindings, and 12/12 Chrome acceptance passed on
  2026-07-20
- Worker version: `2b722ee8-61b3-47ef-8b2f-68395787035c`
- Pages deployment: `f7a9f0a4-5618-4869-8c6e-0bac061df40a`
- Latest smoke artifacts:
  - `/Users/openclaw/artifacts/oc-amiunique-9d723bfb/prod-f7a9f0a4`

## Known Warnings

- The static Next.js bootstrap currently requires `script-src 'unsafe-inline'`; all other script sources are restricted to self.
- GitHub-hosted runners are blocked before startup by an account billing/spending-limit gate; direct
  Cloudflare deployment is working.
- Full `pnpm test` currently has one unrelated deletion oversized-body assertion drift (expected
  413, received 400); the analyze and web suites pass.
- Production deployment and post-deploy browser acceptance are recorded in `ops/deploy-ledger.jsonl`.

## Status Rule

Authentication failure only means the current environment cannot run a new direct deploy. Confirm
historical state from this file, the deployment ledger, the public URL, and current executor
capability.
