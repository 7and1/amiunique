# Project State

Current production-state summary. Keep this file short and factual.

## Current Truth

- Project: `amiunique`
- Platform: Cloudflare Pages + Workers
- Production URL: `https://amiunique.io`
- Custom domain: `amiunique.io`
- Deploy path: OpenClaw + Wrangler direct deployment; GitHub Actions is the preferred automated path
  after the account runner billing gate is cleared
- Smoke command: `PLAYWRIGHT_BASE_URL=https://amiunique.io PLAYWRIGHT_CHANNEL=chrome pnpm --filter @amiunique/web test:e2e`
- OpenClaw project: `oc-amiunique-9d723bfb`
- Last known good: production Worker, Pages, D1 privacy migration, IPBot, security headers, and 12/12
  Chrome acceptance passed on 2026-07-18
- Worker version: `8b98237b-047d-414f-ba90-3d342e6478e0`
- Pages deployment: `73ef358e-2c0c-4a0e-9572-b2a06946789d`
- Latest smoke artifact: `/Users/openclaw/artifacts/oc-amiunique-9d723bfb/20260718-111020`

## Known Warnings

- The static Next.js bootstrap currently requires `script-src 'unsafe-inline'`; all other script sources are restricted to self.
- GitHub-hosted runners are blocked before startup by an account billing/spending-limit gate; direct
  Cloudflare deployment is working.
- Production deployment and post-deploy browser acceptance are recorded in `ops/deploy-ledger.jsonl`.

## Status Rule

Authentication failure only means the current environment cannot run a new direct deploy. Confirm
historical state from this file, the deployment ledger, the public URL, and current executor
capability.
