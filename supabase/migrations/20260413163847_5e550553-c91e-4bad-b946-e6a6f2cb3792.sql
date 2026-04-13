
-- Fix 1: Make the review stats trigger SECURITY DEFINER so it can write to business_review_stats
ALTER FUNCTION public.update_business_review_stats() SECURITY DEFINER;

-- Fix 2: Replace the INSERT policy to allow business owners to review OTHER businesses
-- The old policy blocks anyone who owns ANY business from inserting reviews
DROP POLICY IF EXISTS "users_can_insert_reviews" ON public.business_reviews;

CREATE POLICY "users_can_insert_reviews"
ON public.business_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND NOT (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_reviews.business_id
        AND businesses.owner_id = auth.uid()
    )
  )
);
