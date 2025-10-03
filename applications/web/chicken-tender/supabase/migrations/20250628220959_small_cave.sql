/*
  # Create helper functions and stored procedures

  1. New Functions
    - `get_chicken_health_profile` - Get complete health profile for a chicken
    - `get_chicken_production_profile` - Get complete production profile for a chicken
    - `calculate_flock_health_stats` - Calculate health statistics for a user's flock
    - `calculate_flock_production_stats` - Calculate production statistics for a user's flock
    - `update_chicken_health_score` - Update a chicken's health score based on recent metrics
    - `update_production_goal_progress` - Update progress on production goals
*/

-- Function to get a chicken's complete health profile
CREATE OR REPLACE FUNCTION get_chicken_health_profile(chicken_id_param UUID)
RETURNS TABLE (
  health_records JSON,
  health_metrics JSON,
  vaccinations JSON,
  treatments JSON,
  health_alerts JSON
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(
      (SELECT json_agg(row_to_json(hr)) FROM health_records hr WHERE hr.chicken_id = chicken_id_param),
      '[]'::json
    ) AS health_records,
    COALESCE(
      (SELECT json_agg(row_to_json(hm)) FROM health_metrics hm WHERE hm.chicken_id = chicken_id_param),
      '[]'::json
    ) AS health_metrics,
    COALESCE(
      (SELECT json_agg(row_to_json(v)) FROM vaccinations v WHERE v.chicken_id = chicken_id_param),
      '[]'::json
    ) AS vaccinations,
    COALESCE(
      (SELECT json_agg(row_to_json(t)) 
       FROM treatments t 
       JOIN health_records hr ON t.health_record_id = hr.id 
       WHERE hr.chicken_id = chicken_id_param),
      '[]'::json
    ) AS treatments,
    '[]'::json AS health_alerts; -- Placeholder for alerts
END;
$$;

-- Function to get a chicken's complete production profile
CREATE OR REPLACE FUNCTION get_chicken_production_profile(chicken_id_param UUID)
RETURNS TABLE (
  production_records JSON,
  production_goals JSON,
  production_metrics JSON,
  production_forecast JSON
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(
      (SELECT json_agg(row_to_json(pr)) FROM production_records pr WHERE pr.chicken_id = chicken_id_param),
      '[]'::json
    ) AS production_records,
    COALESCE(
      (SELECT json_agg(row_to_json(pg)) FROM production_goals pg WHERE pg.chicken_id = chicken_id_param),
      '[]'::json
    ) AS production_goals,
    '{}'::json AS production_metrics, -- Placeholder for calculated metrics
    '[]'::json AS production_forecast; -- Placeholder for forecast
END;
$$;

-- Function to calculate health statistics for a user's flock
CREATE OR REPLACE FUNCTION calculate_flock_health_stats(user_id_param UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalRecords', (SELECT COUNT(*) FROM health_records hr WHERE hr.user_id = user_id_param),
    'activeIssues', (SELECT COUNT(*) FROM health_records hr WHERE hr.user_id = user_id_param AND hr.status = 'active'),
    'resolvedIssues', (SELECT COUNT(*) FROM health_records hr WHERE hr.user_id = user_id_param AND hr.status = 'resolved'),
    'vaccinationsThisMonth', (
      SELECT COUNT(*) FROM vaccinations v 
      WHERE v.user_id = user_id_param 
      AND v.administration_date >= date_trunc('month', CURRENT_DATE)
    ),
    'treatmentsInProgress', (
      SELECT COUNT(*) FROM treatments t
      JOIN health_records hr ON t.health_record_id = hr.id
      WHERE hr.user_id = user_id_param AND t.status = 'in_progress'
    ),
    'averageHealthScore', (
      SELECT COALESCE(AVG(health_score), 0) FROM chickens c WHERE c.user_id = user_id_param
    ),
    'healthTrend', 'stable', -- Placeholder for calculated trend
    'lastUpdated', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to calculate production statistics for a user's flock
CREATE OR REPLACE FUNCTION calculate_flock_production_stats(user_id_param UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
  today_date DATE := CURRENT_DATE;
  week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  eggs_today INTEGER;
  eggs_this_week INTEGER;
  eggs_this_month INTEGER;
  total_chickens INTEGER;
  production_rate NUMERIC;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO total_chickens FROM chickens WHERE user_id = user_id_param;
  
  SELECT COALESCE(SUM(quantity), 0) INTO eggs_today
  FROM production_records
  WHERE user_id = user_id_param AND date = today_date AND type = 'eggs';
  
  SELECT COALESCE(SUM(quantity), 0) INTO eggs_this_week
  FROM production_records
  WHERE user_id = user_id_param AND date >= week_start AND type = 'eggs';
  
  SELECT COALESCE(SUM(quantity), 0) INTO eggs_this_month
  FROM production_records
  WHERE user_id = user_id_param AND date >= month_start AND type = 'eggs';
  
  -- Calculate production rate (eggs per chicken per day)
  IF total_chickens > 0 THEN
    production_rate := (eggs_this_week::NUMERIC / total_chickens) / 
                       GREATEST(1, EXTRACT(DAY FROM (CURRENT_DATE - week_start + 1)));
  ELSE
    production_rate := 0;
  END IF;
  
  -- Build result object
  SELECT json_build_object(
    'totalEggsToday', eggs_today,
    'totalEggsThisWeek', eggs_this_week,
    'totalEggsThisMonth', eggs_this_month,
    'averageDailyProduction', ROUND((eggs_this_week::NUMERIC / GREATEST(1, EXTRACT(DAY FROM (CURRENT_DATE - week_start + 1)))), 1),
    'productionRate', ROUND(production_rate * 100, 1),
    'qualityDistribution', (
      SELECT json_build_object(
        'AA', COALESCE(SUM(CASE WHEN quality = 'AA' THEN quantity ELSE 0 END), 0),
        'A', COALESCE(SUM(CASE WHEN quality = 'A' THEN quantity ELSE 0 END), 0),
        'B', COALESCE(SUM(CASE WHEN quality = 'B' THEN quantity ELSE 0 END), 0),
        'C', COALESCE(SUM(CASE WHEN quality = 'C' THEN quantity ELSE 0 END), 0),
        'reject', COALESCE(SUM(CASE WHEN quality = 'reject' THEN quantity ELSE 0 END), 0)
      )
      FROM production_records
      WHERE user_id = user_id_param AND date >= week_start AND type = 'eggs'
    ),
    'topProducers', (
      SELECT json_agg(row_to_json(top_producers))
      FROM (
        SELECT c.id AS chicken_id, c.name AS chicken_name, COALESCE(SUM(pr.quantity), 0) AS eggs_this_week
        FROM chickens c
        LEFT JOIN production_records pr ON c.id = pr.chicken_id AND pr.date >= week_start AND pr.type = 'eggs'
        WHERE c.user_id = user_id_param
        GROUP BY c.id, c.name
        ORDER BY eggs_this_week DESC
        LIMIT 5
      ) top_producers
    ),
    'productionTrend', 'stable', -- Placeholder for calculated trend
    'lastUpdated', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to update a chicken's health score based on recent metrics
CREATE OR REPLACE FUNCTION update_chicken_health_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate health score based on the new metrics
  -- This is a simplified calculation - in a real app, you'd use more sophisticated logic
  UPDATE chickens
  SET 
    health_score = GREATEST(0, LEAST(100, (
      (NEW.body_condition_score * 20) + 
      (NEW.behavior_score * 10) +
      (CASE 
        WHEN NEW.appetite_level = 'excellent' THEN 20
        WHEN NEW.appetite_level = 'good' THEN 15
        WHEN NEW.appetite_level = 'fair' THEN 10
        WHEN NEW.appetite_level = 'poor' THEN 5
        ELSE 0
      END)
    ))),
    updated_at = now()
  WHERE id = NEW.chicken_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating chicken health score
CREATE TRIGGER update_chicken_health_score_trigger
  AFTER INSERT ON health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_chicken_health_score();

-- Function to update progress on production goals
CREATE OR REPLACE FUNCTION update_production_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update progress for goals related to this chicken
  UPDATE production_goals
  SET 
    current_progress = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM production_records
      WHERE chicken_id = NEW.chicken_id
        AND type = production_goals.type
        AND date BETWEEN production_goals.start_date AND production_goals.end_date
    ),
    status = CASE
      WHEN (
        SELECT COALESCE(SUM(quantity), 0)
        FROM production_records
        WHERE chicken_id = NEW.chicken_id
          AND type = production_goals.type
          AND date BETWEEN production_goals.start_date AND production_goals.end_date
      ) >= target_quantity THEN 'completed'
      WHEN end_date < CURRENT_DATE THEN 'overdue'
      ELSE 'in_progress'
    END
  WHERE chicken_id = NEW.chicken_id
    AND type = NEW.type
    AND start_date <= NEW.date
    AND end_date >= NEW.date;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating production goal progress
CREATE TRIGGER update_production_goal_progress_trigger
  AFTER INSERT OR UPDATE ON production_records
  FOR EACH ROW
  EXECUTE FUNCTION update_production_goal_progress();