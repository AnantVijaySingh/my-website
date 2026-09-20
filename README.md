# anantvijay.com

A static, essay-driven personal site. Plain HTML, CSS and a little TypeScript; two Node
scripts turn Markdown essays into pages. No framework, one runtime dependency.

- **Design system:** [`design.md`](design.md) is the spec of record.
- **Redesign plan & progress:** [`PLAN.md`](PLAN.md).
- **Manual browser checks:** [`tests/MANUAL-CHECKS.md`](tests/MANUAL-CHECKS.md).

---

## Quick start

```bash
npm install        # 18 packages; marked is the only runtime dependency
npm start          # dev server with hot reload → http://localhost:5173
npm test           # the whole test suite (no browser needed)
```

Prerequisite: [Node.js](https://nodejs.org/) **22 or newer** — `node --test` with a glob pattern needs 21+ (built on 26). Nothing else.

---

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Vite dev server at **http://localhost:5173**. CSS changes hot-swap without a reload; HTML and regenerated pages trigger a reload. |
| `npm run build` | Full build: compile TypeScript (`ts/` → `js/`), then regenerate `index.html` and `essays/*.html`. |
| `npm run build:essays` | Regenerate pages only, skipping the TypeScript step. Use this after editing an essay, `data/essays.json`, or a template. |
| `npm run build:watch` | Recompile TypeScript continuously. |
| `npm run build:sitemap` | Regenerate `sitemap.xml` from the HTML files on disk. Run after adding an essay. |
| `npm test` | Every test — the guard suite and the design suite. |
| `npm run test:guard` | The safety net only: content baseline, links, generator correctness, dates, ordering. **Must be green at every commit.** |
| `npm run test:design` | The design-system tests: tokens, contrast, markup contracts, class ↔ CSS coverage. |
| `npm run test:baseline` | Re-capture the golden content baseline. Read [Re-capturing the baseline](#re-capturing-the-baseline) first. |

The old `build:essays:watch` script is gone — it depended on `nodemon`, which was never a
declared dependency, so it only ever worked by accident.

---

## Project structure

```
├── essays-markdowns/      Essay sources (.md) — the only place essay text lives
├── essays/                Generated essay pages — do not edit by hand
├── index.html             Generated homepage — do not edit by hand
├── templates/
│   ├── index-template.html    Homepage template ({{essays}} placeholder)
│   └── essay-template.html    Essay page template ({{title}}, {{content}}, …)
├── data/
│   ├── essays.json        Essay metadata: filename, title, date, snippet
│   ├── quotes.json        Rendered by js/quotes.js on quotes.html
│   └── activities.json    Rendered by an inline script on time.html
├── css/styles.css         The whole stylesheet — tokens first, then components
├── ts/                    TypeScript sources (quotes, theme toggle); compiled to js/ by `tsc`
├── js/                    Compiled output — do not edit by hand
├── quotes.html, software.html, time.html, about.html
│                          Hand-maintained pages
├── software/focustodoprivacypolicy.html
├── index-generator.js     Builds index.html from essays.json + template
├── generate-pages.js      Builds essays/*.html from Markdown + template
├── generate-sitemap.js    Builds sitemap.xml
├── tests/                 See "Testing"
├── design.md              Design system spec
└── PLAN.md                Redesign plan and progress log
```

**Generated files are committed.** `index.html` and `essays/*.html` are checked in because the
site is deployed as plain static files. The test suite verifies the committed output matches
what the generators produce, so a template edit without a rebuild fails `npm test` rather than
shipping stale pages.

---

## Adding an essay

1. Write it as Markdown in `essays-markdowns/`, e.g. `My-Essay.md`. Headings inside the
   essay should start at `###` (the page's `<h1>` is the title).
2. Add an entry to `data/essays.json`:
   ```json
   {
     "filename": "My-Essay.md",
     "title": "My Essay",
     "date": "2026-09-20",
     "snippet": "One or two sentences shown in the homepage list."
   }
   ```
   - `date` must be strict `YYYY-MM-DD`. The tests reject anything else.
   - Order in the file does not matter — the homepage sorts by date, newest first.
   - Titles and snippets may contain `&`, `>`, quotes: the generators escape them.
3. Rebuild and check:
   ```bash
   npm run build:essays
   npm run test:baseline     # the new essay is now part of the golden content
   npm run build:sitemap
   npm test
   ```
4. Commit the Markdown, `essays.json`, the generated page, `index.html`, `sitemap.xml`
   and `tests/baseline/content.json` together.

Images go in `images/` and are referenced from Markdown as `../images/name.png`
(the path is relative to `essays/`).

---

## Testing

The suite runs on Node's built-in test runner. **No browser, no test framework, no extra
packages.** It is split in two so that "is anything broken?" and "is the design complete?"
are separate questions:

### `npm run test:guard` — the safety net

Must be green at every commit. It proves the site still *says* what it said:

- **Content baseline** — every essay body is byte-identical to `tests/baseline/content.json`,
  and its word count is within 1% of what its Markdown source produces. A truncated or
  duplicated essay fails here.
- **Links** — every internal `href` and `src` on all 23 pages resolves to a real file.
- **Generators** — every essay in `essays.json` has a source and a page, no `{{placeholder}}`
  leaks, and regenerating is byte-identical to what is committed.
- **Dates and order** — strict `YYYY-MM-DD`; output identical under different build
  timezones; homepage newest-first.

### `npm run test:design` — the design system

- **Tokens** — the palette in `css/styles.css` matches `design.md` exactly, and every
  functional text colour clears WCAG AA (4.5:1) on its canvas, **computed from the CSS**, so
  the doc cannot drift from the stylesheet.
- **Token discipline** — no raw hex outside `:root` / `[data-theme="dark"]`, no colour
  keywords, no legacy blue. A dark-mode rule may only invert a line icon; a colour that dark
  needs and light does not is a missing token, not an override.
- **Markup contracts** — the header on all 23 pages, breadcrumbs on all 17 essays,
  namespaced article classes, the hero and 17-row essay list, `data-theme` set before first paint.
- **Coverage** — every class the pages emit has a CSS rule, and every class selector matches
  something emitted. This is what catches "renamed the class in the generator, forgot the
  CSS" without a browser.

### Reading a failure

Every assertion names the thing that is wrong — a file, a selector, a token — and where. For
example:

```
✖ content preserved: Good-Friction
  Essay body text CHANGED for "Good-Friction".
    was 1358 words, now 1201
```

The build test regenerates pages, so if it fails your working tree may have changes; inspect
with `git diff` before deciding whether the generator or the committed output is wrong.

### What the tests do NOT check

There is no browser in the loop, so nothing automated sees **layout**. After any change to
`css/styles.css` or a template, run the checklist in
[`tests/MANUAL-CHECKS.md`](tests/MANUAL-CHECKS.md) in a real browser. In particular, nothing
automated will catch:

- horizontal overflow at phone width
- an element left on the wrong background by a cascade mistake
- the essay list not stacking date-above-title on phones
- a webfont or icon that 404s
- a broken image inside an essay

If that becomes tedious, `@playwright/test` is a one-dependency upgrade that automates the
whole checklist; the checklist doubles as its spec.

### Re-capturing the baseline

`npm run test:baseline` overwrites `tests/baseline/content.json` with whatever the pages
currently say. That is correct **after adding or deliberately editing an essay**. It is the
wrong response to a failing content test you did not expect — that failure is the whole point
of the baseline. Read the diff first.

---

## Design system

[`design.md`](design.md) is the spec: cream canvas, soft-black ink, a two-tier industrial
orange, Space Grotesk for display and Georgia for reading. Two rules keep it coherent:

1. **Colours are tokens.** New CSS uses `var(--canvas)`, `var(--ink)`, `var(--accent-ink)`,
   … never a hex value. The tests enforce this.
2. **`--accent` (`#F05C22`) is not for text.** It measures 2.86:1 on the cream. Functional
   accent text — dates, links — uses `--accent-ink` (`#B8431A`, 4.64:1). The one documented
   exception is the active nav link, which is also underlined. See `design.md` §1.1.

Theme is `data-theme="dark"` on `<html>`, applied by an inline script in each page's `<head>`
before first paint and persisted in `localStorage`. Because every colour is a token, dark mode
needs no per-component overrides.

---

## Dependencies

One runtime dependency (`marked`, zero transitive deps) and two dev dependencies (`typescript`,
`vite`). Keep it that way.

- Install new packages through the **Socket CLI** (`socket npm install <pkg>`) so they are
  scanned for supply-chain risk before they land. One full-tree `socket npm ci` against the
  final lockfile is worth more than scoring packages one at a time — deep scores cost quota.
- Run `npm audit` after any dependency change. It answers a different question (known CVEs)
  from Socket (supply-chain behaviour); both are wanted.

---

## Known debt

- `finds.html` is an unstyled 10-line stub, unlinked from the nav but present in the sitemap.
- `icons/{book,clock,pen-tool,terminal,user}.svg` (icon nav retired), `icons/{copy,share}.svg`
  (quote actions are text now) and `icons/favicon.svg` are unreferenced.
- `For_AI.md` describes the previous design.

---

## Credits

Icons from [Feather](https://feathericons.com/). Theme toggle adapted from
[Uiverse.io](https://uiverse.io/) by Creatlydev.
