import express from 'express';
import rateLimit from 'express-rate-limit';
import { createOrder, getUserOrders, updateOrderStatus, getOrders, trackOrder } from '../controllers/orderController.js';
import { generateInvoice } from '../controllers/invoiceController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many tracking requests from this IP, please try again later.' }
});

router.post('/', protect, createOrder);
router.get('/track/:trackingId', trackingLimiter, trackOrder);
router.get('/user/:id', protect, getUserOrders);
router.get('/', protect, adminOnly, getOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.get('/:id/invoice', generateInvoice);

export default router;
