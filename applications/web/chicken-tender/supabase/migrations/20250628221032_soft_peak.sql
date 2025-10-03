/*
  # Create database views

  1. New Views
    - `flock_summary_view` - Summary statistics for a user's flock
    - `health_summary_view` - Summary of health records for a user's flock
    - `production_summary_view` - Summary of production records for a user's flock
    - `automation_summary_view` - Summary of automation rules and schedules
    - `device_summary_view` - Summary of devices and their status
*/

-- Create flock summary view
CREATE OR REPLACE VIEW flock_summary_view AS
SELECT
  c.user_id,
  COUNT(c.id) AS total_birds,
  COUNT(CASE WHEN c.status = 'active' THEN 1 END) AS active_birds,
  COUNT(CASE WHEN c.status = 'sick' THEN 1 END) AS sick_birds,
  COUNT(CASE WHEN c.status = 'missing' THEN 1 END) AS missing_birds,
  COALESCE(AVG(c.age), 0) AS average_age,
  COALESCE(AVG(c.health_score), 0) AS average_health_score,
  (
    SELECT COALESCE(SUM(pr.quantity), 0)
    FROM production_records pr
    WHERE pr.user_id = c.user_id AND pr.date = CURRENT_DATE AND pr.type = 'eggs'
  ) AS eggs_today
FROM chickens c
GROUP BY c.user_id;

-- Create health summary view
CREATE OR REPLACE VIEW health_summary_view AS
SELECT
  hr.user_id,
  COUNT(hr.id) AS total_records,
  COUNT(CASE WHEN hr.status = 'active' THEN 1 END) AS active_issues,
  COUNT(CASE WHEN hr.status = 'resolved' THEN 1 END) AS resolved_issues,
  COUNT(CASE WHEN hr.record_type = 'vaccination' THEN 1 END) AS total_vaccinations,
  COUNT(CASE WHEN hr.record_type = 'treatment' THEN 1 END) AS total_treatments,
  COUNT(CASE WHEN hr.follow_up_required = true AND hr.follow_up_date >= CURRENT_DATE THEN 1 END) AS pending_followups
FROM health_records hr
GROUP BY hr.user_id;

-- Create production summary view
CREATE OR REPLACE VIEW production_summary_view AS
SELECT
  pr.user_id,
  SUM(CASE WHEN pr.date = CURRENT_DATE THEN pr.quantity ELSE 0 END) AS eggs_today,
  SUM(CASE WHEN pr.date >= date_trunc('week', CURRENT_DATE)::date THEN pr.quantity ELSE 0 END) AS eggs_this_week,
  SUM(CASE WHEN pr.date >= date_trunc('month', CURRENT_DATE)::date THEN pr.quantity ELSE 0 END) AS eggs_this_month,
  COUNT(DISTINCT pr.chicken_id) AS producing_chickens,
  COALESCE(AVG(pr.weight), 0) AS average_egg_weight,
  COUNT(CASE WHEN pr.quality = 'AA' THEN 1 END) AS grade_aa_count,
  COUNT(CASE WHEN pr.quality = 'A' THEN 1 END) AS grade_a_count,
  COUNT(CASE WHEN pr.quality = 'B' THEN 1 END) AS grade_b_count,
  COUNT(CASE WHEN pr.quality = 'C' THEN 1 END) AS grade_c_count,
  COUNT(CASE WHEN pr.quality = 'reject' THEN 1 END) AS reject_count
FROM production_records pr
WHERE pr.type = 'eggs'
GROUP BY pr.user_id;

-- Create automation summary view
CREATE OR REPLACE VIEW automation_summary_view AS
SELECT
  ar.user_id,
  COUNT(ar.id) AS total_rules,
  COUNT(CASE WHEN ar.status = 'active' THEN 1 END) AS active_rules,
  COUNT(CASE WHEN ar.status = 'inactive' THEN 1 END) AS inactive_rules,
  COUNT(CASE WHEN ar.status = 'paused' THEN 1 END) AS paused_rules,
  COUNT(CASE WHEN ar.status = 'error' THEN 1 END) AS error_rules,
  (
    SELECT COUNT(*)
    FROM automation_schedules asch
    WHERE asch.user_id = ar.user_id
  ) AS total_schedules,
  (
    SELECT COUNT(*)
    FROM automation_schedules asch
    WHERE asch.user_id = ar.user_id AND asch.status = 'active'
  ) AS active_schedules,
  (
    SELECT COUNT(*)
    FROM rule_executions re
    WHERE re.user_id = ar.user_id AND re.start_time >= CURRENT_DATE
  ) AS executions_today
FROM automation_rules ar
GROUP BY ar.user_id;

-- Create device summary view
CREATE OR REPLACE VIEW device_summary_view AS
SELECT
  d.user_id,
  COUNT(d.id) AS total_devices,
  COUNT(CASE WHEN d.status = 'online' THEN 1 END) AS online_devices,
  COUNT(CASE WHEN d.status = 'offline' THEN 1 END) AS offline_devices,
  COUNT(CASE WHEN d.status = 'maintenance' THEN 1 END) AS maintenance_devices,
  COUNT(CASE WHEN d.status = 'error' THEN 1 END) AS error_devices,
  COUNT(CASE WHEN d.battery IS NOT NULL AND (d.battery->>'level')::numeric < 0.2 THEN 1 END) AS low_battery_devices,
  COUNT(CASE WHEN d.firmware->>'updateAvailable' = 'true' THEN 1 END) AS update_available_devices
FROM devices d
GROUP BY d.user_id;