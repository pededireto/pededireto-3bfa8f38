
-- FASE 1: Add condition fields to steps
ALTER TABLE email_cadence_steps
  ADD COLUMN IF NOT EXISTS condition_type TEXT DEFAULT 'always',
  ADD COLUMN IF NOT EXISTS condition_ref_step INTEGER;

-- FASE 1+2: Add conversion/pause fields to enrollments
ALTER TABLE email_cadence_enrollments
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_reason TEXT;

-- FASE 2: Auto-conversion trigger on businesses subscription_status change
CREATE OR REPLACE FUNCTION pause_cadence_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_status = 'active' AND (OLD.subscription_status IS DISTINCT FROM 'active') THEN
    UPDATE email_cadence_enrollments
    SET status = 'converted',
        converted_at = NOW(),
        paused_reason = 'Subscreveu plano'
    WHERE business_id = NEW.id
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pause_on_subscription ON businesses;
CREATE TRIGGER trg_pause_on_subscription
AFTER UPDATE OF subscription_status ON businesses
FOR EACH ROW
EXECUTE FUNCTION pause_cadence_on_subscription();

-- FASE 3: Performance view
CREATE OR REPLACE VIEW cadence_step_performance WITH (security_invoker = true) AS
SELECT
  cs.cadence_id,
  cs.step_order,
  cs.id as step_id,
  et.name as template_name,
  COUNT(el.id) as sent,
  COUNT(el.opened_at) as opened,
  COUNT(el.clicked_at) as clicked,
  ROUND(COUNT(el.opened_at)::numeric / NULLIF(COUNT(el.id), 0) * 100, 1) as open_rate,
  ROUND(COUNT(el.clicked_at)::numeric / NULLIF(COUNT(el.id), 0) * 100, 1) as click_rate
FROM email_cadence_steps cs
LEFT JOIN email_templates et ON et.id = cs.template_id
LEFT JOIN email_logs el ON el.template_id = cs.template_id
  AND el.metadata->>'cadence_id' = cs.cadence_id::text
  AND (el.metadata->>'step_order')::int = cs.step_order
GROUP BY cs.cadence_id, cs.step_order, cs.id, et.name
ORDER BY cs.cadence_id, cs.step_order;

-- Quick win: Add status to suggestions
ALTER TABLE suggestions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'nova';
