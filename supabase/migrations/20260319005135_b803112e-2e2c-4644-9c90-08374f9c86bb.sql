
-- Step 1: Add email_confirmed_at to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz;

-- Step 2: Drop the problematic view that references auth.users
DROP VIEW IF EXISTS public.profiles_with_confirmation;

-- Step 3: Recreate view using ONLY public.profiles (no auth.users reference)
CREATE OR REPLACE VIEW public.profiles_with_confirmation AS
SELECT
  id,
  user_id,
  email,
  full_name,
  phone,
  address,
  status,
  last_activity_at,
  created_at,
  updated_at,
  email_confirmed_at
FROM public.profiles;
