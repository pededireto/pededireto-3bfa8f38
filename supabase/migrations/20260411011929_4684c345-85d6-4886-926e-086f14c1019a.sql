
CREATE OR REPLACE FUNCTION public.validate_homepage_block_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.type NOT IN (
    'hero',
    'platform_stats',
    'categorias',
    'how_it_works',
    'dual_cta',
    'servicos_rapidos',
    'social_proof',
    'banner',
    'business_cta',
    'novos_negocios',
    'texto',
    'super_destaques',
    'featured_categories',
    'categorias_accordion',
    'negocios_premium',
    'destaques',
    'personalizado'
  ) THEN
    RAISE EXCEPTION 'Invalid block type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;
