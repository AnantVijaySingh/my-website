#!/usr/bin/env node
/**
 * Capture the golden content baseline.
 *
 * Records what every essay SAYS, independent of how it looks, so the redesign
 * can be proven not to have lost, truncated, or reordered a single word.
 *
 * Run BEFORE restyling anything:   npm run test:baseline
 *
 * Re-capturing is legitimate when you add an essay. Re-capturing to make a
 * failing test pass is how you hide a regression — see README.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { essays, staticPages, read } = require('./lib/pages');
const html = require('./lib/html');

const OUTPUT = path.join(__dirname, 'baseline', 'content.json');

/**
 * The essay body section is renamed during the redesign
 * (.essay-content -> .essay-article__body, PLAN.md R1). Accept either, so the
 * baseline stays comparable across the rename.
 */
const BODY_CLASSES = ['essay-content', 'essay-article__body'];

function essayBodyHtml(pageHtml) {
    for (const className of BODY_CLASSES) {
        const inner = html.extractElement(pageHtml, 'section', className);
        if (inner !== null) return { inner, className };
    }
    return null;
}

function sha256(str) {
    return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function internalRefs(pageHtml) {
    const refs = [...html.attrValues(pageHtml, 'href'), ...html.attrValues(pageHtml, 'src')];
    return refs
        .filter((ref) => !/^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(ref))
        .filter(Boolean)
        .sort();
}

function captureEssay(essay) {
    const pageHtml = read(essay.absolutePath);
    const body = essayBodyHtml(pageHtml);
    if (!body) {
        throw new Error(
            `Could not locate the essay body section in ${essay.relativePath}. ` +
            `Tried classes: ${BODY_CLASSES.join(', ')}`
        );
    }

    const bodyText = html.text(body.inner);

    return {
        slug: essay.slug,
        title: essay.title,
        date: essay.date,
        bodyClass: body.className,
        words: html.wordCount(bodyText),
        paragraphs: html.countTags(body.inner, 'p'),
        headings: {
            h1: html.countTags(pageHtml, 'h1'),
            h2: html.countTags(body.inner, 'h2'),
            h3: html.countTags(body.inner, 'h3'),
            h4: html.countTags(body.inner, 'h4'),
        },
        blockquotes: html.countTags(body.inner, 'blockquote'),
        lists: html.countTags(body.inner, 'ul') + html.countTags(body.inner, 'ol'),
        images: html.attrValues(body.inner, 'src').sort(),
        textSha256: sha256(bodyText),
        // Human-readable anchors, so a diff is legible without the full text.
        opening: bodyText.split(/\s+/).slice(0, 12).join(' '),
        closing: bodyText.split(/\s+/).slice(-12).join(' '),
        refs: internalRefs(pageHtml),
    };
}

function capturePage(page) {
    const pageHtml = read(page.absolutePath);
    return {
        page: page.relativePath,
        titleTag: (pageHtml.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim(),
        refs: internalRefs(pageHtml),
    };
}

function main() {
    const allEssays = essays();
    const captured = {
        // Intentionally no timestamp: this file is committed, and a changing
        // timestamp would make every re-capture look like a content change.
        note: 'Golden content baseline. See tests/capture-baseline.js and README.',
        essayCount: allEssays.length,
        essays: allEssays.map(captureEssay),
        pages: staticPages().map(capturePage),
    };

    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, `${JSON.stringify(captured, null, 2)}\n`);

    const totalWords = captured.essays.reduce((sum, e) => sum + e.words, 0);
    console.log(`Captured ${captured.essays.length} essays (${totalWords.toLocaleString()} words)`);
    console.log(`Captured ${captured.pages.length} static pages`);
    console.log(`Wrote ${path.relative(process.cwd(), OUTPUT)}`);
}

main();
