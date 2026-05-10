import Subcategory from '../models/Subcategory.js';

export const getSubcategories = async (req, res) => {
  try {
    const { parent } = req.query;
    const q = parent ? { parentCategory: parent } : {};
    const list = await Subcategory.find(q).populate('parentCategory', 'name').sort({ name: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSubcategory = async (req, res) => {
  try {
    const { name, parentCategory } = req.body;
    if (!name || !parentCategory) {
      return res.status(400).json({ message: 'name and parentCategory required' });
    }
    const base = String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'sub';
    const slug = `${base}-${Date.now()}`;
    const created = await Subcategory.create({ name: name.trim(), slug, parentCategory });
    const populated = await Subcategory.findById(created._id).populate('parentCategory', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    const sub = await Subcategory.findById(req.params.id);
    if (!sub) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    await sub.deleteOne();
    res.json({ message: 'Subcategory removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
