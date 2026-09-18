import { chromium } from 'playwright';
import { auditPageAuthEvidence } from '../integrations/meesho/meeshoAuth.js';
import { MEESHO_CDP_ENDPOINT, MEESHO_ROUTES } from '../integrations/meesho/meeshoConfig.js';

/**
 * Phase 3: Same-Browser Existing Chrome Authentication & Session Verification
 */
export async function waitForExistingChromeAuth(cdpUrl = MEESHO_CDP_ENDPOINT, pollTimeoutMs = 300000) {
  console.log(`[ExistingChromeAuth] Attaching Playwright to existing Chrome session at ${cdpUrl}...`);

  let browser = null;
  try {
    browser = await chromium.connectOverCDP(cdpUrl);
  } catch (err) {
    console.error(`[ExistingChromeAuth] CDP Connection Error: ${err.message}`);
    return {
      success: false,
      status: 'EXISTING_CHROME_NOT_ATTACHABLE',
      browser: null,
      context: null,
      page: null,
    };
  }

  const contexts = browser.contexts();
  const context = contexts[0] || await browser.newContext();

  let targetPage = context.pages().find((p) => p.url().includes('meesho.com'));
  if (!targetPage) {
    targetPage = await context.newPage();
    await targetPage.goto(MEESHO_ROUTES.PANEL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  console.log(`[ExistingChromeAuth] Polling attached browser for authentic Seller Panel evidence...`);

  let authed = false;
  let authAudit = null;
  const startTime = Date.now();

  while (Date.now() - startTime < pollTimeoutMs) {
    if (targetPage.isClosed()) {
      console.log(`[ExistingChromeAuth] Attached page was closed by user.`);
      break;
    }

    authAudit = await auditPageAuthEvidence(targetPage);
    if (authAudit.authenticated) {
      authed = true;
      console.log(`[ExistingChromeAuth] Authentication Verified! Score: ${authAudit.score}/100`);
      break;
    }

    await targetPage.waitForTimeout(3000);
  }

  if (!authed) {
    return {
      success: false,
      status: 'EXISTING_CHROME_NOT_AUTHENTICATED',
      browser,
      context,
      page: targetPage,
      audit: authAudit,
    };
  }

  // Verify Read-Only Catalog Navigation Access
  let catalogAccess = false;
  try {
    await targetPage.goto(MEESHO_ROUTES.CATALOG, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (targetPage.url().includes('/catalog')) {
      catalogAccess = true;
    }
  } catch {
    catalogAccess = false;
  }

  return {
    success: catalogAccess,
    status: catalogAccess ? 'MEESHO_REAL_SESSION_VERIFIED' : 'CATALOG_ACCESS_FAILED',
    browser,
    context,
    page: targetPage,
    audit: authAudit,
    catalogAccessVerified: catalogAccess,
  };
}
