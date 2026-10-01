---
name: Meal Planner
description: A two-person household's dinner plan, kept on a magnetic dry-erase week board on the fridge.
colors:
  marker-blue: 'oklch(50% 0.18 262deg)'
  marker-green: 'oklch(48% 0.12 150deg)'
  marker-red: 'oklch(56% 0.21 27deg)'
  highlighter-yellow: 'oklch(92% 0.17 102deg)'
  door: 'oklch(93.5% 0.004 250deg)'
  board: 'oklch(98.6% 0.003 250deg)'
  card: 'oklch(100% 0 0deg)'
  frame: 'oklch(82% 0.008 250deg)'
  frame-lo: 'oklch(68% 0.01 252deg)'
  rule: 'oklch(89% 0.012 250deg)'
  rule-strong: 'oklch(80% 0.014 252deg)'
  ink: 'oklch(17.5% 0.006 260deg)'
  ink-soft: 'oklch(45% 0.015 260deg)'
  ink-faint: 'oklch(55% 0.015 258deg)'
  on-marker: 'oklch(99% 0 0deg)'
  door-dark: 'oklch(13% 0.004 260deg)'
  board-dark: 'oklch(17.5% 0.006 260deg)'
  card-dark: 'oklch(23% 0.007 260deg)'
  frame-dark: 'oklch(33% 0.008 260deg)'
  ink-dark: 'oklch(96% 0.004 250deg)'
  marker-blue-dark: 'oklch(78% 0.12 245deg)'
  marker-green-dark: 'oklch(82% 0.16 152deg)'
  marker-red-dark: 'oklch(74% 0.16 18deg)'
  on-marker-dark: 'oklch(16% 0.01 260deg)'
typography:
  display:
    fontFamily: "'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif"
    fontSize: '2.5rem (3.75rem from 640px)'
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: '-0.025em'
  headline:
    fontFamily: "'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif"
    fontSize: '2rem (2.5rem from 640px)'
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: '-0.025em'
  title:
    fontFamily: "'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif"
    fontSize: '1.3rem'
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: '-0.025em'
  dish:
    fontFamily: "'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif"
    fontSize: '1.075rem (1.2rem from 640px)'
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif"
    fontSize: '1.125rem'
    fontWeight: 400
    lineHeight: 1.625
  recipe-step:
    fontFamily: "'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif"
    fontSize: '1.1rem'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif"
    fontSize: '0.875rem'
    fontWeight: 600
    lineHeight: 1.43
    fontFeature: "'tnum' 1"
  marker:
    fontFamily: "'Shantell Sans', 'Atkinson Hyperlegible Next', system-ui, sans-serif"
    fontSize: '1.125rem-1.5rem'
    fontWeight: 600
    lineHeight: 1
    letterSpacing: '0'
rounded:
  tile: '2px'
  card: '3px'
  base: '6px'
  control: '8px'
  pill: '999px'
spacing:
  unit: '4px'
  board-gutter: '20px'
  board-gutter-wide: '40px'
  frame: '6px'
  row-min: '68px'
  row-min-wide: '76px'
  tap: '40px'
components:
  button-primary:
    backgroundColor: '{colors.marker-blue}'
    textColor: '{colors.on-marker}'
    rounded: '{rounded.control}'
    padding: '12px 24px'
    typography: '{typography.body}'
  button-primary-dark:
    backgroundColor: '{colors.marker-blue-dark}'
    textColor: '{colors.on-marker-dark}'
    rounded: '{rounded.control}'
  button-green:
    backgroundColor: '{colors.marker-green}'
    textColor: '{colors.on-marker}'
    rounded: '{rounded.control}'
  button-red:
    backgroundColor: '{colors.marker-red}'
    textColor: '{colors.on-marker}'
    rounded: '{rounded.control}'
  button-quiet:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: '12px 20px'
  button-text:
    backgroundColor: 'transparent'
    textColor: '{colors.marker-blue}'
  board:
    backgroundColor: '{colors.board}'
    rounded: '{rounded.base}'
  index-card:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.card}'
    padding: '24px 20px 20px'
  tile:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.tile}'
    padding: '4px 4px 4px 12px'
  magnet:
    backgroundColor: '{colors.marker-red}'
    rounded: '{rounded.pill}'
    size: '1.05rem'
  input:
    backgroundColor: '{colors.board}'
    textColor: '{colors.ink}'
    rounded: '{rounded.base}'
  nav-tray:
    backgroundColor: '{colors.frame}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
  week-row:
    backgroundColor: '{colors.board}'
    textColor: '{colors.ink}'
    height: '{spacing.row-min}'
