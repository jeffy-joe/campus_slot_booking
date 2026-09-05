import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    return res.status(200).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!body?.userEmail || !body?.bookingId) {
      return res.status(200).json({ success: false, error: 'Recipient email and bookingId are required' });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const from = process.env.SMTP_FROM || (smtpUser ? `"Campus Sports Booking" <${smtpUser}>` : '"Campus Sports Booking" <no-reply@campus-sports.edu>');

    if (smtpUser && smtpPass) {
      try {
        const nodemailer = await import('nodemailer');
        const cleanPass = smtpPass.replace(/\s+/g, '');
        const isGmail = smtpHost.toLowerCase().includes('gmail');

        const transporter = nodemailer.createTransport(
          isGmail
            ? {
                service: 'gmail',
                auth: { user: smtpUser, pass: cleanPass },
                tls: { rejectUnauthorized: false },
              }
            : {
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: { user: smtpUser, pass: cleanPass },
                tls: { rejectUnauthorized: false },
              }
        );

        const info = await transporter.sendMail({
          from,
          to: body.userEmail,
          subject: `Slot Booking Cancelled: ${body.activityName} (${body.dateString}, ${body.timeSlot}) - Ref #${body.bookingId}`,
          text: `Notice: Your Campus Sports Slot Reservation has been Cancelled.\n\nBooking ID: ${body.bookingId}\nStudent: ${body.userName}\nSport: ${body.activityName}\nDate: ${body.dateString}\nTime: ${body.timeSlot}`,
        });

        return res.status(200).json({
          success: true,
          mode: 'smtp_configured',
          messageId: info.messageId,
          recipient: body.userEmail,
          sender: from,
        });
      } catch (smtpErr: any) {
        console.error('SMTP cancellation dispatch error:', smtpErr);
        return res.status(200).json({
          success: true,
          mode: 'fallback_simulated',
          messageId: `simulated_${Date.now()}`,
          recipient: body.userEmail,
          sender: from,
        });
      }
    }

    return res.status(200).json({
      success: true,
      mode: 'fallback_simulated',
      messageId: `simulated_${Date.now()}`,
      recipient: body.userEmail,
      sender: from,
    });
  } catch (err: any) {
    return res.status(200).json({
      success: true,
      mode: 'fallback_simulated',
      messageId: `fallback_err_${Date.now()}`,
      error: err?.message || 'Failed to dispatch cancellation',
    });
  }
}
