import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function getR2File(key) {
  const cmd = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });
  const res = await s3.send(cmd);
  return await streamToString(res.Body);
}

async function putR2File(key, content) {
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: content,
    ContentType: 'application/json',
  });
  await s3.send(cmd);
}

const ACCURATE_NAME_MAP = {
  '00aeecf7-8853-4de9-9c6e-0266e778740b': 'Barcelona 26/27 Away Jersey (Fan Version)',
  '2705c8b3-cdd0-4264-957f-c8612b7de6b8': 'Argentina Home WC Jersey (Clearance Sale)',
  '28326a04-6e80-4814-98f5-50e35e1cd079': 'Brazil Away WC Jersey (Player Version)',
  '29f9a975-2544-4ab0-b614-b635bdec1b73': 'Real Madrid 26/27 Third Kit Jersey',
  '3754d09b-3b6b-48a3-a00c-5a2e7d49f802': 'England Away WC Jersey (Player Version)',
  '4988894b-1a3e-4e77-bf64-a9a6bd401b49': 'Portugal 25/26 Special Edition Jersey',
  '4c8f900b-ae01-4c26-b54d-f0f07b386762': 'Uruguay Away WC Jersey (Fan Version)',
  '4e6a9c74-064d-4451-ba38-a4a364dfacab': 'France Away WC Jersey (Player Version)',
  '5533f900-4a74-4172-a520-ff680736f3e7': 'France Away WC Jersey (Clearance Sale)',
  '555887d3-34e6-480e-bf89-8081c8835f47': 'Spain Away WC Jersey (Fan Version)',
  '5d3d8465-f5a7-4518-92d5-39acd3ab59f9': 'Argentina Away WC Jersey (Fan Version)',
  '5db66604-41b6-48ca-9ba2-029e27b8702e': 'Spain Away WC Jersey (Player Version)',
  '60edb45f-ef9e-457f-8c51-8acf6d74ced3': 'Portugal Home WC Jersey (Fan Version)',
  '69fe8ccc-1efb-41c8-8977-a5bd47fabc7b': 'Barcelona 26/27 Away Jersey (Player Version)',
  '7351dc2e-410d-4289-b57f-26b92b57f351': 'Spain Home WC Jersey (Player Version)',
  '744241bf-a19f-415d-b0f0-95b034ec7407': 'England Home WC Jersey (Player Version)',
  '772560be-1776-4b5b-b7d4-1e3f7f39f913': 'Uruguay Away WC Jersey (Player Version)',
  '7f29e965-2275-4441-a1cb-f9a9704d311e': 'Real Madrid 26/27 Away Jersey (Player Version)',
  '7f6b91d4-e3b4-40ea-bccf-9d308af3e801': 'Portugal Away WC Jersey (Clearance Sale)',
  '84e28930-d2f9-4a5c-a2f6-5f76094de6e7': 'Brazil Home WC Jersey (Clearance Sale)',
  '9100823d-900b-4370-9405-69f62f08830f': 'Brazil Home WC Jersey (Player Version)',
  '92b2ff01-8dab-4b48-ac52-932096d130b4': 'England Away WC Jersey (Fan Version)',
  '936a9e10-1ba1-4f02-a1c2-dd721346e5c2': 'Germany Home WC Jersey (Player Version)',
  'a23a1326-516b-4c28-b73d-6e3ed8b7bdb2': 'Mexico Home WC Jersey (Fan Version)',
  'b879adc7-2218-4c86-b9a7-a3d5ccf965cd': 'Barcelona 26/27 Home Jersey (Player Version)',
  'bc6244b0-a444-4a23-8a8a-c99a38dc552c': 'Barcelona 26/27 Home Jersey (Fan Version)',
  'c21205e9-0b9b-47d0-94db-d86b13ea586c': 'Real Madrid 26/27 Home Jersey (Fan Version)',
  'ce38bc20-f9a1-4708-afca-9e3dbba7b488': 'Brazil Away WC Jersey (Fan Version)',
  'ce61146b-2c39-4a64-a536-719432c14c89': 'England Home WC Jersey (Fan Version)',
  'dde8a532-6085-4901-b8d3-e4ba2de8b70c': 'Real Madrid 25/26 Home Jersey (Fan Version)',
  'e77c777f-291c-47de-b28b-4ca956ff3b1a': 'Argentina Home WC Jersey (Player Version)',
  'e7e8895a-350a-403c-b0ac-4d2e39713ee3': 'Portugal Home WC Jersey (Player Version)',
  'e83e635c-88fc-4813-8886-cccd36b7d17b': 'Argentina Away WC Jersey (Player Version)',
  'f6bf55f1-2c2a-463c-acc5-5269182e021a': 'Uruguay Home WC Jersey (Player Version)',
  'fb3f7d4b-1db3-44a4-bf7d-7482b1661827': 'France Home WC Jersey (Fan Version)',
  'fc20e9dd-059e-470f-8f39-be91be9160f2': 'Barcelona 25/26 Home Jersey (Player Version)',
};

async function sanitizeAndSync() {
  console.log('--- Fetching R2 DB tables ---');

  const productsRaw = await getR2File('db/products.json');
  const teamsRaw = await getR2File('db/teams.json');
  const siteSettingsRaw = await getR2File('db/site_settings.json');
  const categoriesRaw = await getR2File('db/categories.json');

  const products = JSON.parse(productsRaw);
  const teams = JSON.parse(teamsRaw);
  const siteSettings = JSON.parse(siteSettingsRaw);
  const categories = JSON.parse(categoriesRaw);

  console.log(`Original products count: ${products.length}`);

  const cleanedProducts = products.map((p, idx) => {
    const cleanName = ACCURATE_NAME_MAP[p.id] || p.name.replace(/\s+/g, ' ').trim();
    console.log(`[${idx + 1}] ID: ${p.id} -> "${cleanName}"`);
    return {
      ...p,
      name: cleanName,
    };
  });

  // Ensure local server data directory exists
  const serverDataDir = path.resolve(__dirname, '../server/src/data');
  if (!fs.existsSync(serverDataDir)) {
    fs.mkdirSync(serverDataDir, { recursive: true });
  }

  // Save local JSON files
  fs.writeFileSync(path.join(serverDataDir, 'products.json'), JSON.stringify(cleanedProducts, null, 2));
  fs.writeFileSync(path.join(serverDataDir, 'teams.json'), JSON.stringify(teams, null, 2));
  fs.writeFileSync(path.join(serverDataDir, 'site_settings.json'), JSON.stringify(siteSettings, null, 2));
  fs.writeFileSync(path.join(serverDataDir, 'categories.json'), JSON.stringify(categories, null, 2));

  console.log('✓ Saved local data backups in server/src/data/');

  // Upload sanitized products.json back to Cloudflare R2
  await putR2File('db/products.json', JSON.stringify(cleanedProducts, null, 2));
  console.log('✓ Uploaded sanitized db/products.json to Cloudflare R2');

  console.log('Sanitization complete!');
}

sanitizeAndSync().catch(console.error);
