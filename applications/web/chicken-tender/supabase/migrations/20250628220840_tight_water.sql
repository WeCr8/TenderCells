/*
  # Create automation tables

  1. New Tables
    - `automation_rules`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `status` (text)
      - `priority` (integer)
      - `triggers` (jsonb)
      - `actions` (jsonb)
      - `schedule` (jsonb)
      - `conditions` (jsonb)
      - `metadata` (jsonb)
      - `settings` (jsonb)
      - `last_executed` (timestamptz)
      - `next_execution` (timestamptz)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `automation_schedules`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `type` (text)
      - `status` (text)
      - `priority` (text)
      - `time_config` (jsonb)
      - `actions` (jsonb)
      - `execution_settings` (jsonb)
      - `last_execution` (timestamptz)
      - `next_execution` (timestamptz)
      - `execution_count` (integer)
      - `success_count` (integer)
      - `tags` (text[])
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `devices`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `type` (text)
      - `status` (text)
      - `location` (text)
      - `capabilities` (text[])
      - `actions` (jsonb)
      - `readings` (jsonb)
      - `last_seen` (timestamptz)
      - `firmware` (jsonb)
      - `battery` (jsonb)
      - `network` (jsonb)
      - `metadata` (jsonb)
      - `settings` (jsonb)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create automation rules table
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'inactive',
  priority INTEGER DEFAULT 1,
  triggers JSONB NOT NULL,
  actions JSONB NOT NULL,
  schedule JSONB,
  conditions JSONB,
  metadata JSONB DEFAULT '{"tags": [], "author": "", "version": "1.0", "executionCount": 0, "successCount": 0, "failureCount": 0, "averageExecutionTime": 0}'::jsonb,
  settings JSONB DEFAULT '{"retryOnFailure": false, "notifyOnFailure": true, "logExecution": true}'::jsonb,
  last_executed TIMESTAMPTZ,
  next_execution TIMESTAMPTZ,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create automation schedules table
CREATE TABLE IF NOT EXISTS automation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'inactive',
  priority TEXT DEFAULT 'normal',
  time_config JSONB NOT NULL,
  actions JSONB NOT NULL,
  execution_settings JSONB DEFAULT '{"timeout": 300, "retryCount": 0, "retryDelay": 60, "skipIfMissed": true, "runOnStartup": false}'::jsonb,
  last_execution TIMESTAMPTZ,
  next_execution TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  tags TEXT[],
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'offline',
  location TEXT,
  capabilities TEXT[],
  actions JSONB DEFAULT '[]'::jsonb,
  readings JSONB DEFAULT '[]'::jsonb,
  last_seen TIMESTAMPTZ,
  firmware JSONB DEFAULT '{"version": "1.0.0", "lastUpdated": null, "updateAvailable": false}'::jsonb,
  battery JSONB,
  network JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create device groups table
CREATE TABLE IF NOT EXISTS device_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create device group memberships table
CREATE TABLE IF NOT EXISTS device_group_memberships (
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  group_id UUID REFERENCES device_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (device_id, group_id)
);

-- Create rule executions table
CREATE TABLE IF NOT EXISTS rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  execution_time INTEGER,
  actions_executed INTEGER DEFAULT 0,
  actions_succeeded INTEGER DEFAULT 0,
  actions_failed INTEGER DEFAULT 0,
  logs JSONB DEFAULT '[]'::jsonb,
  error TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create schedule executions table
CREATE TABLE IF NOT EXISTS schedule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES automation_schedules(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL,
  actions JSONB DEFAULT '{"total": 0, "completed": 0, "failed": 0}'::jsonb,
  error TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create device events table
CREATE TABLE IF NOT EXISTS device_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  value JSONB,
  previous_value JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  severity TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_events ENABLE ROW LEVEL SECURITY;

-- Create policies for automation rules
CREATE POLICY "Users can view their own automation rules"
  ON automation_rules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation rules"
  ON automation_rules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation rules"
  ON automation_rules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation rules"
  ON automation_rules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for automation schedules
CREATE POLICY "Users can view their own automation schedules"
  ON automation_schedules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation schedules"
  ON automation_schedules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation schedules"
  ON automation_schedules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation schedules"
  ON automation_schedules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for devices
CREATE POLICY "Users can view their own devices"
  ON devices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
  ON devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON devices
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
  ON devices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for device groups
CREATE POLICY "Users can view their own device groups"
  ON device_groups
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device groups"
  ON device_groups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device groups"
  ON device_groups
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device groups"
  ON device_groups
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for device group memberships
CREATE POLICY "Users can view their own device group memberships"
  ON device_group_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM devices d
      WHERE d.id = device_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own device group memberships"
  ON device_group_memberships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM devices d
      WHERE d.id = device_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own device group memberships"
  ON device_group_memberships
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM devices d
      WHERE d.id = device_id AND d.user_id = auth.uid()
    )
  );

-- Create policies for rule executions
CREATE POLICY "Users can view their own rule executions"
  ON rule_executions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for schedule executions
CREATE POLICY "Users can view their own schedule executions"
  ON schedule_executions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for device events
CREATE POLICY "Users can view their own device events"
  ON device_events
  FOR SELECT
  USING (auth.uid() = user_id);