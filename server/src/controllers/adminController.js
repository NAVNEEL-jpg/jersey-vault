import { supabase } from '../config/supabase.js';

export const getStats = async (req, res) => {
  try {
    // 1. Revenue & Orders
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('total, status');

    if (orderError) throw orderError;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, order) => acc + (order.total ?? 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    // 2. Total Users
    const { count: totalUsers, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (userError) throw userError;

    // 3. Total Products
    const { count: totalProducts, error: prodError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (prodError) throw prodError;

    res.json({
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      pendingOrders
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    console.error(error?.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const search = String(req.query.search || '').trim();

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, phone, role', { count: 'exact' })
      .order('id', { ascending: false })
      .range(from, to);

    if (search) {
      const safeSearch = search.replace(/[%_]/g, '');
      query = query.or(`email.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`);
    }

    const { data: users, count, error } = await query;

    if (error) {
      console.error('[getAllUsers] Supabase Error Details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    res.json({ success: true, users, page, limit, total: count || 0 });
  } catch (error) {
    console.error('[getAllUsers] Unexpected Error:', error);
    console.error('[getAllUsers] Stack Trace:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error occurred while fetching users.' 
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ message: 'Admins cannot delete their own account here' });
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) throw profileError;

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
