import { supabase } from '../config/supabase.js';
import { getR2Table } from '../services/r2Service.js';

export const getFullCatalog = async (req, res) => {
  try {
    let products = null;
    let teams = null;
    let siteSettings = null;
    let categories = null;
    let source = 'supabase';

    try {
      const [pRes, tRes, sRes, cRes] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'active'),
        supabase.from('teams').select('*').order('name', { ascending: true }),
        supabase.from('site_settings').select('*'),
        supabase.from('categories').select('*'),
      ]);

      if (pRes.error || !pRes.data) throw new Error(pRes.error?.message || 'Products fetch failed');
      products = pRes.data;
      teams = tRes.data || [];
      siteSettings = sRes.data || [];
      categories = cRes.data || [];
    } catch (supabaseErr) {
      console.warn('[catalogController] Supabase unavailable, falling back to Cloudflare R2 backup:', supabaseErr.message);
      source = 'r2';
      const [r2Products, r2Teams, r2Settings, r2Categories] = await Promise.all([
        getR2Table('products'),
        getR2Table('teams'),
        getR2Table('site_settings'),
        getR2Table('categories'),
      ]);

      products = (r2Products || []).filter(p => p.status === 'active' || !p.status);
      teams = r2Teams || [];
      siteSettings = r2Settings || [];
      categories = r2Categories || [];
    }

    res.json({
      success: true,
      source,
      products,
      teams,
      siteSettings,
      categories,
    });
  } catch (error) {
    console.error('catalogController Error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const getTeams = async (req, res) => {
  try {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return res.json({ success: true, source: 'supabase', data });
    } catch (sbErr) {
      console.warn('[catalogController:getTeams] Supabase failed, using R2 fallback:', sbErr.message);
      const teams = await getR2Table('teams');
      return res.json({ success: true, source: 'r2', data: teams });
    }
  } catch (error) {
    console.error('getTeams Error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const getSiteSettings = async (req, res) => {
  try {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      return res.json({ success: true, source: 'supabase', data });
    } catch (sbErr) {
      console.warn('[catalogController:getSiteSettings] Supabase failed, using R2 fallback:', sbErr.message);
      const settings = await getR2Table('site_settings');
      return res.json({ success: true, source: 'r2', data: settings });
    }
  } catch (error) {
    console.error('getSiteSettings Error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};
