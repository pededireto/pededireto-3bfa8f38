
-- Add scoring columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS requests_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_request_at timestamptz;

-- Trigger to update consumer score when a service request is created
CREATE OR REPLACE FUNCTION public.update_consumer_score_on_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE user_profiles
  SET 
    requests_count = requests_count + 1,
    score = score + 10,
    last_request_at = NOW(),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- If no user_profiles row exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_profiles (user_id, requests_count, score, last_request_at)
    VALUES (NEW.user_id, 1, 10, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      requests_count = user_profiles.requests_count + 1,
      score = user_profiles.score + 10,
      last_request_at = NOW(),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_consumer_score ON service_requests;
CREATE TRIGGER trg_update_consumer_score
  AFTER INSERT ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_consumer_score_on_request();
