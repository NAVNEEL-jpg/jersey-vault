import {
  getR2Table,
  createTeamInR2,
  updateTeamInR2,
  deleteTeamInR2,
} from '../services/r2Service.js';

export const getFullCatalog = async (req, res) => {
  try {
    const [r2Products, r2Teams, r2Settings, r2Categories] = await Promise.all([
      getR2Table('products'),
      getR2Table('teams'),
      getR2Table('site_settings'),
      getR2Table('categories'),
    ]);

    const products = (r2Products || []).filter(p => p.status === 'active' || !p.status);
    const teams = r2Teams || [];
    const siteSettings = r2Settings || [];
    const categories = r2Categories || [];

    res.json({
      success: true,
      source: 'cloudflare-r2',
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
    const teams = await getR2Table('teams');
    return res.json({ success: true, source: 'cloudflare-r2', data: teams || [] });
  } catch (error) {
    console.error('getTeams Error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { name, sport, logo_url } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }
    const newTeam = await createTeamInR2({ name, sport, logo_url });
    return res.status(201).json({ success: true, data: newTeam });
  } catch (error) {
    console.error('createTeam Error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateTeamInR2(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateTeam Error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteTeamInR2(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    return res.json({ success: true, message: 'Team removed successfully' });
  } catch (error) {
    console.error('deleteTeam Error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const getSiteSettings = async (req, res) => {
  try {
    const settings = await getR2Table('site_settings');
    return res.json({ success: true, source: 'cloudflare-r2', data: settings || [] });
  } catch (error) {
    console.error('getSiteSettings Error:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};
