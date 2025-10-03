/*
  # Create production records tables

  1. New Tables
    - `production_records`
      - `id` (uuid, primary key)
      - `chicken_id` (uuid, references chickens)
      - `date` (date)
      - `type` (text)
      - `quantity` (integer)
      - `quality` (text)
      - `size` (text)
      - `weight` (numeric)
      - `notes` (text)
      - `collected_by` (text)
      - `location` (text)
      - `time_of_day` (text)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
    - `production_goals`
      - `id` (uuid, primary key)
      - `chicken_id` (uuid, references chickens)
      - `group_id` (uuid, references flock_groups)
      - `type` (text)
      - `target_quantity` (integer)
      - `target_quality` (text)
      - `period` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `current_progress` (integer)
      - `status` (text)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create production records table
CREATE TABLE IF NOT EXISTS production_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chicken_id UUID REFERENCES chickens(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  quality TEXT,
  size TEXT,
  weight NUMERIC,
  notes TEXT,
  collected_by TEXT,
  location TEXT,
  time_of_day TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create production goals table
CREATE TABLE IF NOT EXISTS production_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chicken_id UUID REFERENCES chickens(id) ON DELETE CASCADE,
  group_id UUID REFERENCES flock_groups(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  target_quantity INTEGER NOT NULL,
  target_quality TEXT,
  period TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  current_progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress',
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for production records
CREATE POLICY "Users can view their own production records"
  ON production_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own production records"
  ON production_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own production records"
  ON production_records
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own production records"
  ON production_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for production goals
CREATE POLICY "Users can view their own production goals"
  ON production_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own production goals"
  ON production_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own production goals"
  ON production_goals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own production goals"
  ON production_goals
  FOR DELETE
  USING (auth.uid() = user_id);