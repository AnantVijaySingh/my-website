/**
 * Homepage essay ordering (PLAN.md §3.1).
 *
 * For_AI.md states essays are listed reverse-chronologically. index-generator.js
 * iterates data/essays.json in array order, and that array is not sorted — so
 * the stated intent was never actually enforced. The 3-column grid makes reading
 * order far more prominent, so it is pinned here.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { ROOT, essays, read } = require('../lib/pages');
const html = require('../lib/html');

/** Essay links in the order they appear in index.html. */
function homepageOrder() {
    const indexHtml = read(path.join(ROOT, 'index.html'));
    const bySlug = new Map(essays().map((essay) => [essay.relativePath, essay]));

    const seen = [];
    for (const href of html.attrValues(indexHtml, 'href')) {
        const essay = bySlug.get(href);
        if (essay && !seen.some((e) => e.relativePath === href)) seen.push(essay);
    }
    return seen;
}

test('homepage lists every essay exactly once', () => {
    const order = homepageOrder();
    assert.equal(
        order.length,
        essays().length,
        `Homepage lists ${order.length} essays, data/essays.json has ${essays().length}`
    );
});

test('homepage lists essays newest first', () => {
    const order = homepageOrder();

    const inversions = [];
    for (let i = 1; i < order.length; i += 1) {
        const previous = order[i - 1];
        const current = order[i];
        if (new Date(current.date) > new Date(previous.date)) {
            inversions.push(
                `position ${i + 1} "${current.title}" (${current.date}) is newer than ` +
                `position ${i} "${previous.title}" (${previous.date})`
            );
        }
    }

    assert.deepEqual(
        inversions,
        [],
        `Homepage is not in reverse-chronological order (${inversions.length} inversions):\n  ` +
        inversions.join('\n  ')
    );
});

test('ordering is derived from dates, not from array position', () => {
    // Guards against "fixing" this by hand-sorting data/essays.json, which would
    // silently regress the next time an essay is appended to the end.
    const source = read(path.join(ROOT, 'index-generator.js'));
    assert.match(
        source,
        /\.sort\(/,
        'index-generator.js must sort essays by date rather than relying on the order ' +
        'they happen to appear in data/essays.json'
    );
});
