-- View for organization memberships
CREATE OR REPLACE VIEW organization_memberships AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  o.github_org_name,
  u.id AS user_id,
  p.display_name,
  om.role
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
JOIN auth.users u ON om.user_id = u.id
JOIN profiles p ON u.id = p.id;

-- View for user sessions
CREATE OR REPLACE VIEW user_sessions AS
SELECT
  s.*,
  sp.user_id,
  p.display_name as participant_name,
  o.name as organization_name,
  array_agg(DISTINCT l.name) as labels,
  CASE
    WHEN s.status = 'active' THEN 
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(s.last_paused_at, s.start_time)) + s.total_duration)/3600
    ELSE
      EXTRACT(EPOCH FROM s.total_duration)/3600
  END as hours
FROM sessions s
JOIN session_participants sp ON s.id = sp.session_id
JOIN profiles p ON sp.user_id = p.id
JOIN organizations o ON s.organization_id = o.id
LEFT JOIN session_labels sl ON s.id = sl.session_id
LEFT JOIN labels l ON sl.label_id = l.id
GROUP BY s.id, sp.user_id, p.display_name, o.name;

-- View for dashboard summary with labels
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
  u.display_name,
  l.name as label,
  DATE_TRUNC('day', s.start_time) as day,
  DATE_TRUNC('week', s.start_time) as week,
  DATE_TRUNC('month', s.start_time) as month,
  EXTRACT(EPOCH FROM SUM(
    CASE
      WHEN s.status = 'completed' THEN s.total_duration
      WHEN s.status = 'paused' THEN s.total_duration
      WHEN s.status = 'active' THEN 
        (CURRENT_TIMESTAMP - COALESCE(s.last_paused_at, s.start_time)) + s.total_duration
    END
  ))/3600 as total_hours
FROM sessions s
JOIN session_participants sp ON s.id = sp.session_id
JOIN profiles u ON sp.user_id = u.id
LEFT JOIN session_labels sl ON s.id = sl.session_id
LEFT JOIN labels l ON sl.label_id = l.id
GROUP BY u.display_name, l.name, day, week, month;
