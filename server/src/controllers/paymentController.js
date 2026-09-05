import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import { supabase } from '../config/supabase.js';
import { generatePDFBuffer } from '../utils/pdfGenerator.js';
import { getR2Table, updateSizeStockInR2 } from '../services/r2Service.js';

// ─── POST /api/payment/create-order ────────────────────────────────────────
export const ENFORCE_SECURITY = true;
export const FREE_SHIPPING_MIN = 1099;
export const PREPAID_SHIPPING_FEE = 99;
export const COD_SHIPPING_FEE = 149;
export const PARTIAL_COD_SHIPPING_FEE = 99;
export const SHIPPING_FEE = 99;
export const COD_DEPOSIT = 149;

const calcShipping = (subtotal, payMethod = 'razorpay') => {
  if (subtotal > FREE_SHIPPING_MIN) return 0;
  const m = String(payMethod).toLowerCase();
  if (m === 'cod') return COD_SHIPPING_FEE;
  if (m === 'partial_cod') return PARTIAL_COD_SHIPPING_FEE;
  return PREPAID_SHIPPING_FEE;
};

async function recalculateCart(items, payMethod = 'razorpay') {
  let subtotal = 0;
  const verifiedItems = [];
  const products = await getR2Table('products');

  for (const item of items) {
    const p = (products || []).find(prod => String(prod.id) === String(item.id) || (item.name && prod.name === item.name));
    if (p) {
      const price = Number(p.price) || 0;
      subtotal += price * (Number(item.qty) || 1);
      verifiedItems.push({
        ...item,
        price,
        name: p.name,
      });
    } else {
      throw new Error(`Product not found: ${item.name || item.id}`);
    }
  }

  const shipping = calcShipping(subtotal, payMethod);
  const total = subtotal + shipping;

  return { subtotal, shipping, total, verifiedItems };
}

// Creates a Razorpay Order so we have an order_id to reconcile against.
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount) * 100, // paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('create-order error:', err);
    res.status(500).json({ message: 'Unable to create payment.' });
  }
};

// ─── POST /api/payment/verify ───────────────────────────────────────────────
// Verifies the Razorpay signature after the success callback fires.
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_data } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment fields' });
    }

    // HMAC-SHA256 signature check
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Mark order paid in Supabase
    if (order_data) {
      try {
        const { subtotal, shipping, total, verifiedItems } = await recalculateCart(order_data.items || []);
        const clientTotal = order_data.total;
        let amountPaid = order_data.amount_paid;

        // Verify true amount with Razorpay to prevent price manipulation
        try {
          const rpPayment = await razorpay.payments.fetch(razorpay_payment_id);
          if (rpPayment.order_id !== razorpay_order_id) {
            return res.status(400).json({ message: 'Order ID mismatch' });
          }
          amountPaid = rpPayment.amount / 100;
        } catch (fetchErr) {
          console.error('Failed to fetch Razorpay payment details:', fetchErr);
          return res.status(500).json({ message: 'Unable to verify payment amount.' });
        }
        
        let isMatch = false;
        let amount_paid = 0;
        let balance_due = 0;
        
        const payMethodLower = String(order_data.pay_method || '').toLowerCase();

        if (payMethodLower === 'partial_cod') {
          // Partial COD: upfront = shipping fee + 50% cart value
          const deliveryFee = subtotal > FREE_SHIPPING_MIN ? 0 : PARTIAL_COD_SHIPPING_FEE;
          const halfCartValue = Math.ceil(subtotal / 2);
          amount_paid = deliveryFee === 0 ? halfCartValue : (deliveryFee + halfCartValue);
          balance_due = Math.max(0, total - amount_paid);
          isMatch = (Math.round(amountPaid) === Math.round(amount_paid));
        } else if (payMethodLower === 'cod' || payMethodLower === 'hybrid_cod') {
          if (subtotal > FREE_SHIPPING_MIN) {
            // Free shipping COD (subtotal > 1099): customer pays ₹99 first, rest jersey amount during COD
            amount_paid = 99;
            balance_due = Math.max(0, subtotal - 99);
          } else {
            // Standard COD (subtotal <= 1099): upfront delivery fee (149), full subtotal on COD
            amount_paid = COD_DEPOSIT;
            balance_due = Math.max(0, total - amount_paid);
          }
          isMatch = (Math.round(amountPaid) === Math.round(amount_paid));
        } else {
          // Prepaid: full total paid
          amount_paid = total;
          balance_due = 0;
          isMatch = (Math.round(amountPaid) === Math.round(amount_paid) && Math.round(clientTotal) === Math.round(total));
        }

        console.log(`PAYMENT_SECURITY_AUDIT:
Pay Method: ${order_data.pay_method}
Client Total: ₹${clientTotal}
Client Upfront Amount Paid: ₹${amountPaid}
Server Cart Total: ₹${total}
Expected Upfront Payment: ₹${amount_paid}
Match: ${isMatch ? 'YES' : 'NO'}`);

        if (ENFORCE_SECURITY && !isMatch) {
          return res.status(400).json({ message: 'Payment verification failed due to amount mismatch' });
        }

        await finalizeOrderInDB({
          ...order_data,
          items: verifiedItems,
          subtotal,
          shipping,
          total,
          amount_paid,
          balance_due,
          razorpay_order_id,
          razorpay_payment_id,
          paymentStatus: 'captured',
        });
      } catch (finalizeErr) {
        console.error('Finalize order error:', finalizeErr);
        return res.status(500).json({ message: finalizeErr.message || 'Failed to finalize order' });
      }
    }

    res.json({ success: true, payment_id: razorpay_payment_id });
  } catch (err) {
    console.error('verify error:', err);
    res.status(500).json({ message: 'Unable to verify payment.' });
  }
};

