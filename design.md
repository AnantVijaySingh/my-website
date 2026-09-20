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
| `--accent` | `#F05C22` | 2.86:1 | Brand wordmark only (WCAG exempts logotypes), and purely decorative geometric bullets. Never functional text. |
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
| `--rule` | `#DCCFC2` | Hairlines, dividers, card separators | — |

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
| H1 (page/essay title) | Display | `clamp(2.5rem, 7vw, 5rem)` | 700 | uppercase |
| H2 (in-essay) | Display | `clamp(1.5rem, 3vw, 2rem)` | 700 | none |
| H3 (in-essay) | Display | `1.25rem` | 700 | none |
| Brand wordmark | Display | `1.125rem` | 700 | uppercase, `0.08em` |
| Nav link | Display | `0.875rem` | 500 | uppercase, `0.05em` |
| Breadcrumb | Display | `0.75rem` | 500 | uppercase, `0.05em` |
| Date / meta | Display | `0.75rem` | 500 | uppercase, `0.05em` |
| Card title | Display | `1.125rem` | 700 | none |
| Essay body | Body | `1.125rem` | 400 | none, `line-height: 1.75` |
| Card snippet | Body | `0.9375rem` | 400 | none, `line-height: 1.7` |

`clamp()` is used on H1 so the "massive" 4–5rem display size is honoured on desktop without
overflowing a 375px phone — a fixed `5rem` uppercase title breaks small viewports.

---

## 3. Generous White Space (Spacing System)

White space is a structural element, not an afterthought.

- **Container width:** cap main content at `max-width: 1200px` with generous side padding
  (`padding: 0 5vw`) on larger screens. Reading measure for essay body copy is narrower —
  see §5.
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
| `--space-lg` | `3rem` | Grid gap |
| `--space-xl` | `5rem` | Sub-section breaks |
| `--space-2xl` | `7.5rem` | Macro section breaks (120px) |
| `--space-3xl` | `10rem` | Macro section breaks (160px) |

Macro spacing scales down on small viewports (`--space-2xl` → `4rem` below 768px); 120px of
dead space on a phone reads as a broken page, not a premium one.

---

## 4. Components & UI Elements

### Navigation & Header

- **Layout:** split. Brand name far left, links far right.
- **Brand:** "ANANT VIJAY" in Space Grotesk, bold, uppercase, `--accent`. Links to
  `about.html`.
- **Links:** "ESSAYS", "QUOTES", "SOFTWARE", "TIME". Space Grotesk, uppercase. Inactive is
  `--ink`; active/hover is `--accent-ink`.
- **Mobile:** below 600px the brand stays left and the links wrap to a second row, remaining
  text labels (the previous icon-swap behaviour is retired — see Migration Notes).

### Breadcrumbs

- **Format:** `ANANT VIJAY > ESSAYS > GOOD FRICTION`
- **Styling:** Space Grotesk, 12px, uppercase, `0.05em` tracking. Separators are `--ink-muted`;
  the current (last) page is `--accent-ink`.
- **Markup:** `<nav aria-label="Breadcrumb"><ol>…</ol></nav>` with the current crumb carrying
  `aria-current="page"`. Separators are CSS pseudo-elements so they are not read aloud.

### Typography Hierarchy (the "Hero" section)

- **H1 (page title):** massive, Space Grotesk, bold, uppercase, left-aligned.
- **Hero subtext:** brief intro constrained to `60ch` directly below the H1, in Georgia.

### Lists & Essay Grid (the 3-column layout)

The reference's 3-column services grid is repurposed for essay snippets.

- **The grid:** `grid-template-columns: repeat(3, 1fr)` with `gap: 3rem`.
  Responsive: 3 columns ≥1024px, 2 columns 768–1023px, 1 column <768px.
- **The bullet/icon:** orange geometric octagon to the left of the essay title. Implemented as
  a CSS `clip-path` polygon on a `::before` pseudo-element — no image asset, scales with type,
  inherits the accent token. Marked `aria-hidden` in effect since it is decorative.
- **Card structure:**
  - *Icon + title:* orange octagon alongside the essay title (Display, bold).
  - *Date:* Display, small, uppercase, `--accent-ink` (e.g. "JUN 02, 2026").
  - *Snippet:* Georgia, body size, first few lines of the essay.

---

## 5. Application to anantvijay.com

The site is heavily focused on long-form content. This scheme turns it into a "technical
editorial" experience.

### The Index Page

- Massive H1 for the word "ESSAYS".
- Hero subtext (the existing intro paragraph) at `60ch` below it.
- Essays in the 3-column grid: orange octagon bullet, title, date, snippet.

### The Essay Reading Page

- Breadcrumb component at the very top: `ANANT VIJAY > ESSAYS > MOMENTUM > MOTIVATION`.
- Essay title in the massive, bold Space Grotesk H1.
- Body in Georgia. Because the canvas is cream rather than stark white, reading 1,500+ words
  feels like reading a printed journal, enhancing the philosophical tone.

**Reading measure:** essay body copy is capped at `68ch`, not the 1200px container. 1200px of
Georgia at 18px is roughly 150 characters per line — far past the 45–75ch comfortable range,
which would undercut the long-form reading this design exists to serve. The 1200px container
governs the header and index grid; the article column is narrower and sits within it.

---

## 6. Migration Notes

Decisions made while applying this system to the existing codebase:

1. **Brand replaces the "Anant Vijay" nav link.** The old header had five centred links, one
   of which was "Anant Vijay" → `about.html`. The brand wordmark now occupies that role and
   links to `about.html`; the right-hand nav carries the four remaining sections.
2. **Class namespacing.** The old CSS overloaded `.essay-date` and `.essay-content` for both
   the index list and the article body. These are split into `.essay-card__*` and
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
