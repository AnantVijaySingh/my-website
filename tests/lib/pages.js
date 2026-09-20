/**
 * Single source of truth for what pages exist.
 * Everything derives from data/essays.json so tests can never drift from the
 * real essay list.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

/**
 * finds.html is an unstyled 10-line stub, unlinked from the nav but present in
 * sitemap.xml. Pre-existing debt, out of scope — see PLAN.md R7.
 */
const EXCLUDED_PAGES = ['finds.html'];

const STATIC_PAGES = [
    'index.html',
    'quotes.html',
    'software.html',
    'time.html',
    'about.html',
    'software/focustodoprivacypolicy.html',
];

function slugOf(markdownFilename) {
    return path.basename(markdownFilename, '.md');
}

/** All essays, in data/essays.json order, with resolved paths. */
function essays() {
    const raw = fs.readFileSync(path.join(ROOT, 'data', 'essays.json'), 'utf-8');
    return JSON.parse(raw).map((essay, index) => {
        const slug = slugOf(essay.filename);
        return {
            ...essay,
            index,
            slug,
            markdownPath: path.join(ROOT, 'essays-markdowns', essay.filename),
            absolutePath: path.join(ROOT, 'essays', `${slug}.html`),
            // Forward slashes: this is a URL, not a filesystem path.
            relativePath: `essays/${slug}.html`,
        };
    });
}

function staticPages() {
    return STATIC_PAGES.map((relativePath) => ({
        relativePath,
        absolutePath: path.join(ROOT, relativePath),
        essay: null,
    }));
}

/** Every page the design system is responsible for: 6 static + 17 essays. */
function allPages() {
    return [
        ...staticPages(),
        ...essays().map((essay) => ({
            relativePath: essay.relativePath,
            absolutePath: essay.absolutePath,
            essay,
        })),
    ];
}

function read(absolutePath) {
    return fs.readFileSync(absolutePath, 'utf-8');
}

module.exports = {
    ROOT,
    EXCLUDED_PAGES,
    STATIC_PAGES,
    slugOf,
    essays,
    staticPages,
    allPages,
    read,
};
