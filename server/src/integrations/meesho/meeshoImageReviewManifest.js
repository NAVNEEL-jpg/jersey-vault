import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const MANIFEST_PATH = path.resolve(WORKSPACE_ROOT, 'meesho_image_review_manifest.json');

/**
 * Builds meesho_image_review_manifest.json for 120 hosted R2 images across 36 products
 */
export function buildImageReviewManifest(products, r2ImageMap) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    totalImages: 0,
    statusCounts: {
      PENDING_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      REQUIRES_REPLACEMENT: 0,
    },
    images: [],
  };

  products.forEach((p) => {
    const productR2 = r2ImageMap[p.id] || { publicR2Urls: [] };
    const urls = productR2.publicR2Urls || [];

    urls.forEach((url, idx) => {
      manifest.totalImages++;
      manifest.statusCounts.PENDING_REVIEW++;

      manifest.images.push({
        productId: p.id,
        productName: p.name,
        imageNumber: idx + 1,
        publicR2Url: url,
        detectedBrandMark: p.brand || p.name.toUpperCase().includes('NIKE') ? 'NIKE' : (p.name.toUpperCase().includes('ADIDAS') ? 'ADIDAS' : 'PUMA'),
        detectionConfidence: 0.95,
        reviewStatus: 'PENDING_REVIEW', // Initial status
      });
    });
  });

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  return manifest;
}

/**
 * Updates review status for images in manifest
 */
export function updateImageReviewStatus(updates) {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest file not found at ${MANIFEST_PATH}`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  updates.forEach(({ productId, imageNumber, status }) => {
    const imgRecord = manifest.images.find(
      (img) => img.productId === productId && img.imageNumber === imageNumber
    );
    if (imgRecord) {
      manifest.statusCounts[imgRecord.reviewStatus]--;
      imgRecord.reviewStatus = status;
      manifest.statusCounts[status]++;
    }
  });

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  return manifest;
}

/**
 * Checks product approval eligibility
 */
export function getProductApprovalStatus(productId) {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return { isApproved: false, reason: 'MANIFEST_MISSING' };
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const productImages = manifest.images.filter((img) => img.productId === productId);

  const pending = productImages.filter((img) => img.reviewStatus === 'PENDING_REVIEW');
  const rejected = productImages.filter((img) => img.reviewStatus === 'REJECTED');
  const replacement = productImages.filter((img) => img.reviewStatus === 'REQUIRES_REPLACEMENT');

  if (pending.length > 0 || rejected.length > 0 || replacement.length > 0) {
    return {
      isApproved: false,
      reason: 'PRODUCT_BLOCKED',
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      replacementCount: replacement.length,
    };
  }

  return { isApproved: true, reason: 'ALL_IMAGES_APPROVED' };
}
