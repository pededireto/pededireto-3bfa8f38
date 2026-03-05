-- 1. Create helper function to resolve auth.uid() to profiles.id
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 2. Update is_business_member() to use get_my_profile_id()
CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_users
    WHERE business_id = p_business_id
    AND user_id = public.get_my_profile_id()
  )
$$;

-- 3. Fix analytics_events policies
DROP POLICY IF EXISTS "business_owner_read_own_analytics" ON analytics_events;
CREATE POLICY "business_owner_read_own_analytics" ON analytics_events
FOR SELECT USING (
  business_id IN (
    SELECT bu.business_id FROM business_users bu
    WHERE bu.user_id = public.get_my_profile_id()
  )
);

DROP POLICY IF EXISTS "select_own_analytics" ON analytics_events;
CREATE POLICY "select_own_analytics" ON analytics_events
FOR SELECT USING (
  (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'cs', 'super_admin')))
  OR (business_id IN (SELECT bu.business_id FROM business_users bu WHERE bu.user_id = public.get_my_profile_id()))
);

-- 4. Fix business_analytics_events policy
DROP POLICY IF EXISTS "Business owners can read own analytics" ON business_analytics_events;
CREATE POLICY "Business owners can read own analytics" ON business_analytics_events
FOR SELECT USING (
  EXISTS (SELECT 1 FROM business_users bu WHERE bu.business_id = business_analytics_events.business_id AND bu.user_id = public.get_my_profile_id())
);

-- 5. Fix business_badge_progress policy
DROP POLICY IF EXISTS "Members can view badge progress" ON business_badge_progress;
CREATE POLICY "Members can view badge progress" ON business_badge_progress
FOR SELECT USING (
  EXISTS (SELECT 1 FROM business_users bu WHERE bu.business_id = business_badge_progress.business_id AND bu.user_id = public.get_my_profile_id())
);

-- 6. Fix business_partner_memberships policy
DROP POLICY IF EXISTS "Business owners can view own memberships" ON business_partner_memberships;
CREATE POLICY "Business owners can view own memberships" ON business_partner_memberships
FOR SELECT USING (
  EXISTS (SELECT 1 FROM business_users bu WHERE bu.business_id = business_partner_memberships.business_id AND bu.user_id = public.get_my_profile_id())
);

-- 7. Fix business_reviews policy (reviews_update_business)
DROP POLICY IF EXISTS "reviews_update_business" ON business_reviews;
CREATE POLICY "reviews_update_business" ON business_reviews
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM businesses b
    LEFT JOIN business_users bu ON bu.business_id = b.id
    WHERE b.id = business_reviews.business_id
    AND (b.owner_id = auth.uid() OR bu.user_id = public.get_my_profile_id())
  )
);

-- 8. Fix business_scores policy
DROP POLICY IF EXISTS "Business owners can view own score" ON business_scores;
CREATE POLICY "Business owners can view own score" ON business_scores
FOR SELECT USING (
  EXISTS (SELECT 1 FROM business_users bu WHERE bu.business_id = business_scores.business_id AND bu.user_id = public.get_my_profile_id())
);

-- 9. Fix business_subcategories policy
DROP POLICY IF EXISTS "Owner can manage own business subcategories" ON business_subcategories;
CREATE POLICY "Owner can manage own business subcategories" ON business_subcategories
FOR ALL USING (
  business_id IN (
    SELECT bu.business_id FROM business_users bu
    WHERE bu.user_id = public.get_my_profile_id() AND bu.role = 'owner'
  )
);

-- 10. Fix businesses owner update policy
DROP POLICY IF EXISTS "Owner can update own business" ON businesses;
CREATE POLICY "Owner can update own business" ON businesses
FOR UPDATE USING (
  id IN (
    SELECT bu.business_id FROM business_users bu
    WHERE bu.user_id = public.get_my_profile_id() AND bu.role = 'owner'
  )
);

-- 11. Fix request_business_matches policies
DROP POLICY IF EXISTS "business_users_update_matches" ON request_business_matches;
CREATE POLICY "business_users_update_matches" ON request_business_matches
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM business_users bu WHERE bu.business_id = request_business_matches.business_id AND bu.user_id = public.get_my_profile_id() AND bu.role = 'owner')
);

DROP POLICY IF EXISTS "business_users_view_matches" ON request_business_matches;
CREATE POLICY "business_users_view_matches" ON request_business_matches
FOR SELECT USING (
  EXISTS (SELECT 1 FROM business_users bu WHERE bu.business_id = request_business_matches.business_id AND bu.user_id = public.get_my_profile_id() AND bu.role IN ('owner', 'pending_owner'))
);

-- 12. Fix request_messages policies
DROP POLICY IF EXISTS "participants_update" ON request_messages;
CREATE POLICY "participants_update" ON request_messages
FOR UPDATE USING (
  (EXISTS (SELECT 1 FROM service_requests sr WHERE sr.id = request_messages.request_id AND sr.user_id = auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM request_business_matches rbm
    JOIN businesses b ON b.id = rbm.business_id
    LEFT JOIN business_users bu ON bu.business_id = b.id
    WHERE rbm.request_id = request_messages.request_id
    AND (b.owner_id = auth.uid() OR bu.user_id = public.get_my_profile_id())
  ))
);

-- 13. Fix user_favorites policy
DROP POLICY IF EXISTS "Business owners can count their favorites" ON user_favorites;
CREATE POLICY "Business owners can count their favorites" ON user_favorites
FOR SELECT USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
    UNION
    SELECT bu.business_id FROM business_users bu WHERE bu.user_id = public.get_my_profile_id()
  )
);