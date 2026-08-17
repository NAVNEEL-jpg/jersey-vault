require('dotenv').config({ path: './client/.env' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Utility to generate product slug from name
const generateProductSlug = (name) => {
  if (!name) return "";
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://clytujskrmcnstzuvuaf.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || 'sb_publishable_iTI05LkGPnhWrcwB74-Mug_iOHcZ7xt';
const supabase = createClient(supabaseUrl, supabaseKey);

const DOMAIN = 'https://www.thejerseyvault.in';
const appJsPath = path.join(__dirname, '..', 'client', 'src', 'App.js');
const mappingPath = path.join(__dirname, '..', 'client', 'src', 'utils', 'collection-mapping.js');
const sitemapPath = path.join(__dirname, '..', 'client', 'public', 'sitemap.xml');
const envPath = path.join(__dirname, '..', 'client', '.env');

const appContent = fs.readFileSync(appJsPath, 'utf8');
let routeRegex = /<Route\s+path="([^"]+)"/g;
let matches;
let urls = new Set();
let ignoredRoutes = ['/admin', '/auth', '/checkout', '/success', '/myorders', '/tracking', '/*'];

// Base static pages mapping to priority & freq
const urlConfig = new Map();

const setUrl = (url, priority, freq) => {
  if (ignoredRoutes.some(ignored => url.startsWith(ignored) || url.includes(':') || url.includes('*'))) return;
  
  if (!urlConfig.has(url)) {
    urlConfig.set(url, { loc: `${DOMAIN}${url}`, priority, changefreq: freq });
  }
};

// Start with root
setUrl('/', '1.0', 'daily');

// Parse App.js
while ((matches = routeRegex.exec(appContent)) !== null) {
  let r = matches[1];
  
  let priority = '0.5';
  let freq = 'monthly';
  
  if (r.startsWith('/pages/')) {
    priority = '0.8';
    freq = 'monthly';
  } else if (r === '/faq' || r === '/reviews') {
    priority = '0.7';
  } else if (r === '/contact') {
    priority = '0.6';
  } else if (r === '/privacy' || r === '/terms') {
    priority = '0.3';
  }
  
  setUrl(r, priority, freq);
}

// 2. Get Dynamic Collections from collection-mapping.js
let collContent = fs.readFileSync(mappingPath, 'utf8');
const objRegex = /"([^"]+)"\s*:\s*\{/g;
let collMatches;
while ((collMatches = objRegex.exec(collContent)) !== null) {
  let slug = collMatches[1];
  setUrl(`/collections/${slug}`, '0.9', 'weekly');
}

// 3. Get Products from Supabase
async function buildSitemap() {
  console.log('Fetching products from database...');
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('name');
      
    if (error) {
      console.error('Error fetching products:', error.message);
    } else if (products && products.length > 0) {
      console.log(`Found ${products.length} products.`);
      products.forEach(p => {
        const slug = generateProductSlug(p.name);
        setUrl(`/product/${slug}`, '0.9', 'weekly');
      });
    } else {
      console.log('No products found or empty response.');
    }
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
  }

  // 4. Construct XML
  console.log(`Building sitemap with ${urlConfig.size} valid URLs...`);
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (let [path, config] of urlConfig.entries()) {
    xml += `  <url>\n`;
    xml += `    <loc>${config.loc}</loc>\n`;
    xml += `    <changefreq>${config.changefreq}</changefreq>\n`;
    xml += `    <priority>${config.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log('Sitemap successfully written to client/public/sitemap.xml');
  console.log(`Total URLs: ${urlConfig.size}`);
}

buildSitemap();
