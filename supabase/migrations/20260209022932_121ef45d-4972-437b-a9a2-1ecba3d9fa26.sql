
-- 1. Commercial Status enum and column
CREATE TYPE public.commercial_status_tipo AS ENUM ('nao_contactado', 'contactado', 'interessado', 'cliente');

ALTER TABLE public.businesses 
  ADD COLUMN commercial_status public.commercial_status_tipo NOT NULL DEFAULT 'nao_contactado';

-- 2. Premium Level enum and column
CREATE TYPE public.premium_level_tipo AS ENUM ('SUPER', 'CATEGORIA', 'SUBCATEGORIA');

ALTER TABLE public.businesses 
  ADD COLUMN premium_level public.premium_level_tipo NULL;

-- 3. Business Contact Logs table (CRM)
CREATE TABLE public.business_contact_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tipo_contacto TEXT NOT NULL CHECK (tipo_contacto IN ('telefone', 'email', 'whatsapp', 'outro')),
  nota TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_contact_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contact logs" ON public.business_contact_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create contact logs" ON public.business_contact_logs
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete contact logs" ON public.business_contact_logs
  FOR DELETE USING (public.is_admin());

-- 4. Search Synonyms table
CREATE TABLE public.search_synonyms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  termo TEXT NOT NULL,
  equivalente TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view synonyms" ON public.search_synonyms
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage synonyms" ON public.search_synonyms
  FOR ALL USING (public.is_admin());

-- Seed common Portuguese synonyms
INSERT INTO public.search_synonyms (termo, equivalente) VALUES
  ('eletricista', 'electricista'),
  ('electricista', 'eletricista'),
  ('farmacia', 'farmácia'),
  ('farmácia', 'farmacia'),
  ('canalizador', 'picheleiro'),
  ('picheleiro', 'canalizador'),
  ('medico', 'médico'),
  ('médico', 'medico'),
  ('pediatra', 'médico infantil'),
  ('mecanico', 'mecânico'),
  ('mecânico', 'mecanico'),
  ('restaurante', 'restaurantes'),
  ('restaurantes', 'restaurante'),
  ('padaria', 'padarias'),
  ('padarias', 'padaria'),
  ('loja', 'lojas'),
  ('lojas', 'loja'),
  ('servico', 'serviço'),
  ('serviço', 'servico'),
  ('servicos', 'serviços'),
  ('serviços', 'servicos'),
  ('advogado', 'advogados'),
  ('advogados', 'advogado'),
  ('dentista', 'dentistas'),
  ('dentistas', 'dentista'),
  ('pintor', 'pintores'),
  ('pintores', 'pintor'),
  ('carpinteiro', 'carpinteiros'),
  ('carpinteiros', 'carpinteiro'),
  ('bombeiro', 'bombeiros'),
  ('bombeiros', 'bombeiro');

-- 5. Site Settings table (key-value store for global config)
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL USING (public.is_admin());

-- Seed default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'Pede Direto'),
  ('site_description', 'Encontre rapidamente o contacto que resolve o seu problema.'),
  ('logo_url', NULL),
  ('mascot_url', NULL),
  ('mascot_enabled', 'true'),
  ('footer_email', 'info@pededireto.pt'),
  ('footer_phone', NULL),
  ('footer_text', NULL),
  ('footer_facebook', NULL),
  ('footer_instagram', NULL),
  ('footer_twitter', NULL),
  ('footer_linkedin', NULL),
  ('footer_youtube', NULL),
  ('super_highlights_enabled', 'true'),
  ('super_highlights_limit', '6'),
  ('category_highlights_limit', '3'),
  ('emergency_categories', 'Serviços,Saúde,Energia,Transportes');

-- 6. Institutional Pages table
CREATE TABLE public.institutional_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.institutional_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pages" ON public.institutional_pages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all pages" ON public.institutional_pages
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage pages" ON public.institutional_pages
  FOR ALL USING (public.is_admin());

