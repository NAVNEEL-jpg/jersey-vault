import express from 'express';
import { saveUser, getUserProfile, updateProfile, addToWishlist, removeFromWishlist } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/save', saveUser);
router.get('/profile/:id', getUserProfile);
router.put('/profile/:id', updateProfile);

// Wishlist
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

export default router;
