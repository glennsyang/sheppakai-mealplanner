# Meal Planner

A dinner-focused meal planning app. Add your pantry ingredients, get AI-generated recipe suggestions, and slot meals into a Monday–Sunday weekly planner.

---

## Features

- **AI meal suggestions** — Claude (Anthropic) and Gemini (Google) suggest practical dinner recipes based on what's in your pantry
- **Recipe variations** — Generate alternative versions of any dish
- **Pantry management** — Track ingredients with optional quantities and units
- **Weekly planner** — Assign recipes to specific days of the week
- **Streaming suggestions** — Real-time recipe generation for a faster experience
- **Secure auth** — Email/password login via better-auth with rate limiting and IP tracking
- **Dark mode** — Detected from system preference or `localStorage`

---

## Tech Stack

| Concern         | Choice                                                       |
| --------------- | ------------------------------------------------------------ |
| Framework       | SvelteKit `^2.50.2` + TypeScript (strict)                    |
| UI Components   | Svelte `^5.55.8` (runes only)                                |
| Database        | SQLite via Drizzle ORM `^0.45.2` (better-sqlite3 `^12.10.0`) |
| Auth            | better-auth `^1.6.11` (email + password)                     |
| AI — Meals      | `@google/genai ^2.4.0` — `gemini-2.5-flash-preview`          |
| AI — Variations | `@anthropic-ai/sdk ^0.96.0` — `claude-sonnet-4-6`            |
| UI Styling      | Skeleton UI `^4.12.1` + Tailwind CSS `^4.2.1`                |
| Animations      | Svelte 5 transitions + `@formkit/auto-animate ^0.9.0`        |
| Forms           | sveltekit-superforms `^2.30.1` + Zod `^4.4.3`                |
| Error Tracking  | Sentry `^10.53.1`                                            |
| Testing         | Vitest `^4.1.6`                                              |
| Linting         | oxlint `^1.65.0` + oxfmt `^0.50.0`                           |
| Deployment      | fly.io (Node 22, SQLite on persistent volume)                |

---

## Getting Started

### Prerequisites

- Node.js **22.21.1** (use `.nvmrc` or `nvm use`)
- npm

### Install

```bash
npm install
```

### Environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL=./data/db.sqlite
BETTER_AUTH_SECRET=<random 32+ character string>
BETTER_AUTH_BASE_URL=http://localhost:5173
ANTHROPIC_API_KEY=<your Anthropic API key>
GEMINI_API_KEY=<your Google Gemini API key>
```

### Database setup

```bash
npm run db:push      # Create ./data/db.sqlite and sync schema
```

### Dev server

```bash
npm run dev
```

App runs at `http://localhost:5173`.

---

## Common Commands

```bash
npm run dev            # Dev server
npm run build          # Production build
npm run preview        # Preview production build
npm run test           # Run all Vitest tests
npm run test:coverage  # Tests with v8 coverage report
npm run check          # svelte-check (TypeScript + Svelte)
npm run lint           # oxlint
npm run fmt            # oxfmt (format)
npm run db:push        # Push schema to SQLite (dev)
npm run db:migrate     # Run migrations (production)
npm run db:studio      # Drizzle visual browser
```

---

## Project Structure

