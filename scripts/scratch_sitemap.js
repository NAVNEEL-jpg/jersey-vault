const fs = require('fs');

const keys = [
  "barcelona", "real-madrid", "atletico-madrid", "arsenal", "manchester-united", 
  "liverpool", "chelsea", "manchester-city", "tottenham", "ac-milan", "inter-milan",
  "juventus", "bayern-munich", "psg", "borussia-dortmund", "argentina", "brazil",
  "portugal", "france", "germany", "spain", "england", "italy", "retro", 
  "player-version", "fan-version", "premier-league", "la-liga", "serie-a", 
  "bundesliga", "ligue-1", "international"
];

let sitemap = fs.readFileSync('client/public/sitemap.xml', 'utf8');

const urls = keys.map(slug => `
  <url>
    <loc>https://www.thejerseyvault.in/collections/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('');

if (!sitemap.includes('collections/barcelona')) {
    sitemap = sitemap.replace('</urlset>', urls + '\n</urlset>');
    fs.writeFileSync('client/public/sitemap.xml', sitemap);
    console.log('Sitemap updated.');
} else {
    console.log('Sitemap already updated.');
}
