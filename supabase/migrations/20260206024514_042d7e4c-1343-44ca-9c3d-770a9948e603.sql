-- =====================================================
-- PEDE DIRETO: Nova estrutura multi-negócio
-- =====================================================

-- Enum para tipo de alcance geográfico
CREATE TYPE public.alcance_tipo AS ENUM ('local', 'nacional', 'hibrido');

-- =====================================================
-- 1. TABELA DE CATEGORIAS (substitui zones)
-- =====================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT, -- Descrição orientada a problemas
  icon TEXT, -- Nome do ícone (lucide)
  image_url TEXT,
  alcance_default alcance_tipo DEFAULT 'local',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active categories" 
ON public.categories FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all categories" 
ON public.categories FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can create categories" 
ON public.categories FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories" 
ON public.categories FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete categories" 
ON public.categories FOR DELETE 
USING (is_admin());

-- Trigger updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2. TABELA DE NEGÓCIOS (substitui restaurants)
-- =====================================================
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT, -- Descrição orientada à solução
  logo_url TEXT,
  images TEXT[] DEFAULT '{}',
  
  -- Localização
  city TEXT,
  zone TEXT,
  alcance alcance_tipo DEFAULT 'local',
  coordinates JSONB, -- Para futuro: {lat, lng}
  
  -- Horários
  schedule_weekdays TEXT,
  schedule_weekend TEXT,
  
  -- Contactos (CTAs)
  cta_website TEXT,
  cta_whatsapp TEXT,
  cta_phone TEXT,
  cta_email TEXT,
  cta_app TEXT,
  
  -- Monetização futura
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active businesses" 
ON public.businesses FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all businesses" 
ON public.businesses FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can create businesses" 
ON public.businesses FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update businesses" 
ON public.businesses FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete businesses" 
ON public.businesses FOR DELETE 
USING (is_admin());

-- Trigger updated_at
CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_businesses_category ON public.businesses(category_id);
CREATE INDEX idx_businesses_city ON public.businesses(city);
CREATE INDEX idx_businesses_featured ON public.businesses(is_featured) WHERE is_featured = true;

-- =====================================================
-- 3. TABELA DE ANALYTICS (views e cliques)
-- =====================================================
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'view', 'click_whatsapp', 'click_phone', 'click_website', 'click_email'
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (anonymous tracking)
CREATE POLICY "Anyone can create analytics events" 
ON public.analytics_events FOR INSERT 
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view analytics" 
ON public.analytics_events FOR SELECT 
USING (is_admin());

-- Index for analytics queries
CREATE INDEX idx_analytics_business ON public.analytics_events(business_id);
CREATE INDEX idx_analytics_category ON public.analytics_events(category_id);
CREATE INDEX idx_analytics_created ON public.analytics_events(created_at);

-- =====================================================
-- 4. INSERIR CATEGORIAS INICIAIS
-- =====================================================
INSERT INTO public.categories (name, slug, description, icon, alcance_default, display_order) VALUES
('Restaurantes', 'restaurantes', 'Fome? Encontre restaurantes que entregam na sua zona.', 'UtensilsCrossed', 'local', 1),
('Serviços', 'servicos', 'Precisa de um profissional? Canalizadores, eletricistas e mais.', 'Wrench', 'local', 2),
('Lojas', 'lojas', 'Procura produtos? Descubra lojas perto de si.', 'Store', 'hibrido', 3),
('Materiais de Construção', 'materiais-construcao', 'A construir ou renovar? Encontre fornecedores de materiais.', 'Hammer', 'hibrido', 4),
('Beleza & Bem-estar', 'beleza-bem-estar', 'Cuidar de si? Barbearias, cabeleireiros e spas.', 'Scissors', 'local', 5);