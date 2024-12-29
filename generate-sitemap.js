const fs = require('fs');
const path = require('path');

// Directory where HTML files are stored
const publicDir = './';
const baseUrl = 'https://anantvijay.com';

// Helper function to get today's date in YYYY-MM-DD format
const getCurrentDate = () => new Date().toISOString().split('T')[0];

// Collect all HTML files in the public directory
function generateSitemap() {
    const urls = [];

    function traverseDirectory(directory) {
        fs.readdirSync(directory).forEach((file) => {
            const fullPath = path.join(directory, file);
            if (fs.statSync(fullPath).isDirectory()) {
                traverseDirectory(fullPath);
            } else if (file.endsWith('.html')) {
                const relativePath = path.relative(publicDir, fullPath);
                urls.push(`<url>
    <loc>${baseUrl}/${relativePath.replace(/\\/g, '/')}</loc>
    <lastmod>${getCurrentDate()}</lastmod>
    <priority>0.8</priority>
</url>`);
            }
        });
    }

    traverseDirectory(publicDir);

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent);
    console.log('Sitemap generated at ./sitemap.xml');
}

generateSitemap();
