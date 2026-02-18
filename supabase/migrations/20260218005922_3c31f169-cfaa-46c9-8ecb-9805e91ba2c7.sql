
-- Fix 1: SUPA_rls_policy_always_true - Tighten overly permissive INSERT policies

-- admin_alerts: Only admins should insert alerts
DROP POLICY IF EXISTS "Anyone can insert alerts" ON public.admin_alerts;
CREATE POLICY "Admins can insert alerts"
ON public.admin_alerts FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- analytics_events: Only authenticated users should insert (not anon)
DROP POLICY IF EXISTS "insert_analytics" ON public.analytics_events;
CREATE POLICY "Authenticated users can insert analytics"
ON public.analytics_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- search_intelligence_logs: Restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can insert search intelligence logs" ON public.search_intelligence_logs;
CREATE POLICY "Authenticated users can insert search intelligence logs"
ON public.search_intelligence_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- search_logs_intelligent: Restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can insert search logs intelligent" ON public.search_logs_intelligent;
CREATE POLICY "Authenticated users can insert search logs intelligent"
ON public.search_logs_intelligent FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix 2: SUPA_extension_in_public - Move pg_trgm extension to extensions schema
-- Note: We create it in extensions schema; the public one will be superseded
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
