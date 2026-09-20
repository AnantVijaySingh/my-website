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

// Generate the list of essays
let essaysHTML = '';
orderedEssays.forEach((essay) => {
    const formattedDate = formatDate(essay.date);
    essaysHTML += `
        <div class="essay-item">
            <div class="essay-date">${formattedDate}</div>
            <div class="essay-content">
                <a href="essays/${essay.filename.replace('.md', '.html')}" class="essay-title">${essay.title}</a>
                <p class="essay-snippet">${essay.snippet}</p>
            </div>
        </div>
    `;
});

// Replace the placeholder in the template
const outputHTML = template.replace('{{essays}}', essaysHTML);

// Write the generated HTML to the output file
fs.writeFileSync(outputPath, outputHTML);
console.log(`Generated: ${outputPath}`);
