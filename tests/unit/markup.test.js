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
];

/** "../" for pages one directory down (essays/, software/). */
function prefixFor(relativePath) {
    return relativePath.includes('/') ? '../' : '';
}

/** Which nav link is current; null when the page is the brand's own (about.html). */
function activeFileFor(page) {
    if (page.essay) return 'index.html'; // essays belong to the Essays section
    if (page.relativePath.startsWith('software/')) return 'software.html';
    if (page.relativePath === 'about.html') return null;
    return page.relativePath;
}

// ─── Header: brand left, four links right ───────────────────────────────────

for (const page of allPages()) {
    test(`header: ${page.relativePath}`, () => {
        const doc = read(page.absolutePath);
        const header = html.extractElement(doc, 'header', 'site-header');
        assert.ok(header !== null, 'missing <header class="site-header">');

        const prefix = prefixFor(page.relativePath);

        // Brand → about.html, per the locked decision (PLAN.md §2).
        const brand = html.extractElement(header, 'a', 'site-brand');
        assert.ok(brand !== null, 'missing <a class="site-brand">');
        assert.equal(html.text(brand), 'Anant Vijay', 'brand text');
        const brandHref = new RegExp(`<a\\b[^>]*class="[^"]*\\bsite-brand\\b[^"]*"[^>]*href="${prefix}about\\.html"`);
        const brandHrefAlt = new RegExp(`<a\\b[^>]*href="${prefix}about\\.html"[^>]*class="[^"]*\\bsite-brand\\b`);
        assert.ok(brandHref.test(header) || brandHrefAlt.test(header), `brand must link to ${prefix}about.html`);

        // Exactly the four section links, in order.
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

        // Exactly one active link, and it is the right one — except on about.html,
        // which is the brand's own page: no section is active and the brand
        // carries aria-current instead.
        const active = links.filter((l) => /\bclass="[^"]*\bactive\b/.test(l.attrs));
        const expectedActive = activeFileFor(page);
        if (expectedActive === null) {
            assert.equal(active.length, 0, 'about.html must have no active section link');
            const brandTag = /<a\b[^>]*\bsite-brand\b[^>]*>/.exec(header)[0];
            assert.ok(/aria-current="page"/.test(brandTag), 'brand needs aria-current="page" on about.html');
        } else {
            assert.equal(active.length, 1, `expected exactly one active nav link, got ${active.length}`);
            assert.ok(active[0].attrs.includes(`href="${prefix}${expectedActive}"`),
                `active link should be ${expectedActive}`);
        }

        // The icon-swap mobile nav is retired.
        assert.equal(html.countTags(header, 'img'), 0, 'no <img> in the header — icon nav is retired');
        assert.ok(!/nav-icon|nav-text/.test(header), 'nav-icon / nav-text classes are retired');
    });
}

// ─── Breadcrumbs on every essay ─────────────────────────────────────────────

for (const essay of essays()) {
    test(`breadcrumbs: ${essay.slug}`, () => {
        const doc = read(essay.absolutePath);
        const crumbsNav = /<nav\b[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i.exec(doc);
        assert.ok(crumbsNav, 'missing <nav aria-label="Breadcrumb">');
        assert.ok(/class="[^"]*\bbreadcrumbs\b/.test(crumbsNav[0]), 'breadcrumb nav needs class="breadcrumbs"');

        const items = [...crumbsNav[1].matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi)]
            .map((m) => ({ attrs: m[1], inner: m[2], text: html.text(m[2]) }));
        assert.equal(items.length, 3, `expected 3 crumbs, got ${items.length}`);

        assert.equal(items[0].text, 'Anant Vijay');
        assert.ok(items[0].inner.includes('href="../about.html"'), 'first crumb → ../about.html');
        assert.equal(items[1].text, 'Essays');
        assert.ok(items[1].inner.includes('href="../index.html"'), 'second crumb → ../index.html');

        // Current page: plain text (no link), aria-current, and HTML-escaped —
        // "Momentum > Motivation" must not inject a raw ">" (PLAN.md R4).
        assert.equal(items[2].text, essay.title, 'last crumb must be the essay title');
        assert.ok(/aria-current="page"/.test(items[2].attrs), 'last crumb needs aria-current="page"');
        assert.equal(html.countTags(items[2].inner, 'a'), 0, 'current page must not be a link');
        if (essay.title.includes('>')) {
            assert.ok(items[2].inner.includes('&gt;'), 'title ">" must be escaped as &gt;');
        }
    });
}

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

