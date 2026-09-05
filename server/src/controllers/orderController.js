import { supabase } from '../config/supabase.js';
import { calculateDelhiveryRate, calculateLiveDeliveryRate, trackDelhiveryShipment } from '../services/delhivery.service.js';
import { getR2Table, updateSizeStockInR2 } from '../services/r2Service.js';

// Fallback COD Fee
const COD_FEE = 30;

const calculateShipping = async (address, paymentType = 'PREPAID', itemsCount = 1, subtotal = 0) => {
  const pincode = address?.pincode || address?.postalCode;
  if (pincode && /^\d{6}$/.test(String(pincode).trim())) {
    try {
      const qty = Math.max(1, Number(itemsCount) || 1);
      const res = await calculateLiveDeliveryRate({
        destination_pincode: pincode,
        payment_mode: paymentType,
        jersey_count: qty,
        subtotal: Number(subtotal) || 0
      });
      if (res && res.success) {
        return res.delivery_fee;
      }
    } catch (err) {
      console.warn('Delhivery rate calculation error:', err.message);
    }
  }

  // Dynamic fallback: subtotal > 1099 -> 0, else ₹99 minimum floor
  return Number(subtotal) > 1099 ? 0 : 99;
};

// @desc    Track an order by ID or Tracking ID
// @route   GET /api/orders/track/:trackingId
export const trackOrder = async (req, res) => {
  try {
    const trackId = req.params.trackingId.toUpperCase();
    const { data, error } = await supabase
      .from('orders')
      .select('id, tracking_id, status, created_at, customer_name, total, items')
      .or(`tracking_id.eq.${trackId},id.eq.${trackId}`)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Order not found' });

    let delhiveryLive = null;
    const waybillToTrack = data.tracking_id || (trackId.length >= 8 ? trackId : null);

    if (waybillToTrack) {
      delhiveryLive = await trackDelhiveryShipment(waybillToTrack);
    }

    res.json({
      ...data,
      delhiveryLive: delhiveryLive && delhiveryLive.success ? delhiveryLive : null
    });
  } catch (err) {
    console.error('Track order error:', err);
    res.status(500).json({ message: 'Server error tracking order' });
  }
};

// @desc    Create new order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
  try {
    let {
      user_id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      totalPrice,
      paymentType,
      isPaid: isPaidBody,
      paymentResult,
    } = req.body;

    // SECURITY FIX: Prevent Mass Assignment & BOLA.
    // Never trust client-supplied user_id or payment status for non-admins.
    if (req.user?.role !== 'admin') {
      user_id = req.user?.id;
      isPaidBody = false;
      paymentResult = {};
    }

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Check stock for all items from Cloudflare R2
    const currentProducts = await getR2Table('products');
    for (const it of orderItems) {
      const prodId = it.product || it.id;
      const p = (currentProducts || []).find(prod => String(prod.id) === String(prodId));
      
      if (!p) return res.status(400).json({ message: `Product not found: ${it.name || prodId}` });
      const sizeQty = it.size && p.size_stock ? (p.size_stock[it.size] || 0) : (p.stock || 0);
      if (sizeQty < (it.qty || 0)) return res.status(400).json({ message: `Insufficient stock for ${p.name}` });
    }

    const shippingPrice = req.body.shippingPrice !== undefined 
      ? Number(req.body.shippingPrice) 
      : await calculateShipping(shippingAddress, paymentType, orderItems?.length || 1, itemsPrice || 0);
    const codFee = paymentType === 'COD' ? COD_FEE : 0;
    const calculatedTotal = paymentType === 'COD'
      ? (itemsPrice || 0) + shippingPrice + codFee
      : totalPrice || ((itemsPrice || 0) + shippingPrice);

    const pt = paymentType || 'PREPAID';
    const isPaid = typeof isPaidBody === 'boolean' ? isPaidBody : pt !== 'COD';

    // Insert Order into Supabase
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: user_id || null,
        customer_id: user_id || null,
        customer_name: shippingAddress?.name || req.user?.full_name || req.user?.name || '',
        customer_email: shippingAddress?.email || req.user?.email || '',
        customer_phone: shippingAddress?.phone || req.user?.phone || '',
        address: shippingAddress?.address || shippingAddress?.street || '',
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        pincode: shippingAddress?.pincode || shippingAddress?.postalCode || '',
        items: orderItems,
        subtotal: itemsPrice || 0,
        shipping: shippingPrice || 0,
        total: calculatedTotal,
        amount_paid: isPaid ? calculatedTotal : 0,
        balance_due: isPaid ? 0 : calculatedTotal,
        pay_method: pt,
        payment_captured: isPaid,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Update Stock in Cloudflare R2
    for (const it of orderItems) {
      const prodId = it.product || it.id;
      const size = it.size || 'M';
      const qty = Number(it.qty) || 1;
      await updateSizeStockInR2(prodId, size, -qty);
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('createOrder Error:', error);
    res.status(500).json({ message: 'Unable to create order.' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/user/:id
export const getUserOrders = async (req, res) => {
  try {
    if (req.user?.id !== req.params.id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these orders' });
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('getUserOrders Error:', error);
    res.status(500).json({ message: 'Unable to load orders.' });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
export const getOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('getOrders Error:', error);
    res.status(500).json({ message: 'Unable to load order information.' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const newStatus = req.body.status;
    const updateData = { status: newStatus };

    if (newStatus === 'delivered') {
      updateData.is_delivered = true;
      updateData.delivered_at = new Date();
    }

    // 1. Fetch existing order to determine if we need to restore inventory
    let existingOrder = null;
    try {
      const { data } = await supabase
        .from('orders')
        .select('status, items')
        .eq('id', req.params.id)
        .single();
      if (data) existingOrder = data;
    } catch (_) {}

    if (!existingOrder) {
      try {
        const r2Orders = await getR2Table('orders');
        existingOrder = (r2Orders || []).find(o => String(o.id) === String(req.params.id));
      } catch (_) {}
    }

    // 2. Perform Inventory Restoration ONLY if transitioning from non-cancelled to cancelled
    if (newStatus === 'cancelled' && existingOrder && existingOrder.status !== 'cancelled') {
      const items = Array.isArray(existingOrder.items) ? existingOrder.items : [];
      for (const item of items) {
        const productId = item.id || item.product;
        const qty = Number(item.qty) || 1;
        const size = item.size || 'M';

        if (productId) {
          try {
            await updateSizeStockInR2(productId, size, qty);
          } catch (stockErr) {
            console.warn('[updateOrderStatus] Restock error:', stockErr.message);
          }
        }
      }
    }

    // 3. Update Supabase
    let updatedOrder = null;
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (!error && data) updatedOrder = data;
    } catch (supaErr) {
      console.warn('[updateOrderStatus] Supabase update warning:', supaErr.message);
    }

    // 4. Update Cloudflare R2 orders backup table
    try {
      const r2Orders = await getR2Table('orders');
      if (Array.isArray(r2Orders)) {
        const idx = r2Orders.findIndex(o => String(o.id) === String(req.params.id));
        if (idx !== -1) {
          r2Orders[idx] = { ...r2Orders[idx], ...updateData, updated_at: new Date().toISOString() };
          await updateR2Table('orders', r2Orders);
          if (!updatedOrder) updatedOrder = r2Orders[idx];
        }
      }
    } catch (r2Err) {
      console.warn('[updateOrderStatus] R2 orders update warning:', r2Err.message);
    }

    if (!updatedOrder) {
      updatedOrder = { id: req.params.id, ...updateData };
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('updateOrderStatus Error:', error);
    res.status(500).json({ message: 'Unable to update order status.' });
  }
};
