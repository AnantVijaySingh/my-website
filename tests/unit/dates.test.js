/**
 * Date handling in the generators (PLAN.md §3.2).
 *
 * Two problems being pinned here:
 *   1. data/essays.json must use strict YYYY-MM-DD. "2024-02-1" only worked
 *      because V8 falls back to non-standard parsing.
 *   2. An ISO date string parses as UTC midnight, so formatting it in the build
 *      machine's local timezone renders the previous day whenever that offset is
 *      negative. The date is baked into the HTML at build time, so this silently
 *      depends on where the build runs.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('node:child_process');

const { ROOT, essays, read } = require('../lib/pages');

const STRICT_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

test('every essay date is a strict YYYY-MM-DD string', () => {
    const malformed = essays()
        .filter((essay) => !STRICT_ISO_DATE.test(essay.date))
        .map((essay) => `${essay.slug}: "${essay.date}"`);

    assert.deepEqual(
        malformed,
        [],
        'Non-ISO dates in data/essays.json rely on non-standard parsing:\n  ' +
        malformed.join('\n  ')
    );
});

test('every essay date is a real calendar date', () => {
    for (const essay of essays()) {
        const [year, month, day] = essay.date.split('-').map(Number);
        // Build in UTC and read back in UTC, so this check is itself
        // timezone-independent.
        const parsed = new Date(Date.UTC(year, month - 1, day));
        assert.equal(parsed.getUTCFullYear(), year, `${essay.slug}: bad year`);
        assert.equal(parsed.getUTCMonth() + 1, month, `${essay.slug}: bad month`);
        assert.equal(parsed.getUTCDate(), day, `${essay.slug}: impossible day for the month`);
    }
});

/**
 * Runs the real generators under two opposing timezones and requires the output
 * to be byte-identical. Comparing whole files rather than scraped date strings
 * keeps this independent of the class names, which the redesign renames.
 *
 * All generated files are snapshotted and restored, so the test leaves no trace
 * whichever way it ends.
 */
test('generated pages do not depend on the build machine timezone', () => {
    const generatedPaths = ['index.html', ...essays().map((essay) => essay.relativePath)];

    const snapshot = () =>
        Object.fromEntries(generatedPaths.map((rel) => [rel, read(path.join(ROOT, rel))]));

    const restore = (snap) => {
        for (const [rel, content] of Object.entries(snap)) {
            fs.writeFileSync(path.join(ROOT, rel), content);
        }
    };

    const buildUnder = (timezone) => {
        for (const script of ['index-generator.js', 'generate-pages.js']) {
            execFileSync('node', [script], {
                cwd: ROOT,
                stdio: 'pipe',
                env: { ...process.env, TZ: timezone },
            });
        }
        return snapshot();
    };

    const original = snapshot();
    try {
        const behindUtc = buildUnder('America/Los_Angeles'); // UTC-8/-7
        const aheadOfUtc = buildUnder('Asia/Kolkata'); //       UTC+5:30

        const differing = generatedPaths.filter((rel) => behindUtc[rel] !== aheadOfUtc[rel]);

        assert.deepEqual(
            differing,
            [],
            'These pages render differently depending on the build machine timezone ' +
            `(${differing.length} of ${generatedPaths.length}). Dates must be formatted in ` +
            'UTC, not local time:\n  ' + differing.slice(0, 5).join('\n  ')
        );
    } finally {
        restore(original);
    }
});
