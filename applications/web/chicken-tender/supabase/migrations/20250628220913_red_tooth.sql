/*
  # Create analytics tables

  1. New Tables
    - `analytics_reports`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `type` (text)
      - `period` (text)
      - `chart_type` (text)
      - `data` (jsonb)
      - `insights` (text[])
      - `recommendations` (text[])
      - `status` (text)
      - `user_id` (uuid, references profiles)
      - `generated_at` (timestamptz)
      - `created_at` (timestamptz)
    - `analytics_insights`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `severity` (text)
      - `impact` (text)
      - `related_metrics` (text[])
      - `recommendations` (text[])
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
    - `analytics_metrics`
      - `id` (uuid, primary key)
      - `name` (text)
      - `value` (numeric)
      - `unit` (text)
      - `trend` (text)
      - `change` (numeric)
      - `change_percent` (numeric)
      - `period` (text)
      - `category` (text)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create analytics reports table
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  period TEXT NOT NULL,
  chart_type TEXT NOT NULL,
  data JSONB NOT NULL,
  insights TEXT[],
  recommendations TEXT[],
  status TEXT DEFAULT 'ready',
  user_id UUID REFERENCES profiles(id) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics insights table
CREATE TABLE IF NOT EXISTS analytics_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  impact TEXT NOT NULL,
  related_metrics TEXT[],
  recommendations TEXT[],
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics metrics table
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  trend TEXT,
  change NUMERIC,
  change_percent NUMERIC,
  period TEXT,
  category TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics alerts table
CREATE TABLE IF NOT EXISTS analytics_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metric TEXT NOT NULL,
  threshold NUMERIC,
  current_value NUMERIC,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics preferences table
CREATE TABLE IF NOT EXISTS analytics_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_date_range TEXT DEFAULT 'last7days',
  default_chart_type TEXT DEFAULT 'line',
  dashboard_layout TEXT DEFAULT 'grid',
  favorite_reports UUID[],
  email_reports BOOLEAN DEFAULT false,
  email_frequency TEXT DEFAULT 'weekly',
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics reports
CREATE POLICY "Users can view their own analytics reports"
  ON analytics_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics reports"
  ON analytics_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics reports"
  ON analytics_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics reports"
  ON analytics_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for analytics insights
CREATE POLICY "Users can view their own analytics insights"
  ON analytics_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics insights"
  ON analytics_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics insights"
  ON analytics_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics insights"
  ON analytics_insights
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for analytics metrics
CREATE POLICY "Users can view their own analytics metrics"
  ON analytics_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics metrics"
  ON analytics_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics metrics"
  ON analytics_metrics
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics metrics"
  ON analytics_metrics
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for analytics alerts
CREATE POLICY "Users can view their own analytics alerts"
  ON analytics_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics alerts"
  ON analytics_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics alerts"
  ON analytics_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics alerts"
  ON analytics_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for analytics preferences
CREATE POLICY "Users can view their own analytics preferences"
  ON analytics_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics preferences"
  ON analytics_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics preferences"
  ON analytics_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);