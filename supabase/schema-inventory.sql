-- ============================================================
-- HOMS Phase 5 — Inventory Management Schema
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TYPE inventory_category AS ENUM ('bar', 'breakfast', 'housekeeping', 'general_supplies');
CREATE TYPE transaction_type AS ENUM ('stock_in', 'stock_out');

-- Inventory Items
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category inventory_category NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(10,2) NOT NULL DEFAULT 5,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  -- Links this item to a consumption item name for future auto-deduction
  linked_consumption_name TEXT,
  auto_deduct_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Inventory Transactions (stock in/out history)
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  transaction_type transaction_type NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  reason TEXT,
  reference_type TEXT, -- 'manual', 'consumption_record', 'breakfast_request'
  reference_id UUID,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Breakfast Requests (guest-facing QR booking)
CREATE TABLE breakfast_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  beverage TEXT,
  bread TEXT,
  egg TEXT,
  baked_beans BOOLEAN DEFAULT FALSE,
  sausage BOOLEAN DEFAULT FALSE,
  sugar BOOLEAN DEFAULT FALSE,
  milk BOOLEAN DEFAULT FALSE,
  special_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, prepared, delivered
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakfast_requests ENABLE ROW LEVEL SECURITY;

-- Inventory Policies (owner/manager only manage, all staff can read)
CREATE POLICY "inventory_items: read" ON inventory_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "inventory_items: write" ON inventory_items FOR ALL USING (get_my_role() IN ('owner', 'manager'));

CREATE POLICY "inventory_transactions: read" ON inventory_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "inventory_transactions: insert" ON inventory_transactions FOR INSERT WITH CHECK (get_my_role() IN ('owner', 'manager'));

-- Breakfast requests: public insert (guest-facing, no auth), staff read
CREATE POLICY "breakfast_requests: public insert" ON breakfast_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "breakfast_requests: staff read" ON breakfast_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "breakfast_requests: staff update" ON breakfast_requests FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Function to adjust stock and log transaction atomically
CREATE OR REPLACE FUNCTION adjust_inventory_stock(
  p_item_id UUID,
  p_quantity NUMERIC,
  p_transaction_type transaction_type,
  p_reason TEXT,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_performed_by UUID
) RETURNS void AS $$
BEGIN
  IF p_transaction_type = 'stock_in' THEN
    UPDATE inventory_items SET current_stock = current_stock + p_quantity WHERE id = p_item_id;
  ELSE
    UPDATE inventory_items SET current_stock = GREATEST(0, current_stock - p_quantity) WHERE id = p_item_id;
  END IF;

  INSERT INTO inventory_transactions (item_id, transaction_type, quantity, reason, reference_type, reference_id, performed_by)
  VALUES (p_item_id, p_transaction_type, p_quantity, p_reason, p_reference_type, p_reference_id, p_performed_by);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed sample inventory items
INSERT INTO inventory_items (name, category, unit, current_stock, low_stock_threshold, linked_consumption_name) VALUES
('Milo', 'breakfast', 'tins', 10, 3, 'Milo'),
('Nescafé', 'breakfast', 'jars', 8, 2, 'Nescafé'),
('Tea bags', 'breakfast', 'boxes', 15, 3, 'Tea bag'),
('Oats', 'breakfast', 'kg', 10, 2, 'Oats'),
('Hausa Kooko', 'breakfast', 'litres', 5, 2, 'Hausa kooko'),
('Plain Bread', 'breakfast', 'loaves', 20, 5, 'Plain bread'),
('Eggs', 'breakfast', 'crates', 5, 1, 'Egg'),
('Baked Beans (tins)', 'breakfast', 'tins', 12, 3, 'Baked Beans'),
('Sausages', 'breakfast', 'packs', 10, 2, 'Sausage'),
('Sugar', 'breakfast', 'kg', 15, 3, 'Sugar'),
('Milk (Tin)', 'breakfast', 'tins', 20, 5, 'Milk'),
('Coke', 'bar', 'crates', 5, 1, 'Coke'),
('Fanta', 'bar', 'crates', 5, 1, 'Fanta'),
('Sprite', 'bar', 'crates', 5, 1, 'Sprite'),
('Water Bottles', 'bar', 'crates', 10, 2, 'Water'),
('Beer', 'bar', 'crates', 8, 2, NULL),
('Wine', 'bar', 'bottles', 12, 3, NULL),
('Toilet Paper', 'housekeeping', 'rolls', 50, 10, NULL),
('Bedsheets', 'housekeeping', 'sets', 20, 5, NULL),
('Towels', 'housekeeping', 'pcs', 30, 8, NULL),
('Detergent', 'housekeeping', 'litres', 10, 2, NULL),
('Air Freshener', 'housekeeping', 'cans', 8, 2, NULL),
('Printer Paper', 'general_supplies', 'reams', 5, 1, NULL),
('Cleaning Gloves', 'general_supplies', 'boxes', 6, 1, NULL);
