
-- Convert remaining 6 views to security_invoker

DROP VIEW IF EXISTS public.business_performance;
CREATE VIEW public.business_performance
WITH (security_invoker = true)
AS
SELECT business_id,
  count(*) AS total_requests,
  count(*) FILTER (WHERE status = ANY (ARRAY['aceite'::match_status, 'recusado'::match_status])) AS responded,
  count(*) FILTER (WHERE status = 'aceite'::match_status) AS accepted,
  count(*) FILTER (WHERE status = 'sem_resposta'::match_status) AS ignored,
  round(count(*) FILTER (WHERE status = ANY (ARRAY['aceite'::match_status, 'recusado'::match_status]))::numeric / NULLIF(count(*), 0)::numeric, 2) AS response_rate
FROM request_business_matches
GROUP BY business_id;

DROP VIEW IF EXISTS public.my_tickets;
CREATE VIEW public.my_tickets
WITH (security_invoker = true)
AS
SELECT t.id, t.title, t.status, t.priority, t.assigned_to_department,
  b.name AS business_name, t.created_at,
  CASE
    WHEN t.created_by = auth.uid() THEN 'Criado por mim'::text
    WHEN t.assigned_to_user = auth.uid() THEN 'Atribuído a mim'::text
    ELSE 'Do meu departamento'::text
  END AS relacao
FROM support_tickets t
LEFT JOIN businesses b ON b.id = t.business_id
WHERE t.created_by = auth.uid()
  OR t.assigned_to_user = auth.uid()
  OR (t.assigned_to_department = 'cs' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = ANY (ARRAY['cs'::app_role, 'admin'::app_role, 'super_admin'::app_role])))
  OR (t.assigned_to_department = 'commercial' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = ANY (ARRAY['commercial'::app_role, 'admin'::app_role, 'super_admin'::app_role])))
  OR (t.assigned_to_department = 'onboarding' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = ANY (ARRAY['onboarding'::app_role, 'admin'::app_role, 'super_admin'::app_role])))
  OR (t.assigned_to_department = 'it_admin' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role])));

DROP VIEW IF EXISTS public.popular_templates;
CREATE VIEW public.popular_templates
WITH (security_invoker = true)
AS
SELECT department, category, title, shortcut, usage_count, created_at
FROM ticket_response_templates
WHERE is_active = true
ORDER BY usage_count DESC, created_at DESC
LIMIT 10;

DROP VIEW IF EXISTS public.support_tickets_with_context;
CREATE VIEW public.support_tickets_with_context
WITH (security_invoker = true)
AS
SELECT st.id, st.created_by, st.created_by_role, st.assigned_to_department, st.assigned_to_user,
  st.business_id, st.title, st.description, st.priority, st.category, st.status,
  st.first_response_at, st.resolved_at, st.closed_at, st.created_at, st.updated_at, st.request_id,
  b.name AS business_name,
  sr.description AS request_description,
  sr.location_city AS request_city,
  c.name AS request_category,
  sr.status AS request_status
FROM support_tickets st
LEFT JOIN businesses b ON b.id = st.business_id
LEFT JOIN service_requests sr ON sr.id = st.request_id
LEFT JOIN categories c ON c.id = sr.category_id;

DROP VIEW IF EXISTS public.tickets_by_department;
CREATE VIEW public.tickets_by_department
WITH (security_invoker = true)
AS
SELECT assigned_to_department AS departamento, status,
  count(*) AS total,
  count(*) FILTER (WHERE first_response_at IS NULL) AS sem_resposta,
  avg(EXTRACT(epoch FROM first_response_at - created_at) / 3600::numeric) AS avg_hours_first_response
FROM support_tickets
GROUP BY assigned_to_department, status;

DROP VIEW IF EXISTS public.tickets_sla_violations;
CREATE VIEW public.tickets_sla_violations
WITH (security_invoker = true)
AS
SELECT t.id, t.title, t.assigned_to_department, t.priority, t.status,
  b.name AS business_name, t.created_at,
  EXTRACT(hour FROM now() - t.created_at) AS hours_open,
  CASE t.priority
    WHEN 'urgent' THEN 2 WHEN 'high' THEN 8 WHEN 'medium' THEN 24 WHEN 'low' THEN 48 ELSE NULL
  END AS sla_hours,
  CASE
    WHEN EXTRACT(hour FROM now() - t.created_at) >
      (CASE t.priority WHEN 'urgent' THEN 2 WHEN 'high' THEN 8 WHEN 'medium' THEN 24 WHEN 'low' THEN 48 ELSE NULL END)::numeric
    THEN '🔴 SLA Violado' ELSE '🟢 Dentro do SLA'
  END AS sla_status
FROM support_tickets t
LEFT JOIN businesses b ON b.id = t.business_id
WHERE t.status = ANY (ARRAY['open', 'assigned', 'in_progress'])
  AND t.first_response_at IS NULL
ORDER BY EXTRACT(hour FROM now() - t.created_at) DESC;

-- Grant permissions
GRANT SELECT ON public.business_performance TO authenticated;
GRANT SELECT ON public.my_tickets TO authenticated;
GRANT SELECT ON public.popular_templates TO authenticated;
GRANT SELECT ON public.support_tickets_with_context TO authenticated;
GRANT SELECT ON public.tickets_by_department TO authenticated;
GRANT SELECT ON public.tickets_sla_violations TO authenticated;
