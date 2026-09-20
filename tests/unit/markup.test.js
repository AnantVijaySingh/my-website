/**
 * Component markup (design.md §4–§5).
 *
 * Structural assertions on the generated and hand-maintained pages: the split
 * header, breadcrumbs, the hero, the essay grid, namespaced article classes, and
 * the theme mechanism. Everything here is checkable without a browser.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { ROOT, essays, staticPages, allPages, read } = require('../lib/pages');
const html = require('../lib/html');

const NAV_LINKS = [
    { text: 'Essays', file: 'index.html' },
    { text: 'Quotes', file: 'quotes.html' },
    { text: 'Software', file: 'software.html' },
    { text: 'Time', file: 'time.html' },
    { text: 'Anant Vijay', file: 'about.html' },
];

/** "../" for pages one directory down (essays/, software/). */
function prefixFor(relativePath) {
    return relativePath.includes('/') ? '../' : '';
}

/** Which nav link is current for a page. */
function activeFileFor(page) {
    if (page.essay) return 'index.html'; // essays belong to the Essays section
    if (page.relativePath.startsWith('software/')) return 'software.html';
    return page.relativePath;
}

// ─── Header: one left-aligned row of five links ─────────────────────────────

for (const page of allPages()) {
    test(`header: ${page.relativePath}`, () => {
        const doc = read(page.absolutePath);
        const header = html.extractElement(doc, 'header', 'site-header');
        assert.ok(header !== null, 'missing <header class="site-header">');

        const prefix = prefixFor(page.relativePath);

        // Exactly the five links, in order.
        const nav = html.extractElement(header, 'nav', 'site-nav');
        assert.ok(nav !== null, 'missing <nav class="site-nav">');
        const links = [...nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
            .map((m) => ({ attrs: m[1], text: html.text(m[2]) }));
        assert.deepEqual(
            links.map((l) => l.text),
            NAV_LINKS.map((l) => l.text),
            'nav links (text, in order)'
        );
        NAV_LINKS.forEach((expected, i) => {
            assert.ok(links[i].attrs.includes(`href="${prefix}${expected.file}"`),
                `${expected.text} must link to ${prefix}${expected.file}`);
        });

        // Exactly one active link, and it is the right one.
        const active = links.filter((l) => /\bclass="[^"]*\bactive\b/.test(l.attrs));
        const expectedActive = activeFileFor(page);
        assert.equal(active.length, 1, `expected exactly one active nav link, got ${active.length}`);
        assert.ok(active[0].attrs.includes(`href="${prefix}${expectedActive}"`),
            `active link should be ${expectedActive}`);
        assert.ok(/aria-current="page"/.test(active[0].attrs), 'active link needs aria-current="page"');

        // The icon-swap mobile nav is retired.
        assert.equal(html.countTags(header, 'img'), 0, 'no <img> in the header — icon nav is retired');
        assert.ok(!/nav-icon|nav-text/.test(header), 'nav-icon / nav-text classes are retired');

        // Priority+ overflow: every link carries a priority, Time collapses first,
        // and the "…" menu exists (empty and hidden until JS needs it).
        const priorities = links.map((l) => Number((/data-priority="(\d+)"/.exec(l.attrs) || [])[1]));
        assert.ok(priorities.every(Number.isFinite), 'every nav link needs data-priority');
        const timeIndex = NAV_LINKS.findIndex((l) => l.text === 'Time');
        assert.equal(Math.max(...priorities), priorities[timeIndex], 'Time must be the first link to collapse');
        assert.match(nav, /<button[^>]*class="site-nav__more-button"[^>]*aria-expanded="false"/, 'more button');
        assert.match(nav, /<ul class="site-nav__more-menu"[^>]*hidden><\/ul>/, 'more menu starts empty and hidden');
        assert.ok(doc.includes(`<script src="${prefix}js/nav.js"></script>`), 'page must load js/nav.js');
    });
}

// ─── No breadcrumbs (removed by author decision, 2026-09-20) ────────────────

test('no page carries breadcrumbs', () => {
    for (const page of allPages()) {
        assert.ok(!/aria-label="Breadcrumb"/.test(read(page.absolutePath)), `${page.relativePath} still has breadcrumbs`);
    }
});

// ─── Essay article: namespaced, collision-free (PLAN.md R1) ────────────────

for (const essay of essays()) {
    test(`article structure: ${essay.slug}`, () => {
        const doc = read(essay.absolutePath);
        const article = html.extractElement(doc, 'article', 'essay-article');
        assert.ok(article !== null, 'missing <article class="essay-article">');
        assert.ok(html.extractElement(article, 'section', 'essay-article__body') !== null,
            'missing <section class="essay-article__body">');
        assert.ok(/class="[^"]*\bessay-article__date\b/.test(article), 'missing .essay-article__date');
        assert.equal(html.countTags(article, 'h1'), 1);

        // The old overloaded names must be gone from essay pages entirely.
        const classes = html.classNames(doc);
        for (const legacy of ['essay-content', 'essay-date', 'essay-container', 'essay-actions']) {
            assert.ok(!classes.has(legacy), `legacy class .${legacy} still present`);
        }
    });
}

// ─── Index: hero + grid ─────────────────────────────────────────────────────

