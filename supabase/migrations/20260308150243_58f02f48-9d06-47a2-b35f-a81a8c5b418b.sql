ALTER TABLE public.consumer_notification_preferences
  ADD COLUMN IF NOT EXISTS email_marketing boolean DEFAULT false;