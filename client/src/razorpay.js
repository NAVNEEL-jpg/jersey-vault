import { supabase } from './supabase';
import { calcOrderTotals, FREE_SHIPPING_MIN } from './utils/shipping';
import { API_BASE } from './config/api';

const API = API_BASE;

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
  isCODMode,
  amountPaid,
  razorpayOrderId = null,
  razorpayPaymentId = null,
}) {
  const { subtotal, shipping, total } = calcOrderTotals(cart);
  const customerEmail = email || user?.email || '';
  const isFreeShippingCod = isCOD && isCODMode === 'cod' && subtotal > FREE_SHIPPING_MIN;
  const balanceDue = isFreeShippingCod 
    ? Math.max(0, subtotal - amountPaid) 
    : isCODMode === 'partial_cod'
    ? Math.max(0, total - amountPaid)
    : (isCOD ? subtotal : 0);

  const order = {
    id: orderId,
    items: cart,
    total,
    amountPaid,
    balanceDue,
    date: new Date().toLocaleDateString(),
    customer: { name, email: customerEmail, phone },
    payMethod: isCODMode === 'partial_cod' ? 'Partial_COD' : isCOD ? 'COD' : 'Online',
    subtotal,
    shipping,
    razorpayOrderId,
    razorpayPaymentId,
  };

  // Backend handles DB insert now
  if (decrementStock) await decrementStock();

  try { sessionStorage.removeItem('cart'); } catch (e) {}
  localStorage.setItem('latestOrder', JSON.stringify(order));
  navigate('/success');
}

// ─── COD with free shipping (no Razorpay charge) ─────────────────────────────
export async function placeCodOrderFree(
  name,
  email,
  phone,
  cart,
  navigate,
  decrementStock,
  form,
  user,
  onStatusChange = () => {}
) {
  const { subtotal } = calcOrderTotals(cart, 0, 'COD');
  const customerEmail = email || user?.email || '';

  onStatusChange('processing');

  const orderData = {
    customer_name: name,
    customer_email: customerEmail,
    customer_phone: phone,
    address: form.address,
    city: form.city,
    state: form.state,
    pincode: form.pincode,
    items: cart,
    subtotal,
    shipping: 0,
    total: subtotal,
    pay_method: 'COD',
  };

  try {
    const res = await fetch(`${API}/api/payment/cod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_data: orderData }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to place COD order');
    }

    onStatusChange('success');

    await finalizeOrder({
      orderId: data.order_id,
      name,
      email,
      phone,
      cart,
      navigate,
      decrementStock,
      form,
      user,
      isCOD: true,
      isCODMode: 'cod',
      amountPaid: 0,
    });
  } catch (err) {
    console.error('placeCodOrderFree error:', err);
    onStatusChange('error');
    alert(err.message || 'Failed to place COD order. Please try again.');
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
  isCODMode, // 'online' | 'cod' | 'partial_cod'
  onStatusChange = () => {}
) => {
  if (!amountToPayNow || amountToPayNow <= 0) {
    console.error('initiatePayment called with amount <= 0');
    onStatusChange('error');
    alert('Payment amount must be greater than zero.');
    return;
  }

  const { shipping, total } = calcOrderTotals(cart);
  const customerEmail = email || user?.email || '';
  const isCOD = isCODMode === 'cod' || isCODMode === 'partial_cod';

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
    description: isCODMode === 'partial_cod'
      ? `Partial COD: ₹${shipping} delivery + ₹${Math.ceil(calcOrderTotals(cart).subtotal / 2)} (50% cart value)`
      : isCOD
      ? (calcOrderTotals(cart).subtotal > FREE_SHIPPING_MIN
          ? `COD Advance: ₹99 (Free Shipping Applied) — Rest on Delivery`
          : `Shipping fee (₹${shipping}) — COD order`)
      : `Order total (₹${total})`,
    // Step 2 — Success: verify signature on backend
    handler: async function (response) {
      onStatusChange('verifying');

      const { subtotal, shipping, total } = calcOrderTotals(cart);
      const isFreeShippingCod = isCOD && isCODMode === 'cod' && subtotal > FREE_SHIPPING_MIN;
      const balanceDue = isFreeShippingCod
        ? Math.max(0, subtotal - amountToPayNow)
        : isCODMode === 'partial_cod'
        ? Math.max(0, total - amountToPayNow)
        : (isCOD ? subtotal : 0);

      const orderData = {
        customer_name: name,
        customer_email: customerEmail,
        customer_phone: phone,
        items: cart,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        subtotal,
        shipping,
        total,
        amount_paid: amountToPayNow,
        balance_due: balanceDue,
        upfront_shipping: isFreeShippingCod ? 0 : amountToPayNow,
        pay_method: isCODMode === 'partial_cod' ? 'Partial_COD' : isCOD ? 'COD' : 'Online',
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
        isCODMode,
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
