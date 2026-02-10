-- Add UNIQUE constraint on site_settings.key so upsert works
ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_key_unique UNIQUE (key);