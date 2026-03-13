
-- Junction table para múltiplas cidades por negócio
CREATE TABLE IF NOT EXISTS public.business_cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  city_name   TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, city_name)
);

-- RLS
ALTER TABLE public.business_cities ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "business_cities_public_read"
  ON public.business_cities FOR SELECT
  USING (true);

-- Escrita: authenticated users (owner check via app layer)
CREATE POLICY "business_cities_authenticated_write"
  ON public.business_cities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices
CREATE INDEX business_cities_business_id_idx ON public.business_cities(business_id);
CREATE INDEX business_cities_city_name_idx ON public.business_cities(city_name);

-- Trigger: sync is_primary → businesses.city
CREATE OR REPLACE FUNCTION sync_primary_city()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Garantir que só existe uma primária por negócio
    UPDATE public.business_cities
    SET is_primary = false
    WHERE business_id = NEW.business_id
      AND id != NEW.id
      AND is_primary = true;

    -- Sincronizar businesses.city
    UPDATE public.businesses
    SET city = NEW.city_name
    WHERE id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_primary_city
AFTER INSERT OR UPDATE OF is_primary
ON public.business_cities
FOR EACH ROW
EXECUTE FUNCTION sync_primary_city();

-- Backfill: negócios com cidade simples (sem separadores)
INSERT INTO public.business_cities (business_id, city_name, is_primary)
SELECT id, TRIM(city), true
FROM public.businesses
WHERE city IS NOT NULL
  AND city != ''
  AND city NOT LIKE '%|%'
  AND city NOT LIKE '%,%'
ON CONFLICT (business_id, city_name) DO NOTHING;

-- Backfill: negócios com separadores (| ou ,)
-- Usa uma CTE para fazer split e inserir cada cidade
WITH split_cities AS (
  SELECT
    b.id AS business_id,
    TRIM(unnest(string_to_array(REPLACE(b.city, '|', ','), ','))) AS city_name,
    ROW_NUMBER() OVER (PARTITION BY b.id ORDER BY (SELECT NULL)) AS rn
  FROM public.businesses b
  WHERE b.city IS NOT NULL
    AND b.city != ''
    AND (b.city LIKE '%|%' OR (b.city LIKE '%,%' AND b.city LIKE '% | %'))
)
INSERT INTO public.business_cities (business_id, city_name, is_primary)
SELECT business_id, city_name, (rn = 1) AS is_primary
FROM split_cities
WHERE city_name != ''
ON CONFLICT (business_id, city_name) DO NOTHING;

-- Actualizar businesses.city dos negócios com separadores para conter apenas a cidade primária
UPDATE public.businesses b
SET city = bc.city_name
FROM public.business_cities bc
WHERE bc.business_id = b.id
  AND bc.is_primary = true
  AND (b.city LIKE '%|%' OR (b.city LIKE '%,%' AND b.city LIKE '% | %'));
