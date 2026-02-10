
-- Create admin_action_requests table for approval workflow
CREATE TABLE public.admin_action_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_name TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage action requests"
  ON public.admin_action_requests FOR ALL
  USING (public.is_admin());

CREATE POLICY "Commercial users can create action requests"
  ON public.admin_action_requests FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'commercial'));

CREATE POLICY "Commercial users can view own requests"
  ON public.admin_action_requests FOR SELECT
  USING (requested_by = auth.uid() AND public.has_role(auth.uid(), 'commercial'));

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_name TEXT,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit logs"
  ON public.audit_logs FOR ALL
  USING (public.is_admin());

CREATE POLICY "Commercial users can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'commercial'));

CREATE POLICY "Commercial users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'commercial'));

-- Helper function
CREATE OR REPLACE FUNCTION public.is_commercial()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'commercial')
$$;

-- Commercial RLS policies on existing tables
CREATE POLICY "Commercial users can view all businesses"
  ON public.businesses FOR SELECT
  USING (public.is_commercial());

CREATE POLICY "Commercial users can update businesses"
  ON public.businesses FOR UPDATE
  USING (public.is_commercial());

CREATE POLICY "Commercial users can view all categories"
  ON public.categories FOR SELECT
  USING (public.is_commercial());

CREATE POLICY "Commercial users can view all subcategories"
  ON public.subcategories FOR SELECT
  USING (public.is_commercial());

CREATE POLICY "Commercial users can view contact logs"
  ON public.business_contact_logs FOR SELECT
  USING (public.is_commercial());

CREATE POLICY "Commercial users can create contact logs"
  ON public.business_contact_logs FOR INSERT
  WITH CHECK (public.is_commercial());

CREATE POLICY "Commercial users can view all plans"
  ON public.commercial_plans FOR SELECT
  USING (public.is_commercial());

CREATE POLICY "Commercial users can manage business subcategories"
  ON public.business_subcategories FOR ALL
  USING (public.is_commercial());
