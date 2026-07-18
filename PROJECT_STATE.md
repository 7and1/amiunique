# Project State

Current production-state summary. Keep this file short and factual.

## Current Truth

- Project: `amiunique`
- Platform: Cloudflare Pages + Workers
- Production URL: `https://amiunique.io`
- Custom domain: `amiunique.io`
- Deploy path: GitHub Actions workflow `Deploy to Cloudflare`
- Smoke command: `PLAYWRIGHT_BASE_URL=https://amiunique.io PLAYWRIGHT_CHANNEL=chrome pnpm --filter @amiunique/web test:e2e`
- OpenClaw project: `oc-amiunique-9d723bfb`
- Last known good: security audit, dependency audit, lint, unit tests, build, and local browser E2E passed on 2026-07-18
- Latest smoke artifact: `/Users/openclaw/artifacts/oc-amiunique-9d723bfb/20260718-104047`

## Known Warnings

- The static Next.js bootstrap currently requires `script-src 'unsafe-inline'`; all other script sources are restricted to self.
- Production deployment and post-deploy browser acceptance are recorded in `ops/deploy-ledger.jsonl`.

## Status Rule

Authentication failure only means the current environment cannot run a new direct deploy. Confirm
historical state from this file, the deployment ledger, the public URL, and current executor
capability.
