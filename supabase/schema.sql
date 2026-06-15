-- ============================================================
-- HOMS Phase 1 Schema — Kayla City ApartHotel
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'receptionist', 'housekeeping', 'security');
CREATE TYPE account_status AS ENUM ('active', 'inactive');

-- ─────────────────────────────────────────
-- PROFILES TABLE
-- ─────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  status account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- USER ROLES TABLE
-- ─────────────────────────────────────────
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────
-- HELPER: GET CURRENT USER ROLE
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────
-- ENABLE RLS
-- ─────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- RLS POLICIES — PROFILES
-- ─────────────────────────────────────────

-- Everyone can read their own profile
CREATE POLICY "profiles: read own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Owner and manager can read all profiles
CREATE POLICY "profiles: owner/manager read all"
  ON profiles FOR SELECT
  USING (get_my_role() IN ('owner', 'manager'));

-- Only owner can insert profiles (staff creation)
CREATE POLICY "profiles: owner insert"
  ON profiles FOR INSERT
  WITH CHECK (get_my_role() = 'owner');

-- Owner can update any profile; users can update their own (non-status fields handled app-side)
CREATE POLICY "profiles: owner update all"
  ON profiles FOR UPDATE
  USING (get_my_role() = 'owner');

CREATE POLICY "profiles: self update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─────────────────────────────────────────
-- RLS POLICIES — USER_ROLES
-- ─────────────────────────────────────────

-- Everyone can read their own role
CREATE POLICY "user_roles: read own"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can read all roles
CREATE POLICY "user_roles: owner read all"
  ON user_roles FOR SELECT
  USING (get_my_role() = 'owner');

-- Only owner can assign roles
CREATE POLICY "user_roles: owner insert"
  ON user_roles FOR INSERT
  WITH CHECK (get_my_role() = 'owner');

-- Only owner can update roles
CREATE POLICY "user_roles: owner update"
  ON user_roles FOR UPDATE
  USING (get_my_role() = 'owner');

-- ─────────────────────────────────────────
-- SEED: OWNER ACCOUNT
-- Run AFTER creating the auth user via Supabase dashboard
-- Replace the UUID below with the actual owner user ID
-- ─────────────────────────────────────────

-- Step 1: Go to Supabase → Authentication → Users → Add User
-- Email: owner@kaylacity.com | Password: KaylaOwner2025!
-- Step 2: Copy the UUID and replace 'OWNER_UUID_HERE' below
-- Step 3: Run just this INSERT

-- INSERT INTO user_roles (user_id, role)
-- VALUES ('OWNER_UUID_HERE', 'owner');

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================
