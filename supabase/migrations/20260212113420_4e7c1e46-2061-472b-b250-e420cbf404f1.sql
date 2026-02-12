
-- Fix search_path on new validation functions
CREATE OR REPLACE FUNCTION public.validate_homepage_block_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.type NOT IN ('hero','categorias','super_destaques','destaques','negocios_premium','banner','texto','personalizado','featured_categories') THEN
    RAISE EXCEPTION 'Invalid homepage block type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_business_notification_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.type NOT IN ('request', 'system', 'plan', 'highlight') THEN
    RAISE EXCEPTION 'Invalid notification type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;