---

# Design System: Meal Planner

## Overview

**Creative North Star: "The Fridge Week Board"**

The plan lives where both people already look every evening: a white laminate dry-erase board hung on the fridge door, inside a thin aluminium frame. The page background is the door, every screen's content sits on one board, and everything on that board is either printed (the ruled lines, labels, recipe text) or written on it in marker (day names, "Tonight", counts, short notes). Objects that can be taken off again, ingredients and suggestions, are magnets: word tiles and index cards held by a round magnet. In dark mode the same fridge becomes a black stainless door with a black glass board and liquid-chalk brights.

Density is calm and operational. The week is one ruled board with seven printed rows, not seven cards; sections on a screen are divided by printed hairlines, not boxed. Type is large because the recipe is read at arm's length while cooking. The finish is flat: solid laminate, a solid frame band, solid marker colours; depth comes only from the small physical shadow of things stuck onto the board.

**Key Characteristics:**

- One framed board per screen on a pale door; sections separated by printed rules.
- Four marker inks as the only colour: black ink, blue, red, green.
- Printed type in Atkinson Hyperlegible Next; written annotations in Shantell Sans.
- Removable things are magnets (word tiles, index cards, magnet buttons) with a small physical shadow and a slight hang-off-true tilt.
- Motion is placement: things drop on and settle; today's row is circled by a red marker stroke that draws itself.
- Flat materials: no gradients, bevels, or textures.

## Colors

Four marker inks on white laminate and grey aluminium; colour carries meaning, never decoration.

### Primary

- **Blue Marker** (marker-blue): actions and navigation. Filled magnet buttons, the current-section stroke under the nav, text links, caret, focus outline, the `uses` annotation on cards, step numerals in a recipe. In dark mode it becomes the brighter liquid-chalk blue (marker-blue-dark) with dark text on it (on-marker-dark).

### Secondary

- **Green Marker** (marker-green): added, ready, AI-generated. The "N ideas" count on Suggest, the variations button on a planned row, success alerts (Skeleton success maps to the green scale), active status in Admin.

### Tertiary

- **Red Marker** (marker-red): today, removal, errors, and the head rule of a card. The ring around today's row and today's day name, "Tonight," in the hero, erase and take-off hovers, error alerts (Skeleton error maps to the red scale), the 1.5px rule under an index card's header, under a recipe sheet's header and under table column heads, and the Ingredients / Method headings. The brand magnet in the header is red.

### Neutral

- **Fridge Door** (door / door-dark): the page background behind the board.
- **Board Laminate** (board / board-dark): the writing surface every screen sits on; also the field background.
- **Card Stock** (card / card-dark): index cards, word tiles, the recipe side sheet. Pure white in light mode so cards read as paper on laminate.
- **Aluminium Frame** (frame, frame-lo / frame-dark): the 6px frame ring around the board, the desktop nav rail on the frame's top edge, and the mobile tray bar (frame-lo is its top edge line).
- **Printed Rule** (rule, rule-strong): rule is the hairline between rows and list items; rule-strong separates major sections of a board and outlines quiet buttons.
- **Black Ink** (ink / ink-dark): all primary text.
- **Soft Ink** (ink-soft): descriptions, metadata, minute counts, dates.
- **Faint Ink** (ink-faint): idle erase icons, the ghost "write one in" line, "+N more", empty-state notes.
- **Highlighter Yellow** (highlighter-yellow): text selection only; the Skeleton warning scale is the same highlighter hue for the rare warning alert.

