const fs = require('fs');
const path = require('path');

// Paths
const essaysDataPath = './data/essays.json';
const templatePath = './templates/index-template.html';
const outputPath = './index.html';

// Load the essays data
const essays = JSON.parse(fs.readFileSync(essaysDataPath, 'utf-8'));

// Load the HTML template
const template = fs.readFileSync(templatePath, 'utf-8');

// Helper function to format the date.
// Dates in essays.json are calendar dates, not instants: an ISO date string parses
// as UTC midnight, so it must be formatted in UTC too. Formatting in local time
// bakes in the previous day whenever the build machine sits behind UTC.
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' };
    return date.toLocaleDateString('en-US', options).toUpperCase();
}

// Reverse-chronological, newest first. Derived from the dates rather than the order
// entries happen to appear in essays.json, so appending a new essay puts it in the
// right place without hand-sorting the file.
const orderedEssays = [...essays].sort((a, b) => new Date(b.date) - new Date(a.date));

// Helper function to escape HTML characters
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Generate the essay cards (design.md §4: octagon + title, date, snippet).
// The octagon is drawn by CSS on .essay-card__title::before — no markup needed.
let essaysHTML = '';
orderedEssays.forEach((essay) => {
    const href = `essays/${essay.filename.replace('.md', '.html')}`;
    essaysHTML += `
        <li class="essay-card">
            <a href="${href}" class="essay-card__title">${escapeHtml(essay.title)}</a>
            <time class="essay-card__date" datetime="${essay.date}">${formatDate(essay.date)}</time>
            <p class="essay-card__snippet">${escapeHtml(essay.snippet)}</p>
        </li>`;
});

// Replace the placeholder in the template. Function form, so that essay content
// containing "$&" or "$1" is inserted verbatim rather than as a replacement pattern.
const outputHTML = template.replace('{{essays}}', () => essaysHTML);

// Write the generated HTML to the output file
fs.writeFileSync(outputPath, outputHTML);
console.log(`Generated: ${outputPath}`);
