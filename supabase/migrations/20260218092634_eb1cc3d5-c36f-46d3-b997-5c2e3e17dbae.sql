
-- Views for analytics
CREATE OR REPLACE VIEW public.email_performance_summary WITH (security_invoker = true) AS
SELECT
  el.campaign_id,
  ec.name AS campaign_name,
  COUNT(*) AS total_sent,
  COUNT(el.opened_at) AS total_opened,
  COUNT(el.clicked_at) AS total_clicked,
  COUNT(el.replied_at) AS total_replied,
  COUNT(*) FILTER (WHERE el.bounced = true) AS total_bounced,
  CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(el.opened_at)::numeric / COUNT(*)) * 100, 1) ELSE 0 END AS open_rate,
  CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(el.clicked_at)::numeric / COUNT(*)) * 100, 1) ELSE 0 END AS click_rate,
  CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(el.replied_at)::numeric / COUNT(*)) * 100, 1) ELSE 0 END AS reply_rate,
  CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE el.bounced = true)::numeric / COUNT(*)) * 100, 1) ELSE 0 END AS bounce_rate
FROM email_logs el
LEFT JOIN email_campaigns ec ON ec.id = el.campaign_id
GROUP BY el.campaign_id, ec.name;

CREATE OR REPLACE VIEW public.cadence_enrollment_summary WITH (security_invoker = true) AS
SELECT
  ece.cadence_id,
  ec.name AS cadence_name,
  COUNT(*) AS total_enrolled,
  COUNT(*) FILTER (WHERE ece.status = 'active') AS active_count,
  COUNT(*) FILTER (WHERE ece.status = 'completed') AS completed_count,
  COUNT(*) FILTER (WHERE ece.status = 'paused') AS paused_count,
  COUNT(*) FILTER (WHERE ece.status = 'cancelled') AS cancelled_count
FROM email_cadence_enrollments ece
JOIN email_cadences ec ON ec.id = ece.cadence_id
GROUP BY ece.cadence_id, ec.name;

-- Add INSERT/UPDATE policy to email_logs (currently only SELECT exists)
CREATE POLICY "team_can_insert_logs"
ON public.email_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM user_roles
    WHERE role = ANY (ARRAY['commercial'::app_role, 'admin'::app_role, 'super_admin'::app_role, 'cs'::app_role, 'onboarding'::app_role])
  )
);

CREATE POLICY "team_can_update_logs"
ON public.email_logs
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles
    WHERE role = ANY (ARRAY['commercial'::app_role, 'admin'::app_role, 'super_admin'::app_role, 'cs'::app_role, 'onboarding'::app_role])
  )
);

-- Add RLS policy for email_notifications
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_notifications"
ON public.email_notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_notifications"
ON public.email_notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "team_can_insert_notifications"
ON public.email_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM user_roles
    WHERE role = ANY (ARRAY['commercial'::app_role, 'admin'::app_role, 'super_admin'::app_role, 'cs'::app_role, 'onboarding'::app_role])
  )
);
