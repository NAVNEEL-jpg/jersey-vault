import express from 'express';
import { getFullCatalog, getTeams, getSiteSettings } from '../controllers/catalogController.js';

const router = express.Router();

router.get('/all', getFullCatalog);
router.get('/teams', getTeams);
router.get('/settings', getSiteSettings);

export default router;
