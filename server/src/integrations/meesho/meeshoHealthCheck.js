import { checkSessionHealth } from './meeshoAuth.js';
import { MeeshoClient } from './meeshoClient.js';

async function runHealthCheck() {
  console.log('\n======================================================');
  console.log('  JERSEY VAULT × MEESHO INTEGRATION HEALTH CHECK POC');
  console.log('======================================================\n');

  const health = checkSessionHealth();
  console.log(`[Status]: ${health.status}`);
  console.log(`[Message]: ${health.message}`);

  if (!health.valid) {
    console.log('\n[Action Required]: Session is not authenticated or absent.');
    console.log('To authenticate safely with human-in-the-loop OTP/CAPTCHA, run:');
    console.log('  node server/src/integrations/meesho/meeshoAuthLauncher.js\n');
    return;
  }

  console.log('\n[Session Valid]: Running safe read-only inspection...');
  const client = new MeeshoClient();
  const result = await client.inspectAccount();
  console.log('\n[Read-Only Result]:', JSON.stringify(result, null, 2));
}

runHealthCheck();
