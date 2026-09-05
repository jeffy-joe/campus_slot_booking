import { useState, useEffect } from 'react';
import type { Booking, SportActivity } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY = 'campus_sports_bookings_v2';
const LEGACY_STORAGE_KEY = 'campus_sports_bookings_v1';

const DEMO_BOOKING_IDS = ['TT3108260100', 'FS3108260500', 'CR0109260900'];

function mapSupabaseRowToBooking(row: any): Booking {
  return {
    id: row.id,
    activityId: row.activity_id,
    activityName: row.activity_name,
    category: row.category,
    dateString: row.date_string,
    dateKey: row.date_key,
    timeSlot: row.time_slot,
    venue: row.venue,
    userName: row.user_name,
    registrationNumber: row.registration_number,
    userEmail: row.user_email,
    userId: row.user_id,
    bookedAt: row.booked_at,
    status: row.status,
    cancellationReason: row.cancellation_reason,
    cancelledBy: row.cancelled_by,
    cancelledAt: row.cancelled_at,
    emailDeliveryStatus: row.email_delivery_status || 'sent',
    emailPreviewUrl: row.email_preview_url,
    emailError: row.email_error,
    emailSender: row.email_sender,
    cancellationEmailStatus: row.cancellation_email_status,
    cancellationEmailError: row.cancellation_email_error,
  };
}

