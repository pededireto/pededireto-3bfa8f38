
-- Part 1: Add conversion fields to businesses
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS converted_by uuid NULL,
ADD COLUMN IF NOT EXISTS conversion_date timestamptz NULL,
ADD COLUMN IF NOT EXISTS conversion_plan_id uuid NULL,
ADD COLUMN IF NOT EXISTS conversion_price numeric NULL;

-- Add FK constraints
ALTER TABLE public.businesses
ADD CONSTRAINT businesses_converted_by_fkey FOREIGN KEY (converted_by) REFERENCES public.profiles(user_id),
ADD CONSTRAINT businesses_conversion_plan_id_fkey FOREIGN KEY (conversion_plan_id) REFERENCES public.commercial_plans(id);

-- Part 2: business_commercial_assignments
CREATE TABLE public.business_commercial_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  commercial_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('sales', 'account_manager')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bca_business ON public.business_commercial_assignments(business_id);
CREATE INDEX idx_bca_commercial ON public.business_commercial_assignments(commercial_id);
CREATE INDEX idx_bca_active ON public.business_commercial_assignments(is_active);
CREATE UNIQUE INDEX idx_bca_unique_active_role ON public.business_commercial_assignments(business_id, role) WHERE is_active = true;

ALTER TABLE public.business_commercial_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all assignments" ON public.business_commercial_assignments FOR ALL USING (is_admin());
CREATE POLICY "Commercial users can view own assignments" ON public.business_commercial_assignments FOR SELECT USING (commercial_id = auth.uid());

CREATE TRIGGER update_bca_updated_at BEFORE UPDATE ON public.business_commercial_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Part 3: commission_models
CREATE TABLE public.commission_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission models" ON public.commission_models FOR ALL USING (is_admin());
CREATE POLICY "Commercial users can view active models" ON public.commission_models FOR SELECT USING (is_active = true AND is_commercial());

CREATE TRIGGER update_cm_updated_at BEFORE UPDATE ON public.commission_models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Part 4: commission_rules
CREATE TABLE public.commission_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_model_id uuid NOT NULL REFERENCES public.commission_models(id) ON DELETE CASCADE,
  plan_id uuid NULL REFERENCES public.commercial_plans(id) ON DELETE SET NULL,
  commission_type text NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  value numeric NOT NULL DEFAULT 0,
  applies_to text NOT NULL CHECK (applies_to IN ('first_payment', 'monthly')),
  duration_months integer NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cr_model ON public.commission_rules(commission_model_id);

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission rules" ON public.commission_rules FOR ALL USING (is_admin());
CREATE POLICY "Commercial users can view rules of active models" ON public.commission_rules FOR SELECT USING (
  is_commercial() AND EXISTS (SELECT 1 FROM public.commission_models cm WHERE cm.id = commission_model_id AND cm.is_active = true)
);

-- Part 5: commercial_commissions
CREATE TABLE public.commercial_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commercial_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  commission_model_id uuid NOT NULL REFERENCES public.commission_models(id),
  reference_month date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz NULL
);

CREATE INDEX idx_cc_commercial ON public.commercial_commissions(commercial_id);
CREATE INDEX idx_cc_business ON public.commercial_commissions(business_id);
CREATE INDEX idx_cc_status ON public.commercial_commissions(status);
CREATE INDEX idx_cc_month ON public.commercial_commissions(reference_month);

ALTER TABLE public.commercial_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all commissions" ON public.commercial_commissions FOR ALL USING (is_admin());
CREATE POLICY "Commercial users can view own commissions" ON public.commercial_commissions FOR SELECT USING (commercial_id = auth.uid());
