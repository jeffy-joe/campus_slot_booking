import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

function getDatabaseUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    null
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    return res.status(200).json({
      success: false,
      error: 'DATABASE_URL environment variable is missing in Vercel settings.',
      connected: false,
    });
  }

  const sql = neon(dbUrl);
  const action = (req.query.action as string) || (req.body && req.body.action);

  try {
    switch (action) {
      case 'ping': {
        await sql`SELECT 1;`;
        return res.status(200).json({ success: true, connected: true });
      }

      // --- USERS ---
      case 'get_users': {
        const rows = await sql`
          SELECT id, name, email, registration_number, password_hash, is_admin, is_verified, created_at
          FROM users;
        `;
        const users = rows.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          registrationNumber: u.registration_number,
          passwordHash: u.password_hash,
          isAdmin: Boolean(u.is_admin),
          isVerified: Boolean(u.is_verified),
          createdAt: u.created_at,
        }));
        return res.status(200).json({ success: true, users });
      }

      case 'save_user': {
        const { user } = req.body;
        if (!user || !user.id || !user.email) {
          return res.status(400).json({ success: false, error: 'Missing required user fields' });
        }
        await sql`
          INSERT INTO users (id, name, email, registration_number, password_hash, is_admin, is_verified, created_at)
          VALUES (
            ${user.id},
            ${user.name},
            ${user.email.toLowerCase()},
            ${(user.registrationNumber || '').toUpperCase()},
            ${user.passwordHash},
            ${Boolean(user.isAdmin)},
            ${Boolean(user.isVerified)},
            ${user.createdAt || new Date().toISOString()}
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            registration_number = EXCLUDED.registration_number,
            password_hash = EXCLUDED.password_hash,
            is_admin = EXCLUDED.is_admin,
            is_verified = EXCLUDED.is_verified;
        `;
        return res.status(200).json({ success: true });
      }

      // --- PENDING VERIFICATIONS ---
      case 'save_pending_verification': {
        const { pending } = req.body;
        if (!pending || !pending.email) {
          return res.status(400).json({ success: false, error: 'Missing pending verification data' });
        }
        await sql`
          INSERT INTO pending_verifications (email, name, registration_number, password_hash, code, expires_at, sent_at)
          VALUES (
            ${pending.email.toLowerCase()},
            ${pending.name},
            ${pending.registrationNumber.toUpperCase()},
            ${pending.passwordHash},
            ${pending.code},
            ${pending.expiresAt},
            ${pending.sentAt}
          )
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            registration_number = EXCLUDED.registration_number,
            password_hash = EXCLUDED.password_hash,
            code = EXCLUDED.code,
            expires_at = EXCLUDED.expires_at,
            sent_at = EXCLUDED.sent_at;
        `;
        return res.status(200).json({ success: true });
      }

      case 'delete_pending_verification': {
        const email = req.body?.email || req.query.email;
        if (!email) {
          return res.status(400).json({ success: false, error: 'Missing email' });
        }
        await sql`
          DELETE FROM pending_verifications WHERE LOWER(email) = LOWER(${email});
        `;
        return res.status(200).json({ success: true });
      }

      // --- BOOKINGS ---
      case 'get_bookings': {
        const rows = await sql`
          SELECT id, activity_id, activity_name, category, date_string, date_key, time_slot, venue,
                 user_name, registration_number, user_email, user_id, status, booked_at,
                 cancellation_reason, cancelled_by, cancelled_at
          FROM bookings
          ORDER BY booked_at DESC;
        `;
        const bookings = rows.map((b: any) => ({
          id: b.id,
          activityId: b.activity_id,
          activityName: b.activity_name,
          category: b.category,
          dateString: b.date_string,
          dateKey: b.date_key,
          timeSlot: b.time_slot,
          venue: b.venue,
          userName: b.user_name,
          registrationNumber: b.registration_number,
          userEmail: b.user_email,
          userId: b.user_id,
          status: b.status,
          bookedAt: b.booked_at,
          cancellationReason: b.cancellation_reason,
          cancelledBy: b.cancelled_by,
          cancelledAt: b.cancelled_at,
        }));
        return res.status(200).json({ success: true, bookings });
      }

      case 'save_booking': {
        const { booking } = req.body;
        if (!booking || !booking.id) {
          return res.status(400).json({ success: false, error: 'Missing booking payload' });
        }
        await sql`
          INSERT INTO bookings (
            id, activity_id, activity_name, category, date_string, date_key, time_slot, venue,
            user_name, registration_number, user_email, user_id, status, booked_at,
            cancellation_reason, cancelled_by, cancelled_at
          )
          VALUES (
            ${booking.id},
            ${booking.activityId},
            ${booking.activityName},
            ${booking.category},
            ${booking.dateString},
            ${booking.dateKey},
            ${booking.timeSlot},
            ${booking.venue},
            ${booking.userName},
            ${booking.registrationNumber.toUpperCase()},
            ${booking.userEmail.toLowerCase()},
            ${booking.userId || null},
            ${booking.status || 'confirmed'},
            ${booking.bookedAt || new Date().toISOString()},
            ${booking.cancellationReason || null},
            ${booking.cancelledBy || null},
            ${booking.cancelledAt || null}
          )
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            cancellation_reason = EXCLUDED.cancellation_reason,
            cancelled_by = EXCLUDED.cancelled_by,
            cancelled_at = EXCLUDED.cancelled_at;
        `;
        return res.status(200).json({ success: true });
      }

      // --- RESTRICTED SLOTS ---
      case 'get_restricted_slots': {
        const rows = await sql`
          SELECT id, facility_category, facility_name, activity_id, activity_name, type,
                 venue, date_key, date_string, time_slot, reason, description, restricted_by, created_at
          FROM restricted_slots
          ORDER BY created_at DESC;
        `;
        const slots = rows.map((r: any) => ({
          id: r.id,
          facilityCategory: r.facility_category || 'indoor',
          facilityName: r.facility_name || r.activity_name || '',
          activityId: r.activity_id,
          activityName: r.activity_name,
          type: r.type || 'slot',
          venue: r.venue,
          dateKey: r.date_key,
          dateString: r.date_string || '',
          timeSlot: r.time_slot,
          reason: r.reason || 'Maintenance',
          description: r.description,
          createdAt: r.created_at,
        }));
        return res.status(200).json({ success: true, slots });
      }

      case 'save_restricted_slot': {
        const { slot } = req.body;
        if (!slot || !slot.id) {
          return res.status(400).json({ success: false, error: 'Missing slot payload' });
        }
        await sql`
          INSERT INTO restricted_slots (
            id, facility_category, facility_name, activity_id, activity_name, type,
            venue, date_key, date_string, time_slot, reason, description, created_at
          )
          VALUES (
            ${slot.id},
            ${slot.facilityCategory || 'indoor'},
            ${slot.facilityName || ''},
            ${slot.activityId},
            ${slot.activityName},
            ${slot.type || 'slot'},
            ${slot.venue || ''},
            ${slot.dateKey},
            ${slot.dateString || ''},
            ${slot.timeSlot},
            ${slot.reason},
            ${slot.description || null},
            ${slot.createdAt || new Date().toISOString()}
          )
          ON CONFLICT (id) DO UPDATE SET
            facility_category = EXCLUDED.facility_category,
            facility_name = EXCLUDED.facility_name,
            reason = EXCLUDED.reason,
            description = EXCLUDED.description;
        `;
        return res.status(200).json({ success: true });
      }

      case 'delete_restricted_slot': {
        const id = req.body?.id || req.query.id;
        if (!id) {
          return res.status(400).json({ success: false, error: 'Missing id' });
        }
        await sql`
          DELETE FROM restricted_slots WHERE id = ${id};
        `;
        return res.status(200).json({ success: true });
      }

      // --- ANNOUNCEMENTS ---
      case 'get_announcements': {
        const rows = await sql`
          SELECT id, title, message, priority, publish_date, is_active, created_by, created_at
          FROM announcements
          ORDER BY created_at DESC;
        `;
        const announcements = rows.map((a: any) => ({
          id: a.id,
          title: a.title,
          message: a.message,
          priority: a.priority || 'Medium',
          publishDate: a.publish_date || '',
          isActive: a.is_active !== undefined ? Boolean(a.is_active) : true,
          createdAt: a.created_at,
        }));
        return res.status(200).json({ success: true, announcements });
      }

      case 'save_announcement': {
        const { announcement } = req.body;
        if (!announcement || !announcement.id) {
          return res.status(400).json({ success: false, error: 'Missing announcement payload' });
        }
        await sql`
          INSERT INTO announcements (
            id, title, message, priority, publish_date, is_active, created_at
          )
          VALUES (
            ${announcement.id},
            ${announcement.title},
            ${announcement.message},
            ${announcement.priority || 'Medium'},
            ${announcement.publishDate || ''},
            ${Boolean(announcement.isActive)},
            ${announcement.createdAt || new Date().toISOString()}
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            message = EXCLUDED.message,
            priority = EXCLUDED.priority,
            publish_date = EXCLUDED.publish_date,
            is_active = EXCLUDED.is_active;
        `;
        return res.status(200).json({ success: true });
      }

      case 'delete_announcement': {
        const id = req.body?.id || req.query.id;
        if (!id) {
          return res.status(400).json({ success: false, error: 'Missing id' });
        }
        await sql`
          DELETE FROM announcements WHERE id = ${id};
        `;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ success: false, error: `Unsupported action: ${action}` });
    }
  } catch (error: any) {
    console.error(`Neon DB Error (${action}):`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Neon database query execution error',
    });
  }
}
