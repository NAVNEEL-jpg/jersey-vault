import { supabase } from '../config/supabase.js';
import { getR2Table, updateR2Table } from '../services/r2Service.js';
import { getLiveEdgeLimits } from '../services/edgeMetricsService.js';

export const getStats = async (req, res) => {
  try {
    // 1. Revenue & Orders from Supabase
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('total, status, amount_paid, balance_due, pay_method');

    if (orderError) throw orderError;

    const totalOrders = (orders || []).length;
    const pendingOrders = (orders || []).filter(o => o.status === 'pending').length;

    // GMV: Total value of all non-cancelled orders
    const gmv = (orders || [])
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, order) => acc + (Number(order.total) || 0), 0);

    // Cash Collected: Money successfully collected across ALL orders
    const cashCollected = (orders || []).reduce((acc, order) => {
      const paid = order.amount_paid != null 
        ? Number(order.amount_paid) 
        : (String(order.pay_method).toLowerCase() === 'cod' ? 149 : (Number(order.total) || 0));
      return acc + paid;
    }, 0);

    // Pending Cash: Money expected on delivery for active orders
    const pendingCash = (orders || [])
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, order) => {
        const paid = order.amount_paid != null 
          ? Number(order.amount_paid) 
          : (String(order.pay_method).toLowerCase() === 'cod' ? 149 : (Number(order.total) || 0));
        const bal = order.balance_due != null 
          ? Number(order.balance_due) 
          : Math.max(0, (Number(order.total) || 0) - paid);
        return acc + bal;
      }, 0);

    const totalRevenue = gmv;

    // 2. Total Users from Supabase Profiles
    const { count: totalUsers, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (userError) throw userError;

    // 3. Total Products from Cloudflare R2
    const products = await getR2Table('products');
    const totalProducts = (products || []).length;

    res.json({
      totalRevenue,
      gmv,
      cashCollected,
      pendingCash,
      totalOrders,
      totalUsers: totalUsers || 0,
      totalProducts,
      pendingOrders
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred.'
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
    res.status(500).json({ 
      success: false, 
      error: 'An internal server error occurred.' 
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

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) throw profileError;

    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('[deleteUser] Error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const getSettings = async (req, res) => {
  try {
    const data = await getR2Table('site_settings');
    const settings = {};
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.key) {
          settings[item.key] = item.value;
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error("Get Settings Error:", error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload' });
    }
    
    const current = await getR2Table('site_settings');
    const settingsMap = new Map();

    if (Array.isArray(current)) {
      current.forEach(item => {
        if (item.key) settingsMap.set(item.key, item.value);
      });
    }

    Object.keys(settings).forEach(key => {
      settingsMap.set(key, String(settings[key]));
    });

    const updatedList = Array.from(settingsMap.entries()).map(([key, value]) => ({ key, value }));
    await updateR2Table('site_settings', updatedList);

    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const getEdgeLimits = async (req, res) => {
  try {
    const limits = await getLiveEdgeLimits();
    res.json(limits);
  } catch (error) {
    console.error("getEdgeLimits Error:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch live edge limits' });
  }
};
