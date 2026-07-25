import express from 'express';
import { calculateRate, calculateLiveRateController, checkPincode } from '../controllers/shippingController.js';

const router = express.Router();

// Route to calculate dynamic shipping charge
router.post('/calculate', calculateRate);

// Route for live Delhivery rate calculation with tax breakdown
router.post('/live-rate', calculateLiveRateController);

// Route to check pincode serviceability
router.get('/pincode/:pincode', checkPincode);

export default router;

