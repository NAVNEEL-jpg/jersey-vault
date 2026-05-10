import express from 'express';
import { createOrder, getUserOrders, updateOrderStatus, getOrders } from '../controllers/orderController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/user/:id', getUserOrders);
router.get('/', protect, adminOnly, getOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
