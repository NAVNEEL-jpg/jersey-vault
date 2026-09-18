import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { chromium } from 'playwright';
import { MEESHO_SUPPLIER_BASE_URL, MEESHO_BROWSER_MODE, MEESHO_CDP_ENDPOINT, MEESHO_ROUTES } from './meeshoConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SESSION_DIR = path.resolve(__dirname, '.session');
export const STORAGE_STATE_PATH = path.resolve(SESSION_DIR, 'storageState.json');
export const PERSISTENT_PROFILE_DIR = path.resolve(SESSION_DIR, 'browser-profile');

export function ensureSessionDir() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
}

/**
 * Robust Multi-Signal Authentication Evidence Audit
 */
export async function auditPageAuthEvidence(page) {
  try {
    await page.waitForTimeout(2000);

    const url = page.url();
    const title = await page.title();
    const isLoginRedirect = url.includes('/login') || url.includes('/auth') || url === `${MEESHO_SUPPLIER_BASE_URL}/`;
    const isAccessDenied = title.toLowerCase().includes('access denied');

    let bodyText = '';
    try {
      bodyText = await page.innerText('body');
    } catch {
      bodyText = '';
    }

    const lowerText = bodyText.toLowerCase();

    let score = 0;
    const signals = {
      protectedUrl: url.includes('/panel/'),
      dashboardRoute: url.includes('/dashboard'),
      catalogRoute: url.includes('/catalog'),
      sellerNavigationText: lowerText.includes('catalog') || lowerText.includes('orders') || lowerText.includes('inventory') || lowerText.includes('returns') || lowerText.includes('payments'),
      accountControlText: lowerText.includes('supplier') || lowerText.includes('account') || lowerText.includes('logout') || lowerText.includes('profile') || lowerText.includes('help'),
      loginFormAbsent: !lowerText.includes('enter password') && !lowerText.includes('enter mobile number') && !lowerText.includes('login to your supplier account'),
      landingPageAbsent: !lowerText.includes('sell online to crores of customers') && !lowerText.includes('0% commission'),
      accessDeniedAbsent: !isAccessDenied,
    };

    if (signals.protectedUrl) score += 25;
    if (signals.dashboardRoute || signals.catalogRoute) score += 20;
    if (signals.sellerNavigationText) score += 25;
    if (signals.accountControlText) score += 15;
    if (signals.loginFormAbsent) score += 15;

    const isAuthenticated = !isLoginRedirect && !isAccessDenied && score >= 40;

    return {
      authenticated: isAuthenticated,
      score,
      url,
      title,
      signals,
      bodyTextSnippet: bodyText.substring(0, 300).replace(/\s+/g, ' '),
    };
  } catch (err) {
    return {
      authenticated: false,
      score: 0,
      url: page.url(),
      error: err.message,
      signals: {},
    };
  }
}

/**
 * Attempts connection to an existing Chrome browser session via Playwright CDP channel attachment (`playwright-cli attach --cdp=chrome` / CDP)
 */
