
-- Business Add-ons table for Marketing AI Studio subscriptions
CREATE TABLE public.business_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  addon_type text NOT NULL DEFAULT 'marketing_ai',
  activated_at date NOT NULL DEFAULT CURRENT_DATE,
  duration_months integer NOT NULL DEFAULT 1,
  is_trial boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, addon_type)
);

-- RLS
ALTER TABLE public.business_addons ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admins_full_access" ON public.business_addons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Business members can read their own add-ons
CREATE POLICY "members_read_own" ON public.business_addons
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users bu
      WHERE bu.business_id = business_addons.business_id
        AND bu.user_id = public.get_my_profile_id()
    )
  );
