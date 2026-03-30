-- Consumer badges definitions
CREATE TABLE public.consumer_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text NOT NULL DEFAULT '🏅',
  color text,
  category text NOT NULL DEFAULT 'engagement',
  criteria_type text NOT NULL,
  criteria_value integer NOT NULL DEFAULT 1,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Consumer earned badges
CREATE TABLE public.consumer_earned_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.consumer_badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Consumer badge progress
CREATE TABLE public.consumer_badge_progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.consumer_badges(id) ON DELETE CASCADE,
  current_value integer DEFAULT 0,
  target_value integer NOT NULL,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- Add user_id to analytics_events for tracking shares per user
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS user_id uuid;

-- RLS
ALTER TABLE public.consumer_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read consumer badges" ON public.consumer_badges FOR SELECT USING (true);

ALTER TABLE public.consumer_earned_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own earned badges" ON public.consumer_earned_badges
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "System insert earned badges" ON public.consumer_earned_badges
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage consumer earned badges" ON public.consumer_earned_badges
  FOR ALL USING (public.is_admin());

ALTER TABLE public.consumer_badge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own badge progress" ON public.consumer_badge_progress
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "System upsert badge progress" ON public.consumer_badge_progress
  FOR INSERT WITH CHECK (true);
CREATE POLICY "System update badge progress" ON public.consumer_badge_progress
  FOR UPDATE USING (true);
CREATE POLICY "Admins manage consumer badge progress" ON public.consumer_badge_progress
  FOR ALL USING (public.is_admin());

-- RPC to compute consumer badge progress
CREATE OR REPLACE FUNCTION public.compute_consumer_badge_progress(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requests_count integer;
  v_reviews_count integer;
  v_favorites_count integer;
  v_categories_count integer;
  v_shares_count integer;
  v_profile_complete integer;
  v_badge RECORD;
  v_current integer;
BEGIN
  SELECT COUNT(*) INTO v_requests_count
  FROM service_requests WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_reviews_count
  FROM business_reviews WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_favorites_count
  FROM user_favorites WHERE user_id = p_user_id;

  SELECT COUNT(DISTINCT category_id) INTO v_categories_count
  FROM service_requests WHERE user_id = p_user_id AND category_id IS NOT NULL;

  SELECT COUNT(*) INTO v_shares_count
  FROM analytics_events WHERE user_id = p_user_id AND event_type = 'share';

  SELECT CASE
    WHEN p.full_name IS NOT NULL AND p.full_name != ''
         AND p.phone IS NOT NULL AND p.phone != ''
         AND p.city IS NOT NULL AND p.city != ''
    THEN 1 ELSE 0
  END INTO v_profile_complete
  FROM profiles p WHERE p.id = p_user_id;

  FOR v_badge IN SELECT * FROM consumer_badges WHERE is_active = true
  LOOP
    v_current := CASE v_badge.criteria_type
      WHEN 'requests_count' THEN v_requests_count
      WHEN 'reviews_count' THEN v_reviews_count
      WHEN 'favorites_count' THEN v_favorites_count
      WHEN 'categories_count' THEN v_categories_count
      WHEN 'shares_count' THEN v_shares_count
      WHEN 'profile_complete' THEN v_profile_complete
      ELSE 0
    END;

    INSERT INTO consumer_badge_progress (user_id, badge_id, current_value, target_value)
    VALUES (p_user_id, v_badge.id, v_current, v_badge.criteria_value)
    ON CONFLICT (user_id, badge_id) DO UPDATE SET
      current_value = EXCLUDED.current_value,
      updated_at = now();

    IF v_current >= v_badge.criteria_value THEN
      INSERT INTO consumer_earned_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;