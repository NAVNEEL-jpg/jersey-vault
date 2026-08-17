const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', 'client');
const mappingPath = path.join(rootDir, 'src', 'utils', 'collection-mapping.js');
const guidesDir = path.join(rootDir, 'src', 'pages', 'guides');
const productSeoPath = path.join(rootDir, 'src', 'components', 'ProductSEO.jsx');
const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');

// 1. Collections Audit
const mappingContent = fs.readFileSync(mappingPath, 'utf8');
const objRegex = /"([^"]+)"\s*:\s*\{/g;
let collMatches;
let collectionsCount = 0;
while ((collMatches = objRegex.exec(mappingContent)) !== null) {
  collectionsCount++;
}

// 2. Guides Audit
const guides = fs.readdirSync(guidesDir).filter(f => f.endsWith('.jsx'));
let totalWords = 0;
let minWords = Infinity;
let maxWords = 0;
guides.forEach(g => {
  const content = fs.readFileSync(path.join(guidesDir, g), 'utf8');
  // Strip HTML tags for word count
  const text = content.replace(/<[^>]*>?/gm, '');
  const words = text.split(/\s+/).length;
  totalWords += words;
  if (words < minWords) minWords = words;
  if (words > maxWords) maxWords = words;
});
const avgWords = Math.round(totalWords / guides.length);

// 3. URLs
const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
const sitemapCount = (sitemapContent.match(/<url>/g) || []).length;

console.log(JSON.stringify({
  collections: collectionsCount,
  guides: guides.length,
  guideMinWords: minWords,
  guideMaxWords: maxWords,
  guideAvgWords: avgWords,
  sitemapURLs: sitemapCount
}));
