import { API_BASE } from '../config/api';

export const FREE_SHIPPING_MIN = 1099;
export const PREPAID_SHIPPING_FEE = 99;
export const COD_SHIPPING_FEE = 149;
export const PARTIAL_COD_SHIPPING_FEE = 99; // Partial COD: ₹99 delivery + 50% cart value upfront
export const SHIPPING_FEE = 99; // Default prepaid fee

export function calcShipping(subtotal, paymentMode = 'PREPAID', overrideFee = null) {
  if (overrideFee !== null && overrideFee !== undefined) {
    return overrideFee;
  }
  if (subtotal > FREE_SHIPPING_MIN) return 0;
  const mode = String(paymentMode).toLowerCase();
  if (mode === 'cod') return COD_SHIPPING_FEE;
  if (mode === 'partial_cod') return PARTIAL_COD_SHIPPING_FEE;
  return PREPAID_SHIPPING_FEE;
}

export function calcRazorpayTaxFee() {
  return 0;
}

export function calcOrderTotals(cart, dynamicShippingFee = null, paymentMode = 'PREPAID') {
  const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const shipping = calcShipping(subtotal, paymentMode, dynamicShippingFee);
  const total = subtotal + shipping;
  const freeShippingGap = Math.max(0, FREE_SHIPPING_MIN - subtotal);
  return { subtotal, shipping, total, freeShippingGap };
}

export async function fetchShippingDetails({ pincode, paymentMode = 'PREPAID', cart = [] }) {
  if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
    return null;
  }

  const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const modeUpper = String(paymentMode).toUpperCase();
  const isCod = modeUpper === 'COD';
  const isPartialCod = modeUpper === 'PARTIAL_COD';

  try {
    const res = await fetch(`${API_BASE}/api/shipping/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pincode,
        paymentMode: modeUpper,
        subtotal
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.error('Failed to fetch shipping details from API:', err);
  }

  // Fallback to Prepaid ₹99 / COD ₹149 / Partial COD ₹99 (₹0 if cart subtotal > ₹1099)
  const isFreeShipping = subtotal > FREE_SHIPPING_MIN;
  const fallbackFee = isFreeShipping ? 0 : (isCod ? COD_SHIPPING_FEE : isPartialCod ? PARTIAL_COD_SHIPPING_FEE : PREPAID_SHIPPING_FEE);

  return {
    serviceable: true,
    totalShipping: fallbackFee,
    delivery_fee: fallbackFee,
    freeShippingApplied: isFreeShipping,
    estimatedDays: '3-5 Business Days',
    remarks: isFreeShipping
      ? 'Free Shipping Applied 🎉 (Cart total > ₹1099)'
      : (isCod ? 'Standard COD Delivery Fee ₹149' : isPartialCod ? 'Standard Partial COD Delivery Fee ₹99' : 'Standard Delivery Fee ₹99')
  };
}