-- Seed default institutional pages
INSERT INTO public.institutional_pages (slug, title, content, display_order) VALUES
  ('quem-somos', 'Quem Somos', '<h2>Sobre o Pede Direto</h2><p>O Pede Direto é uma plataforma que conecta pessoas a negócios e serviços locais de forma rápida e direta.</p>', 1),
  ('publicidade', 'Publicidade', '<h2>Anuncie Connosco</h2><p>Destaque o seu negócio e alcance mais clientes na sua região.</p>', 2),
  ('gestao', 'Gestão', '<h2>Gestão da Plataforma</h2><p>Informações sobre a gestão e operação do Pede Direto.</p>', 3);

-- Create trigger for institutional_pages updated_at
CREATE TRIGGER update_institutional_pages_updated_at
  BEFORE UPDATE ON public.institutional_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for site_settings updated_at  
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enhanced search function with synonyms support
CREATE OR REPLACE FUNCTION public.search_businesses_and_subcategories(search_term text)
RETURNS TABLE(result_type text, result_id uuid, result_name text, result_slug text, category_name text, category_slug text, relevance integer)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  normalized_term text;
  expanded_terms text[];
  syn_term text;
BEGIN
  normalized_term := lower(unaccent(search_term));
  
  -- Build expanded terms array from synonyms
  expanded_terms := ARRAY[normalized_term];
  FOR syn_term IN 
    SELECT lower(unaccent(ss.equivalente)) 
    FROM search_synonyms ss 
    WHERE lower(unaccent(ss.termo)) = normalized_term
  LOOP
    expanded_terms := array_append(expanded_terms, syn_term);
  END LOOP;

  -- Search subcategories (prioritized)
  RETURN QUERY
  SELECT
    'subcategory'::text as result_type,
    s.id as result_id,
    s.name as result_name,
    s.slug as result_slug,
    c.name as category_name,
    c.slug as category_slug,
    CASE
      WHEN lower(unaccent(s.name)) = ANY(expanded_terms) THEN 1
      WHEN EXISTS (SELECT 1 FROM unnest(expanded_terms) t WHERE lower(unaccent(s.name)) LIKE t || '%') THEN 2
      WHEN EXISTS (SELECT 1 FROM unnest(expanded_terms) t WHERE lower(unaccent(s.name)) LIKE '%' || t || '%') THEN 3
      ELSE 4
    END as relevance
  FROM subcategories s
  JOIN categories c ON c.id = s.category_id
  WHERE s.is_active = true
    AND c.is_active = true
    AND EXISTS (
      SELECT 1 FROM unnest(expanded_terms) t 
      WHERE lower(unaccent(s.name)) LIKE '%' || t || '%'
        OR lower(unaccent(COALESCE(s.description, ''))) LIKE '%' || t || '%'
    );

  -- Search businesses
  RETURN QUERY
  SELECT
    'business'::text as result_type,
    b.id as result_id,
    b.name as result_name,
    b.slug as result_slug,
    c.name as category_name,
    c.slug as category_slug,
    CASE
      WHEN lower(unaccent(b.name)) = ANY(expanded_terms) THEN 1
      WHEN EXISTS (SELECT 1 FROM unnest(expanded_terms) t WHERE lower(unaccent(b.name)) LIKE t || '%') THEN 2
      WHEN EXISTS (SELECT 1 FROM unnest(expanded_terms) t WHERE lower(unaccent(b.name)) LIKE '%' || t || '%') THEN 3
      ELSE 5
    END as relevance
  FROM businesses b
  LEFT JOIN categories c ON c.id = b.category_id
  WHERE b.is_active = true
    AND EXISTS (
      SELECT 1 FROM unnest(expanded_terms) t 
      WHERE lower(unaccent(b.name)) LIKE '%' || t || '%'
        OR lower(unaccent(COALESCE(b.description, ''))) LIKE '%' || t || '%'
        OR lower(unaccent(COALESCE(c.name, ''))) LIKE '%' || t || '%'
    );

  RETURN;
END;
$function$;

-- Create storage bucket for site assets (logos, mascot)
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view site assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());

CREATE POLICY "Admins can update site assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-assets' AND public.is_admin());

CREATE POLICY "Admins can delete site assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-assets' AND public.is_admin());