// ─── POST /api/payment/webhook ──────────────────────────────────────────────
// Called by Razorpay server for payment.captured / order.paid events.
// NOTE: Requires raw body — registered with express.raw() in server.js.
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const body = req.body; // raw Buffer

      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (expected !== signature) {
        console.warn('Webhook: invalid signature');
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }
    }

    const event = JSON.parse(req.body.toString());
    const { event: eventName, payload } = event;

    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      const payment = payload.payment?.entity;
      const order_id = payment?.order_id;
      const payment_id = payment?.id;
      const amount = payment?.amount ? payment.amount / 100 : 0;

      if (order_id) {
        // Update any DB order that has this razorpay_order_id and is still pending
        const { error } = await supabase
          .from('orders')
          .update({
            pay_method: 'Online',
            razorpay_payment_id: payment_id,
            payment_captured: true,
            status: 'confirmed',
          })
          .eq('razorpay_order_id', order_id)
          .neq('status', 'confirmed'); // idempotent

        if (error) {
          console.error('Webhook DB update error:', error);
        } else {
          console.log(`Webhook: order ${order_id} confirmed via ${payment_id}`);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Unable to process payment webhook.' });
  }
};

// ─── GET /api/payment/status/:razorpayOrderId ───────────────────────────────
// Recovery endpoint: frontend calls this if the payment modal closed unexpectedly.
export const checkPaymentStatus = async (req, res) => {
  try {
    const { razorpayOrderId } = req.params;

    if (!razorpayOrderId) {
      return res.status(400).json({ message: 'Missing order ID' });
    }

    // Fetch payments for this Razorpay order directly from Razorpay API
    const payments = await razorpay.orders.fetchPayments(razorpayOrderId);

    if (!payments || !payments.items || payments.items.length === 0) {
      return res.json({ status: 'pending', message: 'No payment found for this order' });
    }

    // Find any captured payment
    const captured = payments.items.find(p => p.status === 'captured');

    if (!captured) {
      const latest = payments.items[0];
      return res.json({ status: latest.status, message: 'Payment not yet captured' });
    }

    // Payment is captured — finalize in DB (idempotent)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status')
      .eq('razorpay_order_id', razorpayOrderId)
      .single();

    if (existingOrder && existingOrder.status !== 'confirmed') {
      await supabase
        .from('orders')
        .update({
          pay_method: 'Online',
          razorpay_payment_id: captured.id,
          payment_captured: true,
          status: 'confirmed',
        })
        .eq('razorpay_order_id', razorpayOrderId);
    }

    return res.json({
      status: 'captured',
      payment_id: captured.id,
      amount: captured.amount / 100,
      order_db_id: existingOrder?.id,
    });
  } catch (err) {
    console.error('checkPaymentStatus error:', err);
    res.status(500).json({ message: 'Unable to load payment status.' });
  } 
};

// ─── GET /api/payment/reconcile/:query ──────────────────────────────────────
// Support tool: search by Order ID, Payment ID, or amount
export const reconcilePayment = async (req, res) => {
  try {
    const { query } = req.params;

    let payment = null;
    let source = '';

    // Try as payment ID
    if (query.startsWith('pay_')) {
      try {
        payment = await razorpay.payments.fetch(query);
        source = 'payment_id';
      } catch (_) { /* not found */ }
    }

    // Try as order ID
    if (!payment && query.startsWith('order_')) {
      try {
        const ord = await razorpay.orders.fetch(query);
        const pmts = await razorpay.orders.fetchPayments(query);
        payment = pmts?.items?.[0] || null;
        source = 'order_id';
      } catch (_) { /* not found */ }
    }

    if (!payment) {
      return res.status(404).json({ message: 'No payment found for this query' });
    }

    res.json({
      source,
      payment_id: payment.id,
      order_id: payment.order_id,
      status: payment.status,
      amount: payment.amount / 100,
      method: payment.method,
      captured_at: payment.captured_at,
      utr: payment.acquirer_data?.utr || payment.acquirer_data?.rrn || null,
      description: payment.description,
    });
  } catch (err) {
    console.error('reconcile error:', err);
    res.status(500).json({ message: 'Unable to reconcile payment.' });
  }
};

