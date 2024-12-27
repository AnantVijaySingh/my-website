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

    // Ensure title and other placeholders are available
    if (!essay.title || !essay.date) {
        console.error(`Missing title or date for essay: ${essay.filename}`);
        return;
    }

    // Log title and other fields for debugging
    console.log(`Processing: ${essay.filename}`);
    console.log(`Title: ${essay.title}`);
    console.log(`Date: ${essay.date}`);
    console.log(`Content: ${htmlContent.substring(0, 100)}...`); // Log a snippet of the content

    // Format the date
    const formattedDate = formatDate(essay.date);

    // Replace placeholders in the template
    const emailLink = `mailto:anantvijayessays@proton.me?subject=Feedback%20for%20${encodeURIComponent(essay.title)}`;
    const outputHTML = template
        .replace(/{{title}}/g, essay.title)
        .replace('{{date}}', formattedDate)
        .replace('{{content}}', htmlContent)
        .replace('{{email-link}}', emailLink);

    // Log the generated HTML for debugging
    // console.log(`Generated HTML: ${outputHTML.substring(0, 200)}...`);


    // Generate the output file path
    const outputFilename = `${path.basename(essay.filename, '.md')}.html`;
    const outputPath = path.join(outputDir, outputFilename);

    // Write the generated HTML file
    fs.writeFileSync(outputPath, outputHTML);
    console.log(`Generated: ${outputPath}`);
});