export function useBookingStore() {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      // 1. Try v2 storage
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed: Booking[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude any legacy mock/demo bookings
          return parsed.filter(b => !DEMO_BOOKING_IDS.includes(b.id) && !b.userEmail.includes('@campus.com'));
        }
      }
    } catch (e) {
      console.error('Failed to parse saved bookings', e);
    }
    return [];
  });

  // Sync with Supabase on mount & listen to real-time changes if configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;

    // Fetch live bookings
    supabase
      .from('bookings')
      .select('*')
      .order('booked_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (!error && data && isMounted) {
          const mapped = data.map(mapSupabaseRowToBooking);
          setBookings(mapped);
        }
      });

    // Subscribe to realtime database changes
    const channel = supabase
      .channel('public:bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload: any) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            const newB = mapSupabaseRowToBooking(payload.new);
            setBookings(prev => [newB, ...prev.filter(b => b.id !== newB.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapSupabaseRowToBooking(payload.new);
            setBookings(prev => prev.map(b => (b.id === updated.id ? updated : b)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setBookings(prev => prev.filter(b => b.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch (e) {
      console.error('Failed to store bookings', e);
    }
  }, [bookings]);

  // Helper to generate a realistic booking ID like TT3108260300
  const generateBookingId = (sport: SportActivity, dateKey: string, timeSlot: string): string => {
    const prefix = sport.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .padEnd(2, 'X');
    
    // dateKey is YYYY-MM-DD -> DDMMYY
    const parts = dateKey.split('-');
    const day = parts[2] || '31';
    const month = parts[1] || '08';
    const year = (parts[0] || '2026').slice(-2);
    
    // timeSlot "03:00 PM - 04:00 PM" -> 0300
    const timeNum = timeSlot.replace(/[^0-9]/g, '').slice(0, 4) || '1200';
    return `${prefix}${day}${month}${year}${timeNum}`;
  };

  const createBooking = (params: {
    sport: SportActivity;
    dateString: string;
    dateKey: string;
    timeSlot: string;
    venue: string;
    userName: string;
    registrationNumber: string;
    userEmail: string;
    userId?: string;
    emailDeliveryStatus?: 'sent' | 'failed' | 'simulated';
    emailPreviewUrl?: string;
    emailError?: string;
    emailSender?: string;
  }): Booking => {
    const id = generateBookingId(params.sport, params.dateKey, params.timeSlot);

    const newBooking: Booking = {
      id,
      activityId: params.sport.id,
      activityName: params.sport.name,
      category: params.sport.category,
      dateString: params.dateString,
      dateKey: params.dateKey,
      timeSlot: params.timeSlot,
      venue: params.venue,
      userName: params.userName.trim(),
      registrationNumber: params.registrationNumber.trim().toUpperCase(),
      userEmail: params.userEmail.trim(),
      userId: params.userId,
      bookedAt: new Date().toISOString(),
      status: 'confirmed',
      emailDeliveryStatus: params.emailDeliveryStatus || 'sent',
      emailPreviewUrl: params.emailPreviewUrl,
      emailError: params.emailError,
      emailSender: params.emailSender,
    };

    setBookings(prev => [newBooking, ...prev.filter(b => b.id !== id)]);

    if (isSupabaseConfigured) {
      supabase
        .from('bookings')
        .upsert({
          id: newBooking.id,
          activity_id: newBooking.activityId,
          activity_name: newBooking.activityName,
          category: newBooking.category,
          date_string: newBooking.dateString,
          date_key: newBooking.dateKey,
          time_slot: newBooking.timeSlot,
          venue: newBooking.venue,
          user_name: newBooking.userName,
          registration_number: newBooking.registrationNumber,
          user_email: newBooking.userEmail,
          user_id: newBooking.userId || null,
          booked_at: newBooking.bookedAt,
          status: newBooking.status,
          email_delivery_status: newBooking.emailDeliveryStatus,
          email_preview_url: newBooking.emailPreviewUrl || null,
          email_error: newBooking.emailError || null,
          email_sender: newBooking.emailSender || null,
        })
        .then(({ error }: any) => {
          if (error) console.error('Supabase booking insert error:', error);
        });
    }

    return newBooking;
  };

  const updateBookingEmailStatus = (
    id: string,
    status: 'sent' | 'failed' | 'simulated',
    error?: string,
    email?: string,
    sender?: string
  ) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.id.toUpperCase() === id.trim().toUpperCase()) {
          return {
            ...b,
            emailDeliveryStatus: status,
            emailError: error,
            ...(email ? { userEmail: email.trim() } : {}),
            ...(sender ? { emailSender: sender } : {}),
          };
        }
        return b;
      })
    );

    if (isSupabaseConfigured) {
      const updates: any = {
        email_delivery_status: status,
        email_error: error || null,
      };
      if (email) updates.user_email = email.trim();
      if (sender) updates.email_sender = sender;
      supabase
        .from('bookings')
        .update(updates)
        .eq('id', id.trim().toUpperCase())
        .then(({ error: err }: any) => {
          if (err) console.error('Supabase update email error:', err);
        });
    }
  };

  const cancelBooking = (
    id: string,
    reason?: string,
    cancelledBy: 'admin' | 'user' = 'user',
    emailStatus?: 'sent' | 'failed' | 'simulated',
    emailError?: string
  ): boolean => {
    let found = false;
    const finalReason = reason || (cancelledBy === 'admin' ? 'Cancelled by Campus Administration' : 'Cancelled by Student');
    const cancelledAt = new Date().toISOString();

    setBookings(prev =>
      prev.map(b => {
        if (b.id.toUpperCase() === id.trim().toUpperCase()) {
          found = true;
          return {
            ...b,
            status: 'cancelled',
            cancellationReason: finalReason,
            cancelledBy,
            cancelledAt,
            ...(emailStatus ? { cancellationEmailStatus: emailStatus } : {}),
            ...(emailError ? { cancellationEmailError: emailError } : {}),
          };
        }
        return b;
      })
    );

    if (isSupabaseConfigured && found) {
      supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: finalReason,
          cancelled_by: cancelledBy,
          cancelled_at: cancelledAt,
          ...(emailStatus ? { cancellation_email_status: emailStatus } : {}),
          ...(emailError ? { cancellation_email_error: emailError } : {}),
        })
        .eq('id', id.trim().toUpperCase())
        .then(({ error: err }: any) => {
          if (err) console.error('Supabase cancel booking error:', err);
        });
    }

    return found;
  };

  const updateBookingCancellationEmailStatus = (
    id: string,
    status: 'sent' | 'failed' | 'simulated',
    error?: string
  ) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.id.toUpperCase() === id.trim().toUpperCase()) {
          return {
            ...b,
            cancellationEmailStatus: status,
            cancellationEmailError: error,
          };
        }
        return b;
      })
    );

    if (isSupabaseConfigured) {
      supabase
        .from('bookings')
        .update({
          cancellation_email_status: status,
          cancellation_email_error: error || null,
        })
        .eq('id', id.trim().toUpperCase())
        .then(({ error: err }: any) => {
          if (err) console.error('Supabase cancellation email update error:', err);
        });
    }
  };

  const isSlotBooked = (activityId: string, dateKey: string, timeSlot: string): boolean => {
    return bookings.some(
      b =>
        b.activityId === activityId &&
        b.dateKey === dateKey &&
        b.timeSlot === timeSlot &&
        b.status === 'confirmed'
    );
  };

  const getBookingById = (id: string): Booking | undefined => {
    const cleanId = id.trim().toUpperCase();
    return bookings.find(b => b.id.toUpperCase() === cleanId);
  };

  const getBookingsByEmail = (email: string): Booking[] => {
    const cleanEmail = email.trim().toLowerCase();
    return bookings.filter(b => b.userEmail.toLowerCase() === cleanEmail);
  };

  const getUserBookings = (userEmail?: string, userId?: string): Booking[] => {
    if (!userEmail && !userId) return [];
    const cleanEmail = userEmail?.trim().toLowerCase();
    return bookings
      .filter(b => {
        if (userId && b.userId && b.userId === userId) return true;
        if (cleanEmail && b.userEmail && b.userEmail.trim().toLowerCase() === cleanEmail) return true;
        return false;
      })
      .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
  };

  return {
    bookings,
    createBooking,
    updateBookingEmailStatus,
    cancelBooking,
    updateBookingCancellationEmailStatus,
    isSlotBooked,
    getBookingById,
    getBookingsByEmail,
    getUserBookings,
  };
}
