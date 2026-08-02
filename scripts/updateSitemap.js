const fs = require('fs');
const path = require('path');

const APP_JS = path.join(__dirname, 'client', 'src', 'App.js');
const SITEMAP = path.join(__dirname, 'client', 'public', 'sitemap.xml');
const DOMAIN = 'https://www.thejerseyvault.in';

let appJsContent = fs.readFileSync(APP_JS, 'utf8');
let routeRegex = /<Route\s+path="([^"]+)"/g;

let matches;
let urls = [];

// Base manual routes
urls.push('/');
urls.push('/collections/retro');
urls.push('/collections/player-version');
urls.push('/collections/fan-version');

while ((matches = routeRegex.exec(appJsContent)) !== null) {
  let r = matches[1];
  if (r.includes(':') || r.includes('*')) continue;
  if (!urls.includes(r)) {
    urls.push(r);
  }
}

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

urls.forEach(u => {
  xml += `  <url>\n    <loc>${DOMAIN}${u}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${u === '/' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
});

xml += `</urlset>`;

fs.writeFileSync(SITEMAP, xml);
console.log('Generated sitemap with ' + urls.length + ' static routes!');
