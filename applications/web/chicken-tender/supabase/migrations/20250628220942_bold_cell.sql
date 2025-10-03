/*
  # Create alerts and notifications tables

  1. New Tables
    - `alerts`
      - `id` (uuid, primary key)
      - `type` (text)
      - `category` (text)
      - `title` (text)
      - `description` (text)
      - `severity` (text)
      - `is_read` (boolean)
      - `is_dismissed` (boolean)
      - `action_required` (boolean)
      - `action_label` (text)
      - `action_url` (text)
      - `related_entity_id` (text)
      - `metadata` (jsonb)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `expires_at` (timestamptz)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  action_required BOOLEAN DEFAULT false,
  action_label TEXT,
  action_url TEXT,
  related_entity_id TEXT,
  metadata JSONB,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_alerts BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_alerts BOOLEAN DEFAULT false,
  weekly_reports BOOLEAN DEFAULT true,
  maintenance_updates BOOLEAN DEFAULT true,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for alerts
CREATE POLICY "Users can view their own alerts"
  ON alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for notification preferences
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);