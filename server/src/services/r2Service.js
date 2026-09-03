import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getS3Client() {
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'f4bf36f10d886d4adf42e94b084e1c3f';
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

let s3Client = getS3Client();
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'jersey-vault-media';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-d7ef29e16fdd45ccb2e5e07e3e81b251.r2.dev';

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

/**
 * Upload arbitrary file (image/media) directly to Cloudflare R2
 * @param {Buffer} fileBuffer
 * @param {string} key - e.g. 'products/123.webp'
 * @param {string} contentType - e.g. 'image/webp'
 * @returns {Promise<string>} publicUrl
 */
export async function uploadFileToR2(fileBuffer, key, contentType = 'image/jpeg') {
  if (s3Client) {
    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });
    await s3Client.send(cmd);
    const cleanUrl = R2_PUBLIC_URL.replace(/\/+$/, '');
    return `${cleanUrl}/${key.replace(/^\/+/, '')}`;
  }
  throw new Error('Cloudflare R2 client is not configured');
}

// ── PRODUCT CRUD HELPERS ────────────────────────────────────────────────────

export async function createProductInR2(productData) {
  const products = await getR2Table('products');
  const teams = await getR2Table('teams');

  const team = teams.find(t => t.id === productData.team_id);
  const newProduct = {
    id: productData.id || crypto.randomUUID(),
    name: productData.name,
    price: Number(productData.price) || 0,
    originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
    description: productData.description || '—',
    image_url: productData.image_url || (Array.isArray(productData.images) ? productData.images.join(',') : ''),
    images: Array.isArray(productData.images) ? productData.images : (productData.image_url ? productData.image_url.split(',') : []),
    stock: Number(productData.stock) || 0,
    size_stock: productData.size_stock || { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
    status: productData.status || 'active',
    type: productData.type || 'FAN VERSION',
    team_id: productData.team_id || '',
    teams: team ? { id: team.id, name: team.name, logo_url: team.logo_url, sport: team.sport } : undefined,
    featured: !!productData.featured,
    isFeatured: !!productData.isFeatured || !!productData.featured,
    is_clearance: !!productData.is_clearance,
    is_26_27: !!productData.is_26_27,
    category_id: productData.category_id,
    subcategory_id: productData.subcategory_id,
    category: productData.category,
    sub_category: productData.sub_category,
    slug: productData.slug || `${String(productData.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const updatedProducts = [newProduct, ...products];
  await updateR2Table('products', updatedProducts);
  return newProduct;
}

export async function updateProductInR2(id, updates) {
  const products = await getR2Table('products');
  const teams = await getR2Table('teams');

  const index = products.findIndex(p => String(p.id) === String(id));
  if (index === -1) return null;

  const current = products[index];
  const targetTeamId = updates.team_id !== undefined ? updates.team_id : current.team_id;
  const team = targetTeamId ? teams.find(t => t.id === targetTeamId) : current.teams;

  const updatedProduct = {
    ...current,
    ...updates,
    id: current.id, // Immutable ID
    price: updates.price !== undefined ? Number(updates.price) : current.price,
    stock: updates.stock !== undefined ? Number(updates.stock) : current.stock,
    teams: team ? { id: team.id, name: team.name, logo_url: team.logo_url, sport: team.sport } : current.teams,
    updated_at: new Date().toISOString(),
  };

  products[index] = updatedProduct;
  await updateR2Table('products', products);
  return updatedProduct;
}

export async function deleteProductInR2(id) {
  const products = await getR2Table('products');
  const filtered = products.filter(p => String(p.id) !== String(id));
  if (filtered.length === products.length) return false;

  await updateR2Table('products', filtered);
  return true;
}

export async function updateSizeStockInR2(productId, size, qtyChange) {
  const products = await getR2Table('products');
  const prod = products.find(p => String(p.id) === String(productId));
  if (!prod) return { success: false, message: 'Product not found' };

  prod.size_stock = prod.size_stock || {};
  const currentSizeQty = Number(prod.size_stock[size]) || 0;
  const newSizeQty = Math.max(0, currentSizeQty + Number(qtyChange));
  prod.size_stock[size] = newSizeQty;

  // Recalculate total stock
  prod.stock = Object.values(prod.size_stock).reduce((a, b) => a + (Number(b) || 0), 0);

  await updateR2Table('products', products);
  return { success: true, product: prod };
}

// ── TEAM CRUD HELPERS ───────────────────────────────────────────────────────

export async function createTeamInR2(teamData) {
  const teams = await getR2Table('teams');
  const newTeam = {
    id: teamData.id || crypto.randomUUID(),
    name: String(teamData.name || '').trim().toUpperCase(),
    sport: String(teamData.sport || 'FOOTBALL').toUpperCase(),
    logo_url: teamData.logo_url || '',
    created_at: new Date().toISOString(),
  };

  const updatedTeams = [...teams, newTeam].sort((a, b) => a.name.localeCompare(b.name));
  await updateR2Table('teams', updatedTeams);
  return newTeam;
}

export async function updateTeamInR2(id, updates) {
  const teams = await getR2Table('teams');
  const index = teams.findIndex(t => String(t.id) === String(id));
  if (index === -1) return null;

  teams[index] = {
    ...teams[index],
    ...updates,
    id: teams[index].id,
  };

  await updateR2Table('teams', teams);
  return teams[index];
}

export async function deleteTeamInR2(id) {
  const teams = await getR2Table('teams');
  const filtered = teams.filter(t => String(t.id) !== String(id));
  if (filtered.length === teams.length) return false;

  await updateR2Table('teams', filtered);
  return true;
}

export async function getFileStreamFromR2(key) {
  const client = s3Client || getS3Client();
  if (!client) return null;
  try {
    const cmd = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'jersey-vault-media',
      Key: key,
    });
    const res = await client.send(cmd);
    return {
      Body: res.Body,
      ContentType: res.ContentType,
      ContentLength: res.ContentLength,
    };
  } catch (err) {
    console.error(`[r2Service:getFileStreamFromR2] Error reading ${key}:`, err.message);
    return null;
  }
}
