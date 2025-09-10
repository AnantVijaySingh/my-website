const fs = require('fs');
const path = require('path');

// Directory where HTML files are stored
const publicDir = './';
const baseUrl = 'https://anantvijay.com';

// Directories to exclude from sitemap
const excludeDirs = ['node_modules', '.git', 'templates'];

// Helper function to get today's date in YYYY-MM-DD format
const getCurrentDate = () => new Date().toISOString().split('T')[0];

// Helper function to encode URL for XML sitemap
function encodeUrl(url) {
    return url
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Collect all HTML files in the public directory
function generateSitemap() {
    const urls = [];

    function traverseDirectory(directory) {
        fs.readdirSync(directory).forEach((file) => {
            const fullPath = path.join(directory, file);
            const relativePath = path.relative(publicDir, fullPath);
            
            // Skip excluded directories
            if (excludeDirs.some(dir => relativePath.startsWith(dir))) {
                return;
            }
            
            if (fs.statSync(fullPath).isDirectory()) {
                traverseDirectory(fullPath);
            } else if (file.endsWith('.html')) {
                const url = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;
                const stats = fs.statSync(fullPath);
                const lastModified = new Date(stats.mtime).toISOString().split('T')[0];
                urls.push(`<url>
    <loc>${encodeUrl(url)}</loc>
    <lastmod>${lastModified}</lastmod>
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
