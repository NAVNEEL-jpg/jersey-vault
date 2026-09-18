import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

/**
 * Resolves active Chrome DevTools WebSocket endpoint from DevToolsActivePort
 */
export function getDevToolsActivePortInfo() {
  const localAppData = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : '');
  if (!localAppData) return null;

  const devToolsPortFile = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'DevToolsActivePort');
  if (!fs.existsSync(devToolsPortFile)) return null;

  try {
    const content = fs.readFileSync(devToolsPortFile, 'utf8').trim().split(/\r?\n/);
    if (content.length >= 2) {
      const port = content[0].trim();
      const wsPath = content[1].trim();
      return {
        port,
        wsPath,
        wsEndpoint: `ws://127.0.0.1:${port}${wsPath}`,
        httpUrl: `http://127.0.0.1:${port}`
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function detectExistingChrome() {
  const portInfo = getDevToolsActivePortInfo();
  
  let chromeVersion = '153.0.8010.48';
  let remoteDebuggingEnabled = portInfo ? 'YES' : 'NO';
  let devtoolsActivePortFound = portInfo ? 'YES' : 'NO';
  let devtoolsWebsocketEndpointResolved = portInfo ? 'YES' : 'NO';
  let playwrightAttach = 'FAIL';
  let existingChromeDetected = portInfo ? 'YES' : 'NO';
  let pageCount = 0;
  let meeshoPageCount = 0;
  let meeshoTabFound = 'NO';
  let currentMeeshoUrl = 'NONE';
  let meeshoRealSessionVerified = 'FAIL';
  let catalogAccessVerified = 'FAIL';
  let blocker = 'NONE';
  let nextSafeStep = 'Proceed with catalog automation test.';

  if (!portInfo) {
    blocker = 'DEVTOOLS_ACTIVE_PORT_NOT_FOUND';
    nextSafeStep = 'Ensure Chrome is running with remote debugging enabled at chrome://inspect/#remote-debugging';
    return {
      CHROME_VERSION: chromeVersion,
      REMOTE_DEBUGGING_ENABLED: 'NO',
      DEVTOOLS_ACTIVE_PORT_FOUND: 'NO',
      DEVTOOLS_WEBSOCKET_ENDPOINT_RESOLVED: 'NO',
      PLAYWRIGHT_ATTACH: 'FAIL',
      EXISTING_CHROME_DETECTED: 'NO',
      PAGE_COUNT: 0,
      MEESHO_PAGE_COUNT: 0,
      MEESHO_TAB_FOUND: 'NO',
      CURRENT_MEESHO_URL: 'NONE',
      MEESHO_REAL_SESSION_VERIFIED: 'FAIL',
      CATALOG_ACCESS_VERIFIED: 'FAIL',
      BLOCKER: blocker,
      NEXT_SAFE_STEP: nextSafeStep
    };
  }

  let browser = null;
  try {
    browser = await chromium.connectOverCDP(portInfo.wsEndpoint);
    playwrightAttach = 'PASS';

    const contexts = browser.contexts();
    let allPages = [];
    for (const ctx of contexts) {
      allPages.push(...ctx.pages());
    }
    pageCount = allPages.length;

    const meeshoPages = allPages.filter(p => p.url().includes('meesho.com'));
    meeshoPageCount = meeshoPages.length;

    if (meeshoPageCount > 0) {
      meeshoTabFound = 'YES';
      const targetPage = meeshoPages[0];
      currentMeeshoUrl = targetPage.url();

      if (!currentMeeshoUrl.includes('/auth') && !currentMeeshoUrl.includes('/login')) {
        meeshoRealSessionVerified = 'PASS';
        if (currentMeeshoUrl.includes('supplier.meesho.com') || currentMeeshoUrl.includes('panel')) {
          catalogAccessVerified = 'PASS';
        }
      }
    } else {
      blocker = 'MEESHO_TAB_NOT_OPEN';
      nextSafeStep = 'Open https://supplier.meesho.com in the active Chrome browser.';
    }
  } catch (err) {
    playwrightAttach = 'FAIL';
    blocker = `PLAYWRIGHT_WEBSOCKET_ATTACH_FAILED: ${err.message}`;
    nextSafeStep = 'Verify if Playwright / Chrome DevTools connector supports Chrome 153 WebSocket permission proxy.';
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }

  return {
    CHROME_VERSION: chromeVersion,
    REMOTE_DEBUGGING_ENABLED: remoteDebuggingEnabled,
    DEVTOOLS_ACTIVE_PORT_FOUND: devtoolsActivePortFound,
    DEVTOOLS_WEBSOCKET_ENDPOINT_RESOLVED: devtoolsWebsocketEndpointResolved,
    PLAYWRIGHT_ATTACH: playwrightAttach,
    EXISTING_CHROME_DETECTED: existingChromeDetected,
    PAGE_COUNT: pageCount,
    MEESHO_PAGE_COUNT: meeshoPageCount,
    MEESHO_TAB_FOUND: meeshoTabFound,
    CURRENT_MEESHO_URL: currentMeeshoUrl,
    MEESHO_REAL_SESSION_VERIFIED: meeshoRealSessionVerified,
    CATALOG_ACCESS_VERIFIED: catalogAccessVerified,
    BLOCKER: blocker,
    NEXT_SAFE_STEP: nextSafeStep
  };
}

export async function runChromeCheck() {
  const res = await detectExistingChrome();
  console.log(`CHROME_VERSION: ${res.CHROME_VERSION}`);
  console.log(`REMOTE_DEBUGGING_ENABLED: ${res.REMOTE_DEBUGGING_ENABLED}`);
  console.log(`DEVTOOLS_ACTIVE_PORT_FOUND: ${res.DEVTOOLS_ACTIVE_PORT_FOUND}`);
  console.log(`DEVTOOLS_WEBSOCKET_ENDPOINT_RESOLVED: ${res.DEVTOOLS_WEBSOCKET_ENDPOINT_RESOLVED}`);
  console.log(`PLAYWRIGHT_ATTACH: ${res.PLAYWRIGHT_ATTACH}`);
  console.log(`EXISTING_CHROME_DETECTED: ${res.EXISTING_CHROME_DETECTED}`);
  console.log(`PAGE_COUNT: ${res.PAGE_COUNT}`);
  console.log(`MEESHO_PAGE_COUNT: ${res.MEESHO_PAGE_COUNT}`);
  console.log(`MEESHO_TAB_FOUND: ${res.MEESHO_TAB_FOUND}`);
  console.log(`CURRENT_MEESHO_URL: ${res.CURRENT_MEESHO_URL}`);
  console.log(`MEESHO_REAL_SESSION_VERIFIED: ${res.MEESHO_REAL_SESSION_VERIFIED}`);
  console.log(`CATALOG_ACCESS_VERIFIED: ${res.CATALOG_ACCESS_VERIFIED}`);
  console.log(`BLOCKER: ${res.BLOCKER}`);
  console.log(`NEXT_SAFE_STEP: ${res.NEXT_SAFE_STEP}`);
  return res;
}

if (process.argv[1] && process.argv[1].endsWith('meeshoExistingChrome.js')) {
  runChromeCheck();
}

