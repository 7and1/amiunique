# Repository Guidelines

## Project Structure & Module Organization
This pnpm/Turborepo workspace keeps deployable apps in `apps/` and shared libraries in `packages/`. `apps/web` is the Next.js 14 frontend exported to Cloudflare Pages, while `apps/api` is the Hono Worker with `schema.sql` migrations and `wrangler.toml`. Browser collectors that both surfaces import live inside `packages/core` and ship as ESM + type declarations. Root config (`tsconfig.base.json`, `.prettierrc`, `turbo.json`) keeps every package aligned.

## Build, Test, and Development Commands
- `pnpm install` — restore workspace dependencies.
- `pnpm dev` — run `turbo dev` for both apps (Next on 3000, Wrangler on 8787).
- `pnpm dev:web` / `pnpm dev:api` — scope the dev server to one surface.
- `pnpm build` — run `turbo build`, emitting `.next/`, `out/`, and `dist/`.
- `pnpm lint` — TypeScript project checks; run `pnpm format` if Prettier disagrees.
- `pnpm test` — orchestration hook; each package must expose a `test` script so `turbo test` can populate `coverage/`.
- `pnpm db:migrate` — apply the Worker’s D1 schema via Wrangler.

## Coding Style & Naming Conventions
Prettier 3 drives formatting: two-space indentation, single quotes, required semicolons, ≤100-character lines, and `arrowParens: "avoid"`. Keep React components PascalCase in `apps/web/src/components`, colocate hooks in `lib/`, and name Worker handlers with verb-first camelCase (e.g., `registerVisitor`). Prefer ESM imports that use the base tsconfig paths to avoid `../../..`.

## Testing Guidelines
No tests ship yet, but every package must expose a `test` script (Vitest, Playwright, Wrangler unit tests—pick what fits) so `pnpm test` succeeds in CI. Keep specs beside the implementation (`feature.test.ts(x)`), snapshot deterministic collectors, and hit D1 through `wrangler d1 execute ... --local`. Emit coverage to `coverage/` so Turbo’s cache keys remain stable.

## Commit & Pull Request Guidelines
This export omits `.git`, but the upstream repo follows Conventional Commits (`type(scope): summary`) to keep release notes and Turbo caching deterministic—mirror that style (e.g., `feat(core): add ja3 collector`). PR descriptions should cover what changed, how it was tested (`pnpm lint && pnpm test`), schema or Wrangler secret updates, and screenshots or GIFs for UI tweaks. Reference the relevant Blueprint checklist item or issue ID for traceability.

## Security & Configuration Tips
Never commit secrets; Cloudflare credentials live in Wrangler secrets and frontend variables belong in `apps/web/.env.local` (gitignored). After editing `schema.sql`, rerun `pnpm db:migrate` locally and include the resulting SQL diff in your PR. Ensure new collectors or Worker endpoints handle missing `request.cf` metadata gracefully.