test('index: hero intro leads, with the H1 present but visually hidden', () => {
    const doc = read(path.join(ROOT, 'index.html'));
    const hero = html.extractElement(doc, 'section', 'hero');
    assert.ok(hero !== null, 'missing <section class="hero">');
    const h1 = /<h1\b[^>]*class="([^"]*\bhero__title\b[^"]*)"[^>]*>([\s\S]*?)<\/h1>/i.exec(hero);
    assert.ok(h1, 'missing <h1 class="hero__title">');
    assert.equal(html.text(h1[2]).toLowerCase(), 'essays');
    const intro = html.extractElement(hero, 'p', 'hero__intro');
    assert.ok(intro !== null, 'missing <p class="hero__intro">');
    assert.match(html.text(intro), /^I write about what I've learned/, 'intro copy must be preserved');
    assert.equal(html.countTags(doc, 'h1'), 1, 'index must have exactly one <h1>');
});

test('index: list of 17 essays with date, title and snippet', () => {
    const doc = read(path.join(ROOT, 'index.html'));
    const list = html.extractElement(doc, 'ul', 'essay-list') ?? html.extractElement(doc, 'ol', 'essay-list');
    assert.ok(list !== null, 'missing .essay-list');

    const items = [...list.matchAll(/<li\b[^>]*class="[^"]*\bessay-list__item\b[^"]*"[^>]*>/gi)];
    assert.equal(items.length, essays().length, `expected ${essays().length} .essay-list__item, got ${items.length}`);

    const count = (cls) => (list.match(new RegExp(`class="[^"]*\\b${cls}\\b`, 'g')) || []).length;
    assert.equal(count('essay-list__date'), essays().length, '.essay-list__date per row');
    assert.equal(count('essay-list__body'), essays().length, '.essay-list__body per row');
    assert.equal(count('essay-list__title'), essays().length, '.essay-list__title per row');
    assert.equal(count('essay-list__snippet'), essays().length, '.essay-list__snippet per row');

    const esc = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const essay of essays()) {
        const re = new RegExp(`<a\\b[^>]*href="${esc(essay.relativePath)}"[^>]*class="[^"]*\\bessay-list__title\\b`);
        const reAlt = new RegExp(`<a\\b[^>]*class="[^"]*\\bessay-list__title\\b[^"]*"[^>]*href="${esc(essay.relativePath)}"`);
        assert.ok(re.test(list) || reAlt.test(list), `no .essay-list__title link to ${essay.relativePath}`);
    }

    // Dates come before the title in source order, in the uppercase short form.
    const dates = [...list.matchAll(/class="[^"]*\bessay-list__date\b[^"]*"[^>]*>([\s\S]*?)</g)].map((m) => m[1].trim());
    for (const d of dates) assert.match(d, /^[A-Z]{3} \d{2}, \d{4}$/, `date "${d}" not in MMM DD, YYYY form`);

    const classes = html.classNames(doc);
    for (const legacy of ['essay-item', 'essay-content', 'essay-title', 'essay-snippet', 'essay-intro',
        'essay-grid', 'essay-card', 'essay-card__title', 'essay-card__date', 'essay-card__snippet']) {
        assert.ok(!classes.has(legacy), `retired class .${legacy} still on index`);
    }
});

// ─── Theme mechanism (PLAN.md R3) ───────────────────────────────────────────

test('theme: every page sets data-theme before first paint, and nothing references .dark-mode', () => {
    const offenders = [];
    for (const page of allPages()) {
        const doc = read(page.absolutePath);
        if (!/documentElement\.(dataset\.theme|setAttribute\(\s*['"]data-theme['"])/.test(doc)) {
            offenders.push(`${page.relativePath}: inline head script must set data-theme on <html>`);
        }
        if (/dark-mode/.test(doc)) offenders.push(`${page.relativePath}: still references "dark-mode"`);
    }
    for (const rel of ['js/toggle.js', 'ts/toggle.ts']) {
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
        if (/dark-mode/.test(src)) offenders.push(`${rel}: still references "dark-mode"`);
        if (!/data-theme|dataset\.theme/.test(src)) offenders.push(`${rel}: must drive data-theme`);
    }
    assert.deepEqual(offenders, [], offenders.join('\n'));
});

test('every page loads Space Grotesk and the shared stylesheet', () => {
    for (const page of allPages()) {
        const doc = read(page.absolutePath);
        const prefix = prefixFor(page.relativePath);
        assert.ok(doc.includes('fonts.googleapis.com/css2?family=Space+Grotesk'), `${page.relativePath}: webfont link`);
        assert.ok(doc.includes(`href="${prefix}css/styles.css"`), `${page.relativePath}: stylesheet link`);
        assert.ok(/<meta name="viewport" content="width=device-width, initial-scale=1(\.0)?">/.test(doc),
            `${page.relativePath}: viewport meta`);
    }
});

test('templates carry the same header contract as the generated output', () => {
    for (const rel of ['templates/index-template.html', 'templates/essay-template.html']) {
        const tpl = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
        assert.ok(/class="site-header"/.test(tpl), `${rel}: site-header`);
        assert.ok(/class="site-nav"/.test(tpl), `${rel}: site-nav`);
    }
});

// Keep staticPages referenced so the list is exercised even if allPages changes.
test('static page list is intact', () => {
    assert.equal(staticPages().length, 6);
});
