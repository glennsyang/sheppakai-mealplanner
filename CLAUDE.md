# Meal Planner — Claude Code Guide

A dinner-focused meal planner. Users enter pantry ingredients → Claude AI suggests dinners with full recipes → meals slot into a Monday–Sunday weekly planner.

---

## Node Version

Always use **Node.js 22.21.1** for all development, testing, and tooling. Do not use any other Node version.

---

## Tech Stack

| Concern    | Choice                                         |
| ---------- | ---------------------------------------------- |
| Framework  | SvelteKit + TypeScript (strict)                |
| Database   | SQLite via Drizzle ORM (better-sqlite3)        |
| Auth       | better-auth v1 (email + password)              |
| AI         | `@anthropic-ai/sdk` — `claude-sonnet-4-6`      |
| UI         | Skeleton UI v4 + Tailwind CSS v4               |
| Animations | Svelte 5 transitions + `@formkit/auto-animate` |
| Forms      | sveltekit-superforms v2 + Zod v4               |
| Testing    | Vitest v4                                      |
| Deployment | fly.io (Node 22, SQLite on persistent volume)  |

---

## Non-Negotiable Conventions

### TypeScript

- **Strict mode everywhere.** Never use `any` — use proper types, generics, or `unknown`.
- **camelCase** for all TypeScript types, interfaces, and variable names.

### Svelte

- **Svelte 5 runes only**: `$state`, `$derived`, `$effect`, `$props`, `$bindable`.
- Never use `onMount` or manual `addEventListener`. Use `$effect` and Svelte event attributes instead.
- Use `page` from `$app/state` (not `$app/stores`) for reactive page info.

### Logging

- **Never use `console.log`** anywhere. Always import and use `$lib/logger`.
- Logger levels: `debug | info | warn | error`.

### Database

- **snake_case** for all DB column names.
- Every table has `created_at` and `updated_at` audit columns.
- IDs are `crypto.randomUUID()` text strings.

### Forms

- All form submissions use **sveltekit-superforms + Zod v4**.
- Import adapters as `zod4` / `zod4Client` from `sveltekit-superforms/adapters`.
- Never spread `{...$constraints}` on email inputs — Zod v4 generates a `pattern` regex the browser rejects. Instead apply individual attributes (`required`, `minlength`, etc.).

### Error handling

- Always re-throw SvelteKit redirects: `if (isRedirect(error)) throw error`.
- Use `fail(400, { form })` for form validation errors, `fail(500, ...)` for server errors.

---

## Project Structure

```
src/
├── hooks.server.ts              # Session middleware, security headers, CSP, error handler
├── app.css                      # Tailwind v4 + Skeleton CSS imports
├── app.html                     # data-theme="cerberus" on <html>
├── lib/
│   ├── logger.ts                # App-wide logger — use this, never console.log
│   ├── types.ts                 # Shared TS interfaces (camelCase)
│   ├── auth-client.ts           # Client-side better-auth (better-auth/svelte)
│   ├── schemas/                 # Zod v4 schemas — auth.ts, pantry.ts, mealPlan.ts
│   ├── components/              # Svelte 5 UI components
│   └── server/
│       ├── db/
│       │   ├── schema.ts        # All Drizzle tables (auth + app)
│       │   └── index.ts         # Drizzle client (WAL mode enabled)
│       ├── auth/
│       │   └── index.ts         # betterAuth instance
│       ├── ai/
│       │   └── claude.ts        # suggestMeals() — tool use for typed MealSuggestion[]
│       └── services/
│           ├── pantry.ts
│           ├── mealPlan.ts      # includes getMondayOfCurrentWeek()
│           └── recipes.ts
├── routes/
│   ├── (auth)/                  # Unauthenticated: login, register, logout
│   ├── (app)/                   # Protected: auth guard in +layout.server.ts
│   │   ├── pantry/
│   │   ├── suggest/
│   │   └── planner/
│   ├── api/auth/[...all]/       # better-auth request handler
│   └── api/suggest/             # Claude AI endpoint
└── tests/
    ├── logger.test.ts
    ├── schemas/auth.test.ts
    └── services/pantry.test.ts, mealPlan.test.ts
```

---

## Authentication

- **better-auth v1** with email+password only (no OAuth).
- Minimum password length: **12 characters**.
- `src/hooks.server.ts` runs the session middleware on every request, populating `event.locals.user` and `event.locals.session` via `svelteKitHandler`.
- `(app)/+layout.server.ts` enforces the auth guard — redirects to `/login` if no session.
- **Logout** is a form POST to `/logout` (handled by `(auth)/logout/+page.server.ts`). The layout submits a hidden form via `requestSubmit()`.
- `auth.advanced.useSecureCookies` is `true` — cookies require HTTPS. In dev, ensure `http://localhost:5173` is in `trustedOrigins`.
- Rate limiting: 5 requests/minute/IP, `database` storage in production, `memory` in dev.
- Cookie prefix: `mealplanner_auth_`.

### Environment variables required

```
BETTER_AUTH_SECRET=<random 32+ char string>
BETTER_AUTH_BASE_URL=https://your-app.fly.dev   # or http://localhost:5173 in dev
ANTHROPIC_API_KEY=<key>
DATABASE_URL=/data/db.sqlite                     # or ./data/db.sqlite in dev
```

---

## Database

- Drizzle ORM with `better-sqlite3`, WAL mode enabled.
- Schema file: `src/lib/server/db/schema.ts` — defines **both** better-auth tables and app tables.
- Better-auth tables: `user`, `session`, `account`, `verification` — defined with camelCase Drizzle field names mapping to snake_case DB columns.
- App tables: `pantry_items`, `recipes`, `meal_plans`, `meal_plan_entries`, `suggestions`.
- Migrations output: `src/lib/server/db/migrations/`.

