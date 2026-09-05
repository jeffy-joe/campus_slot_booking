import { useState, useEffect, useCallback } from 'react';
import type { Booking, SportActivity } from '../types';
import {
  fetchBookingsFromDB,
  saveBookingToDB,
  subscribeToRealtimeChanges,
} from '../services/dbService';

const STORAGE_KEY = 'campus_sports_bookings_v2';
const LEGACY_STORAGE_KEY = 'campus_sports_bookings_v1';

const DEMO_BOOKING_IDS = ['TT3108260100', 'FS3108260500', 'CR0109260900'];

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

  const syncFromDB = useCallback(async () => {
    const dbBookings = await fetchBookingsFromDB();
    if (dbBookings && Array.isArray(dbBookings)) {
      setBookings(dbBookings);
    }
  }, []);

  useEffect(() => {
    // Initial fetch from DB if Supabase is configured
    syncFromDB();

    // Subscribe to live Postgres changes across all browsers
    const unsubscribe = subscribeToRealtimeChanges(() => {
      syncFromDB();
    });

    // 5-second background polling fallback to guarantee multi-device synchronization
    const pollInterval = setInterval(() => {
      syncFromDB();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [syncFromDB]);

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

  const createBooking = async (params: {
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
  }): Promise<Booking> => {
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

    await saveBookingToDB(newBooking);
    setBookings(prev => [newBooking, ...prev.filter(b => b.id !== id)]);
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
          const updated = {
            ...b,
            emailDeliveryStatus: status,
            emailError: error,
            ...(email ? { userEmail: email.trim() } : {}),
            ...(sender ? { emailSender: sender } : {}),
          };
          saveBookingToDB(updated);
          return updated;
        }
        return b;
      })
    );
  };

  const cancelBooking = (
    id: string,
    reason?: string,
    cancelledBy: 'admin' | 'user' = 'user',
    emailStatus?: 'sent' | 'failed' | 'simulated',
    emailError?: string
  ): boolean => {
    let found = false;
    setBookings(prev =>
      prev.map(b => {
        if (b.id.toUpperCase() === id.trim().toUpperCase()) {
          found = true;
          const updated: Booking = {
            ...b,
            status: 'cancelled',
            cancellationReason: reason || (cancelledBy === 'admin' ? 'Cancelled by Campus Administration' : 'Cancelled by Student'),
            cancelledBy,
            cancelledAt: new Date().toISOString(),
            ...(emailStatus ? { cancellationEmailStatus: emailStatus } : {}),
            ...(emailError ? { cancellationEmailError: emailError } : {}),
          };
          saveBookingToDB(updated);
          return updated;
        }
        return b;
      })
    );
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

  const getUserBookings = (userEmail?: string, userId?: string, registrationNumber?: string): Booking[] => {
    if (!userEmail && !userId && !registrationNumber) return [];
    const cleanEmail = userEmail?.trim().toLowerCase();
    const cleanReg = registrationNumber?.trim().toUpperCase();
    return bookings
      .filter(b => {
        if (userId && b.userId && b.userId === userId) return true;
        if (cleanEmail && b.userEmail && b.userEmail.trim().toLowerCase() === cleanEmail) return true;
        if (cleanReg && b.registrationNumber && b.registrationNumber.trim().toUpperCase() === cleanReg) return true;
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
