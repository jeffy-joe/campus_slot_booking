import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { sendEmailReceiptViaSMTP, verifySMTPConnection, sendVerificationEmail, sendCancellationEmailViaSMTP } from './server/emailService.ts'

function smtpApiPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    const url = (req.url || '').split('?')[0].replace(/\/$/, '') || '/';

    // CORS preflight handling
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.statusCode = 204;
      res.end();
      return;
    }

    // Common JSON header
    const sendJson = (statusCode: number, data: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.statusCode = statusCode;
      res.end(JSON.stringify(data));
    };

    // 1. Health & Connection check: GET /api/smtp-status
    if (url === '/api/smtp-status' && req.method === 'GET') {
      try {
        const status = await verifySMTPConnection();
        sendJson(200, status);
      } catch (err: any) {
        sendJson(500, {
          configured: false,
          ready: false,
          error: err?.message || 'Failed to check SMTP status',
        });
      }
      return;
    }

    // 2. Send Slot Booking Receipt: POST /api/send-receipt
    if (url === '/api/send-receipt' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          if (!payload.userEmail) {
            sendJson(400, { success: false, error: 'Recipient email is required' });
            return;
          }
          const result = await sendEmailReceiptViaSMTP(payload);
          sendJson(result.success ? 200 : 200, result);
        } catch (err: any) {
          sendJson(400, { success: false, error: err?.message || 'Invalid JSON payload' });
        }
      });
      return;
    }

    // 3. Send Quick Test Email: POST /api/test-smtp
    if (url === '/api/test-smtp' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const testEmail = payload.email || process.env.SMTP_USER;
          if (!testEmail) {
            sendJson(400, { success: false, error: 'Target email is required' });
            return;
          }
          const result = await sendEmailReceiptViaSMTP({
            bookingId: 'TEST-DIAG',
            userName: 'Campus User (SMTP Test)',
            registrationNumber: 'TEST001',
            userEmail: testEmail,
            activityName: 'Campus Arena Diagnostic Test',
            dateString: new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
            timeSlot: 'Diagnostic Run',
            venue: 'Main Campus Portal',
          });
          sendJson(200, result);
        } catch (err: any) {
          sendJson(400, { success: false, error: err?.message || 'Failed to trigger test email' });
        }
      });
      return;
    }

    // 4. Send Account Verification Code: POST /api/send-verification-code
    if (url === '/api/send-verification-code' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          if (!payload.email || !payload.code) {
            sendJson(400, { success: false, error: 'Target email and verification code are required' });
            return;
          }
          const result = await sendVerificationEmail(payload);
          sendJson(result.success ? 200 : 400, result);
        } catch (err: any) {
          sendJson(400, { success: false, error: err?.message || 'Failed to dispatch verification code' });
        }
      });
      return;
    }

    // 5. Send Slot Cancellation Notice: POST /api/send-cancellation
    if (url === '/api/send-cancellation' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          if (!payload.userEmail || !payload.bookingId) {
            sendJson(400, { success: false, error: 'Recipient email and bookingId are required' });
            return;
          }
          const result = await sendCancellationEmailViaSMTP(payload);
          sendJson(result.success ? 200 : 200, result);
        } catch (err: any) {
          sendJson(400, { success: false, error: err?.message || 'Failed to dispatch cancellation email' });
        }
      });
      return;
    }

    next();
  };

  return {
    name: 'smtp-api-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), smtpApiPlugin()],
})
