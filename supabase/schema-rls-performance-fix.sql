-- ============================================================
-- RLS Performance Fix — Optimize auth function calls
-- Wraps auth.uid() and get_my_role() in (select ...) to avoid
-- per-row re-evaluation. Run this entire file in one go.
-- ============================================================

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: read own" ON profiles;
DROP POLICY IF EXISTS "profiles: owner/manager read all" ON profiles;
DROP POLICY IF EXISTS "profiles: owner insert" ON profiles;
DROP POLICY IF EXISTS "profiles: owner update all" ON profiles;
DROP POLICY IF EXISTS "profiles: self update" ON profiles;

CREATE POLICY "profiles: read own" ON profiles FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "profiles: owner/manager read all" ON profiles FOR SELECT USING ((select get_my_role()) IN ('owner', 'manager'));
CREATE POLICY "profiles: owner insert" ON profiles FOR INSERT WITH CHECK ((select get_my_role()) = 'owner');
CREATE POLICY "profiles: owner update all" ON profiles FOR UPDATE USING ((select get_my_role()) = 'owner');
CREATE POLICY "profiles: self update" ON profiles FOR UPDATE USING ((select auth.uid()) = id);

-- ─────────────────────────────────────────
-- USER_ROLES
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "user_roles: read own" ON user_roles;
DROP POLICY IF EXISTS "user_roles: owner read all" ON user_roles;
DROP POLICY IF EXISTS "user_roles: owner insert" ON user_roles;
DROP POLICY IF EXISTS "user_roles: owner update" ON user_roles;

CREATE POLICY "user_roles: read own" ON user_roles FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "user_roles: owner read all" ON user_roles FOR SELECT USING ((select get_my_role()) = 'owner');
CREATE POLICY "user_roles: owner insert" ON user_roles FOR INSERT WITH CHECK ((select get_my_role()) = 'owner');
CREATE POLICY "user_roles: owner update" ON user_roles FOR UPDATE USING ((select get_my_role()) = 'owner');

-- ─────────────────────────────────────────
-- ROOMS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "rooms: read" ON rooms;
DROP POLICY IF EXISTS "rooms: write" ON rooms;

CREATE POLICY "rooms: read" ON rooms FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "rooms: write" ON rooms FOR ALL USING ((select get_my_role()) IN ('owner', 'manager'));

-- ─────────────────────────────────────────
-- GUESTS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "guests: read" ON guests;
DROP POLICY IF EXISTS "guests: insert" ON guests;
DROP POLICY IF EXISTS "guests: update" ON guests;

CREATE POLICY "guests: read" ON guests FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "guests: insert" ON guests FOR INSERT WITH CHECK ((select get_my_role()) IN ('owner', 'manager', 'receptionist'));
CREATE POLICY "guests: update" ON guests FOR UPDATE USING ((select get_my_role()) IN ('owner', 'manager', 'receptionist'));

-- ─────────────────────────────────────────
-- RESERVATIONS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "reservations: read" ON reservations;
DROP POLICY IF EXISTS "reservations: insert" ON reservations;
DROP POLICY IF EXISTS "reservations: update" ON reservations;

CREATE POLICY "reservations: read" ON reservations FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "reservations: insert" ON reservations FOR INSERT WITH CHECK ((select get_my_role()) IN ('owner', 'manager', 'receptionist'));
CREATE POLICY "reservations: update" ON reservations FOR UPDATE USING ((select get_my_role()) IN ('owner', 'manager', 'receptionist'));

-- ─────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "tasks: read" ON tasks;
DROP POLICY IF EXISTS "tasks: insert" ON tasks;
DROP POLICY IF EXISTS "tasks: update" ON tasks;

CREATE POLICY "tasks: read" ON tasks FOR SELECT USING (
  (select auth.uid()) = assigned_to OR (select auth.uid()) = assigned_by OR (select get_my_role()) IN ('owner', 'manager')
);
CREATE POLICY "tasks: insert" ON tasks FOR INSERT WITH CHECK ((select get_my_role()) IN ('owner', 'manager'));
CREATE POLICY "tasks: update" ON tasks FOR UPDATE USING (
  (select auth.uid()) = assigned_to OR (select get_my_role()) IN ('owner', 'manager')
);

-- ─────────────────────────────────────────
-- REPORTS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "reports: read" ON reports;
DROP POLICY IF EXISTS "reports: insert" ON reports;

CREATE POLICY "reports: read" ON reports FOR SELECT USING (
  (select auth.uid()) = submitted_by OR (select get_my_role()) IN ('owner', 'manager')
);
CREATE POLICY "reports: insert" ON reports FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ─────────────────────────────────────────
-- MAINTENANCE_REQUESTS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "maintenance: read" ON maintenance_requests;
DROP POLICY IF EXISTS "maintenance: insert" ON maintenance_requests;
DROP POLICY IF EXISTS "maintenance: update" ON maintenance_requests;

