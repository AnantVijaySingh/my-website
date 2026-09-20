/**
 * Design tokens (design.md §1–§3).
 *
 * Reads css/styles.css directly. Contrast is computed from the values actually
 * declared, not from the numbers written in design.md — so the doc cannot drift
 * from the stylesheet without this failing.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const css = require('../lib/css');
const { ratio, AA_NORMAL_TEXT } = require('../lib/contrast');
const { ROOT, allPages, read } = require('../lib/pages');

const LIGHT = ':root';
const DARK = '[data-theme="dark"]';

const EXPECTED_LIGHT = {
    '--canvas': '#F6EBE0',
    '--ink': '#1C1917',
    '--ink-muted': '#57534E',
    '--accent': '#F05C22',
    '--accent-ink': '#B8431A',
    '--rule': '#DCCFC2',
};

const EXPECTED_DARK = {
    '--canvas': '#1C1917',
    '--canvas-raised': '#262220',
    '--ink': '#F6EBE0',
    '--ink-muted': '#A8A29D',
    '--accent': '#FF7A45',
    '--accent-ink': '#FF7A45',
    '--rule': '#3A3431',
};

const EXPECTED_SPACING = {
    '--space-3xs': '0.5rem',
    '--space-2xs': '0.75rem',
    '--space-xs': '1rem',
    '--space-sm': '1.5rem',
    '--space-md': '2rem',
    '--space-lg': '3rem',
    '--space-xl': '5rem',
    '--space-2xl': '7.5rem',
    '--space-3xl': '10rem',
};

/** The old blue accent and the old dark-mode greys. None may survive. */
const LEGACY_COLORS = ['#1877F2', '#1e90ff', '#121212', '#1e1e1e'];

const rules = css.rules();
const light = css.customProperties(LIGHT, rules);
const dark = css.customProperties(DARK, rules);
const norm = (hex) => String(hex).trim().toUpperCase();

// ─── Token presence ─────────────────────────────────────────────────────────

test('light palette tokens are declared on :root with the exact values', () => {
    for (const [token, hex] of Object.entries(EXPECTED_LIGHT)) {
        assert.ok(token in light, `${LIGHT} is missing ${token}`);
        assert.equal(norm(light[token]), norm(hex), `${token} on ${LIGHT}`);
    }
});

test('dark palette tokens are declared on [data-theme="dark"] with the exact values', () => {
    for (const [token, hex] of Object.entries(EXPECTED_DARK)) {
        assert.ok(token in dark, `${DARK} is missing ${token}`);
        assert.equal(norm(dark[token]), norm(hex), `${token} on ${DARK}`);
    }
});

test('spacing scale is declared', () => {
    for (const [token, value] of Object.entries(EXPECTED_SPACING)) {
        assert.equal(light[token], value, `${token} on ${LIGHT}`);
    }
});

test('two font stacks: display is Space Grotesk, body is Georgia', () => {
    assert.match(light['--font-display'] || '', /^"Space Grotesk"/,
        '--font-display must lead with "Space Grotesk"');
    assert.match(light['--font-body'] || '', /^Georgia\b/,
        '--font-body must lead with Georgia');
    assert.doesNotMatch(light['--font-body'] || '', /Space Grotesk/,
        'the body stack must not contain Space Grotesk — that was the original single-stack bug');
});

// ─── Contrast, computed from the declared values ────────────────────────────

for (const [themeName, selector, tokens] of [['light', LIGHT, light], ['dark', DARK, dark]]) {
    test(`${themeName}: every functional text token clears WCAG AA (4.5:1) on the canvas`, () => {
        const canvas = tokens['--canvas'];
        assert.ok(canvas, `${selector} has no --canvas`);
        for (const token of ['--ink', '--ink-muted', '--accent-ink']) {
            const value = tokens[token];
            assert.ok(value, `${selector} has no ${token}`);
            const r = ratio(value, canvas);
            assert.ok(
                r >= AA_NORMAL_TEXT,
                `${themeName} ${token} ${value} on ${canvas} is ${r}:1 — needs ${AA_NORMAL_TEXT}:1`
            );
        }
    });
}

