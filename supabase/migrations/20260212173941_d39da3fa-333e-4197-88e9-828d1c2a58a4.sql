
-- 1.1 Expandir enum app_role (migração separada)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cs';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'onboarding';

-- 1.2 Criar enum revenue_event_type
DO $$ BEGIN
  CREATE TYPE public.revenue_event_type AS ENUM (
    'sale',
    'upsell',
    'churn_recovery',
    'reactivation',
    'downgrade',
    'refund',
    'bonus',
    'manual_adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
