
-- 1. New enums for subscription system
CREATE TYPE public.subscription_plan_tipo AS ENUM ('free', '1_month', '3_months', '6_months', '1_year');
CREATE TYPE public.subscription_status_tipo AS ENUM ('inactive', 'active', 'expired');

-- 2. New table: subcategories
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique slug per category
CREATE UNIQUE INDEX idx_subcategories_slug ON public.subcategories(slug);

-- Enable RLS
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- RLS policies for subcategories (same pattern as categories)
CREATE POLICY "Anyone can view active subcategories"
  ON public.subcategories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all subcategories"
  ON public.subcategories FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can create subcategories"
  ON public.subcategories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update subcategories"
  ON public.subcategories FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete subcategories"
  ON public.subcategories FOR DELETE
  USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_subcategories_updated_at
  BEFORE UPDATE ON public.subcategories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add subcategory_id and subscription fields to businesses
ALTER TABLE public.businesses 
  ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  ADD COLUMN subscription_plan subscription_plan_tipo NOT NULL DEFAULT 'free',
  ADD COLUMN subscription_price NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN subscription_start_date DATE,
  ADD COLUMN subscription_end_date DATE,
  ADD COLUMN subscription_status subscription_status_tipo NOT NULL DEFAULT 'inactive';

-- Index for subscription expiry checks
CREATE INDEX idx_businesses_subscription_end ON public.businesses(subscription_end_date) 
  WHERE subscription_status = 'active';

-- Index for subcategory filtering
CREATE INDEX idx_businesses_subcategory ON public.businesses(subcategory_id);

-- 4. Seed subcategories for existing categories
-- Restaurantes
INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Pizzarias', 'pizzarias', 'Encontre as melhores pizzarias na sua zona', id, 1
FROM public.categories WHERE slug = 'restaurantes';

INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Sushi', 'sushi', 'Sushi fresco entregue em sua casa', id, 2
FROM public.categories WHERE slug = 'restaurantes';

INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Hambúrgueres', 'hamburgueres', 'Os melhores hambúrgueres da zona', id, 3
FROM public.categories WHERE slug = 'restaurantes';

INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Comida Tradicional', 'comida-tradicional', 'Sabores tradicionais portugueses', id, 4
FROM public.categories WHERE slug = 'restaurantes';

-- Serviços
INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Canalização', 'canalizacao', 'Problemas com canos? Encontre um canalizador', id, 1
FROM public.categories WHERE slug = 'servicos';

INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Eletricidade', 'eletricidade', 'Serviços elétricos de confiança', id, 2
FROM public.categories WHERE slug = 'servicos';

INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Pintura', 'pintura', 'Pintores profissionais para a sua casa', id, 3
FROM public.categories WHERE slug = 'servicos';

-- Lojas
INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Roupa', 'roupa', 'Lojas de roupa e moda', id, 1
FROM public.categories WHERE slug = 'lojas';

INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Tecnologia', 'tecnologia', 'Eletrónicos e gadgets', id, 2
FROM public.categories WHERE slug = 'lojas';

-- Materiais de Construção
INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Tintas', 'tintas', 'Tintas e materiais de pintura', id, 1
FROM public.categories WHERE slug = 'materiais-de-construcao';

INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Ferramentas', 'ferramentas', 'Ferramentas profissionais', id, 2
FROM public.categories WHERE slug = 'materiais-de-construcao';

-- Beleza
INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Barbearias', 'barbearias', 'Cortes de cabelo e barba profissionais', id, 1
FROM public.categories WHERE slug = 'beleza';

INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Cabeleireiros', 'cabeleireiros', 'Cabeleireiros para todos os estilos', id, 2
FROM public.categories WHERE slug = 'beleza';

INSERT INTO public.subcategories (name, slug, description, category_id, display_order)
SELECT 'Estética', 'estetica', 'Tratamentos de beleza e estética', id, 3
FROM public.categories WHERE slug = 'beleza';
