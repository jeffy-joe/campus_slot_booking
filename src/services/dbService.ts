import type { Booking, SlotRestriction, Announcement } from '../types';
import type { StoredAccount, PendingVerification } from '../store/authStore';

// ==========================================
// USERS & AUTHENTICATION DB SERVICES
// ==========================================

export async function fetchUsersFromDB(): Promise<StoredAccount[] | null> {
  try {
    const res = await fetch('/api/db?action=get_users');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !Array.isArray(data.users)) return null;
    return data.users;
  } catch (err) {
    console.error('Neon fetchUsers error:', err);
    return null;
  }
}

export async function saveUserToDB(user: StoredAccount): Promise<boolean> {
  try {
    const res = await fetch('/api/db?action=save_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Neon saveUser error:', err);
    return false;
  }
}

export async function savePendingVerificationToDB(pending: PendingVerification): Promise<boolean> {
  try {
    const res = await fetch('/api/db?action=save_pending_verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pending }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Neon savePendingVerification error:', err);
    return false;
  }
}

export async function deletePendingVerificationFromDB(email: string): Promise<void> {
  try {
    await fetch('/api/db?action=delete_pending_verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch (err) {
    console.error('Neon deletePendingVerification error:', err);
  }
}

// ==========================================
// BOOKINGS DB SERVICES
// ==========================================

export async function fetchBookingsFromDB(): Promise<Booking[] | null> {
  try {
    const res = await fetch('/api/db?action=get_bookings');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !Array.isArray(data.bookings)) return null;
    return data.bookings;
  } catch (err) {
    console.error('Neon fetchBookings error:', err);
    return null;
  }
}

export async function saveBookingToDB(booking: Booking): Promise<boolean> {
  try {
    const res = await fetch('/api/db?action=save_booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Neon saveBooking error:', err);
    return false;
  }
}

// ==========================================
// RESTRICTED SLOTS DB SERVICES
// ==========================================

export async function fetchRestrictedSlotsFromDB(): Promise<SlotRestriction[] | null> {
  try {
    const res = await fetch('/api/db?action=get_restricted_slots');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !Array.isArray(data.slots)) return null;
    return data.slots;
  } catch (err) {
    console.error('Neon fetchRestrictedSlots error:', err);
    return null;
  }
}

export async function saveRestrictedSlotToDB(slot: SlotRestriction): Promise<boolean> {
  try {
    const res = await fetch('/api/db?action=save_restricted_slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Neon saveRestrictedSlot error:', err);
    return false;
  }
}

export async function deleteRestrictedSlotFromDB(id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/db?action=delete_restricted_slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Neon deleteRestrictedSlot error:', err);
    return false;
  }
}

// ==========================================
// ANNOUNCEMENTS DB SERVICES
// ==========================================

export async function fetchAnnouncementsFromDB(): Promise<Announcement[] | null> {
  try {
    const res = await fetch('/api/db?action=get_announcements');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !Array.isArray(data.announcements)) return null;
    return data.announcements;
  } catch (err) {
    console.error('Neon fetchAnnouncements error:', err);
    return null;
  }
}

export async function saveAnnouncementToDB(announcement: Announcement): Promise<boolean> {
  try {
    const res = await fetch('/api/db?action=save_announcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcement }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Neon saveAnnouncement error:', err);
    return false;
  }
}

export async function deleteAnnouncementFromDB(id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/db?action=delete_announcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Neon deleteAnnouncement error:', err);
    return false;
  }
}

// ==========================================
// REAL-TIME SUBSCRIPTION HELPERS
// ==========================================

export function subscribeToRealtimeChanges(_onUpdate?: () => void) {
  return () => {};
}
