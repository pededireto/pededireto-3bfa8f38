
-- 1. Histórico de ranking semanal
CREATE TABLE public.business_ranking_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL,
  position integer,
  subcategory_id uuid,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(business_id, snapshot_date)
);

CREATE INDEX idx_ranking_snapshots_business ON public.business_ranking_snapshots(business_id, snapshot_date DESC);

ALTER TABLE public.business_ranking_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage snapshots"
  ON public.business_ranking_snapshots FOR ALL
  USING (public.is_admin());

CREATE POLICY "Owners can view own snapshots"
  ON public.business_ranking_snapshots FOR SELECT
  USING (business_id IN (
    SELECT bu.business_id FROM business_users bu
    WHERE bu.user_id = (SELECT p.id FROM profiles p WHERE p.user_id = auth.uid())
  ));

-- 2. Preferências de email
CREATE TABLE public.business_email_preferences (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  weekly_digest boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own preferences"
  ON public.business_email_preferences FOR ALL
  USING (business_id IN (
    SELECT bu.business_id FROM business_users bu
    WHERE bu.user_id = (SELECT p.id FROM profiles p WHERE p.user_id = auth.uid())
  ));

CREATE POLICY "Admins can manage all preferences"
  ON public.business_email_preferences FOR ALL
  USING (public.is_admin());

-- 3. Function to save daily ranking snapshots
CREATE OR REPLACE FUNCTION public.save_ranking_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO business_ranking_snapshots (business_id, score, position, subcategory_id, snapshot_date)
  SELECT
    b.id,
    b.ranking_score,
    ROW_NUMBER() OVER (
      PARTITION BY b.subcategory_id
      ORDER BY b.ranking_score DESC
    )::integer as position,
    b.subcategory_id,
    CURRENT_DATE
  FROM businesses b
  WHERE b.is_active = true
    AND b.subcategory_id IS NOT NULL
  ON CONFLICT (business_id, snapshot_date)
  DO UPDATE SET
    score = EXCLUDED.score,
    position = EXCLUDED.position;
END;
$$;
