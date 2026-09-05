import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendCancellationEmailViaSMTP } from '../server/emailService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body?.userEmail || !body?.bookingId) {
      return res.status(400).json({ success: false, error: 'Recipient email and bookingId are required' });
    }

    const result = await sendCancellationEmailViaSMTP(body);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Failed to dispatch cancellation email' });
  }
}
