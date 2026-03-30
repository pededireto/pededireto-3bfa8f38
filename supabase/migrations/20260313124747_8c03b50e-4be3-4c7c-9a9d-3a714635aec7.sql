
-- 1. Change column default to false
ALTER TABLE public.businesses ALTER COLUMN show_social SET DEFAULT false;

-- 2. Set show_social = false for all FREE businesses (no active paid plan)
UPDATE public.businesses
SET show_social = false
WHERE show_social IS NOT false
  AND (subscription_plan IS NULL OR subscription_plan = 'free')
  AND (subscription_status IS NULL OR subscription_status != 'active');
