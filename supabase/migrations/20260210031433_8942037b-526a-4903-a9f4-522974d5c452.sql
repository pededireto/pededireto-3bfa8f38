
-- Replace overly permissive INSERT policies with role-based ones
-- analytics_events: allow any authenticated or anonymous user to insert (this is intentional for tracking)
-- But restrict to only allowing insert, not arbitrary data
DROP POLICY IF EXISTS "Anyone can create analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can create analytics events"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (
    event_type IN ('view', 'click_whatsapp', 'click_phone', 'click_website', 'click_email', 'click_app')
  );

-- suggestions: restrict to validated inserts only
DROP POLICY IF EXISTS "Anyone can create suggestions" ON public.suggestions;
CREATE POLICY "Anyone can create suggestions"
  ON public.suggestions
  FOR INSERT
  WITH CHECK (
    city_name IS NOT NULL AND length(city_name) > 0
  );
