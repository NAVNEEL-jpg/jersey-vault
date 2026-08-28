import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'jersey-vault-media';

let s3Client = null;
if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  try {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  } catch (err) {
    console.error('Failed to initialize S3Client for R2:', err);
  }
}

// In-memory cache with 5 minute TTL
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Get table data from Cloudflare R2 (with in-memory cache and local file fallback)
 * @param {string} tableName - e.g. 'products', 'teams', 'site_settings', 'categories'
 */
export async function getR2Table(tableName) {
  const cacheKey = `r2_${tableName}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Try reading from Cloudflare R2
  if (s3Client) {
    try {
      const cmd = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: `db/${tableName}.json`,
      });
      const res = await s3Client.send(cmd);
      const jsonStr = await streamToString(res.Body);
      const data = JSON.parse(jsonStr);
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      console.warn(`[R2Service] Failed to read db/${tableName}.json from R2, trying local fallback:`, err.message);
    }
  }

  // 2. Local file fallback from server/src/data/
  try {
    const localFilePath = path.resolve(__dirname, `../data/${tableName}.json`);
    if (fs.existsSync(localFilePath)) {
      const localStr = fs.readFileSync(localFilePath, 'utf8');
      const data = JSON.parse(localStr);
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    }
  } catch (localErr) {
    console.error(`[R2Service] Local fallback failed for ${tableName}:`, localErr.message);
  }

  return [];
}

/**
 * Update table data in Cloudflare R2 and update local backup
 * @param {string} tableName
 * @param {any} data
 */
export async function updateR2Table(tableName, data) {
  const jsonStr = JSON.stringify(data, null, 2);

  // Invalidate cache
  cache.set(`r2_${tableName}`, { data, timestamp: Date.now() });

  // Update local file
  try {
    const serverDataDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(serverDataDir)) {
      fs.mkdirSync(serverDataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(serverDataDir, `${tableName}.json`), jsonStr, 'utf8');
  } catch (err) {
    console.error(`[R2Service] Failed to write local fallback for ${tableName}:`, err.message);
  }

  // Upload to R2
  if (s3Client) {
    try {
      const cmd = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: `db/${tableName}.json`,
        Body: jsonStr,
        ContentType: 'application/json',
      });
      await s3Client.send(cmd);
    } catch (err) {
      console.error(`[R2Service] Failed to write db/${tableName}.json to R2:`, err.message);
      throw err;
    }
  }
}
