const fs = require('fs');
const path = require('path');

const sitemapPath = path.join(__dirname, 'client', 'public', 'sitemap.xml');
let sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

const guideRoutes = [
  '/pages/size-guide',
  '/pages/player-version-vs-fan-version',
  '/pages/buying-guide',
  '/pages/care-guide',
  '/pages/materials-guide',
  '/pages/retro-guide',
  '/pages/patch-guide',
  '/pages/printing-guide',
  '/pages/shipping-guide',
  '/pages/returns-guide'
];

let newEntries = '';
guideRoutes.forEach(route => {
  if (!sitemapContent.includes(route)) {
    newEntries += `
  <url>
    <loc>https://www.thejerseyvault.in${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }
});

if (newEntries) {
  sitemapContent = sitemapContent.replace('</urlset>', newEntries + '\n</urlset>');
  fs.writeFileSync(sitemapPath, sitemapContent);
  console.log('Sitemap updated successfully.');
} else {
  console.log('Sitemap already contains guide routes.');
}
