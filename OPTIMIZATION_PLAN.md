# AmiUnique.io Optimization Plan (2026-07-17)

Product research + code survey → phased delivery plan.
Theme: **upgrade the story from "you are unique" to "how exposed are you, and at which layer"** — powered by the new IPBot IP intelligence integration (`apps/api/src/lib/ipbot.ts`, shipped 2026-07-17).

---

## Ground truth (code survey)

- **Backend**: Hono Worker, 4 route groups (analyze/stats/health/deletion), KV rate limiting,
  and cron jobs for deletion processing, stats-cache refresh, and 365-day visit cleanup.
  `ip_intel` enrichment and cross-layer checks now run in `POST /api/analyze` (concurrent
  lookup, KV-cached 24h/1h, fail-open).
- **Frontend**: 12 pages. Oversized components: `home-content.tsx` (685), `developers/page.tsx` (665), `scan/result/page.tsx` (489).
- **Core**: 5 collectors; `lies.ts` handles client-internal consistency, while the API now
  derives typed network/WebRTC consistency checks without persisting raw WebRTC addresses.
- **Quality baseline**: root lint/test/build are green, API/core are explicitly strict, and
  the network result has component tests plus an OpenClaw Playwright desktop/mobile path.
- **AI chat**: OpenRouter (`llama-3.3-70b:free`) with keyless fallback; accepts `fingerprintData` context — easy to inject IP intel.
- **Network layer**: `request.cf` used only as hash material + gray dimension rows; no user-facing interpretation. IP intel fixes exactly this.

Full product requirements (user stories, acceptance criteria, do-not-do list): see PM research summary at the bottom.

---

## Phase 0 — Engineering foundation (implemented 2026-07-17)

| #   | Task                                                                               | Files                                                                                                                                                                        | Notes                                                                 |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 0.1 | ✅ Fix pre-existing tsc errors so `pnpm lint` is green and can gate CI             | `apps/api/src/index.ts` (type Hono `Variables` for `requestId`), `apps/api/src/scheduled.ts` (unused `ctx`), `apps/api/tests/analyze.test.ts` (typed `res.json<T>()` helper) | Verified by root lint/test                                            |
| 0.2 | ✅ Enable `strict: true` in `apps/api` + `packages/core` tsconfigs, fix fallout    | `apps/api/tsconfig.json`, `packages/core/tsconfig.json`                                                                                                                      | Explicit strict configs now prevent drift                             |
| 0.3 | ✅ Hash the IP intel cache key: `ipintel:<sha256(ip)>`                             | `apps/api/src/lib/ipbot.ts`, `tests/ipbot.test.ts`                                                                                                                           | KV keys no longer contain the source IP                               |
| 0.4 | ✅ Bound analyze to one fail-open IPBot attempt                                    | `apps/api/src/routes/analyze.ts`                                                                                                                                             | Revised below from 1200ms to 5000ms after live TTFB evidence          |
| 0.5 | ⏳ Ops: add `IPBOT_API_ORIGIN` / `IPBOT_API_KEY` GitHub secrets (manual, one-time) | —                                                                                                                                                                            | Deploy workflow already handles both and skips gracefully when absent |

## Approved amendments (2026-07-17)

These amendments supersede conflicting items below:

1. **Protect first-scan coverage.** Live IPBot TTFB was observed at about 1.2–2.9s, so the
   analyze path uses one 5000ms attempt with no retry, remains fail-open, and records
   `ip_intel` availability. The product target is >95% non-null `ip_intel` when configured.
2. **Close the existing WebRTC storage leak in P0.** `rtc_public_ip`, `rtc_local_ip`, and the
   deprecated `aux_webrtc_ip` must be removed at the D1 storage boundary. The request-scoped
   values may be used to calculate a verdict but raw leaked IPs are never persisted.
3. **Promote WebRTC leak interpretation into P0-2.** It is already collected and directly
   answers "did my VPN hide my address?". IPv4/IPv6 dual-stack differences are an
   indeterminate state, not an automatic leak.
