
-- Function: handle_business_activation
-- Fires BEFORE UPDATE so we can modify NEW directly for conversion fields
CREATE OR REPLACE FUNCTION public.handle_business_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_commercial_id uuid;
  v_model_id uuid;
  v_rule RECORD;
  v_amount numeric;
BEGIN
  -- Only act when status changes TO 'active' and no prior conversion
  IF NEW.subscription_status = 'active'
     AND OLD.subscription_status IS DISTINCT FROM NEW.subscription_status
     AND NEW.conversion_date IS NULL
  THEN
    -- Find active sales commercial for this business
    SELECT commercial_id INTO v_commercial_id
    FROM business_commercial_assignments
    WHERE business_id = NEW.id
      AND role = 'sales'
      AND is_active = true
    LIMIT 1;

    -- Set conversion fields
    NEW.converted_by := v_commercial_id;
    NEW.conversion_date := now();
    NEW.conversion_plan_id := NEW.plan_id;
    NEW.conversion_price := NEW.subscription_price;

    -- Generate commission if we have a commercial and an active model
    IF v_commercial_id IS NOT NULL THEN
      SELECT id INTO v_model_id
      FROM commission_models
      WHERE is_active = true
      LIMIT 1;

      IF v_model_id IS NOT NULL THEN
        -- Find matching rule (plan-specific first, then generic)
        SELECT * INTO v_rule
        FROM commission_rules
        WHERE commission_model_id = v_model_id
          AND (plan_id = NEW.plan_id OR plan_id IS NULL)
        ORDER BY plan_id NULLS LAST
        LIMIT 1;

        IF v_rule IS NOT NULL THEN
          -- Calculate amount
          IF v_rule.commission_type = 'percentage' THEN
            v_amount := COALESCE(NEW.subscription_price, 0) * v_rule.value / 100;
          ELSE
            v_amount := v_rule.value;
          END IF;

          -- Prevent duplicate commission
          IF NOT EXISTS (
            SELECT 1 FROM commercial_commissions
            WHERE business_id = NEW.id
              AND commercial_id = v_commercial_id
              AND reference_month = date_trunc('month', now())::date
          ) THEN
            INSERT INTO commercial_commissions (
              commercial_id, business_id, commission_model_id,
              reference_month, amount, status
            ) VALUES (
              v_commercial_id, NEW.id, v_model_id,
              date_trunc('month', now())::date, v_amount, 'generated'
            );
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: BEFORE UPDATE (so we can modify NEW)
CREATE TRIGGER trg_business_activation
BEFORE UPDATE ON businesses
FOR EACH ROW
WHEN (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
EXECUTE FUNCTION handle_business_activation();
