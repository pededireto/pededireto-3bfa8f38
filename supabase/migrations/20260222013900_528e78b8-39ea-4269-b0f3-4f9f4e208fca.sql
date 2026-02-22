-- Update the homepage block type validator to accept new accordion type
CREATE OR REPLACE FUNCTION public.validate_homepage_block_type()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.type NOT IN ('hero','categorias','super_destaques','destaques','negocios_premium','banner','texto','personalizado','featured_categories','categorias_accordion','novos_negocios') THEN
    RAISE EXCEPTION 'Invalid homepage block type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$function$;