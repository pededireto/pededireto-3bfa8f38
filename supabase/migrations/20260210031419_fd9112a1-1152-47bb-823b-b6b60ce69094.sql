
-- Move unaccent extension from public to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- Recreate wrapper functions in public that reference extensions schema
CREATE OR REPLACE FUNCTION public.unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
SET search_path = 'extensions'
AS $$
  SELECT extensions.unaccent($1);
$$;
