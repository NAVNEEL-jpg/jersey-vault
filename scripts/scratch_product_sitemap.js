const fs = require('fs');
require('dotenv').config({ path: 'client/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

function generateProductSlug(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function run() {
  let sitemap = fs.readFileSync('client/public/sitemap.xml', 'utf8');
  const { data, error } = await supabase.from('products').select('name').eq('status', 'active');
  if (error || !data) {
     console.error(error);
     return;
  }
  
  const urls = data.map(p => {
    const slug = generateProductSlug(p.name);
    return `
  <url>
    <loc>https://www.thejerseyvault.in/product/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('');
  
  sitemap = sitemap.replace('</urlset>', urls + '\n</urlset>');
  fs.writeFileSync('client/public/sitemap.xml', sitemap);
  console.log('Product sitemap updated with ' + data.length + ' products.');
}
run();