```
src/
├── hooks.server.ts              # Session middleware, security headers, CSP
├── app.css                      # Tailwind v4 + Skeleton CSS imports
├── app.html                     # data-theme="pine" on <html>
├── lib/
│   ├── logger.ts                # App-wide logger (never use console.log)
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── auth-client.ts           # Client-side better-auth
│   ├── schemas/                 # Zod v4 schemas (auth, pantry, mealPlan)
│   ├── components/              # Svelte 5 UI components
│   └── server/
│       ├── db/
│       │   ├── schema.ts        # All Drizzle tables (auth + app)
│       │   └── index.ts         # Drizzle client (WAL mode)
│       ├── auth/index.ts        # betterAuth instance
│       ├── ai/
│       │   ├── claude.ts        # Variations API (suggestVariations)
│       │   └── gemini.ts        # Meal suggestions (suggestMeals, suggestMealsStream)
│       └── services/
│           ├── pantry.ts
│           ├── recipes.ts
│           └── mealPlan.ts
├── routes/
│   ├── (auth)/                  # login, register, logout
│   ├── (app)/                   # Protected: auth guard in +layout.server.ts
│   │   ├── pantry/
│   │   ├── suggest/
│   │   └── planner/
│   ├── api/auth/[...all]/       # better-auth handler
│   ├── api/suggest/             # GET ?items=… → meal suggestions (Gemini)
│   ├── api/variations/          # GET ?meal=… → dish variations (Claude)
│   └── api/healthz/             # Health check
└── tests/
    ├── logger.test.ts
    ├── schemas/auth.test.ts
    └── services/pantry.test.ts, mealPlan.test.ts
```

---

## Database Schema

| Table               | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `user`              | User accounts (better-auth)               |
| `session`           | Active sessions (better-auth)             |
| `account`           | OAuth accounts (better-auth)              |
| `verification`      | Email verification tokens (better-auth)   |
| `pantry_items`      | Pantry inventory per user                 |
| `recipes`           | Saved recipes (AI-generated or custom)    |
| `meal_plans`        | Weekly meal plans (one per user per week) |
| `meal_plan_entries` | Recipe-to-day assignments within a plan   |
| `suggestions`       | Historical pantry snapshots + AI results  |

All app tables use UUID text primary keys and `created_at` / `updated_at` audit columns.

---

## Deployment (fly.io)

```bash
# Set secrets
fly secrets set \
  BETTER_AUTH_SECRET=... \
  ANTHROPIC_API_KEY=... \
  GEMINI_API_KEY=... \
  BETTER_AUTH_BASE_URL=https://sheppakai-mealplanner.fly.dev

# Deploy
fly deploy
```

SQLite is stored on a persistent volume mounted at `/data/db.sqlite`. Run migrations after deploy:

```bash
fly ssh console -C "node -e \"require('./build/server/db/migrate.js')\""
# or use: npm run db:migrate
```

---

## Environment Variables

| Variable               | Required | Description                                                  |
| ---------------------- | -------- | ------------------------------------------------------------ |
| `DATABASE_URL`         | Yes      | SQLite path (`./data/db.sqlite` dev, `/data/db.sqlite` prod) |
| `BETTER_AUTH_SECRET`   | Yes      | Random 32+ char string for auth signing                      |
| `BETTER_AUTH_BASE_URL` | Yes      | App origin URL (used for auth callbacks)                     |
| `ANTHROPIC_API_KEY`    | Yes      | Claude API key (recipe variations)                           |
| `GEMINI_API_KEY`       | Yes      | Gemini API key (meal suggestions)                            |
| `NODE_ENV`             | No       | `development` \| `production` \| `test`                      |

---

## Known Quirks

1. **Skeleton theme CSS** — `@skeletonlabs/skeleton/themes/*.css` uses a `*` export pattern that `enhanced-resolve` can't handle. Fixed with a Vite alias in `vite.config.ts` pointing to the direct file path.

2. **Superforms + Zod v4 email inputs** — Never spread `{...$constraints}` on `type="email"` inputs. Zod v4's email regex is incompatible with the browser's HTML `pattern` attribute `v` flag.

3. **`getMondayOfCurrentWeek()`** — Uses local date components instead of `.toISOString()` to avoid UTC offset shifting the date across midnight.

4. **Auth redirects** — `auth.api.signInEmail` / `signUpEmail` may internally throw SvelteKit redirects. Always `if (isRedirect(err)) throw err` inside auth catch blocks.

5. **Secure cookies** — `useSecureCookies: true` is set. Cookies require HTTPS in production. better-auth auto-allows non-secure cookies on `localhost` in dev.
