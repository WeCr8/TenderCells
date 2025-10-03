/*
  # Auth Tables

  1. New Tables
    - `auth_devices` - Stores information about user devices
    - `auth_sessions` - Stores active user sessions
    - `auth_verification_tokens` - Stores verification tokens for email/phone verification

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access
*/

-- Create auth_devices table
CREATE TABLE IF NOT EXISTS auth_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  browser TEXT,
  os TEXT,
  last_ip TEXT,
  last_location TEXT,
  last_active TIMESTAMPTZ DEFAULT now(),
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create auth_sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES auth_devices(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create auth_verification_tokens table
CREATE TABLE IF NOT EXISTS auth_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  token TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE auth_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for auth_devices
CREATE POLICY "Users can view their own devices"
  ON auth_devices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON auth_devices
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for auth_sessions
CREATE POLICY "Users can view their own sessions"
  ON auth_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON auth_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for auth_verification_tokens
-- No policies needed as this table should only be accessed by service roles

-- Create function to revoke a device
CREATE OR REPLACE FUNCTION revoke_device(device_id_param UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if the device belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM auth_devices
    WHERE id = device_id_param AND user_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  -- Mark device as revoked
  UPDATE auth_devices
  SET is_revoked = true
  WHERE id = device_id_param;
  
  -- Delete associated sessions
  DELETE FROM auth_sessions
  WHERE device_id = device_id_param;
  
  RETURN true;
END;
$$;

-- Create function to create a new device
CREATE OR REPLACE FUNCTION create_device(
  name_param TEXT,
  type_param TEXT,
  browser_param TEXT,
  os_param TEXT,
  ip_param TEXT
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  device_id UUID;
BEGIN
  -- Insert new device
  INSERT INTO auth_devices (
    user_id,
    name,
    type,
    browser,
    os,
    last_ip,
    last_active
  )
  VALUES (
    auth.uid(),
    name_param,
    type_param,
    browser_param,
    os_param,
    ip_param,
    now()
  )
  RETURNING id INTO device_id;
  
  RETURN device_id;
END;
$$;

-- Create function to create a new session
CREATE OR REPLACE FUNCTION create_session(
  device_id_param UUID,
  refresh_token_param TEXT,
  expires_in_seconds INTEGER DEFAULT 604800 -- 7 days
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Insert new session
  INSERT INTO auth_sessions (
    user_id,
    device_id,
    refresh_token,
    expires_at
  )
  VALUES (
    auth.uid(),
    device_id_param,
    refresh_token_param,
    now() + (expires_in_seconds * interval '1 second')
  )
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Create function to refresh a session
CREATE OR REPLACE FUNCTION refresh_session(
  refresh_token_param TEXT,
  new_refresh_token_param TEXT,
  expires_in_seconds INTEGER DEFAULT 604800 -- 7 days
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  session_record auth_sessions%ROWTYPE;
BEGIN
  -- Get the session
  SELECT * INTO session_record
  FROM auth_sessions
  WHERE refresh_token = refresh_token_param;
  
  -- Check if session exists and belongs to current user
  IF session_record IS NULL OR session_record.user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- Check if session is expired
  IF session_record.expires_at < now() THEN
    -- Delete expired session
    DELETE FROM auth_sessions
    WHERE id = session_record.id;
    RETURN false;
  END IF;
  
  -- Update session with new refresh token and expiration
  UPDATE auth_sessions
  SET 
    refresh_token = new_refresh_token_param,
    expires_at = now() + (expires_in_seconds * interval '1 second'),
    updated_at = now()
  WHERE id = session_record.id;
  
  -- Update device last active time
  UPDATE auth_devices
  SET last_active = now()
  WHERE id = session_record.device_id;
  
  RETURN true;
END;
$$;

-- Create function to create a verification token
CREATE OR REPLACE FUNCTION create_verification_token(
  email_param TEXT,
  type_param TEXT,
  expires_in_seconds INTEGER DEFAULT 3600 -- 1 hour
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  token TEXT;
  user_id_var UUID;
BEGIN
  -- Generate a random token
  token := encode(gen_random_bytes(32), 'hex');
  
  -- Get user ID if email exists
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = email_param;
  
  -- Delete any existing tokens for this email and type
  DELETE FROM auth_verification_tokens
  WHERE email = email_param AND type = type_param;
  
  -- Insert new token
  INSERT INTO auth_verification_tokens (
    user_id,
    email,
    token,
    type,
    expires_at
  )
  VALUES (
    user_id_var,
    email_param,
    token,
    type_param,
    now() + (expires_in_seconds * interval '1 second')
  );
  
  RETURN token;
END;
$$;

-- Create function to verify a token
CREATE OR REPLACE FUNCTION verify_token(
  token_param TEXT,
  type_param TEXT
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  token_record auth_verification_tokens%ROWTYPE;
  user_id_var UUID;
BEGIN
  -- Get the token
  SELECT * INTO token_record
  FROM auth_verification_tokens
  WHERE token = token_param AND type = type_param;
  
  -- Check if token exists
  IF token_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if token is expired
  IF token_record.expires_at < now() THEN
    -- Delete expired token
    DELETE FROM auth_verification_tokens
    WHERE id = token_record.id;
    RETURN NULL;
  END IF;
  
  -- Get or create user
  IF token_record.user_id IS NOT NULL THEN
    user_id_var := token_record.user_id;
  ELSIF token_record.email IS NOT NULL THEN
    -- Check if user exists
    SELECT id INTO user_id_var
    FROM auth.users
    WHERE email = token_record.email;
    
    -- Create user if not exists
    IF user_id_var IS NULL THEN
      INSERT INTO auth.users (email, email_confirmed_at)
      VALUES (token_record.email, now())
      RETURNING id INTO user_id_var;
    END IF;
  ELSE
    RETURN NULL;
  END IF;
  
  -- Delete the token
  DELETE FROM auth_verification_tokens
  WHERE id = token_record.id;
  
  RETURN user_id_var;
END;
$$;