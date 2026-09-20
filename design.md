# Design System & Aesthetic Guidelines

## Overview

This document outlines the new design system for anantvijay.com, extracted from the reference
visual `image_b6753d.jpg`. The design bridges an industrial, highly structured aesthetic with
the editorial nature of an essay-driven personal blog.

The core philosophy of this design relies on generous white space, stark typographic contrast,
and a minimal but punchy color palette.

---

## 1. Color Palette

The color scheme is directly extracted from `image_b6753d.jpg`, providing a warm but striking
contrast.

- **Background (Canvas): `#F6EBE0`** (Warm Cream/Beige)
  Usage: The global background color. No harsh white should be used.

- **Text (Primary): `#1C1917`** (Soft Black / Dark Gray)
  Usage: All body text, headings, and inactive links. Softer than `#000000` to reduce eye
  strain on the cream background.

- **Accent (Brand): `#F05C22`** (Industrial Orange)
  Usage: Logo/Brand name and geometric bullet points. **See §1.1 — this hue is not
  legible enough for small text.**

### 1.1 Accent contrast addendum (two-tier orange)

`#F05C22` on `#F6EBE0` measures **2.86:1**. That fails WCAG 2.1 AA for body text (4.5:1) and
also fails the 3:1 floor for large text and non-text UI. Applying it to dates, breadcrumbs,
and navigation links — as the original extraction implied — would make the site's smallest
text its least legible.

The accent is therefore split into two tokens:

| Token | Hex | On cream | Permitted usage |
|---|---|---|---|
| `--accent` | `#F05C22` | 2.86:1 | Decorative marks (blockquote rule), and **one documented text exception: the active nav link**, by author decision (2026-09-20). It is always underlined as well, so it never relies on colour alone. No other text. |
| `--accent-ink` | `#B8431A` | **4.64:1** | All functional accent text: dates, breadcrumb current-page, active/hover nav, inline links. |

The two hues are close enough to read as one industrial orange; the distinction is legibility,
not branding. `tests/unit/tokens.test.js` asserts these ratios so the palette cannot regress.

### 1.2 Full token set — Light (default)

| Token | Hex | Role | Contrast on canvas |
|---|---|---|---|
| `--canvas` | `#F6EBE0` | Page background | — |
| `--ink` | `#1C1917` | Body text, headings | 14.89:1 |
| `--ink-muted` | `#57534E` | Snippets, captions, secondary meta | 6.50:1 |
| `--accent` | `#F05C22` | Brand wordmark, decorative marks | 2.86:1 (non-text only) |
| `--accent-ink` | `#B8431A` | Dates, breadcrumbs, links, active nav | 4.64:1 |
| `--rule` | `#DCCFC2` | Hairlines, dividers, list-row separators | — |

### 1.3 Full token set — Dark

The site ships a dark-mode toggle on every page. The dark palette inverts the canvas/ink
relationship rather than introducing new hues: the light mode's ink becomes the dark mode's
canvas, and its canvas becomes the ink. This keeps the warm, printed-journal character
instead of drifting to a cold grey.

| Token | Hex | Role | Contrast on dark canvas |
|---|---|---|---|
| `--canvas` | `#1C1917` | Page background (the light-mode ink) | — |
| `--canvas-raised` | `#262220` | Subtle elevated surfaces | — |
| `--ink` | `#F6EBE0` | Body text, headings (the light-mode canvas) | 14.89:1 |
| `--ink-muted` | `#A8A29D` | Snippets, captions, secondary meta | 6.93:1 |
| `--accent` | `#FF7A45` | Brand wordmark, decorative marks | 6.76:1 |
| `--accent-ink` | `#FF7A45` | Dates, breadcrumbs, links, active nav | 6.76:1 |
| `--rule` | `#3A3431` | Hairlines, dividers | — |

Note that dark mode needs no two-tier split: the orange is lifted to `#FF7A45`, which clears
AA for normal text at 6.76:1, so `--accent` and `--accent-ink` collapse to one value. The
two-tier complexity exists only because cream is a light canvas.

Theme is applied via `data-theme="dark"` on `<html>` (set by an inline head script before
first paint, so there is no flash of the wrong theme) and persisted in `localStorage`.

---

## 2. Typography

The typography stack relies entirely on the interplay between a modern geometric sans-serif
and a classic serif.

**Font stack:** `--font-display: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;`
**Font stack:** `--font-body: Georgia, "Times New Roman", serif;`

