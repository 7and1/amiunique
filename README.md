# AmiUnique.io

AmiUnique is an open-source browser fingerprinting transparency tool. It shows which browser,
hardware, and network signals a site can observe, how unusual those signals are, and whether the
browser's claims are consistent with the connection that delivered the request.

- Live site: [amiunique.io](https://amiunique.io)
- API health: [amiunique-api.7and1.workers.dev/api/health](https://amiunique-api.7and1.workers.dev/api/health)
- Privacy policy: [amiunique.io/legal/privacy](https://amiunique.io/legal/privacy)

## Repository layout

- `apps/web` — Next.js static frontend deployed to Cloudflare Pages
- `apps/api` — Hono Worker backed by Cloudflare D1, KV, and native rate limiting
- `packages/core` — browser-side collectors and shared result types

The public self-IP endpoint only inspects the current request. It does not accept an IP query
parameter and cannot be used as an arbitrary-IP lookup proxy.

## Privacy boundaries

- D1 stores neither a raw connection IP nor an IP hash.
- Raw WebRTC candidate addresses are removed before persistence and before the analysis response.
- Stored fingerprint rows expire after 90 days.
- Completed deletion requests scrub the submitted hash and are removed after 30 days.
- IPBot credentials stay in server-side environment bindings. Its response cache uses a hashed key,
  excludes the raw IP value, and expires after 24 hours (one hour for high-risk results).
- A full scan uses Google public STUN endpoints for the user-initiated WebRTC leak test; this is
  disclosed in the privacy policy.

See [SECURITY.md](SECURITY.md) for vulnerability reporting and
[security_best_practices_report.md](security_best_practices_report.md) for the latest pre-release
security review.

## Requirements

- Node.js 20 or newer
- pnpm 9
- A Cloudflare account for Worker, D1, KV, Pages, and native rate-limiter bindings

## Development

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

Copy `apps/api/wrangler.toml.example` to the ignored `apps/api/wrangler.toml` and replace only the
placeholder D1/KV IDs. Keep secrets in your secret manager or ignored runtime environment files.
Never commit `local.env.txt`, `*.env.txt`, `.env*`, `.dev.vars`, or a populated `wrangler.toml`.

The API recognizes these optional IPBot variables:

- `IPBOT_API_ORIGIN`
- `IPBOT_API_KEY` (secret)

If either is missing, IP intelligence is disabled and analysis continues without it. For full
Cloudflare setup and deployment details, see [DEPLOYMENT.md](DEPLOYMENT.md) and
[.github/SECRETS.md](.github/SECRETS.md).

## Security checks

```bash
pnpm audit --audit-level=high
pnpm lint
pnpm test
pnpm build
gitleaks git --redact=100 .
```

Pull requests run the same dependency, secret, lint, test, and build gates. Production deployment is
restricted to pushes to `main` or an explicit workflow dispatch.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Changes that add a collector or data field must document its
purpose, validation bounds, persistence behavior, and privacy impact.

## License

[MIT](LICENSE)
