ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_claimed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT null,
  ADD COLUMN IF NOT EXISTS trial_activated_at timestamptz DEFAULT null,
  ADD COLUMN IF NOT EXISTS trial_activated_by uuid REFERENCES auth.users(id);