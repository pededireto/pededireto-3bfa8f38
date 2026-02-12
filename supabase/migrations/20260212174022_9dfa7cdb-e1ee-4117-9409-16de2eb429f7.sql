
-- =============================================
-- FASE 1: Tabelas, colunas e RLS
-- =============================================

-- 1.4 Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL USING (is_admin());
CREATE POLICY "Authenticated can view teams" ON public.teams FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL USING (is_admin());
CREATE POLICY "Users can view own memberships" ON public.team_members FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 1.5 commission_rules novas colunas
ALTER TABLE public.commission_rules
  ADD COLUMN IF NOT EXISTS applies_to_role TEXT NULL,
  ADD COLUMN IF NOT EXISTS applies_to_event_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS applies_to_team UUID NULL REFERENCES public.teams(id),
  ADD COLUMN IF NOT EXISTS applies_to_user UUID NULL REFERENCES auth.users(id);

-- 1.6 commercial_commissions novas colunas
ALTER TABLE public.commercial_commissions
  ADD COLUMN IF NOT EXISTS adjustment_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS original_commission_id UUID NULL REFERENCES public.commercial_commissions(id);

-- 1.7 commission_audit_logs
CREATE TABLE IF NOT EXISTS public.commission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID NOT NULL REFERENCES public.commercial_commissions(id),
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  old_status TEXT,
  new_status TEXT,
  old_amount NUMERIC,
  new_amount NUMERIC,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage commission audit logs" ON public.commission_audit_logs FOR ALL USING (is_admin());
CREATE POLICY "Users can view own commission audit logs" ON public.commission_audit_logs FOR SELECT TO authenticated USING (changed_by = auth.uid());

-- 1.3 RLS para revenue_events
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all revenue events" ON public.revenue_events FOR ALL USING (is_admin());
CREATE POLICY "Users can view own revenue events" ON public.revenue_events
  FOR SELECT TO authenticated
  USING (
    assigned_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR triggered_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- =============================================
-- FASE 2: role_permissions + has_permission()
-- =============================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage role permissions" ON public.role_permissions FOR ALL USING (is_admin());
CREATE POLICY "Authenticated can view role permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- Função has_permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
  )
$$;

-- Seed permissões
INSERT INTO public.role_permissions (role, permission) VALUES
  ('super_admin', 'view_all_businesses'),
  ('super_admin', 'view_own_businesses'),
  ('super_admin', 'create_revenue_event'),
  ('super_admin', 'manage_commissions'),
  ('super_admin', 'view_own_commissions'),
  ('super_admin', 'manage_users'),
  ('super_admin', 'manage_plans'),
  ('super_admin', 'manage_settings'),
  ('super_admin', 'view_analytics'),
  ('super_admin', 'view_performance'),
  ('super_admin', 'manage_assignments'),
  ('super_admin', 'view_own_assignments'),
  ('super_admin', 'manage_pages'),
  ('super_admin', 'manage_homepage'),
  ('super_admin', 'view_audit_logs'),
  ('super_admin', 'manage_teams'),
  ('admin', 'view_all_businesses'),
  ('admin', 'view_own_businesses'),
  ('admin', 'create_revenue_event'),
  ('admin', 'manage_commissions'),
  ('admin', 'view_own_commissions'),
  ('admin', 'manage_users'),
  ('admin', 'manage_plans'),
  ('admin', 'manage_settings'),
  ('admin', 'view_analytics'),
  ('admin', 'view_performance'),
  ('admin', 'manage_assignments'),
  ('admin', 'view_own_assignments'),
  ('admin', 'manage_pages'),
  ('admin', 'manage_homepage'),
  ('admin', 'view_audit_logs'),
  ('admin', 'manage_teams'),
  ('commercial', 'view_own_businesses'),
  ('commercial', 'create_revenue_event'),
  ('commercial', 'view_own_commissions'),
  ('commercial', 'view_own_assignments'),
  ('cs', 'view_own_businesses'),
  ('cs', 'create_revenue_event'),
  ('cs', 'view_own_commissions'),
  ('cs', 'view_own_assignments'),
  ('onboarding', 'view_own_businesses'),
  ('onboarding', 'create_revenue_event'),
  ('onboarding', 'view_own_commissions'),
  ('onboarding', 'view_own_assignments')
