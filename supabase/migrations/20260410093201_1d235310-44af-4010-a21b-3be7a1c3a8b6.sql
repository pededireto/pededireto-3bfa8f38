
-- Fix: expand allowed notification types to include 'badge_earned' and 'lead'
-- which are used by trg_notify_badge_earned and trg_notify_business_new_match
CREATE OR REPLACE FUNCTION public.validate_business_notification_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type NOT IN ('request', 'system', 'plan', 'highlight', 'verification', 'verified', 'badge_earned', 'lead') THEN
    RAISE EXCEPTION 'Invalid notification type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;
