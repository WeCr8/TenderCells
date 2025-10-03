/*
  # Create health records tables

  1. New Tables
    - `health_records`
      - `id` (uuid, primary key)
      - `chicken_id` (uuid, references chickens)
      - `record_type` (text)
      - `date` (date)
      - `veterinarian` (text)
      - `description` (text)
      - `symptoms` (text[])
      - `diagnosis` (text)
      - `severity` (text)
      - `status` (text)
      - `follow_up_required` (boolean)
      - `follow_up_date` (date)
      - `notes` (text)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `treatments`
      - `id` (uuid, primary key)
      - `health_record_id` (uuid, references health_records)
      - `name` (text)
      - `type` (text)
      - `dosage` (text)
      - `frequency` (text)
      - `duration` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text)
      - `administered_by` (text)
      - `created_at` (timestamptz)
    - `vaccinations`
      - `id` (uuid, primary key)
      - `chicken_id` (uuid, references chickens)
      - `name` (text)
      - `type` (text)
      - `administration_date` (date)
      - `next_due_date` (date)
      - `veterinarian` (text)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create health records table
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chicken_id UUID REFERENCES chickens(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  date DATE NOT NULL,
  veterinarian TEXT,
  description TEXT NOT NULL,
  symptoms TEXT[],
  diagnosis TEXT,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create treatments table
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_record_id UUID REFERENCES health_records(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'in_progress',
  administered_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chicken_id UUID REFERENCES chickens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  administration_date DATE NOT NULL,
  next_due_date DATE,
  veterinarian TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create health metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chicken_id UUID REFERENCES chickens(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC,
  temperature NUMERIC,
  body_condition_score NUMERIC,
  behavior_score NUMERIC,
  appetite_level TEXT,
  activity_level TEXT,
  feather_condition TEXT,
  comb_color TEXT,
  eye_condition TEXT,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for health records
CREATE POLICY "Users can view their own health records"
  ON health_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health records"
  ON health_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health records"
  ON health_records
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health records"
  ON health_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for treatments
CREATE POLICY "Users can view treatments for their health records"
  ON treatments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_records hr
      WHERE hr.id = health_record_id AND hr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert treatments for their health records"
  ON treatments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_records hr
      WHERE hr.id = health_record_id AND hr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update treatments for their health records"
  ON treatments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM health_records hr
      WHERE hr.id = health_record_id AND hr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete treatments for their health records"
  ON treatments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM health_records hr
      WHERE hr.id = health_record_id AND hr.user_id = auth.uid()
    )
  );

-- Create policies for vaccinations
CREATE POLICY "Users can view their own vaccinations"
  ON vaccinations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vaccinations"
  ON vaccinations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vaccinations"
  ON vaccinations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vaccinations"
  ON vaccinations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for health metrics
CREATE POLICY "Users can view their own health metrics"
  ON health_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics"
  ON health_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics"
  ON health_metrics
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health metrics"
  ON health_metrics
  FOR DELETE
  USING (auth.uid() = user_id);