import axios from 'axios';
import sharp from 'sharp';
import { uploadFileToR2 } from '../../services/r2Service.js';

/**
 * Cloudflare R2 Public Image Hosting & Verification Service for Meesho Integration (Phase 2C)
 */
export async function uploadAndVerifyProcessedImage(imageBuffer, key, originalUrl) {
  try {
    // 1. Upload to Cloudflare R2
    const publicUrl = await uploadFileToR2(imageBuffer, key, 'image/jpeg');

    // 2. Perform HTTP Public Accessibility & Verification Check
    const httpCheck = await axios.get(publicUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });

    const is200OK = httpCheck.status === 200;
    const contentType = httpCheck.headers['content-type'] || 'image/jpeg';
    const downloadedBuffer = Buffer.from(httpCheck.data);

    // 3. Inspect metadata of uploaded public asset
    const metadata = await sharp(downloadedBuffer).metadata();

    return {
      success: true,
      httpStatus: httpCheck.status,
      publicUrl,
      contentType,
      width: metadata.width,
      height: metadata.height,
      sizeBytes: downloadedBuffer.length,
      isAccessible: is200OK,
      verificationMessage: 'Verified 200 OK public HTTPS accessibility without authentication.',
    };
  } catch (err) {
    return {
      success: false,
      httpStatus: err.response ? err.response.status : 500,
      publicUrl: null,
      contentType: null,
      width: 0,
      height: 0,
      sizeBytes: 0,
      isAccessible: false,
      verificationMessage: `Public URL verification failed: ${err.message}`,
    };
  }
}
