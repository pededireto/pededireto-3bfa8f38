
-- ═══════════════════════════════════════════════════════════
-- SISTEMA DE AFILIADOS — MIGRATION COMPLETA
-- ═══════════════════════════════════════════════════════════

-- 1. ALTER commission_models — campos de afiliados
ALTER TABLE commission_models
  ADD COLUMN IF NOT EXISTS rate numeric,
  ADD COLUMN IF NOT EXISTS renewal_rate numeric,
  ADD COLUMN IF NOT EXISTS valid_from timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS valid_until timestamptz;

-- 2. Trigger: garantir só um modelo activo de cada vez
CREATE OR REPLACE FUNCTION enforce_single_active_commission_model()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE commission_models SET is_active = false
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_active_model ON commission_models;
CREATE TRIGGER trg_single_active_model
  BEFORE INSERT OR UPDATE ON commission_models
  FOR EACH ROW EXECUTE FUNCTION enforce_single_active_commission_model();

-- 3. Tabela: códigos de referral
CREATE TABLE IF NOT EXISTS affiliate_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_codes_user_id_unique UNIQUE (user_id)
);

ALTER TABLE affiliate_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_code_select" ON affiliate_codes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_code_insert" ON affiliate_codes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_all_codes" ON affiliate_codes
  FOR ALL TO authenticated USING (public.is_admin());

-- 4. Tabela: leads de afiliados
CREATE TABLE IF NOT EXISTS affiliate_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  contact_phone text,
  contact_email text,
  contact_website text,
  city text,
  notes text,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','converted','rejected','duplicate')),
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','referral_link')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_leads_select" ON affiliate_leads
  FOR SELECT TO authenticated USING (affiliate_id = auth.uid());
CREATE POLICY "own_leads_insert" ON affiliate_leads
  FOR INSERT TO authenticated WITH CHECK (affiliate_id = auth.uid());
CREATE POLICY "admin_all_leads" ON affiliate_leads
  FOR ALL TO authenticated USING (public.is_admin());

-- 5. Tabela: fingerprints para detecção de duplicados
CREATE TABLE IF NOT EXISTS affiliate_lead_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES affiliate_leads(id) ON DELETE CASCADE,
  field_type text NOT NULL CHECK (field_type IN ('phone','email','website')),
  field_value text NOT NULL,
  CONSTRAINT affiliate_lead_fingerprints_unique UNIQUE (field_type, field_value)
);

ALTER TABLE affiliate_lead_fingerprints ENABLE ROW LEVEL SECURITY;

-- CORRECÇÃO 2: policies para fingerprints (SECURITY DEFINER precisa delas em contexto authenticated)
CREATE POLICY "fingerprints_select_via_lead_owner" ON affiliate_lead_fingerprints
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM affiliate_leads
    WHERE affiliate_leads.id = affiliate_lead_fingerprints.lead_id
      AND affiliate_leads.affiliate_id = auth.uid()
  ));

CREATE POLICY "fingerprints_insert_via_lead_owner" ON affiliate_lead_fingerprints
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM affiliate_leads
    WHERE affiliate_leads.id = affiliate_lead_fingerprints.lead_id
      AND affiliate_leads.affiliate_id = auth.uid()
  ));

CREATE POLICY "admin_all_fingerprints" ON affiliate_lead_fingerprints
  FOR ALL TO authenticated USING (public.is_admin());

