import express from 'express';
import fs from 'fs';
import {
  getR2Table,
  updateR2Table,
  createProductInR2,
  updateProductInR2,
  deleteProductInR2,
  createTeamInR2,
  updateTeamInR2,
  deleteTeamInR2,
  uploadFileToR2,
  getFileStreamFromR2,
} from '../services/r2Service.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Helper to filter and project array data
function applyFilters(items, query) {
  let result = [...items];

  // Apply filters
  for (const [key, rawValue] of Object.entries(query)) {
    if (['select', 'order', 'limit', 'offset', 'single'].includes(key)) continue;

    const val = String(rawValue);

    if (val.startsWith('eq.')) {
      const target = val.slice(3);
      result = result.filter(item => String(item[key]) === target);
    } else if (val.startsWith('neq.')) {
      const target = val.slice(4);
      result = result.filter(item => String(item[key]) !== target);
    } else if (val.startsWith('in.(') && val.endsWith(')')) {
      const targetList = val.slice(4, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      result = result.filter(item => targetList.includes(String(item[key])));
    } else if (val.startsWith('ilike.')) {
      const target = val.slice(6).replace(/%/g, '').toLowerCase();
      result = result.filter(item => String(item[key] || '').toLowerCase().includes(target));
    } else if (val.startsWith('is.')) {
      const target = val.slice(3).toLowerCase();
      if (target === 'null') {
        result = result.filter(item => item[key] === null || item[key] === undefined);
      } else if (target === 'true') {
        result = result.filter(item => item[key] === true);
      } else if (target === 'false') {
        result = result.filter(item => item[key] === false);
      }
    } else {
      // Direct equality match
      result = result.filter(item => String(item[key]) === val);
    }
  }

  // Apply sorting
  if (query.order) {
    const [field, direction] = query.order.split('.');
    const isAsc = direction !== 'desc';
    result.sort((a, b) => {
      const valA = a[field] ?? '';
      const valB = b[field] ?? '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return isAsc ? valA - valB : valB - valA;
      }
      return isAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  // Apply limit
  if (query.limit) {
    const limitNum = parseInt(query.limit, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      result = result.slice(0, limitNum);
    }
  }

  // Apply column selection if specified (e.g. select=id,name,price)
  if (query.select && query.select !== '*') {
    const fields = query.select.split(',').map(f => f.trim()).filter(Boolean);
    result = result.map(item => {
      const projected = {};
      fields.forEach(f => {
        if (f in item) projected[f] = item[f];
      });
      return projected;
    });
  }

  return result;
}

// ── GET /api/db/:table ──────────────────────────────────────────────────────
router.get('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const items = await getR2Table(table);

    const filtered = applyFilters(items, req.query);

    if (req.query.single === 'true') {
      if (filtered.length === 0) {
        return res.status(404).json({ data: null, error: { message: 'Row not found', code: 'PGRST116' } });
      }
      return res.json({ data: filtered[0], error: null });
    }

    res.json({ data: filtered, error: null });
  } catch (err) {
    console.error(`[dbRoutes:GET /${req.params.table}] Error:`, err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

import { supabase } from '../config/supabase.js';

// Verify admin authorization for Cloudflare database mutations
const verifyAdminForMutations = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      data: null,
      error: { message: 'Unauthorized: Admin authorization token is required.' }
    });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  const adminEmail = (process.env.ADMIN_EMAIL || 'navneeldutta@gmail.com').toLowerCase();
  if (error || !user || user.email?.toLowerCase() !== adminEmail) {
    return res.status(403).json({
      data: null,
      error: { message: 'Unauthorized: Only navneeldutta@gmail.com has admin permission to modify Cloudflare database.' }
    });
  }
  req.user = user;
  next();
};

// ── POST /api/db/:table ─────────────────────────────────────────────────────
router.post('/:table', verifyAdminForMutations, async (req, res) => {
  try {
    const { table } = req.params;
    const payload = Array.isArray(req.body) ? req.body[0] : req.body;

    let createdItem = null;
    if (table === 'products') {
      createdItem = await createProductInR2(payload);
    } else if (table === 'teams') {
      createdItem = await createTeamInR2(payload);
    } else {
      const items = await getR2Table(table);
      createdItem = { ...payload, id: payload.id || Date.now().toString() };
      const updated = [createdItem, ...items];
      await updateR2Table(table, updated);
    }

    res.status(201).json({ data: createdItem, error: null });
  } catch (err) {
    console.error(`[dbRoutes:POST /${req.params.table}] Error:`, err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── PATCH / PUT /api/db/:table ──────────────────────────────────────────────
const handleUpdate = async (req, res) => {
  try {
    const { table } = req.params;
    const updates = req.body;
    const idFilter = req.query.id;
    const keyFilter = req.query.key;

    if (table === 'products' && idFilter) {
      const id = idFilter.replace(/^eq\./, '');
      const updated = await updateProductInR2(id, updates);
      if (!updated) return res.status(404).json({ data: null, error: { message: 'Product not found' } });
      return res.json({ data: updated, error: null });
    }

    if (table === 'teams' && idFilter) {
      const id = idFilter.replace(/^eq\./, '');
      const updated = await updateTeamInR2(id, updates);
      if (!updated) return res.status(404).json({ data: null, error: { message: 'Team not found' } });
      return res.json({ data: updated, error: null });
    }

    // Generic update for site_settings or other tables
    const items = await getR2Table(table);
    let updatedItem = null;
    const updatedList = items.map(item => {
      const matchesId = idFilter && String(item.id) === idFilter.replace(/^eq\./, '');
      const matchesKey = keyFilter && String(item.key) === keyFilter.replace(/^eq\./, '');
      if (matchesId || matchesKey) {
        updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      return item;
    });

    if (!updatedItem && keyFilter && table === 'site_settings') {
      // Upsert into site_settings if key not found
      const key = keyFilter.replace(/^eq\./, '');
      updatedItem = { key, ...updates };
      updatedList.push(updatedItem);
    }

    await updateR2Table(table, updatedList);
    res.json({ data: updatedItem, error: null });
  } catch (err) {
    console.error(`[dbRoutes:UPDATE /${req.params.table}] Error:`, err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
};

router.patch('/:table', verifyAdminForMutations, handleUpdate);
router.put('/:table', verifyAdminForMutations, handleUpdate);

// ── DELETE /api/db/:table ───────────────────────────────────────────────────
router.delete('/:table', verifyAdminForMutations, async (req, res) => {
  try {
    const { table } = req.params;
    const idFilter = req.query.id;
    const id = idFilter ? idFilter.replace(/^eq\./, '') : null;

    if (!id) {
      return res.status(400).json({ data: null, error: { message: 'id filter is required for delete' } });
    }

    if (table === 'products') {
      const deleted = await deleteProductInR2(id);
      if (!deleted) return res.status(404).json({ data: null, error: { message: 'Product not found' } });
      return res.json({ data: null, error: null });
    }

    if (table === 'teams') {
      const deleted = await deleteTeamInR2(id);
      if (!deleted) return res.status(404).json({ data: null, error: { message: 'Team not found' } });
      return res.json({ data: null, error: null });
    }

    const items = await getR2Table(table);
    const filtered = items.filter(item => String(item.id) !== id);
    await updateR2Table(table, filtered);
    res.json({ data: null, error: null });
  } catch (err) {
    console.error(`[dbRoutes:DELETE /${req.params.table}] Error:`, err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── STORAGE UPLOAD /api/db/storage/:bucket/upload ───────────────────────────
router.post('/storage/:bucket/upload', verifyAdminForMutations, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: { message: 'No file provided' } });
    }

    const { bucket } = req.params;
    const fileName = req.body.fileName || `${Date.now()}_${req.file.originalname}`;
    const cleanBucket = bucket.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const key = `${cleanBucket}/${fileName}`;

    let buffer = req.file.buffer;
    if (!buffer && req.file.path) {
      buffer = fs.readFileSync(req.file.path);
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }

    let publicUrl = await uploadFileToR2(buffer, key, req.file.mimetype || 'image/jpeg');
    // Ensure streamable URL via API proxy
    publicUrl = `/api/db/storage/${key}`;

    // Also write local backup if bucket is teams
    try {
      if (cleanBucket === 'teams' || cleanBucket === 'team-logos') {
        const localTeamsDir = path.resolve(__dirname, '../../../client/public/teams');
        if (fs.existsSync(localTeamsDir)) {
          fs.writeFileSync(path.join(localTeamsDir, fileName), buffer);
        }
      }
    } catch (_) {}

    res.json({ data: { path: key, publicUrl }, error: null });
  } catch (err) {
    console.error('[dbRoutes:storage/upload] Error:', err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── GET /api/db/storage/:bucket/:filename (Stream media file directly from Cloudflare R2) ──
router.get('/storage/:bucket/:filename', async (req, res) => {
  try {
    const { bucket, filename } = req.params;
    const cleanBucket = bucket.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const fullKey = `${cleanBucket}/${filename}`;

    const streamObj = await getFileStreamFromR2(fullKey);
    if (!streamObj || !streamObj.Body) {
      return res.status(404).json({ error: 'File not found in Cloudflare R2' });
    }

    if (streamObj.ContentType) res.setHeader('Content-Type', streamObj.ContentType);
    if (streamObj.ContentLength) res.setHeader('Content-Length', streamObj.ContentLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    streamObj.Body.pipe(res);
  } catch (err) {
    console.error('[dbRoutes:storage/get] Error:', err.message);
    res.status(404).json({ error: 'File not found' });
  }
});

export default router;
