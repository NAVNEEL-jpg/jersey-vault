import { supabase } from '../config/supabase.js';

const canAccessUser = (req, userId) => req.user?.id === userId || req.user?.role === 'admin';
const normalizeEmail = (email = '') => email.trim().toLowerCase();
const pickProfileFields = (profile = {}) => ({
  id: profile.id,
  name: profile.name || profile.full_name || '',
  full_name: profile.full_name || profile.name || '',
  email: profile.email || '',
  phone: profile.phone || '',
  photo: profile.photo || '',
  address: profile.address || { street: '', city: '', state: '', pincode: '' },
  role: profile.role || 'user',
  created_at: profile.created_at,
});

// @desc    Save user profile to Supabase after Auth signup
// @route   POST /api/users/save
export const saveUser = async (req, res) => {
  try {
    const { name, full_name, phone, photo, address } = req.body;
    const id = req.user.id;
    const displayName = (full_name || name || req.user.user_metadata?.full_name || '').trim();
    const normEmail = normalizeEmail(req.user.email);

    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: displayName || existingProfile.name,
          full_name: displayName || existingProfile.full_name,
          email: normEmail || existingProfile.email,
          phone: phone || existingProfile.phone,
          photo: photo || existingProfile.photo,
          address: address || existingProfile.address
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return res.json(pickProfileFields(updatedProfile));
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id,
        name: displayName || normEmail.split('@')[0] || 'Player',
        full_name: displayName || normEmail.split('@')[0] || 'Player',
        email: normEmail,
        phone: phone || '',
        role: 'user',
        photo: photo || '',
        address: address || { street: '', city: '', state: '', pincode: '' }
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    res.status(201).json(pickProfileFields(newProfile));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile/:id
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, photo, address } = req.body;
    if (!canAccessUser(req, req.params.id)) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ name, full_name: name, phone, photo, address })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'User not found' });
      throw error;
    }
    res.json(pickProfileFields(data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
export const getUserProfile = async (req, res) => {
  try {
    if (!canAccessUser(req, req.params.id)) {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'User not found' });
      throw error;
    }
    res.json(pickProfileFields(data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // Check if already in wishlist
    const { data: profile } = await supabase
      .from('profiles')
      .select('wishlist')
      .eq('id', userId)
      .single();

    let wishlist = profile?.wishlist || [];
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      const { error } = await supabase
        .from('profiles')
        .update({ wishlist })
        .eq('id', userId);
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
    const userId = req.user.id;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('wishlist')
      .eq('id', userId)
      .single();

    let wishlist = profile?.wishlist || [];
    wishlist = wishlist.filter(id => id !== req.params.productId);
    
    const { error } = await supabase
      .from('profiles')
      .update({ wishlist })
      .eq('id', userId);
    
    if (error) throw error;
    res.json({ message: 'Removed from wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
