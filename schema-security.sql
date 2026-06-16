-- ============================================================
-- HOMS Security Module Schema
-- Run in Supabase SQL Editor after Phase 2 schema
-- ============================================================

-- Visitor Log
CREATE TABLE visitor_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  visiting_guest TEXT NOT NULL,
  room_number TEXT,
  purpose TEXT,
  time_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_out TIMESTAMPTZ,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicle Log
CREATE TABLE vehicle_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  color TEXT NOT NULL,
  time_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_out TIMESTAMPTZ,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patrol Rounds
CREATE TABLE patrol_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES profiles(id),
  shift shift_type NOT NULL,
  areas_covered TEXT NOT NULL,
  observations TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incident Reports
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL REFERENCES profiles(id),
  incident_type TEXT NOT NULL,
  location TEXT,
  description TEXT NOT NULL,
  persons_involved TEXT,
  action_taken TEXT,
  severity TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'open',
  manager_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER incident_updated_at BEFORE UPDATE ON incident_reports FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE visitor_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "visitor_log: read" ON visitor_log FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "visitor_log: insert" ON visitor_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "visitor_log: update" ON visitor_log FOR UPDATE USING (auth.uid() = recorded_by OR get_my_role() IN ('owner', 'manager'));

CREATE POLICY "vehicle_log: read" ON vehicle_log FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "vehicle_log: insert" ON vehicle_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "vehicle_log: update" ON vehicle_log FOR UPDATE USING (auth.uid() = recorded_by OR get_my_role() IN ('owner', 'manager'));

CREATE POLICY "patrol: read" ON patrol_rounds FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "patrol: insert" ON patrol_rounds FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "incidents: read" ON incident_reports FOR SELECT USING (auth.uid() = reported_by OR get_my_role() IN ('owner', 'manager'));
CREATE POLICY "incidents: insert" ON incident_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "incidents: update" ON incident_reports FOR UPDATE USING (get_my_role() IN ('owner', 'manager'));
