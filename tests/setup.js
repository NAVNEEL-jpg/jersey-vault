const fs = require('fs');
const path = require('path');

exports.setupErrorListeners = (page) => {
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('ws://localhost:3000/ws') && text.includes('ERR_CONNECTION_REFUSED')) {
        return;
      }
      errors.push(`Console Error: ${text}`);
    }
  });

  page.on('pageerror', exception => {
    errors.push(`Unhandled Exception: ${exception.message}`);
  });

  page.on('requestfailed', request => {
    // Ignore aborted requests, usually analytics or navigation interruptions
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
      errors.push(`Failed Request: ${request.url()} - ${request.failure()?.errorText}`);
    }
  });

  return errors;
};

exports.checkErrorsAndScreenshot = async (page, testInfo, errors) => {
  if (errors.length > 0 || testInfo.status === 'failed') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTitle = testInfo.title.replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `${safeTitle}_${timestamp}.png`;
    const dir = path.join(__dirname, 'screenshots');
    
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    await page.screenshot({ path: path.join(dir, fileName), fullPage: true });

    if (errors.length > 0) {
      throw new Error(`Test failed due to global errors:\n${errors.join('\n')}`);
    }
  }
};
