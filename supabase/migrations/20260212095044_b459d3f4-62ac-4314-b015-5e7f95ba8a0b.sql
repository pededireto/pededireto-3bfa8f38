
-- ============================================
-- Business Modules: dynamic field definitions
-- ============================================
CREATE TABLE public.business_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  section TEXT NOT NULL,
  is_public_default BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  plan_restriction TEXT NULL,
  options JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_modules_type_check CHECK (type IN ('text','textarea','url','image','gallery','video','boolean','select'))
);

CREATE INDEX idx_business_modules_section ON public.business_modules(section);
CREATE INDEX idx_business_modules_is_active ON public.business_modules(is_active);
CREATE INDEX idx_business_modules_order_index ON public.business_modules(order_index);

-- ============================================
-- Business Module Values: per-business data
-- ============================================
CREATE TABLE public.business_module_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.business_modules(id) ON DELETE CASCADE,
  value TEXT,
  value_json JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_module_values_unique UNIQUE(business_id, module_id)
);

CREATE INDEX idx_business_module_values_business ON public.business_module_values(business_id);
CREATE INDEX idx_business_module_values_module ON public.business_module_values(module_id);

-- ============================================
-- Triggers: auto-update updated_at
-- ============================================
CREATE TRIGGER update_business_modules_updated_at
  BEFORE UPDATE ON public.business_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_module_values_updated_at
  BEFORE UPDATE ON public.business_module_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS: business_modules
-- ============================================
ALTER TABLE public.business_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active modules"
  ON public.business_modules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all modules"
  ON public.business_modules FOR ALL
  USING (is_admin());

CREATE POLICY "Commercial users can view active modules"
  ON public.business_modules FOR SELECT
  USING (is_commercial() AND is_active = true);

-- ============================================
-- RLS: business_module_values
-- ============================================
ALTER TABLE public.business_module_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public module values"
  ON public.business_module_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_modules bm
      WHERE bm.id = module_id
        AND bm.is_active = true
        AND bm.is_public_default = true
    )
  );

CREATE POLICY "Admins can manage all module values"
  ON public.business_module_values FOR ALL
  USING (is_admin());

CREATE POLICY "Commercial users can view module values for their businesses"
  ON public.business_module_values FOR SELECT
  USING (is_commercial());

CREATE POLICY "Commercial users can insert module values"
  ON public.business_module_values FOR INSERT
  WITH CHECK (is_commercial());

CREATE POLICY "Commercial users can update module values"
  ON public.business_module_values FOR UPDATE
  USING (is_commercial());
