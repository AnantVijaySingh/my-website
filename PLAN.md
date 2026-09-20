# Redesign — Plan & Progress Tracker

Applying `design.md` to anantvijay.com without breaking anything.
**This file is the single source of truth for both the plan and its progress.**

- Spec of record: **`design.md`**
- Manual browser results: **`tests/MANUAL-CHECKS.md`** (created in Phase 0)

**How to use this file:** tick boxes as work lands. Every phase has a **Gate** that must pass
before the next phase starts. Append a dated line to the Progress Log (§11) at the end of each
phase. Never tick a box that a test didn't actually prove.

Status key: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## 1. Status dashboard

| # | Phase | Status | Visual change? | Manual pass required |
|---|---|---|---|---|
| 0 | Safety net + baseline capture | `[x]` | No | Yes (records "before") |
| 0b | Pre-existing bug fixes (§3) | `[x]` | Homepage order only | No |
| 1 | Failing design tests (red) | `[x]` | No | No |
| 2 | Token layer + base styles | `[ ]` | Yes | No |
| 3 | Split header | `[ ]` | Yes | Yes |
| 4 | Breadcrumbs | `[ ]` | Yes | Yes |
| 5 | Index hero + 3-column grid | `[ ]` | Yes | Yes |
| 6 | Essay reading page | `[ ]` | Yes | **Yes — all 17 essays** |
| 7 | Remaining pages | `[ ]` | Yes | Yes |
| 8 | Dark palette | `[ ]` | Yes | Yes |
| 9 | Verify & document | `[ ]` | No | **Yes — all 23 pages** |
| 10 | Socket re-verification (quota permitting) | `[ ]` | No | No |

**Approach:** test-driven with **zero new dependencies**. Automated suite runs on Node's
built-in `node:test` plus `marked` (already a dependency). Rendering is verified by manually
opening every essay in a real browser.

---

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Accent contrast | Two-tier orange. `#F05C22` for brand wordmark + decorative bullets only; `#B8431A` (4.64:1) for all functional accent text. |
| Dark mode | Keep it; new dark palette authored into `design.md` §1.3. |
| Brand / About | Brand "ANANT VIJAY" links to `about.html`. Nav is ESSAYS / QUOTES / SOFTWARE / TIME. |
| Rollout | All pages in one pass. |
| Dependencies | **Zero new packages.** No Playwright, no cheerio, no jsdom. |
| Package installs | Go through the **Socket CLI** (`socket npm …`) for supply-chain scanning. |
| `package.json` | **Full cleanup** — see §2.1. |
| Dev server | Keep `vite` (`npm start`), as today. |
| Essay order | Sort by date descending in `index-generator.js` (§3.1). |
| Date handling | Fix malformed date, parse as UTC (§3.2). |

### 2.1 Dependency policy

The redesign adds **no packages**. The cleanup below is a response to "keep external
dependencies to a minimum" and is the one scope item outside the redesign proper.

| | Before | After |
|---|---|---|
| Declared direct deps | 106 | **1** (`marked`) |
| Declared devDeps | 5 | **2** (`typescript`, `vite`) |
| `npm install` tree | **177 packages** | **18** (1 in production) |

What was removed and why — each verified unreferenced before removal:

- **`browser-sync`, `browser-sync-client`, `browser-sync-ui`** — **146 of the 177 packages.**
  Referenced by no script, config, or source file; `npm start` has been vite for some time.
- **~100 misfiled transitives** (`ansi-regex`, `async`, `socket.io`, `ws`, `base64id`,
  `lodash`, …) — transitive deps of browser-sync/vite that were saved as *direct* dependencies.
  Still installed where genuinely needed, just no longer declared.
