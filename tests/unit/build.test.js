/**
 * Generator correctness.
 *
 * The build is two plain Node scripts writing HTML from templates. These tests
 * cover the failure modes that produces: a template placeholder that never got
 * replaced, an essay whose markdown went missing, and output that drifts from
 * what is committed.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('node:child_process');

const { ROOT, essays, allPages, read } = require('../lib/pages');
const html = require('../lib/html');

const GENERATED = ['index.html', 'essays'];

function markedInstalled() {
    try {
        require.resolve('marked');
        return true;
    } catch {
        return false;
    }
}

function git(args) {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' }).trim();
}

function isGitRepo() {
    try {
        git(['rev-parse', '--git-dir']);
        return true;
    } catch {
        return false;
    }
}

test('every essay in data/essays.json has its markdown source', () => {
    const missing = essays()
        .filter((essay) => !fs.existsSync(essay.markdownPath))
        .map((essay) => essay.filename);
    assert.deepEqual(missing, [], `Markdown files referenced but absent: ${missing.join(', ')}`);
});

test('every essay in data/essays.json has a generated page', () => {
    const missing = essays()
        .filter((essay) => !fs.existsSync(essay.absolutePath))
        .map((essay) => essay.relativePath);
    assert.deepEqual(missing, [], `Not generated — run npm run build:essays: ${missing.join(', ')}`);
});

test('no orphaned essay pages', () => {
    const expected = new Set(essays().map((essay) => `${essay.slug}.html`));
    const actual = fs.readdirSync(path.join(ROOT, 'essays')).filter((f) => f.endsWith('.html'));
    const orphans = actual.filter((f) => !expected.has(f));
    assert.deepEqual(
        orphans,
        [],
        `Pages in essays/ with no entry in data/essays.json: ${orphans.join(', ')}`
    );
});

test('no unreplaced template placeholders in any page', () => {
    const offenders = [];
    for (const page of allPages()) {
        const found = html.placeholders(read(page.absolutePath));
        if (found.length) offenders.push(`${page.relativePath}: ${[...new Set(found)].join(', ')}`);
    }
    assert.deepEqual(offenders, [], `Unreplaced placeholders:\n  ${offenders.join('\n  ')}`);
});

test('required metadata is present on every essay page', () => {
    for (const essay of essays()) {
        const pageHtml = read(essay.absolutePath);
        assert.match(pageHtml, /<meta\s+name="description"\s+content="[^"]+"/i,
            `${essay.slug}: missing a non-empty meta description`);
        assert.match(pageHtml, /<link\s+rel="canonical"\s+href="https:\/\/anantvijay\.com\//i,
            `${essay.slug}: missing or malformed canonical link`);
        assert.ok(pageHtml.includes('<html lang="en">'),
            `${essay.slug}: missing lang attribute`);
    }
});

test('essay snippets in data/essays.json are non-empty', () => {
    for (const essay of essays()) {
        assert.ok(
            typeof essay.snippet === 'string' && essay.snippet.trim().length > 0,
            `${essay.slug} has no snippet — it would render an empty card`
        );
        assert.ok(
            typeof essay.title === 'string' && essay.title.trim().length > 0,
            `${essay.slug} has no title`
        );
    }
});

/**
 * Reproducibility: regenerating must produce byte-identical output, and that
 * output must match what is committed. Catches both non-determinism and stale
 * committed pages.
 *
 * Note: this runs the real build, so it rewrites index.html and essays/*.html.
 * When it passes, those files are unchanged by definition.
 */
test('build is reproducible and committed output is current', (t) => {
    if (!markedInstalled()) {
        t.skip('marked is not installed — run the scanned install first (see README)');
        return;
    }
    if (!isGitRepo()) {
        t.skip('not a git repository — cannot compare against committed output');
        return;
    }

    const dirty = git(['status', '--porcelain', '--', ...GENERATED]);
    if (dirty) {
        t.skip(`generated files already have uncommitted changes:\n${dirty}`);
        return;
    }

    const runBuild = () => {
        execFileSync('node', ['index-generator.js'], { cwd: ROOT, stdio: 'pipe' });
        execFileSync('node', ['generate-pages.js'], { cwd: ROOT, stdio: 'pipe' });
    };

    const snapshot = () => {
        const files = { 'index.html': read(path.join(ROOT, 'index.html')) };
        for (const essay of essays()) files[essay.relativePath] = read(essay.absolutePath);
        return files;
    };

    runBuild();
    const first = snapshot();
    runBuild();
    const second = snapshot();

    for (const key of Object.keys(first)) {
        assert.equal(second[key], first[key], `Build is non-deterministic for ${key}`);
    }

    const changed = git(['status', '--porcelain', '--', ...GENERATED]);
    assert.equal(
        changed,
        '',
        'Regenerating changed committed output. The committed pages are stale, or a ' +
        `template/generator changed without a rebuild:\n${changed}\n` +
        'Inspect with: git diff'
    );
});
