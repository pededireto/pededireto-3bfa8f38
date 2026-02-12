
-- =====================================================
-- PHASE 6+7 + LEADS ENGINE MIGRATION (FIXED)
-- =====================================================

-- 1. Expand service_requests for leads engine
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS location_city TEXT,
  ADD COLUMN IF NOT EXISTS location_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS urgency TEXT NOT NULL DEFAULT 'normal';

-- 2. Expand request_business_matches
ALTER TABLE public.request_business_matches
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- 3. RLS for request_business_matches: businesses can see their own matches
CREATE POLICY "Businesses can view own matches"
  ON public.request_business_matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = request_business_matches.business_id
        AND b.owner_email = (
          SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1
        )
    )
  );

-- 4. RLS: businesses can update their own matches (mark as viewed/responded)
CREATE POLICY "Businesses can update own matches"
  ON public.request_business_matches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = request_business_matches.business_id
        AND b.owner_email = (
          SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1
        )
    )
  );

-- 5. RLS: commercial users can view matches for their assigned businesses
CREATE POLICY "Commercial can view assigned matches"
  ON public.request_business_matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_commercial_assignments bca
      WHERE bca.business_id = request_business_matches.business_id
        AND bca.commercial_id = auth.uid()
        AND bca.is_active = true
    )
  );

-- 6. Match function: auto-match a service request to top 3 paying businesses
CREATE OR REPLACE FUNCTION public.match_request_to_businesses(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request RECORD;
  v_business RECORD;
  v_count INT := 0;
BEGIN
  SELECT * INTO v_request FROM service_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service request not found: %', p_request_id;
  END IF;

  FOR v_business IN
    SELECT b.id, b.name
    FROM businesses b
    WHERE b.subscription_status = 'active'
      AND b.is_active = true
      AND (v_request.category_id IS NULL OR b.category_id = v_request.category_id)
      AND (v_request.location_city IS NULL OR lower(COALESCE(b.city, '')) = lower(v_request.location_city))
      AND NOT EXISTS (
        SELECT 1 FROM request_business_matches rbm
        WHERE rbm.request_id = p_request_id AND rbm.business_id = b.id
      )
    ORDER BY
      CASE b.premium_level
        WHEN 'platinum' THEN 1 WHEN 'gold' THEN 2 WHEN 'silver' THEN 3 ELSE 4
      END,
      CASE b.subscription_plan
        WHEN 'premium' THEN 1 WHEN 'professional' THEN 2 ELSE 3
      END
    LIMIT 3
  LOOP
    INSERT INTO request_business_matches (request_id, business_id, status)
    VALUES (p_request_id, v_business.id, 'enviado');

    INSERT INTO business_notifications (business_id, title, message, type)
    VALUES (v_business.id, 'Novo pedido de serviço', 'Recebeu um novo pedido na sua categoria.', 'request');

    v_count := v_count + 1;
  END LOOP;

  IF v_count > 0 THEN
    UPDATE service_requests SET status = 'encaminhado' WHERE id = p_request_id AND status = 'novo';
  END IF;
END;
$$;

-- 7. Updated create_revenue_event (keeping TEXT event_type for compatibility)
DROP FUNCTION IF EXISTS public.create_revenue_event(uuid, text, uuid, numeric, uuid);

CREATE OR REPLACE FUNCTION public.create_revenue_event(
  p_business_id uuid,
  p_event_type text,
  p_plan_id uuid,
  p_amount numeric,
  p_assigned_user_id uuid,
  p_triggered_by uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Validate event type
  IF p_event_type NOT IN ('sale','upsell','churn_recovery','reactivation','downgrade','refund','bonus','manual_adjustment') THEN
    RAISE EXCEPTION 'Invalid event type: %', p_event_type;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM businesses WHERE id = p_business_id) THEN
    RAISE EXCEPTION 'Business not found: %', p_business_id;
  END IF;

  SELECT user_id INTO v_assigned_user_auth_id FROM profiles WHERE id = p_assigned_user_id;
  IF v_assigned_user_auth_id IS NULL THEN
    RAISE EXCEPTION 'Assigned user not found (profiles.id): %', p_assigned_user_id;
  END IF;

  SELECT role::TEXT INTO v_assigned_role FROM user_roles WHERE user_id = v_assigned_user_auth_id LIMIT 1;
  SELECT team_id INTO v_assigned_team_id FROM team_members WHERE user_id = v_assigned_user_auth_id LIMIT 1;

  SELECT id INTO v_model_id FROM commission_models WHERE is_active = true LIMIT 1;

  -- Insert revenue event
  INSERT INTO revenue_events (
    business_id, event_type, plan_id, amount, assigned_user_id, triggered_by
  ) VALUES (
    p_business_id, p_event_type, p_plan_id, p_amount, p_assigned_user_id, p_triggered_by
  ) RETURNING id INTO v_event_id;

  -- Generate commission if model exists
  IF v_model_id IS NOT NULL THEN
    FOR v_rule IN
      SELECT * FROM commission_rules
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
        SELECT 1 FROM commercial_commissions
        WHERE business_id = p_business_id
          AND commercial_id = v_assigned_user_auth_id
          AND commission_model_id = v_model_id
          AND reference_month = date_trunc('month', now())::date
          AND revenue_event_id = v_event_id
      ) THEN
        INSERT INTO commercial_commissions (
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

-- 8. Seed additional permissions
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'view_leads_dashboard'),
  ('admin', 'auto_match_requests'),
  ('admin', 'view_commission_audit'),
  ('admin', 'reverse_commissions'),
  ('admin', 'validate_commissions'),
  ('super_admin', 'view_leads_dashboard'),
  ('super_admin', 'auto_match_requests'),
  ('super_admin', 'view_commission_audit'),
  ('super_admin', 'reverse_commissions'),
  ('super_admin', 'validate_commissions'),
  ('commercial', 'view_leads'),
  ('cs', 'view_leads')
ON CONFLICT DO NOTHING;
