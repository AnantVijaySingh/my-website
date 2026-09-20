/**
 * Brace-matching CSS reader for css/styles.css.
 *
 * Deliberately small: enough to ask "is this token declared?", "does this media
 * query contain this declaration?", and "which class selectors exist?" — the
 * questions PLAN.md §5 needs answered without a browser.
 */

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./pages');

const STYLESHEET = path.join(ROOT, 'css', 'styles.css');

function read() {
    return fs.readFileSync(STYLESHEET, 'utf-8');
}

function stripComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Flatten to leaf rules: [{ selector, body, media }].
 * @media / @supports blocks are recursed into, and their condition is carried on
 * each inner rule as `media`. Other at-rules (@keyframes, @font-face) are
 * returned with atRule: true and are normally filtered out by callers.
 */
function parseRules(css, media = '') {
    const rules = [];
    let cursor = 0;

    while (cursor < css.length) {
        const open = css.indexOf('{', cursor);
        if (open === -1) break;

        const prelude = css.slice(cursor, open).trim();

        let depth = 1;
        let scan = open + 1;
        while (scan < css.length && depth > 0) {
            if (css[scan] === '{') depth += 1;
            else if (css[scan] === '}') depth -= 1;
            scan += 1;
        }
        const body = css.slice(open + 1, scan - 1);

        if (/^@(media|supports)\b/i.test(prelude)) {
            rules.push(...parseRules(body, prelude));
        } else if (prelude.startsWith('@')) {
            rules.push({ selector: prelude, body, media, atRule: true });
        } else if (prelude) {
            rules.push({ selector: prelude, body, media, atRule: false });
        }

        cursor = scan;
    }

    return rules;
}

function rules(css = stripComments(read())) {
    return parseRules(css).filter((rule) => !rule.atRule);
}

/** Declarations of a single rule body as { property: value }. */
function declarations(body) {
    const out = {};
    for (const chunk of body.split(';')) {
        const colon = chunk.indexOf(':');
        if (colon === -1) continue;
        const property = chunk.slice(0, colon).trim();
        const value = chunk.slice(colon + 1).trim();
        if (property && value) out[property] = value;
    }
    return out;
}

/**
 * Merged declarations of every rule whose selector matches `selector` exactly.
 * Only base rules (no media query) are considered unless `media` is given;
 * pass `null` to merge across every media query.
 */
function declarationsFor(selector, allRules = rules(), media = '') {
    return allRules
        .filter((rule) => media === null || (rule.media || '') === media)
        .filter((rule) => rule.selector.split(',').some((s) => s.trim() === selector))
        .reduce((acc, rule) => Object.assign(acc, declarations(rule.body)), {});
}

/** Custom properties declared in a given selector, e.g. ':root' (base rules only). */
function customProperties(selector, allRules = rules(), media = '') {
    const declared = declarationsFor(selector, allRules, media);
    return Object.fromEntries(
        Object.entries(declared).filter(([property]) => property.startsWith('--'))
    );
}

/** Every class name referenced by any selector in the stylesheet. */
function classSelectors(allRules = rules()) {
    const names = new Set();
    for (const rule of allRules) {
        const found = rule.selector.match(/\.-?[A-Za-z_][\w-]*/g) || [];
        found.forEach((name) => names.add(name.slice(1)));
    }
    return names;
}

/** Literal hex colors, with the rule each appeared in — for token discipline. */
function hexColorUsages(css = stripComments(read())) {
    const usages = [];
    for (const rule of parseRules(css)) {
        const found = rule.body.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
        found.forEach((hex) => usages.push({ hex, selector: rule.selector, media: rule.media }));
    }
    return usages;
}

module.exports = {
    STYLESHEET,
    read,
    stripComments,
    parseRules,
    rules,
    declarations,
    declarationsFor,
    customProperties,
    classSelectors,
    hexColorUsages,
};
