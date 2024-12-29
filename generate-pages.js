const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Paths
const essaysDataPath = './data/essays.json';
const markdownDir = './essays-markdowns';
const outputDir = './essays';
const templatePath = './templates/essay-template.html';

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Helper function to format the date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Load essay data
const essays = JSON.parse(fs.readFileSync(essaysDataPath, 'utf-8'));

// Load HTML template for essays
const template = fs.readFileSync(templatePath, 'utf-8');

// Generate static pages
essays.forEach((essay) => {
    const markdownPath = path.join(markdownDir, essay.filename);

    // Check if the Markdown file exists
    if (!fs.existsSync(markdownPath)) {
        console.error(`Markdown file not found: ${markdownPath}`);
        return;
    }

    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    const htmlContent = marked.parse(markdownContent);

    const formattedDate = formatDate(essay.date);
    const canonicalLink = `https://anantvijay.com/essays/${path.basename(essay.filename, '.md')}.html`;
    const emailLink = `mailto:anantvijayessays@proton.me?subject=Feedback%20for%20${encodeURIComponent(essay.title)}`;

    // Replace placeholders
    const outputHTML = template
        .replace(/{{title}}/g, essay.title)
        .replace(/{{date}}/g, formattedDate)
        .replace(/{{content}}/g, htmlContent)
        .replace(/{{canonical-link}}/g, canonicalLink)
        .replace(/{{email-link}}/g, emailLink)
        .replace(/{{description}}/g, essay.snippet || 'Read this essay on ' + essay.title);

    // Save the generated HTML file
    const outputPath = path.join(outputDir, `${path.basename(essay.filename, '.md')}.html`);
    fs.writeFileSync(outputPath, outputHTML);
    console.log(`Generated: ${outputPath}`);
});
