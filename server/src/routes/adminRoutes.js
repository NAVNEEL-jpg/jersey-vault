import express from 'express';
import { getStats, getAllUsers, deleteUser, getSettings, updateSettings } from '../controllers/adminController.js';
import { generateInvoice } from '../controllers/invoiceController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect);
router.use(adminOnly);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/orders/:id/invoice', generateInvoice);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
