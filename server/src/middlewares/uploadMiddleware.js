import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local uploads directory exists
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (_) {}
}

// Use memory storage for direct buffer access without disk ENOENT issues
const storage = multer.memoryStorage();

// File filter to accept image uploads reliably
const fileFilter = (req, file, cb) => {
  if (!file.mimetype || file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit to support high-resolution mobile photos
});

export default upload;