// ─── Internal helper ─────────────────────────────────────────────────────────
async function finalizeOrderInDB({ razorpay_order_id, razorpay_payment_id, ...order_data }) {
  if (!razorpay_order_id && order_data.pay_method !== 'COD') return;

  const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str));
  const orderId = isUUID(order_data.id) ? order_data.id : crypto.randomUUID();
  const trackingId = order_data.tracking_id || `TRK-${(razorpay_payment_id || orderId).slice(-6).toUpperCase()}`;

  const orderRecord = {
    id: orderId,
    customer_name: order_data.customer_name,
    customer_email: order_data.customer_email,
    customer_phone: order_data.customer_phone,
    address: order_data.address,
    city: order_data.city,
    state: order_data.state,
    pincode: order_data.pincode,
    items: order_data.items,
    subtotal: order_data.subtotal,
    shipping: order_data.shipping,
    total: order_data.total,
    amount_paid: order_data.amount_paid,
    balance_due: order_data.balance_due,
    pay_method: order_data.pay_method || 'Online',
    status: 'confirmed',
    tracking_id: trackingId,
    razorpay_order_id: razorpay_order_id || null,
    razorpay_payment_id: razorpay_payment_id || null,
    payment_captured: order_data.pay_method !== 'COD',
  };

  let dbSaved = false;

  // 1. Upsert to Supabase
  try {
    const { error: supaError } = await supabase
      .from('orders')
      .upsert(orderRecord, { onConflict: 'id' });

    if (supaError) {
      console.error('finalizeOrderInDB Supabase error:', supaError);
    } else {
      dbSaved = true;
    }
  } catch (err) {
    console.error('finalizeOrderInDB Supabase exception:', err);
  }

  // 2. Always persist to Cloudflare R2 backup orders table
  try {
    const existingOrders = await getR2Table('orders');
    const ordersList = Array.isArray(existingOrders) ? existingOrders : [];
    const idx = ordersList.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      ordersList[idx] = { ...ordersList[idx], ...orderRecord, updated_at: new Date().toISOString() };
    } else {
      ordersList.unshift({ ...orderRecord, created_at: new Date().toISOString() });
    }
    await updateR2Table('orders', ordersList);
    dbSaved = true;
  } catch (r2Err) {
    console.error('finalizeOrderInDB R2 orders backup error:', r2Err.message);
  }

  if (!dbSaved) {
    throw new Error('Failed to save order to database. Please check connection and try again.');
  }

  // Decrement inventory stock directly in Cloudflare R2
  const inventoryFailures = [];
  if (order_data.items && Array.isArray(order_data.items)) {
    for (const item of order_data.items) {
      const prodId = item.product || item.id;
      const size = item.size || 'M';
      const qty = Number(item.qty) || 1;
      try {
        await updateSizeStockInR2(prodId, size, -qty);
      } catch (stockErr) {
        console.warn(`[R2] Could not decrement size_stock for product ${prodId}:`, stockErr.message);
        inventoryFailures.push(`Failed stock decrement for ${prodId} (${size}): ${stockErr.message}`);
      }
    }
  }

  // Trigger send-invoice directly via Resend API
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'support@thejerseyvault.in';
    
    if (RESEND_API_KEY) {
      // 1. Fetch exact canonical DB record or fall back to orderRecord
      let savedOrder = null;
      try {
        const { data: sOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        if (sOrder) savedOrder = sOrder;
      } catch (_) {}

      if (!savedOrder) {
        savedOrder = { ...orderRecord, id: orderId, tracking_id: trackingId };
      }

      // 2. Generate PDF Attachment
      let attachments = [];
      try {
        const pdfBuffer = await generatePDFBuffer(savedOrder);
        const pdfBase64 = pdfBuffer.toString('base64');
        attachments.push({
          filename: `Invoice-${savedOrder.id}.pdf`,
          content: pdfBase64
        });
        console.log('PDF_ATTACHMENT_SIZE', pdfBuffer.length);
        console.log('EMAIL_ATTACHMENT_ORDER', savedOrder.id);
      } catch (pdfErr) {
        console.error('Failed to generate PDF Attachment:', pdfErr);
        // Continue without attachment
      }

      // 3. Send via Resend
      const hasInventoryConflict = inventoryFailures && inventoryFailures.length > 0;
      const emailSubject = hasInventoryConflict 
        ? `Payment Received – Inventory Review Required for Order ${savedOrder.id}`
        : `Your JerseyVault Invoice ${savedOrder.id}`;
        
      const emailHtml = hasInventoryConflict
        ? `
            <h2>Payment Received ✅</h2>
            <p>Your payment has been successfully received and your order has <strong>NOT</strong> been cancelled.</p>
            <p>Order ID: <strong>${savedOrder.id}</strong></p>
            <p>Amount Paid: <strong>₹${Number(savedOrder.amount_paid || 0).toLocaleString()}</strong></p>
            <p>Balance Due: <strong>₹${Number(savedOrder.balance_due || 0).toLocaleString()}</strong></p>
            <hr />
            <p><strong>Inventory Review Required</strong></p>
            <p>Due to high demand, an item in your order is currently under inventory review. Fulfillment has been temporarily paused while we physically verify stock in our warehouse.</p>
            <p><strong>No action is required from you at this time.</strong> Our support team will contact you directly if any further action is needed.</p>
            <p>Thank you for choosing JerseyVault.</p>
          `
        : `
            <h2>Order Confirmed ✅</h2>
            <p>Order ID: <strong>${savedOrder.id}</strong></p>
            <p>Tracking ID: <strong>${savedOrder.tracking_id}</strong></p>
            <p>Amount Paid: <strong>₹${Number(savedOrder.amount_paid || 0).toLocaleString()}</strong></p>
            <p>Balance Due: <strong>₹${Number(savedOrder.balance_due || 0).toLocaleString()}</strong></p>
            <p>Your order has been successfully placed. We will notify you once it ships.</p>
          `;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `JerseyVault <${FROM_EMAIL}>`,
          to: savedOrder.customer_email,
          subject: emailSubject,
          html: emailHtml,
          attachments: attachments.length > 0 ? attachments : undefined
        })
      });

      const data = await res.json();
      console.log('RESEND_STATUS', res.status);
      console.log('RESEND_RESPONSE', data);

      if (!res.ok) {
        console.error('RESEND_ATTACHMENT_ERROR', data);
      }
    }
  } catch (err) {
    console.error("Failed to send order email:", err);
  }
}

