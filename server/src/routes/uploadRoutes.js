import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('Jersey image')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('Jersey image')
      .getPublicUrl(filePath);

    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    console.error('uploadRoutes.js Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

export default router;
