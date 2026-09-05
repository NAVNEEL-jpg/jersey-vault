import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadFileToR2, getR2Table, updateR2Table } from '../server/src/services/r2Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processImages() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const files = [
    {
      name: 'arsenal',
      src: 'C:/Users/admin/.gemini/antigravity-ide/brain/c8d895fe-7ae7-40de-a7f3-85f23ced21c6/.user_uploaded/media_1788613443851.jpg'
    },
    {
      name: 'manchester-united',
      src: 'C:/Users/admin/.gemini/antigravity-ide/brain/c8d895fe-7ae7-40de-a7f3-85f23ced21c6/.user_uploaded/media_1788613452883.jpg'
    }
  ];

  const outDir = path.resolve(__dirname, '../client/public/teams');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const f of files) {
    const base64 = fs.readFileSync(f.src).toString('base64');
    const dataUrl = 'data:image/jpeg;base64,' + base64;

    const pngBase64 = await page.evaluate(async (imgSrc) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          const w = canvas.width;
          const h = canvas.height;

          // Flood-fill from borders to make outer white transparent
          const visited = new Uint8Array(w * h);
          const queue = [];

          // Add border pixels
          for (let x = 0; x < w; x++) {
            queue.push(x, 0);
            queue.push(x, h - 1);
          }
          for (let y = 0; y < h; y++) {
            queue.push(0, y);
            queue.push(w - 1, y);
          }

          function isWhite(idx) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            return r > 230 && g > 230 && b > 230;
          }

          let qHead = 0;
          while (qHead < queue.length) {
            const qx = queue[qHead++];
            const qy = queue[qHead++];
            const pixelIndex = qy * w + qx;

            if (visited[pixelIndex]) continue;
            visited[pixelIndex] = 1;

            const idx = pixelIndex * 4;
            if (isWhite(idx)) {
              data[idx + 3] = 0; // Make transparent!

              // Add 4-way neighbors
              if (qx > 0 && !visited[qy * w + qx - 1]) queue.push(qx - 1, qy);
              if (qx < w - 1 && !visited[qy * w + qx + 1]) queue.push(qx + 1, qy);
              if (qy > 0 && !visited[(qy - 1) * w + qx]) queue.push(qx, qy - 1);
              if (qy < h - 1 && !visited[(qy + 1) * w + qx]) queue.push(qx, qy + 1);
            }
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png').split(',')[1]);
        };
        img.src = imgSrc;
      });
    }, dataUrl);

    const outBuf = Buffer.from(pngBase64, 'base64');
    fs.writeFileSync(path.join(outDir, f.name + '.png'), outBuf);
    fs.writeFileSync(path.join(outDir, f.name + '.jpg'), outBuf);
    console.log('Saved local transparent files:', f.name, outBuf.length, 'bytes');

    // Upload transparent PNG to Cloudflare R2
    await uploadFileToR2(outBuf, 'teams/' + f.name + '.png', 'image/png');
    await uploadFileToR2(outBuf, 'teams/' + f.name + '.jpg', 'image/png');
    console.log('Uploaded transparent PNGs to Cloudflare R2 for', f.name);
  }

  await browser.close();

  // Update R2 database table with .png
  const teams = await getR2Table('teams');
  const arsenal = teams.find(t => t.name === 'ARSENAL');
  const manUtd = teams.find(t => t.name === 'MANCHESTER UNITED');

  if (arsenal) arsenal.logo_url = 'https://pub-d7ef29e16fdd45ccb2e5e07e3e81b251.r2.dev/teams/arsenal.png';
  if (manUtd) manUtd.logo_url = 'https://pub-d7ef29e16fdd45ccb2e5e07e3e81b251.r2.dev/teams/manchester-united.png';

  await updateR2Table('teams', teams);
  console.log('Updated teams table with transparent PNG URLs in Cloudflare R2');

  // Also sync client/src/data/teams.json
  const clientTeamsPath = path.resolve(__dirname, '../client/src/data/teams.json');
  fs.writeFileSync(clientTeamsPath, JSON.stringify(teams, null, 2), 'utf8');
  console.log('Synced client/src/data/teams.json');
}

processImages().catch(console.error);
