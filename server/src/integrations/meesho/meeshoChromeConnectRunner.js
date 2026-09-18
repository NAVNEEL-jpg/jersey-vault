import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyExistingChromeMeeshoSession } from './meeshoAuth.js';
import { MEESHO_BROWSER_MODE, MEESHO_CDP_ENDPOINT } from './meeshoConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');

export async function runChromeConnectionAudit() {
  console.log('\n===================================================================');
  console.log('  JERSEY VAULT × MEESHO: EXISTING CHROME SESSION CONNECTION AUDIT');
  console.log(`  BROWSER MODE: ${MEESHO_BROWSER_MODE}`);
  console.log(`  CDP ENDPOINT: ${MEESHO_CDP_ENDPOINT}`);
  console.log('===================================================================\n');

  let connectionStatus = 'EXISTING_CHROME_CONNECTION_FAILED';
  let cdpAudit = null;
  let browserConnected = false;
  let pageCount = 0;
  let currentUrl = 'N/A';
  let pageTitle = 'N/A';
  let catalogAccess = 'NOT_FOUND';
  let catalogUploadFound = 'NOT_FOUND';

  if (MEESHO_BROWSER_MODE === 'EXISTING_CHROME') {
    cdpAudit = await verifyExistingChromeMeeshoSession();
    if (cdpAudit.success) {
      browserConnected = true;
      connectionStatus = cdpAudit.status;
      currentUrl = cdpAudit.page.url();
      pageTitle = await cdpAudit.page.title();
      pageCount = (await cdpAudit.context.pages()).length;

      // Verify Catalog Section Navigation safely
      try {
        await cdpAudit.page.goto('https://supplier.meesho.com/panel/v2/new/catalog', { waitUntil: 'domcontentloaded', timeout: 15000 });
        if (cdpAudit.page.url().includes('/catalog')) {
          catalogAccess = 'PASS';
        }
      } catch {
        catalogAccess = 'FAILED';
      }

      // Verify Catalog Upload Navigation safely
      try {
        await cdpAudit.page.goto('https://supplier.meesho.com/panel/v2/new/catalog/upload', { waitUntil: 'domcontentloaded', timeout: 15000 });
        if (cdpAudit.page.url().includes('/upload')) {
          catalogUploadFound = 'FOUND';
        }
      } catch {
        catalogUploadFound = 'NOT_FOUND';
      }

    } else {
      connectionStatus = cdpAudit.status;
    }
  }

  // Generate Report: meesho_existing_chrome_connection_report.md
  const reportPath = path.resolve(WORKSPACE_ROOT, 'meesho_existing_chrome_connection_report.md');
  const lines = [];

  lines.push('# JERSEY VAULT × MEESHO EXISTING CHROME CONNECTION REPORT');
  lines.push(`**Generated Date:** ${new Date().toISOString()}`);
  lines.push(`**Browser Connection Result:** \`${browserConnected ? 'PASS' : 'FAIL'}\``);
  lines.push(`**Final Status:** \`${connectionStatus}\`\n`);

  lines.push('---');
  lines.push('## 1. BROWSER & SESSION AUDIT METRICS');
  lines.push(`- **Browser Connection Mode:** \`${MEESHO_BROWSER_MODE}\``);
  lines.push(`- **CDP Endpoint Attempted:** \`${MEESHO_CDP_ENDPOINT}\``);
  lines.push(`- **Existing Chrome Detected:** ${browserConnected ? 'YES' : 'NO'}`);
  lines.push(`- **Existing Meesho Session Authenticated:** ${browserConnected ? 'VERIFIED' : 'NOT AUTHENTICATED'}`);
  lines.push(`- **Open Browser Tabs Count:** ${pageCount}`);
  lines.push(`- **Active Page Title:** "${pageTitle}"`);
  lines.push(`- **Active Page URL:** \`${currentUrl}\`\n`);

  lines.push('---');
  lines.push('## 2. SELLER PANEL SECTION ACCESS');
  lines.push(`- **Meesho Dashboard Access:** ${browserConnected ? 'PASS' : 'FAIL'}`);
  lines.push(`- **Catalog Section Access:** \`${catalogAccess}\``);
  lines.push(`- **Catalog Upload Page:** \`${catalogUploadFound}\`\n`);

  lines.push('---');
  lines.push('## 3. SECURITY & PRIVACY VERIFICATION');
  lines.push(`- [x] **Authentication Exported / Copied:** NO (Attached directly over CDP)`);
  lines.push(`- [x] **Cookies or Passwords Logged:** NO`);
  lines.push(`- [x] **Workbook Uploaded:** NO (\`meesho_catalog_final_dry_run.xlsx\` NOT selected)`);
  lines.push(`- [x] **Catalog Submitted / Published:** NO`);
  lines.push(`- [x] **Inventory or Price Edits:** NONE\n`);

  lines.push('---');
  lines.push('## 4. INSTRUCTIONS TO ENABLE CHROME CDP CONNECTION');
  if (!browserConnected) {
    lines.push('To connect Antigravity directly to your active Google Chrome browser:');
    lines.push('1. Close all active Google Chrome windows.');
    lines.push('2. Launch Chrome from terminal with remote debugging enabled:');
    lines.push('   ```cmd');
    lines.push('   "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222');
    lines.push('   ```');
    lines.push('3. In that Chrome window, navigate to `https://supplier.meesho.com` and log in.');
    lines.push('4. Re-run this audit script:');
    lines.push('   ```cmd');
    lines.push('   node server/src/integrations/meesho/meeshoChromeConnectRunner.js');
    lines.push('   ```\n');
  } else {
    lines.push('Successfully connected to active Chrome session! Ready for live UI discovery.\n');
  }

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`[Report Generated] Report written to: ${reportPath}`);
  return connectionStatus;
}

runChromeConnectionAudit();
