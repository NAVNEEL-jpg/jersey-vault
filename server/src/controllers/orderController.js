import { supabase } from '../config/supabase.js';

// Zone-based shipping
const SELLER_CITY = 'KOLKATA';
const SELLER_STATE = 'WEST BENGAL';
const COD_FEE = 30;

const calculateShipping = (address) => {
  const buyerCity = (address.city || '').toUpperCase().trim();
  const buyerState = (address.state || '').toUpperCase().trim();

  if (buyerCity === SELLER_CITY) return 50;
  if (buyerState === SELLER_STATE) return 80;
  return 120;
};

// @desc    Create new order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const {
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

    const shippingPrice = req.body.shippingPrice || calculateShipping(shippingAddress);
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
        profiles:user_id (name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const updateData = {
      status: req.body.status
    };

    if (req.body.status === 'delivered') {
      updateData.is_delivered = true;
      updateData.delivered_at = new Date();
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
    res.status(500).json({ message: error.message });
  }
};
