# Manual browser checks

## Why this file exists

The automated suite (`npm test`) runs without a browser, so it cannot see **layout**. It proves
what the pages *say* and what the CSS *declares*; it cannot prove what they *look like*.

This checklist covers the gap. Everything in it was a candidate for automation and was
deliberately left manual to keep the project at zero new dependencies — see `PLAN.md` §6 for the
full list of what that costs.

**Re-run the essay pass after any change to `css/styles.css` or either template.** Nothing
automated will catch a mobile-layout regression for you.

> If this becomes tedious, `@playwright/test` is a one-devDependency upgrade that automates this
> entire file. The checklist below doubles as its specification.

---

## Setup

```bash
npm start           # vite, http://localhost:5173
```

Open DevTools. Keep the **Console** panel visible for the whole pass — a silent 404 on a font or
icon is exactly what this catches and nothing else does.

Widths to test: **1440** (desktop), **768** (tablet), **375** (phone).

---

## Per-essay checklist

Run for **all 17 essays**. Record results in the matrix in `PLAN.md` §8.

| # | Check | Looking for |
|---|---|---|
| 1 | **Console is clean** | Zero errors, zero failed requests. A missing webfont or icon shows here. |
| 2 | **Canvas is cream** | `#F6EBE0`, not white. Check the page margins, not just the text column. |
| 3 | **Body copy is Georgia** | Serif, not a sans fallback. If it looks like Arial, the stack is broken. |
| 4 | **Headings are Space Grotesk** | Geometric sans. If it's Georgia, the webfont failed to load. |
| 5 | **H1 matches the title** | Same text as `data/essays.json`. |
| 6 | **Breadcrumb** | Reads `ANANT VIJAY > ESSAYS > <TITLE>`, last crumb in orange. |
| 7 | **Scroll the whole essay** | `h3`/`h4`, lists, blockquotes all styled — no browser-default artifacts mid-page. This is the one most likely to be missed. |
| 8 | **Images render** | Only essays 10 and 17. Broken-image icon = path regression. |
| 9 | **375px: no horizontal scrollbar** | The single most likely failure of this redesign. Resize and try to scroll sideways. |
| 10 | **Reading measure** | Roughly 45–85 characters per line at 1440px. Not the full 1200px container. |
| 11 | **Dark mode** | Toggle: palette flips. Navigate to another page: it persists. Reload: no white flash. |
| 12 | **Screenshot** | At 1440 and 375. |

---

## Per-page checklist (6 static pages)

Checks 1–4, 9, 11, 12 above, plus:

| Page | Additional |
|---|---|
| `index.html` | Hero H1 "ESSAYS"; subtext constrained (~60ch); **grid is 3 columns at 1440, 2 at 768, 1 at 375**; 17 cards; orange octagon bullet on each; dates readable. |
| `quotes.html` | Quotes render (loaded by JS — an empty list means `js/quotes.js` failed); left rule is no longer blue; copy and share buttons still work. |
| `software.html` | Focus app icon loads; links to the App Store and privacy policy work. |
| `time.html` | Activity list renders (JS-driven). |
| `about.html` | Social icons load and are visible against cream. |
| `software/focustodoprivacypolicy.html` | Headings and lists styled; reachable from `software.html`. |

`finds.html` is **excluded** — unstyled 10-line stub, out of scope (`PLAN.md` R7).

---

## Results log

Record every pass, including failures. A log that hides a failed check is worse than no log.

### 2026-09-20 — Phase 0 "before" pass (pre-redesign)

Establishes what the site looked like *before* any restyling, so later differences are
attributable rather than guesswork.

| | |
|---|---|
| Status | ⏭ **Skipped by decision** (2026-09-20) |
| Design state | Original (blue `#1877F2` accent, white canvas, centred 5-link nav) |
| Expected | Checks 2/3/4/6/10 will **fail by design** — the new palette and breadcrumbs do not exist yet. Record checks 1, 7, 8, 9, 11 as the true "before" state. |

Notes:

- Skipped: the golden content baseline (`tests/baseline/content.json`) covers content
  regressions far more strongly than a visual pass, and the visuals are being replaced wholesale,
  so a record of the old appearance had little value. The first real pass is Phase 3.