test('index: hero has the massive H1 "Essays" and a constrained intro', () => {
    const doc = read(path.join(ROOT, 'index.html'));
    const hero = html.extractElement(doc, 'section', 'hero');
    assert.ok(hero !== null, 'missing <section class="hero">');
    const h1 = /<h1\b[^>]*class="[^"]*\bhero__title\b[^"]*"[^>]*>([\s\S]*?)<\/h1>/i.exec(hero);
    assert.ok(h1, 'missing <h1 class="hero__title">');
    assert.equal(html.text(h1[1]).toLowerCase(), 'essays');
    const intro = html.extractElement(hero, 'p', 'hero__intro');
    assert.ok(intro !== null, 'missing <p class="hero__intro">');
    assert.match(html.text(intro), /^I write about what I've learned/, 'intro copy must be preserved');
    assert.equal(html.countTags(doc, 'h1'), 1, 'index must have exactly one <h1>');
});

test('index: grid of 17 cards with title, date and snippet', () => {
    const doc = read(path.join(ROOT, 'index.html'));
    const grid = html.extractElement(doc, 'div', 'essay-grid') ?? html.extractElement(doc, 'ul', 'essay-grid');
    assert.ok(grid !== null, 'missing .essay-grid');

    const cards = [...grid.matchAll(/<(article|li)\b[^>]*class="[^"]*\bessay-card\b[^"]*"[^>]*>/gi)];
    assert.equal(cards.length, essays().length, `expected ${essays().length} .essay-card, got ${cards.length}`);

    const count = (cls) => (grid.match(new RegExp(`class="[^"]*\\b${cls}\\b`, 'g')) || []).length;
    assert.equal(count('essay-card__title'), essays().length, '.essay-card__title per card');
    assert.equal(count('essay-card__date'), essays().length, '.essay-card__date per card');
    assert.equal(count('essay-card__snippet'), essays().length, '.essay-card__snippet per card');

    // Title is the link, and every essay title appears.
    for (const essay of essays()) {
        const re = new RegExp(`<a\\b[^>]*href="${essay.relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*class="[^"]*\\bessay-card__title\\b`);
        const reAlt = new RegExp(`<a\\b[^>]*class="[^"]*\\bessay-card__title\\b[^"]*"[^>]*href="${essay.relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
        assert.ok(re.test(grid) || reAlt.test(grid), `no .essay-card__title link to ${essay.relativePath}`);
    }

    // Dates are the uppercase short form the design calls for, e.g. JUN 02, 2026.
    const dates = [...grid.matchAll(/class="[^"]*\bessay-card__date\b[^"]*"[^>]*>([\s\S]*?)</g)].map((m) => m[1].trim());
    for (const d of dates) assert.match(d, /^[A-Z]{3} \d{2}, \d{4}$/, `date "${d}" not in MMM DD, YYYY form`);

    const classes = html.classNames(doc);
    for (const legacy of ['essay-item', 'essay-content', 'essay-title', 'essay-snippet', 'essay-intro']) {
        assert.ok(!classes.has(legacy), `legacy class .${legacy} still on index`);
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
        assert.ok(/class="site-brand"/.test(tpl), `${rel}: site-brand`);
        assert.ok(/class="site-nav"/.test(tpl), `${rel}: site-nav`);
    }
    const essayTpl = fs.readFileSync(path.join(ROOT, 'templates/essay-template.html'), 'utf-8');
    assert.ok(essayTpl.includes('{{breadcrumb-title}}'), 'essay template needs a {{breadcrumb-title}} placeholder');
});

// Keep staticPages referenced so the list is exercised even if allPages changes.
test('static page list is intact', () => {
    assert.equal(staticPages().length, 6);
});
