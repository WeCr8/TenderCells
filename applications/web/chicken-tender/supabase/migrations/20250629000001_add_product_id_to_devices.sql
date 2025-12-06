/*
  # Add product_id to devices table

  Links automation devices to their parent hardware products
*/

-- Add product_id column to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_devices_product_id ON devices(product_id);

