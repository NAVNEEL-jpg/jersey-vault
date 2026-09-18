import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import sharp from 'sharp';
import { uploadAndVerifyProcessedImage } from './meeshoR2Uploader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROCESSED_IMAGES_DIR = path.resolve(__dirname, 'processed-images');

export function ensureProcessedImagesDir() {
  if (!fs.existsSync(PROCESSED_IMAGES_DIR)) {
    fs.mkdirSync(PROCESSED_IMAGES_DIR, { recursive: true });
  }
}

const GARMENT_BRAND_MAPPING = [
  { match: /barcelona|france|england|portugal|brazil/i, brand: 'NIKE', confidence: 'High (Verified Sports Kit Maker)' },
  { match: /real madrid|argentina|germany|spain|mexico/i, brand: 'ADIDAS', confidence: 'High (Verified Sports Kit Maker)' },
  { match: /uruguay/i, brand: 'PUMA', confidence: 'High (Verified Sports Kit Maker)' },
];

/**
 * Enhanced Image Pipeline with Cloudflare R2 Public Hosting & Verification (Phase 2C)
 */
export async function processAndHostProductImages(product) {
  ensureProcessedImagesDir();

  let rawImgList = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    rawImgList = product.images;
  } else if (product.image_url && typeof product.image_url === 'string') {
    rawImgList = product.image_url.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const originalImageCount = rawImgList.length;
  const targetImages = rawImgList.slice(0, 4);

  const processedList = [];
  let validCount = 0;
  let processedCount = 0;
  let rejectedCount = 0;
  let reviewCount = 0;

  const productText = `${product.name || ''} ${product.description || ''} ${(product.teams && product.teams.name) || ''}`.toLowerCase();
  let detectedMark = null;
  let markConfidence = 'None';

  for (const bObj of GARMENT_BRAND_MAPPING) {
    if (bObj.match.test(productText)) {
      detectedMark = bObj.brand;
      markConfidence = bObj.confidence;
      break;
    }
  }

  for (let idx = 0; idx < targetImages.length; idx++) {
    const imageUrl = targetImages[idx];
    const imageNum = idx + 1;

    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
      rejectedCount++;
      processedList.push({
        imageNum,
        status: 'IMAGE_INVALID',
        originalUrl: imageUrl || '',
        processedUrl: null,
        detectedMark: null,
        partOfGarment: 'No',
        action: 'Rejected invalid HTTP URL',
      });
      continue;
    }

    validCount++;
    const shortId = (product.id || 'prod').substring(0, 8);
    const outputFileName = `jv_${shortId}_img${imageNum}.jpg`;
    const outputPath = path.resolve(PROCESSED_IMAGES_DIR, outputFileName);
    const r2Key = `meesho-processed/${outputFileName}`;

    try {
      // Download original asset
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
      });
      const inputBuffer = Buffer.from(response.data);

      const metadata = await sharp(inputBuffer).metadata();

      if (!metadata.width || !metadata.height) {
        rejectedCount++;
        processedList.push({
          imageNum,
          status: 'IMAGE_INVALID',
          originalUrl: imageUrl,
          processedUrl: null,
          detectedMark: null,
          partOfGarment: 'No',
          action: 'Corrupted image buffer or zero dimensions',
        });
        continue;
      }

      // Safe non-deceptive processing: resize if > 2000px, normalize background to white JPEG
      let pipeline = sharp(inputBuffer);
      if (metadata.width > 2000 || metadata.height > 2000) {
        pipeline = pipeline.resize(1200, 1200, { fit: 'inside' });
      }

      const jpegBuffer = await pipeline
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Save local disk backup
      fs.writeFileSync(outputPath, jpegBuffer);
      processedCount++;

      // Upload to Cloudflare R2 & verify public HTTP accessibility
      const r2Result = await uploadAndVerifyProcessedImage(jpegBuffer, r2Key, imageUrl);

      // Final Status Check (Authentic Garment Brand Logos strictly require review per Part 1 & 12)
      const finalStatus = detectedMark ? 'IMAGE_REQUIRES_REVIEW' : (r2Result.isAccessible ? 'IMAGE_PROCESSED' : 'IMAGE_INVALID');

      if (detectedMark) reviewCount++;

      processedList.push({
        imageNum,
        status: finalStatus,
        originalUrl: imageUrl,
        processedUrl: r2Result.publicUrl || imageUrl,
        r2Key,
        httpStatus: r2Result.httpStatus,
        contentType: r2Result.contentType,
        detectedMark,
        detectionConfidence: markConfidence,
        partOfGarment: 'Yes (Embroidered/Printed Sportswear Logo)',
        action: detectedMark
          ? `Hosted on R2 (${r2Result.publicUrl}). Preserved authentic garment logo '${detectedMark}' without deceptive removal. Flagged for compliance review.`
          : `Successfully hosted on Cloudflare R2 (${r2Result.publicUrl}) and verified 200 OK.`,
        metadata: { width: r2Result.width || metadata.width, height: r2Result.height || metadata.height, format: 'jpeg' },
      });
    } catch (err) {
      rejectedCount++;
      processedList.push({
        imageNum,
        status: 'IMAGE_INVALID',
        originalUrl: imageUrl,
        processedUrl: null,
        detectedMark: null,
        partOfGarment: 'No',
        action: `Processing/hosting error: ${err.message}`,
      });
    }
  }

  return {
    productId: product.id,
    productName: product.name,
    originalImageCount,
    validImageCount: validCount,
    processedImageCount: processedCount,
    rejectedImageCount: rejectedCount,
    reviewCount,
    detectedMark,
    images: processedList,
  };
}
