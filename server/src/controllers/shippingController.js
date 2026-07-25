import { checkDelhiveryPincode, calculateDelhiveryRate, calculateLiveDeliveryRate } from '../services/delhivery.service.js';

/**
 * Controller to handle shipping calculation & pincode checks.
 * Uses Prepaid ₹99 / COD ₹149 delivery charges (₹0 if cart subtotal > ₹1099).
 */

export async function calculateRate(req, res) {
  try {
    const { pincode, paymentMode = 'PREPAID', subtotal = 0 } = req.body;

    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit destination pincode is required.'
      });
    }

    const rateResult = await calculateDelhiveryRate({
      destinationPincode: pincode,
      paymentMode,
      subtotal: Number(subtotal) || 0
    });

    return res.status(200).json({
      success: true,
      data: rateResult
    });
  } catch (error) {
    console.error('Error in calculateRate controller:', error);
    const subtotalNum = Number(req.body?.subtotal) || 0;
    const isCod = String(req.body?.paymentMode).toUpperCase() === 'COD';
    const fallbackFee = subtotalNum > 1099 ? 0 : (isCod ? 149 : 99);
    return res.status(200).json({
      success: true,
      data: {
        serviceable: true,
        shippingFee: fallbackFee,
        totalShipping: fallbackFee,
        delivery_fee: fallbackFee,
        freeShippingApplied: subtotalNum > 1099,
        estimatedDays: '3-5 Business Days',
        remarks: subtotalNum > 1099 ? 'Free Shipping Applied 🎉' : (isCod ? 'Standard COD Shipping Charge ₹149' : 'Standard Delivery Charge ₹99')
      }
    });
  }
}

export async function calculateLiveRateController(req, res) {
  try {
    const {
      origin_pincode,
      destination_pincode,
      payment_mode,
      subtotal = 0
    } = req.body;

    const destPin = destination_pincode || req.body.pincode;

    if (!destPin || !/^\d{6}$/.test(String(destPin).trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit destination pincode is required.'
      });
    }

    const rateResult = await calculateLiveDeliveryRate({
      origin_pincode,
      destination_pincode: destPin,
      payment_mode,
      subtotal: Number(subtotal) || 0
    });

    return res.status(200).json({
      success: true,
      data: rateResult
    });
  } catch (error) {
    console.error('Error in calculateLiveRateController:', error);
    const subtotalNum = Number(req.body?.subtotal) || 0;
    const isCod = String(payment_mode).toUpperCase() === 'COD';
    const fallbackFee = subtotalNum > 1099 ? 0 : (isCod ? 149 : 99);
    return res.status(200).json({
      success: true,
      data: {
        success: true,
        serviceable: true,
        delivery_fee: fallbackFee,
        totalShipping: fallbackFee,
        upfront_razorpay_amount: fallbackFee,
        free_shipping_applied: subtotalNum > 1099,
        label: subtotalNum > 1099 ? 'Free Shipping 🎉' : (isCod ? 'Standard COD Delivery (₹149)' : 'Standard Delivery (₹99)'),
        estimated_days: '3-5 Business Days',
        remarks: subtotalNum > 1099 ? 'Free Shipping Applied 🎉' : (isCod ? 'Standard COD Shipping Charge ₹149' : 'Standard Delivery Charge ₹99')
      }
    });
  }
}

export async function checkPincode(req, res) {
  try {
    const { pincode } = req.params;

    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit pincode is required.'
      });
    }

    const result = await checkDelhiveryPincode(pincode);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in checkPincode controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check pincode serviceability.'
    });
  }
}