4. **Use first-party network facts for consistency checks.** Cloudflare `country` and
   `timezone` drive geo/locale checks; IPBot remains the risk, proxy, and network-type source.
5. **Defer Exposure Score to P1.** A composite score needs real P0 distributions and calibrated
   semantics first—especially because a high-risk Tor exit can still provide strong anonymity.
6. **Add privacy-safe operating metrics.** Track aggregate IP-intel availability and
   per-check contradiction rates without third-party analytics or raw IP dimensions.

## Phase 1 — P0 release: "Exposure, layer by layer" (implemented locally 2026-07-17)

### 1.1 ✅ IP anonymity card (P0-1)

- **API** (mostly done): keep the compact `ip_intel` risk/classification summary and
  `ip_intel: null` degraded shape. Use existing Cloudflare `details.net_country`,
  `net_city`, `net_asn`, and `net_asn_org` for connection identity instead of duplicating geo
  from the provider.
- **Web**: new `apps/web/src/components/scan/network-identity-card.tsx` rendered below the
  primary result and above the detailed dimensions: risk band, proxy/datacenter/usage/threat
  states, ASN/operator, Cloudflare connection location, and a clear unavailable state.
- **Types**: add the summary shape to the shared `AnalysisResult` contract.

### 1.2 ✅ Fingerprint × network cross-checks and WebRTC verdict (P0-2)

- **Privacy boundary**: strip raw WebRTC IP fields from D1 `raw_json`; keep only capability
  metadata and the derived response verdict. IPBot-cache and rate-limit KV keys use SHA-256
  digests rather than raw client IPs.
- **API**: new `apps/api/src/lib/cross-check.ts` produces typed check results for
  `timezone_geo_mismatch`, `language_geo_mismatch` (advisory), `datacenter_traffic`,
  `proxy_detected`, and `webrtc_ip_leak`. Inputs are existing client timezone/locale/WebRTC
  fields, Cloudflare country/timezone/connection IP, and `ip_intel`; no new collection.
- **WebRTC states**: unsupported, no public candidate, same connection IP, dual-stack
  indeterminate, or leak detected. Only same-address-family mismatches are flagged.
- **Web**: replace the flat spoofing grid with a consistency report: overall verdict,
  per-item severity, one-line explanation, and explicit unavailable/indeterminate states.

**Release gate**: IPBot outage never 5xxes analyze; configured `ip_intel` availability is

> 95%; cache-hit added latency is <10ms; raw WebRTC IP fields are absent from D1 fixtures; and
> the privacy policy discloses IPBot as a processor (`apps/web/src/app/legal/privacy/page.tsx`).

**Current gate status**:

- ✅ Fail-open API behavior, redacted D1/response fixtures, privacy disclosure, shared types,
  component tests, and desktop/mobile browser acceptance.
- ⏳ Production-only measurements remain: configured `ip_intel` availability and cache-hit
  latency. Do not claim the >95% target until aggregate production evidence exists.
- ⏳ Historical D1 rows created before this privacy boundary may still contain raw WebRTC
  candidates. Any cleanup is a separate production database operation requiring a backup,
  dry run, and explicit authorization.
- ⏳ The published privacy policy says 90-day fingerprint retention, while the existing
  scheduled cleanup remains 365 days. Changing that production deletion window requires an
  explicit retention decision and is not bundled into this feature release.

## Phase 2 — P1 (~2 weeks, in progress)

