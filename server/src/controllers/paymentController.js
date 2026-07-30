import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import { supabase } from '../config/supabase.js';
import { generatePDFBuffer } from '../utils/pdfGenerator.js';

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

  for (const item of items) {
    const { data: p, error } = await supabase.from('products').select('price, name').eq('id', item.id).single();
    
    if (error) {
      console.error('Supabase query error in recalculateCart:', error);
      throw new Error(`Product query failed for ${item.id}: ${error.message}`);
    }

    if (p) {
      const price = p.price;
      subtotal += price * item.qty;
      verifiedItems.push({
        ...item,
        price,
        name: p.name,
      });
    } else {
      throw new Error(`Product not found: ${item.id}`);
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
          // Full COD: upfront = deposit fee only (149)
          amount_paid = COD_DEPOSIT;
          balance_due = Math.max(0, total - amount_paid);
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
      } catch (calcError) {
        console.error('Cart calculation error:', calcError);
        return res.status(400).json({ message: 'Invalid cart data' });
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

  const orderId = razorpay_payment_id || order_data.id || `COD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const trackingId = `TRK-${orderId.slice(-6).toUpperCase()}`;

  const { error } = await supabase
    .from('orders')
    .upsert({
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
    }, { onConflict: 'id' });

  if (error) {
    console.error('finalizeOrderInDB error:', error);
    return;
  }

  let inventoryFailures = [];
  if (order_data.items && Array.isArray(order_data.items)) {
    for (const item of order_data.items) {
      const { data, error } = await supabase.rpc('update_size_stock', {
        p_product_id: item.id,
        p_size: item.size,
        p_qty_change: -Math.abs(item.qty)
      });
      if (error) {
        console.error(`Failed to decrement size_stock for product ${item.id}, size ${item.size}:`, error);
        inventoryFailures.push(`[${new Date().toISOString()}] RPC Error for product ${item.id} (${item.size}): ${error.message}`);
      } else if (data && !data.success) {
        console.error(`RPC reported failure for product ${item.id}, size ${item.size}:`, data.message);
        inventoryFailures.push(`[${new Date().toISOString()}] Inventory Conflict for product ${item.id} (${item.size}): requested ${item.qty}, Response: ${data.message}`);
      }
    }
  }

  if (inventoryFailures.length > 0) {
    const adminNote = "INVENTORY FAILURE:\n" + inventoryFailures.join('\n');
    await supabase.from('orders').update({
      status: 'inventory_pending',
      admin_notes: adminNote
    }).eq('id', orderId);
  }

  // Trigger send-invoice directly via Resend API
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'support@thejerseyvault.in';
    
    if (RESEND_API_KEY) {
      // 1. Fetch exact canonical DB record
      const { data: savedOrder, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (fetchErr || !savedOrder) {
        console.error('Failed to fetch saved order for email:', fetchErr);
        throw new Error('Order not found in DB');
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


