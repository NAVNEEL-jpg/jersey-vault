import {
  getR2Table,
  updateR2Table,
  createProductInR2,
  updateProductInR2,
  deleteProductInR2,
} from '../services/r2Service.js';

// @desc    Fetch all products
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    let products = await getR2Table('products');

    // Filter by query parameters if provided
    const { status, category, type, team_id, featured, is_clearance, is_26_27 } = req.query;
    if (status) {
      products = products.filter(p => p.status === status);
    }
    if (category) {
      products = products.filter(p => p.category === category || p.category_id === category);
    }
    if (type) {
      products = products.filter(p => p.type === type);
    }
    if (team_id) {
      products = products.filter(p => p.team_id === team_id);
    }
    if (featured !== undefined) {
      products = products.filter(p => String(p.featured) === String(featured) || String(p.isFeatured) === String(featured));
    }
    if (is_clearance !== undefined) {
      products = products.filter(p => String(p.is_clearance) === String(is_clearance));
    }
    if (is_26_27 !== undefined) {
      products = products.filter(p => String(p.is_26_27) === String(is_26_27));
    }

    return res.json(products);
  } catch (error) {
    console.error('productController.js Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const products = await getR2Table('products');
    const found = products.find(p => String(p.id) === String(req.params.id) || p.slug === req.params.id);
    if (!found) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(found);
  } catch (error) {
    console.error('productController.js Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// @desc    Create a product
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const newProduct = await createProductInR2(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('createProduct Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const updated = await updateProductInR2(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('updateProduct Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await deleteProductInR2(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('deleteProduct Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// ─── REVIEWS CONTROLLER (Stored in Cloudflare R2 site_settings) ─────────────
const REVIEWS_KEY_PREFIX = 'jersey_reviews_v1_';

export const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const settings = await getR2Table('site_settings');
    const settingsList = Array.isArray(settings) ? settings : [];

    if (productId && productId !== 'all') {
      const key = `${REVIEWS_KEY_PREFIX}${productId}`;
      const found = settingsList.find(s => s.key === key);
      let reviews = [];
      if (found?.value) {
        try { reviews = JSON.parse(found.value); } catch (_) {}
      }
      return res.json({ success: true, reviews: Array.isArray(reviews) ? reviews : [] });
    } else {
      let allReviews = [];
      settingsList
        .filter(s => s.key && s.key.startsWith(REVIEWS_KEY_PREFIX))
        .forEach(row => {
          try {
            const list = JSON.parse(row.value);
            if (Array.isArray(list)) allReviews = allReviews.concat(list);
          } catch (_) {}
        });
      return res.json({ success: true, reviews: allReviews });
    }
  } catch (error) {
    console.error('getReviews error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addReview = async (req, res) => {
  try {
    const { productId, reviewer_name, rating, comment, photos, is_published } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });

    const key = `${REVIEWS_KEY_PREFIX}${productId}`;
    const settings = await getR2Table('site_settings');
    const settingsList = Array.isArray(settings) ? [...settings] : [];

    const existingIndex = settingsList.findIndex(s => s.key === key);
    let current = [];
    if (existingIndex !== -1 && settingsList[existingIndex].value) {
      try { current = JSON.parse(settingsList[existingIndex].value); } catch (_) {}
    }

    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product_id: String(productId),
      reviewer_name: reviewer_name || 'Customer',
      rating: Number(rating) || 5,
      comment: comment || '',
      photos: Array.isArray(photos) ? photos : [],
      is_published: is_published !== false,
      created_at: new Date().toISOString(),
    };

    const updated = [newReview, ...(Array.isArray(current) ? current : [])];

    if (existingIndex !== -1) {
      settingsList[existingIndex] = { key, value: JSON.stringify(updated) };
    } else {
      settingsList.push({ key, value: JSON.stringify(updated) });
    }

    await updateR2Table('site_settings', settingsList);

    res.json({ success: true, review: newReview, reviews: updated });
  } catch (error) {
    console.error('addReview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleReview = async (req, res) => {
  try {
    const { productId, reviewId, is_published } = req.body;
    if (!productId || !reviewId) return res.status(400).json({ success: false, message: 'Missing fields' });

    const key = `${REVIEWS_KEY_PREFIX}${productId}`;
    const settings = await getR2Table('site_settings');
    const settingsList = Array.isArray(settings) ? [...settings] : [];

    const existingIndex = settingsList.findIndex(s => s.key === key);
    if (existingIndex === -1) return res.status(404).json({ success: false, message: 'Reviews not found' });

    let current = [];
    try { current = JSON.parse(settingsList[existingIndex].value); } catch (_) {}

    const updated = current.map(r => r.id === reviewId ? { ...r, is_published: !!is_published } : r);
    settingsList[existingIndex] = { key, value: JSON.stringify(updated) };

    await updateR2Table('site_settings', settingsList);

    res.json({ success: true, reviews: updated });
  } catch (error) {
    console.error('toggleReview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    if (!productId || !reviewId) return res.status(400).json({ success: false, message: 'Missing fields' });

    const key = `${REVIEWS_KEY_PREFIX}${productId}`;
    const settings = await getR2Table('site_settings');
    const settingsList = Array.isArray(settings) ? [...settings] : [];

    const existingIndex = settingsList.findIndex(s => s.key === key);
    if (existingIndex === -1) return res.status(404).json({ success: false, message: 'Reviews not found' });

    let current = [];
    try { current = JSON.parse(settingsList[existingIndex].value); } catch (_) {}

    const updated = current.filter(r => r.id !== reviewId);
    settingsList[existingIndex] = { key, value: JSON.stringify(updated) };

    await updateR2Table('site_settings', settingsList);

    res.json({ success: true, reviews: updated });
  } catch (error) {
    console.error('deleteReview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { productId, oldProductId, reviewId, reviewer_name, rating, comment, photos, is_published } = req.body;
    if (!productId || !reviewId) return res.status(400).json({ success: false, message: 'Missing required fields' });

    const targetProductId = String(productId);
    const originalProductId = String(oldProductId || productId);
    const settings = await getR2Table('site_settings');
    const settingsList = Array.isArray(settings) ? [...settings] : [];

    if (targetProductId !== originalProductId) {
      // 1. Remove from old product key
      const oldKey = `${REVIEWS_KEY_PREFIX}${originalProductId}`;
      const oldIndex = settingsList.findIndex(s => s.key === oldKey);
      let oldReviews = [];
      if (oldIndex !== -1 && settingsList[oldIndex].value) {
        try { oldReviews = JSON.parse(settingsList[oldIndex].value); } catch (_) {}
      }
      const existingReview = oldReviews.find(r => r.id === reviewId);
      const filteredOld = oldReviews.filter(r => r.id !== reviewId);
      if (oldIndex !== -1) {
        settingsList[oldIndex] = { key: oldKey, value: JSON.stringify(filteredOld) };
      }

      // 2. Add updated review to new product key
      const newKey = `${REVIEWS_KEY_PREFIX}${targetProductId}`;
      const newIndex = settingsList.findIndex(s => s.key === newKey);
      let newReviews = [];
      if (newIndex !== -1 && settingsList[newIndex].value) {
        try { newReviews = JSON.parse(settingsList[newIndex].value); } catch (_) {}
      }

      const updatedReview = {
        id: reviewId,
        product_id: targetProductId,
        reviewer_name: reviewer_name !== undefined ? reviewer_name : (existingReview?.reviewer_name || 'Customer'),
        rating: rating !== undefined ? Number(rating) : (existingReview?.rating || 5),
        comment: comment !== undefined ? comment : (existingReview?.comment || ''),
        photos: Array.isArray(photos) ? photos : (existingReview?.photos || []),
        is_published: is_published !== undefined ? !!is_published : (existingReview?.is_published !== false),
        created_at: existingReview?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedNew = [updatedReview, ...newReviews.filter(r => r.id !== reviewId)];
      if (newIndex !== -1) {
        settingsList[newIndex] = { key: newKey, value: JSON.stringify(updatedNew) };
      } else {
        settingsList.push({ key: newKey, value: JSON.stringify(updatedNew) });
      }

      await updateR2Table('site_settings', settingsList);
      return res.json({ success: true, review: updatedReview, reviews: updatedNew });
    } else {
      // Update in place for same product ID
      const key = `${REVIEWS_KEY_PREFIX}${targetProductId}`;
      const existingIndex = settingsList.findIndex(s => s.key === key);
      let current = [];
      if (existingIndex !== -1 && settingsList[existingIndex].value) {
        try { current = JSON.parse(settingsList[existingIndex].value); } catch (_) {}
      }

      let updatedReview = null;
      const updated = current.map(r => {
        if (r.id === reviewId) {
          updatedReview = {
            ...r,
            product_id: targetProductId,
            reviewer_name: reviewer_name !== undefined ? reviewer_name : r.reviewer_name,
            rating: rating !== undefined ? Number(rating) : r.rating,
            comment: comment !== undefined ? comment : r.comment,
            photos: Array.isArray(photos) ? photos : r.photos,
            is_published: is_published !== undefined ? !!is_published : r.is_published,
            updated_at: new Date().toISOString()
          };
          return updatedReview;
        }
        return r;
      });

      if (existingIndex !== -1) {
        settingsList[existingIndex] = { key, value: JSON.stringify(updated) };
      } else {
        settingsList.push({ key, value: JSON.stringify(updated) });
      }

      await updateR2Table('site_settings', settingsList);
      return res.json({ success: true, review: updatedReview, reviews: updated });
    }
  } catch (error) {
    console.error('updateReview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
