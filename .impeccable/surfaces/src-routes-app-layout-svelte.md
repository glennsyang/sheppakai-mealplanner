---
version: 1
slug: 'src-routes-app-layout-svelte'
primary_target: 'src/routes/(app)/+layout.svelte'
related_targets:
  [
    'src/routes/(app)/+page.svelte',
    'src/routes/(app)/planner/+page.svelte',
    'src/routes/(app)/suggest/+page.svelte',
    'src/routes/(app)/pantry/+page.svelte',
    'src/routes/(auth)/sign-in/+page.svelte'
  ]
---

# Surface brief: Meal Planner app (all screens)

Scope: whole-app redesign — shell, Home (tonight), Planner, Suggest, Pantry, recipe drawer, variations, Profile, Admin, auth flows.
Visitor mode: **Operate.** Two people, one shared kitchen. Scenes: phone at the stove, laptop on Sunday, low-energy "what's for dinner?".
Keep: recipe drawer pattern (side sheet), streaming one-by-one suggestion reveal. Must not feel like a generic SaaS dashboard.
Binding: Skeleton UI + Tailwind v4 stay; light + dark mode stay. Build path: code-led (no image generation).

## Direction contract

THESIS: The shared plan lives where both people look every evening: a magnetic dry-erase week board on the fridge. Refuses the category default of a dashboard of rounded cards and stat tiles; the week is one ruled board, not seven cards.

OWN-WORLD: Gloss white laminate board inside a thin brushed-aluminium frame (dark mode: black glass board, liquid-chalk brights). Four marker inks as the only colour: black ink (text), blue (actions, nav), red (today, remove, errors), green (added/ready, AI suggestions). Ruled hairlines in printed board-grey. Pantry ingredients are magnetic-poetry word tiles. Suggestions and recipes are index cards held by a round magnet. Navigation is the marker tray along the frame. Printed parts set in Atkinson Hyperlegible Next; anything "written" (day names, Tonight, notes) in Shantell Sans, never body or recipe text.

STORY: Open the app and tonight's dinner is already answered, circled in red on the week. Tap it to cook from a large-type recipe sheet. If a day is blank, pull suggestions from the pantry magnets and stick one onto the board.

FIRST VIEWPORT: Home. Top band: "Tonight" in marker, the dinner name in printed type at ~40-56px, prep minutes, primary "Open recipe" (blue). Directly below: the Mon–Sun ruled board, one row per day, day name in marker in a left column, dish name, prep minutes right-aligned tabular; today's row ringed by a hand-drawn red marker ellipse. Empty rows show a faint ghost "write one in". Mobile: same order, marker-tray nav fixed along the bottom.

FORM: Fridge Week Board — my rank 1 of 7 grounded list (IMPECCABLE'S PICK, chosen by user over assigned Enamelware). Seed key f1f9b83c. Signature interaction: the red marker ring draws itself around today (stroke-dashoffset), and a suggestion added to the plan "sticks" onto its row with a magnet snap. Motion grammar: things are placed, not floated: short drop + 1-step settle, no fades-from-nowhere; reduced-motion = instant.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Kept disciplines from the declined hand

- Packed whole-cell grid for pantry tiles (from the event catalog).
- Right-aligned tabular prep-minute column wherever meals list (from the j-card).
- State by form not hue: empty = ghost ruled line, planned = written, past days = faded ink (from the emission rail).

## Unresolved

- Home gains a server load of this week's plan to show Tonight (new data on an existing service; no schema change).
