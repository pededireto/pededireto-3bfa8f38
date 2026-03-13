-- Junction table para múltiplas categorias por negócio
CREATE TABLE IF NOT EXISTS public.business_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_id, category_id)
);

-- Índices
CREATE INDEX business_categories_business_id_idx ON public.business_categories(business_id);
CREATE INDEX business_categories_category_id_idx ON public.business_categories(category_id);

-- RLS
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "business_categories_public_read"
  ON public.business_categories FOR SELECT
  USING (true);

-- Escrita: owner do negócio (via business_users) ou admin
CREATE POLICY "business_categories_owner_or_admin_write"
  ON public.business_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users bu
      WHERE bu.business_id = business_categories.business_id
        AND bu.user_id = public.get_my_profile_id()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Backfill: cada negócio com category_id ganha entrada is_primary = true
INSERT INTO public.business_categories (business_id, category_id, is_primary)
SELECT id, category_id, true
FROM public.businesses
WHERE category_id IS NOT NULL
ON CONFLICT (business_id, category_id) DO NOTHING;

-- Trigger: sincronizar businesses.category_id quando a primária muda
CREATE OR REPLACE FUNCTION sync_primary_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.business_categories
    SET is_primary = false
    WHERE business_id = NEW.business_id
      AND id != NEW.id
      AND is_primary = true;

    UPDATE public.businesses
    SET category_id = NEW.category_id
    WHERE id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_primary_category
AFTER INSERT OR UPDATE OF is_primary
ON public.business_categories
FOR EACH ROW
EXECUTE FUNCTION sync_primary_category();