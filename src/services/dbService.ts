import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Booking, SlotRestriction, Announcement } from '../types';
import type { StoredAccount, PendingVerification } from '../store/authStore';

// ==========================================
// USERS & AUTHENTICATION DB SERVICES
// ==========================================

export async function fetchUsersFromDB(): Promise<StoredAccount[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users from Supabase:', error);
      return null;
    }
    return data.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      registrationNumber: u.registration_number,
      passwordHash: u.password_hash,
      isAdmin: u.is_admin,
      isVerified: u.is_verified,
      createdAt: u.created_at,
    }));
  } catch (err) {
    console.error('Supabase fetchUsers error:', err);
    return null;
  }
}

export async function saveUserToDB(user: StoredAccount): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      registration_number: user.registrationNumber ? user.registrationNumber.toUpperCase() : '',
      password_hash: user.passwordHash,
      is_admin: Boolean(user.isAdmin),
      is_verified: Boolean(user.isVerified),
      created_at: user.createdAt || new Date().toISOString(),
    });
    if (error) {
      console.error('Error saving user to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase saveUser error:', err);
    return false;
  }
}

export async function savePendingVerificationToDB(pending: PendingVerification): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('pending_verifications').upsert({
      email: pending.email.toLowerCase(),
      name: pending.name,
      registration_number: pending.registrationNumber.toUpperCase(),
      password_hash: pending.passwordHash,
      code: pending.code,
      expires_at: pending.expiresAt,
      sent_at: pending.sentAt,
    });
    if (error) {
      console.error('Error saving pending verification to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase savePendingVerification error:', err);
    return false;
  }
}

export async function deletePendingVerificationFromDB(email: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('pending_verifications').delete().eq('email', email.toLowerCase());
  } catch (err) {
    console.error('Supabase deletePendingVerification error:', err);
  }
}

// ==========================================
// BOOKINGS DB SERVICES
// ==========================================

export async function fetchBookingsFromDB(): Promise<Booking[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booked_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings from Supabase:', error);
      return null;
    }

    return data.map(b => ({
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
  } catch (err) {
    console.error('Supabase fetchBookings error:', err);
    return null;
  }
}

export async function saveBookingToDB(booking: Booking): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('bookings').upsert({
      id: booking.id,
      activity_id: booking.activityId,
      activity_name: booking.activityName,
      category: booking.category,
      date_string: booking.dateString,
      date_key: booking.dateKey,
      time_slot: booking.timeSlot,
      venue: booking.venue,
      user_name: booking.userName,
      registration_number: booking.registrationNumber.toUpperCase(),
      user_email: booking.userEmail.toLowerCase(),
      user_id: booking.userId || null,
      status: booking.status,
      booked_at: booking.bookedAt || new Date().toISOString(),
      cancellation_reason: booking.cancellationReason || null,
      cancelled_by: booking.cancelledBy || null,
      cancelled_at: booking.cancelledAt || null,
    });

    if (error) {
      console.error('Error saving booking to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase saveBooking error:', err);
    return false;
  }
}

// ==========================================
// RESTRICTED SLOTS DB SERVICES
// ==========================================

export async function fetchRestrictedSlotsFromDB(): Promise<SlotRestriction[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('restricted_slots').select('*');
    if (error) {
      console.error('Error fetching restricted slots from Supabase:', error);
      return null;
    }
    return data.map(r => ({
      id: r.id,
      facilityCategory: r.facility_category || 'indoor',
      facilityName: r.facility_name || r.activity_name || '',
      activityId: r.activity_id,
      activityName: r.activity_name,
      type: r.type || 'slot',
      dateKey: r.date_key,
      dateString: r.date_string || '',
      timeSlot: r.time_slot,
      reason: r.reason || 'Maintenance',
      description: r.description,
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.error('Supabase fetchRestrictedSlots error:', err);
    return null;
  }
}

export async function saveRestrictedSlotToDB(slot: SlotRestriction): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('restricted_slots').upsert({
      id: slot.id,
      facility_category: slot.facilityCategory,
      facility_name: slot.facilityName,
      activity_id: slot.activityId,
      activity_name: slot.activityName,
      type: slot.type,
      date_key: slot.dateKey,
      date_string: slot.dateString,
      time_slot: slot.timeSlot,
      reason: slot.reason,
      description: slot.description || null,
      created_at: slot.createdAt || new Date().toISOString(),
    });
    if (error) {
      console.error('Error saving restricted slot to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase saveRestrictedSlot error:', err);
    return false;
  }
}

export async function deleteRestrictedSlotFromDB(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('restricted_slots').delete().eq('id', id);
    if (error) {
      console.error('Error deleting restricted slot from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase deleteRestrictedSlot error:', err);
    return false;
  }
}

// ==========================================
// ANNOUNCEMENTS DB SERVICES
// ==========================================

export async function fetchAnnouncementsFromDB(): Promise<Announcement[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements from Supabase:', error);
      return null;
    }
    return data.map(a => ({
      id: a.id,
      title: a.title,
      message: a.message,
      priority: a.priority || 'Medium',
      publishDate: a.publish_date || a.date || '',
      isActive: a.is_active !== undefined ? a.is_active : true,
      createdAt: a.created_at,
    }));
  } catch (err) {
    console.error('Supabase fetchAnnouncements error:', err);
    return null;
  }
}

export async function saveAnnouncementToDB(announcement: Announcement): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('announcements').upsert({
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      publish_date: announcement.publishDate,
      is_active: announcement.isActive,
      created_at: announcement.createdAt || new Date().toISOString(),
    });
    if (error) {
      console.error('Error saving announcement to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase saveAnnouncement error:', err);
    return false;
  }
}

export async function deleteAnnouncementFromDB(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      console.error('Error deleting announcement from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase deleteAnnouncement error:', err);
    return false;
  }
}

// ==========================================
// REAL-TIME SUBSCRIPTION HELPERS
// ==========================================

export function subscribeToRealtimeChanges(onUpdate: () => void) {
  if (!isSupabaseConfigured() || !supabase) return () => {};

  const client = supabase;
  const channel = client
    .channel('campus_realtime_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'restricted_slots' },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'announcements' },
      () => onUpdate()
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
