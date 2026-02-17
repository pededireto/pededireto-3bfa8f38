
-- FEATURE 2: Consumer Plans
CREATE TABLE IF NOT EXISTS public.consumer_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.consumer_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consumer_plans_public_read" ON public.consumer_plans FOR SELECT USING (true);
CREATE POLICY "consumer_plans_admin_manage" ON public.consumer_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

INSERT INTO public.consumer_plans (name, slug, price_monthly, price_yearly, features, limits, display_order) VALUES
('Gratuito', 'free', 0, 0, '["Pesquisar negócios", "Ver contactos", "5 favoritos"]'::jsonb, '{"max_favorites": 5}'::jsonb, 1),
('Premium', 'premium', 4.99, 49.99, '["Favoritos ilimitados", "Pedidos ilimitados", "Sem anúncios", "Pesquisa avançada"]'::jsonb, '{"max_favorites": -1}'::jsonb, 2),
('Business', 'business', 9.99, 99.99, '["Tudo Premium", "Dashboard de gastos", "Acesso API", "Suporte prioritário"]'::jsonb, '{"max_favorites": -1, "has_api": true}'::jsonb, 3);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consumer_plan_id UUID REFERENCES public.consumer_plans(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consumer_plan_expires_at TIMESTAMP WITH TIME ZONE;

-- FEATURE 4: Plan Changes History
CREATE TABLE IF NOT EXISTS public.plan_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  old_plan_id UUID REFERENCES public.consumer_plans(id),
  new_plan_id UUID REFERENCES public.consumer_plans(id),
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.plan_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_changes_admin_manage" ON public.plan_changes FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "plan_changes_user_read_own" ON public.plan_changes FOR SELECT USING (
  auth.uid() = user_id
);

-- FEATURE 5: Business Claim History (for commercial flow)
CREATE TABLE IF NOT EXISTS public.business_claim_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  claimed_for_name VARCHAR(200),
  claimed_for_email VARCHAR(200),
  claimed_for_phone VARCHAR(50),
  processed_by UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  offered_plan VARCHAR(50),
  trial_months INTEGER DEFAULT 0,
  discount_percentage INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

ALTER TABLE public.business_claim_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "claim_history_staff_manage" ON public.business_claim_history FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'commercial', 'cs', 'onboarding'))
);
