-- ============================================================
-- HOMS Phase 2 Schema — Kayla City ApartHotel
-- Run this in Supabase SQL Editor AFTER Phase 1 schema
-- ============================================================

CREATE TYPE room_status AS ENUM ('available', 'occupied', 'cleaning', 'maintenance');
CREATE TYPE room_category AS ENUM ('single', 'double', 'suite', 'apartment', 'penthouse');
CREATE TYPE reservation_status AS ENUM ('checked_in', 'checked_out', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE report_type AS ENUM ('receptionist', 'housekeeping', 'security', 'manager');
CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE maintenance_status AS ENUM ('open', 'in_progress', 'fixed');
CREATE TYPE consumption_type AS ENUM ('breakfast', 'drink', 'other');
CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'night');

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL UNIQUE,
  category room_category NOT NULL DEFAULT 'single',
  floor INTEGER,
  rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  status room_status NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  id_type TEXT,
  id_number TEXT,
  nationality TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER guests_updated_at BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  status reservation_status NOT NULL DEFAULT 'checked_in',
  num_guests INTEGER NOT NULL DEFAULT 1,
  rate_at_checkin NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  special_requests TEXT,
  signature_data TEXT,
  checked_in_by UUID REFERENCES profiles(id),
  checked_out_by UUID REFERENCES profiles(id),
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id),
  assigned_by UUID REFERENCES profiles(id),
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  report_type report_type NOT NULL,
  shift shift_type NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  guests_checked_in INTEGER DEFAULT 0,
  guests_checked_out INTEGER DEFAULT 0,
  complaints TEXT,
  rooms_cleaned INTEGER DEFAULT 0,
  rooms_maintenance INTEGER DEFAULT 0,
  damaged_items TEXT,
  visitor_summary TEXT,
  incidents TEXT,
  observations TEXT,
  daily_summary TEXT,
  staff_performance TEXT,
  operational_issues TEXT,
  recommendations TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  reported_by UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  issue_description TEXT NOT NULL,
  priority maintenance_priority NOT NULL DEFAULT 'medium',
  status maintenance_status NOT NULL DEFAULT 'open',
  notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER maintenance_updated_at BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE consumption_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id),
  reservation_id UUID REFERENCES reservations(id),
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  item_type consumption_type NOT NULL DEFAULT 'breakfast',
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) DEFAULT 0,
  shift shift_type NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms: read" ON rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rooms: write" ON rooms FOR ALL USING (get_my_role() IN ('owner', 'manager'));
CREATE POLICY "guests: read" ON guests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "guests: insert" ON guests FOR INSERT WITH CHECK (get_my_role() IN ('owner', 'manager', 'receptionist'));
CREATE POLICY "guests: update" ON guests FOR UPDATE USING (get_my_role() IN ('owner', 'manager', 'receptionist'));
CREATE POLICY "reservations: read" ON reservations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reservations: insert" ON reservations FOR INSERT WITH CHECK (get_my_role() IN ('owner', 'manager', 'receptionist'));
CREATE POLICY "reservations: update" ON reservations FOR UPDATE USING (get_my_role() IN ('owner', 'manager', 'receptionist'));
CREATE POLICY "tasks: read" ON tasks FOR SELECT USING (auth.uid() = assigned_to OR auth.uid() = assigned_by OR get_my_role() IN ('owner', 'manager'));
CREATE POLICY "tasks: insert" ON tasks FOR INSERT WITH CHECK (get_my_role() IN ('owner', 'manager'));
CREATE POLICY "tasks: update" ON tasks FOR UPDATE USING (auth.uid() = assigned_to OR get_my_role() IN ('owner', 'manager'));
CREATE POLICY "reports: read" ON reports FOR SELECT USING (auth.uid() = submitted_by OR get_my_role() IN ('owner', 'manager'));
CREATE POLICY "reports: insert" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "maintenance: read" ON maintenance_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "maintenance: insert" ON maintenance_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "maintenance: update" ON maintenance_requests FOR UPDATE USING (get_my_role() IN ('owner', 'manager'));
CREATE POLICY "consumption: read" ON consumption_records FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "consumption: insert" ON consumption_records FOR INSERT WITH CHECK (get_my_role() IN ('owner', 'manager', 'receptionist'));
CREATE POLICY "activity: read" ON activity_log FOR SELECT USING (get_my_role() IN ('owner', 'manager'));
CREATE POLICY "activity: insert" ON activity_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications: read" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications: insert" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications: update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

INSERT INTO rooms (room_number, category, floor, rate, status) VALUES
('101', 'single', 1, 150.00, 'available'),
('102', 'single', 1, 150.00, 'available'),
('103', 'double', 1, 250.00, 'available'),
('104', 'double', 1, 250.00, 'available'),
('201', 'suite', 2, 400.00, 'available'),
('202', 'suite', 2, 400.00, 'available'),
('301', 'apartment', 3, 600.00, 'available'),
('302', 'penthouse', 3, 1000.00, 'available');
