/*
  # Create chickens and flock tables

  1. New Tables
    - `chickens`
      - `id` (uuid, primary key)
      - `name` (text)
      - `rfid_tag` (text)
      - `breed` (text)
      - `age` (integer)
      - `status` (text)
      - `health_score` (integer)
      - `location` (text)
      - `notes` (text)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `flock_groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `location` (text)
      - `status` (text)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `chicken_group_memberships`
      - `chicken_id` (uuid, references chickens)
      - `group_id` (uuid, references flock_groups)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create chickens table
CREATE TABLE IF NOT EXISTS chickens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rfid_tag TEXT,
  breed TEXT,
  age INTEGER,
  status TEXT DEFAULT 'active',
  health_score INTEGER DEFAULT 100,
  location TEXT,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create flock groups table
CREATE TABLE IF NOT EXISTS flock_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status TEXT DEFAULT 'active',
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create chicken group memberships table
CREATE TABLE IF NOT EXISTS chicken_group_memberships (
  chicken_id UUID REFERENCES chickens(id) ON DELETE CASCADE,
  group_id UUID REFERENCES flock_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (chicken_id, group_id)
);

-- Enable Row Level Security
ALTER TABLE chickens ENABLE ROW LEVEL SECURITY;
ALTER TABLE flock_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chicken_group_memberships ENABLE ROW LEVEL SECURITY;

-- Create policies for chickens
CREATE POLICY "Users can view their own chickens"
  ON chickens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chickens"
  ON chickens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chickens"
  ON chickens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chickens"
  ON chickens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for flock groups
CREATE POLICY "Users can view their own flock groups"
  ON flock_groups
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flock groups"
  ON flock_groups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flock groups"
  ON flock_groups
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flock groups"
  ON flock_groups
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for chicken group memberships
CREATE POLICY "Users can view their own chicken group memberships"
  ON chicken_group_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chickens c
      WHERE c.id = chicken_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own chicken group memberships"
  ON chicken_group_memberships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chickens c
      WHERE c.id = chicken_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own chicken group memberships"
  ON chicken_group_memberships
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chickens c
      WHERE c.id = chicken_id AND c.user_id = auth.uid()
    )
  );