# Environment Variables

This is the canonical list of every environment variable this app uses — app runtime, build-time,
and CI-only. `.env.example` is the actual template to copy for local dev; this doc is the
reference for what each one does, where it's required, and where it's consumed. If the two ever
disagree, this doc and the code it links to are the source of truth — update `.env.example` (and
the README/CLAUDE.md pointers to this file) to match, not the other way around.

## App runtime

Validated at startup in [`src/env.ts`](../src/env.ts) via SvelteKit's explicit-env feature
(`experimental.explicitEnvironmentVariables` in `svelte.config.js`), and consumed via
`$app/env/private` (or `$app/env/public` for the one public var). During `npm run build`, each
var falls back to a build-time dummy value (see `src/env.ts`) so the build never needs real
secrets — those dummies are rejected at runtime outside of build.

| Variable               | Required | Fly secret? | Consumed in                                                  | Notes                                                                                                                                                                                   |
| ---------------------- | -------- | ----------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Yes      | No          | `src/lib/server/db/index.ts`                                 | Baked into the `Dockerfile` (`file:///data/db.sqlite`) instead — see below. Dev default: `./data/db.sqlite`.                                                                            |
| `BETTER_AUTH_SECRET`   | Yes      | Yes         | `src/lib/server/auth/index.ts`                               | Random 32+ char string for auth session signing.                                                                                                                                        |
| `BETTER_AUTH_BASE_URL` | Yes      | Yes         | `src/lib/server/auth/index.ts`                               | App origin URL, used for auth callbacks. Defaults to `http://localhost:5173`.                                                                                                           |
| `BREVO_API_KEY`        | Yes      | Yes         | `src/lib/server/email/index.ts`                              | Brevo API key for transactional email.                                                                                                                                                  |
| `BREVO_FROM_ADDRESS`   | Yes      | Yes         | `src/lib/server/email/index.ts`                              | Must be a sender address confirmed in Brevo. Related to #59, #64.                                                                                                                       |
| `ANTHROPIC_API_KEY`    | Yes      | **Missing** | `src/lib/server/ai/claude.ts`                                | Claude API key (recipe variations). **Not currently set in production** (`fly secrets list` doesn't show it) — needs `fly secrets set ANTHROPIC_API_KEY=...` from someone with the key. |
| `GEMINI_API_KEY`       | Yes      | Yes         | `src/lib/server/ai/gemini.ts`                                | Gemini API key (meal suggestions).                                                                                                                                                      |
| `NODE_ENV`             | No       | Yes\*       | `src/lib/server/db/index.ts`, `src/lib/server/auth/index.ts` | `development` \| `production` \| `test`. \*Also baked into the `Dockerfile` — see below; the Fly secret is redundant but harmless.                                                      |
| `PUBLIC_SENTRY_DSN`    | No       | No          | `src/hooks.client.ts`, `src/hooks.server.ts`                 | Not a secret — sent to the browser. Defaults to the project DSN, so no config is needed unless pointing at a different Sentry project.                                                  |

## App runtime, optional, unvalidated

Not validated by `src/env.ts` — read directly via `process.env` and safe to leave unset.

| Variable    | Required | Consumed in                | Notes                                                                                     |
| ----------- | -------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| `LOG_LEVEL` | No       | `src/lib/server/logger.ts` | `debug` \| `info` \| `warn` \| `error`. Defaults to `debug` in dev, `info` in production. |

## Baked into the `Dockerfile`, not Fly secrets

Set as `ENV` lines in [`Dockerfile`](../Dockerfile), not via `fly secrets set` — intentional, not
an omission:

- `DATABASE_URL=file:///data/db.sqlite`
- `NODE_ENV=production`

## Build-time only

Not needed for `npm run dev` — only read during `npm run build`.

| Variable            | Consumed in                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SENTRY_AUTH_TOKEN` | `vite.config.ts` (`sentrySvelteKit()`) | Lets the Sentry Vite plugin upload source maps during build. Passed into the Docker build stage as a BuildKit build secret (never persisted into an image layer) — see `Dockerfile` (`RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN`) and `.github/workflows/fly-deploy.yml` (`flyctl deploy --build-secret`). Requires a `SENTRY_AUTH_TOKEN` GitHub Actions repo secret to actually take effect; without it, the build just skips source-map upload. |

## CI-only GitHub Actions secrets

Not app runtime vars — never touched by the running app, only by GitHub Actions workflows.

| Variable                       | Used in                                                                     | Notes                                                                 |
| ------------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `FLY_API_TOKEN`                | `.github/workflows/fly-deploy.yml`, `.github/workflows/backup-database.yml` | Deploys and remote `flyctl ssh` access.                               |
| `BACKUP_ENCRYPTION_PASSPHRASE` | `.github/workflows/backup-database.yml`                                     | Encrypts the SQLite dump before it's uploaded as an Actions artifact. |
| `SENTRY_AUTH_TOKEN`            | `.github/workflows/fly-deploy.yml`                                          | See "Build-time only" above.                                          |

## Verification

- [ ] `fly secrets list -a sheppakai-mealplanner` matches the "Fly secret?" column above exactly
      (as of this doc: `BETTER_AUTH_BASE_URL`, `BETTER_AUTH_SECRET`, `GEMINI_API_KEY`, `NODE_ENV`,
      `BREVO_API_KEY`, `BREVO_FROM_ADDRESS` are set; `ANTHROPIC_API_KEY` is the known gap above).
- [ ] A fresh `cp .env.example .env` + fill-in boots the app locally with no missing-var errors,
      including the AI (Claude/Gemini) and Brevo email paths.
