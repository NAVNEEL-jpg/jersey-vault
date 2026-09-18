import dotenv from 'dotenv';
dotenv.config();

/**
 * Configurable Meesho Supplier Base URL
 * Default: https://supplier.meesho.com
 */
export const MEESHO_SUPPLIER_BASE_URL = (process.env.MEESHO_SUPPLIER_BASE_URL || 'https://supplier.meesho.com').replace(/\/+$/, '');

export const MEESHO_BROWSER_MODE = process.env.MEESHO_BROWSER_MODE || 'EXISTING_CHROME';
export const MEESHO_CDP_ENDPOINT = process.env.MEESHO_CDP_ENDPOINT || 'http://127.0.0.1:9222';

export const MEESHO_ROUTES = {
  HOME: MEESHO_SUPPLIER_BASE_URL,
  PANEL: `${MEESHO_SUPPLIER_BASE_URL}/panel/v2/new/dashboard`,
  CATALOG: `${MEESHO_SUPPLIER_BASE_URL}/panel/v2/new/catalog`,
  CATALOG_UPLOAD: `${MEESHO_SUPPLIER_BASE_URL}/panel/v2/new/catalog/upload`,
};
