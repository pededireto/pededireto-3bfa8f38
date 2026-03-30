
-- 1. Add is_national_fallback column to request_business_matches
ALTER TABLE public.request_business_matches ADD COLUMN IF NOT EXISTS is_national_fallback boolean DEFAULT false;

-- 2. Create user_notifications table for consumer notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  action_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.user_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.user_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime for user_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- 3. Rewrite match_request_to_businesses with P3+P4+P5+P6
CREATE OR REPLACE FUNCTION public.match_request_to_businesses(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request RECORD;
  v_business RECORD;
  v_count INT := 0;
  v_limit INT;
BEGIN
  SELECT * INTO v_request FROM service_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service request not found: %', p_request_id;
  END IF;

  -- P5: Dynamic limit based on urgency
  IF v_request.urgency = 'urgent' THEN
    v_limit := 7;
  ELSE
    v_limit := 5;
  END IF;

  -- Phase 1: Subcategory + same city (most relevant)
  IF v_request.subcategory_id IS NOT NULL AND v_request.location_city IS NOT NULL THEN
    FOR v_business IN
      SELECT DISTINCT b.id
      FROM businesses b
      JOIN business_subcategories bs ON bs.business_id = b.id
      WHERE b.is_active = true
        AND b.subscription_status = 'active'
        AND bs.subcategory_id = v_request.subcategory_id
        AND lower(COALESCE(b.city, '')) = lower(v_request.location_city)
        AND NOT EXISTS (
          SELECT 1 FROM request_business_matches rbm
          WHERE rbm.request_id = p_request_id AND rbm.business_id = b.id
        )
      ORDER BY
        CASE b.premium_level WHEN 'platinum' THEN 1 WHEN 'gold' THEN 2 WHEN 'silver' THEN 3 ELSE 4 END,
        COALESCE(b.ranking_score, 0) DESC,
        CASE b.subscription_plan WHEN 'premium' THEN 1 WHEN 'professional' THEN 2 ELSE 3 END
      LIMIT v_limit
    LOOP
      INSERT INTO request_business_matches (request_id, business_id, status, is_national_fallback)
      VALUES (p_request_id, v_business.id, 'enviado', false);
      INSERT INTO business_notifications (business_id, title, message, type)
      VALUES (v_business.id, 'Novo pedido de serviço', 'Recebeu um novo pedido na sua subcategoria.', 'request');
      v_count := v_count + 1;
    END LOOP;
  END IF;

  -- Phase 2: Category + same city (fallback if < 3)
  IF v_count < 3 AND v_request.location_city IS NOT NULL THEN
    FOR v_business IN
      SELECT b.id
      FROM businesses b
      WHERE b.is_active = true
        AND b.subscription_status = 'active'
        AND b.category_id = v_request.category_id
        AND lower(COALESCE(b.city, '')) = lower(v_request.location_city)
        AND NOT EXISTS (
          SELECT 1 FROM request_business_matches rbm
          WHERE rbm.request_id = p_request_id AND rbm.business_id = b.id
        )
      ORDER BY
        CASE b.premium_level WHEN 'platinum' THEN 1 WHEN 'gold' THEN 2 WHEN 'silver' THEN 3 ELSE 4 END,
        COALESCE(b.ranking_score, 0) DESC,
        CASE b.subscription_plan WHEN 'premium' THEN 1 WHEN 'professional' THEN 2 ELSE 3 END
      LIMIT (v_limit - v_count)
    LOOP
      INSERT INTO request_business_matches (request_id, business_id, status, is_national_fallback)
      VALUES (p_request_id, v_business.id, 'enviado', false);
      INSERT INTO business_notifications (business_id, title, message, type)
      VALUES (v_business.id, 'Novo pedido de serviço', 'Recebeu um novo pedido na sua categoria.', 'request');
      v_count := v_count + 1;
    END LOOP;
  END IF;

  -- Phase 3: National fallback (ignore city, include verified free businesses)
  IF v_count < 3 THEN
    FOR v_business IN
      SELECT DISTINCT b.id
      FROM businesses b
      LEFT JOIN business_subcategories bs ON bs.business_id = b.id
      WHERE b.is_active = true
        AND (
          b.subscription_status = 'active'
          OR (b.is_claimed = true AND b.claimed = true)
        )
        AND (
          (v_request.subcategory_id IS NOT NULL AND bs.subcategory_id = v_request.subcategory_id)
          OR b.category_id = v_request.category_id
        )
        AND NOT EXISTS (
          SELECT 1 FROM request_business_matches rbm
          WHERE rbm.request_id = p_request_id AND rbm.business_id = b.id
        )
      ORDER BY
        CASE b.premium_level WHEN 'platinum' THEN 1 WHEN 'gold' THEN 2 WHEN 'silver' THEN 3 ELSE 4 END,
        COALESCE(b.ranking_score, 0) DESC,
        CASE b.subscription_plan WHEN 'premium' THEN 1 WHEN 'professional' THEN 2 ELSE 3 END
      LIMIT (v_limit - v_count)
    LOOP
      INSERT INTO request_business_matches (request_id, business_id, status, is_national_fallback)
      VALUES (p_request_id, v_business.id, 'enviado', true);
      INSERT INTO business_notifications (business_id, title, message, type)
      VALUES (v_business.id, 'Novo pedido de serviço', 'Recebeu um novo pedido (nível nacional).', 'request');
      v_count := v_count + 1;
    END LOOP;
  END IF;

  IF v_count > 0 THEN
    UPDATE service_requests SET status = 'encaminhado' WHERE id = p_request_id AND status = 'novo';
  END IF;
END;
$$;

-- 4. Trigger: notify consumer when business accepts match
CREATE OR REPLACE FUNCTION public.notify_consumer_on_match_accept()
RETURNS TRIGGER AS $$
DECLARE
  v_request RECORD;
  v_business_name text;
BEGIN
  IF NEW.status = 'aceite' AND (OLD.status IS DISTINCT FROM 'aceite') THEN
    SELECT sr.user_id, sr.description, sc.name as subcat_name
    INTO v_request
    FROM service_requests sr
    LEFT JOIN subcategories sc ON sc.id = sr.subcategory_id
    WHERE sr.id = NEW.request_id;

    SELECT name INTO v_business_name FROM businesses WHERE id = NEW.business_id;

    IF v_request IS NOT NULL AND v_request.user_id IS NOT NULL THEN
      INSERT INTO user_notifications (user_id, title, message, type, action_url)
      VALUES (
        v_request.user_id,
        'Resposta ao seu pedido!',
        COALESCE(v_business_name, 'Um profissional') || ' aceitou o seu pedido' ||
        CASE WHEN v_request.subcat_name IS NOT NULL THEN ' de ' || v_request.subcat_name ELSE '' END || '.',
        'request_accepted',
        '/pedido/' || NEW.request_id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_consumer_match_accept ON request_business_matches;
CREATE TRIGGER trg_notify_consumer_match_accept
AFTER UPDATE ON request_business_matches
FOR EACH ROW
EXECUTE FUNCTION public.notify_consumer_on_match_accept();

-- 5. Trigger: notify consumer on first business message
CREATE OR REPLACE FUNCTION public.notify_consumer_on_first_message()
RETURNS TRIGGER AS $$
DECLARE
  v_msg_count INT;
  v_request RECORD;
  v_business_name text;
  v_business_id uuid;
BEGIN
  IF NEW.sender_role = 'business' THEN
    SELECT COUNT(*) INTO v_msg_count
    FROM request_messages
    WHERE request_id = NEW.request_id
      AND sender_role = 'business'
      AND id != NEW.id;

    IF v_msg_count = 0 THEN
      SELECT sr.user_id, sr.description INTO v_request
      FROM service_requests sr
      WHERE sr.id = NEW.request_id;

      IF v_request IS NOT NULL AND v_request.user_id IS NOT NULL THEN
        -- Find the business via sender match
        SELECT rbm.business_id INTO v_business_id
        FROM request_business_matches rbm
        JOIN business_users bu ON bu.business_id = rbm.business_id
        JOIN profiles p ON p.id = bu.user_id
        WHERE rbm.request_id = NEW.request_id
          AND p.user_id = NEW.sender_id
        LIMIT 1;

        IF v_business_id IS NOT NULL THEN
          SELECT name INTO v_business_name FROM businesses WHERE id = v_business_id;
        END IF;

        INSERT INTO user_notifications (user_id, title, message, type, action_url)
        VALUES (
          v_request.user_id,
          'Nova mensagem!',
          COALESCE(v_business_name, 'Um profissional') || ' enviou-lhe uma mensagem.',
          'new_message',
          '/pedido/' || NEW.request_id::text
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_consumer_first_message ON request_messages;
CREATE TRIGGER trg_notify_consumer_first_message
AFTER INSERT ON request_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_consumer_on_first_message();
