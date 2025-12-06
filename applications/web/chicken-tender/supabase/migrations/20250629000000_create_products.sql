/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `product_type` (text) - 'hardware_unit' | 'automation_device'
      - `product_name` (text) - e.g., 'Chicken Tender', 'Roaming Roost'
      - `model` (text)
      - `serial_number` (text, unique)
      - `activation_code` (text, unique, nullable)
      - `qr_code` (text, unique, nullable)
      - `status` (text) - 'registered' | 'connected' | 'disconnected' | 'setup_required'
      - `connection_status` (text) - 'offline' | 'connecting' | 'online' | 'error'
      - `device_id` (uuid, references devices, nullable) - links to automation device if applicable
      - `network_config` (jsonb) - WiFi settings, connection details
      - `location` (text)
      - `metadata` (jsonb) - purchase date, warranty info, etc.
      - `last_seen` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('hardware_unit', 'automation_device')),
  product_name TEXT NOT NULL,
  model TEXT,
  serial_number TEXT UNIQUE NOT NULL,
  activation_code TEXT UNIQUE,
  qr_code TEXT UNIQUE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'connected', 'disconnected', 'setup_required')),
  connection_status TEXT DEFAULT 'offline' CHECK (connection_status IN ('offline', 'connecting', 'online', 'error')),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  network_config JSONB DEFAULT '{}'::jsonb,
  location TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_connection_status ON products(connection_status);
CREATE INDEX IF NOT EXISTS idx_products_device_id ON products(device_id);
CREATE INDEX IF NOT EXISTS idx_products_serial_number ON products(serial_number);
CREATE INDEX IF NOT EXISTS idx_products_activation_code ON products(activation_code) WHERE activation_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_qr_code ON products(qr_code) WHERE qr_code IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
CREATE POLICY "Users can view their own products"
  ON products
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON products
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON products
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