### Named Rules

**The Four Inks Rule.** Black, blue, red, green are the only hues in the interface. Blue acts, red marks today or removal, green means added or ready. Yellow is a highlighter for selection and warnings, never a fifth ink.

**The State By Form Rule.** A row's state is shown by how it is written, not by a fill colour: empty is a faint ghost line, planned is written in black ink, past days fade to 50% opacity, today is ringed in red.

## Typography

**Display Font:** Atkinson Hyperlegible Next (with system-ui, -apple-system, sans-serif)
**Body Font:** Atkinson Hyperlegible Next
**Label/Mono Font:** Shantell Sans for marker writing (with Atkinson Hyperlegible Next fallback), loaded at weights 400-700 with its bounce and informality axes left at their defaults

**Character:** Atkinson is the board's printed parts: plain, very legible, bold for anything you scan. Shantell Sans is the handwriting on top: the people's own notes. The contrast between printed and written is the whole typographic idea.

### Hierarchy

- **Display** (700, 2.5rem to 3.75rem, line-height 1.05, -0.025em): the Tonight hero on Home only, max ~18-20ch, with its marker word ("Tonight," / "tonight.") inline in red.
- **Headline** (700, 2rem to 2.5rem, line-height 1.25, -0.025em): page titles (Pantry, The week, Suggest, Profile, Admin, auth screens at 2rem). The recipe sheet title is 1.75rem to 2rem, line-height 1.15.
- **Title** (700, 1.3rem, line-height 1.375, -0.025em): index-card titles; section headings on a board are 1.25rem bold ("This week", "On the fridge").
- **Dish** (700, 1.075rem to 1.2rem, line-height 1.3): a dinner name on a week row, a button that opens the recipe.
- **Body** (400, 1.125rem, line-height 1.625): intro and description copy, 52-58ch. Recipe steps are 1.1rem at line-height 1.6, max 62ch, for arm's-length reading.
- **Label** (600, 0.875rem): metadata, minute counts, dates, table heads; numbers always tabular.
- **Marker** (Shantell Sans 600, 1.125rem to 1.5rem, line-height 1): day names, "Tonight", counts ("4 ideas", pantry count), recipe section headings, step numerals, short annotations ("uses", role words in Admin), empty-state notes. The wordmark is marker at 700, 1.35rem.

### Named Rules

**The Written vs Printed Rule.** Shantell Sans is only for things a person would write on the board: day names, Tonight, counts, short notes and section heads. Never for body copy, recipe text, buttons, form labels, or navigation.

**The Tabular Minutes Rule.** Every prep-minute value, date and count uses tabular numerals, and where meals are listed the minutes sit in their own right-aligned column.

## Layout

The page is the door; a single board is centred on it, max-width 72rem (`max-w-6xl`), with 24px side margin from 640px. Inside the board, content uses a 20px gutter on phones and 40px from 640px, with sections stacked full-width and divided by a 1px rule-strong line. Spacing runs on Tailwind's 4px unit; section padding is 32px top on phones, 48px from 640px.

The week is a four-column grid per row: day label | dish | minutes | actions (3.25rem / 1fr / auto / auto on phones; 8.5rem / 1fr / 4.5rem / auto from 640px), minimum row height 68px (76px from 640px), with a 1px rule between the day column and the dish. Rows are separated by printed hairlines (`.ruled`).

Breakpoints: 640px switches gutters, type sizes and the board's frame; 768px switches navigation from the bottom tray to the desktop rail. On phones the whole screen is the board: no side margins, no radius, only the frame's top rail shows, and the bottom tray is fixed with safe-area padding (the board gets 112px bottom padding to clear it).

Suggestion cards and pantry tiles are packed: tiles in a wrapping flow with 10px/12px gaps; cards stagger onto the board one after another.

