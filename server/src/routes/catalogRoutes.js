import express from 'express';
import {
  getFullCatalog,
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getSiteSettings,
} from '../controllers/catalogController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/all', getFullCatalog);
router.get('/teams', getTeams);
router.get('/settings', getSiteSettings);

// Protected admin endpoints for teams
router.post('/teams', protect, adminOnly, createTeam);
router.put('/teams/:id', protect, adminOnly, updateTeam);
router.delete('/teams/:id', protect, adminOnly, deleteTeam);

export default router;
