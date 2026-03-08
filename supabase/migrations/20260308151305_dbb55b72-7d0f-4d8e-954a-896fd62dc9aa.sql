
-- Consumer activity timeline table
CREATE TABLE public.consumer_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'request_created', 'match_accepted', 'message_received', 'badge_earned', 'review_submitted', 'favorite_added', 'request_closed'
  title text NOT NULL,
  description text,
  icon text DEFAULT 'activity',
  metadata jsonb DEFAULT '{}',
  entity_id uuid,
  entity_type text, -- 'service_request', 'business', 'badge', 'review'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user queries
CREATE INDEX idx_consumer_activity_user ON public.consumer_activity_log(user_id, created_at DESC);

-- RLS
ALTER TABLE public.consumer_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity"
  ON public.consumer_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity"
  ON public.consumer_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger: log when consumer creates a service request
CREATE OR REPLACE FUNCTION public.trg_log_consumer_request_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.consumer_activity_log (user_id, event_type, title, description, icon, entity_id, entity_type)
  VALUES (
    NEW.user_id,
    'request_created',
    'Novo pedido criado',
    COALESCE(LEFT(NEW.description, 80), 'Pedido de serviço'),
    'clipboard-list',
    NEW.id,
    'service_request'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_consumer_activity_request_created
  AFTER INSERT ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_consumer_request_created();

-- Trigger: log when business accepts match
CREATE OR REPLACE FUNCTION public.trg_log_consumer_match_accepted_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_biz_name text;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    SELECT sr.user_id INTO v_user_id FROM public.service_requests sr WHERE sr.id = NEW.request_id;
    SELECT b.name INTO v_biz_name FROM public.businesses b WHERE b.id = NEW.business_id;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.consumer_activity_log (user_id, event_type, title, description, icon, entity_id, entity_type)
      VALUES (
        v_user_id,
        'match_accepted',
        'Negócio aceitou o seu pedido',
        COALESCE(v_biz_name, 'Um profissional') || ' respondeu ao seu pedido.',
        'check-circle',
        NEW.request_id,
        'service_request'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_consumer_activity_match_accepted
  AFTER UPDATE ON public.request_business_matches
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_consumer_match_accepted_activity();

-- Trigger: log when consumer submits a review
CREATE OR REPLACE FUNCTION public.trg_log_consumer_review_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_biz_name text;
BEGIN
  SELECT b.name INTO v_biz_name FROM public.businesses b WHERE b.id = NEW.business_id;
  INSERT INTO public.consumer_activity_log (user_id, event_type, title, description, icon, entity_id, entity_type)
  VALUES (
    NEW.user_id,
    'review_submitted',
    'Avaliação enviada',
    'Avaliou ' || COALESCE(v_biz_name, 'um negócio') || ' com ' || NEW.rating || '★',
    'star',
    NEW.business_id,
    'business'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_consumer_activity_review_submitted
  AFTER INSERT ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_consumer_review_submitted();

-- Trigger: log when consumer adds a favorite
CREATE OR REPLACE FUNCTION public.trg_log_consumer_favorite_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_biz_name text;
BEGIN
  SELECT b.name INTO v_biz_name FROM public.businesses b WHERE b.id = NEW.business_id;
  INSERT INTO public.consumer_activity_log (user_id, event_type, title, description, icon, entity_id, entity_type)
  VALUES (
    NEW.user_id,
    'favorite_added',
    'Favorito adicionado',
    'Adicionou ' || COALESCE(v_biz_name, 'um negócio') || ' aos favoritos.',
    'heart',
    NEW.business_id,
    'business'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_consumer_activity_favorite_added
  AFTER INSERT ON public.user_favorites
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_consumer_favorite_added();
