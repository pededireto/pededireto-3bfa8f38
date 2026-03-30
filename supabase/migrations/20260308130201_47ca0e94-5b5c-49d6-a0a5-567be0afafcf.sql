CREATE OR REPLACE FUNCTION public.trg_notify_business_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner_user_id uuid;
BEGIN
  IF OLD.is_active = false AND NEW.is_active = true THEN
    -- Auto-resolve any pending business alert
    UPDATE public.admin_alerts 
      SET resolved_at = now()
      WHERE entity_type = 'business' AND entity_id = NEW.id AND resolved_at IS NULL;
    
    -- Insert business notification for the owner
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
    
    -- Info alert for admin
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

    -- Call edge function to send verification email via pg_net
    PERFORM net.http_post(
      url := 'https://mpnizkjntkutpxevqzxx.supabase.co/functions/v1/notify-business-verified',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbml6a2pudGt1dHB4ZXZxenh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTk1MjEsImV4cCI6MjA4NTczNTUyMX0.3xJ7emNX30uOGSAxwZjC1wQpWjbvfBWwisCOMDDl-J8"}'::jsonb,
      body := jsonb_build_object('business_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;