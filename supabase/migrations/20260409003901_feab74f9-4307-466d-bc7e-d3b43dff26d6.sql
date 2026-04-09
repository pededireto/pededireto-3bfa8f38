
-- ============================================================
-- FIX 1: Restrict businesses table PII from anonymous users
-- Instead of blocking anon entirely (would break public pages),
-- we revoke anon SELECT on the table and grant it on the view.
-- ============================================================

-- Drop the overly broad anon policy
DROP POLICY IF EXISTS "Anyone can view active businesses" ON public.businesses;

-- Create a restricted anon policy that excludes PII columns
-- Since RLS can't filter columns, we create a restricted view approach:
-- Grant anon SELECT only through the businesses_public view
REVOKE SELECT ON public.businesses FROM anon;
GRANT SELECT ON public.businesses_public TO anon;

-- Authenticated users still get full access via their role-specific policies
-- (Admins, commercial, business members, owners already have SELECT policies)

-- ============================================================
-- FIX 2: Restrict support_ticket_messages access
-- ============================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "authenticated_can_manage_ticket_messages" ON public.support_ticket_messages;

-- Users can read messages on tickets they created or are assigned to
CREATE POLICY "Users can view own ticket messages"
  ON public.support_ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE created_by = auth.uid()
    )
  );

-- Staff can view messages on tickets assigned to their department
CREATE POLICY "Staff can view assigned ticket messages"
  ON public.support_ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets st
      WHERE (
        (st.assigned_to_department = 'it_admin' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')))
        OR (st.assigned_to_department = 'commercial' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('commercial', 'admin', 'super_admin')))
        OR (st.assigned_to_department = 'cs' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('cs', 'admin', 'super_admin')))
        OR (st.assigned_to_department = 'onboarding' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('onboarding', 'admin', 'super_admin')))
      )
    )
  );

-- Users can insert messages on their own tickets
CREATE POLICY "Users can add messages to own tickets"
  ON public.support_ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE created_by = auth.uid()
    )
  );

-- Staff can insert messages on tickets in their department
CREATE POLICY "Staff can add messages to assigned tickets"
  ON public.support_ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.support_tickets st
      WHERE (
        (st.assigned_to_department = 'it_admin' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')))
        OR (st.assigned_to_department = 'commercial' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('commercial', 'admin', 'super_admin')))
        OR (st.assigned_to_department = 'cs' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('cs', 'admin', 'super_admin')))
        OR (st.assigned_to_department = 'onboarding' AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('onboarding', 'admin', 'super_admin')))
      )
    )
  );

-- Admins can update/delete any messages
CREATE POLICY "Admins can manage all ticket messages"
  ON public.support_ticket_messages
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- FIX 3: Restrict business_cities write access
-- ============================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "business_cities_authenticated_write" ON public.business_cities;

-- Only business owners/managers can modify their business cities
CREATE POLICY "Business members can manage cities"
  ON public.business_cities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users bu
      WHERE bu.business_id = business_cities.business_id
      AND bu.user_id = public.get_my_profile_id()
      AND bu.role IN ('owner', 'pending_owner', 'manager')
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users bu
      WHERE bu.business_id = business_cities.business_id
      AND bu.user_id = public.get_my_profile_id()
      AND bu.role IN ('owner', 'pending_owner', 'manager')
    )
    OR public.is_admin()
  );
