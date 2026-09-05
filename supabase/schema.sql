-- =========================================================================
-- CAMPUS SPORTS SLOT BOOKING SYSTEM - SUPABASE DATABASE SCHEMA (IDEMPOTENT)
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com)
-- Safe to re-run multiple times!
-- =========================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups by email and 8-digit registration number
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_reg_no ON public.users(UPPER(registration_number));

-- 2. PENDING VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.pending_verifications (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  sent_at BIGINT NOT NULL
);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('indoor', 'turf')),
  date_string TEXT NOT NULL,
  date_key TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  venue TEXT NOT NULL,
  user_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  cancellation_reason TEXT,
  cancelled_by TEXT CHECK (cancelled_by IN ('admin', 'user')),
  cancelled_at TIMESTAMPTZ
);

-- Indexes for fast query filtering & preventing double bookings
CREATE INDEX IF NOT EXISTS idx_bookings_date_key ON public.bookings(date_key);
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON public.bookings(LOWER(user_email));
CREATE INDEX IF NOT EXISTS idx_bookings_reg_no ON public.bookings(UPPER(registration_number));
CREATE INDEX IF NOT EXISTS idx_bookings_activity_date_slot ON public.bookings(activity_id, date_key, time_slot, venue, status);

-- 4. RESTRICTED SLOTS TABLE
CREATE TABLE IF NOT EXISTS public.restricted_slots (
  id TEXT PRIMARY KEY,
  facility_category TEXT DEFAULT 'indoor',
  facility_name TEXT DEFAULT '',
  activity_id TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  type TEXT DEFAULT 'slot',
  venue TEXT NOT NULL,
  date_key TEXT NOT NULL,
  date_string TEXT DEFAULT '',
  time_slot TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  restricted_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restricted_slots_date_key ON public.restricted_slots(date_key);

-- 5. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  publish_date TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT DEFAULT 'Sports Department',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES (SAFE DROP & CREATE)
-- =========================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restricted_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop policies if re-running
DROP POLICY IF EXISTS "Allow public read/write on users" ON public.users;
DROP POLICY IF EXISTS "Allow public read/write on pending_verifications" ON public.pending_verifications;
DROP POLICY IF EXISTS "Allow public read/write on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public read/write on restricted_slots" ON public.restricted_slots;
DROP POLICY IF EXISTS "Allow public read/write on announcements" ON public.announcements;

-- Create public access policies
CREATE POLICY "Allow public read/write on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on pending_verifications" ON public.pending_verifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on restricted_slots" ON public.restricted_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- SUPABASE REALTIME PUBLICATION (SAFE ADD)
-- =========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel 
    WHERE prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
      AND prrelid = 'public.bookings'::regclass
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel 
    WHERE prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
      AND prrelid = 'public.restricted_slots'::regclass
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restricted_slots;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel 
    WHERE prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
      AND prrelid = 'public.announcements'::regclass
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
  END IF;
END $$;
