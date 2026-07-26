import { supabase } from '../config/supabase.js';

// @desc    Fetch all products
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:category_id (name),
        subcategory:subcategory_id (name)
      `);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('productController.js Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:category_id (name),
        subcategory:subcategory_id (name)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'Product not found' });
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('productController.js Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// @desc    Create a product
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { name, price, originalPrice, description, images, image, category_id, subcategory_id, stock, sizes, discountPercent, slug, isFeatured, featured } = req.body;

    const imgList = Array.isArray(images) && images.length > 0
      ? images
      : (image ? [image] : []);

    const slugFinal = slug || `${String(name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name,
        price,
        originalPrice,
        description: description || '—',
        images: imgList,
        category_id,
        subcategory_id,
        stock: stock !== undefined ? Number(stock) : 0,
        sizes,
        discountPercent,
        slug: slugFinal,
        isFeatured: isFeatured || false,
        featured: featured || false,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('productController.js Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { name, price, originalPrice, description, images, category_id, subcategory_id, stock, sizes, discountPercent, slug, isFeatured, featured } = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({
        name,
        price,
        originalPrice,
        description,
        images,
        category_id,
        subcategory_id,
        stock,
        sizes,
        discountPercent,
        slug,
        isFeatured,
        featured,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'Product not found' });
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('productController.js Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  console.log("ATTEMPTING DELETE for ID:", req.params.id);
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error("SUPABASE DELETE ERROR:", error);
      throw error;
    }

    console.log("DELETE SUCCESSFUL");
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error("DELETE CONTROLLER ERROR:", error);
    console.error('productController.js Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// ─── REVIEWS CONTROLLER ───────────────────────────────────────────────────
const REVIEWS_KEY_PREFIX = 'jersey_reviews_v1_';

export const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    if (productId && productId !== 'all') {
      const key = `${REVIEWS_KEY_PREFIX}${productId}`;
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      let reviews = [];
      if (data?.value) {
        try { reviews = JSON.parse(data.value); } catch (_) {}
      }
      return res.json({ success: true, reviews: Array.isArray(reviews) ? reviews : [] });
    } else {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .like('key', `${REVIEWS_KEY_PREFIX}%`);

      if (error) throw error;
      let allReviews = [];
      if (data) {
        data.forEach(row => {
          try {
            const list = JSON.parse(row.value);
            if (Array.isArray(list)) allReviews = allReviews.concat(list);
          } catch (_) {}
        });
      }
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
    const { data: existingData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    let current = [];
    if (existingData?.value) {
      try { current = JSON.parse(existingData.value); } catch (_) {}
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

    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert({ key, value: JSON.stringify(updated) }, { onConflict: 'key' });

    if (upsertError) throw upsertError;

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
    const { data: existingData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    let current = [];
    if (existingData?.value) {
      try { current = JSON.parse(existingData.value); } catch (_) {}
    }

    const updated = current.map(r => r.id === reviewId ? { ...r, is_published: !!is_published } : r);

    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert({ key, value: JSON.stringify(updated) }, { onConflict: 'key' });

    if (upsertError) throw upsertError;

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
    const { data: existingData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    let current = [];
    if (existingData?.value) {
      try { current = JSON.parse(existingData.value); } catch (_) {}
    }

    const updated = current.filter(r => r.id !== reviewId);

    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert({ key, value: JSON.stringify(updated) }, { onConflict: 'key' });

    if (upsertError) throw upsertError;

    res.json({ success: true, reviews: updated });
  } catch (error) {
    console.error('deleteReview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
