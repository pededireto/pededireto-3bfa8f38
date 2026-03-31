
-- BUG 2: Update existing owner UPDATE policy to include pending_owner and manager roles
DROP POLICY IF EXISTS "Owner can update own business" ON public.businesses;

CREATE POLICY "Owner can update own business"
ON public.businesses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_users bu
    WHERE bu.business_id = businesses.id
    AND bu.user_id = public.get_my_profile_id()
    AND bu.role IN ('owner', 'pending_owner', 'manager')
  )
);

-- BUG 3: Create pending_registrations table
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own pending registration"
ON public.pending_registrations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own pending registration"
ON public.pending_registrations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own pending registration"
ON public.pending_registrations FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Anon can insert pending registration"
ON public.pending_registrations FOR INSERT
TO anon
WITH CHECK (true);
