
-- Trigger: when a business accepts a match → notify consumer
CREATE OR REPLACE FUNCTION notify_consumer_on_match_accepted()
RETURNS trigger AS $$
DECLARE
  v_request RECORD;
  v_business_name text;
BEGIN
  -- Only fire when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get request info
    SELECT id, user_id, description INTO v_request
    FROM service_requests WHERE id = NEW.request_id;

    -- Get business name
    SELECT name INTO v_business_name
    FROM businesses WHERE id = NEW.business_id;

    IF v_request.user_id IS NOT NULL THEN
      INSERT INTO user_notifications (user_id, title, message, type, action_url, is_read)
      VALUES (
        v_request.user_id,
        v_business_name || ' aceitou o seu pedido!',
        'O profissional aceitou o seu pedido e está pronto para ajudar.',
        'request_accepted',
        '/pedido/' || NEW.request_id,
        false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_consumer_match_accepted ON request_business_matches;
CREATE TRIGGER trg_notify_consumer_match_accepted
  AFTER UPDATE ON request_business_matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_consumer_on_match_accepted();

-- Trigger: when a business sends a message → notify consumer
CREATE OR REPLACE FUNCTION notify_consumer_on_new_message()
RETURNS trigger AS $$
DECLARE
  v_request RECORD;
  v_sender_name text;
  v_short_message text;
BEGIN
  -- Only for messages FROM businesses (sender_type = 'business')
  IF NEW.sender_type = 'business' THEN
    SELECT id, user_id INTO v_request
    FROM service_requests WHERE id = NEW.request_id;

    -- Get business name from the match
    SELECT b.name INTO v_sender_name
    FROM request_business_matches rbm
    JOIN businesses b ON b.id = rbm.business_id
    WHERE rbm.request_id = NEW.request_id
      AND rbm.business_id = NEW.sender_id
    LIMIT 1;

    v_short_message := LEFT(NEW.content, 80);
    IF LENGTH(NEW.content) > 80 THEN
      v_short_message := v_short_message || '…';
    END IF;

    IF v_request.user_id IS NOT NULL THEN
      INSERT INTO user_notifications (user_id, title, message, type, action_url, is_read)
      VALUES (
        v_request.user_id,
        'Nova mensagem de ' || COALESCE(v_sender_name, 'um profissional'),
        v_short_message,
        'new_message_consumer',
        '/pedido/' || NEW.request_id,
        false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_consumer_new_message ON request_messages;
CREATE TRIGGER trg_notify_consumer_new_message
  AFTER INSERT ON request_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_consumer_on_new_message();

-- Trigger: when consumer earns a badge → notify
CREATE OR REPLACE FUNCTION notify_consumer_on_badge_earned()
RETURNS trigger AS $$
DECLARE
  v_badge_name text;
  v_badge_icon text;
  v_profile RECORD;
BEGIN
  SELECT name, icon INTO v_badge_name, v_badge_icon
  FROM consumer_badges WHERE id = NEW.badge_id;

  -- consumer_earned_badges.user_id references profiles.id
  -- user_notifications.user_id also references the auth user id
  -- We need to get the auth user_id from profiles
  SELECT user_id INTO v_profile FROM profiles WHERE id = NEW.user_id;

  IF v_profile.user_id IS NOT NULL THEN
    INSERT INTO user_notifications (user_id, title, message, type, action_url, is_read)
    VALUES (
      v_profile.user_id,
      COALESCE(v_badge_icon, '🏆') || ' Badge conquistado: ' || COALESCE(v_badge_name, 'Novo badge'),
      'Parabéns! Conquistou o badge "' || COALESCE(v_badge_name, '') || '".',
      'badge_earned',
      '/dashboard',
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_consumer_badge_earned ON consumer_earned_badges;
CREATE TRIGGER trg_notify_consumer_badge_earned
  AFTER INSERT ON consumer_earned_badges
  FOR EACH ROW
  EXECUTE FUNCTION notify_consumer_on_badge_earned();

-- Also add INSERT policy for user_notifications (triggers use SECURITY DEFINER but we need it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'System can insert user_notifications'
  ) THEN
    CREATE POLICY "System can insert user_notifications"
      ON user_notifications FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
