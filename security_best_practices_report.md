# Security Best-Practices Review

Review date: 2026-07-18

Scope: the current `main` worktree, Git history, frontend, Worker API, dependency graph, GitHub
Actions, Cloudflare bindings, and the planned public-repository boundary.

## Executive summary

The initial review was **NO-GO** because the repository relied on a global ignore for live secret
sources, pull requests could reach production deploy jobs, the dependency audit contained critical
and high advisories, production rate limiting used a non-atomic KV counter, and D1 persistence
included a reversible IP hash and overly precise network metadata.

Those blockers have been remediated in the current worktree. Git history scanning found no committed
credential, dependency audit now reports no known vulnerability, and the complete lint/test/build
gate passes on OpenClaw. Public release remains contingent on applying the included production
privacy migration, deploying this exact commit, completing browser acceptance, and rerunning the
final staged-secret scan.

## Remediated findings

### SEC-01 — High — Portable secret exclusions were incomplete

- Previous risk: `local.env.txt`, `*.env.txt`, and general `.env*` variants were protected only by
  host-local Git configuration.
- Remediation: repository-local exclusions and template exceptions are defined in
  `.gitignore:15-20`; internal OpenClaw results are excluded at `.gitignore:48`.
- Evidence: full Git-history Gitleaks scan found zero committed secrets.

### SEC-02 — High — Pull requests could trigger production deployment

- Previous risk: unreviewed same-repository branches could run Worker and Pages deploy jobs with
  production credentials.
- Remediation: `.github/workflows/deploy.yml` now runs only on `main` pushes or manual dispatch,
  uses a single production concurrency group at line 11, and assigns both deploy jobs to the
  `production` environment at lines 22 and 210.
- PR validation is secret-free and includes Gitleaks, dependency audit, lint, tests, and build in
  `.github/workflows/security-check.yml:4-75`.

### SEC-03 — High — Critical and high dependency advisories

- Previous risk: 98 advisories, including a critical Vitest UI issue and high advisories in Next,
  Hono, Wrangler, Vite, Rollup, and transitive glob parsers.
- Remediation: direct packages were upgraded and narrow patched transitive overrides were added in
  `package.json`; deploy actions use Wrangler 4.112.0 at
  `.github/workflows/deploy.yml:187,240`.
- Evidence: `pnpm audit --audit-level=low` reports `No known vulnerabilities found`.

### SEC-04 — High — Production rate limits were non-atomic and fail-open

- Previous risk: concurrent KV read-modify-write operations could bypass protection and missing KV
  allowed unbounded D1/IPBot traffic.
- Remediation: production routes use Cloudflare native Rate Limiting bindings and fail closed when a
  binding is missing or errors (`apps/api/src/middleware/rate-limit.ts:76-136`). Analyze and deletion
  bindings are declared in `apps/api/wrangler.toml.example:50-63,114-127`; stats and health have
  separate limits as well.
- IPBot calls from analyze additionally require a functioning cache
  (`apps/api/src/routes/analyze.ts:140-149`).

### SEC-05 — High — D1 stored a reversible IP hash and precise network metadata

- Previous risk: IPv4 SHA-256 values can be enumerated offline and were stored alongside a stable
  device fingerprint and precise location fields.
- Remediation: new D1 payloads contain validated client data only
  (`apps/api/src/lib/privacy.ts:27-36`); current-request network data is projected only into the
  one-time response (`apps/api/src/lib/privacy.ts:38-55`). Connection-IP hashes are no longer part of
  the shared `NetworkFingerprint` type.
- Existing rows are remediated by `apps/api/migrations/0002_privacy_hardening.sql:1-25` and the
  idempotent scheduled minimizer at `apps/api/src/scheduled.ts:174-229`.

### SEC-06 — High — Request bodies were parsed before a real size limit

- Previous risk: a chunked oversized JSON body could consume Worker memory before rejection.
- Remediation: streaming Hono body limits are applied before parsing:
  `apps/api/src/routes/analyze.ts:33-50` (50 KiB) and
  `apps/api/src/routes/deletion.ts:16-34` (2 KiB).

### SEC-07 — High — Deletion receipts linked email and fingerprint indefinitely

- Previous risk: the same D1 row retained the submitted hash, email, reason, and error details after
  processing.
- Remediation: the public deletion API now accepts only a hash type and validated SHA-256 value
  (`apps/api/src/lib/validation.ts:124-130`) and never writes an email. Completed/rejected requests
  scrub the hash and legacy personal fields (`apps/api/src/scheduled.ts:49-94`); receipts expire
  after 30 days and visits after 90 days (`apps/api/src/scheduled.ts:232-268`).

### SEC-08 — High — Retryable scan requests could create duplicate rows

- Previous risk: the browser retries analyze requests after network failures, which could insert
  duplicate observations.
- Remediation: the client reuses one UUID `Idempotency-Key`; the Worker validates UUID v4, performs
  `INSERT OR IGNORE`, verifies a replay against the original hashes, and rejects conflicting reuse
  (`apps/api/src/routes/analyze.ts:74-260`).

### SEC-09 — Medium — Broad CORS and production error disclosure

- Previous risk: any Cloudflare tenant and hostnames such as `localhost.evil` were trusted; raw D1
  errors could be returned.
- Remediation: origins are parsed and matched against exact production hosts, AmiUnique Pages
  previews, and exact local-development hosts (`apps/api/src/index.ts:53-89`). Analyze and health
  now return generic production failures with a request identifier.

### SEC-10 — Medium — Third-party and browser hardening gaps

- Google STUN use is now accurately disclosed at
  `apps/web/src/app/legal/privacy/page.tsx:81-92`; candidate IPs are removed before response and
  persistence.
- JSON-LD escapes `<` before script injection (`apps/web/src/components/seo/json-ld.tsx:13-14`).
- Pages adds CSP and Permissions-Policy in `apps/web/public/_headers:2-5`.
- The dormant AI provider proxy is disabled by default and adds a strict request schema, 32 KiB body
  limit, and upstream timeout (`apps/web/src/app/api/ai/chat/route.ts:4-50`).

## Residual risks and accepted boundaries

1. The static Next.js export requires inline bootstrap scripts, so CSP currently includes
   `script-src 'unsafe-inline'`. Remote script origins, objects, frames, and base-tag injection remain
   blocked. Moving to nonce/hash-based scripts would require a dynamic response layer.
2. A full scan intentionally contacts Google public STUN infrastructure. This is a disclosed product
   tradeoff, not an analytics integration; a self-hosted STUN service would further reduce third-party
   exposure.
3. Existing Git commits contain normal author-name/email metadata. No token or credential was found
   in the 10-commit history; publishing the repository will make that ordinary Git metadata public.
4. The AI route is not emitted by the current static Pages deployment. Provider mode must remain
   disabled until it is moved behind server-side abuse control and consent handling.

## Validation evidence

- `gitleaks git --redact=100 .` — pass, zero findings across all 10 commits.
- `pnpm audit --audit-level=low` — pass, no known vulnerabilities.
- `pnpm lint` — pass, all four workspace tasks.
- `pnpm test` — pass.
- `pnpm build` — pass.
- `git diff --check` — pass.

Production migration, deployment, staged Gitleaks, GitHub Actions, and public browser acceptance are
recorded in the release closeout after execution.
