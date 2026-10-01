# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Exactly two people in one household (the owner and their partner), sharing one pantry, one recipe collection, and one weekly dinner plan. Accounts are created by an admin; there is no public sign-up.

They use it in three situations, all of which matter:

- **Phone, in the kitchen** — reading tonight's recipe while cooking, often at arm's length with busy hands.
- **Laptop, weekly planning** — sitting down to fill the Monday–Sunday week.
- **Quick "what's for dinner?"** — late afternoon, low energy, wanting a usable suggestion fast.

## Product Purpose

A dinner-focused meal planner. The household records what's in the pantry, gets AI-generated dinner suggestions with full recipes based on those ingredients, generates variations of a dish, and slots recipes into a Monday–Sunday weekly planner. Success: dinner is decided without friction, and the plan for the week is visible at a glance.

## Positioning

A private, two-person household tool, not a recipe platform. Suggestions start from what is actually in this kitchen's pantry, and the plan is shared by both people by design.

## Operating Context

- Pantry → Suggest → Planner is the main loop; recipes open in a drawer with ingredients and steps.
- Suggestions stream in one at a time (Gemini for meal suggestions, Claude for variations).
- Planner, pantry, and suggest carry equal weight; the dashboard routes between them.
- Profile (account settings) and Admin (user management, admin role only) are secondary surfaces.
- Auth flows: sign-in, sign-out, forgot/reset password, verify email.

## Capabilities and Constraints

- SvelteKit + Svelte 5 runes, Skeleton UI v5 + Tailwind CSS v4 — **binding: stay on Skeleton + Tailwind**.
- Light and dark mode via `mode-watcher` toggle — **binding: both modes must stay**.
- Data is shared across both users (pantry, recipes, meal plans); not a bug.
- Deployed on fly.io; CSP set in `hooks.server.ts` (affects any external font or asset origins).
- Dinner only: one recipe slot per day, Monday through Sunday.

## Brand Commitments

Product name "Meal Planner" is used in the app header and page titles. No other brand assets, logos, or voice guidelines exist.

## Evidence on Hand

No photography, testimonials, or illustration assets exist. Recipe content is AI-generated at runtime; no food imagery is available and none should be fabricated.

## Product Principles

1. Tonight first: the answer to "what's for dinner?" should never be more than one tap away.
2. Readable while cooking: recipe content must work on a phone at arm's length.
3. The week at a glance: the plan should be scannable without opening anything.
4. Two people, one kitchen: shared state is the point; never imply per-user ownership.
