import { API_BASE } from '../config/api';

const BACKEND_BASE = (API_BASE && API_BASE.trim()) || 'https://jersey-vault-backend.onrender.com';

/**
 * Resolves any image URL to a valid, globally reachable URL.
 * Converts relative API storage paths (/api/db/storage/...) into full backend URLs.
 */
export const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('/api/')) {
    const base = BACKEND_BASE.replace(/\/+$/, '');
    return `${base}${trimmed}`;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return trimmed;
};

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
  let list = [];
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        list = parsed.map(url => String(url).trim()).filter(Boolean);
      }
    } catch (e) {
      // Fallback if parsing fails
    }
  }
  if (list.length === 0) {
    list = str.split(',').map(url => url.trim()).filter(Boolean);
  }
  return list.map(url => resolveImageUrl(url));
};

/**
 * Helper to get the first (primary) image URL for thumbnails.
 */
export const getFirstImage = (imageUrlString) => {
  const images = getProductImages(imageUrlString);
  return images[0] || "";
};

/**
 * Helper to clean and resolve image URLs from user input.
 * Supports:
 * - Direct image addresses (e.g. https://.../pic.jpg, webp, png, svg)
 * - Link addresses from Google Images (e.g. ?imgurl=... or &url=...)
 * - Imgur links (https://imgur.com/xyz -> https://i.imgur.com/xyz.jpg)
 * - Pinterest, Unsplash, and general web photo links
 * - Protocol-relative URLs (//...)
 * - URLs without protocol (example.com/pic.jpg -> https://example.com/pic.jpg)
 * - Multiple URLs pasted together separated by newlines, commas, or semicolons
 */
export const extractImageUrls = (input) => {
  if (!input) return [];
  const rawParts = String(input)
    .split(/[\r\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const cleanUrls = [];

  for (let part of rawParts) {
    // Strip wrapping quotes or brackets
    part = part.replace(/^["'\[\(]+|["'\]\)]+$/g, '').trim();
    if (!part) continue;

    // 1. Google image redirect link (Copy link address from Google Images)
    // E.g. https://www.google.com/imgres?imgurl=https%3A%2F%2F...
    if (part.includes('imgurl=')) {
      try {
        const urlObj = new URL(part);
        const imgParam = urlObj.searchParams.get('imgurl');
        if (imgParam) {
          part = decodeURIComponent(imgParam);
        }
      } catch (_) {
        const match = part.match(/[?&]imgurl=([^&]+)/);
        if (match && match[1]) {
          part = decodeURIComponent(match[1]);
        }
      }
    } else if (part.includes('google.com/url') && part.includes('url=')) {
      try {
        const urlObj = new URL(part);
        const targetUrl = urlObj.searchParams.get('url');
        if (targetUrl) {
          part = decodeURIComponent(targetUrl);
        }
      } catch (_) {}
    }

    // 2. Imgur page address (https://imgur.com/abc -> https://i.imgur.com/abc.jpg)
    const imgurMatch = part.match(/^https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)$/);
    if (imgurMatch && imgurMatch[1]) {
      part = `https://i.imgur.com/${imgurMatch[1]}.jpg`;
    }

    // 3. Protocol fix
    if (part.startsWith('//')) {
      part = 'https:' + part;
    } else if (!part.startsWith('http://') && !part.startsWith('https://') && !part.startsWith('/') && !part.startsWith('data:')) {
      part = 'https://' + part;
    }

    if (part) {
      cleanUrls.push(part);
    }
  }

  return cleanUrls;
};
