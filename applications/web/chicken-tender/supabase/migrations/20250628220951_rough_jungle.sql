/*
  # Create settings table

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `theme` (text)
      - `compact_mode` (boolean)
      - `animation_speed` (numeric)
      - `language` (text)
      - `timezone` (text)
      - `temperature_unit` (text)
      - `auto_backup` (boolean)
      - `data_retention` (text)
      - `offline_mode` (boolean)
      - `sync_frequency` (text)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create user settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme TEXT DEFAULT 'light',
  compact_mode BOOLEAN DEFAULT false,
  animation_speed NUMERIC DEFAULT 1.0,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'America/New_York',
  temperature_unit TEXT DEFAULT 'fahrenheit',
  auto_backup BOOLEAN DEFAULT true,
  data_retention TEXT DEFAULT '1year',
  offline_mode BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT 'auto',
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user settings
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to handle new user settings
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user settings
CREATE OR REPLACE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();