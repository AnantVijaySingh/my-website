/**
 * Every internal reference resolves to a real file on disk.
 *
 * This is the guard for the ../ path mistakes that templates invite: essay pages
 * sit one directory deeper than the static pages, so the same stylesheet is
 * "css/styles.css" from one and "../css/styles.css" from the other.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { ROOT, allPages, read } = require('../lib/pages');
const html = require('../lib/html');

const EXTERNAL = /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i;

function internalRefs(pageHtml) {
    return [...html.attrValues(pageHtml, 'href'), ...html.attrValues(pageHtml, 'src')]
        .filter(Boolean)
        .filter((ref) => !EXTERNAL.test(ref));
}

/** Resolve a reference the way a browser would, relative to the page. */
function resolve(ref, pageRelativePath) {
    const withoutFragment = ref.split('#')[0].split('?')[0];
    if (!withoutFragment) return null;
    // A root-relative reference resolves against the site root.
    if (withoutFragment.startsWith('/')) {
        return path.join(ROOT, decodeURIComponent(withoutFragment));
    }
    return path.resolve(ROOT, path.dirname(pageRelativePath), decodeURIComponent(withoutFragment));
}

for (const page of allPages()) {
    test(`references resolve: ${page.relativePath}`, () => {
        const pageHtml = read(page.absolutePath);
        const broken = [];

        for (const ref of internalRefs(pageHtml)) {
            const target = resolve(ref, page.relativePath);
            if (target === null) continue;
            if (!fs.existsSync(target)) {
                broken.push(`${ref}  ->  ${path.relative(ROOT, target)}`);
            }
        }

        assert.deepEqual(
            broken,
            [],
            `Broken references in ${page.relativePath}:\n  ${broken.join('\n  ')}`
        );
    });
}

test('every essay is linked from the homepage', () => {
    const indexHtml = read(path.join(ROOT, 'index.html'));
    const hrefs = new Set(html.attrValues(indexHtml, 'href'));

    const { essays } = require('../lib/pages');
    for (const essay of essays()) {
        assert.ok(
            hrefs.has(essay.relativePath),
            `Homepage does not link to ${essay.relativePath}`
        );
    }
});

/**
 * PLAN.md R4: this filename contains a literal ">" character. It works in
 * browsers, and renaming it would break live URLs and the sitemap. Pinned here
 * so nobody "tidies" it away.
 */
test('the essay with a ">" in its filename still resolves', () => {
    const odd = path.join(ROOT, 'essays', 'Momentum->-Motivation.html');
    assert.ok(fs.existsSync(odd), 'Momentum->-Motivation.html must not be renamed (PLAN.md R4)');

    const indexHtml = read(path.join(ROOT, 'index.html'));
    assert.ok(
        html.attrValues(indexHtml, 'href').includes('essays/Momentum->-Motivation.html'),
        'Homepage must still link to the ">" filename verbatim'
    );
});