-- 6. Tabela: comissões de afiliados
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES affiliate_leads(id) ON DELETE SET NULL,
  affiliate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  plan_id uuid,
  commission_model_id uuid REFERENCES commission_models(id) ON DELETE SET NULL,
  plan_price numeric NOT NULL,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL,
  commission_type text NOT NULL DEFAULT 'first'
    CHECK (commission_type IN ('first','renewal')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','paid','cancelled')),
  payment_method text CHECK (payment_method IN ('bank_transfer','platform_credits')),
  iban text,
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_commissions_select" ON affiliate_commissions
  FOR SELECT TO authenticated USING (affiliate_id = auth.uid());
CREATE POLICY "admin_all_commissions" ON affiliate_commissions
  FOR ALL TO authenticated USING (public.is_admin());

-- 7. Tabela: créditos de plataforma
CREATE TABLE IF NOT EXISTS affiliate_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  description text,
  commission_id uuid REFERENCES affiliate_commissions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_credits_select" ON affiliate_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_all_credits" ON affiliate_credits
  FOR ALL TO authenticated USING (public.is_admin());

-- 8. Função: gerar código de referral
CREATE OR REPLACE FUNCTION generate_affiliate_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  SELECT code INTO v_code FROM affiliate_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;

  LOOP
    v_code := 'PD-' || upper(substr(md5(random()::text), 1, 4));
    SELECT EXISTS(SELECT 1 FROM affiliate_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  INSERT INTO affiliate_codes (user_id, code) VALUES (p_user_id, v_code);
  RETURN v_code;
END;
$$;

-- 9. Função: verificação de duplicados
CREATE OR REPLACE FUNCTION check_affiliate_lead_duplicate(
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_website text DEFAULT NULL
)
RETURNS TABLE(is_duplicate boolean, duplicate_field text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_phone IS NOT NULL AND trim(p_phone) != '' THEN
    IF EXISTS(
      SELECT 1 FROM affiliate_lead_fingerprints
      WHERE field_type = 'phone'
        AND field_value = lower(regexp_replace(trim(p_phone), '\s+', '', 'g'))
    ) THEN
      RETURN QUERY SELECT true, 'telefone'::text; RETURN;
    END IF;
  END IF;

  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    IF EXISTS(
      SELECT 1 FROM affiliate_lead_fingerprints
      WHERE field_type = 'email' AND field_value = lower(trim(p_email))
    ) THEN
      RETURN QUERY SELECT true, 'email'::text; RETURN;
    END IF;
  END IF;

  IF p_website IS NOT NULL AND trim(p_website) != '' THEN
    IF EXISTS(
      SELECT 1 FROM affiliate_lead_fingerprints
      WHERE field_type = 'website'
        AND field_value = lower(regexp_replace(trim(p_website), '^https?://(www\.)?', '', 'g'))
    ) THEN
      RETURN QUERY SELECT true, 'website'::text; RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT false, NULL::text;
END;
$$;

-- 10. Função: inserir lead com fingerprints
CREATE OR REPLACE FUNCTION create_affiliate_lead(
  p_affiliate_id uuid,
  p_business_name text,
  p_contact_phone text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_contact_website text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_source text DEFAULT 'manual'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_norm_phone text;
  v_norm_email text;
  v_norm_website text;
BEGIN
  v_norm_phone := CASE WHEN p_contact_phone IS NOT NULL AND trim(p_contact_phone) != ''
    THEN lower(regexp_replace(trim(p_contact_phone), '\s+', '', 'g')) ELSE NULL END;
  v_norm_email := CASE WHEN p_contact_email IS NOT NULL AND trim(p_contact_email) != ''
    THEN lower(trim(p_contact_email)) ELSE NULL END;
  v_norm_website := CASE WHEN p_contact_website IS NOT NULL AND trim(p_contact_website) != ''
    THEN lower(regexp_replace(trim(p_contact_website), '^https?://(www\.)?', '', 'g')) ELSE NULL END;

  IF v_norm_phone IS NULL AND v_norm_email IS NULL AND v_norm_website IS NULL THEN
    RAISE EXCEPTION 'Pelo menos um contacto (telefone, email ou website) é obrigatório';
  END IF;

  INSERT INTO affiliate_leads (affiliate_id, business_name, contact_phone, contact_email, contact_website, city, notes, source)
  VALUES (p_affiliate_id, p_business_name, p_contact_phone, p_contact_email, p_contact_website, p_city, p_notes, p_source)
  RETURNING id INTO v_lead_id;

  IF v_norm_phone IS NOT NULL THEN
    INSERT INTO affiliate_lead_fingerprints (lead_id, field_type, field_value)
    VALUES (v_lead_id, 'phone', v_norm_phone);
  END IF;
  IF v_norm_email IS NOT NULL THEN
    INSERT INTO affiliate_lead_fingerprints (lead_id, field_type, field_value)
    VALUES (v_lead_id, 'email', v_norm_email);
  END IF;
  IF v_norm_website IS NOT NULL THEN
    INSERT INTO affiliate_lead_fingerprints (lead_id, field_type, field_value)
    VALUES (v_lead_id, 'website', v_norm_website);
  END IF;

  RETURN v_lead_id;
END;
$$;

-- 11. Trigger: criar comissão de afiliado quando subscrição é activada
CREATE OR REPLACE FUNCTION trigger_create_affiliate_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead affiliate_leads%ROWTYPE;
  v_model commission_models%ROWTYPE;
  v_plan record;
  v_rate numeric;
  v_amount numeric;
  v_commission_type text := 'first';
BEGIN
  IF NEW.subscription_status = 'active'
    AND (OLD.subscription_status IS DISTINCT FROM 'active')
    AND NEW.plan_id IS NOT NULL THEN

    SELECT * INTO v_lead
    FROM affiliate_leads
    WHERE business_id = NEW.id AND status NOT IN ('duplicate', 'rejected')
    ORDER BY created_at ASC LIMIT 1;

    IF v_lead.id IS NULL THEN RETURN NEW; END IF;

    IF EXISTS(
      SELECT 1 FROM affiliate_commissions
      WHERE lead_id = v_lead.id AND commission_type = 'first'
        AND status != 'cancelled'
    ) THEN
      v_commission_type := 'renewal';
    END IF;

    SELECT * INTO v_model FROM commission_models WHERE is_active = true LIMIT 1;
    IF v_model.id IS NULL THEN RETURN NEW; END IF;

    -- CORRECÇÃO 1: sem cast redundante
    SELECT id, price INTO v_plan FROM commercial_plans WHERE id = NEW.plan_id;
    IF v_plan.id IS NULL THEN RETURN NEW; END IF;

    v_rate := CASE
      WHEN v_commission_type = 'renewal' THEN COALESCE(v_model.renewal_rate, COALESCE(v_model.rate, 0) / 2)
      ELSE COALESCE(v_model.rate, 0)
    END;

    IF v_rate <= 0 THEN RETURN NEW; END IF;

    v_amount := ROUND((v_plan.price * v_rate / 100)::numeric, 2);

    INSERT INTO affiliate_commissions (
      lead_id, affiliate_id, business_id, plan_id, commission_model_id,
      plan_price, commission_rate, commission_amount, commission_type, status
    ) VALUES (
      v_lead.id, v_lead.affiliate_id, NEW.id, NEW.plan_id, v_model.id,
      v_plan.price, v_rate, v_amount, v_commission_type, 'pending'
    );

    UPDATE affiliate_leads SET status = 'converted', updated_at = now()
    WHERE id = v_lead.id AND status != 'converted';

    INSERT INTO admin_alerts (type, title, message, metadata)
    VALUES (
      'affiliate_conversion',
      'Nova comissão de afiliado',
      'Lead convertida: ' || v_lead.business_name || ' — ' || v_amount || '€',
      jsonb_build_object('lead_id', v_lead.id, 'affiliate_id', v_lead.affiliate_id,
                         'amount', v_amount, 'type', v_commission_type)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_affiliate_commission ON businesses;
CREATE TRIGGER trg_affiliate_commission
  AFTER UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION trigger_create_affiliate_commission();
