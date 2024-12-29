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

// Helper function to format the date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options).toUpperCase();
}

// Generate the list of essays
let essaysHTML = '';
essays.forEach((essay) => {
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
