/*
  # Create additional functions and triggers

  1. New Functions and Triggers
    - Trigger to update chicken status based on health records
    - Trigger to create alerts for health issues
    - Trigger to create alerts for production drops
    - Trigger to update device status based on last_seen timestamp
    - Function to generate analytics insights
*/

-- Function to update chicken status based on health records
CREATE OR REPLACE FUNCTION update_chicken_status_from_health()
RETURNS TRIGGER AS $$
BEGIN
  -- If a health record indicates illness or injury, update chicken status
  IF NEW.record_type IN ('illness', 'injury') AND NEW.status = 'active' AND NEW.severity IN ('high', 'critical') THEN
    UPDATE chickens
    SET 
      status = 'sick',
      updated_at = now()
    WHERE id = NEW.chicken_id;
  -- If a health record is resolved, check if chicken can be marked as healthy
  ELSIF NEW.status = 'resolved' AND (OLD.status = 'active' OR OLD.status IS NULL) THEN
    -- Only update if there are no other active health issues
    IF NOT EXISTS (
      SELECT 1 FROM health_records
      WHERE chicken_id = NEW.chicken_id
        AND status = 'active'
        AND record_type IN ('illness', 'injury')
        AND id != NEW.id
    ) THEN
      UPDATE chickens
      SET 
        status = 'active',
        updated_at = now()
      WHERE id = NEW.chicken_id AND status = 'sick';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating chicken status
CREATE TRIGGER update_chicken_status_trigger
  AFTER INSERT OR UPDATE ON health_records
  FOR EACH ROW
  EXECUTE FUNCTION update_chicken_status_from_health();

