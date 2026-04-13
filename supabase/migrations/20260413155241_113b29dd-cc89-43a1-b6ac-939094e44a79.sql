
-- Add tier column
ALTER TABLE public.commercial_plans
ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free';

-- Populate based on plan names
UPDATE public.commercial_plans SET tier = 'pro'
WHERE (name ILIKE '%pro%' OR name ILIKE '%pioneiro%' OR name ILIKE '%destaque%' OR name ILIKE '%fundador%')
  AND name NOT ILIKE '%studio%';

UPDATE public.commercial_plans SET tier = 'start'
WHERE name ILIKE '%start%';

UPDATE public.commercial_plans SET tier = 'addon'
WHERE name ILIKE '%studio%';

-- Free stays as default for price=0 plans already
