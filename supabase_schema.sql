-- ====================================================================
-- CAMPUS SPORTS BOOKING - SUPABASE DATABASE SCHEMA
-- Run this script in the Supabase SQL Editor (supabase.com -> SQL Editor)
-- ====================================================================

-- 1. USERS TABLE (Student Accounts)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  registration_number VARCHAR(8) NOT NULL UNIQUE CHECK (registration_number ~ '^[0-9]{8}$'),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BOOKINGS TABLE (Slot Reservations)
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('indoor', 'turf')),
  date_string TEXT NOT NULL,
  date_key VARCHAR(10) NOT NULL,
  time_slot TEXT NOT NULL,
  venue TEXT NOT NULL,
  user_name TEXT NOT NULL,
  registration_number VARCHAR(8) NOT NULL CHECK (registration_number ~ '^[0-9]{8}$'),
  user_email TEXT NOT NULL,
  user_id TEXT,
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  cancellation_reason TEXT,
  cancelled_by TEXT CHECK (cancelled_by IN ('admin', 'user')),
  cancelled_at TIMESTAMPTZ,
  email_delivery_status TEXT DEFAULT 'sent',
  email_preview_url TEXT,
  email_error TEXT,
  email_sender TEXT,
  cancellation_email_status TEXT,
  cancellation_email_error TEXT
);

-- 3. SLOT RESTRICTIONS TABLE (Admin Slot & Date Blocks)
CREATE TABLE IF NOT EXISTS public.slot_restrictions (
  id TEXT PRIMARY KEY,
  facility_category TEXT NOT NULL,
  facility_name TEXT NOT NULL,
  activity_id TEXT,
  activity_name TEXT,
  type TEXT NOT NULL DEFAULT 'slot',
  date_key VARCHAR(10) NOT NULL,
  date_string TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ANNOUNCEMENTS TABLE (Campus Notices)
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'High' CHECK (priority IN ('High', 'Medium', 'Low')),
  publish_date TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PENDING VERIFICATIONS TABLE (6-digit OTPs for Sign-up)
CREATE TABLE IF NOT EXISTS public.pending_verifications (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  registration_number VARCHAR(8) NOT NULL,
  password_hash TEXT NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at BIGINT NOT NULL,
  sent_at BIGINT NOT NULL
);

-- Indices for rapid lookups
CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON public.bookings(date_key, time_slot, status);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_bookings_reg ON public.bookings(registration_number);
CREATE INDEX IF NOT EXISTS idx_restrictions_date ON public.slot_restrictions(date_key);

-- Enable Row Level Security (RLS) with open read/write access via Supabase Anon Key
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_verifications ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for client anon key
DROP POLICY IF EXISTS "Public access users" ON public.users;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access bookings" ON public.bookings;
CREATE POLICY "Public access bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access restrictions" ON public.slot_restrictions;
CREATE POLICY "Public access restrictions" ON public.slot_restrictions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access announcements" ON public.announcements;
CREATE POLICY "Public access announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access pending_verifications" ON public.pending_verifications;
CREATE POLICY "Public access pending_verifications" ON public.pending_verifications FOR ALL USING (true) WITH CHECK (true);
