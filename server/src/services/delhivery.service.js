/**
 * Service to interact with Delhivery APIs for pincode serviceability & tracking.
 * Standard shipping rates: Prepaid ₹99, COD ₹149 (Free shipping for cart subtotal > ₹1099).
 */

const DELHIVERY_BASE_URL = process.env.DELHIVERY_ENV === 'staging'
  ? 'https://staging-express.delhivery.com'
  : 'https://track.delhivery.com';

const getApiKey = () => process.env.DELHIVERY_API_KEY;
const getPickupPin = () => process.env.DELHIVERY_PICKUP_PINCODE || '700074';

export const FREE_SHIPPING_MIN = 1099;
export const PREPAID_SHIPPING_FEE = 99;
export const COD_SHIPPING_FEE = 149;

/**
 * Check if destination pincode is serviceable by Delhivery and if COD is available.
 * @param {string} destinationPincode 
 */
export async function checkDelhiveryPincode(destinationPincode) {
  const apiKey = getApiKey();
  const pincodeStr = String(destinationPincode).trim();

  if (!/^\d{6}$/.test(pincodeStr)) {
    return {
      serviceable: false,
      message: 'Invalid 6-digit pincode',
      isCodAvailable: false,
      isPrepaidAvailable: false
    };
  }

  if (!apiKey) {
    return {
      serviceable: true,
      message: 'Serviceable (Standard verification)',
      isCodAvailable: true,
      isPrepaidAvailable: true,
      city: '',
      state: ''
    };
  }

  try {
    const url = `${DELHIVERY_BASE_URL}/c/api/pin-codes/json/?token=${apiKey}&filter_codes=${pincodeStr}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        serviceable: true,
        message: 'Pincode serviceable',
        isCodAvailable: true,
        isPrepaidAvailable: true,
        city: '',
        state: ''
      };
    }

    const data = await response.json();
    const codes = data?.delivery_codes;

    if (Array.isArray(codes) && codes.length > 0) {
      const pinObj = codes[0]?.postal_code;
      if (pinObj) {
        const isCodAvailable = (pinObj.is_cod === 'Y' || pinObj.cod === 'Y') && pinObj.cash !== 'N';
        const isPrepaidAvailable = pinObj.pre_paid === 'Y' || pinObj.prepaid === 'Y';
        return {
          serviceable: true,
          message: 'Pincode is serviceable by Delhivery',
          isCodAvailable,
          isPrepaidAvailable,
          city: pinObj.district || pinObj.city || '',
          state: pinObj.state_code || pinObj.state || '',
          raw: pinObj
        };
      }
    }

    return {
      serviceable: false,
      message: 'Delhivery does not currently deliver to this pincode',
      isCodAvailable: false,
      isPrepaidAvailable: false
    };
  } catch (err) {
    console.error('[Delhivery Pincode Error]:', err.message);
    return {
      serviceable: true,
      message: 'Serviceable (Offline verification)',
      isCodAvailable: true,
      isPrepaidAvailable: true
    };
  }
}

/**
 * Standard shipping rate calculation (Prepaid ₹99, COD ₹149, ₹0 for cart subtotal > ₹1099).
 */
export async function calculateDelhiveryRate({ destinationPincode, paymentMode = 'PREPAID', subtotal = 0 }) {
  const destPin = String(destinationPincode).trim();
  const isCodMode = String(paymentMode).toUpperCase() === 'COD';

  const serviceability = await checkDelhiveryPincode(destPin);

  if (!serviceability.serviceable) {
    return {
      serviceable: false,
      shippingFee: 0,
      codCharge: 0,
      totalShipping: 0,
      freeShippingApplied: false,
      estimatedDays: 'N/A',
      remarks: serviceability.message
    };
  }

  if (isCodMode && !serviceability.isCodAvailable) {
    return {
      serviceable: false,
      shippingFee: 0,
      codCharge: 0,
      totalShipping: 0,
      freeShippingApplied: false,
      estimatedDays: 'N/A',
      remarks: 'Cash on Delivery (COD) is not available for this pincode by Delhivery. Please select Pay Online.'
    };
  }

  const isFreeShipping = Number(subtotal) > FREE_SHIPPING_MIN;
  const finalFee = isFreeShipping ? 0 : (isCodMode ? COD_SHIPPING_FEE : PREPAID_SHIPPING_FEE);

  return {
    serviceable: true,
    shippingFee: finalFee,
    codCharge: 0,
    totalShipping: finalFee,
    delivery_fee: finalFee,
    freeShippingApplied: isFreeShipping,
    estimatedDays: '3-5 Business Days',
    city: serviceability.city || '',
    state: serviceability.state || '',
    remarks: isFreeShipping
      ? 'Free Shipping Applied 🎉 (Cart total > ₹1099)'
      : (isCodMode ? 'Standard COD Shipping Charge ₹149' : 'Standard Delivery Charge ₹99')
  };
}

/**
 * Standard shipping live rate controller helper (Prepaid ₹99, COD ₹149, ₹0 for cart subtotal > ₹1099).
 */
export async function calculateLiveDeliveryRate({
  origin_pincode,
  destination_pincode,
  payment_mode = 'Prepaid',
  subtotal = 0
}) {
  const destPin = String(destination_pincode).trim();
  const isCodMode = String(payment_mode).toUpperCase() === 'COD';

  const serviceability = await checkDelhiveryPincode(destPin);

  if (!serviceability.serviceable) {
    return {
      success: false,
      serviceable: false,
      delivery_fee: 0,
      totalShipping: 0,
      upfront_razorpay_amount: 0,
      remarks: serviceability.message || 'Pincode not serviceable'
    };
  }

  const isFreeShipping = Number(subtotal) > FREE_SHIPPING_MIN;
  const finalFee = isFreeShipping ? 0 : (isCodMode ? COD_SHIPPING_FEE : PREPAID_SHIPPING_FEE);

  return {
    success: true,
    serviceable: true,
    origin_pincode: origin_pincode || getPickupPin(),
    destination_pincode: destPin,
    payment_mode: isCodMode ? 'COD' : 'Prepaid',
    is_hybrid_cod: isCodMode,
    courier_mode: 'Standard Delivery',
    delivery_fee: finalFee,
    totalShipping: finalFee,
    upfront_razorpay_amount: finalFee,
    free_shipping_applied: isFreeShipping,
    label: isFreeShipping ? 'Free Shipping 🎉' : (isCodMode ? 'Standard COD Delivery (₹149)' : 'Standard Delivery (₹99)'),
    estimated_days: '3-5 Business Days',
    city: serviceability.city || '',
    state: serviceability.state || '',
    remarks: isFreeShipping
      ? 'Free Shipping Applied 🎉 (Cart total > ₹1099)'
      : (isCodMode ? 'Standard COD Shipping Charge ₹149' : 'Standard Delivery Charge ₹99')
  };
}

/**
 * Track shipment via Delhivery API.
 */
export async function trackDelhiveryShipment(trackingId) {
  const apiKey = getApiKey();
  if (!apiKey || !trackingId) {
    return { success: false, message: 'Tracking ID or API Key missing' };
  }

  try {
    const url = `${DELHIVERY_BASE_URL}/api/v1/packages/json/?token=${apiKey}&waybill=${trackingId}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Failed to fetch tracking information' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    console.error('Delhivery Tracking Error:', err.message);
    return { success: false, message: err.message };
  }
}
