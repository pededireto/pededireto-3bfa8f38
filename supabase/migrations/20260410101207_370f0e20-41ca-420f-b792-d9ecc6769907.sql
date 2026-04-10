-- Trigger function: when a request_rating is inserted, update business_review_stats
CREATE OR REPLACE FUNCTION public.sync_request_rating_to_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_biz_rev_count int;
  v_biz_rev_avg numeric;
  v_req_rev_count int;
  v_req_rev_avg numeric;
  v_total int;
  v_avg numeric;
BEGIN
  -- Get business_reviews stats
  SELECT COUNT(*), COALESCE(AVG(rating), 0)
  INTO v_biz_rev_count, v_biz_rev_avg
  FROM business_reviews
  WHERE business_id = NEW.business_id;

  -- Get request_ratings stats
  SELECT COUNT(*), COALESCE(AVG(rating), 0)
  INTO v_req_rev_count, v_req_rev_avg
  FROM request_ratings
  WHERE business_id = NEW.business_id;

  v_total := v_biz_rev_count + v_req_rev_count;

  IF v_total > 0 THEN
    v_avg := ((v_biz_rev_avg * v_biz_rev_count) + (v_req_rev_avg * v_req_rev_count)) / v_total;
  ELSE
    v_avg := 0;
  END IF;

  INSERT INTO business_review_stats (business_id, total_reviews, average_rating, updated_at)
  VALUES (NEW.business_id, v_total, ROUND(v_avg, 2), now())
  ON CONFLICT (business_id)
  DO UPDATE SET
    total_reviews = v_total,
    average_rating = ROUND(v_avg, 2),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_sync_request_rating ON request_ratings;
CREATE TRIGGER trg_sync_request_rating
  AFTER INSERT ON request_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_request_rating_to_stats();