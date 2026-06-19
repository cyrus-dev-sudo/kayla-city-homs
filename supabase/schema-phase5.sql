-- HOMS Phase 5 — Inventory + Breakfast Requests

CREATE TYPE inventory_category AS ENUM ('bar', 'breakfast', 'housekeeping', 'general');
CREATE TYPE transaction_type AS ENUM ('stock_in', 'stock_out', 'adjustment');
CREATE TYPE stock_status AS ENUM ('ok', 'low', 'critical', 'out');
CREATE TYPE breakfast_status AS ENUM ('pending', 'confirmed', 'served', 'cancelled');

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category inventory_category NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock NUMERIC(10,2) NOT NULL DEFAULT 5,
  stock_status stock_status NOT NULL DEFAULT 'ok',
  auto_deduct BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  stock_before NUMERIC(10,2) NOT NULL,
  stock_after NUMERIC(10,2) NOT NULL,
  reason TEXT,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE breakfast_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  beverage TEXT,
  bread TEXT,
  egg TEXT,
  baked_beans BOOLEAN DEFAULT FALSE,
  sausage BOOLEAN DEFAULT FALSE,
  sugar BOOLEAN DEFAULT FALSE,
  milk BOOLEAN DEFAULT FALSE,
  special_notes TEXT,
  status breakfast_status NOT NULL DEFAULT 'pending',
  confirmed_by UUID REFERENCES profiles(id),
  served_by UUID REFERENCES profiles(id),
  num_guests INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER breakfast_updated_at BEFORE UPDATE ON breakfast_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stock <= 0 THEN NEW.stock_status = 'out';
  ELSIF NEW.current_stock <= NEW.min_stock * 0.5 THEN NEW.stock_status = 'critical';
  ELSIF NEW.current_stock <= NEW.min_stock THEN NEW.stock_status = 'low';
  ELSE NEW.stock_status = 'ok';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_stock_status BEFORE UPDATE OF current_stock ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_stock_status();

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakfast_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory: read" ON inventory_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "inventory: write" ON inventory_items FOR ALL USING (get_my_role() IN ('owner', 'manager'));
CREATE POLICY "transactions: read" ON inventory_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "transactions: insert" ON inventory_transactions FOR INSERT WITH CHECK (get_my_role() IN ('owner', 'manager'));
CREATE POLICY "breakfast: public insert" ON breakfast_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "breakfast: staff read" ON breakfast_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "breakfast: staff update" ON breakfast_requests FOR UPDATE USING (auth.uid() IS NOT NULL);

INSERT INTO inventory_items (name, category, unit, current_stock, min_stock, auto_deduct) VALUES
('Milo', 'breakfast', 'sachets', 50, 10, true),
('Nescafé', 'breakfast', 'sachets', 50, 10, true),
('Tea Bag', 'breakfast', 'bags', 100, 20, true),
('Oats', 'breakfast', 'portions', 30, 10, true),
('Hausa Kooko', 'breakfast', 'portions', 20, 5, true),
('Plain Bread', 'breakfast', 'slices', 40, 10, true),
('Toasted Bread', 'breakfast', 'slices', 40, 10, true),
('Butter', 'breakfast', 'portions', 30, 10, true),
('Eggs', 'breakfast', 'pcs', 60, 15, true),
('Baked Beans', 'breakfast', 'tins', 20, 5, true),
('Sausage', 'breakfast', 'pcs', 40, 10, true),
('Sugar', 'breakfast', 'sachets', 100, 20, true),
('Milk', 'breakfast', 'sachets', 80, 20, true);
