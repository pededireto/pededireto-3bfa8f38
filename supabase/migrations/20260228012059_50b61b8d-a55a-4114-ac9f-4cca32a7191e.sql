
-- =============================================
-- BLOCO 1: business_badge_progress + RPC
-- =============================================

-- Tabela de progresso de badges
CREATE TABLE IF NOT EXISTS public.business_badge_progress (
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.business_badges(id) ON DELETE CASCADE,
  current_value integer NOT NULL DEFAULT 0,
  target_value integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, badge_id)
);

ALTER TABLE public.business_badge_progress ENABLE ROW LEVEL SECURITY;

-- RLS: membros do negócio podem ler
CREATE POLICY "Members can view badge progress"
  ON public.business_badge_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users bu
      WHERE bu.business_id = business_badge_progress.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- RPC para calcular progresso
CREATE OR REPLACE FUNCTION public.compute_badge_progress(p_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _badge RECORD;
  _val integer;
  _target integer;
BEGIN
  -- Verificar que o chamador é membro
  IF NOT EXISTS (
    SELECT 1 FROM business_users WHERE business_id = p_business_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this business';
  END IF;

  FOR _badge IN
    SELECT id, criteria FROM business_badges WHERE is_active = true
  LOOP
    _target := COALESCE((_badge.criteria->>'target')::integer, 0);
    _val := 0;

    CASE (_badge.criteria->>'type')
      WHEN 'views' THEN
        SELECT COUNT(*) INTO _val
        FROM analytics_events
        WHERE business_id = p_business_id AND event_type = 'view';
      WHEN 'contacts' THEN
        SELECT COUNT(*) INTO _val
        FROM analytics_events
        WHERE business_id = p_business_id AND event_type LIKE 'click_%';
      WHEN 'requests' THEN
        SELECT COUNT(*) INTO _val
        FROM request_business_matches
        WHERE business_id = p_business_id;
      WHEN 'reviews' THEN
        SELECT COALESCE(total_reviews, 0) INTO _val
        FROM business_review_stats
        WHERE business_id = p_business_id;
      WHEN 'rating' THEN
        SELECT COALESCE(FLOOR(average_rating * 10)::integer, 0) INTO _val
        FROM business_review_stats
        WHERE business_id = p_business_id;
      ELSE
        _val := 0;
    END CASE;

    INSERT INTO business_badge_progress (business_id, badge_id, current_value, target_value, updated_at)
    VALUES (p_business_id, _badge.id, _val, _target, now())
    ON CONFLICT (business_id, badge_id)
    DO UPDATE SET current_value = EXCLUDED.current_value, target_value = EXCLUDED.target_value, updated_at = now();
  END LOOP;
END;
$$;
