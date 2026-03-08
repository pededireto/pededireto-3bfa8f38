CREATE OR REPLACE FUNCTION validate_homepage_block_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type NOT IN ('hero','categorias','super_destaques','destaques','negocios_premium','banner','texto','personalizado','featured_categories','categorias_accordion','novos_negocios','platform_stats','how_it_works','business_cta') THEN
    RAISE EXCEPTION 'Invalid homepage block type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Seed new blocks
INSERT INTO homepage_blocks (type, title, is_active, order_index, config) VALUES
  ('platform_stats', 'Números da Plataforma', true, 1, '{}'),
  ('how_it_works', 'Como Funciona', true, 4, '{}'),
  ('business_cta', 'CTA para Negócios', true, 7, '{}');

-- Reorder existing blocks
UPDATE homepage_blocks SET order_index = 0 WHERE type = 'hero';
UPDATE homepage_blocks SET order_index = 2 WHERE type = 'featured_categories';
UPDATE homepage_blocks SET order_index = 3 WHERE type = 'super_destaques';
UPDATE homepage_blocks SET order_index = 5 WHERE type = 'categorias' AND title = 'Categorias';
UPDATE homepage_blocks SET order_index = 6 WHERE type = 'destaques';
UPDATE homepage_blocks SET order_index = 8 WHERE type = 'novos_negocios';