export async function connectToExistingChromeCDP(cdpUrl = MEESHO_CDP_ENDPOINT) {
  console.log(`\n==================================================`);
  console.log(`ANTIGRAVITY IS CONNECTING TO EXISTING CHROME SESSION`);
  console.log(`Endpoint: ${cdpUrl}`);
  console.log(`==================================================\n`);

  // Step 1: Try CDP Connection to Chrome
  try {
    console.log(`[Chrome Channel Attachment] Attempting connection...`);
    const browser = await chromium.connectOverCDP(cdpUrl);
    const contexts = browser.contexts();
    const context = contexts[0] || await browser.newContext();

    const pages = context.pages();
    console.log(`[Chrome Attachment] Existing Chrome Pages Discovered: ${pages.length}`);

    // Print safe page metadata without printing sensitive credentials/cookies
    pages.forEach((p, idx) => {
      console.log(`  [Tab ${idx + 1}] URL: ${p.url()}`);
    });

    let targetPage = pages.find((p) => p.url().includes('meesho.com'));
    if (!targetPage) {
      console.log(`[Chrome Attachment] No active Meesho tab found in existing Chrome. Opening new tab...`);
      targetPage = await context.newPage();
      await targetPage.goto(MEESHO_ROUTES.PANEL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } else {
      console.log(`[Chrome Attachment] Reusing active authenticated Meesho tab: ${targetPage.url()}`);
    }

    const authAudit = await auditPageAuthEvidence(targetPage);
    return {
      success: authAudit.authenticated,
      browser,
      context,
      page: targetPage,
      audit: authAudit,
      connectionMethod: 'CHROME_CDP_CHANNEL',
      status: authAudit.authenticated ? 'MEESHO_EXISTING_CHROME_SESSION_VERIFIED' : 'MEESHO_EXISTING_CHROME_NOT_AUTHENTICATED',
    };
  } catch (err) {
    console.log(`[Chrome Attachment Error]: ${err.message}`);
    return {
      success: false,
      status: 'CHROME_CDP_CHANNEL_UNAVAILABLE',
      error: err.message,
      reason: `Could not connect to Chrome channel over CDP. Enable 'Allow remote debugging for this browser instance' at chrome://inspect/#remote-debugging.`,
    };
  }
}

/**
 * Clean connection abstraction: getMeeshoBrowser()
 * Selects EXISTING_CHROME (via attach --cdp=chrome) with PLAYWRIGHT_LOGIN fallback
 */
export async function getMeeshoBrowser() {
  const mode = MEESHO_BROWSER_MODE;
  console.log(`[getMeeshoBrowser] Preferred Connection Mode: ${mode}`);

  if (mode === 'EXISTING_CHROME' || mode === 'CDP') {
    const cdpResult = await connectToExistingChromeCDP();
    if (cdpResult.success) {
      return cdpResult;
    }
    console.log(`[getMeeshoBrowser] Existing Chrome channel attachment unavailable. Fallback to saved persistent context...`);
  }

  // Fallback / standard mode: use persistent browser context saved during manual login
  try {
    const hasPersistentProfile = fs.existsSync(PERSISTENT_PROFILE_DIR);
    if (!hasPersistentProfile) {
      return {
        success: false,
        status: 'NO_SAVED_SESSION',
        sectionsAccessible: { dashboard: false, catalog: false, catalogUpload: false },
        message: 'No persistent profile found. Please run npm run meesho:login first.'
      };
    }

    const context = await chromium.launchPersistentContext(PERSISTENT_PROFILE_DIR, {
      headless: false,
      args: ['--start-maximized'],
      viewport: null,
    });

    const page = context.pages()[0] || await context.newPage();
    await page.goto(MEESHO_ROUTES.PANEL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const authAudit = await auditPageAuthEvidence(page);
    return {
      success: authAudit.authenticated,
      browser: null,
      context,
      page,
      audit: authAudit,
      connectionMethod: 'PERSISTENT_PROFILE',
      sectionsAccessible: {
        dashboard: authAudit.authenticated,
        catalog: authAudit.authenticated,
        catalogUpload: authAudit.authenticated
      },
      status: authAudit.authenticated ? 'MEESHO_SESSION_VERIFIED' : 'MEESHO_SESSION_EXPIRED',
    };
  } catch (err) {
    return {
      success: false,
      status: 'PERSISTENT_PROFILE_ERROR',
      sectionsAccessible: { dashboard: false, catalog: false, catalogUpload: false },
      error: err.message
    };
  }
}

/**
 * High-Level Verification for Existing Chrome Session
 */
export async function verifyExistingChromeMeeshoSession() {
  return await getMeeshoBrowser();
}

/**
 * Checks session health status without deleting storageState.json.
 */
export function checkSessionHealth() {
  ensureSessionDir();

  const hasStorageState = fs.existsSync(STORAGE_STATE_PATH);
  const hasPersistentProfile = fs.existsSync(PERSISTENT_PROFILE_DIR);

  if (!hasStorageState && !hasPersistentProfile) {
    return {
      exists: false,
      valid: false,
      status: 'MEESHO_SESSION_NOT_FOUND',
      message: 'No saved Meesho session state or browser profile found. Real human login required.',
    };
  }

  return {
    exists: true,
    valid: true,
    status: 'MEESHO_SESSION_PRESENT',
    message: 'Saved session state or browser profile found.',
  };
}

/**
 * Interactive Login Fallback
 */
export async function launchInteractiveLogin() {
  ensureSessionDir();

  console.log('\n======================================================');
  console.log('  MEESHO SELLER INTERACTIVE LOGIN (SAFE HUMAN AUTH)');
  console.log('======================================================');
  console.log(`Base URL: ${MEESHO_SUPPLIER_BASE_URL}`);

  const context = await chromium.launchPersistentContext(PERSISTENT_PROFILE_DIR, {
    headless: false,
    args: ['--start-maximized'],
    viewport: null,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto(`${MEESHO_SUPPLIER_BASE_URL}/panel/v2/new/dashboard`);

  console.log('[MeeshoAuth] Waiting for manual human login to authenticated dashboard...');

  try {
    let authed = false;
    const startTime = Date.now();
    while (Date.now() - startTime < 300000) {
      const audit = await auditPageAuthEvidence(page);
      if (audit.authenticated) {
        authed = true;
        console.log(`\n[MeeshoAuth] MEESHO_AUTHENTICATION_SUCCESS (Score: ${audit.score}/100)`);
        break;
      }
      await page.waitForTimeout(3000);
    }

    if (authed) {
      await page.waitForTimeout(3000);
      await context.storageState({ path: STORAGE_STATE_PATH });
      console.log(`[MeeshoAuth] SUCCESS: Saved storageState & persistent browser profile.`);
    }
  } catch (err) {
    console.error(`[MeeshoAuth] LOGIN TIMEOUT OR ERROR: ${err.message}`);
  } finally {
    await context.close();
  }
}
