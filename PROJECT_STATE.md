# Project State

Current production-state summary. Keep this file short and factual.

## Current Truth

- Project: `amiunique`
- Platform: Cloudflare Pages + Workers
- Production URL: `https://amiunique.io`
- Custom domain: `amiunique.io`
- Source: public at `https://github.com/7and1/amiunique/`
- Deploy path: `git push origin main` → GitHub Actions "Deploy to Cloudflare" (test-gated:
  lint+test → deploy-api → deploy-web → verify); Wrangler direct remains the manual fallback.
  D1 migrations stay manual (`wrangler d1 execute --remote --file=...`) — CI does not run them.
- Smoke command: `PLAYWRIGHT_BASE_URL=https://amiunique.io PLAYWRIGHT_CHANNEL=chrome pnpm --filter @amiunique/web test:e2e`
- OpenClaw project: `oc-amiunique-9d723bfb`
- Last known good: 2026-07-26 single-page release — the homepage is the full scan experience
  (consent-gated inline scan with real 23-step progress, restored-result semantics, mobile nav +
  theme toggle), SEO/GEO surfaces live (stats-snapshot prerender, llms.txt, _redirects 301s,
  robots AI-crawler rules, FAQ/TechArticle/Dataset JSON-LD), D1 migration 0003 applied
  (stats pre-aggregation + daily_stats backfill), 23/23 Chrome production acceptance
- Worker version: `955ac6bd-5aea-4087-ba0e-cefa589fd23f`
- Pages deployment: `40acd5d0` (https://40acd5d0.amiunique.pages.dev)
- D1 rollback bookmark (pre-0003): `00009bf9-00000166-000050b4-535f637783d422b3e7ff1bacc75dc230`
- Latest smoke artifacts:
  - `/Users/openclaw/artifacts/oc-amiunique-9d723bfb/prod-20260726-spa`

## Known Warnings

- The static Next.js bootstrap currently requires `script-src 'unsafe-inline'`; all other script sources are restricted to self.
- CI setup actions still emit Node 20 deprecation annotations; the job runtimes are on Node 22
  (wrangler 4.112 requires ≥22).
- Production deployment and post-deploy browser acceptance are recorded in `ops/deploy-ledger.jsonl`.

## Status Rule

Authentication failure only means the current environment cannot run a new direct deploy. Confirm
historical state from this file, the deployment ledger, the public URL, and current executor
capability.
