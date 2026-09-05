import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySMTPConnection } from '../server/emailService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const status = await verifySMTPConnection();
    return res.status(200).json(status);
  } catch (err: any) {
    return res.status(500).json({
      configured: false,
      ready: false,
      error: err?.message || 'Failed to check SMTP status',
    });
  }
}