### Named Rules

**The One Board Rule.** A screen is one board. Divide it with printed rules; never split the week or a page into a grid of rounded cards.

## Elevation & Depth

Hybrid but restrained: the board is flat laminate inside a solid frame ring; the only shadows belong to physical objects stuck onto it (magnets, magnet buttons, index cards, word tiles) and to the side sheet sliding over the door. All shadows are tinted with the shared shadow-ink hue (`hsl(225deg 12% 30% / a)` light, `hsl(230deg 30% 2% / a)` dark), short and downward. There are no glows, no gradients, no bevels.

### Shadow Vocabulary

- **Frame ring** (`box-shadow: 0 0 0 6px var(--frame), 0 18px 32px -18px hsl(var(--shadow-ink) / 0.45)`): the board's aluminium frame and its hang on the door. Phones: `0 -4px 0 0 var(--frame)`, the top rail only.
- **Magnet button rest** (`0 2px 4px -1px hsl(var(--shadow-ink) / 0.35)`), **pressed** (`0 1px 1px hsl(var(--shadow-ink) / 0.3)` with a 1px push down).
- **Magnet** (`0 2px 3px -0.5px hsl(var(--shadow-ink) / 0.45)`).
- **Index card** (`0 0 0 1px` rule at 70%, `0 1px 1px` at 0.16, `0 10px 18px -12px` at 0.5).
- **Word tile** (`0 0 0 1px var(--rule), 0 1px 1px` at 0.2, `0 3px 5px -2px` at 0.35).
- **Side sheet** (`-24px 0 48px -24px hsl(var(--shadow-ink) / 0.55)`).
- **Lifted while placing** (`0 18px 22px -12px` at 0.5): only the first frame of the stick animation.

### Named Rules

**The Stuck-On Rule.** Only things that are physically on the board cast a shadow, and it is short and downward. Panels, sections and the week itself are flat.

**The Flat Materials Rule.** Laminate, frame and card stock are solid colours. No gradients, bevels, radial highlights or brushed textures; the only gradient in the system is the loading "writing line".

## Shapes

Small, near-square corners that match real objects: word tiles 2px, index cards 3px, the board and fields 6px, buttons 8px, and round magnets, avatar and icon buttons at 999px. Borders are drawn as rules: 1px hairlines, 1.5px for outlines and red head rules (Skeleton default border width is 1.5px). Removable objects hang slightly off true: index cards rotate between -0.6deg and 0.7deg, pantry tiles by a per-word tilt, and the current-section nav stroke is a 3px marker line rotated about -1.2deg. Today's ring is a loose hand-drawn SVG path with a 2.4 round-capped stroke.

## Components

### Buttons

Magnets you press: solid marker colour, a small physical shadow, a 1px push when pressed.

- **Shape:** gently squared (8px).
- **Primary (`act`):** blue marker fill, near-white text (dark mode: chalk blue with dark text), 700 weight, 12px 24px at 1.125rem for the main action of a screen.
- **Green / Red:** same magnet in green (add, confirm) or red (destructive).
- **Hover / Active / Disabled:** hover brightens 7%; active translates 1px down and flattens the shadow; disabled is 55% opacity with a not-allowed cursor. Transitions 120ms on the expo ease.
- **Quiet (`act-quiet`):** drawn on the board: transparent, black ink, 600 weight, 1.5px inset rule-strong outline that darkens to ink on hover.
- **Text (`act-text`):** 600 weight with a 2px underline at 35% of the text colour, full colour on hover. Usually blue ink with a trailing arrow.
- **Icon buttons:** 40px square (row actions, 8px radius) or round (header controls, close); ink-soft, a 7% ink wash on hover. Erase icons idle in faint ink and turn red on hover.

### Chips (Word Tiles)

