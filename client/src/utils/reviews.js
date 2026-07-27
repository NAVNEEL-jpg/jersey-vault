import { API_BASE } from '../config/api';
import { supabase } from '../supabase';

const REVIEWS_KEY_PREFIX = 'jersey_reviews_v1_';

export async function fetchProductReviews(productId = null) {
  try {
    const url = productId
      ? `${API_BASE}/api/products/reviews/${productId}`
      : `${API_BASE}/api/products/reviews/all`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        return data.reviews;
      }
    }
  } catch (err) {
    console.error('API fetchProductReviews error, attempting Supabase fallback:', err);
  }

  // Supabase Direct Fallback
  try {
    if (productId) {
      const key = `${REVIEWS_KEY_PREFIX}${productId}`;
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!error && data?.value) {
        const list = JSON.parse(data.value);
        if (Array.isArray(list)) return list;
      }
    } else {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .like('key', `${REVIEWS_KEY_PREFIX}%`);

      if (!error && data) {
        let allReviews = [];
        data.forEach(row => {
          try {
            const list = JSON.parse(row.value);
            if (Array.isArray(list)) allReviews = allReviews.concat(list);
          } catch (_) {}
        });
        return allReviews;
      }
    }
  } catch (_) {}

  // LocalStorage Fallback
  try {
    if (productId) {
      const local = localStorage.getItem(`${REVIEWS_KEY_PREFIX}${productId}`);
      if (local) return JSON.parse(local);
    }
  } catch (_) {}

  return [];
}

export async function addProductReview(productId, reviewObj) {
  try {
    const res = await fetch(`${API_BASE}/api/products/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        reviewer_name: reviewObj.reviewer_name,
        rating: reviewObj.rating,
        comment: reviewObj.comment,
        photos: reviewObj.photos,
        is_published: reviewObj.is_published !== false,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        return data.reviews;
      }
    }
  } catch (err) {
    console.error('API addProductReview error:', err);
  }

  // Fallback
  const current = await fetchProductReviews(productId);
  const newReview = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    product_id: String(productId),
    reviewer_name: reviewObj.reviewer_name || 'Customer',
    rating: Number(reviewObj.rating) || 5,
    comment: reviewObj.comment || '',
    photos: Array.isArray(reviewObj.photos) ? reviewObj.photos : [],
    is_published: reviewObj.is_published !== false,
    created_at: new Date().toISOString(),
  };
  const updated = [newReview, ...current];
  try {
    localStorage.setItem(`${REVIEWS_KEY_PREFIX}${productId}`, JSON.stringify(updated));
  } catch (_) {}
  return updated;
}

export async function toggleReviewPublishStatus(productId, reviewId, isPublished) {
  try {
    const res = await fetch(`${API_BASE}/api/products/reviews/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        reviewId,
        is_published: isPublished,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        return data.reviews;
      }
    }
  } catch (err) {
    console.error('API toggleReviewPublishStatus error:', err);
  }

  // Fallback
  const current = await fetchProductReviews(productId);
  const updated = current.map(r => r.id === reviewId ? { ...r, is_published: isPublished } : r);
  try {
    localStorage.setItem(`${REVIEWS_KEY_PREFIX}${productId}`, JSON.stringify(updated));
  } catch (_) {}
  return updated;
}

export async function deleteProductReview(productId, reviewId) {
  try {
    const res = await fetch(`${API_BASE}/api/products/reviews/${productId}/${reviewId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        return data.reviews;
      }
    }
  } catch (err) {
    console.error('API deleteProductReview error:', err);
  }

  // Fallback
  const current = await fetchProductReviews(productId);
  const updated = current.filter(r => r.id !== reviewId);
  try {
    localStorage.setItem(`${REVIEWS_KEY_PREFIX}${productId}`, JSON.stringify(updated));
  } catch (_) {}
  return updated;
}

export async function uploadReviewImage(file) {
  try {
    const ext = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `reviews/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('Jersey image').upload(fileName, file, { upsert: true });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('Jersey image').getPublicUrl(fileName);
      if (urlData?.publicUrl) return urlData.publicUrl;
    }
  } catch (e) {
    console.warn('Supabase storage upload failed, using DataURL fallback:', e);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(event.target.result);
        }
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

