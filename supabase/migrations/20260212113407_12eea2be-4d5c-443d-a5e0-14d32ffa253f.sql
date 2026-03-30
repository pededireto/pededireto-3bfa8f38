-- Garantir que colunas existem antes das politicas
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_email text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_phone text;


-- ============================================================
-- Part A: business_highlights
-- ============================================================
CREATE TABLE public.business_highlights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  level text NOT NULL,
  category_id uuid NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id uuid NULL REFERENCES public.subcategories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  start_date timestamptz NULL,
  end_date timestamptz NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger instead of CHECK constraints for level logic
CREATE OR REPLACE FUNCTION public.validate_business_highlight()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.level NOT IN ('super', 'category', 'subcategory') THEN
    RAISE EXCEPTION 'Invalid highlight level: %', NEW.level;
  END IF;
  IF NEW.level = 'super' AND (NEW.category_id IS NOT NULL OR NEW.subcategory_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Super highlights must not have category_id or subcategory_id';
  END IF;
  IF NEW.level = 'category' AND NEW.category_id IS NULL THEN
    RAISE EXCEPTION 'Category highlights require category_id';
  END IF;
  IF NEW.level = 'subcategory' AND NEW.subcategory_id IS NULL THEN
    RAISE EXCEPTION 'Subcategory highlights require subcategory_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_highlight_before_insert_update
  BEFORE INSERT OR UPDATE ON public.business_highlights
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_highlight();

CREATE INDEX idx_bh_business_id ON public.business_highlights(business_id);
CREATE INDEX idx_bh_level ON public.business_highlights(level);
CREATE INDEX idx_bh_category_id ON public.business_highlights(category_id);
CREATE INDEX idx_bh_subcategory_id ON public.business_highlights(subcategory_id);
CREATE INDEX idx_bh_is_active ON public.business_highlights(is_active);

ALTER TABLE public.business_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active highlights"
  ON public.business_highlights FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all highlights"
  ON public.business_highlights FOR ALL
  USING (is_admin());

CREATE TRIGGER update_business_highlights_updated_at
  BEFORE UPDATE ON public.business_highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Part B: homepage_blocks
-- ============================================================
CREATE TABLE public.homepage_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  title text NULL,
  config jsonb NULL,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  start_date timestamptz NULL,
  end_date timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_homepage_block_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.type NOT IN ('hero','categorias','super_destaques','destaques','negocios_premium','banner','texto','personalizado','featured_categories') THEN
    RAISE EXCEPTION 'Invalid homepage block type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_homepage_block_type_trigger
  BEFORE INSERT OR UPDATE ON public.homepage_blocks
  FOR EACH ROW EXECUTE FUNCTION public.validate_homepage_block_type();

ALTER TABLE public.homepage_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active homepage blocks"
  ON public.homepage_blocks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all homepage blocks"
  ON public.homepage_blocks FOR ALL
  USING (is_admin());

CREATE TRIGGER update_homepage_blocks_updated_at
  BEFORE UPDATE ON public.homepage_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with current layout
INSERT INTO public.homepage_blocks (type, title, order_index) VALUES
  ('hero', NULL, 0),
  ('super_destaques', 'Super Destaques', 1),
  ('featured_categories', 'Categorias em Destaque', 2),
  ('categorias', 'Categorias', 3),
  ('destaques', 'Em Destaque', 4);

-- ============================================================
-- Part C: plan_rules
-- ============================================================
CREATE TABLE public.plan_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL UNIQUE REFERENCES public.commercial_plans(id) ON DELETE CASCADE,
  max_gallery_images integer NULL,
  max_modules integer NULL,
  allow_video boolean NOT NULL DEFAULT false,
  allow_category_highlight boolean NOT NULL DEFAULT false,
  allow_super_highlight boolean NOT NULL DEFAULT false,
  allow_premium_block boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan rules"
  ON public.plan_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage plan rules"
  ON public.plan_rules FOR ALL
  USING (is_admin());

CREATE TRIGGER update_plan_rules_updated_at
  BEFORE UPDATE ON public.plan_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Part D: business_notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_business_notification_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.type NOT IN ('request', 'system', 'plan', 'highlight') THEN
    RAISE EXCEPTION 'Invalid notification type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_notification_type_trigger
  BEFORE INSERT OR UPDATE ON public.business_notifications
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_notification_type();

CREATE INDEX idx_bn_business_id ON public.business_notifications(business_id);
CREATE INDEX idx_bn_is_read ON public.business_notifications(is_read);

ALTER TABLE public.business_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all notifications"
  ON public.business_notifications FOR ALL
  USING (is_admin());

-- Commercial users can view notifications for their businesses
CREATE POLICY "Commercial users can view own notifications"
  ON public.business_notifications FOR SELECT
  USING (
    is_commercial() AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_notifications.business_id
        AND b.owner_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- Commercial users can mark as read
CREATE POLICY "Commercial users can update own notifications"
  ON public.business_notifications FOR UPDATE
  USING (
    is_commercial() AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_notifications.business_id
        AND b.owner_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- Add site_settings keys for highlights config
INSERT INTO public.site_settings (key, value) VALUES
  ('highlights_super_limit', '6'),
  ('highlights_category_limit', '3'),
  ('highlights_subcategory_limit', '3'),
  ('highlights_sort_method', 'manual'),
  ('highlights_filter_by_date', 'false')
ON CONFLICT (key) DO NOTHING;


