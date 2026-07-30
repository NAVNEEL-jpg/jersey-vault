import { supabase } from '../config/supabase.js';
import { calculateDelhiveryRate, calculateLiveDeliveryRate, trackDelhiveryShipment } from '../services/delhivery.service.js';

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

    // Check stock for all items
    for (const it of orderItems) {
      const { data: p, error: pError } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', it.product)
        .single();
      
      if (pError || !p) return res.status(400).json({ message: `Product not found: ${it.name || it.product}` });
      if ((p.stock || 0) < (it.qty || 0)) return res.status(400).json({ message: `Insufficient stock for ${p.name}` });
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

    // Insert Order
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id,
        items: orderItems,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        payment_result: paymentResult || {},
        tax_price: taxPrice || 0,
        shipping_price: shippingPrice,
        total_price: calculatedTotal,
        cod_fee: codFee,
        payment_type: pt,
        is_paid: isPaid,
        paid_at: isPaid ? new Date() : null,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Update Stock
    for (const it of orderItems) {
      await supabase.rpc('decrement_stock', { 
        product_id: it.product, 
        quantity: it.qty 
      });
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
      .select(`
        *,
        profiles:user_id (full_name, email, phone)
      `)
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

    // Fetch existing order to determine if we need to restore inventory
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('status, items')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;

    // Perform Inventory Restoration ONLY if transitioning from non-cancelled to cancelled
    if (newStatus === 'cancelled' && existingOrder.status !== 'cancelled') {
      const items = Array.isArray(existingOrder.items) ? existingOrder.items : [];
      for (const item of items) {
        const productId = item.id || item.product;
        const qty = Number(item.qty) || 1;
        const size = item.size;

        if (productId && size) {
          const { data: rpcData, error: rpcError } = await supabase.rpc('update_size_stock', {
            p_product_id: productId,
            p_size: size,
            p_qty_change: qty
          });
          if (rpcError) {
            console.error(`Failed to increment size_stock for product ${productId}, size ${size}:`, rpcError);
          } else if (rpcData && !rpcData.success) {
            console.error(`RPC reported failure for product ${productId}, size ${size}:`, rpcData.message);
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('updateOrderStatus Error:', error);
    res.status(500).json({ message: 'Unable to update order status.' });
  }
};
