/**
 * Class ↔ CSS cross-reference (PLAN.md §5.1).
 *
 * The most likely silent failure of this redesign is a class renamed in a
 * generator or template without the stylesheet following — or vice versa. No
 * browser is needed to catch that: every class the markup emits should have a
 * rule, and every class selector in the stylesheet should match some markup.
 *
 * Sources scanned for emitted classes:
 *   - every page in tests/lib/pages.js (raw HTML, so inline scripts count)
 *   - both templates
 *   - only the JS files a page actually loads (js/essays.js is loaded by nothing)
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const css = require('../lib/css');
const { ROOT, allPages, read } = require('../lib/pages');
const html = require('../lib/html');

const TEMPLATES = ['templates/index-template.html', 'templates/essay-template.html'];

/**
 * Classes that exist only as runtime state toggled by JS, so they never appear
 * in static markup. Keep this list short and justified.
 */
const RUNTIME_STATE_CLASSES = new Set([
    // (none yet)
]);

/** Classes used purely as JS hooks with no styling of their own. */
const UNSTYLED_HOOKS = new Set([
    // (none yet)
]);

function loadedScripts() {
    const files = new Set();
    for (const page of allPages()) {
        const doc = read(page.absolutePath);
        for (const src of html.attrValues(doc, 'src')) {
            if (!src.endsWith('.js') || /^(https?:)?\/\//.test(src)) continue;
            const abs = path.resolve(ROOT, path.dirname(page.relativePath), src);
            files.add(path.relative(ROOT, abs));
        }
    }
    return [...files].sort();
}

function classesInScript(source) {
    const found = new Set();
    const patterns = [
        /\.className\s*=\s*['"`]([^'"`]+)['"`]/g,
        /classList\.(?:add|toggle|remove)\(\s*['"`]([^'"`]+)['"`]/g,
        /class="([^"]+)"/g, // inside template literals / innerHTML strings
    ];
    for (const re of patterns) {
        for (const m of source.matchAll(re)) {
            m[1].split(/\s+/).filter(Boolean).forEach((c) => found.add(c));
        }
    }
    return found;
}

function emittedClasses() {
    const byClass = new Map(); // class -> Set(sources)
    const record = (cls, source) => {
        if (!byClass.has(cls)) byClass.set(cls, new Set());
        byClass.get(cls).add(source);
    };

    for (const page of allPages()) {
        html.classNames(read(page.absolutePath)).forEach((c) => record(c, page.relativePath));
    }
    for (const rel of TEMPLATES) {
        html.classNames(fs.readFileSync(path.join(ROOT, rel), 'utf-8')).forEach((c) => record(c, rel));
    }
    for (const rel of loadedScripts()) {
        classesInScript(fs.readFileSync(path.join(ROOT, rel), 'utf-8')).forEach((c) => record(c, rel));
    }
    return byClass;
}

const emitted = emittedClasses();
const styled = css.classSelectors();

test('every emitted class has at least one CSS rule', () => {
    const unstyled = [...emitted.keys()]
        .filter((c) => !styled.has(c) && !UNSTYLED_HOOKS.has(c))
        .sort()
        .map((c) => `.${c}  (${[...emitted.get(c)].slice(0, 3).join(', ')}${emitted.get(c).size > 3 ? ', …' : ''})`);
    assert.deepEqual(
        unstyled,
        [],
        'Classes emitted by markup/JS with no matching rule in styles.css — typo or forgotten style:\n  ' +
        unstyled.join('\n  ')
    );
});

test('every CSS class selector matches something that is actually emitted', () => {
    const dead = [...styled]
        .filter((c) => !emitted.has(c) && !RUNTIME_STATE_CLASSES.has(c))
        .sort()
        .map((c) => `.${c}`);
    assert.deepEqual(
        dead,
        [],
        'Class selectors in styles.css that no page, template or loaded script emits — dead CSS:\n  ' +
        dead.join('\n  ')
    );
});

test('only scripts that pages actually load are considered', () => {
    const scripts = loadedScripts();
    assert.ok(scripts.includes('js/toggle.js'), 'toggle.js should be loaded');
    assert.ok(scripts.includes('js/quotes.js'), 'quotes.js should be loaded');
    // Documented dead code: nothing loads it, so it is deliberately not scanned.
    assert.ok(!scripts.includes('js/essays.js'), 'js/essays.js is loaded by no page');
});
