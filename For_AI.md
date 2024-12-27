Context for Personal Website Project

Project Overview:

    This is a text-based personal website featuring the following sections:
        Essays (Homepage)
        Quotes
        Finds
        About (Anant Vijay)

Essays Section

Overview:

    The Essays section displays a reverse-chronological list of essays.
    Each essay shows:
        Title
        Date
        100-word snippet
    Clicking an essay title opens a static page for that essay.

Workflow for Static Essay Pages:

    Markdown Files (essays-markdowns/):
        Each essay is stored as a .md file in the essays-markdowns folder.
        Example:

    essays-markdowns/essay-1.md

Generated HTML Files (essays/):

    Each .md file is converted into a corresponding static .html file in the essays/ folder.
    Example:

    essays/essay-1.html

HTML Template for Essays (templates/essay-template.html):

    A reusable template with placeholders ({{title}}, {{date}}, {{content}}) is used to generate essay pages.
    Template example:

    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{title}}</title>
        <link rel="stylesheet" href="../css/styles.css">
    </head>
    <body>
        <header>
            <nav>
                <a href="../index.html">Essays</a>
                <a href="../about.html">Anant Vijay</a>
                <a href="../quotes.html">Quotes</a>
                <a href="../finds.html">Finds</a>
            </nav>
        </header>
        <main>
            <article>
                <h1>{{title}}</h1>
                <p class="essay-date">{{date}}</p>
                <div class="essay-content">
                    {{content}}
                </div>
            </article>
        </main>
    </body>
    </html>

Generation Script (generate-pages.js):

    Reads essays metadata from data/essays.json.
    Converts each Markdown file into an HTML file using the template.
    Updates index.html with links to the generated pages.

Example code:

    const fs = require('fs');
    const path = require('path');
    const marked = require('marked');

    // Paths
    const essaysDataPath = './data/essays.json';
    const markdownDir = './essays-markdowns';
    const outputDir = './essays';
    const templatePath = './templates/essay-template.html';
    const indexHTMLPath = './index.html';

    // Load essays metadata
    const essays = JSON.parse(fs.readFileSync(essaysDataPath, 'utf-8'));

    // Load the HTML template
    const template = fs.readFileSync(templatePath, 'utf-8');

    // Initialize an array for index.html links
    const essayLinks = [];

    essays.forEach((essay) => {
        const markdownPath = path.join(markdownDir, essay.filename);

        if (!fs.existsSync(markdownPath)) {
            console.error(`Markdown file not found: ${markdownPath}`);
            return;
        }

        // Convert Markdown to HTML
        const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
        const htmlContent = marked.parse(markdownContent);

        // Replace placeholders in the template
        const outputHTML = template
            .replace('{{title}}', essay.title)
            .replace('{{date}}', essay.date)
            .replace('{{content}}', htmlContent);

        const outputFilename = `${path.basename(essay.filename, '.md')}.html`;
        const outputPath = path.join(outputDir, outputFilename);

        // Write the generated HTML
        fs.writeFileSync(outputPath, outputHTML);
        console.log(`Generated: ${outputPath}`);

        // Add link for index.html
        essayLinks.push(
            `<a href="essays/${outputFilename}" class="essay-title">${essay.title}</a>`
        );
    });

    // Update index.html with links
    let indexHTML = fs.readFileSync(indexHTMLPath, 'utf-8');
    indexHTML = indexHTML.replace(
        /<div id="essays-container">[\s\S]*?<\/div>/,
        `<div id="essays-container">\n${essayLinks.join('\n')}\n</div>`
    );
    fs.writeFileSync(indexHTMLPath, indexHTML);
    console.log('Updated index.html with essay links.');

Quotes Section

Overview:

    Displays a list of quotes with:
        Quote text at the top.
        Author name left-aligned (no dash, not italicized).
        Copy and share icons right-aligned on the same line as the author.

Key Features:

    Blue vertical line (2px) to the left of each quote.
    Adequate spacing (40px) between quotes.

Workflow:

    Quotes JSON (data/quotes.json):
        Quotes are stored in a JSON file with the structure:

    [
      {
        "text": "Sample quote text.",
        "author": "Author Name"
      }
    ]

Quotes HTML (quotes.html):

    Dynamically renders quotes using JavaScript.

TypeScript (ts/quotes.ts):

    Fetches quotes from quotes.json.
    Renders the quote, author, and action buttons.
    Copy button: Copies the quote text.
    Share button: Generates a shareable URL.

CSS (styles.css):

    Layout and styling for quotes:
        .quote-item: Container for each quote with a blue line.
        .quote-meta: Aligns the author and icons on the same line.
        .quote-icons: Styles the action buttons.