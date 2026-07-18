# Contributing

Thank you for helping improve AmiUnique.

## Before opening a pull request

1. Keep the change focused and avoid unrelated refactors.
2. Add or update tests for behavior changes.
3. Run `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm audit --audit-level=high`.
4. Confirm no secret or local runtime artifact is staged.
5. Explain any new data collection, third-party request, storage field, or retention change.

Use Conventional Commits, for example `fix(api): enforce request body limit`.

## Privacy and security expectations

- Never persist a raw IP address, IP hash, or WebRTC candidate address.
- Never add an endpoint that accepts an arbitrary IP for intelligence lookup.
- Keep provider keys server-side and out of browser bundles, logs, fixtures, and docs.
- Bound all public request bodies and validate unknown input.
- Use Cloudflare native rate limiting for production write or high-cost routes.
- Treat fingerprint data as sensitive even when it does not contain a conventional account ID.

Security vulnerabilities should be reported through [SECURITY.md](SECURITY.md), not a public issue.
