
-- Commercial Plans table (manageable from backoffice)
CREATE TABLE public.commercial_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_months INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  premium_level TEXT CHECK (premium_level IN ('SUPER', 'CATEGORIA', 'SUBCATEGORIA')) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.commercial_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.commercial_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all plans" ON public.commercial_plans
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage plans" ON public.commercial_plans
  FOR ALL USING (is_admin());

-- Add plan_id to businesses
ALTER TABLE public.businesses ADD COLUMN plan_id UUID REFERENCES public.commercial_plans(id) DEFAULT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_commercial_plans_updated_at
  BEFORE UPDATE ON public.commercial_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default plans
INSERT INTO public.commercial_plans (name, price, duration_months, premium_level, display_order) VALUES
  ('Gratuito', 0, 0, NULL, 0),
  ('Básico - 1 Mês', 15, 1, NULL, 1),
  ('Destaque - 3 Meses', 40, 3, 'CATEGORIA', 2),
  ('Premium - 6 Meses', 75, 6, 'CATEGORIA', 3),
  ('Super Premium - 1 Ano', 120, 12, 'SUPER', 4);
