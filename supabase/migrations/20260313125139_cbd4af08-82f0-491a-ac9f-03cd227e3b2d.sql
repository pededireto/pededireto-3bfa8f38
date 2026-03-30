
-- Set DB defaults to false for all visibility toggles
ALTER TABLE public.businesses ALTER COLUMN show_whatsapp SET DEFAULT false;
ALTER TABLE public.businesses ALTER COLUMN show_gallery SET DEFAULT false;
ALTER TABLE public.businesses ALTER COLUMN show_schedule SET DEFAULT false;
