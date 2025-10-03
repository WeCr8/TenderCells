/*
  # Create environment tables

  1. New Tables
    - `environment_data`
      - `id` (uuid, primary key)
      - `temperature` (jsonb)
      - `humidity` (jsonb)
      - `air_quality` (jsonb)
      - `lighting` (jsonb)
      - `user_id` (uuid, references profiles)
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)
    - `environment_controls`
      - `id` (uuid, primary key)
      - `coop_door` (jsonb)
      - `lighting` (jsonb)
      - `ventilation` (jsonb)
      - `heating` (jsonb)
      - `cooling` (jsonb)
      - `user_id` (uuid, references profiles)
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)
    - `environment_alerts`
      - `id` (uuid, primary key)
      - `type` (text)
      - `severity` (text)
      - `message` (text)
      - `value` (numeric)
      - `threshold` (numeric)
      - `user_id` (uuid, references profiles)
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create environment data table
CREATE TABLE IF NOT EXISTS environment_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temperature JSONB NOT NULL,
  humidity JSONB NOT NULL,
  air_quality JSONB NOT NULL,
  lighting JSONB NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create environment controls table
CREATE TABLE IF NOT EXISTS environment_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coop_door JSONB NOT NULL,
  lighting JSONB NOT NULL,
  ventilation JSONB NOT NULL,
  heating JSONB NOT NULL,
  cooling JSONB NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create environment alerts table
CREATE TABLE IF NOT EXISTS environment_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  value NUMERIC,
  threshold NUMERIC,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE environment_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE environment_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE environment_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for environment data
CREATE POLICY "Users can view their own environment data"
  ON environment_data
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own environment data"
  ON environment_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for environment controls
CREATE POLICY "Users can view their own environment controls"
  ON environment_controls
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own environment controls"
  ON environment_controls
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own environment controls"
  ON environment_controls
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for environment alerts
CREATE POLICY "Users can view their own environment alerts"
  ON environment_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own environment alerts"
  ON environment_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);