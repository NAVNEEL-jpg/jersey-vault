import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getReviews, addReview, toggleReview, deleteReview } from '../controllers/productController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Reviews routes (Must come before /:id)
router.get('/reviews/all', getReviews);
router.get('/reviews/:productId', getReviews);
router.post('/reviews', addReview);
router.put('/reviews/toggle', toggleReview);
router.delete('/reviews/:productId/:reviewId', deleteReview);

router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
