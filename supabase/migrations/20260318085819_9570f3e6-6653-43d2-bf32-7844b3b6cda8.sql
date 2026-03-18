
-- 1. Create benchmarking_cache table
CREATE TABLE public.benchmarking_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  subcategory text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  hit_count integer NOT NULL DEFAULT 0,
  last_hit_at timestamptz,
  renewed_by text NOT NULL DEFAULT 'lazy',
  UNIQUE(category, subcategory)
);

ALTER TABLE public.benchmarking_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active cache
CREATE POLICY "Anyone can read active cache"
  ON public.benchmarking_cache
  FOR SELECT
  TO authenticated
  USING (expires_at > now());

-- Allow anon to read too (edge functions use service_role for writes)
CREATE POLICY "Anon can read active cache"
  ON public.benchmarking_cache
  FOR SELECT
  TO anon
  USING (expires_at > now());

-- 2. Trigger on profiles for admin notifications on new user registration
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.internal_notifications (type, target_role, title, message)
  VALUES (
    'new_user',
    'admin',
    'Novo utilizador registado',
    COALESCE(NEW.full_name, 'Sem nome') || ' (' || COALESCE(NEW.email, 'sem email') || ') registou-se na plataforma.'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();

-- 3. Enable realtime for internal_notifications if not already
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_notifications;
