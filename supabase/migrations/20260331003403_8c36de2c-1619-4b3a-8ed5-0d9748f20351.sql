
-- =====================================================
-- FIX 1: Restrict businesses public SELECT to exclude PII
-- =====================================================
-- Revoke direct column access on sensitive fields from anon
REVOKE SELECT (owner_email, owner_phone, owner_name, nif) ON public.businesses FROM anon;

-- =====================================================
-- FIX 2: Fix internal_notifications policies - require authenticated + role check
-- =====================================================
DROP POLICY IF EXISTS "Admin can see admin notifications" ON public.internal_notifications;
DROP POLICY IF EXISTS "Commercial can see commercial notifications" ON public.internal_notifications;

CREATE POLICY "Admin can see admin notifications" ON public.internal_notifications
  FOR SELECT TO authenticated
  USING (target_role = 'admin' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Commercial can see commercial notifications" ON public.internal_notifications
  FOR SELECT TO authenticated
  USING (target_role = 'commercial' AND public.has_role(auth.uid(), 'commercial'));

-- =====================================================
-- FIX 3: Fix consumer_badge_progress - remove public write, restrict to service_role
-- =====================================================
DROP POLICY IF EXISTS "System update badge progress" ON public.consumer_badge_progress;
DROP POLICY IF EXISTS "System upsert badge progress" ON public.consumer_badge_progress;

-- Only authenticated users can read their own progress
CREATE POLICY "Users read own badge progress" ON public.consumer_badge_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- FIX 4: Fix image_prompts_library - restrict to admin only
-- =====================================================
DROP POLICY IF EXISTS "ipl_admin_all" ON public.image_prompts_library;

-- Anyone authenticated can read (for studio feature)
CREATE POLICY "Authenticated users can read prompts" ON public.image_prompts_library
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can write
CREATE POLICY "Admins manage prompts" ON public.image_prompts_library
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- FIX 5: Fix business_users overly broad SELECT
-- =====================================================
DROP POLICY IF EXISTS "authenticated_read_business_users" ON public.business_users;

-- Users see own memberships
CREATE POLICY "Users view own memberships" ON public.business_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Business members see teammates (use security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_business_member_direct(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id = p_business_id
    AND user_id = auth.uid()
  );
$$;

CREATE POLICY "Members view business team" ON public.business_users
  FOR SELECT TO authenticated
  USING (public.is_business_member_direct(business_id));

-- Admins see all
CREATE POLICY "Admins view all business_users" ON public.business_users
  FOR SELECT TO authenticated
  USING (public.is_admin());
