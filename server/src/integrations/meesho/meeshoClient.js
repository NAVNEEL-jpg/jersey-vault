import { MEESHO_SUPPLIER_BASE_URL, MEESHO_ROUTES } from './meeshoConfig.js';
import { checkSessionHealth, STORAGE_STATE_PATH } from './meeshoAuth.js';

export class MeeshoClient {
  constructor() {
    this.sessionStatus = checkSessionHealth();
  }

  /**
   * Safe read-only inspection of the seller panel.
   * Performs NO mutations (no creates, updates, deletes, or submissions).
   */
  async inspectAccount() {
    if (!this.sessionStatus.valid) {
      return {
        success: false,
        status: this.sessionStatus.status,
        message: this.sessionStatus.message,
      };
    }

    console.log('[MeeshoClient] Initializing safe read-only session verification...');

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        storageState: STORAGE_STATE_PATH,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();

      // Navigate to seller panel dashboard
      const response = await page.goto(MEESHO_ROUTES.PANEL, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const currentUrl = page.url();

      if (currentUrl.includes('/login') || currentUrl.includes('/auth') || currentUrl === `${MEESHO_SUPPLIER_BASE_URL}/`) {
        return {
          success: false,
          status: 'MEESHO_SESSION_EXPIRED',
          message: 'Saved session expired or invalidated by Meesho. Manual re-authentication required.',
        };
      }

      // Safe read-only extraction of dashboard metadata
      const pageTitle = await page.title();
      
      return {
        success: true,
        status: 'AUTHENTICATED_READ_ONLY_ACTIVE',
        details: {
          currentUrl,
          pageTitle,
          statusCode: response ? response.status() : 200,
          authenticated: true,
        },
      };
    } catch (err) {
      return {
        success: false,
        status: 'INSPECTION_FAILED',
        error: err.message,
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Safe read-only discovery of catalog template structure.
   */
  async discoverCatalogWorkflow() {
    return {
      templateType: 'APPAREL_TOPWEAR_EXCEL_TEMPLATE',
      mandatoryFields: [
        'Product Name',
        'Variation / Size',
        'Meesho Selling Price',
        'MRP',
        'Wrong/Defective Returns Price',
        'Net Weight (grams)',
        'Inventory',
        'Country of Origin',
        'Manufacturer Name',
        'Manufacturer Address',
        'Manufacturer Pincode',
        'Packer Name',
        'Packer Address',
        'Packer Pincode',
        'Color',
        'Fabric',
        'Generic Name',
        'Neck',
        'Net Quantity',
        'Print/Pattern Type',
        'Sleeve Length',
        'Chest Size',
        'Length Size',
        'Product Images',
        'Style ID',
        'SKU ID',
        'Brand Name',
      ],
      supportedUploadMethods: ['Bulk Excel Spreadsheet (.xlsx)', 'Single Product UI Form'],
      qcProcess: 'Automated + Manual Quality Check (QC) upon catalog submission (24-48 hour approval window).',
    };
  }
}
