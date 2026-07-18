# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to `privacy@amiunique.io`. Do not include API
keys, access tokens, raw visitor IPs, browser cookies, or personal fingerprint data in a public
GitHub issue.

Include:

- the affected route, component, or commit;
- clear reproduction steps using synthetic data;
- the expected and observed impact;
- any suggested mitigation.

We will acknowledge a complete report as soon as practical, investigate it privately, and coordinate
disclosure after a fix is available. Please do not test against other users, bypass rate limits,
degrade the production service, or access data that is not yours.

## Supported version

The deployed `main` branch is the only supported version. Older commits and forks may not contain
current dependency or privacy hardening.

## Secret handling

Real credentials belong only in ignored runtime secret sources or Cloudflare/GitHub secret stores.
The repository accepts placeholder-only `.env.example`, `.env.sample`, and `.env.template` files.