ON CONFLICT (role, permission) DO NOTHING;

-- Atualizar create_revenue_event()
CREATE OR REPLACE FUNCTION public.create_revenue_event(
  p_business_id UUID,
  p_event_type TEXT,
  p_plan_id UUID,
  p_amount NUMERIC,
  p_assigned_user_id UUID,
  p_triggered_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_rule RECORD;
  v_commission_amount NUMERIC;
  v_model_id UUID;
  v_assigned_user_auth_id UUID;
  v_assigned_role TEXT;
  v_assigned_team_id UUID;
BEGIN
  IF p_business_id IS NULL THEN RAISE EXCEPTION 'business_id is required'; END IF;
  IF p_event_type IS NULL THEN RAISE EXCEPTION 'event_type is required'; END IF;
  IF p_amount IS NULL THEN RAISE EXCEPTION 'amount is required'; END IF;
  IF p_assigned_user_id IS NULL THEN RAISE EXCEPTION 'assigned_user_id is required'; END IF;
  IF p_triggered_by IS NULL THEN RAISE EXCEPTION 'triggered_by is required'; END IF;

  SELECT user_id INTO v_assigned_user_auth_id
  FROM public.profiles WHERE id = p_assigned_user_id;
  IF v_assigned_user_auth_id IS NULL THEN RAISE EXCEPTION 'Assigned user not found'; END IF;

  SELECT role::TEXT INTO v_assigned_role
  FROM public.user_roles WHERE user_id = v_assigned_user_auth_id LIMIT 1;

  SELECT team_id INTO v_assigned_team_id
  FROM public.team_members WHERE user_id = v_assigned_user_auth_id LIMIT 1;

  INSERT INTO public.revenue_events (
    business_id, event_type, plan_id, amount, assigned_user_id, triggered_by
  ) VALUES (
    p_business_id, p_event_type, p_plan_id, p_amount, p_assigned_user_id, p_triggered_by
  ) RETURNING id INTO v_event_id;

  SELECT id INTO v_model_id FROM public.commission_models WHERE is_active = true LIMIT 1;

  IF v_model_id IS NOT NULL THEN
    FOR v_rule IN
      SELECT * FROM public.commission_rules
      WHERE commission_model_id = v_model_id
        AND (plan_id IS NULL OR plan_id = p_plan_id)
        AND (applies_to_event_type IS NULL OR applies_to_event_type = p_event_type)
        AND (applies_to_role IS NULL OR applies_to_role = v_assigned_role)
        AND (applies_to_team IS NULL OR applies_to_team = v_assigned_team_id)
        AND (applies_to_user IS NULL OR applies_to_user = v_assigned_user_auth_id)
      ORDER BY
        CASE WHEN applies_to_user IS NOT NULL THEN 1
             WHEN applies_to_team IS NOT NULL THEN 2
             WHEN applies_to_role IS NOT NULL THEN 3
             ELSE 4 END
      LIMIT 1
    LOOP
      IF v_rule.commission_type = 'percentage' THEN
        v_commission_amount := p_amount * (v_rule.value / 100);
      ELSE
        v_commission_amount := v_rule.value;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM public.commercial_commissions
        WHERE business_id = p_business_id
          AND commercial_id = v_assigned_user_auth_id
          AND commission_model_id = v_model_id
          AND reference_month = date_trunc('month', now())::date
          AND revenue_event_id = v_event_id
      ) THEN
        INSERT INTO public.commercial_commissions (
          business_id, commercial_id, commission_model_id,
          amount, status, reference_month, revenue_event_id
        ) VALUES (
          p_business_id, v_assigned_user_auth_id, v_model_id,
          v_commission_amount, 'generated',
          date_trunc('month', now())::date, v_event_id
        );
      END IF;
    END LOOP;
  END IF;

  RETURN v_event_id;
END;
$$;
