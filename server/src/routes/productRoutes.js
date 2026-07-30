import express from 'express';
import rateLimit from 'express-rate-limit';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getReviews, addReview, toggleReview, deleteReview, updateReview } from '../controllers/productController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many reviews from this IP, please try again after an hour.' }
});

// Reviews routes (Must come before /:id)
router.get('/reviews/all', getReviews);
router.get('/reviews/:productId', getReviews);
router.post('/reviews', reviewLimiter, addReview);
router.put('/reviews/toggle', protect, adminOnly, toggleReview);
router.put('/reviews', protect, adminOnly, updateReview);
router.delete('/reviews/:productId/:reviewId', protect, adminOnly, deleteReview);

router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
