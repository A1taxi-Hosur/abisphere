/*
  # Create Purchase and Sales Management Tables

  1. New Tables
    - `purchases`
      - `id` (uuid, primary key)
      - `product_name` (text)
      - `category` (text)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `quantity` (numeric)
      - `unit` (text)
      - `purchase_price_per_unit` (numeric)
      - `total_purchase_cost` (numeric)
      - `purchase_date` (date)
      - `invoice_number` (text, optional)
      - `notes` (text, optional)
      - `created_by` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sales`
      - `id` (uuid, primary key)
      - `product_name` (text)
      - `category` (text)
      - `quantity` (numeric)
      - `unit` (text)
      - `sale_price_per_unit` (numeric)
      - `total_sale_amount` (numeric)
      - `sale_date` (date)
      - `customer_name` (text, optional)
      - `customer_phone` (text, optional)
      - `payment_method` (text)
      - `notes` (text, optional)
      - `created_by` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage purchase and sales data

  3. Indexes
    - Performance indexes on commonly queried fields
    - Foreign key indexes for joins
*/

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('vegetables', 'meat', 'dairy', 'spices', 'grains', 'other')),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity numeric(10,2) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  purchase_price_per_unit numeric(10,2) NOT NULL CHECK (purchase_price_per_unit >= 0),
  total_purchase_cost numeric(10,2) NOT NULL CHECK (total_purchase_cost >= 0),
  purchase_date date DEFAULT CURRENT_DATE,
  invoice_number text,
  notes text DEFAULT '',
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('vegetables', 'meat', 'dairy', 'spices', 'grains', 'other', 'prepared_food', 'beverages')),
  quantity numeric(10,2) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  sale_price_per_unit numeric(10,2) NOT NULL CHECK (sale_price_per_unit >= 0),
  total_sale_amount numeric(10,2) NOT NULL CHECK (total_sale_amount >= 0),
  sale_date date DEFAULT CURRENT_DATE,
  customer_name text,
  customer_phone text,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'online', 'upi')),
  notes text DEFAULT '',
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_product_name ON purchases(product_name);
CREATE INDEX IF NOT EXISTS idx_purchases_category ON purchases(category);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_created_by ON purchases(created_by);

CREATE INDEX IF NOT EXISTS idx_sales_product_name ON sales(product_name);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer_phone ON sales(customer_phone);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for purchases table
CREATE POLICY "Allow all operations for authenticated users on purchases"
  ON purchases
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for sales table
CREATE POLICY "Allow all operations for authenticated users on sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample purchase data
INSERT INTO purchases (product_name, category, supplier_id, quantity, unit, purchase_price_per_unit, total_purchase_cost, purchase_date, invoice_number, notes, created_by) VALUES
  ('Basmati Rice Premium', 'grains', (SELECT id FROM suppliers WHERE name = 'Tamil Nadu Rice Mills' LIMIT 1), 50, 'kg', 85.00, 4250.00, CURRENT_DATE - INTERVAL '2 days', 'INV-2025-001', 'Premium quality basmati rice', 'Admin User'),
  ('Fresh Chicken Breast', 'meat', (SELECT id FROM suppliers WHERE name = 'Fresh Meat Co.' LIMIT 1), 25, 'kg', 280.00, 7000.00, CURRENT_DATE - INTERVAL '1 day', 'INV-2025-002', 'Fresh chicken for biryani', 'Admin User'),
  ('Organic Tomatoes', 'vegetables', (SELECT id FROM suppliers WHERE name = 'Hosur Vegetable Market' LIMIT 1), 30, 'kg', 45.00, 1350.00, CURRENT_DATE, 'INV-2025-003', 'Organic tomatoes for curry', 'Admin User');

-- Insert sample sales data
INSERT INTO sales (product_name, category, quantity, unit, sale_price_per_unit, total_sale_amount, sale_date, customer_name, customer_phone, payment_method, notes, created_by) VALUES
  ('Chicken Biryani', 'prepared_food', 15, 'plates', 280.00, 4200.00, CURRENT_DATE, 'Rajesh Kumar', '+91 9876543214', 'cash', 'Lunch order delivery', 'Admin User'),
  ('Vegetable Curry', 'prepared_food', 8, 'plates', 180.00, 1440.00, CURRENT_DATE, 'Meera Patel', '+91 9876543215', 'online', 'Vegetarian meal', 'Admin User'),
  ('Masala Dosa', 'prepared_food', 12, 'pieces', 120.00, 1440.00, CURRENT_DATE - INTERVAL '1 day', 'Arun Vijay', '+91 9876543216', 'upi', 'Evening snack order', 'Admin User');