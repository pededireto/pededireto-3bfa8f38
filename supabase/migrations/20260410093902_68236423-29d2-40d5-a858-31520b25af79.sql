
CREATE OR REPLACE FUNCTION notify_consumer_on_new_message()
RETURNS trigger AS $$
DECLARE
  v_request RECORD;
  v_sender_name text;
  v_short_message text;
BEGIN
  -- Only for messages FROM businesses (sender_role = 'business')
  IF NEW.sender_role = 'business' THEN
    SELECT id, user_id INTO v_request
    FROM service_requests WHERE id = NEW.request_id;

    -- Get business name from the match
    SELECT b.name INTO v_sender_name
    FROM request_business_matches rbm
    JOIN businesses b ON b.id = rbm.business_id
    WHERE rbm.request_id = NEW.request_id
      AND rbm.business_id = NEW.sender_id
    LIMIT 1;

    v_short_message := LEFT(NEW.message, 80);
    IF LENGTH(NEW.message) > 80 THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