> The original spec gave a single stack, `"Space Grotesk", "Georgia", serif`. That cannot
> express the intended interplay — a single stack means Georgia is only ever a *fallback* for
> Space Grotesk, never a deliberate choice for body copy. Two stacks are required to put
> display type and reading type on different faces.

### Primary Display (Space Grotesk)

- Usage: Site logo, main navigation, breadcrumbs, H1/H2 headers, dates, and UI labels.
- Styling: Often `text-transform: uppercase` with bold weights (700) for massive headers.
- Letter spacing: slight tracking (`0.05em`) on uppercase Space Grotesk for clarity.

### Body Copy & Reading (Georgia)

- Usage: Essay snippets, full essay body text, and descriptive paragraphs.
- Styling: Regular weight (400) with a tall line-height (1.6–1.8) for extended reading.

### Type scale

| Role | Face | Size | Weight | Transform |
|---|---|---|---|---|
| H1 (essay title; hidden on section pages) | Display | `clamp(1.25rem, 3.5vw, 2.5rem)` | 700 | uppercase |
| H2 (in-essay) | Display | `clamp(1.5rem, 3vw, 2rem)` | 700 | none |
| H3 (in-essay) | Display | `1.25rem` | 700 | none |
| Nav link | Display | `0.875rem` | 500 | uppercase, `0.05em` |
| Breadcrumb | Display | `0.75rem` | 500 | uppercase, `0.05em` |
| Date / meta | Display | `0.75rem` | 500 | uppercase, `0.05em` |
| List title | Display | `1.25rem` | 700 | none |
| List date | Display | `1rem` | 500 | uppercase, `0.05em` |
| Essay body | Body | `1.125rem` | 400 | none, `line-height: 1.75` |
| List snippet | Body | `1rem` | 400 | none, `line-height: 1.7` |

The essay H1 is `clamp(1.25rem, 3.5vw, 2.5rem)` — half the original `clamp(2.5rem, 7vw, 5rem)`
at every viewport, settled on 2026-09-20 after trying fixed 1.2rem and 1.25rem. Fluid sizing
keeps it from overflowing a 375px phone while still reading as a headline on desktop.

---

## 3. Generous White Space (Spacing System)

White space is a structural element, not an afterthought.

- **Container width:** one column, **`84ch` wide (`--container-max: var(--measure)`)**,
  centred, with `5vw` side padding on small screens. Header, hero, list and article all share
  it and sit flush-left inside it.

  > The original spec said `1200px`. With left-aligned content only ~68ch wide, a 1200px
  > container piles all the leftover width on the right, so the margins looked unequal
  > (author feedback, 2026-09-20). Making the container the reading column gives equal
  > margins on every page without centring the text.
- **Macro spacing:** 120px–160px of vertical space between major sections (e.g. between the
  hero header and the essay list).
- **Micro spacing:** minimum 24px–32px below headers before paragraph text begins.
- **Line height:** body paragraphs (Georgia) get generous leading for long-form reading.

### Spacing tokens

| Token | Value | Use |
|---|---|---|
| `--space-3xs` | `0.5rem` | Icon/text gaps |
| `--space-2xs` | `0.75rem` | Tight meta stacking |
| `--space-xs` | `1rem` | Within-component |
| `--space-sm` | `1.5rem` | Paragraph rhythm |
| `--space-md` | `2rem` | Header → body (§3 micro spacing) |
| `--space-lg` | `3rem` | Large component gaps |
| `--space-xl` | `5rem` | Sub-section breaks |
| `--space-2xl` | `7.5rem` | Macro section breaks (120px) |
| `--space-3xl` | `10rem` | Macro section breaks (160px) |

Macro spacing scales down on small viewports (`--space-2xl` → `4rem` below 768px); 120px of
dead space on a phone reads as a broken page, not a premium one.

---

## 4. Components & UI Elements

### Navigation & Header

- **Layout:** one left-aligned row. No separate brand slot.
- **Links, in order:** "ESSAYS", "QUOTES", "SOFTWARE", "TIME", "ANANT VIJAY" (→ `about.html`).
  Space Grotesk, `0.875rem`, uppercase, `0.05em` tracking.
- **States:** inactive `--ink`; hover `--accent-ink`; **active `--accent` with a 2px underline**
  and `aria-current="page"`. The underline is not decoration — it is the non-colour indicator
  that makes the below-AA accent acceptable on the active label.
- **Mobile:** the five links wrap naturally; no icon substitution.

> The header was first built as brand-left / links-right with "ANANT VIJAY" as an
> always-orange wordmark (2026-09-20), then changed the same day by the author to a single row
> with Anant Vijay as the fifth link and the brand orange moved to the active state.

