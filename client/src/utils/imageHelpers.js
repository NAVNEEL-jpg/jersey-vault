/**
 * Helper to parse a product's image_url field into an array of image URL strings.
 * Supports:
 * - Single image URL
 * - Comma-separated list of image URLs
 * - JSON stringified array of image URLs
 */
export const getProductImages = (imageUrlString) => {
  if (!imageUrlString) return [];
  const str = String(imageUrlString).trim();
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map(url => String(url).trim()).filter(Boolean);
      }
    } catch (e) {
      // Fallback if parsing fails
    }
  }
  // Split by comma
  return str.split(',').map(url => url.trim()).filter(Boolean);
};

/**
 * Helper to get the first (primary) image URL for thumbnails.
 */
export const getFirstImage = (imageUrlString) => {
  const images = getProductImages(imageUrlString);
  return images[0] || "";
};
