/**
 * The "don't break anything" net.
 *
 * Asserts every essay still says exactly what it said before the redesign, and
 * that what is published still matches what the markdown source contains.
 * Styling may change freely; words may not.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { essays, staticPages, read } = require('../lib/pages');
const html = require('../lib/html');

const BASELINE_PATH = path.join(__dirname, '..', 'baseline', 'content.json');
const BODY_CLASSES = ['essay-content', 'essay-article__body'];

function loadBaseline() {
    if (!fs.existsSync(BASELINE_PATH)) {
        throw new Error(
            'No content baseline found. Capture it BEFORE restyling:  npm run test:baseline'
        );
    }
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
}

function essayBody(pageHtml) {
    for (const className of BODY_CLASSES) {
        const inner = html.extractElement(pageHtml, 'section', className);
        if (inner !== null) return inner;
    }
    return null;
}

function sha256(str) {
    return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

/** marked arrives with the project's only runtime dependency. */
function loadMarked() {
    try {
        return require('marked');
    } catch {
        return null;
    }
}

const baseline = loadBaseline();
const byslug = new Map(baseline.essays.map((entry) => [entry.slug, entry]));

test('baseline covers every essay in data/essays.json', () => {
    const current = essays().map((essay) => essay.slug);
    assert.equal(
        baseline.essayCount,
        current.length,
        `Baseline has ${baseline.essayCount} essays, data/essays.json has ${current.length}. ` +
        'If you added an essay, re-run: npm run test:baseline'
    );
    for (const slug of current) {
        assert.ok(byslug.has(slug), `Essay "${slug}" is missing from the baseline`);
    }
});

test('every essay page still exists and is readable', () => {
    for (const essay of essays()) {
        assert.ok(
            fs.existsSync(essay.absolutePath),
            `Missing generated page: ${essay.relativePath}`
        );
    }
});

for (const essay of essays()) {
    test(`content preserved: ${essay.slug}`, () => {
        const expected = byslug.get(essay.slug);
        const pageHtml = read(essay.absolutePath);
        const body = essayBody(pageHtml);

        assert.ok(
            body !== null,
            `Could not find the essay body in ${essay.relativePath}. ` +
            `Tried: ${BODY_CLASSES.join(', ')}. If the class was renamed, add it to BODY_CLASSES.`
        );

        const bodyText = html.text(body);

        // The strongest assertion available without a browser: the rendered
        // words are byte-for-byte what they were before the redesign.
        assert.equal(
            sha256(bodyText),
            expected.textSha256,
            `Essay body text CHANGED for "${essay.slug}".\n` +
            `  was ${expected.words} words, now ${html.wordCount(bodyText)}\n` +
            `  expected opening: ${expected.opening}\n` +
            `  actual   opening: ${bodyText.split(/\s+/).slice(0, 12).join(' ')}`
        );

        assert.equal(html.countTags(body, 'p'), expected.paragraphs, 'paragraph count changed');
        assert.equal(html.countTags(pageHtml, 'h1'), 1, 'expected exactly one <h1>');
        assert.deepEqual(
            html.attrValues(body, 'src').sort(),
            expected.images,
            'essay images changed'
        );
    });
}

test('essay titles still match data/essays.json', () => {
    for (const essay of essays()) {
        const pageHtml = read(essay.absolutePath);
        const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(pageHtml);
        assert.ok(h1, `No <h1> in ${essay.relativePath}`);
        assert.equal(
            html.text(h1[1]),
            essay.title,
            `<h1> does not match the title in data/essays.json for ${essay.slug}`
        );
    }
});

test('published essays match their markdown source', (t) => {
    const marked = loadMarked();
    if (!marked) {
        t.skip('marked is not installed — run the scanned install first (see README)');
        return;
    }

    for (const essay of essays()) {
        const source = fs.readFileSync(essay.markdownPath, 'utf-8');
        const expectedWords = html.wordCount(html.text(marked.parse(source)));

        const body = essayBody(read(essay.absolutePath));
        const actualWords = html.wordCount(html.text(body));

        // 1% tolerance absorbs harmless whitespace/entity differences while
        // still catching a truncated or duplicated essay.
        const drift = Math.abs(actualWords - expectedWords) / expectedWords;
        assert.ok(
            drift <= 0.01,
            `${essay.slug}: published body is ${actualWords} words but its markdown ` +
            `yields ${expectedWords} (${(drift * 100).toFixed(1)}% drift, tolerance 1%). ` +
            'Content was lost or duplicated in generation.'
        );
    }
});

test('static page titles unchanged', () => {
    const expected = new Map(baseline.pages.map((p) => [p.page, p.titleTag]));
    for (const page of staticPages()) {
        const pageHtml = read(page.absolutePath);
        const title = (pageHtml.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
        assert.equal(
            title,
            expected.get(page.relativePath),
            `<title> changed on ${page.relativePath}`
        );
    }
});