- **Style:** white card stock, 2px corners, hairline ring plus a small shadow, per-word tilt, ingredient in 600 weight 1.05rem with its amount in soft tabular ink and a 32px take-off button that turns red.
- **State:** a tile left out of a suggestion request drops flat (no tilt, 2px lower), 55% opacity, transparent with a rule-strong outline, word struck through.

### Cards / Containers

- **Corner Style:** 3px (index card), 6px (board).
- **Background:** card stock on board laminate.
- **Shadow Strategy:** Stuck-On (see Elevation).
- **Border:** a 1.5px red rule under the card's header, like the red head line of an index card. A round magnet (red, blue or green in rotation) sits centred on the top edge.
- **Internal Padding:** 20px sides, 24px top to the title. Dialogs are index cards too.

### Inputs / Fields

- **Style:** Skeleton `input`/`select` on the fridge theme: board background, 1.5px border, 6px radius, labels in 600 weight above; pantry fields are 1.125rem.
- **Focus:** the global 2.5px blue marker outline at 2px offset.
- **Error / Disabled:** errors are red ink below the field; disabled fields stay at full opacity with soft ink on a 4% ink wash so read-only values remain legible.

### Navigation

- **Desktop (768px+):** the marker tray on the frame's top rail: a frame-coloured strip with 8px top corners joined to the board, links in 600 weight with a 17px icon at 75% ink, the current one in full ink with a short blue marker stroke under it.
- **Phone:** a fixed four-slot tray bar in frame colour along the bottom, 22px icons over 0.75rem 700 labels; the current slot gets full ink, a blue icon and the blue stroke.
- **Header:** red magnet plus marker wordmark on the door; round icon controls and the user's initial on a blue magnet (2.25rem) to the right.

### Week Row (signature)

Day name in marker (three letters on phones) with the date in small soft ink below, a 1px rule to the dish, the dish as a bold underlinable button that opens the recipe, minutes right-aligned, then row actions. Empty days show a faint marker ghost "write one in" with a pencil, which turns blue on hover. Today's row is ringed by the red marker path that draws left to right in 760ms after a 260ms delay; a dinner just added sticks on with the 420ms drop-and-settle.

### Recipe Sheet

A side sheet of card stock sliding in from the right (380ms expo-out, 420px travel) over a door-tinted scrim, max width 36rem. Red head rule, close button, ruled ingredient list with checkable ticks and bold tabular quantities, Method steps with blue marker numerals, one full-width primary action in the footer.

### Loading

While suggestions are on their way, a marker note ("Writing up a few ideas…") and grey rounded writing lines that sweep from rule to rule-strong in 1.6s.

## Do's and Don'ts

### Do:

- **Do** put every screen's content on one `.board` and divide it with 1px rule-strong section lines and 1px rule hairlines between rows.
- **Do** use blue for anything that acts, red for today, erase and errors, green for added, ready and AI suggestions.
- **Do** set day names, Tonight, counts and short notes in Shantell Sans at 600; set everything else in Atkinson Hyperlegible Next.
- **Do** right-align prep minutes in their own tabular column wherever meals are listed.
- **Do** make removable things magnets: tiles and index cards with the small downward shadow and at most a 0.7deg tilt.
- **Do** animate placement as a drop and settle on the expo ease (`cubic-bezier(0.16, 1, 0.3, 1)`), and make every animation instant under reduced motion.
- **Do** keep tap targets at 40px or more and recipe text at 1.1rem or larger.

### Don't:

- **Don't** split the week, or any board section, into a grid of rounded stat cards.
- **Don't** add a fifth ink, decorative gradients, bevels, radial highlights or brushed-metal textures.
- **Don't** set body copy, recipe steps, buttons, form labels or navigation in Shantell Sans.
- **Don't** give flat surfaces (the board, sections, the nav rail) a drop shadow; only stuck-on objects and the side sheet cast one.
- **Don't** fade things in from nowhere; enter by dropping on or sliding in from an edge.
- **Don't** use faint ink for the only copy of text someone must read; it is for idle icons and secondary hints.