| #   | Feature                                                                   | Key work                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | ✅ `/ip` page — "what does my IP reveal" (implemented locally 2026-07-18) | `GET /api/ip-intel` returns **self IP only**, trusts the Cloudflare connection header, rejects query/path targets, uses a native Cloudflare Rate Limiting binding and no-store response, and degrades without a paid lookup when the limiter or KV cache is absent. `/ip` defaults to a masked address, reveals or copies only on explicit action, explains each field, and ships static SEO/JSON-LD without personalized data. |
| 2.2 | ✅ WebRTC real-IP leak test (promoted to Phase 1.2)                       | Request-scoped candidate comparison and dual-stack-safe verdicts are already implemented in the P0 consistency report; raw candidate addresses are removed at the persistence and response boundaries.                                                                                                                                                                                                                          |
| 2.3 | VPN before/after guided flow                                              | Web-only: baseline snapshot → rescan → diff view (highlights "IP changed but Gold Lock identical"); activates existing history + compare panel; localStorage only                                                                                                                                                                                                                                                               |
| 2.4 | Developer docs                                                            | api-docs: `ip_intel` field table, degraded semantics, curl example, changelog; explicit "self-IP only" statement                                                                                                                                                                                                                                                                                                                |
| 2.5 | AI assistant context                                                      | Inject `ip_intel` + cross-check results into chat context; keyless fallback answers for "why is my score X" / "why was my VPN detected"                                                                                                                                                                                                                                                                                         |
| 2.6 | Calibrated Exposure Score                                                 | Derive and validate a 0–100 formula from observed P0 distributions; keep fingerprint, network risk, and consistency breakdowns visible and treat privacy networks such as Tor explicitly                                                                                                                                                                                                                                        |

### 2.1 release evidence

- API regression covers the strict Cloudflare-only address source, spoofed forwarding headers,
  arbitrary query/path rejection, unrelated origins, HEAD, missing IPBot configuration, missing KV,
  provider field projection, personalized no-store headers, the 11th request in a ten-request
  window, native-limiter failure, cache-read failure, and concurrent misses. The public route fails
  closed when its native limiter is unhealthy and coalesces same-IP upstream work within one Worker
  isolate. The native limit is intentionally per Cloudflare location, not an accounting guarantee.
- Web component/API-client regression covers masked-by-default rendering, explicit reveal, IPv6,
  unavailable reputation, typed 429 handling, and the absence of Web Storage writes.
- OpenClaw Chrome E2E covers desktop reveal/hide and a 390×844 self-only mobile flow with no
  arbitrary-IP input or viewport overflow.
- Root `pnpm lint && pnpm test && pnpm build` passes on OpenClaw. Production deployment and GitHub
  secret configuration remain separate operator actions. Wrangler 4.51 dry-run accepts the
  production rate-limiter binding configuration.

## Phase 3 — P2 + data flywheel (opportunistic)

- `meta_ip_class` column in `visits` (+ migration) to start accumulating proxy/VPN share for stats; hide the stats board until corpus threshold.
- Share/OG card with exposure score (score + band only — never IP/geo details).
- `/learn` long-tail content page after `/ip` proves search demand.

## Cross-cutting engineering (do alongside phases)

- **Component diet**: split `home-content.tsx` and `developers/page.tsx` when touched (target < 300 lines/component).
- **Tests**: core collector determinism tests (canvas/webgl/audio hash stability contract), web component tests for new cards, one Playwright happy-path E2E (runs on OpenClaw).
- **Observability**: keep `[ipbot]` rate-limit logs; consider a `/api/health` detail flag for IPBot config presence (no key material).

## Do-NOT list (from PM research, binding)

1. No public arbitrary-IP lookup endpoint (quota abuse + upstream ToS).
2. Raw IPs never persisted to D1 — derived risk snapshots only; privacy policy updated in the same release.
3. No accounts/monitoring-alerts before PMF; local A/B flow covers it.
4. No in-house IP risk modeling; interpretation layer is the moat, not data.
5. No B2B anti-fraud pivot; no dimension arms race (interpretation > collection this cycle).

## Success metrics

- North star until the P1 score is calibrated: weekly unique visitors completing a scan and
  viewing the layer-by-layer network/privacy report.
- P0: scan completion rate, `ip_intel` availability (>95% when configured), per-check
  contradiction rates, result-page share CTR, and analyze p95.
- P1: `/ip` organic-search entry share, VPN A/B completions, api-docs → API call conversion.
