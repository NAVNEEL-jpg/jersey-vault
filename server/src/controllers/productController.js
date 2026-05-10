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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { name, price, originalPrice, description, images, image, category_id, subcategory_id, stock, sizes, discountPercent, slug, isFeatured } = req.body;

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
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { name, price, originalPrice, description, images, category_id, subcategory_id, stock, sizes, discountPercent, slug, isFeatured } = req.body;

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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};