- **`@types/marked`** — redundant: `marked@15` bundles `./lib/marked.d.ts`, and no TypeScript
  source imports marked (the generators are plain JS outside `tsconfig`'s `rootDir`). The
  declared `^5.0.2` was also types for a long-superseded major.
- **`undici-types`** — unreferenced.

`marked@15.0.4` has **zero transitive dependencies**, which is why the build's only real
dependency costs exactly one package.

**Script changes:**

- Added `test` → `node --test "tests/unit/*.test.js"`, `test:baseline`, and `build:sitemap`
  (`generate-sitemap.js` existed with no script pointing at it).
- **Removed `build:essays:watch`.** It invoked `nodemon`, which was never declared in
  `package.json` — the script was already broken and only worked with a global nodemon.

---

## 3. Pre-existing bugs to fix — ✅ both approved

Both are **pre-existing bugs**, not things the redesign introduces. Both recommendations
approved 2026-09-20. Fixed in **Phase 0b**, after the baseline is captured.

### 3.1 The homepage is not actually in reverse-chronological order `[x]`

`For_AI.md` states essays are listed reverse-chronologically. They are not —
`index-generator.js` iterates `data/essays.json` in array order, and that array has **2
inversions**:

```
pos  9  Tale Of A Croissant              2024-02-1
pos 10  Linear, Compound & Exponential   2024-03-09   <- newer than the one above it
pos 11  Defining Growth                  2024-08-23   <- newer than the one above it
pos 12  Prioritization Via Questions…    2024-08-12
```

This is invisible enough in today's single-column list to have gone unnoticed, but the new
3-column grid makes reading order much more prominent.

**✅ Decided:** sort by date descending in `index-generator.js` (one line) and pin it with a
test. Fixes the stated intent permanently. **This changes the visible position of 3 essays** on
the homepage — the one deliberate content-order change in this project, recorded here so it is
never mistaken for a regression.

### 3.2 Date formatting is timezone-fragile `[x]`

Two related problems:

1. `"date": "2024-02-1"` for *Tale Of A Croissant* is malformed (should be `2024-02-01`). It
   only works because V8 falls back to non-standard parsing.
2. `formatDate()` uses `new Date("2026-06-02").toLocaleDateString(...)`. ISO date strings parse
   as **UTC midnight**, so on a build machine with a negative UTC offset the date renders **one
   day early**:

```
Build on BST (+01:00)  — your machine:  2026-06-02  ->  JUN 02, 2026   correct
Build on America/LA    (-07:00):        2026-06-02  ->  JUN 01, 2026   off by one
```

To be precise: this is **build-time**, not visitor-time — the date is baked into the HTML. Your
current output is correct because you build in BST. It is a latent risk, not a live bug. But
`design.md` promotes dates to a prominent card element, so it's worth closing.

**✅ Decided:** fix `"2024-02-1"` → `"2024-02-01"`, parse dates as UTC explicitly in both
generators, and add a test asserting all 17 dates are strict `YYYY-MM-DD` and render identically
under `TZ=America/Los_Angeles`. **No visible change on your machine** — this closes a latent
risk rather than fixing a live symptom.

---

## 4. Risk register

Found by surveying the code. Each is addressed in a specific phase.

| # | Risk | Phase | Status |
|---|---|---|---|
| R1 | **Class collisions.** `.essay-date` styles both the index date and the article date. `.essay-content` is both the index snippet wrapper (`index-generator.js:29`) and the essay body `<section>` (`essay-template.html:41`). Restyling a card silently restyles all 17 essay bodies. → namespace `.essay-card__*` / `.essay-article__*`. | 5, 6 | `[ ]` |
| R2 | **Essay body elements are unstyled.** Markdown uses `###` (26×), `####` (4×), blockquotes (2×), lists (9×). No CSS rules exist for these inside articles — they render as browser defaults. | 6 | `[ ]` |
| R3 | **Anti-flash script is a no-op.** Inline script sets `.dark-mode` on `documentElement`; CSS only matches `body.dark-mode`. Never suppressed the flash. → `data-theme` on `<html>`. | 8 | `[ ]` |
| R4 | **`Momentum->-Motivation.html` has a literal `>` in its filename**, emitted unencoded into hrefs. Works in browsers. **Do not rename** — breaks live URLs + sitemap. Pin with a test. Its title also contains `>`, so breadcrumbs must HTML-escape. | 4 | `[ ]` |
| R5 | **Two essays embed images** (`Linear-Compound-Exponential`, `Ahhhhhh-When-I-hear-Quick-Wins`) via `../images/…`. Path changes break them. | 6 | `[ ]` |
| R6 | **`index.html` is rebuilt wholesale** from its template. Hand-edits are lost on next build — all homepage changes go in the template. | 5 | `[ ]` |
| R7 | **`finds.html`** is an unstyled stub in `sitemap.xml` but not in the nav. Out of scope; excluded from checks. Pre-existing debt. | — | `[ ]` |

---

## 5. Test architecture (zero dependencies)

```
tests/
  lib/contrast.js          WCAG 2.1 ratio helper (~11 lines)
  lib/html.js              tag/attribute extraction for our own generated markup
  lib/css.js               declaration + media-query extraction from styles.css
  lib/pages.js             single source of truth: pages + 17 essays from data/essays.json
  capture-baseline.js      one-shot golden-content snapshot generator
  baseline/content.json    committed golden file (captured pre-redesign)
  unit/baseline.test.js    essay body content unchanged vs markdown source
  unit/build.test.js       generator correctness, placeholder leakage, idempotence, dates
  unit/links.test.js       every href/src resolves on disk
  unit/markup.test.js      breadcrumbs, single h1, 17 cards, required classes present
  unit/tokens.test.js      tokens present, contrast passes, legacy colors gone
  unit/coverage.test.js    every emitted class has a CSS rule, and vice versa
  MANUAL-CHECKS.md         browser checklist + recorded results per run
```

Run: `node --test tests/unit/`. No runner, no config, no install.

Regex HTML extraction is acceptable **only** because every parsed file is generated by templates
in this repo — not arbitrary HTML. It is also not the sole guard; the manual pass catches real
404s.

**Golden content baseline** — the strongest automated guarantee, no browser needed. Captured
*before* anything is restyled: each essay's body text (whitespace-normalised) with word and
paragraph counts, plus a full link/image inventory. `baseline.test.js` asserts each body's word
count stays **within 1% of `marked.parse()`** of its markdown source. Scoped to the article body
only — the nav is *supposed* to change, and gets its own expectations in `markup.test.js`.

**Compensating static checks** (partly substitute for a browser by pinning intent at the source):

- `coverage.test.js` cross-references classes emitted by templates/generators against selectors
  in `styles.css`. Catches *"the generator renamed a class but the CSS didn't"* — the most
  likely silent break — with no rendering.
- `tokens.test.js` asserts responsive grid declarations sit in the right media queries (3 cols
  ≥1024, 2 at 768–1023, 1 below), `h1` uses `clamp()`, article measure is in `ch`. Prevents the
  fixed-`5rem`-uppercase-H1 mistake that causes mobile overflow.
- Token discipline: no raw hex outside `:root` / `[data-theme="dark"]`; zero `#1877F2` /
  `#1e90ff` anywhere.

---

## 5.2 Class vocabulary (fixed by the Phase 1 tests)

| Component | Classes |
|---|---|
| Header | `.site-header` › `.site-brand` (→ about.html), `.site-nav` › `a.active` |
| Breadcrumbs | `nav.breadcrumbs[aria-label=Breadcrumb]` › `ol` › `li` ×3, last `[aria-current=page]` |
| Index hero | `section.hero` › `h1.hero__title`, `p.hero__intro` |
| Index grid | `.essay-grid` › `.essay-card` › `a.essay-card__title` (octagon via `::before`), `.essay-card__date`, `.essay-card__snippet` |
| Essay page | `article.essay-article` › `.essay-article__date`, `section.essay-article__body`, `.essay-article__actions` |
| Theme | `<html data-theme="dark">`; toggle keeps `.toggle-container .toggle .input .icon .icon--moon .icon--sun` |
| Retired | `.essay-item .essay-content .essay-date .essay-title .essay-snippet .essay-intro .essay-container .essay-actions .nav-icon .nav-text .dark-mode` |

---

## 6. What automation does NOT cover — read before approving

Zero deps means these are **one-time manual observations, not a regression net.** After any
future CSS edit, nothing automated will catch:

| Lost check | Consequence if it regresses |
|---|---|
| Horizontal overflow at 375px | Site breaks on phones; no test fails |
| Computed background / text color | A cascade mistake leaves an element on the old white canvas |
| Grid actually rendering 3/2/1 columns | Declaration present but overridden by later CSS |
| Console errors / failed requests | A missing font, stylesheet, or icon 404s unnoticed |
| Webfont actually loaded | Falls back to Arial; CSS still looks "correct" |
| `<img>` actually loading | Illustrated essays show broken images |
| Rendered reading measure | Line length drifts past the comfortable range |

`jsdom` would not close this gap — it implements **no layout engine**, so
`getBoundingClientRect()` returns zeros and `scrollWidth` doesn't exist. Inherent to not driving
a real browser.

**Mitigation:** `tests/MANUAL-CHECKS.md` is committed and ordered so a human can repeat the pass;
the README instructs re-running it after any CSS change. If it gets tedious,
`@playwright/test` remains a one-devDependency upgrade that automates this whole table — the
checklist doubles as its spec.

---

## 7. Phases

### Phase 0 — Safety net (no visual change) `[x]`
- [x] Socket CLI installed globally (`socket@1.1.176`) — global tooling, ships with nothing
- [x] `package.json` cleanup per §2.1 (106 → 1 direct dep; 18 packages installed, 1 in prod)
- [x] Socket auth verified; `marked@15.0.12` scored **Overall 88 / Vuln 100 / Supply Chain 99, zero deps**
- [~] Full-tree Socket scan — **quota exhausted, deferred to Phase 10**
- [x] `npm audit` → found **5 high-severity** advisories in the vite chain; fixed within
      existing semver ranges (vite 6.3.6 → 6.4.3). **0 vulnerabilities.**
- [x] Add `tests/lib/contrast.js`, `lib/html.js`, `lib/css.js`, `lib/pages.js`
- [x] Add `tests/capture-baseline.js`
- [x] **Captured `tests/baseline/content.json`** — 17 essays, 22,281 words
- [x] Write `baseline.test.js`, `build.test.js`, `links.test.js`
- [x] `npm test` green — **54 tests, 54 pass, 0 skip**
- [x] Create `tests/MANUAL-CHECKS.md`
- [~] "Before" browser pass — **skipped by decision** (2026-09-20). The golden content
      baseline covers content regressions far more strongly than eyeballing, and the visuals are
      being replaced wholesale, so a record of the old look had little value.

**Gate:** all green against the existing design; baseline committed. ✅ **54/54 passing.**

**Ordering constraint:** the baseline must be captured **before** Phase 0b, so the essay-order
change is a deliberate, recorded diff rather than an untraceable one.

### Phase 0b — Pre-existing bug fixes (§3) `[x]`
- [x] Fix `"2024-02-1"` → `"2024-02-01"` in `data/essays.json`
- [x] Parse dates as UTC in `index-generator.js` + `generate-pages.js`
- [x] Test: all 17 dates strict `YYYY-MM-DD`; output identical under `TZ=America/Los_Angeles`
- [x] Sort essays by date descending in `index-generator.js`
- [x] Test: rendered order is strictly non-increasing by date
- [x] Confirm essay *body* baseline is untouched (only homepage order changes)

**Gate:** date tests green; baseline diff limited to homepage card order. ✅ **60 tests, 0 fail.**

### Phase 1 — Failing design tests (red) `[x]`
- [x] `tokens.test.js` — token set, exact hex, contrast computed from the CSS, no legacy colors,
      no white canvas, token discipline, `clamp()` H1, `ch` measure, 1/2/3 grid, clip-path octagon
- [x] `markup.test.js` — split header on all 23 pages, breadcrumbs on all 17 essays, namespaced
      article, hero + 17-card grid, `data-theme` mechanism, template contract
- [x] `coverage.test.js` — class ↔ CSS cross-reference (both directions)
- [x] Split scripts: `test:guard` (never red) vs `test:design` (red until Phase 8)

**Gate:** new tests fail *for the right reasons*; Phase 0 tests stay green.
✅ **Design: 82 tests, 79 red, 3 legitimately green. Guard: 60/60.** Every failure message
names the missing thing (`:root is missing --canvas`, `missing <header class="site-header">`,
`no .essay-grid rule`) — none are test bugs.

**Already found by `coverage.test.js` on the current site:** `.quotes-intro`, `.time-intro`,
`.time-content` have **no CSS at all** (browser-default paragraphs) → Phase 7. Dead selectors
`.header-hidden`, `.activity-name` → Phase 9. `js/essays.js` is loaded by no page → flagged.

### Phase 2 — Token layer + base styles `[ ]`
- [ ] `:root` light tokens + `[data-theme="dark"]` dark tokens (`design.md` §1.2–1.3)
- [ ] Canvas, ink, two font stacks, container, spacing scale
- [ ] Replace blue accent throughout

**Gate:** `tokens.test.js` green.

### Phase 3 — Split header `[ ]`
- [ ] Brand-left / links-right markup
- [ ] Apply to `index-template.html` + `essay-template.html`
- [ ] Apply to `quotes.html`, `about.html`, `software.html`, `time.html`, privacy policy
- [ ] Brand → `about.html` in `--accent`; nav active state `--accent-ink`
- [ ] Retire mobile icon-nav
- [ ] Manual pass

**Gate:** header identical on all 23 pages; no page left on the old nav.

### Phase 4 — Breadcrumbs `[ ]`
- [ ] Add `{{breadcrumb-title}}` to `essay-template.html`
- [ ] Populate in `generate-pages.js` with **HTML-escaped** title (R4)
- [ ] Semantic `<nav aria-label="Breadcrumb"><ol>`, `aria-current="page"` on last crumb
- [ ] Test: `Momentum > Motivation` renders its `>` escaped
- [ ] Manual pass

**Gate:** all 17 essays show 3 correct crumbs; R4 test green.

### Phase 5 — Index hero + 3-column grid `[ ]`
- [ ] Hero in `index-template.html`: H1 "ESSAYS" + 60ch subtext
- [ ] Namespaced card markup in `index-generator.js` (R1, R6)
- [ ] Octagon bullet via CSS `clip-path` on `::before` — no new asset
- [ ] Responsive 3 / 2 / 1 columns
- [ ] Manual pass **at 1440 / 768 / 375**

**Gate:** 17 cards; grid confirmed by eye at three widths.

### Phase 6 — Essay reading page `[ ]`
- [ ] 68ch measure; Georgia 1.125rem / 1.75
- [ ] **Explicit rules for `h3`, `h4`, `blockquote`, `ul`, `ol`, `img`, `a`** (R2)
- [ ] Namespace article classes; remove collisions (R1)
- [ ] Verify the two illustrated essays (R5)
- [ ] **Manual pass over all 17 essays** — §8

**Gate:** §8 matrix fully ticked; baseline diff zero.

### Phase 7 — Remaining pages `[ ]`
- [ ] `quotes.html` — move quote rule off blue onto `--rule` / `--accent`
- [ ] `software.html`, `time.html`, `about.html`, privacy policy
- [ ] Manual pass — §9

### Phase 8 — Dark palette `[ ]`
- [ ] Implement `design.md` §1.3 tokens
- [ ] Rewrite `ts/toggle.ts` for `data-theme`; recompile with `tsc`
- [ ] Fix anti-flash script in both templates + all 5 static pages (R3)
- [ ] Manual pass: flip + persist across navigation + no flash on reload

### Phase 9 — Verify & document `[ ]`
- [ ] Full build; full suite; **content baseline diff zero**
- [ ] **Full manual pass over all 23 pages**, recorded in `MANUAL-CHECKS.md`
- [ ] Regenerate `sitemap.xml`
- [ ] **Rewrite README** — §10
- [ ] Delete dead CSS (`coverage.test.js` identifies it); confirm no `#1877F2` remains

### Phase 10 — Socket supply-chain re-verification (once quota resets) `[ ]`

Deferred from Phase 0: the free-tier quota ran out mid-install. Do this **last**, against the
final `package-lock.json`, so the scan covers exactly what ships rather than an intermediate
state.

- [ ] **Rotate the exposed token first.** The token used on 2026-09-20 was pasted into a chat
      transcript. Revoke it at socket.dev → Settings → API Tokens and issue a new one.
- [ ] `socket login` with the fresh token (persists to local CLI config; no env var, no
      transcript exposure)
- [ ] `socket npm ci` — one full-tree scan against the committed lockfile
- [ ] Record the result in §13 and note any alert accepted, with the reason
- [ ] Optional: `socket scan create` for a repo-level report; `socket optimize` to see whether
      `@socketregistry` offers hardened drop-in overrides for the vite chain

**Spend the quota smartly — this is the lesson from Phase 0:**

| Do | Avoid |
|---|---|
| **One** `socket npm ci` / `socket npm install` for the whole tree (~100 units) | `socket package score <pkg>` per package — each *deep* score costs quota and 4 lookups burned ~85 units, leaving too little for the install scan |
| Scan once, at the end, against the final lockfile | Re-scanning after every dependency touch |
| Check quota before starting a scan | Discovering exhaustion mid-install |

**Do not confuse this with `npm audit`.** They answer different questions and both are wanted:

- `npm audit` matched **known CVEs** — it caught 5 high-severity advisories in the vite chain
  (nanoid, picomatch, postcss, rollup, vite) that the lockfile had pinned below the patched
  versions. Fixed within existing semver ranges; **0 vulnerabilities** now.
- Socket looks for **supply-chain behaviour** — install scripts, obfuscated code, network
  access, typosquats, a maintainer takeover in a version no advisory exists for yet. That is
  the risk `npm audit` structurally cannot see, and the reason this phase exists.

- [ ] Add `npm audit` to the routine documented in the README alongside the Socket step

**Gate:** clean Socket scan of the final lockfile, or every alert explicitly accepted in writing.

---

## 8. Essay verification matrix

Per essay: console clean · cream canvas · Georgia body · H1 matches title · 3 crumbs ·
headings/lists/quotes styled · **no 375px overflow** · dark mode OK · screenshot.

| # | Essay | File | Phase 6 | Phase 9 |
|---|---|---|---|---|
| 1 | Good Friction | `Good-Friction.html` | `[ ]` | `[ ]` |
| 2 | Wisdom, A Lossy Compression | `Lossy-Compression.html` | `[ ]` | `[ ]` |
| 3 | Discounting Reality | `Discounting-Reality.html` | `[ ]` | `[ ]` |
| 4 | Focus, Progress, Success | `Focus-Progress-Success.html` | `[ ]` | `[ ]` |
| 5 | Momentum > Motivation ⚠️ R4 | `Momentum->-Motivation.html` | `[ ]` | `[ ]` |
| 6 | Everything Is a To-Do List | `Everything-Is-a-To-Do-List.html` | `[ ]` | `[ ]` |
| 7 | In The Age Of Abundance | `In-The-Age-Of-Abundance.html` | `[ ]` | `[ ]` |
| 8 | Consumption, Perception Of Learning And Production | `Consumption-Perception-Of-Learning-And-Production.html` | `[ ]` | `[ ]` |
| 9 | Tale Of A Croissant ⚠️ §3.2 | `Tale-Of-A-Croissant.html` | `[ ]` | `[ ]` |
| 10 | Linear, Compound & Exponential 🖼 R5 | `Linear-Compound-Exponential.html` | `[ ]` | `[ ]` |
| 11 | Defining Growth | `Defining-Growth.html` | `[ ]` | `[ ]` |
| 12 | Prioritization Via Questions, Not Formulas | `Prioritization-Via-Questions-Not-Formulas.html` | `[ ]` | `[ ]` |
| 13 | Decisions And Conviction | `Decisions-And-Conviction.html` | `[ ]` | `[ ]` |
| 14 | Consumption | `Consumption.html` | `[ ]` | `[ ]` |
| 15 | Hard Things Over Hard Work | `Hard-Things-Over-Hard-Work.html` | `[ ]` | `[ ]` |
| 16 | Hard Work | `Hard-Work.html` | `[ ]` | `[ ]` |
| 17 | Ahhhhhh - When I hear Quick Wins 🖼 R5 | `Ahhhhhh-When-I-hear-Quick-Wins.html` | `[ ]` | `[ ]` |

⚠️ = has a known data/markup quirk · 🖼 = contains an image

---

## 9. Page verification matrix

| Page | File | Phase 3 | Phase 7 | Phase 9 |
|---|---|---|---|---|
| Home / Essays | `index.html` | `[ ]` | `[ ]` | `[ ]` |
| Quotes | `quotes.html` | `[ ]` | `[ ]` | `[ ]` |
| Software | `software.html` | `[ ]` | `[ ]` | `[ ]` |
| Time | `time.html` | `[ ]` | `[ ]` | `[ ]` |
| About | `about.html` | `[ ]` | `[ ]` | `[ ]` |
| Privacy policy | `software/focustodoprivacypolicy.html` | `[ ]` | `[ ]` | `[ ]` |
| ~~Finds~~ | `finds.html` | — | — | — (R7, out of scope) |

---

## 10. README changes (required by the brief)

The README is stale — it documents `npm install marked` only and lists a `scripts` block that
no longer matches `package.json`. To be corrected and extended with:

- [ ] Accurate prerequisites and one-time setup
- [ ] Real script table: `start`, `build`, `build:essays`, `build:watch`, plus new `test`, `test:baseline`
- [ ] How to run the site locally, and on which port
- [ ] **How to run the tests** and how to read a failure
- [ ] **The manual browser checklist**: what it covers, when to re-run (after *any* CSS change), and the §6 warning that layout regressions are not caught automatically
- [ ] How to re-capture the content baseline — legitimate when adding an essay, masking a regression otherwise
- [ ] Design-system section pointing at `design.md` as spec of record; new CSS uses tokens, not raw hex

---

## 11. Non-goals

- No essay prose, titles, or snippets edited. No markdown touched.
- **No file renames** — URLs and sitemap stay stable (incl. `Momentum->-Motivation`).
- No build-tool migration; no CSS preprocessor or Tailwind.
- `finds.html` not built out.
- `For_AI.md` describes the old blue-line quote design; will be flagged stale, not rewritten.

---

## 12. Rollback

Each phase is a separate commit on a `redesign` branch. Reverting one phase is clean because
phases touch disjoint areas — except Phases 4/5, which both touch the generators and must be
reverted together with a rebuild.

---

## 13. Progress log

Append one dated entry per phase. Record failures too — a clean log that hides a failed check is
worse than no log.

| Date | Phase | What landed | Suite | Notes |
|---|---|---|---|---|
| 2026-09-20 | — | Survey, `design.md` authored, plan + tracker created | n/a | Decisions locked (§2). |
| 2026-09-20 | — | Found 2 pre-existing bugs (§3): homepage order inversions, timezone-fragile dates | n/a | Both fixes approved. |
| 2026-09-20 | 0 | Socket CLI installed; `package.json` cleaned per §2.1 — 106 → 1 direct dep, 177 → **18** packages installed (1 prod) | n/a | `browser-sync` (146 pkgs) verified unreferenced before removal. |
| 2026-09-20 | 0 | Socket scored `marked@15.0.12` clean (Vuln 100, zero deps). Full-tree scan **blocked: quota exhausted** → deferred to Phase 10 | n/a | Burned ~85 units on per-package deep scores before the install scan; see Phase 10 for the smarter order. |
| 2026-09-20 | 0 | `npm audit`: **5 high-severity** advisories in the vite chain (nanoid, picomatch, postcss, rollup, vite) — lockfile had pinned below patched versions. Fixed in-range, vite 6.3.6 → 6.4.3 | **0 vulnerabilities** | All dev-only; none ships to the site. `marked` was clean throughout. |
| 2026-09-20 | 0 | Test scaffolding + golden baseline: 17 essays, 22,281 words captured | **54 pass / 0 fail / 0 skip** | Build verified deterministic AND committed output current. Extractor cross-validated against an independent markdown grep (26 h3, 2 blockquotes — exact match). |
| 2026-09-20 | 0b | TDD: `dates.test.js` + `order.test.js` written first — **4 failed for the right reasons**. Fixed `2024-02-1`→`2024-02-01`; both generators now format dates in UTC; homepage sorted newest-first | **59 pass / 0 fail** (1 skip: reproducibility test stands down while generated files are uncommitted) | TZ bug was **17 of 18 pages**, worse than estimated. The one immune page was the malformed date — it parsed as *local* midnight. `essays/` byte-identical after fix (no visible change in BST). Only `index.html` changed: card order. |
| 2026-09-20 | 0/0b | **Committed** `618fe60` on branch `redesign` (branched from `main`) | **60 pass / 0 fail / 0 skip** | Clean tree un-skipped the reproducibility test: a true 60/60. |
| 2026-09-20 | 1 | `tokens.test.js` (18), `markup.test.js` (61), `coverage.test.js` (3) written; `test:guard` / `test:design` scripts added | **Guard 60/60. Design 3/82 (79 red, by design)** | Red for the right reasons — every message names the missing thing. Coverage test already surfaced 3 unstyled intro paragraphs on the live site and 2 dead selectors. |
