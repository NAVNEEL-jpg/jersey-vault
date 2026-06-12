import express from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
  razorpayWebhook,
  checkPaymentStatus,
  reconcilePayment,
  reconcilePayment,
} from '../controllers/paymentController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create Razorpay order (called before opening modal)
router.post('/create-order', createRazorpayOrder);

// Verify signature after success callback
router.post('/verify', verifyPayment);

// Removed POST /cod

// Razorpay webhook — raw body handled in server.js
router.post('/webhook', razorpayWebhook);

// Recovery: check if a payment was captured for a given razorpay order ID
router.get('/status/:razorpayOrderId', checkPaymentStatus);

// Support reconciliation tool (admin only)
router.get('/reconcile/:query', protect, adminOnly, reconcilePayment);

export default router;
