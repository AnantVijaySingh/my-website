const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Paths
const essaysDataPath = './data/essays.json';
const markdownDir = './essays-markdowns';
const outputDir = './essays';
const templatePath = './templates/essay-template.html';
const indexHTMLPath = './index.html';

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Load essay data
const essays = JSON.parse(fs.readFileSync(essaysDataPath, 'utf-8'));

// Load HTML template for essays
const template = fs.readFileSync(templatePath, 'utf-8');

// Initialize an array to hold links for the homepage
const essayLinks = [];

// Generate static pages
essays.forEach((essay) => {
    const markdownPath = path.join(markdownDir, essay.filename);

    // Check if the Markdown file exists
    if (!fs.existsSync(markdownPath)) {
        console.error(`Markdown file not found: ${markdownPath}`);
        return;
    }

    // Read the Markdown file and convert it to HTML
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    const htmlContent = marked.parse(markdownContent);

    // Replace placeholders in the template
    const outputHTML = template
        .replace('{{title}}', essay.title)
        .replace('{{date}}', essay.date)
        .replace('{{content}}', htmlContent);

    // Generate the output file path
    const outputFilename = `${path.basename(essay.filename, '.md')}.html`;
    const outputPath = path.join(outputDir, outputFilename);

    // Write the generated HTML file
    fs.writeFileSync(outputPath, outputHTML);
    console.log(`Generated: ${outputPath}`);

    // Add a link to this essay for the homepage
    essayLinks.push(
        `<a href="essays/${outputFilename}" class="essay-title">${essay.title}</a>`
    );
});

// Update the homepage (index.html) with the generated links
let indexHTML = fs.readFileSync(indexHTMLPath, 'utf-8');
indexHTML = indexHTML.replace(
    /<div id="essays-container">[\s\S]*?<\/div>/,
    `<div id="essays-container">\n${essayLinks.join('\n')}\n</div>`
);

// Write the updated index.html
fs.writeFileSync(indexHTMLPath, indexHTML);
console.log('Updated index.html with essay links.');