test('light --accent is documented as failing AA — it must never be used for text', () => {
    // This is the whole reason --accent-ink exists (design.md §1.1). If someone
    // "fixes" --accent to pass, --accent-ink becomes redundant and the doc is wrong.
    assert.ok(light['--accent'] && light['--canvas'], ':root must declare --accent and --canvas');
    const r = ratio(light['--accent'], light['--canvas']);
    assert.ok(r < AA_NORMAL_TEXT, `light --accent now passes AA (${r}:1); update design.md §1.1`);

    const allowed = (selector) => /\.site-brand\b/.test(selector);
    const offenders = rules
        .filter((rule) => /(^|;|\s)color\s*:\s*var\(--accent\)\s*(;|$)/.test(rule.body))
        .filter((rule) => !allowed(rule.selector))
        .map((rule) => rule.selector);
    assert.deepEqual(
        offenders,
        [],
        '`color: var(--accent)` is only permitted on the brand wordmark (WCAG logotype ' +
        `exemption). Use var(--accent-ink) for text:\n  ${offenders.join('\n  ')}`
    );
});

// ─── Token discipline ───────────────────────────────────────────────────────

test('no literal hex colors outside the token blocks', () => {
    const tokenBlock = (selector) => selector === LIGHT || selector === DARK;
    const leaks = css.hexColorUsages()
        .filter((u) => !tokenBlock(u.selector))
        .map((u) => `${u.hex} in "${u.selector}"${u.media ? ` @ ${u.media}` : ''}`);
    assert.deepEqual(
        leaks,
        [],
        `Raw hex outside :root / [data-theme="dark"]. Use a token:\n  ${leaks.join('\n  ')}`
    );
});

test('no legacy colors anywhere in CSS or HTML', () => {
    const haystacks = [
        ['css/styles.css', css.read()],
        ...allPages().map((p) => [p.relativePath, read(p.absolutePath)]),
        ...['templates/index-template.html', 'templates/essay-template.html']
            .map((rel) => [rel, fs.readFileSync(path.join(ROOT, rel), 'utf-8')]),
    ];
    const hits = [];
    for (const [name, text] of haystacks) {
        for (const legacy of LEGACY_COLORS) {
            if (text.toLowerCase().includes(legacy.toLowerCase())) hits.push(`${legacy} in ${name}`);
        }
    }
    assert.deepEqual(hits, [], `Legacy colors still present:\n  ${hits.join('\n  ')}`);
});