### Breadcrumbs

- **Format:** `ANANT VIJAY > ESSAYS > GOOD FRICTION`
- **Styling:** Space Grotesk, 12px, uppercase, `0.05em` tracking. Separators are `--ink-muted`;
  the current (last) page is `--accent-ink`.
- **Markup:** `<nav aria-label="Breadcrumb"><ol>…</ol></nav>` with the current crumb carrying
  `aria-current="page"`. Separators are CSS pseudo-elements so they are not read aloud.

### Typography Hierarchy (the "Hero" section)

- **Section pages (Essays, Quotes, Software, Time, About) have no visible page title.** The
  60ch intro paragraph in Georgia leads the page. An `<h1>` remains in the markup, visually
  hidden, so the document outline is intact for screen readers and search.
- **Essay pages** keep a visible H1: Space Grotesk, bold, uppercase, left-aligned, at
  `clamp(1.25rem, 3.5vw, 2.5rem)` — it is the essay's title, not a section label.

> Visible section titles were implemented first and removed the same day by the author's
> preference (2026-09-20); the nav already names the section.

### Essay list

The essays are a single-column, reverse-chronological list — one row per essay.

> A 3-column card grid was implemented first (2026-09-20) and reverted the same day by the
> author's preference: for a small number of long-form essays, a list reads better than cards.

- **Row anatomy:** a fixed date gutter on the left, then title and snippet stacked on the right.
  Rows are separated by `--space-lg` of white space; no rules between them.
- **Date:** Display, `1rem`, uppercase, `--accent-ink`, **left-aligned** in a fixed `8rem`
  gutter (e.g. "JUN 02, 2026"). Left, not right, so the date text sits on the same left edge
  as the nav and the intro; the fixed gutter still keeps every title on one column.
- **Title:** Display, `1.25rem`, bold, `--ink`; `--accent-ink` on hover.
- **Snippet:** Georgia, `1rem`, `--ink-muted`. The text column is capped at the reading measure
  so snippets never stretch across the 1200px container.
- **Below 768px** the row stacks: date above title, both left-aligned.
- **Alignment:** the date and title share a baseline, so the two type sizes sit on one line.

---

## 5. Application to anantvijay.com

The site is heavily focused on long-form content. This scheme turns it into a "technical
editorial" experience.

### The Index Page

- No visible title (hidden H1 "Essays" for outline); the intro paragraph at `60ch` leads.
- Essays as the single-column list: date gutter, title, snippet, hairlines between rows.

### The Essay Reading Page

- Breadcrumb component at the very top: `ANANT VIJAY > ESSAYS > MOMENTUM > MOTIVATION`.
- Essay title in bold, uppercase Space Grotesk, sized to sit above the text rather than dominate it.
- Body in Georgia. Because the canvas is cream rather than stark white, reading 1,500+ words
  feels like reading a printed journal, enhancing the philosophical tone.

**Reading measure:** `84ch` — widened from 68 → 74 → 84 by the author on 2026-09-20; above the
textbook 45–75ch but a deliberate choice — and since 2026-09-20 the container itself is that width, so the
header, the intro, the list and the article all share one column and one left edge.

---

## 6. Migration Notes

Decisions made while applying this system to the existing codebase:

1. **Header.** The old header had five centred links including "Anant Vijay" → `about.html`.
   It is now five left-aligned links with the same destinations; the brand orange marks the
   active one. (A brand-left / links-right variant existed briefly on 2026-09-20.)
2. **Class namespacing.** The old CSS overloaded `.essay-date` and `.essay-content` for both
   the index list and the article body. These are split into `.essay-list__*` and
   `.essay-article__*` so restyling a card cannot silently restyle 17 essay bodies.
3. **Mobile icon-nav retired.** The old stylesheet hid nav text below 600px and showed
   `icons/*.svg` glyphs, animating the label of the active item. The split header with
   wrapping text labels replaces it. The icon files remain in `icons/` (still used by the
   quote actions and essay footer links).
4. **Theme flash fixed.** The old inline head script set `.dark-mode` on
   `document.documentElement` while the CSS only ever matched `body.dark-mode`, so it never
   suppressed the flash. The new implementation uses `data-theme` on `<html>`, which the
   inline script can set before first paint.
5. **`finds.html`** remains an unstyled 10-line stub, unlinked from the nav. It is out of
   scope here and excluded from the checks; it is noted as pre-existing debt.

---

## 7. Reference

The source visual `image_b6753d.jpg` is not checked into this repository. This document is the
spec of record; where the two disagree, this document and its measured contrast ratios win.
