-- =========================================================================
-- CAMPUS SPORTS SLOT BOOKING SYSTEM - NEON POSTGRESQL SCHEMA
-- Execute this SQL script in your Neon Console SQL Editor (https://console.neon.tech)
-- =========================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_reg_no ON users(UPPER(registration_number));

-- 2. PENDING VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS pending_verifications (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  sent_at BIGINT NOT NULL
);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
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

CREATE INDEX IF NOT EXISTS idx_bookings_date_key ON bookings(date_key);
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON bookings(LOWER(user_email));
CREATE INDEX IF NOT EXISTS idx_bookings_reg_no ON bookings(UPPER(registration_number));
CREATE INDEX IF NOT EXISTS idx_bookings_activity_date_slot ON bookings(activity_id, date_key, time_slot, venue, status);

-- 4. RESTRICTED SLOTS TABLE
CREATE TABLE IF NOT EXISTS restricted_slots (
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

CREATE INDEX IF NOT EXISTS idx_restricted_slots_date_key ON restricted_slots(date_key);

-- 5. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  publish_date TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT DEFAULT 'Sports Department',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
