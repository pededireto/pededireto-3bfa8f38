CREATE OR REPLACE FUNCTION award_consumer_badges_daily()
RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_processed integer := 0;
BEGIN
  FOR v_user IN
    SELECT DISTINCT p.id
    FROM profiles p
    WHERE p.id IN (
      SELECT DISTINCT user_id FROM service_requests WHERE user_id IS NOT NULL
      UNION
      SELECT DISTINCT user_id FROM business_reviews WHERE user_id IS NOT NULL
      UNION
      SELECT DISTINCT user_id FROM user_favorites WHERE user_id IS NOT NULL
    )
  LOOP
    BEGIN
      PERFORM compute_consumer_badge_progress(v_user.id);
      v_processed := v_processed + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Consumer badge error for user %: %', v_user.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Consumer badges: processed % users', v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;