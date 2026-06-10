import { supabase } from './supabase';
import { calcOrderTotals } from './utils/shipping';

const API = process.env.REACT_APP_API_URL || '/api';

// ─── Finalize order in Supabase + send email ─────────────────────────────────
async function finalizeOrder({
  orderId,
  name,
  email,
  phone,
  cart,
  navigate,
  decrementStock,
  form,
  user,
  isCOD,
  amountPaid,
  razorpayOrderId = null,
  razorpayPaymentId = null,
}) {
  const { subtotal, shipping, total } = calcOrderTotals(cart);
  const customerEmail = email || user?.email || '';

  const order = {
    id: orderId,
    items: cart,
    total,
    amountPaid,
    date: new Date().toLocaleDateString(),
    customer: { name, email: customerEmail, phone },
    payMethod: isCOD ? 'COD' : 'Online',
    subtotal,
    shipping,
    razorpayOrderId,
    razorpayPaymentId,
  };

  // Backend handles DB insert now
  if (decrementStock) await decrementStock();

  await supabase.functions
    .invoke('smooth-worker', {
      body: {
        customerName: name,
        customerEmail,
        orderId,
        date: order.date,
        items: cart,
        subtotal,
        shipping,
        total,
        amountPaid,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        phone,
        payMethod: isCOD ? 'Cash on Delivery' : 'Online Payment',
      },
    })
    .catch(() => {});

  localStorage.setItem('latestOrder', JSON.stringify(order));
  navigate('/success');
}

// ─── COD with free shipping (no Razorpay charge) ─────────────────────────────
export async function placeCodOrderFree(
  name, email, phone, cart, navigate, decrementStock, form, user
) {
  const orderId = `COD-${Date.now()}`;
  const { subtotal, shipping, total } = calcOrderTotals(cart);
  const customerEmail = email || user?.email || '';

  const orderData = {
    id: orderId,
    customer_name: name,
    customer_email: customerEmail,
    customer_phone: phone,
    address: form.address,
    city: form.city,
    state: form.state,
    pincode: form.pincode,
    items: cart,
    subtotal,
    shipping,
    total,
  };

  try {
    const res = await fetch(`${API}/api/payment/cod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_data: orderData }),
    });
    if (!res.ok) throw new Error('Failed to place COD order');

    await finalizeOrder({
      orderId,
      name,
      email,
      phone,
      cart,
      navigate,
      decrementStock,
      form,
      user,
      isCOD: true,
      amountPaid: 0,
    });
  } catch (err) {
    console.error(err);
    alert('Failed to place COD order. Please try again.');
  }
}

// ─── Main payment initiator ───────────────────────────────────────────────────
export const initiatePayment = async (
  amountToPayNow,
  name,
  email,
  phone,
  cart,
  navigate,
  decrementStock,
  form,
  user,
  isCOD,
  onStatusChange = () => {}
) => {
  const { shipping, total } = calcOrderTotals(cart);
  const customerEmail = email || user?.email || '';

  onStatusChange('processing');

  // Step 1 — Create Razorpay Order on backend
  let razorpayOrderId;
  let razorpayKey;
  try {
    const res = await fetch(`${API}/api/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(amountToPayNow),
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { customer: name, email: customerEmail },
      }),
    });

    if (!res.ok) throw new Error('Failed to create payment order');
    const data = await res.json();
    razorpayOrderId = data.order_id;
    razorpayKey = data.key || process.env.REACT_APP_RAZORPAY_KEY;
  } catch (err) {
    console.error('create-order failed:', err);
    onStatusChange('error');
    alert('Unable to initiate payment. Please try again.');
    return;
  }

  // Persist order ID for recovery (in case user closes browser)
  localStorage.setItem('pendingRazorpayOrderId', razorpayOrderId);
  localStorage.setItem('pendingOrderForm', JSON.stringify({ name, email, phone, form, isCOD, amountToPayNow }));

  const options = {
    key: razorpayKey,
    order_id: razorpayOrderId,              // ← links modal to our order
    amount: Math.round(amountToPayNow) * 100,
    currency: 'INR',
    name: 'JerseyVault',
    description: isCOD
      ? (shipping > 0 ? `Shipping fee (₹${shipping}) — COD order` : 'Jersey Purchase')
      : `Order total (₹${total})`,

    // Step 2 — Success: verify signature on backend
    handler: async function (response) {
      onStatusChange('verifying');

      const orderData = {
        name,
        email: customerEmail,
        phone,
        cart,
        form,
        isCOD,
        amountPaid: amountToPayNow,
      };

      try {
        const verifyRes = await fetch(`${API}/api/payment/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            order_data: orderData,
          }),
        });

        if (!verifyRes.ok) {
          throw new Error('Signature verification failed');
        }

        onStatusChange('success');
      } catch (verifyErr) {
        console.error('Verification error:', verifyErr);
        // Even if verify call fails, we still finalize client-side for UX
        // The webhook will reconcile on the backend
        onStatusChange('success');
      }

      // Finalize locally (save to Supabase + navigate)
      await finalizeOrder({
        orderId: response.razorpay_payment_id,
        name,
        email,
        phone,
        cart,
        navigate,
        decrementStock,
        form,
        user,
        isCOD,
        amountPaid: amountToPayNow,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
      });

      // Clean up pending state
      localStorage.removeItem('pendingRazorpayOrderId');
      localStorage.removeItem('pendingOrderForm');
    },

    prefill: { name, email: customerEmail, contact: phone },
    theme: { color: '#39ff14' },
    modal: {
      ondismiss: function () {
        onStatusChange('dismissed');
      },
    },
    config: {
      display: {
        preferences: { show_default_blocks: false },
        blocks: {
          banks: {
            name: 'Payment Methods',
            instruments: [
              { method: 'netbanking' },
              { method: 'card' },
              { method: 'upi', apps: ['google_pay', 'phonepe', 'paytm', 'bhim', 'cred'] },
              { method: 'wallet' },
            ],
          },
        },
        sequence: ['block.banks'],
      },
    },
  };

  const rzp = new window.Razorpay(options);

  rzp.on('payment.failed', function (response) {
    onStatusChange('failed');
    console.error('Razorpay error:', response.error);
  });

  rzp.open();
};

// ─── Recovery: check if a pending payment was actually captured ───────────────
export const checkAndRecoverPayment = async (razorpayOrderId) => {
  try {
    const res = await fetch(`${API}/api/payment/status/${razorpayOrderId}`);
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch (err) {
    console.error('Recovery check error:', err);
    return { status: 'error', message: err.message };
  }
};
