import { supabase } from '../config/supabase.js';

export const getStats = async (req, res) => {
  try {
    // 1. Revenue & Orders
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('total, status');

    if (orderError) throw orderError;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);
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
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