### Working with the DB

```bash
npm run db:push      # Push schema to dev SQLite (creates ./data/db.sqlite)
npm run db:migrate   # Run migrations (production)
npm run db:studio    # Open Drizzle visual browser
```

---

## AI Integration

`src/lib/server/ai/claude.ts` — uses **tool use** (not streaming text) for fully typed output.

- Model: `claude-sonnet-4-6`
- Tool: `suggest_meals` — returns `MealSuggestion[]`
- `suggestMeals(items)` — full response, returns all suggestions at once
- `suggestMealsStream(items)` — async generator, yields one `MealSuggestion` at a time

The `/api/suggest` endpoint (`GET ?items=...`) calls `suggestMeals` and returns JSON. The suggest page fetches this client-side.

---

## Skeleton UI v4

- CSS from `@skeletonlabs/skeleton` (utilities, tokens, presets).
- Components from `@skeletonlabs/skeleton-svelte` (Dialog, AppBar, Toast, TagsInput, etc.).
- Theme: `pine` — set via `data-theme="pine"` on `<html>` in `app.html`.
- **Known issue**: `@skeletonlabs/skeleton/themes/cerberus.css` fails to resolve via `enhanced-resolve` (the `*` pattern in package exports isn't supported for CSS). Fixed via a Vite alias in `vite.config.ts` pointing to the direct file path.

### CSS class conventions

- Presets: `preset-filled-primary-500`, `preset-outlined-surface-500`, `preset-tonal-surface`, `preset-ghost-surface`
- Surface colors: `bg-surface-50-950`, `text-surface-950-50`, `border-surface-200-800`
- Use `btn`, `input`, `label`, `card`, `chip`, `badge`, `alert` utility classes from Skeleton

---

## Tailwind CSS v4

- No `tailwind.config.js` — configured entirely in CSS via `@import` and `@theme`.
- Plugin: `@tailwindcss/vite` (add before `sveltekit()` in `vite.config.ts`).
- Custom animations defined in `app.css`: `animate-card-enter`, `animate-shimmer`.

---

## Forms Pattern

Every form follows this pattern:

**Schema** (`src/lib/schemas/<domain>.ts`):

```ts
import { z } from 'zod';
export const mySchema = z.object({ ... });
export type MySchema = typeof mySchema;
```

**Server** (`+page.server.ts`):

```ts
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isRedirect, redirect, fail } from '@sveltejs/kit';

// load
const form = await superValidate(zod4(mySchema));
return { form };

// action
const form = await superValidate(request, zod4(mySchema));
if (!form.valid) return fail(400, { form });
try { ... } catch (err) {
  if (isRedirect(err)) throw err;
  return message(form, 'Error message', { status: 400 });
}
throw redirect(302, '/destination');
```

**Client** (`+page.svelte`):

```ts
// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
const { form, errors, constraints, enhance, message, submitting } = superForm(
  data.form,
  {
    validators: zod4Client(mySchema),
  },
);
```

**Email inputs** — do NOT spread `$constraints.email`. Apply individually:

```svelte
<input type="email" required={$constraints.email?.required} ... />
```

---

## Security

All configured in `src/hooks.server.ts`:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), camera=(), microphone=()`
- `Strict-Transport-Security` (production only)
- Content Security Policy — `unsafe-inline` required for SvelteKit CSS injection

---

## Common Commands

```bash
npm run dev          # Dev server — http://localhost:5173
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Vitest (all tests)
npm run test:watch   # Vitest watch mode
npm run check        # svelte-check (TypeScript + Svelte)
npm run lint         # oxlint
npm run lint:fix     # oxlint --fix
npm run db:push      # drizzle-kit push (sync schema to SQLite)
npm run db:studio    # Drizzle visual browser
```

---

## Deployment (fly.io)

- Region: `yyz` (Toronto)
- SQLite on persistent volume mounted at `/data`, file at `/data/db.sqlite`
- Node 22 slim image
- Set secrets before first deploy:
  ```bash
  fly secrets set BETTER_AUTH_SECRET=... ANTHROPIC_API_KEY=... BETTER_AUTH_BASE_URL=https://sheppakai-mealplanner.fly.dev
  ```
- The `trustedOrigins` in `auth/index.ts` includes `https://sheppakai-mealplanner.fly.dev` — update this to match the actual fly.io app URL.

---

## Known Quirks

1. **Skeleton theme CSS import** — `@skeletonlabs/skeleton/themes/*.css` uses a `*` pattern export that `enhanced-resolve` can't handle for CSS. Vite alias in `vite.config.ts` works around this.

2. **Superforms + Zod v4 email pattern** — Never spread `{...$constraints}` on `type="email"` inputs. Zod v4's email regex uses character classes incompatible with the browser's HTML `pattern` attribute `v` flag.

3. **`getMondayOfCurrentWeek()`** — Uses local date components (`.getFullYear()`, `.getMonth()`, `.getDate()`) instead of `.toISOString()` to avoid UTC offset shifting the date across midnight.

4. **Auth redirects** — `auth.api.signInEmail` / `signUpEmail` may internally throw SvelteKit redirects. Always `if (isRedirect(err)) throw err` inside auth catch blocks.

5. **`useSecureCookies: true`** — Auth cookies require HTTPS. On fly.io this is fine. In local dev, better-auth should auto-detect `localhost` and allow non-secure cookies.