CREATE POLICY "maintenance: read" ON maintenance_requests FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "maintenance: insert" ON maintenance_requests FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "maintenance: update" ON maintenance_requests FOR UPDATE USING ((select get_my_role()) IN ('owner', 'manager'));

-- ─────────────────────────────────────────
-- CONSUMPTION_RECORDS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "consumption: read" ON consumption_records;
DROP POLICY IF EXISTS "consumption: insert" ON consumption_records;

CREATE POLICY "consumption: read" ON consumption_records FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "consumption: insert" ON consumption_records FOR INSERT WITH CHECK ((select get_my_role()) IN ('owner', 'manager', 'receptionist'));

-- ─────────────────────────────────────────
-- ACTIVITY_LOG
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "activity: read" ON activity_log;
DROP POLICY IF EXISTS "activity: insert" ON activity_log;

CREATE POLICY "activity: read" ON activity_log FOR SELECT USING ((select get_my_role()) IN ('owner', 'manager'));
CREATE POLICY "activity: insert" ON activity_log FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "notifications: read" ON notifications;
DROP POLICY IF EXISTS "notifications: insert" ON notifications;
DROP POLICY IF EXISTS "notifications: update" ON notifications;

CREATE POLICY "notifications: read" ON notifications FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "notifications: insert" ON notifications FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "notifications: update" ON notifications FOR UPDATE USING ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────
-- VISITOR_LOG
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "visitor_log: read" ON visitor_log;
DROP POLICY IF EXISTS "visitor_log: insert" ON visitor_log;
DROP POLICY IF EXISTS "visitor_log: update" ON visitor_log;

CREATE POLICY "visitor_log: read" ON visitor_log FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "visitor_log: insert" ON visitor_log FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "visitor_log: update" ON visitor_log FOR UPDATE USING (
  (select auth.uid()) = recorded_by OR (select get_my_role()) IN ('owner', 'manager')
);

-- ─────────────────────────────────────────
-- VEHICLE_LOG
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "vehicle_log: read" ON vehicle_log;
DROP POLICY IF EXISTS "vehicle_log: insert" ON vehicle_log;
DROP POLICY IF EXISTS "vehicle_log: update" ON vehicle_log;

CREATE POLICY "vehicle_log: read" ON vehicle_log FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "vehicle_log: insert" ON vehicle_log FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "vehicle_log: update" ON vehicle_log FOR UPDATE USING (
  (select auth.uid()) = recorded_by OR (select get_my_role()) IN ('owner', 'manager')
);

-- ─────────────────────────────────────────
-- PATROL_ROUNDS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "patrol: read" ON patrol_rounds;
DROP POLICY IF EXISTS "patrol: insert" ON patrol_rounds;

CREATE POLICY "patrol: read" ON patrol_rounds FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "patrol: insert" ON patrol_rounds FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ─────────────────────────────────────────
-- INCIDENT_REPORTS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "incidents: read" ON incident_reports;
DROP POLICY IF EXISTS "incidents: insert" ON incident_reports;
DROP POLICY IF EXISTS "incidents: update" ON incident_reports;

CREATE POLICY "incidents: read" ON incident_reports FOR SELECT USING (
  (select auth.uid()) = reported_by OR (select get_my_role()) IN ('owner', 'manager')
);
CREATE POLICY "incidents: insert" ON incident_reports FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "incidents: update" ON incident_reports FOR UPDATE USING ((select get_my_role()) IN ('owner', 'manager'));

-- ─────────────────────────────────────────
-- INVENTORY_ITEMS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "inventory_items: read" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items: write" ON inventory_items;

CREATE POLICY "inventory_items: read" ON inventory_items FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "inventory_items: write" ON inventory_items FOR ALL USING ((select get_my_role()) IN ('owner', 'manager'));

-- ─────────────────────────────────────────
-- INVENTORY_TRANSACTIONS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "inventory_transactions: read" ON inventory_transactions;
DROP POLICY IF EXISTS "inventory_transactions: insert" ON inventory_transactions;

CREATE POLICY "inventory_transactions: read" ON inventory_transactions FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "inventory_transactions: insert" ON inventory_transactions FOR INSERT WITH CHECK ((select get_my_role()) IN ('owner', 'manager'));

-- ─────────────────────────────────────────
-- BREAKFAST_REQUESTS (public insert stays as-is — no auth function used)
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "breakfast_requests: staff read" ON breakfast_requests;
DROP POLICY IF EXISTS "breakfast_requests: staff update" ON breakfast_requests;

CREATE POLICY "breakfast_requests: staff read" ON breakfast_requests FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "breakfast_requests: staff update" ON breakfast_requests FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- DONE — All policies now use (select auth.<fn>()) pattern
-- ============================================================