test('canvas is the token, never white', () => {
    const body = css.declarationsFor('body', rules);
    assert.equal(body['background-color'] || body.background, 'var(--canvas)',
        'body background must be var(--canvas)');
    assert.equal(body.color, 'var(--ink)', 'body color must be var(--ink)');
    assert.equal(body['font-family'], 'var(--font-body)', 'body font must be the body stack');

    const whites = rules
        .filter((rule) => /background(-color)?\s*:\s*(#fff\b|#ffffff\b|white\b)/i.test(rule.body))
        .map((rule) => rule.selector);
    assert.deepEqual(whites, [], `White backgrounds remain on: ${whites.join(', ')}`);
});

test('no body.dark-mode selectors remain — theme is data-theme on <html>', () => {
    const legacy = rules.filter((rule) => /\.dark-mode\b/.test(rule.selector)).map((r) => r.selector);
    assert.deepEqual(legacy, [], `Legacy .dark-mode selectors:\n  ${legacy.join('\n  ')}`);
});

// ─── Layout intent pinned at the source (PLAN.md §5) ───────────────────────

test('h1 cannot be a fixed size large enough to overflow a phone', () => {
    // Either fluid (clamp) or a fixed size no larger than 2rem. A fixed 5rem
    // uppercase title is what breaks 375px viewports.
    const h1 = css.declarationsFor('h1', rules);
    const size = h1['font-size'] || '';
    const fixed = /^(\d+(\.\d+)?)rem$/.exec(size);
    assert.ok(
        /^clamp\(/.test(size) || (fixed && parseFloat(fixed[1]) <= 2),
        `h1 font-size is "${size}" — use clamp() or a fixed size ≤ 2rem`
    );
    assert.equal(h1['font-family'], 'var(--font-display)');
    assert.equal(h1['text-transform'], 'uppercase');
});

test('essay body has a ch-based reading measure, not the 1200px container', () => {
    const body = css.declarationsFor('.essay-article__body', rules);
    assert.match(body['max-width'] || '', /^\d+ch$/,
        `.essay-article__body max-width is "${body['max-width']}" — expected e.g. 68ch`);
    const measure = parseInt(body['max-width'], 10);
    assert.ok(measure >= 60 && measure <= 75, `${measure}ch is outside the 60–75ch reading range`);
    assert.equal(body['font-family'], 'var(--font-body)', 'essay body must be Georgia');
});

test('essay list is a single column with a fixed date gutter', () => {
    const list = css.declarationsFor('.essay-list', rules);
    assert.ok(Object.keys(list).length, 'no .essay-list rule');
    assert.ok(!/grid/.test(list.display || ''), 'the essay list is a list, not a grid');

    const item = css.declarationsFor('.essay-list__item', rules);
    assert.equal(item.display, 'flex', 'each row lays out date | body with flex');
    assert.equal(item['align-items'], 'baseline', 'date and title must share a baseline');

    const date = css.declarationsFor('.essay-list__date', rules);
    assert.match(date.flex || '', /\b\d+(\.\d+)?rem\b/, 'date gutter needs a fixed rem width');
    assert.equal(date['text-align'], 'right', 'dates are right-aligned against the title edge');
    assert.equal(date.color, 'var(--accent-ink)');

    const body = css.declarationsFor('.essay-list__body', rules);
    assert.equal(body['max-width'], 'var(--measure)', 'row text must respect the reading measure');
});

test('essay list stacks date above title on small screens', () => {
    const stacked = rules.filter((rule) =>
        rule.selector.split(',').some((s) => s.trim() === '.essay-list__item') &&
        /max-width:\s*767px/.test(rule.media || ''));
    assert.ok(stacked.length, 'no .essay-list__item override under max-width: 767px');
    assert.equal(css.declarations(stacked[0].body)['flex-direction'], 'column');
});

test('macro spacing scales down on small viewports', () => {
    const small = rules.filter((rule) =>
        rule.selector === LIGHT && /max-width:\s*767px/.test(rule.media || ''));
    assert.ok(small.length, `no ${LIGHT} override under max-width: 767px`);
    const overridden = Object.assign({}, ...small.map((rule) => css.declarations(rule.body)));
    assert.ok(overridden['--space-2xl'], '--space-2xl must shrink on phones (design.md §3)');
    assert.notEqual(overridden['--space-2xl'], EXPECTED_SPACING['--space-2xl']);
});

// ─── Theme mechanism (design.md §1.3, Phase 8) ─────────────────────────────

test('color-scheme is declared for both themes so native controls follow', () => {
    assert.equal(css.declarationsFor(LIGHT, rules)['color-scheme'], 'light');
    assert.equal(css.declarationsFor(DARK, rules)['color-scheme'], 'dark');
});

test('dark-scoped rules only invert line icons — every colour difference is a token', () => {
    // If dark mode needs a colour that light mode does not, that is a new token,
    // not a [data-theme="dark"] override. The only legitimate dark-only rules
    // are filters on black SVG line icons.
    const darkScoped = rules.filter((rule) => rule.selector.startsWith(DARK) && rule.selector !== DARK);
    const offenders = darkScoped
        .filter((rule) => !/\bimg\b/.test(rule.selector) || !/^\s*filter\s*:/m.test(rule.body.trim()))
        .map((rule) => rule.selector);
    assert.deepEqual(offenders, [], `Dark-only overrides that should be tokens:\n  ${offenders.join('\n  ')}`);
    assert.ok(darkScoped.length >= 3, 'expected icon inversions for essay actions, quote buttons and social links');
});

test('artwork and author images are never inverted in dark mode', () => {
    const inverted = rules
        .filter((rule) => rule.selector.startsWith(DARK) && /filter/.test(rule.body))
        .map((rule) => rule.selector)
        .join('\n');
    assert.doesNotMatch(inverted, /software-icon|essay-article__body/,
        'the Focus app icon and essay images are real artwork and must not be inverted');
});

test('no colour keywords bypass the tokens', () => {
    const offenders = rules
        .filter((rule) => /(^|[\s:;])(black|white|gr[ae]y|silver|red|blue|orange)\s*(;|$|!)/m.test(rule.body))
        .map((rule) => rule.selector);
    assert.deepEqual(offenders, [], `Colour keywords in: ${offenders.join(', ')}`);
});

test('section-page hero titles are visually hidden but remain in the accessibility tree', () => {
    const title = css.declarationsFor('.hero__title', rules);
    assert.equal(title.position, 'absolute');
    assert.equal(title['clip-path'], 'inset(50%)');
    assert.equal(title.width, '1px');
    assert.notEqual(title.display, 'none', 'display:none would remove it from the accessibility tree');
    assert.notEqual(title.visibility, 'hidden', 'visibility:hidden would remove it from the accessibility tree');
});

