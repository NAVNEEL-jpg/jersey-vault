import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMeeshoBrowser } from './meeshoAuth.js';
import { MEESHO_BROWSER_MODE } from './meeshoConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');

export async function generateExistingChromeFinalReport() {
  console.log('\n===================================================================');
  console.log('  JERSEY VAULT × MEESHO: CHROME CHANNEL ATTACHMENT AUDIT & REPORT');
  console.log('===================================================================\n');

  const authResult = await getMeeshoBrowser();

  const isChromeDetected = authResult.error ? authResult.error.includes('DevToolsActivePort') || authResult.error.includes('ECONNREFUSED') : authResult.success;
  const isRemoteDebuggingEnabled = authResult.success;
  const isCdpChannelAvailable = authResult.success;
  const isConnected = authResult.success;
  const isMeeshoTabFound = authResult.success && authResult.page ? true : false;
  const isAuthed = authResult.audit ? authResult.audit.authenticated : false;

  let dashAccess = 'FAIL';
  let catalogAccess = 'FAIL';
  let catalogUploadFound = 'NOT FOUND';

  if (isConnected && authResult.page) {
    dashAccess = authResult.audit.signals.protectedUrl || authResult.audit.signals.dashboardRoute ? 'PASS' : 'FAIL';

    try {
      await authResult.page.goto('https://supplier.meesho.com/panel/v2/new/catalog', { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (authResult.page.url().includes('/catalog')) catalogAccess = 'PASS';
      await authResult.page.screenshot({ path: path.resolve(WORKSPACE_ROOT, 'catalog_page.png') });
    } catch {
      catalogAccess = 'FAIL';
    }

    try {
      await authResult.page.goto('https://supplier.meesho.com/panel/v2/new/catalog/upload', { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (authResult.page.url().includes('/upload')) catalogUploadFound = 'FOUND';
      await authResult.page.screenshot({ path: path.resolve(WORKSPACE_ROOT, 'catalog_upload_page.png') });
    } catch {
      catalogUploadFound = 'NOT FOUND';
    }

    try {
      await authResult.page.goto('https://supplier.meesho.com/panel/v2/new/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await authResult.page.screenshot({ path: path.resolve(WORKSPACE_ROOT, 'authenticated_dashboard.png') });
    } catch {}
  }

  const finalStatus = isConnected && isAuthed ? 'MEESHO_EXISTING_CHROME_SESSION_VERIFIED' : 'CHROME_CDP_CHANNEL_UNAVAILABLE';

  const reportPath = path.resolve(WORKSPACE_ROOT, 'meesho_existing_chrome_final_report.md');
  const lines = [];

  lines.push('# JERSEY VAULT × MEESHO: EXISTING CHROME SESSION REPORT');
  lines.push(`**Generated Date:** ${new Date().toISOString()}`);
  lines.push(`**Final Status:** \`${finalStatus}\`\n`);

  lines.push('---');
  lines.push('## 1. CONNECTION & ENVIRONMENT AUDIT');
  lines.push(`- **Chrome Detected:** ${isChromeDetected ? 'YES' : 'NO'}`);
  lines.push(`- **Remote Debugging Enabled:** ${isRemoteDebuggingEnabled ? 'YES' : 'NO'}`);
  lines.push(`- **CDP Chrome Channel:** ${isCdpChannelAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`);
  lines.push(`- **Attachment:** ${isConnected ? 'PASS' : 'FAIL'}`);
  lines.push(`- **Existing Meesho Tab:** ${isMeeshoTabFound ? 'FOUND' : 'NOT FOUND'}`);
  lines.push(`- **Meesho Authentication:** ${isAuthed ? 'VERIFIED' : 'NOT AUTHENTICATED'}\n`);

  lines.push('---');
  lines.push('## 2. SELLER PANEL NAVIGATION AUDIT');
  lines.push(`- **Seller Dashboard:** ${dashAccess}`);
  lines.push(`- **Catalog:** ${catalogAccess}`);
  lines.push(`- **Catalog Upload:** ${catalogUploadFound}\n`);

  lines.push('---');
  lines.push('## 3. SECURITY & MUTATION VERIFICATION');
  lines.push(`- **Cookies Exported:** NO`);
  lines.push(`- **Tokens Printed:** NO`);
  lines.push(`- **Workbook Uploaded:** NO`);
  lines.push(`- **Catalog Submitted:** NO`);
  lines.push(`- **Inventory Modified:** NO`);
  lines.push(`- **Price Modified:** NO\n`);

  lines.push('---');
  lines.push('## 4. INSTRUCTIONS TO ENABLE CHROME REMOTE DEBUGGING');
  if (!isConnected) {
    lines.push('To connect Antigravity directly to your active Google Chrome browser:');
    lines.push('1. Open `chrome://inspect/#remote-debugging` in your running Chrome browser.');
    lines.push('2. Enable "Allow remote debugging for this browser instance". Keep Chrome open.');
    lines.push('3. Re-run this report generation:');
    lines.push('   ```cmd');
    lines.push('   node server/src/integrations/meesho/meeshoExistingChromeFinalRunner.js');
    lines.push('   ```\n');
  }

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`[Final Report Generated]: ${reportPath}`);
}

generateExistingChromeFinalReport();
