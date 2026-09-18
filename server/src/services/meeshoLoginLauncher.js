import http from 'http';
import { exec } from 'child_process';
import { MEESHO_SUPPLIER_BASE_URL } from '../integrations/meesho/meeshoConfig.js';

const DEFAULT_PORT = 37891;

/**
 * Phase 2: Clickable Local Login Launcher Server
 */
export function startLoginLauncherServer(port = DEFAULT_PORT) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/meesho/login' || req.url === '/') {
        const meeshoTargetUrl = `${MEESHO_SUPPLIER_BASE_URL}/panel/v3/new/root/login`;

        // Attempt to open in user's OS default browser (which is normal Chrome)
        const startCmd = process.platform === 'win32' ? `start "" "${meeshoTargetUrl}"` : `open "${meeshoTargetUrl}"`;
        exec(startCmd, (err) => {
          if (err) console.warn(`[Launcher] Could not launch browser command: ${err.message}`);
        });

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Jersey Vault Meesho Login Launcher</title>
              <style>
                body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; max-width: 480px; }
                h2 { color: #38bdf8; margin-top: 0; }
                p { color: #94a3b8; line-height: 1.5; }
                .status { background: #064e3b; color: #34d399; padding: 0.75rem; border-radius: 6px; font-weight: 600; margin-top: 1.5rem; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>Jersey Vault × Meesho Login</h2>
                <p>Redirecting to Meesho Seller Panel in your normal Chrome browser...</p>
                <div class="status">Opening ${meeshoTargetUrl}</div>
              </div>
              <script>
                setTimeout(function() {
                  window.location.href = "${meeshoTargetUrl}";
                }, 1000);
              </script>
            </body>
          </html>
        `);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(port, '127.0.0.1', () => {
      const launcherUrl = `http://127.0.0.1:${port}/meesho/login`;
      resolve({ server, port, launcherUrl });
    });
  });
}