-- Function to create alerts for health issues
CREATE OR REPLACE FUNCTION create_health_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Create an alert for critical health issues
  IF NEW.severity IN ('high', 'critical') AND NEW.status = 'active' THEN
    INSERT INTO alerts (
      type,
      category,
      title,
      description,
      severity,
      action_required,
      action_label,
      action_url,
      related_entity_id,
      user_id
    )
    VALUES (
      'warning',
      'chicken_health',
      'Health Issue Detected',
      'A ' || NEW.severity || ' health issue has been recorded for chicken ' || (SELECT name FROM chickens WHERE id = NEW.chicken_id),
      NEW.severity,
      true,
      'View Details',
      '/flock/health',
      NEW.chicken_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for health alerts
CREATE TRIGGER create_health_alert_trigger
  AFTER INSERT ON health_records
  FOR EACH ROW
  EXECUTE FUNCTION create_health_alert();

-- Function to create alerts for production drops
CREATE OR REPLACE FUNCTION create_production_alert()
RETURNS TRIGGER AS $$
DECLARE
  avg_production NUMERIC;
  chicken_name TEXT;
BEGIN
  -- Get chicken name
  SELECT name INTO chicken_name FROM chickens WHERE id = NEW.chicken_id;
  
  -- Calculate average production for the last 7 days
  SELECT COALESCE(AVG(quantity), 0) INTO avg_production
  FROM production_records
  WHERE chicken_id = NEW.chicken_id
    AND date BETWEEN (NEW.date - INTERVAL '7 days') AND (NEW.date - INTERVAL '1 day')
    AND type = 'eggs';
  
  -- If today's production is significantly lower than average, create an alert
  IF NEW.type = 'eggs' AND avg_production > 0 AND NEW.quantity < (avg_production * 0.5) THEN
    INSERT INTO alerts (
      type,
      category,
      title,
      description,
      severity,
      action_required,
      action_label,
      action_url,
      related_entity_id,
      user_id
    )
    VALUES (
      'warning',
      'chicken_production',
      'Production Drop Detected',
      'Production for ' || chicken_name || ' has dropped from an average of ' || 
      ROUND(avg_production, 1) || ' to ' || NEW.quantity || ' eggs',
      'medium',
      true,
      'View Details',
      '/flock/production',
      NEW.chicken_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for production alerts
CREATE TRIGGER create_production_alert_trigger
  AFTER INSERT ON production_records
  FOR EACH ROW
  EXECUTE FUNCTION create_production_alert();

-- Function to update device status based on last_seen timestamp
CREATE OR REPLACE FUNCTION update_device_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update device status based on last_seen timestamp
  IF NEW.last_seen IS NOT NULL THEN
    -- If device was seen in the last 5 minutes, mark as online
    IF NEW.last_seen >= (now() - INTERVAL '5 minutes') THEN
      NEW.status := 'online';
    -- If device was seen in the last hour but not in the last 5 minutes, mark as offline
    ELSIF NEW.last_seen >= (now() - INTERVAL '1 hour') THEN
      NEW.status := 'offline';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating device status
CREATE TRIGGER update_device_status_trigger
  BEFORE INSERT OR UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_device_status();

-- Function to generate analytics insights
CREATE OR REPLACE FUNCTION generate_analytics_insights(user_id_param UUID)
RETURNS SETOF analytics_insights LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  insight_record analytics_insights;
  flock_stats JSON;
  production_stats JSON;
  health_score NUMERIC;
  production_rate NUMERIC;
  eggs_today INTEGER;
  eggs_yesterday INTEGER;
  production_change NUMERIC;
BEGIN
  -- Get flock stats
  SELECT * FROM calculate_flock_health_stats(user_id_param) INTO flock_stats;
  SELECT * FROM calculate_flock_production_stats(user_id_param) INTO production_stats;
  
  -- Extract key metrics
  health_score := (flock_stats->>'averageHealthScore')::NUMERIC;
  production_rate := (production_stats->>'productionRate')::NUMERIC;
  eggs_today := (production_stats->>'totalEggsToday')::INTEGER;
  
  -- Get yesterday's egg count
  SELECT COALESCE(SUM(quantity), 0) INTO eggs_yesterday
  FROM production_records
  WHERE user_id = user_id_param 
    AND date = CURRENT_DATE - 1
    AND type = 'eggs';
  
  -- Calculate production change
  IF eggs_yesterday > 0 THEN
    production_change := ((eggs_today - eggs_yesterday)::NUMERIC / eggs_yesterday) * 100;
  ELSE
    production_change := 0;
  END IF;
  
  -- Generate health insight if health score is concerning
  IF health_score < 80 THEN
    INSERT INTO analytics_insights (
      title,
      description,
      category,
      severity,
      impact,
      related_metrics,
      recommendations,
      user_id,
      created_at
    )
    VALUES (
      'Health Score Below Target',
      'Your flock''s average health score of ' || health_score || '% is below the recommended target of 80%.',
      'health',
      CASE 
        WHEN health_score < 60 THEN 'high'
        WHEN health_score < 70 THEN 'medium'
        ELSE 'low'
      END,
      'negative',
      ARRAY['health_score', 'sick_birds'],
      ARRAY[
        'Schedule a flock health check to identify specific issues',
        'Review nutrition and supplement regimen',
        'Check coop environment for potential stressors'
      ],
      user_id_param,
      now()
    )
    RETURNING * INTO insight_record;
    
    RETURN NEXT insight_record;
  END IF;
  
  -- Generate production insight if production changed significantly
  IF ABS(production_change) > 15 THEN
    INSERT INTO analytics_insights (
      title,
      description,
      category,
      severity,
      impact,
      related_metrics,
      recommendations,
      user_id,
      created_at
    )
    VALUES (
      CASE 
        WHEN production_change > 0 THEN 'Production Increase Detected'
        ELSE 'Production Decrease Detected'
      END,
      'Egg production has ' || 
      CASE 
        WHEN production_change > 0 THEN 'increased'
        ELSE 'decreased'
      END || 
      ' by ' || ABS(ROUND(production_change, 1)) || '% compared to yesterday.',
      'production',
      CASE 
        WHEN production_change < -30 THEN 'high'
        WHEN production_change < -15 THEN 'medium'
        ELSE 'low'
      END,
      CASE 
        WHEN production_change > 0 THEN 'positive'
        ELSE 'negative'
      END,
      ARRAY['egg_production', 'production_rate'],
      CASE 
        WHEN production_change > 0 THEN 
          ARRAY[
            'Maintain current feeding and care practices',
            'Document recent changes that may have contributed to the increase',
            'Monitor for sustainability of increased production'
          ]
        ELSE 
          ARRAY[
            'Check for environmental stressors or changes',
            'Evaluate feed quality and consumption patterns',
            'Monitor flock for signs of illness or distress'
          ]
      END,
      user_id_param,
      now()
    )
    RETURNING * INTO insight_record;
    
    RETURN NEXT insight_record;
  END IF;
  
  RETURN;
END;
$$;