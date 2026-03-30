-- ═══════════════════════════════════════════════════════
-- 1. Expand admin_alerts with platform alert fields
-- ═══════════════════════════════════════════════════════
ALTER TABLE public.admin_alerts
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid;

-- Index for fast unresolved lookups
CREATE INDEX IF NOT EXISTS idx_admin_alerts_unresolved 
  ON public.admin_alerts (severity, created_at DESC) 
  WHERE resolved_at IS NULL;

-- Index to prevent duplicate alerts per entity
CREATE INDEX IF NOT EXISTS idx_admin_alerts_entity 
  ON public.admin_alerts (entity_type, entity_id) 
  WHERE resolved_at IS NULL;

-- ═══════════════════════════════════════════════════════
-- 2. RLS: Allow CS role to SELECT admin_alerts
-- ═══════════════════════════════════════════════════════
CREATE POLICY "CS can view alerts"
  ON public.admin_alerts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'cs'
    )
  );

-- Allow CS to UPDATE (resolve) alerts  
CREATE POLICY "CS can resolve alerts"
  ON public.admin_alerts FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'cs'
    )
  );

-- Enable Realtime for admin_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_alerts;

-- ═══════════════════════════════════════════════════════
-- 3. Trigger: New business registered
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.trg_alert_new_business()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
  VALUES (
    'new_business',
    'Novo negócio registado — ' || COALESCE(NEW.name, 'Sem nome') || COALESCE(', ' || NEW.city, ''),
    'Um novo negócio foi registado e aguarda verificação.',
    'info',
    'business',
    'business',
    NEW.id,
    '/admin?tab=businesses'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alert_new_business ON public.businesses;
CREATE TRIGGER trg_alert_new_business
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.trg_alert_new_business();

-- ═══════════════════════════════════════════════════════
-- 4. Trigger: Negative review (rating <= 2)
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.trg_alert_negative_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_business_name text;
BEGIN
  SELECT name INTO v_business_name FROM public.businesses WHERE id = NEW.business_id;
  
  IF NEW.rating <= 2 THEN
    INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
    VALUES (
      'negative_review',
      'Review negativa (' || NEW.rating || '★) — ' || COALESCE(v_business_name, 'Negócio'),
      COALESCE(LEFT(NEW.comment, 200), 'Sem comentário'),
      CASE WHEN NEW.is_flagged = true THEN 'critical' ELSE 'important' END,
      'review',
      'review',
      NEW.id,
      '/admin?tab=reviews'
    );
  END IF;
  
  IF NEW.is_flagged = true AND NEW.rating > 2 THEN
    INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
    VALUES (
      'flagged_review',
      'Review reportada — ' || COALESCE(v_business_name, 'Negócio'),
      COALESCE(NEW.flag_reason, 'Review reportada por utilizador'),
      'critical',
      'review',
      'review',
      NEW.id,
      '/admin?tab=reviews'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alert_negative_review ON public.business_reviews;
CREATE TRIGGER trg_alert_negative_review
  AFTER INSERT ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_alert_negative_review();

-- ═══════════════════════════════════════════════════════
-- 5. Trigger: All matches rejected for a request
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.trg_alert_all_rejected()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total int;
  v_rejected int;
  v_request record;
BEGIN
  IF NEW.status = 'rejected' THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'rejected')
      INTO v_total, v_rejected
      FROM public.request_business_matches
      WHERE request_id = NEW.request_id;
    
    IF v_total > 0 AND v_total = v_rejected THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.admin_alerts 
        WHERE entity_type = 'service_request' AND entity_id = NEW.request_id 
          AND type = 'all_rejected' AND resolved_at IS NULL
      ) THEN
        SELECT sr.location_city, COALESCE(s.name, 'N/A') as sub_name
          INTO v_request
          FROM public.service_requests sr
          LEFT JOIN public.subcategories s ON s.id = sr.subcategory_id
          WHERE sr.id = NEW.request_id;
        
        INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
        VALUES (
          'all_rejected',
          'Todos recusaram — ' || COALESCE(v_request.sub_name, '') || COALESCE(' em ' || v_request.location_city, ''),
          'Todos os negócios recusaram este pedido. Intervenção manual necessária.',
          'critical',
          'request',
          'service_request',
          NEW.request_id,
          '/admin?tab=service-requests'
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alert_all_rejected ON public.request_business_matches;
CREATE TRIGGER trg_alert_all_rejected
  AFTER UPDATE ON public.request_business_matches
  FOR EACH ROW EXECUTE FUNCTION public.trg_alert_all_rejected();

-- ═══════════════════════════════════════════════════════
-- 6. Trigger: Business verified (is_active false → true)
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.trg_notify_business_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner_user_id uuid;
BEGIN
  IF OLD.is_active = false AND NEW.is_active = true THEN
    UPDATE public.admin_alerts 
      SET resolved_at = now()
      WHERE entity_type = 'business' AND entity_id = NEW.id AND resolved_at IS NULL;
    
    SELECT bu.user_id INTO v_owner_user_id
      FROM public.business_users bu
      WHERE bu.business_id = NEW.id AND bu.role = 'owner'
      LIMIT 1;
    
    IF v_owner_user_id IS NOT NULL THEN
      INSERT INTO public.business_notifications (business_id, user_id, type, title, message, action_url)
      VALUES (
        NEW.id,
        v_owner_user_id,
        'verification',
        '🎉 O seu negócio foi verificado!',
        'O seu negócio ' || COALESCE(NEW.name, '') || ' está agora visível na Pede Direto! Complete o seu perfil para aparecer mais acima nos resultados.',
        '/negocio/dashboard'
      );
    END IF;
    
    INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
    VALUES (
      'business_verified',
      'Negócio verificado — ' || COALESCE(NEW.name, 'Sem nome'),
      'O negócio foi verificado e está agora activo.',
      'info',
      'business',
      'business',
      NEW.id,
      '/negocio/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_business_verified ON public.businesses;
CREATE TRIGGER trg_notify_business_verified
  AFTER UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_business_verified();

-- ═══════════════════════════════════════════════════════
-- 7. Functions for cron jobs
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_unmatched_requests()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
  SELECT 
    'no_match',
    'Pedido sem match — ' || COALESCE(s.name, 'N/A') || COALESCE(' em ' || sr.location_city, ''),
    'Nenhum negócio foi encontrado para este pedido. Intervenção manual necessária.',
    'critical',
    'request',
    'service_request',
    sr.id,
    '/admin?tab=service-requests'
  FROM public.service_requests sr
  LEFT JOIN public.subcategories s ON s.id = sr.subcategory_id
  WHERE sr.created_at < now() - interval '15 minutes'
    AND sr.status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM public.request_business_matches rbm WHERE rbm.request_id = sr.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.admin_alerts aa 
      WHERE aa.entity_type = 'service_request' AND aa.entity_id = sr.id 
        AND aa.type = 'no_match' AND aa.resolved_at IS NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_unanswered_24h()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
  SELECT 
    'unanswered_24h',
    'Pedido sem resposta 24h — ' || COALESCE(s.name, 'N/A') || COALESCE(' em ' || sr.location_city, ''),
    'Este pedido não recebeu nenhuma resposta aceite nas últimas 24 horas.',
    'important',
    'request',
    'service_request',
    sr.id,
    '/admin?tab=service-requests'
  FROM public.service_requests sr
  LEFT JOIN public.subcategories s ON s.id = sr.subcategory_id
  WHERE sr.created_at < now() - interval '24 hours'
    AND sr.status IN ('pending', 'sent')
    AND NOT EXISTS (
      SELECT 1 FROM public.request_business_matches rbm 
      WHERE rbm.request_id = sr.id AND rbm.status = 'accepted'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.admin_alerts aa 
      WHERE aa.entity_type = 'service_request' AND aa.entity_id = sr.id 
        AND aa.type = 'unanswered_24h' AND aa.resolved_at IS NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_pending_businesses_48h()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
  SELECT 
    'pending_business_48h',
    'Negócio pendente 48h — ' || COALESCE(b.name, 'Sem nome') || COALESCE(', ' || b.city, ''),
    'Este negócio aguarda verificação há mais de 48 horas.',
    'important',
    'business',
    'business',
    b.id,
    '/admin?tab=businesses'
  FROM public.businesses b
  WHERE b.is_active = false
    AND b.created_at < now() - interval '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.admin_alerts aa 
      WHERE aa.entity_type = 'business' AND aa.entity_id = b.id 
        AND aa.type = 'pending_business_48h' AND aa.resolved_at IS NULL
    );
END;
$$;