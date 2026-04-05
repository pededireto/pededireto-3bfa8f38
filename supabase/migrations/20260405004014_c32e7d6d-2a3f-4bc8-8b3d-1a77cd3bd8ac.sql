
-- Add new fields to service_requests for enhanced form
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS preferred_date DATE,
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS availability TEXT,
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS full_address TEXT;

-- Add reminder tracking to request_business_matches
ALTER TABLE public.request_business_matches
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_count INT DEFAULT 0;