// ─── POST /api/payment/cod ──────────────────────────────────────────────────
// Secure endpoint to place a COD order when upfront payment is ₹0 (subtotal > FREE_SHIPPING_MIN)
export const placeCodOrder = async (req, res) => {
  try {
    const { order_data } = req.body;
    if (!order_data) {
      return res.status(400).json({ message: 'Missing order data' });
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
      state,
      pincode,
      items,
    } = order_data;

    // Validate customer delivery details
    if (!customer_name?.trim() || !customer_email?.trim() || !customer_phone?.trim() ||
        !address?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
      return res.status(400).json({ message: 'All delivery details are required.' });
    }

    if (!/^[6-9]\d{9}$/.test(String(customer_phone).trim())) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit phone number.' });
    }

    if (!/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ message: 'Please provide a valid 6-digit pincode.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    // Recalculate cart server-side for integrity and verify real prices
    const { subtotal, shipping, total, verifiedItems } = await recalculateCart(items, 'COD');

    // Reject clearance items from COD
    const hasClearance = verifiedItems.some(
      item => item.is_clearance === true || item.type === 'CLEARANCE SALE' || item.type === 'CLEARANCE'
    );
    if (hasClearance) {
      return res.status(400).json({ message: 'Clearance sale items are not eligible for Cash on Delivery.' });
    }

    // Orders that do NOT qualify for free shipping (subtotal <= FREE_SHIPPING_MIN)
    // require upfront online payment for the delivery fee via Razorpay.
    if (shipping > 0) {
      return res.status(400).json({
        message: `Orders below ₹${FREE_SHIPPING_MIN} require upfront shipping payment (₹${shipping}) online.`
      });
    }

    const orderId = crypto.randomUUID();
    const trackingId = `TRK-${orderId.slice(-6).toUpperCase()}`;

    await finalizeOrderInDB({
      id: orderId,
      tracking_id: trackingId,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim().toLowerCase(),
      customer_phone: customer_phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      items: verifiedItems,
      subtotal,
      shipping: 0,
      total: subtotal,
      amount_paid: 0,
      balance_due: subtotal,
      pay_method: 'COD',
      paymentStatus: 'confirmed',
    });

    res.json({
      success: true,
      order_id: orderId,
      tracking_id: trackingId,
      total: subtotal,
    });
  } catch (err) {
    console.error('placeCodOrder error:', err);
    res.status(500).json({ message: err.message || 'Failed to place COD order.' });
  }
};



