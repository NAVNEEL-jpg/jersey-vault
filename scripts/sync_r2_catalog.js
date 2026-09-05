import { getR2Table } from '../server/src/services/r2Service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../server/src/data');

const TABLES = ['products', 'teams', 'categories', 'site_settings'];

async function syncAll() {
  console.log('🔄 Syncing Cloudflare R2 tables to local data directory...');
  for (const table of TABLES) {
    try {
      const data = await getR2Table(table);
      const filePath = path.join(dataDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✅ Synced ${table}: ${Array.isArray(data) ? data.length + ' records' : 'object'}`);
    } catch (err) {
      console.error(`❌ Failed to sync ${table}:`, err.message);
    }
  }
  console.log('🎉 Catalog sync completed successfully!');
}

syncAll().catch(console.error);
