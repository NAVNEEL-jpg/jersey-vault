import { supabase } from '../config/supabase.js';

// @desc    Save user profile to Supabase after Auth signup
// @route   POST /api/users/save
export const saveUser = async (req, res) => {
  try {
    const { id, name, email, phone, role, photo, address } = req.body;
    const normEmail = (email || "").trim().toLowerCase();

    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name || existingProfile.name,
          email: normEmail || existingProfile.email,
          phone: phone || existingProfile.phone,
          photo: photo || existingProfile.photo,
          role: role || existingProfile.role,
          address: address || existingProfile.address
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return res.json(updatedProfile);
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id,
        name: name || normEmail.split("@")[0] || "Player",
        email: normEmail,
        phone: phone || "",
        role: role || "user",
        photo: photo || "",
        address: address || { street: "", city: "", state: "", pincode: "" }
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    res.status(201).json(newProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile/:id
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, photo, address } = req.body;
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ name, phone, photo, address })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'User not found' });
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
export const getUserProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'User not found' });
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { user_id, productId } = req.body;
    
    // Check if already in wishlist
    const { data: profile } = await supabase
      .from('profiles')
      .select('wishlist')
      .eq('id', user_id)
      .single();

    let wishlist = profile?.wishlist || [];
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      const { error } = await supabase
        .from('profiles')
        .update({ wishlist })
        .eq('id', user_id);
      if (error) throw error;
    }
    
    res.json({ message: 'Added to wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('wishlist')
      .eq('id', user_id)
      .single();

    let wishlist = profile?.wishlist || [];
    wishlist = wishlist.filter(id => id !== req.params.productId);
    
    const { error } = await supabase
      .from('profiles')
      .update({ wishlist })
      .eq('id', user_id);
    
    if (error) throw error;
    res.json({ message: 'Removed from wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
